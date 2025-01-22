import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Building2, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { analyzeCustomerSentiment as analyzeSentiment } from "@/lib/langsmith-service";

interface MessageThreadProps {
  conversationId: string;
}

interface Message {
  id: string;
  content: string;
  sender_type: string;
  created_at: string | null;
}

interface ConversationDetails {
  id: string;
  status: string;
  channel: string;
  customer: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    customer_company: {
      id: string;
      name: string;
    } | null;
  };
}

const statusColors = {
  open: "bg-green-100 text-green-800",
  resolved: "bg-blue-100 text-blue-800",
  closed: "bg-gray-100 text-gray-800",
} as const;

export function MessageThread({ conversationId }: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<ConversationDetails | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isAIProcessing, setIsAIProcessing] = useState(false);

  useEffect(() => {
    const fetchConversation = async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          *,
          customer:customer_id (
            id,
            first_name,
            last_name,
            customer_company:customer_company_id (
              id,
              name
            )
          )
        `)
        .eq("id", conversationId)
        .single();

      if (error) {
        console.error("Error fetching conversation:", error);
        return;
      }

      setConversation(data);
    };

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }

      setMessages(data || []);
      setIsLoading(false);
    };

    fetchConversation();
    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);

          // Process customer messages with AI
          if (newMessage.sender_type === "customer" && conversation?.customer) {
            setIsAIProcessing(true);
            try {
              // Analyze sentiment
              const happinessScore = await analyzeSentiment(newMessage.content, {
                messageId: newMessage.id,
                conversationId,
              });

              // Update conversation happiness score
              await supabase
                .from("conversations")
                .update({ happiness_score: happinessScore })
                .eq("id", conversationId);

              // Generate AI response
              const aiResponse = await generateSupportResponse(
                {
                  messages: messages.concat(newMessage),
                  customer: conversation.customer,
                  customer_company: conversation.customer.customer_company!,
                },
                {
                  conversationId,
                  customerId: conversation.customer.id,
                  companyId: conversation.customer.customer_company!.id,
                }
              );

              if (aiResponse.confidence >= 0.8) {
                // Insert AI response
                await supabase.from("messages").insert({
                  conversation_id: conversationId,
                  content: aiResponse.response,
                  sender_type: "ai",
                });

                // Update conversation status
                await supabase
                  .from("conversations")
                  .update({
                    status: "resolved",
                    resolved_at: new Date().toISOString(),
                  })
                  .eq("id", conversationId);
              } else {
                // Create a ticket for human review
                await supabase.from("tickets").insert({
                  conversation_id: conversationId,
                  status: "open",
                  priority: "medium",
                  title: "AI Confidence Low - Human Review Required",
                  description: `AI confidence (${aiResponse.confidence}) below threshold.\nLast message: ${newMessage.content}`,
                });
              }
            } catch (error) {
              console.error("Error processing AI response:", error);
            } finally {
              setIsAIProcessing(false);
            }
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        content: newMessage,
        sender_type: "agent",
      });

      if (error) throw error;
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading messages...</div>;
  }

  if (!conversation) {
    return <div className="p-4">Conversation not found</div>;
  }

  return (
    <Card className="h-[calc(100vh-4rem)]">
      <CardHeader className="border-b">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              {conversation.customer?.customer_company?.name || "Unknown Company"}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              {conversation.customer?.first_name} {conversation.customer?.last_name}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{conversation.channel}</Badge>
            <Badge className={statusColors[conversation.status as keyof typeof statusColors]}>
              {conversation.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col h-[calc(100%-8rem)]">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.sender_type === "agent" || message.sender_type === "ai"
                    ? "justify-end"
                    : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg p-4",
                    message.sender_type === "agent" || message.sender_type === "ai"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <div className="text-sm mb-1">
                    {message.sender_type === "agent"
                      ? "Support Agent"
                      : message.sender_type === "ai"
                      ? "AI Assistant"
                      : "Customer"}
                  </div>
                  <div className="break-words">{message.content}</div>
                  <div className="text-xs opacity-70 mt-2">
                    {message.created_at
                      ? new Date(message.created_at).toLocaleTimeString()
                      : ""}
                  </div>
                </div>
              </div>
            ))}
            {isAIProcessing && (
              <div className="flex justify-center">
                <Badge variant="secondary" className="gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  AI is analyzing the conversation...
                </Badge>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="border-t pt-4 mt-auto">
          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
              className="resize-none"
              rows={2}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isSending}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 
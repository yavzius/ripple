import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
}

const ChatbotPortal = () => {
  const { workspaceId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [workspace, setWorkspace] = useState<{ name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkspace = async () => {
      if (!workspaceId) {
        setError("No workspace ID provided");
        return;
      }

      try {
        const { data, error: workspaceError } = await supabase
          .from('workspaces')
          .select('name')
          .eq('id', workspaceId)
          .single();

        if (workspaceError) {
          setError("Workspace not found");
          return;
        }

        setWorkspace(data);
        setError(null);
        
        // Add initial greeting message
        setMessages([{
          id: '0',
          content: `Welcome to ${data.name}'s support chat! How can I help you today?`,
          isUser: false,
          timestamp: new Date().toISOString()
        }]);
      } catch (err) {
        setError("Failed to load workspace");
      }
    };

    fetchWorkspace();
  }, [workspaceId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: newMessage,
      isUser: true,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage("");
    setLoading(true);

    try {
      // Store the message in Supabase
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          content: newMessage,
          workspace_id: workspaceId,
          is_user_message: true
        });

      if (messageError) {
        throw messageError;
      }

      // TODO: Integrate with your AI service here
      // For now, we'll simulate a response
      setTimeout(() => {
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: "Thank you for your message. Our AI is processing your request.",
          isUser: false,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, botResponse]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      toast.error("Failed to send message");
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Error</h2>
          <p className="mt-2 text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold">{workspace.name} Support</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="h-[600px] flex flex-col">
          <CardContent className="flex-1 flex flex-col p-4">
            <div className="flex-1 overflow-y-auto space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.isUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-4 flex gap-2">
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
                size="icon"
                disabled={loading || !newMessage.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChatbotPortal; 
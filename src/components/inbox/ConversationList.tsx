import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { mergeConversations } from "@/lib/actions";
import { toast } from "sonner";

interface ConversationListProps {
  accountId: string;
  selectedId?: string;
  onSelect: (id: string) => void;
  onFirstLoad?: (id: string) => void;
}

interface Conversation {
  id: string;
  status: string;
  happiness_score: number | null;
  created_at: string | null;
  customer: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    customer_company: {
      id: string;
      name: string;
    } | null;
  };
  messages: {
    id: string;
    content: string;
    created_at: string | null;
  }[];
}

const statusColors = {
  open: "bg-green-100 text-green-800",
  resolved: "bg-blue-100 text-blue-800",
  closed: "bg-gray-100 text-gray-800",
} as const;

const happinessScoreColors = {
  high: "text-green-600",
  medium: "text-yellow-600",
  low: "text-red-600",
} as const;

export function ConversationList({ accountId, selectedId, onSelect, onFirstLoad }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [sourceConversationId, setSourceConversationId] = useState<string | null>(null);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          customer:customer_id(*,
            customer_company:customer_company_id(*)
          ),
          messages(
            id,
            content,
            created_at
          )
        `)
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setConversations(data || []);
      if (data && data.length > 0 && onFirstLoad && !selectedId) {
        onFirstLoad(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [accountId]);

  const getHappinessColor = (score: number | null) => {
    if (score === null) return happinessScoreColors.medium;
    if (score >= 0.7) return happinessScoreColors.high;
    if (score >= 0.4) return happinessScoreColors.medium;
    return happinessScoreColors.low;
  };

  const getLastMessage = (conversation: Conversation) => {
    if (!conversation.messages?.length) return "No messages";
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    return lastMessage.content;
  };

  const hasMergeableConversations = (conversation: Conversation) => {
    return conversations.some(conv => 
      conv.id !== conversation.id && 
      conv.customer?.customer_company?.id === conversation.customer?.customer_company?.id
    );
  };

  const handleMergeClick = (conversationId: string) => {
    setSourceConversationId(conversationId);
    setIsMergeModalOpen(true);
  };

  const handleMergeConfirm = async (targetId: string) => {
    if (!sourceConversationId) return;
    
    const { error } = await mergeConversations(sourceConversationId, targetId);
    
    if (error) {
      toast.error("Failed to merge conversations");
    } else {
      toast.success("Conversations merged successfully");
      fetchConversations();
    }
    
    setIsMergeModalOpen(false);
    setSourceConversationId(null);
  };

  if (isLoading) {
    return <div className="p-4">Loading conversations...</div>;
  }

  return (
    <>
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="space-y-2 p-4">
          {conversations.map((conversation) => (
            <Card
              key={conversation.id}
              className={cn(
                "p-4 cursor-pointer hover:bg-muted/50 transition-colors",
                selectedId === conversation.id && "bg-muted"
              )}
              onClick={() => onSelect(conversation.id)}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-medium">
                    {conversation.customer?.customer_company?.name || "Unknown Company"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {conversation.customer?.first_name} {conversation.customer?.last_name}
                  </div>
                </div>
                <div className="flex gap-2">
                  {hasMergeableConversations(conversation) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMergeClick(conversation.id);
                      }}
                    >
                      Merge
                    </Button>
                  )}
                  <Badge className={statusColors[conversation.status as keyof typeof statusColors]}>
                    {conversation.status}
                  </Badge>
                </div>
              </div>
              <div className="text-sm text-muted-foreground line-clamp-2">
                {getLastMessage(conversation)}
              </div>
              <div className="mt-2 flex justify-between items-center text-xs">
                {conversation.happiness_score !== null && (
                  <span className={cn("font-medium", getHappinessColor(conversation.happiness_score))}>
                    Score: {Math.round(conversation.happiness_score * 100)}%
                  </span>
                )}
                <span className={cn("text-muted-foreground", conversation.happiness_score === null && "ml-auto")}>
                  {conversation.created_at
                    ? new Date(conversation.created_at).toLocaleDateString()
                    : "Unknown date"}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>

      <Dialog open={isMergeModalOpen} onOpenChange={setIsMergeModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select conversation to merge into</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            {conversations
              .filter((conv) => conv.id !== sourceConversationId && 
                conv.customer?.customer_company?.id === 
                conversations.find(c => c.id === sourceConversationId)?.customer?.customer_company?.id)
              .map((conversation) => (
                <Card
                  key={conversation.id}
                  className="p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleMergeConfirm(conversation.id)}
                >
                  <h3 className="font-medium">
                    {conversation.customer?.customer_company?.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {getLastMessage(conversation)}
                  </p>
                </Card>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 
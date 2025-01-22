import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

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

  useEffect(() => {
    const fetchConversations = async () => {
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
          ),
          messages (
            id,
            content,
            created_at
          )
        `)
        .eq("account_id", accountId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching conversations:", error);
        return;
      }

      setConversations(data || []);
      setIsLoading(false);

      // If there are conversations and no selected ID, notify parent of first conversation
      if (data?.length > 0 && !selectedId && onFirstLoad) {
        onFirstLoad(data[0].id);
      }
    };

    fetchConversations();

    // Subscribe to new conversations
    const channel = supabase
      .channel("conversations")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `account_id=eq.${accountId}`,
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [accountId, selectedId, onFirstLoad]);

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

  if (isLoading) {
    return <div className="p-4">Loading conversations...</div>;
  }

  return (
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
              <Badge className={statusColors[conversation.status as keyof typeof statusColors]}>
                {conversation.status}
              </Badge>
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
  );
} 
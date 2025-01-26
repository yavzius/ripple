import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { mergeConversations } from "@/lib/actions";
import { toast } from "sonner";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface ConversationListProps {
  accountId: string;
  selectedId?: string;
  onSelect: (id: string) => void;
  onFirstLoad?: (id: string) => void;
  isSearchOpen?: boolean;
  onSearchOpenChange?: (open: boolean) => void;
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
  open: "bg-emerald-100 text-emerald-700",
  resolved: "bg-blue-100 text-blue-700",
  closed: "bg-slate-100 text-slate-700",
} as const;

const happinessScoreColors = {
  high: "text-emerald-600",
  medium: "text-amber-600",
  low: "text-rose-600",
} as const;

export function ConversationList({ 
  accountId, 
  selectedId, 
  onSelect, 
  onFirstLoad,
  isSearchOpen,
  onSearchOpenChange 
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [sourceConversationId, setSourceConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    } else {
      setSearchQuery("");
    }
  }, [isSearchOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node) &&
        searchQuery === "" &&
        isSearchOpen &&
        onSearchOpenChange
      ) {
        onSearchOpenChange(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchQuery, isSearchOpen, onSearchOpenChange]);

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

      // Fetch attachment information for the latest message of each conversation
      if (data) {
        const conversationsWithAttachments = await Promise.all(
          data.map(async (conversation) => {
            if (!conversation.messages?.length) return conversation;
            
            const sortedMessages = [...conversation.messages].sort(
              (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
            );
            
            const latestMessageId = sortedMessages[0].id;
            
            const { count } = await supabase
              .from('message_attachments')
              .select('*', { count: 'exact', head: true })
              .eq('message_id', latestMessageId);

            return {
              ...conversation,
              latestMessageHasAttachments: count ? count > 0 : false
            };
          })
        );

        setConversations(conversationsWithAttachments);
      }

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

  // Subscribe to real-time changes
  useEffect(() => {
    let isSubscribed = true;

    const setupSubscriptions = async () => {
      // Initial fetch
      if (isSubscribed) {
        await fetchConversations();
      }

      // Create a single channel for all changes
      const channel = supabase
        .channel('inbox-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversations',
            filter: `account_id=eq.${accountId}`,
          },
          (payload: RealtimePostgresChangesPayload<{
            id: string;
            status: string;
            happiness_score: number | null;
            created_at: string | null;
          }>) => {
            if (!isSubscribed) return;
            
            // Handle conversation changes directly
            if (payload.eventType === 'INSERT') {
              fetchConversations(); // Fetch all data for new conversations
            } else if (payload.eventType === 'UPDATE') {
              setConversations(prev => prev.map(conv => 
                conv.id === payload.new.id 
                  ? { ...conv, ...payload.new }
                  : conv
              ));
            } else if (payload.eventType === 'DELETE') {
              setConversations(prev => prev.filter(conv => conv.id !== payload.old.id));
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=in.(${conversations.map(c => c.id).join(',')})`,
          },
          async (payload: RealtimePostgresChangesPayload<{
            id: string;
            conversation_id: string;
            content: string;
            created_at: string | null;
          }>) => {
            if (!isSubscribed) return;

            // For message changes, only update the specific conversation's messages
            let conversationId: string | undefined;
            
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              conversationId = payload.new.conversation_id;
            } else if (payload.eventType === 'DELETE') {
              conversationId = payload.old.conversation_id;
            }

            if (!conversationId) return;

            // Fetch the updated conversation's messages
            const { data: messagesData } = await supabase
              .from('messages')
              .select('id, content, created_at')
              .eq('conversation_id', conversationId)
              .order('created_at', { ascending: false });

            if (messagesData) {
              setConversations(prev => prev.map(conv => 
                conv.id === conversationId 
                  ? { ...conv, messages: messagesData }
                  : conv
              ));
            }
          }
        )
        .subscribe();

      return () => {
        isSubscribed = false;
        channel.unsubscribe();
      };
    };

    setupSubscriptions();
  }, [accountId]);

  const getHappinessColor = (score: number | null) => {
    if (score === null) return happinessScoreColors.medium;
    if (score >= 0.7) return happinessScoreColors.high;
    if (score >= 0.4) return happinessScoreColors.medium;
    return happinessScoreColors.low;
  };

  const getLastMessage = (conversation: Conversation & { latestMessageHasAttachments?: boolean }) => {
    if (!conversation.messages?.length) return { content: "No messages", hasAttachments: false, messages: [] };
    const sortedMessages = [...conversation.messages].sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );
    return {
      content: sortedMessages[0].content,
      hasAttachments: conversation.latestMessageHasAttachments || false,
      messages: sortedMessages
    };
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

  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    const companyMatch = conversation.customer?.customer_company?.name?.toLowerCase().includes(searchLower);
    
    // Search through all messages, not just the latest one
    const messageMatch = conversation.messages.some(msg => 
      msg.content.toLowerCase().includes(searchLower)
    );

    return companyMatch || messageMatch;
  });

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={i} className="bg-yellow-100 text-yellow-900">{part}</span>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  if (isLoading) {
    return <div className="p-3 text-sm text-muted-foreground">Loading conversations...</div>;
  }

  return (
    <>
      {isSearchOpen && (
        <div ref={searchContainerRef} className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search company or messages..."
              className="w-full pl-8 h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}
      <ScrollArea className="flex-1">
        <div className="divide-y">
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors",
                selectedId === conversation.id && "bg-muted/50"
              )}
              onClick={() => onSelect(conversation.id)}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="font-medium text-sm truncate">
                    {searchQuery ? 
                      highlightText(conversation.customer?.customer_company?.name || "Unknown Company", searchQuery)
                      : (conversation.customer?.customer_company?.name || "Unknown Company")
                    }
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "px-1.5 py-0 h-4 text-[11px] font-normal", 
                      statusColors[conversation.status as keyof typeof statusColors]
                    )}
                  >
                    {conversation.status}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground/90 line-clamp-1">
                  {(() => {
                    const { content, hasAttachments } = getLastMessage(conversation);
                    return (
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">
                          {searchQuery ? 
                            highlightText(content, searchQuery)
                            : content
                          }
                        </span>
                        {hasAttachments && (
                          <svg
                            className="h-3 w-3 text-muted-foreground/50 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                            />
                          </svg>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {conversation.happiness_score !== null && (
                  <div className="relative flex items-center">
                    <div 
                      className={cn(
                        "w-4 h-4 rounded-full flex items-center justify-center font-medium relative",
                        getHappinessColor(conversation.happiness_score)
                      )}
                    >
                      <div className="absolute inset-0 rounded-full border border-current opacity-20"></div>
                      <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle
                          className="stroke-current opacity-20"
                          fill="none"
                          strokeWidth="1"
                          r="7"
                          cx="8"
                          cy="8"
                        />
                        <circle
                          className="stroke-current"
                          fill="none"
                          strokeWidth="1"
                          r="7"
                          cx="8"
                          cy="8"
                          strokeDasharray="44"
                          strokeDashoffset={44 - (Math.min(100, Math.max(0, Math.round(conversation.happiness_score * 100))) / 100) * 44}
                          strokeLinecap="round"
                          transform="rotate(-90 8 8)"
                        />
                      </svg>
                      <span className="text-[8px]">{Math.min(100, Math.max(0, Math.round(conversation.happiness_score * 100)))}</span>
                    </div>
                  </div>
                )}
                <span className="text-[10px] text-muted-foreground/70 whitespace-nowrap">
                  {conversation.created_at
                    ? new Date(conversation.created_at).toLocaleDateString(undefined, { 
                        month: 'numeric',
                        day: 'numeric',
                      })
                    : "Unknown date"}
                </span>
              </div>
            </div>
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
                    {getLastMessage(conversation).content}
                  </p>
                </Card>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 
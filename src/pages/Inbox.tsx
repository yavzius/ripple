import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ConversationList } from "@/components/inbox/ConversationList";
import { MessageThread } from "@/components/inbox/MessageThread";
import { useWorkspace } from "@/hooks/use-workspace";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function Inbox() {
  const { workspace, loading, error } = useWorkspace();
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [conversationCount, setConversationCount] = useState(0);

  const handleSelectConversation = (id: string) => {
    navigate(`/inbox/${id}`);
  };

  const handleFirstLoad = (id: string) => {
    if (!conversationId) {
      navigate(`/inbox/${id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex">
        <div className="w-[400px] border-r flex flex-col bg-white">
          <div className="p-3 border-b">
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="flex-1 p-4 space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
        <div className="flex-1 bg-muted/5 flex items-center justify-center">
          <Skeleton className="h-8 w-64" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center text-muted-foreground">
        <p>Failed to load workspace. Please try again.</p>
      </div>
    );
  }

  if (!workspace?.id) {
    return (
      <div className="h-screen flex items-center justify-center text-muted-foreground">
        <p>No workspace available. Please create or select a workspace.</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      <div className="w-[400px] border-r flex flex-col bg-white">
        <div className="p-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium">Inbox</h2>
            {conversationCount > 0 && (
              <div className="text-xs text-muted-foreground">{conversationCount}</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button 
              className={cn(
                "p-1.5 rounded-md transition-colors",
                isSearchOpen ? "bg-muted" : "hover:bg-muted"
              )}
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground">
                <path d="M10 6.5C10 8.433 8.433 10 6.5 10C4.567 10 3 8.433 3 6.5C3 4.567 4.567 3 6.5 3C8.433 3 10 4.567 10 6.5ZM9.30884 10.0159C8.53901 10.6318 7.56251 11 6.5 11C4.01472 11 2 8.98528 2 6.5C2 4.01472 4.01472 2 6.5 2C8.98528 2 11 4.01472 11 6.5C11 7.56251 10.6318 8.53901 10.0159 9.30884L12.8536 12.1464C13.0488 12.3417 13.0488 12.6583 12.8536 12.8536C12.6583 13.0488 12.3417 13.0488 12.1464 12.8536L9.30884 10.0159Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
            </button>
            <button className="p-1.5 hover:bg-muted rounded-md">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground">
                <path d="M7.49991 0.876892C3.84222 0.876892 0.877075 3.84204 0.877075 7.49972C0.877075 11.1574 3.84222 14.1226 7.49991 14.1226C11.1576 14.1226 14.1227 11.1574 14.1227 7.49972C14.1227 3.84204 11.1576 0.876892 7.49991 0.876892ZM1.82707 7.49972C1.82707 4.36671 4.36689 1.82689 7.49991 1.82689C10.6329 1.82689 13.1727 4.36671 13.1727 7.49972C13.1727 10.6327 10.6329 13.1726 7.49991 13.1726C4.36689 13.1726 1.82707 10.6327 1.82707 7.49972ZM7.50003 4C7.77617 4 8.00003 4.22386 8.00003 4.5V7H10.5C10.7762 7 11 7.22386 11 7.5C11 7.77614 10.7762 8 10.5 8H8.00003V10.5C8.00003 10.7761 7.77617 11 7.50003 11C7.22389 11 7.00003 10.7761 7.00003 10.5V8H4.50003C4.22389 8 4.00003 7.77614 4.00003 7.5C4.00003 7.22386 4.22389 7 4.50003 7H7.00003V4.5C7.00003 4.22386 7.22389 4 7.50003 4Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
            </button>
          </div>
        </div>
        <ConversationList
          accountId={workspace.id}
          selectedId={conversationId}
          onSelect={handleSelectConversation}
          onFirstLoad={handleFirstLoad}
          isSearchOpen={isSearchOpen}
          onSearchOpenChange={setIsSearchOpen}
          onConversationsChange={setConversationCount}
        />
      </div>
      <div className="flex-1 bg-muted/5">
        {conversationId ? (
          <MessageThread conversationId={conversationId} />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            Select a conversation to view messages
          </div>
        )}
      </div>
    </div>
  );
} 
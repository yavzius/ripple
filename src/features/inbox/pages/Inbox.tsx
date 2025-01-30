import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ConversationList } from "@/features/inbox/components/ConversationList";
import { MessageThread } from "@/features/inbox/components/MessageThread";
import { useWorkspace } from "@/hooks/use-workspace";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { PageLayout } from "@/components/layout/PageLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";

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
      <div className="flex h-[calc(100vh-4rem)]">
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
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center text-muted-foreground">
        <p>Failed to load workspace. Please try again.</p>
      </div>
    );
  }

  if (!workspace?.id) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center text-muted-foreground">
        <p>No workspace available. Please create or select a workspace.</p>
      </div>
    );
  }

  const actions = (
    <Button size="sm" variant="outline">
      <Plus className="h-4 w-4" />
    </Button>
  );

  return (
    <PageLayout
      title="Inbox"
      description={conversationCount > 0 ? `${conversationCount} conversations` : undefined}
      actions={actions}
    >
      <div className="-mx-6 -mb-6 h-[calc(100vh-10rem)] bg-white">
        <div className="h-full flex">
          <div className="w-[400px] border-r flex flex-col">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  className="pl-8"
                  value={isSearchOpen ? "" : undefined}
                  onChange={(e) => setIsSearchOpen(!!e.target.value)}
                />
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
      </div>
    </PageLayout>
  );
} 
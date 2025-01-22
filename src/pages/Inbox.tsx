import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ConversationList } from "@/components/inbox/ConversationList";
import { MessageThread } from "@/components/inbox/MessageThread";
import { useWorkspace } from "@/hooks/use-workspace";

export default function Inbox() {
  const { workspace } = useWorkspace();
  const { conversationId } = useParams();
  const navigate = useNavigate();

  const handleSelectConversation = (id: string) => {
    navigate(`/inbox/${id}`);
  };

  const handleFirstLoad = (id: string) => {
    if (!conversationId) {
      navigate(`/inbox/${id}`);
    }
  };

  if (!workspace?.id) {
    return <div>No workspace selected</div>;
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex gap-4 p-4">
      <div className="w-1/3 min-w-[300px]">
        <ConversationList
          accountId={workspace.id}
          selectedId={conversationId}
          onSelect={handleSelectConversation}
          onFirstLoad={handleFirstLoad}
        />
      </div>
      <div className="flex-1">
        {conversationId ? (
          <MessageThread conversationId={conversationId} />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Select a conversation to view messages
          </div>
        )}
      </div>
    </div>
  );
} 
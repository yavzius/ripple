import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/hooks/use-workspace";
import { Skeleton } from "@/components/ui/skeleton";


export const Header = () => {
  const navigate = useNavigate();
  const { workspace, loading } = useWorkspace();

  return (
    <header className="flex h-14 items-center justify-end gap-2 border-b bg-background/95 px-4">
      {loading ? (
        <Skeleton className="h-4 w-32" />
      ) : workspace ? (
        <span className="text-sm font-medium">{workspace.name}</span>
      ) : null}
      <div className="flex items-center gap-2">
        <NotificationsDropdown />
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={() => navigate('/settings')}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
};
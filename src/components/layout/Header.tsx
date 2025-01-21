import { PanelLeftOpen, PanelRightOpen, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/hooks/use-workspace";
import { Skeleton } from "@/components/ui/skeleton";


interface HeaderProps {
  isCollapsed: boolean;
  onToggleSidebar: () => void;
}

export const Header = ({ isCollapsed, onToggleSidebar }: HeaderProps) => {
  const navigate = useNavigate();
  const { workspace, loading } = useWorkspace();

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex flex-1 items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onToggleSidebar}
          >
            {isCollapsed ? (
              <PanelRightOpen className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              ShoreTide
            </h1>
            <span className="text-sm text-muted-foreground">
              AI Support Platform
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
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
        </div>
      </div>
    </header>
  );
};
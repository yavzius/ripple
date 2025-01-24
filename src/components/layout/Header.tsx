import { Settings, ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/hooks/use-workspace";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Header = () => {
  const navigate = useNavigate();
  const { workspace, workspaces, loading, switchWorkspace } = useWorkspace();

  const handleWorkspaceSwitch = async (accountId: string) => {
    try {
      await switchWorkspace(accountId);
    } catch (error) {
      console.error('Failed to switch workspace:', error);
    }
  };

  return (
    <header className="flex h-14 items-center justify-between px-4">
      {loading ? (
        <Skeleton className="h-8 w-48" />
      ) : workspace ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <span className="font-medium">{workspace.name}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {workspaces.map((ws) => (
              <DropdownMenuItem
                key={ws.id}
                onClick={() => handleWorkspaceSwitch(ws.id)}
                className="flex items-center gap-2"
              >
                <span className={ws.id === workspace.id ? "font-medium" : ""}>
                  {ws.name}
                </span>
                {ws.id === workspace.id && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    Current
                  </span>
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings/workspaces/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Create New Workspace
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
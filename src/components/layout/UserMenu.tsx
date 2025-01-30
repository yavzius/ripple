import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { LogOut, Settings, User, ChevronUp, Plus, Building } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useWorkspace } from "@/hooks/use-workspace";
import { useState, useRef, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserMenuProps {
  isCollapsed: boolean;
  isPinned: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserMenu = ({ isCollapsed, isPinned, onOpenChange }: UserMenuProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { workspace, workspaces, switchWorkspace } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    onOpenChange(open);
  };

  const handleWorkspaceSwitch = async (accountId: string) => {
    try {
      await switchWorkspace(accountId);
      handleOpenChange(false);
    } catch (error) {
      console.error('Failed to switch workspace:', error);
    }
  };

  return (
    <div className={cn(
      "absolute bottom-0 left-0 right-0 border-t border-primary-foreground/10",
      "transition-all duration-200"
    )}>
      <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild>
          <div className={cn(
            "p-3 flex items-center gap-3 cursor-pointer",
            "hover:bg-accent/50 transition-colors",
            isOpen && "bg-white/[0.03] backdrop-blur-xl",
            isCollapsed && !isPinned && "group"
          )}>
            {/* Avatar/Initials placeholder */}
            <div className="h-8 w-8 rounded-full bg-accent/50 flex items-center justify-center shrink-0">
              <User className="h-4 w-4" />
            </div>

            {/* User info */}
            <div className={cn(
              "flex flex-col overflow-hidden transition-all duration-200",
              isCollapsed && !isPinned ? "w-0 group-hover:w-auto" : "w-auto"
            )}>
              <span className="text-sm font-medium truncate">
                {user?.email}
              </span>
              {workspace && (
                <span className="text-xs text-muted-foreground truncate">
                  {workspace.name}
                </span>
              )}
            </div>

            {/* Dropdown indicator */}
            <ChevronUp className={cn(
              "h-4 w-4 ml-auto transition-transform duration-200",
              !isOpen && "transform rotate-180",
              isCollapsed && !isPinned ? "w-0 group-hover:w-4" : "w-4"
            )} />
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent 
          className={cn(
            "w-56 bg-primary/80 backdrop-blur-xl",
            "border border-white/10",
            "shadow-lg ring-1 ring-black/5",
            "text-white"
          )}
          align="end" 
          alignOffset={-10}
          sideOffset={10}
          forceMount
        >
          <DropdownMenuLabel className="text-xs font-normal text-white/70">
            Workspaces
          </DropdownMenuLabel>

          <DropdownMenuGroup>
            {workspaces.map((ws) => (
              <DropdownMenuItem
                key={ws.id}
                onClick={() => handleWorkspaceSwitch(ws.id)}
                className="flex items-center gap-2 cursor-pointer focus:bg-white/10"
              >
                <Building className="h-4 w-4 text-white/70" />
                <span className={cn(
                  "flex-1 truncate",
                  ws.id === workspace?.id && "font-medium"
                )}>
                  {ws.name}
                </span>
                {ws.id === workspace?.id && (
                  <span className="text-xs text-white/70 ml-2">
                    Current
                  </span>
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem
              onClick={() => {
                navigate('/settings/workspaces/new');
                handleOpenChange(false);
              }}
              className="cursor-pointer focus:bg-white/10"
            >
              <Plus className="h-4 w-4 mr-2 text-white/70" />
              <span>Create Workspace</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="bg-white/10" />

          <DropdownMenuGroup>
            <DropdownMenuItem asChild className="focus:bg-white/10">
              <Link to="/settings" className="cursor-pointer w-full">
                <Settings className="h-4 w-4 mr-2 text-white/70" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          
          <DropdownMenuSeparator className="bg-white/10" />
          
          <DropdownMenuItem 
            className="cursor-pointer text-red-300 focus:text-red-200 focus:bg-white/10" 
            onClick={signOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
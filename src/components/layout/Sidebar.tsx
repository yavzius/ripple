import { Link, useLocation, useParams } from "react-router-dom";
import {
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  GraduationCap,
  TicketCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isCollapsed: boolean;
}

export const Sidebar = ({ isCollapsed }: SidebarProps) => {
  const location = useLocation();
  const { workspaceSlug } = useParams();

  const isActive = (path: string) => location.pathname === path;

  // Helper function to construct workspace-scoped URLs
  const getWorkspaceUrl = (path: string) => `/${workspaceSlug}${path}`;

  return (
    <aside
      className={cn(
        "fixed left-0 top-14 z-30 h-[calc(100vh-3.5rem)] border-r bg-background transition-all duration-200",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            <Link
              to={getWorkspaceUrl("/dashboard")}
              className={cn(
                "nav-item",
                isActive(getWorkspaceUrl("/dashboard")) && "nav-item-active"
              )}
            >
              <BarChart3 className="h-4 w-4 shrink-0" />
              <span
                className={cn(
                  "transition-all duration-200",
                  isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                )}
              >
                Analytics
              </span>
            </Link>
            <Link
              to={getWorkspaceUrl("/tickets")}
              className={cn(
                "nav-item",
                isActive(getWorkspaceUrl("/tickets")) && "nav-item-active"
              )}
            >
              <TicketCheck className="h-4 w-4 shrink-0" />
              <span
                className={cn(
                  "transition-all duration-200",
                  isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                )}
              >
                Tickets
              </span>
            </Link>
            <Link
              to={getWorkspaceUrl("/training")}
              className={cn(
                "nav-item",
                isActive(getWorkspaceUrl("/training")) && "nav-item-active"
              )}
            >
              <GraduationCap className="h-4 w-4 shrink-0" />
              <span
                className={cn(
                  "transition-all duration-200",
                  isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                )}
              >
                Training
              </span>
            </Link>
            <Link
              to={getWorkspaceUrl("/knowledge")}
              className={cn(
                "nav-item",
                isActive(getWorkspaceUrl("/knowledge")) && "nav-item-active"
              )}
            >
              <BookOpen className="h-4 w-4 shrink-0" />
              <span
                className={cn(
                  "transition-all duration-200",
                  isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                )}
              >
                Knowledge Base
              </span>
            </Link>
            <Link
              to="/workspaces"
              className={cn(
                "nav-item",
                isActive("/workspaces") && "nav-item-active"
              )}
            >
              <Building2 className="h-4 w-4 shrink-0" />
              <span
                className={cn(
                  "transition-all duration-200",
                  isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                )}
              >
                Workspaces
              </span>
            </Link>
            <Link
              to={getWorkspaceUrl("/updates")}
              className={cn(
                "nav-item",
                isActive(getWorkspaceUrl("/updates")) && "nav-item-active"
              )}
            >
              <Bell className="h-4 w-4 shrink-0" />
              <span
                className={cn(
                  "transition-all duration-200",
                  isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                )}
              >
                Updates
              </span>
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
};
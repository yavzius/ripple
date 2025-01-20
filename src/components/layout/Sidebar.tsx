import { Link, useLocation } from "react-router-dom";
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

  const isActive = (path: string) => location.pathname === path;

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
              to="/dashboard"
              className={cn(
                "nav-item",
                isActive("/dashboard") && "nav-item-active"
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
              to="/tickets"
              className={cn(
                "nav-item",
                isActive("/tickets") && "nav-item-active"
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
              to="/training"
              className={cn(
                "nav-item",
                isActive("/training") && "nav-item-active"
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
              to="/knowledge"
              className={cn(
                "nav-item",
                isActive("/knowledge") && "nav-item-active"
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
              to="/updates"
              className={cn(
                "nav-item",
                isActive("/updates") && "nav-item-active"
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
import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  Bell,
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  Ticket,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isCollapsed: boolean;
}

export const Sidebar = ({ isCollapsed }: SidebarProps) => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Tickets",
      href: "/tickets",
      icon: Ticket,
    },
    {
      title: "CRM",
      href: "/crm",
      icon: Users,
    },
    {
      title: "Knowledge Base",
      href: "/knowledge",
      icon: BookOpen,
    },
    {
      title: "Training",
      href: "/training",
      icon: GraduationCap,
    },
    {
      title: "Analytics",
      href: "/analytics",
      icon: BarChart3,
    },
    {
      title: "Updates",
      href: "/updates",
      icon: Bell,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ];

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
            {navItems.map((item) => (
              <Link
                key={item.title}
                to={item.href}
                className={cn(
                  "nav-item",
                  isActive(item.href) && "nav-item-active"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span
                  className={cn(
                    "transition-all duration-200",
                    isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                  )}
                >
                  {item.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};
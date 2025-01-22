import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  Bell,
  BookOpen,
  GraduationCap,
  Ticket,
  Settings,
  Users,
  CircleDotDashed,
  Pin
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Dispatch, SetStateAction, useState } from "react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: Dispatch<SetStateAction<boolean>>;
}

export const Sidebar = ({ isCollapsed, setIsCollapsed }: SidebarProps) => {
  const location = useLocation();
  const [isPinned, setIsPinned] = useState(false);

  const handleMouseLeave = () => {
    if (!isPinned) {
      setIsCollapsed(true);
    }
  };

  const handleMouseEnter = () => {
    if (!isPinned) {
      setIsCollapsed(false);
    }
  };

  const togglePin = () => {
    setIsPinned(!isPinned);
    if (isPinned) {
      setIsCollapsed(true);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    {
      title: "Tickets",
      href: "/tickets",
      icon: Ticket,
    },
    {
      title: "Companies",
      href: "/companies",
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
        "fixed left-0 top-0 z-40 h-screen border-r bg-primary text-primary-foreground transition-all duration-200",
        isCollapsed ? "w-16 hover:w-64" : "w-64"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center justify-between p-4">
        <div className={cn("flex items-center overflow-hidden", isCollapsed ? "gap-0" : "gap-2")}>
          <CircleDotDashed className="w-6 h-6 text-blue-800 bg-gradient-to-r from-purple-600 via-blue-500 to-purple-400 rounded-full" />
          <h1 className={cn(
            "text-xl font-regular text-white pt-1 cursor-default select-none transition-all duration-600 whitespace-nowrap",
            isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          )}>
            Ripple
          </h1>
        </div>
        {!isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 transition-opacity duration-200",
              isCollapsed ? "opacity-0" : "opacity-100"
            )}
            onClick={togglePin}
          >
            <Pin className={cn("h-4 w-4", isPinned && "text-blue-400")} />
          </Button>
        )}
      </div>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.title}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-secondary group",
                  isActive(item.href) && "bg-accent text-secondary"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0 text-muted" />
                <span
                  className={cn(
                    "transition-all duration-200 whitespace-nowrap",
                    isCollapsed ? "w-0 opacity-0 group-hover:w-auto group-hover:opacity-100" : "w-auto opacity-100"
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
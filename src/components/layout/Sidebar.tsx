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
  Pin,
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Dispatch, SetStateAction, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "./UserMenu";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: Dispatch<SetStateAction<boolean>>;
}

export const Sidebar = ({ isCollapsed, setIsCollapsed }: SidebarProps) => {
  const location = useLocation();
  const [isPinned, setIsPinned] = useState(() => {
    const savedPinState = localStorage.getItem('sidebarPinned');
    return savedPinState ? JSON.parse(savedPinState) : false;
  });
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Initialize collapsed state based on pin state
  useEffect(() => {
    const savedPinState = localStorage.getItem('sidebarPinned');
    const isPinned = savedPinState ? JSON.parse(savedPinState) : false;
    const savedCollapsedState = localStorage.getItem('sidebarCollapsed');
    const shouldBeCollapsed = savedCollapsedState ? JSON.parse(savedCollapsedState) : !isPinned;
    setIsCollapsed(shouldBeCollapsed);
  }, []);

  // Save states when they change
  useEffect(() => {
    localStorage.setItem('sidebarPinned', JSON.stringify(isPinned));
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed));
  }, [isPinned, isCollapsed]);

  const handleMouseLeave = () => {
    if (!isPinned && !isUserMenuOpen) {
      setIsCollapsed(true);
    }
  };

  const handleMouseEnter = () => {
    if (!isPinned) {
      setIsCollapsed(false);
    }
  };

  const togglePin = () => {
    const newPinState = !isPinned;
    setIsPinned(newPinState);
    if (!newPinState) {
      setIsCollapsed(true);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    {
      title: "Inbox",
      href: "/inbox",
      icon: MessageSquare,
    },
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
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 fill-purple-400 rounded-full" version="1.1" id="Capa_1" viewBox="0 0 19.877 19.877" >
              <g>
                <g> 
                  <path  d="M9.938,3.403c-3.604,0-6.537,2.933-6.537,6.537s2.933,6.537,6.537,6.537s6.538-2.933,6.538-6.537    C16.476,6.336,13.542,3.403,9.938,3.403z M9.938,14.892c-2.73,0-4.952-2.222-4.952-4.952s2.222-4.952,4.952-4.952    c2.731,0,4.953,2.222,4.953,4.952S12.669,14.892,9.938,14.892z"/>
                  <path  d="M9.938,0.001C4.458,0.001,0,4.459,0,9.938s4.458,9.938,9.938,9.938    c5.481,0,9.939-4.458,9.939-9.938C19.877,4.459,15.419,0.001,9.938,0.001z M9.938,18.292c-4.606,0-8.353-3.746-8.353-8.353    c0-4.606,3.747-8.353,8.353-8.353s8.353,3.747,8.353,8.353C18.291,14.545,14.544,18.292,9.938,18.292z"/>
                </g>
              </g>
            </svg>
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
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-[background-color,color] hover:bg-accent hover:text-secondary group",
                  isActive(item.href) && "bg-accent text-secondary font-semibold"
                )}
              >
                <item.icon className={cn("h-4 w-4 shrink-0 transition-colors", isActive(item.href) ? "text-primary-foreground" : "text-muted")} />
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
      <UserMenu 
        isCollapsed={isCollapsed} 
        isPinned={isPinned} 
        onOpenChange={setIsUserMenuOpen}
      />
    </aside>
  );
};
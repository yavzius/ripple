import { Home, Inbox, Book, BarChart2, Users, Building } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation, Link } from "react-router-dom";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Tickets", href: "/tickets", icon: Inbox },
  { name: "Knowledge Base", href: "/knowledge", icon: Book },
  { name: "CRM", href: "/organizations", icon: Building },
  { name: "Training", href: "/training", icon: Users },
  { name: "Analytics", href: "/analytics", icon: BarChart2 },
];

interface SidebarProps {
  isCollapsed: boolean;
}

export const Sidebar = ({ isCollapsed }: SidebarProps) => {
  const location = useLocation();

  return (
    <div
      className={cn(
        "fixed left-0 top-14 h-[calc(100vh-3.5rem)] border-r bg-background transition-all duration-200",
        isCollapsed ? "sidebar-collapsed" : "sidebar-expanded"
      )}
    >
      <nav className="flex h-full flex-col gap-2 p-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "nav-item group relative",
                isActive && "nav-item-active"
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>{item.name}</span>}
              {isCollapsed && (
                <div className="absolute left-full top-0 ml-2 hidden rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground group-hover:block">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
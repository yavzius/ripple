import { Home, Inbox, Book, BarChart2, Users, Building } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLocation, Link } from "react-router-dom";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Tickets", href: "/tickets", icon: Inbox },
  { name: "Knowledge Base", href: "/knowledge", icon: Book },
  { name: "CRM", href: "/organizations", icon: Building },
  { name: "Training", href: "/training", icon: Users },
  { name: "Analytics", href: "/analytics", icon: BarChart2 },
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="flex h-[calc(100vh-4rem)] w-64 flex-col border-r">
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link key={item.name} to={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3",
                  isActive && "bg-secondary"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Button>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
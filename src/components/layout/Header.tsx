import { Bell, ChevronLeft, ChevronRight, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  isCollapsed: boolean;
  onToggleSidebar: () => void;
}

export const Header = ({ isCollapsed, onToggleSidebar }: HeaderProps) => {
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
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
          <h1 className="text-lg font-semibold">AI Support Platform</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative h-8 w-8">
            <Bell className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              3
            </span>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};
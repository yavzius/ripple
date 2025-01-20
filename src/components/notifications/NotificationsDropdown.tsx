import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell, Bot, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

// Mock updates data - in a real app, this would come from an API
const updates = [
  {
    id: 1,
    title: "Urgent: Review AI Response",
    description: "AI has suggested a solution for Ticket #1234",
    time: "5m ago",
    type: "attention",
    category: "ai",
  },
  {
    id: 2,
    title: "AI Action Taken",
    description: "AI categorized 15 new tickets",
    time: "1h ago",
    type: "info",
    category: "ai",
  },
  {
    id: 3,
    title: "System Update Required",
    description: "Critical security update pending",
    time: "2h ago",
    type: "attention",
    category: "system",
  },
];

export const NotificationsDropdown = () => {
  const handleNotificationClick = (notification: typeof updates[0]) => {
    toast(notification.title, {
      description: notification.description,
    });
  };

  const urgentCount = updates.filter((update) => update.type === "attention").length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {urgentCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
              {urgentCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 bg-background border shadow-lg"
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <h4 className="font-semibold leading-none tracking-tight">
              Updates
            </h4>
            <p className="text-sm text-muted-foreground">
              You have {urgentCount} items that need attention
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {updates.map((update) => (
          <DropdownMenuItem
            key={update.id}
            className="cursor-pointer focus:bg-muted"
            onClick={() => handleNotificationClick(update)}
          >
            <div className="flex items-start gap-4 py-2">
              <div className="rounded-full bg-primary/10 p-2">
                {update.category === "ai" ? (
                  <Bot className="h-4 w-4 text-primary" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium leading-none">{update.title}</p>
                  {update.type === "attention" && (
                    <Badge variant="destructive" className="text-xs">
                      Urgent
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {update.description}
                </p>
                <p className="text-xs text-muted-foreground">{update.time}</p>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer focus:bg-muted">
          <Link to="/updates" className="w-full">
            <Button variant="outline" className="w-full">
              View all updates
            </Button>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
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
import { Bell } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Mock notifications data - in a real app, this would come from an API
const notifications = [
  {
    id: 1,
    title: "New ticket assigned",
    description: "Ticket #1234 has been assigned to you",
    time: "5m ago",
  },
  {
    id: 2,
    title: "Training session completed",
    description: "AI model training session #45 completed successfully",
    time: "1h ago",
  },
  {
    id: 3,
    title: "System update",
    description: "New features have been deployed",
    time: "2h ago",
  },
];

export const NotificationsDropdown = () => {
  const handleNotificationClick = (notification: typeof notifications[0]) => {
    toast({
      title: notification.title,
      description: notification.description,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
            {notifications.length}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.map((notification) => (
          <DropdownMenuItem
            key={notification.id}
            className="cursor-pointer"
            onClick={() => handleNotificationClick(notification)}
          >
            <div className="flex flex-col gap-1">
              <div className="font-medium">{notification.title}</div>
              <div className="text-sm text-muted-foreground">
                {notification.description}
              </div>
              <div className="text-xs text-muted-foreground">
                {notification.time}
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
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
import { Link } from "react-router-dom";

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
      <DropdownMenuContent
        align="end"
        className="w-80 bg-background border shadow-lg"
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <h4 className="font-semibold leading-none tracking-tight">
              Notifications
            </h4>
            <p className="text-sm text-muted-foreground">
              You have {notifications.length} unread messages
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.map((notification) => (
          <DropdownMenuItem
            key={notification.id}
            className="cursor-pointer focus:bg-muted"
            onClick={() => handleNotificationClick(notification)}
          >
            <div className="flex items-start gap-4 py-2">
              <div className="rounded-full bg-primary/10 p-2">
                <Bell className="h-4 w-4 text-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="font-medium leading-none">{notification.title}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {notification.description}
                </p>
                <p className="text-xs text-muted-foreground">{notification.time}</p>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer focus:bg-muted">
          <Link to="/notifications" className="w-full">
            <Button variant="outline" className="w-full">
              View all notifications
            </Button>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
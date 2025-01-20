import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell } from "lucide-react";

// Using the same mock data as the dropdown for now
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

const Notifications = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            View and manage your notifications
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="rounded-full bg-primary/10 p-2">
                      <Bell className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="font-medium leading-none">
                        {notification.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {notification.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {notification.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Notifications;
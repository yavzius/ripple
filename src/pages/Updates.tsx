import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Bot, Mail, User, FileText, Book, AlertCircle, Building2, TicketCheck } from "lucide-react";

// Mock data for platform updates
const updates = [
  {
    id: 1,
    title: "AI Response Generated",
    description: "AI generated a response for support ticket #1234 from Tech Solutions Inc.",
    time: "5m ago",
    type: "ai_response",
    urgent: true,
    needsAttention: true,
    icon: Bot,
  },
  {
    id: 2,
    title: "New Support Ticket",
    description: "Customer Sarah Smith submitted ticket #1235 about API integration issues",
    time: "15m ago",
    type: "ticket",
    urgent: true,
    needsAttention: true,
    icon: TicketCheck,
  },
  {
    id: 3,
    title: "Organization Updated",
    description: "CloudTech Solutions updated their billing information",
    time: "1h ago",
    type: "organization",
    urgent: false,
    needsAttention: false,
    icon: Building2,
  },
  {
    id: 4,
    title: "Knowledge Base Article Created",
    description: "AI generated new documentation: 'Getting Started with API v2'",
    time: "2h ago",
    type: "documentation",
    urgent: false,
    needsAttention: false,
    icon: FileText,
  },
  {
    id: 5,
    title: "Training Module Completed",
    description: "AI generated 3 new training cards for 'Advanced API Usage'",
    time: "3h ago",
    type: "training",
    urgent: false,
    needsAttention: false,
    icon: Book,
  },
  {
    id: 6,
    title: "Customer Communication",
    description: "New email received from John Doe regarding enterprise pricing",
    time: "4h ago",
    type: "communication",
    urgent: false,
    needsAttention: false,
    icon: Mail,
  },
];

const Updates = () => {
  // Separate updates that need attention
  const urgentUpdates = updates.filter((update) => update.needsAttention);
  const regularUpdates = updates.filter((update) => !update.needsAttention);

  const UpdateItem = ({ update }: { update: typeof updates[0] }) => {
    const Icon = update.icon;
    return (
      <div className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50">
        <div className={`rounded-full p-2 ${
          update.type === 'ai_response' ? 'bg-purple-100' :
          update.type === 'ticket' ? 'bg-blue-100' :
          update.type === 'organization' ? 'bg-green-100' :
          update.type === 'documentation' ? 'bg-yellow-100' :
          update.type === 'training' ? 'bg-pink-100' :
          'bg-gray-100'
        }`}>
          <Icon className={`h-4 w-4 ${
            update.type === 'ai_response' ? 'text-purple-500' :
            update.type === 'ticket' ? 'text-blue-500' :
            update.type === 'organization' ? 'text-green-500' :
            update.type === 'documentation' ? 'text-yellow-500' :
            update.type === 'training' ? 'text-pink-500' :
            'text-gray-500'
          }`} />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <p className="font-medium leading-none">{update.title}</p>
            {update.urgent && (
              <Badge variant="destructive" className="text-xs">
                Urgent
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {update.description}
          </p>
          <p className="text-xs text-muted-foreground">{update.time}</p>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Updates</h1>
          <p className="text-muted-foreground">
            Track all activities and updates across your platform
          </p>
        </div>

        {urgentUpdates.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Needs Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  {urgentUpdates.map((update) => (
                    <UpdateItem key={update.id} update={update} />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>All Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {regularUpdates.map((update) => (
                  <UpdateItem key={update.id} update={update} />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Updates;
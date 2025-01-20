import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, TicketCheck, TicketX, Clock } from "lucide-react";
import { useParams } from "react-router-dom";

// Mock data for initial display
const ticketData = {
  id: "TICK-1234",
  subject: "Login Issue",
  status: "open",
  priority: "high",
  created: "2024-03-10",
  assignee: "AI Agent",
  description: "Unable to login to the application after password reset.",
  messages: [
    {
      id: 1,
      sender: "Customer",
      content: "I can't log in after resetting my password.",
      timestamp: "2024-03-10T10:00:00",
    },
    {
      id: 2,
      sender: "AI Agent",
      content: "I understand you're having trouble logging in. Have you cleared your browser cache and cookies?",
      timestamp: "2024-03-10T10:05:00",
    },
  ],
};

const TicketDetail = () => {
  const { id } = useParams();
  const ticket = ticketData; // In a real app, this would fetch based on the ID

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">
              Ticket {ticket.id}
            </h2>
            <p className="text-sm text-muted-foreground">{ticket.subject}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <TicketCheck className="h-4 w-4" />
              Resolve
            </Button>
            <Button variant="outline" className="gap-2">
              <TicketX className="h-4 w-4" />
              Close
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
              <CardDescription>Ticket information and status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    ticket.status === "open"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {ticket.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Priority</span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    ticket.priority === "high"
                      ? "bg-red-100 text-red-700"
                      : ticket.priority === "medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {ticket.priority}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Created</span>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {ticket.created}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Assignee</span>
                <span className="text-sm text-muted-foreground">
                  {ticket.assignee}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
              <CardDescription>Ticket description and details</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {ticket.description}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Messages</CardTitle>
              <CardDescription>Conversation history</CardDescription>
            </div>
            <Button className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Reply
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {ticket.messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col gap-2 rounded-lg p-4 ${
                  message.sender === "AI Agent"
                    ? "bg-muted ml-8"
                    : "bg-primary/5 mr-8"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{message.sender}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(message.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm">{message.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TicketDetail;
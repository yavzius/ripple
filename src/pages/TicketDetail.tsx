import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, TicketCheck, TicketX, Clock, Loader2, User } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useTicketWithMessages, useCreateMessage, updateTicket } from "@/lib/actions";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

interface UserBasicInfo {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

type Tables = Database['public']['Tables'];
type TicketRow = Tables['tickets']['Row'];
type MessageRow = Tables['messages']['Row'];

interface TicketWithRelations extends Omit<TicketRow, 'customer_id' | 'assignee_id'> {
  customer: UserBasicInfo | null;
  assignee: UserBasicInfo | null;
  customer_id: string | null;
  assignee_id: string | null;
}

type MessageWithUser = {
  id: string;
  ticket_id: string;
  content: string;
  created_at: string;
  is_internal: boolean;
  is_ai_generated: boolean;
  intent: string;
  sentiment: string;
  ai_metadata: any;
  attachments: any;
  sender: UserBasicInfo;
  sender_id: string;
}

type ReplyFormData = {
  content: string;
};

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useTicketWithMessages(id);
  const createMessageMutation = useCreateMessage();
  const { register, handleSubmit, reset } = useForm<ReplyFormData>();
  const { toast } = useToast();

  const ticket = data?.ticket;
  const messages = data?.messages || [];

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return;

    try {
      await updateTicket(ticket.id, { 
        status: newStatus,
        ...(newStatus === "closed" ? { resolved_at: new Date().toISOString() } : {})
      });
      toast({
        title: "Status Updated",
        description: `Ticket status changed to ${newStatus}`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update ticket status",
        variant: "destructive",
      });
    }
  };

  const onSubmitReply = async (data: ReplyFormData) => {
    if (!ticket) return;

    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError) throw authError;
      if (!session?.user?.id) throw new Error('Not authenticated');

      await createMessageMutation.mutateAsync({
        ticket_id: ticket.id,
        content: data.content,
        sender_id: session.user.id,
        is_internal: false,
      });
      
      reset();
      toast({
        title: "Message Sent",
        description: "Your reply has been sent successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading ticket...
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-destructive">Error: {error instanceof Error ? error.message : "Ticket not found"}</p>
        <Button onClick={() => navigate("/tickets")}>Back to Tickets</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            Ticket {ticket.ticket_number}
          </h2>
          <p className="text-sm text-muted-foreground">{ticket.subject}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => handleStatusChange("closed")}
            disabled={ticket.status === "closed"}
          >
            <TicketCheck className="h-4 w-4" />
            Resolve
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => handleStatusChange("open")}
            disabled={ticket.status === "open"}
          >
            <TicketX className="h-4 w-4" />
            Reopen
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
                {format(new Date(ticket.created_at), "MMM d, yyyy")}
              </span>
            </div>
            <Separator />
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium">Customer</span>
                <div className="flex items-center gap-2 mt-1">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={ticket.customer?.avatar_url || undefined} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">
                    {ticket.customer?.full_name || ticket.customer?.email || "Unknown"}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-sm font-medium">Assignee</span>
                <div className="flex items-center gap-2 mt-1">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={ticket.assignee?.avatar_url || undefined} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">
                    {ticket.assignee?.full_name || ticket.assignee?.email || "Unassigned"}
                  </span>
                </div>
              </div>
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
              {ticket.description || "No description provided"}
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
        </CardHeader>
        <CardContent className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col gap-2 rounded-lg p-4 ${
                message.is_ai_generated
                  ? "bg-muted ml-8"
                  : "bg-primary/5 mr-8"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={message.sender?.avatar_url || undefined} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">
                    {message.is_ai_generated 
                      ? "AI Agent" 
                      : message.sender?.full_name || message.sender?.email || "Unknown"}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(message.created_at), "MMM d, yyyy h:mm a")}
                </span>
              </div>
              <p className="text-sm">{message.content}</p>
            </div>
          ))}

          <form onSubmit={handleSubmit(onSubmitReply)} className="space-y-4 pt-4">
            <Textarea
              placeholder="Type your reply..."
              {...register("content", { required: true })}
            />
            <Button type="submit" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Send Reply
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TicketDetail;
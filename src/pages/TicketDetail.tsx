import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { getTicketWithMessages, type TicketWithRelations, type MessageWithSender } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { 
  Loader2, 
  ChevronRight, 
  User, 
  Building, 
  Clock, 
  AlertTriangle,
  Tag,
  MessageSquare,
  Calendar
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface ReplyFormData {
  content: string;
}

const TicketDetail = () => {
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [ticket, setTicket] = useState<TicketWithRelations | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const { register, handleSubmit, reset } = useForm<ReplyFormData>();
  const { toast } = useToast();

  // Fetch ticket and messages
  useEffect(() => {
    const fetchTicketData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      setError(null);
      try {
        const data = await getTicketWithMessages(id);
        setTicket(data.ticket);
        setMessages(data.messages || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch ticket'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchTicketData();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket || !ticket.conversation_id) return;

    try {
      // Update both the ticket status and conversation status
      const updates = {
        status: newStatus,
        resolved_at: newStatus === 'resolved' ? new Date().toISOString() : null
      };

      const { data: updatedConversation, error: conversationError } = await supabase
        .from('conversations')
        .update(updates)
        .eq('id', ticket.conversation_id)
        .select()
        .single();

      if (conversationError) throw conversationError;

      const { data: updatedTicket, error: ticketError } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', ticket.id)
        .select()
        .single();

      if (ticketError) throw ticketError;
      
      // Update local state
      setTicket(prev => prev ? {
        ...prev,
        status: newStatus,
        conversation: {
          ...prev.conversation,
          resolved_at: updates.resolved_at
        }
      } : null);

      toast({
        title: "Status Updated",
        description: `Ticket status has been updated to ${newStatus}`,
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
    if (!ticket || !ticket.conversation_id) return;

    try {
      const { data: newMessage, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: ticket.conversation_id,
          content: data.content,
          sender_type: 'agent'
        })
        .select()
        .single();

      if (messageError) throw messageError;
      
      setMessages(prev => [...prev, newMessage]);
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

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading ticket: {error.message}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-4">
        Ticket not found
      </div>
    );
  }

  const isResolved = ticket.conversation?.resolved_at;

  return (
    <div className="container mx-auto max-w-7xl">
      {/* Header Section */}
      <div className="mb-6">
        <Link to="/tickets" className="text-md text-primary font-medium hover:text-gray-700 mb-4 inline-flex items-center gap-1">
          Tickets
          <ChevronRight className="h-4 w-4" />
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">
              {ticket.title || 'Untitled Ticket'}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={ticket.priority === 'high' ? 'destructive' : ticket.priority === 'medium' ? 'secondary' : 'default'}>
                {ticket.priority}
              </Badge>
              <Badge variant="outline">{ticket.status}</Badge>
              {isResolved && (
                <Badge variant="secondary">Resolved</Badge>
              )}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Opened {format(new Date(ticket.created_at || ''), "PPP")}
              {isResolved && ` • Resolved ${format(new Date(ticket.conversation?.resolved_at || ''), "PPP")}`}
            </div>
          </div>
          <Select
            value={ticket?.status || "open"}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Ticket Details */}
        <div className="col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ticket Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium">Reported By</div>
                  <div className="text-sm text-gray-600">
                    {ticket.conversation?.customer?.first_name 
                      ? `${ticket.conversation.customer.first_name} ${ticket.conversation.customer.last_name}`
                      : ticket.conversation?.customer?.email || 'Unknown'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium">Organization</div>
                  <div className="text-sm text-gray-600">
                    {ticket.conversation?.customer?.customer_company?.name || 'Unknown'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium">Submitted</div>
                  <div className="text-sm text-gray-600">
                    {format(new Date(ticket.created_at || ''), "PPP 'at' p")}
                  </div>
                </div>
              </div>
              {ticket.updated_at && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium">Last Activity</div>
                    <div className="text-sm text-gray-600">
                      {format(new Date(ticket.updated_at), "PPP 'at' p")}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {ticket.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Issue Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {ticket.description}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Messages */}
        <div className="col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Support Thread
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                {messages.length} {messages.length === 1 ? 'message' : 'messages'}
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 rounded-lg border ${
                        message.sender_type === 'agent' || message.sender_type === 'ai'
                          ? 'bg-primary/5 ml-auto max-w-[80%]' 
                          : 'bg-secondary/5 max-w-[80%]'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-semibold capitalize flex items-center gap-2">
                            {message.sender_type === 'agent' ? (
                              <Badge variant="outline">Support Agent</Badge>
                            ) : message.sender_type === 'ai' ? (
                              <Badge variant="outline">AI Assistant</Badge>
                            ) : (
                              <Badge>{message.sender_type}</Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {format(new Date(message.created_at || ''), "PPP 'at' p")}
                          </div>
                        </div>
                      </div>
                      <div className="prose max-w-none mt-2">
                        {message.content}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {!isResolved && (
                <form onSubmit={handleSubmit(onSubmitReply)} className="mt-6">
                  <Textarea
                    {...register("content", { required: true })}
                    placeholder="Type your reply..."
                    className="min-h-[100px]"
                  />
                  <Button type="submit" className="mt-2">
                    Send Reply
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
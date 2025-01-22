import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { getTicketWithMessages, createMessage, updateTicket, type TicketWithRelations, type MessageWithSender } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { TicketCheck, ChevronRight } from "lucide-react";
interface ReplyFormData {
  content: string;
}

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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

  const handleResolve = async () => {
    if (!ticket) return;

    try {
      const updatedTicket = await updateTicket(ticket.id, { 
        resolved_at: new Date().toISOString()
      });
      setTicket(updatedTicket);
      toast({
        title: "Ticket Resolved",
        description: "The ticket has been marked as resolved",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to resolve ticket",
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

      const newMessage = await createMessage({
        ticket_id: ticket.id,
        content: data.content,
        sender_id: session.user.id,
        metadata: {
          is_internal: false,
        },
      });
      
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

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <Link to="/tickets" className="text-md text-primary font-medium hover:text-gray-700 mb-4 inline-flex items-center gap-1">
          Tickets
          <ChevronRight className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold">{ticket.subject}</h1>
        <div className="mt-2 text-gray-600">
          Ticket #{ticket.id} • Created {format(new Date(ticket.created_at || ''), "PPP")}
          {ticket.resolved_at && ` • Resolved ${format(new Date(ticket.resolved_at), "PPP")}`}
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        {!ticket.resolved_at && (
          <Button onClick={handleResolve}>
            <TicketCheck className="mr-2 h-4 w-4" />
            Resolve Ticket
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className="p-4 rounded-lg border"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-semibold">
                  {message.sender?.first_name} {message.sender?.last_name || message.sender?.email || "Unknown"}
                </div>
                <div className="text-sm text-gray-500">
                  {format(new Date(message.created_at || ''), "PPP 'at' pp")}
                </div>
              </div>
            </div>
            <div className="prose max-w-none">
              {message.content}
            </div>
          </div>
        ))}
      </div>

      {!ticket.resolved_at && (
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
    </div>
  );
};

export default TicketDetail;
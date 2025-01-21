import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Ticket, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getCustomerTickets, createTicket } from "@/lib/actions";
import { useNavigate } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface TicketWithMessages {
  id: string;
  ticket_number: string;
  subject: string;
  status: string;
  created_at: string;
  description: string;
  messages: {
    id: string;
    content: string;
    sender: {
      full_name: string | null;
      email: string;
    };
    created_at: string;
  }[];
}

const CustomerPortal = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<TicketWithMessages[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTicketMode, setNewTicketMode] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      setCurrentUserEmail(session.user.email || "");

      // Get user details to verify customer role
      const { data: userDetails } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (!userDetails || userDetails.role !== 'customer') {
        toast.error("Unauthorized: Only customers can access this portal");
        navigate("/auth");
        return;
      }

      fetchTickets();
    };

    checkAuth();
  }, [navigate]);

  const fetchTickets = async () => {
    try {
      const ticketsData = await getCustomerTickets();
      // Transform the data to match TicketWithMessages interface
      const transformedTickets = ticketsData.map(ticket => ({
        ...ticket,
        messages: (ticket as any).messages || []
      }));
      setTickets(transformedTickets);
    } catch (error) {
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setSubmitting(true);
      await createTicket({
        subject,
        description,
        priority: "medium",
        status: "open"
      });
      
      toast.success("Ticket created successfully");
      setNewTicketMode(false);
      setSubject("");
      setDescription("");
      fetchTickets();
    } catch (error) {
      toast.error("Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async (ticketId: string) => {
    if (!newMessage.trim()) return;

    try {
      setSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      await supabase.from('messages').insert([{
        ticket_id: ticketId,
        content: newMessage,
        sender_id: user.id
      }]);

      toast.success("Message sent successfully");
      setNewMessage("");
      fetchTickets();
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Customer Support Portal</h1>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Your Support Tickets</h2>
          <Button onClick={() => setNewTicketMode(true)} disabled={newTicketMode}>
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        </div>

        {newTicketMode && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Ticket</CardTitle>
              <CardDescription>
                Describe your issue and we'll get back to you as soon as possible
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="subject" className="text-sm font-medium">
                    Subject
                  </label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief description of your issue"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Description
                  </label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detailed description of your issue"
                    className="min-h-[150px]"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setNewTicketMode(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Ticket"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <Ticket className="h-5 w-5" />
                      Ticket {ticket.ticket_number}
                    </CardTitle>
                    <CardDescription>{ticket.subject}</CardDescription>
                  </div>
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
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {ticket.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex flex-col gap-2 rounded-lg p-4 ${
                        message.sender.email === currentUserEmail
                          ? "bg-primary/5 ml-8"
                          : "bg-muted mr-8"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {message.sender.full_name || message.sender.email}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <Button 
                    onClick={() => handleSendMessage(ticket.id)}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Send
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomerPortal;
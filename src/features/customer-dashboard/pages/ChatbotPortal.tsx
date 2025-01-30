import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
}

interface UserDetails {
  email: string;
  full_name: string;
  organization_name: string;
  domain?: string;
}

const ChatbotPortal = () => {
  const { workspaceId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [workspace, setWorkspace] = useState<{ name: string, id: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [tempUserDetails, setTempUserDetails] = useState<UserDetails>({
    email: '',
    full_name: '',
    organization_name: '',
    domain: ''
  });

  useEffect(() => {
    const fetchWorkspace = async () => {
      if (!workspaceId) {
        setError("No account ID provided");
        return;
      }

      try {
        const { data, error: workspaceError } = await supabase
          .from('accounts')
          .select('name, id')
          .eq('id', workspaceId)
          .single();

        if (workspaceError) {
          setError("Account not found");
          return;
        }

        setWorkspace(data);
        setError(null);
      } catch (err) {
        setError("Failed to load account");
      }
    };

    fetchWorkspace();
  }, [workspaceId]);

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempUserDetails.email || !tempUserDetails.full_name || 
        !tempUserDetails.organization_name) return;

    try {
      setLoading(true);
      
      // First create or get organization
      let organizationId;
      const { data: existingOrg } = await supabase
        .from('customer_companies')
        .select('id')
        .eq('name', tempUserDetails.organization_name)
        .eq('account_id', workspaceId)
        .single();

      if (existingOrg) {
        organizationId = existingOrg.id;
      } else if (workspace) {
        const { data: newOrg, error: orgError } = await supabase
          .from('customer_companies')
          .insert([{
            name: tempUserDetails.organization_name,
            account_id: workspaceId,
            domain: tempUserDetails.domain || null
          }])
          .select()
          .single();
          
        if (orgError) {
          console.error('Organization creation error:', orgError);
          throw new Error('Failed to create organization');
        }
        organizationId = newOrg.id;
      }

      // Create or get user in our users table
      let userId;
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', tempUserDetails.email)
        .single();

      if (existingUser) {
        userId = existingUser.id;
      } else if (organizationId) {
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert([{
            email: tempUserDetails.email,
            full_name: tempUserDetails.full_name,
            role: 'customer',
            organization_id: organizationId
          }])
          .select()
          .single();
          
        if (userError) {
          console.error('User creation error:', userError);
          throw new Error('Failed to create user');
        }
        userId = newUser.id;
      }

      setUserDetails({
        ...tempUserDetails,
        organization_name: tempUserDetails.organization_name
      });
      
      // Add welcome message
      setMessages([{
        id: '0',
        content: `Welcome ${tempUserDetails.full_name} from ${tempUserDetails.organization_name}! How can I help you today?`,
        isUser: false,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error(error instanceof Error ? error.message : "Failed to start chat");
    } finally {
      setLoading(false);
    }
  };

  const createSupportTicket = async () => {
    if (!workspace || !userDetails || messages.length < 2) return;

    try {
      // Get user
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('email', userDetails.email)
        .single();

      if (!user) throw new Error('User not found');

      // Get organization
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('name', userDetails.organization_name)
        .eq('workspace_id', workspaceId)
        .single();

      if (!org) throw new Error('Organization not found');

      // Create ticket with chat history
      const ticketDescription = messages
        .map(m => `${m.isUser ? 'Customer' : 'Bot'}: ${m.content}`)
        .join('\n');

      // Generate ticket number using the function
      const { data: ticketNumber } = await supabase
        .rpc('generate_ticket_number', { workspace_id: workspaceId });

      const { error: ticketError } = await supabase
        .from('tickets')
        .insert([{
          subject: "Chat Support Request",
          description: ticketDescription,
          priority: "medium",
          status: "open",
          customer_id: user.id,
          organization_id: org.id,
          workspace_id: workspaceId,
          ticket_number: ticketNumber
        }]);

      if (ticketError) throw ticketError;

      // Add confirmation message
      const confirmationMessage: Message = {
        id: Date.now().toString(),
        content: "I've created a support ticket for you. Our team will review your request and get back to you soon. You can close this chat window now.",
        isUser: false,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, confirmationMessage]);
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error("Failed to create support ticket");
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: newMessage,
      isUser: true,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage("");
    setLoading(true);

    try {
      // Store the message in Supabase
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('email', userDetails?.email)
        .single();

      if (user) {
        const { error: messageError } = await supabase
          .from('messages')
          .insert({
            content: newMessage,
            workspace_id: workspaceId,
            is_user_message: true,
            sender_id: user.id
          });

        if (messageError) throw messageError;
      }

      // Create ticket after user's first message
      if (messages.length === 1) {
        const botResponse: Message = {
          id: Date.now().toString(),
          content: "I understand your request. Let me create a support ticket for you to ensure our team can assist you properly.",
          isUser: false,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, botResponse]);
        await createSupportTicket();
      }
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Error</h2>
          <p className="mt-2 text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold">{workspace.name} Support</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="h-[600px] flex flex-col">
          <CardContent className="flex-1 flex flex-col p-4">
            <div className="flex-1 overflow-y-auto space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.isUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-4 flex gap-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message..."
                className="resize-none"
                rows={2}
              />
              <Button 
                onClick={handleSendMessage} 
                size="icon"
                disabled={loading || !newMessage.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChatbotPortal; 
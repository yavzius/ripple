import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicMessageThread } from "@/components/public-chat/PublicMessageThread";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Brand {
  id: string;
  name: string;
  slug: string;
}

export default function BrandChat() {
  const { brandSlug } = useParams();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    async function initializeChat() {
      try {
        // Fetch brand info
        const { data: brandData, error: brandError } = await supabase
          .from('accounts')
          .select('id, name, slug')
          .eq('slug', brandSlug)
          .single();

        if (brandError) throw brandError;
        if (!brandData) throw new Error('Brand not found');

        setBrand(brandData);

        // Create or get existing conversation
        const existingConversationId = localStorage.getItem(`chat_${brandData.id}`);
        
        if (existingConversationId) {
          // Verify the conversation exists and is active
          const { data: existingConv } = await supabase
            .from('conversations')
            .select('id, status')
            .eq('id', existingConversationId)
            .single();

          if (existingConv && existingConv.status !== 'closed') {
            setConversationId(existingConversationId);
            setIsLoading(false);
            return;
          }
        }

        // Create new conversation without customer
        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .insert({
            account_id: brandData.id,
            status: 'open',
            channel: 'web'
          })
          .select()
          .single();

        if (convError) throw convError;

        localStorage.setItem(`chat_${brandData.id}`, conversation.id);
        setConversationId(conversation.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load brand');
        toast.error('Failed to initialize chat');
      } finally {
        setIsLoading(false);
      }
    }

    if (brandSlug) {
      initializeChat();
    }
  }, [brandSlug]);

  const handleClearChat = async () => {
    if (!brand || !conversationId || isClearing) return;
    
    setIsClearing(true);
    try {
      // Close current conversation
      const { error: updateError } = await supabase
        .from('conversations')
        .update({ status: 'closed' })
        .eq('id', conversationId);

      if (updateError) throw updateError;

      // Remove from localStorage
      localStorage.removeItem(`chat_${brand.id}`);

      // Create new conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          account_id: brand.id,
          status: 'open',
          channel: 'web'
        })
        .select()
        .single();

      if (convError) throw convError;

      // Store new conversation ID
      localStorage.setItem(`chat_${brand.id}`, conversation.id);
      setConversationId(conversation.id);
      
      toast.success('Chat cleared successfully');
    } catch (err) {
      toast.error('Failed to clear chat');
      console.error('Error clearing chat:', err);
    } finally {
      setIsClearing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error || !brand || !conversationId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-gray-900">Brand Not Found</h1>
          <p className="text-gray-500">
            {error || "We couldn't find the brand you're looking for."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b p-4">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <h1 className="text-xl font-semibold">{brand.name}</h1>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Clear Chat
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear Chat History</AlertDialogTitle>
                <AlertDialogDescription>
                  This will clear your entire chat history. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearChat} disabled={isClearing}>
                  Clear Chat
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>
      
      <main className="flex-1 p-4">
        <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)]">
          <PublicMessageThread 
            conversationId={conversationId}
            key={conversationId} // Force re-mount when conversation changes
          />
        </div>
      </main>
    </div>
  );
} 
import { supabase } from '@/integrations/supabase/client';

interface AIResponse {
  response: string;
  confidence: number;
}

export async function generateCustomerSupportResponse(
  conversationContext: {
    messages: { content: string; sender_type: string }[];
    customer: { first_name: string | null; last_name: string | null };
    customer_company: { name: string };
  },
  metadata: {
    conversationId: string;
    customerId: string;
    companyId: string;
  }
): Promise<AIResponse> {
  const { data, error } = await supabase.functions.invoke('support-assistant', {
    body: {
      conversationContext,
      metadata,
    },
  });

  if (error) throw error;
  return data;
}

export async function analyzeCustomerSentiment(
  message: string,
  metadata: {
    messageId: string;
    conversationId: string;
  }
): Promise<number> {
  const { data, error } = await supabase.functions.invoke('sentiment-analysis', {
    body: {
      message,
      metadata,
    },
  });

  if (error) throw error;
  return data.happiness_score;
} 
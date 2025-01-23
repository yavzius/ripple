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
      action: 'generate-response',
      conversationContext,
      metadata,
    },
  });

  if (error) {
    console.error('Support assistant error:', error);
    throw error;
  }
  return data;
}

export async function analyzeCustomerSentiment(
  message: string,
  metadata: {
    messageId: string;
    conversationId: string;
  }
): Promise<number> {
  const { data, error } = await supabase.functions.invoke('support-assistant', {
    body: {
      action: 'analyze-sentiment',
      message,
      metadata,
    },
  });

  if (error) {
    console.error('Sentiment analysis error:', error);
    throw error;
  }
  return data.happiness_score;
} 
import { supabase } from '@/lib/supabase';

interface CreateOrderResponse {
    success: boolean;
    message: string;
    data?: any;
}
export async function createOrderService(
    prompt: string,
    accountId: string
): Promise<CreateOrderResponse> {
    if (!prompt.trim()) {
        throw new Error('Prompt is required');
    }
    const { data, error } = await supabase.functions.invoke('assistant', {
        body: { prompt, accountId }
    });
    if (error) throw error;
    return data as CreateOrderResponse;
}
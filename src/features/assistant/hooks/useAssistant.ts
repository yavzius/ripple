import { useMutation } from '@tanstack/react-query';
import { createOrderService } from '../services/sendCommand';

export function useAssistant() {
    return useMutation({
        mutationFn: ({ prompt, accountId }: { prompt: string; accountId: string }) =>
            createOrderService(prompt, accountId),
        onError: (error) => {
            console.error('Error using assistant:', error);
        }
    });
}
import { useState } from 'react';
import { useAssistant } from './useAssistant';
import { useWorkspace } from '@/hooks/use-workspace';

export function useCommandSubmission() {
  const [prompt, setPrompt] = useState('');
  const { workspace } = useWorkspace();
  const assistantMutation = useAssistant();

  const handleSubmitCommand = async (prompt: string) => {
    if (!prompt.trim()) {
      return;
    }
    try {
      await assistantMutation.mutateAsync({
        prompt,
        accountId: workspace.id
      });
    } catch (error) {
      console.error('Failed to submit command:', error);
    }
  };

  return {
    prompt,
    setPrompt,
    handleSubmitCommand,
    isSubmitting: assistantMutation.isPending
  };
} 
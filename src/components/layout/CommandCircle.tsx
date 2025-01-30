import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { useWorkspace } from '@/hooks/use-workspace';
import { useAssistant } from '@/features/assistant/hooks/useAssistant';

interface CommandCircleProps {
  className?: string;
}

export function CommandCircle({ className }: CommandCircleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const { workspace } = useWorkspace();

  const assistantMutation = useAssistant();

  const handleCreateOrder = async (prompt: string) => {
    if (!prompt.trim()) {
      setAlertMessage("Please enter a prompt");
      return;
    }
    setAlertMessage(null);
    try {
      const result = await assistantMutation.mutateAsync({
        prompt,
        accountId: workspace.id
      });
      if (result.success) {
        setAlertMessage(result.message);
        setPrompt('');
      }
    } catch (error) {
      setAlertMessage("Failed to create order. Please try again.");
    }
  };
  return (
    <div className={cn("fixed bottom-6 right-6 z-50", className)}>
      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Trigger asChild>
          <button
            className="h-16 w-16 rounded-full bg-gradient-to-r from-primary to-primary/80
shadow-lg animate-pulse-slow hover:scale-110 transition-transform
focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="Create Order"
          >
            <span className="sr-only">What would you like me to do?</span>
            <svg
              className="w-8 h-8 text-primary-foreground mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-background/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed bottom-24 right-6 w-[400px] rounded-lg bg-card p-6 shadow-lg border border-border
data-[state=open]:animate-in data-[state=closed]:animate-out
data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
data-[state=closed]:slide-out-to-right-1/2 data-[state=open]:slide-in-from-right-1/2">
            <Dialog.Title className="text-lg font-semibold text-foreground mb-4">
              Enter request
            </Dialog.Title>
            <div className="space-y-4">
              <textarea
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm
placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="What would you like me to do?"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={assistantMutation.isPending}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleCreateOrder(prompt);
                  }
                }}
              />
              {alertMessage && (
                <div className="text-sm text-red-600">
                  {alertMessage}
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <Dialog.Close className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm
font-medium border border-input bg-background hover:bg-accent
hover:text-accent-foreground focus:outline-none focus:ring-2
focus:ring-primary focus:ring-offset-2">
                  Cancel
                </Dialog.Close>
                <button
                  onClick={() => handleCreateOrder(prompt)}
                  disabled={assistantMutation.isPending}
                  className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm
font-medium bg-primary text-primary-foreground hover:bg-primary/90
focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {assistantMutation.isPending ? 'Loading...' : 'Submit'}
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
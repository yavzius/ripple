import { useToast } from "@/hooks/use-toast";

export function useClipboard() {
  const { toast } = useToast();

  const copyToClipboard = async (text: string, message = "Copied to clipboard") => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Success",
        description: message,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return { copyToClipboard };
} 
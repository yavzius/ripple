import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, Paperclip, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type SenderType = 'customer' | 'agent' | 'system';

interface PublicMessageThreadProps {
  conversationId: string;
}

interface Attachment {
  id: string;
  file_name: string;
  file_path: string;
  content_type: string;
  file_size: number;
  url?: string;
}

interface Message {
  id: string;
  content: string;
  sender_type: SenderType;
  created_at: string | null;
  attachments?: Attachment[];
}

const MESSAGE_RATE_LIMIT = 2000; // 2 seconds between messages
const MAX_MESSAGES_PER_MINUTE = 30;

export function PublicMessageThread({ conversationId }: PublicMessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const lastMessageTime = useRef<number>(0);
  const messageCountRef = useRef<{ count: number; resetTime: number }>({
    count: 0,
    resetTime: Date.now()
  });

  const fetchMessages = useCallback(async () => {
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select(`
          id,
          content,
          sender_type,
          created_at,
          message_attachments (
            id,
            file_name,
            file_path,
            content_type,
            file_size
          )
        `)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (messagesError) throw messagesError;

      if (!messagesData) {
        setMessages([]);
        setIsLoading(false);
        return;
      }

      const transformedMessages: Message[] = messagesData.map((msg) => ({
        id: msg.id,
        content: msg.content,
        sender_type: msg.sender_type as SenderType,
        created_at: msg.created_at,
        attachments: msg.message_attachments?.map(att => ({
          ...att,
          url: supabase.storage
            .from('attachments')
            .getPublicUrl(att.file_path)
            .data.publicUrl
        }))
      }));

      setMessages(transformedMessages);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    let isSubscribed = true;

    const loadInitialData = async () => {
      if (isSubscribed) {
        await fetchMessages();
      }
    };

    loadInitialData();

    // Subscribe to new messages
    const channel = supabase
      .channel(`public_thread_${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          if (!isSubscribed) return;

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const { data: newMessage, error } = await supabase
              .from("messages")
              .select(`
                id,
                content,
                sender_type,
                created_at,
                message_attachments (
                  id,
                  file_name,
                  file_path,
                  content_type,
                  file_size
                )
              `)
              .eq("id", payload.new.id)
              .single();

            if (!error && newMessage) {
              const messageWithUrls: Message = {
                id: newMessage.id,
                content: newMessage.content,
                sender_type: newMessage.sender_type as SenderType,
                created_at: newMessage.created_at,
                attachments: newMessage.message_attachments?.map(attachment => ({
                  ...attachment,
                  url: supabase.storage
                    .from('attachments')
                    .getPublicUrl(attachment.file_path)
                    .data.publicUrl
                }))
              };

              setMessages(prev => {
                const index = prev.findIndex(m => m.id === messageWithUrls.id);
                if (index === -1) {
                  return [...prev, messageWithUrls];
                }
                const newMessages = [...prev];
                newMessages[index] = messageWithUrls;
                return newMessages;
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      isSubscribed = false;
      channel.unsubscribe();
    };
  }, [conversationId, fetchMessages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Maximum size is 5MB.`);
        return false;
      }
      
      // Check file type (images and PDFs only)
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        toast.error(`File ${file.name} is not supported. Only images and PDFs are allowed.`);
        return false;
      }
      
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const uploadFiles = async (messageId: string) => {
    const uploadPromises = selectedFiles.map(async (file, index) => {
      try {
        setUploadProgress((index + 1) / selectedFiles.length * 100);
        const filePath = `${conversationId}/${messageId}/${file.name}`;
        
        const { data, error } = await supabase.storage
          .from('attachments')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (error) throw error;

        // Create attachment record
        const { error: attachmentError } = await supabase
          .from('message_attachments')
          .insert({
            message_id: messageId,
            file_path: filePath,
            file_name: file.name,
            file_size: file.size,
            content_type: file.type
          });

        if (attachmentError) throw attachmentError;

        return data;
      } catch (error) {
        toast.error(`Failed to upload ${file.name}`);
        throw error;
      }
    });

    try {
      await Promise.all(uploadPromises);
      setSelectedFiles([]);
      setUploadProgress(0);
      toast.success('Files uploaded successfully');
    } catch (error) {
      console.error('Error uploading files:', error);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const checkRateLimit = useCallback(() => {
    const now = Date.now();
    
    // Check minimum time between messages
    if (now - lastMessageTime.current < MESSAGE_RATE_LIMIT) {
      toast.error('Please wait a moment before sending another message');
      return false;
    }

    // Check messages per minute
    if (now - messageCountRef.current.resetTime > 60000) {
      // Reset counter if more than a minute has passed
      messageCountRef.current = {
        count: 0,
        resetTime: now
      };
    }

    if (messageCountRef.current.count >= MAX_MESSAGES_PER_MINUTE) {
      toast.error('You have sent too many messages. Please wait a moment.');
      return false;
    }

    return true;
  }, []);

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && selectedFiles.length === 0) || isSending) return;

    // Check rate limit
    if (!checkRateLimit()) return;

    setIsSending(true);
    try {
      // Insert message
      const { data: message, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          content: newMessage,
          sender_type: "customer",
        })
        .select()
        .single();

      if (error) throw error;

      // Upload files if any
      if (selectedFiles.length > 0) {
        await uploadFiles(message.id);
      }

      // Update rate limit tracking
      lastMessageTime.current = Date.now();
      messageCountRef.current.count++;

      // Clear the input
      setNewMessage("");
      setSelectedFiles([]);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderAttachment = (attachment: Message['attachments'][0]) => {
    const isImage = attachment.content_type.startsWith('image/');
    const fileUrl = attachment.url;

    if (!fileUrl) return null;

    if (isImage) {
      return (
        <a 
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block max-w-[200px] mt-2"
        >
          <img 
            src={fileUrl} 
            alt={attachment.file_name}
            className="rounded-md border border-gray-200"
          />
        </a>
      );
    }

    return (
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 mt-2"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
        {attachment.file_name}
        <span className="text-gray-500 text-xs">
          ({Math.round(attachment.file_size / 1024)}KB)
        </span>
      </a>
    );
  };

  if (isLoading) {
    return <div className="p-4">Loading messages...</div>;
  }

  return (
    <Card className="flex flex-col h-full">
      <CardContent className="flex flex-col h-[calc(100%-1rem)] pt-6">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex flex-col",
                  message.sender_type === "customer" ? "items-end" : "items-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg p-4",
                    message.sender_type === "customer"
                      ? "bg-blue-100"
                      : "bg-gray-100"
                  )}
                >
                  <p className="text-sm">{message.content}</p>
                  {message.attachments?.map(attachment => (
                    <div key={attachment.id}>
                      {renderAttachment(attachment)}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-gray-500 mt-1">
                  {new Date(message.created_at!).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="border-t pt-4 mt-auto space-y-2">
          {/* Show selected files */}
          {selectedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-gray-100 rounded-md p-2 text-sm"
                >
                  <Paperclip className="h-4 w-4 text-gray-500" />
                  <span className="max-w-[150px] truncate">{file.name}</span>
                  <button
                    onClick={() => removeSelectedFile(index)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload progress */}
          {uploadProgress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={isSending}
              className="shrink-0"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              multiple
              accept="image/*,.pdf"
              onChange={handleFileSelect}
            />
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 min-h-[40px]"
              rows={1}
            />
            <Button
              onClick={handleSendMessage}
              disabled={(!newMessage.trim() && selectedFiles.length === 0) || isSending}
              className="shrink-0"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 
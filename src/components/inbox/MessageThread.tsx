import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Building2, User, Loader2, CheckCircle2, Pencil, Trash2, Paperclip, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { analyzeCustomerSentiment as analyzeSentiment, generateCustomerSupportResponse } from "@/lib/langsmith-service";
import { updateConversationStatus } from "@/lib/actions";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface MessageThreadProps {
  conversationId: string;
}

interface Message {
  id: string;
  content: string;
  sender_type: string;
  created_at: string | null;
  attachments?: {
    id: string;
    file_name: string;
    file_path: string;
    content_type: string;
    file_size: number;
    url?: string;
  }[];
}

interface ConversationDetails {
  id: string;
  status: string;
  channel: string;
  customer: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    customer_company: {
      id: string;
      name: string;
    } | null;
  };
}

const statusColors = {
  open: "bg-green-100 text-green-800",
  resolved: "bg-blue-100 text-blue-800",
  closed: "bg-gray-100 text-gray-800",
} as const;

export function MessageThread({ conversationId }: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<ConversationDetails | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [editContainerWidth, setEditContainerWidth] = useState<number | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  useEffect(() => {
    const fetchConversation = async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          *,
          customer:customer_id (
            id,
            first_name,
            last_name,
            customer_company:customer_company_id (
              id,
              name
            )
          )
        `)
        .eq("id", conversationId)
        .single();

      if (error) {
        console.error("Error fetching conversation:", error);
        return;
      }

      setConversation(data);
    };

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          attachments:message_attachments (
            id,
            file_name,
            file_path,
            content_type,
            file_size
          )
        `)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        toast.error("Failed to load messages");
        return;
      }

      // Update messages with attachment URLs
      const messagesWithAttachments = data?.map(message => ({
        ...message,
        attachments: message.attachments?.map(attachment => ({
          ...attachment,
          url: supabase.storage
            .from('attachments')
            .getPublicUrl(attachment.file_path)
            .data.publicUrl
        }))
      })) || [];

      setMessages(messagesWithAttachments);
      setIsLoading(false);
    };

    fetchConversation();
    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Skip if this is our own message (we'll handle it in handleSendMessage)
          if (payload.new.sender_type === 'agent') return;

          const { data: messageWithAttachments, error } = await supabase
            .from("messages")
            .select(`
              *,
              attachments:message_attachments (
                id,
                file_name,
                file_path,
                content_type,
                file_size
              )
            `)
            .eq("id", payload.new.id)
            .single();

          if (error) {
            console.error("Error fetching message details:", error);
            return;
          }

          const messageWithUrls = {
            ...messageWithAttachments,
            attachments: messageWithAttachments.attachments?.map(attachment => ({
              ...attachment,
              url: supabase.storage
                .from('attachments')
                .getPublicUrl(attachment.file_path)
                .data.publicUrl
            }))
          };

          setMessages(prev => [...prev, messageWithUrls]);

          // Process customer messages with AI
          if (messageWithUrls.sender_type === "customer" && conversation?.customer) {
            setIsAIProcessing(true);
            try {
              // Analyze sentiment
              const happinessScore = await analyzeSentiment(messageWithUrls.content, {
                messageId: messageWithUrls.id,
                conversationId,
              });

              // Update conversation happiness score
              await supabase
                .from("conversations")
                .update({ happiness_score: happinessScore })
                .eq("id", conversationId);

              // Generate AI response
              const aiResponse = await generateCustomerSupportResponse(
                {
                  messages: messages.concat(messageWithUrls),
                  customer: conversation.customer,
                  customer_company: conversation.customer.customer_company!,
                },
                {
                  conversationId,
                  customerId: conversation.customer.id,
                  companyId: conversation.customer.customer_company!.id,
                }
              );

              if (aiResponse.confidence >= 0.8) {
                // Insert AI response
                await supabase.from("messages").insert({
                  conversation_id: conversationId,
                  content: aiResponse.response,
                  sender_type: "ai",
                });

                // Update conversation status
                await supabase
                  .from("conversations")
                  .update({
                    status: "resolved",
                    resolved_at: new Date().toISOString(),
                  })
                  .eq("id", conversationId);
              } else {
                // Create a ticket for human review
                await supabase.from("tickets").insert({
                  account_id: conversation.customer.customer_company!.id,
                  conversation_id: conversationId,
                  status: "open",
                  priority: "medium",
                  title: "AI Confidence Low - Human Review Required",
                  description: `AI confidence (${aiResponse.confidence}) below threshold.\nLast message: ${messageWithUrls.content}`,
                });
              }
            } catch (error) {
              console.error("Error processing AI response:", error);
            } finally {
              setIsAIProcessing(false);
            }
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId]);

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

        if (error) {
          console.error('Error uploading file:', error);
          throw error;
        }

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

        if (attachmentError) {
          console.error('Error creating attachment record:', attachmentError);
          throw attachmentError;
        }

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

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && selectedFiles.length === 0) || isSending) return;

    setIsSending(true);
    try {
      // Insert message first
      const { data: message, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          content: newMessage,
          sender_type: "agent",
        })
        .select()
        .single();

      if (error) throw error;

      // Upload files if any
      if (selectedFiles.length > 0) {
        await uploadFiles(message.id);
      }

      // Fetch the updated message with attachments
      const { data: updatedMessage, error: fetchError } = await supabase
        .from("messages")
        .select(`
          *,
          attachments:message_attachments (
            id,
            file_name,
            file_path,
            content_type,
            file_size
          )
        `)
        .eq("id", message.id)
        .single();

      if (fetchError) throw fetchError;

      // Add URLs to attachments
      const messageWithUrls = {
        ...updatedMessage,
        attachments: updatedMessage.attachments?.map(attachment => ({
          ...attachment,
          url: supabase.storage
            .from('attachments')
            .getPublicUrl(attachment.file_path)
            .data.publicUrl
        }))
      };

      // Update messages state directly (skip subscription)
      setMessages(prev => [...prev, messageWithUrls]);
      setNewMessage("");
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

  const handleResolve = async (status: 'open' | 'resolved' | 'closed') => {
    if (!conversation || isResolving) return;
    setIsResolving(true);
    
    try {
      const { success, error } = await updateConversationStatus(conversation.id, status);
      if (success) {
        setConversation(prev => prev ? { ...prev, status } : null);
        toast.success('Conversation updated successfully');
      } else {
        throw error;
      }
    } catch (error) {
      toast.error('Failed to update conversation');
      console.error('Error updating conversation:', error);
    } finally {
      setIsResolving(false);
    }
  };

  const handleEditMessage = async (messageId: string, event: React.MouseEvent) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;
    
    // Get the message container element and its width
    const container = (event.currentTarget as HTMLElement).closest('.message-container') as HTMLDivElement;
    if (container) {
      setEditContainerWidth(container.offsetWidth);
    }
    
    setEditingMessageId(messageId);
    setEditedContent(message.content);
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId) return;
    
    try {
      const { error } = await supabase
        .from("messages")
        .update({ content: editedContent })
        .eq("id", editingMessageId);

      if (error) throw error;

      setMessages(prev => prev.map(message => 
        message.id === editingMessageId 
          ? { ...message, content: editedContent }
          : message
      ));
      
      toast.success("Message updated successfully");
    } catch (error) {
      toast.error("Failed to update message");
    } finally {
      setEditingMessageId(null);
      setEditedContent("");
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditedContent("");
  };

  const handleDeleteMessage = async () => {
    if (!messageToDelete) return;
    
    try {
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", messageToDelete);

      if (error) throw error;

      setMessages(prev => prev.filter(message => message.id !== messageToDelete));
      toast.success("Message deleted successfully");
    } catch (error) {
      toast.error("Failed to delete message");
    } finally {
      setMessageToDelete(null);
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

  if (!conversation) {
    return <div className="p-4">Conversation not found</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {conversation?.customer?.customer_company?.name || 'Loading...'}
            </CardTitle>
            <Badge variant="outline" className={cn(
              conversation?.status && statusColors[conversation.status as keyof typeof statusColors]
            )}>
              {conversation?.status || 'Loading...'}
            </Badge>
          </div>
          {conversation?.status === 'resolved' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleResolve('open')}
              disabled={isResolving}
              className="gap-2"
            >
              {isResolving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Unresolve
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleResolve('resolved')}
              disabled={isResolving}
              className="gap-2"
            >
              {isResolving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Resolve
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col h-[calc(100%-8rem)]">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex flex-col relative group pt-8",
                  message.sender_type === "customer" ? "items-start" : "items-end"
                )}
              >
                {message.sender_type !== "customer" && editingMessageId !== message.id && (
                  <div className="absolute top-0 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 bg-gray-100/90 hover:bg-gray-200/90"
                      onClick={(e) => handleEditMessage(message.id, e)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 bg-gray-100/90 hover:bg-gray-200/90"
                      onClick={() => setMessageToDelete(message.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg p-4 relative message-container w-full",
                    message.sender_type === "customer"
                      ? "bg-gray-100"
                      : "bg-blue-100"
                  )}
                >
                  {editingMessageId === message.id ? (
                    <div className="w-full">
                      <Textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="mb-2 w-full"
                      />
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleSaveEdit}>
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm">{message.content}</p>
                  )}
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
            {isAIProcessing && (
              <div className="flex justify-center">
                <Badge variant="secondary" className="gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  AI is analyzing the conversation...
                </Badge>
              </div>
            )}
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
      <AlertDialog open={messageToDelete !== null} onOpenChange={() => setMessageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this AI message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMessage}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 
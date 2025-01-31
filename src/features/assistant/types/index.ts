export interface AssistantUpdate {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface AssistantCommandProps {
  prompt: string;
  accountId: string;
} 
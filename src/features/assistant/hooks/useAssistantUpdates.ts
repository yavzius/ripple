import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { AssistantUpdate } from '../types';

export function useAssistantUpdates(userId: string | undefined) {
  const sessionStartTime = useRef(new Date());
  const queryClient = useQueryClient();

  // Fetch the latest assistant update
  const { data: latestUpdate } = useQuery({
    queryKey: ['assistant-updates', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('assistant_updates')
        .select('*')
        .eq('user_id', userId)
        .gt('created_at', sessionStartTime.current.toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') return null;
      return data as AssistantUpdate | null;
    },
    enabled: !!userId
  });

  // Subscribe to real-time updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('assistant-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'assistant_updates',
          filter: `user_id=eq.${userId}`
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['assistant-updates', userId] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return { latestUpdate };
} 
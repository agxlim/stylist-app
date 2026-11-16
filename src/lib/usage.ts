import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'
import { useAuth } from './auth'

export interface Usage {
  tier: 'free' | 'plus'
  outfit_reviews: number
  chat_messages: number
  outfit_review_limit: number | null
  chat_message_limit: number | null
}

export function useUsage() {
  const userId = useAuth().session?.user.id
  return useQuery({
    queryKey: ['usage', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('my_usage')
      if (error) throw error
      return data as Usage
    },
  })
}

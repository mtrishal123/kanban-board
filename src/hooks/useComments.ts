import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface Comment {
  id: string
  task_id: string
  content: string
  user_id: string
  member_id?: string
  created_at: string
  team_members?: {
    name: string
    color: string
  }
}

export function useComments(taskId: string) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)

  const fetchComments = useCallback(async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*, team_members(name, color)')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })

    if (!error && data) setComments(data)
    setLoading(false)
  }, [taskId])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const addComment = async (
    content: string,
    userId: string,
    memberId?: string
  ) => {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        task_id: taskId,
        content,
        user_id: userId,
        member_id: memberId,
      })
      .select('*, team_members(name, color)')
      .single()

    if (!error && data) setComments(prev => [...prev, data])
    return { data, error }
  }

  const deleteComment = async (id: string) => {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id)

    if (!error) setComments(prev => prev.filter(c => c.id !== id))
    return { error }
  }

  return { comments, loading, addComment, deleteComment }
}
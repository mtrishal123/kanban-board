import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface ActivityEntry {
  id: string
  task_id: string
  user_id: string
  action: string
  meta?: Record<string, any>
  created_at: string
}

export function useActivityLog(taskId: string) {
  const [entries, setEntries] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchEntries = useCallback(async () => {
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })

    if (!error && data) setEntries(data)
    setLoading(false)
  }, [taskId])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  const logActivity = async (
    userId: string,
    action: string,
    meta?: Record<string, any>
  ) => {
    const { data, error } = await supabase
      .from('activity_log')
      .insert({ task_id: taskId, user_id: userId, action, meta })
      .select()
      .single()

    if (!error && data) setEntries(prev => [...prev, data])
    return { data, error }
  }

  return { entries, loading, logActivity }
}
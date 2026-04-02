import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface TeamMember {
  id: string
  name: string
  color: string
  user_id: string
  created_at: string
}

export function useTeamMembers(userId: string | undefined) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMembers = useCallback(async () => {
    if (!userId) return
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (!error && data) setMembers(data)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const createMember = async (name: string, color: string) => {
    if (!userId) return
    const { data, error } = await supabase
      .from('team_members')
      .insert({ name, color, user_id: userId })
      .select()
      .single()

    if (!error && data) setMembers(prev => [...prev, data])
    return { data, error }
  }

  const deleteMember = async (id: string) => {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id)

    if (!error) setMembers(prev => prev.filter(m => m.id !== id))
    return { error }
  }

  return { members, loading, createMember, deleteMember, refetch: fetchMembers }
}
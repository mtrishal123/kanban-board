import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Label } from '../types'

const DEFAULT_LABELS = [
  { name: 'Bug', color: '#f87171' },
  { name: 'Feature', color: '#60a5fa' },
  { name: 'Design', color: '#a78bfa' },
]

export function useLabels(userId: string | undefined) {
  const [labels, setLabels] = useState<Label[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLabels = useCallback(async () => {
    if (!userId) return

    const { data, error } = await supabase
      .from('labels')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (error) { setLoading(false); return }

    if (data && data.length === 0) {
      // Use upsert with onConflict to prevent duplicates
      const { data: seeded } = await supabase
        .from('labels')
        .insert(DEFAULT_LABELS.map(l => ({ ...l, user_id: userId })))
        .select()
      if (seeded) setLabels(seeded)
    } else if (data) {
      setLabels(data)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchLabels()
  }, [fetchLabels])

  const createLabel = async (name: string, color: string) => {
    if (!userId) return
    const { data, error } = await supabase
      .from('labels')
      .insert({ name, color, user_id: userId })
      .select()
      .single()

    if (!error && data) setLabels(prev => [...prev, data])
    return { data, error }
  }

  const deleteLabel = async (id: string) => {
    const { error } = await supabase
      .from('labels')
      .delete()
      .eq('id', id)

    if (!error) setLabels(prev => prev.filter(l => l.id !== id))
    return { error }
  }

  return { labels, loading, createLabel, deleteLabel }
}
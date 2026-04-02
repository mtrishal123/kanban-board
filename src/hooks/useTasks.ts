import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Task, Status } from '../types/index'

export function useTasks(userId: string | undefined) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    if (!userId) return
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, task_labels(label_id, labels(*)), assignee_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

      if (error) throw error

      const formatted = data.map((task: any) => ({
        ...task,
        labels: task.task_labels
          ?.map((tl: any) => tl.labels)
          .filter(Boolean) ?? []
      }))

      setTasks(formatted)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const createTask = async (task: Partial<Task>) => {
    if (!userId) return
    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...task, user_id: userId })
      .select()
      .single()

    if (!error && data) {
      setTasks(prev => [...prev, { ...data, labels: [] }])
    }
    return { data, error }
  }

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)

    if (!error) {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
    }
    return { error }
  }

  const deleteTask = async (id: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (!error) {
      setTasks(prev => prev.filter(t => t.id !== id))
    }
    return { error }
  }

  const moveTask = async (id: string, status: Status) => {
    return updateTask(id, { status })
  }

  return { tasks, loading, error, createTask, updateTask, deleteTask, moveTask, refetch: fetchTasks }
}
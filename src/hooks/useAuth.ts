import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      // Try to get existing session
      const { data: { session: existingSession } } = await supabase.auth.getSession()

      if (existingSession?.user) {
        setSession(existingSession)
        setLoading(false)
        return
      }

      // Try to restore from stored token
      const stored = localStorage.getItem('kanban-session')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          const { data, error } = await supabase.auth.setSession({
            access_token: parsed.access_token,
            refresh_token: parsed.refresh_token,
          })
          if (!error && data.session) {
            setSession(data.session)
            setLoading(false)
            return
          }
        } catch (_) {
          // stored session invalid, fall through to create new
        }
      }

      // Last resort: create new anonymous session
      const { data, error } = await supabase.auth.signInAnonymously()
      if (!error && data.session) {
        setSession(data.session)
      }
      setLoading(false)
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) setSession(session)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { session, loading, userId: session?.user?.id }
}
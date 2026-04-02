import { useState, useRef, useEffect } from 'react'
import type { ActiveFilters } from '../types/filters'
import { hasActiveFilters } from '../types/filters'
import type { TeamMember } from '../hooks/useTeamMembers'
import type { Label } from '../types'
import styles from './FilterPanel.module.css'

const PRIORITIES = [
  { value: 'high' as const, label: 'High', color: '#f87171' },
  { value: 'normal' as const, label: 'Normal', color: '#60a5fa' },
  { value: 'low' as const, label: 'Low', color: '#4ade80' },
]

interface Props {
  filters: ActiveFilters
  members: TeamMember[]
  labels: Label[]
  onChange: (filters: ActiveFilters) => void
}

export function FilterPanel({ filters, members, labels, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isActive = hasActiveFilters(filters)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const togglePriority = (p: 'low' | 'normal' | 'high') => {
    const next = filters.priorities.includes(p)
      ? filters.priorities.filter(x => x !== p)
      : [...filters.priorities, p]
    onChange({ ...filters, priorities: next })
  }

  const toggleAssignee = (id: string) => {
    const next = filters.assigneeIds.includes(id)
      ? filters.assigneeIds.filter(x => x !== id)
      : [...filters.assigneeIds, id]
    onChange({ ...filters, assigneeIds: next })
  }

  const toggleLabel = (id: string) => {
    const next = filters.labelIds.includes(id)
      ? filters.labelIds.filter(x => x !== id)
      : [...filters.labelIds, id]
    onChange({ ...filters, labelIds: next })
  }

  const clearAll = () => {
    onChange({ priorities: [], assigneeIds: [], labelIds: [] })
    setOpen(false)
  }

  return (
    <div className={styles.wrapper} ref={ref}>
      <button
        className={`${styles.trigger} ${isActive ? styles.triggerActive : ''}`}
        onClick={() => setOpen(prev => !prev)}
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
          <path d="M2 4h12M4 8h8M6 12h4"
            stroke={isActive ? 'var(--accent)' : '#666880'}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        Filter
        {isActive && (
          <span style={{
            background: 'var(--accent)',
            color: 'white',
            borderRadius: '10px',
            padding: '0 5px',
            fontSize: '10px',
            fontWeight: 500,
          }}>
            {filters.priorities.length + filters.assigneeIds.length + filters.labelIds.length}
          </span>
        )}
      </button>

      {open && (
        <div className={styles.dropdown}>
          {/* Priority */}
          <div className={styles.section}>
            <p className={styles.sectionLabel}>Priority</p>
            {PRIORITIES.map(p => (
              <div
                key={p.value}
                className={`${styles.option} ${filters.priorities.includes(p.value) ? styles.optionSelected : ''}`}
                onClick={() => togglePriority(p.value)}
              >
                <div className={styles.optionDot} style={{ background: p.color }} />
                {p.label}
                {filters.priorities.includes(p.value) && (
                  <svg className={styles.check} width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6L5 9L10 3" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            ))}
          </div>

          {members.length > 0 && (
            <>
              <div className={styles.divider} />
              <div className={styles.section}>
                <p className={styles.sectionLabel}>Assignee</p>
                {members.map(m => (
                  <div
                    key={m.id}
                    className={`${styles.option} ${filters.assigneeIds.includes(m.id) ? styles.optionSelected : ''}`}
                    onClick={() => toggleAssignee(m.id)}
                  >
                    <div className={styles.optionAvatar} style={{ background: m.color }}>
                      {m.name.slice(0, 2).toUpperCase()}
                    </div>
                    {m.name}
                    {filters.assigneeIds.includes(m.id) && (
                      <svg className={styles.check} width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6L5 9L10 3" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {labels.length > 0 && (
            <>
              <div className={styles.divider} />
              <div className={styles.section}>
                <p className={styles.sectionLabel}>Label</p>
                {labels.map(l => (
                  <div
                    key={l.id}
                    className={`${styles.option} ${filters.labelIds.includes(l.id) ? styles.optionSelected : ''}`}
                    onClick={() => toggleLabel(l.id)}
                  >
                    <div className={styles.optionDot} style={{ background: l.color }} />
                    {l.name}
                    {filters.labelIds.includes(l.id) && (
                      <svg className={styles.check} width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6L5 9L10 3" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {isActive && (
            <>
              <div className={styles.divider} />
              <button className={styles.clearBtn} onClick={clearAll}>
                Clear all filters
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
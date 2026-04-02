import { useState } from 'react'
import type { TeamMember } from '../hooks/useTeamMembers'
import styles from './TeamMembersPanel.module.css'

const COLORS = [
  '#7c6af7', '#f472b6', '#34d399', '#f59e0b',
  '#60a5fa', '#f87171', '#a78bfa', '#2dd4bf',
]

interface Props {
  members: TeamMember[]
  onClose: () => void
  onCreate: (name: string, color: string) => Promise<any>
  onDelete: (id: string) => Promise<any>
}

export function TeamMembersPanel({ members, onClose, onCreate, onDelete }: Props) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) return
    setLoading(true)
    await onCreate(name.trim(), color)
    setName('')
    setColor(COLORS[0])
    setLoading(false)
  }

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.panel}>
        <div className={styles.header}>
          <span className={styles.title}>Team Members</span>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.body}>
          {members.length === 0 ? (
            <p className={styles.emptyState}>No team members yet</p>
          ) : (
            members.map(member => (
              <div key={member.id} className={styles.memberRow}>
                <div
                  className={styles.avatar}
                  style={{ background: member.color }}
                >
                  {member.name.slice(0, 2).toUpperCase()}
                </div>
                <span className={styles.memberName}>{member.name}</span>
                <button
                  className={styles.deleteBtn}
                  onClick={() => onDelete(member.id)}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>

        <div className={styles.addForm}>
          <p className={styles.addFormTitle}>Add Member</p>
          <input
            className={styles.input}
            placeholder="Full name"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
          <div className={styles.colorOptions}>
            {COLORS.map(c => (
              <div
                key={c}
                className={`${styles.colorSwatch} ${color === c ? styles.colorSwatchSelected : ''}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
          <button
            className={styles.addBtn}
            onClick={handleCreate}
            disabled={!name.trim() || loading}
          >
            {loading ? 'Adding...' : 'Add Member'}
          </button>
        </div>
      </div>
    </>
  )
}
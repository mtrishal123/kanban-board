import { useState } from 'react'
import type { Priority, Status } from '../types/index'
import styles from './AddTaskModal.module.css'

interface Props {
  initialStatus: Status
  onClose: () => void
  onAdd: (task: {
    title: string
    description?: string
    priority: Priority
    status: Status
    due_date?: string
  }) => Promise<void>
}

export function AddTaskModal({ initialStatus, onClose, onAdd }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('normal')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim()) return
    setLoading(true)
    await onAdd({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      status: initialStatus,
      due_date: dueDate || undefined,
    })
    setLoading(false)
    onClose()
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>New Task</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <input
          autoFocus
          className={styles.input}
          placeholder="Task title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />

        <textarea
          className={styles.textarea}
          placeholder="Description (optional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
        />

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Priority</label>
            <select
              className={styles.select}
              value={priority}
              onChange={e => setPriority(e.target.value as Priority)}
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Due Date</label>
            <input
              type="date"
              className={styles.dateInput}
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={!title.trim() || loading}
          >
            {loading ? 'Adding...' : 'Add Task'}
          </button>
        </div>

      </div>
    </div>
  )
}
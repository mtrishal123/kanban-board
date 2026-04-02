import styles from './DueDateBadge.module.css'

interface Props {
  dueDate?: string
  isDone?: boolean
}

export function DueDateBadge({ dueDate, isDone }: Props) {
  if (!dueDate) return null

  const due = new Date(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)

  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const formatted = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const getClass = () => {
    if (isDone) return styles.done
    if (diffDays < 0) return styles.overdue
    if (diffDays <= 2) return styles.soon
    return styles.normal
  }

  return (
    <span className={`${styles.date} ${getClass()}`}>
      {formatted}
    </span>
  )
}
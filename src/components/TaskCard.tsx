import type { Task } from '../types/index'
import { DueDateBadge } from './DueDateBadge'
import { LabelBadge } from './LabelBadge'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import styles from './TaskCard.module.css'
import type { TeamMember } from '../hooks/useTeamMembers'

interface Props {
  task: Task
  members: TeamMember[]
  onClick: (task: Task) => void
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'var(--priority-high-text)',
  normal: 'var(--priority-normal-text)',
  low: 'var(--priority-low-text)',
}

const PRIORITY_LABELS: Record<string, string> = {
  high: 'High',
  normal: 'Normal',
  low: 'Low',
}

export function TaskCard({ task, members, onClick }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const isDone = task.status === 'done'
  const assignee = task.assignee_id
    ? members.find(m => m.id === task.assignee_id)
    : null
  const priorityColor = PRIORITY_COLORS[task.priority]

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? 'none' : transition,
      }}
      className={`${styles.card} ${styles[`priority_${task.priority}`]} ${isDragging ? styles.dragging : ''}`}
      {...attributes}
      {...listeners}
      onClick={() => onClick(task)}
    >
      {/* Title */}
      <p className={`${styles.title} ${isDone ? styles.titleDone : ''}`}>
        {task.title}
      </p>

      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className={styles.labels}>
          {task.labels.map(label => (
            <LabelBadge key={label.id} label={label} />
          ))}
        </div>
      )}

      {/* Footer: priority flag + due date + avatar */}
      <div className={styles.footer}>
        <div className={styles.footerLeft}>
          {/* Priority flag */}
          <span className={styles.priorityFlag} style={{ color: priorityColor }} title={PRIORITY_LABELS[task.priority]}>
            <svg width="10" height="11" viewBox="0 0 10 11" fill="currentColor">
              <path d="M1 1v9M1 1h6.5l-2 3.5 2 3.5H1" strokeWidth="0"/>
            </svg>
            <span className={styles.priorityLabel}>{PRIORITY_LABELS[task.priority]}</span>
          </span>

          <DueDateBadge dueDate={task.due_date} isDone={isDone} />
        </div>

        {assignee && (
          <div
            className={styles.avatar}
            style={{ background: assignee.color }}
            title={assignee.name}
          >
            {assignee.name.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  )
}
import type { Task } from '../types/index'
import { PriorityBadge } from './PriorityBadge'
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

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? 'none' : transition
      }}
      className={`${styles.card} ${isDragging ? styles.dragging : ''}`}
      {...attributes}
      {...listeners}
      onClick={() => onClick(task)}
    >
      <div className={styles.header}>
        <PriorityBadge priority={task.priority} />
        <DueDateBadge dueDate={task.due_date} isDone={isDone} />
      </div>

      <p className={`${styles.title} ${isDone ? styles.titleDone : ''}`}>
        {task.title}
      </p>

      {task.labels && task.labels.length > 0 && (
        <div className={styles.labels}>
          {task.labels.map(label => (
            <LabelBadge key={label.id} label={label} />
          ))}
        </div>
      )}

      <div className={styles.footer}>
        {task.assignee_id ? (() => {
            const member = members.find(m => m.id === task.assignee_id)
            return member ? (
            <div
                className={styles.avatar}
                style={{ background: member.color }}
                title={member.name}
            >
                {member.name.slice(0, 2).toUpperCase()}
            </div>
            ) : null
        })() : (
            <div className={styles.avatar} style={{ background: '#444660' }}>
            ?
            </div>
        )}
        </div>
    </div>
  )
}
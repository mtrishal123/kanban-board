import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Task, Status } from '../types'
import type { TeamMember } from '../hooks/useTeamMembers'
import { TaskCard } from './TaskCard'
import styles from './Column.module.css'

interface Props {
  id: Status
  label: string
  color: string
  tasks: Task[]
  members: TeamMember[]
  onAddTask: (status: Status) => void
  onTaskClick: (task: Task) => void
}

const COLUMN_ACCENT: Record<Status, string> = {
  todo: styles.accentTodo,
  in_progress: styles.accentInProgress,
  in_review: styles.accentInReview,
  done: styles.accentDone,
}

export function Column({ id, label, color, tasks, members, onAddTask, onTaskClick }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div className={`${styles.column} ${COLUMN_ACCENT[id]} ${isOver ? styles.columnOver : ''}`}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.dot} style={{ background: color }} />
          <span className={styles.title}>{label}</span>
          <span className={styles.count}>{tasks.length}</span>
        </div>
        <button className={styles.addBtn} onClick={() => onAddTask(id)}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div ref={setNodeRef} className={styles.body}>
        <SortableContext
          items={tasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              members={members}
              onClick={onTaskClick}
            />
          ))}
        </SortableContext>

        <button className={styles.inlineAddBtn} onClick={() => onAddTask(id)}>
          <span className={styles.inlineAddIcon}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </span>
        </button>

        {tasks.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyText}>No tasks yet</div>
          </div>
        )}
      </div>
    </div>
  )
}
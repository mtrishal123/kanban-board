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

export function Column({ id, label, color, tasks, members, onAddTask, onTaskClick }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div className={`${styles.column} ${isOver ? styles.columnOver : ''}`}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.dot} style={{ background: color }} />
          <span className={styles.title}>{label}</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.count}>{tasks.length}</span>
          <button className={styles.addBtn} onClick={() => onAddTask(id)}>
            +
          </button>
        </div>
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

        <button
          className={styles.inlineAddBtn}
          onClick={() => onAddTask(id)}
        >
          <div className={styles.inlineAddIcon}>+</div>
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
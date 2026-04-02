import { useState, useMemo, useEffect } from 'react'
import {
  DndContext,
  closestCorners,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { supabase } from '../lib/supabase'
import { Column } from './Column'
import { AddTaskModal } from './AddTaskModal'
import { useTasks } from '../hooks/useTasks'
import { useTeamMembers } from '../hooks/useTeamMembers'
import { useLabels } from '../hooks/useLabels'
import { TeamMembersPanel } from './TeamMembersPanel'
import { setTaskLabels } from '../hooks/useTaskLabels'
import { COLUMNS, type Task, type Status } from '../types/index'
import { TaskDetailModal } from './TaskDetailModal'
import { FilterPanel } from './FilterPanel'
import { ActiveFilterBar } from './ActiveFilterBar'
import { EMPTY_FILTERS, hasActiveFilters } from '../types/filters'
import type { ActiveFilters } from '../types/filters'
import type { Priority } from '../types'
import styles from './Board.module.css'
import { TaskCard } from './TaskCard'

interface Props {
  userId: string
}

export function Board({ userId }: Props) {
  const { tasks, loading, createTask, updateTask, deleteTask, moveTask, refetch } = useTasks(userId)
  const [addingToColumn, setAddingToColumn] = useState<Status | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [search, setSearch] = useState('')
  const [showTeamPanel, setShowTeamPanel] = useState(false)
  const [taskVersion, setTaskVersion] = useState(0)
  const [filters, setFilters] = useState<ActiveFilters>(EMPTY_FILTERS)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [optimisticOrder, setOptimisticOrder] = useState<Task[] | null>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('kanban-theme')
    return (saved === 'light' ? 'light' : 'dark')
  })

  // Apply theme attribute on mount and whenever theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : '')
  }, [theme])

  // Apply theme to root
  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('kanban-theme', next)
      return next
    })
  }

  // Reset optimistic order whenever real tasks change (after refetch)
  const displayTasks = optimisticOrder ?? tasks

  const { members, createMember, deleteMember } = useTeamMembers(userId)
  const { labels, createLabel  } = useLabels(userId)

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    }),
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    })
  )

  const filteredTasks = useMemo(() => {
    let result = displayTasks

    // Search
    if (search.trim()) {
      result = result.filter(t =>
        t.title.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Priority filter
    if (filters.priorities.length > 0) {
      result = result.filter(t => filters.priorities.includes(t.priority as Priority))
    }

    // Assignee filter
    if (filters.assigneeIds.length > 0) {
      result = result.filter(t =>
        t.assignee_id && filters.assigneeIds.includes(t.assignee_id)
      )
    }

    // Label filter
    if (filters.labelIds.length > 0) {
      result = result.filter(t =>
        t.labels?.some(l => filters.labelIds.includes(l.id))
      )
    }

    return result
  }, [displayTasks, search, filters])

  const tasksByColumn = useMemo(() => {
    return COLUMNS.reduce((acc, col) => {
      acc[col.id] = filteredTasks.filter(t => t.status === col.id)
      return acc
    }, {} as Record<Status, Task[]>)
  }, [filteredTasks])

  const stats = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const overdue = tasks.filter(t => {
      if (!t.due_date || t.status === 'done') return false
      return new Date(t.due_date) < today
    }).length
    const done = tasks.filter(t => t.status === 'done').length
    return { total: tasks.length, done, overdue }
  }, [tasks])

  const handleDragStart = (event: DragStartEvent) => {
    const task = displayTasks.find(t => t.id === event.active.id)
    if (task) setActiveTask(task)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const taskId = active.id as string
    const overId = over.id as string
    if (taskId === overId) return

    const isOverColumn = COLUMNS.some(c => c.id === overId)
    const draggingTask = displayTasks.find(t => t.id === taskId)
    if (!draggingTask) return

    const targetStatus = isOverColumn
      ? overId as Status
      : displayTasks.find(t => t.id === overId)?.status

    if (!targetStatus || draggingTask.status === targetStatus) return

    // Live preview: move task into target column optimistically
    setOptimisticOrder(prev => {
      const base = prev ?? tasks
      return base.map(t => t.id === taskId ? { ...t, status: targetStatus } : t)
    })
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      // Dropped outside — revert optimistic
      setOptimisticOrder(null)
      setActiveTask(null)
      return
    }

    const taskId = active.id as string
    const overId = over.id as string

    const isColumn = COLUMNS.some(c => c.id === overId)
    const currentDisplay = optimisticOrder ?? tasks
    const task = currentDisplay.find(t => t.id === taskId)
    if (!task) { setActiveTask(null); return }

    const originalTask = tasks.find(t => t.id === taskId)
    if (!originalTask) { setActiveTask(null); return }

    // Cross-column move — persist to DB
    if (originalTask.status !== task.status) {
      setActiveTask(null)
      await moveTask(taskId, task.status)
      setOptimisticOrder(null)
      await supabase
        .from('activity_log')
        .insert({
          task_id: taskId,
          user_id: userId,
          action: 'status_changed',
          meta: { from: originalTask.status, to: task.status },
        })
      return
    }

    // Same-column reorder
    if (!isColumn && taskId !== overId) {
      const columnTasks = currentDisplay.filter(t => t.status === task.status)
      const oldIndex = columnTasks.findIndex(t => t.id === taskId)
      const newIndex = columnTasks.findIndex(t => t.id === overId)
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reordered = arrayMove(columnTasks, oldIndex, newIndex)
        const otherTasks = currentDisplay.filter(t => t.status !== task.status)
        setOptimisticOrder([...otherTasks, ...reordered])
      }
    } else {
      setOptimisticOrder(null)
    }

    setActiveTask(null)
  }

  const handleAddTask = async (taskData: any) => {
    const result = await createTask(taskData)
    if (result?.data) {
        await supabase
        .from('activity_log')
        .insert({
            task_id: result.data.id,
            user_id: userId,
            action: 'created',
            meta: { status: taskData.status } 
        })
    }
 }
 const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
  const result = await updateTask(id, updates)
  if (!result.error) {
    setOptimisticOrder(null)
    await refetch()
    setSelectedTask(prev => {
      if (!prev || prev.id !== id) return prev
      return { ...prev, ...updates }
    })
    setTaskVersion(v => v + 1)
  }
  return result
}

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.loadingState}>
          <p className={styles.loadingText}>Loading your board...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>
            <div className={styles.logoGrid}>
              <span /><span /><span /><span />
            </div>
          </div>
          <div className={styles.boardInfo}>
            <p className={styles.boardTitle}>My Workspace</p>
            <p className={styles.boardSubtitle}>Personal board</p>
          </div>
        </div>

        <div className={styles.headerCenter}>
          <div className={styles.stat}>
            <p className={styles.statNum}>{stats.total}</p>
            <p className={styles.statLabel}>total</p>
          </div>
          <div className={styles.stat}>
            <p className={styles.statNum}>{stats.done}</p>
            <p className={styles.statLabel}>done</p>
          </div>
          <div className={styles.stat}>
            <p className={`${styles.statNum} ${stats.overdue > 0 ? styles.statNumDanger : ''}`}>
              {stats.overdue}
            </p>
            <p className={styles.statLabel}>overdue</p>
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.searchWrapper}>
            <svg
              className={styles.searchIcon}
              width="13" height="13"
              viewBox="0 0 16 16"
              fill="none"
            >
              <circle cx="6" cy="6" r="4.5" stroke="#666880" strokeWidth="1.5" />
              <path d="M10 10l3.5 3.5" stroke="#666880" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              className={styles.searchInput}
              placeholder="Search tasks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                className={styles.searchClearBtn}
                onClick={() => setSearch('')}
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>
          <FilterPanel
            filters={filters}
            members={members}
            labels={labels}
            onChange={setFilters}
          />
          <button
            onClick={() => setShowTeamPanel(true)}
            className={styles.teamBtn}
            >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="6" cy="5" r="3" stroke="#666880" strokeWidth="1.5"/>
                <path d="M1 14c0-3 2-5 5-5s5 2 5 5" stroke="#666880" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M12 7c1.5 0 3 1 3 3" stroke="#666880" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="13" cy="4" r="2" stroke="#666880" strokeWidth="1.5"/>
            </svg>
            Team
            </button>
          <button
            onClick={toggleTheme}
            className={styles.themeBtn}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.1 3.1l1.1 1.1M11.8 11.8l1.1 1.1M11.8 3.1l-1.1 1.1M3.1 11.8l1.1-1.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M13.5 8.5A5.5 5.5 0 017 2a5.5 5.5 0 100 11 5.5 5.5 0 006.5-4.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            )}
          </button>
          <div className={styles.avatar}>
            {userId.slice(0, 2).toUpperCase()}
          </div>
        </div>
      </header>

      {hasActiveFilters(filters) && (
        <ActiveFilterBar
          filters={filters}
          members={members}
          labels={labels}
          onChange={setFilters}
        />
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className={styles.columns}>
          {COLUMNS.map(col => (
            <Column
              key={col.id}
              id={col.id}
              label={col.label}
              color={col.color}
              tasks={tasksByColumn[col.id]}
              members={members}
              onAddTask={setAddingToColumn}
              onTaskClick={setSelectedTask}
            />
          ))}
        </div>

        <DragOverlay
          dropAnimation={{
            duration: 200,
            easing: 'cubic-bezier(0.2, 0, 0, 1)',
          }}
        >
          {activeTask ? (
            <div style={{ transform: 'rotate(1.5deg)', opacity: 0.95, boxShadow: '0 12px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)', borderRadius: '8px', cursor: 'grabbing' }}>
              <TaskCard
                task={activeTask}
                members={members}
                onClick={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

        {addingToColumn && (
        <AddTaskModal
            initialStatus={addingToColumn}
            onClose={() => setAddingToColumn(null)}
            onAdd={handleAddTask}
        />
        )}

        {selectedTask && (
        <TaskDetailModal
            key={`${selectedTask.id}-${taskVersion}`}
            task={selectedTask}
            userId={userId}
            members={members}
            labels={labels}
            onClose={() => setSelectedTask(null)}
            onUpdate={handleUpdateTask}
            onDelete={deleteTask}
            onCreateMember={createMember}
            onCreateLabel={createLabel}
            onSetLabels={setTaskLabels}
            onRefetchTasks={refetch}
        />
        )}
        {showTeamPanel && (
        <TeamMembersPanel
            members={members}
            onClose={() => setShowTeamPanel(false)}
            onCreate={createMember}
            onDelete={deleteMember}
        />
        )}
    </div>
  )
}
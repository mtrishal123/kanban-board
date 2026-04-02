export type Priority = 'low' | 'normal' | 'high'
export type Status = 'todo' | 'in_progress' | 'in_review' | 'done'

export interface Label {
  id: string
  name: string
  color: string
  user_id: string
  created_at: string
}

export interface Task {
  id: string
  title: string
  description?: string
  status: Status
  priority: Priority
  due_date?: string
  user_id: string
  assignee_id?: string
  created_at: string
  labels?: Label[]
}

export interface Comment {
  id: string
  task_id: string
  content: string
  user_id: string
  created_at: string
}

export const COLUMNS: { id: Status; label: string; color: string }[] = [
  { id: 'todo', label: 'To Do', color: '#666880' },
  { id: 'in_progress', label: 'In Progress', color: '#7c6af7' },
  { id: 'in_review', label: 'In Review', color: '#f59e0b' },
  { id: 'done', label: 'Done', color: '#34d399' },
]
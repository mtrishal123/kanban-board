import type { Priority } from './index'

export interface ActiveFilters {
  priorities: Priority[]
  assigneeIds: string[]
  labelIds: string[]
}

export const EMPTY_FILTERS: ActiveFilters = {
  priorities: [],
  assigneeIds: [],
  labelIds: [],
}

export function hasActiveFilters(filters: ActiveFilters): boolean {
  return (
    filters.priorities.length > 0 ||
    filters.assigneeIds.length > 0 ||
    filters.labelIds.length > 0
  )
}
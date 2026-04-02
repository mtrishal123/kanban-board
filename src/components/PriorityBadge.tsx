import type { Priority } from '../types/index'
import styles from './PriorityBadge.module.css'

interface Props {
  priority: Priority
}

export function PriorityBadge({ priority }: Props) {
  return (
    <span className={`${styles.badge} ${styles[priority]}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  )
}
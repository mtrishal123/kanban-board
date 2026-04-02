import type { Label } from '../types/index'
import styles from './LabelBadge.module.css'

interface Props {
  label: Label
}

export function LabelBadge({ label }: Props) {
  return (
    <span
      className={styles.label}
      style={{
        background: label.color + '33',
        color: label.color,
      }}
    >
      {label.name}
    </span>
  )
}
import type { ActiveFilters } from "../types/filters";
import type { TeamMember } from "../hooks/useTeamMembers";
import type { Label } from "../types";
import styles from "./ActiveFilterBar.module.css";

const PRIORITY_COLORS = {
  high: "#f87171",
  normal: "#60a5fa",
  low: "#4ade80",
};

interface Props {
  filters: ActiveFilters;
  members: TeamMember[];
  labels: Label[];
  onChange: (filters: ActiveFilters) => void;
}

export function ActiveFilterBar({ filters, members, labels, onChange }: Props) {
  const removePriority = (p: string) =>
    onChange({
      ...filters,
      priorities: filters.priorities.filter((x) => x !== p),
    });

  const removeAssignee = (id: string) =>
    onChange({
      ...filters,
      assigneeIds: filters.assigneeIds.filter((x) => x !== id),
    });

  const removeLabel = (id: string) =>
    onChange({
      ...filters,
      labelIds: filters.labelIds.filter((x) => x !== id),
    });

  const clearAll = () =>
    onChange({ priorities: [], assigneeIds: [], labelIds: [] });

  return (
    <div className={styles.bar}>
      {filters.priorities.map((p) => (
        <div key={p} className={styles.pill}>
          <div
            className={styles.pillDot}
            style={{ background: PRIORITY_COLORS[p] }}
          />
          {p.charAt(0).toUpperCase() + p.slice(1)}
          <button
            className={styles.removeBtn}
            onClick={() => removePriority(p)}
          >
            ×
          </button>
        </div>
      ))}

      {filters.assigneeIds.map((id) => {
        const member = members.find((m) => m.id === id);
        if (!member) return null;
        return (
          <div key={id} className={styles.pill}>
            <div
              className={styles.pillAvatar}
              style={{ background: member.color }}
            >
              {member.name.slice(0, 2).toUpperCase()}
            </div>
            {member.name}
            <button
              className={styles.removeBtn}
              onClick={() => removeAssignee(id)}
            >
              ×
            </button>
          </div>
        );
      })}

      {filters.labelIds.map((id) => {
        const label = labels.find((l) => l.id === id);
        if (!label) return null;
        return (
          <div key={id} className={styles.pill}>
            <div
              className={styles.pillDot}
              style={{ background: label.color }}
            />
            {label.name}
            <button
              className={styles.removeBtn}
              onClick={() => removeLabel(id)}
            >
              ×
            </button>
          </div>
        );
      })}

      <button className={styles.clearAll} onClick={clearAll}>
        Clear filters
      </button>
    </div>
  );
}

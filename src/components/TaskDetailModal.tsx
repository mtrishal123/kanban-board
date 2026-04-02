import { useState } from "react";
import type { Task, Priority, Status } from "../types";
import { COLUMNS } from "../types";
import { ConfirmDialog } from "./ConfirmDialog";
import { useComments } from "../hooks/useComments";
import { useActivityLog } from "../hooks/useActivityLog";
import type { TeamMember } from "../hooks/useTeamMembers";
import styles from "./TaskDetailModal.module.css";
import type { Label } from "../types";

interface Props {
  task: Task;
  userId: string;
  members: TeamMember[];
  labels: Label[];
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Task>) => Promise<{ error: any }>;
  onDelete: (id: string) => Promise<{ error: any }>;
  onCreateMember: (name: string, color: string) => Promise<any>;
  onCreateLabel: (name: string, color: string) => Promise<any>;
  onSetLabels: (taskId: string, labelIds: string[]) => Promise<{ error: any }>;
  onRefetchTasks: () => Promise<void>;
}

const MEMBER_COLORS = [
  "#7c6af7",
  "#f472b6",
  "#34d399",
  "#f59e0b",
  "#60a5fa",
  "#f87171",
  "#a78bfa",
  "#2dd4bf",
];

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatAction(action: string, meta?: Record<string, any>): string {
  switch (action) {
    case "created":
      return "created this task";
    case "status_changed":
      return `moved to ${meta?.to ?? ""}`;
    case "priority_changed":
      return `changed priority to ${meta?.to ?? ""}`;
    case "assignee_changed":
      return meta?.to ? `assigned to ${meta.to}` : "removed assignee";
    case "title_changed":
      return "updated the title";
    case "description_changed":
      return "updated the description";
    case "labels_added":
      return `added labels: ${meta?.labels?.join(", ") ?? ""}`;
    case "labels_removed":
      return `removed labels: ${meta?.labels?.join(", ") ?? ""}`;
    default:
      return action;
  }
}

export function TaskDetailModal({
  task,
  userId,
  members,
  labels,
  onClose,
  onUpdate,
  onDelete,
  onCreateLabel,
  onSetLabels,
  onRefetchTasks,
}: Props) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [status, setStatus] = useState<Status>(task.status);
  const [dueDate, setDueDate] = useState(task.due_date ?? "");
  const [assigneeId, setAssigneeId] = useState<string | undefined>(
    task.assignee_id,
  );
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false)
  const [selectedMemberId] = useState<string | undefined>(undefined);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>(
    task.labels?.map((l) => l.id) ?? [],
  );
  const [showAddLabel, setShowAddLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#f87171");

  const { comments, addComment } = useComments(task.id);
  const { entries, logActivity } = useActivityLog(task.id);

  const initialLabelIds = task.labels?.map((l) => l.id) ?? [];
  const labelsChanged =
    JSON.stringify([...selectedLabelIds].sort()) !==
    JSON.stringify([...initialLabelIds].sort());

  const isDirty =
    title !== task.title ||
    description !== (task.description ?? "") ||
    priority !== task.priority ||
    status !== task.status ||
    dueDate !== (task.due_date ?? "") ||
    assigneeId !== task.assignee_id ||
    labelsChanged;

  const handleSave = async () => {
    if (!title.trim() || !isDirty) return;
    setLoading(true);

    if (status !== task.status) {
      await logActivity(userId, "status_changed", {
        from: task.status,
        to: status,
      });
    }
    if (priority !== task.priority) {
      await logActivity(userId, "priority_changed", {
        from: task.priority,
        to: priority,
      });
    }
    if (assigneeId !== task.assignee_id) {
      const member = members.find((m) => m.id === assigneeId);
      await logActivity(userId, "assignee_changed", {
        to: member?.name,
      });
    }
    if (title !== task.title) {
      await logActivity(userId, "title_changed", {});
    }
    if (labelsChanged) {
      const addedLabels = selectedLabelIds.filter(
        (id) => !initialLabelIds.includes(id),
      );
      const removedLabels = initialLabelIds.filter(
        (id) => !selectedLabelIds.includes(id),
      );

      const addedNames = addedLabels
        .map((id) => labels.find((l) => l.id === id)?.name)
        .filter(Boolean);
      const removedNames = removedLabels
        .map((id) => labels.find((l) => l.id === id)?.name)
        .filter(Boolean);

      if (addedNames.length > 0) {
        await logActivity(userId, "labels_added", { labels: addedNames });
      }
      if (removedNames.length > 0) {
        await logActivity(userId, "labels_removed", { labels: removedNames });
      }
      await onSetLabels(task.id, selectedLabelIds);
      await onRefetchTasks();
    }

    await onUpdate(task.id, {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      status,
      due_date: dueDate || undefined,
      assignee_id: assigneeId,
    });

    setLoading(false);
    onClose();
  };

  const handleDelete = async () => {
    setLoading(true);
    await onDelete(task.id);
    setLoading(false);
    onClose();
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    await addComment(commentText.trim(), userId, selectedMemberId);
    setCommentText("");
  };

  

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return;
    const { data } = await onCreateLabel(newLabelName.trim(), newLabelColor);
    if (data) setSelectedLabelIds((prev) => [...prev, data.id]);
    setNewLabelName("");
    setNewLabelColor("#f87171");
    setShowAddLabel(false);
  };
  const columnColor = COLUMNS.find((c) => c.id === status)?.color ?? "#666880";
  const assignedMember = members.find((m) => m.id === assigneeId);

  return (
    <>
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          {/* TOP BAR */}
          <div className={styles.modalTop}>
            <div className={styles.statusBadge}>
              <div
                className={styles.statusDot}
                style={{ background: columnColor }}
              />
              <span>{COLUMNS.find((c) => c.id === status)?.label}</span>
            </div>
            <button className={styles.closeBtn} onClick={onClose}>
              ×
            </button>
          </div>

          {/* BODY */}
          <div className={styles.body}>
            {/* LEFT PANEL */}
            <div className={styles.leftPanel}>
              <div className={styles.leftScroll}>
                {/* Title */}
                <textarea
                  autoFocus
                  className={styles.titleInput}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task title"
                  rows={2}
                />

                {/* Description */}
                <textarea
                  className={styles.descTextarea}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description..."
                  rows={4}
                />

                <div className={styles.divider} />

                {/* Activity Log */}
                <div>
                  <p className={styles.sectionTitle}>Activity</p>
                  {entries.length === 0 ? (
                    <p className={styles.emptyState}>No activity yet</p>
                  ) : (
                    <div className={styles.activityList}>
                      {entries.map((entry) => (
                        <div key={entry.id} className={styles.activityItem}>
                          <div className={styles.activityDot} />
                          <span className={styles.activityText}>
                            {formatAction(entry.action, entry.meta)}
                          </span>
                          <span className={styles.activityTime}>
                            {formatTime(entry.created_at)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.divider} />

                {/* Comments */}
                <div>
                  <p className={styles.sectionTitle}>Comments</p>
                  {comments.length === 0 ? (
                    <p className={styles.emptyState}>No comments yet</p>
                  ) : (
                    <div className={styles.commentList}>
                      {comments.map((comment) => {
                        const member = comment.team_members;
                        return (
                          <div key={comment.id} className={styles.comment}>
                            <div
                              className={styles.commentAvatar}
                              style={{ background: member?.color ?? "#7c6af7" }}
                            >
                              {member?.name?.slice(0, 2).toUpperCase() ?? "AN"}
                            </div>
                            <div className={styles.commentBody}>
                              <div className={styles.commentHeader}>
                                <span className={styles.commentAuthor}>
                                  {member?.name ?? "Anonymous"}
                                </span>
                                <span className={styles.commentTime}>
                                  {formatTime(comment.created_at)}
                                </span>
                              </div>
                              <p className={styles.commentContent}>
                                {comment.content}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Comment Input */}
              <div className={styles.commentInputWrap}>
                <div
                  className={styles.commentAvatar}
                  style={{
                    background: "#7c6af7",
                    width: "28px",
                    height: "28px",
                    fontSize: "10px",
                  }}
                >
                ME
                </div>
                <textarea
                  className={styles.commentInput}
                  placeholder="Leave a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                />
                <button
                  className={styles.commentSendBtn}
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M2 14L14 8L2 2V7L10 8L2 9V14Z" fill="white" />
                  </svg>
                </button>
              </div>
            </div>

            {/* RIGHT PANEL */}
            <div className={styles.rightPanel}>
              {/* Priority */}
              <div className={styles.propGroup}>
                <label className={styles.propLabel}>Priority</label>
                <select
                  className={styles.propSelect}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>

              {/* Status */}
              <div className={styles.propGroup}>
                <label className={styles.propLabel}>Status</label>
                <select
                  className={styles.propSelect}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Status)}
                >
                  {COLUMNS.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Due Date */}
              <div className={styles.propGroup}>
                <label className={styles.propLabel}>Due Date</label>
                <input
                  type="date"
                  className={styles.propDateInput}
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              {/* Assignee */}
              <div className={styles.propGroup}>
                <label className={styles.propLabel}>Assignee</label>
                {members.length === 0 ? (
                  <p className={styles.noMembers}>
                    No assignees yet. Add team members from the Team panel.
                  </p>
                ) : (
                  <div className={styles.assigneeDropdown}>
                    {/* Current assignee display */}
                    <div
                      className={styles.assigneeCurrent}
                      onClick={() => setShowAssigneeDropdown(prev => !prev)}
                    >
                      {assignedMember ? (
                        <>
                          <div
                            className={styles.assigneeAvatar}
                            style={{ background: assignedMember.color }}
                          >
                            {assignedMember.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span className={styles.assigneeName}>
                            {assignedMember.name}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className={styles.assigneeNameEmpty}>
                            No assignee
                          </span>
                        </>
                      )}
                      <svg
                        style={{ marginLeft: "auto" }}
                        width="10"
                        height="10"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path
                          d="M2 4l4 4 4-4"
                          stroke="#666880"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>

                    {/* Dropdown list */}
                    {showAssigneeDropdown && (
                      <div className={styles.assigneeList}>
                        <div
                          className={`${styles.assigneeOption} ${!assigneeId ? styles.assigneeOptionSelected : ""}`}
                          onClick={() => {
                            setAssigneeId(undefined);
                            setShowAssigneeDropdown(false);
                          }}
                        >
                          <div className={styles.assigneeAvatarEmpty}>—</div>
                          <span className={styles.assigneeName}>
                            No assignee
                          </span>
                          {!assigneeId && (
                            <svg
                              style={{ marginLeft: "auto" }}
                              width="10"
                              height="10"
                              viewBox="0 0 12 12"
                              fill="none"
                            >
                              <path
                                d="M2 6L5 9L10 3"
                                stroke="#34d399"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </div>
                        {members.map((member) => (
                          <div
                            key={member.id}
                            className={`${styles.assigneeOption} ${assigneeId === member.id ? styles.assigneeOptionSelected : ""}`}
                            onClick={() => {
                              setAssigneeId(member.id);
                              setShowAssigneeDropdown(false);
                            }}
                          >
                            <div
                              className={styles.assigneeAvatar}
                              style={{ background: member.color }}
                            >
                              {member.name.slice(0, 2).toUpperCase()}
                            </div>
                            <span className={styles.assigneeName}>
                              {member.name}
                            </span>
                            {assigneeId === member.id && (
                              <svg
                                style={{ marginLeft: "auto" }}
                                width="10"
                                height="10"
                                viewBox="0 0 12 12"
                                fill="none"
                              >
                                <path
                                  d="M2 6L5 9L10 3"
                                  stroke="#34d399"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Labels */}
              <div className={styles.propGroup}>
                <label className={styles.propLabel}>Labels</label>
                <div className={styles.labelList}>
                  {labels.map((label) => (
                    <div
                      key={label.id}
                      className={`${styles.labelOption} ${selectedLabelIds.includes(label.id) ? styles.labelOptionSelected : ""}`}
                      onClick={() =>
                        setSelectedLabelIds((prev) =>
                          prev.includes(label.id)
                            ? prev.filter((id) => id !== label.id)
                            : [...prev, label.id],
                        )
                      }
                    >
                      <div
                        className={styles.labelDot}
                        style={{ background: label.color }}
                      />
                      <span className={styles.labelName}>{label.name}</span>
                      {selectedLabelIds.includes(label.id) && (
                        <svg
                          style={{ marginLeft: "auto" }}
                          width="10"
                          height="10"
                          viewBox="0 0 12 12"
                          fill="none"
                        >
                          <path
                            d="M2 6L5 9L10 3"
                            stroke={label.color}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                  ))}

                  {showAddLabel ? (
                    <div className={styles.addMemberForm}>
                      <input
                        autoFocus
                        className={styles.addMemberInput}
                        placeholder="Label name"
                        value={newLabelName}
                        onChange={(e) => setNewLabelName(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleCreateLabel()
                        }
                      />
                      <div className={styles.colorOptions}>
                        {MEMBER_COLORS.map((color) => (
                          <div
                            key={color}
                            className={`${styles.colorSwatch} ${newLabelColor === color ? styles.colorSwatchSelected : ""}`}
                            style={{ background: color }}
                            onClick={() => setNewLabelColor(color)}
                          />
                        ))}
                      </div>
                      <div className={styles.addMemberActions}>
                        <button
                          className={styles.addMemberCancel}
                          onClick={() => setShowAddLabel(false)}
                        >
                          Cancel
                        </button>
                        <button
                          className={styles.addMemberSave}
                          onClick={handleCreateLabel}
                          disabled={!newLabelName.trim()}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className={styles.addMemberBtn}
                      onClick={() => setShowAddLabel(true)}
                    >
                      + Add label
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className={styles.footer}>
            <button
              className={styles.deleteBtn}
              onClick={() => setShowConfirm(true)}
              disabled={loading}
            >
              Delete
            </button>
            <div className={styles.footerRight}>
              <button className={styles.cancelBtn} onClick={onClose}>
                Cancel
              </button>
              <button
                className={styles.saveBtn}
                onClick={handleSave}
                disabled={!title.trim() || !isDirty || loading}
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showConfirm && (
        <ConfirmDialog
          title={`Delete "${task.title}"?`}
          message="Once deleted, this task cannot be recovered. Are you sure you want to proceed?"
          confirmLabel="Delete Task"
          loading={loading}
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}

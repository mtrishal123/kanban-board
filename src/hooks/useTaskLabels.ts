import { supabase } from '../lib/supabase'

export async function setTaskLabels(taskId: string, labelIds: string[]) {
  // Delete existing
  await supabase
    .from('task_labels')
    .delete()
    .eq('task_id', taskId)

  if (labelIds.length === 0) return { error: null }

  // Insert new
  const { error } = await supabase
    .from('task_labels')
    .insert(labelIds.map(label_id => ({ task_id: taskId, label_id })))

  return { error }
}
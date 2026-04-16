import type { ProgressState, TaskDefinition } from './types'

const STORAGE_KEY = 'karel-progress'

const DEFAULT_PROGRESS: ProgressState = {
  solved: [],
  unlockedLevel: 1,
  allUnlocked: false,
}

export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_PROGRESS }
    const parsed = JSON.parse(raw)
    return {
      solved: Array.isArray(parsed.solved) ? parsed.solved : [],
      unlockedLevel: [1, 2, 3].includes(parsed.unlockedLevel) ? parsed.unlockedLevel : 1,
      allUnlocked: parsed.allUnlocked === true,
    }
  } catch {
    return { ...DEFAULT_PROGRESS }
  }
}

export function saveProgress(progress: ProgressState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // localStorage might be unavailable (private browsing etc.)
  }
}

/**
 * Returns the level that should be unlocked based on solved tasks.
 * L2 unlocks when ALL 4 L1 tasks are solved.
 * L3 unlocks when ALL 4 L2 tasks are solved.
 */
export function computeUnlockedLevel(solved: string[], allTasks: TaskDefinition[]): 1 | 2 | 3 {
  const l1Tasks = allTasks.filter(t => t.level === 1)
  const l2Tasks = allTasks.filter(t => t.level === 2)
  const allL1Solved = l1Tasks.every(t => solved.includes(t.id))
  const allL2Solved = l2Tasks.every(t => solved.includes(t.id))
  if (allL2Solved && allL1Solved) return 3
  if (allL1Solved) return 2
  return 1
}

/**
 * Returns true if a task can be accessed (its level is unlocked or allUnlocked).
 */
export function isTaskAccessible(task: TaskDefinition, progress: ProgressState): boolean {
  if (progress.allUnlocked) return true
  return task.level <= progress.unlockedLevel
}

/**
 * Marks a task as solved and recalculates the unlocked level.
 */
export function markSolved(
  taskId: string,
  currentProgress: ProgressState,
  allTasks: TaskDefinition[],
): ProgressState {
  if (currentProgress.solved.includes(taskId)) return currentProgress
  const newSolved = [...currentProgress.solved, taskId]
  const newLevel = computeUnlockedLevel(newSolved, allTasks)
  const newProgress = { ...currentProgress, solved: newSolved, unlockedLevel: newLevel }
  saveProgress(newProgress)
  return newProgress
}

/**
 * Unlocks all tasks (Betreuer shortcut).
 */
export function unlockAll(currentProgress: ProgressState): ProgressState {
  const newProgress = { ...currentProgress, allUnlocked: true, unlockedLevel: 3 as const }
  saveProgress(newProgress)
  return newProgress
}

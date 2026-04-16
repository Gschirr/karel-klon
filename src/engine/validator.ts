import type { TaskDefinition, ValidationResult, WorldState } from './types'
import { posEqual } from './world'

/**
 * Compares the actual world state after execution with the goal state from
 * the task definition. Returns success=true only when every specified goal
 * condition is satisfied.
 *
 * Goal fields are optional — undefined means "don't care":
 *   task.goal.karel?.position  — Karel must be at this cell
 *   task.goal.karel?.direction — Karel must face this direction
 *   task.goal.beepers          — Exactly these beeper positions must exist
 *                                (order-independent, duplicates are counted)
 */
export function validate(actualState: WorldState, task: TaskDefinition): ValidationResult {
  const issues: string[] = []

  // ── Karel position ──────────────────────────────────────────────────────────
  if (task.goal.karel?.position !== undefined) {
    if (!posEqual(actualState.karel.position, task.goal.karel.position)) {
      issues.push('Karel ist an der falschen Stelle.')
    }
  }

  // ── Karel direction ─────────────────────────────────────────────────────────
  if (task.goal.karel?.direction !== undefined) {
    if (actualState.karel.direction !== task.goal.karel.direction) {
      issues.push('Karel schaut in die falsche Richtung.')
    }
  }

  // ── Beeper positions ────────────────────────────────────────────────────────
  if (task.goal.beepers !== undefined) {
    const beepersMismatch = !beepersMatch(actualState.beepers, task.goal.beepers)
    if (beepersMismatch) {
      issues.push('Die Beeper liegen nicht richtig.')
    }
  }

  if (issues.length === 0) {
    return { success: true, details: '' }
  }

  return { success: false, details: issues.join(' ') }
}

// ─── helpers ──────────────────────────────────────────────────────────────────

/**
 * Order-independent multiset comparison of two beeper arrays.
 * Each position may appear more than once (multiple beepers on the same cell
 * are currently not supported by the type system, but the comparison is robust).
 */
function beepersMatch(
  actual: ReadonlyArray<{ x: number; y: number }>,
  expected: ReadonlyArray<{ x: number; y: number }>,
): boolean {
  if (actual.length !== expected.length) return false

  // Build a frequency map keyed by "x,y" for the actual beepers …
  const freq = new Map<string, number>()
  for (const b of actual) {
    const key = `${b.x},${b.y}`
    freq.set(key, (freq.get(key) ?? 0) + 1)
  }

  // … then subtract expected counts. Any mismatch means false.
  for (const b of expected) {
    const key = `${b.x},${b.y}`
    const count = freq.get(key) ?? 0
    if (count === 0) return false
    freq.set(key, count - 1)
  }

  return true
}

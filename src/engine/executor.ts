import type { Action, SpeedSetting } from './types'
import { config } from '../config'

export interface ExecutionCallbacks {
  onStep: (action: Action) => void
  onComplete: () => void
  onError: (error: string) => void
}

/**
 * Executes a list of actions with animation delays.
 * Returns an abort function to stop execution.
 *
 * getSpeed() is called before each delay so speed changes during playback
 * take effect immediately on the next step.
 */
export function executeActions(
  actions: Action[],
  _speed: SpeedSetting,
  callbacks: ExecutionCallbacks,
  getSpeed: () => SpeedSetting,
): () => void {
  let aborted = false
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  function abort() {
    aborted = true
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  function stepThrough(index: number) {
    if (aborted) return

    if (index >= actions.length) {
      callbacks.onComplete()
      return
    }

    const action = actions[index]

    // If this action has an error, report it and stop
    if (action.error) {
      callbacks.onStep(action)
      callbacks.onError(action.error)
      return
    }

    callbacks.onStep(action)

    const currentSpeed = getSpeed()
    const delay = config.execution.speeds[currentSpeed] ?? 200
    timeoutId = setTimeout(() => stepThrough(index + 1), delay)
  }

  // Start execution on the next tick so the caller can store the abort fn first
  stepThrough(0)

  return abort
}

/**
 * Executes a single step in step-by-step mode.
 * Calls the callback with the action at stepIndex and returns the next index.
 * Returns stepIndex unchanged if already past the end.
 */
export function executeSingleStep(
  actions: Action[],
  stepIndex: number,
  callback: (action: Action) => void,
): number {
  if (stepIndex >= actions.length) return stepIndex
  const action = actions[stepIndex]
  callback(action)
  return stepIndex + 1
}

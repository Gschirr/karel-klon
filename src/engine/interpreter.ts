import type { ASTNode, Action, ExecutionResult, Program, WorldState } from './types'
import { executeCommand, evaluateCondition } from './world'
import { config } from '../config'

/**
 * Interprets a Program (AST) against an initial WorldState and returns an
 * ExecutionResult containing the full ordered list of Actions plus the final
 * WorldState after all commands have been applied.
 *
 * Execution stops immediately when:
 *  - a command throws (wall collision, missing beeper, …)
 *  - the step counter reaches config.execution.maxSteps
 *  - the wall-clock time exceeds config.execution.maxTimeMs
 *
 * In the error case the returned ExecutionResult includes the error message
 * and all actions that were recorded before the failure.
 */
export function interpret(program: Program, initialState: WorldState): ExecutionResult {
  const actions: Action[] = []
  let currentState = initialState
  let stepCount = 0
  const startTime = Date.now()

  function step(nodes: ASTNode[]): void {
    for (const node of nodes) {
      // ── Limit checks ───────────────────────────────────────────────────────
      if (
        stepCount >= config.execution.maxSteps ||
        Date.now() - startTime >= config.execution.maxTimeMs
      ) {
        throw new Error(config.messages.errors.timeout)
      }

      if (node.type === 'command') {
        // ── Command node ──────────────────────────────────────────────────────
        stepCount++
        const previousState = currentState
        try {
          currentState = executeCommand(currentState, node.name)
          actions.push({ command: node.name, previousState, resultState: currentState })
        } catch (e) {
          const error = e instanceof Error ? e.message : String(e)
          actions.push({ command: node.name, previousState, resultState: previousState, error })
          throw e // re-throw to stop execution immediately
        }
      } else if (node.type === 'repeat') {
        // ── Repeat node ───────────────────────────────────────────────────────
        for (let i = 0; i < node.count; i++) {
          step(node.body)
        }
      } else if (node.type === 'ifElse') {
        // ── IfElse node ───────────────────────────────────────────────────────
        const conditionResult = evaluateCondition(currentState, node.condition)
        if (conditionResult) {
          step(node.then)
        } else {
          step(node.else)
        }
      }
    }
  }

  try {
    step(program)
    return { actions, finalState: currentState }
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e)
    return { actions, finalState: currentState, error }
  }
}

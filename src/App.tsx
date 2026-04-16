import { createContext, useContext, useReducer, useRef, useCallback, useEffect } from 'react'
import * as Blockly from 'blockly'
import type { WorldState, TaskDefinition, SpeedSetting, FeedbackState, Program } from './engine/types'
import type { ProgressState } from './engine/types'
import { createWorld } from './engine/world'
import { interpret } from './engine/interpreter'
import { validate } from './engine/validator'
import { executeActions } from './engine/executor'
// generateProgram is used inside Editor via getProgramRef — no direct import needed here
import { loadProgress, markSolved, unlockAll, isTaskAccessible } from './engine/progress'
import { config } from './config'
import Grid from './components/Grid/Grid'
import { Editor } from './components/Editor/Editor'
import Controls from './components/Controls/Controls'
import SuccessModal from './components/Feedback/SuccessModal'
import FailureMessage from './components/Feedback/FailureMessage'
import ErrorMessage from './components/Feedback/ErrorMessage'
import ProgressBar from './components/Feedback/ProgressBar'
import LevelCompleteModal from './components/Feedback/LevelCompleteModal'
import TaskPanel from './components/TaskPanel/TaskPanel'
import tasksJson from './tasks/tasks.json'

// ─── Types ────────────────────────────────────────────────────────────────────

const allTasks = tasksJson as TaskDefinition[]

interface GameState {
  currentTask: TaskDefinition | null
  initialWorld: WorldState | null   // Starting state (for reset)
  worldState: WorldState | null     // Current animated state
  speed: SpeedSetting
  isRunning: boolean
  feedback: FeedbackState
  progress: ProgressState
  showGoal: boolean
}

type GameAction =
  | { type: 'LOAD_TASK'; task: TaskDefinition }
  | { type: 'UPDATE_WORLD'; state: WorldState }
  | { type: 'SET_SPEED'; speed: SpeedSetting }
  | { type: 'SET_RUNNING'; running: boolean }
  | { type: 'RESET_WORLD' }
  | { type: 'SET_FEEDBACK'; feedback: FeedbackState }
  | { type: 'TASK_SOLVED'; taskId: string }
  | { type: 'SET_PROGRESS'; progress: ProgressState }
  | { type: 'UNLOCK_ALL' }
  | { type: 'TOGGLE_GOAL' }

// ─── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'LOAD_TASK': {
      const world = createWorld(action.task)
      return {
        ...state,
        currentTask: action.task,
        initialWorld: world,
        worldState: world,
        isRunning: false,
        feedback: null,
      }
    }
    case 'UPDATE_WORLD':
      return { ...state, worldState: action.state }
    case 'SET_SPEED':
      return { ...state, speed: action.speed }
    case 'SET_RUNNING':
      return { ...state, isRunning: action.running }
    case 'RESET_WORLD':
      return { ...state, worldState: state.initialWorld, isRunning: false }
    case 'SET_FEEDBACK':
      return { ...state, feedback: action.feedback }
    case 'TASK_SOLVED': {
      const newProgress = markSolved(action.taskId, state.progress, allTasks)
      return { ...state, progress: newProgress }
    }
    case 'SET_PROGRESS':
      return { ...state, progress: action.progress }
    case 'UNLOCK_ALL':
      return { ...state, progress: unlockAll(state.progress) }
    case 'TOGGLE_GOAL':
      return { ...state, showGoal: !state.showGoal }
    default:
      return state
  }
}

// ─── Initial state ────────────────────────────────────────────────────────────

function makeInitialState(): GameState {
  const progress = loadProgress()
  const firstTask = allTasks[0] ?? null
  const world = firstTask ? createWorld(firstTask) : null
  return {
    currentTask: firstTask,
    initialWorld: world,
    worldState: world,
    speed: 'normal',
    isRunning: false,
    feedback: null,
    progress,
    showGoal: false,
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface GameContextValue {
  state: GameState
  dispatch: React.Dispatch<GameAction>
  onPlay: () => void
  onStop: () => void
  onStep: () => void
  onReset: () => void
  loadTask: (task: TaskDefinition) => void
}

export const GameContext = createContext<GameContextValue>(null!)
export const useGame = () => useContext(GameContext)

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, makeInitialState)

  // Keep a ref that always reflects the latest state — used inside callbacks
  // that are created once but need to read current speed/task.
  const stateRef = useRef(state)
  stateRef.current = state

  // Blockly workspace ref — passed down to Editor and read on Play/Step
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null)

  // Abort function returned by executeActions — stored here to stop playback
  const abortRef = useRef<(() => void) | null>(null)

  // Actions produced by the last interpret() call — shared between Play and Step
  const actionsRef = useRef<ReturnType<typeof interpret>['actions'] | null>(null)

  // Step index for step-by-step mode
  const stepIndexRef = useRef<number>(0)

  // Program getter — set by Editor based on current mode (blocks or text)
  const getProgramRef = useRef<(() => Program) | null>(null)

  // ── Ctrl+Shift+U shortcut (Betreuer unlock) ──────────────────────────────────

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.key === 'U') {
        e.preventDefault()
        dispatch({ type: 'UNLOCK_ALL' })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // ── onPlay ──────────────────────────────────────────────────────────────────

  const onPlay = useCallback(() => {
    const { currentTask, initialWorld } = stateRef.current
    if (!getProgramRef.current || !currentTask || !initialWorld) return

    // Reset world and clear previous feedback before running
    dispatch({ type: 'RESET_WORLD' })
    dispatch({ type: 'SET_FEEDBACK', feedback: null })
    dispatch({ type: 'SET_RUNNING', running: true })

    let program: Program
    try {
      program = getProgramRef.current()
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      dispatch({ type: 'SET_FEEDBACK', feedback: { type: 'error', message: msg } })
      dispatch({ type: 'SET_RUNNING', running: false })
      return
    }
    const result = interpret(program, initialWorld)

    // Store actions so Step mode can re-use them
    actionsRef.current = result.actions
    stepIndexRef.current = 0

    const abort = executeActions(
      result.actions,
      stateRef.current.speed,
      {
        onStep: (action) => dispatch({ type: 'UPDATE_WORLD', state: action.resultState }),
        onComplete: () => {
          dispatch({ type: 'SET_RUNNING', running: false })
          const task = stateRef.current.currentTask!
          const validation = validate(result.finalState, task)
          if (validation.success) {
            const oldLevel = stateRef.current.progress.unlockedLevel
            const updatedProgress = markSolved(task.id, stateRef.current.progress, allTasks)
            dispatch({ type: 'TASK_SOLVED', taskId: task.id })
            const newLevel = updatedProgress.unlockedLevel
            if (newLevel > oldLevel) {
              dispatch({
                type: 'SET_FEEDBACK',
                feedback: {
                  type: 'levelComplete',
                  message: config.messages.success.levelComplete[oldLevel - 1],
                  level: oldLevel,
                },
              })
            } else {
              dispatch({
                type: 'SET_FEEDBACK',
                feedback: { type: 'success', message: config.messages.success.taskComplete },
              })
            }
          } else {
            dispatch({
              type: 'SET_FEEDBACK',
              feedback: {
                type: 'failure',
                message: validation.details || config.messages.success.taskFailed,
              },
            })
          }
        },
        onError: (error) => {
          dispatch({ type: 'SET_RUNNING', running: false })
          dispatch({ type: 'SET_FEEDBACK', feedback: { type: 'error', message: error } })
        },
      },
      () => stateRef.current.speed,
    )

    abortRef.current = abort
  }, [])

  // ── onStop ───────────────────────────────────────────────────────────────────

  const onStop = useCallback(() => {
    abortRef.current?.()
    abortRef.current = null
    dispatch({ type: 'SET_RUNNING', running: false })
  }, [])

  // ── onStep ───────────────────────────────────────────────────────────────────

  const onStep = useCallback(() => {
    const { currentTask, initialWorld } = stateRef.current
    if (!getProgramRef.current || !currentTask || !initialWorld) return

    // If no actions yet (or just starting), interpret the program first
    if (actionsRef.current === null || stepIndexRef.current === 0) {
      dispatch({ type: 'RESET_WORLD' })
      dispatch({ type: 'SET_FEEDBACK', feedback: null })
      let program: Program
      try {
        program = getProgramRef.current()
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        dispatch({ type: 'SET_FEEDBACK', feedback: { type: 'error', message: msg } })
        return
      }
      const result = interpret(program, initialWorld)
      actionsRef.current = result.actions
      stepIndexRef.current = 0
    }

    const actions = actionsRef.current
    const idx = stepIndexRef.current

    // Past end — validate final state
    if (idx >= actions.length) {
      const lastState =
        actions.length > 0 ? actions[actions.length - 1].resultState : initialWorld
      const validation = validate(lastState, currentTask)
      if (validation.success) {
        const oldLevel = stateRef.current.progress.unlockedLevel
        const updatedProgress = markSolved(currentTask.id, stateRef.current.progress, allTasks)
        dispatch({ type: 'TASK_SOLVED', taskId: currentTask.id })
        const newLevel = updatedProgress.unlockedLevel
        if (newLevel > oldLevel) {
          dispatch({
            type: 'SET_FEEDBACK',
            feedback: {
              type: 'levelComplete',
              message: config.messages.success.levelComplete[oldLevel - 1],
              level: oldLevel,
            },
          })
        } else {
          dispatch({
            type: 'SET_FEEDBACK',
            feedback: { type: 'success', message: config.messages.success.taskComplete },
          })
        }
      } else {
        dispatch({
          type: 'SET_FEEDBACK',
          feedback: {
            type: 'failure',
            message: validation.details || config.messages.success.taskFailed,
          },
        })
      }
      return
    }

    const action = actions[idx]

    // Error action — show it, report error
    if (action.error) {
      dispatch({ type: 'UPDATE_WORLD', state: action.resultState })
      dispatch({ type: 'SET_FEEDBACK', feedback: { type: 'error', message: action.error } })
      return
    }

    dispatch({ type: 'UPDATE_WORLD', state: action.resultState })
    stepIndexRef.current = idx + 1
  }, [])

  // ── onReset ──────────────────────────────────────────────────────────────────

  const onReset = useCallback(() => {
    onStop()
    dispatch({ type: 'RESET_WORLD' })
    dispatch({ type: 'SET_FEEDBACK', feedback: null })
    actionsRef.current = null
    stepIndexRef.current = 0
  }, [onStop])

  // ── loadTask ─────────────────────────────────────────────────────────────────

  const loadTask = useCallback((task: TaskDefinition) => {
    onStop()
    dispatch({ type: 'LOAD_TASK', task })
    actionsRef.current = null
    stepIndexRef.current = 0
  }, [onStop])

  // ─── Context value ──────────────────────────────────────────────────────────

  const contextValue: GameContextValue = {
    state,
    dispatch,
    onPlay,
    onStop,
    onStep,
    onReset,
    loadTask,
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <GameContext.Provider value={contextValue}>
      <div className="h-screen flex flex-col overflow-hidden bg-gray-100">

        {/* Header */}
        <header
          className="flex-none bg-white border-b border-gray-200 px-6 flex items-center justify-between"
          style={{ height: '52px' }}
        >
          <h1 className="text-xl font-bold text-gray-800">Karel der Roboter</h1>
          <span className="text-sm text-gray-600 font-medium">
            {state.currentTask?.title ?? ''}
          </span>
          <ProgressBar
            solvedCount={state.progress.solved.length}
            totalCount={allTasks.length}
          />
        </header>

        {/* Main — 3 columns */}
        <main
          className="flex-1 overflow-hidden grid"
          style={{ gridTemplateColumns: '220px 3fr 2fr' }}
        >

          {/* Column 1: Task panel */}
          <aside className="bg-white border-r border-gray-200 overflow-hidden">
            <TaskPanel
              tasks={allTasks}
              currentTaskId={state.currentTask?.id ?? null}
              solvedTasks={state.progress.solved}
              onSelectTask={loadTask}
              unlockedLevel={state.progress.unlockedLevel}
              allUnlocked={state.progress.allUnlocked}
            />
          </aside>

          {/* Column 2: Grid + Karel */}
          <section className="bg-gray-50 border-r border-gray-200 overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100 bg-white shrink-0 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Welt</h2>
              <button
                onClick={() => dispatch({ type: 'TOGGLE_GOAL' })}
                className={`text-xs px-2 py-1 rounded ${state.showGoal ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                title="Zielzustand ein-/ausblenden"
              >
                {state.showGoal ? '👁 Ziel ausblenden' : '👁 Ziel anzeigen'}
              </button>
            </div>
            <div className="flex-1 overflow-hidden p-4 flex flex-col items-center justify-center gap-3 relative">
              <div className="w-full flex-1 flex items-center justify-center min-h-0">
                <Grid
                  worldState={state.worldState}
                  goalState={state.currentTask?.goal}
                  showGoal={state.showGoal}
                  animationDuration={config.execution.speeds[state.speed]}
                  isError={state.feedback?.type === 'error'}
                />
              </div>

              {/* Inline feedback bar for failure / error (floating overlay) */}
              {state.feedback && (state.feedback.type === 'failure' || state.feedback.type === 'error') && (
                <div className="absolute bottom-4 left-4 right-4 z-10">
                  {state.feedback.type === 'failure' ? (
                    <FailureMessage
                      message={state.feedback.message}
                      onDismiss={() => dispatch({ type: 'SET_FEEDBACK', feedback: null })}
                    />
                  ) : (
                    <ErrorMessage
                      message={state.feedback.message}
                      onDismiss={() => dispatch({ type: 'SET_FEEDBACK', feedback: null })}
                    />
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Column 3: Blockly Editor */}
          <section className="bg-white overflow-hidden flex flex-col">
            <Editor
              level={state.currentTask?.level ?? 1}
              workspaceRef={workspaceRef}
              getProgramRef={getProgramRef}
            />
          </section>

        </main>

        {/* Footer: Controls only (no duplicate play/stop buttons) */}
        <footer
          className="flex-none bg-white border-t border-gray-200 px-6 flex items-center justify-center gap-4"
          style={{ height: '60px' }}
        >
          <Controls
            speed={state.speed}
            onSpeedChange={(speed) => dispatch({ type: 'SET_SPEED', speed })}
            onReset={onReset}
            isRunning={state.isRunning}
            onPlay={onPlay}
            onStop={onStop}
            onStep={onStep}
          />
        </footer>

        {/* ── Feedback overlays (full-screen modals) ─────────────────────────── */}

        {state.feedback?.type === 'success' && (
          <SuccessModal
            message={state.feedback.message}
            onNextTask={() => {
              dispatch({ type: 'SET_FEEDBACK', feedback: null })
              // Find next unsolved task that is accessible and not the current one
              const nextTask = allTasks.find(t =>
                !state.progress.solved.includes(t.id) &&
                isTaskAccessible(t, state.progress) &&
                t.id !== state.currentTask?.id
              )
              if (nextTask) loadTask(nextTask)
            }}
            onClose={() => dispatch({ type: 'SET_FEEDBACK', feedback: null })}
          />
        )}

        {state.feedback?.type === 'levelComplete' && (
          <LevelCompleteModal
            level={state.feedback.level ?? 1}
            message={state.feedback.message}
            onClose={() => dispatch({ type: 'SET_FEEDBACK', feedback: null })}
            hasNextLevel={(state.feedback.level ?? 1) < 3}
          />
        )}

      </div>
    </GameContext.Provider>
  )
}

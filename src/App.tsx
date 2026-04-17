import { createContext, useContext, useReducer, useRef, useCallback, useEffect } from 'react'
import * as Blockly from 'blockly'
import type { WorldState, TaskDefinition, SpeedSetting, FeedbackState, Program, Direction, Wall, Position } from './engine/types'
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
import SandboxGrid from './components/Sandbox/SandboxGrid'
import SandboxToolbar from './components/Sandbox/SandboxToolbar'
import { exportSandbox, importSandbox } from './components/Sandbox/sandboxExport'
import type { SandboxTool, SandboxGoalState } from './components/Sandbox/sandboxTypes'
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
  // Sandbox mode
  sandboxMode: boolean
  sandboxEditMode: boolean
  sandboxTool: SandboxTool
  sandboxDirection: Direction
  sandboxGoalEnabled: boolean
  sandboxGoal: SandboxGoalState
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
  // Sandbox actions
  | { type: 'ENTER_SANDBOX' }
  | { type: 'EXIT_SANDBOX' }
  | { type: 'SET_SANDBOX_TOOL'; tool: SandboxTool }
  | { type: 'SET_SANDBOX_DIRECTION'; direction: Direction }
  | { type: 'SANDBOX_CLICK_CELL'; position: Position }
  | { type: 'SANDBOX_CLICK_EDGE'; wall: Wall }
  | { type: 'SANDBOX_TOGGLE_GOAL' }
  | { type: 'SANDBOX_SET_EDIT_MODE'; editing: boolean }
  | { type: 'SANDBOX_IMPORT'; data: string }
  | { type: 'SANDBOX_CLEAR' }

// ─── Sandbox helpers ─────────────────────────────────────────────────────────

function makeEmptyWorld(): WorldState {
  return {
    width: config.grid.width,
    height: config.grid.height,
    karel: { position: { x: 0, y: 0 }, direction: 'east' },
    beepers: [],
    walls: [],
  }
}

function buildSandboxTask(
  world: WorldState,
  goalEnabled: boolean,
  goal: SandboxGoalState,
): TaskDefinition {
  return {
    id: 'sandbox',
    level: 3,
    title: 'Sandbox',
    description: 'Dein eigenes Level!',
    grid: {
      walls: world.walls.map(w => ({ ...w })),
      beepers: world.beepers.map(b => ({ ...b })),
    },
    karel: {
      position: { ...world.karel.position },
      direction: world.karel.direction,
    },
    goal: goalEnabled ? {
      karel: goal.karel ? { position: { ...goal.karel.position }, direction: goal.karel.direction } : undefined,
      beepers: goal.beepers.length > 0 ? goal.beepers.map(b => ({ ...b })) : undefined,
    } : {},
  }
}

/** Check if two walls represent the same physical edge (bidirectional). */
function wallsEqual(a: Wall, b: Wall): boolean {
  if (a.x === b.x && a.y === b.y && a.side === b.side) return true
  // Check mirrored: east of (3,5) = west of (4,5), etc.
  if (a.side === 'east'  && b.side === 'west'  && a.x + 1 === b.x && a.y === b.y) return true
  if (a.side === 'west'  && b.side === 'east'  && a.x - 1 === b.x && a.y === b.y) return true
  if (a.side === 'south' && b.side === 'north' && a.x === b.x && a.y + 1 === b.y) return true
  if (a.side === 'north' && b.side === 'south' && a.x === b.x && a.y - 1 === b.y) return true
  return false
}

function posEqual(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y
}

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

    // ── Sandbox actions ────────────────────────────────────────────────────────

    case 'ENTER_SANDBOX': {
      const world = makeEmptyWorld()
      const defaultGoal: SandboxGoalState = { beepers: [] }
      return {
        ...state,
        sandboxMode: true,
        sandboxEditMode: true,
        sandboxTool: 'beeper',
        sandboxDirection: 'east',
        sandboxGoalEnabled: false,
        sandboxGoal: defaultGoal,
        currentTask: buildSandboxTask(world, false, defaultGoal),
        initialWorld: world,
        worldState: world,
        isRunning: false,
        feedback: null,
        showGoal: false,
      }
    }

    case 'EXIT_SANDBOX': {
      const firstTask = allTasks[0] ?? null
      const world = firstTask ? createWorld(firstTask) : null
      return {
        ...state,
        sandboxMode: false,
        sandboxEditMode: true,
        currentTask: firstTask,
        initialWorld: world,
        worldState: world,
        isRunning: false,
        feedback: null,
      }
    }

    case 'SET_SANDBOX_TOOL':
      return { ...state, sandboxTool: action.tool }

    case 'SET_SANDBOX_DIRECTION':
      return { ...state, sandboxDirection: action.direction }

    case 'SANDBOX_TOGGLE_GOAL':
      return { ...state, sandboxGoalEnabled: !state.sandboxGoalEnabled, showGoal: !state.sandboxGoalEnabled }

    case 'SANDBOX_CLICK_CELL': {
      if (!state.initialWorld || !state.sandboxEditMode) return state
      const { position } = action
      const world = { ...state.initialWorld }

      switch (state.sandboxTool) {
        case 'rex': {
          const updated = {
            ...world,
            karel: { position: { ...position }, direction: state.sandboxDirection },
          }
          return { ...state, initialWorld: updated, worldState: updated }
        }
        case 'beeper': {
          const idx = world.beepers.findIndex(b => posEqual(b, position))
          const beepers = idx >= 0
            ? world.beepers.filter((_, i) => i !== idx)
            : [...world.beepers, { ...position }]
          const updated = { ...world, beepers }
          return { ...state, initialWorld: updated, worldState: updated }
        }
        case 'eraser': {
          const beepers = world.beepers.filter(b => !posEqual(b, position))
          const updated = { ...world, beepers }
          return { ...state, initialWorld: updated, worldState: updated }
        }
        case 'goalRex': {
          const goalKarel = { position: { ...position }, direction: state.sandboxDirection }
          return { ...state, sandboxGoal: { ...state.sandboxGoal, karel: goalKarel } }
        }
        case 'goalBeeper': {
          const goalBeepers = state.sandboxGoal.beepers
          const idx = goalBeepers.findIndex(b => posEqual(b, position))
          const newGoalBeepers = idx >= 0
            ? goalBeepers.filter((_, i) => i !== idx)
            : [...goalBeepers, { ...position }]
          return { ...state, sandboxGoal: { ...state.sandboxGoal, beepers: newGoalBeepers } }
        }
        default:
          return state
      }
    }

    case 'SANDBOX_CLICK_EDGE': {
      if (!state.initialWorld || !state.sandboxEditMode) return state
      const world = { ...state.initialWorld }
      const clickedWall = action.wall

      switch (state.sandboxTool) {
        case 'wall': {
          const idx = world.walls.findIndex(w => wallsEqual(w, clickedWall))
          const walls = idx >= 0
            ? world.walls.filter((_, i) => i !== idx)
            : [...world.walls, { ...clickedWall }]
          const updated = { ...world, walls }
          return { ...state, initialWorld: updated, worldState: updated }
        }
        case 'eraser': {
          const walls = world.walls.filter(w => !wallsEqual(w, clickedWall))
          const updated = { ...world, walls }
          return { ...state, initialWorld: updated, worldState: updated }
        }
        default:
          return state
      }
    }

    case 'SANDBOX_SET_EDIT_MODE': {
      if (action.editing) {
        return {
          ...state,
          sandboxEditMode: true,
          worldState: state.initialWorld,
          isRunning: false,
          feedback: null,
        }
      } else {
        const task = buildSandboxTask(state.initialWorld!, state.sandboxGoalEnabled, state.sandboxGoal)
        return {
          ...state,
          sandboxEditMode: false,
          currentTask: task,
        }
      }
    }

    case 'SANDBOX_IMPORT': {
      const imported = importSandbox(action.data)
      if (!imported) return state
      const world: WorldState = {
        width: config.grid.width,
        height: config.grid.height,
        karel: { position: { ...imported.karel.position }, direction: imported.karel.direction },
        beepers: imported.grid.beepers.map(b => ({ ...b })),
        walls: imported.grid.walls.map(w => ({ ...w })),
      }
      const hasGoalKarel = imported.goal?.karel?.position !== undefined
      const hasGoalBeepers = imported.goal?.beepers !== undefined && imported.goal.beepers.length > 0
      const goalEnabled = hasGoalKarel || hasGoalBeepers
      const goal: SandboxGoalState = {
        karel: hasGoalKarel ? {
          position: { ...imported.goal!.karel!.position! },
          direction: imported.goal!.karel!.direction ?? 'east',
        } : undefined,
        beepers: hasGoalBeepers ? imported.goal!.beepers!.map(b => ({ ...b })) : [],
      }
      return {
        ...state,
        sandboxMode: true,
        sandboxEditMode: true,
        sandboxGoalEnabled: goalEnabled,
        sandboxGoal: goal,
        showGoal: goalEnabled,
        initialWorld: world,
        worldState: world,
        currentTask: buildSandboxTask(world, goalEnabled, goal),
        isRunning: false,
        feedback: null,
      }
    }

    case 'SANDBOX_CLEAR': {
      const world = makeEmptyWorld()
      const defaultGoal: SandboxGoalState = { beepers: [] }
      return {
        ...state,
        sandboxGoalEnabled: false,
        sandboxGoal: defaultGoal,
        showGoal: false,
        initialWorld: world,
        worldState: world,
        currentTask: buildSandboxTask(world, false, defaultGoal),
        isRunning: false,
        feedback: null,
      }
    }

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
    sandboxMode: false,
    sandboxEditMode: true,
    sandboxTool: 'beeper',
    sandboxDirection: 'east',
    sandboxGoalEnabled: false,
    sandboxGoal: { beepers: [] },
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
  onEnterSandbox: () => void
  onExitSandbox: () => void
  onSandboxStartRun: () => void
  onSandboxBackToEdit: () => void
  onSandboxExport: () => void
  onSandboxImport: (data: string) => void
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

  // ── onStop ───────────────────────────────────────────────────────────────────

  const onStop = useCallback(() => {
    abortRef.current?.()
    abortRef.current = null
    dispatch({ type: 'SET_RUNNING', running: false })
  }, [])

  // ── onPlay ──────────────────────────────────────────────────────────────────

  const onPlay = useCallback(() => {
    const { currentTask, initialWorld } = stateRef.current
    if (!getProgramRef.current || !currentTask || !initialWorld) return

    // Stop any running execution first (full reset)
    onStop()

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

    const isSandbox = stateRef.current.sandboxMode

    const abort = executeActions(
      result.actions,
      stateRef.current.speed,
      {
        onStep: (action) => dispatch({ type: 'UPDATE_WORLD', state: action.resultState }),
        onComplete: () => {
          dispatch({ type: 'SET_RUNNING', running: false })
          const task = stateRef.current.currentTask!

          if (isSandbox && !stateRef.current.sandboxGoalEnabled) {
            dispatch({
              type: 'SET_FEEDBACK',
              feedback: { type: 'success', message: 'Programm fertig!' },
            })
            return
          }

          const validation = validate(result.finalState, task)
          if (validation.success) {
            if (!isSandbox) {
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
                return
              }
            }
            dispatch({
              type: 'SET_FEEDBACK',
              feedback: { type: 'success', message: isSandbox ? 'Ziel erreicht!' : config.messages.success.taskComplete },
            })
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
  }, [onStop])

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
      const isSandbox = stateRef.current.sandboxMode

      if (isSandbox && !stateRef.current.sandboxGoalEnabled) {
        dispatch({
          type: 'SET_FEEDBACK',
          feedback: { type: 'success', message: 'Programm fertig!' },
        })
        return
      }

      const validation = validate(lastState, currentTask)
      if (validation.success) {
        if (!isSandbox) {
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
            return
          }
        }
        dispatch({
          type: 'SET_FEEDBACK',
          feedback: { type: 'success', message: isSandbox ? 'Ziel erreicht!' : config.messages.success.taskComplete },
        })
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
    // If in sandbox mode, exit it first
    if (stateRef.current.sandboxMode) {
      dispatch({ type: 'EXIT_SANDBOX' })
    }
    dispatch({ type: 'LOAD_TASK', task })
    actionsRef.current = null
    stepIndexRef.current = 0
  }, [onStop])

  // ── Sandbox callbacks ─────────────────────────────────────────────────────

  const onEnterSandbox = useCallback(() => {
    onStop()
    dispatch({ type: 'ENTER_SANDBOX' })
    actionsRef.current = null
    stepIndexRef.current = 0
  }, [onStop])

  const onExitSandbox = useCallback(() => {
    onStop()
    dispatch({ type: 'EXIT_SANDBOX' })
    actionsRef.current = null
    stepIndexRef.current = 0
    // Re-load the first task
    const firstTask = allTasks[0]
    if (firstTask) dispatch({ type: 'LOAD_TASK', task: firstTask })
  }, [onStop])

  const onSandboxStartRun = useCallback(() => {
    dispatch({ type: 'SANDBOX_SET_EDIT_MODE', editing: false })
    actionsRef.current = null
    stepIndexRef.current = 0
  }, [])

  const onSandboxBackToEdit = useCallback(() => {
    onStop()
    dispatch({ type: 'SANDBOX_SET_EDIT_MODE', editing: true })
    actionsRef.current = null
    stepIndexRef.current = 0
  }, [onStop])

  const onSandboxExport = useCallback(() => {
    const { initialWorld, sandboxGoalEnabled, sandboxGoal } = stateRef.current
    if (!initialWorld) return
    exportSandbox(initialWorld, sandboxGoalEnabled ? sandboxGoal : null)
  }, [])

  const onSandboxImport = useCallback((data: string) => {
    onStop()
    dispatch({ type: 'SANDBOX_IMPORT', data })
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
    onEnterSandbox,
    onExitSandbox,
    onSandboxStartRun,
    onSandboxBackToEdit,
    onSandboxExport,
    onSandboxImport,
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
          <h1 className="text-xl font-bold text-gray-800">Rex der Dino</h1>
          <span className="text-sm text-gray-600 font-medium">
            {state.sandboxMode ? 'Sandbox' : (state.currentTask?.title ?? '')}
          </span>
          <div className="flex items-center gap-3">
            <ProgressBar
              solvedCount={state.progress.solved.length}
              totalCount={allTasks.length}
            />
            <button
              onClick={() => {
                const confirmed = window.confirm('Fortschritt wirklich zurücksetzen? Alle Sterne gehen verloren!')
                if (confirmed) {
                  localStorage.removeItem('karel-progress')
                  dispatch({ type: 'SET_PROGRESS', progress: loadProgress() })
                }
              }}
              className="text-xs px-2 py-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Fortschritt zurücksetzen"
            >
              Zurücksetzen
            </button>
          </div>
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
              currentTaskId={state.sandboxMode ? null : (state.currentTask?.id ?? null)}
              solvedTasks={state.progress.solved}
              onSelectTask={loadTask}
              sandboxMode={state.sandboxMode}
              onEnterSandbox={onEnterSandbox}
            />
          </aside>

          {/* Column 2: Grid + Karel */}
          <section className="bg-gray-50 border-r border-gray-200 overflow-hidden flex flex-col">
            {state.sandboxMode && state.sandboxEditMode ? (
              <SandboxToolbar />
            ) : (
              <div className="px-4 py-3 border-b border-gray-100 bg-white shrink-0 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  {state.sandboxMode ? 'Sandbox' : 'Welt'}
                </h2>
                <div className="flex items-center gap-2">
                  {state.sandboxMode && !state.sandboxEditMode && (
                    <button
                      onClick={onSandboxBackToEdit}
                      className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700 hover:bg-purple-200"
                    >
                      Bearbeiten
                    </button>
                  )}
                  <button
                    onClick={() => dispatch({ type: 'TOGGLE_GOAL' })}
                    className={`text-xs px-2 py-1 rounded ${state.showGoal ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    title="Zielzustand ein-/ausblenden"
                  >
                    {state.showGoal ? '👁 Ziel ausblenden' : '👁 Ziel anzeigen'}
                  </button>
                </div>
              </div>
            )}
            <div className="flex-1 overflow-hidden p-4 flex flex-col items-center justify-center gap-3 relative">
              <div className="w-full flex-1 flex items-center justify-center min-h-0">
                {state.sandboxMode && state.sandboxEditMode ? (
                  <SandboxGrid
                    worldState={state.worldState}
                    goalState={state.sandboxGoalEnabled ? {
                      karel: state.sandboxGoal.karel ? { position: state.sandboxGoal.karel.position, direction: state.sandboxGoal.karel.direction } : undefined,
                      beepers: state.sandboxGoal.beepers.length > 0 ? state.sandboxGoal.beepers : undefined,
                    } : undefined}
                    showGoal={state.showGoal}
                  />
                ) : (
                  <Grid
                    worldState={state.worldState}
                    goalState={state.sandboxMode && state.sandboxGoalEnabled ? {
                      karel: state.sandboxGoal.karel ? { position: state.sandboxGoal.karel.position, direction: state.sandboxGoal.karel.direction } : undefined,
                      beepers: state.sandboxGoal.beepers.length > 0 ? state.sandboxGoal.beepers : undefined,
                    } : state.currentTask?.goal}
                    showGoal={state.showGoal}
                    animationDuration={config.execution.speeds[state.speed]}
                    isError={state.feedback?.type === 'error'}
                  />
                )}
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
              level={state.sandboxMode ? 3 : (state.currentTask?.level ?? 1)}
              workspaceRef={workspaceRef}
              getProgramRef={getProgramRef}
            />
          </section>

        </main>

        {/* Footer: Controls */}
        <footer
          className="flex-none bg-white border-t border-gray-200 px-6 flex items-center justify-center gap-4"
          style={{ height: '60px' }}
        >
          {state.sandboxMode && state.sandboxEditMode ? (
            <button
              onClick={onSandboxStartRun}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Testen
            </button>
          ) : (
            <Controls
              speed={state.speed}
              onSpeedChange={(speed) => dispatch({ type: 'SET_SPEED', speed })}
              onReset={onReset}
              isRunning={state.isRunning}
              onPlay={onPlay}
              onStop={onStop}
              onStep={onStep}
            />
          )}
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

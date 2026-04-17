import type { CommandName, ConditionName, Direction, Position, TaskDefinition, WorldState } from './types'
import { config } from '../config'

/**
 * Creates an initial WorldState from a task definition.
 * The returned state is the starting configuration for the task.
 */
export function createWorld(task: TaskDefinition): WorldState {
  return {
    width: 10,    // Always 10x10 grid (from config)
    height: 10,
    karel: {
      position: { ...task.karel.position },
      direction: task.karel.direction,
    },
    beepers: task.grid.beepers.map(b => ({ ...b })),
    walls: task.grid.walls.map(w => ({ ...w })),
  }
}

/**
 * Deep-clones a WorldState.
 * Used to produce new states for immutable operations in the engine.
 */
export function cloneState(state: WorldState): WorldState {
  return {
    width: state.width,
    height: state.height,
    karel: {
      position: { ...state.karel.position },
      direction: state.karel.direction,
    },
    beepers: state.beepers.map(b => ({ ...b })),
    walls: state.walls.map(w => ({ ...w })),
  }
}

/**
 * Returns true if two positions refer to the same grid cell.
 * Used throughout the engine to compare Karel's position against beepers, walls, etc.
 */
export function posEqual(a: { x: number; y: number }, b: { x: number; y: number }): boolean {
  return a.x === b.x && a.y === b.y
}

// ─── T-012: Wall collision detection ─────────────────────────────────────────

/**
 * Returns the adjacent cell position in the given direction.
 * Does not check bounds — the caller must validate the result.
 */
export function getNextPosition(pos: Position, dir: Direction): Position {
  switch (dir) {
    case 'north': return { x: pos.x,     y: pos.y - 1 }
    case 'south': return { x: pos.x,     y: pos.y + 1 }
    case 'east':  return { x: pos.x + 1, y: pos.y     }
    case 'west':  return { x: pos.x - 1, y: pos.y     }
  }
}

/** Opposite side of a wall direction — used for bidirectional wall checks. */
function oppositeSide(side: Direction): Direction {
  switch (side) {
    case 'north': return 'south'
    case 'south': return 'north'
    case 'east':  return 'west'
    case 'west':  return 'east'
  }
}

/**
 * Check if Karel can move in a given direction from his current position.
 *
 * A wall at {x:3, y:5, side:'east'} blocks both (3,5)→east and (4,5)→west.
 * Grid boundaries are implicit walls.
 */
export function canMove(state: WorldState, direction: Direction): boolean {
  const { position } = state.karel
  const next = getNextPosition(position, direction)

  // Grid boundary check
  if (next.x < 0 || next.x >= state.width || next.y < 0 || next.y >= state.height) {
    return false
  }

  // Explicit wall check — bidirectional:
  //   wall on the "leaving" side of the current cell, OR
  //   wall on the "entering" side of the destination cell
  const blocked = state.walls.some(
    w =>
      (w.x === position.x && w.y === position.y && w.side === direction) ||
      (w.x === next.x    && w.y === next.y    && w.side === oppositeSide(direction))
  )

  return !blocked
}

// ─── T-013: Direction helpers & conditions ────────────────────────────────────

/**
 * Returns the direction 90° to the left or right of the given direction.
 */
export function turnDirection(dir: Direction, turn: 'left' | 'right'): Direction {
  const order: Direction[] = ['north', 'east', 'south', 'west']
  const idx = order.indexOf(dir)
  if (turn === 'left') {
    return order[(idx + 3) % 4]   // −1 mod 4
  } else {
    return order[(idx + 1) % 4]   // +1 mod 4
  }
}

/** Is there a beeper at Karel's current position? */
export function onBeeper(state: WorldState): boolean {
  return state.beepers.some(b => posEqual(b, state.karel.position))
}

/** Is there a beeper in the cell directly ahead of Karel? */
export function beeperAhead(state: WorldState): boolean {
  const next = getNextPosition(state.karel.position, state.karel.direction)
  return state.beepers.some(b => posEqual(b, next))
}

/** Can Karel move forward (no wall, no grid boundary)? */
export function frontIsClear(state: WorldState): boolean {
  return canMove(state, state.karel.direction)
}

/** Can Karel move in the direction 90° to his left? */
export function leftIsClear(state: WorldState): boolean {
  return canMove(state, turnDirection(state.karel.direction, 'left'))
}

/** Can Karel move in the direction 90° to his right? */
export function rightIsClear(state: WorldState): boolean {
  return canMove(state, turnDirection(state.karel.direction, 'right'))
}

// ─── T-011: Movement commands (all immutable — return new WorldState) ─────────

/**
 * Move Karel one cell forward.
 * Throws if a wall or grid boundary blocks the way.
 */
export function moveForward(state: WorldState): WorldState {
  if (!canMove(state, state.karel.direction)) {
    throw new Error(config.messages.errors.wallCollision)
  }
  const next = getNextPosition(state.karel.position, state.karel.direction)
  const newState = cloneState(state)
  newState.karel.position = next
  return newState
}

/** Rotate Karel 90° counter-clockwise (left). */
export function turnLeft(state: WorldState): WorldState {
  const newState = cloneState(state)
  newState.karel.direction = turnDirection(state.karel.direction, 'left')
  return newState
}

/** Rotate Karel 90° clockwise (right). */
export function turnRight(state: WorldState): WorldState {
  const newState = cloneState(state)
  newState.karel.direction = turnDirection(state.karel.direction, 'right')
  return newState
}

/**
 * Pick up the beeper at Karel's current position.
 * Throws if there is no beeper here.
 */
export function pickBeeper(state: WorldState): WorldState {
  const idx = state.beepers.findIndex(b => posEqual(b, state.karel.position))
  if (idx === -1) {
    throw new Error(config.messages.errors.noBeeper)
  }
  const newState = cloneState(state)
  newState.beepers.splice(idx, 1)
  return newState
}

/**
 * Drop a beeper at Karel's current position.
 * Throws if a beeper is already here.
 */
export function dropBeeper(state: WorldState): WorldState {
  if (state.beepers.some(b => posEqual(b, state.karel.position))) {
    throw new Error(config.messages.errors.hasBeeper)
  }
  const newState = cloneState(state)
  newState.beepers.push({ ...state.karel.position })
  return newState
}

// ─── T-015: Command / condition dispatch ─────────────────────────────────────

/** Execute a command by name and return the resulting WorldState. */
export function executeCommand(state: WorldState, command: CommandName): WorldState {
  switch (command) {
    case 'moveForward': return moveForward(state)
    case 'turnLeft':    return turnLeft(state)
    case 'turnRight':   return turnRight(state)
    case 'pickBeeper':  return pickBeeper(state)
    case 'dropBeeper':  return dropBeeper(state)
  }
}

/** Evaluate a condition by name and return its boolean result. */
export function evaluateCondition(state: WorldState, condition: ConditionName): boolean {
  switch (condition) {
    case 'onBeeper':     return onBeeper(state)
    case 'beeperAhead':  return beeperAhead(state)
    case 'frontIsClear': return frontIsClear(state)
    case 'leftIsClear':  return leftIsClear(state)
    case 'rightIsClear': return rightIsClear(state)
  }
}

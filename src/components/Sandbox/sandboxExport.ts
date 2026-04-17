import type { WorldState, TaskDefinition } from '../../engine/types'
import type { SandboxGoalState } from './sandboxTypes'

export function exportSandbox(world: WorldState, goal: SandboxGoalState | null): void {
  const taskDef: TaskDefinition = {
    id: `custom-${Date.now()}`,
    level: 3,
    title: 'Sandbox Level',
    description: 'Ein eigenes Level.',
    grid: {
      walls: world.walls.map(w => ({ x: w.x, y: w.y, side: w.side })),
      beepers: world.beepers.map(b => ({ x: b.x, y: b.y })),
    },
    karel: {
      position: { x: world.karel.position.x, y: world.karel.position.y },
      direction: world.karel.direction,
    },
    goal: goal ? {
      karel: goal.karel ? { position: { x: goal.karel.position.x, y: goal.karel.position.y }, direction: goal.karel.direction } : undefined,
      beepers: goal.beepers.length > 0 ? goal.beepers.map(b => ({ x: b.x, y: b.y })) : undefined,
    } : {},
  }

  const json = JSON.stringify(taskDef, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'rex-level.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const VALID_DIRECTIONS = ['north', 'south', 'east', 'west']
const VALID_SIDES = ['north', 'south', 'east', 'west']

export function importSandbox(data: string): TaskDefinition | null {
  try {
    const obj = JSON.parse(data)
    if (!obj || typeof obj !== 'object') return null

    // Validate karel
    if (!obj.karel?.position || typeof obj.karel.position.x !== 'number' || typeof obj.karel.position.y !== 'number') return null
    if (!VALID_DIRECTIONS.includes(obj.karel.direction)) return null

    // Validate grid
    if (!obj.grid || !Array.isArray(obj.grid.beepers) || !Array.isArray(obj.grid.walls)) return null
    for (const b of obj.grid.beepers) {
      if (typeof b.x !== 'number' || typeof b.y !== 'number') return null
    }
    for (const w of obj.grid.walls) {
      if (typeof w.x !== 'number' || typeof w.y !== 'number' || !VALID_SIDES.includes(w.side)) return null
    }

    return obj as TaskDefinition
  } catch {
    return null
  }
}

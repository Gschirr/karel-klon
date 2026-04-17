import type { Position, Direction } from '../../engine/types'

export type SandboxTool = 'rex' | 'beeper' | 'wall' | 'eraser' | 'goalRex' | 'goalBeeper'

export interface SandboxGoalState {
  karel?: { position: Position; direction: Direction }
  beepers: Position[]
}

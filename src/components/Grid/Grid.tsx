import type { WorldState, Position, Direction } from '../../engine/types'
import { config } from '../../config'
import Karel from '../Karel/Karel'
import GoalPreview from './GoalPreview'

interface GridProps {
  worldState: WorldState | null
  goalState?: { karel?: { position?: Position; direction?: Direction }; beepers?: Position[] }
  showGoal?: boolean
  animationDuration?: number
  isError?: boolean
}

function wallLineCoords(x: number, y: number, side: 'north' | 'south' | 'east' | 'west', cellSize: number) {
  switch (side) {
    case 'north': return { x1: x * cellSize,       y1: y * cellSize,       x2: (x + 1) * cellSize, y2: y * cellSize       }
    case 'south': return { x1: x * cellSize,       y1: (y + 1) * cellSize, x2: (x + 1) * cellSize, y2: (y + 1) * cellSize }
    case 'east':  return { x1: (x + 1) * cellSize, y1: y * cellSize,       x2: (x + 1) * cellSize, y2: (y + 1) * cellSize }
    case 'west':  return { x1: x * cellSize,       y1: y * cellSize,       x2: x * cellSize,        y2: (y + 1) * cellSize }
  }
}

export default function Grid({ worldState, goalState, showGoal = false, animationDuration = 200, isError = false }: GridProps) {
  const { width, height, cellSize } = config.grid
  const totalWidth = width * cellSize
  const totalHeight = height * cellSize
  const beeperSize = cellSize * 0.7
  const beeperOffset = (cellSize - beeperSize) / 2

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      preserveAspectRatio="xMidYMid meet"
      width="100%"
      height="100%"
    >
      {/* Background */}
      <rect width={totalWidth} height={totalHeight} fill="var(--color-grid-bg)" />

      {/* Vertical grid lines */}
      {Array.from({ length: width + 1 }, (_, i) => (
        <line
          key={`v${i}`}
          x1={i * cellSize}
          y1={0}
          x2={i * cellSize}
          y2={totalHeight}
          stroke="var(--color-grid-line)"
          strokeWidth={1}
        />
      ))}

      {/* Horizontal grid lines */}
      {Array.from({ length: height + 1 }, (_, i) => (
        <line
          key={`h${i}`}
          x1={0}
          y1={i * cellSize}
          x2={totalWidth}
          y2={i * cellSize}
          stroke="var(--color-grid-line)"
          strokeWidth={1}
        />
      ))}

      {/* Grid border */}
      <rect
        width={totalWidth}
        height={totalHeight}
        fill="none"
        stroke="var(--color-wall)"
        strokeWidth={3}
      />

      {/* Internal walls */}
      {worldState?.walls.map((wall, i) => {
        const { x1, y1, x2, y2 } = wallLineCoords(wall.x, wall.y, wall.side, cellSize)
        return (
          <line
            key={`wall-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#333333"
            strokeWidth={4}
            strokeLinecap="square"
          />
        )
      })}

      {/* Beepers */}
      {worldState?.beepers.map((beeper, i) => (
        <image
          key={`beeper-${i}`}
          href={config.assets.beeperSvg}
          x={beeper.x * cellSize + beeperOffset}
          y={beeper.y * cellSize + beeperOffset}
          width={beeperSize}
          height={beeperSize}
        />
      ))}

      {/* Goal preview overlay */}
      {showGoal && goalState && (
        <GoalPreview goal={goalState} />
      )}

      {/* Karel */}
      {worldState && (
        <Karel
          position={worldState.karel.position}
          direction={worldState.karel.direction}
          animationDuration={animationDuration}
          isError={isError}
        />
      )}
    </svg>
  )
}

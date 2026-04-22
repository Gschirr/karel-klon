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
  const { width, height, cellSize, labelGutter } = config.grid
  const totalWidth = width * cellSize
  const totalHeight = height * cellSize
  const beeperSize = cellSize * 0.7
  const beeperOffset = (cellSize - beeperSize) / 2

  return (
    <svg
      viewBox={`${-labelGutter - 1.5} ${-labelGutter - 1.5} ${totalWidth + labelGutter + 3} ${totalHeight + labelGutter + 3}`}
      preserveAspectRatio="xMidYMid meet"
      width="100%"
      height="100%"
    >
      {/* Column labels (top) */}
      {Array.from({ length: width }, (_, col) => (
        <text
          key={`col-label-${col}`}
          x={col * cellSize + cellSize / 2}
          y={-labelGutter / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#888"
          fontSize={14}
          fontFamily="sans-serif"
        >
          {col}
        </text>
      ))}

      {/* Row labels (left) */}
      {Array.from({ length: height }, (_, row) => (
        <text
          key={`row-label-${row}`}
          x={-labelGutter / 2}
          y={row * cellSize + cellSize / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#888"
          fontSize={14}
          fontFamily="sans-serif"
        >
          {row}
        </text>
      ))}

      {/* Clip path for rounded corners */}
      <defs>
        <clipPath id="grid-clip">
          <rect width={totalWidth} height={totalHeight} rx={8} ry={8} />
        </clipPath>
      </defs>

      {/* Clipped content (checkerboard + grid lines) */}
      <g clipPath="url(#grid-clip)">
        {/* Checkerboard background */}
        {Array.from({ length: height }, (_, row) =>
          Array.from({ length: width }, (_, col) => (
            <rect
              key={`cell-${col}-${row}`}
              x={col * cellSize}
              y={row * cellSize}
              width={cellSize}
              height={cellSize}
              fill={(col + row) % 2 === 0
                ? 'var(--color-cell-a)'
                : 'var(--color-cell-b)'}
            />
          ))
        )}

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
      </g>

      {/* Grid border (outside clip, so it's rounded itself) */}
      <rect
        width={totalWidth}
        height={totalHeight}
        fill="none"
        stroke="var(--color-wall)"
        strokeWidth={3}
        rx={8}
        ry={8}
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

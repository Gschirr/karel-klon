import type { Position, Direction } from '../../engine/types'
import { config } from '../../config'

interface GoalPreviewProps {
  goal: {
    karel?: { position?: Position; direction?: Direction }
    beepers?: Position[]
  }
}

const ROTATION: Record<Direction, number> = {
  east: 0,
  south: 90,
  west: 180,
  north: 270,
}

export default function GoalPreview({ goal }: GoalPreviewProps) {
  const { cellSize } = config.grid
  const beeperSize = cellSize * 0.7
  const beeperOffset = (cellSize - beeperSize) / 2
  const karelSize = cellSize * 0.8

  return (
    <g opacity={0.4}>
      {/* Goal beepers */}
      {goal.beepers?.map((beeper, i) => (
        <image
          key={`goal-beeper-${i}`}
          href={config.assets.beeperSvg}
          x={beeper.x * cellSize + beeperOffset}
          y={beeper.y * cellSize + beeperOffset}
          width={beeperSize}
          height={beeperSize}
        />
      ))}

      {/* Goal Karel position */}
      {goal.karel?.position && (() => {
        const pos = goal.karel.position
        const dir: Direction = goal.karel.direction ?? 'east'
        const deg = ROTATION[dir]
        const centerX = pos.x * cellSize + cellSize / 2
        const centerY = pos.y * cellSize + cellSize / 2
        return (
          <g
            style={{
              transform: `translate(${centerX}px, ${centerY}px) rotate(${deg}deg)`,
              transformOrigin: '0px 0px',
            }}
          >
            <image
              href={config.assets.karelSvg}
              x={-karelSize / 2}
              y={-karelSize / 2}
              width={karelSize}
              height={karelSize}
            />
          </g>
        )
      })()}
    </g>
  )
}

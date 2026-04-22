import type { Position, Direction } from '../../engine/types'
import { config } from '../../config'

interface KarelProps {
  position: Position
  direction: Direction
  animationDuration?: number  // ms, default 200
  isError?: boolean           // triggers shake animation
}

const ROTATION: Record<Direction, number> = {
  east: 0,
  south: 90,
  west: 180,
  north: 270,
}

export default function Karel({ position, direction, animationDuration = 200, isError = false }: KarelProps) {
  const { cellSize } = config.grid
  const size = cellSize * 0.8
  const centerX = position.x * cellSize + cellSize / 2
  const centerY = position.y * cellSize + cellSize / 2

  // Use CSS transform so the browser can animate both translate and rotate smoothly.
  // SVG `transform` attribute does not support CSS transitions; the `style` property does.
  const deg = ROTATION[direction]
  const transform = `translate(${centerX}px, ${centerY}px) rotate(${deg}deg)`
  const transition = `transform ${animationDuration}ms ease-in-out`

  return (
    <>
      {/* ── Shake keyframes (injected once, harmless if duplicated) ── */}
      <defs>
        <style>{`
          @keyframes karelShake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
            20%, 40%, 60%, 80%      { transform: translateX(4px); }
          }
        `}</style>
      </defs>

      <g
        style={{
          transform,
          transition: isError ? undefined : transition,
          transformOrigin: '0px 0px',
        }}
      >
        {/* Shake wrapper — animates relative to Karel's center */}
        <g
          style={{
            animation: isError ? 'karelShake 0.5s ease-in-out' : undefined,
            transformOrigin: '0px 0px',
          }}
        >
          {/* Error indicator above Karel */}
          {isError && (
            <g aria-label="Fehler">
              <circle cx={0} cy={-size / 2 - 6} r={size * 0.18} fill="#DC2626" />
              <text
                x={0}
                y={-size / 2 - 6}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={size * 0.22}
                fill="white"
                fontWeight="bold"
                fontFamily="sans-serif"
              >
                !
              </text>
            </g>
          )}

          {/* Image is drawn offset so that (0,0) in this group is Karel's center */}
          <image
            href={config.assets.karelSvg}
            x={-size / 2}
            y={-size / 2}
            width={size}
            height={size}
          />
        </g>
      </g>
    </>
  )
}

import { useCallback, useState } from 'react'
import type { WorldState, Position, Direction, Wall } from '../../engine/types'
import { config } from '../../config'
import Grid from '../Grid/Grid'
import { useGame } from '../../App'

interface SandboxGridProps {
  worldState: WorldState | null
  goalState?: { karel?: { position?: Position; direction?: Direction }; beepers?: Position[] }
  showGoal?: boolean
}

type HoverTarget =
  | { kind: 'cell'; position: Position }
  | { kind: 'edge'; wall: Wall }
  | null

export default function SandboxGrid({ worldState, goalState, showGoal = false }: SandboxGridProps) {
  const { state, dispatch } = useGame()
  const { cellSize, width, height, labelGutter } = config.grid
  const totalWidth = width * cellSize
  const totalHeight = height * cellSize
  const margin = cellSize * 0.2

  const [hover, setHover] = useState<HoverTarget>(null)

  const svgToGrid = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return null
    const svgPt = pt.matrixTransform(ctm.inverse())
    return { x: svgPt.x, y: svgPt.y }
  }, [])

  const classifyClick = useCallback((svgX: number, svgY: number): HoverTarget => {
    const col = Math.floor(svgX / cellSize)
    const row = Math.floor(svgY / cellSize)

    if (col < 0 || col >= width || row < 0 || row >= height) return null

    const xInCell = svgX - col * cellSize
    const yInCell = svgY - row * cellSize

    // Check if near an edge (for wall placement)
    const nearWest = xInCell < margin
    const nearEast = xInCell > cellSize - margin
    const nearNorth = yInCell < margin
    const nearSouth = yInCell > cellSize - margin

    // Skip grid boundary edges
    if (nearNorth && row === 0) return { kind: 'cell', position: { x: col, y: row } }
    if (nearSouth && row === height - 1) return { kind: 'cell', position: { x: col, y: row } }
    if (nearWest && col === 0) return { kind: 'cell', position: { x: col, y: row } }
    if (nearEast && col === width - 1) return { kind: 'cell', position: { x: col, y: row } }

    if (nearNorth) return { kind: 'edge', wall: { x: col, y: row, side: 'north' } }
    if (nearSouth) return { kind: 'edge', wall: { x: col, y: row, side: 'south' } }
    if (nearWest) return { kind: 'edge', wall: { x: col, y: row, side: 'west' } }
    if (nearEast) return { kind: 'edge', wall: { x: col, y: row, side: 'east' } }

    return { kind: 'cell', position: { x: col, y: row } }
  }, [cellSize, width, height, margin])

  const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const pt = svgToGrid(e)
    if (!pt) return
    const target = classifyClick(pt.x, pt.y)
    if (!target) return

    if (target.kind === 'cell') {
      dispatch({ type: 'SANDBOX_CLICK_CELL', position: target.position })
    } else {
      dispatch({ type: 'SANDBOX_CLICK_EDGE', wall: target.wall })
    }
  }, [svgToGrid, classifyClick, dispatch])

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const pt = svgToGrid(e)
    if (!pt) { setHover(null); return }
    setHover(classifyClick(pt.x, pt.y))
  }, [svgToGrid, classifyClick])

  const handleMouseLeave = useCallback(() => setHover(null), [])

  // Determine cursor based on active tool
  const tool = state.sandboxTool
  const isWallTool = tool === 'wall'
  const isCellTool = tool === 'rex' || tool === 'beeper' || tool === 'eraser' || tool === 'goalRex' || tool === 'goalBeeper'
  const cursorClass = (hover?.kind === 'cell' && isCellTool) || (hover?.kind === 'edge' && isWallTool) || (hover?.kind === 'edge' && tool === 'eraser')
    ? 'cursor-pointer'
    : hover ? 'cursor-not-allowed' : 'cursor-crosshair'

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <Grid
        worldState={worldState}
        goalState={goalState}
        showGoal={showGoal}
        animationDuration={0}
        isError={false}
      />
      {/* Click overlay */}
      <svg
        className={`absolute inset-0 ${cursorClass}`}
        viewBox={`${-labelGutter - 1.5} ${-labelGutter - 1.5} ${totalWidth + labelGutter + 3} ${totalHeight + labelGutter + 3}`}
        preserveAspectRatio="xMidYMid meet"
        width="100%"
        height="100%"
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Transparent click target covering the grid area */}
        <rect x={0} y={0} width={totalWidth} height={totalHeight} fill="transparent" />

        {/* Hover preview */}
        {hover?.kind === 'cell' && isCellTool && (
          <rect
            x={hover.position.x * cellSize + 2}
            y={hover.position.y * cellSize + 2}
            width={cellSize - 4}
            height={cellSize - 4}
            fill={tool === 'eraser' ? 'rgba(239,68,68,0.15)' : tool === 'goalRex' || tool === 'goalBeeper' ? 'rgba(59,130,246,0.15)' : 'rgba(34,197,94,0.15)'}
            rx={4}
            stroke={tool === 'eraser' ? 'rgba(239,68,68,0.4)' : tool === 'goalRex' || tool === 'goalBeeper' ? 'rgba(59,130,246,0.4)' : 'rgba(34,197,94,0.4)'}
            strokeWidth={2}
          />
        )}
        {hover?.kind === 'edge' && (isWallTool || tool === 'eraser') && (() => {
          const w = hover.wall
          const coords = wallLineCoords(w.x, w.y, w.side, cellSize)
          return (
            <line
              x1={coords.x1} y1={coords.y1}
              x2={coords.x2} y2={coords.y2}
              stroke={tool === 'eraser' ? 'rgba(239,68,68,0.6)' : 'rgba(99,102,241,0.6)'}
              strokeWidth={6}
              strokeLinecap="square"
            />
          )
        })()}
      </svg>
    </div>
  )
}

function wallLineCoords(x: number, y: number, side: string, cellSize: number) {
  switch (side) {
    case 'north': return { x1: x * cellSize, y1: y * cellSize, x2: (x + 1) * cellSize, y2: y * cellSize }
    case 'south': return { x1: x * cellSize, y1: (y + 1) * cellSize, x2: (x + 1) * cellSize, y2: (y + 1) * cellSize }
    case 'east':  return { x1: (x + 1) * cellSize, y1: y * cellSize, x2: (x + 1) * cellSize, y2: (y + 1) * cellSize }
    case 'west':  return { x1: x * cellSize, y1: y * cellSize, x2: x * cellSize, y2: (y + 1) * cellSize }
    default:      return { x1: 0, y1: 0, x2: 0, y2: 0 }
  }
}

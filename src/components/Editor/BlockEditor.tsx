import * as Blockly from 'blockly'
import { useEffect, useRef } from 'react'
import { registerKarelBlocks, getToolboxForLevel } from '../../blocks/karelBlocks'
import { useGame } from '../../App'
import type { Level } from '../../engine/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ToolboxDef = any

interface BlockEditorProps {
  level: Level
  onWorkspaceChange?: (workspace: Blockly.WorkspaceSvg) => void
  workspaceRef?: React.MutableRefObject<Blockly.WorkspaceSvg | null>
}

export function BlockEditor({ level, onWorkspaceChange, workspaceRef }: BlockEditorProps) {
  const { state } = useGame()
  const sandbox = state.sandboxMode
  const containerRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<Blockly.WorkspaceSvg | null>(null)

  // Inject Blockly once on mount
  useEffect(() => {
    if (!containerRef.current) return

    registerKarelBlocks()

    const workspace = Blockly.inject(containerRef.current, {
      toolbox: getToolboxForLevel(level, sandbox) as ToolboxDef,
      grid: { spacing: 20, length: 3, colour: '#ccc', snap: true },
      trashcan: true,
      scrollbars: true,
      zoom: {
        controls: true,
        wheel: true,
        startScale: 1.0,
        maxScale: 2,
        minScale: 0.5,
      },
      renderer: 'zelos',
    })

    wsRef.current = workspace
    if (workspaceRef) {
      workspaceRef.current = workspace
    }

    if (onWorkspaceChange) {
      workspace.addChangeListener(() => {
        onWorkspaceChange(workspace)
      })
    }

    // Ensure Blockly renders correctly after layout stabilises.
    // requestAnimationFrame waits for the browser to finish layout.
    requestAnimationFrame(() => {
      Blockly.svgResize(workspace)
    })

    // ResizeObserver to keep Blockly in sync with container size
    const observer = new ResizeObserver(() => {
      Blockly.svgResize(workspace)
    })
    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
      workspace.dispose()
      wsRef.current = null
      if (workspaceRef) {
        workspaceRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update toolbox when level or sandbox mode changes (without re-injecting)
  useEffect(() => {
    if (!wsRef.current) return
    wsRef.current.updateToolbox(getToolboxForLevel(level, sandbox) as ToolboxDef)
  }, [level, sandbox])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', overflow: 'hidden' }}
    />
  )
}

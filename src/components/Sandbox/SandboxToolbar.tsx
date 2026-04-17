import { useRef } from 'react'
import { useGame } from '../../App'
import type { SandboxTool } from './sandboxTypes'
import type { Direction } from '../../engine/types'

const TOOLS: { id: SandboxTool; label: string; icon: string; group: 'place' | 'goal' }[] = [
  { id: 'rex',         label: 'Rex',         icon: '🦖', group: 'place' },
  { id: 'beeper',      label: 'Beeper',      icon: '💎', group: 'place' },
  { id: 'wall',        label: 'Wand',        icon: '🧱', group: 'place' },
  { id: 'eraser',      label: 'Radierer',    icon: '🧹', group: 'place' },
  { id: 'goalRex',     label: 'Ziel-Rex',    icon: '🎯', group: 'goal' },
  { id: 'goalBeeper',  label: 'Ziel-Beeper', icon: '⭐', group: 'goal' },
]

const DIRECTIONS: { dir: Direction; label: string; icon: string }[] = [
  { dir: 'north', label: 'Norden', icon: '↑' },
  { dir: 'east',  label: 'Osten',  icon: '→' },
  { dir: 'south', label: 'Sueden', icon: '↓' },
  { dir: 'west',  label: 'Westen', icon: '←' },
]

export default function SandboxToolbar() {
  const { state, dispatch, onSandboxExport, onSandboxImport } = useGame()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const showDirectionPicker = state.sandboxTool === 'rex' || state.sandboxTool === 'goalRex'
  const showGoalTools = state.sandboxGoalEnabled
  const placeTools = TOOLS.filter(t => t.group === 'place')
  const goalTools = TOOLS.filter(t => t.group === 'goal')

  const handleImport = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onSandboxImport(reader.result)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="px-3 py-2 border-b border-gray-100 bg-white shrink-0 flex flex-col gap-2">
      {/* Top row: title + actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-purple-700 uppercase tracking-wide">Sandbox</h2>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleImport}
            className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
            title="Level importieren"
          >
            Importieren
          </button>
          <button
            onClick={onSandboxExport}
            className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
            title="Level exportieren"
          >
            Exportieren
          </button>
          <button
            onClick={() => dispatch({ type: 'SANDBOX_CLEAR' })}
            className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100"
            title="Grid leeren"
          >
            Leeren
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Tool row */}
      <div className="flex items-center gap-1 flex-wrap">
        {placeTools.map(tool => (
          <button
            key={tool.id}
            onClick={() => dispatch({ type: 'SET_SANDBOX_TOOL', tool: tool.id })}
            className={`flex items-center gap-1 text-xs px-2 py-1.5 rounded transition-colors ${
              state.sandboxTool === tool.id
                ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-300'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
            title={tool.label}
          >
            <span>{tool.icon}</span>
            <span>{tool.label}</span>
          </button>
        ))}

        {/* Separator */}
        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Goal toggle */}
        <button
          onClick={() => dispatch({ type: 'SANDBOX_TOGGLE_GOAL' })}
          className={`text-xs px-2 py-1.5 rounded transition-colors ${
            showGoalTools
              ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
          title="Zielzustand definieren"
        >
          Ziel {showGoalTools ? 'an' : 'aus'}
        </button>

        {/* Goal tools (only visible when goal enabled) */}
        {showGoalTools && goalTools.map(tool => (
          <button
            key={tool.id}
            onClick={() => dispatch({ type: 'SET_SANDBOX_TOOL', tool: tool.id })}
            className={`flex items-center gap-1 text-xs px-2 py-1.5 rounded transition-colors ${
              state.sandboxTool === tool.id
                ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
            title={tool.label}
          >
            <span>{tool.icon}</span>
            <span>{tool.label}</span>
          </button>
        ))}

        {/* Direction picker (when placing Rex or Goal-Rex) */}
        {showDirectionPicker && (
          <>
            <div className="w-px h-6 bg-gray-200 mx-1" />
            {DIRECTIONS.map(d => (
              <button
                key={d.dir}
                onClick={() => dispatch({ type: 'SET_SANDBOX_DIRECTION', direction: d.dir })}
                className={`text-xs w-7 h-7 rounded flex items-center justify-center transition-colors ${
                  state.sandboxDirection === d.dir
                    ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-300'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
                title={d.label}
              >
                {d.icon}
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

import { useRef } from 'react'
import { Gem, Fence, Eraser, Target, Star } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useGame } from '../../App'
import type { SandboxTool } from './sandboxTypes'
import type { Direction } from '../../engine/types'
import karelSvg from '../../assets/karel.svg'

type ToolDef = {
  id: SandboxTool
  label: string
  group: 'place' | 'goal'
} & ({ kind: 'icon'; Icon: LucideIcon } | { kind: 'svg'; src: string })

const TOOLS: ToolDef[] = [
  { id: 'rex',         label: 'Rex',         kind: 'svg',  src: karelSvg, group: 'place' },
  { id: 'beeper',      label: 'Beeper',      kind: 'icon', Icon: Gem,     group: 'place' },
  { id: 'wall',        label: 'Wand',        kind: 'icon', Icon: Fence,   group: 'place' },
  { id: 'eraser',      label: 'Radierer',    kind: 'icon', Icon: Eraser,  group: 'place' },
  { id: 'goalRex',     label: 'Ziel-Rex',    kind: 'icon', Icon: Target,  group: 'goal' },
  { id: 'goalBeeper',  label: 'Ziel-Beeper', kind: 'icon', Icon: Star,    group: 'goal' },
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
    <div className="px-3 py-2 shrink-0 flex flex-col gap-2"
         style={{ background: 'var(--color-bg)', borderBottom: '3px solid var(--color-border)' }}>
      {/* Top row: title + actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-purple-700 uppercase tracking-wide"
            style={{ fontFamily: 'var(--font-heading)' }}>Sandbox</h2>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleImport}
            className="clay-button text-xs px-2.5 py-1 bg-white text-gray-600"
            style={{ borderColor: 'var(--color-border)' }}
            title="Level importieren"
          >
            Importieren
          </button>
          <button
            onClick={onSandboxExport}
            className="clay-button text-xs px-2.5 py-1 bg-white text-gray-600"
            style={{ borderColor: 'var(--color-border)' }}
            title="Level exportieren"
          >
            Exportieren
          </button>
          <button
            onClick={() => dispatch({ type: 'SANDBOX_CLEAR' })}
            className="clay-button text-xs px-2.5 py-1 bg-red-50 text-red-600"
            style={{ borderColor: '#fca5a5' }}
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
            className={[
              'clay-button flex items-center gap-1 text-xs px-2.5 py-1.5',
              state.sandboxTool === tool.id
                ? 'bg-purple-100 text-purple-700'
                : 'bg-white text-gray-600',
            ].join(' ')}
            style={{
              borderColor: state.sandboxTool === tool.id ? '#c084fc' : 'var(--color-border)',
            }}
            title={tool.label}
          >
            {tool.kind === 'svg' ? (
              <img src={tool.src} alt="" className="w-4 h-4" />
            ) : (
              <tool.Icon size={14} />
            )}
            <span>{tool.label}</span>
          </button>
        ))}

        {/* Separator */}
        <div className="h-6 rounded-full mx-1" style={{ width: '3px', background: 'var(--color-border)' }} />

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
            className={[
              'clay-button flex items-center gap-1 text-xs px-2.5 py-1.5',
              state.sandboxTool === tool.id
                ? 'bg-purple-100 text-purple-700'
                : 'bg-white text-gray-600',
            ].join(' ')}
            style={{
              borderColor: state.sandboxTool === tool.id ? '#c084fc' : 'var(--color-border)',
            }}
            title={tool.label}
          >
            {tool.kind === 'svg' ? (
              <img src={tool.src} alt="" className="w-4 h-4" />
            ) : (
              <tool.Icon size={14} />
            )}
            <span>{tool.label}</span>
          </button>
        ))}

        {/* Direction picker (when placing Rex or Goal-Rex) */}
        {showDirectionPicker && (
          <>
            <div className="h-6 rounded-full mx-1" style={{ width: '3px', background: 'var(--color-border)' }} />
            {DIRECTIONS.map(d => (
              <button
                key={d.dir}
                onClick={() => dispatch({ type: 'SET_SANDBOX_DIRECTION', direction: d.dir })}
                className={[
                  'clay-button text-xs w-8 h-8 flex items-center justify-center',
                  state.sandboxDirection === d.dir
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-white text-gray-600',
                ].join(' ')}
                style={{
                  borderRadius: '9999px',
                  borderColor: state.sandboxDirection === d.dir ? '#c084fc' : 'var(--color-border)',
                }}
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

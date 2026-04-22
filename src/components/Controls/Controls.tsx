import type { SpeedSetting } from '../../engine/types'
import { Snail, Rabbit, Zap, Play, Square, RotateCcw } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface ControlsProps {
  speed: SpeedSetting
  onSpeedChange: (speed: SpeedSetting) => void
  onReset: () => void
  isRunning?: boolean
  onPlay: () => void
  onStop: () => void
  onStep: () => void
}

const SPEED_OPTIONS: { value: SpeedSetting; label: string; Icon: LucideIcon; tooltip: string; activeClass: string; activeBorder: string }[] = [
  { value: 'slow',   label: 'Langsam', Icon: Snail,  tooltip: 'Langsame Geschwindigkeit', activeClass: 'bg-emerald-500 text-white', activeBorder: '#059669' },
  { value: 'normal', label: 'Normal',  Icon: Rabbit, tooltip: 'Normale Geschwindigkeit',  activeClass: 'bg-indigo-500 text-white',  activeBorder: '#3730a3' },
  { value: 'fast',   label: 'Schnell', Icon: Zap,    tooltip: 'Schnelle Geschwindigkeit', activeClass: 'bg-amber-500 text-white',   activeBorder: '#b45309' },
]

export default function Controls({
  speed,
  onSpeedChange,
  onReset,
  isRunning = false,
  onPlay,
  onStop,
  // onStep, // temporarily disabled
}: ControlsProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Play / Stop and Step buttons */}
      <div className="flex items-center gap-2" aria-label="Wiedergabe-Steuerung">
        {/* Play / Stop toggle button (T-050) */}
        {isRunning ? (
          <button
            onClick={onStop}
            title="Stopp"
            aria-label="Stopp"
            className={[
              'clay-button min-w-[48px] min-h-[48px] px-5 py-2.5 text-sm',
              'flex items-center gap-1.5',
              'bg-red-500 text-white',
            ].join(' ')}
            style={{ borderColor: '#b91c1c' }}
          >
            <Square size={16} aria-hidden="true" />
            <span>Stopp</span>
          </button>
        ) : (
          <button
            onClick={onPlay}
            title="Start"
            aria-label="Start"
            className={[
              'clay-button min-w-[48px] min-h-[48px] px-5 py-2.5 text-sm',
              'flex items-center gap-1.5',
              'bg-green-500 text-white',
            ].join(' ')}
            style={{ borderColor: '#15803d' }}
          >
            <Play size={16} aria-hidden="true" />
            <span>Start</span>
          </button>
        )}

        {/* Step button (T-051) – temporarily disabled, causes confusion
        <button
          onClick={onStep}
          disabled={isRunning}
          title="Einen Schritt ausführen"
          aria-label="Schritt"
          className={[
            'min-w-[44px] min-h-[44px] px-4 py-2 rounded-lg text-sm font-semibold',
            'flex items-center gap-1.5 transition-colors',
            isRunning
              ? 'border border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
              : 'border border-blue-400 text-blue-600 bg-white hover:bg-blue-50 active:bg-blue-100',
          ].join(' ')}
        >
          <span aria-hidden="true" className="text-base leading-none">⏭</span>
          <span>Schritt</span>
        </button>
        */}
      </div>

      {/* Divider */}
      <div className="h-8 rounded-full" role="separator" style={{ width: '3px', background: 'var(--color-border)' }} />

      {/* Speed selector */}
      <div
        className="flex items-center gap-1"
        role="group"
        aria-label="Geschwindigkeit"
      >
        {SPEED_OPTIONS.map(({ value, label, Icon, tooltip, activeClass, activeBorder }) => (
          <button
            key={value}
            onClick={() => onSpeedChange(value)}
            title={tooltip}
            aria-pressed={speed === value}
            className={[
              'clay-button min-w-[48px] min-h-[48px] px-4 py-2.5 text-sm',
              'flex items-center gap-1',
              speed === value
                ? activeClass
                : 'bg-white text-gray-700',
            ].join(' ')}
            style={{
              borderColor: speed === value ? activeBorder : 'var(--color-border)',
            }}
          >
            <Icon size={16} aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="h-8 rounded-full" role="separator" style={{ width: '3px', background: 'var(--color-border)' }} />

      {/* Reset button */}
      <button
        onClick={onReset}
        disabled={isRunning}
        title="Zurücksetzen"
        className={[
          'clay-button min-w-[48px] min-h-[48px] px-4 py-2.5 text-sm',
          'flex items-center gap-1',
          isRunning
            ? 'bg-gray-100 text-gray-400'
            : 'bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-600',
        ].join(' ')}
        style={{
          borderColor: isRunning ? '#d1d5db' : 'var(--color-border)',
        }}
        aria-label="Zurücksetzen"
      >
        <RotateCcw size={16} aria-hidden="true" />
        <span>Zurücksetzen</span>
      </button>
    </div>
  )
}

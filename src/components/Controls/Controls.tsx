import type { SpeedSetting } from '../../engine/types'

interface ControlsProps {
  speed: SpeedSetting
  onSpeedChange: (speed: SpeedSetting) => void
  onReset: () => void
  isRunning?: boolean
  onPlay: () => void
  onStop: () => void
  onStep: () => void
}

const SPEED_OPTIONS: { value: SpeedSetting; label: string; icon: string; tooltip: string }[] = [
  { value: 'slow',   label: 'Langsam', icon: '🐢', tooltip: 'Langsame Geschwindigkeit' },
  { value: 'normal', label: 'Normal',  icon: '🐇', tooltip: 'Normale Geschwindigkeit'  },
  { value: 'fast',   label: 'Schnell', icon: '⚡', tooltip: 'Schnelle Geschwindigkeit' },
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
              'min-w-[44px] min-h-[44px] px-4 py-2 rounded-lg text-sm font-semibold',
              'flex items-center gap-1.5 transition-colors',
              'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-sm',
            ].join(' ')}
          >
            <span aria-hidden="true" className="text-base leading-none">⏹</span>
            <span>Stopp</span>
          </button>
        ) : (
          <button
            onClick={onPlay}
            title="Start"
            aria-label="Start"
            className={[
              'min-w-[44px] min-h-[44px] px-4 py-2 rounded-lg text-sm font-semibold',
              'flex items-center gap-1.5 transition-colors',
              'bg-green-500 text-white hover:bg-green-600 active:bg-green-700 shadow-sm',
            ].join(' ')}
          >
            <span aria-hidden="true" className="text-base leading-none">▶</span>
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
      <div className="w-px h-8 bg-gray-300" role="separator" />

      {/* Speed selector */}
      <div
        className="flex items-center gap-1"
        role="group"
        aria-label="Geschwindigkeit"
      >
        {SPEED_OPTIONS.map(({ value, label, icon, tooltip }) => (
          <button
            key={value}
            onClick={() => onSpeedChange(value)}
            title={tooltip}
            aria-pressed={speed === value}
            className={[
              'min-w-[44px] min-h-[44px] px-3 py-2 rounded-lg text-sm font-medium',
              'flex items-center gap-1 transition-colors',
              speed === value
                ? 'bg-blue-500 text-white shadow-inner'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            ].join(' ')}
          >
            <span aria-hidden="true">{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-gray-300" role="separator" />

      {/* Reset button */}
      <button
        onClick={onReset}
        disabled={isRunning}
        title="Zurücksetzen"
        className={[
          'min-w-[44px] min-h-[44px] px-3 py-2 rounded-lg text-sm font-medium',
          'flex items-center gap-1 transition-colors',
          isRunning
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-600',
        ].join(' ')}
        aria-label="Zurücksetzen"
      >
        <span aria-hidden="true" className="text-lg leading-none">↺</span>
        <span>Zurücksetzen</span>
      </button>
    </div>
  )
}

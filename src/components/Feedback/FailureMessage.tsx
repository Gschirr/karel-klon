interface FailureMessageProps {
  message: string
  onDismiss: () => void
}

export default function FailureMessage({ message, onDismiss }: FailureMessageProps) {
  return (
    <>
      {/* ── Slide-in keyframe ─────────────────────────────────────── */}
      <style>{`
        @keyframes slideDown {
          0%   { transform: translateY(-12px); opacity: 0; }
          100% { transform: translateY(0);     opacity: 1; }
        }
      `}</style>

      <div
        role="alert"
        aria-live="polite"
        className={[
          'bg-orange-50 border border-orange-200 rounded-lg px-4 py-3',
          'flex items-start gap-3',
        ].join(' ')}
        style={{ animation: 'slideDown 0.25s ease-out forwards' }}
      >
        {/* Icon */}
        <span className="text-2xl leading-none flex-shrink-0 mt-0.5" aria-hidden="true">
          🙈
        </span>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-orange-800 leading-snug">
            {message}
          </p>
          <p className="text-sm text-orange-700 mt-1">
            Fast geschafft! Probier es nochmal! 💪
          </p>
        </div>

        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          aria-label="Meldung schließen"
          title="Schließen"
          className={[
            'flex-shrink-0 w-7 h-7',
            'flex items-center justify-center rounded-full',
            'text-orange-400 hover:text-orange-600 hover:bg-orange-100',
            'text-lg leading-none transition-colors',
          ].join(' ')}
        >
          ×
        </button>
      </div>
    </>
  )
}

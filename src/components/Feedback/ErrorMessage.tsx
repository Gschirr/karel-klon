interface ErrorMessageProps {
  message: string
  onDismiss: () => void
}

export default function ErrorMessage({ message, onDismiss }: ErrorMessageProps) {
  return (
    <>
      {/* ── Slide-in keyframe ─────────────────────────────────────── */}
      <style>{`
        @keyframes slideDownError {
          0%   { transform: translateY(-12px); opacity: 0; }
          100% { transform: translateY(0);     opacity: 1; }
        }
      `}</style>

      <div
        role="alert"
        aria-live="assertive"
        className={[
          'bg-red-50 border border-red-200 rounded-lg px-4 py-3',
          'flex items-start gap-3',
        ].join(' ')}
        style={{ animation: 'slideDownError 0.25s ease-out forwards' }}
      >
        {/* Icon */}
        <span className="text-2xl leading-none flex-shrink-0 mt-0.5" aria-hidden="true">
          🚧
        </span>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-red-800 leading-snug">
            {message}
          </p>
          <p className="text-sm text-red-600 mt-1">
            Schau dir dein Programm nochmal an.
          </p>
        </div>

        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          aria-label="Fehlermeldung schließen"
          title="Schließen"
          className={[
            'flex-shrink-0 w-7 h-7',
            'flex items-center justify-center rounded-full',
            'text-red-400 hover:text-red-600 hover:bg-red-100',
            'text-lg leading-none transition-colors',
          ].join(' ')}
        >
          ×
        </button>
      </div>
    </>
  )
}

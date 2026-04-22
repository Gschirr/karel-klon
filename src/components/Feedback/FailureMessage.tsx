import { Frown, X } from 'lucide-react'

interface FailureMessageProps {
  message: string
  onDismiss: () => void
}

export default function FailureMessage({ message, onDismiss }: FailureMessageProps) {
  return (
    <>
      <div
        role="alert"
        aria-live="polite"
        className="clay-card flex items-start gap-3 px-4 py-3"
        style={{
          animation: 'slideDown 0.25s ease-out forwards',
          background: '#fffbeb',
          borderLeft: '5px solid #f59e0b',
        }}
      >
        {/* Icon */}
        <Frown size={24} className="flex-shrink-0 mt-0.5 text-amber-500" aria-hidden="true" />

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-orange-800 leading-snug">
            {message}
          </p>
          <p className="text-sm text-orange-700 mt-1">
            Fast geschafft! Probier es nochmal!
          </p>
        </div>

        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          aria-label="Meldung schließen"
          title="Schließen"
          className="clay-button flex-shrink-0 w-7 h-7 flex items-center justify-center bg-white"
          style={{ borderRadius: '9999px', borderColor: 'var(--color-border)' }}
        >
          <X size={14} className="text-amber-500" />
        </button>
      </div>
    </>
  )
}

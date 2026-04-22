import { AlertTriangle, X } from 'lucide-react'

interface ErrorMessageProps {
  message: string
  onDismiss: () => void
}

export default function ErrorMessage({ message, onDismiss }: ErrorMessageProps) {
  return (
    <>
      <div
        role="alert"
        aria-live="assertive"
        className="clay-card flex items-start gap-3 px-4 py-3"
        style={{
          animation: 'slideDown 0.25s ease-out forwards',
          background: '#fef2f2',
          borderLeft: '5px solid #ef4444',
        }}
      >
        {/* Icon */}
        <AlertTriangle size={24} className="flex-shrink-0 mt-0.5 text-red-500" aria-hidden="true" />

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
          className="clay-button flex-shrink-0 w-7 h-7 flex items-center justify-center bg-white"
          style={{ borderRadius: '9999px', borderColor: 'var(--color-border)' }}
        >
          <X size={14} className="text-red-500" />
        </button>
      </div>
    </>
  )
}

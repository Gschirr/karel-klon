interface SuccessModalProps {
  message: string
  onNextTask: () => void
  onClose: () => void
}

// Confetti particles are generated once at module level so they stay stable
// across re-renders — no useMemo needed for a purely decorative effect.
const CONFETTI = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  delay: Math.random() * 0.5,
  color: ['#4CAF50', '#FFD700', '#0066CC', '#FF69B4', '#FF9800'][i % 5],
  size: 6 + Math.random() * 6,
  isCircle: i % 2 === 0,
}))

export default function SuccessModal({ message, onNextTask, onClose }: SuccessModalProps) {
  return (
    <>
      {/* ── Confetti keyframes ───────────────────────────────────── */}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0)     rotate(0deg);   opacity: 1; }
          100% { transform: translateY(80vh)  rotate(720deg); opacity: 0; }
        }
        @keyframes modalPop {
          0%   { transform: scale(0.85); opacity: 0; }
          60%  { transform: scale(1.04); opacity: 1; }
          100% { transform: scale(1);    opacity: 1; }
        }
      `}</style>

      {/* ── Backdrop ─────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="success-title"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        {/* ── Confetti layer (sits above backdrop, below card) ─── */}
        <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
          {CONFETTI.map((c) => (
            <div
              key={c.id}
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: `${c.left}%`,
                top: '-10px',
                width: c.size,
                height: c.size,
                backgroundColor: c.color,
                borderRadius: c.isCircle ? '50%' : '2px',
                animation: `confettiFall 3s ${c.delay}s ease-out forwards`,
              }}
            />
          ))}
        </div>

        {/* ── Card ─────────────────────────────────────────────── */}
        <div
          className="relative z-60 bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center"
          style={{ animation: 'modalPop 0.35s ease-out forwards' }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Schließen"
            title="Schließen"
            className={[
              'absolute top-3 right-3',
              'w-8 h-8 flex items-center justify-center',
              'rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100',
              'text-lg leading-none transition-colors',
            ].join(' ')}
          >
            ×
          </button>

          {/* Trophy / celebration icon */}
          <div className="text-6xl mb-4 select-none" aria-hidden="true">
            🎉
          </div>

          {/* Success heading */}
          <h2
            id="success-title"
            className="text-xl font-bold text-green-600 mb-2"
          >
            Super gemacht!
          </h2>

          {/* Dynamic message */}
          <p className="text-2xl font-bold text-gray-800 mb-6 leading-snug">
            {message}
          </p>

          {/* Next task button */}
          <button
            onClick={onNextTask}
            className={[
              'w-full bg-green-500 text-white',
              'px-6 py-3 rounded-xl text-lg font-semibold',
              'hover:bg-green-600 active:bg-green-700',
              'transition-colors shadow-md hover:shadow-lg',
              'flex items-center justify-center gap-2',
            ].join(' ')}
          >
            <span>Nächste Aufgabe</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </>
  )
}

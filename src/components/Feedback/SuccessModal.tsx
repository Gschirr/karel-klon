import { Trophy, X, ArrowRight } from 'lucide-react'

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
  color: ['#4F46E5', '#818CF8', '#EA580C', '#16A34A', '#F59E0B'][i % 5],
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
          className="relative z-60 bg-white p-8 max-w-sm w-full mx-4 text-center"
          style={{
            animation: 'modalPop 0.4s ease-out forwards',
            border: '3px solid var(--color-border)',
            borderRadius: 'var(--clay-radius-lg)',
            boxShadow: '8px 8px 0 0 rgba(30,27,75,0.12), inset 0 -2px 0 0 rgba(30,27,75,0.06), inset 0 2px 0 0 rgba(255,255,255,0.5)',
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Schließen"
            title="Schließen"
            className="clay-button absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white"
            style={{ borderRadius: '9999px', borderColor: 'var(--color-border)' }}
          >
            <X size={16} className="text-gray-500" />
          </button>

          {/* Trophy / celebration icon */}
          <div className="mb-4" aria-hidden="true">
            <Trophy size={48} className="text-amber-500 mx-auto" />
          </div>

          {/* Success heading */}
          <h2
            id="success-title"
            className="text-xl font-bold mb-2"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-success)' }}
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
            className="clay-button w-full text-white px-6 py-3 text-lg flex items-center justify-center gap-2"
            style={{ background: 'var(--color-success)', borderColor: '#15803d' }}
          >
            <span>Nächste Aufgabe</span>
            <ArrowRight size={20} aria-hidden="true" />
          </button>
        </div>
      </div>
    </>
  )
}

import { Star, Rocket, Trophy, Crown, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface LevelCompleteModalProps {
  level: number
  message: string
  onClose: () => void
  hasNextLevel: boolean
}

// More confetti than SuccessModal for the wow factor
const CONFETTI = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  delay: Math.random() * 0.8,
  color: ['#4F46E5', '#818CF8', '#EA580C', '#16A34A', '#F59E0B', '#9C27B0', '#E91E63'][i % 7],
  size: 6 + Math.random() * 10,
  isCircle: i % 2 === 0,
  duration: 2.5 + Math.random() * 2,
}))

const LEVEL_THEME: Record<number, {
  badgeClass: string
  headingClass: string
  buttonClass: string
  Icon: LucideIcon
}> = {
  1: {
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-300',
    headingClass: 'text-blue-600',
    buttonClass: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700',
    Icon: Star,
  },
  2: {
    badgeClass: 'bg-green-100 text-green-700 border-green-300',
    headingClass: 'text-green-600',
    buttonClass: 'bg-green-500 hover:bg-green-600 active:bg-green-700',
    Icon: Rocket,
  },
  3: {
    badgeClass: 'bg-amber-100 text-amber-700 border-amber-400',
    headingClass: 'text-amber-600',
    buttonClass: 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700',
    Icon: Trophy,
  },
  4: {
    badgeClass: 'bg-red-100 text-red-700 border-red-400',
    headingClass: 'text-red-600',
    buttonClass: 'bg-red-500 hover:bg-red-600 active:bg-red-700',
    Icon: Crown,
  },
}

export default function LevelCompleteModal({
  level,
  message,
  onClose,
  hasNextLevel,
}: LevelCompleteModalProps) {
  const theme = LEVEL_THEME[level] ?? LEVEL_THEME[1]

  return (
    <>
      {/* ── Keyframes ───────────────────────────────────────────────── */}
      <style>{`
        @keyframes levelConfettiFall {
          0%   { transform: translateY(0) rotate(0deg) scale(1);   opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(90vh) rotate(900deg) scale(0.5); opacity: 0; }
        }
        @keyframes levelBadgePulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.04); }
        }
      `}</style>

      {/* ── Backdrop ─────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="level-complete-title"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        {/* ── Confetti layer ───────────────────────────────────────── */}
        <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
          {CONFETTI.map((c) => (
            <div
              key={c.id}
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: `${c.left}%`,
                top: '-12px',
                width: c.size,
                height: c.size,
                backgroundColor: c.color,
                borderRadius: c.isCircle ? '50%' : '3px',
                animation: `levelConfettiFall ${c.duration}s ${c.delay}s ease-out forwards`,
              }}
            />
          ))}
        </div>

        {/* ── Card ─────────────────────────────────────────────────── */}
        <div
          className="relative z-60 bg-white p-10 max-w-md w-full mx-4 text-center"
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
            className="clay-button absolute top-4 right-4 w-9 h-9 flex items-center justify-center bg-white"
            style={{ borderRadius: '9999px', borderColor: 'var(--color-border)' }}
          >
            <X size={20} className="text-gray-500" />
          </button>

          {/* Big celebration icon */}
          <div
            className="mb-4"
            aria-hidden="true"
            style={{ animation: 'levelBadgePulse 1.2s ease-in-out infinite' }}
          >
            <theme.Icon size={56} className={theme.headingClass + ' mx-auto'} />
          </div>

          {/* Level badge */}
          <div
            className={[
              'inline-flex items-center gap-2 px-5 py-2 rounded-full font-bold text-lg mb-4',
              theme.badgeClass,
            ].join(' ')}
            style={{
              border: '3px solid',
              boxShadow: 'var(--clay-shadow-sm)',
            }}
            aria-hidden="true"
          >
            <span>Level {level} geschafft!</span>
          </div>

          {/* Message from config */}
          <h2
            id="level-complete-title"
            className={['text-2xl font-extrabold mb-6 leading-snug', theme.headingClass].join(' ')}
          >
            {message}
          </h2>

          {/* CTA */}
          {hasNextLevel ? (
            <button
              onClick={onClose}
              className={[
                'clay-button w-full text-white',
                'px-6 py-4 text-xl',
                'flex items-center justify-center gap-2',
                theme.buttonClass,
              ].join(' ')}
              style={{ borderColor: 'inherit' }}
            >
              <span>Weiter zu Level {level + 1}</span>
              <span aria-hidden="true">→</span>
            </button>
          ) : (
            <div className="space-y-4">
              <p className="text-3xl font-extrabold text-yellow-500 select-none flex items-center justify-center gap-2" aria-live="polite">
                Du hast alle Aufgaben gelöst! <Trophy size={32} />
              </p>
              <button
                onClick={onClose}
                className={[
                  'clay-button w-full text-white',
                  'px-6 py-3 text-lg',
                  theme.buttonClass,
                ].join(' ')}
                style={{ borderColor: 'inherit' }}
              >
                Schließen
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

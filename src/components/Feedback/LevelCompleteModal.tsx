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
  color: ['#4CAF50', '#FFD700', '#0066CC', '#FF69B4', '#FF9800', '#9C27B0', '#E91E63'][i % 7],
  size: 6 + Math.random() * 10,
  isCircle: i % 2 === 0,
  duration: 2.5 + Math.random() * 2,
}))

const LEVEL_THEME: Record<number, {
  badgeClass: string
  headingClass: string
  buttonClass: string
  icon: string
}> = {
  1: {
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-300',
    headingClass: 'text-blue-600',
    buttonClass: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700',
    icon: '🌟',
  },
  2: {
    badgeClass: 'bg-green-100 text-green-700 border-green-300',
    headingClass: 'text-green-600',
    buttonClass: 'bg-green-500 hover:bg-green-600 active:bg-green-700',
    icon: '🚀',
  },
  3: {
    badgeClass: 'bg-yellow-100 text-purple-700 border-yellow-400',
    headingClass: 'text-purple-600',
    buttonClass: 'bg-purple-500 hover:bg-purple-600 active:bg-purple-700',
    icon: '🏆',
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
        @keyframes levelModalPop {
          0%   { transform: scale(0.75); opacity: 0; }
          60%  { transform: scale(1.06); opacity: 1; }
          100% { transform: scale(1);    opacity: 1; }
        }
        @keyframes levelBadgePulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.08); }
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
          className="relative z-60 bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full mx-4 text-center"
          style={{ animation: 'levelModalPop 0.4s ease-out forwards' }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Schließen"
            title="Schließen"
            className={[
              'absolute top-4 right-4',
              'w-9 h-9 flex items-center justify-center',
              'rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100',
              'text-xl leading-none transition-colors',
            ].join(' ')}
          >
            ×
          </button>

          {/* Big celebration icon */}
          <div
            className="text-7xl mb-4 select-none"
            aria-hidden="true"
            style={{ animation: 'levelBadgePulse 1.2s ease-in-out infinite' }}
          >
            {theme.icon}
          </div>

          {/* Level badge */}
          <div
            className={[
              'inline-flex items-center gap-2 px-5 py-2 rounded-full border-2 font-bold text-lg mb-4',
              theme.badgeClass,
            ].join(' ')}
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
                'w-full text-white',
                'px-6 py-4 rounded-2xl text-xl font-bold',
                'transition-colors shadow-lg hover:shadow-xl',
                'flex items-center justify-center gap-2',
                theme.buttonClass,
              ].join(' ')}
            >
              <span>Weiter zu Level {level + 1}</span>
              <span aria-hidden="true">→</span>
            </button>
          ) : (
            <div className="space-y-4">
              <p className="text-3xl font-extrabold text-yellow-500 select-none" aria-live="polite">
                Du hast alle Aufgaben gelöst! 🏆
              </p>
              <button
                onClick={onClose}
                className={[
                  'w-full text-white',
                  'px-6 py-3 rounded-2xl text-lg font-semibold',
                  'transition-colors shadow-md hover:shadow-lg',
                  theme.buttonClass,
                ].join(' ')}
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

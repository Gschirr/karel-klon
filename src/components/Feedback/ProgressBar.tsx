import { Star } from 'lucide-react'

interface ProgressBarProps {
  solvedCount: number
  totalCount: number
}

export default function ProgressBar({ solvedCount, totalCount }: ProgressBarProps) {
  return (
    <div className="clay-card flex items-center gap-2 text-sm px-3 py-1"
         style={{ borderRadius: '9999px' }}>
      <span className="font-semibold" style={{ color: 'var(--color-fg)' }}>
        {solvedCount} von {totalCount}
      </span>
      <div className="flex gap-0.5" aria-label={`${solvedCount} von ${totalCount} Aufgaben gelöst`}>
        {Array.from({ length: totalCount }, (_, i) => (
          <Star
            key={i}
            size={14}
            aria-hidden="true"
            className={i < solvedCount ? 'text-amber-400' : 'text-gray-300'}
            fill={i < solvedCount ? 'currentColor' : 'none'}
            style={i < solvedCount ? { filter: 'drop-shadow(0 0 2px rgba(245,158,11,0.4))' } : undefined}
          />
        ))}
      </div>
      <span style={{ color: 'var(--color-fg)', opacity: 0.6 }}>gelöst</span>
    </div>
  )
}

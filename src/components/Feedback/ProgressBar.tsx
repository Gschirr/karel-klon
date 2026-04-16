interface ProgressBarProps {
  solvedCount: number
  totalCount: number
}

export default function ProgressBar({ solvedCount, totalCount }: ProgressBarProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-600 font-medium">
        {solvedCount} von {totalCount}
      </span>
      <div className="flex gap-0.5" aria-label={`${solvedCount} von ${totalCount} Aufgaben gelöst`}>
        {Array.from({ length: totalCount }, (_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={i < solvedCount ? 'text-yellow-500' : 'text-gray-300'}
          >
            {i < solvedCount ? '★' : '☆'}
          </span>
        ))}
      </div>
      <span className="text-gray-500">Aufgaben gelöst</span>
    </div>
  )
}

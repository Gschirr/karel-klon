import { useState } from 'react'
import type { TaskDefinition } from '../../engine/types'

interface TaskPanelProps {
  tasks: TaskDefinition[]
  currentTaskId: string | null
  solvedTasks: string[]
  onSelectTask: (task: TaskDefinition) => void
  /** Highest level whose tasks are accessible (1, 2, or 3). Defaults to 1. */
  unlockedLevel?: number
  /** When true, all tasks are accessible regardless of level. */
  allUnlocked?: boolean
}

const LEVEL_META: Record<1 | 2 | 3, { label: string; badgeClass: string }> = {
  1: { label: 'Erste Schritte', badgeClass: 'bg-blue-100 text-blue-700' },
  2: { label: 'Schleifen',      badgeClass: 'bg-green-100 text-green-700' },
  3: { label: 'Bedingungen',    badgeClass: 'bg-orange-100 text-orange-700' },
}

/** Truncate a string to at most `maxLen` characters, appending "…" if cut. */
function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen - 1) + '…'
}

/** Return only the first sentence (up to the first period + space / end). */
function firstSentence(text: string): string {
  const match = text.match(/^[^.!?]*[.!?]/)
  return match ? match[0] : text
}

export default function TaskPanel({
  tasks,
  currentTaskId,
  solvedTasks,
  onSelectTask,
  unlockedLevel = 1,
  allUnlocked = false,
}: TaskPanelProps) {
  const [hintOpen, setHintOpen] = useState(false)

  const currentTask = tasks.find((t) => t.id === currentTaskId) ?? null

  // Group tasks by level in sorted order
  const levels = ([1, 2, 3] as const).filter((lvl) =>
    tasks.some((t) => t.level === lvl),
  )

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* ── Current Task Description ─────────────────────────────── */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          <span aria-hidden="true">📋</span>
          Aufgabe
        </h2>

        {currentTask ? (
          <>
            <p className="text-sm font-bold text-gray-800 mb-1">{currentTask.title}</p>
            <p className="text-sm text-gray-700 leading-relaxed">{currentTask.description}</p>

            {currentTask.hint && (
              <div className="mt-2">
                <button
                  onClick={() => setHintOpen((prev) => !prev)}
                  className="flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors"
                  aria-expanded={hintOpen}
                >
                  <span aria-hidden="true">💡</span>
                  <span>Tipp {hintOpen ? '▲' : '▼'}</span>
                </button>

                {hintOpen && (
                  <p className="mt-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 leading-relaxed">
                    {currentTask.hint}
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-400 italic">Keine Aufgabe ausgewählt.</p>
        )}
      </div>

      {/* ── Task List ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {levels.map((level) => {
          const levelTasks = tasks.filter((t) => t.level === level)
          const { label, badgeClass } = LEVEL_META[level]

          return (
            <section key={level} aria-label={`Level ${level} — ${label}`}>
              {/* Level header */}
              <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-100 shadow-sm">
                <span
                  className={[
                    'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold',
                    badgeClass,
                  ].join(' ')}
                  aria-hidden="true"
                >
                  {level}
                </span>
                <span className="text-sm font-semibold text-gray-700">
                  Level {level} — {label}
                </span>
              </div>

              {/* Task items */}
              <ul role="list">
                {levelTasks.map((task) => {
                  const isActive = task.id === currentTaskId
                  const isSolved = solvedTasks.includes(task.id)
                  const isLocked = !allUnlocked && task.level > unlockedLevel
                  const snippet = truncate(firstSentence(task.description), 55)

                  return (
                    <li key={task.id}>
                      <button
                        onClick={() => { if (!isLocked) onSelectTask(task) }}
                        aria-current={isActive ? 'true' : undefined}
                        aria-disabled={isLocked ? 'true' : undefined}
                        className={[
                          'w-full text-left px-4 py-3 border-l-4 transition-colors',
                          isLocked
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400',
                          isActive
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-transparent',
                        ].join(' ')}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {isLocked ? (
                            <span aria-label="Gesperrt" className="text-gray-400 text-sm leading-none">
                              🔒
                            </span>
                          ) : isSolved ? (
                            <span
                              aria-label="Gelöst"
                              className="text-yellow-500 text-base leading-none"
                              title="Aufgabe gelöst"
                            >
                              ★
                            </span>
                          ) : (
                            <span
                              aria-hidden="true"
                              className="text-gray-300 text-base leading-none"
                            >
                              ☆
                            </span>
                          )}
                          <span
                            className={[
                              'text-sm font-medium truncate',
                              isActive ? 'text-blue-800' : 'text-gray-800',
                            ].join(' ')}
                          >
                            {task.title}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 leading-snug">{snippet}</p>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}

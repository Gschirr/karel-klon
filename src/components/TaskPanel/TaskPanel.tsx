import { useState } from 'react'
import type { TaskDefinition } from '../../engine/types'

interface TaskPanelProps {
  tasks: TaskDefinition[]
  currentTaskId: string | null
  solvedTasks: string[]
  onSelectTask: (task: TaskDefinition) => void
  sandboxMode?: boolean
  onEnterSandbox?: () => void
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
  sandboxMode = false,
  onEnterSandbox,
}: TaskPanelProps) {
  const [hintOpen, setHintOpen] = useState(false)

  const currentTask = tasks.find((t) => t.id === currentTaskId) ?? null

  // Group tasks by level in sorted order
  const levels = ([1, 2, 3] as const).filter((lvl) =>
    tasks.some((t) => t.level === lvl),
  )

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* ── Current Task / Sandbox Description ─────────────────── */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50">
        {sandboxMode ? (
          <>
            <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-purple-600 mb-2">
              <span aria-hidden="true">🧩</span>
              Sandbox
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              Klicke auf das Gitter, um Elemente zu platzieren. Waehle ein Werkzeug in der Toolbar.
            </p>
          </>
        ) : (
          <>
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
          </>
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
                  const snippet = truncate(firstSentence(task.description), 55)

                  return (
                    <li key={task.id}>
                      <button
                        onClick={() => onSelectTask(task)}
                        aria-current={isActive ? 'true' : undefined}
                        className={[
                          'w-full text-left px-4 py-3 border-l-4 transition-colors',
                          'hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400',
                          isActive
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-transparent',
                        ].join(' ')}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {isSolved ? (
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

        {/* ── Sandbox entry ──────────────────────────────────────── */}
        {onEnterSandbox && (
          <section aria-label="Sandbox">
            <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-100 shadow-sm">
              <span
                className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold bg-purple-100 text-purple-700"
                aria-hidden="true"
              >
                S
              </span>
              <span className="text-sm font-semibold text-gray-700">
                Sandbox
              </span>
            </div>
            <button
              onClick={onEnterSandbox}
              className={[
                'w-full text-left px-4 py-3 border-l-4 transition-colors',
                'hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-purple-400',
                sandboxMode
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-transparent',
              ].join(' ')}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span aria-hidden="true" className="text-purple-500 text-base leading-none">🧩</span>
                <span className={`text-sm font-medium ${sandboxMode ? 'text-purple-800' : 'text-gray-800'}`}>
                  Eigenes Level erstellen
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-snug">Entwirf dein eigenes Level!</p>
            </button>
          </section>
        )}
      </div>
    </div>
  )
}

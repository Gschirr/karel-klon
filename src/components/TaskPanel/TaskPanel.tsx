import { useState } from 'react'
import type { Level, TaskDefinition } from '../../engine/types'
import { Blocks, ClipboardList, Lightbulb, Star } from 'lucide-react'

interface TaskPanelProps {
  tasks: TaskDefinition[]
  currentTaskId: string | null
  solvedTasks: string[]
  onSelectTask: (task: TaskDefinition) => void
  sandboxMode?: boolean
  onEnterSandbox?: () => void
}

const LEVEL_META: Record<Level, {
  label: string
  bgClass: string
  borderClass: string
  textClass: string
  activeBorderClass: string
  activeBgClass: string
  activeTextClass: string
}> = {
  1: { label: 'Erste Schritte', bgClass: 'bg-indigo-100',  borderClass: 'border-indigo-300',  textClass: 'text-indigo-700',  activeBorderClass: 'border-indigo-500',  activeBgClass: 'bg-indigo-50',  activeTextClass: 'text-indigo-800' },
  2: { label: 'Schleifen',      bgClass: 'bg-emerald-100', borderClass: 'border-emerald-300', textClass: 'text-emerald-700', activeBorderClass: 'border-emerald-500', activeBgClass: 'bg-emerald-50', activeTextClass: 'text-emerald-800' },
  3: { label: 'Bedingungen',    bgClass: 'bg-amber-100',   borderClass: 'border-amber-300',   textClass: 'text-amber-700',   activeBorderClass: 'border-amber-500',   activeBgClass: 'bg-amber-50',   activeTextClass: 'text-amber-800' },
  4: { label: 'Profi',          bgClass: 'bg-rose-100',    borderClass: 'border-rose-300',    textClass: 'text-rose-700',    activeBorderClass: 'border-rose-500',    activeBgClass: 'bg-rose-50',    activeTextClass: 'text-rose-800' },
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
  const levels = ([1, 2, 3, 4] as const).filter((lvl) =>
    tasks.some((t) => t.level === lvl),
  )

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--color-bg)' }}>
      {/* ── Current Task / Sandbox Description ─────────────────── */}
      <div className="flex-shrink-0 p-3">
        <div className="clay-card p-4">
        {sandboxMode ? (
          <>
            <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-purple-600 mb-2">
              <Blocks size={14} aria-hidden="true" />
              Sandbox
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              Klicke auf das Gitter, um Elemente zu platzieren. Waehle ein Werkzeug in der Toolbar.
            </p>
          </>
        ) : (
          <>
            <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
              <ClipboardList size={14} aria-hidden="true" />
              Aufgabe
            </h2>

            {currentTask ? (
              <>
                <p className="text-base font-bold mb-1"
                   style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-primary)' }}>{currentTask.title}</p>
                <p className="text-sm text-gray-700 leading-relaxed">{currentTask.description}</p>

                {currentTask.hint && (
                  <div className="mt-2">
                    <button
                      onClick={() => setHintOpen((prev) => !prev)}
                      className="flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors"
                      aria-expanded={hintOpen}
                    >
                      <Lightbulb size={14} aria-hidden="true" />
                      <span>Tipp {hintOpen ? '▲' : '▼'}</span>
                    </button>

                    {hintOpen && (
                      <p className="mt-1.5 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 leading-relaxed"
                         style={{ border: '2px solid #fbbf24', borderLeft: '5px solid #f59e0b' }}>
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
        </div>  {/* clay-card */}
      </div>

      {/* ── Task List ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {levels.map((level) => {
          const levelTasks = tasks.filter((t) => t.level === level)
          const { label, bgClass, borderClass, textClass } = LEVEL_META[level]

          return (
            <section key={level} aria-label={`Level ${level} — ${label}`}>
              {/* Level header */}
              <div
                className="sticky top-0 z-10 flex items-center gap-2.5 px-4 py-2.5"
                style={{ background: 'var(--color-bg)', borderTop: '2px solid var(--color-border)', borderBottom: '2px solid var(--color-border)', boxShadow: '0 2px 6px rgba(30,27,75,0.08)' }}
              >
                <span className={[
                  'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold border-2',
                  bgClass, borderClass, textClass,
                ].join(' ')}
                  aria-hidden="true"
                >
                  {level}
                </span>
                <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-fg)' }}>
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
                          'task-item-hover w-full text-left px-4 py-3 border-l-4 transition-colors',
                          'hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400',
                          isActive
                            ? `${LEVEL_META[level].activeBorderClass} ${LEVEL_META[level].activeBgClass}`
                            : 'border-transparent',
                        ].join(' ')}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {isSolved ? (
                            <Star
                              size={14}
                              aria-label="Gelöst"
                              className="text-amber-400 flex-shrink-0"
                              fill="currentColor"
                              title="Aufgabe gelöst"
                            />
                          ) : (
                            <Star
                              size={14}
                              aria-hidden="true"
                              className="text-gray-300 flex-shrink-0"
                            />
                          )}
                          <span
                            className={[
                              'text-sm font-medium truncate',
                              isActive ? LEVEL_META[level].activeTextClass : 'text-gray-800',
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
            <div className="sticky top-0 z-10 flex items-center gap-2.5 px-4 py-2.5"
                 style={{ background: 'var(--color-bg)', borderBottom: '2px solid var(--color-border)' }}>
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
                <Blocks size={14} aria-hidden="true" className="text-purple-500 flex-shrink-0" />
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

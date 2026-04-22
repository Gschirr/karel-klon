import * as Blockly from 'blockly'
import { useState, useEffect, useRef } from 'react'
import { generateDisplayCode, generateProgram } from '../../blocks/karelGenerator'
import { parseText, tryParseText } from '../../engine/textParser'
import type { Level, Program } from '../../engine/types'
import { BlockEditor } from './BlockEditor'
import { Trash2 } from 'lucide-react'

interface EditorProps {
  level: Level
  taskId: string
  sandbox: boolean
  workspaceRef: React.MutableRefObject<Blockly.WorkspaceSvg | null>
  getProgramRef: React.MutableRefObject<(() => Program) | null>
}

type Mode = 'blocks' | 'text'

export function Editor({ level, taskId, sandbox, workspaceRef, getProgramRef }: EditorProps) {
  const [mode, setMode] = useState<Mode>('blocks')
  const [code, setCode] = useState<string>('')
  const [textContent, setTextContent] = useState<string>('')
  const [parseError, setParseError] = useState<string | null>(null)

  // Ref so the getProgramRef closure always reads the latest textContent
  const textContentRef = useRef(textContent)
  textContentRef.current = textContent

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const pendingCursorRef = useRef<number | null>(null)

  // Restore cursor position after text content changes from insertAtCursor
  useEffect(() => {
    if (pendingCursorRef.current !== null && textareaRef.current) {
      const ta = textareaRef.current
      ta.focus()
      ta.selectionStart = pendingCursorRef.current
      ta.selectionEnd = pendingCursorRef.current
      pendingCursorRef.current = null
    }
  }, [textContent])

  function insertAtCursor(text: string) {
    const ta = textareaRef.current
    if (!ta) {
      setTextContent(prev => prev ? prev + '\n' + text : text)
      return
    }

    const current = textContent
    if (!current) {
      setTextContent(text)
      pendingCursorRef.current = text.length
      return
    }

    const pos = ta.selectionStart ?? current.length

    // Find current line boundaries and indentation
    const lineStart = current.lastIndexOf('\n', pos - 1) + 1
    const lineEndIdx = current.indexOf('\n', pos)
    const lineEnd = lineEndIdx === -1 ? current.length : lineEndIdx
    const currentLine = current.slice(lineStart, lineEnd)
    const indent = currentLine.match(/^(\s*)/)?.[1] ?? ''

    // For multi-line insertions, indent continuation lines to match current level
    const indentedText = text.includes('\n')
      ? text.split('\n').map((line, i) => i === 0 ? line : indent + line).join('\n')
      : text

    let newContent: string
    let insertStart: number

    if (currentLine.trim() === '') {
      // Current line is blank — replace with indented text
      const replacement = indent + indentedText
      newContent = current.slice(0, lineStart) + replacement + current.slice(lineEnd)
      insertStart = lineStart
    } else {
      // Insert on new line below with same indent
      const insertion = '\n' + indent + indentedText
      newContent = current.slice(0, lineEnd) + insertion + current.slice(lineEnd)
      insertStart = lineEnd
    }

    // Calculate how long the inserted text actually is
    const insertLen = currentLine.trim() === ''
      ? (indent + indentedText).length
      : ('\n' + indent + indentedText).length
    const insertedOnly = newContent.slice(insertStart, insertStart + insertLen)

    // For multi-line blocks (wiederhole/wenn), place cursor on the empty line inside braces
    let newCursorPos: number
    const openBrace = insertedOnly.indexOf('{')
    if (text.includes('{\n') && openBrace !== -1) {
      const afterBrace = insertedOnly.indexOf('\n', openBrace)
      if (afterBrace !== -1) {
        const nextLine = insertedOnly.indexOf('\n', afterBrace + 1)
        newCursorPos = insertStart + (nextLine !== -1 ? nextLine : insertLen)
      } else {
        newCursorPos = insertStart + insertLen
      }
    } else {
      newCursorPos = insertStart + insertLen
    }

    setTextContent(newContent)
    pendingCursorRef.current = newCursorPos
  }

  function handleWorkspaceChange(workspace: Blockly.WorkspaceSvg) {
    const generated = generateDisplayCode(workspace)
    setCode(generated)
  }

  // Wire up getProgramRef based on current mode
  useEffect(() => {
    if (mode === 'blocks') {
      getProgramRef.current = () => {
        const ws = workspaceRef.current
        if (!ws) throw new Error('Kein Blockly-Workspace verfügbar')
        return generateProgram(ws)
      }
    } else {
      getProgramRef.current = () => parseText(textContentRef.current, level)
    }
  }, [mode, level, getProgramRef, workspaceRef])

  // Clear editor when task changes (skip initial mount)
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    setTextContent('')
    setParseError(null)
    setCode('')
    workspaceRef.current?.clear()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId])

  // Live validation of text input (debounced 500ms)
  useEffect(() => {
    if (mode !== 'text') {
      setParseError(null)
      return
    }
    if (!textContent.trim()) {
      setParseError(null)
      return
    }
    const timer = setTimeout(() => {
      const result = tryParseText(textContent, level)
      setParseError(result.ok ? null : result.error)
    }, 500)
    return () => clearTimeout(timer)
  }, [textContent, mode, level])

  function switchToText() {
    setTextContent(code)
    setParseError(null)
    setMode('text')
  }

  function switchToBlocks() {
    setMode('blocks')
  }

  function handleClear() {
    const confirmed = window.confirm('Möchtest du dein Programm wirklich löschen?')
    if (!confirmed) return
    if (mode === 'blocks') {
      workspaceRef.current?.clear()
      setCode('')
    } else {
      setTextContent('')
      setParseError(null)
    }
  }

  return (
    <div className="flex flex-col w-full h-full">
      {/* Tab bar */}
      <div className="flex items-center shrink-0"
           style={{ background: 'var(--color-bg)', borderBottom: '3px solid var(--color-border)' }}>
        {/* Tabs */}
        <div className="flex">
          <button
            onClick={switchToBlocks}
            className={[
              'px-5 py-2.5 text-sm font-semibold transition-colors',
              mode === 'blocks'
                ? 'border-b-[3px] border-indigo-600 text-indigo-700 bg-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/50',
            ].join(' ')}
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Blöcke
          </button>
          <button
            onClick={switchToText}
            className={[
              'px-5 py-2.5 text-sm font-semibold transition-colors',
              mode === 'text'
                ? 'border-b-[3px] border-indigo-600 text-indigo-700 bg-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/50',
            ].join(' ')}
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Text
          </button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Clear button */}
        <button
          onClick={handleClear}
          className="clay-button flex items-center gap-1.5 px-3 py-1.5 mr-2 text-sm bg-white hover:bg-red-50 hover:text-red-600"
          style={{ borderColor: 'var(--color-border)' }}
          title="Programm löschen"
        >
          <Trash2 size={14} />
          <span>Löschen</span>
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 relative overflow-hidden">
        {/* BlockEditor: always mounted with full dimensions.
            When in text mode, pushed behind via z-index
            and pointer-events disabled — but NEVER invisible,
            because Blockly needs a visible container to render. */}
        <div
          className="absolute inset-0"
          style={{
            zIndex: mode === 'blocks' ? 1 : 0,
            pointerEvents: mode === 'blocks' ? 'auto' : 'none',
          }}
        >
          <BlockEditor
            level={level}
            onWorkspaceChange={handleWorkspaceChange}
            workspaceRef={workspaceRef}
          />
        </div>

        {/* Text editor: overlays BlockEditor when in text mode */}
        {mode === 'text' && (
          <div className="absolute inset-0 flex bg-white" style={{ zIndex: 2 }}>
            {/* Command reference sidebar */}
            <div className="w-44 shrink-0 p-3 overflow-y-auto text-xs"
                 style={{ background: 'var(--color-muted)', borderRight: '3px solid var(--color-border)' }}>
              <div className="font-semibold uppercase tracking-wide mb-2"
                   style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-fg)' }}>Befehle</div>
              {(level === 1
                ? ['vorwärts()', 'links_um()', 'rechts_um()', 'aufheben()', 'ablegen()']
                : ['vorwärts()', 'links_um()', 'aufheben()', 'ablegen()']
              ).map(cmd => (
                <button
                  key={cmd}
                  className="clay-button block w-full text-left px-2 py-1 mb-1 font-mono text-indigo-700 bg-indigo-50"
                  style={{ borderColor: '#c7d2fe' }}
                  title={`${cmd} einfügen`}
                  onClick={() => insertAtCursor(cmd)}
                >
                  {cmd}
                </button>
              ))}
              {level >= 2 && (
                <>
                  <div className="font-semibold uppercase tracking-wide mt-3 mb-2"
                       style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-fg)' }}>Schleifen</div>
                  <button
                    className="clay-button block w-full text-left px-2 py-1 mb-1 font-mono text-emerald-700 bg-emerald-50"
                    style={{ borderColor: '#6ee7b7' }}
                    title="Schleife einfügen"
                    onClick={() => insertAtCursor('wiederhole 2 mal {\n  \n}')}
                  >
                    wiederhole _ mal {'{}'}
                  </button>
                </>
              )}
              {level >= 3 && (
                <>
                  <div className="font-semibold uppercase tracking-wide mt-3 mb-2"
                       style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-fg)' }}>Bedingungen</div>
                  <button
                    className="clay-button block w-full text-left px-2 py-1 mb-1 font-mono text-amber-700 bg-amber-50"
                    style={{ borderColor: '#fcd34d' }}
                    title="Wenn/Sonst einfügen"
                    onClick={() => insertAtCursor('wenn vorne_frei() dann {\n  \n}')}
                  >
                    wenn ... dann {'{}'}
                  </button>
                  {['auf_beeper()', 'vorne_frei()', ...((level >= 4 || sandbox) ? ['beeper_voraus()', 'links_frei()', 'rechts_frei()'] : [])].map(cond => (
                    <div key={cond} className="px-2 py-0.5 font-mono text-orange-600">
                      {cond}
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Editor area */}
            <div className="flex-1 flex flex-col min-w-0">
              <textarea
                ref={textareaRef}
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="flex-1 w-full p-4 font-mono text-sm leading-relaxed bg-white resize-none focus:outline-none border-none"
                placeholder="Schreibe dein Programm hier..."
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
              />
              {parseError && (
                <div className="px-4 py-2 bg-red-50 text-red-600 text-sm border-t border-red-200 shrink-0 whitespace-pre-wrap">
                  {parseError}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

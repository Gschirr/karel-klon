import * as Blockly from 'blockly'
import { useState, useEffect, useRef } from 'react'
import { generateDisplayCode, generateProgram } from '../../blocks/karelGenerator'
import { parseText, tryParseText } from '../../engine/textParser'
import type { Program } from '../../engine/types'
import { BlockEditor } from './BlockEditor'

interface EditorProps {
  level: 1 | 2 | 3
  workspaceRef: React.MutableRefObject<Blockly.WorkspaceSvg | null>
  getProgramRef: React.MutableRefObject<(() => Program) | null>
}

type Mode = 'blocks' | 'text'

export function Editor({ level, workspaceRef, getProgramRef }: EditorProps) {
  const [mode, setMode] = useState<Mode>('blocks')
  const [code, setCode] = useState<string>('')
  const [textContent, setTextContent] = useState<string>('')
  const [parseError, setParseError] = useState<string | null>(null)

  // Ref so the getProgramRef closure always reads the latest textContent
  const textContentRef = useRef(textContent)
  textContentRef.current = textContent

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
      getProgramRef.current = () => parseText(textContentRef.current)
    }
  }, [mode, getProgramRef, workspaceRef])

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
      const result = tryParseText(textContent)
      setParseError(result.ok ? null : result.error)
    }, 500)
    return () => clearTimeout(timer)
  }, [textContent, mode])

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
      <div className="flex items-center border-b border-gray-200 bg-white shrink-0">
        {/* Tabs */}
        <div className="flex">
          <button
            onClick={switchToBlocks}
            className={[
              'px-4 py-2 text-sm font-medium transition-colors',
              mode === 'blocks'
                ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
            ].join(' ')}
          >
            Blöcke
          </button>
          <button
            onClick={switchToText}
            className={[
              'px-4 py-2 text-sm font-medium transition-colors',
              mode === 'text'
                ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
            ].join(' ')}
          >
            Text
          </button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Clear button */}
        <button
          onClick={handleClear}
          className="flex items-center gap-1.5 px-3 py-1.5 mr-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          title="Programm löschen"
        >
          <span>🗑️</span>
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
            <div className="w-44 shrink-0 border-r border-gray-200 bg-gray-50 p-3 overflow-y-auto text-xs">
              <div className="font-semibold text-gray-600 uppercase tracking-wide mb-2">Befehle</div>
              {['vorwärts()', 'links_um()', 'rechts_um()', 'umdrehen()', 'aufheben()', 'ablegen()'].map(cmd => (
                <button
                  key={cmd}
                  className="block w-full text-left px-2 py-1 mb-0.5 rounded text-blue-700 bg-blue-50 hover:bg-blue-100 font-mono cursor-pointer transition-colors"
                  title={`${cmd} einfügen`}
                  onClick={() => setTextContent(prev => prev ? prev + '\n' + cmd : cmd)}
                >
                  {cmd}
                </button>
              ))}
              {level >= 2 && (
                <>
                  <div className="font-semibold text-gray-600 uppercase tracking-wide mt-3 mb-2">Schleifen</div>
                  <button
                    className="block w-full text-left px-2 py-1 mb-0.5 rounded text-green-700 bg-green-50 hover:bg-green-100 font-mono cursor-pointer transition-colors"
                    title="Schleife einfügen"
                    onClick={() => setTextContent(prev => prev ? prev + '\nwiederhole 3 mal {\n  \n}' : 'wiederhole 3 mal {\n  \n}')}
                  >
                    wiederhole _ mal {'{}'}
                  </button>
                </>
              )}
              {level >= 3 && (
                <>
                  <div className="font-semibold text-gray-600 uppercase tracking-wide mt-3 mb-2">Bedingungen</div>
                  <button
                    className="block w-full text-left px-2 py-1 mb-0.5 rounded text-orange-700 bg-orange-50 hover:bg-orange-100 font-mono cursor-pointer transition-colors"
                    title="Wenn/Sonst einfügen"
                    onClick={() => setTextContent(prev => prev ? prev + '\nwenn vorne_frei() dann {\n  \n}' : 'wenn vorne_frei() dann {\n  \n}')}
                  >
                    wenn ... dann {'{}'}
                  </button>
                  {['auf_beeper()', 'beeper_voraus()', 'vorne_frei()', 'links_frei()', 'rechts_frei()'].map(cond => (
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

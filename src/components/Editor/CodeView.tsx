interface CodeViewProps {
  code: string
}

// Token patterns for syntax highlighting, applied in order
const TOKEN_PATTERNS: Array<{ pattern: RegExp; className: string }> = [
  // Keywords: commands
  {
    pattern: /\b(vorwärts|links_um|rechts_um|aufheben|ablegen)\b/g,
    className: 'text-blue-600',
  },
  // Loop keyword
  {
    pattern: /\b(wiederhole|mal)\b/g,
    className: 'text-green-600',
  },
  // Control flow
  {
    pattern: /\b(wenn|dann|sonst)\b/g,
    className: 'text-orange-500',
  },
  // Condition functions
  {
    pattern: /\b(auf_beeper|beeper_voraus|vorne_frei|links_frei|rechts_frei)\b/g,
    className: 'text-orange-500',
  },
  // Numbers
  {
    pattern: /\b(\d+)\b/g,
    className: 'text-purple-600',
  },
]

// Split a single line into highlighted React spans
function highlightLine(line: string, lineIndex: number): React.ReactNode {
  // Build an array of { start, end, className } for all token matches
  type Span = { start: number; end: number; className: string }
  const spans: Span[] = []

  for (const { pattern, className } of TOKEN_PATTERNS) {
    pattern.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = pattern.exec(line)) !== null) {
      spans.push({ start: match.index, end: match.index + match[0].length, className })
    }
  }

  // Sort spans by start position, remove overlaps (first-come wins)
  spans.sort((a, b) => a.start - b.start)
  const nonOverlapping: Span[] = []
  let cursor = 0
  for (const span of spans) {
    if (span.start >= cursor) {
      nonOverlapping.push(span)
      cursor = span.end
    }
  }

  // Build array of React nodes from plain text segments + highlighted spans
  const nodes: React.ReactNode[] = []
  let pos = 0

  for (const span of nonOverlapping) {
    if (pos < span.start) {
      nodes.push(line.slice(pos, span.start))
    }
    // Special handling for braces: gray color
    const text = line.slice(span.start, span.end)
    nodes.push(
      <span key={`${lineIndex}-${span.start}`} className={span.className}>
        {text}
      </span>,
    )
    pos = span.end
  }

  // Remaining text + handle braces in plain segments
  if (pos < line.length) {
    const remaining = line.slice(pos)
    // Highlight braces inside remaining plain text
    nodes.push(highlightBraces(remaining, `${lineIndex}-tail`))
  }

  return <>{nodes}</>
}

// Highlight { } in a plain text segment
function highlightBraces(text: string, keyPrefix: string): React.ReactNode {
  const parts = text.split(/([{}])/g)
  if (parts.length === 1) return text
  return (
    <>
      {parts.map((part, i) =>
        part === '{' || part === '}' ? (
          <span key={`${keyPrefix}-${i}`} className="text-gray-400">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  )
}

export function CodeView({ code }: CodeViewProps) {
  if (!code.trim()) {
    return (
      <div className="w-full h-full bg-gray-50 rounded-lg p-4 flex items-start justify-start">
        <pre className="font-mono text-sm text-gray-400 italic">
          Ziehe Blöcke in den Editor, um Code zu erzeugen.
        </pre>
      </div>
    )
  }

  const lines = code.split('\n')

  return (
    <div className="w-full h-full bg-gray-50 rounded-lg p-4 overflow-auto">
      <pre className="font-mono text-sm leading-relaxed">
        {lines.map((line, i) => (
          <div key={i} className="flex">
            {/* Line number */}
            <span className="select-none text-gray-300 text-right mr-4 min-w-[2rem]">
              {i + 1}
            </span>
            {/* Highlighted line content */}
            <span className="flex-1 text-gray-800">{highlightLine(line, i)}</span>
          </div>
        ))}
      </pre>
    </div>
  )
}

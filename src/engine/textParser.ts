import type { ASTNode, CommandName, ConditionName, Program } from './types'

// ── Mapping tables (reverse of karelGenerator's COMMAND_LABELS / CONDITION_LABELS) ──

const COMMAND_MAP: Record<string, CommandName> = {
  'vorwärts': 'moveForward',
  'links_um': 'turnLeft',
  'rechts_um': 'turnRight',
  'aufheben': 'pickBeeper',
  'ablegen': 'dropBeeper',
}

const CONDITION_MAP: Record<string, ConditionName> = {
  'auf_beeper': 'onBeeper',
  'beeper_voraus': 'beeperAhead',
  'vorne_frei': 'frontIsClear',
  'links_frei': 'leftIsClear',
  'rechts_frei': 'rightIsClear',
}

const ALL_KNOWN_WORDS = [
  ...Object.keys(COMMAND_MAP),
  ...Object.keys(CONDITION_MAP),
  'wiederhole', 'mal', 'wenn', 'dann', 'sonst',
]

// ── Token types ──────────────────────────────────────────────────────────────

type TokenType = 'COMMAND' | 'CONDITION' | 'WIEDERHOLE' | 'MAL' | 'WENN' | 'DANN' | 'SONST' | 'NUMBER' | 'LBRACE' | 'RBRACE' | 'EOF'

interface Token {
  type: TokenType
  value: string
  line: number
}

// ── Levenshtein distance (for typo suggestions) ─────────────────────────────

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
    }
  }
  return dp[m][n]
}

function suggestWord(word: string): string | null {
  const lower = word.toLowerCase()
  let bestMatch: string | null = null
  let bestDist = 3 // only suggest if distance <= 2
  for (const known of ALL_KNOWN_WORDS) {
    const dist = levenshtein(lower, known)
    if (dist < bestDist) {
      bestDist = dist
      bestMatch = known
    }
  }
  return bestMatch
}

// ── Tokenizer ────────────────────────────────────────────────────────────────

const TOKEN_REGEX = /([a-zA-ZäöüÄÖÜß_][a-zA-ZäöüÄÖÜß_0-9]*)\s*\(\s*\)|([a-zA-ZäöüÄÖÜß_][a-zA-ZäöüÄÖÜß_0-9]*)|\d+|[{}]/g

function tokenize(text: string): Token[] {
  const tokens: Token[] = []
  const lines = text.split('\n')

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx]
    const lineNum = lineIdx + 1

    TOKEN_REGEX.lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = TOKEN_REGEX.exec(line)) !== null) {
      const raw = match[0]

      if (raw === '{') {
        tokens.push({ type: 'LBRACE', value: '{', line: lineNum })
      } else if (raw === '}') {
        tokens.push({ type: 'RBRACE', value: '}', line: lineNum })
      } else if (/^\d+$/.test(raw)) {
        tokens.push({ type: 'NUMBER', value: raw, line: lineNum })
      } else {
        // It's a word — strip () if present and normalise
        const word = (match[1] || match[2] || raw.replace(/\s*\(\s*\)\s*$/, '')).toLowerCase()

        if (word in COMMAND_MAP) {
          tokens.push({ type: 'COMMAND', value: word, line: lineNum })
        } else if (word in CONDITION_MAP) {
          tokens.push({ type: 'CONDITION', value: word, line: lineNum })
        } else if (word === 'wiederhole') {
          tokens.push({ type: 'WIEDERHOLE', value: word, line: lineNum })
        } else if (word === 'mal') {
          tokens.push({ type: 'MAL', value: word, line: lineNum })
        } else if (word === 'wenn') {
          tokens.push({ type: 'WENN', value: word, line: lineNum })
        } else if (word === 'dann') {
          tokens.push({ type: 'DANN', value: word, line: lineNum })
        } else if (word === 'sonst') {
          tokens.push({ type: 'SONST', value: word, line: lineNum })
        } else {
          // Unknown word — produce a helpful error
          const suggestion = suggestWord(word)
          const commandList = Object.keys(COMMAND_MAP).map(c => `${c}()`).join(', ')
          if (suggestion) {
            throw new Error(
              `Zeile ${lineNum}: '${word}' ist kein bekannter Befehl. Meintest du '${suggestion}()'?`,
            )
          } else {
            throw new Error(
              `Zeile ${lineNum}: '${word}' ist unbekannt.\nVerfügbare Befehle: ${commandList}`,
            )
          }
        }
      }
    }
  }

  tokens.push({ type: 'EOF', value: '', line: lines.length })
  return tokens
}

// ── Recursive descent parser ─────────────────────────────────────────────────

class Parser {
  private tokens: Token[]
  private pos: number

  constructor(tokens: Token[]) {
    this.tokens = tokens
    this.pos = 0
  }

  private peek(): Token {
    return this.tokens[this.pos]
  }

  private advance(): Token {
    const tok = this.tokens[this.pos]
    this.pos++
    return tok
  }

  private expect(type: TokenType, description: string): Token {
    const tok = this.peek()
    if (tok.type !== type) {
      throw new Error(
        `Zeile ${tok.line}: ${description} erwartet, aber '${tok.value || 'Ende'}' gefunden.`,
      )
    }
    return this.advance()
  }

  parseProgram(untilBrace = false): ASTNode[] {
    const nodes: ASTNode[] = []

    while (this.peek().type !== 'EOF') {
      if (untilBrace && this.peek().type === 'RBRACE') {
        break
      }
      nodes.push(this.parseStatement())
    }

    return nodes
  }

  private parseStatement(): ASTNode {
    const tok = this.peek()

    switch (tok.type) {
      case 'COMMAND':
        return this.parseCommand()
      case 'WIEDERHOLE':
        return this.parseRepeat()
      case 'WENN':
        return this.parseIfElse()
      default:
        throw new Error(
          `Zeile ${tok.line}: Befehl erwartet, aber '${tok.value || 'Ende'}' gefunden.`,
        )
    }
  }

  private parseCommand(): ASTNode {
    const tok = this.advance()
    return { type: 'command', name: COMMAND_MAP[tok.value] }
  }

  private parseRepeat(): ASTNode {
    const startTok = this.advance() // consume 'wiederhole'

    const numTok = this.peek()
    if (numTok.type !== 'NUMBER') {
      throw new Error(
        `Zeile ${numTok.line}: Nach 'wiederhole' muss eine Zahl stehen, z.B. 'wiederhole 3 mal { ... }'`,
      )
    }
    const count = Number(this.advance().value)

    // 'mal' is optional but expected
    if (this.peek().type === 'MAL') {
      this.advance()
    }

    this.expect('LBRACE', "'{' nach 'wiederhole " + count + " mal'")

    const body = this.parseProgram(true)

    if (this.peek().type !== 'RBRACE') {
      throw new Error(
        `Zeile ${startTok.line}: Hier fehlt eine schließende Klammer '}' für 'wiederhole'.`,
      )
    }
    this.advance() // consume '}'

    return { type: 'repeat', count, body }
  }

  private parseIfElse(): ASTNode {
    const startTok = this.advance() // consume 'wenn'

    const condTok = this.peek()
    if (condTok.type !== 'CONDITION') {
      const condList = Object.keys(CONDITION_MAP).map(c => `${c}()`).join(', ')
      throw new Error(
        `Zeile ${condTok.line}: Nach 'wenn' muss eine Bedingung stehen.\nVerfügbar: ${condList}`,
      )
    }
    const condition = CONDITION_MAP[this.advance().value]

    // 'dann' is optional but expected
    if (this.peek().type === 'DANN') {
      this.advance()
    }

    this.expect('LBRACE', "'{' nach 'wenn ... dann'")

    const thenBody = this.parseProgram(true)

    if (this.peek().type !== 'RBRACE') {
      throw new Error(
        `Zeile ${startTok.line}: Hier fehlt eine schließende Klammer '}' für 'wenn'.`,
      )
    }
    this.advance() // consume '}'

    let elseBody: ASTNode[] = []
    if (this.peek().type === 'SONST') {
      this.advance() // consume 'sonst'
      this.expect('LBRACE', "'{' nach 'sonst'")
      elseBody = this.parseProgram(true)
      if (this.peek().type !== 'RBRACE') {
        throw new Error(
          `Zeile ${startTok.line}: Hier fehlt eine schließende Klammer '}' für 'sonst'.`,
        )
      }
      this.advance() // consume '}'
    }

    return { type: 'ifElse', condition, then: thenBody, else: elseBody }
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

export type ParseResult =
  | { ok: true; program: Program }
  | { ok: false; error: string }

/** Parse German pseudo-code into a Program AST. Throws on syntax errors. */
export function parseText(text: string): Program {
  if (!text.trim()) return []
  const tokens = tokenize(text)
  const parser = new Parser(tokens)
  return parser.parseProgram()
}

/** Parse German pseudo-code into a Program AST. Never throws. */
export function tryParseText(text: string): ParseResult {
  try {
    return { ok: true, program: parseText(text) }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

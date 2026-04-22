import * as Blockly from 'blockly'
import type { ASTNode, CommandName, ConditionName, Program } from '../engine/types'

// ── Generator instance ───────────────────────────────────────────────────────

const karelGenerator = new Blockly.CodeGenerator('Karel')

// The base CodeGenerator.scrub_ is a no-op — it must be overridden to chain
// blocks connected via nextConnection, otherwise only the first block in each
// statement input (DO, ELSE) is generated.
karelGenerator.scrub_ = function (
  block: Blockly.Block,
  code: string,
  opt_thisOnly?: boolean,
): string {
  const nextBlock = block.nextConnection && block.nextConnection.targetBlock()
  if (nextBlock && !opt_thisOnly) {
    return code + this.blockToCode(nextBlock)
  }
  return code
}

// ── Helper ───────────────────────────────────────────────────────────────────

/**
 * Splits multi-line generator output back into individual ASTNodes.
 * Each line is a JSON-serialised ASTNode.
 */
function parseStatements(code: string): ASTNode[] {
  return code
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line) as ASTNode)
}

// ── Command block generators ─────────────────────────────────────────────────

const commandMap: Record<string, CommandName> = {
  karel_vorwaerts: 'moveForward',
  karel_links_um: 'turnLeft',
  karel_rechts_um: 'turnRight',
  karel_aufheben: 'pickBeeper',
  karel_ablegen: 'dropBeeper',
}

for (const [blockType, commandName] of Object.entries(commandMap)) {
  karelGenerator.forBlock[blockType] = function (_block: Blockly.Block): string {
    return JSON.stringify({ type: 'command', name: commandName }) + '\n'
  }
}

// ── Loop block generator ──────────────────────────────────────────────────────

karelGenerator.forBlock['karel_wiederhole'] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
): string {
  const times = block.getFieldValue('TIMES')
  const bodyCode = generator.statementToCode(block, 'DO')
  const body = parseStatements(bodyCode)
  return JSON.stringify({ type: 'repeat', count: Number(times), body }) + '\n'
}

// ── If/Else block generator ───────────────────────────────────────────────────

karelGenerator.forBlock['karel_wenn'] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
): string {
  const conditionCode = generator.valueToCode(block, 'CONDITION', 0)
  // condition blocks return a JSON-encoded ConditionName string
  const condition: ConditionName = conditionCode
    ? (JSON.parse(conditionCode) as ConditionName)
    : 'frontIsClear'
  const thenBody = parseStatements(generator.statementToCode(block, 'DO'))
  const elseBody = parseStatements(generator.statementToCode(block, 'ELSE'))
  return JSON.stringify({ type: 'ifElse', condition, then: thenBody, else: elseBody }) + '\n'
}

// ── Condition block generators ────────────────────────────────────────────────

const conditionMap: Record<string, ConditionName> = {
  karel_auf_beeper: 'onBeeper',
  karel_beeper_voraus: 'beeperAhead',
  karel_vorne_frei: 'frontIsClear',
  karel_links_frei: 'leftIsClear',
  karel_rechts_frei: 'rightIsClear',
}

for (const [blockType, conditionName] of Object.entries(conditionMap)) {
  karelGenerator.forBlock[blockType] = function (_block: Blockly.Block): [string, number] {
    // Returns [code, precedence] — standard Blockly value block convention
    return [JSON.stringify(conditionName), 0]
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generate a Karel AST (Program) from the blocks in a Blockly workspace.
 */
export function generateProgram(workspace: Blockly.Workspace): Program {
  const code = karelGenerator.workspaceToCode(workspace)
  return parseStatements(code)
}

// ── Display code generation ───────────────────────────────────────────────────

const COMMAND_LABELS: Record<CommandName, string> = {
  moveForward: 'vorwärts()',
  turnLeft: 'links_um()',
  turnRight: 'rechts_um()',
  pickBeeper: 'aufheben()',
  dropBeeper: 'ablegen()',
}

const CONDITION_LABELS: Record<ConditionName, string> = {
  onBeeper: 'auf_beeper()',
  beeperAhead: 'beeper_voraus()',
  frontIsClear: 'vorne_frei()',
  leftIsClear: 'links_frei()',
  rightIsClear: 'rechts_frei()',
}

function nodesToDisplayCode(nodes: ASTNode[], indent: number): string {
  const pad = '  '.repeat(indent)
  return nodes
    .map((node) => {
      if (node.type === 'command') {
        return pad + COMMAND_LABELS[node.name]
      }
      if (node.type === 'repeat') {
        const body = nodesToDisplayCode(node.body, indent + 1)
        return `${pad}wiederhole ${node.count} mal {\n${body}\n${pad}}`
      }
      // ifElse
      const thenCode = nodesToDisplayCode(node.then, indent + 1)
      const elseCode = nodesToDisplayCode(node.else, indent + 1)
      const condLabel = CONDITION_LABELS[node.condition]
      let result = `${pad}wenn ${condLabel} dann {\n${thenCode}\n${pad}}`
      if (node.else.length > 0) {
        result += ` sonst {\n${elseCode}\n${pad}}`
      }
      return result
    })
    .join('\n')
}

/**
 * Generate a human-readable German pseudo-code string from the blocks in a
 * Blockly workspace, suitable for display in the CodeView component.
 *
 * Example output:
 *   vorwärts()
 *   wiederhole 3 mal {
 *     links_um()
 *   }
 *   wenn vorne_frei() dann {
 *     vorwärts()
 *   } sonst {
 *     rechts_um()
 *   }
 */
export function generateDisplayCode(workspace: Blockly.Workspace): string {
  const program = generateProgram(workspace)
  if (program.length === 0) return ''
  return nodesToDisplayCode(program, 0)
}

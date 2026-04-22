import * as Blockly from 'blockly'
import type { Level } from '../engine/types'

// ── Block definitions (JSON format for defineBlocksWithJsonArray) ──────────

const COMMAND_COLOUR = '#004983'
const LOOP_COLOUR = '#16A34A'
const CONDITION_COLOUR = '#ff9900'

const blockDefinitions = [
  // ── Command blocks ─────────────────────────────────────────────────────────
  {
    type: 'karel_vorwaerts',
    message0: 'vorwärts',
    previousStatement: null,
    nextStatement: null,
    colour: COMMAND_COLOUR,
    tooltip: 'Rex geht einen Schritt vorwärts',
  },
  {
    type: 'karel_links_um',
    message0: 'links um',
    previousStatement: null,
    nextStatement: null,
    colour: COMMAND_COLOUR,
    tooltip: 'Rex dreht sich nach links',
  },
  {
    type: 'karel_rechts_um',
    message0: 'rechts um',
    previousStatement: null,
    nextStatement: null,
    colour: COMMAND_COLOUR,
    tooltip: 'Rex dreht sich nach rechts',
  },
  {
    type: 'karel_aufheben',
    message0: 'aufheben',
    previousStatement: null,
    nextStatement: null,
    colour: COMMAND_COLOUR,
    tooltip: 'Rex hebt einen Beeper auf',
  },
  {
    type: 'karel_ablegen',
    message0: 'ablegen',
    previousStatement: null,
    nextStatement: null,
    colour: COMMAND_COLOUR,
    tooltip: 'Rex legt einen Beeper ab',
  },

  // ── Loop block ─────────────────────────────────────────────────────────────
  {
    type: 'karel_wiederhole',
    message0: 'wiederhole %1 mal',
    args0: [
      {
        type: 'field_number',
        name: 'TIMES',
        value: 2,
        min: 1,
        max: 99,
        precision: 1,
      },
    ],
    message1: '%1',
    args1: [
      {
        type: 'input_statement',
        name: 'DO',
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: LOOP_COLOUR,
    tooltip: 'Wiederholt die enthaltenen Befehle mehrmals',
  },

  // ── If/Else block ──────────────────────────────────────────────────────────
  {
    type: 'karel_wenn',
    message0: 'wenn %1 dann',
    args0: [
      {
        type: 'input_value',
        name: 'CONDITION',
        check: 'Boolean',
      },
    ],
    message1: '%1',
    args1: [
      {
        type: 'input_statement',
        name: 'DO',
      },
    ],
    message2: 'sonst',
    message3: '%1',
    args3: [
      {
        type: 'input_statement',
        name: 'ELSE',
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: CONDITION_COLOUR,
    tooltip: 'Führt Befehle aus, abhängig von einer Bedingung',
  },

  // ── Condition blocks (Boolean output) ─────────────────────────────────────
  {
    type: 'karel_auf_beeper',
    message0: 'auf Beeper',
    output: 'Boolean',
    colour: CONDITION_COLOUR,
    tooltip: 'Wahr, wenn Rex auf einem Beeper steht',
  },
  {
    type: 'karel_beeper_voraus',
    message0: 'Beeper voraus',
    output: 'Boolean',
    colour: CONDITION_COLOUR,
    tooltip: 'Wahr, wenn sich ein Beeper vor Rex befindet',
  },
  {
    type: 'karel_vorne_frei',
    message0: 'vorne frei',
    output: 'Boolean',
    colour: CONDITION_COLOUR,
    tooltip: 'Wahr, wenn der Weg vor Rex frei ist',
  },
  {
    type: 'karel_links_frei',
    message0: 'links frei',
    output: 'Boolean',
    colour: CONDITION_COLOUR,
    tooltip: 'Wahr, wenn links von Rex frei ist',
  },
  {
    type: 'karel_rechts_frei',
    message0: 'rechts frei',
    output: 'Boolean',
    colour: CONDITION_COLOUR,
    tooltip: 'Wahr, wenn rechts von Rex frei ist',
  },
]

// ── Registration ────────────────────────────────────────────────────────────

/**
 * Register all Karel block definitions with Blockly.
 * Must be called once before creating a workspace.
 */
export function registerKarelBlocks(): void {
  Blockly.common.defineBlocksWithJsonArray(blockDefinitions)
}

// ── Toolbox configurations ──────────────────────────────────────────────────

// Flat block lists per group (used in flyout toolbox — always visible, no collapsing)

const commandBlocksBase = [
  { kind: 'block', type: 'karel_vorwaerts' },
  { kind: 'block', type: 'karel_links_um' },
  { kind: 'block', type: 'karel_aufheben' },
  { kind: 'block', type: 'karel_ablegen' },
]

const rechtsUmBlock = { kind: 'block', type: 'karel_rechts_um' }

const loopBlocks = [
  { kind: 'block', type: 'karel_wiederhole' },
]

const conditionBlocks = [
  { kind: 'block', type: 'karel_wenn' },
  { kind: 'block', type: 'karel_auf_beeper' },
  { kind: 'block', type: 'karel_vorne_frei' },
]

const sandboxOnlyConditionBlocks = [
  { kind: 'block', type: 'karel_beeper_voraus' },
  { kind: 'block', type: 'karel_links_frei' },
  { kind: 'block', type: 'karel_rechts_frei' },
]

const SEP = { kind: 'sep', gap: '24' }

/**
 * Returns a Blockly flyout toolbox configuration for the given level.
 * All blocks are always visible (no collapsible categories).
 * - Level 1: Command blocks only
 * - Level 2: Commands + Loop block
 * - Level 3: Commands + Loop + If/Else + Condition blocks
 * - Level 4: Commands + Loop + If/Else + all Condition blocks (same as Sandbox)
 * - Sandbox: All blocks including unused condition blocks
 */
export function getToolboxForLevel(level: Level, sandbox = false): object {
  const commands = level === 1
    ? [commandBlocksBase[0], commandBlocksBase[1], rechtsUmBlock, ...commandBlocksBase.slice(2)]
    : [...commandBlocksBase]

  const conditions = (level >= 4 || sandbox)
    ? [...conditionBlocks, ...sandboxOnlyConditionBlocks]
    : conditionBlocks

  const contents =
    level === 1
      ? [...commands]
      : level === 2
        ? [...commands, SEP, ...loopBlocks]
        : [...commands, SEP, ...loopBlocks, SEP, ...conditions]

  return {
    kind: 'flyoutToolbox',
    contents,
  }
}

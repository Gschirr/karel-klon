import karelSvg from './assets/karel.svg'
import beeperSvg from './assets/beeper.svg'

export const config = {
  grid: {
    width: 10,
    height: 10,
    cellSize: 56,
    labelGutter: 24,
  },
  assets: {
    karelSvg,
    beeperSvg,
  },
  execution: {
    maxSteps: 10_000,
    maxTimeMs: 10_000,
    speeds: {
      slow: 500,
      normal: 200,
      fast: 50,
    } as Record<string, number>,
  },
  messages: {
    errors: {
      wallCollision: 'Ups! Da ist eine Wand! Rex kann nicht weitergehen.',
      noBeeper: 'Hier liegt kein Beeper, den Rex aufheben könnte!',
      hasBeeper: 'Hier liegt schon ein Beeper!',
      timeout: 'Rex dreht sich im Kreis! Dein Programm läuft zu lange.',
    },
    success: {
      taskComplete: 'Super! Rex hat es geschafft! 🎉',
      taskFailed: 'Fast geschafft! Probier es nochmal!',
      levelComplete: [
        'Toll! Du beherrschst die Grundlagen!',
        'Genial! Schleifen sind kein Problem für dich!',
        'Wow! Du denkst schon wie eine echte Programmiererin!',
      ],
    },
  },
}

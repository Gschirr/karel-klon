export const config = {
  grid: {
    width: 10,
    height: 10,
    cellSize: 56,
  },
  assets: {
    karelSvg: '/src/assets/karel.svg',
    beeperSvg: '/src/assets/beeper.svg',
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
      wallCollision: 'Ups! Da ist eine Wand! Karel kann nicht weitergehen.',
      noBeeper: 'Hier liegt kein Beeper, den Karel aufheben könnte!',
      hasBeeper: 'Hier liegt schon ein Beeper!',
      timeout: 'Karel dreht sich im Kreis! Dein Programm läuft zu lange.',
    },
    success: {
      taskComplete: 'Super! Karel hat es geschafft! 🎉',
      taskFailed: 'Fast geschafft! Probier es nochmal!',
      levelComplete: [
        'Toll! Du beherrschst die Grundlagen!',
        'Genial! Schleifen sind kein Problem für dich!',
        'Wow! Du denkst schon wie eine echte Programmiererin!',
      ],
    },
  },
}

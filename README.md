# Rex der Dino — MCI GirlsDay Programmier-Lernumgebung

Edukative Programmier-Lernumgebung fuer den MCI GirlsDay. Schuelerinnen (9-16 Jahre) programmieren einen Dino ("Rex") per Drag-&-Drop-Bloecke oder Text-Editor, um 12 Aufgaben auf einem 10x10 Grid zu loesen.

**Live:** https://gschirr.github.io/karel-klon/

---

## Schnellstart

```bash
npm install       # Abhaengigkeiten installieren
npm run dev       # Entwicklungsserver starten (http://localhost:5173)
npm run build     # Produktions-Build erstellen
npm run preview   # Produktions-Build lokal testen
```

---

## Tech Stack

| Technologie | Version | Zweck |
|-------------|---------|-------|
| React | 19.1 | UI Framework |
| TypeScript | 5.8 | Typsicherheit |
| Vite | 6.3 | Build-Tool & Dev-Server |
| Google Blockly | 12.5 | Visueller Block-Editor |
| Tailwind CSS | 4.2 | Styling |

---

## Projektstruktur

```
src/
├── App.tsx                     Haupt-Komponente mit Game-State (useReducer)
├── config.ts                   Zentrale Konfiguration (Grid, Assets, Messages)
├── main.tsx                    React Entry Point
├── index.css                   Globale Styles + Tailwind
│
├── assets/
│   ├── karel.svg               Rex-Sprite (der Dino)
│   └── beeper.svg              Beeper-Sprite (MCI Logo)
│
├── engine/                     Spiellogik (kein UI)
│   ├── types.ts                Alle geteilten TypeScript-Typen
│   ├── world.ts                Welt-State + Bewegungsbefehle (immutabel)
│   ├── interpreter.ts          AST-Interpreter (Programm → Aktionen)
│   ├── executor.ts             Animations-Engine (Aktionen → UI-Updates)
│   ├── validator.ts            Zielvalidierung (Aufgabe geloest?)
│   ├── progress.ts             Fortschritt (localStorage)
│   └── textParser.ts           Text → AST Parser (fuer Text-Editor)
│
├── blocks/                     Blockly-Integration
│   ├── karelBlocks.ts          Block-Definitionen + Toolbox
│   └── karelGenerator.ts       Blockly → AST Code-Generator
│
├── components/
│   ├── Editor/
│   │   ├── Editor.tsx          Editor-Container (Bloecke/Text Toggle)
│   │   ├── BlockEditor.tsx     Blockly-Workspace
│   │   └── CodeView.tsx        Syntax-Highlighting (read-only Ansicht)
│   ├── Grid/
│   │   ├── Grid.tsx            10x10 SVG-Grid mit Waenden + Beepern
│   │   └── GoalPreview.tsx     Halbtransparente Ziel-Vorschau
│   ├── Karel/
│   │   └── Karel.tsx           Rex-Rendering mit CSS-Animation
│   ├── Controls/
│   │   └── Controls.tsx        Play/Stop/Schritt/Speed/Reset
│   ├── TaskPanel/
│   │   └── TaskPanel.tsx       Aufgabenliste mit Sternen
│   └── Feedback/
│       ├── SuccessModal.tsx    Erfolg + Konfetti
│       ├── FailureMessage.tsx  Ermutigende Misserfolg-Meldung
│       ├── ErrorMessage.tsx    Laufzeitfehler-Anzeige
│       ├── LevelCompleteModal.tsx  Level-Abschluss-Feier
│       └── ProgressBar.tsx     Fortschrittsanzeige mit Sternen
│
└── tasks/
    └── tasks.json              12 Aufgaben-Definitionen (3 Level)
```

---

## Anpassungen

### Rex-Sprite aendern

Die Dino-Grafik liegt unter `src/assets/karel.svg`. Einfach die Datei durch eine andere SVG ersetzen. Die SVG wird automatisch in die richtige Groesse skaliert und per CSS in die Blickrichtung rotiert.

**Wichtig:** Der Sprite muss nach **rechts** zeigen (Ost-Richtung = 0 Grad Rotation).

### Beeper-Sprite aendern

Das Sammel-Objekt liegt unter `src/assets/beeper.svg`. Auch hier einfach die Datei ersetzen.

### Beide Sprites werden in `src/config.ts` als Vite-Module importiert:

```typescript
import karelSvg from './assets/karel.svg'
import beeperSvg from './assets/beeper.svg'
```

### Fehlermeldungen und Texte aendern

Alle nutzer-sichtbaren Texte stehen in `src/config.ts`:

```typescript
messages: {
  errors: {
    wallCollision: 'Ups! Da ist eine Wand! Rex kann nicht weitergehen.',
    noBeeper: 'Hier liegt kein Beeper, den Rex aufheben koennte!',
    // ...
  },
  success: {
    taskComplete: 'Super! Rex hat es geschafft!',
    levelComplete: ['Toll! Du beherrschst die Grundlagen!', ...],
  },
}
```

### App-Titel aendern

- HTML-Titel: `index.html` Zeile 6
- Header-Titel: `src/App.tsx` — suche nach `Rex der Dino`

---

## Aufgaben erstellen / bearbeiten

Alle 12 Aufgaben stehen in `src/tasks/tasks.json`. Jede Aufgabe hat folgende Struktur:

```json
{
  "id": "L1-01",
  "level": 1,
  "title": "Hallo Rex!",
  "description": "Rex steht am linken Rand...",
  "hint": "Du brauchst den Befehl vorwaerts dreimal...",
  "grid": {
    "walls": [
      { "x": 4, "y": 0, "side": "east" }
    ],
    "beepers": [
      { "x": 3, "y": 0 }
    ]
  },
  "karel": {
    "position": { "x": 0, "y": 0 },
    "direction": "east"
  },
  "goal": {
    "karel": {
      "position": { "x": 3, "y": 0 }
    },
    "beepers": []
  }
}
```

| Feld | Beschreibung |
|------|-------------|
| `id` | Eindeutige ID, Format: `L{level}-{nr}` |
| `level` | 1, 2 oder 3 — bestimmt welche Bloecke verfuegbar sind |
| `title` | Aufgabentitel (wird in der Seitenleiste angezeigt) |
| `description` | Aufgabenbeschreibung (deutsch, kindgerecht) |
| `hint` | Optionaler Tipp (aufklappbar) |
| `grid.walls` | Waende: `{x, y, side}` mit side = north/east/south/west |
| `grid.beepers` | Start-Beeper-Positionen: `{x, y}` |
| `karel.position` | Rex' Startposition (0-basiert, Ursprung oben links) |
| `karel.direction` | Startrichtung: north/east/south/west |
| `goal.karel` | Zielposition und/oder Zielrichtung (optional) |
| `goal.beepers` | Ziel-Beeper-Positionen (leer = alle eingesammelt) |

### Level und verfuegbare Bloecke

| Level | Bloecke | Konzept |
|-------|---------|---------|
| 1 | 6 Befehle (vorwaerts, links/rechts um, umdrehen, aufheben, ablegen) | Sequenzen |
| 2 | + Schleife (`wiederhole N mal`) | Wiederholungen |
| 3 | + Bedingung (`wenn ... dann ... sonst`) + 5 Abfragen | Verzweigungen |

### Grid-Koordinaten

Das Grid ist 10x10 Felder gross (konfigurierbar in `config.ts`). Position `{x: 0, y: 0}` ist **oben links**. X waechst nach rechts, Y nach unten.

```
(0,0) (1,0) (2,0) ...
(0,1) (1,1) (2,1) ...
(0,2) (1,2) (2,2) ...
 ...
```

---

## Spielmodi

### Block-Editor (Bloecke-Tab)

Drag-&-Drop-Programmierung mit Blockly. Bloecke werden aus der Toolbox links gezogen und zusammengesteckt. Die Toolbox zeigt immer alle fuer das Level verfuegbaren Bloecke an.

### Text-Editor (Text-Tab)

Editierbarer Text-Editor mit deutscher Pseudo-Code-Syntax:

```
vorwaerts()
links_um()
wiederhole 3 mal {
  vorwaerts()
}
wenn vorne_frei() dann {
  vorwaerts()
} sonst {
  rechts_um()
}
```

**Features:**
- Beim Wechsel Bloecke → Text wird der generierte Code vorausgefuellt
- Klickbare Befehlsreferenz links im Text-Editor
- Live-Validierung mit deutschen Fehlermeldungen
- Tippfehler-Erkennung mit Vorschlaegen ("Meintest du 'vorwaerts()'?")

---

## Fortschritt

- Geloeste Aufgaben werden mit goldenen Sternen markiert
- Fortschritt wird im `localStorage` des Browsers gespeichert (Key: `karel-progress`)
- **Zuruecksetzen:** Button "Zuruecksetzen" oben rechts im Header
- **Betreuer-Shortcut:** `Ctrl+Shift+U` schaltet alle Level frei
- Jeder Browser/Geraet hat seinen eigenen Fortschritt (kein Server)

---

## Deployment

### GitHub Pages (automatisch)

Bei jedem Push auf `main` wird automatisch deployed:

1. GitHub Actions baut die App (`npm ci && npm run build`)
2. Der `dist/`-Ordner wird auf GitHub Pages hochgeladen
3. Live unter: https://gschirr.github.io/karel-klon/

Workflow-Datei: `.github/workflows/deploy.yml`

### USB-Stick (offline)

```bash
npm run build
```

Den gesamten `dist/`-Ordner auf den USB-Stick kopieren. `dist/start.bat` oeffnet die App direkt in Chrome (ohne Server). Die App funktioniert komplett offline.

### Mehrere Nutzer gleichzeitig

Die App laeuft komplett im Browser — es gibt keinen Server. Beliebig viele Personen koennen die GitHub Pages URL gleichzeitig oeffnen. Jede Person bekommt eine unabhaengige Instanz mit eigenem Fortschritt.

---

## Konfiguration

Zentrale Einstellungen in `src/config.ts`:

| Einstellung | Wert | Beschreibung |
|------------|------|-------------|
| `grid.width` / `height` | 10 | Grid-Groesse |
| `grid.cellSize` | 56 | Zellengroesse in Pixel |
| `execution.maxSteps` | 10.000 | Max. Schritte pro Programm |
| `execution.maxTimeMs` | 10.000 | Max. Laufzeit in ms |
| `execution.speeds.slow` | 500ms | Langsame Geschwindigkeit |
| `execution.speeds.normal` | 200ms | Normale Geschwindigkeit |
| `execution.speeds.fast` | 50ms | Schnelle Geschwindigkeit |

---

## Architektur

```
Blockly Bloecke ──→ Code Generator ──→ AST (Program)
                                          │
Text Editor ──────→ Text Parser ─────────→┘
                                          │
                                    Interpreter
                                          │
                                    Action[] (Schritt-fuer-Schritt)
                                          │
                                    Executor (Animation)
                                          │
                                    Validator (Ziel erreicht?)
                                          │
                                    Feedback (Erfolg/Misserfolg/Fehler)
```

**Immutable State:** Alle Engine-Operationen geben neue `WorldState`-Objekte zurueck. Der Game-State wird zentral in `App.tsx` per `useReducer` verwaltet.

---

## Bekannte Limitierungen

- Kein Undo/Redo im Text-Editor
- Text-Modus und Block-Modus sind nicht synchronisiert (Text → Bloecke uebersetzt nicht zurueck)
- Keine Persistenz des aktuellen Programms (nur Fortschritt wird gespeichert)
- Maximale Grid-Groesse ist 10x10 (aenderbar in config, aber UI ist dafuer optimiert)

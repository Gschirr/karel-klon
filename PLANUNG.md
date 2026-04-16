## Projektstatus

| Phase | Status | Tickets |
|---|---|---|
| Pflichtenheft | ✅ Fertig | — |
| Sprint 0: Projekt-Setup | ✅ Fertig | T-001 bis T-004 |
| Sprint 1: Game Engine | ⬜ Offen | T-010 bis T-015 |
| Sprint 2: Blockly-Integration | ⬜ Offen | T-020 bis T-024 |
| Sprint 3: SVG-Spielwelt | ⬜ Offen | T-030 bis T-035 |
| Sprint 4: Editor-Komponente | ⬜ Offen | T-040 bis T-043 |
| Sprint 5: Steuerung & Ausführung | ⬜ Offen | T-050 bis T-054 |
| Sprint 6: Aufgabensystem | ⬜ Offen | T-060 bis T-065 |
| Sprint 7: Feedback & Gamification | ⬜ Offen | T-070 bis T-075 |
| Sprint 8: Layout & UI-Polish | ⬜ Offen | T-080 bis T-083 |
| Sprint 9: Qualität & Deployment | ⬜ Offen | T-090 bis T-094 |

**Detaillierte Ticket-Übersicht:** siehe [ROADMAP.md](ROADMAP.md)

---

## Parallelisierungsstrategie

Die Sprints 1–9 sind **nicht** rein sequenziell — viele Tickets haben schwache oder keine Abhängigkeiten zu ihrem zugewiesenen Sprint. Durch Parallelisierung lassen sich **10 Sprints auf 7 Phasen komprimieren (~30% Zeitersparnis)**.

### Drei unabhängige Tracks

Nach Abschluss von **T-010 (Weltzustand-Datenmodell)** entstehen drei weitgehend unabhängige Arbeitsstränge:

| Track | Fokus | Kern-Tickets |
|---|---|---|
| **A — Engine/Logik** | Spielmechanik, Interpreter, Validierung | T-010 → T-011/T-012/T-013 → T-014, T-015 |
| **B — Blockly/Editor** | Block-Definitionen, Code-Generator, Editor-UI | T-020/T-021/T-022 → T-023/T-024 → T-040/T-041 |
| **C — Visuell/UI** | SVG-Grid, Karel-Rendering, Layout, Task-JSON | T-030 → T-031/T-032/T-033, T-060, T-080 |

**Verbindungspunkt:** T-054 (Ausführungs-Orchestrierung) — hier müssen alle drei Tracks zusammenkommen.

### Sofort startbar (parallel zu Sprint 1)

Diese Tickets haben **keine Abhängigkeit** zu Sprint 1 und können ab Tag 1 parallel bearbeitet werden:

| Ticket | Zugewiesen | Echte Abhängigkeit |
|---|---|---|
| T-020, T-021, T-022 (Blockly-Blöcke) | Sprint 2 | Nur Blockly-Library (Sprint 0 ✅) |
| T-030 (Grid-Komponente) | Sprint 3 | Nur React (Sprint 0 ✅) |
| T-080 (3-Spalten-Layout) | Sprint 8 | Nur React (Sprint 0 ✅) |
| T-052 (Geschwindigkeitsregler) | Sprint 5 | Nur config.ts (Sprint 0 ✅) |
| T-060 (Task-JSON) | Sprint 6 | Nur T-010 Typen-Schema |

### Kritischer Pfad (Bottleneck)

```
T-010 → T-011 → T-014 → T-054 → T-064 → T-062
                           ↑
                    braucht auch:
                    T-023 (Generator)
                    T-033 (Karel SVG)
                    T-040 (BlockEditor)
```

**T-054** ist der Engpass, weil er Ergebnisse aus allen drei Tracks braucht. Entschärfung: Interfaces (AST-Typen, Action-Typen, State-Shape) in Phase 1 definieren, damit alle Tracks gegen dieselbe Schnittstelle entwickeln.

### Optimaler Zeitplan (3 Entwickler, 7 Phasen)

```
PHASE 1          PHASE 2          PHASE 3          PHASE 4          PHASE 5          PHASE 6          PHASE 7
─────────────────────────────────────────────────────────────────────────────────────────────────────────────

DEV A (Engine/Logik)
┌─────────┐  ┌─────────────┐  ┌───────────┐  ┌───────────────┐  ┌───────────┐  ┌───────────┐  ┌─────────┐
│ T-010   │→ │ T-012 Wände │→ │ T-011     │→ │   T-054       │→ │ T-064     │→ │ T-062     │  │ T-090   │
│ World   │  │ T-013 Bed.  │  │ Movement  │  │ Orchestrierung│  │ Valid.    │  │ Level-    │  │ T-091   │
│ Model   │  │ T-015 Valid.│  │ T-014     │  │ (CONVERGENCE) │  │ T-065     │  │ freischalt│  │ T-094   │
│         │  │             │  │ Interpreter│  │               │  │ Progress  │  │ T-063     │  │ QA      │
└─────────┘  └─────────────┘  └───────────┘  └───────────────┘  └───────────┘  └───────────┘  └─────────┘

DEV B (Blockly/Editor)
┌─────────┐  ┌─────────────┐  ┌───────────┐  ┌───────────────┐  ┌───────────┐  ┌───────────┐
│ T-020   │→ │ T-023       │→ │ T-040     │→ │ T-042 Toggle  │→ │ T-050     │→ │ T-081     │
│ T-021   │  │ Generator   │  │ BlockEdit │  │ T-043 Löschen │  │ Play/Stop │  │ Styling   │
│ T-022   │  │ T-024       │  │ T-041     │  │               │  │ T-051     │  │ T-082     │
│ Blöcke  │  │ Toolbox     │  │ CodeView  │  │               │  │ Step Mode │  │ Responsive│
└─────────┘  └─────────────┘  └───────────┘  └───────────────┘  └───────────┘  └───────────┘

DEV C (Visual/UI + Tasks)
┌─────────┐  ┌─────────────┐  ┌───────────┐  ┌───────────────┐  ┌───────────┐  ┌───────────┐
│ T-030   │→ │ T-031 Wände │→ │ T-034     │→ │ T-061         │→ │ T-070     │→ │ T-073     │
│ Grid    │  │ T-032 Beep. │  │ Animation │  │ Task Panel    │  │ Erfolg    │  │ Fortschr. │
│ T-080   │  │ T-033 Karel │  │ T-035     │  │               │  │ T-071     │  │ T-074     │
│ Layout  │  │ T-060 Tasks │  │ Ziel-Prev │  │               │  │ Misserf.  │  │ Level-Msg │
│         │  │ (JSON)      │  │ T-052     │  │               │  │ T-072     │  │ T-075     │
│         │  │             │  │ T-053     │  │               │  │ Fehler    │  │ T-083     │
└─────────┘  └─────────────┘  └───────────┘  └───────────────┘  └───────────┘  └───────────┘
```

### Datei-Konflikte beachten

| Datei | Tickets | Risiko |
|---|---|---|
| `src/engine/world.ts` | T-010, T-011, T-012, T-013 | 🔴 Hoch — sequenziell arbeiten |
| `src/App.tsx` | T-054, T-080, T-082 | 🔴 Hoch — Layout + State |
| `src/blocks/karelBlocks.ts` | T-020, T-021, T-022, T-024 | 🟡 Mittel — unabh. Registrierungen |
| `src/components/Grid/Grid.tsx` | T-030, T-031, T-032 | 🟡 Mittel — additive Layer |
| `src/components/Controls/Controls.tsx` | T-050, T-051, T-052, T-053 | 🟡 Mittel — je ein Button |

**Detaillierte Abhängigkeiten pro Ticket:** siehe [ROADMAP.md → Parallelisierung & Abhängigkeiten](ROADMAP.md#parallelisierung--abhängigkeiten)

---

## Tech Stack

### Übersicht

| Was | Technologie | Warum |
|---|---|---|
| Sprache | **TypeScript** | JavaScript mit Typsicherheit — weniger Bugs, bessere Autovervollständigung |
| UI-Framework | **React 19** | Baut die Benutzeroberfläche aus wiederverwendbaren Komponenten |
| Build-Tool | **Vite 6** | Extrem schneller Entwicklungsserver + optimiertes Bundling für Produktion |
| Block-Editor | **Google Blockly** | Industriestandard für Drag-&-Drop-Programmierung (wie Scratch) |
| Styling | **Tailwind CSS 4** | Utility-Klassen direkt im HTML — schnelles, konsistentes Design |
| Grafik | **SVG** (inline) | Skalierbare Vektorgrafiken für Spielfeld, Karel und Beeper |

### Was macht was?

**TypeScript** ist die Programmiersprache. Es ist JavaScript mit Typen — das heißt, der Computer prüft beim Entwickeln, ob z.B. eine Funktion die richtigen Parameter bekommt. Das verhindert viele Fehler, bevor das Programm überhaupt läuft.

**React** ist ein Framework von Meta (Facebook), das die gesamte Benutzeroberfläche aufbaut. Die Idee: Man beschreibt die UI als verschachtelte „Komponenten" (z.B. `<Grid />`, `<Editor />`, `<Controls />`), und React kümmert sich darum, dass der Bildschirm immer den aktuellen Zustand widerspiegelt. Wenn Karel sich bewegt, sagt man React „Karel ist jetzt auf Position (3,5)" und React aktualisiert nur den relevanten Teil des Bildschirms.

**Vite** ist das Build-Tool. Es macht zwei Dinge:
1. **Beim Entwickeln:** Startet einen lokalen Webserver (`npm run dev`), der Änderungen am Code sofort im Browser anzeigt (Hot Module Replacement).
2. **Für Produktion:** Bündelt alle Dateien in optimierte, kleine HTML/CSS/JS-Dateien (`npm run build`), die man auf jeden Webserver legen kann.

**Google Blockly** ist eine Open-Source-Bibliothek von Google, die den Drag-&-Drop-Block-Editor bereitstellt. Man definiert eigene Blöcke (z.B. `vorwaerts()`, `wiederhole(n)`) und Blockly generiert daraus automatisch Code. Genau dieselbe Technologie steckt hinter Scratch und vielen anderen Lernumgebungen.

**Tailwind CSS** ist ein CSS-Framework, das statt vordefinierter Komponenten (wie Bootstrap-Buttons) kleine Utility-Klassen bietet. Statt eine eigene CSS-Datei zu schreiben, schreibt man `className="bg-blue-500 text-white rounded-lg p-4"` direkt ins HTML. Das ist schnell und konsistent.

**SVG** (Scalable Vector Graphics) ist ein Bildformat, das auf Mathematik basiert statt auf Pixeln. Deshalb sieht es auf jedem Bildschirm scharf aus, egal ob klein oder groß. Perfekt für unser Spielfeld, Karel und die Beeper — und SVG-Dateien lassen sich einfach austauschen.

---

## Projektstruktur

```
Karel Klon/
├── index.html              ← Einzige HTML-Datei, lädt die App
├── package.json            ← Abhängigkeiten + Skripte (npm install, npm run dev)
├── tsconfig.json           ← TypeScript-Einstellungen
├── vite.config.ts          ← Vite-Konfiguration (Plugins: React + Tailwind)
├── PLANUNG.md              ← Dieses Dokument
│
├── src/                    ← Gesamter Quellcode
│   ├── main.tsx            ← Startpunkt: Rendert <App /> ins DOM
│   ├── App.tsx             ← Haupt-Layout (3-Spalten: Aufgabe | Spielwelt | Editor)
│   ├── config.ts           ← Zentrale Konfiguration (SVG-Pfade, Geschwindigkeiten, Texte)
│   ├── index.css           ← Globale Styles + Tailwind-Import
│   │
│   ├── engine/             ← Spiellogik (kein UI, reine Logik)
│   │   ├── world.ts        ← Weltzustand: Grid, Wände, Beeper, Karel-Position
│   │   ├── interpreter.ts  ← Führt Programme Schritt für Schritt aus
│   │   └── validator.ts    ← Vergleicht Ist-Zustand mit Soll-Zustand
│   │
│   ├── blocks/             ← Blockly-Definitionen
│   │   ├── karelBlocks.ts  ← Custom-Block-Definitionen (deutsch beschriftet)
│   │   └── karelGenerator.ts ← Generiert aus Blöcken ausführbaren Code
│   │
│   ├── components/         ← React-Komponenten (UI)
│   │   ├── Grid/           ← SVG-Spielfeld (10×10 Raster, Wände, Beeper)
│   │   ├── Karel/          ← Karel-Maskottchen (SVG, animiert, drehbar)
│   │   ├── Editor/         ← Blockly-Editor + Text-Ansicht + Toggle
│   │   ├── TaskPanel/      ← Aufgabenliste, Beschreibung, Zielvorschau
│   │   ├── Controls/       ← Play/Stopp/Schritt/Reset + Geschwindigkeit
│   │   └── Feedback/       ← Erfolgs-/Fehlermeldungen, Konfetti
│   │
│   ├── tasks/
│   │   └── tasks.json      ← 12 Aufgaben-Definitionen (Level, Grid, Ziel)
│   │
│   └── assets/
│       ├── karel.svg       ← Karel-Grafik (austauschbar!)
│       └── beeper.svg      ← Beeper-Grafik / MCI-Logo (austauschbar!)
│
└── node_modules/           ← Automatisch installierte Bibliotheken (nicht editieren)
```

---

## Deployment & Betrieb am GirlsDay

### Rahmenbedingungen

| Faktor | Situation |
|---|---|
| Internet | ✅ Stabil vorhanden |
| Admin-Rechte | ❌ Keine — keine Software-Installation auf Laborrechnern möglich |
| Lokales Netzwerk | ❓ Unklar — kann nicht vorausgesetzt werden |

### Standard: GitHub Pages

Das Projekt wird auf **GitHub Pages** gehostet. Die Schülerinnen öffnen eine URL im Browser — fertig.

**Warum GitHub Pages?**
- Kostenlos
- Direkt in GitHub integriert (Versionskontrolle + Hosting in einem)
- Automatisches Deployment bei jedem Push via GitHub Actions
- Automatisches HTTPS
- Kein extra Konto nötig (nur GitHub)

### Setup (einmalig)

```
Schritt 1: GitHub-Repository erstellen
───────────────────────────────────────
   1. Neues Repository auf GitHub erstellen (z.B. "karel-girlsday")
   2. Lokalen Code pushen:

      git init
      git add .
      git commit -m "Initial commit"
      git remote add origin https://github.com/<user>/karel-girlsday.git
      git push -u origin main


Schritt 2: GitHub Actions Workflow einrichten
─────────────────────────────────────────────
   Eine Datei .github/workflows/deploy.yml wird mitgeliefert.
   Diese baut das Projekt automatisch bei jedem Push und
   deployt den dist/-Ordner auf GitHub Pages.


Schritt 3: GitHub Pages aktivieren
───────────────────────────────────
   1. Repository → Settings → Pages
   2. Source: "GitHub Actions" auswählen
   3. Fertig → URL wird angezeigt:
      https://<user>.github.io/karel-girlsday/


Schritt 4: URL testen
──────────────────────
   Die URL auf einem Laborrechner im Browser öffnen.
   Alles muss ohne Installation oder Login funktionieren.
```

### Am GirlsDay selbst

```
Was die Schülerinnen tun:          Was du vorbereitest:
─────────────────────────          ────────────────────
1. Browser öffnen (Chrome/Edge)    URL auf Tafel / Zettel / QR-Code
2. URL eingeben                    (z.B. <user>.github.io/karel-girlsday)
3. Loslegen                        Ggf. Kurzanleitung ausdrucken

Keine Installation.
Kein Login.
Kein Download.
```

### Workflow: Änderungen deployen

```
Code ändern → git push → GitHub Actions baut automatisch → Seite ist in ~1 Min aktualisiert
```

Kein manuelles Bauen, kein manuelles Hochladen. Push = Deploy.

### Fallback: USB-Stick (falls Internet ausfällt)

Falls das Internet am GirlsDay unerwartet nicht funktioniert:

```
Vorbereitung (1 Tag vorher):
────────────────────────────
   1. npm run build
   2. Den erzeugten "dist/" Ordner auf einen USB-Stick kopieren
   3. Die mitgelieferte "start.bat" liegt bereits im dist/-Ordner

Am GirlsDay:
────────────
   1. dist/-Ordner vom USB-Stick auf den Desktop kopieren
   2. "start.bat" doppelklicken
      → Öffnet die App automatisch in Chrome
   3. Falls start.bat nicht funktioniert:
      index.html direkt im Browser öffnen
```

Damit der Fallback funktioniert, sind alle Pfade im Build **relativ** (`base: './'` in Vite). Die `start.bat` wird automatisch beim Build erzeugt und startet Chrome mit den richtigen Flags für lokale Dateien.

**Einschränkung:** Manche Browser blockieren JavaScript-Module über `file://`. Falls das passiert → Chrome mit dem Flag `--allow-file-access-from-files` starten, oder eine portable `.bat`-Datei mitliefern:

```bat
@echo off
start chrome --allow-file-access-from-files "%~dp0index.html"
```

Diese `.bat`-Datei legen wir mit in den `dist/`-Ordner.

### Deployment-Checkliste

| # | Aufgabe | Wann |
|---|---|---|
| 1 | Netlify-Konto erstellen | 1 Woche vorher |
| 2 | `npm run build` + Deploy | 2–3 Tage vorher |
| 3 | URL auf Laborrechner testen | 1–2 Tage vorher |
| 4 | QR-Code / URL-Zettel vorbereiten | 1 Tag vorher |
| 5 | USB-Stick mit `dist/` als Fallback | 1 Tag vorher |
| 6 | Kurzanleitung für Schülerinnen (optional) | 1 Tag vorher |

---

## Weiterentwicklung auf einem anderen Rechner

Falls jemand anderes den **Quellcode** weiterentwickeln will (nicht nur benutzen):

### Voraussetzung
- **Node.js** (LTS, aktuell v24): https://nodejs.org/

### Schritte

```bash
cd "Karel Klon"
npm install          # Bibliotheken herunterladen (einmalig)
npm run dev          # Entwicklungsserver → http://localhost:5173
```

### Was mitkopiert werden muss (für Entwicklung)

| Datei/Ordner | Mitkopieren? | Warum |
|---|---|---|
| `src/` | ✅ Ja | Quellcode |
| `package.json` | ✅ Ja | Definiert Abhängigkeiten |
| `tsconfig.json` | ✅ Ja | TypeScript-Konfiguration |
| `vite.config.ts` | ✅ Ja | Build-Konfiguration |
| `index.html` | ✅ Ja | HTML-Einstiegspunkt |
| `PLANUNG.md` | ✅ Ja | Projektdokumentation |
| `ROADMAP.md` | ✅ Ja | Feature-Tickets |
| `node_modules/` | ❌ Nein | Wird durch `npm install` neu erzeugt |
| `dist/` | ❌ Nein | Wird durch `npm run build` neu erzeugt |
| `.claude/` | ❌ Nein | Nur für Claude Code relevant |

---

## Aufgaben-Übersicht (12 Aufgaben, 3 Levels)

### Level 1: Erste Schritte (Sequenz)
| ID | Titel | Kurzbeschreibung |
|---|---|---|
| L1-01 | Hallo Karel! | 3× vorwärts + aufheben |
| L1-02 | Um die Ecke | Drehen + vorwärts zum Beeper |
| L1-03 | Beeper-Staffel | Aufheben + woanders ablegen |
| L1-04 | Zickzack | 3 Beeper im Zickzack sammeln |

### Level 2: Wiederholung (Repeat)
| ID | Titel | Kurzbeschreibung |
|---|---|---|
| L2-01 | Der lange Weg | 9 Schritte → wiederhole(9) |
| L2-02 | Beeper-Reihe | 5 Beeper in Reihe einsammeln |
| L2-03 | Das Quadrat | 4 Beeper im Quadrat ablegen |
| L2-04 | Treppen steigen | 4 Stufen als Wiederholungsmuster |

### Level 3: Entscheidungen (If/Else)
| ID | Titel | Kurzbeschreibung |
|---|---|---|
| L3-01 | Vorsicht, Wand! | Vorwärts nur wenn frei |
| L3-02 | Beeper oder nicht? | Bedingt einsammeln |
| L3-03 | Slalom | Wänden links/rechts ausweichen |
| L3-04 | Löcher füllen | Löcher erkennen + Beeper ablegen |

---

## SVG-Assets anpassen

Karel und Beeper sind SVG-Dateien unter `src/assets/`. Um sie zu tauschen:

1. Neue SVG-Datei erstellen/beschaffen
2. Unter `src/assets/` ablegen (z.B. `karel-katze.svg`)
3. In `src/config.ts` den Pfad anpassen:
   ```ts
   assets: {
     karelSvg: '/src/assets/karel-katze.svg',
     beeperSvg: '/src/assets/mci-logo.svg',
   }
   ```
4. Fertig — kein weiterer Code muss geändert werden

### Anforderungen an Karel-SVGs
- Viewbox: `0 0 64 64` (quadratisch)
- Blickrichtung im SVG: nach **rechts** (Osten) — wird per CSS rotiert
- Blickrichtung muss klar erkennbar sein (Augen, Nase, Schnabel o.Ä.)

### Anforderungen an Beeper-SVGs
- Viewbox: `0 0 64 64` (quadratisch)
- Sollte zentriert sein und bei kleiner Darstellung (~40×40px) erkennbar bleiben

## Legende

| Symbol | Bedeutung |
|---|---|
| ⬜ | Offen |
| 🔨 | In Arbeit |
| ✅ | Erledigt |
| ❌ | Entfällt / Gestrichen |

**Priorität:** 🔴 Muss (MVP) · 🟡 Soll · 🟢 Kann (Nice-to-have)

---

## Sprint 0 — Projekt-Setup

### T-001: Vite + React + TypeScript Projekt aufsetzen ✅
- **Priorität:** 🔴
- **Datei(en):** `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`
- **Beschreibung:** Vite-Projekt mit React 19, TypeScript, Tailwind CSS 4 und Blockly initialisieren. Entwicklungsserver muss starten.
- **Akzeptanzkriterien:**
  - `npm run dev` startet ohne Fehler
  - `npx tsc --noEmit` kompiliert fehlerfrei
  - Blockly, React, Tailwind als Dependencies installiert

### T-002: Projektstruktur anlegen ✅
- **Priorität:** 🔴
- **Datei(en):** `src/` Verzeichnisbaum
- **Beschreibung:** Ordnerstruktur gemäß Pflichtenheft anlegen: `components/`, `engine/`, `blocks/`, `tasks/`, `assets/`.
- **Akzeptanzkriterien:**
  - Alle Unterordner existieren
  - Placeholder `App.tsx` und `main.tsx` vorhanden und lauffähig

### T-003: Zentrale Konfigurationsdatei ✅
- **Priorität:** 🔴
- **Datei(en):** `src/config.ts`
- **Beschreibung:** Zentrale Konfiguration mit SVG-Pfaden, Grid-Größe, Geschwindigkeitsstufen, Timeout-Werten, Fehlermeldungen und Erfolgstexten.
- **Akzeptanzkriterien:**
  - Karel-SVG- und Beeper-SVG-Pfad konfigurierbar
  - Grid-Größe, Speeds, Max-Steps/Time als Konstanten
  - Alle deutschen Fehlermeldungen und Erfolgstexte zentral definiert

### T-004: Placeholder-SVGs für Karel und Beeper ✅
- **Priorität:** 🔴
- **Datei(en):** `src/assets/karel.svg`, `src/assets/beeper.svg`
- **Beschreibung:** Placeholder-SVGs erstellen. Karel als Fuchs-Maskottchen mit erkennbarer Blickrichtung. Beeper als MCI-Logo-Platzhalter. Viewbox jeweils `0 0 64 64`.
- **Akzeptanzkriterien:**
  - Karel-SVG zeigt nach rechts (Osten), Blickrichtung klar erkennbar
  - Beeper-SVG zentriert, bei 40×40px noch erkennbar

---

## Sprint 1 — Game Engine (Kern-Logik)

### T-010: Weltzustand-Datenmodell (`world.ts`)
- **Priorität:** 🔴
- **Datei(en):** `src/engine/world.ts`
- **Beschreibung:** TypeScript-Typen und Klasse für den Weltzustand: 10×10-Grid, Karel-Position (x, y) + Blickrichtung (N/S/O/W), Beeper-Positionen (Set), Wand-Definitionen (Zellkante: x, y, Seite). Immutable State-Updates (jede Aktion gibt neuen Zustand zurück).
- **Akzeptanzkriterien:**
  - Typen: `Direction`, `Position`, `Wall`, `WorldState`
  - Factory-Funktion `createWorld(taskDef)` erzeugt Startzustand aus Aufgaben-JSON
  - Zustand ist serialisierbar (für Undo/Vergleich)

### T-011: Karel-Bewegungslogik
- **Priorität:** 🔴
- **Datei(en):** `src/engine/world.ts`
- **Beschreibung:** Implementierung der 6 primitiven Befehle als Zustandstransformationen:
  - `moveForward(state)` → neuer State (oder Fehler bei Wand)
  - `turnLeft(state)`, `turnRight(state)`, `turnAround(state)` → neuer State
  - `pickBeeper(state)` → neuer State (oder Fehler wenn kein Beeper)
  - `dropBeeper(state)` → neuer State (oder Fehler wenn bereits Beeper)
- **Akzeptanzkriterien:**
  - Alle 6 Befehle transformieren State korrekt
  - Wandkollision wird erkannt (äußerer Rand + innere Wände)
  - Fehler werfen typisierte Exceptions mit Fehlercode

### T-012: Wandkollisions-Erkennung
- **Priorität:** 🔴
- **Datei(en):** `src/engine/world.ts`
- **Beschreibung:** Prüft ob eine Bewegung durch eine Wand blockiert wird. Wände liegen an Zellkanten — eine Wand bei (3, 5, "east") blockiert sowohl Bewegung von (3,5) nach Osten als auch von (4,5) nach Westen. Der äußere Grid-Rand (0–9) ist immer eine Wand.
- **Akzeptanzkriterien:**
  - `canMove(state, direction)` gibt `boolean` zurück
  - Äußerer Rand blockiert in alle 4 Richtungen
  - Innere Wände blockieren bidirektional

### T-013: Bedingungen implementieren
- **Priorität:** 🔴
- **Datei(en):** `src/engine/world.ts`
- **Beschreibung:** Die 5 Abfrage-Funktionen implementieren:
  - `onBeeper(state)` — Beeper an Karels Position?
  - `beeperAhead(state)` — Beeper im nächsten Feld in Blickrichtung?
  - `frontIsClear(state)` — Feld in Blickrichtung betretbar?
  - `leftIsClear(state)` — Feld 90° links betretbar?
  - `rightIsClear(state)` — Feld 90° rechts betretbar?
- **Akzeptanzkriterien:**
  - Alle 5 Bedingungen geben korrekt `boolean` zurück
  - `leftIsClear` / `rightIsClear` prüfen relativ zur aktuellen Blickrichtung

### T-014: Schrittweiser Interpreter (`interpreter.ts`)
- **Priorität:** 🔴
- **Datei(en):** `src/engine/interpreter.ts`
- **Beschreibung:** Nimmt ein Programm (als AST oder Action-Liste aus Blockly) und führt es Schritt für Schritt aus. Erzeugt eine Queue von Aktionen. Unterstützt:
  - Sequenz (Befehle nacheinander)
  - `repeat(n)` — feste Schleife
  - `if/else` mit Bedingungsprüfung
  - Schrittzähler + Timeout (max. 10.000 Schritte / 10s)
- **Akzeptanzkriterien:**
  - `interpret(program, initialState)` gibt `Action[]` zurück
  - Jede Action enthält: Befehlstyp, resultierenden WorldState, ggf. Fehler
  - Timeout wird bei Überschreitung ausgelöst
  - Verschachtelte Repeat-Blöcke funktionieren

### T-015: Zielzustand-Validator (`validator.ts`)
- **Priorität:** 🔴
- **Datei(en):** `src/engine/validator.ts`
- **Beschreibung:** Vergleicht den Ist-Zustand nach Programmausführung mit dem Soll-Zustand der Aufgabe. Prüft: Karel-Position, Karel-Blickrichtung, Beeper-Positionen.
- **Akzeptanzkriterien:**
  - `validate(actualState, goalState)` gibt `{ success: boolean, details: string }` zurück
  - Vergleich ist exakt (Position + Richtung + alle Beeper)
  - Bei Misserfolg: hilfreiche Info was nicht stimmt (z.B. "Karel ist an der falschen Stelle")

---

## Sprint 2 — Blockly-Integration

### T-020: Befehls-Blöcke definieren (6 Grundbefehle)
- **Priorität:** 🔴
- **Datei(en):** `src/blocks/karelBlocks.ts`
- **Beschreibung:** 6 Custom-Blocks in Blockly registrieren mit deutschen Labels:
  - `vorwaerts()` (blau), `linksUm()` (blau), `rechtsUm()` (blau)
  - `umdrehen()` (blau), `aufheben()` (blau), `ablegen()` (blau)
- **Akzeptanzkriterien:**
  - Blöcke erscheinen in der Toolbox unter Kategorie "Befehle"
  - Blöcke sind stapelbar (Statement-Blocks)
  - Farbe: blau (#4A90D9)

### T-021: Schleifen-Block definieren (`wiederhole(n)`)
- **Priorität:** 🔴
- **Datei(en):** `src/blocks/karelBlocks.ts`
- **Beschreibung:** Custom-Block `wiederhole(n)` mit Zahleneingabe (1–99) und Statement-Input für den Schleifenkörper. Deutscher Label: "wiederhole _ mal".
- **Akzeptanzkriterien:**
  - Block hat Zahlenfeld (Standard: 2, Min: 1, Max: 99)
  - Block hat C-förmigen Körper für verschachtelte Blöcke
  - Farbe: grün (#5BA55B)
  - Verschachtelung funktioniert (Repeat in Repeat)

### T-022: Bedingungs-Blöcke definieren (wenn/sonst + 5 Bedingungen)
- **Priorität:** 🔴
- **Datei(en):** `src/blocks/karelBlocks.ts`
- **Beschreibung:** Custom-Blocks für:
  - `wenn ... dann ... sonst ...` (If/Else-Block mit optionalem Else-Zweig)
  - 5 Bedingungs-Blöcke: `aufBeeper()`, `beeperVoraus()`, `vorneFrei()`, `linksFrei()`, `rechtsFrei()`
- **Akzeptanzkriterien:**
  - If/Else-Block: orangefarben, C-förmig mit optionalem Else-Abschnitt
  - Bedingungs-Blöcke: oval (Boolean-Output), passen in den If-Slot
  - Negation (nicht/!) als Wrapper-Block verfügbar? → **Nein** (laut Pflichtenheft explizit ausgeschlossen)

### T-023: Code-Generator (`karelGenerator.ts`)
- **Priorität:** 🔴
- **Datei(en):** `src/blocks/karelGenerator.ts`
- **Beschreibung:** Blockly Code-Generator, der aus den Custom-Blocks eine interpretierbare Datenstruktur (AST) erzeugt. Format muss vom Interpreter (T-014) konsumierbar sein.
- **Akzeptanzkriterien:**
  - Generiert AST-Nodes: `{ type: 'command', name: 'moveForward' }`, `{ type: 'repeat', count: n, body: [...] }`, `{ type: 'ifElse', condition: ..., then: [...], else: [...] }`
  - Leere Blöcke / ungültige Konstrukte erzeugen leeren AST (kein Crash)
  - Generierter Code ist synchron mit dem Block-Workspace abrufbar

### T-024: Toolbox mit progressiver Freischaltung
- **Priorität:** 🔴
- **Datei(en):** `src/blocks/karelBlocks.ts`
- **Beschreibung:** Die Blockly-Toolbox zeigt nur die für das aktuelle Level relevanten Blöcke:
  - Level 1: nur 6 Befehle
  - Level 2: + `wiederhole(n)`
  - Level 3: + `wenn/sonst` + 5 Bedingungen
- **Akzeptanzkriterien:**
  - Funktion `getToolboxForLevel(level: 1|2|3)` gibt passende Toolbox-Konfiguration zurück
  - Kategorie-Überschriften: "Befehle", "Schleifen", "Bedingungen"
  - Beim Wechsel der Aufgabe/Level aktualisiert sich die Toolbox

---

## Sprint 3 — SVG-Spielwelt

### T-030: Grid-Komponente (10×10 Raster)
- **Priorität:** 🔴
- **Datei(en):** `src/components/Grid/Grid.tsx`
- **Beschreibung:** React-Komponente, die ein 10×10-SVG-Raster rendert. Responsiv skalierend (füllt verfügbaren Platz). Dezente Rasterlinien (#E0E0E0), weißer Hintergrund.
- **Akzeptanzkriterien:**
  - SVG mit `viewBox` rendert 10×10 Zellen
  - Rasterlinien sichtbar aber dezent
  - Komponente skaliert responsiv mit dem Container

### T-031: Wand-Rendering
- **Priorität:** 🔴
- **Datei(en):** `src/components/Grid/Grid.tsx`
- **Beschreibung:** Wände an Zellkanten als dicke, dunkle Linien (#333, ~4px) rendern. Äußerer Rand immer als durchgehende Wand. Innere Wände aus der Aufgaben-Definition lesen.
- **Akzeptanzkriterien:**
  - Äußerer Rand sichtbar als Begrenzung
  - Innere Wände korrekt an der definierten Zellkante gezeichnet
  - Wände visuell klar von Rasterlinien unterscheidbar

### T-032: Beeper-Rendering (MCI-Logo SVG)
- **Priorität:** 🔴
- **Datei(en):** `src/components/Grid/Grid.tsx`
- **Beschreibung:** Beeper als SVG-Bild (aus `config.ts`) in den Zellen rendern. Zentriert, etwas kleiner als die Zelle (~70% der Zellgröße).
- **Akzeptanzkriterien:**
  - Beeper-SVG wird korrekt in der jeweiligen Zelle zentriert angezeigt
  - SVG-Pfad kommt aus `config.ts` (austauschbar)
  - Mehrere Beeper auf verschiedenen Zellen gleichzeitig darstellbar

### T-033: Karel-Rendering (Maskottchen SVG)
- **Priorität:** 🔴
- **Datei(en):** `src/components/Karel/Karel.tsx`
- **Beschreibung:** Karel als SVG-Bild in der korrekten Zelle rendern. Rotation basierend auf Blickrichtung:
  - Ost = 0°, Süd = 90°, West = 180°, Nord = 270°
- **Akzeptanzkriterien:**
  - Karel wird an korrekter Grid-Position angezeigt
  - SVG rotiert passend zur Blickrichtung
  - SVG-Pfad aus `config.ts` (austauschbar)

### T-034: Karel-Bewegungsanimation
- **Priorität:** 🟡
- **Datei(en):** `src/components/Karel/Karel.tsx`
- **Beschreibung:** Smooth-Animation wenn Karel sich bewegt: CSS-Transition für Position (translate) und Rotation. Dauer basierend auf Geschwindigkeitsstufe.
- **Akzeptanzkriterien:**
  - Karel gleitet flüssig von Zelle zu Zelle (kein Springen)
  - Drehung animiert (nicht abrupt)
  - Animation synchron mit Interpreter-Geschwindigkeit

### T-035: Zielzustand-Vorschau-Overlay
- **Priorität:** 🟡
- **Datei(en):** `src/components/Grid/GoalPreview.tsx`
- **Beschreibung:** Button "Ziel anzeigen" blendet den Zielzustand als halbtransparentes Overlay über das Grid. Zeigt Ziel-Karel-Position und Ziel-Beeper-Positionen in abgeschwächter Farbe.
- **Akzeptanzkriterien:**
  - Toggle-Button ein/aus
  - Zielzustand halbtransparent (~40% Opacity) über aktuellem Zustand
  - Karel-Zielposition + Beeper-Zielpositionen klar erkennbar

---

## Sprint 4 — Editor-Komponente

### T-040: Blockly-Workspace einbinden
- **Priorität:** 🔴
- **Datei(en):** `src/components/Editor/BlockEditor.tsx`
- **Beschreibung:** Google Blockly als React-Komponente einbinden. Workspace mit Toolbox (aus T-024), Drag-&-Drop-Fläche, automatische Größenanpassung.
- **Akzeptanzkriterien:**
  - Blockly-Workspace rendert korrekt in der rechten Spalte
  - Toolbox mit Kategorien sichtbar und funktional
  - Blöcke per Drag & Drop platzierbar und verbindbar
  - Workspace resized bei Fensteränderung

### T-041: Text-Ansicht (Read-Only Code-Vorschau)
- **Priorität:** 🔴
- **Datei(en):** `src/components/Editor/CodeView.tsx`
- **Beschreibung:** Echtzeit-Anzeige des generierten Codes aus den Blockly-Blöcken. Syntax-Highlighting (Keywords farbig). Initial Read-Only.
- **Akzeptanzkriterien:**
  - Code aktualisiert sich bei jeder Blockly-Änderung in Echtzeit
  - Syntax-Highlighting für Keywords (`moveForward`, `repeat`, `if`, etc.)
  - Monospace-Font, Zeilennummern optional

### T-042: Blöcke/Text Toggle
- **Priorität:** 🔴
- **Datei(en):** `src/components/Editor/Editor.tsx`
- **Beschreibung:** Toggle-Button oder Tab-Leiste zum Umschalten zwischen Block-Editor und Text-Ansicht. Nur eine Ansicht gleichzeitig sichtbar.
- **Akzeptanzkriterien:**
  - Klar beschrifteter Toggle: "Blöcke | Text"
  - Umschaltung ohne Datenverlust (Blöcke bleiben erhalten)
  - Aktiver Modus visuell hervorgehoben

### T-043: Arbeitsflaeche löschen
- **Priorität:** 🟡
- **Datei(en):** `src/components/Editor/Editor.tsx`
- **Beschreibung:** "Neu starten"-Button / Papierkorb-Icon. Löscht alle Blöcke auf der Arbeitsfläche nach Sicherheitsrückfrage ("Möchtest du dein Programm wirklich löschen?").
- **Akzeptanzkriterien:**
  - Bestätigungsdialog vor dem Löschen
  - Nach Bestätigung: Workspace komplett leer
  - Abbrechen lässt Workspace unverändert

---

## Sprint 5 — Steuerung & Ausführung

### T-050: Play/Stopp-Button
- **Priorität:** 🔴
- **Datei(en):** `src/components/Controls/Controls.tsx`
- **Beschreibung:** Prominenter Start-Button (grünes Dreieck). Startet Programmausführung. Verwandelt sich während der Ausführung in einen Stopp-Button (rotes Quadrat). Stopp bricht Ausführung sofort ab.
- **Akzeptanzkriterien:**
  - Play startet Interpreter + Animation
  - Button wechselt zu Stopp während Ausführung
  - Stopp bricht Ausführung ab, Karel bleibt an aktueller Position
  - Button ist groß (≥ 44×44px) und gut sichtbar

### T-051: Schritt-für-Schritt-Modus
- **Priorität:** 🔴
- **Datei(en):** `src/components/Controls/Controls.tsx`
- **Beschreibung:** "Nächster Schritt"-Button (⏭). Führt genau einen Befehl aus und pausiert. Aktuell ausgeführter Block wird im Editor hervorgehoben.
- **Akzeptanzkriterien:**
  - Ein Klick = ein Befehl wird ausgeführt
  - Karel bewegt sich einen Schritt
  - Aktiver Block in Blockly hervorgehoben (highlight)

### T-052: Geschwindigkeitsregler
- **Priorität:** 🟡
- **Datei(en):** `src/components/Controls/Controls.tsx`
- **Beschreibung:** Schieberegler oder 3 Buttons für Animationsgeschwindigkeit:
  - 🐢 Langsam (500ms/Schritt)
  - 🐇 Normal (200ms/Schritt)
  - ⚡ Schnell (50ms/Schritt)
- **Akzeptanzkriterien:**
  - Geschwindigkeit in Echtzeit änderbar (auch während Ausführung)
  - Aktuelle Stufe visuell erkennbar
  - Werte aus `config.ts`

### T-053: Zurücksetzen-Button
- **Priorität:** 🔴
- **Datei(en):** `src/components/Controls/Controls.tsx`
- **Beschreibung:** "Zurücksetzen"-Button (↺). Stellt den Startzustand der aktuellen Aufgabe wieder her (Karel-Position, Beeper, Wände). Programm bleibt im Editor erhalten.
- **Akzeptanzkriterien:**
  - Spielwelt wird auf Anfangszustand der Aufgabe zurückgesetzt
  - Blockly-Workspace bleibt unverändert
  - Button jederzeit klickbar (auch ohne vorherige Ausführung)

### T-054: Ausführungs-Orchestrierung (Engine ↔ UI)
- **Priorität:** 🔴
- **Datei(en):** `src/engine/executor.ts` oder `src/App.tsx`
- **Beschreibung:** Verbindet Interpreter-Ergebnis (Action-Queue) mit der UI: Schritt für Schritt Aktionen abarbeiten, nach jedem Schritt State updaten, Animation abwarten, bei Fehler stoppen. React State Management (Context oder Zustand).
- **Akzeptanzkriterien:**
  - Play: Durchläuft alle Aktionen mit Animation-Delay
  - Step: Führt genau eine Aktion aus
  - Stop: Bricht Ausführung ab
  - Reset: Setzt auf Anfangszustand zurück
  - Fehler: Stoppt + zeigt Fehlermeldung

---

## Sprint 6 — Aufgabensystem

### T-060: Aufgaben-JSON erstellen (12 Aufgaben)
- **Priorität:** 🔴
- **Datei(en):** `src/tasks/tasks.json`
- **Beschreibung:** Alle 12 Aufgaben als JSON definieren mit:
  - `id`, `level`, `title`, `description`
  - `grid` (walls, beepers), `karel` (position, direction)
  - `goal` (karel position/direction, beeper positions)
  - `hint`, `availableBlocks`
- **Akzeptanzkriterien:**
  - 4 Aufgaben Level 1 (Sequenz)
  - 4 Aufgaben Level 2 (Repeat)
  - 4 Aufgaben Level 3 (If/Else)
  - Alle Aufgaben lösbar (verifiziert durch Musterlösung)
  - JSON-Schema konsistent

### T-061: Aufgaben-Panel (Beschreibung + Liste)
- **Priorität:** 🔴
- **Datei(en):** `src/components/TaskPanel/TaskPanel.tsx`
- **Beschreibung:** Linke Seitenleiste mit:
  - Aufgabentitel und -beschreibung (1–3 Sätze)
  - Scrollbare Aufgabenliste mit Level-Gruppierung
  - Aktive Aufgabe hervorgehoben
  - Optional: Hint-Button ("Tipp anzeigen")
- **Akzeptanzkriterien:**
  - Aufgabenliste zeigt alle Aufgaben, gruppiert nach Level
  - Klick auf Aufgabe lädt diese (Grid + Blockly-Workspace reset)
  - Aktuelle Aufgabe visuell markiert
  - Beschreibungstext deutsch und kindgerecht

### T-062: Level-Freischaltung
- **Priorität:** 🔴
- **Datei(en):** `src/components/TaskPanel/TaskPanel.tsx`, `src/engine/progress.ts`
- **Beschreibung:** Level 2 wird freigeschaltet wenn alle Level-1-Aufgaben gelöst. Level 3 nach allen Level-2-Aufgaben. Noch gesperrte Aufgaben sind ausgegraut mit Schloss-Icon.
- **Akzeptanzkriterien:**
  - Zu Beginn nur Level 1 zugänglich
  - Nach 4/4 Level-1-Aufgaben: Level 2 freischalten
  - Nach 4/4 Level-2-Aufgaben: Level 3 freischalten
  - Gesperrte Aufgaben nicht anklickbar, visuell unterscheidbar

### T-063: Betreuer-Freischalt-Taste
- **Priorität:** 🟡
- **Datei(en):** `src/engine/progress.ts`
- **Beschreibung:** Tastenkombination `Ctrl+Shift+U` schaltet sofort alle Levels und Aufgaben frei. Für Demo-Zwecke und schnelle Schülerinnen.
- **Akzeptanzkriterien:**
  - Shortcut funktioniert global
  - Alle Aufgaben sofort zugänglich nach Aktivierung
  - Kein sichtbarer UI-Hinweis auf den Shortcut (nur für Betreuer)

### T-064: Aufgaben-Validierung + Feedback-Trigger
- **Priorität:** 🔴
- **Datei(en):** `src/engine/validator.ts`, Integration in Ausführungs-Orchestrierung
- **Beschreibung:** Nach Programmausführung (wenn alle Aktionen durchgelaufen ohne Fehler): automatisch Ist-Zustand mit Zielzustand vergleichen. Ergebnis an Feedback-Komponente weiterleiten.
- **Akzeptanzkriterien:**
  - Validierung startet automatisch nach Ende der Ausführung
  - Bei Erfolg: Feedback-Komponente bekommt `success=true`
  - Bei Misserfolg: Feedback-Komponente bekommt `success=false` + Detail-Info

### T-065: Fortschritt in localStorage speichern
- **Priorität:** 🟡
- **Datei(en):** `src/engine/progress.ts`
- **Beschreibung:** Gelöste Aufgaben werden im Browser-localStorage gespeichert. Bei Seitenneuladen bleibt der Fortschritt erhalten. Kein Login nötig.
- **Akzeptanzkriterien:**
  - `localStorage.setItem('karel-progress', ...)` nach jeder gelösten Aufgabe
  - Beim Laden: Fortschritt wiederherstellen, gelöste Aufgaben markieren
  - Funktioniert auch nach Browser-Tab schließen + wieder öffnen

---

## Sprint 7 — Feedback & Gamification

### T-070: Erfolgs-Meldung + Konfetti
- **Priorität:** 🔴
- **Datei(en):** `src/components/Feedback/SuccessModal.tsx`
- **Beschreibung:** Bei erfolgreich gelöster Aufgabe: modaler Dialog mit freundlicher Meldung ("Super! Karel hat es geschafft! 🎉") und Konfetti-Animation. Button "Nächste Aufgabe".
- **Akzeptanzkriterien:**
  - Modal mit grünem Akzent, großer Text
  - Konfetti-Partikel-Animation (CSS oder Canvas)
  - "Nächste Aufgabe"-Button navigiert zur nächsten Aufgabe
  - Modal schließbar (X oder Klick daneben)

### T-071: Misserfolgs-Meldung (ermutigend)
- **Priorität:** 🔴
- **Datei(en):** `src/components/Feedback/FailureMessage.tsx`
- **Beschreibung:** Bei nicht erreichtem Ziel (kein Laufzeitfehler, aber falscher Endzustand): ermutigende Meldung in sanftem Orange. "Fast geschafft! Probier es nochmal!" Kein roter Text, keine Bestrafung.
- **Akzeptanzkriterien:**
  - Meldung erscheint nach Ausführungsende
  - Farbe: Orange (#FF9800), nicht Rot
  - Text ermutigend, nicht wertend
  - Optional: Hinweis was nicht stimmt ("Karel ist noch nicht am Ziel")

### T-072: Laufzeitfehler-Anzeige
- **Priorität:** 🔴
- **Datei(en):** `src/components/Feedback/ErrorMessage.tsx`
- **Beschreibung:** Bei Laufzeitfehler (Wand, kein Beeper, Timeout): kindgerechte Fehlermeldung aus `config.ts`. Fehlerhafter Block in Blockly rot hervorgehoben. Optional: Karel-Wackel-Animation.
- **Akzeptanzkriterien:**
  - Fehlermeldung in deutschem Klartext (aus config)
  - Fehlerhafter Block im Editor markiert
  - Meldung verschwindet bei nächstem Start/Reset

### T-073: Fortschrittsanzeige (Header)
- **Priorität:** 🟡
- **Datei(en):** `src/components/Feedback/ProgressBar.tsx`
- **Beschreibung:** Im Header: Anzeige "X von 12 Aufgaben gelöst" + Sterne-Visualisierung (★ für gelöst, ☆ für offen).
- **Akzeptanzkriterien:**
  - Zähler aktualisiert sich bei jeder gelösten Aufgabe
  - Sterne-Anzeige passend zur Anzahl gelöster Aufgaben
  - Visuell ansprechend, nicht dominant

### T-074: Level-Abschluss-Meldung
- **Priorität:** 🟡
- **Datei(en):** `src/components/Feedback/LevelCompleteModal.tsx`
- **Beschreibung:** Wenn alle Aufgaben eines Levels gelöst: besondere Meldung:
  - L1: "Toll! Du beherrschst die Grundlagen!"
  - L2: "Genial! Schleifen sind kein Problem für dich!"
  - L3: "Wow! Du denkst schon wie eine echte Programmiererin!"
- **Akzeptanzkriterien:**
  - Erscheint einmalig beim Abschließen des letzten Tasks im Level
  - Visuell hervorgehoben (größer als normale Erfolgsmeldung)
  - Hinweis auf nächstes Level (falls vorhanden)

### T-075: Sterne in Aufgabenliste
- **Priorität:** 🟡
- **Datei(en):** `src/components/TaskPanel/TaskPanel.tsx`
- **Beschreibung:** Gelöste Aufgaben in der Liste mit goldenem Stern (★) markieren. Ungelöste ohne Stern.
- **Akzeptanzkriterien:**
  - Goldener Stern neben gelösten Aufgaben
  - Stern bleibt nach Reload erhalten (localStorage)

---

## Sprint 8 — Layout & UI-Polish

### T-080: 3-Spalten-Hauptlayout
- **Priorität:** 🔴
- **Datei(en):** `src/App.tsx`
- **Beschreibung:** Haupt-Layout gemäß Pflichtenheft:
  - Header: Logo/Titel | Aufgabentitel | Fortschritt
  - Body: Links (~20%) TaskPanel | Mitte (~40%) Grid | Rechts (~40%) Editor
  - Footer: Controls-Leiste
- **Akzeptanzkriterien:**
  - Drei Spalten mit korrekten Proportionen
  - Header und Footer fixiert
  - Kein vertikaler Scroll (alles in Viewport)
  - Min. 1024×768px funktional

### T-081: Kindgerechtes Styling
- **Priorität:** 🟡
- **Datei(en):** `src/index.css`, diverse Komponenten
- **Beschreibung:** Durchgängig kindgerechtes Design:
  - Abgerundete Ecken (border-radius) überall
  - Große klickbare Flächen (≥ 44×44px)
  - Icons neben Text auf Buttons
  - Freundliche Farben (MCI-Blau als Akzent)
  - Tooltips auf allen Buttons
- **Akzeptanzkriterien:**
  - Kein Button kleiner als 44×44px
  - Alle Buttons haben Tooltips
  - Konsistentes Farbschema gemäß Pflichtenheft
  - Schrift ≥ 14px (Text), ≥ 16px (Blöcke)

### T-082: Responsive Skalierung
- **Priorität:** 🟡
- **Datei(en):** `src/App.tsx`, `src/components/Grid/Grid.tsx`
- **Beschreibung:** Layout passt sich an Fenstergrößen ab 1024×768px an. Grid skaliert proportional. Blockly-Workspace resized korrekt.
- **Akzeptanzkriterien:**
  - Bei 1024×768: alles sichtbar und nutzbar
  - Bei größerem Fenster: Elemente wachsen proportional mit
  - Kein horizontaler Scroll, kein Overflow

### T-083: Karel-Störungsanimation bei Fehler
- **Priorität:** 🟢
- **Datei(en):** `src/components/Karel/Karel.tsx`
- **Beschreibung:** Wenn Karel gegen eine Wand läuft oder einen ungültigen Befehl ausführt: kurze Wackel-Animation (CSS shake) und optional Fragezeichen-Symbol über Karel.
- **Akzeptanzkriterien:**
  - Wackel-Animation bei Wandkollision (0.5s)
  - Optional: Fragezeichen/Ausrufezeichen-Overlay
  - Animation blockiert nicht die weitere Bedienung

---

## Sprint 9 — Qualität & Deployment

### T-090: Alle 12 Aufgaben manuell verifizieren
- **Priorität:** 🔴
- **Datei(en):** —
- **Beschreibung:** Jede der 12 Aufgaben im Browser durchspielen:
  - Musterlösung eingeben → Erfolg erwartet
  - Falsche Lösung eingeben → Misserfolg/Fehler erwartet
  - Edge Cases testen (leeres Programm, nur Drehungen, etc.)
- **Akzeptanzkriterien:**
  - 12/12 Aufgaben mit Musterlösung lösbar
  - Falsche Lösungen erzeugen korrekte Fehlermeldungen
  - Keine Crashes oder unerwartes Verhalten

### T-091: Browser-Kompatibilität testen
- **Priorität:** 🟡
- **Datei(en):** —
- **Beschreibung:** Testen in Chrome, Firefox, Edge (jeweils aktuelle Version). Prüfen: Blockly funktioniert, SVG-Rendering korrekt, Animationen flüssig.
- **Akzeptanzkriterien:**
  - Chrome: vollständig funktional
  - Firefox: vollständig funktional
  - Edge: vollständig funktional

### T-092: GitHub Pages Deployment einrichten ✅ (vorbereitet)
- **Priorität:** 🔴
- **Datei(en):** `.github/workflows/deploy.yml`, `vite.config.ts`
- **Beschreibung:** GitHub Actions Workflow für automatisches Deployment auf GitHub Pages. Bei jedem Push auf `main` wird die App gebaut und deployed. Relative Pfade (`base: './'`) für Kompatibilität mit GitHub Pages und USB-Fallback.
- **Akzeptanzkriterien:**
  - Push auf `main` → automatischer Build + Deploy via GitHub Actions
  - App unter `https://<user>.github.io/<repo>/` erreichbar
  - `npm run build` lokal funktioniert
  - `npm run preview` zeigt korrekte App

### T-093: USB-Stick-Fallback
- **Priorität:** 🔴
- **Datei(en):** `vite.config.ts` (usbFallback-Plugin)
- **Beschreibung:** Falls Internet am GirlsDay ausfällt: `dist/`-Ordner auf USB-Stick, auf Desktop kopieren, `start.bat` doppelklicken. Vite-Plugin erzeugt automatisch eine `start.bat` im `dist/`-Ordner, die Chrome mit `--allow-file-access-from-files` startet.
- **Akzeptanzkriterien:**
  - `npm run build` erzeugt `dist/start.bat`
  - `start.bat` öffnet Chrome mit `index.html`
  - App funktioniert komplett aus dem lokalen `dist/`-Ordner (alle Assets relativ)
  - Keine Netzwerk-Requests nötig nach dem Öffnen

### T-094: WCAG AA Kontrast-Check
- **Priorität:** 🟢
- **Datei(en):** `src/index.css`
- **Beschreibung:** Alle Text/Hintergrund-Kombinationen auf WCAG AA Kontrast prüfen. Ggf. Farben anpassen.
- **Akzeptanzkriterien:**
  - Kontrastverhältnis ≥ 4.5:1 für normalen Text
  - Kontrastverhältnis ≥ 3:1 für großen Text und UI-Elemente

---

## Zusammenfassung

| Sprint | Tickets | Muss (🔴) | Soll (🟡) | Kann (🟢) |
|---|---|---|---|---|
| 0 — Setup | T-001 bis T-004 | 4 | 0 | 0 |
| 1 — Engine | T-010 bis T-015 | 6 | 0 | 0 |
| 2 — Blockly | T-020 bis T-024 | 5 | 0 | 0 |
| 3 — Spielwelt | T-030 bis T-035 | 4 | 2 | 0 |
| 4 — Editor | T-040 bis T-043 | 3 | 1 | 0 |
| 5 — Steuerung | T-050 bis T-054 | 4 | 1 | 0 |
| 6 — Aufgaben | T-060 bis T-065 | 4 | 2 | 0 |
| 7 — Feedback | T-070 bis T-075 | 3 | 3 | 0 |
| 8 — UI-Polish | T-080 bis T-083 | 1 | 2 | 1 |
| 9 — Qualität | T-090 bis T-094 | 2 | 1 | 2 |
| **Gesamt** | **36 Tickets** | **36** | **12** | **3** |

**MVP (nur 🔴 Muss):** 36 Tickets in Sprints 0–9
**Vollständig (🔴+🟡):** +12 Tickets für Soll-Features
**Komplett (alle):** +3 Tickets für Nice-to-haves

---

## Parallelisierung & Abhängigkeiten

Übersicht: welche Tickets welche Vorbedingungen haben und welche parallel bearbeitet werden können. Siehe auch [PLANUNG.md → Parallelisierungsstrategie](PLANUNG.md#parallelisierungsstrategie) für den optimalen 3-Entwickler-Zeitplan.

### Abhängigkeitsmatrix

| Ticket | Hängt ab von | Kann parallel mit | Track |
|---|---|---|---|
| **Sprint 1 — Game Engine** | | | |
| T-010 Weltzustand | Sprint 0 ✅ | T-020–T-022, T-030, T-080 | A |
| T-011 Bewegungslogik | T-010, T-012 | T-013, T-015 (gleiche Datei beachten!) | A |
| T-012 Wandkollision | T-010 | T-013, T-015 | A |
| T-013 Bedingungen | T-010 | T-012, T-015 | A |
| T-014 Interpreter | T-010, T-011, T-012, T-013 | — (braucht alles aus Sprint 1) | A |
| T-015 Validator | T-010 | T-011, T-012, T-013 (eigene Datei) | A |
| **Sprint 2 — Blockly** | | | |
| T-020 Befehls-Blöcke | Sprint 0 ✅ | T-021, T-022, **T-010** (cross-sprint!) | B |
| T-021 Schleifen-Block | Sprint 0 ✅ | T-020, T-022 | B |
| T-022 Bedingungs-Blöcke | Sprint 0 ✅ | T-020, T-021 | B |
| T-023 Code-Generator | T-020, T-021, T-022 | T-024 (verschiedene Dateien) | B |
| T-024 Toolbox | T-020, T-021, T-022 | T-023 | B |
| **Sprint 3 — SVG-Spielwelt** | | | |
| T-030 Grid | Sprint 0 ✅ | T-033, **T-020–T-022** (cross-sprint!) | C |
| T-031 Wand-Rendering | T-030, T-010 | T-032, T-035 | C |
| T-032 Beeper-Rendering | T-030, T-010 | T-031, T-035 | C |
| T-033 Karel-Rendering | T-010 | T-030, T-031, T-032 | C |
| T-034 Karel-Animation | T-033 | T-035 | C |
| T-035 Zielvorschau | T-030, T-010 | T-034 | C |
| **Sprint 4 — Editor** | | | |
| T-040 Blockly-Workspace | T-024 | T-041 (verschiedene Dateien) | B |
| T-041 Text-Ansicht | T-023 | T-040 | B |
| T-042 Toggle | T-040, T-041 | T-043 (wenn sequenziell in Editor.tsx) | B |
| T-043 Löschen-Button | T-040 | T-042 | B |
| **Sprint 5 — Steuerung** | | | |
| T-050 Play/Stop | T-054 | T-051 | A/B |
| T-051 Schritt-Modus | T-054 | T-050 | A/B |
| T-052 Geschwindigkeit | config.ts (Sprint 0 ✅) | **alles** (keine echte Abhängigkeit!) | C |
| T-053 Reset-Button | T-010 | T-052, **Sprint 2+3** (cross-sprint!) | C |
| T-054 Orchestrierung | T-014, T-023, T-033, T-040 | — (**CONVERGENCE POINT**) | A+B+C |
| **Sprint 6 — Aufgabensystem** | | | |
| T-060 Task-JSON | T-010 (nur Typen-Schema) | **Sprint 2+3** (cross-sprint!) | C |
| T-061 Task-Panel | T-060 | T-064 | C |
| T-062 Level-Freischaltung | T-061, T-064, T-065 | T-063 | A |
| T-063 Betreuer-Taste | T-062 | — | A |
| T-064 Validierung+Trigger | T-015, T-054 | T-061 | A |
| T-065 localStorage | T-064 | — | A |
| **Sprint 7 — Feedback** | | | |
| T-070 Erfolgs-Modal | T-064 | T-071, T-072 (verschiedene Dateien) | C |
| T-071 Misserfolg | T-064 | T-070, T-072 | C |
| T-072 Laufzeitfehler | T-054 | T-070, T-071 | C |
| T-073 Fortschrittsanzeige | T-065 | T-075 | C |
| T-074 Level-Abschluss | T-062 | T-073, T-075 | C |
| T-075 Sterne | T-065 | T-073 | C |
| **Sprint 8 — UI-Polish** | | | |
| T-080 3-Spalten-Layout | Sprint 0 ✅ | **alles in Phase 1** (cross-sprint!) | C |
| T-081 Kindgerechtes Styling | Meiste Komponenten fertig | T-082 | B |
| T-082 Responsive Skalierung | T-080, T-030, T-040 | T-081 | B |
| T-083 Wackel-Animation | T-033, T-072 | T-081 | C |
| **Sprint 9 — Qualität** | | | |
| T-090 Manuelle Verifikation | Alles fertig | T-091, T-094 | Alle |
| T-091 Browser-Kompatibilität | T-090 | T-094 | Alle |
| T-092 GitHub Pages | Sprint 0 ✅ (bereits vorbereitet) | — | — |
| T-093 USB-Fallback | Sprint 0 ✅ (bereits in vite.config.ts) | — | — |
| T-094 WCAG-Check | Finales Styling | T-090 | Alle |

### Parallelisierung innerhalb der Sprints

**Sprint 1 — Game Engine:**
```
T-010 ─── muss zuerst (Typen definieren)
  ├─> T-012 + T-013 + T-015 ── parallel (T-015 eigene Datei)
  └─> T-011 ── nach T-012 (braucht canMove)
        └─> T-014 ── braucht alles
```

**Sprint 2 — Blockly:**
```
T-020 + T-021 + T-022 ── parallel (unabhängige Block-Registrierungen)
  └─> T-023 + T-024 ── parallel (verschiedene Dateien)
```

**Sprint 3 — SVG-Spielwelt:**
```
T-030 + T-033 ── parallel (Grid.tsx vs Karel.tsx)
  ├─> T-031 + T-032 + T-035 ── parallel nach T-030
  └─> T-034 ── nach T-033
```

**Sprint 7 — Feedback (höchste Parallelisierbarkeit!):**
```
T-070 + T-071 + T-072 ── alle parallel (verschiedene Dateien)
T-073 + T-075 ── parallel (verschiedene Dateien)
T-074 ── separat (braucht T-062)
```

### Cross-Sprint-Parallelisierung

Die größten Zeitersparnisse entstehen durch sprint-übergreifende Parallelisierung:

| Ticket | Zugewiesener Sprint | Kann tatsächlich starten ab | Ersparnis |
|---|---|---|---|
| T-020, T-021, T-022 | Sprint 2 | Phase 1 (nur Blockly nötig) | ~1 Sprint |
| T-030 | Sprint 3 | Phase 1 (nur React nötig) | ~2 Sprints |
| T-060 | Sprint 6 | Phase 2 (nur T-010 Typen) | ~4 Sprints |
| T-080 | Sprint 8 | Phase 1 (nur React nötig) | ~7 Sprints |
| T-052 | Sprint 5 | Phase 1 (nur config.ts nötig) | ~4 Sprints |
| T-053 | Sprint 5 | Phase 2 (nur T-010 nötig) | ~3 Sprints |
| T-092, T-093 | Sprint 9 | Bereits erledigt (Sprint 0) | Komplett |

### Kritischer Pfad

Die längste sequenzielle Kette bestimmt die Mindest-Projektdauer:

```
T-010 → T-012 → T-011 → T-014 → T-054 → T-064 → T-065 → T-062
                                    ↑
                             braucht auch:
                             T-023, T-033, T-040
```

**T-054 (Ausführungs-Orchestrierung)** ist der zentrale Engpass — hier konvergieren alle drei Tracks. Empfehlung: Interfaces (AST-Typen, Action-Typen, State-Shape) frühzeitig in Phase 1 definieren.

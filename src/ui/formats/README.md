# ui/formats

Ein Renderer je Format, registriert in `registry.ts` (Vertrag `FormatProps` in `types.ts`, ARCHITECTURE.md §6). Alle neun Formate seit Aufgabe 7.

- Kacheln, Häkchen und „(deine Wahl)“ kommen aus `choice.tsx`, damit jedes Format gleich markiert.
- Mischen und Vorlesen: `src/domain/presentation` (nie im Renderer selbst mischen).
- `Match` und `Order` nutzen dnd-kit und liegen in eigenen Chunks (`lazyFormat` in `registry.ts`); nur dort darf dnd-kit importiert werden (`scripts/check-bundle.ts`).
- `MarkInText` nutzt zwingend `splitUnits()` (CLAUDE.md).

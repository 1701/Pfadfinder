# data

- `repos.ts`: Repository-Interfaces; `dexie/` (IndexedDB, DB `pfadfinder`) und `memory/` (Tests) erfüllen dieselbe Contract-Suite (`tests/data/repos.contract.ts`).
- `practice.ts`: Anwendungsdienst fürs Üben (laden → Domain → speichern), `backup.ts`: Export/Import.
- `session-store.ts`: Zustand-Store "session"; ruft nur `practice.ts` auf.

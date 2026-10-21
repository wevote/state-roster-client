# Run console

The web front end for the staging database: React 18, TypeScript, Vite, Material UI, TanStack Query and React Router. It has no data of its own. Every page reads from the API in `src/StateBallot.Api` of [state-roster-pipeline](../state-roster-pipeline), so the API has to be running first. What the console shows and how jobs run is in the "Run console" section of that repo's README.

## Running it

Use Node 22, the version the Docker image builds with.

```bash
# from ../state-roster-pipeline
docker compose up -d --wait mysql
dotnet run --project src/StateBallot.Api      # http://localhost:5080, migrates the staging schema on start

# in another terminal
cd ../state-roster-client
npm ci                                        # installs exactly what package-lock.json pins
npm start                                     # http://localhost:5173, reloads as you edit. npm run dev does the same.
```

Use `npm ci`, not `npm install`. `npm install` can rewrite `package-lock.json` when your npm version differs from the one that wrote it.

If a page says "The API answered 503" or "Is it running?", the API is not running or cannot reach MySQL. The API's terminal says which.

## Scripts

| Command | What it does |
| --- | --- |
| `npm start` (or `npm run dev`) | Dev server on port 5173 with hot reload |
| `npm run lint` | ESLint with the same airbnb-based rules as WebApp and weconnect-client (`.eslintrc`) |
| `npm run build` | Type-checks with `tsc`, then builds to `dist/`. A type error fails the build. |
| `npm run preview` | Serves the built `dist/` on port 5173. The Docker image runs this. |

There are no tests yet. Run `npm run lint` and `npm run build` before pushing.

## Config

`src/js/config.js` holds the logging switches that `src/js/common/utils/logging.js` reads, for example `LOG_RENDER_EVENTS` to print every `renderLog` call. Git ignores it. `npm start`, `npm run dev` and `npm run build` create it from `config-template.js` when it is missing (`node/initialSteps.js`), so change your copy, not the template.

## Talking to the API

The browser code only calls relative `/api/...` paths (`src/api.ts`). Vite forwards them to the API, so the browser stays on one origin and the API needs no CORS. The forwarding target is set by `API_URL`, which only Vite reads (see `vite.config.ts`):

| Where | `API_URL` |
| --- | --- |
| `npm run dev` on the host | unset, defaults to `http://localhost:5080` |
| `docker compose up web` | `http://api:5080`, set in the pipeline's `docker-compose.yml` |
| An API somewhere else | `API_URL=http://host:5080 npm run dev` |

There are no `.env` files or `VITE_*` variables, and the API URL is not in `config.js`.

Pages poll the API, so runs started from the CLI or another browser show up without a reload.

## Layout

The folders follow WeVote's [WebApp](../WebApp) and [weconnect-client](../weconnect-client), so the shared `common` folder works here unchanged.

| Path | What it is |
| --- | --- |
| `src/index.tsx` | Entry point: error boundary, theme, React Query client, router |
| `src/App.tsx` | Routes, and the "Start a run" dialog |
| `src/js/common/` | Copied from `WebApp/src/js/common`. Do not edit it here. See below. |
| `src/js/components/` | Components, in a folder per area. `Widgets/` holds the small shared ones (`StatusText`, `PageHeader`, `Pending`...). |
| `src/js/components/Style/consoleTheme.ts` | Material UI theme |
| `src/js/contexts/StartRunContext.tsx` | Lets any page open the "Start a run" dialog |
| `src/js/pages/` | One file per route |
| `src/js/react-query/` | `RosterQuery.ts` (`useApi`, the polling fetch hook, and `startJob`) and `apiTypes.ts` (response types) |
| `src/js/utils/` | Formatting and run helpers |
| `src/js/config-template.js` | Template for `config.js` |
| `node/initialSteps.js` | Creates `config.js` before dev and build |

### The common folder

`src/js/common` must stay identical to `WebApp/src/js/common` (see `ReadMeReCommonDirectory.txt` in it). Fix a bug there in WebApp, then copy the folder over:

```bash
rsync -a --delete --exclude .DS_Store ../WebApp/src/js/common/ src/js/common/
```

Only the files the console imports get built. Today those are `utils/logging.js` (`renderLog`, `httpLog`), `utils/numberWithCommas.js`, `components/Widgets/ErrorBoundary.jsx` and `components/Widgets/LoadingWheel.jsx`. Many other files there import WebApp files that do not exist here (stores, actions), or need `styled-components` and `@mui/styles`, which this repo does not install. `npm run lint` and `tsc` skip the folder, since WebApp lints it. Some common files use `require()`, which `vite-plugin-commonjs` handles.

| Route | Page |
| --- | --- |
| `/` | `Overview`: every state with its latest retrieve and run |
| `/states/:code` | `StatePage` |
| `/states/:code/elections/:key` | `ElectionPage` |
| `/runs/:id` | `RunPage` |
| `/retrieves/:id` | `CapturePage`. The console calls a capture a "retrieve". |
| `/activity` | `Activity`: recent jobs, retrieves and runs |

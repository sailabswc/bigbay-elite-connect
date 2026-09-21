# AGENTS.md

## Project context

This repository is a local-first, browser-based operations app for event management and safety operations. Keep changes focused on the user request, preserve the app's existing conventions, and prefer offline-safe patterns over hosted service assumptions.

Start with `README.md` for local setup and delivery guidance.

## Key files

- `src/`: frontend application source.
- `src/api/localRuntime.js`: local in-browser runtime with mock data, auth, and entity stores.
- `vite.config.js`: local Vite development configuration.
- `.env.local`: local-only environment values; never commit secrets.

## Working notes

- Prefer `npm run dev` for the default local workflow.
- Keep the app fully offline-capable: data should come from local storage/mock fixtures rather than remote hosted backends.
- Reuse the existing local runtime layer before adding new integrations or service dependencies.
- Run the relevant checks from `package.json` before finishing code changes.

# Shelf Software

Shelf Software is a local-first operations suite for event operators, safety teams, and coastal swim businesses that need dependable scheduling, compliance, crew coordination, and registration control without depending on a hosted backend.

This repository contains the product prototype for a modern operations dashboard built around offline-safe local storage, reliable workflow UX, and hospitality-grade presentation for client conversations.

## Product position

- Local-first by default: no remote auth provider or hosted data layer required to run the app.
- Production-ready front-end: Vite + React build pipeline, standard browser runtime, and resilient mock data layer.
- Operationally useful: event management, safety monitoring, finance, support workflows, and crew oversight in one interface.
- Client-pitch friendly: written as a polished "Shelf Software" narrative rather than a technical scaffold.

## What this app does

- Manage event calendars and swim operations.
- Track athlete registrations, safety screening, and check-in status.
- Monitor live safety alerts and incident workflow actions.
- Support crew coordination, equipment review, and call-center style follow-up.
- Keep the experience usable offline with local browser state persistence.

## Local development

### Prerequisites

- Node.js 18+
- npm

### Run the app

```bash
npm install
npm run dev
```

Then open the local Vite URL in the browser, typically:

```text
http://localhost:5173
```

### Production build

```bash
npm run build
```

### Optional validation checks

```bash
npm run lint
npm run typecheck
```

## Demo access

The app ships with built-in local demo accounts so the interface can be explored immediately without external services.

- Admin: admin@bigbayconnect.local / admin123
- Operations: amber@bigbayconnect.local / demo123
- Support: jiro@bigbayconnect.local / demo123
- New registrations sign in immediately on the current device; password recovery creates a local reset link instead of sending email.

These credentials and local password flows are for demos and development only. A hosted production rollout should replace them with server-side identity, secure password storage, email delivery, and account recovery controls.

## Architecture notes

- Runtime data is served from `src/api/localRuntime.js`.
- Browser-local persistence is used for auth state, entities, and user sessions.
- The app is intentionally decoupled from hosted provider dependencies to keep it portable and resilient.

## Client pitch summary

Shelf Software is positioned as a compact, high-trust operations platform for teams that need visibility, safety controls, and operational speed without enterprise drag.

It is designed to feel like a premium SaaS product while remaining simple to deploy, easy to customize, and safe to use in low-connectivity environments.

## Related package

See `SALES_PACKAGE.md` for a more polished client-facing sales narrative and product brief.
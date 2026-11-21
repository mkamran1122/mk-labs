# MK Labs — Digital Products & Technology Studio

A clean, frontend-only React + Vite + TypeScript web application for **MK Labs** (Digital Products & Technology Studio).

## Local Development

```bash
npm install
npm run dev
```

Runs the Vite development server on `http://localhost:3000`.

## Production Build & Type Check

```bash
npm run lint
npm run build
```

Builds static frontend assets into `dist/`.

## Notes

- Backend, authentication, database, and file storage integrations have been removed from this repository so they can be redesigned separately.
- Routes requiring backend APIs (Digital Store catalogue queries, downloads, customer accounts, and `/admin/*` management actions) remain intact in the UI and report that backend services are temporarily unavailable.

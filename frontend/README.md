# EcoAlert — Frontend

The citizen-facing web app for EcoAlert, an environmental issue reporting platform. Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, and Framer Motion.

## Stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **Tailwind CSS** with a custom EcoAlert design-token theme (`tailwind.config.ts`)
- **Framer Motion** for entrance/scroll animation
- **React Hook Form + Zod** for form state and validation
- **TanStack React Query + Axios** for data fetching against the backend API
- **lucide-react** for icons, **react-hot-toast** for notifications, **next-themes** for dark mode

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in NEXT_PUBLIC_API_URL etc.
npm run dev
```

The app runs at `http://localhost:3000`.

## Scripts

| Script          | Purpose                              |
| --------------- | ------------------------------------- |
| `npm run dev`   | Start the dev server                  |
| `npm run build` | Production build (fails on TS errors) |
| `npm run start` | Serve the production build            |
| `npm run lint`  | ESLint                                |
| `npm run format`| Prettier (with Tailwind class sorting)|
| `npm test`      | Vitest — component and validator unit tests |
| `npm run test:watch` | Vitest in watch mode |

## Project structure

```
src/
  app/                 # App Router routes and layouts
  components/
    landing/           # Landing-page sections (Hero, Features, etc.)
    ui/                 # Shared, reusable primitives
  lib/                  # Mock data, API client, utilities
public/
  textures/             # SVG background textures (contour map motif)
```

## Design system

Defined in `tailwind.config.ts` and `src/app/globals.css`:

- **Color**: `canopy` (deep green, 50–900 scale), `moss` (mid-green accent), `mist` (pale sage background), `paper` (off-white), `alert.amber` / `alert.clay` (severity indicators)
- **Type**: Fraunces (display), Inter (body), IBM Plex Mono (data/coordinates/IDs)
- **Signature motif**: a topographic contour-line texture with pulsing GPS pins, echoing the product's core mechanic — geotagged environmental reports

## Status

Frontend is feature-complete against the original spec: landing page, all auth flows, citizen/officer/admin dashboards, all static pages, interactive map location picking (Leaflet/OSM), dark mode, and Docker/Vercel deployment config.

Next milestone: the Express + MongoDB backend this app is designed to talk to.

## Docker

```bash
docker compose up --build
```

Serves the production build at `http://localhost:3000`. Set `NEXT_PUBLIC_API_URL` etc. via a `.env` file or exported environment variables — see `.env.example`.

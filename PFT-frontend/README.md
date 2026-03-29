# Personal Finance Tracker Frontend

React frontend for the hackathon Personal Finance Tracker, built to be readable, testable, and deployment-ready.

## Tech Stack
- React 18.3.1
- TypeScript 5.7.3
- Vite 6.2.0
- Redux Toolkit 2.2.8 + React Redux 9.1.2
- React Router 6.30.1
- React Hook Form 7.53.2 + Zod 3.24.2
- Recharts 2.15.1
- Tailwind CSS 3.4.17
- shadcn/ui style component primitives (Button, Card)
- Framer Motion
- Axios 1.8.3
- Vitest + Testing Library

## Project Structure
- `src/app` app bootstrap and route composition
- `src/components` reusable layout and chart components
- `src/features` feature modules (dashboard, transactions, budgets, goals, recurring, reports, accounts, auth)
- `src/store` redux store, slices, selectors
- `src/services` API client for backend integration
- `src/types` shared domain types
- `src/utils` formatters and seed data
- `src/test` test setup and unit tests

## Local Setup
1. Install Node.js 20.x (LTS recommended).
2. Install dependencies:
   - `npm install`
3. Start dev server:
   - `npm run dev`
4. Open browser:
   - `http://localhost:5173`

## Commands
- `npm run dev` run local dev server
- `npm run build` build production bundle
- `npm run preview` preview build output
- `npm run typecheck` run TypeScript checks
- `npm test` run unit/integration tests

## Environment Variables
Create `.env.local` if needed:
- `VITE_API_BASE_URL=http://localhost:5012/api`

## Podman Image Build
Build static frontend image:
- `podman build -t pft-frontend:latest .`

Run image locally:
- `podman run --rm -p 8081:80 pft-frontend:latest`

## Azure Deployment Notes
- This repo includes `azure-pipelines-frontend.yml` for CI validation.
- Build artifact is generated via `npm run build` and can be deployed to Azure Static Web Apps, Azure App Service, or AKS.
- For container deployment, use `podman build`, push to Azure Container Registry, then deploy to App Service/AKS.

## Current Scope
This frontend is now wired to the .NET backend APIs for auth and finance modules. Redux state is refreshed from backend after create/update/delete operations, with local seed data kept only as fallback.

V2 screens are also added:
- Insights (`/insights`): health score, cash-flow forecasting, safe-to-spend, savings-rate trend
- Rules (`/rules`): merchant-based automation rule management
- Family (`/family`): shared account member management

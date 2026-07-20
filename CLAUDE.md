# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git conventions

Do NOT add a `Co-Authored-By: Claude ...` trailer (or any AI/tool attribution) to commit messages or PR descriptions. Follow the existing commit style — check `git log` first.

## Commands

```bash
npm run dev            # Start development server (Vite); `npm start` is an alias
npm run build          # Production build
npm run build:analyze  # Build with rollup-plugin-visualizer (ANALYZE=true)
npm run preview        # Serve the production build locally
npm run lint           # ESLint (max-warnings 0 — zero tolerance)
npm run lint-fix       # Auto-fix lint issues
npm run pretty         # Format with Prettier
npm run pretty:check   # Check formatting
npm run check-all      # lint + pretty:check + tsc + build + outdated + audit
npm run deploy         # Build and publish dist/ via gh-pages
npx tsc --noEmit       # Type check without building
```

### Lint specifics

`eslint.config.js` enforces:
- `unused-imports/no-unused-imports: error` — unused imports fail the build
- `unused-imports/no-unused-vars: warn` with `^_` ignore pattern — but `--max-warnings 0` makes these hard failures too

Prefix intentionally unused identifiers with `_`.

## Architecture

**Stack**: React 19 + TypeScript + Vite + Redux Toolkit + Material-UI 7 + react-router-dom v7

### State & Data Fetching

All server state is managed via **RTK Query** in `src/store/api/`, which is split into:
- `src/store/api/auth/` — pre-auth endpoints (login, refresh)
- `src/store/api/business/<domain>/` — one folder per domain (catalyst-master, inspection-master, mould, part-master, prc-execution, prc-template, sap-job-runs, sequence-master, dashboard). Add new domains here.

Each slice uses tag-based cache invalidation. Every endpoint's `transformResponse` validates the response shape using a corresponding `*.validators.ts` file (runtime type guards). If validation fails, a console warning is emitted but the data still flows through.

**Auth flow**: `src/store/api/baseApi.ts` is the shared base query — it attaches Bearer tokens and handles 401s by calling `auth/refresh`, storing new tokens via `src/utils/Cookie.ts` (localStorage-backed), and retrying the original request. On refresh failure, it dispatches a global LOGOUT action.

### Routing & Permissions

Routes are not hardcoded — they are generated at runtime from `src/routes/screenList.ts`, which defines a hierarchical screen config (path, element, permission string, sidebar visibility, order). The `useAuthRoutes` hook filters this list against the current user's permissions from `RoleContext`.

`RoleContext` (`src/contexts/`) is the single source of truth for the logged-in user's roles and permissions. Use the `useRole` hook (from `src/contexts/useRole.ts`) to access it in components — it throws if used outside a `RoleProvider`.

Permission-gating in UI components uses `<RoleGuard permission="...">`.

### Component Conventions

- `src/components/common/` — shared UI primitives (buttons, modals, skeletons, breadcrumbs, etc.)
- `src/components/masters/` — domain-specific components for master data screens
- `src/layouts/` — `MainLayout` (authenticated, with drawer + `ModernTopBar`) and `MinimalLayout` (login)
- Lazy-loaded page components use the `Loadable` HOC wrapper from `src/components/common/Loadable/`

### Forms

React Hook Form + Yup for all forms (via `@hookform/resolvers`). Use `src/utils/flattenRhfFieldErrors.ts` to display nested validation errors from Yup schemas.

### Styling

Material-UI `sx` prop for component-level styles. Global theme in `src/themes/` — custom palette, Poppins font, custom breakpoints (sm: 768, md: 1024, lg: 1266). Component overrides live in `src/themes/overrides/`.

### Environment Variables

Configured in `vite.config.ts` via `vite-plugin-environment`. Key variables:
- `API_BASE_URL` — authenticated API base (default: `localhost:8000/web/`)
- `API_BASE_URL_PRE_AUTH` — pre-auth endpoints (default: `localhost:8000/`)
- `REDIRECT_URI` — post-login redirect target
- `AUTH_MODE` — token storage mode (`localStorage`)

## Backlog (from Todo.md)

- Login routes still use Yup; planned migration to Zod has not started (no `zod` dep installed yet).
- Medium/low priority: package upgrades, MUI theme system formalization, pnpm migration, Biome migration.

Note: `@ant-design/colors` and `@ant-design/icons` are intentionally in use (palette, hyperlink button, back button, login form). The core `antd` package is not installed.

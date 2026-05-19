# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server (Vite)
npm run build        # Production build
npm run lint         # ESLint (max-warnings 0 — zero tolerance)
npm run lint-fix     # Auto-fix lint issues
npm run pretty       # Format with Prettier
npm run pretty:check # Check formatting (used in pre-push)
npx tsc --noEmit     # Type check without building
```

The `pre-push` hook runs type check → lint → prettier check → build in sequence. All must pass before a push succeeds.

## Architecture

**Stack**: React 19 + TypeScript + Vite + Redux Toolkit + Material-UI 7

### State & Data Fetching

All server state is managed via **RTK Query** in `src/store/api/`. Each domain has its own API slice (catalystApi, prcExecutionApi, sapJobRunsApi, etc.) with tag-based cache invalidation.

Every API endpoint's `transformResponse` validates the response shape using a corresponding `*.validators.ts` file (runtime type guards). If validation fails, a console warning is emitted but the data still flows through.

**Auth flow**: `src/store/api/baseApi.ts` is the shared base query — it attaches Bearer tokens and handles 401s by calling `auth/refresh`, storing new tokens via `src/utils/Cookie.ts` (localStorage-backed), and retrying the original request. On refresh failure, it dispatches a global LOGOUT action.

### Routing & Permissions

Routes are not hardcoded — they are generated at runtime from `src/routes/screenList.ts`, which defines a hierarchical screen config (path, element, permission string, sidebar visibility, order). The `useAuthRoutes` hook filters this list against the current user's permissions from `RoleContext`.

`RoleContext` (`src/contexts/`) is the single source of truth for the logged-in user's roles and permissions. Use the `useCurrentRole` hook to access it in components.

Permission-gating in UI components uses `<RoleGuard permission="...">`.

### Component Conventions

- `src/components/common/` — shared UI primitives (buttons, modals, skeletons, breadcrumbs, etc.)
- `src/components/masters/` — domain-specific components for master data screens
- `src/layouts/` — `MainLayout` (authenticated, with drawer + `ModernTopBar`) and `MinimalLayout` (login)
- Lazy-loaded page components use the `Loadable` HOC wrapper from `src/components/common/Loadable/`

### Forms

React Hook Form + Yup for all forms. Use `src/utils/flattenRhfFieldErrors.ts` to display nested validation errors from Yup schemas.

### Styling

Material-UI `sx` prop for component-level styles. Global theme in `src/themes/` — custom palette, Poppins font, custom breakpoints (sm: 768, md: 1024, lg: 1266). Component overrides live in `src/themes/overrides/`.

### Environment Variables

Configured in `vite.config.ts` via `vite-plugin-environment`. Key variables:
- `API_BASE_URL` — authenticated API base (default: `localhost:8000/web/`)
- `API_BASE_URL_PRE_AUTH` — pre-auth endpoints (default: `localhost:8000/`)
- `AUTH_MODE` — token storage mode (`localStorage`)

## Pending Migrations (from Todo.md)

- Ant Design (`antd`) is still installed but unused — should be removed
- Formik is still present; login form migration to React Hook Form + Zod is pending
- Package upgrades and pnpm migration are low-priority backlog items

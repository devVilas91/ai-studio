# Snapwork Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-04

## Active Technologies

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript 5.x (strict mode)
- **UI Library**: HeroUI v3 (@heroui/react@beta, @heroui/styles@beta)
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL via Supabase
- **ORM**: Prisma ORM
- **Authentication**: NextAuth.js (Google OAuth, JWT sessions)
- **Validation**: Zod
- **State Management**: Zustand (minimal)
- **Real-time**: WebSocket (ws library) + Supabase Realtime
- **Queue/Cache**: Redis (for WebSocket pub/sub, optional BullMQ)
- **i18n**: next-intl
- **Testing**: Jest, React Testing Library, Supertest, Cypress
- **Code Quality**: ESLint, Prettier, Husky

## Project Structure

```text
app/
├── (auth)/              # Auth routes (login, callback)
│   ├── login/
│   └── api/auth/
├── dashboard/           # Main dashboard
├── projects/
│   ├── [projectId]/
│   │   ├── page.tsx    # Project workspace
│   │   ├── workflows/
│   │   │   ├── page.tsx
│   │   │   └── [workflowId]/
│   │   ├── assets/
│   │   │   └── page.tsx
│   │   └── team/
│   └── page.tsx        # Projects list
├── api/
│   ├── v1/
│   │   ├── projects/
│   │   ├── workflows/
│   │   ├── assets/
│   │   ├── collaborations/
│   │   └── agents/
│   └── websocket/      # WebSocket upgrade handler
├── components/
│   ├── ui/             # HeroUI v3 components (custom wrappers if needed)
│   ├── layout/
│   ├── projects/
│   ├── workflows/
│   ├── assets/
│   └── collaboration/
├── lib/
│   ├── db/             # Prisma client & schema
│   ├── auth/           # NextAuth.js config, helpers
│   ├── validation/     # Zod schemas
│   ├── websocket/      # WS server, event handlers
│   ├── agents/         # AI agent orchestration (blog, image, video)
│   └── utils/
├── locales/            # i18n JSON files
├── styles/             # Global CSS, Tailwind config
└── types/              # Shared TypeScript types
```

## Commands

```bash
# Development
npm run dev          # Start Next.js dev server
npm run build        # Build for production
npm start            # Start production server

# Database
npx prisma generate          # Generate Prisma client
npx prisma migrate dev       # Create and apply migration locally
npx prisma db push           # Push schema without migrations
npx prisma studio            # Open Prisma Studio
npx prisma migrate deploy    # Apply migrations in production

# Testing
npm test                     # Run Jest tests
npm run test:e2e             # Run Cypress/Playwright

# Code Quality
npm run lint                 # Run ESLint
npm run format               # Run Prettier
```

## Code Style

- **TypeScript**: Strict mode. No `any` types without justification. Use interfaces and types explicitly.
- **React**: Functional components with hooks. Use `'use client'` directive only when necessary.
- **Next.js**: Prefer Server Components. Use `dynamic` for client-only components.
- **HeroUI v3**: Use compound components (e.g., `<Card><Card.Header>...</Card.Header></Card>`). No provider needed. Use semantic variants (`primary`, `secondary`, `tertiary`).
- **Tailwind v4**: Use utility classes. Custom styles via CSS variables if needed.
- **Naming**: camelCase for variables/functions, PascalCase for components/types, kebab-case for files.
- **Imports**: Group: 1) React/Next, 2) third-party, 3) internal (absolute paths from `@/`).
- **Error Handling**: Use try/catch for async operations. Return consistent error envelope.
- **API Routes**: Return `NextResponse.json({ success, data, error })`. Use Zod validation.
- **Database**: All queries via Prisma. Use parameterized queries (automatic). Include indexes for performance.

## Recent Changes

- **AI Content Studio (2026-03-04)**: Added full-stack Next.js app with HeroUI v3, Supabase/Prisma, NextAuth.js, WebSocket real-time, AI agent orchestration, asset management, and collaboration features.

## HeroUI v3 Guidelines

- **Installation**: `npm i @heroui/styles@beta @heroui/react@beta tailwind-variants`
- **Setup**: Import Tailwind then HeroUI in `globals.css`.
- **Components**: Use compound structure. Example:
  ```tsx
  import { Card, Button } from "@heroui/react@beta";
  <Card>
    <Card.Header><Card.Title>Title</Card.Title></Card.Header>
    <Card.Content>...</Card.Content>
    <Card.Footer><Button color="primary">Save</Button></Card.Footer>
  </Card>
  ```
- **Variants**: Use semantic colors (`primary`, `secondary`, `tertiary`, `danger`, `ghost`, `outline`).
- **Accessibility**: HeroUI components are WCAG 2.1 AA compliant out of the box. Use ARIA labels when needed.
- **Docs**: Always fetch latest from `https://v3.heroui.com/docs/react/components/{component}.mdx`.

## Authentication & Authorization

- Use NextAuth.js `auth()` in API routes to get session/user.
- Check permissions with `user.role` (from JWT token) or fetch from DB.
- Protect routes via `middleware.ts`.
- JWT tokens stored in HTTP-only cookies. Access token 15min, refresh 7 days.

## Database Best Practices

- Use Prisma Client for all DB access.
- Define indexes in schema for frequently queried fields.
- Use `include`/`select` to avoid N+1 queries.
- For JSONB fields, use Prisma's `Json` type and validate with Zod at runtime.
- Connection pooling via Supabase (`pgbouncer=true` in DATABASE_URL).
- Run `prisma migrate dev` for schema changes; commit migration files.

## Real-time & WebSockets

- Use separate WebSocket server (not Next.js API routes) for persistent connections.
- Broadcast events via Redis pub/sub for horizontal scaling.
- Clients join project rooms: `join_project` message.
- Server sends events: `agent_run_completed`, `cursor_update`, `asset_uploaded`, etc.
- Implement reconnection with exponential backoff on client.

## Performance Targets

- Frontend: LCP < 2.5s, FID < 100ms, CLS < 0.1, bundle < 200KB gzipped initial.
- Backend: API p95 < 200ms (simple), < 500ms (complex).
- Database: All queries indexed; no N+1; connection pooling.
- WebSocket: < 200ms delivery.

## Security Checklist

- Validate all inputs with Zod.
- Use HTTPS in production.
- Set CORS to allowed domains only.
- Rate limiting on API routes.
- Helmet.js security headers (via Next.js middleware).
- Secrets in environment variables only.
- Regular `npm audit`.
- Parameterized queries (Prisma default).

<!-- MANUAL ADDITIONS START -->
<!-- Add any project-specific notes here -->
<!-- MANUAL ADDITIONS END -->

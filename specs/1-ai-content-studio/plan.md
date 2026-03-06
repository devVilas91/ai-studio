# Implementation Plan: AI Content Studio

**Branch**: `1-ai-content-studio` | **Date**: 2026-03-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `./spec.md`

## Summary

Build a full-stack AI Content Studio using Next.js 14+ (App Router) with TypeScript, PostgreSQL via Supabase, Prisma ORM, and HeroUI v3 for the UI. The application provides project management, agentic AI workflow orchestration (blog, image, video generation), real-time collaboration via WebSockets, and asset management. Backend API routes and WebSocket handlers live within the Next.js app. Authentication via NextAuth.js with Google OAuth and JWT sessions.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+ (Next.js 14+)
**Primary Dependencies**: Next.js 14+, React 18+, HeroUI v3 (@heroui/react@beta, @heroui/styles@beta), Tailwind CSS v4, Prisma ORM, NextAuth.js, Supabase client, Zod (validation)
**Storage**: PostgreSQL via Supabase (managed)
**Testing**: Jest + React Testing Library (frontend), Jest + Supertest (API routes), Cypress or Playwright (E2E)
**Target Platform**: Web (Vercel deployment), Node.js serverless functions
**Project Type**: Full-stack web application (Next.js monolith with API routes)
**Performance Goals**:
- Frontend: LCP < 2.5s, FID < 100ms, CLS < 0.1, initial bundle < 200KB gzipped
- Backend: API p95 < 200ms (simple), < 500ms (complex)
- WebSocket: < 200ms message delivery
**Constraints**: Must use HeroUI v3 compound components; Tailwind v4 required; TypeScript strict mode; all code testable; no `any` types without justification
**Scale/Scope**: Support 100+ concurrent users per project; handle asset uploads up to 500MB; workflow execution with 3+ agent types

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Required Checks** (verify all apply):
- [x] TypeScript-First: All code will be TypeScript with strict mode; no `any` types without justification
- [x] Test-First: TDD approach planned; tests will be written before implementation
- [x] UX Consistency: HeroUI v3 + Tailwind v4 identified; i18n strategy defined; API response envelope format specified
- [x] Performance: Performance goals defined (frontend: LCP/FID/CLS targets; backend: p95 response times; bundle size limits); Tailwind v4 optimization utilized
- [x] Code Quality: ESLint + Prettier configured; HeroUI v3 compound component patterns enforced; complexity thresholds understood
- [x] Security: Input validation method chosen (Zod); auth strategy (JWT + NextAuth.js); database security (parameterized queries via Prisma)
- [x] Stack Compliance: Using Next.js full-stack with TypeScript, PostgreSQL (Supabase), Prisma ORM, HeroUI v3; no unauthorized dependencies

**Violations/Justifications** (if any check marked false):
| Principle | Why Not Needed | Alternative Approach |
|-----------|----------------|---------------------|
| None | All principles satisfied | N/A |

## Project Structure

### Documentation (this feature)

```text
specs/1-ai-content-studio/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output (to be generated)
├── data-model.md        # Phase 1 output (to be generated)
├── quickstart.md        # Phase 1 output (to be generated)
├── contracts/           # Phase 1 output (API schemas, WebSocket events)
└── checklists/
    └── requirements.md  # Specification quality checklist
```

### Source Code (repository root)

```text
# Next.js full-stack application
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

**Structure Decision**: Next.js monorepo-style structure with App Router. Frontend and backend coexist in same project. API routes under `app/api/`, WebSocket handler under `app/api/websocket/`. Components organized by domain. Database layer in `lib/db/` with Prisma.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | All checks passed; no violations | N/A |

## Phase 0: Research & Clarification

**Objective**: Resolve all technical unknowns before design.

### Research Tasks

1. **Research HeroUI v3 component patterns**
   - Task: Study HeroUI v3 compound component API, theming with Tailwind v4, and accessibility features. Fetch component docs for Card, Modal, Form, Table, and real-time status components.
   - Deliverable: `research.md` section with component usage patterns and examples.

2. **Research Next.js 14+ App Router API routes + WebSockets**
   - Task: Investigate how to combine REST API routes with WebSocket upgrade handling in Next.js App Router. Determine best practices for WebSocket server within Vercel serverless constraints (or use separate WS server).
   - Deliverable: `research.md` section with architecture recommendation (e.g., using `ws` library in API route, or separate Socket.io server on same domain).

3. **Research Supabase + Prisma integration**
   - Task: Explore Prisma schema design for Supabase PostgreSQL, connection pooling, and real-time subscriptions. Determine how to handle Prisma migrations in CI/CD on Vercel.
   - Deliverable: `research.md` section with Prisma schema patterns and deployment strategy.

4. **Research NextAuth.js with Google OAuth in Next.js App Router**
   - Task: Review NextAuth.js v5 (beta) or latest stable for App Router compatibility. Document JWT session management, refresh token strategy, and callback handling.
   - Deliverable: `research.md` section with auth flow and configuration.

5. **Research AI agent orchestration patterns**
   - Task: Investigate queueing systems (BullMQ, Upstash) for workflow execution, state machine patterns for step transitions, and error handling/retry strategies. Determine how to store and retrieve agent logs.
   - Deliverable: `research.md` section with orchestration architecture and library recommendations.

6. **Research asset upload & storage**
   - Task: Evaluate options for file uploads in Next.js (Vercel Blob, S3, Supabase Storage). Determine thumbnail generation strategy (serverless function, external service). Assess streaming upload for large files.
   - Deliverable: `research.md` section with storage and processing approach.

7. **Research real-time collaboration conflict resolution**
   - Task: Investigate CRDTs or operational transformation for concurrent workflow editing. Determine if simple last-write-wins is sufficient or if more advanced conflict resolution needed.
   - Deliverable: `research.md` section with collaboration strategy.

8. **Research performance optimization for Next.js + HeroUI**
   - Task: Study Tailwind v4 CSS delivery optimization, code splitting strategies, and HeroUI component tree-shaking. Identify potential performance bottlenecks.
   - Deliverable: `research.md` section with performance best practices.

**Output**: `research.md` with decisions, rationale, and alternatives for each research area.

## Phase 1: Design & Contracts

**Prerequisites**: `research.md` complete

### Data Model Design

Create `data-model.md` with:
- Prisma schema definitions (models, relations, indexes)
- Database migration strategy
- JSONB column usage for flexible data (workflow steps, agent parameters, metadata)
- Enums for agent types, statuses, roles
- Foreign key constraints and cascade rules

### API Contracts

Create `contracts/` directory:
- `contracts/api/` - OpenAPI/Swagger or Postman collection for REST endpoints
- `contracts/websocket/` - WebSocket event types (request/response schemas)
- `contracts/validation/` - Zod schemas for all request/response bodies
- `contracts/agents/` - Agent input/output schemas (Spec-Kit compatible)

### Quickstart Guide

Create `quickstart.md` with:
- Local development environment setup (Node, Supabase, Prisma)
- Database provisioning and migration steps
- Environment variable configuration
- Running the app in development mode
- Running tests
- Deploying to Vercel

### Agent Context Update

Run `.specify/scripts/bash/update-agent-context.sh copilot` to add new technology references (HeroUI v3, Tailwind v4, Supabase, Prisma) to the agent context.

## Phase 2: Implementation Planning

After completing Phase 1, generate tasks.md with detailed task breakdown using `/speckit.tasks 1-ai-content-studio`.

---

## Notes

- **HeroUI v3**: Use `@heroui/react@beta` and `@heroui/styles@beta`. Follow compound component patterns. No provider needed.
- **Tailwind v4**: Required for HeroUI v3. Configure PostCSS with `@tailwindcss/postcss`.
- **Supabase**: Use Supabase as PostgreSQL provider. Connection string in `DATABASE_URL` for Prisma.

## Technical Debt & Future Improvements

- **Middleware deprecation**: Next.js 16+ deprecates the `middleware` file convention in favor of `proxy`. The current implementation uses `middleware.ts` which works but shows a warning. Action: Plan migration to `proxy` convention in a future update. See: https://nextjs.org/docs/messages/middleware-to-proxy
- **WebSockets**: Investigate if Vercel serverless supports persistent WS; may need separate WS server or use Supabase Realtime.
- **Spec-Kit**: Workflow definitions stored as JSONB with explicit input/output schemas; ensure reproducibility.

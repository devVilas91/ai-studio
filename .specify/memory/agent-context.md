# CRM Nexus Development Guidelines

This runtime guidance summarizes `.specify/memory/constitution.md`. If details conflict, the
constitution takes precedence.

## Product and Architecture

- CRM Nexus is an AI-native, multi-tenant SaaS CRM for Lead → Contact → Deal lifecycle workflows.
- Use the latest stable Next.js release with the App Router and TypeScript. Prefer Server
  Components where beneficial; use Client Components only when interaction requires them.
- Use Tailwind CSS, HeroUI, and CopilotKit-compatible AI experiences.
- Use Supabase PostgreSQL, Supabase Auth, and Supabase Storage. Consider Supabase pgvector the
  default vector strategy when vector search is needed.
- Validate untrusted inputs and data at trust boundaries with Zod.
- Use Vercel for application deployment and Supabase for backend services.

## Non-Negotiable Design Boundaries

- Every business entity belongs to a tenant. Enforce authenticated tenant scope for data access,
  background work, search, and AI retrieval; never permit cross-tenant access.
- Keep business logic in transport-agnostic domain services, suitable for future MCP adapters.
- Business modules use the AI Provider abstraction rather than vendor SDKs directly. AI services
  must be mockable; AI-produced consequential changes require explicit user approval.
- Design mobile-first; keep core workflows usable on mobile and tablet, with keyboard-accessible
  and semantic interfaces.
- V1 user-facing interfaces support light and dark themes.
- Keep V1 feature scope within the constitution's stated non-goals.

## Specification and Quality

- Obtain an approved specification before implementation; plans and tasks must trace to it.
- Include automated tests for critical domain workflows and tenant isolation. Use Vitest for
  unit/integration testing, Playwright for browser workflows, and aimock to mock AI behavior.
- Check applicable tenant, AI approval, responsive, accessibility, and theme requirements when
  specifying, planning, implementing, and reviewing features.

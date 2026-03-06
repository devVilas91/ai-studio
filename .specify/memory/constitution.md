<!--
Sync Impact Report:
- Version change: N/A → 1.0.0 (Initial constitution for Next.js + PostgreSQL/Supabase + Prisma project)
- Modified principles: All 6 principles newly defined (TypeScript-First, Test-First, UX Consistency, Performance, Code Quality, Security)
- Added sections: Technology Stack Requirements, Development Workflow & Quality Gates
- Removed sections: None (template placeholders replaced)
- Templates updated: ✅ plan-template.md, ✅ spec-template.md, ✅ tasks-template.md
- Follow-up TODOs: None
-->
# Snapwork Constitution

## Core Principles

### I. TypeScript-First & Type Safety (NON-NEGOTIABLE)
All code MUST be written in TypeScript with strict mode enabled (`strict: true` in tsconfig.json). No `any` types allowed except in rare, justified cases documented with `// TODO(typing): reason`. All public APIs, function signatures, and data structures MUST have explicit, comprehensive type definitions. Type errors MUST be resolved before merge. This ensures compile-time safety, better IDE support, and self-documenting code across the MERN stack.

**Rationale**: TypeScript's static typing prevents runtime errors, improves developer experience, and enforces contracts between frontend/backend in a full-stack application.

### II. Test-First Development (NON-NEGOTIABLE)
All features MUST follow Test-Driven Development (TDD): Write failing tests → Get user/stakeholder approval → Implement minimal code to pass → Refactor. Tests MUST be written BEFORE implementation. Red-Green-Refactor cycle is strictly enforced. No code may be merged without corresponding tests covering the feature's core functionality and edge cases.

**Rationale**: TDD ensures requirements clarity, prevents regressions, and produces testable, modular code with high coverage.

### III. User Experience Consistency
All UI components and interactions MUST follow the **HeroUI v3** design system and patterns. The frontend (Next.js) MUST use HeroUI v3 compound components with standardized semantic variants (`primary`, `secondary`, `tertiary`) and accessibility (WCAG 2.1 AA) compliance. **When using HeroUI components or creating new UI components, developers MUST consult the heroui-react skill documentation first** to ensure correct v3 API usage (compound components, no provider, Tailwind v4). All user-facing text MUST be internationalized (i18n) from the start. API responses MUST have consistent envelope format: `{ success: boolean, data?: T, error?: { code: string, message: string } }`.

**Rationale**: Using a unified component library like HeroUI v3 ensures visual consistency, accessibility by default, and faster development through a robust set of pre-built, high-quality components. The heroui-react skill provides authoritative, up-to-date documentation to prevent v2/v3 API confusion and ensure best practices.

### IV. Performance by Design
Performance requirements MUST be defined in the specification phase and validated in testing:
- Frontend: Initial page load < 2s on 3G, Time-to-Interactive < 3s, Core Web Vitals (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- Backend: API response p95 < 200ms for simple queries, < 500ms for complex queries
- Database: Queries MUST use indexes; N+1 problems prohibited; Connection pooling required
- Bundle size: Frontend initial bundle < 200KB gzipped; Code splitting for routes; **Tailwind v4** for optimized CSS delivery

**Rationale**: Performance is a functional requirement, not an optimization. Early definition prevents technical debt and ensures scalability.

### V. Code Quality & Maintainability
All code MUST pass linting (ESLint + @typescript-eslint) with zero errors before merge. Complexity metrics (cyclomatic complexity > 10, function length > 50 lines) MUST be justified. No dead code or commented-out code allowed. All functions MUST have JSDoc comments for public APIs. UI development MUST follow HeroUI v3 **compound component patterns** (e.g., `<Card.Header>`) and use **Tailwind v4** for styling. Code reviews MUST verify: single responsibility, clear naming, minimal duplication, and proper error handling. Database schema changes MUST include migration scripts and backward compatibility considerations.

**Rationale**: Maintainable code reduces long-term costs, enables team scalability, and prevents bug accumulation.

### VI. Security Standards
All MERN stack components MUST follow security best practices:
- Backend: Input validation (Zod or Joi), authentication (JWT with refresh tokens, bcrypt for passwords), rate limiting, CORS configuration, Helmet.js headers
- Frontend: XSS protection (React's built-in escaping + DOMPurify for HTML), CSRF tokens for state-changing operations
- Database: Parameterized queries only (no SQL injection), principle of least privilege for DB users, secrets in environment variables (never in code)
- All dependencies: Regular security audits (`npm audit`), no known vulnerabilities allowed

**Rationale**: Security must be built-in, not bolted on. MERN stack has well-defined patterns that must be followed.

## Technology Stack Requirements

**Stack**: Next.js (full-stack) with TypeScript, PostgreSQL (Supabase), Prisma ORM, HeroUI v3
- **Frontend**: Next.js 14+, React 18+, TypeScript, App Router, HeroUI v3 (@beta), Tailwind CSS v4, state management (Zustand/Redux Toolkit)
- **Backend**: Next.js API Routes (within same project), TypeScript, NextAuth.js for authentication
- **Database**: PostgreSQL via Supabase, Prisma ORM for type-safe database access
- **Real-time**: WebSocket support via Next.js (ws) or Supabase Realtime subscriptions
- **Testing**: Jest + React Testing Library (frontend), Jest + Supertest (API routes), Cypress or Playwright (E2E)
- **Code Quality**: ESLint, Prettier, Husky + lint-staged for pre-commit hooks
- **CI/CD**: GitHub Actions or similar; must run tests, linting, type checking, and Prisma generate on all PRs
- **Deployment**: Vercel (recommended for Next.js), Supabase for database hosting

**Constraint**: No additional major frameworks/libraries without team consensus and documentation update. Always follow HeroUI v3 patterns (compound components, no provider).

## Development Workflow & Quality Gates

### Phase 0: Specification
- Feature MUST have spec.md with user stories, acceptance criteria, and success metrics
- Performance requirements explicitly defined
- Security implications documented

### Phase 1: Planning
- Implementation plan created with task breakdown
- Constitution Check performed: verify all applicable principles addressed
- Complexity violations documented with justification

### Phase 2: Implementation
- Tests written first and failing
- Code written with TDD cycle
- All commits must pass pre-commit hooks (lint, type-check, tests for changed files)

### Phase 3: Review & Merge
- PR MUST include: test results, performance benchmarks (if applicable), security review
- At least one reviewer MUST verify constitution compliance
- All CI checks passing: type-check, lint, unit tests, integration tests
- Performance regression tests passing (if feature affects performance)

### Phase 4: Deployment
- Database migrations tested on staging
- Feature flags used for risky changes
- Monitoring/alerting updated if needed

## Governance

This constitution is the supreme governing document for development practices. All team members MUST enforce these principles in code reviews and daily work.

**Amendment Process**:
1. Propose amendment via PR to `.specify/memory/constitution.md` with clear rationale
2. Discuss in team meeting; seek consensus
3. If approved, increment version (semantic versioning: MAJOR for breaking changes, MINOR for new principles, PATCH for clarifications)
4. Update ratification/last amended dates
5. Propagate changes to all template files (plan-template.md, spec-template.md, tasks-template.md) and any runtime guidance docs

**Versioning**: Semantic versioning (MAJOR.MINOR.PATCH). Current: 1.0.0

**Compliance Review**: Quarterly review to ensure principles remain relevant and enforced. Violations MUST be documented with remediation plan.

**Version**: 1.0.0 | **Ratified**: 2026-03-04 | **Last Amended**: 2026-03-04

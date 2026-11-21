<!--
Sync Impact Report:
- Version change: 1.0.0 → 2.0.0 (MAJOR: replaced the prior product-specific principles and
  stack mandates with CRM Nexus governance).
- Modified principles: TypeScript-First & Type Safety → IV. Type Safety; Test-First Development →
  XI. Testing (without a universal TDD mandate); UX Consistency → VIII. AI UI Compatibility,
  IX. Mobile Responsiveness, X. Accessibility, and XIII. Theme Compatibility; Security Standards
  → II. Multi-Tenant By Default, V. Provider-Agnostic AI, and VI. RAG-Ready Knowledge Architecture.
- Removed principles: Performance by Design (performance targets are feature-specific) and Code
  Quality & Maintainability (quality checks follow repository tooling and applicable plans).
- Added principles: I. AI-Native Product, III. Next.js Full-Stack Architecture, VII.
  Transport-Agnostic Domain Services, and XII. Specification-Driven Development.
- Added sections: V1 Scope and Non-Goals under Technology Stack Requirements.
- Removed sections: None.
- Templates and guidance requiring updates:
  ✅ .specify/templates/constitution-template.md
  ✅ .specify/templates/plan-template.md
  ✅ .specify/templates/spec-template.md
  ✅ .specify/templates/tasks-template.md
  ✅ .specify/memory/agent-context.md
  ✅ .github/agents/speckit.tasks.agent.md
  ✅ .github/agents/speckit.implement.agent.md
- Follow-up TODOs: None.
-->
# CRM Nexus Constitution

## Core Principles

### I. AI-Native Product
AI MUST be treated as a first-class product capability, and specifications for major workflows
MUST consider appropriate AI assistance. AI features MUST augment user productivity and MUST NOT
save, send, or execute consequential changes without explicit user approval.

**Rationale**: AI reduces effort while preserving user control and accountability.

### II. Multi-Tenant By Default
Every business entity MUST belong to a tenant. Every read, write, search, background job, and AI
retrieval involving tenant data MUST enforce the authenticated tenant boundary. Cross-tenant access
is prohibited; critical tenant-scoped workflows MUST include automated isolation tests.

**Rationale**: Tenant isolation is a foundational privacy and security property, not an optional
feature.

### III. Next.js Full-Stack Architecture
The application MUST use the latest stable Next.js release and prefer the App Router. Server
Components SHOULD be used when beneficial; Client Components MUST be limited to interactions that
require them. SSR, CSR, streaming, Server Actions, and caching MUST be selected to fit the
specified workflow and its data/security requirements.

**Rationale**: A coherent full-stack architecture supports server rendering and interactive
experiences without unnecessarily expanding client-side code.

### IV. Type Safety
Application code MUST use TypeScript. External input and persisted data crossing trust boundaries
MUST be runtime-validated with Zod. Shared domain types SHOULD be reused where appropriate, and
type checking MUST pass before changes are accepted.

**Rationale**: Static and runtime validation address different failure modes and make domain
contracts explicit.

### V. Provider-Agnostic AI
Business modules MUST NOT depend directly on LLM vendors. AI capabilities MUST use an AI Provider
abstraction; provider-specific behavior MUST remain behind that boundary. Initial provider
adapters may include OpenAI, Gemini, Ollama, and OpenRouter.

**Rationale**: An abstraction avoids coupling domain behavior to a single provider and allows
providers to be replaced or added.

### VI. RAG-Ready Knowledge Architecture
The architecture MUST support tenant-scoped Retrieval-Augmented Generation (RAG). Supabase
PostgreSQL with pgvector SHOULD be the default vector strategy when vector search is needed.
Knowledge ingestion and retrieval MUST remain extensible and preserve tenant isolation.

**Rationale**: Knowledge features can evolve without binding ingestion or retrieval to one
provider or compromising tenant boundaries.

### VII. Transport-Agnostic Domain Services
Domain services MUST be reusable independently of a transport layer. Business logic MUST NOT be
embedded in HTTP handlers or future MCP tool adapters; future MCP tools SHOULD be implementable by
calling existing domain services without rewriting business rules.

**Rationale**: Keeping business rules transport-agnostic enables future integrations while
maintaining one source of truth.

### VIII. AI UI Compatibility
AI experiences MUST be designed to remain compatible with CopilotKit. AI-generated workflow
capabilities SHOULD be composable into future agentic experiences without bypassing the explicit
user-approval requirement in Principle I.

**Rationale**: Composable AI interactions support incremental evolution toward agent-assisted
workflows while retaining user control.

### IX. Mobile Responsiveness
User-facing experiences MUST use mobile-first responsive design. Administrative dashboards and
core CRM workflows MUST remain usable on mobile and tablet viewports.

**Rationale**: CRM workflows must remain practical across the devices users rely on.

### X. Accessibility
User-facing interfaces MUST follow WCAG-oriented practices, support keyboard navigation, and use
semantic HTML wherever possible. Specifications MUST identify applicable accessibility
requirements for each user-facing feature.

**Rationale**: Accessible interfaces allow more users to complete essential work independently.

### XI. Testing
Business logic MUST be testable, and critical domain workflows MUST have automated tests. AI
services MUST be mockable so tests do not depend on live model providers. Vitest is the default
unit/integration test runner, Playwright is the default browser end-to-end runner, and aimock is
the preferred AI mocking tool.

**Rationale**: Focused automated tests protect critical behavior while keeping AI tests reliable
and repeatable.

### XII. Specification-Driven Development
Features MUST have an approved specification before implementation. Implementation plans MUST
trace design and technical decisions to the approved specification, and implementation tasks
MUST map back to that plan and the specification's requirements.

**Rationale**: Explicit traceability keeps delivery aligned with agreed user and business needs.

### XIII. Theme Compatibility
V1 user-facing experiences MUST support both light and dark themes. Theme definitions MUST use a
scalable approach that allows additional themes without redesigning individual features.

**Rationale**: Theme support is a product requirement and should not be retrofitted independently
into each feature.

## Technology Stack Requirements

CRM Nexus is an AI-native, multi-tenant SaaS CRM for the Lead → Contact → Deal lifecycle.
Specifications and plans MUST account for tenant ownership and isolation for applicable data and
workflows.

- **Application**: Latest stable Next.js, TypeScript, and the App Router.
- **UI**: Tailwind CSS, HeroUI, and CopilotKit-compatible AI experiences.
- **Data and identity**: Supabase PostgreSQL, Supabase Auth, and Supabase Storage; consider
  Supabase pgvector the default vector strategy when vector search is required.
- **Validation**: Zod for runtime validation at trust boundaries.
- **Testing**: Vitest, Playwright, and aimock as described in Principle XI.
- **Deployment**: Vercel for the application and Supabase for backend services.

These are the preferred V1 technologies. A feature plan proposing a deviation MUST explain its
need and impact in the Constitution Check; changes that alter a constitutional requirement need
an approved constitution amendment.

### V1 Scope and Non-Goals

The V1 product scope covers organization tenant CRM workflows and AI-powered productivity
capabilities supporting the Lead → Contact → Deal lifecycle. The following are explicitly out of
scope for V1 and MUST NOT be introduced as feature requirements without an approved scope and
constitution amendment:

- Payment gateway
- WhatsApp integration
- Voice calling
- Workflow automation engine
- Multi-region infrastructure
- Marketplace system
- Multi-language support

## Development Workflow & Quality Gates

### Specification
- Every feature MUST begin with an approved specification describing user value, scope,
  requirements, acceptance scenarios, and measurable outcomes.
- Specifications MUST identify applicable tenant boundaries, AI approval points, accessibility,
  theme behavior, and testing needs.
- V1 non-goals MUST remain out of feature scope unless governance is amended.

### Planning
- An implementation plan MUST trace its approach, data model, interfaces, and quality checks to
  the approved specification.
- The Constitution Check MUST address every applicable principle and document justified
  deviations before implementation.
- Plans involving AI MUST describe provider abstraction, user approval, and mocking strategy.
- Plans involving tenant data MUST explain how tenant context is enforced throughout data access
  and retrieval.

### Implementation and Verification
- Tasks MUST map to requirements and the approved plan.
- Critical domain workflows MUST have automated tests; tenant isolation MUST be tested for
  critical tenant-scoped workflows; AI provider dependencies MUST be mockable.
- User-facing changes MUST be checked for mobile/tablet usability, keyboard access, semantic
  structure, and light/dark theme behavior as applicable.
- Type checking and the repository's configured quality checks MUST pass before merge.

### Review and Release
- Reviewers MUST verify traceability to the approved specification and compliance with applicable
  principles.
- Changes affecting tenant isolation, AI approval, or data access MUST receive focused review of
  those boundaries.
- Deployment and migration decisions MUST be documented in the plan when applicable.

## Governance

This constitution governs product specifications, plans, implementation, and review for CRM
Nexus. If other project guidance conflicts with it, this constitution takes precedence until
formally amended.

**Amendment Process**:
1. Propose changes to `.specify/memory/constitution.md` with rationale and an impact assessment.
2. Review and approve the proposed change before relying on it in specifications or plans.
3. Update the semantic version and last-amended date.
4. Propagate changes to dependent templates and runtime guidance, then verify consistency.

**Versioning**: Semantic versioning (MAJOR.MINOR.PATCH). MAJOR denotes incompatible principle or
governance changes; MINOR denotes new principles or materially expanded requirements; PATCH
denotes clarifications and non-semantic refinements.

**Compliance Review**: Each specification and plan MUST include an applicable Constitution Check.
Reviewers MUST resolve any unaddressed MUST requirement before implementation or merge. The
constitution and its dependent guidance MUST be reviewed when product scope or architecture
changes materially.

**Version**: 2.0.0 | **Ratified**: 2026-03-04 | **Last Amended**: 2026-11-21

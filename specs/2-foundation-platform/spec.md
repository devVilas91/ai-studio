# CRM Nexus Foundation Platform Specification

- **Feature**: Foundation Platform
- **Created**: 2026-11-21
- **Status**: Draft
- **Prerequisite**: Approve the [Domain Model Specification](../1-domain-model/spec.md) before
  implementation.
- **Input**: Product owner requirements for the CRM Nexus platform foundation

## Purpose

Define the common platform capabilities required before CRM business modules are implemented.
This specification establishes tenant administration, identity and access, application
navigation, security boundaries, observability, and AI/RAG infrastructure readiness.

Once approved, this specification is the platform baseline for future CRM, AI, analytics, and
MCP-related specifications. It is subordinate to the CRM Nexus Constitution and the approved
canonical [Domain Model Specification](../1-domain-model/spec.md).

## Scope

### In Scope

- Tenant creation, profile/settings management, and lifecycle.
- Email/password authentication, password reset, and session behavior.
- Tenant-scoped user invitations, activation, deactivation, and profile management.
- Tenant-configurable roles and assignment of platform-defined permissions.
- Responsive application shell, tenant context, and permission-aware navigation.
- Security boundaries, critical audit events, sanitized error logging, and observability.
- Tenant-level AI provider registration and settings, usage tracking, and generation traceability.
- Tenant-owned knowledge source registration and preparation for document ingestion, embeddings,
  and vector retrieval.
- Transport-agnostic domain-service boundaries and feature-flag readiness.

### Out of Scope

- Lead, Contact, Deal, Activity, Note, and Attachment business workflows.
- Analytics dashboards and KPI reporting.
- User-facing AI business capabilities such as AI-assisted CRM changes or sales recommendations.
- An MCP server or MCP tool implementations.
- Payment gateway, WhatsApp, voice calling, workflow automation engine, marketplace,
  multi-region infrastructure, and multi-language support.
- API contract design, page-by-page UI design, and database schema or policy implementation.

## Domain Model Alignment

This specification uses the canonical entities and semantics in
`specs/1-domain-model/spec.md`; it does not redefine them:

### Key Entities

- **Platform and access**: Tenant, User, Role, Permission, UserRoleAssignment, AuditLog.
- **AI foundation**: AIProvider, AIPromptTemplate, AIGeneration, AIUsageRecord.
- **RAG readiness**: KnowledgeDocument, KnowledgeChunk, VectorEmbedding.

### Canonical Rules

Tenant lifecycle states are `provisioning`, `active`, `suspended`, and `closed`. User states are
`invited`, `active`, `suspended`, and `deactivated`. Roles are tenant-owned and configurable;
Permission is a platform-managed capability vocabulary. User identity may span tenants, but each
membership and role assignment is tenant-scoped. Any change to these rules requires an explicit
amendment to the canonical domain model.

## User Scenarios & Acceptance

### User Story 1 — Create and manage a tenant (Priority: P1)

An authenticated user creates an organization workspace and maintains its profile and lifecycle.

**Why this priority**: Tenant ownership is the security and organization boundary for every
subsequent platform capability.

**Independent Test**: Create a tenant, update permitted profile settings, suspend it, and verify
tenant access follows its lifecycle without deleting tenant data.

**Acceptance Scenarios**:

1. **Given** an authenticated user authorized to create a tenant, **When** they create an
   organization workspace, **Then** a Tenant is created in `provisioning`, initialized to
   `active` after required setup succeeds, and the creator receives the initial tenant
   administrator role.
2. **Given** an active tenant administrator, **When** they update the tenant profile,
   **Then** permitted settings are saved, validated, and audited.
3. **Given** a tenant administrator, **When** they suspend or close a tenant, **Then** ordinary
   members lose access to that tenant and its data is retained according to the domain model.

### User Story 2 — Authenticate and manage a session (Priority: P1)

A user securely signs in with email and password, signs out, recovers account access, and uses a
valid session.

**Why this priority**: Users must be authenticated before tenant membership and permissions can
be enforced.

**Independent Test**: Exercise registration or sign-in, invalid credentials, password reset,
session expiry, and logout without accessing CRM business workflows.

**Acceptance Scenarios**:

1. **Given** an active account, **When** the user supplies valid credentials, **Then** an
   authenticated session is established without selecting or trusting an unverified tenant ID.
2. **Given** invalid credentials or an unknown email, **When** the user attempts sign-in or
   requests a password reset, **Then** the response does not reveal whether the account exists.
3. **Given** a valid reset request, **When** the user completes the reset using a valid,
   unexpired recovery link, **Then** the password is changed and all existing sessions are
   invalidated so the user must authenticate again.
4. **Given** a signed-in user, **When** they log out, their session can no longer authorize
   access.

### User Story 3 — Invite and manage tenant members (Priority: P1)

A tenant administrator invites users and manages their tenant membership; users manage their
own global profiles.

**Why this priority**: Organizations need controlled access for their teams before CRM modules
become available.

**Independent Test**: Invite a new or existing platform identity to one tenant, accept the
invitation, deactivate the membership, and verify that another tenant's membership is unchanged.

**Acceptance Scenarios**:

1. **Given** a tenant administrator, **When** they invite an email address and assign an active
   role, **Then** a tenant-scoped invitation is created with an expiry and an audit record.
2. **Given** a valid invitation, **When** the invitee verifies their identity and accepts it,
   **Then** the User is active in that Tenant with only the assigned permissions.
3. **Given** an expired, revoked, or already-used invitation, **When** it is accepted,
   **Then** no active membership is created.
4. **Given** an administrator deactivates or removes a member, **When** the change takes effect,
   **Then** that Tenant's membership can no longer authorize access, while the User's memberships
   in other Tenants remain unchanged.
5. **Given** a platform-level administrator deactivates a global User identity, **When** the
   change takes effect, **Then** that identity can no longer authenticate or access any Tenant.

### User Story 4 — Configure roles and permissions (Priority: P1)

A tenant administrator creates and maintains roles by assigning capabilities from the shared
permission vocabulary.

**Why this priority**: Access control must scale beyond fixed role names and remain consistent
across future modules.

**Independent Test**: Create a tenant role, grant and remove permissions, assign it to a member,
and verify allowed and denied capabilities.

**Acceptance Scenarios**:

1. **Given** an authorized administrator, **When** they create or edit a role and assign
   available permissions, **Then** the role changes apply only within that Tenant and are
   audited.
2. **Given** a member with multiple active role assignments, **When** permissions are evaluated,
   **Then** only permissions granted by active roles in the selected Tenant are effective.
3. **Given** a retired role or deprecated permission, **When** an administrator attempts a new
   assignment, **Then** the assignment is rejected and existing grants are explicitly migrated
   or removed.

### User Story 5 — Navigate the platform in tenant context (Priority: P1)

A user navigates a responsive application shell and can identify the tenant context in which
they are working.

**Why this priority**: A shared shell gives all future modules a consistent, accessible entry
point without exposing data from another tenant.

**Independent Test**: Use the shell at phone, tablet, and desktop sizes; navigate available
platform sections by keyboard; switch among authorized tenants if the user has multiple active
memberships.

**Acceptance Scenarios**:

1. **Given** an authenticated user with tenant access, **When** they enter the application,
   **Then** the shell presents the active tenant context and only navigation they are authorized
   to access.
2. **Given** a user with multiple active tenant memberships, **When** they choose another tenant,
   **Then** membership is revalidated and the new tenant context is applied before data access.
3. **Given** a phone or tablet viewport, **When** the user navigates the shell, **Then** header,
   sidebar/mobile navigation, and breadcrumbs remain usable without obscuring the active tenant.
4. **Given** keyboard-only navigation, **When** the user traverses and activates shell controls,
   **Then** focus order, visible focus, labels, and semantic structure support completion without
   a pointer.

### User Story 6 — Review security and system activity (Priority: P1)

An authorized administrator or operator can investigate critical account, tenant, permission,
and system events without exposing secrets or unnecessary personal content.

**Why this priority**: Tenant isolation and access changes must be accountable and operationally
diagnosable.

**Independent Test**: Trigger representative tenant lifecycle, invitation, permission, and
authentication events, then verify attributable audit records and sanitized error events.

**Acceptance Scenarios**:

1. **Given** a critical tenant or access change, **When** it succeeds, **Then** an immutable
   audit event records tenant, actor, time, action, target, and a minimized change summary.
2. **Given** an operational error, **When** it is recorded, **Then** it includes diagnostic
   context and a correlation reference but excludes passwords, tokens, provider secrets, and
   unnecessary content.
3. **Given** a user who lacks permission to inspect audit records, **When** they attempt to view
   them, **Then** access is denied without revealing other tenants' events.

### User Story 7 — Configure AI platform readiness (Priority: P2)

A tenant administrator prepares a supported AI provider and its permitted settings for future
AI features, while generation activity remains traceable and user-controlled.

**Why this priority**: Future AI features need a provider-independent, tenant-scoped foundation
before they can be added safely.

**Independent Test**: Register and disable a mock provider configuration, record a mocked
future-generation trace, and verify usage and audit records without a live model call or CRM
action.

**Acceptance Scenarios**:

1. **Given** an authorized tenant administrator, **When** they register or disable a provider
   configuration, **Then** the change is tenant-scoped, secrets are not exposed, and the
   configuration state is auditable.
2. **Given** a mocked event representing a future AI capability, **When** its execution trace is
   recorded, **Then** tenant, requester, capability, provider identity, prompt-template version
   when used, outcome, and usage reference are traceable.
3. **Given** that no AI business feature is in this scope, **When** a provider is configured,
   **Then** configuration alone does not invoke a business generation or mutate a CRM record.

### User Story 8 — Register knowledge for future retrieval (Priority: P2)

A tenant administrator registers a knowledge source and can inspect its ownership and ingestion
readiness for future tenant-scoped retrieval.

**Why this priority**: RAG features must inherit provenance and tenant boundaries rather than
adding them after data has been indexed.

**Independent Test**: Register mock knowledge sources for two tenants, advance one through
document/chunk/embedding lifecycle states, and verify no cross-tenant retrieval eligibility.

**Acceptance Scenarios**:

1. **Given** a tenant-owned knowledge source, **When** it is registered or its content changes,
   **Then** its document revision and ingestion state are recorded under that Tenant.
2. **Given** a document that is pending, failed, archived, deleted, or stale, **When** future
   retrieval eligibility is evaluated, **Then** it is not eligible until current authorized
   content is successfully indexed.
3. **Given** a document or embedding from another Tenant, **When** a tenant-scoped retrieval is
   evaluated, **Then** that content is never returned or included in context.

### User Story 9 — Extend platform capabilities without business-logic rewrites (Priority: P2)

A future module or transport can reuse platform domain services without moving business rules
into a UI, HTTP handler, AI provider, or MCP adapter.

**Why this priority**: Stable domain boundaries keep future integrations consistent and
independently testable.

**Independent Test**: Verify that tenant, membership, and authorization behaviors can be invoked
through their domain service boundary and tested with mocked external identity and AI services.

**Acceptance Scenarios**:

1. **Given** an authorized platform operation, **When** it is invoked through a future transport,
   **Then** the same domain rules and tenant checks apply.
2. **Given** an MCP server is not part of V1, **When** platform services are designed,
   **Then** their business behavior remains reusable by a future MCP adapter without implementing
   that server now.

## Edge Cases

- A user belongs to multiple tenants but has no active membership in the currently selected
  tenant.
- A tenant is suspended or closed while one of its users has an active session.
- An invitation targets an existing User, an already-active member, or an address with a pending
  invitation.
- The last active tenant administrator is deactivated, removed, or has their administrative
  permissions removed.
- A user changes tenant while navigation, requests, caches, or AI context still refer to the
  previous tenant.
- A password reset is requested for an unknown account, an expired link, or a deactivated user.
- An audit record cannot be durably recorded during a critical state change.
- A configured AI provider is disabled, unavailable, or has invalid credentials.
- A prompt execution fails before provider selection, after provider invocation, or during usage
  recording.
- A knowledge source is replaced or deleted while chunks or embeddings from its older revision
  remain.
- A feature flag is disabled after a user session has already loaded a gated capability.
- A tenant has no CRM business modules enabled; the shell must still present a safe, usable
  foundation state.

## Functional Requirements

### Tenant Management

- **FR-001**: The platform MUST allow an authorized user to create a Tenant and establish its
  initial administrative membership.
- **FR-002**: A newly created Tenant MUST follow the canonical
  `provisioning → active` lifecycle; suspension and closure MUST follow the canonical Tenant
  states and MUST be auditable.
- **FR-003**: Authorized tenant administrators MUST be able to view and update the tenant profile
  attributes defined by the canonical domain model.
- **FR-004**: A suspended or closed Tenant MUST NOT authorize ordinary tenant-member access.
  Suspension and closure MUST NOT silently delete tenant data.
- **FR-005**: The tenant context MUST be derived from an authenticated User's active
  `UserRoleAssignment`; a tenant identifier supplied by a caller MUST NOT grant access by itself.

### Authentication and User Management

- **FR-006**: The platform MUST support email/password sign-up or account activation, sign-in,
  sign-out, password reset, and session validation.
- **FR-007**: Authentication and reset responses MUST NOT disclose whether an email address is
  registered.
- **FR-008**: A valid invitation MUST be tenant-scoped, assigned a role, time-limited, and
  single-use. Acceptance MUST verify the invitee identity and create or activate only the
  specified tenant membership.
- **FR-009**: Users MUST be able to manage their own global profile attributes. Tenant
  administrators MUST manage tenant membership and role assignment without changing the User's
  global identity profile.
- **FR-010**: Tenant membership activation, suspension, or revocation MUST affect only that
  Tenant. Platform-level User deactivation, tenant suspension, and logout MUST invalidate or
  deny subsequent authorization for every affected tenant/session.
- **FR-011**: A user who belongs to multiple tenants MUST retain independent membership and
  permission state in each tenant.

### Roles and Authorization

- **FR-012**: Tenant administrators MUST be able to create, edit, retire, and assign
  tenant-specific Roles using the platform Permission catalog.
- **FR-013**: Role and permission assignment MUST be data-driven; application authorization
  MUST NOT rely solely on hardcoded role names.
- **FR-014**: Effective permissions MUST be derived from active UserRoleAssignments and active
  Roles in the selected Tenant. A retired Role or deprecated Permission MUST NOT be newly
  assigned.
- **FR-015**: The system MUST prevent removal or deactivation of the final active role assignment
  capable of administering that Tenant, unless an authorized recovery procedure is used.
- **FR-016**: Every protected platform capability MUST be authorized on the server-side domain
  boundary. Navigation visibility is not an authorization control.

### Application Shell

- **FR-017**: The platform MUST provide a responsive shell with a header, primary navigation,
  breadcrumbs, and a mobile navigation mode.
- **FR-018**: The shell MUST identify the active Tenant and prepare for safe switching among a
  User's active tenant memberships.
- **FR-019**: Navigation MUST reflect the selected tenant and authorized capabilities; no
  out-of-scope CRM workflow or analytics dashboard is required by this specification.
- **FR-020**: The shell MUST support keyboard navigation, visible focus, accessible names,
  semantic structure, and responsive use on mobile, tablet, and desktop.

### Audit, Observability, and Feature Readiness

- **FR-021**: The platform MUST create immutable, tenant-scoped AuditLog entries for tenant
  lifecycle/profile changes, invitations and membership changes, role and permission changes,
  authentication security events where tenant context applies, AI settings and approval events,
  and knowledge source lifecycle changes.
- **FR-022**: Critical state changes MUST NOT be reported as successful without a durable audit
  outcome. Audit failures MUST be surfaced without silently dropping the event.
- **FR-023**: Operational error records MUST be structured sufficiently for diagnosis and
  correlation, while excluding secrets, credentials, session tokens, and unnecessary personal
  or generated content.
- **FR-024**: User activity tracking MUST capture security and critical administrative/business
  events, not keystrokes or unnecessary behavioral surveillance.
- **FR-025**: Platform capabilities MUST be feature-flag friendly. A feature flag MUST NOT
  replace authentication, authorization, tenant isolation, or an explicit approval requirement.

### AI and RAG Foundations

- **FR-026**: Business modules MUST use a provider-independent AI abstraction; provider-specific
  behavior MUST remain behind that boundary.
- **FR-027**: Authorized tenant administrators MUST be able to register, configure, enable, and
  disable tenant-scoped AIProvider settings. Secrets MUST be protected and MUST NOT appear in
  audit or error records.
- **FR-028**: AI settings MUST support provider capability/model selection without making
  business-domain behavior depend on a vendor identity.
- **FR-029**: AI invocations MUST be traceable through the canonical AIGeneration and
  AIUsageRecord concepts, including tenant, requester, outcome, and the prompt-template version
  when one is used. Tenant prompt templates MUST follow the canonical versioning rules. AI
  services MUST be mockable.
- **FR-030**: No user-facing AI business feature or automatic CRM mutation is required in this
  foundation scope. Any future consequential AI change MUST require explicit authorized human
  approval.
- **FR-031**: The platform MUST support tenant-owned KnowledgeDocument registration and record
  document, chunk, and embedding lifecycle/provenance needed for future RAG.
- **FR-032**: Knowledge registration and future vector retrieval MUST preserve Tenant ownership,
  source revision, and authorization. Supabase PostgreSQL with pgvector is the preferred vector
  strategy; provider and embedding-model choices MUST remain replaceable.
- **FR-033**: Knowledge content that is pending, failed, stale, archived, or deleted MUST NOT be
  eligible for retrieval.

### Domain Boundary and MCP Readiness

- **FR-034**: Tenant, identity, authorization, AI configuration, and knowledge rules MUST reside
  in reusable domain services rather than being defined only by a specific UI or transport.
- **FR-035**: A future REST API, AI tool, or MCP adapter MUST be able to call the same authorized
  domain behavior without rewriting business rules.
- **FR-036**: Implementing or deploying an MCP server is explicitly not required for V1.

## Non-Functional Requirements

- **NFR-001 — Tenant isolation**: 100% of protected tenant-scoped operations MUST reject
  cross-tenant access. Automated tests MUST cover unauthorized reads and writes across distinct
  tenants, including users who belong to both.
- **NFR-002 — Layered security**: Authentication, active membership, permission checks, and
  PostgreSQL Row Level Security MUST reinforce tenant boundaries. No layer may be treated as a
  substitute for the others.
- **NFR-003 — Type safety**: Platform application code MUST use TypeScript; untrusted inputs and
  persisted values crossing trust boundaries MUST be runtime-validated with Zod.
- **NFR-004 — Testability**: Critical identity, tenant lifecycle, role/permission, audit, and
  tenant-isolation behavior MUST be testable with Vitest and Playwright as appropriate. Identity
  and AI provider dependencies MUST be mockable; aimock is the preferred AI mock tool.
- **NFR-005 — Availability of critical audit**: Audit failures for critical changes MUST be
  explicit and observable; they MUST NOT become success-shaped silent fallbacks.
- **NFR-006 — Accessibility**: The shell MUST conform to WCAG 2.2 AA where applicable and
  support keyboard-only use and semantic structure.
- **NFR-007 — Responsive usability**: Core shell navigation MUST remain usable on mobile, tablet,
  and desktop without loss of tenant context.
- **NFR-008 — AI provider independence**: Replacing or adding an AI provider MUST NOT require
  changes to CRM business rules or tenant authorization semantics.
- **NFR-009 — Observability and privacy**: Errors and audit events MUST be attributable and
  diagnosable while minimizing personal data and never logging secrets or credentials.
- **NFR-010 — Evolution**: Roles, permissions, feature flags, AI providers, and RAG lifecycle
  states MUST be extensible without changing the meaning of existing domain records.
- **NFR-011 — Application architecture**: The application MUST use the latest stable Next.js
  release, App Router, and TypeScript. Server Components SHOULD be preferred where beneficial;
  Client Components MUST be limited to interactions that require them.
- **NFR-012 — Preferred platform stack**: Use HeroUI, Supabase PostgreSQL, Supabase Auth,
  PostgreSQL Row Level Security, CopilotKit-compatible AI experiences, and Supabase pgvector as
  the preferred vector strategy. This specification does not define schemas, policies, APIs, or
  page designs.
- **NFR-013 — Performance**: Feature-specific latency, capacity, and availability targets MUST
  be defined and validated in the implementation plan before implementation; this foundation
  specification does not invent universal numerical targets.

## Domain Boundaries

| Boundary | Owns | Explicitly does not own |
|---|---|---|
| Tenant Platform | Tenant profile and lifecycle | CRM records or billing |
| Identity and Access | User identity references, membership, Roles, Permissions, authorization decisions | Provider-specific identity internals or CRM business rules |
| Application Shell | Active tenant context, navigation structure, feature availability | CRM workflows, analytics dashboards, or authorization decisions |
| Audit and Observability | Critical audit history and sanitized operational events | Product analytics or unrestricted content logging |
| AI Platform | Tenant AIProvider settings, prompt execution traceability, usage records | AI sales workflows, autonomous CRM mutation, or vendor-specific business logic |
| Knowledge Foundation | Tenant-owned source/document/chunk/embedding lifecycle and retrieval eligibility | User-facing RAG answers, CRM knowledge workflows, or cross-tenant search |
| Domain Service Boundary | Reusable business rules callable by future transports | A V1 MCP server or transport-specific copies of business rules |

## Risks

| Risk | Impact | Mitigation required by this specification |
|---|---|---|
| Tenant context is selected from untrusted input or stale client state | Cross-tenant exposure | Derive access from authenticated membership, revalidate on switching, and enforce isolation in server and database boundaries |
| Role changes leave users with excessive or unusable access | Unauthorized activity or tenant lockout | Audit changes, calculate permissions from active assignments, and prevent removal of the final tenant administrator without recovery |
| Invitations are reused, misdirected, or accepted by the wrong identity | Unauthorized membership | Bind invitation to tenant, email/identity, expiry, and single-use acceptance |
| Audit data contains secrets or excessive personal content | Credential exposure or privacy harm | Minimize audit payloads, redact secrets, and define retention before implementation |
| Provider configuration exposes credentials or binds business rules to a vendor | Credential compromise and costly provider lock-in | Protect secret references, prohibit secret logging, and keep provider adapters behind the abstraction |
| Prompt or knowledge content crosses tenant boundaries | Data disclosure through AI/RAG | Preserve tenant and source provenance through each generation and indexing stage; test isolation |
| Feature flags are mistaken for security controls | Unauthorized access to gated operations | Keep authorization checks independent of flags |
| Platform foundation ships hidden CRM workflow assumptions | Rework and scope expansion | Keep CRM business modules and dashboards out of this scope; link future specs to the domain model |

## Assumptions

- The first authorized user who creates a Tenant receives its initial administrative role.
- Email verification is required before an invited or newly registered identity becomes active.
- One global User identity may be assigned to multiple tenants; each tenant membership is
  independently activated and authorized.
- Tenant administrators manage tenant memberships, not global User identity status or
  credentials; global identity deactivation is a platform-level operation that affects all
  memberships.
- Tenant administrators manage custom Roles using a platform-managed Permission vocabulary.
  “CMS-driven” means data-driven and maintainable role definitions; no separate CMS product is
  introduced by this specification.
- Tenant suspension blocks ordinary members but preserves tenant data and audit history.
- Provider credentials are never stored as ordinary domain attributes or copied into logs.
- Feature flags may gate availability, but they do not grant permissions or bypass tenant
  isolation.
- Supabase pgvector is the default vector strategy when vector search is implemented; indexing
  and retrieval implementation decisions belong in a later plan.

## Future Extension Points

- CRM modules attach their tenant-owned records to the active tenant and reuse platform identity,
  role, permission, audit, and shell boundaries.
- AI business capabilities use the provider abstraction, record trace and usage, and require
  explicit user approval before consequential changes.
- Analytics reads tenant-scoped, permission-appropriate data and does not become an authorization
  bypass.
- Future MCP tools call existing domain services and authorization rules; the server and its
  transport contracts require a separate specification.
- Future SSO, additional identity providers, more AI providers, richer permission vocabularies,
  additional feature flags, and expanded RAG ingestion sources can be added through separate
  specifications without redefining current tenant ownership.

## Success Criteria

- **SC-001**: Tenant creation, suspension, closure, and settings changes follow the canonical
  Tenant lifecycle and are auditable.
- **SC-002**: All automated tenant-isolation cases deny cross-tenant reads and writes, including
  tenant switching and two-tenant user scenarios.
- **SC-003**: Users can complete sign-in, logout, and password recovery without exposing account
  existence or retaining an invalid session.
- **SC-004**: Tenant administrators can invite members and configure roles without hardcoded
  role-name authorization; retired assignments cannot authorize access.
- **SC-005**: Shell navigation remains accessible and usable on phone, tablet, and desktop while
  consistently identifying the active tenant.
- **SC-006**: Critical tenant, identity, permission, AI configuration, and knowledge lifecycle
  events produce attributable audit records; logs contain no secrets.
- **SC-007**: AI provider and RAG operations are tenant-scoped, mockable, and traceable without
  implementing user-facing AI business features or an MCP server.
- **SC-008**: Future specifications and plans can extend the foundation without contradicting
  the canonical Domain Model Specification.

## Open Questions

- None. This specification uses the assumptions above; changing them requires an explicit
  specification or domain-model amendment.

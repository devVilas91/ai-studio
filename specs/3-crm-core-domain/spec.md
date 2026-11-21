# CRM Nexus CRM Core Domain Specification

- **Feature**: CRM Core Domain
- **Created**: 2026-11-21
- **Status**: Draft
- **Prerequisite**: Approve the [Domain Model Specification](../1-domain-model/spec.md) and
  [Foundation Platform Specification](../2-foundation-platform/spec.md) before implementation.
- **Input**: Product owner requirements for core sales management

## Purpose and Scope

Define the user-facing business capabilities and rules for managing Leads, Contacts, Deals,
Activities, and Notes. This specification describes what users can do and how CRM records
relate; it does not prescribe APIs, page designs, database schemas, or implementation structure.

V1 includes CRUD-style management, lifecycle progression, relationships, search/filter/sort,
auditing, tenant-safe behavior, and responsive accessible workflows. Saved views, AI summaries,
RAG indexing, and embeddings are future extension points, not V1 business features.

### In Scope

- Lead, Contact, Deal, Activity, and Note management and lifecycle rules.
- Same-tenant CRM relationships, ownership, audit history, search, filtering, and sorting.
- Mobile usability, accessibility, data quality, and user-facing performance expectations.

### Out of Scope

- API contracts, UI/page designs, database schemas, and technology implementation choices.
- Analytics dashboards, saved-view management, AI-generated business content, RAG retrieval,
  embedding generation, workflow automation, and third-party calling, email, or calendar
  integrations.

## Domain Model Alignment

This specification follows the current draft of the canonical
[Domain Model Specification](../1-domain-model/spec.md). That model was amended in response to
the CRM Core lifecycle and relationship requirements in this request and must be approved before
implementation. The relevant canonical rules are:

- Every CRM record belongs to exactly one Tenant; record relationships remain within that Tenant.
- Lead status follows `new` → `qualified` → `contacted` → `converted` → `closed`, with
  `disqualified` as a separate pre-conversion terminal outcome.
- Contact–Lead associations may exist independently of conversion. They are many-to-many;
  conversion remains at most one Contact per Lead.
- Activities use `scheduled`, `in_progress`, `completed`, and `cancelled`.
- Deals use `open`, `won`, and `lost` outcomes; a closed outcome is not an open pipeline stage.
- Archiving is a reversible soft-delete overlay, not a replacement for a record's business
  lifecycle.
- A Note may be a source for a same-tenant, revisioned KnowledgeDocument.

Any future change to these rules requires an explicit amendment to the canonical model before
dependent implementation.

## User Scenarios & Acceptance

### User Story 1 — Manage Leads through conversion (Priority: P1)

A sales user captures a prospective customer, qualifies and contacts the Lead, then converts it
to a Contact or disqualifies it.

**Why this priority**: Leads are the entry point to the sales lifecycle.

**Independent Test**: Create a Lead, edit it, progress it through the valid statuses, convert it
or disqualify it, and verify ownership, history, and archive/restore behavior.

**Acceptance Scenarios**:

1. **Given** a same-tenant user with Lead permissions, **When** they create a Lead with a
   person or company name and source, **Then** it starts as `new`, is assigned to that Tenant,
   and its creator and creation time are recorded.
2. **Given** a Lead in `new`, **When** an authorized user qualifies it, **Then** it moves to
   `qualified`; it cannot skip directly to `converted`.
3. **Given** a qualified Lead, **When** a completed linked Activity confirms contact was made,
   **Then** an authorized user may move it to `contacted`.
4. **Given** a contacted Lead, **When** the user explicitly creates or selects a same-tenant
   Contact for conversion, **Then** the Lead becomes `converted`, conversion history is retained,
   and the Lead is not deleted or silently merged.
5. **Given** a converted Lead, **When** post-conversion follow-up is complete, **Then** it may
   become `closed`; a pre-conversion Lead may instead become `disqualified` with a reason and
   cannot then be converted.
6. **Given** an archived Lead, **When** an authorized user restores it, **Then** it reappears
   with its pre-archive lifecycle status and relationship history intact.

### User Story 2 — Maintain Contacts and relationships (Priority: P1)

A sales user maintains a Contact's communication profile and its explicit Lead and Deal
relationships.

**Why this priority**: Contacts connect prospect history to sales opportunities and ongoing
customer communication.

**Independent Test**: Create and edit a Contact, associate it with Leads and Deals, inspect its
relationship history, and archive/restore it without crossing tenant boundaries.

**Acceptance Scenarios**:

1. **Given** an authorized user, **When** they create a Contact with a first name, **Then** it is
   active in the selected Tenant.
2. **Given** a Contact and a same-tenant Lead, **When** an authorized user creates an explicit
   association, **Then** the relationship is visible from both records and is distinct from
   Lead conversion.
3. **Given** an existing Contact, **When** it is associated with a Deal, **Then** that Contact
   appears in the Deal's contact set and one Contact is designated primary for the Deal.
4. **Given** a possible duplicate Contact, **When** the records are compared, **Then** the system
   may flag the match but MUST NOT automatically merge or discard either Contact.
5. **Given** an archived Contact, **When** it is restored, **Then** its prior active/inactive
   state and its auditable relationships are preserved.

### User Story 3 — Manage Deals and outcomes (Priority: P1)

A sales user creates a Deal, tracks its value and expected close date, moves it through the
pipeline, and records a Won or Lost outcome.

**Why this priority**: Deals represent active sales opportunities and their outcomes.

**Independent Test**: Create a Deal with a primary Contact, progress and regress its open stage,
then close it as won or lost and inspect the audit history.

**Acceptance Scenarios**:

1. **Given** an authorized user and a same-tenant Contact, **When** they create a Deal,
   **Then** it begins open, has exactly one primary Contact, and uses the Tenant's configured
   default open stage.
2. **Given** an open Deal, **When** an authorized user changes its stage, value, expected close
   date, owner, or Contact set, **Then** the change is saved and audited.
3. **Given** an open Deal, **When** it is marked `won`, **Then** an actual close time is recorded
   and its outcome is no longer treated as an open pipeline stage.
4. **Given** an open Deal, **When** it is marked `lost`, **Then** an actual close time and loss
   reason are recorded.
5. **Given** a won or lost Deal, **When** a user attempts to change its outcome, **Then** the
   change is denied unless the user performs an explicitly authorized, audited reopen action.
6. **Given** a Deal with a recorded amount, **When** its currency is missing, **Then** the value
   is rejected; **when** forecasted, **Then** only eligible open Deal values are included and
   values in different currencies are not combined without an explicit conversion basis.

### User Story 4 — Schedule and complete Activities (Priority: P1)

A sales user schedules a Task, Meeting, Call, or Follow-up against CRM records and tracks it to
completion or cancellation.

**Why this priority**: Activities make sales work and follow-up commitments visible over time.

**Independent Test**: Create, assign, start, complete, and cancel Activities against same-tenant
CRM records; verify due dates and timelines.

**Acceptance Scenarios**:

1. **Given** an authorized user, **When** they create an Activity with a title, supported type,
   schedule, and at least one same-tenant Lead, Contact, or Deal, **Then** it starts as
   `scheduled`.
2. **Given** a scheduled Activity, **When** its assignee begins work, **Then** it moves to
   `in_progress` with a start time.
3. **Given** an in-progress Activity, **When** it is completed, **Then** completion time and
   outcome details are recorded and the Activity appears in the relevant timeline.
4. **Given** a scheduled or in-progress Activity, **When** it is cancelled, **Then** its prior
   state and cancellation are retained in history.
5. **Given** an Activity associated with multiple CRM records, **When** a user views any related
   timeline, **Then** the same Activity is shown once in that timeline with its shared
   relationships intact.
6. **Given** an Activity is completed directly from `scheduled`, **When** occurrence details are
   absent, **Then** completion is rejected; **when** they are present, **Then** retrospective
   completion is recorded.

### User Story 5 — Record and preserve Notes (Priority: P1)

A sales user creates a Note on a CRM record and can review its author and edit history.

**Why this priority**: Notes preserve human-authored context that supports continuity across
sales work.

**Independent Test**: Create and edit a Note on a Lead, Contact, Deal, or Activity; verify
authorship, revision history, searchability, and soft deletion.

**Acceptance Scenarios**:

1. **Given** an authorized user and a same-tenant CRM record, **When** they save a non-empty
   Note, **Then** the Note is linked to exactly that parent and records its original author.
2. **Given** an existing Note, **When** its body is edited, **Then** the prior revision and
   authorship remain available in the edit history.
3. **Given** an authorized user soft-deletes a Note, **When** ordinary search or record views
   run, **Then** the Note is hidden but its history remains under retention policy.
4. **Given** a Note revision is changed or deleted, **When** future summaries or RAG artifacts
   exist, **Then** artifacts derived from the prior revision are marked stale and cannot be
   presented as current.

### User Story 6 — Find CRM records efficiently (Priority: P1)

A sales user searches across CRM entities or filters an entity list to find records they are
authorized to see.

**Why this priority**: Search and filtering are essential when tenants accumulate sales records.

**Independent Test**: Search and filter Leads, Contacts, Deals, Activities, and Notes with
different tenant memberships and permissions.

**Acceptance Scenarios**:

1. **Given** an authorized user, **When** they run global search, **Then** results identify the
   entity type and are limited to searchable records in the active Tenant.
2. **Given** an entity list, **When** the user combines supported filters and sorting,
   **Then** results match every selected filter and sort consistently.
3. **Given** archived, soft-deleted, or unauthorized records, **When** ordinary search runs,
   **Then** those records are excluded and their existence is not disclosed.
4. **Given** filters for source, status, owner, date, stage, or value, **When** they are applied
   to a matching entity, **Then** only compatible filters are offered and applied.

### User Story 7 — Work securely within a Tenant (Priority: P1)

A user performs CRM work in an active tenant context and critical changes remain attributable.

**Why this priority**: Tenant isolation and audit history are mandatory properties of every CRM
workflow.

**Independent Test**: Attempt cross-tenant reads, writes, associations, searches, and timeline
views; verify denial and audit of critical same-tenant changes.

**Acceptance Scenarios**:

1. **Given** records in two Tenants, **When** a user in one Tenant reads, edits, searches, or
   relates records, **Then** records from the other Tenant are never visible or attachable.
2. **Given** a critical change to owner, status, relationship, Deal value/stage/outcome, or
   deletion state, **When** it succeeds, **Then** tenant, actor, time, target, action, and a
   minimized change summary are auditable.
3. **Given** a search index, cache, export, or timeline, **When** tenant context changes,
   **Then** data from the previous Tenant is not reused or shown without reauthorization.
4. **Given** a required audit event cannot be recorded, **When** a critical change is attempted,
   **Then** the operation is not reported as successful and the failure is surfaced.
5. **Given** a privacy or retention request, **When** personal content is erased, **Then** only
   the minimum policy-required audit accountability remains.

### Acceptance Coverage

| Requirement group | Acceptance coverage |
|---|---|
| FR-001–008: Leads | User Story 1, scenarios 1–6 |
| FR-009–014: Contacts | User Story 2, scenarios 1–5 |
| FR-015–021: Deals | User Story 3, scenarios 1–6 |
| FR-022–027: Activities | User Story 4, scenarios 1–6; User Story 1, scenario 3 |
| FR-028–032: Notes | User Story 5, scenarios 1–4 |
| FR-033–037: Search | User Story 6, scenarios 1–4 |
| FR-038–044: Audit and tenant safety | User Story 7, scenarios 1–5 |
| NFR-001–010: Quality and operational outcomes | Non-Functional Requirements and Success Criteria |

## Edge Cases

- A Lead is disqualified before being contacted, or an attempted status transition skips a
  required stage.
- A contacted Lead lacks a completed Activity confirming contact.
- A Lead has one or more general Contact associations before conversion and the user selects a
  different conversion Contact.
- A Contact is associated with several Leads or appears to be a duplicate of another Contact.
- A Contact is archived while associated with open Deals or Activities.
- A Deal has no amount, has a zero amount, or uses a currency different from another Deal in a
  forecast.
- A Deal's expected close date passes while it remains open.
- A user attempts to close a Deal without an actual close time or a lost reason.
- An Activity due date precedes its scheduled start, or it is completed retrospectively.
- An Activity is linked to more than one CRM record or one of its parent records is archived.
- A Note is edited or deleted after a summary or RAG artifact has been derived from it.
- Search terms match records in another Tenant, archived records, or records hidden by role
  permissions.
- A soft-delete restore conflicts with a later duplicate resolution or a changed relationship.
- A retention request requires erasure of a Contact or Note while audit history must remain
  attributable without retaining unnecessary personal content.

## Requirements

### Functional Requirements

#### Lead Management

- **FR-001**: Authorized users MUST be able to create and edit tenant-owned Leads.
- **FR-002**: A Lead MUST include a source and at least one of a person name or company name;
  contact details, owner, qualification details, and source details may be optional.
- **FR-003**: A new Lead MUST start in `new` and follow `new` → `qualified` → `contacted` →
  `converted` → `closed`; it MUST NOT skip a state.
- **FR-004**: A Lead MUST be eligible for `contacted` only after a linked completed Activity
  confirms contact. It MUST convert only from `contacted`.
- **FR-005**: An authorized user MUST be able to disqualify a pre-conversion Lead with a reason.
  Disqualification is terminal; a disqualified Lead MUST NOT be converted.
- **FR-006**: Conversion MUST preserve the Lead, record the conversion time and selected Contact,
  and require explicit user selection when reusing an existing Contact.
- **FR-007**: Users MUST be able to view Lead details, assign or reassign a same-tenant owner,
  track source and status, and inspect conversion and ownership history.
- **FR-008**: Leads MUST support archive and restore through reversible soft deletion; restore
  MUST retain the pre-archive Lead status and relationships.

#### Contact Management

- **FR-009**: Authorized users MUST be able to create, edit, view, archive, and restore
  tenant-owned Contacts.
- **FR-010**: A Contact MUST include a first name; communication details, job title, company
  name, contact preferences, and owner may be optional.
- **FR-011**: Users MUST be able to associate Contacts with Leads independently of conversion
  and associate Contacts with multiple Deals. All associations MUST be same-tenant.
- **FR-012**: Each Deal MUST have exactly one primary Contact; association changes MUST be
  visible in relationship history.
- **FR-013**: Contact matching MAY flag possible duplicates using normalized contact details;
  V1 MUST NOT automatically merge, delete, or redirect Contacts.
- **FR-014**: Authorized users MUST be able to change a Contact between `active` and `inactive`.
  Contact archive/restore MUST use the reversible soft-delete overlay and preserve the prior
  lifecycle state.

#### Deal Management

- **FR-015**: Authorized users MUST be able to create, view, edit, assign, and track
  tenant-owned Deals.
- **FR-016**: A Deal MUST have a name, `open`/`won`/`lost` outcome, open pipeline stage, and
  exactly one primary same-tenant Contact. Amount and currency MUST be supplied together when
  amount is set.
- **FR-017**: The default open pipeline MUST use `Discovery`, `Qualification`, `Proposal`, and
  `Negotiation` in that order. `Closed Won` and `Closed Lost` MUST represent terminal outcomes,
  not open stages.
- **FR-018**: An authorized user MUST be able to move an open Deal between configured open
  stages. Stage changes are manual and auditable; moving backward requires a reason. Closing
  requires an actual close time; a lost outcome also requires a loss reason.
- **FR-019**: Users MUST be able to track amount, currency, expected close date, owner, stage,
  probability, and actual outcome where those values are provided.
- **FR-020**: Forecast calculations MUST include only open Deals with eligible values and dates.
  Weighted forecasts use amount multiplied by probability; amounts in different currencies MUST
  NOT be totaled without an explicit conversion basis.
- **FR-021**: Reopening a won or lost Deal MUST require an explicit authorized action and audit
  record; it MUST NOT silently erase its previous outcome.

#### Activity Management

- **FR-022**: Authorized users MUST be able to create, assign, view, and update Activities linked
  to at least one same-tenant Lead, Contact, or Deal.
- **FR-023**: V1 Activity types MUST include Task, Meeting, Call, and Follow-up.
- **FR-024**: An Activity MUST follow `scheduled` → `in_progress` → `completed`; a scheduled or
  in-progress Activity may instead become `cancelled`. A scheduled Activity has a scheduled
  start; an in-progress Activity has a start time; a completed Activity has an occurrence or
  completion time. Retrospective completion directly from `scheduled` requires occurrence
  details.
- **FR-025**: Tasks and Follow-ups MUST support due dates. Scheduled end MUST NOT precede
  scheduled start. An Activity may be cancelled before completion with its prior state retained.
- **FR-026**: Activities MUST appear in chronological timelines for their related CRM records.
  An Activity related to several records MUST remain one Activity with one shared history.
- **FR-027**: Authorized users MUST be able to complete Activities with an outcome and completion
  time. A completed Activity provides evidence to move a Lead to `contacted` only when its
  saved outcome explicitly confirms that contact was made.

#### Notes Management

- **FR-028**: Authorized users MUST be able to create Notes attached to exactly one same-tenant
  Lead, Contact, Deal, or Activity.
- **FR-029**: Each Note MUST retain its original author and creation time. Edits MUST create a
  reviewable revision history and MUST NOT replace authorship.
- **FR-030**: Notes MUST support reversible soft deletion and restoration under tenant
  permissions; deleted Notes are excluded from ordinary search and views.
- **FR-031**: A Note MUST be searchable within its tenant and permissions. Search MUST NOT expose
  Note content to users without access to its parent.
- **FR-032**: V1 MUST NOT generate AI summaries, embeddings, or RAG responses from Notes.
  Future-derived artifacts MUST reference the source Note revision and become stale when that
  revision changes or is deleted.

#### Search, Filtering, and Sorting

- **FR-033**: Global search MUST search Leads, Contacts, Deals, Activities, and Notes available
  to the current user in the active Tenant. Matching MUST be case-insensitive and ignore leading
  and trailing query whitespace; it MUST match relevant names, titles, communication details,
  Lead sources, and Note content. An empty query MUST return no search results.
- **FR-034**: Each entity MUST support entity-specific search, applicable filters, and sorting.
  Lead filters include source, status, owner, and dates; Contact filters include lifecycle,
  owner, and communication fields; Deal filters include stage, outcome, owner, value, currency,
  and expected close date; Activity filters include type, status, assignee, due date, and
  related subject; Note filters include author, parent, and dates.
- **FR-035**: Search results MUST identify the entity type, respect permissions, and exclude
  archived, soft-deleted, quarantined, or otherwise unavailable records by default.
- **FR-036**: Sorting MUST be stable for equal values and support relevant date, name, owner,
  status, stage, value, and due-date fields.
- **FR-037**: Saved views are a future extension. V1 MUST NOT require users to create or share
  saved views, but filter and sort criteria MUST remain composable for future reuse.

#### Auditing and Tenant Safety

- **FR-038**: The platform MUST audit Lead and Contact creation, field changes, ownership,
  status, association, conversion, archive, and restore actions.
- **FR-039**: The platform MUST audit Deal creation, ownership, Contact association, value,
  stage, forecast-relevant fields, close, loss reason, reopen, archive, and restore actions.
- **FR-040**: The platform MUST audit Activity creation, assignment, scheduling, start,
  completion, cancellation, subject changes, and deletion state.
- **FR-041**: The platform MUST audit Note creation, edits, revision authorship, visibility,
  deletion, and restoration without copying the full Note body into unrelated audit entries.
- **FR-042**: Every read, write, relationship, search, filter, sort, timeline, and export MUST
  remain scoped to the authenticated Tenant and the user's active permissions.
- **FR-043**: A failed critical audit operation MUST be surfaced; a critical CRM change MUST
  NOT be reported as successful if its required audit event was silently lost.
- **FR-044**: Soft-deleted records MUST be hidden from ordinary operations immediately.
  Retention and eventual purge MUST follow the tenant data policy and applicable privacy
  requirements.

## Key Entities and Business Rules

All entities inherit the common tenant ownership, actor, timestamp, revision, soft-delete, and
audit conventions from the canonical Domain Model Specification. The following attributes
specialize those contracts for CRM Core; they are business concepts, not storage schemas.

### Lead

- **Required**: Tenant, source, status, creator, and at least one of person name or company name.
- **Optional**: Owner, email, phone, title, source detail, qualification detail, conversion
  Contact/time, close time, and disqualification reason.
- **Rules**: Start as `new`; progress through the canonical path or disqualify before conversion.
  Conversion is explicit and happens once. `closed` means post-conversion follow-up is complete.
  Archive is a soft-delete overlay; restore preserves the last business status.

### Contact

- **Required**: Tenant, first name, status, creator.
- **Optional**: Last name, display name, email, phone, job title, company name, owner, and
  communication preferences.
- **Rules**: Contact association to a Lead is distinct from conversion. Multiple Lead and Deal
  associations are allowed within a Tenant. A Deal always has one primary Contact.

### Deal

- **Required**: Tenant, name, open/won/lost outcome, stage while open, primary Contact, creator.
- **Optional**: Owner, description, amount/currency pair, expected close date, probability,
  actual close time, win details, loss reason, and source.
- **Rules**: Amount is non-negative; amount and currency are present together. Probability is
  between 0 and 100 inclusive. Won/lost outcomes have actual close time; lost requires a reason.
  Open Deals alone contribute to forecasts.

### Activity

- **Required**: Tenant, title, type, status, creator, and one or more same-tenant Lead, Contact,
  or Deal subjects.
- **Optional**: Assignee, description, scheduled start/end, due date, actual start, occurrence
  time, outcome, and completion details.
- **Rules**: V1 types are Task, Meeting, Call, Follow-up. Scheduled and in-progress dates are
  consistent; completed records have completion evidence. One Activity may appear in multiple
  related timelines without becoming multiple records.

### Note

- **Required**: Tenant, non-empty body, author, creation time, and exactly one same-tenant parent
  (Lead, Contact, Deal, or Activity).
- **Optional**: Title, tenant-internal visibility scope, revision editor, and edit time.
- **Rules**: Original author is immutable. Edits create history. Deletion is reversible soft
  deletion. Future summaries and RAG artifacts refer to a specific Note revision and never
  overwrite the human-authored content.

## Search, Filtering, and Sorting

- **Global search** is a tenant- and permission-scoped entry point across the five CRM entities.
  Each result shows enough entity and parent context to identify it without disclosing hidden
  fields.
- **Entity search** supports the filters in FR-034, including combinations. Filters that do not
  apply to an entity are rejected rather than silently ignored.
- **Default result scope** excludes archived and soft-deleted records. An authorized user may
  explicitly include archived records to restore them; inaccessible records remain undisclosed.
- **Sort order** is explicit and stable; when selected values tie, a deterministic secondary
  ordering is used.
- **Saved views** are not a V1 user capability. Future saved views may persist validated filter,
  sort, entity, and tenant context without granting additional permissions.
- Indexes, caches, exports, and search summaries preserve source-entity permissions, tenant
  ownership, and deletion behavior.

## Auditing, Ownership, and Tenant Isolation

Audit history records tenant, actor, time, entity, action, and minimized before/after details for
critical changes. At minimum, it covers:

- Creation, status/lifecycle, archive/restore, and owner changes for every CRM entity.
- Lead qualification, contact evidence, conversion Contact, disqualification, and closure.
- Contact–Lead, Contact–Deal, and Activity–CRM subject association changes.
- Deal stage, amount, currency, expected close date, probability, won/lost outcome, and reopen.
- Activity assignment, due/schedule/start/completion/cancellation, and outcome.
- Note author, each edit revision, visibility, deletion, and restoration.

Each business record belongs to one Tenant. Related records, owners, assignees, Notes, search
results, timelines, filters, and exports MUST belong to that same Tenant and satisfy the active
User's permissions. A Tenant identifier or record identifier supplied by a caller does not by
itself authorize access. No cross-tenant data may be inferred from result counts or search
suggestions.

## Non-Functional Requirements

- **NFR-001 — Tenant isolation**: 100% of cross-tenant read, write, search, relationship,
  timeline, and export attempts MUST be denied. Automated tests MUST include Users who belong to
  more than one Tenant.
- **NFR-002 — Performance baseline**: At the V1 planning baseline of up to 100,000 active
  records per CRM entity and 50 concurrent users per Tenant, 95% of standard entity list/search
  operations MUST complete within 2 seconds and 95% of record detail reads or edits within
  1.5 seconds.
- **NFR-003 — Scale**: The domain MUST support tenant growth to the baseline volume without
  changing record ownership, lifecycle, or relationship semantics.
- **NFR-004 — Mobile usability**: Lead, Contact, Deal, Activity, Note, and search workflows
  MUST remain usable from a 320 CSS-pixel-wide phone viewport through tablet and desktop sizes.
- **NFR-005 — Accessibility**: User-facing workflows MUST conform to WCAG 2.2 AA where
  applicable, including keyboard-only navigation, visible focus, semantic structure, and
  accessible validation feedback.
- **NFR-006 — Data quality**: Name, email, phone, amount/currency, status, and relationship
  values MUST be validated consistently. Duplicate suggestions MUST NOT silently merge records.
- **NFR-007 — Soft deletion and retention**: Archive and restore MUST preserve the last
  business state and audit trail. Physical purge is limited to approved privacy or retention
  policies; unnecessary personal content MUST NOT be retained in audit history.
- **NFR-008 — Testability**: Critical Lead conversion, Deal close, Activity lifecycle, Note
  revision, and tenant-isolation workflows MUST be covered by automated tests; business rules
  MUST be testable independently of transport and UI.
- **NFR-009 — Auditability**: Every critical business change listed in this specification MUST
  be attributable and queryable within the authorized Tenant.
- **NFR-010 — Search consistency**: Search and timelines MUST honor current authorization,
  tenant scope, soft deletion, and source revisions; stale results MUST NOT reveal deleted or
  unauthorized content.

## Domain Boundaries

| Boundary | Owns | Does not own |
|---|---|---|
| Lead Management | Prospect data, qualification, contact evidence, conversion, disqualification, closure | Tenant identity, authentication, or silent Contact merging |
| Contact Management | Communication profile and explicit Lead/Deal relationships | Global user identity or automatic deduplication |
| Deal Management | Opportunity value, stage, owner, forecast inputs, and won/lost outcomes | Payment processing, contract execution, or workflow automation |
| Activity Management | Scheduled and completed sales interactions/tasks and CRM timelines | Email delivery, calling infrastructure, or calendar provider integration |
| Notes Management | Human-authored CRM context and revision history | AI-generated summaries or RAG answer generation in V1 |
| Search | Authorized tenant-scoped discovery and result ordering | Permission grants, saved-view management, or cross-tenant aggregation |

## Architecture & Quality Requirements

- **Tenant isolation**: Every record, relationship, search result, timeline, and forecast remains
  within the active Tenant and its permissions.
- **AI behavior**: V1 CRM workflows do not generate or apply AI-authored business changes.
  Future consequential AI proposals require explicit approval by an authorized User.
- **Validation**: Inputs and state transitions are checked against the required fields, lifecycle,
  relationship, and value constraints in this specification; invalid transitions are clearly
  rejected rather than silently coerced.
- **Transport independence**: Business rules remain reusable across future user-facing, REST, AI,
  and MCP entry points without changing their meaning.
- **Testing**: Lead conversion, Deal outcomes, Activity transitions, Note revisions, search
  permissions, and tenant-isolation cases are independently testable. Future AI behavior is
  mockable and does not change CRM data without approval.

## Security Requirements

- **Authentication and authorization**: Users must be authenticated and hold the necessary active
  tenant permissions before CRM operations; identity and role lifecycle follow the Foundation
  Platform Specification.
- **Tenant isolation**: No read, write, search, relationship, timeline, or export may disclose
  another Tenant's CRM data.
- **Input validation**: Names, communication details, dates, status transitions, amounts,
  currencies, probabilities, and relationship references are validated before acceptance.
- **Data protection**: Audit events contain minimized change details and do not duplicate Note
  bodies or unnecessary personal content. Retention and erasure follow applicable policy.

## UX Requirements

- **Responsive workflows**: Core CRM tasks remain usable on phone, tablet, and desktop sizes
  without requiring horizontal scrolling for ordinary record actions.
- **Accessibility**: Keyboard navigation, visible focus, semantic content, and understandable
  validation feedback conform to WCAG 2.2 AA where applicable.
- **Themes**: Every user-facing CRM workflow remains usable in both light and dark themes.
- **Interaction feedback**: Invalid transitions, denied actions, and failed saves are clearly
  communicated; the interface MUST NOT present an unsuccessful operation as complete.

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Lead status progression is skipped or ambiguously interpreted | Conversion history becomes unreliable | Enforce the canonical transition sequence and require linked contact evidence |
| Contact duplicates are merged automatically | Lost relationship history and attribution | Flag candidates only; require explicit future merge design and audit |
| Deal stages are confused with Won/Lost outcomes | Forecast and pipeline counts are inaccurate | Keep open stages separate from terminal outcome status |
| Tenant context is omitted in search, timelines, or exports | Cross-tenant disclosure | Apply the same tenant and permission checks to every access path and test negative cases |
| Archived records remain in search or derived content | Deleted data remains visible | Exclude archive overlay immediately and invalidate dependent summaries/indexes |
| Note content enters future AI/RAG without revision tracking | Stale or unauthorized content is returned | Bind derived artifacts to same-tenant Note revisions and invalidate on edit/delete |
| Forecasts combine currencies or unsupported values | Misleading sales forecasts | Require currency with value and prohibit totals without an explicit conversion basis |

## Assumptions

- The canonical Domain Model Specification is approved before implementation; this spec's
  lifecycle and association rules are not independent alternatives.
- `Closed` means that post-conversion Lead follow-up is complete. `Disqualified` remains a
  separate terminal outcome before conversion.
- Lead and Contact archive/restore is reversible soft deletion that preserves business status.
- Lead–Contact general associations are many-to-many; conversion is a separate at-most-one
  Contact per Lead. A Contact may be the conversion target for multiple Leads only after
  explicit identity resolution.
- The default Deal open-stage order is Discovery, Qualification, Proposal, Negotiation.
  Closed Won/Lost are outcomes. Stage changes are manual in V1.
- Follow-up is a distinct supported Activity type. V1 does not integrate with calling, email,
  or calendar providers.
- Duplicate Contact detection is allowed, but Contact merging is not a V1 workflow.
- V1 baseline capacity is 100,000 active records per core entity and 50 concurrent users per
  Tenant; implementation plans may revise these assumptions with evidence.
- Saved views, Note summarization, embeddings, and RAG ingestion are future extension points;
  only Note search and revision provenance are required in V1.
- Retention durations are governed by applicable policy and are finalized before production
  data is collected.

## Future Extension Points

- User-confirmed Contact merge with preservation of all source identities, relationships,
  authorship, and audit history.
- Tenant-configurable Deal pipelines, stage-specific required information, and richer
  forecasting.
- Saved views shared according to tenant permissions.
- AI-generated Note summaries stored as separate, attributed AIGeneration outputs and requiring
  explicit user approval before being promoted into CRM content.
- Note-to-KnowledgeDocument ingestion, chunking, embeddings, and tenant-scoped semantic search
  with revision invalidation.
- Additional CRM entities and integrations as separate specifications, without weakening
  tenant isolation or changing the canonical sales lifecycle implicitly.
- Analytics dashboards and aggregate reporting as a separate feature specification.

## Success Criteria

- **SC-001**: 100% of validated Lead and Contact create, edit, search, filter, assign,
  archive, and restore acceptance scenarios preserve tenant ownership and history.
- **SC-002**: 100% of Lead conversions follow the required lifecycle and retain the explicit
  conversion Contact and provenance.
- **SC-003**: 100% of Deals have exactly one primary Contact; every won/lost outcome retains the
  required close details and audit history.
- **SC-004**: 100% of tested Activities follow the defined lifecycle and appear consistently in
  every related entity timeline without duplicate records.
- **SC-005**: 100% of tested Note edits preserve authorship and revision history; soft-deleted
  Notes are hidden from normal access and search.
- **SC-006**: 100% of cross-tenant CRM reads, writes, associations, searches, and exports are
  denied in automated isolation tests.
- **SC-007**: At the V1 baseline volume, 95% of entity list/search operations complete within
  2 seconds and 95% of detail reads/edits within 1.5 seconds.
- **SC-008**: 100% of core workflows pass mobile usability and applicable WCAG 2.2 AA acceptance
  checks, including keyboard-only operation.

## Open Questions

- None. The lifecycle and relationship choices above reflect the product owner's clarification;
  any later changes require an explicit domain-model amendment.

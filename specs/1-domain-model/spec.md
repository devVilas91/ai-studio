# CRM Nexus Domain Model Specification

**Created**: 2026-11-21
**Last Amended**: 2026-11-21
**Status**: Draft — canonical upon approval
**Input**: Product domain model requirements supplied by the product owner

## Purpose and Authority

This document defines the canonical CRM Nexus business domain: its entities, ownership, lifecycle,
relationships, and invariants. Once approved, it is the single source of truth for future feature
specifications. Plans and specifications MUST follow this model; a proposed domain change requires
an explicit amendment to this document before dependent work proceeds.

The names and attributes below describe business concepts, not database columns or API contracts.
They do not prescribe how entities are stored, exposed, or presented.

## Scope

This model covers platform tenancy and access, the Lead → Contact → Deal sales lifecycle,
activities and supporting records, AI configuration and generation, analytics snapshots and
dashboards, and future tenant-scoped RAG knowledge.

API design, UI design, database schema implementation, framework and provider implementation,
deployment, and infrastructure are out of scope. Payment gateways, WhatsApp integration, voice
calling, workflow automation engines, multi-region infrastructure, marketplaces, and
multi-language support are also out of scope for V1.

## Domain Conventions

### Ownership and identity

- **Tenant** is the ownership boundary for all customer business data and configuration.
- Every tenant-owned entity MUST belong to exactly one tenant for its entire lifetime. Its tenant
  ownership MUST NOT be changed by an ordinary edit or transfer operation.
- A **User** is a platform identity and may be a member of multiple tenants. A user's tenant
  membership and permissions come only from tenant-scoped `UserRoleAssignment` records.
  A user identity is not itself a tenant-owned CRM record.
- `Permission` is a platform-managed vocabulary of capabilities, not tenant business data.
  Tenant-configured `Role` records refer to this shared vocabulary.
- A reference between tenant-owned entities is valid only when both entities belong to the same
  tenant. No relationship, query, search result, aggregate, or AI context may cross tenant
  boundaries.

### Shared record attributes and deletion

Unless an entity is explicitly identified as platform-level or immutable, every tenant-owned
record has:

- A stable identity.
- Exactly one tenant owner.
- Creation and last-update timestamps.
- The creating and last-updating actor when those actions are attributable to a user or process.
- A monotonically increasing logical revision when mutable, for conflict detection and history.

Deletion is normally a soft-delete state, recorded with the deletion time and actor. Deleted
records are excluded from normal business operations, search, analytics, and AI retrieval.
Restoration, when allowed, is an explicit audited action. A legal, privacy, security, or retention
requirement may require eventual physical erasure; that exception does not permit exposing deleted
data during the retention interval.

`AuditLog`, `AIUsageRecord`, and published KPI snapshots are append-only facts. Corrections to
these facts are represented by a compensating or superseding record rather than silently
rewriting history. Retention and eventual purge are governed by applicable policy.

### Lifecycles and audit

Lifecycle status and soft deletion are separate: deletion does not erase the historical business
outcome. Status transitions MUST be valid for the entity and auditable where specified below.
An actor must be an active user in the same tenant unless the action is explicitly attributed to
an authorized system process.

## Sales Lifecycle

1. A **Lead** represents an unconverted prospect. Its primary path is `new` → `qualified` →
   `contacted` → `converted` → `closed`. `disqualified` is a separate terminal outcome available
   before conversion. Archiving is a reversible soft-delete overlay, not a business stage.
2. A user explicitly converts a `contacted` Lead into exactly one **Contact**. Conversion
   preserves the Lead and its provenance and records the conversion relationship. The user may
   select an already associated Contact or create and associate one; the system MUST NOT silently
   merge or discard records. General Contact–Lead associations are many-to-many, while each Lead
   still has at most one conversion Contact.
3. A **Deal** represents a sales opportunity associated with one or more Contacts. Each Deal has
   exactly one primary Contact; additional associated Contacts are optional.
4. An open Deal is manually advanced through its sales stages and concludes as `won` or `lost`.
   Won and lost outcomes require the corresponding close details and are audited. Reopening a
   concluded Deal, if permitted by tenant policy, is an explicit audited transition.
5. **Activities**, **Notes**, and **AttachmentMetadata** may support Leads, Contacts, and Deals
   without owning or changing their lifecycle.

## Entity Catalog

### Platform

#### Tenant

- **Business purpose**: An organization and top-level boundary for its users, CRM data,
  configuration, and AI knowledge.
- **Ownership**: Root entity; it does not belong to another tenant.
- **Lifecycle**: `provisioning`, `active`, `suspended`, `closed`.
- **Required attributes**: Stable tenant identity, display name, lifecycle status, creation time,
  and creator.
- **Optional attributes**: Human-readable handle, default time zone, default currency, legal name,
  and closure or suspension details.
- **Relationships**: Owns all tenant-scoped entities; has Users through
  `UserRoleAssignment`, never by embedding tenant membership in the global User identity.
- **Validation constraints**: Display name is non-empty. A supplied handle is unique across
  tenants. A closed Tenant cannot accept new business activity. Tenant closure is not a request
  to erase audit evidence immediately.
- **Audit requirements**: Creation, status changes, ownership or administrative changes, and
  closure MUST be recorded.

#### User

- **Business purpose**: A human or service identity that can act within one or more tenants.
- **Ownership**: Platform-level identity, not tenant-owned. Tenant-specific access is represented
  only by `UserRoleAssignment`.
- **Lifecycle**: `invited`, `active`, `suspended`, `deactivated`.
- **Required attributes**: Stable identity-provider subject, normalized email address, display
  name, lifecycle status, and creation time.
- **Optional attributes**: Given and family names, avatar reference, last sign-in time, and
  non-tenant-specific profile preferences.
- **Relationships**: May have multiple `UserRoleAssignment` records, each for a different tenant
  and role; may be the actor on tenant-owned records only when assigned to that tenant.
- **Validation constraints**: Identity subject is stable and unique. Email is normalized for
  matching; email is not assumed unique across all identity providers unless identity policy
  guarantees it. A deactivated User cannot act in a tenant.
- **Audit requirements**: Tenant membership and authorization changes MUST be recorded in the
  affected Tenant's audit history. Authentication and global identity events follow the
  platform's identity audit policy.

#### Role

- **Business purpose**: A named, tenant-specific grouping of permissions used to grant access.
- **Ownership**: Exactly one Tenant.
- **Lifecycle**: `active`, `retired`.
- **Required attributes**: Tenant, stable role code, display name, lifecycle status, creation time,
  and creator.
- **Optional attributes**: Description and last-updated actor.
- **Relationships**: Grants one or more `Permission` records; is assigned to Users through
  `UserRoleAssignment`.
- **Validation constraints**: Role code is unique within its Tenant. Only active Roles can be
  assigned. A Tenant MUST retain at least one active role capable of administering its
  membership and access.
- **Audit requirements**: Creation, permission changes, retirement, and changes to role name or
  meaning MUST be recorded.

#### Permission

- **Business purpose**: A stable platform-defined capability that can be granted to a Role.
- **Ownership**: Platform-managed shared vocabulary; not tenant business data.
- **Lifecycle**: `active`, `deprecated`.
- **Required attributes**: Stable permission code, capability description, resource category,
  action, and lifecycle status.
- **Optional attributes**: Deprecation replacement and explanatory notes.
- **Relationships**: May be granted to multiple tenant-owned Roles.
- **Validation constraints**: Codes are globally unique and stable. Deprecated permissions
  cannot be newly granted; existing grants must be explicitly migrated or removed.
- **Audit requirements**: Platform changes to permission meaning, activation, or deprecation
  MUST be recorded. Tenant-specific grants are audited on the affected Role.

#### UserRoleAssignment

- **Business purpose**: Establishes a User's membership and role within one Tenant.
- **Ownership**: Exactly one Tenant.
- **Lifecycle**: `invited`, `active`, `suspended`, `revoked`, `expired`.
- **Required attributes**: Tenant, User, Role, status, assignment time, and assigning actor.
- **Optional attributes**: Expiry time, activation time, revocation time, and reason.
- **Relationships**: References exactly one User and one Role; the Role MUST belong to the same
  Tenant. A User may have multiple active Roles in a Tenant.
- **Validation constraints**: A User cannot exercise permissions through an inactive assignment.
  Assignment expiry must be later than assignment time. Duplicate active assignments of the
  same User and Role within one Tenant are not allowed.
- **Audit requirements**: Invitation, activation, suspension, role change, expiry, and revocation
  MUST be recorded.

#### AuditLog

- **Business purpose**: Provides an attributable history of critical business and authorization
  actions.
- **Ownership**: Exactly one Tenant for tenant business events. Platform-only events without a
  Tenant are outside this entity's tenant audit stream.
- **Lifecycle**: Append-only while retained; never edited in place.
- **Required attributes**: Tenant, event time, action, affected entity type and identity, and
  actor kind (`user` or `system`).
- **Optional attributes**: Actor identity, changed-field summary, reason, related record
  references, and event correlation reference.
- **Relationships**: May refer to any tenant-owned entity, including a soft-deleted one. Actor
  User, when present, must have been authorized in that Tenant at event time.
- **Validation constraints**: Events are tenant-scoped and ordered by event time. Change details
  MUST be limited to what is needed for accountability; credentials, secrets, and unnecessary
  copies of sensitive content MUST NOT be recorded.
- **Audit requirements**: This entity is itself the audit record. Creation is append-only;
  retention or erasure is controlled by policy and MUST be auditable.

### CRM

#### Lead

- **Business purpose**: Represents a prospective customer or sales inquiry before conversion to
  a Contact.
- **Ownership**: Exactly one Tenant; may have an assigned owner who is an active User in that
  Tenant.
- **Lifecycle**: `new`, `qualified`, `contacted`, `converted`, `closed`, or `disqualified`;
  archival is a separate reversible soft-delete overlay.
- **Required attributes**: Tenant, lifecycle status, source, creation time, and creator.
- **Optional attributes**: First and last name, company name, job title, email, phone, owner,
  qualification details, source details, conversion time, closed time, and disqualification
  reason.
- **Relationships**: May associate with multiple Contacts, convert to at most one Contact, and be
  associated with Activities, Notes, and AttachmentMetadata. All associations are within the
  same Tenant.
- **Validation constraints**: At least one of person name or company name is required. The primary
  path is `new` → `qualified` → `contacted` → `converted` → `closed`; statuses cannot skip a
  transition. `contacted` requires a linked completed Activity confirming contact. `converted`
  requires a conversion Contact and conversion time; conversion is allowed only from `contacted`.
  `closed` is allowed only after conversion and requires a closed time. `disqualified` is a
  terminal pre-conversion outcome and requires a reason. Contact details are normalized for
  matching but are not globally unique.
- **Audit requirements**: Creation, owner and status changes, qualification, conversion,
  disqualification, restoration, and soft deletion MUST be recorded.

#### Contact

- **Business purpose**: Represents a person with whom the Tenant has an ongoing or established
  business relationship.
- **Ownership**: Exactly one Tenant; an optional owner must be an active User in that Tenant.
- **Lifecycle**: `active`, `inactive`; soft deletion is separate.
- **Required attributes**: Tenant, first name, lifecycle status, creation time, and creator.
- **Optional attributes**: Last name, display name, email, phone, job title, company name, owner,
  and contact preferences.
- **Relationships**: May be associated with multiple Leads, including before conversion; may be
  the conversion Contact for multiple Leads only after explicit identity resolution; may be
  associated with multiple Deals and Activities; may have Notes and AttachmentMetadata.
- **Validation constraints**: First name is non-empty. Email, when supplied, is normalized for
  matching; it is not required to be unique. General Lead association is distinct from Lead
  conversion. A Contact and every related record MUST share the same Tenant.
- **Audit requirements**: Creation, changes to contact details or owner, status changes,
  conversions linked to it, restoration, and soft deletion MUST be recorded. Sensitive contact
  data MUST NOT be copied wholesale into unrelated audit entries.

#### Deal

- **Business purpose**: Represents a sales opportunity with a Contact and a business outcome.
- **Ownership**: Exactly one Tenant; optional owner must be an active User in that Tenant.
- **Lifecycle**: `open`, `won`, `lost`; an open Deal has a tenant-defined sales stage. Reopening a
  concluded Deal is a separate audited transition if allowed.
- **Required attributes**: Tenant, name, open/closed status, stage, exactly one primary Contact,
  creation time, and creator.
- **Optional attributes**: Additional Contacts, owner, description, amount, currency, expected
  close date, actual close time, probability, won details, loss reason, and source.
- **Relationships**: Has one or more Contacts, exactly one marked primary; may have multiple
  Activities, Notes, and AttachmentMetadata.
- **Validation constraints**: Primary Contact and all additional Contacts belong to the same
  Tenant. Amount and currency are supplied together. A `won` or `lost` Deal requires an actual
  close time; a `lost` Deal requires a loss reason. An `open` Deal cannot have a final close
  outcome. Stage changes MUST remain consistent with the lifecycle status.
- **Audit requirements**: Creation, owner, amount, stage and Contact changes, close or reopen,
  win/loss outcome, restoration, and soft deletion MUST be recorded.

#### Activity

- **Business purpose**: Records a sales interaction or planned task related to CRM work.
- **Ownership**: Exactly one Tenant; creator and optional assignee must be Users assigned to that
  Tenant.
- **Lifecycle**: `scheduled`, `in_progress`, `completed`, `cancelled`.
- **Required attributes**: Tenant, title, activity type (`task`, `meeting`, `call`, `follow_up`,
  `email`, or `other`), status, creator, and at least one related CRM subject.
- **Optional attributes**: Assignee, description, scheduled start and end, due time, occurrence
  time, outcome, and completion details.
- **Relationships**: May relate to one or more Leads, Contacts, and Deals. Each related record
  must belong to the same Tenant.
- **Validation constraints**: A `scheduled` Activity requires a scheduled start. An
  `in_progress` Activity requires a start time. A `completed` Activity requires an occurrence or
  completion time. Scheduled end must not precede scheduled start. Valid transitions are
  `scheduled` → `in_progress` → `completed`; a scheduled or in-progress Activity may be
  cancelled. Retrospectively logged Activities may transition directly from `scheduled` to
  `completed` when occurrence details are supplied. At least one subject reference is required.
- **Audit requirements**: Creation, assignment, schedule changes, completion, cancellation,
  subject changes, restoration, and soft deletion MUST be recorded.

#### Note

- **Business purpose**: Preserves human-authored context about a CRM record.
- **Ownership**: Exactly one Tenant and one author; the author must be a User assigned to that
  Tenant at creation.
- **Lifecycle**: `active`, `soft-deleted`; content edits create a new logical revision.
- **Required attributes**: Tenant, body, author, creation time, and exactly one parent subject.
- **Optional attributes**: Title, visibility scope (defaults to Tenant-internal), last editor,
  and edit time.
- **Relationships**: Belongs to exactly one Lead, Contact, Deal, or Activity. It is not an
  unattached tenant-wide note. A Note may be the source of a same-tenant KnowledgeDocument for
  future RAG indexing.
- **Validation constraints**: Body is non-empty after trimming. Parent and Note share the same
  Tenant. Visibility cannot exceed the Tenant boundary. Editing or deleting a Note does not
  alter its parent.
- **Audit requirements**: Creation, edits, visibility changes, restoration, and soft deletion
  MUST be recorded without duplicating the full note body in the audit history.

#### AttachmentMetadata

- **Business purpose**: Describes a file attached to a CRM record without making file bytes part
  of the business entity.
- **Ownership**: Exactly one Tenant and one uploading User; both the parent and uploader belong
  to that Tenant.
- **Lifecycle**: `available`, `quarantined`, `unavailable`, `soft-deleted`.
- **Required attributes**: Tenant, file name, media type, size, opaque storage reference, upload
  time, uploader, scan state (`pending`, `clean`, `blocked`, or `failed`), and exactly one parent.
- **Optional attributes**: Description, checksum, and removal details.
- **Relationships**: Belongs to exactly one Lead, Contact, Deal, Activity, or Note. May be used as
  a source for a KnowledgeDocument without changing its CRM parent.
- **Validation constraints**: Size is positive and within the applicable file policy. Storage
  references are tenant-scoped and do not expose credentials. A quarantined or deleted
  attachment is unavailable to ordinary CRM use and AI retrieval.
- **Audit requirements**: Upload, availability or scan-state changes, parent changes, restoration,
  and deletion MUST be recorded.

### AI

#### AIProvider

- **Business purpose**: Represents a provider configuration that a Tenant may enable for AI
  capabilities.
- **Ownership**: Exactly one Tenant. The provider catalog or adapter definition is platform
  capability, but a Tenant's selection and configuration are tenant-owned.
- **Lifecycle**: `enabled`, `disabled`, `retired`.
- **Required attributes**: Tenant, provider identity, display name, enabled state, creation time,
  and configuring actor. Initial provider identities may include OpenAI, Gemini, Ollama, and
  OpenRouter.
- **Optional attributes**: Allowed model aliases, capability set, non-secret preferences,
  availability state, and last validation time.
- **Relationships**: May be referenced by `AIGeneration` and `AIUsageRecord`.
- **Validation constraints**: Provider references resolve to a supported provider abstraction.
  Credentials and secrets are never business attributes or audit values. A generation may use
  only a provider enabled for its Tenant.
- **Audit requirements**: Creation, enable/disable, allowed capability or model changes, and
  retirement MUST be recorded. Secret values MUST NOT be recorded.

#### AIPromptTemplate

- **Business purpose**: Defines a reusable, versioned instruction template for an AI capability.
- **Ownership**: Exactly one Tenant.
- **Lifecycle**: `draft`, `active`, `retired`.
- **Required attributes**: Tenant, stable template identity, purpose, version, template content,
  lifecycle status, creation time, and creator.
- **Optional attributes**: Description, declared input names, output expectations, and retirement
  reason.
- **Relationships**: May be referenced by many `AIGeneration` records. A generation references
  the exact template version used.
- **Validation constraints**: Version identifiers are unique within a template. An active
  version is immutable; an edit creates a new version. Template variables and output expectations
  are declared and validated before use.
- **Audit requirements**: Creation, activation, retirement, and version publication MUST be
  recorded. Published content is retained for generation provenance.

#### AIGeneration

- **Business purpose**: Records one requested AI operation and its reviewable result.
- **Ownership**: Exactly one Tenant and one requesting User; both must be valid in that Tenant.
- **Lifecycle**: `pending`, `succeeded`, `failed`, `cancelled`. Approval is a separate state:
  `not-required`, `awaiting-review`, `approved`, `rejected`, `expired`.
- **Required attributes**: Tenant, requester, capability or generation type, status, request
  time, and approval state. Provider identity is required once provider execution begins.
- **Optional attributes**: Model alias, exact prompt-template version, related CRM subjects,
  input reference or minimized summary, output reference or result summary, completion time,
  failure category, reviewer, and review time.
- **Relationships**: May reference tenant-owned Leads, Contacts, Deals, Activities, or Notes; all
  references MUST share the generation's Tenant. May have zero or more `AIUsageRecord` entries.
- **Validation constraints**: A provider reference, once execution begins, must identify an
  enabled configuration for the same Tenant. A template-driven generation MUST identify the
  exact active prompt-template version used. Failed and cancelled generations do not have an
  approved result. An output that proposes a consequential CRM change MUST remain unapplied
  until an authorized human explicitly approves it; approval identifies the reviewer and time.
  Rejection or expiry prevents application.
- **Audit requirements**: Request, completion or failure, cancellation, review decision, and
  application of an approved result MUST be recorded. Raw prompts and outputs are retained only
  when needed and permitted by the Tenant's data policy.

#### AIUsageRecord

- **Business purpose**: Records measurable consumption attributable to an AI operation for
  operational limits, usage analysis, and provider reconciliation.
- **Ownership**: Exactly one Tenant. Any related generation and provider configuration must have
  the same Tenant.
- **Lifecycle**: `recorded`, `reconciled`, `voided`; records are append-only.
- **Required attributes**: Tenant, provider identity, usage time, usage measure and quantity, and
  record status.
- **Optional attributes**: Related generation, model alias, input/output token quantities,
  latency, provider request reference, estimated cost and currency, reconciliation details, and
  a reference to a corrected or voided record.
- **Relationships**: May reference one `AIGeneration` and one `AIProvider`; either may be absent
  for provider-level usage not associated with a saved generation.
- **Validation constraints**: Quantities are non-negative. Cost and currency appear together.
  Corrections use a compensating record; a usage record is never silently rewritten.
- **Audit requirements**: Creation, reconciliation, voiding, and compensating entries MUST be
  attributable and retained under usage-record policy.

### Analytics

#### KPI Snapshot

- **Business purpose**: Preserves a point-in-time aggregate measure of tenant CRM performance.
- **Ownership**: Exactly one Tenant; any user or record dimensions refer only to that Tenant.
- **Lifecycle**: `current`, `superseded`; a published snapshot is immutable.
- **Required attributes**: Tenant, metric identity, aggregation period start and end, snapshot
  time, value, and lifecycle status.
- **Optional attributes**: Numerator and denominator, currency, owner or pipeline dimensions,
  source dimensions, and metric-definition revision.
- **Relationships**: Aggregates Leads, Contacts, Deals, or Activities without becoming their
  owner; may be referenced by a `Dashboard Configuration`.
- **Validation constraints**: Period end is later than period start. The metric identity defines
  its unit, inclusion rules, and time basis. Currency-bearing values identify their currency;
  values in different currencies are not added without an explicitly defined conversion basis.
  Recalculation creates a superseding snapshot.
- **Audit requirements**: Creation, supersession, and correction rationale MUST be recorded.
  Snapshots contain aggregate values, not unnecessary row-level personal data.

#### Dashboard Configuration

- **Business purpose**: Stores a Tenant's saved selection and arrangement of analytics views.
- **Ownership**: Exactly one Tenant. A configuration is either tenant-shared or personal to one
  User in that Tenant.
- **Lifecycle**: `active`, `archived`.
- **Required attributes**: Tenant, name, scope (`tenant-shared` or `personal`), configuration
  revision, creation time, and creator.
- **Optional attributes**: Description, layout preferences, selected metric identities, filters,
  and personal owner.
- **Relationships**: May refer to KPI metric identities or snapshots. A personal configuration
  has exactly one owner; a tenant-shared configuration has no personal owner.
- **Validation constraints**: Personal owner must be an active Tenant member. Referenced metrics
  and filters must be valid for that Tenant. Configuration does not grant data permissions.
- **Audit requirements**: Creation, edits, sharing-scope changes, archive, and restoration MUST
  be recorded.

### Future RAG Readiness

#### KnowledgeDocument

- **Business purpose**: Represents a tenant-owned source of knowledge eligible for controlled
  retrieval by AI capabilities.
- **Ownership**: Exactly one Tenant; uploader or creator must be a User assigned to that Tenant.
- **Lifecycle**: `draft`, `processing`, `indexed`, `failed`, `archived`, `soft-deleted`.
- **Required attributes**: Tenant, title, source type, content revision, lifecycle status,
  creation time, and creator.
- **Optional attributes**: Description, source reference, source AttachmentMetadata or Note,
  checksum, effective date, and processing failure category.
- **Relationships**: Has zero or more `KnowledgeChunk` records; each chunk may have one or more
  `VectorEmbedding` representations. A source attachment or Note, if present, must share the
  Tenant.
- **Validation constraints**: A document must be authorized and tenant-scoped before ingestion.
  Only successfully indexed, non-deleted documents are retrievable. A content change creates a
  new document revision and invalidates retrieval artifacts from prior revisions. Note-derived
  documents retain the source Note identity and revision; editing or deleting the Note invalidates
  the prior document revision for retrieval.
- **Audit requirements**: Creation, source or content revision, processing outcome, activation,
  archive, and deletion MUST be recorded.

#### KnowledgeChunk

- **Business purpose**: Represents a coherent, attributable portion of a KnowledgeDocument for
  retrieval.
- **Ownership**: Exactly one Tenant and one parent KnowledgeDocument in that Tenant.
- **Lifecycle**: `pending`, `indexed`, `stale`, `soft-deleted`.
- **Required attributes**: Tenant, document identity and revision, stable chunk identity,
  content, ordering information, and lifecycle status.
- **Optional attributes**: Section heading, source offsets, and content provenance.
- **Relationships**: Belongs to exactly one KnowledgeDocument; may have multiple
  `VectorEmbedding` records for different embedding revisions or representations.
- **Validation constraints**: Chunk boundaries and ordering are valid for the source revision.
  A chunk is retrievable only while its parent document and revision are active. A chunk and its
  embeddings MUST never be exposed across tenants.
- **Audit requirements**: Chunk-set creation, replacement, stale marking, and deletion are
  recorded through the parent document's ingestion history and audit events.

#### VectorEmbedding

- **Business purpose**: Represents a vectorized form of one KnowledgeChunk for semantic
  retrieval.
- **Ownership**: Exactly one Tenant and one KnowledgeChunk in that Tenant.
- **Lifecycle**: `pending`, `ready`, `stale`, `failed`, `soft-deleted`.
- **Required attributes**: Tenant, chunk identity and revision, embedding-model identity and
  revision, vector representation, creation time, and status.
- **Optional attributes**: Vector dimensionality, indexing time, and failure category.
- **Relationships**: Belongs to exactly one KnowledgeChunk; one chunk may have multiple embeddings
  for distinct model or content revisions.
- **Validation constraints**: Embedding compatibility metadata matches the vector representation.
  Only `ready` embeddings for active document and chunk revisions may participate in retrieval.
  Retrieval is always tenant-scoped and applies the same authorization as the source document.
- **Audit requirements**: Creation, successful indexing, failure, stale marking, and deletion
  are attributable to the ingestion operation and recorded. Vector values are not copied into
  audit payloads.

## Relationship Summary

- **Tenant ownership**: One Tenant owns many tenant-scoped CRM, role, assignment, audit, AI
  configuration/generation/usage, analytics, and RAG records. Tenant is the root, not its own
  child. User identities and the Permission catalog are platform-level exceptions.
- **User and access**: A User can join many Tenants through `UserRoleAssignment`. Each assignment
  links one User, one Role, and one Tenant; each Role links to shared Permissions. Only active
  assignments grant permissions.
- **Lead and Contact**: A Lead follows its canonical lifecycle and may be generally associated
  with multiple Contacts. Each Lead converts at most once to one Contact; a Contact may be the
  conversion target for multiple Leads only after explicit identity resolution. Conversion
  preserves the Lead and provenance.
- **Contact and Deal**: A Contact can participate in many Deals. A Deal has one or more Contacts,
  exactly one of which is primary.
- **Deal and Activity**: A Deal can have many Activities. An Activity can also relate to a Lead or
  Contact, and may reference multiple same-tenant subjects.
- **Notes and attachments**: Each Note and AttachmentMetadata has exactly one CRM parent.
  Neither is an ownership substitute for its parent. A Note may also serve as the source for a
  tenant-matched KnowledgeDocument revision.
- **AI Generation**: A generation belongs to its requesting User and Tenant, and may refer to
  same-tenant CRM subjects. Its output is a proposal until a user with appropriate permission
  explicitly approves any consequential change.
- **Knowledge and embeddings**: A KnowledgeDocument owns its revision-specific chunks; chunks
  own embeddings. Document, chunk, and embedding always share one Tenant and compatible source
  revision.

## Cross-Cutting Rules

### Tenant isolation

Tenant identity is part of the business meaning of each tenant-scoped record, not a filter that
may be omitted. Reads, writes, background work, search, analytics, caching, exports, AI prompts,
RAG retrieval, and generated suggestions MUST remain tenant-scoped and permission-checked.
Tenant IDs from untrusted input do not establish authorization. Cross-tenant references and
inference through aggregates are prohibited.

### Soft deletion and retention

Soft deletion is preferred for mutable CRM data and configuration. Deleted records are excluded
immediately from normal use. Parent deletion makes descendants unavailable for ordinary access
and retrieval; restoring a parent does not silently restore children whose own status is deleted.
Immutable facts follow their append-only retention rules. Physical purge is permitted only under
an applicable retention or privacy policy and must preserve required audit accountability without
retaining unnecessary personal content.

### Auditing

At minimum, audit creation, status and lifecycle transitions, ownership or assignment changes,
Lead conversion, Deal stage/outcome changes, permission changes, Note edits, attachment
availability, AI approval decisions, knowledge ingestion state, and deletion/restoration.
Audit events identify tenant, actor or system process, time, action, target, and a minimized
change summary. Secrets and unnecessary copies of personal or AI-generated content are excluded.

### Versioning

Mutable business records have a logical revision; consequential changes are traceable through
audit history. Published prompt-template versions are immutable. Knowledge chunks and embeddings
are bound to a specific document/content revision. KPI snapshots identify their time window,
calculation time, and metric-definition revision where applicable. A future change to an entity's
meaning, ownership, lifecycle, or relationship is a domain-model amendment, not an undocumented
feature-specific exception.

### Search

Search is tenant- and permission-scoped. It excludes soft-deleted, quarantined, or otherwise
unavailable records and does not reveal the existence of records a user cannot access. Contact
details may be normalized for matching but do not imply uniqueness. Search indexing and caches
must preserve the same isolation and deletion behavior as the source records.

### Analytics aggregation

Every aggregate is scoped to exactly one Tenant and uses explicit time windows, status inclusion
rules, dimensions, and units. Revenue-like values include currency; totals across currencies
require a separately defined conversion basis. KPI snapshots are immutable and may be
superseded. Aggregates MUST NOT expose another Tenant's data or bypass access rules for
user-specific dimensions.

### Future RAG indexing

Knowledge ingestion preserves source identity, tenant, content revision, and provenance through
document, chunk, and embedding. Retrieval uses only current, authorized, non-deleted content from
the requesting Tenant. Updating, archiving, or deleting a source invalidates its old chunks and
embeddings for retrieval. A Note may be indexed only through an explicitly linked
KnowledgeDocument revision; editing or soft-deleting the Note invalidates the corresponding
revision. The domain model does not prescribe chunking algorithms, vector dimensions, model
vendors, or ingestion infrastructure.

## Functional Requirements

- **FR-001**: Every customer business record and configuration MUST have exactly one Tenant owner.
- **FR-002**: Every relationship between tenant-scoped records MUST be within the same Tenant.
- **FR-003**: User identity MUST be separable from tenant membership; tenant access MUST be
  represented by `UserRoleAssignment`.
- **FR-004**: A Lead MUST follow `new` → `qualified` → `contacted` → `converted` → `closed`, or
  terminate as `disqualified` before conversion. Conversion MUST preserve provenance and MUST NOT
  silently merge or delete records.
- **FR-005**: A Deal MUST have exactly one primary Contact and at least one associated Contact.
- **FR-006**: Won and lost Deal outcomes MUST retain close details and be auditable.
- **FR-007**: Every Activity, Note, and AttachmentMetadata MUST satisfy its subject ownership
  constraints.
- **FR-008**: AI provider selection, prompts, generations, and usage MUST be tenant-scoped where
  configured or recorded; vendor-specific implementation MUST NOT define business semantics.
- **FR-009**: AI-generated consequential changes MUST remain unapplied until an authorized human
  explicitly approves them.
- **FR-010**: Analytics aggregates and snapshots MUST remain tenant-scoped, time-bounded, and
  interpretable by metric, unit, and applicable currency.
- **FR-011**: RAG documents, chunks, and embeddings MUST retain tenant and source-revision
  provenance and MUST NOT be retrieved across tenant boundaries.
- **FR-012**: Deletion, restoration, lifecycle transitions, and changes to critical business
  fields MUST follow the soft-delete and audit rules defined here.
- **FR-013**: Domain rules MUST be reusable independently of REST, AI, or future MCP transports.
- **FR-014**: Future specifications MUST reference this model and identify any proposed changes
  to entity meaning, ownership, lifecycle, or relationships.
- **FR-015**: Lead–Contact associations MUST be same-tenant and may exist independently of
  conversion; each Lead MUST have at most one conversion Contact.
- **FR-016**: Activities MUST follow `scheduled`, `in_progress`, `completed`, or `cancelled`
  lifecycle rules, and every transition MUST preserve its tenant-scoped CRM subject.
- **FR-017**: A Note used for future RAG MUST be linked to a same-tenant KnowledgeDocument
  revision; edits or deletion MUST invalidate retrieval artifacts for its prior revision.

## User Scenarios and Acceptance

### Scenario 1 — Maintain a tenant's sales lifecycle

**Given** a Lead in a Tenant, **when** an authorized user progresses it through qualification
and contact, **then** conversion links at most one Contact to the preserved Lead, and all
associations and subsequent Deals and Activities remain same-tenant.

### Scenario 2 — Enforce tenant membership

**Given** a User who belongs to two Tenants, **when** that User acts in one Tenant, **then** only
that Tenant's active roles and permissions authorize access, and no CRM, analytics, AI, or
knowledge data from the other Tenant is exposed.

### Scenario 3 — Review AI-generated business changes

**Given** an AI generation that proposes a change to a CRM record, **when** the generation
completes, **then** the proposal remains unapplied until an authorized same-tenant User approves
it, and the decision is auditable.

### Scenario 4 — Preserve analytics and knowledge provenance

**Given** CRM activity or knowledge content changes, **when** snapshots or retrieval indexes are
updated, **then** tenant scope, metric period, source revision, and superseded/stale status remain
traceable.

## Success Criteria

- **SC-001**: 100% of the 21 cataloged entities define business purpose, ownership, lifecycle,
  required and optional attributes, relationships, validation, and audit requirements.
- **SC-002**: 100% of tenant-owned relationships and retrieval paths have an explicit same-tenant
  constraint.
- **SC-003**: Lead lifecycle, Lead–Contact association and conversion, Contact-to-Deal
  association, Deal-to-Activity association, Note ownership, and AI Generation ownership have
  unambiguous cardinality and lifecycle rules.
- **SC-004**: Every soft-deleted or stale CRM/knowledge record is excluded from normal search,
  analytics, and AI retrieval.
- **SC-005**: Future feature specifications can map their entities and workflows to this catalog
  without redefining ownership or lifecycle implicitly.

## Assumptions

- A User is a platform identity that may participate in multiple Tenants; tenant membership is
  not stored as a property of the global identity.
- Roles are tenant-configurable, while Permission codes are a shared platform vocabulary.
- A Deal is associated with one or more Contacts and has one required primary Contact; company
  or account management is not introduced as an additional entity in this model.
- Notes are internal to a Tenant by default and have exactly one CRM parent.
- Lead and Contact archive/restore uses the reversible soft-delete overlay and preserves the
  prior business lifecycle status.
- Lead–Contact general associations are many-to-many; conversion remains one Contact per Lead,
  and a Contact may receive multiple conversions only after explicit identity resolution.
- A Note can be indexed for future RAG only through an explicitly linked, revisioned
  KnowledgeDocument.
- AttachmentMetadata describes a separately stored file; file content and storage behavior are
  outside this business model.
- Provider credentials, physical vector storage, and model-specific vector representations are
  implementation concerns, not business attributes.
- Tenant-defined sales stages may vary, but the canonical Deal outcomes remain `open`, `won`, and
  `lost`.

## Open Questions

- None. Changes to these assumptions require an explicit domain-model amendment.

# Tasks: AI Content Studio

**Input**: Design documents from `./specs/1-ai-content-studio/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are MANDATORY per Constitution Principle II (Test-First). All user stories MUST include corresponding unit/integration/contract tests written BEFORE implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root (but we're using Next.js app directory structure)
- **Web app**: `app/`, `components/`, `lib/`, `prisma/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Initialize Next.js 14+ project with TypeScript and App Router
- [ ] T002 Install and configure Tailwind CSS v4 with PostCSS
- [ ] T003 [P] Install HeroUI v3 (@heroui/react@beta, @heroui/styles@beta) and configure globals.css
- [ ] T004 [P] Set up ESLint, Prettier, and Husky with lint-staged pre-commit hooks
- [ ] T005 [P] Configure environment variables (.env.example, .env.local)
- [ ] T006 [P] Set up Prisma with PostgreSQL (Supabase) connection
- [ ] T007 [P] Create initial Prisma schema based on data-model.md and run first migration
- [ ] T008 [P] Configure NextAuth.js with Google OAuth provider (placeholder credentials)
- [ ] T009 [P] Set up i18n with next-intl and create en/es locale files
- [ ] T010 [P] Create basic folder structure: app/, components/, lib/, locales/, styles/, types/
- [ ] T011 [P] Configure TypeScript tsconfig.json with strict mode and path aliases (@/*)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T012 [P] Implement authentication layout and login page using HeroUI components
- [x] T013 [P] Create middleware.ts with NextAuth.js protection for dashboard and API routes
- [x] T014 [P] Set up Prisma client singleton in lib/db/prisma-client.ts with connection pooling
- [x] T015 [P] Create base API response helper (success/error envelope) in lib/utils/api-response.ts
- [x] T016 [P] Implement Zod validation middleware for API routes (lib/middleware/validation.ts)
- [x] T017 [P] Set up rate limiting middleware (upstash/ratelimit or similar)
- [x] T018 [P] Configure CORS to allow only Vercel domain (and localhost for dev)
- [x] T019 [P] Create WebSocket server (ws-server.ts) with JWT authentication and room management
- [x] T020 [P] Set up Redis pub/sub for WebSocket broadcasting (or in-memory for MVP)
- [x] T021 [P] Implement Supabase Storage client and create storage buckets (assets, thumbnails)
- [x] T022 [P] Create thumbnail generation service using sharp (lib/services/thumbnail-service.ts)
- [x] T023 [P] Set up Zustand store for global state (user, project context) in lib/stores/
- [ ] T024 [P] Create shared HeroUI UI components wrappers if needed (Button, Card, Modal, etc.) - NOT NEEDED (using HeroUI v3 directly)
- [x] T025 [P] Configure Vercel environment variables and production settings

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Authentication & Project Creation (Priority: P1) 🎯 MVP

**Goal**: Users can sign in with Google OAuth and create projects to organize their work.

**Independent Test**: Sign in with Google OAuth → Create project → Verify project appears in dashboard. Delivers secure, personalized workspace.

### Tests for User Story 1

- [ ] T026 [P] [US1] Unit test: NextAuth.js configuration and JWT token generation (tests/auth/auth.test.ts)
- [ ] T027 [P] [US1] Integration test: OAuth callback flow and session creation (tests/integration/auth.test.ts)
- [ ] T028 [P] [US1] Unit test: Project CRUD operations with Prisma (tests/unit/projects.test.ts)
- [ ] T029 [P] [US1] API contract test: POST /api/v1/projects (tests/contract/api/projects.test.ts)
- [ ] T030 [P] [US1] E2E test: Login → Create project → View dashboard (tests/e2e/auth-project.cy.ts)

### Implementation for User Story 1

- [x] T031 [US1] Create login page at app/(auth)/login/page.tsx with HeroUI Card, Button, and Google OAuth button
- [x] T032 [US1] Implement NextAuth.js route handlers: app/api/auth/[...nextauth]/route.ts
- [ ] T033 [US1] Create auth callbacks route: app/api/auth/callback/route.ts for OAuth redirect - NOT NEEDED (NextAuth v5 handles automatically)
- [x] T034 [US1] Implement middleware.ts with auth() protection for dashboard and API routes
- [x] T035 [US1] Create Project model integration: lib/db/models/project.ts (Prisma client wrapper)
- [x] T036 [US1] Implement POST /api/v1/projects route with Zod validation (CreateProjectSchema)
- [x] T037 [US1] Implement GET /api/v1/projects route (list projects for current user with role)
- [x] T038 [US1] Create dashboard page at app/dashboard/page.tsx with HeroUI components (project list, "New Project" button)
- [x] T039 [US1] Create "New Project" modal with HeroUI Modal, Form, Input, Button components
- [x] T040 [US1] Implement project creation form with validation and error handling
- [ ] T041 [US1] Add logging for project creation events (lib/utils/logger.ts)
- [ ] T042 [US1] Add unit tests for validation schemas (CreateProjectSchema, UpdateProjectSchema)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Workflow Definition & Execution (Priority: P1)

**Goal**: Users can define multi-step AI workflows and trigger automated execution.

**Independent Test**: Create workflow with Blog → Image → Video steps → Trigger execution → Verify sequential agent runs with data passing. Delivers automated content generation.

### Tests for User Story 2

- [ ] T043 [P] [US2] Unit test: Workflow step validation and input/output resolution (tests/unit/workflow-engine.test.ts)
- [ ] T044 [P] [US2] Unit test: Agent registry and parameter handling (tests/unit/agents/registry.test.ts)
- [ ] T045 [P] [US2] Integration test: Workflow CRUD API endpoints (tests/integration/workflows-api.test.ts)
- [ ] T046 [P] [US2] Integration test: Workflow execution engine (tests/integration/workflow-execution.test.ts)
- [ ] T047 [P] [US2] API contract test: POST /api/v1/projects/:id/workflows/:id/execute (tests/contract/api/workflows.test.ts)
- [ ] T048 [P] [US2] E2E test: Create workflow → Execute → View real-time updates (tests/e2e/workflow-execution.cy.ts)

### Implementation for User Story 2

- [ ] T049 [US2] Create Workflow and WorkflowExecution Prisma model wrappers in lib/db/models/
- [ ] T050 [US2] Implement GET /api/v1/projects/:projectId/workflows (list with pagination)
- [ ] T051 [US2] Implement POST /api/v1/projects/:projectId/workflows (create with steps validation)
- [ ] T052 [US2] Implement PATCH /api/v1/projects/:projectId/workflows/:id (update, increment version)
- [ ] T053 [US2] Implement DELETE /api/v1/projects/:projectId/workflows/:id
- [ ] T054 [US2] Create workflow editor page at app/projects/[projectId]/workflows/[workflowId]/page.tsx
- [ ] T055 [US2] Build workflow step builder UI using HeroUI components (Card, Button, Modal, Form)
- [ ] T056 [US2] Implement step configuration form with dynamic fields based on agent type
- [ ] T057 [US2] Create agent registry in lib/agents/registry.ts with BLOG, IMAGE, VIDEO definitions
- [ ] T058 [US2] Implement workflow execution engine: lib/agents/orchestrator.ts (sequential step execution)
- [ ] T059 [US2] Implement POST /api/v1/projects/:projectId/workflows/:id/execute (creates WorkflowExecution, triggers async execution)
- [ ] T060 [US2] Implement WebSocket event handlers for workflow execution updates (agent_run_started, completed, failed)
- [ ] T061 [US2] Create execution details page at app/projects/[projectId]/workflows/[workflowId]/executions/[executionId]/page.tsx
- [ ] T062 [US2] Add real-time status updates via WebSocket (useWebSocket hook)
- [ ] T063 [US2] Implement agent-specific callers: lib/agents/blog-agent.ts, image-agent.ts, video-agent.ts (call external AI APIs)
- [ ] T064 [US2] Add retry logic and error handling in orchestrator (with exponential backoff)
- [ ] T065 [US2] Store agent logs in AgentRun.logs and broadcast via WebSocket
- [ ] T066 [US2] Add unit tests for each agent type with mocked external APIs

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Real-time Collaboration (Priority: P2)

**Goal**: Team members can collaborate on projects with real-time cursor and edit visibility.

**Independent Test**: Two users in same project → edits appear in both browsers within 1 second. Delivers synchronous teamwork.

### Tests for User Story 3

- [ ] T067 [P] [US3] Unit test: WebSocket server room management and authentication (tests/unit/websocket-server.test.ts)
- [ ] T068 [P] [US3] Integration test: Cursor position broadcasting and receiving (tests/integration/collaboration.test.ts)
- [ ] T069 [P] [US3] Integration test: Workflow edit conflict detection (version check) (tests/integration/conflict-detection.test.ts)
- [ ] T070 [P] [US3] API contract test: POST /api/v1/projects/:id/collaboration/cursor (tests/contract/api/collaboration.test.ts)
- [ ] T071 [P] [US3] E2E test: Invite user → real-time cursor updates → conflict resolution (tests/e2e/collaboration.cy.ts)

### Implementation for User Story 3

- [ ] T072 [US3] Create CollaborationSession and CollaborationParticipant Prisma model wrappers
- [ ] T073 [US3] Implement GET /api/v1/projects/:projectId/collaboration/session (create/join session)
- [ ] T074 [US3] Implement POST /api/v1/projects/:projectId/collaboration/cursor (broadcast via WebSocket)
- [ ] T075 [US3] Implement POST /api/v1/projects/:id/invite (send email invitation or auto-accept)
- [ ] T076 [US3] Implement GET /api/v1/projects/:id/members (list project members)
- [ ] T077 [US3] Implement DELETE /api/v1/projects/:id/members/:userId (remove member)
- [ ] T078 [US3] Create team management page at app/projects/[projectId]/team/page.tsx with HeroUI Table, Button, Modal
- [ ] T079 [US3] Add role-based UI: show different actions for OWNER vs EDITOR vs VIEWER
- [ ] T080 [US3] Implement WebSocket server logic for cursor_update events (broadcast to project room)
- [ ] T081 [US3] Create useWebSocket custom hook for client-side connection management (lib/hooks/use-websocket.ts)
- [ ] T082 [US3] Implement cursor overlay component: components/collaboration/cursor-overlay.tsx (shows other users' cursors)
- [ ] T083 [US3] Add presence indicators (user avatars online in project)
- [ ] T084 [US3] Implement optimistic locking for workflow updates: check version before save, return conflict error
- [ ] T085 [US3] Add conflict resolution UI in workflow editor (show diff, prompt to refresh)
- [ ] T086 [US3] Add logging for collaboration events (user joined, left, cursor moves)

**Checkpoint**: User Story 3 should be independently functional

---

## Phase 6: User Story 4 - Asset Management & Preview (Priority: P2)

**Goal**: Users can upload, organize, and preview generated assets within their projects.

**Independent Test**: Upload images/videos/documents → Organize → Preview in modal. Verifies file handling, storage, and rendering.

### Tests for User Story 4

- [ ] T087 [P] [US4] Unit test: Asset upload URL generation and validation (tests/unit/assets.test.ts)
- [ ] T088 [P] [US4] Integration test: File upload flow (signed URL → direct upload → completion) (tests/integration/asset-upload.test.ts)
- [ ] T089 [P] [US4] Integration test: Thumbnail generation with sharp (tests/integration/thumbnail-generation.test.ts)
- [ ] T090 [P] [US4] API contract test: GET /api/v1/projects/:id/assets (tests/contract/api/assets.test.ts)
- [ ] T091 [P] [US4] E2E test: Upload asset → preview → search/filter (tests/e2e/asset-management.cy.ts)

### Implementation for User Story 4

- [ ] T092 [US4] Create Asset Prisma model wrapper and add indexes
- [ ] T093 [US4] Implement POST /api/v1/projects/:projectId/assets/upload-url (generate signed URL from Supabase Storage)
- [ ] T094 [US4] Implement POST /api/v1/projects/:projectId/assets/:id/complete (finalize upload, trigger thumbnail generation)
- [ ] T095 [US4] Implement GET /api/v1/projects/:projectId/assets (list with pagination, filtering by type, date, workflowExecutionId)
- [ ] T096 [US4] Implement GET /api/v1/projects/:projectId/assets/:id (get asset details)
- [ ] T097 [US4] Implement DELETE /api/v1/projects/:projectId/assets/:id
- [ ] T098 [US4] Create asset library page at app/projects/[projectId]/assets/page.tsx
- [ ] T099 [US4] Build asset upload widget with drag-and-drop using HeroUI components (Card, Button, Progress)
- [ ] T100 [US4] Implement client-side direct upload to Supabase Storage with progress tracking
- [ ] T101 [US4] Create asset grid/gallery view with HeroUI Image component (or next/image)
- [ ] T102 [US4] Build asset preview modal with HeroUI Modal, supporting images, videos, and documents (PDF, text)
- [ ] T103 [US4] Add search and filter controls (type, date, workflow run) with URL query state
- [ ] T104 [US4] Implement thumbnail generation service (lib/services/thumbnail-service.ts) using sharp
- [ ] T105 [US4] Add WebSocket event for asset_uploaded to notify other collaborators
- [ ] T106 [US4] Add logging for asset operations (upload, delete, preview)
- [ ] T107 [US4] Write unit tests for thumbnail service (various image/video formats)

**Checkpoint**: User Story 4 should be independently functional

---

## Phase 7: User Story 5 - Agent Orchestration & Status (Priority: P3)

**Goal**: Users can monitor detailed status and logs for AI agents during workflow execution.

**Independent Test**: Run workflow → Open execution details → View live timeline, logs, errors. Verifies WebSocket updates and telemetry.

### Tests for User Story 5

- [ ] T108 [P] [US5] Unit test: Agent run status transitions and log capture (tests/unit/agent-runner.test.ts)
- [ ] T109 [P] [US5] Integration test: Workflow execution with all agent types (tests/integration/full-workflow.test.ts)
- [ ] T110 [P] [US5] API contract test: GET /api/v1/projects/:id/workflows/:id/executions/:executionId (tests/contract/api/executions.test.ts)
- [ ] T111 [P] [US5] E2E test: Execute workflow → monitor logs → handle failure (tests/e2e/agent-monitoring.cy.ts)

### Implementation for User Story 5

- [ ] T112 [US5] Enhance workflow execution engine: add detailed logging (stdout/stderr capture) in lib/agents/orchestrator.ts
- [ ] T113 [US5] Implement GET /api/v1/projects/:projectId/workflows/:id/executions/:executionId (full execution with agentRuns)
- [ ] T114 [US5] Implement GET /api/v1/projects/:projectId/workflows/:id/executions (list with pagination)
- [ ] T115 [US5] Add retry logic to agent calls with configurable maxAttempts and backoff
- [ ] T116 [US5] Create execution timeline component: components/workflows/execution-timeline.tsx (shows steps with status, duration)
- [ ] T117 [US5] Build logs viewer component: components/workflows/logs-viewer.tsx (syntax-highlighted, scrollable)
- [ ] T118 [US5] Add WebSocket events for agent_run_started, agent_run_completed, agent_run_failed with logs
- [ ] T119 [US5] Implement error details display with stack trace and retry/abort buttons
- [ ] T120 [US5] Add ability to retry a failed step from the UI (POST /api/v1/agent-runs/:id/retry)
- [ ] T121 [US5] Add ability to abort a running execution (POST /api/v1/executions/:id/abort)
- [ ] T122 [US5] Enhance dashboard to show recent workflow executions and their status
- [ ] T123 [US5] Add filtering and search for executions (by status, date, workflow)
- [ ] T124 [US5] Implement audit logging for all execution actions (start, complete, fail, retry) in lib/utils/audit-logger.ts
- [ ] T125 [US5] Add unit tests for retry logic and error handling

**Checkpoint**: All user stories should now be independently functional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T126 [P] Comprehensive accessibility audit: test all pages with screen reader, keyboard navigation, color contrast
- [ ] T127 [P] Performance optimization: implement code splitting with dynamic imports for heavy components (workflow editor, asset gallery)
- [ ] T128 [P] Bundle size analysis with @next/bundle-analyzer; optimize HeroUI imports and tree-shaking
- [ ] T129 [P] Implement image optimization with next/image and configure Supabase Storage domains
- [ ] T130 [P] Add loading skeletons and spinners for all async operations using HeroUI Skeleton
- [ ] T131 [P] Implement error boundaries for client components and user-friendly error pages
- [ ] T132 [P] Add comprehensive error logging with Sentry or similar
- [ ] T133 [P] Write additional unit tests to reach 80%+ coverage (identify gaps)
- [ ] T134 [P] Write additional integration tests for edge cases (large uploads, concurrent edits, agent failures)
- [ ] T135 [P] Add E2E tests for critical user journeys (all 5 user stories)
- [ ] T136 [P] Internationalization: ensure all UI strings are in locale files; add Spanish translations
- [ ] T137 [P] Responsive design testing: ensure dashboard and editor work on tablets
- [ ] T138 [P] Security hardening: implement rate limiting on all API routes, add Helmet.js headers, audit dependencies
- [ ] T139 [P] Database optimization: add missing indexes based on query patterns, analyze slow queries
- [ ] T140 [P] Deploy to Vercel staging environment and run smoke tests
- [ ] T141 [P] Configure Vercel Analytics and monitor Core Web Vitals
- [ ] T142 [P] Update README.md with setup, deployment, and contribution guidelines
- [ ] T143 [P] Create user documentation (how to create workflows, invite team, interpret logs)
- [ ] T144 [P] Run quickstart.md validation: ensure all steps work on fresh environment
- [ ] T145 [P] Final code review and refactoring: eliminate duplication, improve naming, add JSDoc

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 (project context) but should be independently testable
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 for project membership; can be developed in parallel with US2 after project structure exists
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 for project context; can be parallel with US2/US3
- **User Story 5 (P3)**: Can start after US2 (workflow execution) is complete; enhances US2 with observability

### Within Each User Story

- Tests (included) MUST be written and FAIL before implementation
- Models/database layer before API routes
- API routes before UI pages
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T003-T011)
- All Foundational tasks marked [P] can run in parallel (T012-T025)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows), but note dependencies:
  - US1 (T031-T042) is fully independent
  - US2 (T049-T066) depends on US1's project model and API but can start once T036-T037 are done
  - US3 (T072-T086) depends on US1's project membership; can start once T075-T076 are done
  - US4 (T092-T107) depends on US1's project context; can start once T093 is done
  - US5 (T112-T125) depends on US2's execution engine; can start after T059-T060 are done
- All tests for a user story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members, respecting dependencies

---

## Parallel Example: User Story 1

```bash
# Terminal 1: Auth and login page
npm run dev
# Work on T031, T032, T033, T034

# Terminal 2: Database and API
# Work on T014, T035, T036, T037

# Terminal 3: Dashboard UI
# Work on T038, T039, T040, T041

# All can proceed in parallel after foundational tasks T012-T013 are done
```

---

## Notes

- **HeroUI v3**: Use compound components exclusively. No provider needed. Import from `@heroui/react@beta`. Follow semantic variants.
- **Tailwind v4**: Required. Configure PostCSS with `@tailwindcss/postcss`. Import order: Tailwind first, then HeroUI in globals.css.
- **Testing**: Write tests BEFORE implementation (TDD). All tests must pass before merge. Use Jest for unit/integration, Cypress for E2E.
- **TypeScript**: Strict mode. No `any` types. Use Prisma-generated types.
- **Performance**: Monitor bundle size. Use dynamic imports for heavy components. Optimize images with next/image.
- **Security**: All API routes must validate with Zod. Use HTTPS-only cookies. Implement rate limiting.
- **WebSocket**: Separate server process. Use Redis for horizontal scaling. Authenticate with JWT.
- **Database**: Use Prisma migrations. All queries parameterized. Indexes on foreign keys and frequently filtered fields.
- **Spec-Kit**: Workflow steps stored as JSONB with explicit input/output schemas. Ensure reproducibility.
- **i18n**: All user-facing strings in locale JSON files. Use `useTranslations()` hook.

---

## Task Count Summary

- **Phase 1 (Setup)**: 11 tasks
- **Phase 2 (Foundational)**: 14 tasks
- **Phase 3 (US1)**: 17 tasks
- **Phase 4 (US2)**: 24 tasks
- **Phase 5 (US3)**: 20 tasks
- **Phase 6 (US4)**: 21 tasks
- **Phase 7 (US5)**: 14 tasks
- **Phase 8 (Polish)**: 20 tasks

**Total**: 141 tasks

---

## MVP Scope (Suggested)

For the initial MVP, implement:
- Phase 1 (Setup) ✅
- Phase 2 (Foundational) ✅
- Phase 3 (US1: Authentication & Projects) ✅
- Phase 4 (US2: Workflow Definition & Execution) ✅ (core orchestration only, without advanced monitoring)
- Minimal Polish: T126 (accessibility), T131 (error boundaries), T142 (README)

This delivers a working AI Content Studio where users can authenticate, create projects, define workflows (blog, image, video), and execute them with basic status updates.

---

**Version**: 1.0.0 | **Created**: 2026-03-04 | **Based on spec**: 1-ai-content-studio

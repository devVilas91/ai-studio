# Data Model: AI Content Studio

**Feature**: 1-ai-content-studio  
**Date**: 2026-03-04

## Overview

This document defines the database schema for the AI Content Studio using Prisma ORM with PostgreSQL (Supabase). The model uses relational patterns with JSONB columns for flexible data (workflow steps, agent parameters, metadata).

---

## Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id              String            @id @default(cuid())
  email           String            @unique
  name            String?
  avatarUrl       String?
  googleId        String            @unique
  role            Role              @default(VIEWER)
  ownedProjects   Project[]
  projectMembers  ProjectMember[]
  createdAssets   Asset[]
  createdWorkflows Workflow[]
  createdExecutions WorkflowExecution[]
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@index([email])
  @@index([googleId])
}

model Project {
  id          String            @id @default(cuid())
  name        String
  description String?
  owner       User              @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  ownerId     String
  members     ProjectMember[]
  workflows   Workflow[]
  assets      Asset[]
  sessions    CollaborationSession[]
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  @@index([ownerId])
  @@index([createdAt])
}

model ProjectMember {
  id        String   @id @default(cuid())
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  projectId String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String
  role      Role     @default(EDITOR)
  createdAt DateTime @default(now())

  @@unique([projectId, userId])
  @@index([userId])
  @@index([projectId])
}

model Workflow {
  id          String            @id @default(cuid())
  project     Project           @relation(fields: [projectId], references: [id], onDelete: Cascade)
  projectId   String
  name        String
  description String?
  version     Int               @default(1)
  steps       Json              // Array of step definitions
  createdBy   User              @relation(fields: [createdById], references: [id])
  createdById String
  executions  WorkflowExecution[]
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  @@index([projectId])
  @@index([createdById])
  @@index([createdAt])
}

model WorkflowExecution {
  id               String            @id @default(cuid())
  workflow         Workflow          @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  workflowId       String
  triggeredBy      User              @relation(fields: [triggeredById], references: [id])
  triggeredById    String
  status           ExecutionStatus   @default(PENDING)
  currentStep      Int?
  startedAt        DateTime          @default(now())
  completedAt      DateTime?
  agentRuns        AgentRun[]
  logs             String?           // Overall execution logs (JSON or text)
  error            String?

  @@index([workflowId])
  @@index([triggeredById])
  @@index([startedAt])
  @@index([status])
}

model AgentRun {
  id                  String            @id @default(cuid())
  execution           WorkflowExecution @relation(fields: [executionId], references: [id], onDelete: Cascade)
  executionId         String
  stepNumber          Int
  agentType           AgentType
  name                String
  inputSchema         Json              // JSON Schema for input validation
  parameters          Json              // Agent-specific parameters (model, settings)
  outputReferences    Json?             // References to generated assets or data IDs
  status              ExecutionStatus   @default(PENDING)
  startedAt           DateTime          @default(now())
  completedAt         DateTime?
  logs                String?           // Agent stdout/stderr (JSON array or text)
  inputSnapshot       Json?             // Actual input at execution time (resolved from previous steps)
  outputSnapshot      Json?             // Actual output at execution time
  error               String?

  @@unique([executionId, stepNumber])
  @@index([executionId])
  @@index([status])
  @@index([startedAt])
}

model Asset {
  id           String            @id @default(cuid())
  project      Project           @relation(fields: [projectId], references: [id], onDelete: Cascade)
  projectId    String
  filename     String
  fileType     String            // MIME type
  fileSize     Int               // Bytes
  storageUrl   String            // Path in Supabase Storage or S3
  thumbnailUrl String?
  metadata     Json?             // Width, height, duration, format, etc.
  uploadedBy   User              @relation(fields: [uploadedById], references: [id])
  uploadedById String
  createdAt    DateTime          @default(now())

  @@index([projectId])
  @@index([uploadedById])
  @@index([createdAt])
}

model CollaborationSession {
  id           String                  @id @default(cuid())
  project      Project                 @relation(fields: [projectId], references: [id], onDelete: Cascade)
  projectId    String
  participants CollaborationParticipant[]
  lastActivity DateTime                @default(now())
  createdAt    DateTime                @default(now())

  @@index([projectId])
  @@index([lastActivity])
}

model CollaborationParticipant {
  id        String   @id @default(cuid())
  session   CollaborationSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  sessionId String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String
  cursorPositions Json? // { [elementId]: { x, y, selection } }
  joinedAt  DateTime @default(now())

  @@unique([sessionId, userId])
  @@index([userId])
  @@index([sessionId])
}

enum Role {
  OWNER
  EDITOR
  VIEWER
}

enum ExecutionStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
}

enum AgentType {
  BLOG
  IMAGE
  VIDEO
}
```

---

## Entity Relationship Diagram (Text)

```
User (1) ----< (owns) Project (1) ----< (has) Workflow (N)
User (1) ----< ProjectMember (N) >---- (1) Project (N)
User (1) ----< Asset (N)
User (1) ----< WorkflowExecution (N) (as triggeredBy)
User (1) ----< Workflow (N) (as createdBy)

Project (1) ----< Workflow (N)
Project (1) ----< Asset (N)
Project (1) ----< CollaborationSession (N)

Workflow (1) ----< WorkflowExecution (N)
WorkflowExecution (1) ----< AgentRun (N)

CollaborationSession (1) ----< CollaborationParticipant (N)
CollaborationParticipant (N) >---- (1) User (N)
```

---

## JSONB Column Usage

### Workflow.steps
Array of step objects:

```json
[
  {
    "id": "step-1",
    "agentType": "blog",
    "name": "Generate Blog Post",
    "inputSchema": { "type": "object", "properties": { "topic": { "type": "string" } }, "required": ["topic"] },
    "parameters": { "model": "gpt-4", "maxTokens": 2000, "temperature": 0.7 },
    "outputs": [{ "name": "blogContent", "type": "string" }],
    "timeout": 300000,
    "retry": { "maxAttempts": 3, "backoff": "exponential" }
  },
  {
    "id": "step-2",
    "agentType": "image",
    "name": "Create Cinematic Image",
    "inputSchema": { "type": "object", "properties": { "prompt": { "type": "string" } } },
    "parameters": { "model": "dall-e-3", "size": "1792x1024", "style": "cinematic" },
    "outputs": [{ "name": "imageUrl", "type": "string" }],
    "timeout": 180000,
    "retry": { "maxAttempts": 2 }
  }
]
```

### AgentRun.inputSnapshot / outputSnapshot
Captured at execution time:

```json
{
  "topic": "The Future of AI",
  "prompt": "A cinematic scene showing AI robots writing code..."
}
```

### AgentRun.outputReferences
Array of references to assets or data:

```json
[
  { "type": "asset", "id": "asset_123", "name": "blog-post.md" },
  { "type": "asset", "id": "asset_456", "name": "featured-image.png" }
]
```

### Asset.metadata
```json
{
  "width": 1920,
  "height": 1080,
  "format": "png",
  "duration": null,
  "workflowExecutionId": "exec_789"
}
```

### CollaborationParticipant.cursorPositions
```json
{
  "workflow-editor-step-2": { "x": 150, "y": 300, "selection": null },
  "asset-grid": { "x": 400, "y": 200, "selection": ["asset_123"] }
}
```

---

## Migration Strategy

1. **Initial Migration**: Create all tables with indexes and enums.
2. **Future Changes**:
   - Add new columns with `@default` or nullable to avoid downtime.
   - Use `prisma migrate dev` for local development.
   - For production, run `prisma migrate deploy` as part of CI/CD pipeline.
3. **Data Backfills**: Write custom scripts for data migrations that require transformation.

---

## Indexes and Performance

- **User**: `email`, `googleId` (unique)
- **Project**: `ownerId`, `createdAt`
- **ProjectMember**: Composite unique `[projectId, userId]`, indexes on `userId`, `projectId`
- **Workflow**: `projectId`, `createdById`, `createdAt`
- **WorkflowExecution**: `workflowId`, `triggeredById`, `startedAt`, `status`
- **AgentRun**: `executionId`, `status`, `startedAt`; composite unique `[executionId, stepNumber]`
- **Asset**: `projectId`, `uploadedById`, `createdAt`
- **CollaborationSession**: `projectId`, `lastActivity`
- **CollaborationParticipant**: Composite unique `[sessionId, userId]`, indexes on `userId`, `sessionId`

All foreign keys have `onDelete: Cascade` where appropriate to maintain referential integrity.

---

## Enums

- `Role`: OWNER, EDITOR, VIEWER
- `ExecutionStatus`: PENDING, RUNNING, COMPLETED, FAILED
- `AgentType`: BLOG, IMAGE, VIDEO

---

## Constraints and Validation

- **Uniqueness**: `User.email`, `User.googleId`, `ProjectMember.[projectId,userId]`, `AgentRun.[executionId,stepNumber]`, `CollaborationParticipant.[sessionId,userId]`
- **Non-null**: Required fields like `User.email`, `Project.name`, `Workflow.projectId`, etc.
- **Foreign Keys**: All relationships enforced with cascading deletes where appropriate.
- **JSONB**: Flexible schemas validated at application layer using Zod.

---

## Database-Level Security

- Use Supabase Row Level Security (RLS) policies if needed for multi-tenancy. However, since we have application-level authorization, RLS may not be necessary. If used, policies would restrict access based on `projectId` and user membership.
- All queries use Prisma ORM which generates parameterized queries, preventing SQL injection.
- Database user in Supabase should have least privilege: only needed schemas and tables.

---

## Notes for Implementation

- Generate Prisma client: `npx prisma generate`
- Run migrations locally: `npx prisma migrate dev --name init`
- Push to Supabase: `npx prisma db push` (or use migrations)
- In CI/CD: `npx prisma generate && npx prisma migrate deploy`
- Use `prisma studio` for data browsing during development.

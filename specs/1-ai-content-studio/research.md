# Research Report: AI Content Studio

**Feature**: 1-ai-content-studio  
**Date**: 2026-03-04  
**Purpose**: Resolve technical unknowns and make informed technology choices for the AI Content Studio implementation.

---

## 1. HeroUI v3 Component Patterns

**Decision**: Use HeroUI v3 compound components exclusively for all UI elements.

**Rationale**:
- HeroUI v3 is built on Tailwind CSS v4 and React Aria Components, providing excellent accessibility out of the box.
- Compound component pattern (e.g., `<Card><Card.Header>`) offers better composition and flexibility than flat prop APIs.
- No provider required, simplifying app setup.
- Semantic variants (`primary`, `secondary`, `tertiary`, `danger`, `ghost`, `outline`) ensure consistency.

**Key Patterns**:

```tsx
// Card example
import { Card, Button } from "@heroui/react@beta";

<Card>
  <Card.Header>
    <Card.Title>Project Name</Card.Title>
    <Card.Description>Description here</Card.Description>
  </Card.Header>
  <Card.Content>
    {/* Content */}
  </Card.Content>
  <Card.Footer>
    <Button color="primary">Save</Button>
    <Button color="secondary">Cancel</Button>
  </Card.Footer>
</Card>
```

**Installation**:

```bash
npm i @heroui/styles@beta @heroui/react@beta tailwind-variants
# Tailwind v4 required
npm i tailwindcss @tailwindcss/postcss postcss
```

**Configuration**:

`app/globals.css`:
```css
@import "tailwindcss";
@import "@heroui/styles";
```

`postcss.config.mjs`:
```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

**Important**: Always fetch latest component docs from `https://v3.heroui.com/docs/react/components/{component-name}.mdx` before implementing.

**Alternatives Considered**:
- Material-UI: Rejected because HeroUI v3 offers better Tailwind integration and smaller bundle size.
- Shadcn/ui: Rejected because it requires more manual setup and isn't a unified library.

---

## 2. Next.js 14+ App Router API Routes + WebSockets

**Decision**: Use a separate WebSocket server (Node.js with `ws` library) alongside Next.js API routes. Deploy WS server as a separate service on the same domain (e.g., Vercel serverless functions with WebSocket support via `@vercel/websocket` or a separate Railway/Render service).

**Rationale**:
- Next.js API routes are designed for HTTP, not persistent WebSocket connections. While possible to upgrade within an API route, it's not officially supported and can cause issues on serverless platforms like Vercel.
- Vercel's serverless functions have execution time limits and don't support persistent connections well.
- A separate lightweight WS server provides full control over connections, rooms, and real-time events without interfering with HTTP API performance.

**Architecture**:

```
Client (Next.js) ↔ Next.js API Routes (REST) ↔ Supabase
Client (Next.js) ↔ WebSocket Server (ws) ↔ Redis (pub/sub for scaling)
```

**WebSocket Server Implementation**:

```ts
// ws-server.ts
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { publish, subscribe } from './redis-pubsub';

const server = createServer();
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  // Authenticate via JWT token from query string or Sec-WebSocket-Protocol
  const projectId = getProjectIdFromUrl(req.url);
  
  ws.join(projectId); // Room per project
  
  ws.on('message', async (data) => {
    const event = JSON.parse(data);
    // Handle events: workflow_update, cursor_move, asset_uploaded
    await publish(event); // Broadcast to other clients via Redis
  });
});

server.listen(8080);
```

**Integration with Next.js**:
- Next.js API routes handle all REST operations (projects, workflows, assets, agent execution).
- When an API route changes data that requires real-time notification, it publishes to Redis (or uses in-memory event emitter for single instance).
- WebSocket server subscribes to Redis channels and broadcasts to connected clients.
- Client uses a custom hook `useWebSocket(projectId)` to connect and listen for events.

**Alternatives Considered**:
- Supabase Realtime: Could use Postgres replication + Supabase Realtime for database change notifications. However, we need custom events (workflow status, cursor positions) that aren't direct DB changes. Could combine: use Supabase Realtime for DB changes and custom WS server for app-specific events. **Chosen hybrid approach**: Use Supabase Realtime for asset/workflow DB changes (listening to `INSERT/UPDATE`), and custom WS server for collaboration cursors and agent logs. This reduces custom WS load.
- Socket.io: More features but heavier. `ws` is lightweight and sufficient for our needs.

**Decision**: Use **Supabase Realtime** for database change events (assets uploaded, workflow updates) and a **custom WS server** for collaboration (cursors, chat, agent streaming logs). Deploy WS server on a separate service (Railway/Render) with Redis for horizontal scaling.

---

## 3. Supabase + Prisma Integration

**Decision**: Use Prisma ORM with Supabase PostgreSQL. Configure Prisma for connection pooling and use Supabase connection string with pooled mode.

**Rationale**:
- Prisma provides type-safe database access, excellent for TypeScript projects.
- Supabase offers managed PostgreSQL with built-in connection pooling and realtime capabilities.
- Prisma migrations work well with Supabase.

**Prisma Schema Design**:

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
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  avatarUrl     String?
  googleId      String    @unique
  role          Role       @default(VIEWER)
  projects      ProjectMember[]
  createdAssets Asset[]
  createdWorkflows Workflow[]
  createdExecutions WorkflowExecution[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Project {
  id          String   @id @default(cuid())
  name        String
  description String?
  owner       User     @relation(fields: [ownerId], references: [id])
  ownerId     String
  members     ProjectMember[]
  workflows   Workflow[]
  assets      Asset[]
  sessions    CollaborationSession[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
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
}

model Workflow {
  id          String   @id @default(cuid())
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  projectId   String
  name        String
  description String?
  version     Int      @default(1)
  steps       Json     // Array of step definitions: { id, agentType, inputSchema, parameters, ... }
  createdBy   User     @relation(fields: [createdById], references: [id])
  createdById String
  executions  WorkflowExecution[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model WorkflowExecution {
  id               String   @id @default(cuid())
  workflow         Workflow @relation(fields: [workflowId], references: [id])
  workflowId       String
  triggeredBy      User     @relation(fields: [triggeredById], references: [id])
  triggeredById    String
  status           ExecutionStatus @default(PENDING)
  currentStep      Int?
  startedAt        DateTime @default(now())
  completedAt      DateTime?
  agentRuns        AgentRun[]
  logs             String?  // Overall execution logs
  error            String?
}

model AgentRun {
  id                  String   @id @default(cuid())
  execution           WorkflowExecution @relation(fields: [executionId], references: [id], onDelete: Cascade)
  executionId         String
  stepNumber          Int
  agentType           AgentType
  name                String
  inputSchema         Json     // JSON Schema for input validation
  parameters          Json     // Agent-specific parameters
  outputReferences    Json?    // References to generated assets or data
  status              ExecutionStatus @default(PENDING)
  startedAt           DateTime @default(now())
  completedAt         DateTime?
  logs                String?  // Agent stdout/stderr
  inputSnapshot       Json?    // Actual input at execution time
  outputSnapshot      Json?    // Actual output at execution time
  error               String?
}

model Asset {
  id           String   @id @default(cuid())
  project      Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  projectId    String
  filename     String
  fileType     String   // MIME type
  fileSize     Int
  storageUrl   String   // Supabase storage URL or S3
  thumbnailUrl String?
  metadata     Json?    // Width, height, duration, etc.
  uploadedBy   User     @relation(fields: [uploadedById], references: [id])
  uploadedById String
  createdAt    DateTime @default(now())
}

model CollaborationSession {
  id           String   @id @default(cuid())
  project      Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  projectId    String
  participants CollaborationParticipant[]
  lastActivity DateTime @default(now())
}

model CollaborationParticipant {
  id        String   @id @default(cuid())
  session   CollaborationSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  sessionId String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String
  cursorPositions Json? // { [elementId]: { x, y, selection } }
  joinedAt  DateTime @default(now())
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

**Connection Pooling**:

Supabase provides connection pooling via `pooler` connection string. Use:

```
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:6543/[DB]?pgbouncer=true"
```

In Prisma, ensure connection pool settings:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Migrations**:

- Develop locally with `prisma migrate dev`.
- For production (Vercel), use `prisma migrate deploy` during build or a separate migration step.
- Store migration history in Supabase DB.

**Alternatives Considered**:
- Direct Supabase client (no Prisma): Rejected because we want type-safe, schema-driven development and migrations.
- MongoDB: Already rejected in favor of PostgreSQL.

---

## 4. NextAuth.js with Google OAuth in Next.js App Router

**Decision**: Use NextAuth.js v5 (beta) which supports App Router natively, or use the stable v4 with App Router adapter.

**Rationale**:
- NextAuth.js is the standard authentication library for Next.js.
- v5 (beta) has first-class App Router support with `auth.ts` configuration.
- Google OAuth provider is well-supported.

**Setup**:

```bash
npm i next-auth@beta
```

`app/api/auth/[...nextauth]/route.ts`:

```ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      session.user.id = token.sub;
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role; // from DB
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
});
```

`middleware.ts`:

```ts
import { auth } from "@/auth";

export default auth((req) => {
  // Protected routes
  if (req.nextUrl.pathname.startsWith("/dashboard") || req.nextUrl.pathname.startsWith("/projects")) {
    return req.auth ? null : { redirect: new URL("/login", req.url) };
  }
});

export const config = {
  matcher: ["/dashboard/:path*", "/projects/:path*", "/api/v1/:path*"],
};
```

**JWT Strategy**:
- Access token: 15 minutes
- Refresh token: 7 days (stored in HTTP-only cookie)
- Use `next-auth/jwt` to decode token in API routes: `const token = await auth();`

**Database Adapter**: Not needed since we're using JWT. User data stored in token; fetch full user from DB when needed using `token.sub`.

**Alternatives Considered**:
- Clerk/Auth0: Too heavy; we want simple Google OAuth only.
- Custom OAuth: Reinventing the wheel; NextAuth is battle-tested.

---

## 5. AI Agent Orchestration Patterns

**Decision**: Use a queue-based orchestration with BullMQ (Redis) or Upstash for durable job queues. For simpler MVP, start with in-memory execution with background tasks in Next.js API routes using `setTimeout`/`Promise` and store state in DB.

**Rationale**:
- Workflows need to execute sequentially, with each step depending on previous output.
- Need retry logic, timeouts, and error handling.
- Need to persist execution state in DB for recovery and observability.
- BullMQ provides robust queueing, retries, and progress tracking. However, it requires Redis. Upstash offers serverless Redis compatible with Vercel.

**Simplified MVP Architecture**:

```ts
// app/api/v1/workflows/[id]/execute/route.ts
export async function POST(req: Request) {
  const { workflowId } = await req.json();
  
  // Create WorkflowExecution record in DB (status: PENDING)
  const execution = await prisma.workflowExecution.create({
    data: { workflowId, triggeredById: user.id, status: "PENDING" },
  });
  
  // Kick off background execution (fire-and-forget)
  executeWorkflow(execution.id);
  
  return NextResponse.json({ success: true, executionId: execution.id });
}

async function executeWorkflow(executionId: string) {
  const execution = await prisma.workflowExecution.findUnique({ where: { id: executionId } });
  const workflow = await prisma.workflow.findUnique({ where: { id: execution.workflowId } });
  
  await prisma.workflowExecution.update({
    where: { id: executionId },
    data: { status: "RUNNING" },
  });
  
  for (let i = 0; i < workflow.steps.length; i++) {
    const step = workflow.steps[i];
    
    // Create AgentRun record
    const run = await prisma.agentRun.create({
      data: {
        executionId,
        stepNumber: i,
        agentType: step.agentType,
        name: step.name,
        inputSchema: step.inputSchema,
        parameters: step.parameters,
        status: "RUNNING",
      },
    });
    
    try {
      // Call AI agent (external API or internal function)
      const output = await callAgent(step.agentType, step.parameters, getInputData(i));
      
      await prisma.agentRun.update({
        where: { id: run.id },
        data: { status: "COMPLETED", outputSnapshot: output, completedAt: new Date() },
      });
      
      // Store output as asset or pass to next step
      await storeOutput(output, i);
      
      // Broadcast real-time update via WebSocket
      broadcastToProject(workflow.projectId, {
        type: "agent_run_completed",
        executionId,
        stepNumber: i,
        output,
      });
      
    } catch (error) {
      await prisma.agentRun.update({
        where: { id: run.id },
        data: { status: "FAILED", error: error.message, completedAt: new Date() },
      });
      await prisma.workflowExecution.update({
        where: { id: executionId },
        data: { status: "FAILED", error: error.message },
      });
      broadcastToProject(workflow.projectId, {
        type: "execution_failed",
        executionId,
        stepNumber: i,
        error: error.message,
      });
      return; // Stop workflow on failure (or implement retry)
    }
  }
  
  await prisma.workflowExecution.update({
    where: { id: executionId },
    data: { status: "COMPLETED", completedAt: new Date() },
  });
}
```

**Agent Types**:
- **Blog Generator**: Call OpenAI GPT-4 or similar to generate article from topic. Returns markdown text.
- **Image Creator**: Call DALL-E 3, Midjourney, or Stable Diffusion to generate cinematic image from blog summary. Returns image URL.
- **Video Orchestrator**: Call Runway, Pika, or similar to generate short video from image + script. Returns video URL.

**Spec-Kit Schema**: Workflow steps stored as JSON with explicit input/output definitions:

```json
{
  "steps": [
    {
      "id": "step-1",
      "agentType": "blog",
      "name": "Generate Blog Post",
      "inputSchema": { "type": "object", "properties": { "topic": { "type": "string" } } },
      "parameters": { "model": "gpt-4", "maxTokens": 2000 },
      "outputs": [{ "name": "blogContent", "type": "string" }]
    },
    {
      "id": "step-2",
      "agentType": "image",
      "name": "Create Cinematic Image",
      "inputSchema": { "type": "object", "properties": { "prompt": { "type": "string" } } },
      "parameters": { "size": "1920x1080", "style": "cinematic" },
      "outputs": [{ "name": "imageUrl", "type": "string" }]
    }
  ]
}
```

**Alternatives Considered**:
- Temporal.io: Overkill for MVP; too complex.
- Custom state machine: Simpler but less robust; chosen for MVP with plan to migrate to BullMQ if needed.

---

## 6. Asset Upload & Storage

**Decision**: Use Supabase Storage for file uploads with Vercel Blob as alternative. Generate thumbnails using a Next.js API route with `sharp` library.

**Rationale**:
- Supabase Storage integrates seamlessly with Supabase DB and provides CDN.
- Vercel Blob is another good option but less integrated with Supabase.
- Thumbnail generation on upload: use `sharp` in an API route triggered after upload.

**Upload Flow**:

1. Client requests signed upload URL from Next.js API (`/api/v1/assets/upload-url`).
2. API generates a signed URL from Supabase Storage (or Vercel Blob) with limited TTL.
3. Client uploads directly to storage (bypassing Next.js server, good for large files).
4. Storage triggers a webhook (or client notifies API after upload) to create Asset record in DB and generate thumbnail.
5. Thumbnail generation: download file (or use storage object), process with `sharp`, upload thumbnail back to storage.

**Implementation**:

```ts
// app/api/v1/assets/route.ts
export async function POST(req: Request) {
  const { filename, filetype, projectId } = await req.json();
  
  // Generate unique filename
  const key = `${projectId}/${Date.now()}-${filename}`;
  
  // Get signed URL from Supabase
  const { data, error } = await supabase.storage
    .from('assets')
    .createSignedUploadUrl(key, { expiresIn: 3600 });
  
  if (error) throw error;
  
  // Create Asset record with status "uploading"
  const asset = await prisma.asset.create({
    data: {
      projectId,
      filename,
      fileType: filetype,
      fileSize: 0, // will update after upload
      storageUrl: key,
      uploadedById: user.id,
    },
  });
  
  return NextResponse.json({ success: true, uploadUrl: data.signedUrl, assetId: asset.id });
}

// Webhook or callback after upload
export async function completeUpload(assetId: string, size: number) {
  await prisma.asset.update({
    where: { id: assetId },
    data: { fileSize: size },
  });
  
  // Generate thumbnail if image/video
  if (isImageOrVideo(filetype)) {
    await generateThumbnail(assetId);
  }
}
```

**Thumbnail Generation**:

```ts
async function generateThumbnail(assetId: string) {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  const file = await downloadFromStorage(asset.storageUrl);
  const thumbnail = await sharp(file)
    .resize(300, 300, { fit: "cover" })
    .toBuffer();
  await uploadThumbnailToStorage(assetId, thumbnail);
  await prisma.asset.update({
    where: { id: assetId },
    data: { thumbnailUrl: thumbnailKey },
  });
}
```

**Large File Support**: Direct upload to storage handles up to 5GB. Show progress bar using `axios` or `fetch` with `onUploadProgress`.

**Alternatives Considered**:
- Upload through Next.js API: Not recommended for large files; serverless functions have size limits.
- S3: Similar to Supabase; Supabase chosen for integration.

---

## 7. Real-time Collaboration Conflict Resolution

**Decision**: For MVP, use **last-write-wins** with operational transformation for text (if needed). For workflow editing, use version numbers and optimistic locking.

**Rationale**:
- Full CRDTs are complex and may be overkill for MVP.
- Workflow editing is not as concurrent as a Google Docs scenario; conflicts are rare.
- We can detect conflicts using `updatedAt` timestamps and prompt user to resolve.

**Collaboration Strategy**:

- **Cursors**: Broadcast cursor positions via WebSocket without persistence. No conflict resolution needed.
- **Workflow Editing**: When saving a workflow, check `updatedAt` against the version the user started editing. If mismatch, reject save and ask user to merge manually (show diff).
- **Asset Uploads**: No conflict; multiple users can upload to same project; assets are independent.

**WebSocket Events**:

```ts
// Client sends
{ type: "cursor_move", projectId, userId, cursorPositions }

// Server broadcasts to project room
{ type: "cursor_update", userId, cursorPositions }

// Workflow update
{ type: "workflow_updated", workflowId, changes, updatedBy, updatedAt }
```

**Optimistic Updates**: When user edits workflow, apply change locally and broadcast. If server rejects due to conflict, revert and show error.

**Alternatives Considered**:
- Yjs/CRDT: Powerful but adds complexity; defer to later phase if needed.

---

## 8. Performance Optimization for Next.js + HeroUI

**Decision**: Follow Next.js 14 App Router best practices: dynamic imports for heavy components, `next/image` for images, font optimization, and Tailwind v4's content scanning for minimal CSS.

**Rationale**:
- HeroUI v3 with Tailwind v4 produces optimized CSS with no runtime overhead.
- Next.js 14 offers partial prerendering, server components, and streaming.

**Optimization Checklist**:

- [ ] Use `next/font` for optimized font loading.
- [ ] Use `next/image` with Supabase Storage URLs (configure domains in `next.config.js`).
- [ ] Dynamic import for heavy components (e.g., workflow editor, asset gallery):
  ```tsx
  const WorkflowEditor = dynamic(() => import("@/components/workflows/editor"), { ssr: false });
  ```
- [ ] Route-based code splitting: Next.js does this automatically.
- [ ] Avoid client-side state bloat; use Zustand with selective subscriptions.
- [ ] Use `useMemo`/`useCallback` for expensive computations in React components.
- [ ] Implement virtualization for long lists (assets table) using `react-window` or `tanstack-virtual`.
- [ ] Monitor bundle size with `@next/bundle-analyzer`.
- [ ] Enable Vercel Analytics for Core Web Vitals.

**Tailwind v4**: Uses CSS-first approach with `@import` and content scanning. Ensure `tailwind.config.js` (if needed) is minimal.

**HeroUI Tree-shaking**: Import only needed components:
```tsx
import { Button, Card, Modal } from "@heroui/react@beta";
```

**Alternatives Considered**:
- React Server Components: Use where possible (read-only pages). Client components only for interactive parts.

---

## 9. Additional Technical Decisions

### Internationalization

**Decision**: Use `next-intl` for Next.js App Router i18n.

```bash
npm i next-intl
```

Configuration in `i18n.ts` and middleware. Locale files in `messages/en.json`, `messages/es.json`.

### Validation

**Decision**: Use Zod for all API input validation and schema definitions.

```ts
const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});
```

### State Management

**Decision**: Use Zustand for global state (user session, project context, collaboration state). Keep it minimal; rely on React server components and URL state where possible.

### File Structure for Components

Follow domain-driven structure:
```
components/
├── ui/           # HeroUI wrappers if customization needed
├── layout/       # Header, Sidebar, Footer
├── projects/     # Project list, project card
├── workflows/    # Workflow editor, step components, execution view
├── assets/       # Asset grid, upload widget, preview modal
└── collaboration/ # Cursor overlay, presence indicators
```

---

## Summary of Decisions

| Area | Decision | Key Technology |
|------|----------|----------------|
| UI Library | HeroUI v3 compound components | @heroui/react@beta, Tailwind v4 |
| WebSockets | Separate WS server + Supabase Realtime | ws, Redis, Supabase Realtime |
| Database | Prisma ORM with Supabase PostgreSQL | Prisma, Supabase |
| Auth | NextAuth.js v5 (beta) with Google OAuth | next-auth@beta |
| Orchestration | In-memory sequential execution (MVP) | Prisma + background tasks |
| Storage | Supabase Storage + thumbnail generation | @supabase/storage-client, sharp |
| Collaboration | Last-write-wins with optimistic locking | WebSocket, version checks |
| i18n | next-intl | next-intl |
| Validation | Zod | zod |
| State | Zustand (minimal) | zustand |
| Performance | Next.js 14 best practices, dynamic imports | next/image, next/font, dynamic |

All decisions align with the constitution principles: TypeScript-first, test-first, UX consistency (HeroUI), performance targets, security (Zod, JWT, parameterized queries), and code quality.

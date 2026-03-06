# API Contracts (REST)

**Base URL**: `/api/v1`
**Authentication**: JWT Bearer token in `Authorization: Bearer <token>` header
**Response Envelope**: All responses follow `{ success: boolean, data?: T, error?: { code: string, message: string, details?: any } }`

---

## Projects

### List Projects

**GET** `/projects`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string?",
      "owner": { "id": "string", "name": "string", "email": "string" },
      "role": "OWNER|EDITOR|VIEWER",
      "createdAt": "2026-03-04T00:00:00Z",
      "updatedAt": "2026-03-04T00:00:00Z"
    }
  ]
}
```

### Create Project

**POST** `/projects`

**Request**:
```json
{
  "name": "string (1-100 chars)",
  "description": "string? (max 500 chars)"
}
```

**Response**: `201 Created` with project object (including `id`, `ownerId`, etc.)

### Get Project

**GET** `/projects/:id`

**Response**: Project object with `members` array (users with roles).

### Update Project

**PATCH** `/projects/:id`

**Request**: Partial project fields (name, description). Role check: only owner/editor.

**Response**: Updated project object.

### Delete Project

**DELETE** `/projects/:id`

**Response**: `204 No Content`. Only owner can delete.

### List Project Members

**GET** `/projects/:id/members`

**Response**:
```json
{
  "success": true,
  "data": [
    { "userId": "string", "email": "string", "name": "string", "role": "OWNER|EDITOR|VIEWER" }
  ]
}
```

### Invite Member

**POST** `/projects/:id/invite`

**Request**:
```json
{
  "email": "string",
  "role": "EDITOR|VIEWER"
}
```

**Response**: `200 OK` with invitation details. Sends email invite (or auto-accept if same domain).

### Remove Member

**DELETE** `/projects/:id/members/:userId`

**Response**: `204 No Content`. Only owner can remove.

---

## Workflows

### List Workflows

**GET** `/projects/:projectId/workflows`

**Response**: Array of workflow summaries (id, name, description, version, createdAt, createdBy).

### Get Workflow

**GET** `/projects/:projectId/workflows/:id`

**Response**: Full workflow object including `steps` array.

### Create Workflow

**POST** `/projects/:projectId/workflows`

**Request**:
```json
{
  "name": "string",
  "description": "string?",
  "steps": [
    {
      "id": "string (unique within workflow)",
      "agentType": "BLOG|IMAGE|VIDEO",
      "name": "string",
      "inputSchema": { "type": "object", "properties": {}, "required": [] },
      "parameters": { /* agent-specific */ },
      "outputs": [{ "name": "string", "type": "string" }],
      "timeout": 300000,
      "retry": { "maxAttempts": 3, "backoff": "exponential" }
    }
  ]
}
```

**Response**: Created workflow object with `id`, `version: 1`.

### Update Workflow

**PATCH** `/projects/:projectId/workflows/:id`

**Request**: Partial updates to name, description, steps. Increments `version` on each update.

**Response**: Updated workflow.

### Delete Workflow

**DELETE** `/projects/:projectId/workflows/:id`

**Response**: `204 No Content`.

### Execute Workflow

**POST** `/projects/:projectId/workflows/:id/execute`

**Request**:
```json
{
  "input": { /* initial input matching first step's inputSchema */ }
}
```

**Response**: `202 Accepted` with `{ executionId: string, status: "PENDING" }`. Execution runs asynchronously.

### List Executions

**GET** `/projects/:projectId/workflows/:id/executions`

**Response**: Array of execution summaries (id, status, startedAt, completedAt, triggeredBy).

### Get Execution

**GET** `/projects/:projectId/workflows/:id/executions/:executionId`

**Response**: Full execution object with nested `agentRuns` array.

---

## Assets

### List Assets

**GET** `/projects/:projectId/assets?page=1&limit=50&type=image/video&workflowExecutionId=string`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "filename": "string",
      "fileType": "string",
      "fileSize": 12345,
      "storageUrl": "string",
      "thumbnailUrl": "string?",
      "metadata": { "width": 1920, "height": 1080, "duration": null },
      "createdAt": "2026-03-04T00:00:00Z",
      "uploadedBy": { "id": "string", "name": "string" }
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 50
}
```

### Get Asset

**GET** `/projects/:projectId/assets/:id`

**Response**: Asset object with full metadata.

### Upload Asset (initiate)

**POST** `/projects/:projectId/assets/upload-url`

**Request**:
```json
{
  "filename": "string",
  "filetype": "string (MIME type)",
  "workflowExecutionId": "string?"
}
```

**Response**:
```json
{
  "success": true,
  "uploadUrl": "string (signed URL to storage)",
  "assetId": "string",
  "expiresAt": "2026-03-04T01:00:00Z"
}
```

Client then PUTs file directly to `uploadUrl`. After upload, client calls `POST /projects/:projectId/assets/:id/complete` to finalize.

### Complete Upload

**POST** `/projects/:projectId/assets/:id/complete`

**Request**:
```json
{
  "size": 12345,
  "metadata": { /* optional additional metadata */ }
}
```

**Response**: Asset object with updated `fileSize`, `metadata`, `thumbnailUrl` (if generated).

### Delete Asset

**DELETE** `/projects/:projectId/assets/:id`

**Response**: `204 No Content`.

---

## Collaborations

### Get Session

**GET** `/projects/:projectId/collaboration/session`

**Response**:
```json
{
  "success": true,
  "sessionId": "string",
  "participants": [
    { "userId": "string", "name": "string", "avatarUrl": "string?", "cursorPositions": {} }
  ]
}
```

### Update Cursor

**POST** `/projects/:projectId/collaboration/cursor`

**Request**:
```json
{
  "elementId": "string",
  "position": { "x": 100, "y": 200 },
  "selection": "string?"
}
```

**Response**: `200 OK`. Broadcasted via WebSocket to other participants.

---

## Agents

### List Agent Types

**GET** `/agents`

**Response**:
```json
{
  "success": true,
  "data": [
    { "type": "BLOG", "name": "Blog Generator", "description": "Generates blog posts from topics", "parameters": { "model": "gpt-4", "maxTokens": 2000 } },
    { "type": "IMAGE", "name": "Image Creator", "description": "Creates cinematic images", "parameters": { "model": "dall-e-3", "size": "1792x1024" } },
    { "type": "VIDEO", "name": "Video Orchestrator", "description": "Generates short videos", "parameters": { "model": "runway-gen2", "duration": 5 } }
  ]
}
```

### Test Agent (admin/debug)

**POST** `/agents/:type/test`

**Request**: Input parameters for the agent.

**Response**: Agent output (or error). Not for production client use.

---

## Error Codes

| Code | Meaning | HTTP Status |
|------|---------|-------------|
| `UNAUTHORIZED` | Missing or invalid JWT | 401 |
| `FORBIDDEN` | Insufficient permissions | 403 |
| `NOT_FOUND` | Resource not found | 404 |
| `VALIDATION_ERROR` | Request body fails Zod validation | 400 |
| `CONFLICT` | Workflow version conflict | 409 |
| `RATE_LIMITED` | Too many requests | 429 |
| `INTERNAL_ERROR` | Server error | 500 |
| `AGENT_FAILED` | AI agent execution failed | 500 |

---

## Rate Limiting

- Per-user: 100 requests/minute for most endpoints.
- Upload endpoints: 10 requests/minute.
- Implement using `upstash/ratelimit` or similar in Next.js middleware.

---

## Pagination

For list endpoints, use query params `page` (default 1), `limit` (default 50, max 100). Response includes `total`, `page`, `limit`.

---

## Sorting

Use query params `sortBy` (field name) and `order` (`asc`|`desc`). Default: `createdAt desc`.

---

## Filtering

Use query params like `type=image`, `uploadedBy=userId`, `status=PENDING`. Combine with AND logic.

---

## Notes

- All timestamps in ISO 8601 UTC.
- IDs are CUID strings (or UUIDs).
- Use `application/json` content type.
- Enable CORS to allow only the deployed Vercel domain.

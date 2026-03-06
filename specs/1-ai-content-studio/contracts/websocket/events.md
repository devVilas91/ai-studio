# WebSocket Contracts

**Connection**: `wss://<domain>/api/websocket?token=<JWT>`
**Authentication**: JWT token passed as query parameter or via `Sec-WebSocket-Protocol` header.
**Rooms**: Each project has a room. Clients join the room for their project to receive updates.

---

## Message Format

All messages are JSON objects with a `type` field.

### Client → Server

#### Join Project Room

```json
{
  "type": "join_project",
  "projectId": "string"
}
```

**Server response**: `{ type: "joined", projectId: "string" }`

#### Leave Project Room

```json
{
  "type": "leave_project",
  "projectId": "string"
}
```

#### Cursor Update

```json
{
  "type": "cursor_update",
  "projectId": "string",
  "elementId": "string",
  "position": { "x": 100, "y": 200 },
  "selection": "string?"
}
```

**Server broadcast to other participants in project**:
```json
{
  "type": "cursor_update",
  "userId": "string",
  "userName": "string",
  "elementId": "string",
  "position": { "x": 100, "y": 200 },
  "selection": "string?"
}
```

#### Workflow Edit (broadcast)

```json
{
  "type": "workflow_edit",
  "projectId": "string",
  "workflowId": "string",
  "changes": { /* partial update */ },
  "version": 3
}
```

**Server validation**: Check user has EDITOR role. Broadcast to all other participants in project.

If version conflict detected (client's version is stale), server responds:
```json
{
  "type": "conflict",
  "message": "Workflow was updated by another user. Please refresh.",
  "latestVersion": 4,
  "latestData": { /* full workflow */ }
}
```

---

### Server → Client

#### Workflow Execution Started

```json
{
  "type": "execution_started",
  "executionId": "string",
  "workflowId": "string",
  "startedAt": "2026-03-04T00:00:00Z"
}
```

#### Agent Run Started

```json
{
  "type": "agent_run_started",
  "executionId": "string",
  "stepNumber": 0,
  "agentType": "BLOG",
  "name": "Generate Blog Post",
  "startedAt": "2026-03-04T00:00:00Z"
}
```

#### Agent Run Completed

```json
{
  "type": "agent_run_completed",
  "executionId": "string",
  "stepNumber": 0,
  "agentType": "BLOG",
  "outputSnapshot": { /* output data */ },
  "completedAt": "2026-03-04T00:00:00Z"
}
```

#### Agent Run Failed

```json
{
  "type": "agent_run_failed",
  "executionId": "string",
  "stepNumber": 0,
  "agentType": "BLOG",
  "error": "Error message",
  "logs": "string?",
  "completedAt": "2026-03-04T00:00:00Z"
}
```

#### Workflow Execution Completed

```json
{
  "type": "execution_completed",
  "executionId": "string",
  "completedAt": "2026-03-04T00:00:00Z",
  "outputs": { /* final outputs */ }
}
```

#### Workflow Execution Failed

```json
{
  "type": "execution_failed",
  "executionId": "string",
  "error": "Error message",
  "failedStep": 0,
  "completedAt": "2026-03-04T00:00:00Z"
}
```

#### Asset Uploaded (via Supabase Realtime or custom WS)

```json
{
  "type": "asset_uploaded",
  "asset": {
    "id": "string",
    "filename": "string",
    "fileType": "string",
    "storageUrl": "string",
    "thumbnailUrl": "string?",
    "createdAt": "2026-03-04T00:00:00Z",
    "uploadedBy": { "id": "string", "name": "string" }
  }
}
```

#### User Joined Project

```json
{
  "type": "user_joined",
  "userId": "string",
  "userName": "string",
  "avatarUrl": "string?"
}
```

#### User Left Project

```json
{
  "type": "user_left",
  "userId": "string"
}
```

---

## Error Messages

Server can send error messages:

```json
{
  "type": "error",
  "code": "UNAUTHORIZED|FORBIDDEN|VALIDATION_ERROR",
  "message": "Human-readable error"
}
```

---

## Heartbeat

Clients should send ping every 30 seconds:

```json
{ "type": "ping" }
```

Server responds:

```json
{ "type": "pong" }
```

If no pong received, client should reconnect with exponential backoff.

---

## Reconnection

On disconnect, client should:
1. Wait 1s, then reconnect.
2. If fails, exponential backoff up to 30s.
3. Re-authenticate with JWT.
4. Rejoin project rooms that were previously joined (store in localStorage).

---

## Notes

- All messages must be JSON-serializable.
- Keep messages small; avoid sending large payloads (use REST fetch for full data).
- Use `type` field discriminator for TypeScript union types.
- Broadcast only to relevant project room; avoid global broadcasts.

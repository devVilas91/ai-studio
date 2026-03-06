# Validation Schemas (Zod)

All request bodies and query parameters validated using Zod.

---

## Project Schemas

```ts
import { z } from "zod";

export const CreateProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  description: z.string().max(500, "Description too long").optional(),
});

export const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

export const InviteMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["OWNER", "EDITOR", "VIEWER"]).default("VIEWER"),
});
```

---

## Workflow Schemas

```ts
export const WorkflowStepSchema = z.object({
  id: z.string().min(1),
  agentType: z.enum(["BLOG", "IMAGE", "VIDEO"]),
  name: z.string().min(1).max(200),
  inputSchema: z.any(), // TODO: Validate as JSON Schema
  parameters: z.record(z.any()),
  outputs: z.array(z.object({ name: z.string(), type: z.string() })),
  timeout: z.number().int().positive().optional().default(300000),
  retry: z
    .object({
      maxAttempts: z.number().int().positive().default(3),
      backoff: z.enum(["linear", "exponential"]).default("exponential"),
    })
    .optional()
    .default({ maxAttempts: 3, backoff: "exponential" }),
});

export const CreateWorkflowSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  steps: z.array(WorkflowStepSchema).min(1, "At least one step required"),
});

export const UpdateWorkflowSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  steps: z.array(WorkflowStepSchema).min(1).optional(),
});

export const ExecuteWorkflowSchema = z.object({
  input: z.record(z.any()).optional().default({}),
});
```

---

## Asset Schemas

```ts
export const UploadUrlRequestSchema = z.object({
  filename: z.string().min(1),
  filetype: z.string().min(1), // MIME type
  workflowExecutionId: z.string().optional(),
});

export const CompleteUploadSchema = z.object({
  size: z.number().int().positive(),
  metadata: z.record(z.any()).optional(),
});
```

---

## Collaboration Schemas

```ts
export const CursorUpdateSchema = z.object({
  elementId: z.string().min(1),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  selection: z.string().optional(),
});
```

---

## Agent Schemas

```ts
export const AgentTestSchema = z.object({
  // Dynamic based on agent type; use discriminated union
  agentType: z.enum(["BLOG", "IMAGE", "VIDEO"]),
  parameters: z.record(z.any()),
});
```

---

## Response Envelope

All API responses should conform to:

```ts
export const ApiResponseSchema = <T>(dataSchema: z.ZodType<T>) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z
      .object({
        code: z.string(),
        message: z.string(),
        details: z.any().optional(),
      })
      .optional(),
  });
```

Usage:

```ts
const ProjectListResponse = ApiResponseSchema(z.array(ProjectSchema));
```

---

## Notes

- Input schemas for workflow steps should be validated at runtime using Zod's `safeParse` with the provided JSON Schema.
- For JSON Schema validation, consider using `@zodijs/zod-openapi` or custom validator.
- All timestamps validated as ISO strings using `z.string().datetime()`.

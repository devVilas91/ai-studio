# Agent Contracts (Spec-Kit Schemas)

Each AI agent defines a reproducible Spec-Kit schema with explicit input and output definitions. This ensures workflows are portable and understandable.

---

## Blog Generator Agent

**Type**: `BLOG`

**Description**: Generates a blog post from a topic or outline using a language model.

**Input Schema** (JSON Schema):

```json
{
  "type": "object",
  "properties": {
    "topic": { "type": "string", "description": "Blog post topic" },
    "outline": { "type": "array", "items": { "type": "string" }, "description": "Optional outline sections" },
    "tone": { "type": "string", "enum": ["professional", "casual", "technical", "creative"], "default": "professional" },
    "wordCount": { "type": "number", "minimum": 100, "maximum": 5000, "default": 1000 }
  },
  "required": ["topic"]
}
```

**Parameters** (agent configuration):

```json
{
  "model": "gpt-4",
  "maxTokens": 2000,
  "temperature": 0.7,
  "topP": 0.9
}
```

**Output**:

```json
{
  "type": "object",
  "properties": {
    "content": { "type": "string", "description": "Markdown content of the blog post" },
    "title": { "type": "string", "description": "Generated title" },
    "summary": { "type": "string", "description": "Short summary" },
    "wordCount": { "type": "number" },
    "tokensUsed": { "type": "number" }
  },
  "required": ["content", "title"]
}
```

**Output References** (stored as Asset):
- `blogContent`: stored as text file (`.md`) in asset storage.

---

## Image Creator Agent

**Type**: `IMAGE`

**Description**: Generates a cinematic image from a text prompt using an image generation model.

**Input Schema**:

```json
{
  "type": "object",
  "properties": {
    "prompt": { "type": "string", "description": "Detailed image description" },
    "style": { "type": "string", "enum": ["cinematic", "photorealistic", "artistic", "anime"], "default": "cinematic" },
    "size": { "type": "string", "enum": ["1024x1024", "1792x1024", "1024x1792"], "default": "1792x1024" },
    "numImages": { "type": "number", "minimum": 1, "maximum": 4, "default": 1 }
  },
  "required": ["prompt"]
}
```

**Parameters**:

```json
{
  "model": "dall-e-3",
  "quality": "hd",
  "n": 1
}
```

**Output**:

```json
{
  "type": "object",
  "properties": {
    "imageUrls": { "type": "array", "items": { "type": "string" } },
    "revisedPrompt": { "type": "string", "description": "Prompt as enhanced by the model" },
    "size": { "type": "string" },
    "createdAt": { "type": "string", "format": "date-time" }
  },
  "required": ["imageUrls"]
}
```

**Output References**:
- Each URL stored as an Asset (image file) in storage.

---

## Video Orchestrator Agent

**Type**: `VIDEO`

**Description**: Generates a short video from an image and optional script/audio using a video generation model.

**Input Schema**:

```json
{
  "type": "object",
  "properties": {
    "imageUrl": { "type": "string", "description": "Source image URL (from previous step)" },
    "prompt": { "type": "string", "description": "Motion description" },
    "duration": { "type": "number", "minimum": 2, "maximum": 10, "default": 5 },
    "fps": { "type": "number", "enum": [24, 30, 60], "default": 30 }
  },
  "required": ["imageUrl", "prompt"]
}
```

**Parameters**:

```json
{
  "model": "runway-gen2",
  "motionIntensity": 5,
  "seed": null
}
```

**Output**:

```json
{
  "type": "object",
  "properties": {
    "videoUrl": { "type": "string" },
    "thumbnailUrl": { "type": "string" },
    "duration": { "type": "number" },
    "fps": { "type": "number" },
    "createdAt": { "type": "string", "format": "date-time" }
  },
  "required": ["videoUrl", "thumbnailUrl"]
}
```

**Output References**:
- `videoUrl`: stored as video asset.
- `thumbnailUrl`: stored as image asset.

---

## Agent Registry

The system maintains a registry of available agent types with their schemas:

```ts
const AGENT_REGISTRY = {
  BLOG: {
    name: "Blog Generator",
    description: "Generates blog posts from topics",
    inputSchema: BlogInputSchema,
    outputSchema: BlogOutputSchema,
    defaultParameters: { model: "gpt-4", maxTokens: 2000, temperature: 0.7 },
  },
  IMAGE: {
    name: "Image Creator",
    description: "Creates cinematic images from prompts",
    inputSchema: ImageInputSchema,
    outputSchema: ImageOutputSchema,
    defaultParameters: { model: "dall-e-3", quality: "hd", n: 1 },
  },
  VIDEO: {
    name: "Video Orchestrator",
    description: "Generates short videos from images",
    inputSchema: VideoInputSchema,
    outputSchema: VideoOutputSchema,
    defaultParameters: { model: "runway-gen2", motionIntensity: 5 },
  },
};
```

---

## Spec-Kit Compatibility

Workflow definitions are stored as JSON with the following structure, making them reproducible and portable:

```json
{
  "specVersion": "1.0",
  "name": "Blog to Video Pipeline",
  "description": "Generates blog, image, and video",
  "steps": [
    {
      "id": "step-1",
      "agentType": "BLOG",
      "name": "Generate Blog",
      "input": { "topic": "{{trigger.topic}}", "wordCount": 1000 },
      "parameters": { "model": "gpt-4" },
      "outputs": [{ "name": "blogContent", "type": "string" }]
    },
    {
      "id": "step-2",
      "agentType": "IMAGE",
      "name": "Create Image",
      "input": { "prompt": "{{steps.step-1.outputs.blogContent | summarize}}" },
      "parameters": { "size": "1792x1024" },
      "outputs": [{ "name": "imageUrl", "type": "string" }]
    },
    {
      "id": "step-3",
      "agentType": "VIDEO",
      "name": "Generate Video",
      "input": { "imageUrl": "{{steps.step-2.outputs.imageUrl[0]}}", "prompt": "Cinematic motion" },
      "parameters": { "duration": 5 },
      "outputs": [{ "name": "videoUrl", "type": "string" }]
    }
  ]
}
```

**Interpolation**: Use template syntax (e.g., `{{steps.step-1.outputs.blogContent}}`) to pass data between steps. Implement a simple resolver at runtime.

---

## Notes

- Agent implementations are external services or serverless functions. They must accept the validated input and return output matching the schema.
- Store agent logs (stdout/stderr) in `AgentRun.logs` for debugging.
- Timeouts and retries configured per step in the workflow definition.
- Future: Add more agent types (audio, translation, etc.) by extending the registry.

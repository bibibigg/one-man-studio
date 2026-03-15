# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**One Man Studio** is an AI-powered video production service that transforms written scenarios into complete video content. The application uses LLM API to analyze scenarios and split them into scenes, generates visuals with AI image/video generation APIs, and composes them into a final video using Remotion.

**Purpose**: Portfolio project + AI video production tool
**Tech Stack**: Next.js 16 (App Router) + TypeScript + Tailwind CSS + Supabase + Gemini 2.5 Flash + Kling AI V3 + Remotion

## Development Commands

```bash
# Development
npm run dev          # Start dev server at http://localhost:3000

# Build
npm run build        # Production build
npm run start        # Start production server

# Linting
npm run lint         # Run ESLint
```

## Core Architecture

### Video Production Workflow

1. **Category Selection** → User picks category (Ad/Anime/Movie) and sub-category
2. **Scenario Input** → User writes scenario text + optional custom prompt
3. **Scene Analysis** → Gemini 2.5 Flash splits scenario into scenes with visual prompts
4. **Visual Generation** → 3 modes per scene (user selects per scene):
   - **Text→Video**: Prompt only → Kling AI video clip
   - **Image→Video**: AI image generation → Image-to-Video → video clip (2-step)
   - **Image+Text→Video**: User uploads reference image + prompt → video clip
5. **Composition** → Remotion Player (client-side) for editing, reordering, transitions
6. **Export** → Final video rendered in browser and saved to Supabase Storage

### Route Structure (App Router)

**Authentication Layer**:
- `(auth)/login` - NextAuth.js v5 social login (Google OAuth)

**Main Application**:
- `(main)/dashboard` - Project list and status
- `(main)/create` - Multi-step creation wizard (category → scenario → scene review → generation)
- `(main)/editor/[id]` - Remotion Player editor for video composition
- `(main)/preview/[id]` - View and share completed videos

**API Routes**:
- `api/auth/[...nextauth]` - NextAuth.js handler
- `api/scenes/analyze` - LLM scenario analysis and scene generation
- `api/scenes/[id]` - Scene update (PUT)
- `api/generate/image` - AI image generation (Image→Video mode step 1)
- `api/generate/video` - AI video generation (all 3 modes)
- `api/generate/status` - Poll video generation status (async)
- `api/upload` - Reference image upload (user uploads for Image+Text→Video mode)
- `api/projects` - CRUD operations for projects
- `api/categories` - Category and prompt template listing

### Key Libraries and Services

- `lib/api/llm.ts` - Gemini 2.5 Flash client for scenario analysis
- `lib/api/video-gen.ts` - Kling AI V3 video generation (3 modes)
- `lib/api/image-gen.ts` - AI image generation client
- `lib/api/supabase.ts` - Supabase client initialization
- `lib/auth/auth.config.ts` - NextAuth.js v5 configuration (edge compatible)
- `lib/auth/auth.ts` - NextAuth.js with Supabase adapter
- `lib/prompts/templates.ts` - Category-specific prompt template engine
- `lib/prompts/scene-splitter.ts` - LLM prompt for scene splitting
- `lib/stores/` - Zustand stores (ui, create, editor, generation)
- `lib/utils/constants.ts` - Application limits and constraints
- `remotion/` - Remotion compositions and effects (client-side rendering)

### Database Schema (Supabase PostgreSQL)

Key tables: `users`, `accounts`, `sessions` (NextAuth — `next_auth` schema), `categories`, `sub_categories`, `prompt_templates`, `projects`, `scenes` (public schema)

**Scenes table** supports 3 generation modes via `generation_mode` column: `text_to_video` | `image_to_video` | `image_text_to_video`

**Storage Buckets**: `reference-images`, `generated-images`, `video-clips`, `final-videos`, `thumbnails`

### Confirmed Technical Decisions

- **Auth**: Google OAuth only (GitHub removed)
- **Middleware**: `proxy.ts` (Next.js 16 renamed from `middleware.ts`, runs on Node.js runtime)
- **Video storage**: Kling CDN URLs stored directly in DB — no Supabase Storage re-upload (Vercel timeout constraint)
- **`duration_frames`**: Updated from Kling actual response on generation complete
- **Rendering**: Client-side only with Remotion (no server rendering)

## Environment Variables

Required in `.env.local`:

```env
# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

# Google OAuth
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# LLM API
GOOGLE_API_KEY=          # Gemini 2.5 Flash

# AI Video Generation
KLING_ACCESS_KEY=        # Kling AI V3
KLING_SECRET_KEY=
```

## Import Path Alias

TypeScript is configured with `@/*` alias mapping to project root:

```typescript
import { supabase } from '@/lib/api/supabase'
import { LIMITS } from '@/lib/utils/constants'
```

---

## Code Quality and Consistency Standards

### 1. Component Structure Principles

**Server Component First Principle**:
- All components are Server Components by default
- Only use `'use client'` directive when:
  - Event handlers needed (onClick, onChange, onSubmit, etc.)
  - React Hooks used (useState, useEffect, useContext, etc.)
  - Browser-only APIs used (localStorage, window, etc.)
  - Third-party library is client-only

**Component Separation Strategy**:
```typescript
// ❌ Bad: Entire component as Client Component
'use client'
export default function Dashboard() {
  const [count, setCount] = useState(0)
  return (
    <div>
      <Header />       {/* Could be Server Component, forced to Client */}
      <Counter count={count} onClick={() => setCount(count + 1)} />
    </div>
  )
}

// ✅ Good: Only necessary parts as Client Component
// Dashboard.tsx (Server Component)
export default function Dashboard() {
  return (
    <div>
      <Header />       {/* Server Component */}
      <CounterClient /> {/* Client Component */}
    </div>
  )
}
```

### 2. Naming Conventions

**Files and Components**:
- Component files: PascalCase (`ImageUploader.tsx`, `VideoPlayer.tsx`)
- Utilities/helpers: camelCase (`validateImageFile.ts`, `formatDate.ts`)
- Constants files: camelCase (`constants.ts`)
- Type definitions: camelCase (`project.ts`, `user.ts`)

**Code Naming**:
- Components: PascalCase (`ImageUploader`, `Button`)
- Functions: camelCase (`validateImageFile`, `generateVideo`)
- Constants: UPPER_SNAKE_CASE (`MAX_IMAGE_SIZE`, `ALLOWED_TYPES`)
- Types/Interfaces: PascalCase, no 'I' prefix (`Project`, `User`, `VideoStatus`)

### 3. File Structure Rules

- One main export per file
- Component filename = component name
- No `index.ts`/`index.tsx` re-exports (prefer explicit imports)
- Group related files in same directory
- Max folder depth: 3 levels

```
✅ Good:
components/features/upload/ImageUploader.tsx

❌ Bad:
components/features/upload/components/uploader/ImageUploader.tsx
```

### 4. Import Order

```typescript
// 1. React/Next.js core
import { useState, useEffect } from 'react'
import Image from 'next/image'

// 2. External libraries (alphabetical)
import { createClient } from '@supabase/supabase-js'

// 3. Internal absolute paths (@/...) — components, then lib/utils
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/api/supabase'
import { LIMITS } from '@/lib/utils/constants'

// 4. Relative paths
import { helper } from './helper'

// 5. Type imports (separate group)
import type { Project } from '@/types/project'
```

### 5. TypeScript Strictness

- Keep `strict: true` in `tsconfig.json`
- No `any` type — use `unknown` with type guards if unavoidable
- Explicit null/undefined handling

```typescript
// ❌ Bad
function processData(data: any) {
  return data.map((item: any) => item.value)
}

// ✅ Good
function processData(data: unknown): number[] {
  if (!Array.isArray(data)) throw new Error('Data must be an array')
  return data
    .filter((item): item is { value: number } =>
      typeof item === 'object' && item !== null && 'value' in item && typeof item.value === 'number'
    )
    .map((item) => item.value)
}
```

### 6. Error Handling Patterns

**API Routes**:
```typescript
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Logic...
    return Response.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**Client Components**:
```typescript
const handleAction = async () => {
  try {
    setError(null)
    // Logic...
  } catch (err) {
    const message = err instanceof Error ? err.message : '오류가 발생했습니다'
    setError(message)
  }
}
```

### 7. Async Function Rules

- Use async/await (avoid `.then()` chaining)
- Use `Promise.all()` for independent parallel operations

```typescript
// ✅ Parallel
const [projects, user] = await Promise.all([fetchProjects(userId), fetchUser(userId)])

// ✅ Sequential (when dependent)
const project = await createProjectRecord(userId)
const imageUrls = await uploadImages(project.id, images)
```

### 8. Comment Writing Rules

**Write comments for**:
- Complex business logic
- Non-intuitive solutions (explain *why*)
- External API constraints

**Prohibited**:
- Comments explaining what the code does (write self-documenting code)
- Commented-out code (delete it)

### 9. Code Formatting

- Indentation: 2 spaces
- Semicolons: Not used
- Quotes: Single quotes
- Max line length: 100 characters

### 10. Security Coding Principles

- Validate all user inputs at API boundaries
- File uploads: validate type and size
- Never use `dangerouslySetInnerHTML`
- Never hardcode API keys — always use environment variables

```typescript
// ❌ Prohibited
const API_KEY = 'sk-1234567890abcdef'

// ✅ Required
const API_KEY = process.env.GOOGLE_API_KEY!
```

---

## Folder Structure Principles

### File Placement Guide

| File Type | Placement | Examples |
|-----------|-----------|---------|
| Basic UI component | `components/ui/` | Button, Input, Card, Modal |
| Feature-specific component | `components/features/{feature}/` | CategorySelector, EditorWorkspace |
| Feature-specific hook | `components/features/{feature}/` | useCreateWizard, useEditor |
| Common hook | `lib/hooks/` | useAuth, useToast |
| API client | `lib/api/` | llm.ts, video-gen.ts |
| Prompt template | `lib/prompts/` | templates.ts, scene-splitter.ts |
| Utility function | `lib/utils/` | scene-parser.ts, cn.ts |
| Domain type | `types/` | project.ts, scene.ts, editor.ts |
| Remotion composition | `remotion/` | VideoComposition.tsx |
| Remotion effect | `remotion/effects/` | KenBurns.tsx, ZoomIn.tsx |
| Zustand store | `lib/stores/` | editor.ts, create.ts, ui.ts |

### File Naming Rules

| File Type | Rule | Examples |
|-----------|------|---------|
| React component | PascalCase.tsx | `Button.tsx`, `ImageUploader.tsx` |
| Hooks | camelCase.ts | `useAuth.ts`, `useUpload.ts` |
| Utilities | camelCase.ts | `formatDate.ts`, `validateFile.ts` |
| Type definitions | camelCase.ts | `project.ts`, `user.ts` |
| API Routes | route.ts | `route.ts` (Next.js fixed) |
| Constants | camelCase.ts | `constants.ts` |

### Prohibited Patterns

```typescript
// ❌ Re-export with index.ts
export { Button } from './Button'
export { Input } from './Input'

// ✅ Explicit import
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
```

```
❌ Too deep nesting:
components/features/upload/components/uploader/ImageUploader.tsx

✅ Appropriate depth:
components/features/upload/ImageUploader.tsx
```

---

## State Management Architecture

### When to Use Which

| Scenario | Zustand | TanStack Query |
|----------|---------|----------------|
| Modal open/close | ✅ | ❌ |
| Form input state | ✅ | ❌ |
| Upload/render progress | ✅ | ❌ |
| Editor state | ✅ | ❌ |
| Projects list | ❌ | ✅ |
| User profile | ❌ | ✅ |
| Video generation status | ❌ | ✅ (with polling) |
| Any API response | ❌ | ✅ |

### Key Principles

1. **Server Component First**: Fetch initial data in Server Components; use TanStack Query only in Client Components for interactivity
2. **Separation of Concerns**: Client state (Zustand) vs Server state (TanStack Query)
3. **Cache Invalidation**: Always invalidate related queries after mutations
4. **Optimistic Updates**: Use TanStack Query's optimistic updates for better UX

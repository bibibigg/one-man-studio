# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**One Man Studio** is an AI-powered video production service that transforms written scenarios into complete video content. The application uses LLM API to analyze scenarios and split them into scenes, generates visuals with AI image/video generation APIs, and composes them into a final video using Remotion.

**Purpose**: Portfolio project + AI video production tool
**Tech Stack**: Next.js 14+ (App Router) + TypeScript + Tailwind CSS + Supabase + LLM API (TBD) + AI Visual Generation API (TBD) + Remotion

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

The application follows a multi-stage pipeline:

1. **Category Selection** → User picks category (Ad/Anime/Movie) and sub-category
2. **Scenario Input** → User writes scenario text + optional custom prompt
3. **Scene Analysis** → LLM API splits scenario into scenes with visual prompts
4. **Visual Generation** → 3 modes per scene (user selects per scene):
   - **Text→Video**: Prompt only → AI video clip (3-5 seconds)
   - **Image→Video**: AI image generation → Image-to-Video API → video clip (2-step)
   - **Image+Text→Video**: User uploads reference image + prompt → video clip
5. **Composition** → Remotion Player (client-side) for editing, reordering, transitions
6. **Export** → Final video rendered in browser and saved to Supabase Storage

### Route Structure (App Router)

**Authentication Layer**:
- `(auth)/login` - NextAuth.js v5 social login (Google/GitHub)

**Main Application**:
- `(main)/dashboard` - Project list and status
- `(main)/create` - Multi-step creation wizard (category → scenario → scene review → generation)
- `(main)/editor/[id]` - Remotion Player editor for video composition
- `(main)/preview/[id]` - View and share completed videos

**API Routes**:
- `api/auth/[...nextauth]` - NextAuth.js handler (Google/GitHub OAuth)
- `api/scenes/analyze` - LLM scenario analysis and scene generation
- `api/generate/image` - AI image generation (Image→Video mode step 1)
- `api/generate/video` - AI video generation (Text→Video / Image→Video / Image+Text→Video)
- `api/generate/status` - Poll video generation status (async)
- `api/upload` - Reference image upload (user uploads for Image+Text→Video mode)
- `api/projects` - CRUD operations for projects
- `api/projects/[id]/scenes` - Scene management for a project
- `api/categories` - Category and prompt template listing

### Key Libraries and Services

**Core Services**:
- `lib/api/llm.ts` - LLM API client (TBD: OpenAI, Anthropic, etc.) for scenario analysis
- `lib/api/video-gen.ts` - AI video generation API client (TBD: Runway, Veo 2, Luma, etc.)
- `lib/api/image-gen.ts` - AI image generation API client (for Image→Video mode step 1)
- `lib/api/supabase.ts` - Supabase client initialization
- `lib/auth/auth.config.ts` - NextAuth.js v5 configuration (edge compatible)
- `lib/auth/auth.ts` - NextAuth.js with Supabase adapter
- `lib/prompts/templates.ts` - Category-specific prompt template engine
- `lib/prompts/scene-splitter.ts` - LLM prompt for scene splitting

**Video Composition**:
- **Remotion** - Programmatic video composition and rendering (client-side)
  - `remotion.config.ts` - Remotion configuration
  - `remotion/` - Remotion compositions and components

**State Management**:
- **Zustand** - Client state management (UI state, editor state, temporary data)
- **TanStack Query** - Server state management (data fetching, caching, synchronization)
  - Automatic caching and background refetching
  - Optimistic updates for better UX
  - Query invalidation for data consistency

**Utilities**:
- `lib/utils/scene-parser.ts` - Parse LLM API scene analysis results
- `lib/utils/rate-limit.ts` - User rate limiting (3 videos/day, 10 total)
- `lib/utils/constants.ts` - Application limits and constraints

### Database Schema (Supabase PostgreSQL)

**Tables**: See `C:\Users\aerl0\.claude\plans\giggly-gliding-music.md` for full schema.

Key tables: `users` (NextAuth), `accounts` (OAuth), `sessions`, `categories`, `sub_categories`, `prompt_templates`, `projects`, `scenes`

**Scenes table** supports 3 generation modes:
- `generation_mode`: 'text_to_video' | 'image_to_video' | 'image_text_to_video'
- `reference_image_url`: User-uploaded reference image (Image+Text mode)
- `generated_image_url`: AI-generated image (Image→Video mode intermediate)
- `video_url`: Final generated video clip URL

**Storage Buckets**: `reference-images`, `generated-images`, `video-clips`, `final-videos`, `thumbnails`

### Remotion Client-Side Rendering

Remotion renders videos directly in the browser (client-side):
- No server rendering required (avoids Lambda timeout issues)
- User's browser handles video composition and export
- Remotion Player for preview
- Export to WebM/MP4 using `@remotion/renderer` in browser
- Progress tracking with Zustand store
- Uploaded to Supabase Storage after rendering complete

**Key Remotion Features**:
- React-based composition (write video logic in JSX)
- Timeline and scene transitions
- Audio synchronization
- Dynamic content rendering from scene data

## Environment Variables

Required in `.env.local`:

```env
# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=                    # openssl rand -base64 32
AUTH_GOOGLE_ID=                     # Google OAuth client ID
AUTH_GOOGLE_SECRET=                 # Google OAuth client secret
AUTH_GITHUB_ID=                     # GitHub OAuth client ID
AUTH_GITHUB_SECRET=                 # GitHub OAuth client secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# LLM API (TBD - choose one)
# OPENAI_API_KEY=       # If using OpenAI GPT-4
# ANTHROPIC_API_KEY=    # If using Claude
# GOOGLE_API_KEY=       # If using Gemini

# AI Video Generation (TBD - choose one)
# RUNWAY_API_KEY=       # Runway ML
# REPLICATE_API_TOKEN=  # Replicate
# GOOGLE_VEO_API_KEY=   # Google Veo 2

# AI Image Generation (for Image→Video mode)
# Same key as LLM or separate - depends on provider

# Optional AI Services (for future phases)
# ELEVENLABS_API_KEY=  # Text-to-speech
# SUNO_API_KEY=        # Music generation
```

## Import Path Alias

TypeScript is configured with `@/*` alias mapping to project root:

```typescript
import { supabase } from '@/lib/api/supabase'
import { LIMITS } from '@/lib/utils/constants'
```

## Critical Implementation Details

### Authentication Flow

Uses NextAuth.js v5 with social login:
1. User clicks "Login with Google" or "Login with GitHub"
2. OAuth flow handled by NextAuth.js
3. User data persisted to Supabase via `@auth/supabase-adapter`
4. Session managed by NextAuth.js (JWT strategy)
5. Middleware protects routes: `/create`, `/dashboard`, `/editor`, `/preview`

**Key files**:
- `lib/auth/auth.config.ts` - NextAuth config (edge compatible)
- `lib/auth/auth.ts` - NextAuth with Supabase adapter
- `app/api/auth/[...nextauth]/route.ts` - Auth API handler

### Rate Limiting Strategy

Two-tier limits enforced in `lib/utils/rate-limit.ts`:
- Daily: 3 projects per user per day
- Total: 20 videos per user (configurable via `max_videos` column)
- Max 10 scenes per project

### Scenario Input Constraints

Defined in `lib/utils/constants.ts`:
- Max 5,000 characters per scenario
- Min 100 characters (to ensure meaningful content)
- Max 10 scenes per project (to control generation costs)
- Scene duration: 3-5 seconds each (90-150 frames at 30fps)

### Category & Prompt Template System

3-level prompt composition:
1. **Category System Prompt**: Defines LLM scene splitting style per category (Ad/Anime/Movie)
2. **Image/Video Style Prompt**: Prefix for AI generation per category (visual style)
3. **User Custom Prompt**: Additional instructions from user

Categories: `ad` (광고), `anime` (애니메이션), `movie` (영화)
Sub-categories: romance, action, comedy, thriller, etc.

### 3 Generation Modes

Each scene can use a different generation mode:

| Mode | Flow | Use Case |
|------|------|----------|
| Text→Video | prompt → Video API → clip | Quick, AI decides visuals |
| Image→Video | prompt → Image API → image → Video API → clip | More control over visuals |
| Image+Text→Video | user image + prompt → Video API → clip | Specific character/style |

### Visual Generation Concurrency

Uses `p-limit` to restrict concurrent AI generation API calls to 2 at a time, preventing rate limit issues and managing costs. Video generation is async (polling via `/api/generate/status`).

### LLM Scene Analysis Prompt

The system prompt for scene analysis should:
- Split scenario into logical scenes (max 20)
- Generate detailed visual descriptions for each scene
- Suggest scene duration (3-10 seconds)
- Output structured JSON format for parsing
- Example: `{ scenes: [{ number, description, visualPrompt, duration }] }`

**Note**: Works with any LLM API (OpenAI GPT-4, Anthropic Claude, Google Gemini, etc.)

### Remotion Rendering Best Practices

- Use `@remotion/player` for preview (no render cost)
- Client-side rendering with `renderMedia()` from `@remotion/renderer`
- Export settings: 1080p, 30fps, WebM format (smaller file size)
- Show progress bar during rendering (use Zustand store)
- Automatic upload to Supabase after rendering complete

## Vercel-Specific Constraints

**Function Timeouts**:
- Hobby: 10 seconds
- Pro: 60 seconds
→ Solution: Video rendering happens client-side with Remotion, no server timeout issues

**Request Body Limits**:
- Hobby: 4.5MB
- Pro: 10MB
→ Solution: Scenario text is small (<5KB), visuals generated via API and stored in Supabase

## Implementation Phases

See full plan: `C:\Users\aerl0\.claude\plans\giggly-gliding-music.md`

Total: ~22 working days (4.5 weeks)

0. **Phase 0: Foundation** (2일) - Setup, packages, types, UI components, Supabase schema
1. **Phase 1: Authentication** (1.5일) - NextAuth.js v5, Google/GitHub OAuth, Supabase adapter
2. **Phase 2: Category & Prompt System** (2일) - Categories, prompt templates, creation wizard UI
3. **Phase 3: LLM Scene Splitting** (2일) - LLM integration, scene parser, review UI
4. **Phase 4: Visual Generation** (4일) - 3 modes (Text→Video, Image→Video, Image+Text→Video), upload, async polling
5. **Phase 5: Remotion Editor** (4일) - Player, timeline, transitions, client-side export
6. **Phase 6: Dashboard & Preview** (1.5일) - Project list, video player, share links
7. **Phase 7: Landing Page** (2일) - GSAP + ScrollTrigger, hero, features, CTA
8. **Phase 8: Polish & Deploy** (2일) - Error handling, SEO, Vercel deploy

## LLM Scenario Analysis Guide

### System Prompt Structure

The LLM system prompt should instruct the model to:
1. Analyze the scenario and identify distinct visual scenes
2. Generate detailed visual descriptions for each scene
3. Suggest appropriate duration (3-10 seconds)
4. Output structured JSON format

**Example System Prompt**:
```typescript
const SYSTEM_PROMPT = `You are a professional video director. Analyze the given scenario and break it down into visual scenes for video production.

For each scene, provide:
1. Scene number (sequential)
2. Brief description (1-2 sentences)
3. Detailed visual prompt for AI image/video generation (describe setting, objects, mood, style)
4. Suggested duration in seconds (3-10)

Rules:
- Maximum 20 scenes per scenario
- Each scene should be visually distinct
- Visual prompts should be detailed and specific
- Consider cinematic transitions between scenes

Output format (JSON):
{
  "scenes": [
    {
      "sceneNumber": 1,
      "description": "Opening scene description",
      "visualPrompt": "Detailed visual description for AI generation",
      "duration": 5
    }
  ]
}`
```

### Parsing LLM Response

```typescript
// lib/utils/scene-parser.ts
export function parseSceneAnalysis(llmResponse: string): Scene[] {
  try {
    const parsed = JSON.parse(llmResponse)

    if (!parsed.scenes || !Array.isArray(parsed.scenes)) {
      throw new Error('Invalid response format')
    }

    return parsed.scenes.map((scene: any) => ({
      sceneNumber: scene.sceneNumber,
      description: scene.description,
      visualPrompt: scene.visualPrompt,
      duration: Math.max(3, Math.min(10, scene.duration)), // Clamp 3-10
    }))
  } catch (error) {
    throw new Error('Failed to parse LLM response')
  }
}
```

## Remotion Composition Architecture

### Basic Composition Structure

```typescript
// remotion/compositions/MainComposition.tsx
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from 'remotion'
import { Scene } from '../components/Scene'
import { Transition } from '../components/Transition'

interface MainCompositionProps {
  scenes: SceneData[]
}

export const MainComposition: React.FC<MainCompositionProps> = ({ scenes }) => {
  const { fps } = useVideoConfig()

  let currentFrame = 0

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      {scenes.map((scene, index) => {
        const durationInFrames = Math.round(scene.duration * fps)
        const from = currentFrame

        currentFrame += durationInFrames

        return (
          <Sequence
            key={scene.id}
            from={from}
            durationInFrames={durationInFrames}
          >
            <Scene
              visualUrl={scene.visualUrl}
              visualType={scene.visualType}
              description={scene.description}
            />
            {index < scenes.length - 1 && (
              <Transition type="fade" />
            )}
          </Sequence>
        )
      })}
    </AbsoluteFill>
  )
}
```

### Scene Component

```typescript
// remotion/components/Scene.tsx
import { AbsoluteFill, Img, Video, interpolate, useCurrentFrame } from 'remotion'

interface SceneProps {
  visualUrl: string
  visualType: 'image' | 'video'
  description: string
}

export const Scene: React.FC<SceneProps> = ({ visualUrl, visualType, description }) => {
  const frame = useCurrentFrame()

  // Fade in animation
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill>
      {visualType === 'image' ? (
        <Img
          src={visualUrl}
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity }}
        />
      ) : (
        <Video
          src={visualUrl}
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity }}
        />
      )}
    </AbsoluteFill>
  )
}
```

### Client-Side Rendering

```typescript
// components/features/editor/useRemotionRender.ts
import { renderMedia } from '@remotion/renderer'
import { useState } from 'react'

export function useRemotionRender() {
  const [progress, setProgress] = useState(0)
  const [isRendering, setIsRendering] = useState(false)

  const render = async (compositionId: string, props: any) => {
    setIsRendering(true)
    setProgress(0)

    try {
      const { buffer } = await renderMedia({
        composition: compositionId,
        serveUrl: '/remotion', // Your Remotion bundle URL
        codec: 'h264',
        inputProps: props,
        onProgress: ({ progress: p }) => {
          setProgress(Math.round(p * 100))
        },
      })

      // Convert buffer to Blob
      const blob = new Blob([buffer], { type: 'video/mp4' })

      // Upload to Supabase
      // ... upload logic

      return blob
    } catch (error) {
      console.error('Render failed:', error)
      throw error
    } finally {
      setIsRendering(false)
    }
  }

  return { render, progress, isRendering }
}
```

## Next.js Configuration Notes

When implementing, ensure `next.config.ts` includes:

```typescript
{
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      // Add other AI service domains as needed
    ]
  },
  webpack: (config) => {
    // Remotion requires custom webpack config
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    }
    return config
  }
}
```

**Remotion Configuration** (`remotion.config.ts`):
```typescript
import { Config } from '@remotion/cli/config'

Config.setVideoImageFormat('jpeg')
Config.setOverwriteOutput(true)
Config.setPixelFormat('yuv420p')
```

## Cost Optimization

**Critical**: AI visual generation APIs are expensive. Cost control strategies:

1. **Start with Images** (cheaper than video)
   - Static image generation: ~$0.02-0.05 per image
   - Video generation: ~$0.05-0.10 per second

2. **Rate Limiting**
   - 3 projects per user per day
   - Max 20 scenes per project
   - Max 10 projects total per user

3. **Caching & Reuse**
   - Store generated visuals in Supabase
   - Allow scene regeneration only when needed
   - Reuse prompts and results across projects

4. **Client-Side Rendering**
   - No server rendering costs (Lambda/compute)
   - User's browser does all video composition
   - Only pay for storage (Supabase)

**Estimated Costs** (with image-based generation):
- Personal use (5 videos/month, 10 scenes each): ~$5-10/month
- LLM API: ~$2-5/month (varies by provider: GPT-4/Claude/Gemini)
- Supabase Storage: Free tier sufficient (<1GB)
- **Total: ~$10-20/month**

**Future Costs** (if adding video generation):
- With Runway ML: ~$250-500/month (50 videos)
- With Stable Video Diffusion (Replicate): ~$50-100/month

---

## Code Quality and Consistency Standards

### 1. Component Structure Principles

**Server Component First Principle**:
- All components are Server Components by default
- Only use 'use client' directive when:
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
      <Header />  {/* Could be Server Component, forced to Client */}
      <Counter count={count} onClick={() => setCount(count + 1)} />
    </div>
  )
}

// ✅ Good: Only necessary parts as Client Component
// Dashboard.tsx (Server Component)
export default function Dashboard() {
  return (
    <div>
      <Header />  {/* Server Component */}
      <CounterClient />  {/* Client Component */}
    </div>
  )
}

// CounterClient.tsx
'use client'
export default function CounterClient() {
  const [count, setCount] = useState(0)
  return <Counter count={count} onClick={() => setCount(count + 1)} />
}
```

### 2. Naming Conventions

**Files and Components**:
- Component files: PascalCase (e.g., `ImageUploader.tsx`, `VideoPlayer.tsx`)
- Utilities/helpers: camelCase (e.g., `validateImageFile.ts`, `formatDate.ts`)
- Constants files: camelCase (e.g., `constants.ts`)
- Type definitions: camelCase (e.g., `project.ts`, `user.ts`)

**Code Naming**:
- Components: PascalCase (e.g., `ImageUploader`, `Button`)
- Functions: camelCase (e.g., `validateImageFile`, `generateVideo`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_IMAGE_SIZE`, `ALLOWED_TYPES`)
- Types/Interfaces: PascalCase, no 'I' prefix (e.g., `Project`, `User`, `VideoStatus`)
- Private variables/functions: camelCase without underscore (use TypeScript private keyword)

**Examples**:
```typescript
// constants.ts
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024
export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// types/project.ts
export type ProjectStatus = 'uploading' | 'processing' | 'merging' | 'completed' | 'failed'

export interface Project {
  id: string
  userId: string
  name: string
  status: ProjectStatus
  imageUrls: string[]
}

// utils/validateImageFile.ts
export function validateImageFile(file: File): ValidationResult {
  // ...
}
```

### 3. File Structure Rules

**Principles**:
- One main export per file
- Component filename = component name
- Minimize use of `index.ts`/`index.tsx` (prefer explicit imports)
- Group related files in same directory

**Example**:
```
components/features/upload/
├── ImageUploader.tsx        # Main component
├── ImageList.tsx            # Related component
├── useUpload.ts             # Related hook (here or in lib/hooks/)
└── types.ts                 # Feature-specific types (optional)
```

**Prohibited Pattern**:
```typescript
// ❌ Bad: Re-exporting everything in index.ts
// components/ui/index.ts
export { Button } from './Button'
export { Input } from './Input'
// ... (hides import path)

// ✅ Good: Explicit import
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
```

### 4. Import Order and Structure

**Standard Order**:
```typescript
// 1. React/Next.js core
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { redirect } from 'next/navigation'

// 2. External libraries (alphabetical)
import { createClient } from '@supabase/supabase-js'
import { useDropzone } from 'react-dropzone'

// 3. Internal absolute paths (@/...) - grouped by feature
// 3-1. Components
import { Button } from '@/components/ui/Button'
import { ImageUploader } from '@/components/features/upload/ImageUploader'

// 3-2. Libraries/utilities
import { supabase } from '@/lib/api/supabase'
import { validateImageFile } from '@/lib/utils/file-validation'
import { LIMITS } from '@/lib/utils/constants'

// 4. Relative paths (same directory/subdirectory)
import { helper } from './helper'
import { LocalComponent } from './LocalComponent'

// 5. Type imports (separate group, alphabetical)
import type { Project } from '@/types/project'
import type { User } from '@/types/user'
```

### 5. TypeScript Strictness

**Required Rules**:
- Keep `strict: true` in `tsconfig.json`
- No `any` type
  - Use `unknown` if unavoidable, then validate with type guards
- Specify function return types (can omit for simple cases)
- Explicit null/undefined handling

**Examples**:
```typescript
// ❌ Bad
function processData(data: any) {
  return data.map(item => item.value)
}

// ✅ Good
function processData(data: unknown): number[] {
  if (!Array.isArray(data)) {
    throw new Error('Data must be an array')
  }

  return data
    .filter((item): item is { value: number } =>
      typeof item === 'object' &&
      item !== null &&
      'value' in item &&
      typeof item.value === 'number'
    )
    .map(item => item.value)
}

// ✅ Good: Specify return type
async function uploadImage(file: File): Promise<string> {
  const { data, error } = await supabase.storage
    .from('images')
    .upload(file.name, file)

  if (error) throw error
  return data.path
}

// ✅ Good: null handling
function getUserName(user: User | null): string {
  return user?.name ?? 'Anonymous'
}
```

### 6. Error Handling Patterns

**API Routes**:
```typescript
// app/api/upload/route.ts
export async function POST(request: Request) {
  try {
    const session = await verifySession(request)
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Logic...

    return Response.json({ success: true, data })
  } catch (error) {
    console.error('Upload error:', error)
    return Response.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}
```

**Client Components**:
```typescript
'use client'

export default function ImageUploader() {
  const [error, setError] = useState<string | null>(null)

  const handleUpload = async (files: File[]) => {
    try {
      setError(null)
      // Upload logic...
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      setError(message)
    }
  }

  return (
    <div>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {/* ... */}
    </div>
  )
}
```

### 7. Async Function Rules

- Use async/await (avoid Promise.then() chaining)
- Use `Promise.all()` for parallel operations when possible
- Explicit await for sequential operations when dependencies exist

```typescript
// ✅ Good: Parallel processing
async function loadDashboardData(userId: string) {
  const [projects, user, stats] = await Promise.all([
    fetchProjects(userId),
    fetchUser(userId),
    fetchStats(userId),
  ])

  return { projects, user, stats }
}

// ✅ Good: Sequential processing (with dependencies)
async function createProject(userId: string, images: File[]) {
  const project = await createProjectRecord(userId)
  const imageUrls = await uploadImages(project.id, images)
  await updateProjectImages(project.id, imageUrls)

  return project
}
```

### 8. Comment Writing Rules

**When to Write Comments**:
- Complex business logic
- Non-intuitive solutions (explain why)
- External API constraints
- TODO/FIXME (temporary solutions)

**Prohibited**:
- Comments explaining what code does (write self-documenting code)
- Commented-out code (delete it)

```typescript
// ❌ Bad: Unnecessary comments
// Validate image file
function validateImageFile(file: File) {
  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return false
  }
  // ...
}

// ✅ Good: Meaningful comments
function validateImageFile(file: File) {
  // Magic number verification prevents MIME type spoofing
  const buffer = await file.arrayBuffer()
  const isValid = await verifyImageMagicNumber(buffer)

  // Veo 2 API only processes files under 10MB
  if (file.size > MAX_IMAGE_SIZE) {
    return { valid: false, error: 'File too large for API' }
  }

  return { valid: isValid }
}
```

### 9. Code Formatting

**Consistency Standards**:
- Use Prettier (configuration to be added)
- Indentation: 2 spaces
- Semicolons: Not used (TypeScript/Next.js convention)
- Quotes: Single quotes
- Max line length: 100 characters recommended

```typescript
// ✅ Consistent style
export function validateImageFile(file: File): ValidationResult {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: '지원하지 않는 파일 형식입니다' }
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return { valid: false, error: '파일 크기가 너무 큽니다 (최대 10MB)' }
  }

  return { valid: true }
}
```

### 10. Security Coding Principles

**Required Validations**:
- Validate all user inputs
- File uploads: Type, size, Magic Number verification
- SQL Injection prevention: Parameterized queries (Supabase handles automatically)
- XSS prevention: React auto-escaping (never use dangerouslySetInnerHTML)

**Environment Variables**:
```typescript
// ❌ Absolutely Prohibited: Hardcoded API keys
const API_KEY = 'sk-1234567890abcdef'

// ✅ Required: Use environment variables
const API_KEY = process.env.GOOGLE_API_KEY!

// ✅ Better: Include validation
function getEnvVar(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`)
  }
  return value
}

export const ENV = {
  NEXTAUTH_SECRET: getEnvVar('NEXTAUTH_SECRET'),
  SUPABASE_URL: getEnvVar('SUPABASE_URL'),
} as const
```

---

## Folder Structure Principles

### Complete Project Structure

```
one-man-studio/
├── app/
│   ├── (auth)/login/page.tsx             # NextAuth 소셜 로그인
│   ├── (main)/
│   │   ├── layout.tsx                    # Main layout (auth check)
│   │   ├── dashboard/page.tsx
│   │   ├── create/page.tsx               # 멀티스텝 생성 위저드
│   │   ├── editor/[id]/page.tsx          # 올인원 Remotion 에디터
│   │   └── preview/[id]/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts   # NextAuth handler
│   │   ├── projects/
│   │   │   ├── route.ts                  # GET (list), POST (create)
│   │   │   └── [id]/
│   │   │       ├── route.ts              # GET, PUT, DELETE
│   │   │       └── share/route.ts        # POST (share token)
│   │   ├── scenes/
│   │   │   ├── analyze/route.ts          # POST - LLM 장면 분할
│   │   │   ├── [id]/
│   │   │   │   ├── route.ts              # PUT, DELETE
│   │   │   │   └── regenerate/route.ts   # POST - 개별 재생성
│   │   │   └── reorder/route.ts          # PUT - 순서 변경
│   │   ├── generate/
│   │   │   ├── image/route.ts            # POST - AI 이미지 생성
│   │   │   ├── video/route.ts            # POST - AI 비디오 생성
│   │   │   └── status/route.ts           # GET - 생성 상태 폴링
│   │   ├── upload/route.ts               # POST - 참조 이미지 업로드
│   │   ├── export/route.ts               # POST - 내보내기 완료 저장
│   │   └── categories/route.ts           # GET - 카테고리 + 템플릿
│   ├── layout.tsx
│   ├── page.tsx                          # 랜딩 페이지
│   └── globals.css
│
├── components/
│   ├── ui/                               # Button, Input, Card, Modal, Toast, Progress
│   ├── features/
│   │   ├── auth/LoginButton.tsx
│   │   ├── create/                       # CategorySelector, ScenarioForm, CreateWizard
│   │   ├── editor/                       # EditorWorkspace, Timeline, SceneControls
│   │   ├── dashboard/                    # ProjectGrid, ProjectCard
│   │   ├── preview/                      # VideoPlayer, ShareButton
│   │   └── landing/                      # HeroSection, FeaturesSection
│   └── layout/                           # Header, Footer, Navigation
│
├── remotion/
│   ├── VideoComposition.tsx              # 루트 컴포지션
│   ├── SceneComposition.tsx              # 비디오 클립 장면
│   ├── ImageSceneComposition.tsx          # 이미지 모션 장면
│   └── effects/                          # KenBurns, ZoomIn, ZoomOut, PanLeft, PanRight
│
├── lib/
│   ├── api/                              # supabase.ts, llm.ts, image-gen.ts, video-gen.ts
│   ├── auth/                             # auth.config.ts, auth.ts
│   ├── prompts/                          # templates.ts, scene-splitter.ts
│   ├── hooks/                            # useAuth.ts, useToast.ts
│   ├── stores/                           # ui.ts, editor.ts, create.ts
│   ├── query/                            # client.ts, projects.ts, scenes.ts
│   └── utils/                            # constants.ts, env.ts, cn.ts, scene-parser.ts
│
├── types/                                # project.ts, scene.ts, category.ts, editor.ts
├── middleware.ts
├── next.config.ts
├── package.json
├── .env.local
├── .env.example
├── CLAUDE.md
└── IMPLEMENTATION_PLAN.md
```

### Folder-Specific Rules

#### 1. `app/` - Next.js App Router

**Route Groups Usage**:
- `(auth)`: Authentication-related pages, separate layout
- `(main)`: Main application, authentication required

**Page File Structure**:
```typescript
// ✅ Good: Concise page component (Server Component)
// app/(main)/dashboard/page.tsx
import { DashboardContent } from '@/components/features/dashboard/DashboardContent'
import { getProjects } from '@/lib/api/projects'

export default async function DashboardPage() {
  const projects = await getProjects()

  return <DashboardContent projects={projects} />
}
```

**API Routes Structure**:
- Follow RESTful patterns
- One file per HTTP method group
- Use [id] dynamic routes

```typescript
// app/api/projects/route.ts
export async function GET(request: Request) { /* List */ }
export async function POST(request: Request) { /* Create */ }

// app/api/projects/[id]/route.ts
export async function GET(request: Request, { params }: { params: { id: string } }) { /* Get */ }
export async function PUT(request: Request, { params }: { params: { id: string } }) { /* Update */ }
export async function DELETE(request: Request, { params }: { params: { id: string } }) { /* Delete */ }
```

#### 2. `components/` - Component Hierarchy

**ui/ - Basic UI Components**:
- Reusable pure components
- No business logic
- Complete control via props

```typescript
// components/ui/Button.tsx
interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
}

export function Button({ children, onClick, variant = 'primary', disabled }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {children}
    </button>
  )
}
```

**features/ - Feature-Specific Components**:
- Components specialized for specific features
- Can contain business logic
- Related hooks can be placed in same folder

```
components/features/create/
├── CategorySelector.tsx     # Main/Sub category selection
├── ScenarioForm.tsx         # Scenario input
├── CreateWizard.tsx         # Multi-step wizard
├── SceneReview.tsx          # Scene review + generation mode
├── GenerationModeSelector.tsx # T2V / I2V / I+T2V selector
└── GenerationProgress.tsx   # Per-scene progress
```

**layout/ - Layout Components**:
- Responsible for page structure
- Header, Footer, Navigation, etc.

#### 3. `lib/` - Business Logic and Utilities

**api/ - API Clients (separated by feature)**:
```typescript
// lib/api/llm.ts - Multi-provider LLM abstraction
export async function splitScenario(scenario: string, systemPrompt: string): Promise<SceneData[]> {
  // LLM API call for scene splitting (OpenAI/Anthropic/Gemini - TBD)
}

// lib/api/video-gen.ts - Multi-provider video generation abstraction
export async function generateVideo(params: VideoGenParams): Promise<GenerationJob> {
  // Supports 3 modes: text_to_video, image_to_video, image_text_to_video
}

// lib/api/image-gen.ts - Multi-provider image generation abstraction
export async function generateImage(prompt: string, style: string): Promise<string> {
  // AI image generation for Image→Video mode step 1
}

// lib/api/supabase.ts - Supabase client initialization
// lib/api/projects.ts - Project CRUD
// lib/api/scenes.ts - Scene CRUD
```

**hooks/ - Common Custom Hooks**:
- Only hooks used across multiple locations
- Feature-specific hooks stay in `components/features/`

```typescript
// lib/hooks/useAuth.ts - Common (NextAuth session wrapper)
export function useAuth() {
  // NextAuth useSession wrapper
}

// components/features/create/useCreateWizard.ts - Feature-specific
export function useCreateWizard() {
  // Creation wizard step management logic
}
```

**utils/ - Utility Functions**:
```typescript
// lib/utils/constants.ts
export const LIMITS = {
  MAX_SCENES_PER_PROJECT: 10,
  MAX_PROJECTS_PER_DAY: 3,
  MAX_REFERENCE_IMAGE_SIZE: 10 * 1024 * 1024,
} as const

// lib/utils/scene-parser.ts
export function parseLLMResponse(response: string): SceneData[] {
  // Parse and validate LLM scene splitting response with Zod
}
```

#### 4. `types/` - Type Definitions (separated by domain)

```typescript
// types/project.ts
export type ProjectStatus = 'draft' | 'splitting' | 'generating' | 'editing' | 'exporting' | 'completed' | 'failed'

export interface Project {
  id: string
  userId: string
  name: string
  categoryId: string
  subCategoryId?: string
  scenario: string
  status: ProjectStatus
  compositionState?: Record<string, unknown>
  finalVideoUrl?: string
  shareToken?: string
  createdAt: Date
  updatedAt: Date
}

// types/scene.ts
export type GenerationMode = 'text_to_video' | 'image_to_video' | 'image_text_to_video'
export type SceneStatus = 'pending' | 'generating_image' | 'generating_video' | 'completed' | 'failed'

export interface Scene {
  id: string
  projectId: string
  orderIndex: number
  description: string
  visualPrompt: string
  generationMode: GenerationMode
  referenceImageUrl?: string     // User uploaded (image+text mode)
  generatedImageUrl?: string     // AI generated (image→video mode)
  videoUrl?: string              // Final video clip
  durationFrames: number
  motionEffect?: string
  transitionType: string
  status: SceneStatus
}

// types/category.ts
export interface Category {
  id: string
  name: string
  nameKo: string
  subCategories: SubCategory[]
}

// types/editor.ts
export interface EditorState {
  projectId: string
  scenes: Scene[]
  currentSceneId?: string
  isPlaying: boolean
  currentFrame: number
}
```

### File Placement Decision Guide

**Where to place files?**

| File Type | Placement | Examples |
|---------|---------|------|
| Basic UI component | `components/ui/` | Button, Input, Card, Modal, Toast |
| Feature-specific component | `components/features/{feature}/` | CategorySelector, EditorWorkspace, Timeline |
| Feature-specific hook | `components/features/{feature}/` | useCreateWizard, useEditor |
| Common hook | `lib/hooks/` | useAuth, useToast |
| API client | `lib/api/` | llm.ts, video-gen.ts, image-gen.ts |
| Prompt template | `lib/prompts/` | templates.ts, scene-splitter.ts |
| Utility function | `lib/utils/` | scene-parser.ts, cn.ts, env.ts |
| Domain type | `types/` | project.ts, scene.ts, category.ts, editor.ts |
| Local type (file-only) | Same file | Component Props types |
| Remotion composition | `remotion/` | VideoComposition.tsx, SceneComposition.tsx |
| Remotion effect | `remotion/effects/` | KenBurns.tsx, ZoomIn.tsx |
| Zustand store | `lib/stores/` | editor.ts, create.ts, ui.ts |

### Folder Creation Rules

1. **Create when needed**: Don't create empty folders in advance
2. **3+ files → folder**: Consider separate folder when 3+ related files exist
3. **Max depth 3**: Avoid too deep nesting

```
✅ Good:
components/features/upload/ImageUploader.tsx

❌ Bad:
components/features/upload/components/uploader/ImageUploader.tsx
```

### File Naming Rules Summary

| File Type | Rule | Examples |
|---------|------|------|
| React component | PascalCase.tsx | `Button.tsx`, `ImageUploader.tsx` |
| Hooks | camelCase.ts | `useAuth.ts`, `useUpload.ts` |
| Utilities | camelCase.ts | `formatDate.ts`, `validateFile.ts` |
| Type definitions | camelCase.ts | `project.ts`, `user.ts` |
| API Routes | route.ts | `route.ts` (Next.js fixed) |
| Constants | camelCase.ts | `constants.ts`, `config.ts` |

### Prohibited Patterns

```typescript
// ❌ Prohibited: Re-export with index.ts
// components/ui/index.ts
export { Button } from './Button'
export { Input } from './Input'

// ❌ Prohibited: Too deep nesting
components/features/upload/components/uploader/ImageUploader.tsx

// ❌ Prohibited: Ambiguous file names
components/utils.tsx
lib/helpers.ts

// ❌ Prohibited: Multiple main exports in one file
// components/forms.tsx
export function LoginForm() {}
export function SignupForm() {}
export function ResetPasswordForm() {}
```

### Recommended Patterns

```typescript
// ✅ Recommended: Explicit import
import { Button } from '@/components/ui/Button'
import { ScenarioInput } from '@/components/features/scenario/ScenarioInput'
import { RemotionEditor } from '@/components/features/editor/RemotionEditor'

// ✅ Recommended: Appropriate depth
components/features/scenario/ScenarioInput.tsx
remotion/components/Scene.tsx

// ✅ Recommended: Clear file names
components/features/scenario/ScenarioInput.tsx
lib/utils/scene-parser.ts
lib/api/llm.ts

// ✅ Recommended: File separation
components/features/scenario/ScenarioInput.tsx
components/features/scenario/SceneList.tsx
components/features/scenario/SceneCard.tsx
```

---

## State Management Architecture

### Client State Management (Zustand)

Use Zustand for **UI state** and **temporary client-side data** that doesn't need server synchronization:

**Use Cases**:
- UI state (modals, dropdowns, theme)
- Form data before submission
- Temporary upload progress
- Client-only preferences

**Store Structure**:
```typescript
// lib/stores/ui.ts
import { create } from 'zustand'

interface UIState {
  isModalOpen: boolean
  openModal: () => void
  closeModal: () => void
}

export const useUIStore = create<UIState>((set) => ({
  isModalOpen: false,
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
}))

// lib/stores/create.ts
interface CreateState {
  currentStep: number
  categoryId: string | null
  scenario: string
  setStep: (step: number) => void
  setCategory: (id: string) => void
  setScenario: (text: string) => void
  reset: () => void
}

export const useCreateStore = create<CreateState>((set) => ({
  currentStep: 0,
  categoryId: null,
  scenario: '',
  setStep: (step) => set({ currentStep: step }),
  setCategory: (id) => set({ categoryId: id }),
  setScenario: (text) => set({ scenario: text }),
  reset: () => set({ currentStep: 0, categoryId: null, scenario: '' }),
}))
```

**Usage in Components**:
```typescript
'use client'

import { useUIStore } from '@/lib/stores/ui'

export default function CreatePage() {
  const { isModalOpen, openModal, closeModal } = useUIStore()

  return (
    <div>
      <button onClick={openModal}>Open Modal</button>
      {isModalOpen && <Modal onClose={closeModal} />}
    </div>
  )
}
```

### Server State Management (TanStack Query)

Use TanStack Query for **server data** that needs caching, synchronization, and automatic refetching:

**Use Cases**:
- Projects list
- User profile
- Video generation status
- Any data from API routes or Supabase

**Setup**:
```typescript
// lib/query/client.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// app/layout.tsx (root layout)
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/query/client'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </body>
    </html>
  )
}
```

**Query Hooks**:
```typescript
// lib/query/projects.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Fetch projects
export function useProjects(userId: string) {
  return useQuery({
    queryKey: ['projects', userId],
    queryFn: async () => {
      const response = await fetch('/api/projects')
      if (!response.ok) throw new Error('Failed to fetch projects')
      return response.json()
    },
  })
}

// Create project mutation
export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateProjectData) => {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to create project')
      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch projects list
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

// Poll video generation status
export function useVideoStatus(projectId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['video-status', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/video/status?projectId=${projectId}`)
      if (!response.ok) throw new Error('Failed to fetch status')
      return response.json()
    },
    enabled, // Only run when enabled
    refetchInterval: 3000, // Poll every 3 seconds
  })
}
```

**Usage in Components**:
```typescript
'use client'

import { useProjects, useCreateProject } from '@/lib/query/projects'

export default function DashboardClient() {
  const { data: projects, isLoading, error } = useProjects('user-id')
  const createProject = useCreateProject()

  const handleCreate = async () => {
    try {
      await createProject.mutateAsync({
        name: 'New Project',
        imageUrls: [],
      })
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <button onClick={handleCreate} disabled={createProject.isPending}>
        {createProject.isPending ? 'Creating...' : 'Create Project'}
      </button>
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}
```

### When to Use Which

| Scenario | Use Zustand | Use TanStack Query |
|----------|-------------|-------------------|
| Modal open/close | ✅ | ❌ |
| Form input state | ✅ | ❌ |
| Upload progress | ✅ | ❌ |
| Theme preference | ✅ | ❌ |
| Projects list | ❌ | ✅ |
| User profile | ❌ | ✅ |
| Video status | ❌ | ✅ (with polling) |
| API responses | ❌ | ✅ |

### Key Principles

1. **Separation of Concerns**: Client state (Zustand) vs Server state (TanStack Query)
2. **Server Component First**: Fetch initial data in Server Components, use TanStack Query only in Client Components for interactivity
3. **Optimistic Updates**: Use TanStack Query's optimistic updates for better UX
4. **Cache Invalidation**: Always invalidate related queries after mutations
5. **Error Handling**: Handle loading and error states consistently across queries

### Required Packages

```json
{
  "dependencies": {
    "zustand": "^5.0.2",
    "@tanstack/react-query": "^5.62.11",
    "remotion": "^4.0.0",
    "@remotion/player": "^4.0.0",
    "@remotion/renderer": "^4.0.0",
    "@supabase/supabase-js": "^2.0.0",
    "jose": "^5.0.0",
    "p-limit": "^5.0.0"
  },
  "devDependencies": {
    "@remotion/cli": "^4.0.0"
  }
}
```

**LLM API Packages** (choose one based on your selection):
```json
{
  "dependencies": {
    // If using OpenAI
    "openai": "^4.0.0",

    // If using Anthropic Claude
    "@anthropic-ai/sdk": "^0.20.0",

    // If using Google Gemini
    "@google/generative-ai": "^0.2.0"
  }
}
```

**Visual Generation API Packages** (choose based on your selection):
```json
{
  "dependencies": {
    // If using Replicate (most flexible)
    "replicate": "^0.25.0",

    // If using Stability AI
    "stability-ai": "^1.0.0"
  }
}
```

## Key Dependencies Explained

- **Remotion**: React-based video composition and rendering
- **LLM API**: Scenario analysis (choose: OpenAI/Anthropic/Gemini)
- **Visual Generation API**: Image/video generation (choose: Replicate/Stability AI/Runway)
- **Supabase**: Database and storage
- **Zustand**: Client state management
- **TanStack Query**: Server state management
- **jose**: JWT token management
- **p-limit**: Concurrency control for API calls

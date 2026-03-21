# One Man Studio - Implementation Plan

## Project Overview

**Purpose**: AI-powered video production tool - one person becomes a movie/animation director
**Use**: Portfolio project + practical AI video production tool
**Tech Stack**: Next.js 16 (App Router) + TypeScript + Tailwind CSS + Supabase + LLM API (TBD) + AI Visual Generation API (TBD) + Remotion

---

## Confirmed Decisions

- **Auth**: NextAuth.js v5 social login — Google OAuth만 사용 (GitHub 제거됨)
- **Landing Animation**: GSAP + ScrollTrigger
- **Video Editor**: Remotion Player custom editor
- **Database**: Supabase (PostgreSQL + Storage)
- **Deploy**: Vercel — https://one-man-studio-qznw.vercel.app
- **LLM API**: Gemini 2.5 Flash (`@google/generative-ai`) — 한국어 장면 description + visualPrompt 출력
- **Video Generation API**: Kling AI V3 (`kling-v3`, std 모드)
- **Middleware**: `proxy.ts` (Next.js 16 renamed from `middleware.ts`, runs on Node.js runtime)

**Kling AI V3 제약사항:**
- `duration`: 3~15초 지원 (초 단위 문자열로 전달)
- 생성된 영상은 Kling CDN URL을 그대로 DB 저장 (Vercel 타임아웃으로 Supabase Storage 재업로드 불가)
- `duration_frames`는 생성 완료 시 Kling 실제 응답값으로 DB 갱신

**실제 적용된 한도 (constants.ts 기준):**
- `MAX_SCENES_PER_PROJECT`: 3 (CLAUDE.md 문서의 10과 다름 — 비용 절감)
- `MAX_PROJECTS_PER_DAY`: 3
- `MAX_TOTAL_PROJECTS`: 20

---

## MVP Scope

### In (v1.0)
- NextAuth social login
- Category selection (Ad/Anime/Movie + sub-categories)
- Scenario input → LLM scene splitting
- **3 visual generation modes (selectable per scene)**:
  1. **Text→Video**: Prompt only → 3-5s video clip
  2. **Image→Video**: AI image generation → Image-to-Video API → video clip (2-step)
  3. **Image+Text→Video**: User uploads reference image + prompt → video clip
- User reference image upload support
- Remotion Player editor (timeline, transitions, video clip editing)
- Client-side video rendering + export
- Project dashboard
- Basic landing page (GSAP animations)

### Out (v2.0+)
- Audio/music integration (ElevenLabs, Suno AI)
- Full GSAP ScrollTrigger cinematic landing page
- Payment/subscription system
- Mobile-optimized editor
- Video-to-Video style transfer

---

## Bug Fixes & Improvements

### BUG-001: GenerationWorkspace 씬 설정 수정 불가 ✅ FIXED (2026-03-15)

**증상**: 대시보드에서 미완성 프로젝트를 클릭하면 `/editor/[id]` → `GenerationWorkspace`로 이동하는데, 이 화면에서 생성 모드(T→V / I→V / I+T→V), 영상 시간, 프롬프트를 수정할 수 없음.

**원인**:
- `/create/analyze` 흐름에서는 `SceneCard` + `useCreateStore`(Zustand)로 수정 후 `생성 시작` 시 DB에 반영
- `GenerationWorkspace`의 `SceneGenerationCard`는 수정 UI 없이 단순 표시만 함
- Zustand store는 페이지 이탈 후 사라지므로 재진입 시 편집 불가

**수정 내용**:
- `PUT /api/scenes/[id]` 엔드포인트 신규 추가 — 소유권 확인, `.eq('status', 'pending')` atomic UPDATE로 TOCTOU 방지
- `SceneGenerationCard`: idle 상태에서 "설정" 버튼 토글로 모드/시간/프롬프트 편집 패널 노출, blur 자동 저장, toast 에러 표시
- `GenerationWorkspace`: `scenes`를 `useState`로 로컬 관리 + `handleUpdate`로 PUT 호출 후 낙관적 반영
- `SceneUpdate` 인터페이스를 `types/scene.ts`에 공통 타입으로 분리

---

## Progress

| Phase | Status | Date | Notes |
|-------|--------|------|-------|
| Phase 0: Foundation | ✅ COMPLETED | 2026-02-16 | |
| Phase 1: Authentication | ✅ COMPLETED | 2026-02-22 | Google OAuth 작동 확인 |
| Phase 2: Category & Prompt | ✅ COMPLETED | 2026-02-22 | |
| Phase 3: LLM Scene Splitting | ✅ COMPLETED | 2026-02-22 | |
| Phase 4: Visual Generation | ✅ COMPLETED | 2026-02-22 | API provider TBD (stub 구현) |
| Phase 5: Remotion Editor | ✅ COMPLETED | 2026-02-22 | |
| Phase 6: Dashboard & Preview | ✅ COMPLETED | 2026-02-23 | 코드 리뷰 후 전체 수정 포함 |
| Phase 7: Landing Page | ✅ COMPLETED | 2026-03-08 | GSAP 애니메이션 포함 |
| Phase 8: Polish & Deploy | 🔄 Partial | 2026-03-08 | Error Boundary, Skeleton, SEO 완료 / Vercel 배포 미완 |

---

## Phase Breakdown

### Phase 0: Foundation — COMPLETED

- [x] Project rebranding (`package.json` name → `one-man-studio`)
- [x] Core package installation (zustand, @tanstack/react-query, @supabase/supabase-js, zod, p-limit, clsx, tailwind-merge)
- [x] TypeScript type definitions (`types/project.ts`, `scene.ts`, `category.ts`, `editor.ts`, `api.ts`)
- [x] `next.config.ts` configuration (Turbopack, images remotePatterns)
- [x] Basic UI components (`components/ui/` — Button, Input, Textarea, Card, Modal, Toast, Progress)
- [x] Zustand stores (`lib/stores/` — ui.ts, create.ts, editor.ts, generation.ts)
- [x] TanStack Query Provider (`lib/query/client.ts`, `components/providers/QueryProvider.tsx`)
- [x] `lib/utils/cn.ts` (classnames utility)
- [x] `lib/utils/constants.ts` (limits, video config)
- [x] `lib/api/supabase.ts` (Supabase client + service client)
- [x] `app/layout.tsx` (metadata, providers, dark theme)
- [x] `app/globals.css` (dark theme, animations)
- [x] `npm run build` success verified

**Skipped:**
- `lib/utils/env.ts` — unnecessary, use `process.env` directly
- Supabase DB schema — deferred to Phase 1

---

### Phase 1: Authentication — COMPLETED

- [x] NextAuth.js v5 (`next-auth@5.0.0-beta.25`) installation + configuration
- [x] `lib/auth/auth.config.ts` — edge-compatible config (Google OAuth 전용 — GitHub 제거됨)
- [x] `lib/auth/auth.ts` — NextAuth with `@auth/supabase-adapter` (JWT strategy)
- [x] `app/api/auth/[...nextauth]/route.ts` — auth handler
- [x] `app/(auth)/login/page.tsx` — social login UI
- [x] `proxy.ts` — protected routes (Next.js 16 middleware)
- [x] `lib/hooks/useAuth.ts` — session hook
- [x] Supabase `next_auth` schema setup (tables: users, accounts, sessions, verification_tokens)
- [x] Google OAuth end-to-end login verified

**Key issues resolved:**
- `@auth/supabase-adapter` requires legacy `eyJ...` JWT service role key, not new `sb_secret_...` format
- `next_auth` schema must be explicitly exposed in Supabase Settings → Data API → Exposed schemas

---

### Phase 2: Category & Prompt System — COMPLETED

- [x] `lib/query/categories.ts` — category data fetching
- [x] `lib/prompts/templates.ts` — prompt template engine
- [x] `lib/prompts/scene-splitter.ts` — LLM scene splitting prompt
- [x] `components/features/create/CategorySelector.tsx`
- [x] `components/features/create/SubCategorySelector.tsx`
- [x] `components/features/create/ScenarioForm.tsx`
- [x] `components/features/create/CreateWizard.tsx` — multi-step wizard
- [x] `app/(main)/create/page.tsx`
- [x] `app/api/categories/route.ts`

---

### Phase 3: LLM Scene Splitting — COMPLETED

- [x] `lib/api/llm.ts` — multi-provider LLM abstraction
- [x] `app/api/scenes/analyze/route.ts` — POST LLM scene splitting
- [x] `lib/utils/scene-parser.ts` — LLM response parsing + Zod validation
- [x] `components/features/create/SceneReview.tsx`
- [x] `components/features/create/SceneCard.tsx`
- [x] `app/(main)/create/analyze/page.tsx`

---

### Phase 4: Visual Generation — COMPLETED

- [x] `lib/api/video-gen.ts` — multi-provider video generation abstraction
- [x] `lib/api/image-gen.ts` — multi-provider image generation abstraction
- [x] `app/api/generate/video/route.ts` — all 3 modes (text_to_video, image_to_video, image_text_to_video)
- [x] `app/api/generate/image/route.ts` — Image→Video 1단계
- [x] `app/api/generate/status/route.ts` — async polling
- [x] `app/api/upload/route.ts` — reference image upload (Supabase Storage)
- [x] `components/features/create/GenerationModeSelector.tsx`
- [x] `components/features/editor/GenerationWorkspace.tsx` — generation progress UI
- [x] `components/features/editor/SceneGenerationCard.tsx`
- [x] `lib/stores/generation.ts` — generation progress state
- [x] `p-limit` concurrent generation limit (2 simultaneous)

**실제 구현된 API 제공업체:**
- LLM: Gemini 2.5 Flash (`@google/generative-ai`) — 장면 분석 + 한국어 출력
- Video: Kling AI V3 (`kling-v3`, std) — 3가지 모드 모두 지원
- `buildVideoGenerationPrompt()`: 카테고리 스타일 prefix + visualPrompt 결합 → Kling 전달

**버그 수정 이력:**
- `buildVideoGenerationPrompt` 미호출 수정 — `api/generate/video/route.ts`에서 category_id, sub_category_id 조회 후 적용
- `duration_frames` 불일치 수정 — 생성 완료 시 Kling 실제 duration으로 DB 갱신 + editor store 반영
- `transitionType: 'none'` overlap 발생 수정 — `positionScenes`, `getTotalFrames` 모두 none일 때 overlap=0 처리
- `transitionIn` 계산 오류 수정 — 이전 씬 transitionType이 'none'이면 fadeInFrames=0으로 처리

---

### Phase 5: Remotion Editor — COMPLETED

- [x] `remotion/VideoComposition.tsx` — root composition with scene positioning + transition overlap
- [x] `remotion/SceneLayer.tsx` — per-scene rendering (video/image)
- [x] `remotion/effects/` — KenBurns, ZoomIn, ZoomOut, PanLeft, PanRight
- [x] `components/features/editor/EditorWorkspace.tsx` — all-in-one layout (header, player, controls, timeline)
- [x] `components/features/editor/EditorPlayer.tsx` — Remotion Player integration
- [x] `components/features/editor/EditorTimeline.tsx` — @dnd-kit drag-and-drop reorder
- [x] `components/features/editor/SceneControlsPanel.tsx` — duration, transition, motion effect controls
- [x] `lib/stores/editor.ts` — Zustand editor state
- [x] `app/(main)/editor/[id]/page.tsx` — server-side data fetch, routes to GenerationWorkspace or EditorWorkspace
- [x] `app/api/projects/[id]/route.ts` — PUT composition state save
- [x] Transitions: crossfade, fade-black, slide-left, slide-right, none
- [x] Motion effects: ken-burns, zoom-in, zoom-out, pan-left, pan-right

---

### Phase 6: Dashboard & Preview — COMPLETED

**API Routes:**
- [x] `app/api/projects/route.ts` — GET (list), POST (create with rate limiting)
- [x] `app/api/projects/[id]/route.ts` — GET, DELETE (added to existing PUT)
- [x] `app/api/projects/[id]/share/route.ts` — POST (share token generation)

**Dashboard:**
- [x] `app/(main)/dashboard/page.tsx` — Server Component, server-side project fetch
- [x] `components/features/dashboard/ProjectCard.tsx` — thumbnail, status badge, edit/preview/delete
- [x] `components/features/dashboard/ProjectGrid.tsx` — 3-column grid, Modal delete confirm, Toast error

**Preview:**
- [x] `app/(main)/preview/[id]/page.tsx` — owner access + public share token access
- [x] `components/features/preview/VideoPlayer.tsx` — Server Component video player
- [x] `components/features/preview/ShareButton.tsx` — share link generation + clipboard copy

**Middleware update:**
- [x] `proxy.ts` — `/preview?token=...` bypass (32-char hex token format validation)

**Utilities:**
- [x] `lib/utils/rate-limit.ts` — daily (3/day) + total (20) project limits
- [x] `types/project.ts` — `ProjectRow` interface added

**Code Review Fixes Applied (2026-02-23):**

| Severity | Issue | Fix |
|----------|-------|-----|
| 🔴 Critical | `proxy.ts` 토큰 형식 미검증 | `/^[0-9a-f]{32}$/` 정규식 추가 |
| 🔴 Critical | POST `/api/projects` rate-limit 미적용 | `checkProjectRateLimit()` 적용, daily 3개 / total 20개 |
| 🔴 Critical | `VideoPlayer.tsx` 불필요한 `'use client'` | 제거 → Server Component |
| 🟡 Recommended | `ProjectRow` 타입 중복 | `types/project.ts`로 통합 |
| 🟡 Recommended | GET `[id]/route.ts` DB 에러 vs 404 미구별 | `PGRST116` 코드로 분기 처리 |
| 🟡 Recommended | `confirm()`/`alert()` 사용 | Modal/Toast UI 컴포넌트로 교체 |
| 🟡 Recommended | `ShareButton` setTimeout cleanup 누락 | `useRef`로 타이머 관리 |
| 🟡 Recommended | `share/route.ts` 미완성 프로젝트 공유 가능 | `status !== 'completed'` 체크 추가 |
| 🟡 Recommended | POST body name falsy 체크 | `trim() === ''` 검증으로 강화 |
| 🔵 Optional | SVG `aria-hidden` 누락 | 전체 장식 SVG에 추가 |
| 🔵 Optional | `status as ProjectStatus` 런타임 검증 없음 | `toProjectStatus()` 타입 가드 추가 |
| 🔵 Optional | 다운로드 링크 파일명 미지정 | `download={project.name}` 추가 |

---

### Phase 7: Landing Page — COMPLETED

- [x] `components/layout/Header.tsx` — 네비게이션 헤더 (auth 상태 기반 버튼)
- [x] `components/layout/Footer.tsx` — 푸터
- [x] `components/features/landing/HeroSection.tsx` — GSAP fade-in/slide-up
- [x] `components/features/landing/HowItWorksSection.tsx` — ScrollTrigger stagger (ol/li 시맨틱)
- [x] `components/features/landing/CategoryShowcase.tsx` — ScrollTrigger slide-in
- [x] `components/features/landing/CTASection.tsx` — 하단 CTA
- [x] `app/page.tsx` — 랜딩 페이지 (OG metadata 포함)
- [x] `gsap` + `@gsap/react` 패키지 설치
- [ ] Demo preview section (Out of scope for v1)

---

### Phase 8: Polish & Deploy — Partial

- [x] Error boundary (`components/providers/ErrorBoundary.tsx` — retryKey 기반 리마운트, dev/prod 에러 분리)
- [x] Loading states / Skeleton UI (`components/ui/Skeleton.tsx`, `dashboard/loading.tsx`, `editor/[id]/loading.tsx`)
- [x] SEO metadata (login, dashboard, editor, preview 페이지 + preview `generateMetadata`)
- [x] `npm run build` 성공 확인
- [x] Vercel deployment — https://one-man-studio-qznw.vercel.app
- [ ] Lighthouse performance audit
- [ ] E2E testing (verification checklist)

---

## File Structure (Current State)

```
one-man-studio/
├── app/
│   ├── (auth)/login/page.tsx              ✅
│   ├── (main)/
│   │   ├── layout.tsx                     ✅
│   │   ├── dashboard/page.tsx             ✅
│   │   ├── create/page.tsx                ✅
│   │   ├── create/analyze/page.tsx        ✅
│   │   ├── editor/[id]/page.tsx           ✅
│   │   └── preview/[id]/page.tsx          ✅
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts    ✅
│   │   ├── categories/route.ts            ✅
│   │   ├── generate/image/route.ts        ✅
│   │   ├── generate/video/route.ts        ✅
│   │   ├── generate/status/route.ts       ✅
│   │   ├── projects/route.ts              ✅
│   │   ├── projects/[id]/route.ts         ✅
│   │   ├── projects/[id]/share/route.ts   ✅
│   │   ├── scenes/analyze/route.ts        ✅
│   │   └── upload/route.ts               ✅
│   ├── layout.tsx                         ✅
│   ├── page.tsx                           ✅ (landing page + OG metadata)
│   └── globals.css                        ✅
├── components/
│   ├── ui/                                ✅ Button, Input, Textarea, Card, Modal, Toast, Progress
│   ├── features/
│   │   ├── auth/LoginButton.tsx           ✅
│   │   ├── create/                        ✅ CategorySelector, SubCategorySelector, ScenarioForm, CreateWizard, SceneReview, SceneCard, GenerationModeSelector
│   │   ├── editor/                        ✅ EditorWorkspace, EditorPlayer, EditorTimeline, SceneControlsPanel, GenerationWorkspace, SceneGenerationCard
│   │   ├── dashboard/                     ✅ ProjectCard, ProjectGrid
│   │   ├── preview/                       ✅ VideoPlayer, ShareButton
│   │   └── landing/                       ✅ HeroSection, HowItWorksSection, CategoryShowcase, CTASection
│   ├── layout/                            ✅ Header, Footer
│   └── providers/                         ✅ QueryProvider, ToastContainer, ErrorBoundary
├── remotion/
│   ├── VideoComposition.tsx               ✅
│   ├── SceneLayer.tsx                     ✅
│   └── effects/                           ✅ KenBurns, ZoomIn, ZoomOut, PanLeft, PanRight
├── lib/
│   ├── api/supabase.ts                    ✅
│   ├── api/llm.ts                         ✅ (stub)
│   ├── api/image-gen.ts                   ✅ (stub)
│   ├── api/video-gen.ts                   ✅ (stub)
│   ├── auth/auth.config.ts                ✅
│   ├── auth/auth.ts                       ✅
│   ├── hooks/useAuth.ts                   ✅
│   ├── prompts/templates.ts               ✅
│   ├── prompts/scene-splitter.ts          ✅
│   ├── query/client.ts                    ✅
│   ├── query/categories.ts               ✅
│   ├── query/scenes.ts                   ✅
│   ├── stores/ui.ts                       ✅
│   ├── stores/create.ts                   ✅
│   ├── stores/editor.ts                   ✅
│   ├── stores/generation.ts              ✅
│   └── utils/cn.ts, constants.ts, scene-parser.ts, rate-limit.ts  ✅
├── app/(main)/dashboard/loading.tsx       ✅ (Phase 8)
├── app/(main)/editor/[id]/loading.tsx     ✅ (Phase 8)
├── components/ui/Skeleton.tsx             ✅ (Phase 8)
├── types/project.ts, scene.ts, category.ts, editor.ts, api.ts  ✅
├── proxy.ts                               ✅ (Next.js 16 middleware)
└── next.config.ts                         ✅
```

---

## Database Schema

See full SQL schema in: `C:\Users\aerl0\.claude\plans\giggly-gliding-music.md`

Key tables:
- `users`, `accounts`, `sessions`, `verification_tokens` (NextAuth.js — `next_auth` schema)
- `categories`, `sub_categories`, `prompt_templates` (Category & Prompt system — `public` schema)
- `projects` (User projects with status tracking)
- `scenes` (Per-scene data with 3 generation modes)

Storage Buckets: `reference-images`, `generated-images`, `video-clips`, `final-videos`, `thumbnails`

---

## API Routes (Current)

```
app/api/
├── auth/[...nextauth]/route.ts     ✅ NextAuth handler
├── projects/
│   ├── route.ts                    ✅ GET (list), POST (create + rate limit)
│   └── [id]/
│       ├── route.ts                ✅ GET, PUT, DELETE
│       └── share/route.ts         ✅ POST (share token — completed only)
├── scenes/
│   ├── analyze/route.ts           ✅ POST - LLM scene splitting
│   └── [id]/route.ts              ✅ PUT - 씬 설정 수정 (모드/시간/프롬프트)
├── generate/
│   ├── image/route.ts             ✅ POST - AI image generation
│   ├── video/route.ts             ✅ POST - AI video generation (3 modes)
│   └── status/route.ts            ✅ GET - generation status polling
├── upload/route.ts                ✅ POST - reference image upload
└── categories/route.ts            ✅ GET - categories + templates
```

---

## Core Dependencies

```json
{
  "next": "16.0.4",
  "next-auth": "5.0.0-beta.25",
  "@auth/supabase-adapter": "^1.11.1",
  "@supabase/supabase-js": "^2.48.0",
  "@google/generative-ai": "^0.x.x",
  "zustand": "^5.0.2",
  "@tanstack/react-query": "^5.62.11",
  "remotion": "^4.0.0",
  "@remotion/player": "^4.0.0",
  "gsap": "^3.12.0",
  "@gsap/react": "^2.1.0",
  "zod": "^3.22.0",
  "p-limit": "^5.0.0",
  "@dnd-kit/core": "^6.0.0",
  "@dnd-kit/sortable": "^8.0.0"
}
```

Kling AI는 자체 REST API (`https://api.klingai.com`) 사용 — 별도 npm 패키지 없음.

---

## Cost Estimation

| Scale | LLM API | Visual Gen (Video) | Infra | Total/month |
|-------|---------|-------------------|-------|-------------|
| Development | ~$5 | ~$50-150 | $0 | **~$55-155** |
| Personal (10/month) | ~$0.50 | ~$40-80 | $0 | **~$40-80** |
| Public service (100/month) | ~$5 | ~$400-800 | $45 | **~$450-850** |

---

## Verification Checklist

- [x] `npm run build` success
- [x] Google OAuth login → dashboard entry
- [ ] Category selection → scenario input → LLM scene splitting result
- [ ] Per-scene generation mode selection (Text→Video, Image→Video, Image+Text→Video)
- [ ] Text→Video: video clip generation from prompt only
- [ ] Image→Video: AI image generation → video conversion
- [ ] Image+Text→Video: reference image upload → video generation
- [ ] Editor Remotion Player video clip preview
- [ ] Timeline drag and drop reordering
- [ ] Transition change → preview reflects
- [ ] Export → MP4/WebM download
- [ ] Dashboard project list display (with create, delete, status)
- [ ] Preview page video playback + share link
- [x] Landing page GSAP animation working
- [x] Vercel deployment success — https://one-man-studio-qznw.vercel.app

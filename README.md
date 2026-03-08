# One Man Studio

> AI 시나리오 분석부터 영상 편집까지, 혼자서도 완성하는 AI 영상 제작 웹 서비스

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?style=flat-square&logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?style=flat-square&logo=supabase)

---

## 서비스 플로우

```
카테고리 선택 → 시나리오 작성 → AI 장면 분할 → 영상 생성 → 에디터 편집
```

**1. 카테고리 선택** — 광고 / 애니메이션 / 영화 중 선택, 세부 장르 지정  
**2. 시나리오 작성** — 텍스트 시나리오 입력 (최대 5,000자)  
**3. AI 장면 분할** — Gemini 2.5 Flash가 시나리오를 최대 3개 장면으로 분석  
**4. 영상 생성** — 장면별 생성 모드 선택 후 Kling AI V3로 영상 클립 생성  
**5. 에디터 편집** — 브라우저에서 타임라인 편집, 전환 효과·모션 효과 적용  

---

## 주요 기능

### 3가지 영상 생성 모드
| 모드 | 방식 | 특징 |
|------|------|------|
| 텍스트 → 영상 | 프롬프트만으로 생성 | 빠르고 간편 |
| 이미지 → 영상 | AI 이미지 생성 후 영상 변환 | 시각 통제 강화 |
| 이미지+텍스트 → 영상 | 참조 이미지 업로드 + 프롬프트 | 특정 스타일/캐릭터 고정 |

### Remotion 기반 브라우저 에디터
- 드래그&드롭 타임라인 장면 재배치
- 전환 효과: 크로스페이드 / 암전 / 슬라이드
- 모션 효과: 켄번즈 / 줌인 / 줌아웃 / 패닝 (이미지 장면에만 적용)
- 장면 재생 시간 조절 (3~10초)
- 장면 클릭 시 해당 위치로 Player 자동 이동

### 기타
- Google 소셜 로그인 (NextAuth.js v5)
- 완성 영상 공유 링크 생성
- 카테고리·장르별 AI 프롬프트 자동 최적화

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS |
| 상태 관리 | Zustand (클라이언트), TanStack Query (서버) |
| 영상 편집 | Remotion |
| AI 장면 분석 | Google Gemini 2.5 Flash |
| AI 영상 생성 | Kling AI V3 (text2video / image2video) |
| 인증 | NextAuth.js v5 (Google OAuth) |
| 데이터베이스 | Supabase (PostgreSQL + Storage) |
| 배포 | Vercel |

---

## 스크린샷

> 추후 추가 예정

---

## 환경 변수

`.env.local` 파일을 생성하고 아래 값을 설정하세요.

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

# Google OAuth
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Gemini (LLM)
GOOGLE_API_KEY=

# Kling AI (영상 생성)
KLING_API_KEY=
KLING_API_SECRET=
```

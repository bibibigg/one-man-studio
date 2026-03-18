# 인증 시스템 문서

## 개요

Supabase Auth + `@supabase/ssr` 기반으로 구현된 인증 시스템.
NextAuth.js v5에서 마이그레이션 완료 (2026-03-18).

**현재 지원 방식**: Google OAuth
**확장 가능 방식**: GitHub, Kakao 등 소셜 로그인, 이메일/패스워드 자체 회원가입

---

## 로그인 플로우

```
사용자 클릭
    ↓
LoginButton → supabase.auth.signInWithOAuth({ provider: 'google' })
    ↓
Google OAuth 동의 화면
("xmxyezvfmvxdnbbaocec.supabase.co(으)로 이동" 표시 — 정상 동작)
    ↓
사용자가 Google 계정 선택 및 동의
    ↓
Google → Supabase Auth 서버 콜백
(https://xmxyezvfmvxdnbbaocec.supabase.co/auth/v1/callback)
    ↓
Supabase Auth가 토큰 교환 처리
    ↓
/auth/callback?code=xxx 로 리다이렉트
    ↓
app/auth/callback/route.ts — exchangeCodeForSession(code) 실행
    ↓
세션 쿠키 설정
    ↓
/dashboard 최종 리다이렉트
```

---

## Google 동의 화면에 Supabase URL이 표시되는 현상

### 왜 발생하는가

Supabase Auth가 OAuth 중간자(intermediary) 역할을 한다. Google에 등록된 Authorized redirect URI가 Supabase 서버 주소이기 때문에, Google 동의 화면에서 "xmxyezvfmvxdnbbaocec.supabase.co(으)로 이동"이 표시된다.

### 보안 문제인가

**보안 문제가 아니다.** Supabase 프로젝트 ID(`xmxyezvfmvxdnbbaocec`)가 노출되어도:
- anon key나 service role key 없이는 DB에 접근 불가
- URL 자체는 공개 정보로 취급해도 무방

### 프로덕션에서 숨기는 방법

Supabase **Pro 플랜($25/월)**의 Custom Domain 기능 사용:
- Dashboard → Project Settings → Custom Domains
- `auth.yourdomain.com`으로 설정하면 Google 화면에 해당 도메인이 표시됨

현재 포트폴리오 단계에서는 그대로 운용해도 무방.

---

## 코드 사용 패턴

### API Route / Server Component에서 인증 확인

```typescript
import { getAuthenticatedUserId } from '@/lib/auth/server'

const userId = await getAuthenticatedUserId()
if (!userId) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### Server Component에서 유저 정보 필요 시

```typescript
import { getAuthenticatedUser } from '@/lib/auth/server'

const user = await getAuthenticatedUser()
if (!user) redirect('/login')

// 사용 가능한 필드
user.id            // UUID
user.email         // 이메일
user.user_metadata.full_name  // Google 표시 이름
```

### Client Component에서 인증 상태 확인

```typescript
import { useAuth } from '@/lib/hooks/useAuth'

const { user, isLoading, isAuthenticated } = useAuth()
```

### Client Component에서 로그아웃

```typescript
import { getSupabaseBrowserClient } from '@/lib/auth/client'

const supabase = getSupabaseBrowserClient()
await supabase.auth.signOut()
router.push('/login')
```

---

## 파일 구조

```
lib/auth/
├── server.ts   — 서버 사이드 Supabase 클라이언트 + 인증 헬퍼
│                  createSupabaseServerClient()
│                  getAuthenticatedUserId() → string | null
│                  getAuthenticatedUser()   → User | null
└── client.ts   — 브라우저 사이드 Supabase 싱글톤
                   getSupabaseBrowserClient()

app/auth/
└── callback/
    └── route.ts  — PKCE OAuth 콜백 (모든 provider 공통)

components/
├── providers/AuthProvider.tsx  — Supabase onAuthStateChange 기반 Context
└── features/auth/LoginButton.tsx

lib/hooks/
└── useAuth.ts  — useAuth() 훅 (AuthProvider Context 래퍼)

proxy.ts  — 미들웨어: 보호 경로 접근 제어 + 세션 갱신
```

---

## Supabase Dashboard 설정

### 초기 설정 (프로젝트 세팅 시 1회)

1. **Authentication → Providers → Google** 활성화
   - Google Cloud Console에서 발급한 Client ID / Client Secret 입력
   - Supabase가 제공하는 Callback URL을 Google Cloud Console에 등록

2. **Authentication → URL Configuration**
   - Site URL: `https://one-man-studio-qznw.vercel.app`
   - Redirect URLs:
     ```
     http://localhost:3000/auth/callback
     https://one-man-studio-qznw.vercel.app/auth/callback
     ```

3. **Google Cloud Console → OAuth 앱 → Authorized redirect URIs**
   ```
   https://xmxyezvfmvxdnbbaocec.supabase.co/auth/v1/callback
   ```
   구 NextAuth URL(`/api/auth/callback/google`)은 제거해도 됨 (develop 브랜치 머지 후)

---

## 새 인증 방식 추가

### 소셜 로그인 (GitHub, Kakao 등) 추가

1. Supabase Dashboard → Authentication → Providers → 원하는 provider 활성화
2. `components/features/auth/LoginButton.tsx`에 버튼 추가:

```typescript
await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: {
    redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
  },
})
```

`app/auth/callback/route.ts`는 모든 provider를 공통 처리하므로 수정 불필요.

### 이메일/패스워드 자체 회원가입 추가

1. Supabase Dashboard → Authentication → Providers → Email 활성화
2. `components/features/auth/EmailLoginForm.tsx` 신규 생성:

```typescript
// 회원가입
const { error } = await supabase.auth.signUp({ email, password })

// 로그인
const { error } = await supabase.auth.signInWithPassword({ email, password })
```

3. `app/(auth)/login/page.tsx`에 UI 추가
4. 미들웨어, API Routes, AuthProvider 변경 불필요

---

## 세션 관리

- 세션은 Supabase가 발급한 JWT로 쿠키에 저장됨 (`@supabase/ssr`이 관리)
- Access token 만료 시 refresh token으로 자동 갱신 (`proxy.ts`의 `setAll` 콜백에서 처리)
- 미들웨어에서 `getUser()` 사용 (서버 재검증) — `getSession()`은 클라이언트 캐시만 읽어 보안상 부적합

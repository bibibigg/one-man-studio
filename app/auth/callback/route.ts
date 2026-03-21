import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 정확 일치 또는 슬래시로 구분된 서브패스만 허용 — /editorsomething 같은 접두사 누수 차단
const ALLOWED_EXACT = ['/dashboard', '/create']
const ALLOWED_PREFIX = ['/editor/', '/preview/']

function safeNextPath(raw: string | null): string {
  if (!raw) return '/dashboard'
  if (raw.startsWith('/') && !raw.startsWith('//')) {
    if (ALLOWED_EXACT.includes(raw)) return raw
    if (ALLOWED_PREFIX.some((p) => raw.startsWith(p))) return raw
  }
  return '/dashboard'
}

// 모든 OAuth 제공자 (Google, GitHub 등)의 공통 PKCE 콜백 핸들러
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeNextPath(searchParams.get('next'))

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // code 없음(사용자 취소) 또는 exchangeCodeForSession 실패
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}

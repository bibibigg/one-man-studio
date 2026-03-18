import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 공유 링크 토큰 형식: crypto.getRandomValues로 생성한 128비트 hex (32자)
const TOKEN_PATTERN = /^[0-9a-f]{32}$/

export default async function proxy(req: NextRequest) {
  let response = NextResponse.next({ request: req })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          response = NextResponse.next({ request: req })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getSession() 대신 getUser() 사용 — 서버에서 토큰을 재검증하므로 미들웨어 보안에 적합
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  const { pathname } = req.nextUrl

  const protectedPaths = ['/dashboard', '/create', '/editor', '/preview']
  const isProtectedRoute = protectedPaths.some((path) => pathname.startsWith(path))

  // Allow /preview access when a valid share token is present (public shared links)
  const rawToken = req.nextUrl.searchParams.get('token')
  const isPreviewWithToken =
    pathname.startsWith('/preview') &&
    rawToken !== null &&
    TOKEN_PATTERN.test(rawToken)

  if (isProtectedRoute && !isLoggedIn && !isPreviewWithToken) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  if (pathname === '/login' && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl))
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

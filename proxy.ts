import { auth } from '@/lib/auth/auth'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  const protectedPaths = ['/dashboard', '/create', '/editor', '/preview']
  const isProtectedRoute = protectedPaths.some((path) =>
    pathname.startsWith(path)
  )

  // Allow /preview access when a valid share token is present (public shared links)
  // Token format: 32-char hex (128-bit from crypto.getRandomValues)
  const TOKEN_PATTERN = /^[0-9a-f]{32}$/
  const rawToken = req.nextUrl.searchParams.get('token')
  const isPreviewWithToken =
    pathname.startsWith('/preview') &&
    rawToken !== null &&
    TOKEN_PATTERN.test(rawToken)

  if (isProtectedRoute && !isLoggedIn && !isPreviewWithToken) {
    return Response.redirect(new URL('/login', req.nextUrl))
  }

  if (pathname === '/login' && isLoggedIn) {
    return Response.redirect(new URL('/dashboard', req.nextUrl))
  }

  return undefined
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

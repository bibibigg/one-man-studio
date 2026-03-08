'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'

export function Header() {
  const { isAuthenticated, isLoading } = useAuth()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between px-6 md:px-12">
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm" aria-hidden="true" />

      <Link href="/" className="relative z-10 text-lg font-semibold tracking-tight text-white">
        One Man Studio
      </Link>

      <nav className="relative z-10 hidden items-center gap-8 md:flex">
        <Link href="/#how-it-works" className="text-sm text-gray-400 transition-colors hover:text-white">
          작동 방식
        </Link>
        <Link href="/#categories" className="text-sm text-gray-400 transition-colors hover:text-white">
          카테고리
        </Link>
      </nav>

      <div className="relative z-10">
        {!isLoading && (
          isAuthenticated ? (
            <Link
              href="/dashboard"
              className="inline-flex h-9 items-center rounded-lg bg-white px-4 text-sm font-medium text-black transition-colors hover:bg-gray-100"
            >
              대시보드
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-9 items-center rounded-lg border border-gray-700 px-4 text-sm font-medium text-white transition-colors hover:bg-gray-900"
            >
              로그인
            </Link>
          )
        )}
      </div>
    </header>
  )
}

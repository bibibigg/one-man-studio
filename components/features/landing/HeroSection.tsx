'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP)
}

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      tl.fromTo(
        '.hero-eyebrow',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.7 }
      )
        .fromTo(
          '.hero-title',
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.9 },
          '-=0.4'
        )
        .fromTo(
          '.hero-subtitle',
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.7 },
          '-=0.5'
        )
        .fromTo(
          '.hero-cta',
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6 },
          '-=0.3'
        )
        .fromTo(
          '.hero-scroll',
          { opacity: 0 },
          { opacity: 1, duration: 0.5 },
          '-=0.1'
        )
    },
    { scope: containerRef }
  )

  return (
    <section
      ref={containerRef}
      aria-label="히어로"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center"
    >
      {/* Background gradient */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,255,255,0.04) 0%, transparent 70%)',
        }}
      />

      {/* Grid lines */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      <div className="relative z-10 max-w-4xl">
        <p className="hero-eyebrow mb-6 inline-block rounded-full border border-gray-800 bg-gray-950 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-gray-400">
          AI Video Production
        </p>

        <h1 className="hero-title mb-6 text-5xl font-bold leading-[1.1] tracking-tight text-white md:text-7xl lg:text-8xl">
          한 사람이
          <br />
          <span className="text-gray-500">만드는 영화</span>
        </h1>

        <p className="hero-subtitle mx-auto mb-10 max-w-xl text-lg leading-relaxed text-gray-400 md:text-xl">
          시나리오를 입력하면 AI가 장면을 분석하고,
          <br className="hidden md:block" />
          영상을 생성해 완성된 비디오를 만들어 드립니다.
        </p>

        <div className="hero-cta flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="inline-flex h-12 items-center rounded-lg bg-white px-8 text-sm font-semibold text-black transition-colors hover:bg-gray-100"
          >
            지금 시작하기
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex h-12 items-center rounded-lg border border-gray-800 px-8 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-900"
          >
            작동 방식 보기
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="hero-scroll absolute bottom-10 left-1/2 -translate-x-1/2" aria-hidden="true">
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-gray-600 uppercase tracking-widest">Scroll</span>
          <div className="h-10 w-px bg-gradient-to-b from-gray-600 to-transparent" />
        </div>
      </div>
    </section>
  )
}

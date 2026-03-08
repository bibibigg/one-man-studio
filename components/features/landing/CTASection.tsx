'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP)
}

export function CTASection() {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      gsap.fromTo(
        '.cta-content',
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.cta-content',
            start: 'top 85%',
          },
        }
      )
    },
    { scope: containerRef }
  )

  return (
    <section
      ref={containerRef}
      aria-label="시작하기"
      className="px-6 py-32 md:px-12"
    >
      <div className="mx-auto max-w-4xl">
        <div className="cta-content relative overflow-hidden rounded-3xl border border-gray-800 bg-gray-950 px-8 py-20 text-center">
          {/* Background glow */}
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
            style={{
              background:
                'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(255,255,255,0.03) 0%, transparent 70%)',
            }}
          />

          <p className="relative mb-4 text-xs font-medium uppercase tracking-widest text-gray-600">
            Get Started
          </p>

          <h2 className="relative mb-6 text-4xl font-bold leading-tight tracking-tight text-white md:text-6xl">
            지금 바로
            <br />
            <span className="text-gray-500">시작하세요</span>
          </h2>

          <p className="relative mx-auto mb-10 max-w-md text-base leading-relaxed text-gray-500">
            로그인 한 번으로 AI 영상 제작을 시작할 수 있습니다.
            <br />
            하루 3개까지 무료로 제작해 보세요.
          </p>

          <div className="relative flex justify-center">
            <Link
              href="/login"
              className="inline-flex h-12 items-center rounded-lg bg-white px-10 text-sm font-semibold text-black transition-colors hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              무료로 시작하기
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

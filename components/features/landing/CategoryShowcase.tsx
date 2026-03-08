'use client'

import { useRef } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP)
}

interface ShowcaseCategory {
  id: string
  name: string
  nameKo: string
  description: string
  gradient: string
  icon: ReactNode
  examples: string[]
}

const CATEGORIES: ShowcaseCategory[] = [
  {
    id: 'ad',
    name: 'Advertisement',
    nameKo: '광고',
    description: '브랜드 스토리를 임팩트 있는 영상으로. 제품 홍보부터 감성 브랜딩까지.',
    gradient: 'from-blue-950 to-black',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
      </svg>
    ),
    examples: ['제품 광고', '브랜드 필름', '소셜 콘텐츠'],
  },
  {
    id: 'anime',
    name: 'Animation',
    nameKo: '애니메이션',
    description: '상상력을 현실로. 독창적인 캐릭터와 세계관을 가진 애니메이션을 제작하세요.',
    gradient: 'from-purple-950 to-black',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
      </svg>
    ),
    examples: ['단편 애니메이션', '판타지', '액션'],
  },
  {
    id: 'movie',
    name: 'Movie',
    nameKo: '영화',
    description: '단편 영화의 모든 요소를 AI로 구현. 시나리오부터 완성 영상까지 혼자 만드세요.',
    gradient: 'from-amber-950 to-black',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
      </svg>
    ),
    examples: ['로맨스', '스릴러', '코미디'],
  },
]

export function CategoryShowcase() {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      gsap.fromTo(
        '.cat-heading',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.cat-heading',
            start: 'top 85%',
          },
        }
      )

      gsap.fromTo(
        '.cat-card',
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.12,
          scrollTrigger: {
            trigger: '.cat-grid',
            start: 'top 80%',
          },
        }
      )
    },
    { scope: containerRef }
  )

  return (
    <section
      id="categories"
      ref={containerRef}
      aria-label="카테고리"
      className="px-6 py-32 md:px-12"
    >
      <div className="mx-auto max-w-6xl">
        <div className="cat-heading mb-20 text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-gray-600">
            Categories
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
            어떤 영상이든
            <br />
            <span className="text-gray-500">만들 수 있습니다</span>
          </h2>
        </div>

        <div className="cat-grid grid gap-4 md:grid-cols-3">
          {CATEGORIES.map((category) => (
            <Link
              key={category.id}
              href="/login"
              aria-label={`${category.nameKo} 카테고리로 시작하기`}
              className={`cat-card group relative overflow-hidden rounded-2xl bg-gradient-to-b ${category.gradient} border border-gray-900 p-8 transition-all duration-300 hover:border-gray-700 hover:scale-[1.02]`}
            >
              {/* Icon */}
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 transition-colors group-hover:text-white">
                {category.icon}
              </div>

              {/* Labels */}
              <p className="mb-1 text-xs font-medium uppercase tracking-widest text-gray-600">
                {category.name}
              </p>
              <h3 className="mb-4 text-2xl font-bold text-white">{category.nameKo}</h3>
              <p className="mb-6 text-sm leading-relaxed text-gray-500">{category.description}</p>

              {/* Examples */}
              <div className="flex flex-wrap gap-2">
                {category.examples.map((example) => (
                  <span
                    key={example}
                    className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-500"
                  >
                    {example}
                  </span>
                ))}
              </div>

              {/* Arrow */}
              <div className="absolute right-6 top-6 text-gray-700 transition-colors group-hover:text-gray-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

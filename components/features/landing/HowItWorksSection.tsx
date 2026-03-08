'use client'

import { useRef } from 'react'
import type { ReactNode } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP)
}

interface Step {
  id: string
  number: string
  title: string
  description: string
  icon: ReactNode
}

const STEPS: Step[] = [
  {
    id: 'write-scenario',
    number: '01',
    title: '시나리오 작성',
    description:
      '만들고 싶은 영상의 시나리오를 입력하세요. 짧은 광고부터 단편 영화까지 어떤 형식도 가능합니다.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      </svg>
    ),
  },
  {
    id: 'ai-generate',
    number: '02',
    title: 'AI 장면 생성',
    description:
      'AI가 시나리오를 분석해 장면별로 분리하고, 이미지와 영상을 자동으로 생성합니다.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
      </svg>
    ),
  },
  {
    id: 'complete-video',
    number: '03',
    title: '비디오 완성',
    description:
      '에디터에서 장면 순서와 전환 효과를 조정하고, 완성된 영상을 바로 다운로드하세요.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375z" />
      </svg>
    ),
  },
]

export function HowItWorksSection() {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      gsap.fromTo(
        '.hiw-heading',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.hiw-heading',
            start: 'top 85%',
          },
        }
      )

      gsap.fromTo(
        '.hiw-step',
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.15,
          scrollTrigger: {
            trigger: '.hiw-steps',
            start: 'top 80%',
          },
        }
      )
    },
    { scope: containerRef }
  )

  return (
    <section
      id="how-it-works"
      ref={containerRef}
      aria-label="작동 방식"
      className="px-6 py-32 md:px-12"
    >
      <div className="mx-auto max-w-6xl">
        <div className="hiw-heading mb-20 text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-gray-600">
            How It Works
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
            세 단계로 완성하는
            <br />
            <span className="text-gray-500">나만의 영상</span>
          </h2>
        </div>

        <ol className="hiw-steps grid gap-6 md:grid-cols-3">
          {STEPS.map((step) => (
            <li
              key={step.id}
              className="hiw-step group relative rounded-2xl border border-gray-900 bg-gray-950 p-8 transition-colors hover:border-gray-700"
            >
              {/* Step number */}
              <p className="mb-6 font-mono text-xs text-gray-700">{step.number}</p>

              {/* Icon */}
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-gray-800 bg-gray-900 text-gray-400 transition-colors group-hover:border-gray-600 group-hover:text-white">
                {step.icon}
              </div>

              <h3 className="mb-3 text-lg font-semibold text-white">{step.title}</h3>
              <p className="text-sm leading-relaxed text-gray-500">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

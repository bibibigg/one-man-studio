import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'

export const metadata: Metadata = {
  title: 'One Man Studio - AI 영상 제작 서비스',
  description: '시나리오를 입력하면 AI가 장면을 분석하고 영상을 자동으로 제작합니다. 하루 3개 무료.',
  openGraph: {
    title: 'One Man Studio',
    description: '시나리오를 입력하면 AI가 영상을 자동으로 제작합니다.',
    type: 'website',
  },
}
import { Footer } from '@/components/layout/Footer'
import { HeroSection } from '@/components/features/landing/HeroSection'
import { HowItWorksSection } from '@/components/features/landing/HowItWorksSection'
import { CategoryShowcase } from '@/components/features/landing/CategoryShowcase'
import { CTASection } from '@/components/features/landing/CTASection'

export default function LandingPage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <CategoryShowcase />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}

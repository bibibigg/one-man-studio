import type { Metadata } from 'next'
import { LoginButton } from '@/components/features/auth/LoginButton'

export const metadata: Metadata = {
  title: '로그인 - One Man Studio',
  description: 'Google 계정으로 로그인하여 AI 영상 제작을 시작하세요.',
}

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">One Man Studio</h1>
        <p className="mt-2 text-sm text-gray-400">
          AI로 나만의 영상을 만들어보세요
        </p>
      </div>

      <div className="space-y-3">
        <LoginButton provider="google" />
      </div>

      <p className="text-center text-xs text-gray-500">
        로그인하면 서비스 이용약관에 동의하게 됩니다
      </p>
    </div>
  )
}

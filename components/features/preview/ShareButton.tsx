'use client'

import { useRef, useState } from 'react'
import { Toast } from '@/components/ui/Toast'

interface ShareButtonProps {
  projectId: string
  existingToken?: string | null
}

export function ShareButton({ projectId, existingToken }: ShareButtonProps) {
  const [shareToken, setShareToken] = useState<string | null>(existingToken ?? null)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function handleShare() {
    if (shareToken) {
      await copyLink(shareToken)
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/share`, { method: 'POST' })
      const data = (await res.json()) as { shareToken?: string; error?: string }

      if (!res.ok || !data.shareToken) {
        setErrorMessage(data.error ?? '공유 링크 생성에 실패했습니다')
        return
      }

      setShareToken(data.shareToken)
      await copyLink(data.shareToken)
    } catch {
      setErrorMessage('공유 링크 생성에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  async function copyLink(token: string) {
    const url = `${window.location.origin}/preview/${projectId}?token=${token}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      // Clear any previous timer before setting a new one
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for environments without clipboard API
      prompt('아래 링크를 복사하세요:', url)
    }
  }

  return (
    <>
      <button
        onClick={handleShare}
        disabled={isLoading}
        className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 disabled:opacity-50"
      >
        {isLoading ? (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : copied ? (
          <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
        )}
        {copied ? '링크 복사됨!' : shareToken ? '링크 복사' : '공유 링크 생성'}
      </button>

      <Toast
        message={errorMessage ?? ''}
        type="error"
        isVisible={!!errorMessage}
        onClose={() => setErrorMessage(null)}
      />
    </>
  )
}

'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { ProjectStatus } from '@/types/project'

interface ProjectCardProps {
  id: string
  name: string
  status: ProjectStatus
  thumbnailUrl?: string | null
  finalVideoUrl?: string | null
  updatedAt: string
  onDelete: (id: string) => void
  isDeleting: boolean
}

const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: '초안',
  splitting: '장면 분석 중',
  generating: '생성 중',
  editing: '편집 중',
  exporting: '내보내는 중',
  completed: '완료',
  failed: '실패',
}

const STATUS_COLORS: Record<ProjectStatus, string> = {
  draft: 'bg-zinc-700 text-zinc-300',
  splitting: 'bg-blue-900/60 text-blue-300',
  generating: 'bg-yellow-900/60 text-yellow-300',
  editing: 'bg-purple-900/60 text-purple-300',
  exporting: 'bg-orange-900/60 text-orange-300',
  completed: 'bg-green-900/60 text-green-300',
  failed: 'bg-red-900/60 text-red-300',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function ProjectCard({
  id,
  name,
  status,
  thumbnailUrl,
  finalVideoUrl,
  updatedAt,
  onDelete,
  isDeleting,
}: ProjectCardProps) {
  const editorHref = `/editor/${id}`
  const previewHref = `/preview/${id}`
  const canPreview = status === 'completed' && !!finalVideoUrl

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-colors hover:border-white/20 hover:bg-white/8">
      {/* Thumbnail */}
      <Link href={editorHref} className="relative block aspect-video w-full bg-zinc-900">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg
              className="h-12 w-12 text-white/20"
              aria-hidden="true"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
        {/* Status badge overlay */}
        <span
          className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[status]}`}
        >
          {STATUS_LABELS[status]}
        </span>
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <Link href={editorHref} className="block font-medium text-white hover:text-white/80">
            {name}
          </Link>
          <p className="mt-0.5 text-xs text-white/40">{formatDate(updatedAt)}</p>
        </div>

        {/* Actions */}
        <div className="mt-auto flex items-center gap-2">
          <Link
            href={editorHref}
            className="flex-1 rounded-lg bg-white/10 px-3 py-1.5 text-center text-xs font-medium text-white/80 transition-colors hover:bg-white/20"
          >
            편집
          </Link>
          {canPreview && (
            <Link
              href={previewHref}
              className="flex-1 rounded-lg bg-white px-3 py-1.5 text-center text-xs font-medium text-black transition-colors hover:bg-white/90"
            >
              미리보기
            </Link>
          )}
          <button
            onClick={() => onDelete(id)}
            disabled={isDeleting}
            className="rounded-lg p-1.5 text-white/30 transition-colors hover:bg-red-900/40 hover:text-red-400 disabled:opacity-50"
            aria-label="삭제"
            title="삭제"
          >
            <svg className="h-4 w-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

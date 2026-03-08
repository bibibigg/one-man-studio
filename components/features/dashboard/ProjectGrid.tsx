'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ProjectCard } from './ProjectCard'
import { Modal } from '@/components/ui/Modal'
import { Toast } from '@/components/ui/Toast'
import type { ProjectRow } from '@/types/project'

interface ProjectGridProps {
  initialProjects: ProjectRow[]
}

export function ProjectGrid({ initialProjects }: ProjectGridProps) {
  const [projects, setProjects] = useState(initialProjects)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  function requestDelete(id: string) {
    setPendingDeleteId(id)
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return
    const id = pendingDeleteId
    setPendingDeleteId(null)
    setDeletingId(id)
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        setErrorMessage(data.error ?? '삭제에 실패했습니다')
        return
      }
      setProjects((prev) => prev.filter((p) => p.id !== id))
    } catch {
      setErrorMessage('삭제에 실패했습니다')
    } finally {
      setDeletingId(null)
    }
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-24 text-center">
        <svg
          className="mb-4 h-16 w-16 text-white/20"
          aria-hidden="true"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
          />
        </svg>
        <p className="text-white/40">아직 프로젝트가 없습니다</p>
        <p className="mt-1 text-sm text-white/20">새 프로젝트를 만들어 시작하세요</p>
        <Link
          href="/create"
          className="mt-6 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-white/90"
        >
          첫 번째 영상 만들기
        </Link>
      </div>
    )
  }

  const pendingDeleteName = projects.find((p) => p.id === pendingDeleteId)?.name

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            id={project.id}
            name={project.name}
            status={project.status}
            thumbnailUrl={project.thumbnail_url}
            finalVideoUrl={project.final_video_url}
            updatedAt={project.updated_at}
            onDelete={requestDelete}
            isDeleting={deletingId === project.id}
          />
        ))}
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!pendingDeleteId}
        onClose={() => setPendingDeleteId(null)}
        title="프로젝트 삭제"
      >
        <p className="text-sm text-gray-300">
          <span className="font-medium text-white">{pendingDeleteName}</span>을(를) 삭제하시겠습니까?
          이 작업은 되돌릴 수 없습니다.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={() => setPendingDeleteId(null)}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-800"
          >
            취소
          </button>
          <button
            onClick={confirmDelete}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            삭제
          </button>
        </div>
      </Modal>

      {/* Error toast */}
      <Toast
        message={errorMessage ?? ''}
        type="error"
        isVisible={!!errorMessage}
        onClose={() => setErrorMessage(null)}
      />
    </>
  )
}

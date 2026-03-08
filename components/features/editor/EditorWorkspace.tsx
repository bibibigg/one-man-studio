'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

import { useEditorStore } from '@/lib/stores/editor'
import type { EditorScene } from '@/types/editor'
import type { SceneCompositionState } from '@/lib/stores/editor'

import { EditorPlayer } from './EditorPlayer'
import { EditorTimeline } from './EditorTimeline'
import { SceneControlsPanel } from './SceneControlsPanel'

interface EditorWorkspaceProps {
  projectId: string
  projectName: string
  scenes: EditorScene[]
  savedCompositions?: Record<string, Partial<SceneCompositionState>>
}

export function EditorWorkspace({
  projectId,
  projectName,
  scenes,
  savedCompositions,
}: EditorWorkspaceProps) {
  const router = useRouter()
  const { initEditor, sceneOrder, compositions, isSaving, setIsSaving } = useEditorStore()

  useEffect(() => {
    initEditor(projectName, scenes, savedCompositions)
    // Intentional empty deps: run once on mount with server-provided initial data.
    // Re-running would discard unsaved user edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compositionState: compositions,
          sceneOrder,
        }),
      })
      if (!res.ok) throw new Error('저장 실패')
    } catch (err) {
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }, [projectId, compositions, sceneOrder, setIsSaving])

  const handleExport = useCallback(() => {
    // Phase 8: full export implementation
    alert('내보내기는 Phase 8에서 구현됩니다')
  }, [])

  return (
    <div className="flex h-screen flex-col bg-black text-white">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-white/40 hover:text-white/80 transition-colors"
          >
            ← 대시보드
          </button>
          <span className="text-white/20">|</span>
          <h1 className="text-sm font-semibold text-white">{projectName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-lg border border-white/20 px-4 py-1.5 text-sm text-white/80 transition-colors hover:border-white/40 disabled:opacity-40"
          >
            {isSaving ? '저장 중...' : '저장'}
          </button>
          <button
            onClick={handleExport}
            className="rounded-lg bg-white px-4 py-1.5 text-sm font-semibold text-black"
          >
            내보내기
          </button>
        </div>
      </header>

      {/* Main area: player + controls */}
      <div className="flex flex-1 overflow-hidden">
        {/* Player */}
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-4xl">
            <EditorPlayer />
          </div>
        </div>

        {/* Scene controls */}
        <aside className="w-64 shrink-0 border-l border-white/10">
          <div className="border-b border-white/10 px-4 py-3">
            <h2 className="text-xs font-medium uppercase tracking-wide text-white/40">장면 설정</h2>
          </div>
          <SceneControlsPanel />
        </aside>
      </div>

      {/* Timeline */}
      <EditorTimeline />
    </div>
  )
}

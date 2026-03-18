import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { getAuthenticatedUser } from '@/lib/auth/server'

export const metadata: Metadata = {
  title: '내 프로젝트 - One Man Studio',
  description: '진행 중인 AI 영상 프로젝트를 확인하고 관리하세요.',
}

import { getServiceSupabase } from '@/lib/api/supabase'
import { ProjectGrid } from '@/components/features/dashboard/ProjectGrid'
import type { ProjectStatus, ProjectRow } from '@/types/project'

const VALID_STATUSES = new Set<string>([
  'draft', 'splitting', 'generating', 'editing', 'exporting', 'completed', 'failed',
])

function toProjectStatus(value: string): ProjectStatus {
  return VALID_STATUSES.has(value) ? (value as ProjectStatus) : 'draft'
}

export default async function DashboardPage() {
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect('/login')
  }

  const supabase = getServiceSupabase()

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, status, thumbnail_url, final_video_url, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  const typedProjects: ProjectRow[] = (projects ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    status: toProjectStatus(p.status),
    thumbnail_url: p.thumbnail_url,
    final_video_url: p.final_video_url,
    updated_at: p.updated_at,
  }))

  return (
    <div className="min-h-screen bg-black px-4 py-12">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">내 프로젝트</h1>
            <p className="mt-1 text-sm text-white/40">
              {(user.user_metadata?.full_name as string | undefined) ?? user.email}
            </p>
          </div>
          <Link
            href="/create"
            className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-white/90"
          >
            <svg className="h-4 w-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            새 프로젝트
          </Link>
        </div>

        {/* Project Grid */}
        <ProjectGrid initialProjects={typedProjects} />
      </div>
    </div>
  )
}

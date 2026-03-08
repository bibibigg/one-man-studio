import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { auth } from '@/lib/auth/auth'
import { getServiceSupabase } from '@/lib/api/supabase'
import { VideoPlayer } from '@/components/features/preview/VideoPlayer'
import { ShareButton } from '@/components/features/preview/ShareButton'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ token?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = getServiceSupabase()

  const { data: project } = await supabase
    .from('projects')
    .select('name')
    .eq('id', id)
    .single()

  const name = project?.name ?? '영상 미리보기'

  return {
    title: `${name} - One Man Studio`,
    description: `One Man Studio로 제작한 AI 영상 "${name}"을 감상하세요.`,
  }
}

export default async function PreviewPage({ params, searchParams }: Props) {
  const { id } = await params
  const { token } = await searchParams

  const supabase = getServiceSupabase()

  // Allow public access via share token
  if (token) {
    const { data: project } = await supabase
      .from('projects')
      .select('id, name, final_video_url, share_token, status')
      .eq('id', id)
      .eq('share_token', token)
      .single()

    if (!project?.final_video_url) notFound()

    return <PreviewLayout project={project} isOwner={false} />
  }

  // Require auth for owner access
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select('id, name, final_video_url, share_token, status')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single()

  if (!project) notFound()

  if (!project.final_video_url) {
    // No final video yet → redirect to editor
    redirect(`/editor/${id}`)
  }

  return <PreviewLayout project={project} isOwner />
}

interface PreviewLayoutProps {
  project: {
    id: string
    name: string
    final_video_url: string
    share_token: string | null
    status: string
  }
  isOwner: boolean
}

function PreviewLayout({ project, isOwner }: PreviewLayoutProps) {
  return (
    <div className="min-h-screen bg-black px-4 py-12">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          {isOwner ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-sm text-white/40 transition-colors hover:text-white/80"
            >
              <svg className="h-4 w-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
              대시보드
            </Link>
          ) : (
            <span className="text-sm text-white/30">One Man Studio</span>
          )}

          <div className="flex items-center gap-2">
            {isOwner && (
              <>
                <Link
                  href={`/editor/${project.id}`}
                  className="rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10"
                >
                  편집하기
                </Link>
                <ShareButton projectId={project.id} existingToken={project.share_token} />
              </>
            )}
            <a
              href={project.final_video_url}
              download={project.name}
              className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-white/90"
            >
              <svg className="h-4 w-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              다운로드
            </a>
          </div>
        </div>

        {/* Video */}
        <VideoPlayer src={project.final_video_url} title={project.name} />

        {/* Title */}
        <div className="mt-6">
          <h1 className="text-xl font-semibold text-white">{project.name}</h1>
        </div>
      </div>
    </div>
  )
}

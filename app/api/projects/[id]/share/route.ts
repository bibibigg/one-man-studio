import { getAuthenticatedUserId } from '@/lib/auth/server'
import { getServiceSupabase } from '@/lib/api/supabase'

interface Props {
  params: Promise<{ id: string }>
}

function generateShareToken(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function POST(_req: Request, { params }: Props) {
  const { id } = await params

  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceSupabase()

  const { data: project } = await supabase
    .from('projects')
    .select('id, share_token, status, final_video_url')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (!project) {
    return Response.json({ error: 'Project not found' }, { status: 404 })
  }

  if (project.status !== 'completed' || !project.final_video_url) {
    return Response.json(
      { error: '완성된 프로젝트만 공유할 수 있습니다' },
      { status: 400 }
    )
  }

  // Reuse existing token if already generated
  if (project.share_token) {
    return Response.json({ shareToken: project.share_token })
  }

  const shareToken = generateShareToken()

  const { error } = await supabase
    .from('projects')
    .update({ share_token: shareToken })
    .eq('id', id)

  if (error) {
    console.error('Failed to generate share token:', error.message)
    return Response.json({ error: '공유 링크 생성에 실패했습니다' }, { status: 500 })
  }

  return Response.json({ shareToken })
}

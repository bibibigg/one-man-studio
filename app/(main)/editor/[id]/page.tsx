import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { auth } from '@/lib/auth/auth'

export const metadata: Metadata = {
  title: '에디터 - One Man Studio',
  description: 'AI 생성 영상 클립을 편집하고 완성된 영상을 내보내세요.',
}

import { getServiceSupabase } from '@/lib/api/supabase'
import { GenerationWorkspace } from '@/components/features/editor/GenerationWorkspace'
import { EditorWorkspace } from '@/components/features/editor/EditorWorkspace'
import type { EditorScene } from '@/types/editor'
import type { SceneCompositionState } from '@/lib/stores/editor'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditorPage({ params }: Props) {
  const { id } = await params

  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const supabase = getServiceSupabase()

  const { data: project } = await supabase
    .from('projects')
    .select('id, name, composition_state')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single()

  if (!project) notFound()

  const { data: sceneRows } = await supabase
    .from('scenes')
    .select(
      'id, order_index, description, visual_prompt, generation_mode, reference_image_url, generated_image_url, video_url, duration_frames'
    )
    .eq('project_id', id)
    .order('order_index')

  if (!sceneRows) notFound()

  const scenes: EditorScene[] = sceneRows.map((s) => ({
    id: s.id,
    orderIndex: s.order_index,
    description: s.description,
    visualPrompt: s.visual_prompt,
    generationMode: s.generation_mode,
    referenceImageUrl: s.reference_image_url,
    generatedImageUrl: s.generated_image_url,
    videoUrl: s.video_url,
    durationFrames: s.duration_frames,
  }))

  const allGenerated = scenes.length > 0 && scenes.every((s) => s.videoUrl)

  if (allGenerated) {
    const compositionState = project.composition_state as {
      compositions?: Record<string, Partial<SceneCompositionState>>
    } | null

    return (
      <EditorWorkspace
        projectId={project.id}
        projectName={project.name}
        scenes={scenes}
        savedCompositions={compositionState?.compositions}
      />
    )
  }

  return <GenerationWorkspace projectId={project.id} scenes={scenes} />
}

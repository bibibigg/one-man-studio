'use client'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { DragEndEvent } from '@dnd-kit/core'

import { useEditorStore } from '@/lib/stores/editor'
import type { EditorScene } from '@/types/editor'
import type { GenerationMode } from '@/types/scene'

const MODE_LABEL: Record<GenerationMode, string> = {
  text_to_video: 'T',
  image_to_video: 'I',
  image_text_to_video: 'I+T',
}

interface SortableSceneCardProps {
  sceneId: string
  scene: EditorScene
  index: number
  isSelected: boolean
  onSelect: (id: string) => void
}

function SortableSceneCard({ sceneId, scene, index, isSelected, onSelect }: SortableSceneCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sceneId,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(sceneId)}
      className={`flex h-20 w-32 shrink-0 cursor-pointer flex-col justify-between rounded-lg border p-2 transition-colors ${
        isSelected ? 'border-white bg-white/10' : 'border-white/20 bg-white/5 hover:border-white/40'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/40">장면 {index + 1}</span>
        <span className="rounded bg-white/10 px-1 py-0.5 text-[10px] font-medium text-white/60">
          {MODE_LABEL[scene.generationMode]}
        </span>
      </div>
      <p className="line-clamp-2 text-[10px] leading-tight text-white/70">{scene.description}</p>
    </div>
  )
}

export function EditorTimeline() {
  const { sceneOrder, scenesById, currentSceneId, reorderScenes, setCurrentScene } =
    useEditorStore()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = sceneOrder.indexOf(active.id as string)
    const newIndex = sceneOrder.indexOf(over.id as string)
    if (oldIndex !== -1 && newIndex !== -1) {
      reorderScenes(oldIndex, newIndex)
    }
  }

  if (sceneOrder.length === 0) return null

  return (
    <div className="border-t border-white/10 bg-black px-4 py-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sceneOrder} strategy={horizontalListSortingStrategy}>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {sceneOrder.map((id, i) => {
              const scene = scenesById[id]
              if (!scene) return null
              return (
                <SortableSceneCard
                  key={id}
                  sceneId={id}
                  scene={scene}
                  index={i}
                  isSelected={id === currentSceneId}
                  onSelect={setCurrentScene}
                />
              )
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

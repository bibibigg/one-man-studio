import { Skeleton } from '@/components/ui/Skeleton'

export default function EditorLoading() {
  return (
    <div role="status" aria-label="페이지 로딩 중" className="flex h-screen flex-col bg-black">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-gray-900 px-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Center — player */}
        <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-gray-950">
          <Skeleton className="aspect-video w-full max-w-4xl" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-2 w-64 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>

        {/* Right panel — controls (w-64, EditorWorkspace 기준) */}
        <div className="w-64 border-l border-gray-900 p-4 space-y-4">
          <Skeleton className="h-5 w-24" />
          <div className="space-y-3">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="h-28 border-t border-gray-900 p-3">
        <div className="flex h-full gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-full w-24 flex-shrink-0" />
          ))}
        </div>
      </div>
    </div>
  )
}

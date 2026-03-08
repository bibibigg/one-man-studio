interface VideoPlayerProps {
  src: string
  title: string
}

export function VideoPlayer({ src, title }: VideoPlayerProps) {
  return (
    <div className="overflow-hidden rounded-2xl bg-black shadow-2xl">
      <video
        src={src}
        controls
        playsInline
        className="aspect-video w-full"
        aria-label={title}
      />
    </div>
  )
}

export function Video({
  id,
  title = "YouTube video player",
  start,
}: {
  id: string;
  title?: string;
  start?: number;
}) {
  if (!id) throw new Error("Video component requires an `id` prop");
  const src = start
    ? `https://www.youtube.com/embed/${id}?start=${start}`
    : `https://www.youtube.com/embed/${id}`;
  return (
    <div className="my-6 aspect-video overflow-hidden rounded-lg">
      <iframe
        src={src}
        title={title}
        className="h-full w-full"
        frameBorder={0}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}

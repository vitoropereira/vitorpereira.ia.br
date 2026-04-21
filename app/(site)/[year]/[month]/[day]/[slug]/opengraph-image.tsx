import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/features/blog/lib/queries";
import { siteConfig } from "@/lib/siteConfig";

export const runtime = "edge";
export const alt = "Post preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ year: string; month: string; day: string; slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug("pt", slug);
  const title = post?.title ?? siteConfig.name;
  const date = post?.date
    ? new Date(post.date).toLocaleDateString("pt-BR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background: "#0f172a",
          color: "white",
        }}
      >
        <div style={{ fontSize: 28, color: "#94a3b8" }}>{siteConfig.name}</div>
        <div
          style={{
            display: "flex",
            fontSize: 60,
            fontWeight: 700,
            lineHeight: 1.1,
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 26, color: "#94a3b8" }}>{date}</div>
      </div>
    ),
    size,
  );
}

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
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "80px",
        background: "#070B12",
        color: "#E9EEF7",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            display: "flex",
            fontFamily: "monospace",
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: -2,
          }}
        >
          <span style={{ color: "#E9EEF7" }}>v</span>
          <span style={{ color: "#24C8FF" }}>&gt;</span>
          <span style={{ color: "#24C8FF" }}>_</span>
        </div>
        <div style={{ fontSize: 28, color: "#8593AB" }}>{siteConfig.name}</div>
      </div>
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
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ width: 60, height: 6, background: "#24C8FF", borderRadius: 3 }} />
        <div style={{ fontSize: 26, color: "#8593AB" }}>{date}</div>
      </div>
    </div>,
    size,
  );
}

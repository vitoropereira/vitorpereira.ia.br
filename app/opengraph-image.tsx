import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/siteConfig";

export const runtime = "edge";
export const alt = siteConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "80px",
          background: "#0f172a",
          color: "white",
        }}
      >
        <div style={{ fontSize: 80, fontWeight: 700 }}>{siteConfig.name}</div>
        <div style={{ fontSize: 32, marginTop: 24, color: "#94a3b8" }}>
          {siteConfig.tagline.pt}
        </div>
      </div>
    ),
    size,
  );
}

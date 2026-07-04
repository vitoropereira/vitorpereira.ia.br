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
          background: "#070B12",
          color: "#E9EEF7",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              fontFamily: "monospace",
              fontSize: 72,
              fontWeight: 700,
              letterSpacing: -3,
            }}
          >
            <span style={{ color: "#E9EEF7" }}>v</span>
            <span style={{ color: "#24C8FF" }}>&gt;</span>
            <span style={{ color: "#24C8FF" }}>_</span>
          </div>
          <div style={{ fontSize: 68, fontWeight: 700 }}>{siteConfig.name}</div>
        </div>
        <div style={{ fontSize: 32, marginTop: 28, color: "#8593AB", maxWidth: 900 }}>
          {siteConfig.statement.pt}
        </div>
        <div style={{ width: 120, height: 8, marginTop: 40, background: "#24C8FF", borderRadius: 4 }} />
      </div>
    ),
    size,
  );
}

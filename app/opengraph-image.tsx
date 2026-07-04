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
          <svg width="64" height="64" viewBox="0 0 64 64">
            <path d="M23 21 L35 32 L23 43" fill="none" stroke="#24C8FF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="30" y="40" width="14" height="5" rx="1.6" fill="#24C8FF" />
          </svg>
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

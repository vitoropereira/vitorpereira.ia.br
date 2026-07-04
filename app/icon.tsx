import { ImageResponse } from "next/og";

// Single source for the favicon (the "v>_" mark on brand ink), used for browser
// tabs, Android and the web manifest. Replaces the create-next-app
// favicon.ico (Vercel triangle), which was removed.
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#070B12",
          fontFamily: "monospace",
          fontSize: 230,
          fontWeight: 700,
          letterSpacing: -8,
        }}
      >
        <span style={{ color: "#E9EEF7" }}>v</span>
        <span style={{ color: "#24C8FF" }}>&gt;</span>
        <span style={{ color: "#24C8FF" }}>_</span>
      </div>
    ),
    size,
  );
}

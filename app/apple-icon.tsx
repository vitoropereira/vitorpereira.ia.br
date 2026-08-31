import { ImageResponse } from "next/og";

// Touch icon for iOS "Add to Home Screen" (iOS rounds the corners itself).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          fontSize: 80,
          fontWeight: 700,
          letterSpacing: -3,
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

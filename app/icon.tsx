import { ImageResponse } from "next/og";

// Modern PNG favicon for browser tabs / Android. The legacy .ico
// (app/favicon.ico) still covers older clients.
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
          background: "#0f172a",
          color: "white",
          fontSize: 270,
          fontWeight: 700,
          letterSpacing: -12,
        }}
      >
        VP
      </div>
    ),
    size,
  );
}

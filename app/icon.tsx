import { ImageResponse } from "next/og";

// Single source for the favicon ("VP" on the brand slate), used for browser
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

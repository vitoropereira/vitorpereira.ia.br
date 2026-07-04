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
          background: "#070B12",
        }}
      >
        <svg width="340" height="340" viewBox="0 0 64 64">
          <path
            d="M23 21 L35 32 L23 43"
            fill="none"
            stroke="#24C8FF"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="30" y="40" width="14" height="5" rx="1.6" fill="#24C8FF" />
        </svg>
      </div>
    ),
    size,
  );
}

import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const alt = "Mario Lavanga — Health AI, Causal Inference & Biosignal Processing";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0f172a 0%, #155e75 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 34, color: "#7dd3fc", letterSpacing: 2, marginBottom: 24 }}>
          SENIOR RESEARCH ENGINEER · HAMILTON MEDICAL
        </div>
        <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05 }}>Mario Lavanga</div>
        <div style={{ fontSize: 44, fontWeight: 600, marginTop: 28, color: "#e2e8f0" }}>
          Health AI · Causal Inference · Biosignal Processing
        </div>
        <div style={{ fontSize: 30, marginTop: 36, color: "#94a3b8", maxWidth: 980 }}>
          Machine learning shipped into ICU ventilators — on-device and in the cloud — through
          FDA-cleared software.
        </div>
      </div>
    ),
    { ...size }
  );
}

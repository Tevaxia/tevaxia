import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "tevaxia.lu — Outils immobiliers Luxembourg";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0F1B33 0%, #1B2A4A 50%, #2D4A7A 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "16px",
              background: "#C8A951",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "48px",
              fontWeight: "bold",
              color: "#0F1B33",
            }}
          >
            T
          </div>
          <div style={{ fontSize: "48px", fontWeight: "bold", color: "white" }}>
            tevaxia<span style={{ color: "#C8A951" }}>.lu</span>
          </div>
        </div>
        <div
          style={{
            fontSize: "36px",
            fontWeight: "bold",
            color: "white",
            textAlign: "center",
            lineHeight: 1.3,
            maxWidth: "900px",
          }}
        >
          L'immobilier luxembourgeois,
          <span style={{ color: "#C8A951" }}> calculé avec précision</span>
        </div>
        <div
          style={{
            fontSize: "20px",
            color: "rgba(255,255,255,0.6)",
            textAlign: "center",
            marginTop: "20px",
            maxWidth: "800px",
          }}
        >
          22 outils · 100 communes · Valorisation EVS 2025 · FR & EN
        </div>
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "40px",
          }}
        >
          {["Estimation", "Frais", "Plus-values", "Aides", "Valorisation EVS", "DCF", "MLV/CRR"].map((tag) => (
            <div
              key={tag}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "rgba(255,255,255,0.5)",
                fontSize: "14px",
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}

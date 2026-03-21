"use client";

import { WifiOff } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#070C1E",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        fontFamily: "'Nunito', sans-serif",
        color: "#fff",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <WifiOff size={40} style={{ color: "#FF2D87", opacity: 0.7 }} />
      <div
        style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: "13px",
          fontWeight: 900,
          letterSpacing: "2px",
          color: "#fff",
        }}
      >
        YOU'RE OFFLINE
      </div>
      <div
        style={{
          fontFamily: "'VT323', monospace",
          fontSize: "15px",
          color: "rgba(255,255,255,.4)",
          letterSpacing: "1px",
          maxWidth: "260px",
        }}
      >
        CHECK YOUR CONNECTION AND TRY AGAIN
      </div>
      <button
        onClick={() => window.location.reload()}
        style={{
          marginTop: "8px",
          padding: "8px 20px",
          borderRadius: "8px",
          background: "rgba(255,45,135,.12)",
          border: "1px solid rgba(255,45,135,.3)",
          color: "#FF2D87",
          fontFamily: "'VT323', monospace",
          fontSize: "12px",
          letterSpacing: "1.5px",
          cursor: "pointer",
        }}
      >
        RETRY
      </button>
    </div>
  );
}

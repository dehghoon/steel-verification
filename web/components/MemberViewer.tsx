"use client";

import dynamic from "next/dynamic";
import type { SectionRecord } from "@linkoteq/steel-verification-contracts";
import type { DisplayActions } from "./VerificationForm";

function InstantWPreview() {
  return (
    <div
      aria-label="W-section preview"
      style={{
        minHeight: 420,
        height: "100%",
        display: "grid",
        placeItems: "center",
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(180deg,#eef3f6 0%,#e7eef2 100%)",
      }}
    >
      <svg viewBox="0 0 520 520" width="100%" height="100%" role="img" aria-hidden="true" style={{ maxHeight: 560 }}>
        <defs>
          <linearGradient id="steelFront" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#4d82aa" />
            <stop offset="1" stopColor="#245575" />
          </linearGradient>
          <linearGradient id="steelSide" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#274f6b" />
            <stop offset="1" stopColor="#16394f" />
          </linearGradient>
          <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="14" stdDeviation="16" floodColor="#102a3a" floodOpacity="0.2" />
          </filter>
        </defs>
        <g opacity="0.28" stroke="#8ca1ad" strokeWidth="1">
          {Array.from({ length: 9 }, (_, i) => <line key={`v${i}`} x1={60 + i * 50} y1="70" x2={60 + i * 50} y2="470" />)}
          {Array.from({ length: 9 }, (_, i) => <line key={`h${i}`} x1="60" y1={70 + i * 50} x2="460" y2={70 + i * 50} />)}
        </g>
        <g transform="translate(105 42)" filter="url(#shadow)">
          <path d="M78 12h184l45 30H123z" fill="#6f98b4" />
          <path d="M78 12h184v46H78z" fill="url(#steelFront)" />
          <path d="M262 12l45 30v46l-45-30z" fill="url(#steelSide)" />
          <path d="M146 58h48v280h-48z" fill="url(#steelFront)" />
          <path d="M194 58l42 27v280l-42-27z" fill="url(#steelSide)" />
          <path d="M78 338h184v46H78z" fill="url(#steelFront)" />
          <path d="M262 338l45 27v46l-45-27z" fill="url(#steelSide)" />
          <path d="M78 338l45 27h184l-45-27z" fill="#6f98b4" />
          <rect x="52" y="392" width="244" height="18" rx="3" fill="#424c53" />
        </g>
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 16, textAlign: "center", fontSize: 12, color: "#607585", fontWeight: 650 }}>
        Preparing interactive 3D view…
      </div>
    </div>
  );
}

const Scene = dynamic(() => import("./MemberViewerScene"), {
  ssr: false,
  loading: () => <InstantWPreview />
});

export function MemberViewer({ section, actions }: { section: SectionRecord | null; actions: DisplayActions }) {
  if (!section) {
    return <div className="viewerFallback">Select an approved section to preview the interactive 3D member and top-end forces.</div>;
  }
  return <Scene section={section} actions={actions} />;
}

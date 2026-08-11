"use client";

import dynamic from "next/dynamic";
import type { SectionRecord } from "@linkoteq/steel-verification-contracts";

const Scene = dynamic(() => import("./MemberViewerScene"), {
  ssr: false,
  loading: () => <div className="viewerFallback">Loading 3D viewer…</div>
});

export function MemberViewer({ section }: { section: SectionRecord | null }) {
  if (!section) {
    return <div className="viewerFallback">Select an approved section to preview member geometry.</div>;
  }
  return <Scene section={section} />;
}

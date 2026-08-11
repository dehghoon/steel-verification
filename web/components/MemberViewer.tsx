"use client";

import dynamic from "next/dynamic";
import type { SectionRecord } from "@linkoteq/steel-verification-contracts";
import type { DisplayActions } from "./VerificationForm";

const Scene = dynamic(() => import("./MemberViewerScene"), {
  ssr: false,
  loading: () => <div className="viewerFallback">Loading interactive 3D viewer…</div>
});

export function MemberViewer({ section, actions }: { section: SectionRecord | null; actions: DisplayActions }) {
  if (!section) {
    return <div className="viewerFallback">Select an approved section to preview the interactive 3D member and top-end forces.</div>;
  }
  return <Scene section={section} actions={actions} />;
}

"use client";

import { useCallback, useState } from "react";
import type { SectionRecord, VerificationResponse } from "@linkoteq/steel-verification-contracts";
import { MemberViewer } from "@/components/MemberViewer";
import { ResultsPanel } from "@/components/ResultsPanel";
import { SectionSelector } from "@/components/SectionSelector";
import { VerificationForm, type DisplayActions } from "@/components/VerificationForm";

const emptyActions: DisplayActions = {
  compressionKn: 0,
  tensionKn: 0,
  shearMajorKn: 0,
  shearMinorKn: 0,
  momentMajorKnm: 0,
  momentMinorKnm: 0
};

export default function HomePage() {
  const [section, setSection] = useState<SectionRecord | null>(null);
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [actions, setActions] = useState<DisplayActions>(emptyActions);
  const handleActionsChange = useCallback((next: DisplayActions) => setActions(next), []);

  return (
    <main>
      <header className="topbar">
        <div className="brandMark">L</div>
        <div>
          <strong>LinkoTech Engineering</strong>
          <span>Steel Verification</span>
        </div>
        <div className="codeBadge">CSA S16:2019</div>
      </header>
      <section className="hero">
        <span className="eyebrow">Structural steel design</span>
        <h1>W-section member verification</h1>
        <p>Validated engineering calculations served through a traceable API. Section properties come only from the configured approved CISC dataset.</p>
      </section>
      <div className="workspace">
        <div className="inputColumn">
          <SectionSelector value={section} onChange={(next) => { setSection(next); setResult(null); }} />
          <VerificationForm section={section} onResult={setResult} onActionsChange={handleActionsChange} />
        </div>
        <div className="resultColumn">
          <MemberViewer section={section} actions={actions} />
          <ResultsPanel result={result} />
        </div>
      </div>
      <footer>
        <span>Calculation engine: ECS-WSECTION-CSA-S16-2019-001 v0.2</span>
        <span>Temporary development mode: report preview and browser PDF printing are enabled without subscription authorization.</span>
      </footer>
    </main>
  );
}

"use client";

import { useCallback, useState } from "react";
import type { SectionRecord, VerificationResponse } from "@linkoteq/steel-verification-contracts";
import { MemberViewer } from "@/components/MemberViewer";
import { ResultsPanel } from "@/components/ResultsPanel";
import { SectionSelector } from "@/components/SectionSelector";
import { VerificationForm, type DisplayActions } from "@/components/VerificationForm";

type Tab = "model" | "input" | "results" | "report";
const emptyActions: DisplayActions = { axialKn: 0, shearMajorKn: 0, shearMinorKn: 0, momentMajorKnm: 0, momentMinorKnm: 0 };

export default function HomePage() {
  const [section, setSection] = useState<SectionRecord | null>(null);
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [actions, setActions] = useState<DisplayActions>(emptyActions);
  const [tab, setTab] = useState<Tab>("model");
  const handleActionsChange = useCallback((next: DisplayActions) => setActions(next), []);

  return <main>
    <header className="topbar"><div className="brandMark">L</div><div><strong>LinkoTech Engineering</strong><span>Steel Verification</span></div><div className="codeBadge">CSA S16:2019</div></header>
    <nav className="toolTabs toolTabsAlwaysVisible" aria-label="Tool views">
      {(["model", "input", "results", "report"] as Tab[]).map(t => <button type="button" key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>{t === "results" ? "Results" : t[0].toUpperCase() + t.slice(1)}</button>)}
    </nav>
    <div className="tabWorkspace">
      {tab === "model" && <div className="modelTab">
        <SectionSelector value={section} compact onChange={next => { setSection(next); setResult(null); }} />
        <MemberViewer section={section} actions={actions} />
        <div className="modelSelectionSummary"><span>Selected section</span><strong>{section?.designation ?? "W100X19"}</strong><small>Change section here. Forces and member inputs are in the Input tab.</small></div>
      </div>}
      {tab === "input" && <div className="inputTab"><VerificationForm section={section} onResult={setResult} onActionsChange={handleActionsChange} /></div>}
      {tab === "results" && <div className="resultsOnly"><ResultsPanel result={result} mode="results" /></div>}
      {tab === "report" && <div className="reportOnly"><ResultsPanel result={result} mode="report" /></div>}
    </div>
    <footer><span>Calculation engine: ECS-WSECTION-CSA-S16-2019-001 v0.2</span><span>Inputs recalculate automatically.</span></footer>
  </main>;
}

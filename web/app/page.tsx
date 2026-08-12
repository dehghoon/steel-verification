"use client";

import { useCallback, useState } from "react";
import type { SectionRecord, VerificationResponse } from "@linkoteq/steel-verification-contracts";
import { MemberViewer } from "@/components/MemberViewer";
import { ResultsPanel } from "@/components/ResultsPanel";
import { SectionSelector } from "@/components/SectionSelector";
import { SiteHeader } from "@/components/SiteHeader";
import { VerificationForm, type DisplayActions } from "@/components/VerificationForm";

type Tab = "model" | "input" | "results" | "report";
const emptyActions: DisplayActions = { axialKn: 0, shearMajorKn: 0, shearMinorKn: 0, momentMajorKnm: 0, momentMinorKnm: 0 };

export default function HomePage() {
  const [section, setSection] = useState<SectionRecord | null>(null);
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [actions, setActions] = useState<DisplayActions>(emptyActions);
  const [tab, setTab] = useState<Tab>("model");
  const handleActionsChange = useCallback((next: DisplayActions) => setActions(next), []);

  let content: React.ReactNode;
  if (tab === "model") {
    content = <div className="modelTab">
      <SectionSelector value={section} compact onChange={next => setSection(next)} />
      <MemberViewer section={section} actions={actions} />
      <div className="modelSelectionSummary"><span>Selected Section</span><strong>{section?.designation ?? "W100X19"}</strong><small>Change Section Here. Forces And Member Inputs Are In The Input Tab.</small></div>
    </div>;
  } else if (tab === "input") {
    content = <div className="inputTab"><VerificationForm section={section} onResult={setResult} onActionsChange={handleActionsChange} /></div>;
  } else if (tab === "results") {
    content = <div className="resultsOnly"><ResultsPanel result={result} mode="results" /></div>;
  } else {
    content = <div className="reportOnly"><ResultsPanel result={result} mode="report" /></div>;
  }

  return <main>
    <SiteHeader />
    <section className="toolIdentity"><span className="eyebrow">Structural Steel Design</span><h1>W-Section Verification</h1><span className="codeBadge">CSA S16:2019</span></section>
    <nav className="toolTabs toolTabsAlwaysVisible" aria-label="Tool Views">
      {(["model", "input", "results", "report"] as Tab[]).map(t => <button type="button" key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>{t === "results" ? "Results" : t[0].toUpperCase() + t.slice(1)}</button>)}
    </nav>
    <div className="tabWorkspace">{content}</div>
    <footer><span>Calculation Engine: ECS-WSECTION-CSA-S16-2019-001 v0.2</span><span>Inputs Recalculate Automatically.</span></footer>
  </main>;
}

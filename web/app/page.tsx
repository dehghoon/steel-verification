"use client";

import { useCallback, useState } from "react";
import type { SectionRecord, VerificationResponse } from "@linkoteq/steel-verification-contracts";
import { MemberViewer } from "@/components/MemberViewer";
import { ResultsPanel } from "@/components/ResultsPanel";
import { SectionSelector } from "@/components/SectionSelector";
import { SiteHeader } from "@/components/SiteHeader";
import { VerificationForm, type DisplayActions } from "@/components/VerificationForm";

type MobileTab = "model" | "input" | "results" | "report";
type DesktopTab = "workspace" | "report";
const emptyActions: DisplayActions = { axialKn: 0, shearMajorKn: 0, shearMinorKn: 0, momentMajorKnm: 0, momentMinorKnm: 0 };

export default function HomePage() {
  const [section, setSection] = useState<SectionRecord | null>(null);
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [actions, setActions] = useState<DisplayActions>(emptyActions);
  const [mobileTab, setMobileTab] = useState<MobileTab>("model");
  const [desktopTab, setDesktopTab] = useState<DesktopTab>("workspace");
  const handleActionsChange = useCallback((next: DisplayActions) => setActions(next), []);

  const model = <div className="modelTab">
    <SectionSelector value={section} compact onChange={next => setSection(next)} />
    <MemberViewer section={section} actions={actions} />
    <div className="modelSelectionSummary"><span>Selected Section</span><strong>{section?.designation ?? "W100X19"}</strong></div>
  </div>;
  const inputs = <div className="inputTab"><VerificationForm section={section} onResult={setResult} onActionsChange={handleActionsChange} /></div>;
  const results = <div className="resultsOnly"><ResultsPanel result={result} mode="results" /></div>;
  const report = <div className="reportOnly"><ResultsPanel result={result} mode="report" /></div>;

  const mobileContent = mobileTab === "model" ? model : mobileTab === "input" ? inputs : mobileTab === "results" ? results : report;

  return <main>
    <SiteHeader />
    <section className="toolIdentity"><span className="eyebrow">Structural Steel Design</span><h1>W-Section Verification</h1><span className="codeBadge">CSA S16:2019</span></section>

    <nav className="desktopToolTabs" aria-label="Desktop Tool Views">
      <button type="button" className={desktopTab === "workspace" ? "active" : ""} onClick={() => setDesktopTab("workspace")}>Input &amp; Results</button>
      <button type="button" className={desktopTab === "report" ? "active" : ""} onClick={() => setDesktopTab("report")}>Report</button>
    </nav>
    <div className="desktopWorkspace">
      {desktopTab === "workspace" ? <div className="desktopEngineeringGrid"><div>{model}</div><div>{inputs}</div><div>{results}</div></div> : report}
    </div>

    <nav className="toolTabs mobileToolTabs" aria-label="Mobile Tool Views">
      {(["model", "input", "results", "report"] as MobileTab[]).map(t => <button type="button" key={t} className={mobileTab === t ? "active" : ""} onClick={() => setMobileTab(t)}>{t === "results" ? "Results" : t[0].toUpperCase() + t.slice(1)}</button>)}
    </nav>
    <div className="tabWorkspace mobileWorkspace">{mobileContent}</div>
    <footer><span>Calculation Engine: ECS-WSECTION-CSA-S16-2019-001 v0.2</span><span>Inputs Recalculate Automatically.</span></footer>
  </main>;
}

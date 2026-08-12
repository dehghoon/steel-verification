"use client";

import { useCallback, useState } from "react";
import type { SectionRecord, VerificationResponse } from "@linkoteq/steel-verification-contracts";
import { MemberViewer } from "@/components/MemberViewer";
import { ResultsPanel } from "@/components/ResultsPanel";
import { SectionSelector } from "@/components/SectionSelector";
import { VerificationForm, type DisplayActions } from "@/components/VerificationForm";

type WorkspaceTab = "input" | "results" | "report";

const emptyActions: DisplayActions = {
  axialKn: 0,
  shearMajorKn: 0,
  shearMinorKn: 0,
  momentMajorKnm: 0,
  momentMinorKnm: 0
};

export default function HomePage() {
  const [section, setSection] = useState<SectionRecord | null>(null);
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [actions, setActions] = useState<DisplayActions>(emptyActions);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("input");
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

      <nav className="workspaceTabs" aria-label="Tool sections">
        <button className={activeTab === "input" ? "workspaceTab active" : "workspaceTab"} onClick={() => setActiveTab("input")} type="button">Input</button>
        <button className={activeTab === "results" ? "workspaceTab active" : "workspaceTab"} onClick={() => setActiveTab("results")} type="button">Results</button>
        <button className={activeTab === "report" ? "workspaceTab active" : "workspaceTab"} onClick={() => setActiveTab("report")} type="button">Report</button>
      </nav>

      <section className="viewerStage">
        <MemberViewer section={section} actions={actions} />
      </section>

      <div className="workspace tabbedWorkspace">
        {activeTab === "input" && (
          <div className="inputColumn tabPanelWide">
            <SectionSelector value={section} onChange={(next) => { setSection(next); setResult(null); }} />
            <VerificationForm
              section={section}
              onResult={(next) => { setResult(next); setActiveTab("results"); }}
              onActionsChange={handleActionsChange}
            />
          </div>
        )}

        {activeTab === "results" && (
          <div className="resultColumn tabPanelWide">
            <ResultsPanel result={result} />
          </div>
        )}

        {activeTab === "report" && (
          <div className="resultColumn tabPanelWide reportTabPanel">
            <ResultsPanel result={result} />
          </div>
        )}
      </div>

      <footer>
        <span>Calculation engine: ECS-WSECTION-CSA-S16-2019-001 v0.2</span>
        <span>Temporary development mode: report preview and browser PDF printing are enabled without subscription authorization.</span>
      </footer>
    </main>
  );
}

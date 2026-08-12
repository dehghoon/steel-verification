"use client";

import { useCallback, useState } from "react";
import type { SectionRecord, VerificationResponse } from "@linkoteq/steel-verification-contracts";
import { MemberViewer } from "@/components/MemberViewer";
import { ResultsPanel } from "@/components/ResultsPanel";
import { SectionSelector } from "@/components/SectionSelector";
import { VerificationForm, type DisplayActions } from "@/components/VerificationForm";

type Tab="model"|"input"|"results"|"report";
const emptyActions:DisplayActions={axialKn:0,shearMajorKn:0,shearMinorKn:0,momentMajorKnm:0,momentMinorKnm:0};

export default function HomePage(){
  const [section,setSection]=useState<SectionRecord|null>(null); const [result,setResult]=useState<VerificationResponse|null>(null); const [actions,setActions]=useState<DisplayActions>(emptyActions); const [tab,setTab]=useState<Tab>("model");
  const handleActionsChange=useCallback((next:DisplayActions)=>setActions(next),[]);
  return <main>
    <header className="topbar"><div className="brandMark">L</div><div><strong>LinkoTech Engineering</strong><span>Steel Verification</span></div><div className="codeBadge">CSA S16:2019</div></header>
    <section className="hero compactHero"><span className="eyebrow">Structural steel design</span><h1>W-section member verification</h1></section>
    <nav className="toolTabs" aria-label="Tool views">
      {(["model","input","results","report"] as Tab[]).map(t=><button type="button" key={t} className={tab===t?"active":""} onClick={()=>setTab(t)}>{t==="results"?"Results":t[0].toUpperCase()+t.slice(1)}</button>)}
    </nav>
    <div className="tabWorkspace">
      {tab==="model"&&<div className="modelTab"><MemberViewer section={section} actions={actions}/><div className="modelSelectionSummary"><span>Selected section</span><strong>{section?.designation??"W100X19"}</strong><small>Change section and forces in the Input tab.</small></div></div>}
      {tab==="input"&&<div className="inputTab"><SectionSelector value={section} onChange={next=>{setSection(next);setResult(null);}}/><VerificationForm section={section} onResult={setResult} onActionsChange={handleActionsChange}/></div>}
      {tab==="results"&&<div className="resultsOnly"><ResultsPanel result={result}/></div>}
      {tab==="report"&&<div className="reportOnly"><div className="reportTabHeading"><span className="eyebrow">Engineering calculation report</span><h2>Report</h2><p>Generate the current calculation report from the automatically updated inputs and results.</p></div><ResultsPanel result={result}/></div>}
    </div>
    <footer><span>Calculation engine: ECS-WSECTION-CSA-S16-2019-001 v0.2</span><span>Inputs recalculate automatically.</span></footer>
  </main>;
}

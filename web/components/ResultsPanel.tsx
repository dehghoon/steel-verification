"use client";

import { useState } from "react";
import type { VerificationResponse } from "@linkoteq/steel-verification-contracts";
import { previewReport } from "@/lib/api";

const titleMap: Record<string, string> = {
  biaxial_bending: "Biaxial bending",
  compression_bending: "Compression + bending",
  tension_bending: "Tension + bending",
  major_axis_shear: "Major-axis shear",
  minor_axis_shear: "Minor-axis shear",
  axial_tension: "Axial tension",
  axial_compression: "Axial compression",
  deflection: "Deflection"
};

function readable(name: string) {
  return titleMap[name] ?? name.replaceAll("_", " ").replace(/^./, (char) => char.toUpperCase());
}

export function ResultsPanel({ result }: { result: VerificationResponse | null }) {
  const [reportMessage, setReportMessage] = useState("");
  const [reportPreview, setReportPreview] = useState<any>(null);

  if (!result) {
    return (
      <section className="panel emptyResult">
        <span className="eyebrow">Engineering output</span>
        <h2>Results</h2>
        <p>Run a verification to see overall status, utilization ratios, governing check, warnings, and report actions.</p>
        <div className="resultActions">
          <button type="button" className="secondaryButton" disabled>Print Results</button>
          <button type="button" className="primaryButton" disabled>Generate Report</button>
        </div>
      </section>
    );
  }

  const ratios = Object.entries(result.utilization_ratios);
  const governingRatio = result.values.max_uls_utilization?.raw_value ?? Math.max(0, ...ratios.map(([, ratio]) => ratio));
  const pass = result.overall_status.toLowerCase() === "pass";

  async function generatePreview() {
    setReportMessage("Preparing report preview…");
    try {
      const report = await previewReport(result!);
      setReportPreview(report);
      setReportMessage("Report preview ready below. Temporary development access is enabled.");
    } catch (error) {
      setReportMessage(error instanceof Error ? error.message : "Unable to generate report preview.");
    }
  }

  return (
    <section className="panel resultsPanel">
      <div className="overallStatusCard">
        <div className={pass ? "statusIcon pass" : "statusIcon fail"}>{pass ? "✓" : "!"}</div>
        <div>
          <span className="eyebrow">Overall status</span>
          <h2>{result.overall_status}</h2>
          <p>{pass ? "All required checks are within their acceptance limits." : "One or more required checks need attention."}</p>
        </div>
        <div className="utilization governingUtilization">
          <span>Max. utilization</span>
          <strong>{(governingRatio * 100).toFixed(1)}%</strong>
          <small>{result.governing_check ? readable(result.governing_check) : "—"}</small>
        </div>
      </div>

      <div className="statusStrip statusChecks">
        <span className={result.uls_status.toLowerCase() === "pass" ? "ok" : "bad"}>✓ ULS {result.uls_status}</span>
        <span className={result.sls_status.toLowerCase() === "pass" ? "ok" : "bad"}>✓ SLS {result.sls_status}</span>
        <span className={result.slenderness_status.toLowerCase() === "pass" ? "ok" : "bad"}>✓ Slenderness {result.slenderness_status}</span>
      </div>

      <div className="checks utilizationChecks">
        <div className="checksHeading">
          <span className="eyebrow">All checks</span>
          <h2>Utilization ratios</h2>
        </div>
        {ratios.map(([name, ratio]) => {
          const percentage = Math.max(0, ratio * 100);
          return (
            <div className="utilizationRow" key={name}>
              <div className="utilizationRowTop"><strong>{readable(name)}</strong><b>{percentage.toFixed(1)}%</b></div>
              <div className="ratioTrack"><div className="ratioFill" style={{ width: `${Math.min(percentage, 100)}%` }} /></div>
            </div>
          );
        })}
      </div>

      {result.formula_ids.length > 0 && <p className="traceLine">Formula IDs: {result.formula_ids.join(" · ")}</p>}

      {result.warnings.length > 0 && (
        <div className="warnings">
          <h3>Warnings & limitations</h3>
          {result.warnings.map((warning) => <p key={warning}>{warning}</p>)}
        </div>
      )}

      <div className="resultActions">
        <button type="button" className="secondaryButton" onClick={() => window.print()}>Print Results</button>
        <button type="button" className="primaryButton" onClick={generatePreview}>Generate Report</button>
      </div>
      {reportMessage && <p className="reportMessage">{reportMessage}</p>}
      {reportPreview && (
        <div className="reportPreview">
          <div className="checksHeading">
            <span className="eyebrow">Report preview</span>
            <h2>{reportPreview.title ?? "Steel W-Section Verification"}</h2>
          </div>
          {(reportPreview.sections ?? []).map((section: any) => (
            <div className="warnings" key={section.name}>
              <h3>{section.name}</h3>
              <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{JSON.stringify(section.data, null, 2)}</pre>
            </div>
          ))}
          <div className="resultActions">
            <button type="button" className="primaryButton" onClick={() => window.print()}>Print / Save as PDF</button>
          </div>
        </div>
      )}
    </section>
  );
}

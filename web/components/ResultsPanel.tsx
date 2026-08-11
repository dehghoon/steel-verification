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

const labelMap: Record<string, string> = {
  code_edition: "Code edition",
  phi_s: "ϕs",
  phi_y: "ϕy",
  phi_u: "ϕu",
  phi_br: "ϕbr",
  n_comp: "n",
  lambda_limit: "Slenderness limit",
  omega_1: "ω1",
  continuous_lateral_restraint_confirmed: "Continuous lateral restraint confirmed",
  coincident_force_set: "Coincident force set confirmed",
  net_area_equals_gross_confirmed: "Net area equals gross area confirmed",
  yield_strength: "Fy",
  ultimate_strength: "Fu",
  elastic_modulus: "E",
  shear_modulus: "G",
  mass_density: "Mass density",
  section_name_imperial: "Imperial designation",
  section_name_metric: "Metric designation",
  section_database_version: "Section database version",
  depth: "Depth",
  flange_width: "Flange width",
  flange_thickness: "Flange thickness",
  web_thickness: "Web thickness",
  gross_area: "Gross area",
  moment_of_inertia_major: "Major-axis moment of inertia",
  moment_of_inertia_minor: "Minor-axis moment of inertia",
  elastic_modulus_major: "Major-axis elastic section modulus",
  elastic_modulus_minor: "Minor-axis elastic section modulus",
  plastic_modulus_major: "Major-axis plastic section modulus",
  plastic_modulus_minor: "Minor-axis plastic section modulus",
  radius_of_gyration_major: "Major-axis radius of gyration",
  radius_of_gyration_minor: "Minor-axis radius of gyration",
  warping_constant: "Warping constant",
  torsional_constant: "Torsional constant",
  mass_per_length: "Mass per length",
  length_major: "Major-axis unbraced length",
  length_minor: "Minor-axis unbraced length",
  length_torsional: "Torsional unbraced length",
  effective_length_factor_major: "Major-axis effective length factor",
  effective_length_factor_minor: "Minor-axis effective length factor",
  effective_length_factor_torsional: "Torsional effective length factor",
  compression_force: "Compression force",
  tension_force: "Tension force",
  shear_major: "Major shear (V1)",
  shear_minor: "Minor shear (V2)",
  moment_major: "Major moment (M2)",
  moment_minor: "Minor moment (M1)",
  live_load_deflection: "Live-load deflection",
  check: "Governing check",
  status: "Overall status"
};

const unitMap: Record<string, string> = {
  yield_strength: "MPa",
  ultimate_strength: "MPa",
  elastic_modulus: "MPa",
  shear_modulus: "MPa",
  depth: "mm",
  flange_width: "mm",
  flange_thickness: "mm",
  web_thickness: "mm",
  gross_area: "mm²",
  moment_of_inertia_major: "mm⁴",
  moment_of_inertia_minor: "mm⁴",
  elastic_modulus_major: "mm³",
  elastic_modulus_minor: "mm³",
  plastic_modulus_major: "mm³",
  plastic_modulus_minor: "mm³",
  radius_of_gyration_major: "mm",
  radius_of_gyration_minor: "mm",
  warping_constant: "mm⁶",
  torsional_constant: "mm⁴",
  mass_per_length: "kg/m",
  length_major: "mm",
  length_minor: "mm",
  length_torsional: "mm",
  compression_force: "N",
  tension_force: "N",
  shear_major: "N",
  shear_minor: "N",
  moment_major: "N·mm",
  moment_minor: "N·mm",
  live_load_deflection: "mm"
};

function readable(name: string) {
  return titleMap[name] ?? labelMap[name] ?? name.replaceAll("_", " ").replace(/^./, (char) => char.toUpperCase());
}

function formatValue(key: string, value: unknown) {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") {
    const abs = Math.abs(value);
    const formatted = abs >= 1000000 ? value.toExponential(3) : Number.isInteger(value) ? value.toLocaleString() : value.toLocaleString(undefined, { maximumFractionDigits: 4 });
    return `${formatted}${unitMap[key] ? ` ${unitMap[key]}` : ""}`;
  }
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function ReportData({ data }: { data: unknown }) {
  if (Array.isArray(data)) {
    if (data.length === 0) return <p className="reportEmpty">None</p>;
    return <ul className="reportList">{data.map((item, index) => <li key={`${index}-${String(item)}`}>{String(item)}</li>)}</ul>;
  }
  if (!data || typeof data !== "object") return <p>{formatValue("", data)}</p>;

  const entries = Object.entries(data as Record<string, unknown>);
  return (
    <div className="reportDataGroups">
      {entries.map(([key, value]) => {
        if (value && typeof value === "object" && !Array.isArray(value)) {
          return (
            <section className="reportSubsection" key={key}>
              <h4>{readable(key)}</h4>
              <ReportData data={value} />
            </section>
          );
        }
        if (Array.isArray(value)) {
          return (
            <div className="reportRow reportRowStacked" key={key}>
              <span>{readable(key)}</span>
              <ReportData data={value} />
            </div>
          );
        }
        return (
          <div className="reportRow" key={key}>
            <span>{readable(key)}</span>
            <strong>{formatValue(key, value)}</strong>
          </div>
        );
      })}
    </div>
  );
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
        <article className="reportPreview">
          <header className="reportHeader">
            <span className="eyebrow">Engineering calculation report</span>
            <h2>{reportPreview.title ?? "Steel W-Section Verification"}</h2>
            <div className="reportMeta">
              <span>CSA S16:2019</span>
              <span>Status: {result.overall_status}</span>
              <span>Governing: {readable(result.governing_check ?? "—")}</span>
            </div>
          </header>
          {(reportPreview.sections ?? []).map((section: any, index: number) => (
            <section className="reportSection" key={section.name}>
              <div className="reportSectionTitle"><span>{String(index + 1).padStart(2, "0")}</span><h3>{section.name}</h3></div>
              {section.name === "Engineering Checks" && section.data && typeof section.data === "object" ? (
                <div className="reportChecks">
                  {Object.entries(section.data as Record<string, number>).map(([name, ratio]) => (
                    <div className="reportCheckRow" key={name}>
                      <span>{readable(name)}</span>
                      <strong>{(ratio * 100).toFixed(1)}%</strong>
                    </div>
                  ))}
                </div>
              ) : <ReportData data={section.data} />}
            </section>
          ))}
          <footer className="reportFooter">
            <span>Calculation engine: ECS-WSECTION-CSA-S16-2019-001 v0.2</span>
            <span>Temporary development preview</span>
          </footer>
          <div className="resultActions reportActions">
            <button type="button" className="primaryButton" onClick={() => window.print()}>Print / Save as PDF</button>
          </div>
        </article>
      )}
    </section>
  );
}

"use client";

import { useState } from "react";
import type { VerificationResponse } from "@linkoteq/steel-verification-contracts";
import { previewReport } from "@/lib/api";

const titleMap: Record<string, string> = {
  biaxial_bending: "Biaxial bending",
  compression_bending: "Compression + bending",
  tension_bending: "Tension + bending",
  tension: "Axial tension",
  compression: "Axial compression",
  shear_major: "Major-axis shear",
  shear_minor: "Minor-axis shear"
};

function readable(name: string) {
  return titleMap[name] ?? name.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());
}

function num(value: unknown, decimals = 2) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: decimals }) : "—";
}

function pct(value: unknown) {
  return `${(Number(value ?? 0) * 100).toFixed(2)}%`;
}

function get(obj: any, path: string, fallback: any = 0) {
  return path.split(".").reduce((acc: any, key) => acc?.[key], obj) ?? fallback;
}

function EngineeringReport({ result }: { result: VerificationResponse }) {
  const n: any = result.normalized_inputs ?? {};
  const code = n.code ?? {};
  const material = n.material ?? {};
  const section = n.section ?? {};
  const geometry = n.geometry ?? {};
  const actions = n.actions ?? {};
  const iv: any = result.intermediate_values ?? {};
  const values: any = result.values ?? {};
  const r = result.utilization_ratios ?? {};

  const v = (key: string) => values[key]?.display_value ?? values[key]?.raw_value ?? 0;
  const kN = (x: unknown) => Number(x ?? 0) / 1000;
  const kNm = (x: unknown) => Number(x ?? 0) / 1_000_000;
  const m = (x: unknown) => Number(x ?? 0) / 1000;
  const ok = (ratio: number) => ratio <= 1;

  return (
    <article className="calcReport">
      <section className="calcCover calcPage">
        <div className="calcDocHeader">
          <div><strong>Engineering Calculation</strong><span>Report</span></div>
          <div><b>Document ID :</b><span>______________________</span><b>Client Reference # :</b><span>______________________</span></div>
          <div><small>Preparer:</small><span>First & Last Name, affiliation</span><small>Verifier:</small><span>First & Last Name, affiliation</span></div>
        </div>
        <div className="calcTitle"><b>Title:</b><span>Design of W-Sections According to CSA S16:2019 [CISC STRUCTURAL SECTIONS]</span></div>
        <div className="calcNotice">
          <p>This engineering calculation report is intended to document the structural verification of a CISC W-section in accordance with CSA S16:2019. Calculations, resistance factors, section properties, intermediate values, utilization ratios, and governing checks are presented in a traceable engineering sequence.</p>
          <h3>Important Usage Instructions:</h3>
          <p>Each user is responsible for independently verifying the accuracy and applicability of the calculations and code references before use in any project.</p>
          <p>The report shall be reviewed together with project-specific loading assumptions, model outputs, and design criteria before final issue.</p>
        </div>
      </section>

      <section className="calcPage">
        <h2>Design Inputs</h2>
        <div className="calcBand"><b>Section</b><strong>{section.section_name_metric || result.section_dataset.designation}</strong><span>{section.section_name_imperial || ""}</span></div>
        <p className="calcSource">Section Properties: CISC Structural Section Table · Dataset {section.section_database_version || result.section_dataset.version}</p>

        <h3>A. Reduction Factors</h3>
        <div className="calcTable twoCol">
          <div><span>Steel strength factor</span><b>ϕs = {num(code.phi_s, 3)}</b><small>CSA S16:19 Cl. 13.1</small></div>
          <div><span>Steel ultimate limit strength factor</span><b>ϕu = {num(code.phi_u, 3)}</b><small>CSA S16:19 Cl. 13.1</small></div>
          <div><span>Resistance factor for welded connections</span><b>ϕw = {num(code.phi_w ?? code.phi_y, 3)}</b><small>CSA S16:19 Cl. 13.1</small></div>
          <div><span>Resistance factor for bearing on bolts</span><b>ϕbr = {num(code.phi_br, 3)}</b><small>CSA S16:19 Cl. 13.1</small></div>
        </div>

        <h3>B. Material Properties</h3>
        <div className="calcTable twoCol">
          <div><span>Ultimate strength for steel section</span><b>Fu = {num(material.ultimate_strength)} MPa</b><small>CSA G40.20-13 Table 1</small></div>
          <div><span>Yield strength for steel section</span><b>Fy = {num(material.yield_strength)} MPa</b><small>CSA G40.20-13 Table 1</small></div>
          <div><span>Steel density</span><b>γs = {num(material.mass_density)} kg/m³</b><small>Handbook of Steel Construction</small></div>
          <div><span>Young&apos;s Modulus of Elasticity</span><b>E = {num(Number(material.elastic_modulus)/1000)} GPa</b><small></small></div>
          <div><span>Shear modulus of steel</span><b>G = {num(material.shear_modulus)} MPa</b><small></small></div>
        </div>

        <h3>C. Factored Forces</h3>
        <p className="calcExplanation">The factored member forces are reported in engineering display units. A positive axial force represents tension and a negative axial force represents compression in the interactive model.</p>
        <div className="calcTable twoCol">
          <div><span>Axial force</span><b>N = {num(kN((actions.tension_force || 0) - (actions.compression_force || 0)))} kN</b><small>Signed input</small></div>
          <div><span>Major shear (V1)</span><b>V1 = {num(kN(actions.shear_major))} kN</b><small></small></div>
          <div><span>Minor shear (V2)</span><b>V2 = {num(kN(actions.shear_minor))} kN</b><small></small></div>
          <div><span>Major moment (M2)</span><b>M2 = {num(kNm(actions.moment_major))} kN·m</b><small></small></div>
          <div><span>Minor moment (M1)</span><b>M1 = {num(kNm(actions.moment_minor))} kN·m</b><small></small></div>
        </div>
      </section>

      <section className="calcPage">
        <h3>D. Geometry</h3>
        <div className="calcTable twoCol">
          <div><span>Lx</span><b>{num(m(geometry.length_major),3)} m</b><small></small></div>
          <div><span>Ly</span><b>{num(m(geometry.length_minor),3)} m</b><small></small></div>
          <div><span>Lz</span><b>{num(m(geometry.length_torsional),3)} m</b><small></small></div>
          <div><span>kx</span><b>{num(geometry.effective_length_factor_major,3)}</b><small>CSA S16:19 Figure F.1</small></div>
          <div><span>ky</span><b>{num(geometry.effective_length_factor_minor,3)}</b><small></small></div>
          <div><span>kz</span><b>{num(geometry.effective_length_factor_torsional,3)}</b><small></small></div>
        </div>

        <h3>E. Section Properties</h3>
        <div className="calcTable twoCol">
          <div><span>Section</span><b>{section.section_name_imperial || "—"}</b><small>{section.section_name_metric || ""}</small></div>
          <div><span>Weight</span><b>{num(section.mass_per_length)} kg/m</b><small></small></div>
          <div><span>Total depth, d</span><b>{num(section.depth)} mm</b><small></small></div>
          <div><span>Flange width, b</span><b>{num(section.flange_width)} mm</b><small></small></div>
          <div><span>Flange thickness, t</span><b>{num(section.flange_thickness)} mm</b><small></small></div>
          <div><span>Web thickness, w</span><b>{num(section.web_thickness)} mm</b><small></small></div>
          <div><span>Area, A</span><b>{num(section.gross_area)} mm²</b><small></small></div>
          <div><span>Ix / Iy</span><b>{num(section.moment_of_inertia_major)} / {num(section.moment_of_inertia_minor)} mm⁴</b><small></small></div>
          <div><span>Sx / Sy</span><b>{num(section.elastic_modulus_major)} / {num(section.elastic_modulus_minor)} mm³</b><small></small></div>
          <div><span>Zx / Zy</span><b>{num(section.plastic_modulus_major)} / {num(section.plastic_modulus_minor)} mm³</b><small></small></div>
          <div><span>rx / ry</span><b>{num(section.radius_of_gyration_major)} / {num(section.radius_of_gyration_minor)} mm</b><small></small></div>
          <div><span>Warping constant, Cw</span><b>{num(section.warping_constant)} mm⁶</b><small></small></div>
          <div><span>Torsional constant, J</span><b>{num(section.torsional_constant)} mm⁴</b><small></small></div>
        </div>
      </section>

      <section className="calcPage">
        <h3>Slenderness Ratio</h3>
        <div className="calcEquation"><span>λx = kx·Lx / rx</span><b>= {num(v("slenderness_major"),2)}</b><small>CSA S16:19 Cl. 10.4.1</small></div>
        <div className="calcEquation"><span>λy = ky·Ly / ry</span><b>= {num(v("slenderness_minor"),2)}</b><small>CSA S16:19 Cl. 10.4.1</small></div>
        <div className={result.slenderness_status === "PASS" ? "calcCheck pass" : "calcCheck fail"}>λ = max(λx, λy) = {num(v("governing_slenderness"),2)} · {result.slenderness_status}</div>

        <h3>Tension Capacity</h3>
        <div className="calcEquation"><span>Tr1 = ϕs·Fy·A</span><b>= {num(kN(iv.tension_yielding))} kN</b><small>CSA S16:19 Cl. 13.2(a)</small></div>
        <div className="calcEquation"><span>Tr2 = ϕu·Fu·A</span><b>= {num(kN(iv.tension_ultimate))} kN</b><small></small></div>
        <div className="calcEquation"><span>Tr = min(Tr1, Tr2)</span><b>= {num(kN(v("tension_resistance")))} kN</b><small></small></div>
        <div className={ok(r.tension) ? "calcCheck pass" : "calcCheck fail"}>RatioTens = Tf / Tr = {pct(r.tension)} · {ok(r.tension) ? "OK!" : "NG!"}</div>

        <h3>Compression Capacity</h3>
        <div className="calcEquation"><span>Fex = π²E / λx²</span><b>= {num(iv.elastic_buckling_major)} MPa</b><small>CSA S16:19 Cl. 13.3.1.2</small></div>
        <div className="calcEquation"><span>Fey = π²E / λy²</span><b>= {num(iv.elastic_buckling_minor)} MPa</b><small></small></div>
        <div className="calcEquation"><span>Fe = min(Fex, Fey, Fez)</span><b>= {num(iv.elastic_buckling_governing)} MPa</b><small></small></div>
        <div className="calcEquation"><span>λ = √(Fy / Fe)</span><b>= {num(iv.compression_parameter,3)}</b><small>CSA S16:19 Cl. 13.3.1.1</small></div>
        <div className="calcEquation"><span>Cr = ϕs·A·Fy / (1 + λ²ⁿ)^(1/n)</span><b>= {num(kN(v("compression_resistance")))} kN</b><small>CSA S16:19 Cl. 13.3.1.1</small></div>
        <div className={ok(r.compression) ? "calcCheck pass" : "calcCheck fail"}>RatioComp = Cf / Cr = {pct(r.compression)} · {ok(r.compression) ? "OK!" : "NG!"}</div>
      </section>

      <section className="calcPage">
        <h3>Shear Check</h3>
        <div className="calcEquation"><span>Major-axis shear area, Aw</span><b>= {num(iv.web_shear_area)} mm²</b><small></small></div>
        <div className="calcEquation"><span>Minor-axis shear area, Af</span><b>= {num(iv.flange_shear_area)} mm²</b><small></small></div>
        <div className="calcEquation"><span>Major shear resistance, Vr,y</span><b>= {num(kN(v("major_shear_resistance")))} kN</b><small>CSA S16:19 Cl. 13.4.1.1</small></div>
        <div className={ok(r.shear_major) ? "calcCheck pass" : "calcCheck fail"}>RatioVy = Vf,y / Vr,y = {pct(r.shear_major)} · {ok(r.shear_major) ? "OK!" : "NG!"}</div>
        <div className="calcEquation"><span>Minor shear resistance, Vr,x</span><b>= {num(kN(v("minor_shear_resistance")))} kN</b><small>CSA S16:19 Cl. 13.4.3</small></div>
        <div className={ok(r.shear_minor) ? "calcCheck pass" : "calcCheck fail"}>RatioVx = Vf,x / Vr,x = {pct(r.shear_minor)} · {ok(r.shear_minor) ? "OK!" : "NG!"}</div>

        <h3>Bending Check — Determine Section Class</h3>
        <div className="calcEquation"><span>Unsupported length of flange</span><b>bel = {num(iv.outstanding_flange_width)} mm</b><small>CSA S16:19 Table 2</small></div>
        <div className="calcEquation"><span>Flange class</span><b>{num(iv.flange_class,0)}</b><small>CSA S16:19 Table 2</small></div>
        <div className="calcEquation"><span>Web class</span><b>{num(iv.web_class,0)}</b><small>CSA S16:19 Table 2</small></div>
        <div className="calcCheck pass">Section Class = max(flange, web) = {num(v("section_class"),0)}</div>
      </section>

      <section className="calcPage">
        <h3>Ultimate Moment Resistance</h3>
        <div className="calcEquation"><span>Mr,x</span><b>= {num(kNm(v("moment_resistance_major")))} kN·m</b><small>CSA S16:19</small></div>
        <div className="calcEquation"><span>Mr,y</span><b>= {num(kNm(v("moment_resistance_minor")))} kN·m</b><small>CSA S16:19</small></div>
        <div className={ok(r.biaxial_bending) ? "calcCheck pass" : "calcCheck fail"}>Ratioflex = Mf,x/Mr,x + Mf,y/Mr,y = {pct(r.biaxial_bending)} · {ok(r.biaxial_bending) ? "OK!" : "NG!"}</div>

        <h3>Bending and Compression Check</h3>
        <div className="calcEquation"><span>kω</span><b>= {num(iv.k_omega,3)}</b><small>CSA S16:19 Cl. 13.8.6(a)</small></div>
        <div className="calcEquation"><span>U1,x / U1,y</span><b>{num(iv.amplification_major,3)} / {num(iv.amplification_minor,3)}</b><small>CSA S16:19 Cl. 13.8.5</small></div>
        <div className="calcEquation"><span>β1</span><b>= {num(iv.beta_1,3)}</b><small>CSA S16:19 Cl. 13.8.2</small></div>
        <div className={ok(r.compression_bending) ? "calcCheck pass" : "calcCheck fail"}>Compression + bending = {pct(r.compression_bending)} · {ok(r.compression_bending) ? "OK!" : "NG!"}</div>

        <h3>Bending and Tension Check</h3>
        <div className={ok(r.tension_bending) ? "calcCheck pass" : "calcCheck fail"}>Tension + bending = {pct(r.tension_bending)} · {ok(r.tension_bending) ? "OK!" : "NG!"}</div>

        <h3>Final Verification Summary</h3>
        <div className="calcSummary">
          {Object.entries(r).map(([name, ratio]) => <div key={name}><span>{readable(name)}</span><b>{pct(ratio)}</b><em>{ok(ratio) ? "OK" : "NG"}</em></div>)}
        </div>
        <div className={result.overall_status === "PASS" ? "calcFinal pass" : "calcFinal fail"}>
          <span>Maximum Utilization Ratio</span><strong>{pct(v("max_uls_utilization"))}</strong><b>{result.overall_status}</b>
        </div>
        {result.warnings.length > 0 && <div className="calcWarnings"><b>Warnings / limitations</b>{result.warnings.map(w => <span key={w}>{w}</span>)}</div>}
      </section>
    </article>
  );
}

export function ResultsPanel({ result }: { result: VerificationResponse | null }) {
  const [reportMessage, setReportMessage] = useState("");
  const [showReport, setShowReport] = useState(false);

  if (!result) return <section className="panel emptyResult"><span className="eyebrow">Engineering output</span><h2>Results</h2><p>Run a verification to see results and generate the engineering calculation report.</p></section>;

  const ratios = Object.entries(result.utilization_ratios);
  const governingRatio = result.values.max_uls_utilization?.raw_value ?? Math.max(0, ...ratios.map(([, x]) => x));
  const pass = result.overall_status === "PASS";

  async function generateReport() {
    setReportMessage("Preparing engineering calculation report…");
    try {
      await previewReport(result!);
      setShowReport(true);
      setReportMessage("");
    } catch (e) {
      setReportMessage(e instanceof Error ? e.message : "Unable to generate report.");
    }
  }

  return <section className="panel resultsPanel">
    <div className="overallStatusCard"><div className={pass ? "statusIcon pass" : "statusIcon fail"}>{pass ? "✓" : "!"}</div><div><span className="eyebrow">Overall status</span><h2>{result.overall_status}</h2><p>{pass ? "All required checks are within their acceptance limits." : "One or more checks need attention."}</p></div><div className="utilization governingUtilization"><span>Max. utilization</span><strong>{(governingRatio*100).toFixed(1)}%</strong><small>{readable(result.governing_check ?? "—")}</small></div></div>
    <div className="checks utilizationChecks"><div className="checksHeading"><span className="eyebrow">All checks</span><h2>Utilization ratios</h2></div>{ratios.map(([name,ratio]) => <div className="utilizationRow" key={name}><div className="utilizationRowTop"><strong>{readable(name)}</strong><b>{(ratio*100).toFixed(1)}%</b></div><div className="ratioTrack"><div className="ratioFill" style={{width:`${Math.min(ratio*100,100)}%`}} /></div></div>)}</div>
    <div className="resultActions"><button type="button" className="secondaryButton" onClick={()=>window.print()}>Print Results</button><button type="button" className="primaryButton" onClick={generateReport}>Generate Report</button></div>
    {reportMessage && <p className="reportMessage">{reportMessage}</p>}
    {showReport && <><EngineeringReport result={result}/><div className="resultActions reportActions"><button type="button" className="primaryButton" onClick={()=>window.print()}>Print / Save as PDF</button></div></>}
  </section>;
}

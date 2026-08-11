"use client";

import type { VerificationResponse } from "@linkoteq/steel-verification-contracts";

export function ResultsPanel({ result }: { result: VerificationResponse | null }) {
  if (!result) {
    return (
      <section className="panel emptyResult">
        <span className="eyebrow">Engineering output</span>
        <h2>Results</h2>
        <p>Run a verification to see all governing checks and warnings.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="resultHero">
        <div>
          <span className="eyebrow">Overall status</span>
          <h2>{result.overall_status}</h2>
        </div>
        <div className="utilization">
          <span>Governing</span>
          <strong>{((result.values.max_uls_utilization?.raw_value ?? 0) * 100).toFixed(2)}%</strong>
          <small>{result.governing_check ?? "—"}</small>
        </div>
      </div>
      <div className="checks">
        {Object.entries(result.utilization_ratios).map(([name, ratio]) => (
          <div className="checkRow" key={name}>
            <span>{name.replaceAll("_", " ")}</span>
            <strong>{(ratio * 100).toFixed(2)}%</strong>
          </div>
        ))}
      </div>
      <div className="statusStrip">
        <span>ULS {result.uls_status}</span>
        <span>SLS {result.sls_status}</span>
        <span>Slenderness {result.slenderness_status}</span>
      </div>
      {result.warnings.length > 0 && (
        <div className="warnings">
          <h3>Warnings & limitations</h3>
          {result.warnings.map((warning) => <p key={warning}>{warning}</p>)}
        </div>
      )}
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import type { SectionRecord } from "@linkoteq/steel-verification-contracts";
import { searchSections } from "@/lib/api";

export function SectionSelector({
  value,
  onChange
}: {
  value: SectionRecord | null;
  onChange: (section: SectionRecord | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SectionRecord[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handle = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const result = await searchSections(query);
        setItems(result.items);
      } catch (err) {
        setItems([]);
        setError(err instanceof Error ? err.message : "Unable to load sections.");
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => window.clearTimeout(handle);
  }, [query]);

  return (
    <section className="panel">
      <div className="panelTitle">
        <div>
          <span className="eyebrow">Approved data</span>
          <h2>W-section</h2>
        </div>
        {value && <span className="datasetBadge">{value.dataset_version}</span>}
      </div>
      <label>
        Search CISC sections
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. W100X19" />
      </label>
      {loading && <p className="muted">Loading approved section data…</p>}
      {error && <p className="error">{error}</p>}
      <div className="sectionGrid">
        {items.map((section) => (
          <button
            type="button"
            className={value?.id === section.id ? "sectionChoice active" : "sectionChoice"}
            key={section.id}
            onClick={() => onChange(section)}
          >
            <strong>{section.designation}</strong>
            <span>{section.family} · {section.source}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

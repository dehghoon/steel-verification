"use client";

import { useEffect, useMemo, useState } from "react";
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
    let cancelled = false;
    setLoading(true);
    setError("");
    searchSections("")
      .then((result) => { if (!cancelled) setItems(result.items); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load sections."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((section) => [section.designation, section.designation_metric, section.designation_imperial]
      .filter(Boolean)
      .some((name) => String(name).toLowerCase().includes(q)));
  }, [items, query]);

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
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. W100X19 or W4x13" />
      </label>
      {loading && <p className="muted">Loading complete approved CISC W-section catalog…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && <p className="muted sectionCount">Showing {filtered.length} of {items.length} approved W-sections</p>}
      <div className="sectionGrid fullCatalog">
        {filtered.map((section) => (
          <button
            type="button"
            className={value?.id === section.id ? "sectionChoice active" : "sectionChoice"}
            key={section.id}
            onClick={() => onChange(section)}
          >
            <strong>{section.designation}</strong>
            <span>{section.designation_imperial ? `${section.designation_imperial} · ` : ""}{section.source}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

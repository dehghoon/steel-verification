"use client";

import { useEffect, useMemo, useState } from "react";
import type { SectionRecord } from "@linkoteq/steel-verification-contracts";
import { searchSections } from "@/lib/api";

function sectionSize(section: SectionRecord) {
  const designation = String(section.designation_metric ?? section.designation ?? "").toUpperCase();
  const match = designation.match(/W\s*(\d+(?:\.\d+)?)\s*[X×]\s*(\d+(?:\.\d+)?)/);
  if (match) return { depth: Number(match[1]), weight: Number(match[2]) };
  const imperial = String(section.designation_imperial ?? "").toUpperCase();
  const imperialMatch = imperial.match(/W\s*(\d+(?:\.\d+)?)\s*[X×]\s*(\d+(?:\.\d+)?)/);
  if (imperialMatch) return { depth: Number(imperialMatch[1]) * 25.4, weight: Number(imperialMatch[2]) * 1.48816 };
  return { depth: Number.MAX_SAFE_INTEGER, weight: Number.MAX_SAFE_INTEGER };
}

export function SectionSelector({ value, onChange, compact = false }: { value: SectionRecord | null; onChange: (section: SectionRecord | null) => void; compact?: boolean; }) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SectionRecord[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    searchSections("").then((result) => {
      if (cancelled) return;
      const sorted = [...result.items].sort((a, b) => {
        const aa = sectionSize(a), bb = sectionSize(b);
        return aa.depth - bb.depth || aa.weight - bb.weight || String(a.designation).localeCompare(String(b.designation), undefined, { numeric: true });
      });
      setItems(sorted);
      if (!value) {
        const preferred = sorted.find((s) => [s.designation, s.designation_metric, s.designation_imperial].some((x) => String(x ?? "").toLowerCase() === "w100x19"));
        onChange(preferred ?? sorted[0] ?? null);
      }
    }).catch((err) => !cancelled && setError(err instanceof Error ? err.message : "Unable to load sections."))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((section) => [section.designation, section.designation_metric, section.designation_imperial].filter(Boolean).some((name) => String(name).toLowerCase().includes(q)));
  }, [items, query]);

  return <section className={compact ? "sectionSelectorPanel compactSectionSelector" : "panel sectionSelectorPanel"}>
    {!compact && <><span className="eyebrow">Approved CISC Data</span><h2>W-Section</h2></>}
    <button type="button" className="sectionPickerButton" onClick={() => setOpen(true)} disabled={loading}>
      <span><strong>{value?.designation ?? (loading ? "Loading…" : "W100X19")}</strong><small>{value?.designation_imperial ?? "Select W-Section"}</small></span><b>⌄</b>
    </button>
    {error && <p className="error">{error}</p>}
    {open && <div className="sectionModalBackdrop" onClick={() => setOpen(false)}><div className="sectionModal" onClick={(e) => e.stopPropagation()}>
      <div className="sectionModalHeader"><div><span className="eyebrow">CISC Catalog</span><h3>Select W-Section</h3></div><button type="button" onClick={() => setOpen(false)}>×</button></div>
      <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search W100X19 or W4x13" />
      <div className="sectionModalList">{filtered.map((section) => <button type="button" className={value?.id === section.id ? "sectionChoice active" : "sectionChoice"} key={section.id} onClick={() => { onChange(section); setOpen(false); }}><strong>{section.designation}</strong><span>{section.designation_imperial ? `${section.designation_imperial} · ` : ""}{section.source}</span></button>)}</div>
    </div></div>}
  </section>;
}

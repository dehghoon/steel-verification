"use client";

import { useEffect, useMemo, useState } from "react";
import type { SectionRecord } from "@linkoteq/steel-verification-contracts";
import { searchSections } from "@/lib/api";

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
      setItems(result.items);
      if (!value) {
        const preferred = result.items.find((s) => [s.designation, s.designation_metric, s.designation_imperial].some((x) => String(x ?? "").toLowerCase() === "w100x19"));
        onChange(preferred ?? result.items[0] ?? null);
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
    {!compact && <><span className="eyebrow">Approved CISC data</span><h2>W-section</h2></>}
    <button type="button" className="sectionPickerButton" onClick={() => setOpen(true)} disabled={loading}>
      <span><strong>{value?.designation ?? (loading ? "Loading…" : "W100X19")}</strong><small>{value?.designation_imperial ?? "Select W-section"}</small></span><b>⌄</b>
    </button>
    {error && <p className="error">{error}</p>}
    {open && <div className="sectionModalBackdrop" onClick={() => setOpen(false)}><div className="sectionModal" onClick={(e) => e.stopPropagation()}>
      <div className="sectionModalHeader"><div><span className="eyebrow">CISC catalog</span><h3>Select W-section</h3></div><button type="button" onClick={() => setOpen(false)}>×</button></div>
      <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search W100X19 or W4x13" />
      <div className="sectionModalList">{filtered.map((section) => <button type="button" className={value?.id === section.id ? "sectionChoice active" : "sectionChoice"} key={section.id} onClick={() => { onChange(section); setOpen(false); }}><strong>{section.designation}</strong><span>{section.designation_imperial ? `${section.designation_imperial} · ` : ""}{section.source}</span></button>)}</div>
    </div></div>}
  </section>;
}

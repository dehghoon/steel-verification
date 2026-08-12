import type { VerificationResponse } from "@linkoteq/steel-verification-contracts";

const num = (value: unknown, decimals = 2) => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: decimals }) : "—";
};

const pct = (value: unknown) => `${(Number(value ?? 0) * 100).toFixed(2)}%`;

const readable = (name: string) =>
  name
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export async function exportWordReport(result: VerificationResponse) {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    Table,
    TableRow,
    TableCell,
    WidthType,
  } = await import("docx");

  const n: any = result.normalized_inputs ?? {};
  const code = n.code ?? {};
  const material = n.material ?? {};
  const section = n.section ?? {};
  const geometry = n.geometry ?? {};
  const actions = n.actions ?? {};
  const values: any = result.values ?? {};
  const ratios: Record<string, number> = result.utilization_ratios ?? {};

  const v = (key: string) => values[key]?.display_value ?? values[key]?.raw_value ?? 0;
  const kN = (x: unknown) => Number(x ?? 0) / 1000;
  const kNm = (x: unknown) => Number(x ?? 0) / 1_000_000;
  const m = (x: unknown) => Number(x ?? 0) / 1000;

  const pairTable = (rows: Array<[string, string]>) =>
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: rows.map(
        ([label, value]) =>
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })] }),
              new TableCell({ children: [new Paragraph(value)] }),
            ],
          }),
      ),
    });

  const checkRows = Object.entries(ratios).map(([name, ratio]) => [
    readable(name),
    `${pct(ratio)} — ${Number(ratio) <= 1 ? "OK" : "NG"}`,
  ] as [string, string]);

  const children: any[] = [
    new Paragraph({
      text: "Engineering Calculation Report",
      heading: HeadingLevel.TITLE,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "Design of W-Sections According to CSA S16:2019 [CISC STRUCTURAL SECTIONS]",
          bold: true,
        }),
      ],
    }),
    new Paragraph("This engineering calculation report documents the structural verification of a CISC W-section in accordance with CSA S16:2019."),

    new Paragraph({ text: "Design Inputs", heading: HeadingLevel.HEADING_1 }),
    pairTable([
      ["Section", String(section.section_name_metric || result.section_dataset.designation || "—")],
      ["Imperial Designation", String(section.section_name_imperial || "—")],
    ]),

    new Paragraph({ text: "Reduction Factors", heading: HeadingLevel.HEADING_2 }),
    pairTable([
      ["Steel strength factor, ϕs", `${num(code.phi_s, 3)}  (CSA S16:19 Cl. 13.1)`],
      ["Steel ultimate strength factor, ϕu", `${num(code.phi_u, 3)}  (CSA S16:19 Cl. 13.1)`],
    ]),

    new Paragraph({ text: "Material Properties", heading: HeadingLevel.HEADING_2 }),
    pairTable([
      ["Yield strength, Fy", `${num(material.yield_strength)} MPa`],
      ["Ultimate strength, Fu", `${num(material.ultimate_strength)} MPa`],
      ["Young's Modulus, E", `${num(Number(material.elastic_modulus) / 1000)} GPa`],
      ["Shear modulus, G", `${num(material.shear_modulus)} MPa`],
    ]),

    new Paragraph({ text: "Factored Forces", heading: HeadingLevel.HEADING_2 }),
    pairTable([
      ["Axial force, N", `${num(kN((actions.tension_force || 0) - (actions.compression_force || 0)))} kN  (+ tension / − compression)`],
      ["Major shear, V1", `${num(kN(actions.shear_major))} kN`],
      ["Minor shear, V2", `${num(kN(actions.shear_minor))} kN`],
      ["Major moment, M2", `${num(kNm(actions.moment_major))} kN·m`],
      ["Minor moment, M1", `${num(kNm(actions.moment_minor))} kN·m`],
    ]),

    new Paragraph({ text: "Geometry", heading: HeadingLevel.HEADING_2 }),
    pairTable([
      ["Lx", `${num(m(geometry.length_major), 3)} m`],
      ["Ly", `${num(m(geometry.length_minor), 3)} m`],
      ["Lz", `${num(m(geometry.length_torsional), 3)} m`],
      ["kx / ky / kz", `${num(geometry.effective_length_factor_major, 2)} / ${num(geometry.effective_length_factor_minor, 2)} / ${num(geometry.effective_length_factor_torsional, 2)}`],
    ]),

    new Paragraph({ text: "Section Properties", heading: HeadingLevel.HEADING_2 }),
    pairTable([
      ["Area, A", `${num(section.gross_area)} mm²`],
      ["Depth, d", `${num(section.depth)} mm`],
      ["Flange width, b", `${num(section.flange_width)} mm`],
      ["Ix", `${num(section.moment_of_inertia_major)} mm⁴`],
      ["Iy", `${num(section.moment_of_inertia_minor)} mm⁴`],
    ]),

    new Paragraph({ text: "Slenderness Ratio", heading: HeadingLevel.HEADING_1 }),
    pairTable([
      ["λx = kx·Lx / rx", `${num(v("slenderness_major"))}  (CSA S16:19 Cl. 10.4.1)`],
      ["λy = ky·Ly / ry", num(v("slenderness_minor"))],
    ]),

    new Paragraph({ text: "Tension Capacity", heading: HeadingLevel.HEADING_1 }),
    pairTable([
      ["Tr = min(Tr1, Tr2)", `${num(kN(v("tension_resistance")))} kN`],
      ["Utilization", pct(ratios.tension)],
    ]),

    new Paragraph({ text: "Compression Capacity", heading: HeadingLevel.HEADING_1 }),
    pairTable([
      ["Cr", `${num(kN(v("compression_resistance")))} kN`],
      ["Utilization", pct(ratios.compression)],
    ]),

    new Paragraph({ text: "Shear & Bending Checks", heading: HeadingLevel.HEADING_1 }),
    pairTable([
      ["Major shear resistance", `${num(kN(v("major_shear_resistance")))} kN`],
      ["Minor shear resistance", `${num(kN(v("minor_shear_resistance")))} kN`],
      ["Major moment resistance", `${num(kNm(v("moment_resistance_major")))} kN·m`],
      ["Minor moment resistance", `${num(kNm(v("moment_resistance_minor")))} kN·m`],
    ]),

    new Paragraph({ text: "Final Verification Summary", heading: HeadingLevel.HEADING_1 }),
    pairTable(checkRows),
    new Paragraph({
      children: [
        new TextRun({ text: "Overall Status: ", bold: true }),
        new TextRun({ text: result.overall_status, bold: true }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Maximum Utilization Ratio: ", bold: true }),
        new TextRun({ text: pct(v("max_uls_utilization")) }),
      ],
    }),
  ];

  const doc = new Document({
    creator: "LinkoTech Engineering",
    title: "W-Section Verification Report",
    description: "CSA S16:2019 W-section verification report",
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const designation = String(result.section_dataset.designation || "W-Section").replace(/[^a-z0-9_-]+/gi, "-");
  link.href = url;
  link.download = `${designation}-CSA-S16-Verification.docx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

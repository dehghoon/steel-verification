import type { SectionRecord, VerificationRequest, VerificationResponse } from "@linkoteq/steel-verification-contracts";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function parseResponse<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok) {
    const detail = body?.detail;
    throw new Error(detail?.message ?? detail?.code ?? `Request failed with ${response.status}`);
  }
  return body as T;
}

export async function searchSections(query: string): Promise<{items: SectionRecord[]; total: number; dataset_version: string}> {
  const normalizedQuery = query.trim();
  const pageSize = 200;
  let offset = 0;
  let total = Number.POSITIVE_INFINITY;
  let datasetVersion = "";
  const items: SectionRecord[] = [];

  while (offset < total) {
    const params = new URLSearchParams({ family: "W", limit: String(pageSize), offset: String(offset) });
    if (normalizedQuery) params.set("query", normalizedQuery);
    const response = await fetch(`${API_BASE_URL}/api/v1/sections?${params.toString()}`, { cache: "no-store" });
    const page = await parseResponse<{items: SectionRecord[]; total: number; dataset_version: string}>(response);
    items.push(...page.items);
    total = page.total;
    datasetVersion = page.dataset_version;
    offset += page.items.length;
    if (page.items.length === 0) break;
  }

  return { items, total: Number.isFinite(total) ? total : items.length, dataset_version: datasetVersion };
}

export async function runVerification(payload: VerificationRequest): Promise<VerificationResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/calculations/w-section`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(payload)
  });
  return parseResponse(response);
}

export async function previewReport(calculation: VerificationResponse): Promise<unknown> {
  const response = await fetch(`${API_BASE_URL}/api/v1/reports/preview`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ calculation, project: {} })
  });
  return parseResponse(response);
}

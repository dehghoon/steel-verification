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
  const params = new URLSearchParams({ family: "W", limit: "50" });
  if (query.trim()) params.set("query", query.trim());
  const response = await fetch(`${API_BASE_URL}/api/v1/sections?${params.toString()}`, { cache: "no-store" });
  return parseResponse(response);
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

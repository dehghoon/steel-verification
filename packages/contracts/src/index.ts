export type CheckStatus = "PASS" | "FAIL" | "INDETERMINATE";

export interface SectionRecord {
  id: string;
  designation: string;
  designation_imperial?: string | null;
  designation_metric?: string | null;
  family: string;
  source: string;
  dataset_version: string;
  units: Record<string, string>;
  properties: Record<string, number | string | null>;
}

export interface VerificationRequest {
  section_id: string;
  designation: string;
  dataset_version: string;
  material: {
    yield_strength: number;
    ultimate_strength: number;
    elastic_modulus: number;
    shear_modulus: number;
    mass_density?: number | null;
  };
  geometry: {
    length_major: number;
    length_minor: number;
    length_torsional: number;
    effective_length_factor_major: number;
    effective_length_factor_minor: number;
    effective_length_factor_torsional: number;
  };
  actions: {
    compression_force: number;
    tension_force: number;
    shear_major: number;
    shear_minor: number;
    moment_major: number;
    moment_minor: number;
    live_load_deflection: number;
  };
  deflection_limit_ratio: number;
  continuous_lateral_restraint_confirmed: boolean;
  coincident_force_set: boolean;
  net_area_equals_gross_confirmed: boolean;
  project_id?: string | null;
}

export interface VerificationResponse {
  values: Record<string, {
    raw_value: number;
    display_value: number;
    unit: string;
    formula_id: string;
    source_reference: string;
    code_reference_ids: string[];
  }>;
  intermediate_values: Record<string, number | string>;
  utilization_ratios: Record<string, number>;
  governing_check: string | null;
  uls_status: CheckStatus;
  sls_status: CheckStatus;
  slenderness_status: CheckStatus;
  overall_status: CheckStatus;
  warnings: string[];
  fatal_errors: string[];
  formula_ids: string[];
  code_reference_ids: string[];
  normalized_inputs: Record<string, unknown>;
  engine: Record<string, string>;
  section_dataset: Record<string, string>;
}

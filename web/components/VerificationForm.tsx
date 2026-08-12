"use client";

import { useEffect, useMemo, useState } from "react";
import type { SectionRecord, VerificationRequest, VerificationResponse } from "@linkoteq/steel-verification-contracts";
import { runVerification } from "@/lib/api";

type NumericFields = Record<string, string>;
export type DisplayActions = { axialKn:number; shearMajorKn:number; shearMinorKn:number; momentMajorKnm:number; momentMinorKnm:number; };
const initial: NumericFields = { yield_strength:"350", ultimate_strength:"450", elastic_modulus:"200000", shear_modulus:"77000", length_major:"3.0", length_minor:"3.0", length_torsional:"3.0", k_major:"1.0", k_minor:"1.0", k_torsional:"1.0", axial_force:"0", shear_major:"0", shear_minor:"0", moment_major:"0", moment_minor:"0" };
const DEFAULT_LIVE_LOAD_DEFLECTION_MM=0, DEFAULT_DEFLECTION_LIMIT_RATIO=300;

export function VerificationForm({ section, onResult, onActionsChange }: { section:SectionRecord|null; onResult:(result:VerificationResponse|null)=>void; onActionsChange?:(actions:DisplayActions)=>void; }) {
  const [fields,setFields]=useState(initial); const [error,setError]=useState(""); const [restraint,setRestraint]=useState(false); const [coincident,setCoincident]=useState(false); const [netArea,setNetArea]=useState(false); const [status,setStatus]=useState("Ready");
  const n=(key:string)=>Number(fields[key]); const update=(key:string,value:string)=>setFields(c=>({...c,[key]:value}));
  const actions=useMemo(()=>({axialKn:n("axial_force"),shearMajorKn:n("shear_major"),shearMinorKn:n("shear_minor"),momentMajorKnm:n("moment_major"),momentMinorKnm:n("moment_minor")}),[fields]);
  useEffect(()=>onActionsChange?.(actions),[actions,onActionsChange]);

  useEffect(()=>{
    if(!section) return;
    const timer=setTimeout(async()=>{
      const axialForceKn=n("axial_force");
      const payload:VerificationRequest={ section_id:section.id, designation:section.designation, dataset_version:section.dataset_version,
        material:{yield_strength:n("yield_strength"),ultimate_strength:n("ultimate_strength"),elastic_modulus:n("elastic_modulus"),shear_modulus:n("shear_modulus")},
        geometry:{length_major:n("length_major")*1000,length_minor:n("length_minor")*1000,length_torsional:n("length_torsional")*1000,effective_length_factor_major:n("k_major"),effective_length_factor_minor:n("k_minor"),effective_length_factor_torsional:n("k_torsional")},
        actions:{compression_force:Math.max(-axialForceKn,0)*1000,tension_force:Math.max(axialForceKn,0)*1000,shear_major:n("shear_major")*1000,shear_minor:n("shear_minor")*1000,moment_major:n("moment_major")*1000000,moment_minor:n("moment_minor")*1000000,live_load_deflection:DEFAULT_LIVE_LOAD_DEFLECTION_MM},
        deflection_limit_ratio:DEFAULT_DEFLECTION_LIMIT_RATIO,continuous_lateral_restraint_confirmed:restraint,coincident_force_set:coincident,net_area_equals_gross_confirmed:netArea };
      setStatus("Updating…"); setError("");
      try { onResult(await runVerification(payload)); setStatus("Results updated automatically"); } catch(err){ onResult(null); setError(err instanceof Error?err.message:"Verification failed."); setStatus("Update failed"); }
    },450);
    return()=>clearTimeout(timer);
  },[section,fields,restraint,coincident,netArea,onResult]);

  const input=(key:string,label:string,unit:string)=><label key={key}><span>{label}<small>{unit}</small></span><input type="number" step="any" value={fields[key]} onChange={e=>update(key,e.target.value)}/></label>;
  return <section className="panel"><div className="panelTitle"><div><span className="eyebrow">CSA S16:2019</span><h2>Verification inputs</h2></div><small className="autoStatus">{status}</small></div>
    <h3>Material</h3><div className="fieldGrid">{input("yield_strength","Fy","MPa")}{input("ultimate_strength","Fu","MPa")}{input("elastic_modulus","E","MPa")}{input("shear_modulus","G","MPa")}</div>
    <h3>Member geometry</h3><div className="fieldGrid">{input("length_major","Lx","m")}{input("length_minor","Ly","m")}{input("length_torsional","Lz","m")}{input("k_major","kx","—")}{input("k_minor","ky","—")}{input("k_torsional","kz","—")}</div>
    <h3>Factored Forces</h3><div className="fieldGrid">{input("axial_force","Axial Force","kN")}{input("shear_major","Major Shear (V1)","kN")}{input("shear_minor","Minor Shear (V2)","kN")}{input("moment_major","Major Moment (M2)","kN·m")}{input("moment_minor","Minor Moment (M1)","kN·m")}</div>
    <p className="inputNote">Axial Force: positive = tension; negative = compression. The axial arrow remains above the column and reverses direction with the sign.</p>
    <div className="confirmations"><label><input type="checkbox" checked={restraint} onChange={e=>setRestraint(e.target.checked)}/> Continuous lateral restraint confirmed</label><label><input type="checkbox" checked={coincident} onChange={e=>setCoincident(e.target.checked)}/> Coincident force set confirmed</label><label><input type="checkbox" checked={netArea} onChange={e=>setNetArea(e.target.checked)}/> Net area equals gross area confirmed</label></div>{error&&<p className="error">{error}</p>}
  </section>;
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Edges, Grid, Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { SectionRecord } from "@linkoteq/steel-verification-contracts";
import type { DisplayActions } from "./VerificationForm";

function numberValue(section: SectionRecord, key: string): number {
  const value = section.properties[key];
  return typeof value === "number" ? value : 0;
}

function createWSectionShape(depth: number, flangeWidth: number, webThickness: number, flangeThickness: number) {
  const x0 = -flangeWidth / 2;
  const x1 = -webThickness / 2;
  const x2 = webThickness / 2;
  const x3 = flangeWidth / 2;
  const y0 = -depth / 2;
  const y1 = y0 + flangeThickness;
  const y2 = depth / 2 - flangeThickness;
  const y3 = depth / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x0, y0); shape.lineTo(x3, y0); shape.lineTo(x3, y1);
  shape.lineTo(x2, y1); shape.lineTo(x2, y2); shape.lineTo(x3, y2);
  shape.lineTo(x3, y3); shape.lineTo(x0, y3); shape.lineTo(x0, y2);
  shape.lineTo(x1, y2); shape.lineTo(x1, y1); shape.lineTo(x0, y1);
  shape.closePath();
  return shape;
}

function ParametricWColumn({ section, selected, onSelect }: { section: SectionRecord; selected: boolean; onSelect: () => void }) {
  const geometry = useMemo(() => {
    const depth = numberValue(section, "depth");
    const flangeWidth = numberValue(section, "flange_width");
    const webThickness = numberValue(section, "web_thickness");
    const flangeThickness = numberValue(section, "flange_thickness");
    const sectionScale = 1 / Math.max(depth, flangeWidth, 1);
    const displayLength = 4.2;
    const shape = createWSectionShape(depth * sectionScale, flangeWidth * sectionScale, webThickness * sectionScale, flangeThickness * sectionScale);
    const result = new THREE.ExtrudeGeometry(shape, { depth: displayLength, bevelEnabled: false, curveSegments: 1, steps: 1 });
    result.translate(0, 0, -displayLength / 2);
    result.rotateX(Math.PI / 2);
    result.computeVertexNormals();
    return result;
  }, [section]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <group onClick={(event) => { event.stopPropagation(); onSelect(); }}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial color={selected ? "#f5a623" : "#2f668f"} metalness={0.58} roughness={0.3} />
        <Edges threshold={18} color={selected ? "#8b4d00" : "#163d5d"} />
      </mesh>
      <mesh position={[0, -2.18, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.7, 0.14, 1.45]} />
        <meshStandardMaterial color="#424c53" metalness={0.72} roughness={0.3} />
      </mesh>
    </group>
  );
}

function ForceArrow({ start, direction, label, value }: { start: [number, number, number]; direction: [number, number, number]; label: string; value: string }) {
  const length = 1.35;
  const dir = useMemo(() => new THREE.Vector3(...direction).normalize(), [direction]);
  const midpoint = useMemo(() => new THREE.Vector3(...start).add(dir.clone().multiplyScalar(length / 2)), [start, dir]);
  const tip = useMemo(() => new THREE.Vector3(...start).add(dir.clone().multiplyScalar(length)), [start, dir]);
  const quaternion = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir), [dir]);
  return <group>
    <mesh position={midpoint} quaternion={quaternion}><cylinderGeometry args={[0.035, 0.035, 1.1, 20]} /><meshStandardMaterial color="#ef2d3f" /></mesh>
    <mesh position={tip} quaternion={quaternion}><coneGeometry args={[0.12, 0.28, 24]} /><meshStandardMaterial color="#ef2d3f" /></mesh>
    <Html position={[tip.x + 0.18, tip.y + 0.12, tip.z]} center distanceFactor={7} style={{ pointerEvents: "none" }}><span className="actionLabel forceLabel"><b>{label}</b><small>{value}</small></span></Html>
  </group>;
}

function MomentArrow({ position, rotation = [0, 0, 0], label, value }: { position: [number, number, number]; rotation?: [number, number, number]; label: string; value: string }) {
  const curve = useMemo(() => {
    const points = Array.from({ length: 33 }, (_, index) => {
      const angle = (Math.PI * 1.42 * index) / 32;
      return new THREE.Vector3(0.33 * Math.cos(angle), 0, 0.33 * Math.sin(angle));
    });
    return new THREE.CatmullRomCurve3(points, false, "centripetal");
  }, []);
  const tip = curve.getPoint(1);
  const tangent = curve.getTangent(1).normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
  return <group position={position} rotation={rotation}>
    <mesh><tubeGeometry args={[curve, 40, 0.026, 10, false]} /><meshStandardMaterial color="#8b5cf6" /></mesh>
    <mesh position={tip} quaternion={quaternion}><coneGeometry args={[0.075, 0.18, 20]} /><meshStandardMaterial color="#8b5cf6" /></mesh>
    <Html position={[tip.x, 0.14, tip.z]} center distanceFactor={7} style={{ pointerEvents: "none" }}><span className="actionLabel momentLabel"><b>{label}</b><small>{value}</small></span></Html>
  </group>;
}

export default function MemberViewerScene({ section, actions }: { section: SectionRecord; actions: DisplayActions }) {
  const [selected, setSelected] = useState(false);
  const axial = actions.axialKn;
  const compression = axial < 0;
  const axialStart: [number, number, number] = compression ? [0, 3.63, 0] : [0, 2.28, 0];
  const axialDirection: [number, number, number] = compression ? [0, -1, 0] : [0, 1, 0];
  const axialState = compression ? "Compression" : "Tension";

  return (
    <div className="viewer interactiveViewer" onClick={() => setSelected(false)}>
      <Canvas shadows dpr={[1, 2]} camera={{ position: [6.2, 3.8, 7.2], fov: 40 }} onPointerMissed={() => setSelected(false)}>
        <color attach="background" args={["#eef3f6"]} />
        <ambientLight intensity={1.15} />
        <directionalLight position={[5, 8, 6]} intensity={2.1} castShadow />
        <directionalLight position={[-4, 3, -5]} intensity={0.8} />
        <group position={[0, 0.15, 0]} rotation={[0, -0.45, 0]}>
          <ParametricWColumn section={section} selected={selected} onSelect={() => setSelected(true)} />
          <ForceArrow start={axialStart} direction={axialDirection} label="P" value={`${axial.toFixed(2)} kN · ${axialState}`} />
          <ForceArrow start={[0, 2.28, 0]} direction={[-0.15, 0, 0.95]} label="V1" value={`${actions.shearMajorKn.toFixed(2)} kN`} />
          <ForceArrow start={[0, 2.28, 0]} direction={[0.95, 0, 0.15]} label="V2" value={`${actions.shearMinorKn.toFixed(2)} kN`} />
          <MomentArrow position={[-0.5, 2.28, 0.62]} rotation={[Math.PI / 2, 0, 0.16]} label="M2" value={`${actions.momentMajorKnm.toFixed(2)} kN·m`} />
          <MomentArrow position={[0.72, 2.28, 0.12]} rotation={[0, 0, Math.PI / 2]} label="M1" value={`${actions.momentMinorKnm.toFixed(2)} kN·m`} />
        </group>
        <Grid position={[0, -2.25, 0]} args={[12, 12]} cellSize={0.5} cellThickness={0.6} sectionSize={2} sectionThickness={1.2} fadeDistance={16} infiniteGrid />
        <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={5} maxDistance={13} target={[0, 0, 0]} />
      </Canvas>
      <div className="viewerHint">Drag to rotate · Scroll to zoom · Click the column</div>
      {selected && <aside className="columnInfoCard" onClick={(event) => event.stopPropagation()}>
        <div className="columnInfoHeading"><span>TOP END FORCES</span><strong>{section.designation}</strong></div>
        <dl>
          <div><dt>P (axial)</dt><dd>{axial.toFixed(2)} kN · {axialState}</dd></div>
          <div><dt>V1 (major shear)</dt><dd>{actions.shearMajorKn.toFixed(2)} kN</dd></div>
          <div><dt>V2 (minor shear)</dt><dd>{actions.shearMinorKn.toFixed(2)} kN</dd></div>
          <div><dt>M2 (major moment)</dt><dd>{actions.momentMajorKnm.toFixed(2)} kN·m</dd></div>
          <div><dt>M1 (minor moment)</dt><dd>{actions.momentMinorKnm.toFixed(2)} kN·m</dd></div>
        </dl>
      </aside>}
    </div>
  );
}

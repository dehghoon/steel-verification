"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import type { SectionRecord } from "@linkoteq/steel-verification-contracts";

function numberValue(section: SectionRecord, key: string): number {
  const value = section.properties[key];
  return typeof value === "number" ? value : 0;
}

function WSectionMesh({ section }: { section: SectionRecord }) {
  const depth = numberValue(section, "depth");
  const width = numberValue(section, "flange_width");
  const tf = numberValue(section, "flange_thickness");
  const tw = numberValue(section, "web_thickness");
  const scale = 1 / Math.max(depth, width, 1);
  const memberLength = 3;
  const flangeW = Math.max(width * scale, 0.1);
  const flangeT = Math.max(tf * scale, 0.02);
  const webT = Math.max(tw * scale, 0.02);
  const webH = Math.max((depth - 2 * tf) * scale, 0.05);
  const y = webH / 2 + flangeT / 2;

  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      <mesh position={[0, y, 0]}>
        <boxGeometry args={[flangeW, flangeT, memberLength]} />
        <meshStandardMaterial metalness={0.55} roughness={0.42} />
      </mesh>
      <mesh position={[0, -y, 0]}>
        <boxGeometry args={[flangeW, flangeT, memberLength]} />
        <meshStandardMaterial metalness={0.55} roughness={0.42} />
      </mesh>
      <mesh>
        <boxGeometry args={[webT, webH, memberLength]} />
        <meshStandardMaterial metalness={0.55} roughness={0.42} />
      </mesh>
    </group>
  );
}

export default function MemberViewerScene({ section }: { section: SectionRecord }) {
  return (
    <div className="viewer">
      <Canvas camera={{ position: [3.8, 2.6, 4.3], fov: 38 }}>
        <ambientLight intensity={1.2} />
        <directionalLight position={[4, 5, 6]} intensity={2.5} />
        <WSectionMesh section={section} />
        <OrbitControls makeDefault enablePan={false} />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}

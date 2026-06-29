import { Html, Line, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";

import { isImageUrl, relationColor } from "../../lib/utils";

import type { GardenRendererProps } from "../../lib/plugins/layout";

type Vec3 = [number, number, number];

const RADIUS = 6;

/** Even point distribution on a sphere (Fibonacci sphere). */
const spherePositions = (count: number, radius: number): Vec3[] => {
  if (count === 1) return [[0, 0, 0]];
  const points: Vec3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    points.push([
      Math.cos(theta) * ring * radius,
      y * radius,
      Math.sin(theta) * ring * radius,
    ]);
  }
  return points;
};

type SproutData = {
  label?: string;
  image?: string;
  logo?: string;
  homepage_url?: string;
  theme?: { primary_color?: string | null } | null;
};

/**
 * 3D garden renderer (the first opt-in layout plugin). Places the products on
 * a sphere with their typed connections drawn between them, orbit-controllable.
 * Lives in the `@omnidotdev/garden/3d` entry so Three.js stays out of the base
 * bundle.
 */
const Garden3D = ({ nodes, edges, relationColors }: GardenRendererProps) => {
  const sprouts = useMemo(
    () => nodes.filter((node) => node.type === "sprout"),
    [nodes],
  );
  const positions = useMemo(
    () => spherePositions(sprouts.length, RADIUS),
    [sprouts.length],
  );
  const posById = useMemo(() => {
    const map = new Map<string, Vec3>();
    sprouts.forEach((node, i) => map.set(node.id, positions[i]));
    return map;
  }, [sprouts, positions]);

  const relationEdges = useMemo(
    () =>
      edges.filter(
        (edge) =>
          (edge.data as { kind?: string } | undefined)?.kind === "relation",
      ),
    [edges],
  );

  return (
    <div className="garden:h-full garden:w-full garden:overflow-hidden garden:rounded-lg garden:border garden:border-border garden:bg-background">
      <Canvas camera={{ position: [0, 0, 18], fov: 50 }}>
        <ambientLight intensity={0.9} />
        <pointLight position={[12, 12, 12]} intensity={1.2} />
        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          autoRotate
          autoRotateSpeed={0.4}
        />

        {relationEdges.map((edge, i) => {
          const a = posById.get(edge.source);
          const b = posById.get(edge.target);
          if (!a || !b) return null;
          const relation =
            (edge.data as { relations?: string[] } | undefined)
              ?.relations?.[0] ?? "related";
          return (
            <Line
              key={edge.id ?? `rel-${i}`}
              points={[a, b]}
              color={relationColor(relation, relationColors)}
              lineWidth={1}
              transparent
              opacity={0.55}
            />
          );
        })}

        {sprouts.map((node, i) => {
          const data = node.data as SproutData;
          const color = data.theme?.primary_color ?? "#14b8a6";
          const icon = data.image || data.logo || "🌱";
          return (
            <group key={node.id} position={positions[i]}>
              <mesh>
                <sphereGeometry args={[0.22, 24, 24]} />
                <meshStandardMaterial
                  color={color}
                  emissive={color}
                  emissiveIntensity={0.25}
                />
              </mesh>
              <Html
                center
                distanceFactor={11}
                style={{ pointerEvents: "auto" }}
              >
                <button
                  type="button"
                  onClick={() =>
                    data.homepage_url &&
                    window.open(data.homepage_url, "_blank", "noopener")
                  }
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                    width: 110,
                    padding: "6px 8px",
                    cursor: data.homepage_url ? "pointer" : "default",
                    borderRadius: 10,
                    border: `1px solid ${color}`,
                    background: "rgba(10,10,12,0.78)",
                    color: "#fff",
                    fontSize: 11,
                    textAlign: "center",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  {isImageUrl(data.image) ? (
                    <img
                      src={data.image}
                      alt={data.label}
                      width={28}
                      height={28}
                      style={{ objectFit: "contain" }}
                    />
                  ) : (
                    <span style={{ fontSize: 24, lineHeight: 1 }}>{icon}</span>
                  )}
                  <span style={{ fontWeight: 600 }}>{data.label}</span>
                </button>
              </Html>
            </group>
          );
        })}
      </Canvas>
    </div>
  );
};

export default Garden3D;

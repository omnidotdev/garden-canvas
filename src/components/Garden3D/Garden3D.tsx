import { Html, Line, TrackballControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ExternalLinkIcon,
  EyeIcon,
  EyeOffIcon,
  FlowerIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { isImageUrl, relationColor } from "../../lib/utils";
import { GlyphIcon } from "../GlyphIcon";
import { SproutDialog } from "../SproutDialog";

import type { GardenRendererProps } from "../../lib/plugins/layout";
import type { NodeData } from "../nodes";

type Vec3 = [number, number, number];

const RADIUS = 9;
const CAMERA_POSITION: Vec3 = [0, 0, 21];

/** Squared distance from a point to the (static) camera, for depth sorting. */
const distanceToCameraSq = ([x, y, z]: Vec3): number =>
  (x - CAMERA_POSITION[0]) ** 2 +
  (y - CAMERA_POSITION[1]) ** 2 +
  (z - CAMERA_POSITION[2]) ** 2;

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
  description?: string;
  image?: string;
  logo?: string;
  homepage_url?: string;
  theme?: { primary_color?: string | null } | null;
  coming_soon?: boolean;
};

/**
 * Gentle idle rotation of the camera around the sphere. Besides the "living"
 * feel, this is what keeps the scene readable as 3D: drei's <Html> only writes
 * its distance-based depth scale when a label's projected position changes, so
 * a perfectly still camera leaves every label at 1x (the scene looks flat and
 * the cards clump) until the first drag. Continuous motion means the depth
 * scale is always applied, from first paint. It pauses while the user is
 * actively dragging (see `paused`) so it never fights their input.
 */
const IdleRotate = ({ paused }: { paused: boolean }) => {
  const camera = useThree((state) => state.camera);
  useFrame((_, delta) => {
    if (paused) return;
    // ~3 degrees/second, framerate-independent
    const angle = 0.05 * delta;
    const { x, z } = camera.position;
    camera.position.x = x * Math.cos(angle) - z * Math.sin(angle);
    camera.position.z = x * Math.sin(angle) + z * Math.cos(angle);
    camera.lookAt(0, 0, 0);
  });
  return null;
};

/**
 * Pulls the camera to whatever distance fits the whole sphere (plus room for
 * the node cards) within the current viewport on both axes. On a wide desktop
 * this is the usual close-in framing; on a narrow phone it pulls back so the
 * constellation fits instead of spilling off the sides ("nodes too far apart"),
 * and since the labels scale with distance they shrink to match, keeping the
 * layout dense and readable at any size. Re-runs on resize.
 */
const FitCamera = () => {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  useEffect(() => {
    // Matches the Canvas camera fov (50); half-angle in radians
    const halfFov = (50 * Math.PI) / 360;
    const aspect = size.width / Math.max(1, size.height);
    const radiusWithCards = RADIUS + 1;
    const fitVertical = radiusWithCards / Math.tan(halfFov);
    const fitHorizontal = fitVertical / Math.max(0.001, aspect);
    const distance = Math.max(fitVertical, fitHorizontal);
    const direction = camera.position.clone().normalize();
    camera.position.copy(direction.multiplyScalar(distance));
    camera.lookAt(0, 0, 0);
  }, [camera, size.width, size.height]);
  return null;
};

/**
 * 3D garden renderer (the first opt-in layout plugin). Places the products on
 * a sphere with their typed connections drawn between them, orbit-controllable.
 * Lives in the `@omnidotdev/garden/3d` entry so Three.js stays out of the base
 * bundle.
 */
const Garden3D = ({
  schema,
  nodes,
  edges,
  relationColors,
  showEdges: controlledShowEdges,
  onShowEdgesChange,
  showPoweredBy = true,
  interactive = true,
}: GardenRendererProps) => {
  const [selectedSprout, setSelectedSprout] = useState<NodeData | null>(null);
  const [isSproutDialogOpen, setIsSproutDialogOpen] = useState(false);
  // Idle rotation pauses while the user is actively dragging so it never fights
  // their input, then stays still for a beat after release so the reader can
  // settle before the drift resumes.
  const [isInteracting, setIsInteracting] = useState(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    },
    [],
  );
  // Typed connections start hidden (they read as clutter over the sphere) and
  // the user reveals them, mirroring the 2D views. Controlled when `showEdges`
  // is provided (e.g. bound to URL state), otherwise tracked internally.
  const [internalShowEdges, setInternalShowEdges] = useState(false);
  const showEdges = controlledShowEdges ?? internalShowEdges;
  const setShowEdges = useCallback(
    (next: boolean) => {
      onShowEdgesChange?.(next);
      if (controlledShowEdges === undefined) setInternalShowEdges(next);
    },
    [onShowEdgesChange, controlledShowEdges],
  );

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
    <div
      // `isolation: isolate` gives the in-scene HTML labels their own stacking
      // context, so their depth-sorted z-indices stay contained beneath page
      // chrome and the teaser dialog without flattening the depth ordering.
      // The in-scene labels stack up to `zIndexRange[0]` (16777271) within this
      // context, so the overlay chrome below sits at 16777272 to stay above them
      // (a plain z-10 was getting covered by nearer nodes).
      style={{ isolation: "isolate" }}
      className="garden:relative garden:h-full garden:w-full garden:overflow-hidden garden:rounded-lg garden:border garden:border-border garden:bg-background"
    >
      {/* Persistent garden-name badge, mirroring the 2D views. */}
      <div className="garden:absolute garden:top-3 garden:right-3 garden:z-[16777272] garden:flex garden:items-center garden:gap-2 garden:rounded-md garden:border garden:border-border garden:bg-background/80 garden:px-3 garden:py-1.5 garden:font-medium garden:text-sm garden:shadow-sm garden:backdrop-blur-sm">
        <FlowerIcon className="garden:h-4 garden:w-4" />
        {schema.name}
        {schema.icon && (
          <span className="garden:ml-1">{schema.icon as string}</span>
        )}
      </div>

      {/* Connections toggle, mirroring the 2D Connections panel; typed edges
          start hidden and reveal on click. */}
      {relationEdges.length > 0 && (
        <button
          type="button"
          onClick={() => setShowEdges(!showEdges)}
          title={showEdges ? "Hide connections" : "Show connections"}
          className="garden:absolute garden:top-3 garden:left-3 garden:z-[16777272] garden:flex garden:items-center garden:gap-1.5 garden:rounded-md garden:border garden:border-border garden:bg-background/80 garden:px-3 garden:py-1.5 garden:font-medium garden:text-muted-foreground garden:text-xs garden:uppercase garden:tracking-wide garden:shadow-sm garden:backdrop-blur-sm garden:transition-colors garden:hover:text-foreground"
        >
          {showEdges ? (
            <EyeIcon className="garden:h-3 garden:w-3" />
          ) : (
            <EyeOffIcon className="garden:h-3 garden:w-3" />
          )}
          Connections
        </button>
      )}

      {showPoweredBy && (
        <a
          href="https://garden.omni.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="garden:absolute garden:right-3 garden:bottom-3 garden:z-[16777272] garden:flex garden:items-center garden:gap-1.5 garden:rounded-md garden:border garden:border-border garden:bg-background/80 garden:px-2.5 garden:py-1 garden:text-xs garden:opacity-80 garden:shadow-sm garden:backdrop-blur-sm garden:transition-opacity garden:hover:opacity-100"
        >
          <FlowerIcon className="garden:h-3 garden:w-3" />
          Powered by Garden
          <ExternalLinkIcon className="garden:h-3 garden:w-3" />
        </a>
      )}

      <Canvas camera={{ position: [0, 0, 21], fov: 50 }}>
        <FitCamera />
        <IdleRotate paused={isInteracting} />
        <ambientLight intensity={0.9} />
        <pointLight position={[12, 12, 12]} intensity={1.2} />
        {/* Trackball (arcball) rotation so the sphere spins freely in any
            direction, unlike orbit which locks a world-up and stops at the
            poles. The product labels are screen-space <Html>, so they stay
            upright and readable at any camera roll; only the layout rotates.
            Panning is disabled so the constellation can't be dragged off-screen
            and lost, and zoom is bounded to keep it framed. dynamicDampingFactor
            gives a light glide (the old orbit damping of 0.08 was so low the
            camera coasted ~100px past release, reading as a jump). */}
        <TrackballControls
          makeDefault
          enabled={interactive}
          noPan
          rotateSpeed={2.6}
          zoomSpeed={0.6}
          dynamicDampingFactor={0.2}
          minDistance={11}
          maxDistance={60}
          onStart={() => {
            if (resumeTimer.current) clearTimeout(resumeTimer.current);
            setIsInteracting(true);
          }}
          onEnd={() => {
            if (resumeTimer.current) clearTimeout(resumeTimer.current);
            // hold still for a few seconds after the last drag so the layout is
            // easy to read before the idle drift starts again
            resumeTimer.current = setTimeout(
              () => setIsInteracting(false),
              4000,
            );
          }}
        />

        {showEdges &&
          relationEdges.map((edge, i) => {
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

        {sprouts
          .map((node, i) => ({ node, pos: positions[i] }))
          // Paint farthest-from-camera first so nearer labels stack on top in
          // the static view. drei's <Html> only rewrites its depth z-index once
          // the camera moves, so on the initial (non-rotating) scene DOM order
          // is what decides stacking; without this, background nodes bleed in
          // front. Once the user orbits, drei's zIndexRange takes over.
          .sort((a, b) => distanceToCameraSq(b.pos) - distanceToCameraSq(a.pos))
          .map(({ node, pos }) => {
            const data = node.data as SproutData;
            const color = data.theme?.primary_color ?? "#14b8a6";
            const icon = data.image || data.logo || "🌱";
            const comingSoon = Boolean(data.coming_soon);
            return (
              <group key={node.id} position={pos}>
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
                  // Wide zIndexRange so labels are z-ordered by distance to the
                  // camera (near nodes cover far ones). A compressed range
                  // collapsed every label onto a single z-index, letting
                  // background nodes bleed in front; omitting it disables z-index
                  // entirely. The wrapper's `isolate` keeps this (high) range
                  // beneath page chrome and the teaser dialog.
                  zIndexRange={[16777271, 0]}
                  style={{ pointerEvents: "auto" }}
                >
                  <button
                    type="button"
                    disabled={comingSoon}
                    onClick={() => {
                      // Coming-soon products are teased but not interactive.
                      if (comingSoon) return;
                      setSelectedSprout(node.data as unknown as NodeData);
                      setIsSproutDialogOpen(true);
                    }}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 3,
                      width: 150,
                      padding: "8px 10px",
                      cursor: comingSoon ? "default" : "pointer",
                      borderRadius: 10,
                      border: `1px solid ${color}`,
                      background: "rgba(10,10,12,0.78)",
                      color: "#fff",
                      fontSize: 11,
                      textAlign: "center",
                      backdropFilter: "blur(4px)",
                      opacity: comingSoon ? 0.6 : 1,
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
                      <GlyphIcon glyph={icon} size={28} label={data.label} />
                    )}
                    <span style={{ fontWeight: 600 }}>{data.label}</span>
                    {comingSoon ? (
                      <span
                        style={{
                          fontSize: 9,
                          lineHeight: 1.3,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                          opacity: 0.85,
                        }}
                      >
                        Coming soon
                      </span>
                    ) : (
                      data.description && (
                        <span
                          style={{
                            fontSize: 9,
                            lineHeight: 1.3,
                            opacity: 0.75,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {data.description}
                        </span>
                      )
                    )}
                  </button>
                </Html>
              </group>
            );
          })}
      </Canvas>

      <SproutDialog
        sprout={selectedSprout}
        open={isSproutDialogOpen}
        onOpenChange={(open) => {
          setIsSproutDialogOpen(open);
          if (!open) {
            setTimeout(() => setSelectedSprout(null), 200);
          }
        }}
      />
    </div>
  );
};

export default Garden3D;

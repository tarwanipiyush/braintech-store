"use client";

import { createContext, useContext, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { STEP_COUNT, STEP_SECONDS } from "./steps";

/* ------------------------------------------------------------------ *
 * Layout (world units). The case is open on the +z side (where the
 * camera is), so parts fly in from the viewer and settle on the back
 * plate, exactly like a real build. The glass panel closes it last.
 *
 *   case interior   x -1.5..1.5   y -1.7..1.7   z -0.9..0.9
 *   motherboard     centre (0.2, 0.2, -0.81)  size 1.9 x 2.0
 * ------------------------------------------------------------------ */

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

/* The page talks to the scene through one mutable "bus" ref (no re-renders needed):
 *   progress  0..STEP_COUNT   how far the build has got
 *   target    number | null   smooth-seek target (prev / next / click a step)
 *   hover     number | null   index of the part under the pointer
 *   focus     number | null   part the camera was sent to by a click
 *   zoom      number | null   camera distance to dolly to after a click
 *   view      [x,y,z] | null  camera preset to glide to
 */
const SceneContext = createContext(null);

// Where the camera should look while each step is being built.
const FOCUS = [
  [0, 0, 0], [0.1, -1.2, -0.3], [0.2, 0.2, -0.8], [0.3, 0.55, -0.7], [0.3, 0.55, -0.6],
  [0.93, 0.55, -0.66], [0.3, 0.25, -0.76], [0.22, -0.1, -0.48], [0, 0, 0], [0, -0.1, -0.4], [0, 0, 0],
];

/* ---------- small building blocks ---------- */

function Box({
  size,
  position = [0, 0, 0],
  rotation,
  color = "#222636",
  metalness = 0.4,
  roughness = 0.5,
  opacity = 1,
  emissive = "#000000",
  emissiveIntensity = 0,
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        metalness={metalness}
        roughness={roughness}
        transparent={opacity < 1}
        opacity={opacity}
        depthWrite={opacity >= 1}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
      />
    </mesh>
  );
}

function EdgeBox({ w, h, d, position = [0, 0, 0], color = "#9fb0ee", opacity = 0.9 }) {
  const geometry = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)),
    [w, h, d]
  );
  return (
    <lineSegments geometry={geometry} position={position} raycast={() => null}>
      <lineBasicMaterial color={color} transparent opacity={opacity} />
    </lineSegments>
  );
}

// Emissive material that cycles through RGB colours once the PC is powered on.
function RgbMaterial({ powerRef, offset = 0, intensity = 1.8 }) {
  const ref = useRef(null);
  useFrame((state) => {
    const m = ref.current;
    if (!m) return;
    const hue = (state.clock.elapsedTime * 0.12 + offset) % 1;
    m.emissive.setHSL(hue, 1, 0.5);
    m.emissiveIntensity = powerRef.current * intensity;
    m.color.setHSL(hue, 0.5, 0.1 + 0.25 * powerRef.current);
  });
  return <meshStandardMaterial ref={ref} color="#1a1d29" roughness={0.4} metalness={0.3} />;
}

// A fan that faces +z in its own frame. Rotate the wrapper to aim it.
function Fan({ position = [0, 0, 0], rotation = [0, 0, 0], radius = 0.17, powerRef, offset = 0, frame = true, blades = 7 }) {
  const rotor = useRef(null);
  useFrame((_, delta) => {
    if (rotor.current) rotor.current.rotation.z -= Math.min(delta, 0.05) * powerRef.current * 16;
  });
  const size = radius * 2 + 0.06;

  return (
    <group position={position} rotation={rotation}>
      {frame && (
        <mesh>
          <boxGeometry args={[size, size, 0.06]} />
          <meshStandardMaterial color="#10131c" metalness={0.5} roughness={0.5} transparent opacity={0.85} />
        </mesh>
      )}
      <mesh position={[0, 0, 0.035]}>
        <torusGeometry args={[radius * 0.95, 0.012, 8, 40]} />
        <RgbMaterial powerRef={powerRef} offset={offset} />
      </mesh>
      <group ref={rotor} position={[0, 0, 0.012]}>
        {Array.from({ length: blades }).map((_, i) => (
          <group key={i} rotation={[0, 0, (i / blades) * Math.PI * 2]}>
            <mesh position={[0, radius * 0.55, 0]} rotation={[0.45, 0, 0]}>
              <boxGeometry args={[radius * 0.42, radius * 0.7, 0.012]} />
              <meshStandardMaterial color="#cfd6ee" metalness={0.2} roughness={0.35} transparent opacity={0.8} />
            </mesh>
          </group>
        ))}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[radius * 0.22, radius * 0.22, 0.05, 20]} />
          <meshStandardMaterial color="#0b0d14" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

// Wraps a part: hidden until its step starts, then flies in and settles.
// Once installed it reacts to the pointer: hover = pop out, click = inspect.
function Part({ index, position = [0, 0, 0], from = [0, 1.2, 2.6], interactive = true, children }) {
  const { busRef, onHover, onSelect } = useContext(SceneContext);
  const ref = useRef(null);
  const pop = useRef(0);

  useFrame((_, delta) => {
    const g = ref.current;
    if (!g) return;
    const bus = busRef.current;
    const k = clamp01(bus.progress - index);
    const e = easeOut(k);
    pop.current += ((bus.hover === index ? 1 : 0) - pop.current) * Math.min(1, delta * 10);
    g.visible = k > 0.001;
    g.position.set(
      position[0] + from[0] * (1 - e),
      position[1] + from[1] * (1 - e),
      position[2] + from[2] * (1 - e)
    );
    g.scale.setScalar((0.9 + 0.1 * e) * (1 + 0.045 * pop.current));
  });

  const installed = () => busRef.current.progress - index > 0.6;

  const events = interactive
    ? {
        onPointerOver: (event) => {
          if (!installed()) return;
          event.stopPropagation();
          busRef.current.hover = index;
          document.body.style.cursor = "pointer";
          onHover(index);
        },
        onPointerOut: () => {
          if (busRef.current.hover === index) {
            busRef.current.hover = null;
            onHover(null);
          }
          document.body.style.cursor = "";
        },
        onClick: (event) => {
          if (!installed()) return;
          event.stopPropagation();
          busRef.current.focus = index;
          busRef.current.zoom = 5.2;
          onSelect(index);
        },
      }
    : {};

  return (
    <group ref={ref} position={position} visible={false} {...events}>
      {children}
    </group>
  );
}

/* ---------- the parts ---------- */

function CaseShell() {
  const standoffs = [
    [-0.65, 1.1], [1.05, 1.1], [-0.65, -0.7], [1.05, -0.7], [0.2, 0.2], [0.2, -0.7],
  ];
  return (
    <>
      <EdgeBox w={3.04} h={3.44} d={1.84} color="#b7c3f5" opacity={0.95} />
      {/* back plate (opaque so the parts stand out) */}
      <Box size={[3, 3.4, 0.05]} position={[0, 0, -0.9]} color="#0f121b" metalness={0.6} roughness={0.55} />
      <Box size={[0.62, 0.62, 0.056]} position={[0.3, 0.55, -0.9]} color="#06070b" />
      {/* floor, roof, front and rear panels — see-through */}
      <Box size={[3, 0.05, 1.8]} position={[0, -1.7, 0]} color="#161a27" opacity={0.7} />
      <Box size={[3, 0.04, 1.8]} position={[0, 1.7, 0]} color="#161a27" opacity={0.2} />
      <Box size={[0.05, 3.4, 1.8]} position={[-1.5, 0, 0]} color="#1b2030" opacity={0.22} />
      <Box size={[0.05, 3.4, 1.8]} position={[1.5, 0, 0]} color="#1b2030" opacity={0.22} />
      {/* feet */}
      {[[-1.2, -0.6], [1.2, -0.6], [-1.2, 0.6], [1.2, 0.6]].map(([x, z], i) => (
        <Box key={i} size={[0.22, 0.1, 0.22]} position={[x, -1.75, z]} color="#e11d48" metalness={0.3} />
      ))}
      {/* motherboard standoffs */}
      {standoffs.map(([x, y], i) => (
        <mesh key={i} position={[x, y, -0.85]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.07, 12]} />
          <meshStandardMaterial color="#c9a45a" metalness={0.9} roughness={0.3} />
        </mesh>
      ))}
    </>
  );
}

function PowerSupply() {
  return (
    <>
      <Box size={[1.5, 0.55, 1.0]} color="#1a1d29" metalness={0.6} roughness={0.45} />
      <Box size={[1.0, 0.3, 0.01]} position={[0.2, 0, 0.505]} color="#0e1018" />
      <Box size={[1.0, 0.04, 0.012]} position={[0.2, 0.1, 0.51]} color="#e11d48" emissive="#e11d48" emissiveIntensity={0.4} />
      <Box size={[0.18, 0.1, 0.012]} position={[0.5, -0.06, 0.51]} color="#d8b45a" metalness={0.8} />
      <mesh position={[-0.35, 0, 0.51]}>
        <torusGeometry args={[0.2, 0.012, 8, 40]} />
        <meshStandardMaterial color="#3a4157" metalness={0.7} roughness={0.4} />
      </mesh>
      {[-0.18, -0.06, 0.06, 0.18].map((y, i) => (
        <Box key={i} size={[0.012, 0.08, 0.14]} position={[-0.756, y, 0.2]} color="#0b0d14" />
      ))}
    </>
  );
}

function Motherboard() {
  return (
    <>
      <Box size={[1.9, 2.0, 0.06]} color="#12403a" metalness={0.3} roughness={0.55} />
      {/* CPU socket */}
      <Box size={[0.56, 0.56, 0.04]} position={[0.1, 0.35, 0.05]} color="#c9ced8" metalness={0.8} roughness={0.35} />
      <Box size={[0.44, 0.44, 0.01]} position={[0.1, 0.35, 0.075]} color="#d9b45a" metalness={0.9} roughness={0.3} />
      {/* VRM heatsinks */}
      <Box size={[1.0, 0.2, 0.14]} position={[0.05, 0.88, 0.1]} color="#2b3140" />
      <Box size={[0.9, 0.02, 0.01]} position={[0.05, 0.88, 0.175]} color="#e11d48" emissive="#e11d48" emissiveIntensity={0.5} />
      <Box size={[0.26, 1.0, 0.14]} position={[-0.8, 0.4, 0.1]} color="#262c3b" />
      {/* RAM slots */}
      {[0.55, 0.64, 0.73, 0.82].map((x, i) => (
        <Box key={i} size={[0.045, 1.0, 0.05]} position={[x, 0.35, 0.055]} color="#222736" />
      ))}
      {/* PCIe slots */}
      <Box size={[0.5, 0.06, 0.05]} position={[-0.6, -0.3, 0.055]} color="#222736" />
      <Box size={[0.5, 0.06, 0.05]} position={[-0.6, -0.75, 0.055]} color="#222736" />
      {/* M.2 slot, chipset, connectors */}
      <Box size={[0.12, 0.1, 0.03]} position={[-0.25, 0.05, 0.045]} color="#222736" />
      <Box size={[0.3, 0.3, 0.08]} position={[0.65, -0.88, 0.07]} color="#2b3140" />
      <Box size={[0.3, 0.12, 0.12]} position={[-0.58, 0.93, 0.09]} color="#e7eaf5" />
      <Box size={[0.08, 0.5, 0.1]} position={[0.9, 0.0, 0.08]} color="#e7eaf5" />
    </>
  );
}

function Processor() {
  return (
    <>
      {/* substrate */}
      <Box size={[0.44, 0.44, 0.012]} position={[0, 0, -0.02]} color="#1a5a40" metalness={0.3} />
      {/* heat spreader — translucent so the layers show */}
      <Box size={[0.4, 0.4, 0.03]} color="#c7ccd8" metalness={0.9} roughness={0.25} opacity={0.72} />
      <EdgeBox w={0.4} h={0.4} d={0.03} color="#64fff0" opacity={0.9} />
      <Box size={[0.22, 0.025, 0.004]} position={[0, 0.05, 0.018]} color="#7e879b" />
      <Box size={[0.16, 0.025, 0.004]} position={[0, 0.0, 0.018]} color="#7e879b" />
      <Box size={[0.05, 0.05, 0.005]} position={[-0.16, -0.16, 0.018]} color="#38f5d0" emissive="#38f5d0" emissiveIntensity={1} />
    </>
  );
}

function CpuCooler({ powerRef }) {
  const fins = [0, 1, 2, 3, 4, 5];
  return (
    <>
      <Box size={[0.42, 0.42, 0.04]} position={[0, 0, 0.02]} color="#b6bcc9" metalness={0.85} roughness={0.3} />
      {[[-0.1, -0.1], [0.1, -0.1], [-0.1, 0.1], [0.1, 0.1]].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.32, 12]} />
          <meshStandardMaterial color="#c58a4a" metalness={0.9} roughness={0.3} />
        </mesh>
      ))}
      {/* translucent fin stack */}
      {fins.map((i) => (
        <Box key={i} size={[0.52, 0.56, 0.012]} position={[0, 0, 0.1 + i * 0.05]} color="#9aa6c4" metalness={0.7} roughness={0.35} opacity={0.15} />
      ))}
      <EdgeBox w={0.52} h={0.56} d={0.27} position={[0, 0, 0.225]} color="#9fb0ee" opacity={0.55} />
      <Fan position={[0, 0, 0.42]} radius={0.22} powerRef={powerRef} offset={0.1} />
    </>
  );
}

function Memory({ powerRef }) {
  const stick = (x, offset) => (
    <group position={[x, 0, 0]}>
      <Box size={[0.012, 0.94, 0.18]} color="#1b6d4a" metalness={0.3} />
      <Box size={[0.012, 0.9, 0.15]} position={[-0.014, 0, 0.015]} color="#2a2f40" metalness={0.7} roughness={0.35} />
      <Box size={[0.012, 0.9, 0.15]} position={[0.014, 0, 0.015]} color="#2a2f40" metalness={0.7} roughness={0.35} />
      <mesh position={[0, 0, 0.095]}>
        <boxGeometry args={[0.045, 0.9, 0.02]} />
        <RgbMaterial powerRef={powerRef} offset={offset} />
      </mesh>
    </group>
  );
  return (
    <>
      {stick(-0.09, 0.0)}
      {stick(0.09, 0.2)}
    </>
  );
}

function NvmeSsd() {
  return (
    <>
      <Box size={[0.7, 0.1, 0.015]} color="#12354f" metalness={0.3} />
      {[-0.22, 0.0, 0.2].map((x, i) => (
        <Box key={i} size={[0.12, 0.07, 0.012]} position={[x, 0, 0.012]} color="#0b0d14" />
      ))}
      <Box size={[0.5, 0.09, 0.012]} position={[0.08, 0, 0.03]} color="#b0b7c8" metalness={0.8} roughness={0.3} opacity={0.6} />
      <Box size={[0.16, 0.03, 0.004]} position={[0.1, 0, 0.038]} color="#e11d48" emissive="#e11d48" emissiveIntensity={0.5} />
    </>
  );
}

function GraphicsCard({ powerRef }) {
  return (
    <>
      <Box size={[1.8, 0.42, 0.5]} color="#161a26" metalness={0.65} roughness={0.4} />
      <Box size={[1.78, 0.4, 0.02]} position={[0, 0, 0.255]} color="#10131c" metalness={0.5} />
      {[-0.55, 0, 0.55].map((x, i) => (
        <Fan key={i} position={[x, 0, 0.268]} radius={0.165} powerRef={powerRef} offset={0.3 + i * 0.1} frame={false} blades={9} />
      ))}
      <mesh position={[0, 0.215, 0]}>
        <boxGeometry args={[1.7, 0.02, 0.4]} />
        <RgbMaterial powerRef={powerRef} offset={0.5} />
      </mesh>
      {/* gold fingers into the PCIe slot, rear bracket */}
      <Box size={[0.45, 0.03, 0.06]} position={[-0.62, 0, -0.28]} color="#d8b45a" metalness={0.9} roughness={0.3} />
      <Box size={[0.03, 0.42, 0.5]} position={[-0.92, 0, 0]} color="#b9bfcc" metalness={0.8} roughness={0.35} />
    </>
  );
}

function CaseFans({ powerRef }) {
  const aim = [0, Math.PI / 2, 0];
  return (
    <>
      {[-0.95, 0, 0.95].map((y, i) => (
        <Fan key={i} position={[-1.38, y, 0]} rotation={aim} radius={0.42} powerRef={powerRef} offset={i * 0.15} />
      ))}
      <Fan position={[1.38, 1.05, -0.05]} rotation={aim} radius={0.3} powerRef={powerRef} offset={0.6} />
    </>
  );
}

const CABLES = [
  { color: "#e5e9f7", radius: 0.045, points: [[-0.4, -1.15, -0.3], [-1.05, -0.9, -0.4], [-1.1, 0.2, -0.55], [-1.0, 1.1, -0.65], [-0.62, 1.14, -0.7]] },
  { color: "#e11d48", radius: 0.06, points: [[0.5, -1.15, -0.4], [1.32, -0.95, -0.45], [1.38, 0.2, -0.6], [1.12, 0.38, -0.68]] },
  { color: "#7c8cff", radius: 0.045, points: [[0.75, -1.15, -0.2], [1.22, -0.8, -0.25], [1.2, -0.1, -0.3], [1.0, 0.14, -0.35]] },
];

// Draws itself from the PSU to the connector.
function Cable({ points, color, radius, index, order }) {
  const { busRef } = useContext(SceneContext);
  const meshRef = useRef(null);
  const geometry = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))),
        72,
        radius,
        8,
        false
      ),
    [points, radius]
  );

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const k = clamp01((busRef.current.progress - index - order * 0.18) / 0.64);
    mesh.visible = k > 0.001;
    const total = geometry.index ? geometry.index.count : 0;
    geometry.setDrawRange(0, Math.floor((total * easeOut(k)) / 3) * 3);
  });

  return (
    <mesh ref={meshRef} geometry={geometry} visible={false}>
      <meshStandardMaterial color={color} roughness={0.55} metalness={0.1} />
    </mesh>
  );
}

function GlassPanel() {
  return (
    <>
      <mesh position={[0, 0, 0.9]} renderOrder={5} raycast={() => null}>
        <boxGeometry args={[3, 3.4, 0.03]} />
        <meshPhysicalMaterial color="#bcd0ff" transparent opacity={0.1} roughness={0.05} metalness={0} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <EdgeBox w={3} h={3.4} d={0.03} position={[0, 0, 0.9]} color="#e3e9ff" opacity={0.9} />
      <mesh position={[-0.55, 0.1, 0.92]} rotation={[0, 0, 0.45]} renderOrder={6} raycast={() => null}>
        <planeGeometry args={[0.22, 2.6]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.06} depthWrite={false} />
      </mesh>
      <mesh position={[0.05, 0.1, 0.92]} rotation={[0, 0, 0.45]} renderOrder={6} raycast={() => null}>
        <planeGeometry args={[0.07, 2.6]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.07} depthWrite={false} />
      </mesh>
    </>
  );
}

/* ---------- scene plumbing ---------- */

function Driver({ powerRef, playing, speed, onDone }) {
  const { busRef } = useContext(SceneContext);
  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const bus = busRef.current;
    const t = bus.target;

    if (t !== null) {
      const diff = t - bus.progress;
      const move = delta * 3.2;
      if (Math.abs(diff) <= move) {
        bus.progress = t;
        bus.target = null;
      } else {
        bus.progress += Math.sign(diff) * move;
      }
    } else if (playing) {
      bus.progress = Math.min(STEP_COUNT, bus.progress + (delta * speed) / STEP_SECONDS);
      if (bus.progress >= STEP_COUNT) onDone();
    }

    powerRef.current = clamp01((bus.progress - (STEP_COUNT - 0.6)) / 0.6);
  });
  return null;
}

// Camera director: follows the part being built, dollies in after a click, glides to view presets.
function Rig({ controlsRef, follow }) {
  const { busRef } = useContext(SceneContext);
  const wanted = useMemo(() => new THREE.Vector3(), []);
  const offset = useMemo(() => new THREE.Vector3(), []);
  const preset = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, rawDelta) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const bus = busRef.current;
    const blend = 1 - Math.pow(0.02, Math.min(rawDelta, 0.05));

    let index = bus.focus;
    let weight = 1;
    if (index === null && follow) {
      index = Math.min(STEP_COUNT - 1, Math.floor(bus.progress + 0.0001));
      weight = 0.65;
    }
    if (index === null) wanted.set(0, 0, 0);
    else wanted.set(FOCUS[index][0] * weight, FOCUS[index][1] * weight, FOCUS[index][2] * weight);
    controls.target.lerp(wanted, blend);

    if (bus.zoom !== null) {
      offset.copy(state.camera.position).sub(controls.target);
      const next = offset.length() + (bus.zoom - offset.length()) * blend;
      state.camera.position.copy(controls.target).add(offset.setLength(next));
      if (Math.abs(next - bus.zoom) < 0.05) bus.zoom = null;
    }

    if (bus.view) {
      preset.set(bus.view[0], bus.view[1], bus.view[2]);
      state.camera.position.lerp(preset, blend);
      if (state.camera.position.distanceTo(preset) < 0.05) bus.view = null;
    }
  });
  return null;
}

function PowerGlow({ powerRef }) {
  const ref = useRef(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.intensity = powerRef.current * 4;
    ref.current.color.setHSL((state.clock.elapsedTime * 0.12) % 1, 1, 0.55);
  });
  return <pointLight ref={ref} position={[0, 0.2, 0.3]} intensity={0} distance={5} />;
}

function Sway({ children }) {
  const ref = useRef(null);
  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.35) * 0.1;
  });
  return <group ref={ref}>{children}</group>;
}

function Floor() {
  return (
    <group position={[0, -1.86, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[4.6, 72]} />
        <meshStandardMaterial color="#0f1220" metalness={0.7} roughness={0.45} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <ringGeometry args={[2.6, 2.65, 96]} />
        <meshBasicMaterial color="#e11d48" transparent opacity={0.85} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <ringGeometry args={[3.6, 3.62, 96]} />
        <meshBasicMaterial color="#8b5cf6" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

function Scene({ playing, speed, follow, onDone }) {
  const powerRef = useRef(0);
  const controlsRef = useRef(null);

  return (
    <>
      <color attach="background" args={["#0a0c13"]} />
      <fog attach="fog" args={["#0a0c13", 14, 30]} />

      <ambientLight intensity={0.8} />
      <directionalLight position={[4, 6, 6]} intensity={1.7} />
      <directionalLight position={[-5, 2, -4]} intensity={0.7} color="#8aa2ff" />
      <pointLight position={[0, -1.5, 3]} intensity={0.8} color="#ff6b87" />
      <PowerGlow powerRef={powerRef} />

      <Driver powerRef={powerRef} playing={playing} speed={speed} onDone={onDone} />
      <Rig controlsRef={controlsRef} follow={follow} />

      <Floor />

      <Sway>
        {/* faint outline of the finished case so the empty stage is not blank */}
        <EdgeBox w={3} h={3.4} d={1.8} color="#4b5578" opacity={0.3} />

        <Part index={0} from={[0, 2.2, 0]}>
          <CaseShell />
        </Part>

        <Part index={1} position={[0.1, -1.4, -0.3]} from={[0, 0.8, 2.6]}>
          <PowerSupply />
        </Part>

        <Part index={2} position={[0.2, 0.2, -0.81]} from={[0, 0.6, 3.2]}>
          <Motherboard />
        </Part>

        <Part index={3} position={[0.3, 0.55, -0.715]} from={[0, 0.9, 1.8]}>
          <Processor />
        </Part>

        <Part index={4} position={[0.3, 0.55, -0.69]} from={[0, 0.6, 2.4]}>
          <CpuCooler powerRef={powerRef} />
        </Part>

        <Part index={5} position={[0.93, 0.55, -0.66]} from={[0, 1.4, 2.0]}>
          <Memory powerRef={powerRef} />
        </Part>

        <Part index={6} position={[0.3, 0.25, -0.76]} from={[0, 0.5, 2.0]}>
          <NvmeSsd />
        </Part>

        <Part index={7} position={[0.22, -0.1, -0.48]} from={[0, 1.0, 2.6]}>
          <GraphicsCard powerRef={powerRef} />
        </Part>

        <Part index={8} from={[0, 0, 2.6]}>
          <CaseFans powerRef={powerRef} />
        </Part>

        {CABLES.map((cable, i) => (
          <Cable key={i} {...cable} index={9} order={i} />
        ))}

        <Part index={10} from={[0, 0, 3.4]} interactive={false}>
          <GlassPanel />
        </Part>
      </Sway>

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={3.2}
        maxDistance={13}
        minPolarAngle={0.45}
        maxPolarAngle={Math.PI / 2 - 0.03}
        minAzimuthAngle={-1.3}
        maxAzimuthAngle={1.3}
      />
    </>
  );
}

export default function PCScene({ busRef, playing, speed, follow, onDone, onHover, onSelect }) {
  const context = useMemo(() => ({ busRef, onHover, onSelect }), [busRef, onHover, onSelect]);

  return (
    <Canvas
      camera={{ position: [4.2, 1.8, 7.6], fov: 38, near: 0.1, far: 60 }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
    >
      <SceneContext.Provider value={context}>
        <Scene playing={playing} speed={speed} follow={follow} onDone={onDone} />
      </SceneContext.Provider>
    </Canvas>
  );
}
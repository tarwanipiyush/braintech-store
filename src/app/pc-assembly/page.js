"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { STEPS, STEP_COUNT } from "./steps";

// Three.js only runs in the browser.
const PCScene = dynamic(() => import("./PCScene"), {
  ssr: false,
  loading: () => <div className="pca-loading">Loading 3D scene…</div>,
});

const VIEWS = {
  Front: [0, 0.8, 9.4],
  Left: [-6.6, 1.3, 4.6],
  Right: [6.6, 1.3, 4.6],
  Top: [0.4, 8.2, 4.8],
};
const RESET_VIEW = [4.2, 1.8, 7.6];

export default function PCAssemblyPage() {
  // Shared with the 3D scene (see PCScene.js). Mutated directly, so no re-render per frame.
  const busRef = useRef({ progress: 0, target: null, hover: null, focus: null, zoom: null, view: null });
  const stageRef = useRef(null);
  const fullRef = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [follow, setFollow] = useState(true);
  const [progress, setProgress] = useState(0);
  const [hovered, setHovered] = useState(null);
  const [pinned, setPinned] = useState(null); // a part the visitor clicked
  const [isFull, setIsFull] = useState(false);

  // Mirror the scene progress into state so the slider and labels stay in sync.
  useEffect(() => {
    const id = window.setInterval(() => {
      const p = busRef.current.progress;
      setProgress((current) => (Math.abs(current - p) < 0.005 ? current : p));
    }, 80);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onChange = () => setIsFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const finished = progress >= STEP_COUNT - 0.001;
  const started = progress > 0.001;
  const stepIndex = Math.min(STEP_COUNT - 1, Math.floor(progress + 0.0001));
  const shownIndex = pinned ?? stepIndex;
  const step = STEPS[shownIndex];

  /* ---------- actions (only touch refs + state setters, so they are stable) ---------- */

  const release = useCallback(() => {
    busRef.current.focus = null;
    busRef.current.zoom = null;
    setPinned(null);
  }, []);

  const scrollToStage = useCallback(() => {
    stageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const startAnimation = useCallback(() => {
    const bus = busRef.current;
    if (bus.progress >= STEP_COUNT - 0.001) bus.progress = 0;
    bus.target = null;
    release();
    setPlaying(true);
    scrollToStage();
  }, [release, scrollToStage]);

  const restart = useCallback(() => {
    busRef.current.progress = 0;
    busRef.current.target = null;
    release();
    setPlaying(true);
  }, [release]);

  const togglePlay = useCallback(() => {
    if (busRef.current.progress >= STEP_COUNT - 0.001) {
      restart();
      return;
    }
    busRef.current.target = null;
    release();
    setPlaying((value) => !value);
  }, [release, restart]);

  const nextStep = useCallback(() => {
    busRef.current.target = Math.min(STEP_COUNT, Math.floor(busRef.current.progress + 0.001) + 1);
    release();
    setPlaying(false);
  }, [release]);

  const prevStep = useCallback(() => {
    busRef.current.target = Math.max(0, Math.ceil(busRef.current.progress - 0.001) - 1);
    release();
    setPlaying(false);
  }, [release]);

  function playFromStep(index) {
    busRef.current.target = index;
    release();
    setPlaying(true);
    scrollToStage();
  }

  function scrub(event) {
    busRef.current.target = null;
    busRef.current.progress = Number(event.target.value);
    release();
    setPlaying(false);
    setProgress(busRef.current.progress);
  }

  function setView(name) {
    release();
    busRef.current.view = name === "Reset" ? RESET_VIEW : VIEWS[name];
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else fullRef.current?.requestFullscreen?.();
  }

  const handleDone = useCallback(() => setPlaying(false), []);

  // Keyboard: Space = play/pause, ← / → = previous / next step, R = restart
  useEffect(() => {
    function onKey(event) {
      const tag = event.target?.tagName;
      if (["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(tag)) return;
      if (event.code === "Space") {
        event.preventDefault();
        togglePlay();
      } else if (event.key === "ArrowRight") nextStep();
      else if (event.key === "ArrowLeft") prevStep();
      else if (event.key.toLowerCase() === "r") restart();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, nextStep, prevStep, restart]);

  const shopHref = `/shop?category=${encodeURIComponent(step.shopCategory)}`;
  const percent = Math.round((Math.min(progress, STEP_COUNT) / STEP_COUNT) * 100);

  return (
    <div className="pca-page">
      {/* ---------- large banner ---------- */}
      <section className="pca-banner">
        <span className="pca-orb pca-orb-a" />
        <span className="pca-orb pca-orb-b" />

        <div className="pca-banner-copy">
          <span className="pca-kicker">BRAINTECH BUILD LAB</span>
          <h1>
            Watch a gaming PC <em>being built.</em>
          </h1>
          <p>
            See every part go into a see-through cabinet — power supply, motherboard, processor, cooler, memory, SSD
            and graphics card — then watch it power on. Hover parts, click to inspect, drag to look inside.
          </p>
          <button type="button" className="pca-big-button" onClick={startAnimation}>
            <span className="pca-big-icon">▶</span>
            {finished ? "Watch the animation again" : started ? "Continue the animation" : "Watch the build animation"}
          </button>
          <ul className="pca-facts">
            <li>11 steps</li>
            <li>About 30 seconds</li>
            <li>Transparent cabinet</li>
            <li>Click any part</li>
          </ul>
        </div>

        <ol className="pca-float-steps" aria-hidden="true">
          {["Cabinet", "PSU", "Motherboard", "CPU", "Cooler", "RAM", "SSD", "GPU"].map((name, i) => (
            <li key={name} style={{ animationDelay: `${i * 0.35}s` }}>
              <span>{i + 1}</span>
              {name}
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- big interactive stage ---------- */}
      <section className="pca-stage-wrap" ref={stageRef}>
        <div className="pca-stage" ref={fullRef}>
          <div className="pca-canvas">
            <PCScene
              busRef={busRef}
              playing={playing}
              speed={speed}
              follow={follow}
              onDone={handleDone}
              onHover={setHovered}
              onSelect={setPinned}
            />

            <div className="pca-badge">
              <span>
                Step {stepIndex + 1} of {STEP_COUNT} · {percent}%
              </span>
              <b>{STEPS[stepIndex].short}</b>
            </div>

            <div className="pca-tools">
              {["Front", "Left", "Right", "Top"].map((name) => (
                <button key={name} type="button" onClick={() => setView(name)}>
                  {name}
                </button>
              ))}
              <button type="button" onClick={() => setView("Reset")}>
                ⟲ Reset
              </button>
              <button type="button" className={follow ? "on" : ""} onClick={() => setFollow((v) => !v)}>
                🎥 Follow {follow ? "on" : "off"}
              </button>
              <button type="button" onClick={toggleFullscreen}>
                {isFull ? "✕ Exit full screen" : "⛶ Full screen"}
              </button>
            </div>

            {hovered !== null ? (
              <div className="pca-hover-chip">
                <b>{STEPS[hovered].short}</b>
                <span>Click to inspect</span>
              </div>
            ) : (
              started && <div className="pca-hint">Hover a part · click to inspect · drag to rotate · scroll to zoom</div>
            )}

            {!started && !playing && (
              <div className="pca-overlay">
                <button type="button" className="pca-overlay-button" onClick={startAnimation}>
                  <span className="pca-big-icon">▶</span>
                  Start build animation
                </button>
                <p>Space = play / pause · ← → = steps</p>
              </div>
            )}

            {finished && <div className="pca-done">✓ Build complete — your gaming PC is powered on</div>}
          </div>

          <div className="pca-controls">
            <button type="button" className="pca-ctrl" onClick={prevStep} aria-label="Previous step">
              ⏮
            </button>
            <button type="button" className="pca-play" onClick={togglePlay}>
              {finished ? "↻ Replay" : playing ? "❚❚ Pause" : "▶ Play"}
            </button>
            <button type="button" className="pca-ctrl" onClick={nextStep} aria-label="Next step">
              ⏭
            </button>

            <input
              className="pca-slider"
              type="range"
              min="0"
              max={STEP_COUNT}
              step="0.01"
              value={progress}
              onChange={scrub}
              aria-label="Build progress"
            />

            <div className="pca-speed">
              {[1, 1.5, 2].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={speed === value ? "on" : ""}
                  onClick={() => setSpeed(value)}
                >
                  {value}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- info + steps ---------- */}
      <section className="pca-lower">
        <div className="pca-info" key={shownIndex}>
          <span className="pca-kicker">
            {pinned !== null ? "INSPECTING" : "STEP"} {shownIndex + 1} · {step.short.toUpperCase()}
          </span>
          <h2>{step.title}</h2>
          <p>{step.text}</p>
          <div className="pca-info-actions">
            <Link href={shopHref} className="pca-shop-link">
              Shop {step.shopCategory} ↗
            </Link>
            {pinned !== null && (
              <button type="button" className="pca-ghost" onClick={release}>
                Back to the build
              </button>
            )}
          </div>
        </div>

        <ol className="pca-steps">
          {STEPS.map((item, index) => {
            const done = progress >= index + 1 - 0.001;
            const active = index === stepIndex && started && !finished;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={`pca-step ${active ? "active" : ""} ${done ? "done" : ""}`}
                  onClick={() => playFromStep(index)}
                >
                  <span className="pca-step-num">{done ? "✓" : index + 1}</span>
                  <span>{item.short}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
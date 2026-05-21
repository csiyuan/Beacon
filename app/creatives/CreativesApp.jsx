'use client';

// ============================================================================
// Beacon - Empowering creatives. Elevating brands.
// A cinematic 3D landing built with React Three Fiber.
//
// Hybrid approach:
//  - Scene 1 uses the reference image as a parallax matte; 3D beams, particles,
//    and HTML title materialize ON TOP. This preserves the painted atmosphere
//    we couldn't beat procedurally in this scope.
//  - During the fork (Scene 2) the matte stays; we draw glowing river paths on
//    the valley floor in 3D so the camera can engage with them.
//  - On selection, the matte dims while the camera flies down the chosen path
//    into a fully procedural Scene 3 (cloudscape for Brand, intimate textured
//    field for Creative). Both destinations share the gold-and-mist palette.
// ============================================================================

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { FORM_ENDPOINT, submitForm } from '@/lib/forms';
import ThanksPopup from '@/components/ThanksPopup';
import { useNavWash } from '@/components/transitions/NavWash';
import { usePathwayWash } from '@/components/transitions/PathwayWash';
import ArrivalWash from '@/components/transitions/ArrivalWash';

// ─── Constants ──────────────────────────────────────────────────────────────
const GOLD = new THREE.Color('#f0c673');
const GOLD_BRIGHT = new THREE.Color('#fff0c8');
const EMBER = new THREE.Color('#ff9a3c');

// Position the 3D scene to roughly match the painted matte. Beams strike the
// valley floor at y=0; camera starts looking slightly down toward it.
const VALLEY_Y = 0;

// ─── Shaders ────────────────────────────────────────────────────────────────
const beamVS = /* glsl */`
  varying vec2 vUv;
  void main(){
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const beamFS = /* glsl */`
  varying vec2 vUv;
  uniform float uTime;
  uniform float uOpacity;
  uniform float uReveal;     // 0..1, controls vertical wipe from top
  uniform vec3  uColorHot;
  uniform vec3  uColorWarm;
  void main(){
    // y goes 0 (bottom) → 1 (top of beam, near clouds)
    float y = vUv.y;
    // horizontal soft edges
    float h = 1.0 - smoothstep(0.0, 0.55, abs(vUv.x - 0.5) * 2.0);
    h = pow(h, 2.2);
    // gentle top fade (beam emerges from clouds)
    float top = 1.0 - smoothstep(0.62, 1.0, y) * 0.55;
    // gentle bottom fade (beam dissolves into mist)
    float bot = smoothstep(-0.02, 0.22, y);
    float core = top * bot;
    // shimmer
    float shimmer = 0.88 + 0.12 * sin(uTime * 2.2 + y * 24.0);
    // reveal: tip falls from top (y=1) down to strike (y=0). Visible where y >= 1 - reveal.
    float wipe = smoothstep(1.0 - uReveal - 0.05, 1.0 - uReveal, y);
    // Compose
    vec3 col = mix(uColorWarm, uColorHot, core);
    float a = h * core * shimmer * uOpacity * wipe;
    gl_FragColor = vec4(col, a);
  }
`;

const riverVS = /* glsl */`
  varying vec2 vUv;
  void main(){
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const riverFS = /* glsl */`
  varying vec2 vUv;
  uniform float uTime;
  uniform float uReveal;   // 0..1
  uniform float uIntensity; // dim/bright
  uniform vec3  uColor;
  void main(){
    // u runs along path length (0=far, 1=near), v across width
    float across = 1.0 - smoothstep(0.0, 0.5, abs(vUv.y - 0.5) * 2.0);
    across = pow(across, 2.4);
    // reveal grows from far (vUv.x=0) → near (vUv.x=1)
    float wipe = smoothstep(1.0 - uReveal - 0.06, 1.0 - uReveal + 0.02, 1.0 - vUv.x);
    // brighter near horizon-side and near the marker
    float lengthwise = mix(0.55, 1.0, smoothstep(0.0, 0.3, vUv.x)) * mix(1.0, 1.25, smoothstep(0.85, 1.0, vUv.x));
    // flow shimmer
    float flow = 0.7 + 0.3 * sin((vUv.x * 18.0) - uTime * 1.6);
    float core = across * lengthwise * flow * wipe * uIntensity;
    // soft mist underneath
    float halo = exp(-pow((vUv.y - 0.5) * 4.0, 2.0)) * wipe * 0.45 * uIntensity;
    vec3 col = mix(uColor * 0.65, vec3(1.0, 0.95, 0.78), core);
    gl_FragColor = vec4(col, core + halo);
  }
`;

const cloudFS = /* glsl */`
  varying vec2 vUv;
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3  uTint;
  // cheap procedural cumulus
  float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    float a = hash(i), b = hash(i+vec2(1,0)), c = hash(i+vec2(0,1)), d = hash(i+vec2(1,1));
    vec2 u = f*f*(3.0-2.0*f);
    return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
  }
  float fbm(vec2 p){
    float v = 0.0; float a = 0.5;
    for(int i=0;i<5;i++){ v += a*noise(p); p *= 2.05; a *= 0.5; }
    return v;
  }
  void main(){
    vec2 p = vUv * 3.0 + vec2(uTime*0.02, 0.0);
    float n = fbm(p);
    // soft radial mask so cards don't look like rectangles
    float r = length(vUv - 0.5) * 2.0;
    float mask = 1.0 - smoothstep(0.55, 1.0, r);
    float a = smoothstep(0.35, 0.85, n) * mask * uOpacity;
    // shading: brighter top, golden underbelly
    float light = mix(0.55, 1.0, smoothstep(0.2, 0.85, n));
    vec3 col = mix(uTint * 0.55, vec3(1.0, 0.92, 0.74), light);
    gl_FragColor = vec4(col, a);
  }
`;

const streamVS = /* glsl */`
  varying vec2 vUv;
  void main(){
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
// Wiggly waveform shader - keeps the sin-wave streak technique from the
// reference but tunes for distinct, crisp wavy STRANDS rather than a soft glow.
// Several strands per channel at different vertical offsets give parallel wavy
// lines, like an oscilloscope trace painted in gold.
const streamFS = /* glsl */`
  precision highp float;
  varying vec2 vUv;
  uniform vec2  uResolution;
  uniform float uTime;
  uniform float uOpacity;
  uniform float uBias;      // -0.4 .. 0.4 - vertical bias of the strand stack
  uniform float uProgress;  // 0..1 - flight progress drives speed/freq/sharpness

  // One wavy strand. lineSlot = vertical offset of this strand from center.
  // sharpness controls how crisp the line reads (higher = thinner).
  float strand(vec2 p, float lineSlot, float phase, float xScale, float yAmp, float sharpness){
    // shift this strand's center band by lineSlot
    float band = p.y - lineSlot;
    return sharpness / abs(band + sin((p.x + phase) * xScale) * yAmp);
  }

  void main(){
    vec2 fc = vUv * uResolution;
    vec2 p = (fc * 2.0 - uResolution) / min(uResolution.x, uResolution.y);
    p.y += uBias;

    float prog = clamp(uProgress, 0.0, 1.0);
    // Speed/scale ramps - slow → fast across the flight
    float accel  = smoothstep(0.0, 0.35, prog) * (1.0 - smoothstep(0.85, 1.0, prog));
    float speed     = mix(1.6, 8.5, accel);
    float xScale    = mix(1.2, 2.4, accel);
    float yAmp      = mix(0.35, 0.55, accel);
    float sharpness = mix(0.018, 0.028, accel);   // <- LOW number = thin crisp lines

    float phase = uTime * speed;

    // Chromatic offsets (small) so each strand has a faint gold→amber spread
    float d = length(p) * 0.04;
    float rx = p.x * (1.0 + d);
    float gx = p.x;
    float bx = p.x * (1.0 - d);

    // STRAND STACK - multiple parallel wavy strands across the screen.
    // Slight vertical offsets + phase shifts = independent wiggles.
    float r = 0.0, g = 0.0, b = 0.0;

    // Inner cluster (around bias) - the main bright wave strands
    r += strand(vec2(rx, p.y), -0.32, phase * 1.00, xScale * 1.00, yAmp,        sharpness);
    g += strand(vec2(gx, p.y), -0.30, phase * 1.08, xScale * 1.13, yAmp * 0.93, sharpness * 0.92);
    b += strand(vec2(bx, p.y), -0.28, phase * 0.93, xScale * 0.87, yAmp * 1.08, sharpness * 0.65);

    r += strand(vec2(rx, p.y),  0.00, phase * 0.85, xScale * 1.20, yAmp * 1.05, sharpness);
    g += strand(vec2(gx, p.y),  0.04, phase * 1.15, xScale * 0.96, yAmp * 0.97, sharpness * 0.92);
    b += strand(vec2(bx, p.y),  0.02, phase * 0.78, xScale * 1.05, yAmp * 1.12, sharpness * 0.65);

    r += strand(vec2(rx, p.y),  0.32, phase * 1.22, xScale * 0.92, yAmp * 0.88, sharpness);
    g += strand(vec2(gx, p.y),  0.30, phase * 0.94, xScale * 1.18, yAmp * 1.02, sharpness * 0.92);
    b += strand(vec2(bx, p.y),  0.28, phase * 1.05, xScale * 0.98, yAmp * 0.95, sharpness * 0.65);

    // Outer faint strands at the edges for depth
    r += strand(vec2(rx, p.y), -0.62, phase * 0.5, xScale * 0.7, yAmp * 1.4, sharpness * 0.55);
    g += strand(vec2(gx, p.y),  0.62, phase * 0.6, xScale * 0.7, yAmp * 1.4, sharpness * 0.5);

    // Warm gold ramp
    vec3 col = vec3(r * 1.10, g * 0.74, b * 0.18) * 1.5;

    // Edge vignette - keep wavy lines crisper in the center
    float vig = smoothstep(1.6, 0.25, length(p));
    col *= mix(0.45, 1.05, vig);

    // Convergence bloom at (0, -uBias) grows in the second half - destination cue
    vec2 fp = vec2(0.0, -uBias);
    float dist = length(p - fp);
    float arrive = smoothstep(0.4, 1.0, prog);
    float bloom = (0.16 / max(dist, 0.02)) * arrive * 1.4;
    col += vec3(1.0, 0.78, 0.42) * bloom;

    // Snap flash early in flight
    float snap = smoothstep(0.04, 0.16, prog) * (1.0 - smoothstep(0.2, 0.42, prog));
    col += vec3(1.0, 0.95, 0.78) * snap * 0.32;

    gl_FragColor = vec4(col, uOpacity);
  }
`;

function LightStream({ active, bias, progress }){
  const ref = useRef();
  const matRef = useRef();
  const { camera, size } = useThree();
  const op = useRef(0);

  useFrame(({ clock }) => {
    if (!matRef.current || !ref.current) return;
    matRef.current.uniforms.uTime.value = clock.getElapsedTime();
    matRef.current.uniforms.uResolution.value = [size.width, size.height];
    matRef.current.uniforms.uBias.value += (bias - matRef.current.uniforms.uBias.value) * 0.08;
    // Progress is computed externally and ramps 0→1 across the flight; we lerp
    // gently so the shader transitions don't pop on activation.
    matRef.current.uniforms.uProgress.value += (progress - matRef.current.uniforms.uProgress.value) * 0.18;

    // Snap-on, ease-off opacity
    const targetOp = active ? 1 : 0;
    const k = active ? 0.22 : 0.06;
    op.current += (targetOp - op.current) * k;
    matRef.current.uniforms.uOpacity.value = op.current;

    // Park a unit plane just in front of the camera, sized to fill the frustum.
    ref.current.position.copy(camera.position);
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    ref.current.position.addScaledVector(fwd, 0.5);
    ref.current.quaternion.copy(camera.quaternion);
    const fov = camera.fov * Math.PI / 180;
    const h = 2 * 0.5 * Math.tan(fov / 2) * 1.05;
    const w = h * camera.aspect;
    ref.current.scale.set(w, h, 1);
  });

  return (
    <mesh ref={ref} renderOrder={1000}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={matRef}
        transparent
        depthTest={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={streamVS}
        fragmentShader={streamFS}
        uniforms={{
          uTime:       { value: 0 },
          uResolution: { value: [1, 1] },
          uOpacity:    { value: 0 },
          uBias:       { value: 0 },
          uProgress:   { value: 0 },
        }}
      />
    </mesh>
  );
}
// ─── Meteor shower (Scene 2 → Scene 3 transition) ────────────────────────────
//
// Story:
//   1. Convergence (0-32%) - sparks of light stream in from across the sky
//      toward the marker you chose, gathering into a single point.
//   2. Formation flash (28-36%) - they fuse into a luminous orb at the marker.
//   3. Rise & fall (36-96%) - the orb shoots up to the apex, then crashes
//      down to the valley floor as a full meteor with a fiery trail.
//   4. Impact (96-100%) - ground shockwave + screen flash + page shake.

const TRAIL_LEN = 12;

// World-space marker position for the chosen path (start/convergence point).
function getMarkerPos(choice){
  const sx = choice === 'brand' ? -4.8 : 4.8;
  return new THREE.Vector3(sx, 0.3, -12);
}

// Shared trajectory - sampled by both meteor mesh AND camera so they sync.
// Brand and Creative have DIFFERENT trajectories that match their identity:
//   • Brand    → the orb forms low, soars UP and away into the sky (elevation)
//   • Creative → the orb forms high, arcs DOWN into an intimate impact (descent
//     into the work)
function heroMeteorPath(progress, choice){
  const start = getMarkerPos(choice);
  const isBrand = choice === 'brand';

  // Brand: apex is HIGH and FAR (the meteor leaves us, ascends into clouds)
  // Creative: apex is LOW and CLOSE (the meteor stays near, dives toward us)
  const apex  = isBrand
    ? new THREE.Vector3(start.x * 0.2, 13.0, -12)
    : new THREE.Vector3(start.x * 0.3,  6.0,  -6);
  const impact = isBrand
    ? new THREE.Vector3(0, 9.5, -16)    // Brand: "impact" is high in the sky, then we follow it up
    : new THREE.Vector3(0, -0.4, -2.5); // Creative: impact is at the valley floor near camera

  const p = Math.max(0, Math.min(1, progress));
  let pos = new THREE.Vector3();
  let phase = 'convergence';

  if (p < 0.36){
    pos.copy(start);
    phase = p < 0.28 ? 'convergence' : 'formation';
  } else if (p < 0.55){
    const t = (p - 0.36) / 0.19;
    const e = 1 - Math.pow(1 - t, 2);
    pos.copy(start).lerp(apex, e);
    phase = 'rise';
  } else if (p < 0.6){
    pos.copy(apex);
    phase = 'apex';
  } else if (p < 0.96){
    const t = (p - 0.6) / 0.36;
    // Brand: ease OUT (continues to soar gracefully into the sky)
    // Creative: ease IN (gravity, the meteor accelerates as it crashes)
    const e = isBrand ? (1 - Math.pow(1 - t, 2)) : (t * t);
    pos.copy(apex).lerp(impact, e);
    phase = 'fall';
  } else {
    pos.copy(impact);
    phase = 'impact';
  }
  return { pos, phase };
}

function HeroMeteor({ progress, choice, glowTex, onImpact }){
  const headRef = useRef();
  const flashRef = useRef();
  const fireRef = useRef();            // bright inner fire core
  const fireOuterRef = useRef();       // wider amber halo
  const trailRefs = useRef([]);
  const emberRefs = useRef([]);        // small sparks shedding from the meteor
  const posBuf = useRef(Array.from({ length: TRAIL_LEN }, () => new THREE.Vector3(0, -999, 0)));
  const velRef = useRef(new THREE.Vector3());
  const lastPos = useRef(new THREE.Vector3());
  const triggered = useRef(false);

  // Ember particle definitions - emitted relative to the meteor head.
  const embers = useMemo(() => {
    const arr = [];
    let s = 13;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let i = 0; i < 14; i++){
      arr.push({
        offset: [
          (rand() - 0.5) * 0.6,
          (rand() - 0.5) * 0.6,
          (rand() - 0.5) * 0.6,
        ],
        phase: rand(),                 // 0..1, when in the fall this ember peaks
        life:  0.18 + rand() * 0.18,
        size:  0.22 + rand() * 0.18,
        // direction of drift (mostly backward + small jitter)
        drift: [(rand() - 0.5) * 0.7, 0.2 + rand() * 0.4, (rand() - 0.5) * 0.5],
      });
    }
    return arr;
  }, []);

  useFrame(() => {
    const { pos, phase } = heroMeteorPath(progress, choice);

    // Estimate velocity for orienting the fire trail
    velRef.current.subVectors(pos, lastPos.current);
    lastPos.current.copy(pos);

    if (phase === 'fall' || phase === 'rise' || phase === 'apex'){
      for (let i = TRAIL_LEN - 1; i > 0; i--) posBuf.current[i].copy(posBuf.current[i - 1]);
      posBuf.current[0].copy(pos);
    } else {
      for (let i = 0; i < TRAIL_LEN; i++) posBuf.current[i].copy(pos);
    }

    if (headRef.current){
      headRef.current.position.copy(pos);
      let size, opacity;
      if (phase === 'convergence'){
        const t = progress / 0.28;
        size = 0.2 + t * 0.8;
        opacity = t * 0.7;
      } else if (phase === 'formation'){
        const t = (progress - 0.28) / 0.08;
        size = 1.0 + Math.sin(t * Math.PI) * 0.9;
        opacity = 1.0;
      } else if (phase === 'rise'){
        const t = (progress - 0.36) / 0.19;
        size = 1.6 - t * 0.2;
        opacity = 0.95;
      } else if (phase === 'apex'){
        size = 1.4;
        opacity = 1.0;
      } else if (phase === 'fall'){
        const t = (progress - 0.6) / 0.36;
        size = 1.8 + Math.pow(t, 1.4) * 2.4;     // bigger flame ball
        opacity = 1.0;
      } else {
        size = 5.5;
        opacity = 1.0;
      }
      headRef.current.scale.setScalar(size);
      headRef.current.material.opacity = opacity;
    }

    // Fire layers - only during fall. Two sprites: a bright inner fire (smaller,
    // hotter color) and a wider amber halo. Both billboard behind the head.
    const fireT = phase === 'fall' ? (progress - 0.6) / 0.36 : 0;
    if (fireRef.current){
      fireRef.current.position.copy(pos);
      const fireScale = phase === 'fall' ? (2.2 + fireT * 2.5) : 0.001;
      fireRef.current.scale.setScalar(fireScale);
      fireRef.current.material.opacity = phase === 'fall' ? 0.95 : 0;
    }
    if (fireOuterRef.current){
      fireOuterRef.current.position.copy(pos);
      const outerScale = phase === 'fall' ? (4.5 + fireT * 5.0) : 0.001;
      fireOuterRef.current.scale.setScalar(outerScale);
      fireOuterRef.current.material.opacity = phase === 'fall' ? 0.6 : 0;
    }

    if (flashRef.current){
      flashRef.current.position.copy(pos);
      const headScale = headRef.current?.scale.x || 1;
      flashRef.current.scale.setScalar(headScale * 2.6);
      let haloOp = 0.25;
      if (phase === 'formation') haloOp = 0.75;
      else if (phase === 'fall') haloOp = 0.65;
      else if (phase === 'impact') haloOp = 0.95;
      flashRef.current.material.opacity = haloOp;
    }

    // Streak trail - much more vivid during fall
    const trailMul = phase === 'fall' ? 1.0 : phase === 'rise' ? 0.3 : 0.0;
    for (let i = 0; i < TRAIL_LEN; i++){
      const ref = trailRefs.current[i];
      if (!ref) continue;
      ref.position.copy(posBuf.current[i]);
      const a = 1 - i / TRAIL_LEN;
      ref.material.opacity = a * 0.9 * trailMul;
      const sz = 2.0 * (1 - i * 0.06) * trailMul;
      ref.scale.setScalar(Math.max(0.05, sz));
    }

    // Ember particles - scatter behind the meteor during fall
    if (phase === 'fall'){
      const fallT = (progress - 0.6) / 0.36;
      embers.forEach((e, i) => {
        const ref = emberRefs.current[i];
        if (!ref) return;
        // Each ember lives from e.phase to e.phase + e.life within the fall
        const localT = (fallT - e.phase) / e.life;
        if (localT < 0 || localT > 1){
          ref.visible = false;
          return;
        }
        ref.visible = true;
        // Position: starts at meteor's head offset, drifts UP/back (relative to fall direction)
        ref.position.set(
          pos.x + e.offset[0] + e.drift[0] * localT * 1.5,
          pos.y + e.offset[1] + e.drift[1] * localT * 1.5,
          pos.z + e.offset[2] + e.drift[2] * localT * 1.2,
        );
        // Fade & shrink as they cool
        ref.scale.setScalar(e.size * (1 - localT * 0.4));
        ref.material.opacity = (1 - localT) * 0.85;
      });
    } else {
      emberRefs.current.forEach(r => { if (r) r.visible = false; });
    }

    if (phase === 'impact' && !triggered.current){
      triggered.current = true;
      onImpact?.(pos.clone());
    }
  });

  useEffect(() => { if (progress < 0.05) triggered.current = false; }, [progress]);

  return (
    <group renderOrder={520}>
      {/* Outer amber halo - softest, biggest */}
      <sprite ref={fireOuterRef} scale={0.001}>
        <spriteMaterial map={glowTex} transparent depthWrite={false} blending={THREE.AdditiveBlending} color={'#ff8c2a'} opacity={0} />
      </sprite>
      {/* Inner fire - hotter color, brighter */}
      <sprite ref={fireRef} scale={0.001}>
        <spriteMaterial map={glowTex} transparent depthWrite={false} blending={THREE.AdditiveBlending} color={'#ffc46a'} opacity={0} />
      </sprite>
      {/* Soft halo around the head */}
      <sprite ref={flashRef} scale={1}>
        <spriteMaterial map={glowTex} transparent depthWrite={false} blending={THREE.AdditiveBlending} color={'#ffd190'} opacity={0} />
      </sprite>
      {/* Hot white core */}
      <sprite ref={headRef} scale={0.2}>
        <spriteMaterial map={glowTex} transparent depthWrite={false} blending={THREE.AdditiveBlending} color={'#fff5d2'} opacity={0} />
      </sprite>
      {/* Streak trail */}
      {Array.from({ length: TRAIL_LEN }, (_, i) => (
        <sprite key={i} ref={el => trailRefs.current[i] = el}>
          <spriteMaterial map={glowTex} transparent depthWrite={false} blending={THREE.AdditiveBlending} color={i < 4 ? '#ffb455' : '#f0742a'} opacity={0} />
        </sprite>
      ))}
      {/* Ember particles */}
      {embers.map((_, i) => (
        <sprite key={i} ref={el => emberRefs.current[i] = el} scale={0.2}>
          <spriteMaterial map={glowTex} transparent depthWrite={false} blending={THREE.AdditiveBlending} color={'#ffae3a'} opacity={0} />
        </sprite>
      ))}
    </group>
  );
}

// Convergence sparks: stream IN from the sky toward the marker during 0-30%.
// They fade as they reach the target (giving the impression of being absorbed).
function ConvergenceSparks({ progress, choice, glowTex }){
  const refs = useRef([]);
  const target = useMemo(() => getMarkerPos(choice), [choice]);

  const sparks = useMemo(() => {
    const arr = [];
    let s = 31;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let i = 0; i < 24; i++){
      // start positions scattered across the upper sky
      const ang = rand() * Math.PI * 2;
      const radius = 8 + rand() * 8;
      arr.push({
        startPos: [
          target.x + Math.cos(ang) * radius * 0.4,
          target.y + 6 + rand() * 8,
          target.z + Math.sin(ang) * radius * 0.3 + (rand() - 0.5) * 4,
        ],
        delay:    rand() * 0.18,
        duration: 0.10 + rand() * 0.14,
        size:     0.18 + rand() * 0.22,
      });
    }
    return arr;
  }, [target]);

  useFrame(() => {
    // Only active during convergence phase (0..0.32)
    if (progress > 0.34) {
      refs.current.forEach(r => { if (r) r.visible = false; });
      return;
    }
    sparks.forEach((def, i) => {
      const ref = refs.current[i];
      if (!ref) return;
      const localT = (progress - def.delay) / def.duration;
      if (localT <= 0 || localT > 1.0){
        ref.visible = false;
        return;
      }
      ref.visible = true;
      // Move from startPos to target with ease-in (snap into target)
      const e = localT * localT;
      ref.position.set(
        def.startPos[0] + (target.x - def.startPos[0]) * e,
        def.startPos[1] + (target.y - def.startPos[1]) * e,
        def.startPos[2] + (target.z - def.startPos[2]) * e,
      );
      // Brighten then fade fast as they near the target
      const op = (1 - Math.pow(localT, 4)) * 0.9;
      ref.material.opacity = op;
      // Shrink slightly as they arrive (absorbed)
      ref.scale.setScalar(def.size * (1.4 - localT * 0.6));
    });
  });

  return (
    <group renderOrder={510}>
      {sparks.map((_, i) => (
        <sprite key={i} ref={el => refs.current[i] = el} scale={0.2}>
          <spriteMaterial map={glowTex} transparent depthWrite={false} blending={THREE.AdditiveBlending} color={'#ffd99a'} opacity={0} />
        </sprite>
      ))}
    </group>
  );
}

// Background meteors with fiery trail. Now spread across the FULL frame, not
// just one side, and given a small fire halo so they read as meteors rather
// than dust motes.
function BgMeteor({ def, progress, glowTex }){
  const groupRef = useRef();
  const headRef = useRef();
  const fireRef = useRef();
  const trailRefs = useRef([]);
  const posBuf = useRef(Array.from({ length: TRAIL_LEN }, () => new THREE.Vector3(0, -999, 0)));

  useFrame(() => {
    const fallT = (progress - 0.6) / 0.36;
    const localT = (fallT - def.delay) / def.duration;
    if (localT <= 0 || localT > 1.02){
      if (groupRef.current) groupRef.current.visible = false;
      return;
    }
    if (groupRef.current) groupRef.current.visible = true;
    const e = localT * localT;
    const x = def.startPos[0] + (def.endPos[0] - def.startPos[0]) * e;
    const y = def.startPos[1] + (def.endPos[1] - def.startPos[1]) * e;
    const z = def.startPos[2] + (def.endPos[2] - def.startPos[2]) * e;

    for (let i = TRAIL_LEN - 1; i > 0; i--) posBuf.current[i].copy(posBuf.current[i - 1]);
    posBuf.current[0].set(x, y, z);
    if (headRef.current){
      headRef.current.position.set(x, y, z);
      headRef.current.scale.setScalar(def.size);
      headRef.current.material.opacity = 0.85;
    }
    if (fireRef.current){
      fireRef.current.position.set(x, y, z);
      fireRef.current.scale.setScalar(def.size * 2.4);
      fireRef.current.material.opacity = 0.5;
    }
    for (let i = 0; i < TRAIL_LEN; i++){
      const ref = trailRefs.current[i];
      if (!ref) continue;
      ref.position.copy(posBuf.current[i]);
      ref.material.opacity = (1 - i / TRAIL_LEN) * 0.6;
      ref.scale.setScalar(def.size * (1 - i * 0.07) * 1.2);
    }
  });

  return (
    <group ref={groupRef}>
      <sprite ref={fireRef} scale={def.size * 2}>
        <spriteMaterial map={glowTex} transparent depthWrite={false} blending={THREE.AdditiveBlending} color={'#ff8c2a'} opacity={0} />
      </sprite>
      <sprite ref={headRef} scale={def.size}>
        <spriteMaterial map={glowTex} transparent depthWrite={false} blending={THREE.AdditiveBlending} color={'#ffe8a8'} opacity={0.7} />
      </sprite>
      {Array.from({ length: TRAIL_LEN }, (_, i) => (
        <sprite key={i} ref={el => trailRefs.current[i] = el} scale={def.size}>
          <spriteMaterial map={glowTex} transparent depthWrite={false} blending={THREE.AdditiveBlending} color={i < 3 ? '#ffb455' : '#f07028'} opacity={0} />
        </sprite>
      ))}
    </group>
  );
}

// 3D shockwave ring at the meteor's final position. For Creative it sits flat
// on the valley floor; for Brand it floats high in the sky.
function ImpactRing({ progress, choice }){
  const ringRef = useRef();
  const ringMatRef = useRef();
  const flashRef = useRef();
  const flashMatRef = useRef();
  const isBrand = choice === 'brand';
  useFrame(() => {
    if (progress < 0.96 || !ringRef.current) return;
    const t = Math.min(1, (progress - 0.96) / 0.04);
    const r = 0.5 + t * 9.0;
    ringRef.current.scale.set(r, r, 1);
    if (ringMatRef.current) ringMatRef.current.opacity = (1 - t) * 0.95;
    if (flashRef.current && flashMatRef.current){
      const fs = 1 + t * (isBrand ? 12 : 7);
      flashRef.current.scale.setScalar(fs);
      flashMatRef.current.opacity = (1 - t) * (isBrand ? 1.0 : 0.9);
    }
  });
  const pos = isBrand ? [0, 9.5, -16] : [0, -0.4, -2.5];
  return (
    <group position={pos} renderOrder={600}>
      {/* For Brand, the ring is billboard (camera-facing - like a halo around a sun);
          for Creative, it's flat on the ground. */}
      {isBrand ? (
        <sprite ref={ringRef} scale={[1, 1, 1]}>
          <spriteMaterial ref={ringMatRef} map={useGlowTexture()} transparent depthWrite={false} blending={THREE.AdditiveBlending} color={'#fff0c0'} opacity={0} />
        </sprite>
      ) : (
        <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} scale={[0.5, 0.5, 1]}>
          <ringGeometry args={[0.85, 1.0, 64]} />
          <meshBasicMaterial ref={ringMatRef} transparent depthWrite={false} blending={THREE.AdditiveBlending} color={'#fff0c0'} opacity={0} side={THREE.DoubleSide} />
        </mesh>
      )}
      <sprite ref={flashRef} scale={1}>
        <spriteMaterial ref={flashMatRef} map={useGlowTexture()} transparent depthWrite={false} blending={THREE.AdditiveBlending} color={'#ffefb8'} opacity={0} />
      </sprite>
    </group>
  );
}

function MeteorShower({ active, progress, choice, onImpact }){
  const glowTex = useGlowTexture();

  const meteors = useMemo(() => {
    const arr = [];
    let s = 7;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    // 60 background meteors spread across the FULL screen width and depth.
    for (let i = 0; i < 60; i++){
      // Spread evenly: 30 left half, 30 right half. Use mod to alternate sides.
      const sideBias = (i % 2 === 0 ? -1 : 1);
      const startX = sideBias * (4 + rand() * 22);   // x in [4..26] or [-26..-4]
      const startY = 8 + rand() * 9;
      const startZ = -18 + rand() * 10;
      const endX   = startX * 0.35 + (rand() - 0.5) * 4;
      const endY   = -3 - rand() * 1.6;
      const endZ   = -1 + rand() * 2.6;
      arr.push({
        startPos: [startX, startY, startZ],
        endPos:   [endX, endY, endZ],
        delay:    rand() * 0.5,
        duration: 0.45 + rand() * 0.5,
        size:     0.32 + rand() * 0.55,
      });
    }
    return arr;
  }, []);

  // Render only while actively flying. After flight ends, completely unmount
  // so no leftover meteor sprites or impact rings haunt the destination/home views.
  if (!active) return null;
  return (
    <group renderOrder={500}>
      <ConvergenceSparks progress={progress} choice={choice} glowTex={glowTex} />
      <HeroMeteor progress={progress} choice={choice} glowTex={glowTex} onImpact={onImpact} />
      {meteors.map((def, i) => (
        <BgMeteor key={i} def={def} progress={progress} glowTex={glowTex} />
      ))}
      <ImpactRing progress={progress} choice={choice} />
    </group>
  );
}

function Beam({ x, delay, height = 5.2, width = 0.28, y, opacity = 1.0, paused }){
  const ref = useRef();
  const matRef = useRef();
  const start = useRef(null);
  useFrame(({ clock }) => {
    if (!matRef.current) return;
    const t = clock.getElapsedTime();
    if (start.current === null) start.current = t;
    const local = Math.max(0, t - start.current - delay);
    // Slower fall - was 0.85s, now 1.4s - gives each beam more weight/breath
    const k = Math.min(1, local / 1.4);
    const eased = 1 - Math.pow(1 - k, 3);
    matRef.current.uniforms.uReveal.value = paused ? 1 : eased;
    matRef.current.uniforms.uTime.value = t;
    matRef.current.uniforms.uOpacity.value = opacity;
  });
  // If `y` is provided, use it directly as the beam's vertical center; otherwise
  // anchor the bottom of the beam at the valley floor (legacy).
  const cy = y !== undefined ? y : (VALLEY_Y + height / 2);
  return (
    <mesh ref={ref} position={[x, cy, -0.5]} renderOrder={2}>
      <planeGeometry args={[width, height, 1, 1]} />
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={beamVS}
        fragmentShader={beamFS}
        uniforms={{
          uTime: { value: 0 },
          uOpacity: { value: opacity },
          uReveal: { value: 0 },
          uColorHot: { value: new THREE.Color('#fff3c8') },
          uColorWarm: { value: new THREE.Color('#f0a040') },
        }}
      />
    </mesh>
  );
}

// ─── Particle motes in the beams ────────────────────────────────────────────
function Motes({ count = 240, scene, fadeMul = 1 }){
  const ref = useRef();
  const positions = useMemo(() => {
    const a = new Float32Array(count * 3);
    // Symmetric distribution: sample evenly across the beam column [-0.9, 0.9].
    // (Math.random()-0.5)*1.8 IS symmetric in distribution, but visually it can
    // appear lopsided because samples cluster randomly. We pre-compute interleaved
    // positions so each band gets the same count.
    for (let i = 0; i < count; i++){
      const band = i % 5;            // 5 vertical bands, evenly spaced
      const bandX = -0.7 + band * 0.35;
      const jitter = (Math.random() - 0.5) * 0.18;
      a[i*3+0] = bandX + jitter;
      a[i*3+1] = 0.2 + Math.random() * 4.3;
      a[i*3+2] = -0.5 + (Math.random() - 0.5) * 0.4;  // pin to beam plane
    }
    return a;
  }, [count]);
  const seeds = useMemo(() => {
    const a = new Float32Array(count);
    for (let i = 0; i < count; i++) a[i] = Math.random();
    return a;
  }, [count]);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const arr = ref.current.geometry.attributes.position.array;
    const t = clock.getElapsedTime();
    for (let i = 0; i < count; i++){
      const s = seeds[i];
      arr[i*3+1] += 0.0025 + s * 0.004;
      arr[i*3+0] += Math.sin(t * 0.5 + s * 6.28) * 0.0006;
      if (arr[i*3+1] > 5.0) arr[i*3+1] = 0.0;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
    // Base is non-zero in any descent scene (arrival/fork/etc) - the actual
    // visibility is driven by fadeMul from the parent (scroll-based).
    const base = (scene === 'arrival' || scene === 'fork') ? 0.9 : 0.0;
    // Smooth the opacity in case fadeMul updates faster than the eye can follow.
    const target = base * Math.max(0, fadeMul);
    ref.current.material.opacity += (target - ref.current.material.opacity) * 0.2;
  });
  return (
    <points ref={ref} position={[0, 0, -0.3]} renderOrder={3}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        sizeAttenuation
        transparent
        depthWrite={false}
        opacity={0.9}
        color={'#ffd99a'}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ─── Strike flare at convergence point ──────────────────────────────────────
function StrikeFlare({ active, scene, fadeMul = 1 }){
  const ref = useRef();
  const matRef = useRef();
  useFrame(({ clock }) => {
    if (!ref.current || !matRef.current) return;
    const t = clock.getElapsedTime();
    const pulse = 0.5 + 0.5 * Math.sin(t * 1.4);
    // Softer, wider - acts as bottom dissolve rather than hard strike point
    const target = active ? (0.32 + pulse * 0.12) * Math.max(0, fadeMul) : 0.0;
    matRef.current.opacity += (target - matRef.current.opacity) * 0.05;
    const s = active ? 1 + pulse * 0.04 : 0.9;
    ref.current.scale.setScalar(s);
    if (scene === 'brand' || scene === 'creative' || scene === 'flying') {
      matRef.current.opacity *= 0.94;
    }
  });
  return (
    <sprite ref={ref} position={[0, 0.0, 0]} scale={[5.0, 4.0, 1]}>
      <spriteMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        map={useGlowTexture()}
        opacity={0}
        color={'#ffd9a0'}
      />
    </sprite>
  );
}

// generate a radial glow texture once
function useGlowTexture(){
  return useMemo(() => {
    const size = 256;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    g.addColorStop(0, 'rgba(255,240,200,1)');
    g.addColorStop(0.18, 'rgba(255,200,120,0.85)');
    g.addColorStop(0.5, 'rgba(255,140,60,0.25)');
    g.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
}

// ─── River / Path on the valley floor ───────────────────────────────────────
//
// We build a flat curving ribbon from a quadratic curve. Used both for the
// central river (Scene 1) and the two diverging paths (Scene 2).
function makePathGeometry(curve, width = 0.7, segments = 100){
  const geom = new THREE.PlaneGeometry(1, 1, segments, 1);
  const pos = geom.attributes.position;
  const uv = geom.attributes.uv;
  for (let i = 0; i <= segments; i++){
    const t = i / segments;
    const p = curve.getPoint(t);
    const tan = curve.getTangent(t).normalize();
    // perpendicular in xz plane
    const nx = -tan.z, nz = tan.x;
    const half = width * 0.5;
    // left vertex (top row of plane, index i)
    pos.setXYZ(i, p.x + nx * half, 0.005, p.z + nz * half);
    uv.setXY(i, t, 1);
    // right vertex (bottom row)
    pos.setXYZ(i + (segments + 1), p.x - nx * half, 0.005, p.z - nz * half);
    uv.setXY(i + (segments + 1), t, 0);
  }
  pos.needsUpdate = true; uv.needsUpdate = true;
  geom.computeVertexNormals();
  return geom;
}

function PathRibbon({ curve, width, scene, reveal, intensity, color, onPointerOver, onPointerOut, onClick }){
  const matRef = useRef();
  const geom = useMemo(() => makePathGeometry(curve, width), [curve, width]);
  useFrame(({ clock }) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value = clock.getElapsedTime();
    matRef.current.uniforms.uReveal.value += (reveal - matRef.current.uniforms.uReveal.value) * 0.06;
    matRef.current.uniforms.uIntensity.value += (intensity - matRef.current.uniforms.uIntensity.value) * 0.08;
  });
  return (
    <mesh
      geometry={geom}
      renderOrder={1}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onClick={onClick}
    >
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
        vertexShader={riverVS}
        fragmentShader={riverFS}
        uniforms={{
          uTime: { value: 0 },
          uReveal: { value: 0 },
          uIntensity: { value: 0 },
          uColor: { value: new THREE.Color(color) },
        }}
      />
    </mesh>
  );
}

// ─── Cloud sprite for Scene 3 ───────────────────────────────────────────────
function CloudSprite({ position, scale, opacity = 1, tint = '#ffd9a0', speed = 0.05 }){
  const ref = useRef();
  const matRef = useRef();
  const seed = useMemo(() => Math.random() * 100, []);
  useFrame(({ clock }) => {
    if (!ref.current || !matRef.current) return;
    const t = clock.getElapsedTime();
    matRef.current.uniforms.uTime.value = t + seed;
    ref.current.position.x = position[0] + Math.sin(t * 0.15 + seed) * 0.6;
  });
  return (
    <mesh ref={ref} position={position} renderOrder={0}>
      <planeGeometry args={[scale[0], scale[1], 1, 1]} />
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        vertexShader={beamVS}
        fragmentShader={cloudFS}
        uniforms={{
          uTime: { value: seed },
          uOpacity: { value: opacity },
          uTint: { value: new THREE.Color(tint) },
        }}
      />
    </mesh>
  );
}

// ─── Distant atmosphere haze (for scenes 3) ─────────────────────────────────
function SkyGlow({ scene }){
  const ref = useRef();
  useFrame(() => {
    if (!ref.current) return;
    const target = scene === 'brand' ? 1.0 : scene === 'creative' ? 0.55 : 0.0;
    ref.current.material.opacity += (target - ref.current.material.opacity) * 0.04;
  });
  return (
    <mesh ref={ref} position={[0, 12, -45]} scale={[140, 70, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        transparent
        depthWrite={false}
        opacity={0}
        color={'#f7c270'}
        map={useGlowTexture()}
      />
    </mesh>
  );
}

// ─── Camera rig ─────────────────────────────────────────────────────────────
//
// Drives the camera through the journey. We keep targets per-scene and lerp
// toward them; for the path-flight we sample the chosen curve.
function CameraRig({ scene, choice, brandCurve, creativeCurve, reduced }){
  const { camera, size } = useThree();
  const state = useRef({
    pos: new THREE.Vector3(0, 1.2, 9),
    look: new THREE.Vector3(0, 1.0, 0),
    flightT: 0,
    flightStart: null,
  });
  useEffect(() => {
    camera.position.copy(state.current.pos);
    camera.lookAt(state.current.look);
  }, [camera]);

  useFrame(({ clock }, dt) => {
    const s = state.current;
    let targetPos, targetLook;
    const breath = Math.sin(clock.getElapsedTime() * 0.25) * 0.05;

    if (scene === 'arrival'){
      targetPos = new THREE.Vector3(Math.sin(clock.getElapsedTime() * 0.12) * 0.12, 1.2 + breath, 9);
      targetLook = new THREE.Vector3(0, 1.0, 0);
    } else if (scene === 'fork'){
      targetPos = new THREE.Vector3(Math.sin(clock.getElapsedTime() * 0.12) * 0.1, 1.5 + breath * 0.5, 7.5);
      targetLook = new THREE.Vector3(0, 0.2, -2);
    } else if (scene === 'flying'){
      // Clean single-beam camera dive: ease forward through the chosen path
      // direction toward the destination camera. No meteor, no particles -
      // restraint over spectacle.
      if (s.flightStart === null) s.flightStart = clock.getElapsedTime();
      const elapsed = clock.getElapsedTime() - s.flightStart;
      const T = reduced ? 0.6 : 1.6;
      const k = Math.min(1, elapsed / T);
      // ease in-out cubic - quick acceleration, smooth settle
      const e = k < 0.5 ? 4*k*k*k : 1 - Math.pow(-2*k + 2, 3) / 2;

      const sx = choice === 'brand' ? -0.5 : 0.5;
      const start = new THREE.Vector3(sx * 0.6, 1.6, 7.2);
      // End at the destination camera position so the cut is invisible
      const end = choice === 'brand'
        ? new THREE.Vector3(0, 9, -22)
        : new THREE.Vector3(0, -1.2, -20);
      const startLook = new THREE.Vector3(sx * 0.5, 1.0, -6);
      const endLook = choice === 'brand'
        ? new THREE.Vector3(0, 11, -50)
        : new THREE.Vector3(0, -0.8, -40);

      targetPos = start.clone().lerp(end, e);
      targetLook = startLook.clone().lerp(endLook, e);
    } else if (scene === 'brand'){
      targetPos = new THREE.Vector3(Math.sin(clock.getElapsedTime() * 0.05) * 0.6, 9 + breath, -22);
      targetLook = new THREE.Vector3(0, 11, -50);
    } else if (scene === 'creative'){
      targetPos = new THREE.Vector3(Math.sin(clock.getElapsedTime() * 0.08) * 0.4, -1.2 + breath * 0.4, -20);
      targetLook = new THREE.Vector3(0, -0.8, -40);
    } else {
      targetPos = new THREE.Vector3(0, 1.2, 9);
      targetLook = new THREE.Vector3(0, 1.0, 0);
    }

    const lerpK = scene === 'flying' ? 1 : (reduced ? 1 : 0.04);
    s.pos.lerp(targetPos, lerpK);
    s.look.lerp(targetLook, lerpK);
    if (scene === 'flying') { s.pos.copy(targetPos); s.look.copy(targetLook); }
    if (scene !== 'flying') s.flightStart = null;
    camera.position.copy(s.pos);
    camera.lookAt(s.look);

    // mobile fov tweak
    camera.fov = size.width < 600 ? 62 : 52;
    camera.updateProjectionMatrix();
  });
  return null;
}

// ─── 3D Scene Content ───────────────────────────────────────────────────────
function World({ scene, phase = 'descent', scrollProgress = 0, impacted = false, choice, hover, setHover, onChoose, reduced, flightProgress = 0, onMeteorImpact }){
  const inFlight = phase === 'flight';
  // Path curves (in xz plane). Both paths start at the markers (far) and bend INWARD
  // toward an apex offscreen-behind the camera - but we trim the ribbon UVs so only
  // the upper portion renders. This avoids the bright glow at the convergence point.
  const brandCurve = useMemo(() => new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-4.8, 0, -12),  // far end (marker, left)
    new THREE.Vector3(-3.0, 0, -8.5), // bend
    new THREE.Vector3(-0.9, 0, -5.5), // near end (kept off-axis so paths don't overlap)
  ), []);
  const creativeCurve = useMemo(() => new THREE.QuadraticBezierCurve3(
    new THREE.Vector3( 4.8, 0, -12),
    new THREE.Vector3( 3.0, 0, -8.5),
    new THREE.Vector3( 0.9, 0, -5.5),
  ), []);
  // Central river removed - was creating a bright column at scene center.

  const flying = scene === 'flying';
  const inDest = scene === 'brand' || scene === 'creative';
  const inDescent = phase === 'descent';
  // inFlight declared at function head

  // Beam fades dramatically as we enter the valley. Completely invisible during destinations.
  const beamOp = inDest
    ? 0
    : impacted
      ? 0.0   // hide entirely after impact so destination is clean
      : inDescent
        ? Math.max(0, 1 - Math.pow(scrollProgress / 0.7, 1.6))
        : flying ? 0.25 : 0;

  // Particles fade OUT slowly between scrollProgress 0.35 → 0.6 - i.e. they
  // persist throughout the early descent and finish fading just BEFORE the beams
  // fully disappear at ~0.7. Coming back up, this reverses smoothly.
  // Particles fade OUT during 0.40 → 0.65 going down, fade BACK IN symmetrically
  // when scrolling up. Purely scroll-driven; no one-way state.
  const moteOp = (inDest || phase === 'flight')
    ? 0
    : inDescent
      ? (() => {
          const t = Math.max(0, Math.min(1, (scrollProgress - 0.40) / 0.25));
          const eased = t * t * (3 - 2 * t);
          return 1 - eased;
        })()
      : 0;
  // Central river: visible up top, fades out before impact
  const centralReveal = (inDescent && !impacted) ? Math.max(0, 1 - scrollProgress * 1.6) : 0;
  // Paths: completely hidden until impact, then revealed (shader lerps in)
  const forkActive = inDescent && impacted;
  const brandIntensity = forkActive
    ? (hover === 'brand' ? 1.4 : hover === 'creative' ? 0.55 : 1.0)
    : (flying && choice === 'brand' ? 1.6 : 0);
  const creativeIntensity = forkActive
    ? (hover === 'creative' ? 1.4 : hover === 'brand' ? 0.55 : 1.0)
    : (flying && choice === 'creative' ? 1.6 : 0);

  const glowTex = useGlowTexture();

  return (
    <>
      <CameraExporter />
      {/* Soft fog tints the procedural scenes */}
      <fog attach="fog" args={[scene === 'creative' ? '#3a2516' : '#3a2918', scene === 'brand' ? 28 : 18, 80]} />
      <ambientLight intensity={0.25} color={'#f7c270'} />

      {/* Soft column halo BEHIND the beams - small, tucked into the cloud break,
          purely a backlight. No more vertical glow stretching toward the words. */}
      <sprite position={[0, 4.8, -0.7]} scale={[2.2, 1.6, 1]} renderOrder={1}>
        <spriteMaterial map={glowTex} transparent depthWrite={false} opacity={beamOp * 0.35} color={'#ffd28a'} blending={THREE.AdditiveBlending} />
      </sprite>
      {/* Top sun-burst at the cloud break - very subtle, barely there. */}
      <sprite position={[0, 5.0, -0.5]} scale={[3.6, 2.2, 1]} renderOrder={1}>
        <spriteMaterial map={glowTex} transparent depthWrite={false} opacity={beamOp * 0.25} color={'#fff2c8'} blending={THREE.AdditiveBlending} />
      </sprite>

      {/* Beams - short (height=2.0), uniform width/opacity. Staggered briefly
          on first reveal so the eye reads the cascade, then they settle into
          one coordinated cluster. */}
      <Beam x={-0.44} delay={0.00} width={0.20} height={2.0} y={4.2} opacity={beamOp * 0.75} paused={reduced} />
      <Beam x={-0.22} delay={0.10} width={0.20} height={2.0} y={4.2} opacity={beamOp * 0.75} paused={reduced} />
      <Beam x={ 0.00} delay={0.20} width={0.20} height={2.0} y={4.2} opacity={beamOp * 0.85} paused={reduced} />
      <Beam x={ 0.22} delay={0.30} width={0.20} height={2.0} y={4.2} opacity={beamOp * 0.75} paused={reduced} />
      <Beam x={ 0.44} delay={0.40} width={0.20} height={2.0} y={4.2} opacity={beamOp * 0.75} paused={reduced} />

      <Motes count={reduced ? 0 : 180} scene={scene} fadeMul={moteOp} />
      {/* StrikeFlare disabled - its bottom sprite was reading as a "comet" through the beam stack */}

      {/* Central river removed - was the bright vertical column at scene center */}

      {/* Two diverging paths */}
      <PathRibbon
        curve={brandCurve}
        width={0.6}
        scene={scene}
        reveal={forkActive ? 1 : (flying && choice === 'brand' ? 1 : 0)}
        intensity={brandIntensity}
        color="#ffcc7a"
        onPointerOver={() => forkActive && setHover('brand')}
        onPointerOut={() => forkActive && setHover(null)}
        onClick={() => forkActive && onChoose('brand')}
      />
      <PathRibbon
        curve={creativeCurve}
        width={0.6}
        scene={scene}
        reveal={forkActive ? 1 : (flying && choice === 'creative' ? 1 : 0)}
        intensity={creativeIntensity}
        color="#ffcc7a"
        onPointerOver={() => forkActive && setHover('creative')}
        onPointerOut={() => forkActive && setHover(null)}
        onClick={() => forkActive && onChoose('creative')}
      />

      {/* Marker lights removed - the HTML fork labels (ring + name) are clearer.
          The 3D sprites at the path endpoints were appearing as horizontal streaks
          ("eyebrows") because the radial-gradient texture, scaled with intensity,
          can read as a slash when viewed near edge-on. */}

      {/* Scene 3 atmospheres */}
      <SkyGlow scene={scene} />
      {inDest && (scene === 'brand' ? <BrandWorld /> : <CreativeWorld />)}

      {/* Meteor shower disabled - replaced with a clean single-beam camera dive.
          Kept in the codebase for now in case we want it back behind a tweak.
          <MeteorShower active={inFlight} progress={flightProgress} choice={choice} onImpact={onMeteorImpact} /> */}

      {/* Camera */}
      <CameraRig
        scene={scene}
        choice={choice}
        brandCurve={brandCurve}
        creativeCurve={creativeCurve}
        reduced={reduced}
      />
    </>
  );
}

function Marker({ position, intensity = 0, hot }){
  const ref = useRef();
  const matRef = useRef();
  useFrame(({ clock }) => {
    if (!ref.current || !matRef.current) return;
    const t = clock.getElapsedTime();
    // Direct intensity - no slow lerp, so markers don't "follow" on scroll-up
    const base = (hot ? 1.0 : 0.55) * Math.max(0, Math.min(1, intensity));
    matRef.current.opacity += (base - matRef.current.opacity) * 0.18;
    const pulse = 1 + Math.sin(t * 1.8) * (hot ? 0.18 : 0.06);
    const targetScale = (hot ? 2.2 : 1.4) * pulse * Math.max(0.001, intensity);
    ref.current.scale.setScalar(targetScale);
  });
  return (
    <sprite ref={ref} position={position} scale={1.4}>
      <spriteMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        map={useGlowTexture()}
        opacity={0}
      />
    </sprite>
  );
}

// ─── Brand world: above the clouds ──────────────────────────────────────────
function BrandWorld(){
  // a horizon-line cloud carpet beneath, distant gold haze
  const clouds = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 18; i++){
      arr.push({
        pos: [(-25 + i * 3) + (Math.random()-0.5)*2, 4 + Math.random()*1.6, -28 - Math.random()*22],
        scale: [10 + Math.random()*6, 5 + Math.random()*2.5, 1],
        op: 0.7 + Math.random() * 0.3,
        tint: '#ffd9a0',
      });
    }
    return arr;
  }, []);
  return (
    <group>
      {/* Sun glow */}
      <mesh position={[0, 13, -48]} scale={[18, 18, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={useGlowTexture()} transparent depthWrite={false} opacity={0.85} color={'#fff0c0'} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* Cloud field below */}
      {clouds.map((c, i) => <CloudSprite key={i} {...c} />)}
      {/* Distant ridge silhouette */}
      <mesh position={[0, 2.4, -36]} scale={[80, 6, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color={'#1a120a'} transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

// ─── Creative world: intimate textured field ────────────────────────────────
function CreativeWorld(){
  const clouds = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 14; i++){
      arr.push({
        pos: [(-22 + i * 3.4) + (Math.random()-0.5)*2, -2 + Math.random()*1.6, -22 - Math.random()*18],
        scale: [9 + Math.random()*6, 4 + Math.random()*2, 1],
        op: 0.55 + Math.random() * 0.3,
        tint: '#e8a06a',
      });
    }
    return arr;
  }, []);
  // Glowing "embers" - particles drifting upward
  const ref = useRef();
  const N = 180;
  const positions = useMemo(() => {
    const a = new Float32Array(N * 3);
    for (let i = 0; i < N; i++){
      a[i*3+0] = (Math.random()-0.5) * 26;
      a[i*3+1] = -3 + Math.random() * 8;
      a[i*3+2] = -16 - Math.random() * 22;
    }
    return a;
  }, []);
  useFrame(() => {
    if (!ref.current) return;
    const arr = ref.current.geometry.attributes.position.array;
    for (let i = 0; i < N; i++){
      arr[i*3+1] += 0.006 + (i % 10) * 0.0004;
      if (arr[i*3+1] > 6) arr[i*3+1] = -3;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });
  return (
    <group>
      {/* Far gold haze on horizon */}
      <mesh position={[0, -1.2, -42]} scale={[42, 8, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={useGlowTexture()} transparent depthWrite={false} opacity={0.75} color={'#ffb070'} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* Ridges */}
      <mesh position={[-8, -2.8, -28]} scale={[28, 5, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color={'#221308'} transparent opacity={0.9} />
      </mesh>
      <mesh position={[10, -3.2, -24]} scale={[24, 4, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color={'#1a0e06'} transparent opacity={0.95} />
      </mesh>
      {/* Cloud / mist tufts */}
      {clouds.map((c, i) => <CloudSprite key={i} {...c} />)}
      {/* Embers */}
      <points ref={ref}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={N} array={positions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.08} sizeAttenuation transparent depthWrite={false} opacity={0.9} color={'#ffd99a'} blending={THREE.AdditiveBlending} />
      </points>
    </group>
  );
}

// ─── Ambient audio (wind + drone), behind a mute toggle ─────────────────────
function useAmbientAudio(muted){
  const ctxRef = useRef(null);
  const nodesRef = useRef(null);
  useEffect(() => {
    if (muted) {
      if (nodesRef.current) {
        nodesRef.current.master.gain.cancelScheduledValues(ctxRef.current.currentTime);
        nodesRef.current.master.gain.linearRampToValueAtTime(0, ctxRef.current.currentTime + 0.6);
      }
      return;
    }
    if (!ctxRef.current) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctxRef.current = ctx;
      // pink-ish noise buffer (one-shot, loop)
      const buf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
      const data = buf.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < data.length; i++){
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buf; noise.loop = true;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 380; lp.Q.value = 0.8;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
      const lfoGain = ctx.createGain(); lfoGain.gain.value = 120;
      lfo.connect(lfoGain).connect(lp.frequency);
      // drone
      const osc1 = ctx.createOscillator(); osc1.type = 'sine'; osc1.frequency.value = 55;
      const osc2 = ctx.createOscillator(); osc2.type = 'sine'; osc2.frequency.value = 82.4;
      const droneGain = ctx.createGain(); droneGain.gain.value = 0.04;
      osc1.connect(droneGain); osc2.connect(droneGain);
      const master = ctx.createGain(); master.gain.value = 0;
      noise.connect(lp).connect(master);
      droneGain.connect(master);
      master.connect(ctx.destination);
      noise.start(); lfo.start(); osc1.start(); osc2.start();
      nodesRef.current = { master };
    }
    const ctx = ctxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    const m = nodesRef.current.master;
    m.gain.cancelScheduledValues(ctx.currentTime);
    m.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 1.2);
  }, [muted]);
  useEffect(() => () => { try { ctxRef.current && ctxRef.current.close(); } catch(e){} }, []);
}

// ─── Custom cursor - dot + ring move together; click spawns a ripple pulse ──
// No mount on touch devices (no `pointer: fine`). Position is driven via
// refs to avoid React re-renders on every mousemove. The dot and ring both
// track the cursor at the same time (no lag) - click anywhere and a gold
// ripple spawns at that point.
function CustomCursor(){
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    if (!fine) return;
    const onMove = (e) => {
      const x = e.clientX, y = e.clientY;
      const t = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      if (dotRef.current)  dotRef.current.style.transform  = t;
      if (ringRef.current) ringRef.current.style.transform = t;
    };
    // Hover detection - any clickable / interactive element flips body.cursor-hover.
    const HOVER_SELECTOR = 'a, button, [role="button"], .fork-label, .cta, input, textarea, label.cf-upload, image-slot';
    const onOver = (e) => {
      if (e.target && e.target.closest && e.target.closest(HOVER_SELECTOR)) {
        document.body.classList.add('cursor-hover');
      }
    };
    const onOut = (e) => {
      const to = e.relatedTarget;
      if (!to || !to.closest || !to.closest(HOVER_SELECTOR)) {
        document.body.classList.remove('cursor-hover');
      }
    };
    // Click ripple - spawn a div at the click point, animate it scale+fade,
    // self-cleanup after the keyframe finishes. Multiple rapid clicks each
    // get their own pulse, so quick double-clicks read correctly.
    const onDown = (e) => {
      const pulse = document.createElement('div');
      pulse.className = 'cursor-pulse';
      pulse.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      document.body.appendChild(pulse);
      // animationend fires once the @keyframes wraps up; remove the node then.
      pulse.addEventListener('animationend', () => pulse.remove(), { once: true });
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);
    document.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
      document.removeEventListener('mousedown', onDown);
      document.body.classList.remove('cursor-hover');
    };
  }, []);
  return (
    <>
      <div ref={ringRef} className="cursor-ring" aria-hidden="true"></div>
      <div ref={dotRef}  className="cursor-dot"  aria-hidden="true"></div>
    </>
  );
}

// ─── Top-level App ──────────────────────────────────────────────────────────
function App({ introDismissed = true, initialPhase = 'descent', homeRoute = null }){
  const router = useRouter();
  // Cinematic cream-wash transition shared with the splash and the brands
  // page. `trigger(href)` paints a cream overlay over the page, fades it
  // in, then router.push - the destination's <ArrivalWash> picks up where
  // it left off so the cut feels seamless. Used for top-left logo clicks.
  const { trigger: navWash, overlay: navWashOverlay } = useNavWash();
  // Dark wash + gold beam scan - reserved for the two pathway options on
  // this page (Embedded / Projects). Feels like "crossing the threshold"
  // into the chosen journey instead of just nav.
  const { trigger: pathwayWash, overlay: pathwayWashOverlay } = usePathwayWash();
  // Mobile hamburger - the top-nav links wrap awkwardly on phones, so
  // below 760px we hide them and reveal a right-side slide-in sheet.
  // Same UX pattern as the splash, brands, and journey pages.
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (menuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);
  // initialPhase lets this component be reused on standalone /about and
  // /contact routes - we mount directly into the about/contact view rather
  // than running the descent → fork flow. homeRoute, when set, makes the
  // wordmark's back arrow route to that URL instead of returning to the
  // internal descent phase (since on /about there's no descent to return to).
  const [phase, setPhase] = useState(initialPhase);  // descent | flight | brand | creative
  // When mounting directly into brand/creative (standalone /brands, /creatives
  // sub-routes), seed `choice` to match - otherwise visual states that depend
  // on choice (camera-fly target, world-tint defaults, etc.) start in a
  // half-initialised state for users who didn't come through the fork.
  const [choice, setChoice] = useState(
    initialPhase === 'brand' || initialPhase === 'creative' ? initialPhase : null
  );     // 'brand' | 'creative'
  const [hover, setHover] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0); // 0..1 during descent
  const [impacted, setImpacted] = useState(false);
  const [flashKey, setFlashKey] = useState(0);
  const [titleLit, setTitleLit] = useState(false);
  const [tagShow, setTagShow] = useState(false);
  const [hintShow, setHintShow] = useState(false);
  const [muted] = useState(true);  // ambient sound disabled; toggle removed from UI
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  // Add a body class so CSS can disable expensive effects (SVG filter on the
  // matte, mix-blend-mode stacks, animated blur) only for Safari users -
  // their compositor handles those layers much slower than Chrome's.
  useEffect(() => {
    if (isSafari) {
      document.body.classList.add('safari');
      return () => document.body.classList.remove('safari');
    }
  }, [isSafari]);
  // Mark the body so creative-only layout rules (e.g. min-height: 220vh for the
  // descent-scroll mechanic) apply only on this route.
  useEffect(() => {
    document.body.classList.add('route-creatives');
    return () => document.body.classList.remove('route-creatives');
  }, []);
  // Flight progress + direction (enter = picking a path, return = going home).
  // The two use different visual wash treatments - warm for arrival, dark for return.
  const [flightProgress, setFlightProgress] = useState(0);
  const [flightDir, setFlightDir] = useState('enter');
  const [meteorFlashKey, setMeteorFlashKey] = useState(0);
  const onMeteorImpact = useCallback(() => {
    setMeteorFlashKey(k => k + 1);
  }, []);

  useAmbientAudio(muted);

  // Derived "scene" for the 3D world / legacy components.
  const scene =
    phase === 'flight'   ? 'flying' :
    phase === 'brand'    ? 'brand' :
    phase === 'creative' ? 'creative' :
    /* descent */          (impacted ? 'fork' : 'arrival');

  // Scene 1 reveal timing - staggered cascade matching the original splash:
  // title glyphs cascade in first, then tagline, then scroll hint. Each child
  // has its own CSS transition so they don't all arrive together.
  //
  // Gated on introDismissed (passed down from CreativesClient). While the
  // intro overlay is on screen the prop is false and the stagger doesn't
  // run; the moment the overlay clears it flips true and the cascade plays
  // as the user first sees the hero.
  useEffect(() => {
    if (reduced){
      setTitleLit(true); setTagShow(true); setHintShow(true);
      return;
    }
    if (!introDismissed) return;
    // Tight cascade - title cascades in fast, tagline a beat behind,
    // hint shortly after. Whole sequence wraps in ~700ms post-dismiss.
    const a = setTimeout(() => setTitleLit(true), 80);
    const b = setTimeout(() => setTagShow(true), 320);
    const c = setTimeout(() => setHintShow(true), 600);
    return () => { clearTimeout(a); clearTimeout(b); clearTimeout(c); };
  }, [reduced, introDismissed]);

  // Scroll → progress (only meaningful in descent) + impact crossing detection.
  // We track previous scroll progress in a ref so the flash fires EVERY TIME the
  // user re-enters the bottom zone (not just the first time).
  const prevProgressRef = useRef(0);
  useEffect(() => {
    if (phase !== 'descent') return;
    const onScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const p = Math.min(1, Math.max(0, window.scrollY / max));
      setScrollProgress(p);
      // Fire impact whenever we cross UP through the 0.92 threshold
      const THRESHOLD = 0.92;
      if (prevProgressRef.current < THRESHOLD && p >= THRESHOLD) {
        setImpacted(true);
        setFlashKey(k => k + 1);
      }
      prevProgressRef.current = p;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [phase]);

  // Smooth wheel scroll: lerps scrollProgress directly (no window.scrollTo so no
  // synthetic scroll events). Lazy-inits from window.scrollY on the first wheel
  // event so return-navigation timing doesn't cause a desync. Also re-runs the
  // impact threshold check so the fork scene triggers correctly.
  useEffect(() => {
    if (phase !== 'descent') return;
    const THRESHOLD = 0.92;
    const getMax = () => Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    let targetP = null;
    let currentP = null;
    let raf = null;

    const syncMatte = (p) => {
      const pos = `50% ${10 + p * 90}%`;
      const m = document.getElementById('matte');
      const cd = document.getElementById('cloud-drift');
      if (m) m.style.backgroundPosition = pos;
      if (cd) cd.style.backgroundPosition = pos;
    };

    const onWheel = (e) => {
      e.preventDefault();
      const max = getMax();
      if (targetP === null) {
        targetP = window.scrollY / Math.max(1, max);
        currentP = targetP;
      }
      const px = e.deltaMode === 1 ? e.deltaY * 40
               : e.deltaMode === 2 ? e.deltaY * window.innerHeight
               : e.deltaY;
      targetP = Math.max(0, Math.min(1, targetP + px / max));
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const tick = () => {
      raf = null;
      if (currentP === null) return;
      const diff = targetP - currentP;
      if (Math.abs(diff) > 0.0003) {
        const prev = currentP;
        currentP += diff * 0.14;
        if (prev < THRESHOLD && currentP >= THRESHOLD) {
          setImpacted(true);
          setFlashKey(k => k + 1);
        }
        prevProgressRef.current = currentP;
        syncMatte(currentP);
        setScrollProgress(currentP);
        raf = requestAnimationFrame(tick);
      } else {
        setScrollProgress(currentP); // final sync when settled
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    return () => { if (raf) cancelAnimationFrame(raf); window.removeEventListener('wheel', onWheel); };
  }, [phase]);

  // Drive matte position from scroll progress (descent reveals lower terrain).
  // Also drive the cloud-drift layer + show the birds when in descent.
  // The main loop video uses object-fit: cover and overflows vertically in a
  // landscape viewport, so panning its object-position Y reveals the valleys
  // at the bottom of the composition the same way the matte does.
  useEffect(() => {
    const m = document.getElementById('matte');
    const cd = document.getElementById('cloud-drift');
    const loop = document.getElementById('main-loop');
    if (m) {
      const py = 10 + scrollProgress * 90;
      m.style.backgroundPosition = `50% ${py}%`;
    }
    if (cd) cd.style.backgroundPosition = `50% ${10 + scrollProgress * 90}%`;
    if (loop) loop.style.objectPosition = `50% ${10 + scrollProgress * 90}%`;
  }, [scrollProgress]);

  // Show ambient layers only during descent (hide when entering destinations)
  useEffect(() => {
    const cd = document.getElementById('cloud-drift');
    const birds = document.getElementById('birds');
    const shouldShow = phase === 'descent' && !reduced;
    if (cd) cd.classList.toggle('show', shouldShow);
    if (birds) birds.classList.toggle('show', shouldShow);
  }, [phase, reduced]);

  // (No mouse parallax - the matte stays put so nothing drifts under the title)

  // Lock body scroll only during flight + destination. After impact we leave
  // descent scrolling unlocked so the user can scroll back up without feeling trapped;
  // the `impacted` state itself is one-way, so the V remains visible.
  // Cleanup on unmount strips the class so the next route doesn't inherit
  // a frozen body (otherwise navigating away from /about - which sits in
  // phase='about' permanently - would leave the next page un-scrollable).
  useEffect(() => {
    if (phase === 'flight' || phase === 'brand' || phase === 'creative' || phase === 'about' || phase === 'contact') {
      document.body.classList.add('locked');
    } else {
      document.body.classList.remove('locked');
    }
    return () => { document.body.classList.remove('locked'); };
  }, [phase, impacted]);

  // Dim matte during flight + destination
  useEffect(() => {
    const m = document.getElementById('matte');
    if (!m) return;
    if (phase === 'flight' || phase === 'brand' || phase === 'creative' || phase === 'about' || phase === 'contact') m.classList.add('dim');
    else m.classList.remove('dim');
    return () => { const mm = document.getElementById('matte'); if (mm) mm.classList.remove('dim'); };
  }, [phase]);

  // During flight, hide EVERYTHING except the canvas + meteor: matte, vignette,
  // grain, bar - so the meteor flies on a pure black field for max focus.
  useEffect(() => {
    if (phase === 'flight') document.body.classList.add('flight-iso');
    else document.body.classList.remove('flight-iso');
    return () => { document.body.classList.remove('flight-iso'); };
  }, [phase]);

  // On destination pages, hide the 3D canvas entirely so no residual beam/glow
  // is visible during the .dest fade-in or behind the destination content.
  useEffect(() => {
    const inDestPhase = phase === 'brand' || phase === 'creative' || phase === 'about' || phase === 'contact';
    if (inDestPhase) document.body.classList.add('in-dest');
    else document.body.classList.remove('in-dest');
    return () => { document.body.classList.remove('in-dest'); };
  }, [phase]);

  // Drive the zoom-into-landscape transition. The `zooming` class is on
  // throughout flight AND while a destination is showing - the cloud/hero
  // parallax stays committed (fully zoomed past) for the duration, then
  // reverses smoothly when we return home. Done as a separate effect so the
  // matte's .dim class (which independently handles opacity/filter) can have
  // a different timing curve.
  useEffect(() => {
    const zoomPhases = phase === 'flight' || phase === 'brand' || phase === 'creative' || phase === 'about' || phase === 'contact';
    if (zoomPhases) document.body.classList.add('zooming');
    else document.body.classList.remove('zooming');
    return () => { document.body.classList.remove('zooming'); };
  }, [phase]);

  const onChoose = useCallback((c) => {
    // Fork labels on the /creatives page are reframed for creatives:
    //   • "Embedded" label uses scene-id 'brand'    (legacy id, kept to
    //     preserve the camera-flight wiring) - route to /creatives/embedded
    //   • "Project"  label uses scene-id 'creative' (legacy id)         -
    //     route to /creatives/projects
    // Both bypass the in-scene flight + destination overlay because those
    // pathway pages now live as standalone routes with the full content.
    if (c === 'brand')    { pathwayWash('/creatives/embedded', 'embedded'); return; }
    if (c === 'creative') { pathwayWash('/creatives/projects', 'projects'); return; }
    setChoice(c);
    setFlightDir('enter');
    setPhase('flight');
    setFlightProgress(0);
    const T = reduced ? 600 : 1600;
    const t0 = performance.now();
    let raf = 0;
    const tick = () => {
      const k = Math.min(1, (performance.now() - t0) / T);
      setFlightProgress(k);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    setTimeout(() => {
      cancelAnimationFrame(raf);
      setFlightProgress(1);
      setPhase(c);
    }, T);
  }, [reduced, router]);

  const onNav = useCallback((dest) => {
    setPhase(dest);
  }, []);

  const onReturn = useCallback(() => {
    // Nav pages (about/contact) return instantly - no flight.
    if (phase === 'about' || phase === 'contact') {
      setPhase('descent');
      return;
    }
    // Going BACK from brand/creative is a quieter, darker transition.
    setFlightDir('return');
    setPhase('flight');
    setFlightProgress(0);
    setTimeout(() => {
      setScrollProgress(1); // pin to bottom so hero stays hidden during transition
      setPhase('descent');
      setChoice(null);
      setFlightProgress(0);
      requestAnimationFrame(() => {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'auto' });
      });
    }, reduced ? 400 : 1200);
  }, [phase, reduced]);

  const navigate = useCallback((dest) => {
    if (dest === 'home') { onReturn(); return; }
    // 'creative' no longer has an in-scene overlay - the brand destination's
    // "For Creatives" CTA buttons and DestFooter's For Creatives link both
    // funnel through here, so route them to the standalone pathway page.
    if (dest === 'creative') { router.push('/creatives/embedded'); return; }
    setPhase(dest);
  }, [onReturn, router]);

  // Hero scroll-fades down on the way in, AND fades back up if you scroll up far enough.
  // Even after impact, scrolling back ABOVE the valley brings the hero back gracefully.
  const heroOpacity = impacted && scrollProgress > 0.55
    ? 0
    : Math.max(0, 1 - Math.pow(scrollProgress * 1.6, 1.4));
  const heroTransform = `translateY(calc(-50% - ${scrollProgress * 36}px))`;
  const hintOpacity = impacted ? 0 : Math.max(0, 1 - scrollProgress * 3) * (hintShow ? 1 : 0);

  // Fork chrome - visible once impacted, but tied to scroll so scrolling up fades it.
  // Range: fully visible at scrollProgress >= 0.92, fading out down to 0.72.
  // CRITICAL: zero out when we leave 'descent' so chrome doesn't bleed into destinations.
  const forkScrollFactor = Math.max(0, Math.min(1, (scrollProgress - 0.72) / (0.92 - 0.72)));
  const forkOpacity = (impacted && phase === 'descent') ? forkScrollFactor : 0;
  const forkActive = impacted && phase === 'descent' && forkScrollFactor > 0.6;
  const inDescent = phase === 'descent';
  const inDest = phase === 'brand' || phase === 'creative';
  const inNavPage = phase === 'about' || phase === 'contact';
  const inFlight = phase === 'flight';

  const glyphs = 'BEACON'.split('');

  return (
    <>
      <ArrivalWash />
      {navWashOverlay}
      {pathwayWashOverlay}
      {/* Custom cursor temporarily disabled - was interfering with click/hover.
          Restore by uncommenting and we'll diagnose why interactions broke. */}
      {/* <CustomCursor /> */}
      <Canvas
        className="three"
        dpr={[1, Math.min(window.devicePixelRatio || 1, isSafari ? 1.5 : 2)]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 1.2, 9], fov: 52, near: 0.1, far: 200 }}
        onCreated={({ gl }) => { gl.setClearColor(0x000000, 0); }}
        style={{ display: reduced ? 'none' : 'block' }}
      >
        <World
          scene={scene}
          phase={phase}
          scrollProgress={scrollProgress}
          impacted={impacted}
          choice={choice}
          hover={hover}
          setHover={setHover}
          onChoose={onChoose}
          reduced={reduced}
          flightProgress={flightProgress}
          onMeteorImpact={onMeteorImpact}
        />
      </Canvas>

      {/* Flight dim wash - warm bright for entering a world, dark calm for returning */}
      {phase === 'flight' && <div className={`flight-dim ${flightDir === 'return' ? 'dim-return' : ''}`}></div>}

      {/* Meteor-impact flash overlay disabled along with the meteor shower */}
      {/* {meteorFlashKey > 0 && (
        <div key={`meteor-flash-${meteorFlashKey}`} className="meteor-flash"></div>
      )} */}

      {/* Touchdown - a single soft warm pulse, no harsh flash or ring */}
      {impacted && (
        <div key={`pulse-${flashKey}`} className="impact-pulse fire"></div>
      )}

      {/* Top bar - shown in ALL phases. Wordmark left, nav right.
          On destination pages, the wordmark doubles as "Return to the fork". */}
      <div className="bar" style={{ opacity: phase === 'flight' ? 0 : 1, pointerEvents: phase === 'flight' ? 'none' : 'auto', transition: 'opacity 700ms ease' }}>
        {/* OLD WORDMARK (kept for future restore - boss is still using this mark
            at a conference, swap back when he's ready):
        {(phase === 'brand' || phase === 'creative' || phase === 'about' || phase === 'contact')
          ? (
            <button type="button" className="wordmark wordmark-btn" onClick={onReturn} aria-label="Return home">
              <span className="wm-arrow" aria-hidden="true">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
              </span>
              Beacon
            </button>
          )
          : <div className="wordmark">Beacon</div>
        }
        */}

        {/* NEW WORDMARK - actual conference logo image (/assets/beacon-logo.png).
            Two click destinations depending on phase:
              • descent → back to the splash page (the fork was reached
                from there, so "home" = "/")
              • brand/creative/about/contact → back to the descent fork
            Same arrow-on-hover treatment in both states so the affordance
            is consistent across the whole site. */}
        {(phase === 'brand' || phase === 'creative' || phase === 'about' || phase === 'contact')
          ? (
            <button
              type="button"
              className="wordmark wordmark-btn"
              onClick={homeRoute ? () => navWash(homeRoute) : onReturn}
              aria-label={homeRoute ? 'Back to home' : 'Return to fork'}
            >
              <span className="wm-arrow" aria-hidden="true">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
              </span>
              <img className="wm-logo" src="/assets/beacon-logo.png" alt="Beacon Media Solutions" />
            </button>
          )
          : (
            <button type="button" className="wordmark wordmark-btn" onClick={() => navWash('/')} aria-label="Back to home">
              <span className="wm-arrow" aria-hidden="true">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
              </span>
              <img className="wm-logo" src="/assets/beacon-logo.png" alt="Beacon Media Solutions" />
            </button>
          )
        }
        <nav className="top-nav top-nav-desktop">
          {/* ?from=creatives lets /about and /contact route their back-
              arrow to /creatives instead of the default home, so users
              who came from this page can get back to it without browser
              back. Direct navigation (no query) still routes to "/". */}
          <a href="/about?from=creatives" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); navWash('/about?from=creatives'); }}>About</a>
          <a href="/contact?from=creatives" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); navWash('/contact?from=creatives'); }}>Contact</a>
        </nav>
        <button
          type="button"
          className="bar-hamburger"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          aria-expanded={menuOpen}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
      </div>

      {/* Mobile side menu - same slide-in sheet pattern as brands + splash. */}
      <div
        className={`bar-menu-backdrop ${menuOpen ? 'is-open' : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden={!menuOpen}
      />
      <aside
        className={`bar-side-menu ${menuOpen ? 'is-open' : ''}`}
        aria-hidden={!menuOpen}
        aria-label="Mobile navigation"
      >
        <button
          type="button"
          className="bar-side-menu-close"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <nav className="bar-side-menu-nav" aria-label="Primary mobile">
          <a href="/brands" onClick={(e) => { e.preventDefault(); setMenuOpen(false); navWash('/brands'); }}>For Brands</a>
          <a href="/creatives/embedded" onClick={(e) => { e.preventDefault(); setMenuOpen(false); navWash('/creatives/embedded'); }}>For Creatives</a>
          <a href="/about?from=creatives" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); setMenuOpen(false); navWash('/about?from=creatives'); }}>About</a>
          <a href="/contact?from=creatives" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); setMenuOpen(false); navWash('/contact?from=creatives'); }}>Contact</a>
        </nav>
        <div className="bar-side-menu-connect">
          <p className="bar-side-menu-label">Connect</p>
          <a href="mailto:info@beaconmediasolutions.com">info@beaconmediasolutions.com</a>
        </div>
      </aside>

      {/* Standalone return button removed - the wordmark itself now serves as
          "Return to the fork" on destination pages. */}

      {/* Hero - BEACON title + tagline. Scroll-fade together; fade back in on scroll-up.
          IMPORTANT: pointer-events disabled when invisible so it doesn't block scroll
          on the destination overlays underneath. */}
      <div
        className="hero"
        style={{
          opacity: heroOpacity,
          transform: heroTransform,
          pointerEvents: (phase === 'descent' && heroOpacity > 0.05) ? 'auto' : 'none',
          visibility: (phase === 'brand' || phase === 'creative' || phase === 'about' || phase === 'contact') ? 'hidden' : 'visible',
        }}
      >
        <h1 className="title" aria-label="Beacon">
          {glyphs.map((g, i) => (
            <span key={i} className={`glyph ${titleLit ? 'lit' : ''}`} style={{ transitionDelay: `${i * 35}ms` }}>{g}</span>
          ))}
        </h1>
        <div className={`tagline ${tagShow ? 'show' : ''}`}>Find a brand worth building for. A career worth keeping.</div>
      </div>

      {/* Scroll hint - descent only; unmount on flight/destination so it
          doesn't intercept clicks or scroll. */}
      {inDescent && (
        <div className={`scrollhint ${hintShow ? 'show' : ''}`} style={{ opacity: hintOpacity }}>
          <div className="label">Scroll</div>
          <div className="rail"></div>
          <div className="chev"></div>
        </div>
      )}

      {/* Fork intro caption - only during descent */}
      {inDescent && (
        <div className={`fork-caption ${forkOpacity > 0.05 ? 'show' : ''}`} style={{ opacity: forkOpacity }}>
          <div className="k">Choose your path</div>
          <div className="h">Two ways to work with us.</div>
        </div>
      )}

      {/* Fork labels - only during descent */}
      {inDescent && (
        <ForkLabels
          scene={scene}
          hover={hover}
          setHover={setHover}
          onChoose={onChoose}
          forkOpacity={forkOpacity}
          active={forkActive}
        />
      )}

      {/* Destination content */}
      <Destination scene={phase} choice={choice} navigate={navigate} navWash={navWash} />
    </>
  );
}

// ─── Fork labels (HTML projected onto 3D marker positions) ──────────────────
function ForkLabels({ scene, hover, setHover, onChoose, forkOpacity = 1, active = true }){
  const [pts, setPts] = useState({ brand: { x: 0, y: 0 }, creative: { x: 0, y: 0 } });
  useEffect(() => {
    // Project even when scene is 'arrival' (during descent) so labels are positioned ready to fade in
    let raf = 0;
    const project = () => {
      const cam = window.__beacon_cam;
      if (cam) {
        const a = new THREE.Vector3(-4.8, 0.6, -12).project(cam);
        const b = new THREE.Vector3( 4.8, 0.6, -12).project(cam);
        const w = window.innerWidth, h = window.innerHeight;
        setPts({
          brand:    { x: (a.x * 0.5 + 0.5) * w, y: (-a.y * 0.5 + 0.5) * h },
          creative: { x: (b.x * 0.5 + 0.5) * w, y: (-b.y * 0.5 + 0.5) * h },
        });
      }
      raf = requestAnimationFrame(project);
    };
    project();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="fork-labels" style={{ pointerEvents: active ? 'auto' : 'none' }}>
      <div
        className={`fork-label ${hover === 'brand' ? 'hot' : hover === 'creative' ? 'cold' : ''}`}
        style={{
          /* Bumped from -30 → -160 because each label is ~180px+ wide and
             centred on this x via translate(-50%, -50%). The previous
             offsets left the two labels overlapping on most screens. */
          left: pts.brand.x - 160,
          top: 'calc(50% + 20px)',
          opacity: forkOpacity,
        }}
        onMouseEnter={() => active && setHover('brand')}
        onMouseLeave={() => active && setHover(null)}
        onClick={() => active && onChoose('brand')}
      >
        <div className="ring"></div>
        <span className="ember" style={{ '--dx': '-12px', animationDelay: '0ms' }}></span>
        <span className="ember" style={{ '--dx': '8px',   animationDelay: '220ms' }}></span>
        <span className="ember" style={{ '--dx': '-4px',  animationDelay: '440ms' }}></span>
        <span className="ember" style={{ '--dx': '14px',  animationDelay: '660ms' }}></span>
        {/* Reframed for the /creatives page - the user has already
            identified as a creative, so the two paths now describe the
            two career shapes Beacon offers them: a full-time embedded
            seat inside a brand, or project-based production work. The
            internal scene IDs ("brand" / "creative") are preserved so
            the existing camera-flight / world transitions still work. */}
        <div className="name">Embedded</div>
        <div className="meta">Full-time inside a brand</div>
        <div className="enter">Enter</div>
      </div>
      <div
        className={`fork-label ${hover === 'creative' ? 'hot' : hover === 'brand' ? 'cold' : ''}`}
        style={{
          left: pts.creative.x + 160,
          top: 'calc(50% + 20px)',
          opacity: forkOpacity,
        }}
        onMouseEnter={() => active && setHover('creative')}
        onMouseLeave={() => active && setHover(null)}
        onClick={() => active && onChoose('creative')}
      >
        <div className="ring"></div>
        <span className="ember" style={{ '--dx': '-10px', animationDelay: '0ms' }}></span>
        <span className="ember" style={{ '--dx': '6px',   animationDelay: '220ms' }}></span>
        <span className="ember" style={{ '--dx': '-14px', animationDelay: '440ms' }}></span>
        <span className="ember" style={{ '--dx': '4px',   animationDelay: '660ms' }}></span>
        <div className="name">Project</div>
        <div className="meta">Production work, on demand</div>
        <div className="enter">Enter</div>
      </div>
    </div>
  );
}

// helper so ForkLabels can access the camera
function CameraExporter(){
  const { camera } = useThree();
  useEffect(() => { window.__beacon_cam = camera; }, [camera]);
  return null;
}

// ─── Destination content overlay ────────────────────────────────────────────
//
// Content based on beaconmediasolutions.com. The Brand destination explains the
// two services (Embedded Solutions + Media Production) and Why Beacon. The
// Destination overlay - brand, creative, about, or contact pages.
function Destination({ scene, choice, navigate, navWash }){
  const showBrand    = scene === 'brand';
  // 'creative' scene removed - onChoose('creative') routes out to
  // /creatives/embedded instead of mounting an in-scene overlay.
  const showAbout    = scene === 'about';
  const showContact  = scene === 'contact';
  const [cfType, setCfType] = useState('brand');
  // Brand intake form
  const [brandService, setBrandService] = useState('embedded');
  const [brandRoles, setBrandRoles] = useState([]);
  const [brandTimeline, setBrandTimeline] = useState('flexible');
  const toggleBrandRole = (role) =>
    setBrandRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  // Destination overlay contact form - submit + popup state
  const [cfSubmitting, setCfSubmitting] = useState(false);
  const [thanksOpen, setThanksOpen] = useState(false);

  const handleCfSubmit = async (e) => {
    e.preventDefault();
    if (cfSubmitting) return;
    const formEl = e.currentTarget;
    setCfSubmitting(true);
    const ok = await submitForm(formEl, 'creatives');
    if (ok) {
      formEl.reset();
      setCfType('brand');
      setThanksOpen(true);
    } else {
      alert('Sorry - something went wrong. Please email info@beaconmediasolutions.com directly.');
    }
    setCfSubmitting(false);
  };
  // Creative form state removed alongside the creative destination overlay
  // - that pathway now lives at /creatives/embedded as a standalone page
  // and onChoose('creative') routes directly there.

  const brandRef    = useRef(null);
  const aboutRef    = useRef(null);
  const contactRef  = useRef(null);

  useEffect(() => {
    const map = { brand: brandRef, about: aboutRef, contact: contactRef };
    const ref = map[scene];
    if (ref && ref.current) ref.current.scrollTop = 0;
  }, [scene]);

  // Scroll-reveal: IntersectionObserver adds .in to .anim elements as they enter view.
  // Resets on each scene change so every page visit feels like a fresh cinematic entrance.
  useEffect(() => {
    const map = { brand: brandRef, about: aboutRef, contact: contactRef };
    const scrollEl = map[scene]?.current;
    if (!scrollEl) return;
    scrollEl.querySelectorAll('.anim').forEach(el => el.classList.remove('in'));
    let obs;
    const timer = setTimeout(() => {
      obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); }
        });
      }, { root: scrollEl, rootMargin: '0px 0px -60px 0px', threshold: 0.07 });
      scrollEl.querySelectorAll('.anim').forEach(el => obs.observe(el));
    }, 460);
    return () => { clearTimeout(timer); if (obs) obs.disconnect(); };
  }, [scene]);

  return (
    <>
      <ThanksPopup open={thanksOpen} onClose={() => setThanksOpen(false)} />

      {/* ───── ABOUT PAGE ────────────────────────────────────────────────── */}
      <div className={`dest dest-page-narrow ${showAbout ? 'show' : ''}`}>
        <div className="scroll" ref={aboutRef}>

          <section className="hero-section">
            <div className="container">
              <div className="kicker anim" style={{ transitionDelay: '0ms' }}>Our Story</div>
              <h1 className="display anim" style={{ transitionDelay: '160ms' }}>
                The bridge between <em>great creatives</em> and the brands that need them.
              </h1>
              <p className="lead anim" style={{ transitionDelay: '380ms' }}>
                Beacon was founded on a simple belief: the best creative work happens when talent and brand are genuinely aligned - not just transactionally connected. We built the infrastructure to make that possible at scale.
              </p>
            </div>
          </section>

          <div className="bleed anim" style={{ transitionDelay: '560ms' }}>
            <image-slot id="about-bleed" shape="rect" placeholder="Team at work - studio, behind the scenes, or editorial portrait" src="https://images.unsplash.com/photo-1693645325820-03c4be5b7031?w=1600&q=80&auto=format&fit=crop"></image-slot>
          </div>

          {/* Mission */}
          <div className="container">
            <div className="section-rule anim">
              <div className="label">Our Mission</div>
              <div className="line"></div>
            </div>
            <div className="case split anim">
              <div className="slot-frame tall">
                <image-slot id="about-mission" shape="rect" placeholder="Founders or team in a meaningful space" src="https://images.unsplash.com/photo-1758873268745-dd2cf0d677b5?w=1600&q=80&auto=format&fit=crop"></image-slot>
              </div>
              <div>
                <div className="meta">Why Beacon exists</div>
                <h3>To make high-quality content <em>accessible to every team</em> - not just the ones with giant marketing budgets.</h3>
                <p>
                  Beacon was founded after watching brands struggle with inconsistent content - patched together by rotating freelancers, stretched in-house teams, or production houses that never quite understood them. We designed a different model: embedded, full-time creatives placed inside the organisations they serve.
                </p>
                <p>
                  Great content comes from people who <em>belong</em> to your brand. The best stories aren't outsourced - they're lived from within.
                </p>
              </div>
            </div>
          </div>

          {/* Values */}
          <div className="container">
            <div className="section-rule anim">
              <div className="label">What We Stand For</div>
              <div className="line"></div>
            </div>
            <div className="pillars">
              <div className="pillar anim">
                <div className="pillar-n">01</div>
                <h4>Craft first</h4>
                <p>We believe in the quality of the work above all. Every placement is made with craft and cultural fit as the primary criteria.</p>
              </div>
              <div className="pillar anim">
                <div className="pillar-n">02</div>
                <h4>Long-term thinking</h4>
                <p>We don't do quick fixes. We build relationships between creatives and brands that last - and that produce better work over time.</p>
              </div>
              <div className="pillar anim">
                <div className="pillar-n">03</div>
                <h4>Operational integrity</h4>
                <p>From contracts to career conversations, we do what we say. Creatives can rely on us. Brands can rely on us.</p>
              </div>
              <div className="pillar anim">
                <div className="pillar-n">04</div>
                <h4>Singapore & beyond</h4>
                <p>Built in Singapore, with the infrastructure and ambition to place talent - and serve brands - across the region and globally.</p>
              </div>
            </div>
          </div>

          {/* How we work */}
          <div className="container">
            <div className="section-rule anim">
              <div className="label">How We Work</div>
              <div className="line"></div>
            </div>
            <div className="case split-flip anim">
              <div>
                <div className="meta">The Beacon model</div>
                <h3>One organisation. <em>Two sides of the same mission.</em></h3>
                <p>
                  Beacon Media Solutions places creatives inside brands as embedded, full-time team members. Beacon Media Productions delivers end-to-end creative projects for organisations that need production firepower without the overhead.
                </p>
                <p>
                  Both sides draw from the same talent network, the same operational backbone, and the same standard of work.
                </p>
              </div>
              <div className="slot-frame tall">
                <image-slot id="about-model" shape="rect" placeholder="Collaboration - brand and creative together" src="https://images.unsplash.com/photo-1758876203342-fc14c0bba67c?w=1600&q=80&auto=format&fit=crop"></image-slot>
              </div>
            </div>
          </div>

          {/* Services teaser */}
          <div className="container">
            <div className="section-rule anim">
              <div className="label">What We Do</div>
              <div className="line"></div>
            </div>
            <div className="case split anim">
              <div>
                <div className="meta">For Brands</div>
                <h3>Embedded talent or full <em>production delivery.</em></h3>
                <p>Build a dedicated in-house creative team or commission end-to-end projects. No agency layer, no freelancer churn.</p>
                <div className="actions" style={{ marginTop: 28 }}>
                  <button className="cta" onClick={() => navigate('brand')}>For Brands
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                  </button>
                </div>
              </div>
              <div>
                <div className="meta">For Creatives</div>
                <h3>Build a career inside brands that <em>genuinely want you.</em></h3>
                <p>Full-time placement. Long-term growth. Beacon handles the backend so you can focus on the craft.</p>
                <div className="actions" style={{ marginTop: 28 }}>
                  <button className="cta ghost" onClick={() => navigate('creative')}>For Creatives
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="container narrow closing">
            <h2 className="anim">The best stories aren't outsourced - <em>they're lived from within.</em></h2>
            <button className="cta">Work with us
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </button>
          </div>
          <DestFooter navWash={navWash} />
        </div>
      </div>

      {/* ───── CONTACT PAGE ─────────────────────────────────────────────── */}
      <div className={`dest dest-page-narrow ${showContact ? 'show' : ''}`}>
        <div className="scroll" ref={contactRef}>

          <section className="hero-section">
            <div className="container">
              <div className="kicker anim" style={{ transitionDelay: '0ms' }}>Get In Touch</div>
              <h1 className="display anim" style={{ transitionDelay: '160ms' }}>
                Let's build something <em>worth making.</em>
              </h1>
              <p className="lead anim" style={{ transitionDelay: '380ms' }}>
                Whether you're a brand looking for consistent creative capability, or a creative looking for the right place to grow - we'd like to hear from you.
              </p>
            </div>
          </section>

          {/* Contact split */}
          <div className="container">
            <div className="section-rule anim">
              <div className="label">Reach Us</div>
              <div className="line"></div>
            </div>
            <div className="case split anim">
              <div>
                <div className="meta">For brands</div>
                <h3>Ready to embed a creative <em>or brief a project?</em></h3>
                <p>Tell us about your organisation, what you're trying to build, and the timeline you're working toward. We'll come back with a clear picture of how Beacon can help.</p>
                <div className="actions" style={{ marginTop: 32 }}>
                  <button className="cta" onClick={() => navigate('brand')}>Explore - For Brands
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                  </button>
                </div>
              </div>
              <div>
                <div className="meta">For creatives</div>
                <h3>Looking for the right <em>creative home?</em></h3>
                <p>Send us your portfolio and a note about the kind of work and environments you're drawn to. We match on craft and culture - we want to understand both.</p>
                <div className="actions" style={{ marginTop: 32 }}>
                  <button className="cta ghost" onClick={() => navigate('creative')}>Explore - For Creatives
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Glassmorphism contact form */}
          <div className="container">
            <div className="section-rule anim">
              <div className="label">Send A Message</div>
              <div className="line"></div>
            </div>
            <div className="cf-wrap">
              <div className="contact-form">
                {/* Left - description + social */}
                <div className="cf-info">
                  <span className="cf-label">Get in touch</span>
                  <p className="cf-info-title">Let's build something worth making.</p>
                  <p className="cf-info-body">Whether you have a question, a brief, or just want to say hello - we'd love to hear from you.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                    <div className="cf-detail">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                      <a href="mailto:info@beaconmediasolutions.com">info@beaconmediasolutions.com</a>
                    </div>
                    <div className="cf-detail">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      <span>141 Cecil Street #08-07<br/>Tung Ann Association Building<br/>Singapore 069541</span>
                    </div>
                  </div>
                  <div className="cf-social">
                    <a href="https://www.instagram.com/beaconmediasg/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none"/></svg>
                    </a>
                    <a href="https://www.linkedin.com/company/beacon-media-solutions/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                    </a>
                  </div>
                </div>
                {/* Right - form fields */}
                <form className="cf-fields" action={FORM_ENDPOINT} method="POST" onSubmit={handleCfSubmit}>
                  <input type="hidden" name="form" value="creatives" />
                  <div className="cf-row two">
                    <div className="cf-field">
                      <span className="cf-label">Name</span>
                      <input type="text" name="name" placeholder="Your name" required />
                    </div>
                    <div className="cf-field">
                      <span className="cf-label">Email</span>
                      <input type="email" name="email" placeholder="your@email.com" required />
                    </div>
                  </div>
                  <div className="cf-field">
                    <span className="cf-label">I am a</span>
                    <div className="cf-toggle">
                      <button type="button" className={`cf-toggle-btn${cfType === 'brand' ? ' on' : ''}`} onClick={() => setCfType('brand')}>Brand</button>
                      <button type="button" className={`cf-toggle-btn${cfType === 'creative' ? ' on' : ''}`} onClick={() => setCfType('creative')}>Creative</button>
                    </div>
                    <input type="hidden" name="i_am_a" value={cfType === 'brand' ? 'Brand' : 'Creative'} />
                  </div>
                  <div className="cf-field">
                    <span className="cf-label">Message</span>
                    <textarea name="message" rows="5" placeholder={cfType === 'brand' ? 'Tell us about your organisation, what you\'re building, and your timeline…' : 'Tell us about your craft, the kind of work you love, and where you want to grow…'} />
                  </div>
                  <div>
                    <button type="submit" className="cta" disabled={cfSubmitting} aria-busy={cfSubmitting}>
                      {cfSubmitting ? 'Sending…' : 'Send message'}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* What to expect - guarantees that build confidence before reaching out */}
          <div className="container">
            <div className="section-rule anim">
              <div className="label">What to expect</div>
              <div className="line"></div>
            </div>
            <div className="pillars">
              <div className="pillar anim">
                <div className="pillar-n">01</div>
                <h4>A reply within a business day</h4>
                <p>Every brief gets a human reply within 24 working hours - no auto-responders, no "we'll be in touch" black holes. Urgent? Flag it in your subject line.</p>
              </div>
              <div className="pillar anim">
                <div className="pillar-n">02</div>
                <h4>First call is on us</h4>
                <p>A 30-minute conversation to understand your work and your context. No pitch deck, no hard sell - if we're not the right fit, we'll tell you and point you somewhere better.</p>
              </div>
              <div className="pillar anim">
                <div className="pillar-n">03</div>
                <h4>Confidential by default</h4>
                <p>Briefs, creative directions, and conversations stay private. NDAs ready on request, and we never share client work publicly without explicit permission.</p>
              </div>
            </div>
          </div>

          <div className="container narrow closing">
            <h2 className="anim">The first message is always the hardest. Make it easy - just say hello.</h2>
            <a className="cta" href="mailto:info@beaconmediasolutions.com">Say hello
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </a>
          </div>
          <DestFooter navWash={navWash} />
        </div>
      </div>
    </>
  );
}

// Cinematic footer - shared across all destination pages.
// All links route through navWash (cream-flash) and a real URL push so the
// behaviour is identical whether the footer is rendered in the /creatives
// 3D scene, on /about, or on /contact.
function DestFooter({ navWash }){
  const flash = (href) => (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    if (navWash) navWash(href);
  };
  return (
    <div className="container">
    <footer className="dest-footer">
      <div className="ft-mark">BEACON</div>
      <div className="ft-tagline">EMPOWERING CREATIVES. ELEVATING BRANDS.</div>
      <div className="ft-divider" aria-hidden="true">
        <span className="ft-rule-left"></span>
        <svg className="ft-spark" width="14" height="14" viewBox="0 0 14 14">
          <path d="M7 0 L8.2 5.8 L14 7 L8.2 8.2 L7 14 L5.8 8.2 L0 7 L5.8 5.8 Z" fill="currentColor"/>
        </svg>
        <span className="ft-rule-right"></span>
      </div>

      <div className="ft-cols">
        <div className="ft-col">
          <div className="ft-label">Navigate</div>
          <a href="/" onClick={flash('/')}>Home</a>
          <a href="/about?from=creatives" onClick={flash('/about?from=creatives')}>About</a>
          <a href="/contact?from=creatives" onClick={flash('/contact?from=creatives')}>Contact</a>
        </div>
        <div className="ft-col">
          <div className="ft-label">Pathways</div>
          <a href="/brands" onClick={flash('/brands')}>For Brands</a>
          <a href="/creatives/embedded" onClick={flash('/creatives/embedded')}>For Creatives</a>
        </div>
      </div>

      <div className="ft-connect">
        <div className="ft-label">Connect</div>
        <a className="ft-email" href="mailto:info@beaconmediasolutions.com">info@beaconmediasolutions.com</a>
        <div className="ft-location">
          141 Cecil Street #08-07<br/>
          Tung Ann Association Building<br/>
          Singapore 069541
        </div>
        <div className="ft-social">
          <a href="https://www.instagram.com/beaconmediasg/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none"/></svg></a>
          <a href="https://www.linkedin.com/company/beacon-media-solutions/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg></a>
        </div>
      </div>

      {/* Copyright line unified with the splash hero footer so the credit
          reads identically across every route (splash, brands, creatives,
          about, contact). */}
      <div className="ft-meta">
        <span>© {new Date().getFullYear()} Beacon Media Solutions. All rights reserved.</span>
        <span aria-hidden="true"> · </span>
        <span>Designed by Kairos Cheng</span>
      </div>
    </footer>
    </div>
  );
}


export default App;

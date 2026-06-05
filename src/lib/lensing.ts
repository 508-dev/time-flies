import { DataTexture, LinearFilter, RGBAFormat } from "three";
import type { Activity } from "./types";
import { feelToColor, feelToRadius } from "./mapping";

/**
 * The accretion disk's color/intensity as a 1-D lookup texture, indexed by
 * radius from `inner` to `outer`. Each activity contributes a soft Gaussian band
 * at its mapped radius; overlapping bands blend by weight. The lensing shader
 * samples this whenever a (bent) light ray crosses the equatorial plane, so the
 * same band appears both in front of and lensed up-and-over the shadow.
 */
export function buildDiskLUT(list: Activity[], inner: number, outer: number): DataTexture {
  const W = 1024;
  const sigma = 0.06; // band thickness in world units
  const accR = new Float32Array(W);
  const accG = new Float32Array(W);
  const accB = new Float32Array(W);
  const accW = new Float32Array(W);

  for (const activity of list) {
    const radius = feelToRadius(activity.feel);
    const color = feelToColor(activity.feel);
    for (let i = 0; i < W; i++) {
      const r = inner + ((outer - inner) * i) / (W - 1);
      const d = (r - radius) / sigma;
      const w = Math.exp(-0.5 * d * d);
      if (w < 0.002) continue;
      accR[i] += color.r * w;
      accG[i] += color.g * w;
      accB[i] += color.b * w;
      accW[i] += w;
    }
  }

  const data = new Uint8Array(W * 4);
  for (let i = 0; i < W; i++) {
    const w = accW[i];
    if (w > 0) {
      data[i * 4] = Math.min(255, (accR[i] / w) * 255);
      data[i * 4 + 1] = Math.min(255, (accG[i] / w) * 255);
      data[i * 4 + 2] = Math.min(255, (accB[i] / w) * 255);
      data[i * 4 + 3] = Math.min(255, w * 255);
    }
  }

  const tex = new DataTexture(data, W, 1, RGBAFormat);
  tex.minFilter = LinearFilter;
  tex.magFilter = LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

/** Fullscreen-triangle/quad vertex shader — emits clip-space directly, ignoring the camera. */
export const lensVertexShader = /* glsl */ `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/**
 * Approximate gravitational lensing by marching each camera ray through the
 * Schwarzschild-like field. The bending term `a = -1.5 * h² * p / r⁵` (with h²
 * the conserved angular momentum) is the standard geometric-units approximation
 * that produces the Interstellar "bump": the far side of the disk wrapped above
 * and below the shadow. Rays that fall inside the shadow radius are captured
 * (black); rays that escape sample a lensed starfield.
 */
export const lensFragmentShader = /* glsl */ `
  precision highp float;

  uniform vec2 uResolution;
  uniform vec3 uCamPos;
  uniform vec3 uCamRight;
  uniform vec3 uCamUp;
  uniform vec3 uCamForward;
  uniform float uTanHalfFov;
  uniform float uAspect;
  uniform float uTime;
  uniform sampler2D uDiskLUT;
  uniform float uDiskInner;
  uniform float uDiskOuter;
  uniform float uShadowRadius;
  uniform float uInfluence;
  uniform float uHighlightRadius; // radius of the hovered band
  uniform float uHighlightOn;     // 1 while a band is highlighted, else 0

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  vec3 hash3(vec3 p) {
    return vec3(hash(p), hash(p + 19.19), hash(p + 37.31));
  }

  // Each cell may hold one star, drawn as a small round point at a random
  // sub-cell position — so stars stay crisp dots everywhere, while the lensing
  // magnifies the ones near the hole (this is sampled with the bent direction).
  vec3 starfield(vec3 dir) {
    vec3 base = normalize(dir) * 90.0;
    vec3 cell = floor(base);
    vec3 frac = base - cell - 0.5;        // [-0.5, 0.5] within the cell
    vec3 r = hash3(cell);
    float present = step(0.30, r.x);       // ~70% of cells hold a star
    vec3 starPos = (hash3(cell + 5.0) - 0.5) * 0.6;
    float dist = length(frac - starPos);
    float core = smoothstep(0.11, 0.0, dist);
    float bright = 0.5 + 0.5 * r.y;
    float tw = 0.75 + 0.25 * sin(uTime * 2.0 + r.z * 30.0);
    return present * core * bright * tw * vec3(0.78, 0.85, 1.0);
  }

  vec4 sampleDisk(float r) {
    float t = (r - uDiskInner) / (uDiskOuter - uDiskInner);
    if (t < 0.0 || t > 1.0) return vec4(0.0);
    return texture2D(uDiskLUT, vec2(t, 0.5));
  }

  // Orbiting gas: integer angular frequencies keep it seamless and exactly
  // 2π-periodic in the (advected) angle. Returns roughly [-1.1, 1.1].
  float gasTurbulence(float r, float a) {
    float v = 0.0;
    v += 0.55 * sin(a * 4.0 + r * 2.2);
    v += 0.30 * sin(a * 9.0 - r * 3.1 + 2.0 * sin(a * 2.0));
    v += 0.17 * sin(a * 17.0 + r * 5.3);
    v += 0.09 * sin(a * 29.0 - r * 7.0);
    return v;
  }

  // Brightness modulation of the disk at (radius, angle). Two rigidly-rotating
  // layers (fast inner, slow outer) blended by radius read as differential
  // rotation but never wind to a standstill. Phase is wrapped mod 2π — invisible
  // given the integer frequencies — so motion stays crisp indefinitely.
  float gasFlow(float r, float ang) {
    float arms = ang + r * 1.6; // frozen spiral-arm shape
    float fast = arms - mod(uTime * 0.50, 6.2831853);
    float slow = arms - mod(uTime * 0.13, 6.2831853);
    float w = clamp((uDiskOuter - r) / (uDiskOuter - uDiskInner), 0.0, 1.0); // 1 inner → 0 outer
    float v = mix(gasTurbulence(r, slow), gasTurbulence(r, fast), w);
    float g = clamp(0.5 + 0.6 * v, 0.0, 1.0);
    return mix(0.45, 1.15, g); // dark dust lanes ↔ bright gas, never fully dark
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy / uResolution) * 2.0 - 1.0;
    uv.x *= uAspect;
    vec3 dir = normalize(
      uCamForward + uv.x * uTanHalfFov * uCamRight + uv.y * uTanHalfFov * uCamUp
    );

    vec3 p = uCamPos;
    vec3 v = dir;
    vec3 hvec = cross(p, v);
    float h2 = dot(hvec, hvec);

    // Impact parameter (view dir is unit length, so b = sqrt(h2)). Rays that
    // miss the hole by more than the influence radius are left perfectly
    // straight, localizing all lensing to a sphere around the black hole.
    float b = sqrt(h2);
    if (b > uInfluence) {
      gl_FragColor = vec4(starfield(dir), 1.0);
      return;
    }
    // Ease the bend to zero approaching the influence boundary (no hard seam).
    float fall = 1.0 - smoothstep(uInfluence * 0.7, uInfluence, b);

    vec3 col = vec3(0.0);
    float transmit = 1.0;
    bool captured = false;

    const int STEPS = 300;
    for (int i = 0; i < STEPS; i++) {
      float r = length(p);
      if (r < uShadowRadius) { captured = true; break; }
      if (r > 45.0 && dot(v, p) > 0.0) break; // escaped to infinity

      // Adaptive step: fine near the hole and near the disk plane.
      float dt = clamp(r * 0.08, 0.04, 0.6);
      if (abs(p.y) < 0.7) dt = min(dt, 0.05);

      vec3 pPrev = p;
      vec3 acc = -1.5 * h2 * p / pow(r, 5.0) * fall;
      v += acc * dt;
      p += v * dt;

      // Equatorial disk crossing between pPrev and p.
      if (pPrev.y * p.y < 0.0) {
        float f = pPrev.y / (pPrev.y - p.y);
        vec3 hit = mix(pPrev, p, f);
        float rr = length(hit.xz);
        vec4 disk = sampleDisk(rr);
        if (disk.a > 0.0) {
          // Doppler-ish beaming: the side rotating toward us is brighter.
          float ang = atan(hit.z, hit.x);
          float beam = 0.75 + 0.45 * sin(ang + uTime * 0.25);
          // Orbiting gas texture, faster nearer the hole.
          float gas = gasFlow(rr, ang);
          // Highlight: boost the hovered band, gently dim the rest for contrast.
          float hl = uHighlightOn * exp(-pow((rr - uHighlightRadius) / 0.12, 2.0));
          float emphasis = mix(1.0, 0.5, uHighlightOn) + hl * 3.0;
          col += transmit * disk.rgb * disk.a * beam * gas * 1.5 * emphasis;
          col += transmit * disk.a * hl * 0.5; // white-hot core on the hovered band
          transmit *= (1.0 - disk.a * 0.9);
        }
      }
      if (transmit < 0.01) break;
    }

    vec3 outc = col;
    if (!captured) outc += transmit * starfield(v);

    gl_FragColor = vec4(outc, 1.0);
  }
`;

import { Color } from "three";

/**
 * Scene geometry, in world units. The black hole sits at the origin; the
 * accretion disk and corona lie (flat, for Layer 2) in the XZ plane.
 *
 *   |== shadow ==|== accretion disk ==|====== corona ======|
 *   0          ~0.95   R_HORIZON    R_DISK_OUTER       R_CORONA_OUTER
 *                       (f→0)        (f=1 boundary)      (f→large)
 */
export const SHADOW_RADIUS = 0.95;
export const R_HORIZON = 1.0; // innermost disk radius, approached as factor → 0
export const R_DISK_OUTER = 2.7; // factor = 1 boundary; also the corona's inner edge
export const R_CORONA_OUTER = 6.8; // approached as factor grows large

/**
 * Map a compression factor to a radius from the singularity.
 *
 * Corona (f ≥ 1): f = 1 sits at the inner edge; larger factors push outward,
 * asymptotically approaching R_CORONA_OUTER so unbounded "feels like forever"
 * values stay on screen.
 *
 * Accretion disk (f < 1): linear from the f→1 outer edge down toward the event
 * horizon as the factor shrinks ("the shorter it felt").
 */
export function factorToRadius(factor: number): number {
  if (factor >= 1) {
    const t = 1 - Math.exp(-(factor - 1) * 0.45); // 0 at f=1, →1 as f grows
    return R_DISK_OUTER + (R_CORONA_OUTER - R_DISK_OUTER) * t;
  }
  const f = Math.max(factor, 0.0001);
  return R_HORIZON + (R_DISK_OUTER - R_HORIZON) * f;
}

/**
 * Hue (degrees, 0–360) as a stable function of the compression factor — a given
 * factor always yields the same hue, independent of the activity set.
 *
 * Corona (f ≥ 1): reds. f = 1 is a warm orange (45°); larger factors deepen
 * toward pure red (0°).
 * Accretion disk (f < 1): purples. f→1 is magenta (300°); f→0 is violet (255°).
 */
export function factorToHue(factor: number): number {
  if (factor >= 1) {
    return 45 * Math.exp(-(factor - 1) * 0.4); // 45° → 0°
  }
  return 255 + 45 * Math.max(factor, 0); // 255° → 300°
}

export function isCorona(factor: number): boolean {
  return factor >= 1;
}

function hsl(factor: number): { h: number; s: number; l: number } {
  const h = factorToHue(factor);
  return isCorona(factor) ? { h, s: 95, l: 55 } : { h, s: 85, l: 60 };
}

/** CSS `hsl(...)` string for the legend swatches and tooltip. */
export function factorToCss(factor: number): string {
  const { h, s, l } = hsl(factor);
  return `hsl(${h.toFixed(0)} ${s}% ${l}%)`;
}

/** three.js Color for the rendered bands. */
export function factorToColor(factor: number): Color {
  const { h, s, l } = hsl(factor);
  return new Color().setHSL(h / 360, s / 100, l / 100);
}

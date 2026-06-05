import { Color } from "three";

/**
 * Scene geometry, in world units. The black hole sits at the origin; the
 * accretion disk and corona lie (flat, for the ring fallback) in the XZ plane.
 *
 *   |== shadow ==|====== accretion disk ======|====== corona ======|
 *   0          SHADOW (feel→+1)   R_DISK_OUTER (feel=0)        R_CORONA_OUTER (feel→−1)
 *               singularity        baseline seam                endless drag
 */
export const SHADOW_RADIUS = 0.95;
export const R_DISK_OUTER = 2.7; // baseline (feel = 0) seam between disk and corona
export const R_CORONA_OUTER = 6.8; // approached as the drag deepens (feel → −1)

const EDGE = 0.985; // keeps the slider ends just shy of true ±∞
const K = 0.9; // radius falloff steepness against the log-ratio

/**
 * The signed log-ratio F = ln(actual / felt), derived from the bounded slider
 * position. feel = 0 → F = 0 (baseline); feel → +1 → F → +∞ (the zone); feel →
 * −1 → F → −∞ (endless). The tan curve makes the slider perceptually gentle near
 * baseline and explosive near the extremes — the asymptote toward the singularity.
 */
export function feelToF(feel: number): number {
  const clamped = Math.max(-1, Math.min(1, feel));
  return Math.tan(clamped * (Math.PI / 2) * EDGE);
}

export function isCorona(feel: number): boolean {
  return feel < 0;
}

export function isBaseline(feel: number): boolean {
  return Math.abs(feelToF(feel)) < 0.08;
}

/**
 * Map a feel to a radius from the singularity.
 * Flies (F ≥ 0): exponentially inward from the seam toward the shadow.
 * Drags (F < 0): exponentially outward from the seam toward the corona's edge.
 * Continuous at F = 0 (both branches give R_DISK_OUTER).
 */
export function feelToRadius(feel: number): number {
  const f = feelToF(feel);
  if (f >= 0) {
    return SHADOW_RADIUS + (R_DISK_OUTER - SHADOW_RADIUS) * Math.exp(-f * K);
  }
  return R_CORONA_OUTER - (R_CORONA_OUTER - R_DISK_OUTER) * Math.exp(f * K);
}

/**
 * Hue (degrees) as a stable function of feel.
 * Disk (feel ≥ 0): purples — magenta (300°) at baseline deepening to violet (255°).
 * Corona (feel < 0): reds — orange (45°) at baseline deepening to red (0°).
 */
export function feelToHue(feel: number): number {
  if (feel >= 0) return 300 - 45 * Math.min(feel, 1);
  return 45 * (1 + Math.max(feel, -1));
}

function hsl(feel: number): { h: number; s: number; l: number } {
  const h = feelToHue(feel);
  return isCorona(feel) ? { h, s: 95, l: 55 } : { h, s: 85, l: 60 };
}

/** CSS `hsl(...)` string for the legend swatches and tooltip. */
export function feelToCss(feel: number): string {
  const { h, s, l } = hsl(feel);
  return `hsl(${h.toFixed(0)} ${s}% ${l}%)`;
}

/** three.js Color for the rendered bands and disk LUT. */
export function feelToColor(feel: number): Color {
  const { h, s, l } = hsl(feel);
  return new Color().setHSL(h / 360, s / 100, l / 100);
}

/**
 * Evocative description of a feel — keeps modest multipliers near the middle and
 * switches to language at the extremes, so nobody ever reads "10000000× faster".
 */
export function feelDescriptor(feel: number): string {
  const f = feelToF(feel);
  if (Math.abs(f) < 0.08) return "baseline · 1:1";
  if (f > 0) {
    if (f > 2.4) return "the zone · time vanishes";
    const ratio = Math.exp(f);
    return `feels ~${ratio < 10 ? ratio.toFixed(1) : ratio.toFixed(0)}× faster`;
  }
  if (-f > 2.4) return "endless · time drags on";
  const ratio = Math.exp(-f);
  return `feels ~${ratio < 10 ? ratio.toFixed(1) : ratio.toFixed(0)}× longer`;
}

/** Short zone label for the legend/tooltip. */
export function zoneLabel(feel: number): string {
  if (isBaseline(feel)) return "baseline";
  return isCorona(feel) ? "corona" : "disk";
}

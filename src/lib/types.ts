export interface Activity {
  id: string;
  /** Human-readable label, e.g. "Waiting at the dentist". */
  name: string;
  /**
   * Signed perceptual "feel" of time during the activity, in [-1, 1].
   *
   *   feel = 0   → baseline: it felt exactly as long as it was (1:1).
   *   feel > 0   → time flew: it felt shorter than it was. Falls inward toward
   *                the singularity — the "zone" where time vanishes (feel → 1).
   *   feel < 0   → time dragged: it felt longer than it was. Drifts outward into
   *                the corona, "endless" as feel → -1.
   *
   * This is the bounded slider position; the unbounded log-ratio F = ln(actual/felt)
   * is derived from it (see mapping.ts), so the singularity is an asymptote the
   * slider approaches but never reaches.
   */
  feel: number;
}

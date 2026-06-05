export interface Activity {
  id: string;
  /** Human-readable label, e.g. "Waiting at the dentist". */
  name: string;
  /**
   * Subjective time-compression factor relative to atomic time at altitude 0.
   * > 1  → felt longer than it was ("time crawled")      → corona (red)
   * = 1  → felt exactly as long as it was                → corona inner edge
   * < 1  → felt shorter than it was ("time flew")        → accretion disk (purple)
   * Must be > 0.
   */
  factor: number;
}

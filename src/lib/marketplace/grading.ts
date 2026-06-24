/**
 * Parse a grading tag from a listing title.
 *
 * Titles are prefixed with tags like [PSA10], [CGC9.5], [BGS8], [RAW], [SEALED].
 * This function extracts the grading company and numeric grade when present.
 */

export interface GradingInfo {
  company: "PSA" | "CGC" | "BGS";
  grade: string;
}

/**
 * Extract grading company and grade from a title tag.
 * Returns null for RAW, SEALED, or titles without a recognized grading tag.
 */
export function parseGradingTag(title: string): GradingInfo | null {
  const match = title.match(/^\[(PSA|CGC|BGS)(\d+\.?\d*)\]/);
  if (!match) return null;
  return { company: match[1] as GradingInfo["company"], grade: match[2] };
}

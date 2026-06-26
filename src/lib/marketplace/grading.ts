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

const PSA_GRADE_LABELS: Record<string, string> = {
  "10": "GEM MT",
  "9": "MINT",
  "8": "NM-MT",
  "7": "NM",
  "6": "EX-MT",
  "5": "EX",
  "4": "VG-EX",
  "3": "VG",
  "2": "GOOD",
  "1": "PR",
};

const CGC_GRADE_LABELS: Record<string, string> = {
  "10": "PRISTINE",
  "9.5": "GEM MINT",
  "9": "MINT",
  "8.5": "NM/MINT+",
  "8": "NM/MINT",
  "7.5": "NM+",
  "7": "NM",
  "6.5": "EX/NM+",
  "6": "EX/NM",
  "5.5": "EX+",
  "5": "EX",
};

const BGS_GRADE_LABELS: Record<string, string> = {
  "10": "PRISTINE",
  "9.5": "GEM MINT",
  "9": "MINT",
  "8.5": "NM-MT+",
  "8": "NM-MT",
  "7.5": "NM+",
  "7": "NM",
  "6.5": "EX-MT+",
  "6": "EX-MT",
  "5.5": "EX+",
  "5": "EX",
};

/** Get the condition label text for a given company and grade */
export function getGradeLabel(
  company: GradingInfo["company"],
  grade: string,
): string {
  const labels =
    company === "PSA"
      ? PSA_GRADE_LABELS
      : company === "CGC"
        ? CGC_GRADE_LABELS
        : BGS_GRADE_LABELS;
  return labels[grade] ?? "";
}

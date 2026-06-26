import { getGradeLabel, type GradingInfo } from "@/lib/marketplace/grading";
import styles from "./GradedCardImage.module.css";

interface GradedCardImageProps {
  src: string;
  alt: string;
  grading: GradingInfo;
  /** "sm" for listing cards / thumbnails, "lg" for gallery main image */
  size?: "sm" | "lg";
  className?: string;
}

const companyClass = {
  PSA: { slab: styles.slabPSA, label: styles.labelPSA, badge: styles.badgePSA },
  CGC: { slab: styles.slabCGC, label: styles.labelCGC, badge: styles.badgeCGC },
  BGS: { slab: styles.slabBGS, label: styles.labelBGS, badge: styles.badgeBGS },
} as const;

const sizeClass = {
  sm: styles.slabSm,
  lg: styles.slabLg,
} as const;

/**
 * Small PSA slab: uses the real PSA slab template photo with
 * card image overlaid at precise percentage positions.
 */
function PSASlabSmall({
  src,
  alt,
  grading,
  className,
}: Omit<GradedCardImageProps, "size">) {
  return (
    <div className={`${styles.psaSlab} ${className ?? ""}`}>
      <img
        src="/images/psa-slab-template.webp"
        alt="PSA slab"
        className={styles.psaTemplate}
      />
      {/* PSA label + grade overlaid on header region */}
      <div className={styles.psaLabelOverlay}>
        <span className={styles.psaCompany}>PSA</span>
        <span className={styles.psaGrade}>{grading.grade}</span>
      </div>
      {/* Card image overlaid in the window */}
      <div className={styles.psaCardWindow}>
        <img
          src={src}
          alt={alt}
          className={styles.psaCardImg}
          loading="lazy"
        />
      </div>
    </div>
  );
}

export default function GradedCardImage({
  src,
  alt,
  grading,
  size = "sm",
  className,
}: GradedCardImageProps) {
  // PSA small thumbnails use the real slab template photo
  if (grading.company === "PSA" && size === "sm") {
    return (
      <PSASlabSmall
        src={src}
        alt={alt}
        grading={grading}
        className={className}
      />
    );
  }

  const cc = companyClass[grading.company];
  const gradeLabel = getGradeLabel(grading.company, grading.grade);

  return (
    <div
      className={`${styles.slab} ${cc.slab} ${sizeClass[size]} ${className ?? ""}`}
    >
      {/* Header label */}
      <div className={`${styles.label} ${cc.label}`}>
        <span className={styles.companyName}>{grading.company}</span>
        <span className={`${styles.gradeBadge} ${cc.badge}`}>
          {gradeLabel} {grading.grade}
        </span>
      </div>

      {/* Dark inner card holder */}
      <div className={styles.cardHolder}>
        <img src={src} alt={alt} loading="lazy" />
      </div>

      {/* Bottom certification bar */}
      <div className={styles.footer} />
    </div>
  );
}

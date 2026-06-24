import type { GradingInfo } from "@/lib/marketplace/grading";
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
  PSA: { slab: styles.slabPSA, label: styles.labelPSA },
  CGC: { slab: styles.slabCGC, label: styles.labelCGC },
  BGS: { slab: styles.slabBGS, label: styles.labelBGS },
} as const;

const sizeClass = {
  sm: styles.slabSm,
  lg: styles.slabLg,
} as const;

export default function GradedCardImage({
  src,
  alt,
  grading,
  size = "sm",
  className,
}: GradedCardImageProps) {
  const cc = companyClass[grading.company];

  return (
    <div
      className={`${styles.slab} ${cc.slab} ${sizeClass[size]} ${className ?? ""}`}
    >
      <div className={`${styles.label} ${cc.label}`}>
        <span>{grading.company}</span>
        <span className={styles.grade}>{grading.grade}</span>
      </div>
      <div className={styles.imageWrap}>
        <img src={src} alt={alt} loading="lazy" />
      </div>
    </div>
  );
}

import { getReputationTier, formatAccountAge } from "@/lib/marketplace/reputation";
import type { Profile } from "@/lib/marketplace/types";
import styles from "./SellerCard.module.css";

interface SellerCardProps {
  profile: Pick<
    Profile,
    "username" | "reputation_score" | "completed_trades" | "created_at"
  >;
}

export default function SellerCard({ profile }: SellerCardProps) {
  const tier = getReputationTier(profile.completed_trades);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.avatar}>
          {profile.username.charAt(0).toUpperCase()}
        </div>
        <div className={styles.info}>
          <span className={styles.username}>{profile.username}</span>
          <span className={`${styles.badge} ${styles[tier.className]}`}>
            {tier.label}
          </span>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{profile.completed_trades}</span>
          <span className={styles.statLabel}>
            Trade{profile.completed_trades !== 1 ? "s" : ""}
          </span>
        </div>
        {profile.reputation_score > 0 && (
          <div className={styles.stat}>
            <span className={styles.statValue}>
              {(profile.reputation_score / 10).toFixed(1)}
            </span>
            <span className={styles.statLabel}>Rating</span>
          </div>
        )}
      </div>

      <span className={styles.joined}>
        {formatAccountAge(profile.created_at)}
      </span>
    </div>
  );
}

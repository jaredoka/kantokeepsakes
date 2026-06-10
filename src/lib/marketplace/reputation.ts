export interface ReputationTier {
  label: string;
  className: string;
}

export function getReputationTier(completedTrades: number): ReputationTier {
  if (completedTrades >= 25) {
    return { label: "Veteran Trader", className: "tierVeteran" };
  }
  if (completedTrades >= 10) {
    return { label: "Trusted Trader", className: "tierTrusted" };
  }
  if (completedTrades >= 1) {
    return { label: "Trader", className: "tierTrader" };
  }
  return { label: "New Trader", className: "tierNew" };
}

export function formatAccountAge(createdAt: string): string {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (days < 1) return "Joined today";
  if (days === 1) return "Joined 1 day ago";
  if (days < 30) return `Joined ${days} days ago`;

  const months = Math.floor(days / 30);
  if (months === 1) return "Joined 1 month ago";
  if (months < 12) return `Joined ${months} months ago`;

  const years = Math.floor(months / 12);
  if (years === 1) return "Joined 1 year ago";
  return `Joined ${years} years ago`;
}

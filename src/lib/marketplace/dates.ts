/**
 * Returns the number of days until a listing expires.
 * Negative values mean the listing has already expired.
 */
export function daysUntilExpiry(expiresAt: string): number {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffMs = expires.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Returns a human-readable expiry label.
 * Only returns a string for listings expiring within 7 days (warning zone).
 * Returns null for listings with plenty of time remaining.
 */
export function getExpiryWarning(expiresAt: string): string | null {
  const days = daysUntilExpiry(expiresAt);

  if (days <= 0) return "Expired";
  if (days === 1) return "Expires tomorrow";
  if (days <= 3) return `Expires in ${days} days`;
  if (days <= 7) return `Expires in ${days} days`;
  return null;
}

/**
 * Returns the urgency level for styling.
 */
export function getExpiryUrgency(
  expiresAt: string
): "critical" | "warning" | null {
  const days = daysUntilExpiry(expiresAt);
  if (days <= 1) return "critical";
  if (days <= 3) return "warning";
  return null;
}

/**
 * Format a relative time string (e.g. "2 hours ago", "3 days ago").
 */
export function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;

  const months = Math.floor(days / 30);
  if (months === 1) return "1 month ago";
  return `${months} months ago`;
}

/** Relative timestamps — mirrors the website's formatTimeAgo. */
export function formatTimeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 30) return `${diffDays}d ago`;

  return `${Math.floor(diffDays / 30)}mo ago`;
}

/** Reputation tier from completed trades — mirrors reputation.ts. */
export function reputationTier(completedTrades: number): string {
  if (completedTrades >= 25) return "Veteran Trader";
  if (completedTrades >= 10) return "Trusted Trader";
  if (completedTrades >= 1) return "Trader";
  return "New Trader";
}

/** Account age line — mirrors the website's formatAccountAge. */
export function formatAccountAge(createdAt: string): string {
  const days = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days < 1) return "Joined today";
  if (days === 1) return "Joined 1 day ago";
  if (days < 30) return `Joined ${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return "Joined 1 month ago";
  if (months < 12) return `Joined ${months} months ago`;
  const years = Math.floor(months / 12);
  return years === 1 ? "Joined 1 year ago" : `Joined ${years} years ago`;
}

/** Chat timestamps — mirrors the website chat page's formatMessageTime. */
export function formatMessageTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) return time;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  if (isYesterday) return `Yesterday ${time}`;

  return (
    date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    ` ${time}`
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin";
import ReportActions from "@/components/ReportActions";
import { REPORT_REASONS, type ReportReason } from "@/lib/marketplace/types";
import styles from "./page.module.css";

const REASON_LABELS: Record<ReportReason, string> = {
  scam: "Scam / Fraud",
  spam: "Spam",
  harassment: "Harassment",
  inappropriate: "Inappropriate",
  other: "Other",
};

interface ReportRow {
  id: string;
  reason: ReportReason;
  description: string | null;
  status: string;
  created_at: string;
  listing_id: string | null;
  reporter: { username: string } | null;
  reported_user: { id: string; username: string; is_banned: boolean } | null;
  listings: { id: string; title: string; type: string } | null;
}

export default async function AdminDashboard() {
  const adminId = await requireAdmin();
  if (!adminId) {
    redirect("/marketplace");
  }

  const supabase = await createClient();

  const { data: reports } = await supabase
    .from("reports")
    .select(
      "*, reporter:profiles!reports_reporter_id_fkey(username), reported_user:profiles!reports_reported_user_id_fkey(id, username, is_banned), listings(id, title, type)"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  const typedReports = (reports || []) as unknown as ReportRow[];
  const pendingReports = typedReports.filter((r) => r.status === "pending");
  const resolvedReports = typedReports.filter((r) => r.status !== "pending");

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Admin Dashboard</h1>
          <Link href="/marketplace" className={styles.backLink}>
            &larr; Back to Marketplace
          </Link>
        </div>

        {/* Pending reports */}
        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>
            Pending Reports ({pendingReports.length})
          </h2>

          {pendingReports.length === 0 ? (
            <p className={styles.emptyText}>No pending reports.</p>
          ) : (
            <div className={styles.reportsList}>
              {pendingReports.map((report) => (
                <div key={report.id} className={styles.reportCard}>
                  <div className={styles.reportMeta}>
                    <span
                      className={`${styles.reasonBadge} ${styles[`reason_${report.reason}`]}`}
                    >
                      {REASON_LABELS[report.reason]}
                    </span>
                    <span className={styles.reportDate}>
                      {new Date(report.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className={styles.reportParties}>
                    <span className={styles.partyLabel}>Reported by:</span>
                    <span className={styles.partyValue}>
                      {report.reporter?.username || "Unknown"}
                    </span>
                    <span className={styles.partyLabel}>Against:</span>
                    <span className={styles.partyValue}>
                      {report.reported_user?.username || "Unknown"}
                      {report.reported_user?.is_banned && (
                        <span className={styles.bannedTag}>BANNED</span>
                      )}
                    </span>
                  </div>

                  {report.listings && (
                    <Link
                      href={`/marketplace/${report.listings.id}`}
                      className={styles.listingLink}
                    >
                      {report.listings.type}: {report.listings.title}
                    </Link>
                  )}

                  {report.description && (
                    <p className={styles.reportDescription}>
                      {report.description}
                    </p>
                  )}

                  <ReportActions
                    reportId={report.id}
                    reportedUserId={report.reported_user?.id || ""}
                    isBanned={report.reported_user?.is_banned || false}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Resolved reports */}
        {resolvedReports.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionHeading}>
              Resolved ({resolvedReports.length})
            </h2>
            <div className={styles.reportsList}>
              {resolvedReports.map((report) => (
                <div
                  key={report.id}
                  className={`${styles.reportCard} ${styles.reportResolved}`}
                >
                  <div className={styles.reportMeta}>
                    <span className={styles.reasonBadge}>
                      {REASON_LABELS[report.reason]}
                    </span>
                    <span
                      className={`${styles.statusBadge} ${styles[`status_${report.status}`]}`}
                    >
                      {report.status}
                    </span>
                    <span className={styles.reportDate}>
                      {new Date(report.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className={styles.reportParties}>
                    <span className={styles.partyLabel}>
                      {report.reporter?.username}
                    </span>
                    <span className={styles.partyLabel}>&rarr;</span>
                    <span className={styles.partyValue}>
                      {report.reported_user?.username}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

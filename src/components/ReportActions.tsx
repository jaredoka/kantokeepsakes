"use client";

import { useState } from "react";
import type { ReportReason } from "@/lib/marketplace/types";
import styles from "./ReportActions.module.css";

interface ReportActionsProps {
  reportId: string;
  reportedUserId: string;
  isBanned: boolean;
  reason?: ReportReason;
  listingId?: string | null;
}

export default function ReportActions({
  reportId,
  reportedUserId,
  isBanned,
  reason,
  listingId,
}: ReportActionsProps) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState("");
  const [banned, setBanned] = useState(isBanned);

  const isTradeDispute = reason === "trade_dispute";

  async function handleAction(status: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setDone(status);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update report.");
      }
    } catch {
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleTradeAction(tradeAction: "force_complete" | "cancel_trade") {
    const label =
      tradeAction === "force_complete" ? "force-complete" : "cancel";
    if (!confirm(`Are you sure you want to ${label} this trade?`)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved", tradeAction, listingId }),
      });
      if (res.ok) {
        setDone(
          tradeAction === "force_complete"
            ? "resolved (trade force-completed)"
            : "resolved (trade cancelled)"
        );
      } else {
        const data = await res.json();
        alert(data.error || "Failed to resolve trade dispute.");
      }
    } catch {
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleBan() {
    const action = banned ? "unban" : "ban";
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: reportedUserId, ban: !banned }),
      });
      if (res.ok) {
        setBanned(!banned);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update ban status.");
      }
    } catch {
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className={styles.doneRow}>
        <span className={styles.doneText}>
          Marked as <strong>{done}</strong>
        </span>
      </div>
    );
  }

  return (
    <div className={styles.actions}>
      {/* Trade dispute-specific actions */}
      {isTradeDispute && listingId && (
        <>
          <button
            className={styles.forceCompleteBtn}
            onClick={() => handleTradeAction("force_complete")}
            disabled={loading}
          >
            Force Complete
          </button>
          <button
            className={styles.cancelTradeBtn}
            onClick={() => handleTradeAction("cancel_trade")}
            disabled={loading}
          >
            Cancel Trade
          </button>
        </>
      )}

      {/* Standard actions */}
      <button
        className={styles.resolveBtn}
        onClick={() => handleAction("resolved")}
        disabled={loading}
      >
        Resolve
      </button>
      <button
        className={styles.dismissBtn}
        onClick={() => handleAction("dismissed")}
        disabled={loading}
      >
        Dismiss
      </button>
      <button
        className={`${styles.banBtn} ${banned ? styles.unbanBtn : ""}`}
        onClick={handleBan}
        disabled={loading}
      >
        {banned ? "Unban User" : "Ban User"}
      </button>
    </div>
  );
}

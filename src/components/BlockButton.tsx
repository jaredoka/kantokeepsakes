"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./BlockButton.module.css";

interface BlockButtonProps {
  userId: string;
  username: string;
  initialBlocked: boolean;
}

export default function BlockButton({ userId, username, initialBlocked }: BlockButtonProps) {
  const router = useRouter();
  const [blocked, setBlocked] = useState(initialBlocked);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!blocked && !window.confirm(`Block ${username}? They won't be able to message you, make offers on your listings, or comment on them.`)) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/blocks", {
        method: blocked ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        setBlocked(!blocked);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className={`${styles.blockBtn} ${blocked ? styles.blocked : ""}`}
      onClick={toggle}
      disabled={busy}
    >
      {busy ? "..." : blocked ? "Unblock" : "Block"}
    </button>
  );
}

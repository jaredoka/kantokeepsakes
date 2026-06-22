"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./ProfileEditForm.module.css";

interface ProfileEditFormProps {
  currentUsername: string;
  currentBio: string | null;
}

export default function ProfileEditForm({
  currentUsername,
  currentBio,
}: ProfileEditFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState(currentUsername);
  const [bio, setBio] = useState(currentBio ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), bio: bio.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update profile.");
        return;
      }

      setSuccess(true);
      setOpen(false);
      // If username changed, navigate to the new URL
      if (data.username !== currentUsername) {
        router.push(`/marketplace/user/${data.username}`);
      } else {
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button className={styles.editBtn} onClick={() => setOpen(true)}>
        Edit Profile
      </button>
    );
  }

  return (
    <div className={styles.formWrapper}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h3 className={styles.formTitle}>Edit Profile</h3>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>Profile updated!</div>}

        <div className={styles.field}>
          <label htmlFor="editUsername" className={styles.label}>
            Username
          </label>
          <input
            id="editUsername"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={styles.input}
            maxLength={20}
            autoComplete="off"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="editBio" className={styles.label}>
            Bio <span className={styles.optional}>(optional)</span>
          </label>
          <textarea
            id="editBio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className={styles.textarea}
            maxLength={500}
            rows={3}
            placeholder="Tell others about yourself..."
          />
          <span className={styles.charCount}>{bio.length}/500</span>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => {
              setOpen(false);
              setUsername(currentUsername);
              setBio(currentBio ?? "");
              setError(null);
            }}
          >
            Cancel
          </button>
          <button type="submit" className={styles.saveBtn} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

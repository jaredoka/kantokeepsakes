"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import ListingCard from "@/components/ListingCard";
import type { Listing } from "@/lib/marketplace/types";
import styles from "./page.module.css";

export default function MyListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setAuthed(false);
        setLoading(false);
        return;
      }

      setAuthed(true);

      const { data } = await supabase
        .from("listings")
        .select("*")
        .eq("user_id", user.id)
        .neq("status", "removed")
        .order("created_at", { ascending: false });

      setListings(data || []);
      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return (
      <main className={styles.main}>
        <p className={styles.loadingText}>Loading...</p>
      </main>
    );
  }

  if (!authed) {
    return (
      <main className={styles.main}>
        <div className={styles.empty}>
          <h1 className={styles.title}>My Listings</h1>
          <p className={styles.emptyText}>
            You need to be logged in to view your listings.
          </p>
          <div className={styles.authLinks}>
            <Link href="/login" className={styles.primaryBtn}>
              Log in
            </Link>
            <Link href="/signup" className={styles.secondaryBtn}>
              Sign up
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>My Listings</h1>
          <Link href="/marketplace/new" className={styles.primaryBtn}>
            + New Listing
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyText}>
              You don&apos;t have any listings yet.
            </p>
            <Link href="/marketplace/new" className={styles.primaryBtn}>
              Create your first listing
            </Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                showStatus
                showActions
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

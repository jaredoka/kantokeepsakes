"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./Header.module.css";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  const isMarketplace = pathname.startsWith("/marketplace");

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    async function fetchUnread(uid: string) {
      const { data: convs } = await supabase
        .from("conversations")
        .select("id")
        .or(`participant_1.eq.${uid},participant_2.eq.${uid}`);

      if (!mounted) return;

      if (!convs || convs.length === 0) {
        setUnreadCount(0);
        return;
      }

      const convIds = convs.map((c) => c.id);
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .in("conversation_id", convIds)
        .eq("is_read", false)
        .neq("sender_id", uid);

      if (mounted) setUnreadCount(count || 0);
    }

    async function loadProfile(uid: string) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", uid)
        .single();
      if (mounted) {
        setUsername(profile?.username ?? null);
        setUserId(uid);
        setAuthLoaded(true);
      }
      fetchUnread(uid);
    }

    // onAuthStateChange fires INITIAL_SESSION immediately on subscribe,
    // providing the current session (including token refresh). This is
    // more reliable than a separate getUser() call which can fail if
    // the access token is momentarily expired.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        if (mounted) {
          setUsername(null);
          setUserId(null);
          setUnreadCount(0);
          setAuthLoaded(true);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Realtime: re-fetch unread count when a new message from someone else arrives
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    async function fetchUnread() {
      const { data: convs } = await supabase
        .from("conversations")
        .select("id")
        .or(`participant_1.eq.${userId},participant_2.eq.${userId}`);

      if (!convs || convs.length === 0) {
        setUnreadCount(0);
        return;
      }

      const convIds = convs.map((c) => c.id);
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .in("conversation_id", convIds)
        .eq("is_read", false)
        .neq("sender_id", userId);

      setUnreadCount(count || 0);
    }

    const channel = supabase
      .channel("header-unread")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as { sender_id: string };
          if (msg.sender_id !== userId) {
            fetchUnread();
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        () => {
          fetchUnread();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && menuOpen) setMenuOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/");
  }

  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        {/* Logo */}
        <Link href="/" className={styles.logoLink}>
          <Image
            src="/images/logo-wordmark-trimmed.png"
            alt="Kanto Keepsakes"
            width={66}
            height={28}
            className={styles.logo}
            priority
          />
        </Link>

        {/* Marketplace — only inline nav link */}
        <Link
          href="/marketplace"
          className={`${styles.marketplaceLink} ${isMarketplace && pathname !== "/marketplace/matches" ? styles.marketplaceLinkActive : ""}`}
        >
          Marketplace
        </Link>
        {authLoaded && username && (
          <Link
            href="/marketplace/matches"
            className={`${styles.marketplaceLink} ${pathname === "/marketplace/matches" ? styles.marketplaceLinkActive : ""}`}
          >
            Matches
          </Link>
        )}

        {/* Right: Avatar → Bell → Hamburger */}
        <div className={styles.rightActions}>
          {authLoaded && username && (
            <button
              className={styles.avatarBtn}
              onClick={() => router.push(`/marketplace/user/${username}`)}
              aria-label={`Profile: ${username}`}
            >
              <span className={styles.avatar}>
                {username.charAt(0).toUpperCase()}
              </span>
              <span className={styles.avatarName}>{username}</span>
            </button>
          )}

          <button
            className={styles.iconBtn}
            onClick={() => router.push("/marketplace/inbox")}
            aria-label="Inbox"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span className={styles.bellBadge}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          <button
            className={styles.iconBtn}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Backdrop */}
      <div
        className={`${styles.backdrop} ${menuOpen ? styles.backdropVisible : ""}`}
        onClick={() => setMenuOpen(false)}
      />

      {/* Drawer */}
      <nav
        className={`${styles.navOverlay} ${menuOpen ? styles.navOpen : ""}`}
        aria-label="Main navigation"
      >
        {authLoaded && (
          <div className={styles.authSection}>
            {username ? (
              <div className={styles.authUser}>
                <span className={styles.username}>{username}</span>
                <button
                  className={styles.mobileLogoutBtn}
                  onClick={handleLogout}
                >
                  Log out
                </button>
              </div>
            ) : (
              <div className={styles.authLinks}>
                <Link
                  href="/login"
                  className={styles.authLink}
                  onClick={() => setMenuOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className={styles.authLinkPrimary}
                  onClick={() => setMenuOpen(false)}
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        )}

        <ul className={styles.navList}>
          <li>
            <Link
              href="/"
              className={styles.navLink}
              onClick={() => setMenuOpen(false)}
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              href="/marketplace"
              className={styles.navLink}
              onClick={() => setMenuOpen(false)}
            >
              Marketplace
            </Link>
          </li>
          <li>
            <Link
              href="/marketplace/matches"
              className={styles.navLink}
              onClick={() => setMenuOpen(false)}
            >
              Matches
            </Link>
          </li>
          <li>
            <Link
              href="/marketplace/inbox"
              className={styles.navLink}
              onClick={() => setMenuOpen(false)}
            >
              Inbox
            </Link>
          </li>
          <li>
            <Link
              href="/about"
              className={styles.navLink}
              onClick={() => setMenuOpen(false)}
            >
              About Us
            </Link>
          </li>
          <li>
            <Link
              href="/contact"
              className={styles.navLink}
              onClick={() => setMenuOpen(false)}
            >
              Contact Us
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}

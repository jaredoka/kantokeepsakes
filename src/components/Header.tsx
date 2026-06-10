"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getCart } from "@/lib/cart";
import { createClient } from "@/lib/supabase/client";
import styles from "./Header.module.css";

export default function Header() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [username, setUsername] = useState<string | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const updateCount = useCallback(() => {
    const cart = getCart();
    setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
  }, []);

  useEffect(() => {
    updateCount();
    window.addEventListener("cart-updated", updateCount);
    return () => window.removeEventListener("cart-updated", updateCount);
  }, [updateCount]);

  useEffect(() => {
    const supabase = createClient();

    async function fetchUnread(userId: string) {
      // Get all conversations this user is part of
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

    async function getSession() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single();
        setUsername(profile?.username ?? null);
        fetchUnread(user.id);
      } else {
        setUsername(null);
        setUnreadCount(0);
      }
      setAuthLoaded(true);
    }

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", session.user.id)
            .single();
          setUsername(profile?.username ?? null);
          fetchUnread(session.user.id);
        } else {
          setUsername(null);
          setUnreadCount(0);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
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
        <Link href="/" className={styles.logoLink}>
          <Image
            src="/images/Kanto-Keepsakes-logo.webp"
            alt="Kanto Keepsakes"
            width={140}
            height={44}
            className={styles.logo}
            priority
          />
        </Link>
        <div className={styles.headerRight}>
          <Link href="/marketplace" className={styles.headerMarketplace}>
            Marketplace
          </Link>
          <button
            className={`${styles.hamburger} ${menuOpen ? styles.hamburgerActive : ""}`}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className={styles.hamburgerLine} />
            <span className={styles.hamburgerLine} />
            <span className={styles.hamburgerLine} />
          </button>
        </div>
      </div>

      <div
        className={`${styles.backdrop} ${menuOpen ? styles.backdropVisible : ""}`}
        onClick={() => setMenuOpen(false)}
      />

      <nav
        className={`${styles.navOverlay} ${menuOpen ? styles.navOpen : ""}`}
        aria-label="Main navigation"
      >
        <ul className={styles.navList}>
          {authLoaded && (
            <li className={styles.authSection}>
              {username ? (
                <div className={styles.authUser}>
                  <span className={styles.username}>{username}</span>
                  <button
                    className={styles.logoutBtn}
                    onClick={handleLogout}
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <div className={styles.authLinks}>
                  <Link href="/login" className={styles.authLink} onClick={() => setMenuOpen(false)}>
                    Log in
                  </Link>
                  <Link href="/signup" className={styles.authLinkPrimary} onClick={() => setMenuOpen(false)}>
                    Sign up
                  </Link>
                </div>
              )}
            </li>
          )}
          <li>
            <Link href="/marketplace" className={`${styles.navLink} ${styles.navMarketplace}`} onClick={() => setMenuOpen(false)}>
              Marketplace
            </Link>
          </li>
          {username && (
            <li>
              <Link href="/marketplace/inbox" className={`${styles.navLink} ${styles.navInbox}`} onClick={() => setMenuOpen(false)}>
                Inbox {unreadCount > 0 && <span className={styles.unreadBadge}>{unreadCount}</span>}
              </Link>
            </li>
          )}
          <li>
            <Link href="/" className={styles.navLink} onClick={() => setMenuOpen(false)}>
              Home
            </Link>
          </li>
          <li>
            <Link href="/japanese" className={styles.navLink} onClick={() => setMenuOpen(false)}>
              Japanese
            </Link>
          </li>
          <li>
            <Link href="/english" className={styles.navLink} onClick={() => setMenuOpen(false)}>
              English
            </Link>
          </li>
          <li>
            <Link href="/accessories" className={styles.navLink} onClick={() => setMenuOpen(false)}>
              TCG Accessories
            </Link>
          </li>
          <li>
            <Link href="/preorder" className={styles.navLink} onClick={() => setMenuOpen(false)}>
              Preorder
            </Link>
          </li>
          <li>
            <Link href="/cart" className={`${styles.navLink} ${styles.navCart}`} onClick={() => setMenuOpen(false)}>
              Cart <span className={styles.cartCount}>{cartCount}</span>
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Marketplace — Kanto Keepsakes",
  description:
    "Community-driven Pokemon TCG marketplace — buy, sell, and trade cards with fellow collectors.",
};

export default function MarketplacePage() {
  return (
    <main
      style={{
        minHeight: "calc(100vh - var(--header-height) - 60px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "2rem 1rem",
      }}
    >
      <h1>Marketplace</h1>
      <p style={{ color: "var(--color-gray-500)", marginTop: "0.5rem" }}>
        Coming soon — a community-driven trade board for Pokemon TCG
      </p>
    </main>
  );
}

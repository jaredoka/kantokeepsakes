import type { Metadata } from "next";
import CategoryPage from "@/components/CategoryPage";

export const metadata: Metadata = {
  title: "Japanese Products — Kanto Keepsakes",
  description:
    "Browse all Japanese Pokemon TCG products — sealed, singles, and graded cards at Kanto Keepsakes.",
};

export default function JapanesePage() {
  return (
    <CategoryPage
      title="Japanese Products"
      subtitle="Browse all Japanese Pokemon TCG products"
      category="japanese"
      showSubnav
    />
  );
}

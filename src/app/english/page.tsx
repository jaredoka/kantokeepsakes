import type { Metadata } from "next";
import CategoryPage from "@/components/CategoryPage";

export const metadata: Metadata = {
  title: "English Products — Kanto Keepsakes",
  description:
    "Browse all English Pokemon TCG products — sealed, singles, and graded cards at Kanto Keepsakes.",
};

export default function EnglishPage() {
  return (
    <CategoryPage
      title="English Products"
      subtitle="Browse all English Pokemon TCG products"
      category="english"
      showSubnav
    />
  );
}

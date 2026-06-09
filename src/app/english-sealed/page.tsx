import type { Metadata } from "next";
import CategoryPage from "@/components/CategoryPage";

export const metadata: Metadata = {
  title: "English Sealed — Kanto Keepsakes",
  description: "English sealed Pokemon TCG products — booster boxes, ETBs, and more.",
};

export default function EnglishSealedPage() {
  return (
    <CategoryPage
      title="English Sealed"
      subtitle="Booster boxes, ETBs & more"
      category="english"
      type="sealed"
    />
  );
}

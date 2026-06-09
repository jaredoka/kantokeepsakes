import type { Metadata } from "next";
import CategoryPage from "@/components/CategoryPage";

export const metadata: Metadata = {
  title: "TCG Accessories — Kanto Keepsakes",
  description:
    "Pokemon TCG accessories — sleeves, deck boxes, playmats, and more at Kanto Keepsakes.",
};

export default function AccessoriesPage() {
  return (
    <CategoryPage
      title="TCG Accessories"
      subtitle="Sleeves, deck boxes, playmats, and more"
      category="accessories"
    />
  );
}

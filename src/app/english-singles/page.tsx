import type { Metadata } from "next";
import CategoryPage from "@/components/CategoryPage";

export const metadata: Metadata = {
  title: "English Singles",
  description: "English Pokemon TCG singles — individual cards at Kanto Keepsakes.",
};

export default function EnglishSinglesPage() {
  return (
    <CategoryPage
      title="English Singles"
      subtitle="Individual cards"
      category="english"
      type="singles"
    />
  );
}

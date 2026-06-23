import type { Metadata } from "next";
import CategoryPage from "@/components/CategoryPage";

export const metadata: Metadata = {
  title: "Japanese Singles",
  description: "Japanese Pokemon TCG singles — individual cards at Kanto Keepsakes.",
};

export default function JapaneseSinglesPage() {
  return (
    <CategoryPage
      title="Japanese Singles"
      subtitle="Individual cards"
      category="japanese"
      type="singles"
    />
  );
}

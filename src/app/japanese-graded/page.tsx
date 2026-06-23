import type { Metadata } from "next";
import CategoryPage from "@/components/CategoryPage";

export const metadata: Metadata = {
  title: "Japanese Graded",
  description: "Japanese graded Pokemon cards — PSA, CGC & more at Kanto Keepsakes.",
};

export default function JapaneseGradedPage() {
  return (
    <CategoryPage
      title="Japanese Graded"
      subtitle="PSA, CGC & more"
      category="japanese"
      type="graded"
    />
  );
}

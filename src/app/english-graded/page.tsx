import type { Metadata } from "next";
import CategoryPage from "@/components/CategoryPage";

export const metadata: Metadata = {
  title: "English Graded",
  description: "English graded Pokemon cards — PSA, CGC & more at Kanto Keepsakes.",
};

export default function EnglishGradedPage() {
  return (
    <CategoryPage
      title="English Graded"
      subtitle="PSA, CGC & more"
      category="english"
      type="graded"
    />
  );
}

import type { Metadata } from "next";
import CategoryPage from "@/components/CategoryPage";

export const metadata: Metadata = {
  title: "Preorder",
  description:
    "Preorder upcoming Pokemon TCG products at Kanto Keepsakes — reserve Japanese and English releases before they drop.",
};

export default function PreorderPage() {
  return (
    <CategoryPage
      title="Preorder"
      subtitle="Reserve upcoming Pokemon TCG products before they release"
      preorder
    />
  );
}

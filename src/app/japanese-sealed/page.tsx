import type { Metadata } from "next";
import CategoryPage from "@/components/CategoryPage";

export const metadata: Metadata = {
  title: "Japanese Sealed",
  description: "Japanese sealed Pokemon TCG products — booster boxes, ETBs, and more.",
};

export default function JapaneseSealedPage() {
  return (
    <CategoryPage
      title="Japanese Sealed"
      subtitle="Booster boxes, ETBs & more"
      category="japanese"
      type="sealed"
    />
  );
}

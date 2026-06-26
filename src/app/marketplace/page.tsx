import type { Metadata } from "next";
import BrowsePage from "./_components/BrowsePage";

export const metadata: Metadata = {
  title: "Marketplace",
  description:
    "Browse cards and products on the Kanto Keepsakes marketplace.",
};

interface MarketplacePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function MarketplacePage({ searchParams }: MarketplacePageProps) {
  return <BrowsePage searchParams={searchParams} />;
}

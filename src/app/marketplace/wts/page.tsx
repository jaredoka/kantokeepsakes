import type { Metadata } from "next";
import BrowsePage from "../_components/BrowsePage";

export const metadata: Metadata = {
  title: "WTS",
  description:
    "Browse cards and products that collectors want to sell on the Kanto Keepsakes marketplace.",
};

interface WtsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function WtsPage({ searchParams }: WtsPageProps) {
  return <BrowsePage listingType="WTS" searchParams={searchParams} />;
}

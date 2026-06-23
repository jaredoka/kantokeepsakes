import type { Metadata } from "next";
import BrowsePage from "../_components/BrowsePage";

export const metadata: Metadata = {
  title: "WTB",
  description:
    "Browse cards and products that collectors are looking to buy on the Kanto Keepsakes marketplace.",
};

interface WtbPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function WtbPage({ searchParams }: WtbPageProps) {
  return <BrowsePage listingType="WTB" searchParams={searchParams} />;
}

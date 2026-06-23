import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://kantokeepsakes.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/marketplace/wts`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/marketplace/wtb`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/safe-trading`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];

  // Fetch active listings for dynamic pages
  let listingPages: MetadataRoute.Sitemap = [];
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data: listings } = await supabase
      .from("listings")
      .select("id, updated_at")
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(1000);

    if (listings) {
      listingPages = listings.map((listing) => ({
        url: `${BASE_URL}/marketplace/${listing.id}`,
        lastModified: new Date(listing.updated_at),
        changeFrequency: "daily" as const,
        priority: 0.7,
      }));
    }
  } catch {
    // If DB query fails, return static pages only
  }

  return [...staticPages, ...listingPages];
}

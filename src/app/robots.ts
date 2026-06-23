import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/marketplace/inbox/", "/marketplace/my-listings/"],
    },
    sitemap: "https://kantokeepsakes.com/sitemap.xml",
  };
}

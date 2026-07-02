import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Kanto Keepsakes — Pokemon TCG",
    template: "%s | Kanto Keepsakes",
  },
  description:
    "Kanto Keepsakes — the peer-to-peer Pokemon TCG marketplace. Post what you have and what you want, negotiate trades, and build your trader reputation.",
  openGraph: {
    title: "Kanto Keepsakes — Pokemon TCG",
    description:
      "The peer-to-peer Pokemon TCG marketplace. Post what you have and what you want, negotiate trades, and build your trader reputation.",
    url: "https://kantokeepsakes.com",
    siteName: "Kanto Keepsakes",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Kanto Keepsakes logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kanto Keepsakes — Pokemon TCG",
    description:
      "The peer-to-peer Pokemon TCG marketplace. Post what you have and what you want, negotiate trades, and build your trader reputation.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}

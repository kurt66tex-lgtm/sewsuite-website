import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const GA_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

export const metadata: Metadata = {
  title: {
    default: "Sew Suite | Custom Embroidery & Branded Apparel — Allen, TX",
    template: "%s | Sew Suite",
  },
  description:
    "Professional custom embroidery and branded apparel for businesses, teams, and organizations in Allen, Lucas, and the DFW area. 17+ years of experience. Fast turnaround. Low minimums.",
  keywords: [
    "custom embroidery Allen TX",
    "branded apparel DFW",
    "logo embroidery",
    "screen printing Allen TX",
    "custom hats",
    "corporate branded apparel",
    "uniform embroidery",
  ],
  openGraph: {
    siteName: "Sew Suite",
    type: "website",
    locale: "en_US",
  },
  metadataBase: new URL("https://sewsuite.com"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}
      </head>
      <body className="min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: {
    default: "NuxCafe — Coffee, pastries & kitchen",
    template: "%s | NuxCafe",
  },
  description:
    "NuxCafe is a cafe operations platform: menu, recipes, pantry stock, kitchen production, orders and sales.",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <SiteHeader />
        {children}
        <footer className="border-t py-6">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground sm:px-6">
            NuxCafe local development environment
          </div>
        </footer>
      </body>
    </html>
  );
}

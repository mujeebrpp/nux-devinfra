import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: {
    default: "NuxWell — Wellness, fitness & community",
    template: "%s | NuxWell",
  },
  description:
    "NuxWell is a wellness platform for facility booking, memberships, family groups and progress tracking.",
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
            NuxWell local development environment
          </div>
        </footer>
      </body>
    </html>
  );
}

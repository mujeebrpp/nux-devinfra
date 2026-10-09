import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const DASHBOARD_SECTIONS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/bookings", label: "Bookings" },
  { href: "/dashboard/memberships", label: "Memberships" },
  { href: "/dashboard/family", label: "Family" },
] as const;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center gap-2 border-b pb-4">
        {DASHBOARD_SECTIONS.map((section, index) => (
          <span key={section.href} className="flex items-center gap-2">
            {index > 0 && <span className="text-muted-foreground">/</span>}
            {index === 0 ? (
              <Link
                href={section.href}
                className="rounded-md px-2 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {section.label}
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 text-sm text-muted-foreground/70">
                {section.label}
                <Badge variant="outline" className="text-[10px]">
                  soon
                </Badge>
              </span>
            )}
          </span>
        ))}
      </div>
      {children}
    </div>
  );
}

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FacilitiesPreview } from "@/components/facilities-preview";
import { HealthBadge } from "@/components/health-badge";

export default function HomePage() {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <section className="container mx-auto flex flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
        <Badge variant="outline" className="mb-6">
          Wellness · Fitness · Community
        </Badge>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          NuxWell
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Your wellness hub — book facilities and classes, manage
          memberships, and track progress for the whole family.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/dashboard">Open dashboard</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
        <div className="mt-8">
          <HealthBadge />
        </div>
      </section>
      <FacilitiesPreview />
    </main>
  );
}

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="container mx-auto flex min-h-[calc(100vh-7rem)] flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
      <h1 className="text-6xl font-bold tracking-tight">404</h1>
      <p className="mt-2 text-muted-foreground">This page could not be found.</p>
      <Button asChild className="mt-6">
        <Link href="/">Back to home</Link>
      </Button>
    </main>
  );
}

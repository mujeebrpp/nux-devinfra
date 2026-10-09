"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, MapPin } from "lucide-react";
import { listFacilities, type FacilityListItem } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function FacilitiesPreview() {
  const [facilities, setFacilities] = useState<FacilityListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    listFacilities()
      .then((response) => {
        if (!cancelled) {
          setFacilities(response.data);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      className="container mx-auto px-4 py-12 sm:px-6"
      aria-labelledby="facilities-heading"
    >
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2
            id="facilities-heading"
            className="text-2xl font-bold tracking-tight sm:text-3xl"
          >
            Facilities &amp; services
          </h2>
          <p className="mt-2 text-muted-foreground">
            Train, stretch and recover across the NuxWell wellness campus.
          </p>
        </div>
        <Button asChild variant="outline" className="hidden sm:inline-flex">
          <Link href="/dashboard">
            View dashboard <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-400"
        >
          Could not load facilities: {error}
        </div>
      )}

      {!error && !facilities && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="h-5 w-32 animate-pulse rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {facilities && facilities.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No facilities available yet.
          </CardContent>
        </Card>
      )}

      {facilities && facilities.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {facilities.map((facility) => (
            <Card key={facility.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle>{facility.name}</CardTitle>
                  <Badge variant="secondary">
                    {facility.type.replaceAll("_", " ")}
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-1">
                  <MapPin className="size-3.5" /> {facility.location}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {facility._count.services} service
                  {facility._count.services === 1 ? "" : "s"} · capacity{" "}
                  {facility.capacity}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

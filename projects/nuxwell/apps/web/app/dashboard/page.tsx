"use client";

import { useEffect, useState } from "react";
import { Activity, Building2, CalendarCheck, Users } from "lucide-react";
import {
  getApiHealth,
  listFacilities,
  type FacilityListItem,
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DashboardState {
  facilities: FacilityListItem[] | null;
  apiStatus: "loading" | "ok" | "error";
  error: string | null;
}

export default function DashboardPage() {
  const [state, setState] = useState<DashboardState>({
    facilities: null,
    apiStatus: "loading",
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([listFacilities(), getApiHealth()]).then(
      ([facilitiesResult, healthResult]) => {
        if (cancelled) {
          return;
        }

        const facilities =
          facilitiesResult.status === "fulfilled"
            ? facilitiesResult.value.data
            : null;
        const apiStatus =
          healthResult.status === "fulfilled" &&
          healthResult.value.status === "ok"
            ? "ok"
            : "error";
        const error =
          facilitiesResult.status === "rejected"
            ? facilitiesResult.reason instanceof Error
              ? facilitiesResult.reason.message
              : "Failed to load facilities"
            : null;

        setState({ facilities, apiStatus, error });
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  const totalServices =
    state.facilities?.reduce(
      (sum, facility) => sum + facility._count.services,
      0,
    ) ?? 0;

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Dashboard
        </h1>
        <p className="mt-1 text-muted-foreground">
          Welcome to your NuxWell workspace.
        </p>
      </div>

      {state.error && (
        <div
          role="alert"
          className="mb-6 rounded-md border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-400"
        >
          {state.error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Facilities</CardTitle>
            <Building2 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {state.facilities ? state.facilities.length : "—"}
            </div>
            <CardDescription>active locations</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Services</CardTitle>
            <Activity className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {state.facilities ? totalServices : "—"}
            </div>
            <CardDescription>bookable across campus</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">API status</CardTitle>
            <CalendarCheck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {state.apiStatus === "ok" ? "Connected" : "—"}
            </div>
            <CardDescription>
              {state.apiStatus === "ok"
                ? "NestJS API on port 3091"
                : "waiting for API"}
            </CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Family group</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <CardDescription>coming soon</CardDescription>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Facilities</CardTitle>
          <CardDescription>Live data from the NuxWell API</CardDescription>
        </CardHeader>
        <CardContent>
          {!state.facilities && !state.error && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Loading facilities…
            </p>
          )}
          {state.facilities && state.facilities.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No facilities found.
            </p>
          )}
          {state.facilities && state.facilities.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Services</TableHead>
                  <TableHead className="text-right">Capacity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.facilities.map((facility) => (
                  <TableRow key={facility.id}>
                    <TableCell className="font-medium">
                      {facility.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {facility.type.replaceAll("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {facility.location}
                    </TableCell>
                    <TableCell className="text-right">
                      {facility._count.services}
                    </TableCell>
                    <TableCell className="text-right">
                      {facility.capacity}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}

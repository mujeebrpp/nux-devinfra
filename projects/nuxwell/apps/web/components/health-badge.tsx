"use client";

import { useEffect, useState } from "react";
import { getApiHealth } from "@/lib/api";
import { cn } from "@/lib/utils";

export function HealthBadge() {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    let cancelled = false;

    getApiHealth()
      .then((health) => {
        if (!cancelled) {
          setState(health.status === "ok" ? "ok" : "error");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <span
      data-state={state}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        state === "ok" &&
          "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400",
        state === "error" &&
          "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
        state === "loading" && "border-border bg-muted text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          state === "ok" && "bg-green-500",
          state === "error" && "bg-red-500",
          state === "loading" && "animate-pulse bg-muted-foreground",
        )}
      />
      {state === "ok" && "API connected"}
      {state === "error" && "API unavailable"}
      {state === "loading" && "Checking API…"}
    </span>
  );
}

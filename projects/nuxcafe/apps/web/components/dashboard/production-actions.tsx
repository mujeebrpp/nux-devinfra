"use client";

import { useRouter } from "next/navigation";
import { useState, type MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  cancelProduction,
  completeProduction,
  startProduction,
  type Production,
} from "@/lib/api/kitchen";

/** Inline action buttons for a production run, based on its status. */
export function ProductionActions({
  production,
}: {
  production: Production;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function run(
    event: MouseEvent<HTMLButtonElement>,
    action: "start" | "complete" | "cancel",
  ) {
    event.preventDefault();
    setPending(true);
    try {
      if (action === "start") {
        await startProduction(production.id);
      } else if (action === "complete") {
        await completeProduction(production.id);
      } else {
        await cancelProduction(production.id);
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (production.status === "QUEUED") {
    return (
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={(event) => run(event, "start")}
        >
          Start
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={(event) => run(event, "cancel")}
        >
          Cancel
        </Button>
      </div>
    );
  }

  if (production.status === "IN_PROGRESS") {
    return (
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={(event) => run(event, "complete")}
        >
          Complete
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={(event) => run(event, "cancel")}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return null;
}

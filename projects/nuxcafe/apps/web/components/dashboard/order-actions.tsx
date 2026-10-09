"use client";

import { useRouter } from "next/navigation";
import { useState, type MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  cancelOrder,
  completeOrder,
  type OrderListItem,
} from "@/lib/api/kitchen";

const ACTIVE_STATUSES = ["PENDING", "PREPARING", "READY"];

/** Inline action buttons for an order, based on its status. */
export function OrderActions({ order }: { order: OrderListItem }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function run(
    event: MouseEvent<HTMLButtonElement>,
    action: "complete" | "cancel",
  ) {
    event.preventDefault();
    setPending(true);
    try {
      if (action === "complete") {
        await completeOrder(order.id);
      } else {
        await cancelOrder(order.id);
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (!ACTIVE_STATUSES.includes(order.status)) {
    return null;
  }

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

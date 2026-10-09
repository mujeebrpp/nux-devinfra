import { Badge } from "@/components/ui/badge";
import {
  OrderStatusSchema,
  ProductionStatusSchema,
} from "@/lib/api/client";
import type {
  OrderStatus,
  ProductionStatus,
} from "@/lib/api/client";

const ORDER_VARIANT: Record<OrderStatus, "default" | "secondary" | "outline" | "destructive"> = {
  PENDING: "default",
  PREPARING: "secondary",
  READY: "outline",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
};

const PRODUCTION_VARIANT: Record<
  ProductionStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  QUEUED: "default",
  IN_PROGRESS: "secondary",
  COMPLETED: "outline",
  CANCELLED: "destructive",
};

export function StatusBadge({
  value,
}: {
  value: OrderStatus | ProductionStatus;
}) {
  const parsedOrder = OrderStatusSchema.safeParse(value);
  const parsedProduction = ProductionStatusSchema.safeParse(value);

  if (parsedOrder.success) {
    return (
      <Badge variant={ORDER_VARIANT[parsedOrder.data]}>
        {parsedOrder.data.replace("_", " ")}
      </Badge>
    );
  }

  if (parsedProduction.success) {
    return (
      <Badge variant={PRODUCTION_VARIANT[parsedProduction.data]}>
        {parsedProduction.data.replace("_", " ")}
      </Badge>
    );
  }

  return <Badge variant="outline">{value}</Badge>;
}

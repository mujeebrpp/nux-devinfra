import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateOrderForm } from "@/components/dashboard/order-form";
import { OrderActions } from "@/components/dashboard/order-actions";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { listOrders } from "@/lib/api/kitchen";
import { formatCents, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "PREPARING", label: "Preparing" },
  { value: "READY", label: "Ready" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeStatus = STATUS_TABS.some((tab) => tab.value === status)
    ? status
    : "";

  const { data: orders } = await listOrders({
    limit: 100,
    ...(activeStatus ? { status: activeStatus } : {}),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            Place orders and move them through the kitchen to completion.
          </p>
        </div>
        <CreateOrderForm />
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <a
            key={tab.value}
            href={`/dashboard/orders${tab.value ? `?status=${tab.value}` : ""}`}
            className={`rounded-md border px-3 py-1.5 text-sm ${
              activeStatus === tab.value
                ? "border-primary bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent"
            }`}
          >
            {tab.label}
          </a>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>
            {activeStatus
              ? `Filtered by ${activeStatus.toLowerCase()}`
              : "All orders, newest first"}
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No orders match this filter.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-2 py-2 font-medium">Number</th>
                    <th className="px-2 py-2 font-medium">Placed</th>
                    <th className="px-2 py-2 font-medium">Items</th>
                    <th className="px-2 py-2 font-medium">Total</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b last:border-0">
                      <td className="px-2 py-2 font-medium">
                        {order.number}
                      </td>
                      <td className="px-2 py-2 text-muted-foreground">
                        {formatDateTime(order.createdAt)}
                      </td>
                      <td className="px-2 py-2">
                        {order.items
                          .map(
                            (item) =>
                              `${item.quantity}× ${item.menuItem.name}`,
                          )
                          .join(", ")}
                      </td>
                      <td className="px-2 py-2">
                        {formatCents(order.totalCents)}
                      </td>
                      <td className="px-2 py-2">
                        <StatusBadge value={order.status} />
                      </td>
                      <td className="px-2 py-2">
                        <OrderActions order={order} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

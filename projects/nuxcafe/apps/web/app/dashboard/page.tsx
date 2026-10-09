import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { getDashboard } from "@/lib/api/dashboard";
import { formatCents, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const dashboard = await getDashboard();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">
          Today&apos;s activity at a glance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Revenue today</CardDescription>
            <CardTitle className="text-2xl">
              {formatCents(dashboard.today.revenueCents)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {dashboard.today.salesCount} sale
            {dashboard.today.salesCount === 1 ? "" : "s"} ·{" "}
            {dashboard.today.ordersCount} order
            {dashboard.today.ordersCount === 1 ? "" : "s"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Kitchen queue</CardDescription>
            <CardTitle className="text-2xl">
              {dashboard.kitchen.queued + dashboard.kitchen.inProgress}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {dashboard.kitchen.queued} queued ·{" "}
            {dashboard.kitchen.inProgress} in progress
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Menu items</CardDescription>
            <CardTitle className="text-2xl">
              {dashboard.counts.menuItems}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {dashboard.counts.recipes} recipes
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pantry</CardDescription>
            <CardTitle className="text-2xl">
              {dashboard.counts.ingredients}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {dashboard.lowStock.length} low on stock
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Low stock</CardTitle>
            <CardDescription>
              Ingredients at or below their minimum level.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                All stocked. Nothing is running low.
              </p>
            ) : (
              <ul className="space-y-2">
                {dashboard.lowStock.map((item) => (
                  <li
                    key={item.slug}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <span>
                      {item.name}{" "}
                      <span className="text-muted-foreground">
                        ({item.quantity} {item.unit} left)
                      </span>
                    </span>
                    <span className="text-muted-foreground">
                      min {item.minQuantity} {item.unit}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent orders</CardTitle>
              <CardDescription>Latest five orders.</CardDescription>
            </div>
            <Link
              href="/dashboard/orders"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {dashboard.recentOrders.map((order) => (
                <li
                  key={order.id}
                  className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                >
                  <div>
                    <div className="font-medium">{order.number}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(order.createdAt)} ·{" "}
                      {order.items.reduce(
                        (sum, item) => sum + item.quantity,
                        0,
                      )}{" "}
                      items
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {formatCents(order.totalCents)}
                    </span>
                    <StatusBadge value={order.status} />
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

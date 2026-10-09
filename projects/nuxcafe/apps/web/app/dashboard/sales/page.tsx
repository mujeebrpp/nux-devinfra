import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSalesSummary, listSales } from "@/lib/api/sales";
import { formatCents, formatDate, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const [summary, sales] = await Promise.all([
    getSalesSummary(),
    listSales({ limit: 20 }),
  ]);

  const maxAmount = Math.max(
    1,
    ...summary.last7Days.map((day) => day.amountCents),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sales</h1>
        <p className="text-muted-foreground">
          {formatCents(summary.total7Days.amountCents)} across{" "}
          {summary.total7Days.orders} orders in the last 7 days.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Today</CardDescription>
            <CardTitle className="text-2xl">
              {formatCents(summary.today.amountCents)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {summary.today.orders} order
            {summary.today.orders === 1 ? "" : "s"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Last 7 days</CardDescription>
            <CardTitle className="text-2xl">
              {formatCents(summary.total7Days.amountCents)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {summary.total7Days.orders} orders
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Daily average (7d)</CardDescription>
            <CardTitle className="text-2xl">
              {formatCents(Math.round(summary.total7Days.amountCents / 7))}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            per day
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue — last 7 days</CardTitle>
          <CardDescription>
            Daily takings, oldest to newest.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-end gap-2">
            {summary.last7Days.map((day) => (
              <div
                key={day.date}
                className="flex flex-1 flex-col items-center gap-1"
                title={`${formatDate(day.date)}: ${formatCents(day.amountCents)} (${day.orders} orders)`}
              >
                <div className="text-xs text-muted-foreground">
                  {formatCents(day.amountCents)}
                </div>
                <div
                  className="w-full rounded-t-sm bg-primary/80"
                  style={{
                    height: `${Math.max(2, Math.round((day.amountCents / maxAmount) * 100))}%`,
                    minHeight: "4px",
                  }}
                />
                <div className="text-xs text-muted-foreground">
                  {formatDate(day.date)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent sales</CardTitle>
          <CardDescription>
            Latest 20 completed sales, newest first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sales.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No sales yet — complete an order to record one.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-2 py-2 font-medium">Sold</th>
                    <th className="px-2 py-2 font-medium">Order</th>
                    <th className="px-2 py-2 font-medium">Items</th>
                    <th className="px-2 py-2 font-medium">Amount</th>
                    <th className="px-2 py-2 font-medium">Order status</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.data.map((sale) => (
                    <tr key={sale.id} className="border-b last:border-0">
                      <td className="px-2 py-2 text-muted-foreground">
                        {formatDateTime(sale.soldAt)}
                      </td>
                      <td className="px-2 py-2 font-medium">
                        {sale.order.number}
                      </td>
                      <td className="px-2 py-2">
                        {sale.itemsCount}
                      </td>
                      <td className="px-2 py-2">
                        {formatCents(sale.amountCents)}
                      </td>
                      <td className="px-2 py-2">
                        {sale.order.status.toLowerCase()}
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

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateProductionForm } from "@/components/dashboard/production-form";
import { ProductionActions } from "@/components/dashboard/production-actions";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { listProductions } from "@/lib/api/kitchen";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "QUEUED", label: "Queued" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

export default async function KitchenPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeStatus = STATUS_TABS.some((tab) => tab.value === status)
    ? status
    : "";

  const { data: productions } = await listProductions({
    limit: 100,
    ...(activeStatus ? { status: activeStatus } : {}),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kitchen</h1>
          <p className="text-muted-foreground">
            Production runs the barista and kitchen team work through.
          </p>
        </div>
        <CreateProductionForm />
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <a
            key={tab.value}
            href={`/dashboard/kitchen${tab.value ? `?status=${tab.value}` : ""}`}
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
          <CardTitle>Production runs</CardTitle>
          <CardDescription>
            {activeStatus
              ? `Filtered by ${activeStatus.toLowerCase().replace("_", " ")}`
              : "All runs, newest first"}
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          {productions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No production runs match this filter.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-2 py-2 font-medium">Menu item</th>
                    <th className="px-2 py-2 font-medium">Qty</th>
                    <th className="px-2 py-2 font-medium">Order</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 font-medium">Started</th>
                    <th className="px-2 py-2 font-medium">Completed</th>
                    <th className="px-2 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {productions.map((production) => (
                    <tr key={production.id} className="border-b last:border-0">
                      <td className="px-2 py-2 font-medium">
                        {production.menuItem.name}
                      </td>
                      <td className="px-2 py-2">
                        {production.quantity}
                      </td>
                      <td className="px-2 py-2">
                        {production.orderId ? (
                          <a
                            href={`/dashboard/orders`}
                            className="text-primary hover:underline"
                          >
                            order
                          </a>
                        ) : (
                          <span className="text-muted-foreground">
                            manual
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        <StatusBadge value={production.status} />
                      </td>
                      <td className="px-2 py-2 text-muted-foreground">
                        {formatDateTime(production.startedAt)}
                      </td>
                      <td className="px-2 py-2 text-muted-foreground">
                        {formatDateTime(production.completedAt)}
                      </td>
                      <td className="px-2 py-2">
                        <ProductionActions production={production} />
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

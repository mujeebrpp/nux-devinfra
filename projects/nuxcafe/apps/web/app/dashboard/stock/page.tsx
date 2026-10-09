import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateStockMovementForm } from "@/components/dashboard/stock-movement-form";
import { getStockLevels, listStockMovements } from "@/lib/api/stock";
import { formatCents, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const MOVEMENT_BADGE: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  PURCHASE: "default",
  USAGE: "secondary",
  WASTE: "destructive",
  ADJUSTMENT: "outline",
};

export default async function StockPage() {
  const [levels, movements] = await Promise.all([
    getStockLevels(),
    listStockMovements({ limit: 20 }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stock</h1>
          <p className="text-muted-foreground">
            {levels.lowStockCount} low on stock · pantry value{" "}
            {formatCents(levels.totalValueCents)}.
          </p>
        </div>
        <CreateStockMovementForm />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current levels</CardTitle>
          <CardDescription>
            On-hand amount for every active ingredient.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-2 py-2 font-medium">Ingredient</th>
                  <th className="px-2 py-2 font-medium">On hand</th>
                  <th className="px-2 py-2 font-medium">Min</th>
                  <th className="px-2 py-2 font-medium">Stock value</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {levels.ingredients.map((ingredient) => (
                  <tr key={ingredient.id} className="border-b last:border-0">
                    <td className="px-2 py-2 font-medium">
                      {ingredient.name}
                    </td>
                    <td className="px-2 py-2">
                      {ingredient.quantity} {ingredient.unit}
                    </td>
                    <td className="px-2 py-2">
                      {ingredient.minQuantity} {ingredient.unit}
                    </td>
                    <td className="px-2 py-2">
                      {formatCents(
                        Math.round(
                          ingredient.costCents * ingredient.quantity,
                        ),
                      )}
                    </td>
                    <td className="px-2 py-2">
                      {ingredient.isLowStock ? (
                        <Badge variant="destructive">low</Badge>
                      ) : (
                        <Badge variant="outline">ok</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent movements</CardTitle>
          <CardDescription>
            Latest 20 stock changes, newest first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {movements.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No stock movements recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-2 py-2 font-medium">When</th>
                    <th className="px-2 py-2 font-medium">Ingredient</th>
                    <th className="px-2 py-2 font-medium">Type</th>
                    <th className="px-2 py-2 font-medium">Quantity</th>
                    <th className="px-2 py-2 font-medium">Reference</th>
                    <th className="px-2 py-2 font-medium">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.data.map((movement) => (
                    <tr key={movement.id} className="border-b last:border-0">
                      <td className="px-2 py-2 text-muted-foreground">
                        {formatDateTime(movement.createdAt)}
                      </td>
                      <td className="px-2 py-2 font-medium">
                        {movement.ingredient.name}
                      </td>
                      <td className="px-2 py-2">
                        <Badge variant={MOVEMENT_BADGE[movement.type]}>
                          {movement.type.toLowerCase()}
                        </Badge>
                      </td>
                      <td className="px-2 py-2">
                        {movement.type === "USAGE" ||
                        movement.type === "WASTE"
                          ? `−${movement.quantity}`
                          : `+${movement.quantity} ${movement.ingredient.unit}`}
                      </td>
                      <td className="px-2 py-2">
                        {movement.reference ?? "—"}
                      </td>
                      <td className="px-2 py-2">
                        {movement.note ?? "—"}
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

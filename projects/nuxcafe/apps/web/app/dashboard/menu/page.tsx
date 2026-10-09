import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateMenuItemForm } from "@/components/dashboard/menu-form";
import { listMenuItems } from "@/lib/api/menu";
import { formatCents } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const { data: items, meta } = await listMenuItems({ limit: 100 });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Menu</h1>
          <p className="text-muted-foreground">
            {meta.total} menu item{meta.total === 1 ? "" : "s"}
            {items.length !== meta.total ? ` (showing ${items.length})` : ""}.
          </p>
        </div>
        <CreateMenuItemForm />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Menu items</CardTitle>
          <CardDescription>
            Active menu items with price, category and recipe ingredient
            count.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No menu items yet — add your first one.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-2 py-2 font-medium">Name</th>
                    <th className="px-2 py-2 font-medium">Category</th>
                    <th className="px-2 py-2 font-medium">Price</th>
                    <th className="px-2 py-2 font-medium">Prep</th>
                    <th className="px-2 py-2 font-medium">Recipe</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="px-2 py-2">
                        <div className="font-medium">{item.name}</div>
                        {item.description ? (
                          <div className="text-xs text-muted-foreground">
                            {item.description}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-2 py-2">
                        <Badge variant="secondary">
                          {item.category.toLowerCase()}
                        </Badge>
                      </td>
                      <td className="px-2 py-2">
                        {formatCents(item.priceCents)}
                      </td>
                      <td className="px-2 py-2">
                        {item.prepMinutes} min
                      </td>
                      <td className="px-2 py-2">
                        {item.recipe && item.recipe._count.items > 0
                          ? `${item.recipe._count.items} ingredient${item.recipe._count.items === 1 ? "" : "s"}`
                          : "—"}
                      </td>
                      <td className="px-2 py-2">
                        <Badge
                          variant={item.isActive ? "outline" : "destructive"}
                        >
                          {item.isActive ? "active" : "inactive"}
                        </Badge>
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

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateIngredientForm } from "@/components/dashboard/ingredient-form";
import { listIngredients } from "@/lib/api/ingredients";
import { formatCents } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function IngredientsPage() {
  const { data: ingredients, meta } = await listIngredients({
    limit: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Ingredients
          </h1>
          <p className="text-muted-foreground">
            {meta.total} pantry item{meta.total === 1 ? "" : "s"}.
          </p>
        </div>
        <CreateIngredientForm />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pantry</CardTitle>
          <CardDescription>
            Stock-keeping units with unit cost and on-hand quantity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ingredients.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No ingredients yet — add your first one.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-2 py-2 font-medium">Name</th>
                    <th className="px-2 py-2 font-medium">Unit</th>
                    <th className="px-2 py-2 font-medium">Cost</th>
                    <th className="px-2 py-2 font-medium">On hand</th>
                    <th className="px-2 py-2 font-medium">Min</th>
                    <th className="px-2 py-2 font-medium">Stock value</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ingredients.map((ingredient) => (
                    <tr key={ingredient.id} className="border-b last:border-0">
                      <td className="px-2 py-2 font-medium">
                        {ingredient.name}
                      </td>
                      <td className="px-2 py-2">{ingredient.unit}</td>
                      <td className="px-2 py-2">
                        {formatCents(ingredient.costCents)}/{ingredient.unit.toLowerCase()}
                      </td>
                      <td className="px-2 py-2">
                        {ingredient.quantity}
                      </td>
                      <td className="px-2 py-2">
                        {ingredient.minQuantity}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}

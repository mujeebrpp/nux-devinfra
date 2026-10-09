import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UpsertRecipeForm } from "@/components/dashboard/recipe-form";
import { listMenuItems, type MenuItemListItem } from "@/lib/api/menu";
import { getRecipe } from "@/lib/api/recipes";

export const dynamic = "force-dynamic";

export default async function RecipesPage() {
  const { data: menuItems } = await listMenuItems({ limit: 100 });

  // Load the recipe of each menu item; missing recipes are listed too.
  const recipes = await Promise.all(
    menuItems.map(async (item) => {
      const detail = await getRecipe(item.slug).catch(() => null);
      return { item, detail };
    }),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Recipes</h1>
          <p className="text-muted-foreground">
            Ingredients per portion for each menu item.
          </p>
        </div>
        <UpsertRecipeForm menuItems={menuItems} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {recipes.map(({ item, detail }) => {
          const recipe = detail?.recipe ?? null;
          return (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>{item.name}</CardTitle>
                  <Badge variant="secondary">
                    {item.category.toLowerCase()}
                  </Badge>
                </div>
                <CardDescription>
                  {recipe
                    ? `${recipe.items.length} ingredient${recipe.items.length === 1 ? "" : "s"} per portion`
                    : "No recipe yet"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!recipe || recipe.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    This menu item has no recipe.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {recipe.items.map((line) => (
                      <li
                        key={line.id}
                        className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm"
                      >
                        <span>{line.ingredient.name}</span>
                        <span className="font-medium">
                          {line.quantity} {line.ingredient.unit}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type MenuItemListItem,
  listMenuItems,
} from "@/lib/api/menu";
import { listIngredients } from "@/lib/api/ingredients";
import { upsertRecipe } from "@/lib/api/recipes";

interface Line {
  id: string;
  ingredientSlug: string;
  quantity: string;
}

export function UpsertRecipeForm({
  menuItems,
}: {
  menuItems: MenuItemListItem[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [menuItemSlug, setMenuItemSlug] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [ingredientOptions, setIngredientOptions] = useState<
    { slug: string; name: string; unit: string }[]
  >([]);

  async function openForm() {
    setOpen(true);
    if (ingredientOptions.length === 0) {
      const { data } = await listIngredients({ limit: 100 });
      setIngredientOptions(
        data.map((ingredient) => ({
          slug: ingredient.slug,
          name: ingredient.name,
          unit: ingredient.unit,
        })),
      );
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!menuItemSlug) {
      setError("Pick a menu item first");
      return;
    }
    setPending(true);
    setError(null);

    const items = lines
      .filter((line) => line.ingredientSlug && Number(line.quantity) > 0)
      .map((line) => ({
        ingredientSlug: line.ingredientSlug,
        quantity: Number(line.quantity),
      }));

    try {
      await upsertRecipe(menuItemSlug, { items });
      router.refresh();
      setOpen(false);
      setLines([]);
      setMenuItemSlug("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save recipe");
    } finally {
      setPending(false);
    }
  }

  function updateLine(id: string, patch: Partial<Line>) {
    setLines((current) =>
      current.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    );
  }

  if (!open) {
    return <Button onClick={openForm}>Edit recipe</Button>;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs"
    >
      <div className="min-w-56">
        <Label htmlFor="rc-item">Menu item</Label>
        <select
          id="rc-item"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          value={menuItemSlug}
          onChange={(event) => setMenuItemSlug(event.target.value)}
        >
          <option value="">Select a menu item…</option>
          {menuItems.map((item) => (
            <option key={item.id} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {lines.map((line, index) => (
          <div key={line.id} className="flex flex-wrap items-end gap-2">
            <div className="min-w-44">
              <Label htmlFor={`rc-ing-${line.id}`}>
                Ingredient {index + 1}
              </Label>
              <select
                id={`rc-ing-${line.id}`}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={line.ingredientSlug}
                onChange={(event) =>
                  updateLine(line.id, { ingredientSlug: event.target.value })
                }
              >
                <option value="">Select…</option>
                {ingredientOptions.map((option) => (
                  <option key={option.slug} value={option.slug}>
                    {option.name} ({option.unit})
                  </option>
                ))}
              </select>
            </div>
            <div className="w-32">
              <Label htmlFor={`rc-qty-${line.id}`}>Quantity</Label>
              <Input
                id={`rc-qty-${line.id}`}
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={line.quantity}
                onChange={(event) =>
                  updateLine(line.id, { quantity: event.target.value })
                }
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setLines((current) =>
                  current.filter((item) => item.id !== line.id),
                )
              }
            >
              Remove
            </Button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setLines((current) => [
              ...current,
              {
                id: `${Date.now()}-${current.length}`,
                ingredientSlug: "",
                quantity: "",
              },
            ])
          }
        >
          Add ingredient line
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save recipe"}
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}
    </form>
  );
}

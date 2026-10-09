"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MenuItemCategorySchema,
  type MenuItemCategory,
} from "@/lib/api/client";
import { createMenuItem } from "@/lib/api/menu";

const CATEGORIES = MenuItemCategorySchema.options;

export function CreateMenuItemForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = event.currentTarget;
    const input = {
      name: (
        form.elements.namedItem("name") as HTMLInputElement
      ).value.trim(),
      category: form.category.value as MenuItemCategory,
      priceCents: Number(form.price.value),
      prepMinutes: form.prepMinutes.value
        ? Number(form.prepMinutes.value)
        : undefined,
      description: form.description.value.trim() || undefined,
    };

    try {
      await createMenuItem(input);
      router.refresh();
      setOpen(false);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create item");
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>Add menu item</Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4 shadow-xs"
    >
      <div className="min-w-40">
        <Label htmlFor="mi-name">Name</Label>
        <Input id="mi-name" name="name" required placeholder="Cappuccino" />
      </div>
      <div className="min-w-32">
        <Label htmlFor="mi-category">Category</Label>
        <select
          id="mi-category"
          name="category"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          defaultValue={CATEGORIES[0]}
        >
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category.toLowerCase()}
            </option>
          ))}
        </select>
      </div>
      <div className="w-28">
        <Label htmlFor="mi-price">Price ($)</Label>
        <Input
          id="mi-price"
          name="price"
          type="number"
          min="0"
          step="0.01"
          required
          placeholder="4.50"
        />
      </div>
      <div className="w-24">
        <Label htmlFor="mi-prep">Prep (min)</Label>
        <Input id="mi-prep" name="prepMinutes" type="number" min="1" placeholder="5" />
      </div>
      <div className="min-w-40 flex-1">
        <Label htmlFor="mi-desc">Description</Label>
        <Input id="mi-desc" name="description" placeholder="Optional" />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Create"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
      </div>
      {error ? (
        <p className="w-full text-sm text-destructive">{error}</p>
      ) : null}
    </form>
  );
}

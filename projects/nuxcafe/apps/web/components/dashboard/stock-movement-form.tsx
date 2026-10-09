"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  StockMovementTypeSchema,
  type StockMovementType,
} from "@/lib/api/client";
import { listIngredients } from "@/lib/api/ingredients";
import { createStockMovement } from "@/lib/api/stock";

const TYPES = StockMovementTypeSchema.options;

export function CreateStockMovementForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [options, setOptions] = useState<
    { slug: string; name: string; unit: string }[]
  >([]);

  async function openForm() {
    setOpen(true);
    if (options.length === 0) {
      const { data } = await listIngredients({ limit: 100 });
      setOptions(
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
    setPending(true);
    setError(null);

    const form = event.currentTarget;
    const input = {
      ingredientSlug: form.ingredient.value,
      type: form.type.value as StockMovementType,
      quantity: Number(form.quantity.value),
      note: form.note.value.trim() || undefined,
      reference: form.reference.value.trim() || undefined,
    };

    try {
      await createStockMovement(input);
      router.refresh();
      setOpen(false);
      form.reset();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to record movement",
      );
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return <Button onClick={openForm}>Record movement</Button>;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4 shadow-xs"
    >
      <div className="min-w-44">
        <Label htmlFor="sm-ing">Ingredient</Label>
        <select
          id="sm-ing"
          name="ingredient"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          required
        >
          <option value="">Select…</option>
          {options.map((option) => (
            <option key={option.slug} value={option.slug}>
              {option.name} ({option.unit})
            </option>
          ))}
        </select>
      </div>
      <div className="w-36">
        <Label htmlFor="sm-type">Type</Label>
        <select
          id="sm-type"
          name="type"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          defaultValue={TYPES[0]}
        >
          {TYPES.map((type) => (
            <option key={type} value={type}>
              {type.toLowerCase()}
            </option>
          ))}
        </select>
      </div>
      <div className="w-24">
        <Label htmlFor="sm-qty">Quantity</Label>
        <Input
          id="sm-qty"
          name="quantity"
          type="number"
          min="0"
          step="any"
          required
          placeholder="0"
        />
      </div>
      <div className="w-36">
        <Label htmlFor="sm-ref">Reference</Label>
        <Input id="sm-ref" name="reference" placeholder="Optional" />
      </div>
      <div className="min-w-40 flex-1">
        <Label htmlFor="sm-note">Note</Label>
        <Input id="sm-note" name="note" placeholder="Optional" />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Record"}
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
      {error ? (
        <p className="w-full text-sm text-destructive">{error}</p>
      ) : null}
    </form>
  );
}

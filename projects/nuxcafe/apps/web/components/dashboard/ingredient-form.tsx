"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  IngredientUnitSchema,
  type IngredientUnit,
} from "@/lib/api/client";
import { createIngredient } from "@/lib/api/ingredients";

const UNITS = IngredientUnitSchema.options;

export function CreateIngredientForm() {
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
      unit: form.unit.value as IngredientUnit,
      costCents: Number(form.cost.value),
      quantity: form.quantity.value ? Number(form.quantity.value) : 0,
      minQuantity: form.minQuantity.value
        ? Number(form.minQuantity.value)
        : 0,
    };

    try {
      await createIngredient(input);
      router.refresh();
      setOpen(false);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add ingredient");
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return <Button onClick={() => setOpen(true)}>Add ingredient</Button>;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4 shadow-xs"
    >
      <div className="min-w-40">
        <Label htmlFor="ing-name">Name</Label>
        <Input id="ing-name" name="name" required placeholder="Whole Milk" />
      </div>
      <div className="w-24">
        <Label htmlFor="ing-unit">Unit</Label>
        <select
          id="ing-unit"
          name="unit"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          defaultValue={UNITS[0]}
        >
          {UNITS.map((unit) => (
            <option key={unit} value={unit}>
              {unit}
            </option>
          ))}
        </select>
      </div>
      <div className="w-24">
        <Label htmlFor="ing-cost">Cost ($)</Label>
        <Input
          id="ing-cost"
          name="cost"
          type="number"
          min="0"
          step="0.01"
          required
          placeholder="0.30"
        />
      </div>
      <div className="w-24">
        <Label htmlFor="ing-qty">On hand</Label>
        <Input id="ing-qty" name="quantity" type="number" min="0" step="any" placeholder="0" />
      </div>
      <div className="w-24">
        <Label htmlFor="ing-min">Min</Label>
        <Input id="ing-min" name="minQuantity" type="number" min="0" step="any" placeholder="0" />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Create"}
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

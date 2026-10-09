"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type MenuItemOption,
  listMenuItemOptions,
  createProduction,
} from "@/lib/api/kitchen";

export function CreateProductionForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [options, setOptions] = useState<MenuItemOption[]>([]);

  async function openForm() {
    setOpen(true);
    if (options.length === 0) {
      setOptions(await listMenuItemOptions());
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = event.currentTarget;
    const input = {
      menuItemSlug: form.menuItem.value,
      quantity: form.quantity.value ? Number(form.quantity.value) : 1,
    };

    try {
      await createProduction(input);
      router.refresh();
      setOpen(false);
      form.reset();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to queue run",
      );
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return <Button onClick={openForm}>Queue production</Button>;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4 shadow-xs"
    >
      <div className="min-w-56">
        <Label htmlFor="prod-item">Menu item</Label>
        <select
          id="prod-item"
          name="menuItem"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          required
        >
          <option value="">Select…</option>
          {options.map((option) => (
            <option key={option.slug} value={option.slug}>
              {option.name}
            </option>
          ))}
        </select>
      </div>
      <div className="w-24">
        <Label htmlFor="prod-qty">Quantity</Label>
        <Input
          id="prod-qty"
          name="quantity"
          type="number"
          min="1"
          max="1000"
          placeholder="1"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Queueing…" : "Queue"}
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

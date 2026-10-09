"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type MenuItemOption,
  createOrder,
  listMenuItemOptions,
} from "@/lib/api/kitchen";

interface Line {
  id: string;
  menuItemSlug: string;
  quantity: string;
}

export function CreateOrderForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [options, setOptions] = useState<MenuItemOption[]>([]);
  const [lines, setLines] = useState<Line[]>([]);

  async function openForm() {
    setOpen(true);
    if (options.length === 0) {
      setOptions(await listMenuItemOptions());
    }
    if (lines.length === 0) {
      setLines([
        { id: `${Date.now()}-0`, menuItemSlug: "", quantity: "1" },
      ]);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const items = lines
      .filter(
        (line) => line.menuItemSlug && Number(line.quantity) > 0,
      )
      .map((line) => ({
        menuItemSlug: line.menuItemSlug,
        quantity: Number(line.quantity),
      }));

    if (items.length === 0) {
      setError("Add at least one order line");
      setPending(false);
      return;
    }

    try {
      await createOrder({ items });
      router.refresh();
      setOpen(false);
      setLines([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order");
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
    return <Button onClick={openForm}>Place order</Button>;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs"
    >
      <div className="space-y-2">
        {lines.map((line, index) => (
          <div key={line.id} className="flex flex-wrap items-end gap-2">
            <div className="min-w-44">
              <Label htmlFor={`ord-item-${line.id}`}>
                Item {index + 1}
              </Label>
              <select
                id={`ord-item-${line.id}`}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={line.menuItemSlug}
                onChange={(event) =>
                  updateLine(line.id, { menuItemSlug: event.target.value })
                }
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
              <Label htmlFor={`ord-qty-${line.id}`}>Qty</Label>
              <Input
                id={`ord-qty-${line.id}`}
                type="number"
                min="1"
                max="100"
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
                menuItemSlug: "",
                quantity: "1",
              },
            ])
          }
        >
          Add line
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Placing…" : "Place order"}
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

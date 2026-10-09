import Link from "next/link";
import {
  ChefHat,
  ClipboardList,
  Coffee,
  LineChart,
  Menu,
  Package,
  ShoppingBag,
  LayoutDashboard,
} from "lucide-react";

const SECTIONS = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    description:
      "Today's revenue, kitchen queue, low-stock alerts and recent orders.",
  },
  {
    href: "/dashboard/menu",
    label: "Menu",
    icon: Coffee,
    description:
      "Sellable drinks, pastries and food — prices, categories and active flag.",
  },
  {
    href: "/dashboard/ingredients",
    label: "Ingredients",
    icon: ShoppingBag,
    description:
      "Pantry SKUs with unit cost, on-hand quantity and low-stock thresholds.",
  },
  {
    href: "/dashboard/recipes",
    label: "Recipes",
    icon: ClipboardList,
    description:
      "Which ingredients (and how much) go into one portion of each menu item.",
  },
  {
    href: "/dashboard/stock",
    label: "Stock",
    icon: Package,
    description:
      "Current stock levels and the full movement log: purchases, usage, waste.",
  },
  {
    href: "/dashboard/kitchen",
    label: "Kitchen",
    icon: ChefHat,
    description:
      "Production runs — queued, in progress, completed or cancelled.",
  },
  {
    href: "/dashboard/orders",
    label: "Orders",
    icon: Menu,
    description:
      "Place orders, watch them move through the kitchen and complete them.",
  },
  {
    href: "/dashboard/sales",
    label: "Sales",
    icon: LineChart,
    description: "Today's takings and the rolling 7-day revenue breakdown.",
  },
];

export default function HomePage() {
  return (
    <main className="container mx-auto px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">NuxCafe</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        A cafe operations platform: menu, recipes, pantry stock, kitchen
        production, orders and sales — backed by a NestJS API and a
        PostgreSQL database.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="flex flex-col gap-2 rounded-xl border bg-card p-5 shadow-xs transition-colors hover:bg-accent/50"
          >
            <span className="flex items-center gap-2 font-semibold">
              <section.icon className="size-4" />
              {section.label}
            </span>
            <span className="text-sm text-muted-foreground">
              {section.description}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}

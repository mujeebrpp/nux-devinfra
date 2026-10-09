import { Menu, ShoppingBag, ChefHat, Package, ClipboardList, LineChart, LayoutDashboard, Coffee } from "lucide-react";
import Link from "next/link";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/menu", label: "Menu", icon: Coffee },
  { href: "/dashboard/ingredients", label: "Ingredients", icon: ShoppingBag },
  { href: "/dashboard/recipes", label: "Recipes", icon: ClipboardList },
  { href: "/dashboard/stock", label: "Stock", icon: Package },
  { href: "/dashboard/kitchen", label: "Kitchen", icon: ChefHat },
  { href: "/dashboard/orders", label: "Orders", icon: Menu },
  { href: "/dashboard/sales", label: "Sales", icon: LineChart },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Coffee className="size-5" />
          <span>NuxCafe</span>
        </Link>
        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto hidden text-xs text-muted-foreground sm:block">
          Cafe operations dashboard
        </div>
      </div>
      <nav className="container mx-auto flex gap-1 overflow-x-auto px-4 py-1.5 md:hidden sm:px-6">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="whitespace-nowrap rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

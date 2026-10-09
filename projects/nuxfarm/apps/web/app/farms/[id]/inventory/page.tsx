import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { fmtDateTime } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function InventoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const farm = await api.farms.get(id).catch(() => null);
  if (!farm) {
    notFound();
  }

  const items = await api.inventory
    .list(id, "?includeInactive=true")
    .catch(() => []);

  const totalValue = items
    .filter((i) => i.active)
    .reduce((sum, i) => sum + (i.unitCost ?? 0) * i.quantity, 0);

  return (
    <div>
      <h1>Inventory</h1>
      <p className="sub">
        <Link href={`/farms/${id}`}>{farm.name}</Link>
      </p>

      <div className="detail-list">
        <div className="kv">
          <div className="k">Items</div>
          <div className="v">{items.length}</div>
        </div>
        <div className="kv">
          <div className="k">Stock value</div>
          <div className="v">
            ${totalValue.toFixed(2)}
          </div>
        </div>
        <div className="kv">
          <div className="k">Low stock</div>
          <div className="v">
            {
              items.filter(
                (i) =>
                  i.active &&
                  i.minQuantity != null &&
                  i.quantity < i.minQuantity,
              ).length
            }
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty">No inventory items.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>SKU</th>
              <th>Category</th>
              <th>On hand</th>
              <th>Min</th>
              <th>Unit cost</th>
              <th>Location</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const low =
                item.active &&
                item.minQuantity != null &&
                item.quantity < item.minQuantity;
              return (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.sku ?? "—"}</td>
                  <td>
                    {item.category.replace(/_/g, " ").toLowerCase()}
                  </td>
                  <td>
                    <strong>
                      {item.quantity} {item.unit}
                    </strong>
                    {low && (
                      <span
                        className="badge high"
                        style={{ marginLeft: 8 }}
                      >
                        low
                      </span>
                    )}
                  </td>
                  <td>{item.minQuantity ?? "—"}</td>
                  <td>
                    {item.unitCost != null
                      ? `$${item.unitCost.toFixed(2)}`
                      : "—"}
                  </td>
                  <td>{item.location?.name ?? "—"}</td>
                  <td>
                    {item.active ? (
                      <span className="badge active">active</span>
                    ) : (
                      <span className="badge">inactive</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <h2>Recent transactions</h2>
      <TransactionFeed items={items} />
    </div>
  );
}

function TransactionFeed({
  items,
}: {
  items: Awaited<ReturnType<typeof api.inventory.list>>;
}) {
  const rows = items
    .flatMap((item) =>
      (item.transactions ?? []).map((tx) => ({
        item,
        tx,
      })),
    )
    .sort(
      (a, b) =>
        (a.tx.transactionAt < b.tx.transactionAt ? 1 : -1),
    )
    .slice(0, 20);

  if (rows.length === 0) {
    return <div className="empty">No transactions yet.</div>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>When</th>
          <th>Item</th>
          <th>Type</th>
          <th>Quantity</th>
          <th>Balance after</th>
          <th>Reference</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ item, tx }) => (
          <tr key={tx.id}>
            <td>{fmtDateTime(tx.transactionAt)}</td>
            <td>{item.name}</td>
            <td>
              <span
                className={`badge ${
                  tx.type === "IN"
                    ? "active"
                    : tx.type === "OUT"
                      ? "high"
                      : ""
                }`}
              >
                {tx.type}
              </span>
            </td>
            <td>
              {tx.quantity} {item.unit}
            </td>
            <td>
              {tx.balanceAfter} {item.unit}
            </td>
            <td>{tx.reference ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

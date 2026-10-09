import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { StatusBadge, fmtDate } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function FarmDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const farm = await api.farms.get(id).catch(() => null);
  if (!farm) {
    notFound();
  }

  const [cycles, tasks, lowStock] = await Promise.all([
    api.cycles.list(id).catch(() => []),
    api.tasks.list(id, "?take=100").catch(() => []),
    api.inventory.lowStock(id).catch(() => []),
  ]);

  const activeCycles = cycles.filter((c) => c.status === "ACTIVE");
  const openTasks = tasks.filter(
    (t) => t.status !== "DONE" && t.status !== "SKIPPED",
  );

  return (
    <div>
      <h1>{farm.name}</h1>
      <p className="sub">
        {farm.code}
        {farm.address ? ` · ${farm.address}` : ""} · {farm.timezone}
      </p>
      {farm.description && <p>{farm.description}</p>}

      <div className="actions">
        <Link className="btn" href={`/farms/${id}/cycles`}>
          Crop cycles
        </Link>
        <Link className="btn secondary" href={`/farms/${id}/tasks`}>
          Tasks
        </Link>
        <Link className="btn secondary" href={`/farms/${id}/irrigation`}>
          Irrigation
        </Link>
        <Link className="btn secondary" href={`/farms/${id}/inventory`}>
          Inventory
        </Link>
        <Link className="btn secondary" href={`/farms/${id}/reports`}>
          Reports
        </Link>
      </div>

      <h2>Locations ({farm.locations?.length ?? 0})</h2>
      {(!farm.locations || farm.locations.length === 0) ? (
        <div className="empty">No locations on this farm yet.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Kind</th>
              <th>Area (m²)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {farm.locations.map((loc) => (
              <tr key={loc.id}>
                <td>{loc.name}</td>
                <td>{loc.code}</td>
                <td>{loc.kind.replace(/_/g, " ").toLowerCase()}</td>
                <td>{loc.areaSqm ?? "—"}</td>
                <td>
                  {loc.active ? (
                    <span className="badge active">active</span>
                  ) : (
                    <span className="badge">inactive</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Active crop cycles ({activeCycles.length})</h2>
      {activeCycles.length === 0 ? (
        <div className="empty">No active cycles.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Cycle</th>
              <th>Crop</th>
              <th>Location</th>
              <th>Started</th>
              <th>Expected end</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {activeCycles.map((cycle) => (
              <tr key={cycle.id}>
                <td>
                  <Link href={`/farms/${id}/cycles/${cycle.id}`}>
                    {cycle.name}
                  </Link>
                </td>
                <td>{cycle.crop}</td>
                <td>{cycle.location?.name ?? "—"}</td>
                <td>{fmtDate(cycle.startDate)}</td>
                <td>{fmtDate(cycle.expectedEndDate)}</td>
                <td>
                  <StatusBadge status={cycle.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Open tasks ({openTasks.length})</h2>
      {openTasks.length === 0 ? (
        <div className="empty">No open tasks.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Due</th>
              <th>Task</th>
              <th>Priority</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {openTasks.slice(0, 8).map((task) => (
              <tr key={task.id}>
                <td>{fmtDate(task.dueDate)}</td>
                <td>{task.title}</td>
                <td>{task.priority}</td>
                <td>
                  <StatusBadge status={task.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Low stock ({lowStock.length})</h2>
      {lowStock.length === 0 ? (
        <div className="empty">Nothing below its minimum quantity.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>SKU</th>
              <th>On hand</th>
              <th>Minimum</th>
            </tr>
          </thead>
          <tbody>
            {lowStock.map((item) => (
              <tr key={item.id}>
                <td>
                  <Link href={`/farms/${id}/inventory`}>{item.name}</Link>
                </td>
                <td>{item.sku ?? "—"}</td>
                <td>
                  {item.quantity} {item.unit}
                </td>
                <td>{item.minQuantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

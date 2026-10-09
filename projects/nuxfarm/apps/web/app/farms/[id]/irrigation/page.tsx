import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import type { IrrigationSummary } from "@/lib/types";
import { fmtDateTime } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function IrrigationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cycleId?: string }>;
}) {
  const { id } = await params;
  const { cycleId } = await searchParams;

  const farm = await api.farms.get(id).catch(() => null);
  if (!farm) {
    notFound();
  }

  const query = cycleId ? `?cycleId=${cycleId}` : "";
  const [logs, summary] = await Promise.all([
    api.irrigation.list(id, query).catch(() => []),
    api.irrigation
      .summary(id, query)
      .catch(() => null as IrrigationSummary | null),
  ]);

  return (
    <div>
      <h1>Irrigation</h1>
      <p className="sub">
        <Link href={`/farms/${id}`}>{farm.name}</Link>
        {cycleId ? ` · cycle ${cycleId}` : ""}
      </p>

      <h2>Summary</h2>
      {summary ? (
        <div className="detail-list">
          <div className="kv">
            <div className="k">Events</div>
            <div className="v">{summary.totalEvents}</div>
          </div>
          <div className="kv">
            <div className="k">Total water</div>
            <div className="v">{summary.totalLiters} L</div>
          </div>
          <div className="kv">
            <div className="k">Total time</div>
            <div className="v">{summary.totalMinutes} min</div>
          </div>
        </div>
      ) : null}
      {Object.keys(summary?.byMethod ?? {}).length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Method</th>
              <th>Events</th>
              <th>Minutes</th>
              <th>Liters</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(summary?.byMethod ?? {}).map(
              ([method, m]) => (
                <tr key={method}>
                  <td>{method.replace(/_/g, " ").toLowerCase()}</td>
                  <td>{m.count}</td>
                  <td>{m.minutes}</td>
                  <td>{m.liters}</td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      )}

      <h2>Events ({logs.length})</h2>
      {logs.length === 0 ? (
        <div className="empty">No irrigation events logged.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Irrigated at</th>
              <th>Method</th>
              <th>Duration</th>
              <th>Volume</th>
              <th>Location</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{fmtDateTime(log.irrigatedAt)}</td>
                <td>{log.method.replace(/_/g, " ").toLowerCase()}</td>
                <td>
                  {log.durationMinutes != null
                    ? `${log.durationMinutes} min`
                    : "—"}
                </td>
                <td>
                  {log.volumeLiters != null
                    ? `${log.volumeLiters} L`
                    : "—"}
                </td>
                <td>{log.location?.name ?? "—"}</td>
                <td>{log.notes ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

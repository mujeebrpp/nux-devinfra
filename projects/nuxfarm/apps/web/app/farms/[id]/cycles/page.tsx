import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { StatusBadge, fmtDate } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function CyclesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { id } = await params;
  const { status } = await searchParams;

  const farm = await api.farms.get(id).catch(() => null);
  if (!farm) {
    notFound();
  }
  const cycles = await api.cycles
    .list(id, status)
    .catch(() => []);

  const counts = cycles.reduce<Record<string, number>>(
    (acc, c) => {
      acc[c.status] = (acc[c.status] ?? 0) + 1;
      return acc;
    },
    {},
  );

  return (
    <div>
      <h1>Crop cycles</h1>
      <p className="sub">
        <Link href={`/farms/${id}`}>{farm.name}</Link>
      </p>

      <div className="actions">
        <Link
          className={`btn ${!status ? "" : "secondary"}`}
          href={`/farms/${id}/cycles`}
        >
          All ({cycles.length})
        </Link>
        {["PLANNED", "ACTIVE", "COMPLETED", "ABANDONED"].map(
          (s) => (
            <Link
              key={s}
              className={`btn ${status === s ? "" : "secondary"}`}
              href={`/farms/${id}/cycles?status=${s}`}
            >
              {s.toLowerCase()} ({counts[s] ?? 0})
            </Link>
          ),
        )}
      </div>

      {cycles.length === 0 ? (
        <div className="empty">No cycles match this filter.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Cycle</th>
              <th>Crop</th>
              <th>Location</th>
              <th>Start</th>
              <th>Expected end</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {cycles.map((cycle) => (
              <tr key={cycle.id}>
                <td>
                  <Link href={`/farms/${id}/cycles/${cycle.id}`}>
                    {cycle.name}
                  </Link>
                </td>
                <td>
                  {cycle.crop}
                  {cycle.variety ? ` (${cycle.variety})` : ""}
                </td>
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
    </div>
  );
}

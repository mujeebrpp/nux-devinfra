import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { StatusBadge, fmtDate } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function CycleDetailPage({
  params,
}: {
  params: Promise<{ id: string; cycleId: string }>;
}) {
  const { id, cycleId } = await params;
  const cycle = await api.cycles
    .get(id, cycleId)
    .catch(() => null);
  if (!cycle) {
    notFound();
  }

  const stages = cycle.stages ?? [];
  const completed = stages.filter(
    (s) => s.status === "COMPLETED",
  ).length;
  const progress =
    stages.length === 0
      ? 0
      : Math.round((completed / stages.length) * 100);

  return (
    <div>
      <h1>{cycle.name}</h1>
      <p className="sub">
        <Link href={`/farms/${id}/cycles`}>Crop cycles</Link>
      </p>

      <div className="actions">
        <Link
          className="btn secondary"
          href={`/farms/${id}/tasks?cycleId=${cycle.id}`}
        >
          Tasks in this cycle
        </Link>
        <Link
          className="btn secondary"
          href={`/farms/${id}/irrigation?cycleId=${cycle.id}`}
        >
          Irrigation for this cycle
        </Link>
      </div>

      <div className="detail-list">
        <div className="kv">
          <div className="k">Crop</div>
          <div className="v">
            {cycle.crop}
            {cycle.variety ? ` — ${cycle.variety}` : ""}
          </div>
        </div>
        <div className="kv">
          <div className="k">Status</div>
          <div className="v">
            <StatusBadge status={cycle.status} />
          </div>
        </div>
        <div className="kv">
          <div className="k">Location</div>
          <div className="v">{cycle.location?.name ?? "—"}</div>
        </div>
        <div className="kv">
          <div className="k">Planting method</div>
          <div className="v">{cycle.plantingMethod ?? "—"}</div>
        </div>
        <div className="kv">
          <div className="k">Start date</div>
          <div className="v">{fmtDate(cycle.startDate)}</div>
        </div>
        <div className="kv">
          <div className="k">Expected end</div>
          <div className="v">{fmtDate(cycle.expectedEndDate)}</div>
        </div>
        <div className="kv">
          <div className="k">Actual end</div>
          <div className="v">{fmtDate(cycle.actualEndDate)}</div>
        </div>
      </div>

      {cycle.notes && <p>{cycle.notes}</p>}

      <h2>Stage timeline ({completed}/{stages.length} complete)</h2>
      <div className="progress" style={{ marginBottom: 16 }}>
        <span style={{ width: `${progress}%` }} />
      </div>

      {stages.length === 0 ? (
        <div className="empty">No stages planned for this cycle.</div>
      ) : (
        <div className="stages">
          {stages.map((stage) => (
            <div key={stage.id} className={`stage ${stage.status.toLowerCase()}`}>
              <div className="seq">{stage.sequence}</div>
              <div>
                <strong>{stage.name}</strong>
                <div className="dates">
                  Planned: {fmtDate(stage.plannedStartDate)} →{" "}
                  {fmtDate(stage.plannedEndDate)}
                  {stage.actualStartDate
                    ? ` · actual: ${fmtDate(stage.actualStartDate)}${
                        stage.actualEndDate
                          ? ` → ${fmtDate(stage.actualEndDate)}`
                          : ""
                      }`
                    : ""}
                </div>
                {stage.notes && (
                  <div className="dates">{stage.notes}</div>
                )}
              </div>
              <StatusBadge status={stage.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

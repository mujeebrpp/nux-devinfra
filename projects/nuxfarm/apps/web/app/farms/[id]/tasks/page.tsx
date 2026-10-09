import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { PriorityBadge, StatusBadge, fmtDate } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function TasksPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    status?: string;
    assigneeId?: string;
    cycleId?: string;
    view?: string;
  }>;
}) {
  const { id } = await params;
  const { status, assigneeId, cycleId, view } =
    await searchParams;

  const farm = await api.farms.get(id).catch(() => null);
  if (!farm) {
    notFound();
  }

  const query = new URLSearchParams();
  if (status) query.set("status", status);
  if (assigneeId) query.set("assigneeId", assigneeId);
  if (cycleId) query.set("cycleId", cycleId);
  const qs = query.toString();

  const tasks = view === "timeline"
    ? await api.tasks.timeline(id, qs ? `?${qs}` : "").catch(() => [])
    : await api.tasks.list(id, qs ? `?${qs}` : "").catch(() => []);

  return (
    <div>
      <h1>Tasks</h1>
      <p className="sub">
        <Link href={`/farms/${id}`}>{farm.name}</Link>
        {cycleId ? ` · cycle ${cycleId}` : ""}
      </p>

      <div className="actions">
        <Link
          className={`btn ${view !== "timeline" ? "" : "secondary"}`}
          href={`/farms/${id}/tasks${qs ? `?${qs}` : ""}`}
        >
          List
        </Link>
        <Link
          className={`btn ${view === "timeline" ? "" : "secondary"}`}
          href={`/farms/${id}/tasks?view=timeline${qs ? `&${qs}` : ""}`}
        >
          Timeline
        </Link>
      </div>

      {tasks.length === 0 ? (
        <div className="empty">No tasks match these filters.</div>
      ) : view === "timeline" ? (
        <div className="card">
          <div className="timeline">
            {tasks.map((task) => (
              <div key={task.id} className="event">
                <div className="when">
                  {task.dueDate
                    ? fmtDate(task.dueDate)
                    : "no date"}
                </div>
                <div className="rail">
                  <div
                    className={`dot ${
                      task.status === "PLANNED" || task.status === "TODO"
                        ? "planned"
                        : ""
                    }`}
                  />
                </div>
                <div className="what">
                  <Link
                    href={`/farms/${id}/tasks?cycleId=${task.cycleId ?? ""}`}
                  >
                    {task.title}
                  </Link>
                  <div className="sub">
                    {task.category
                      ? `${task.category} · `
                      : ""}
                    <PriorityBadge priority={task.priority} />{" "}
                    <StatusBadge status={task.status} />{" "}
                    {task.assignee?.name ?? "unassigned"}
                    {task.location ? ` · ${task.location.name}` : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Due</th>
              <th>Task</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Assignee</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id}>
                <td>{fmtDate(task.dueDate)}</td>
                <td>{task.title}</td>
                <td>{task.category ?? "—"}</td>
                <td>
                  <PriorityBadge priority={task.priority} />
                </td>
                <td>
                  <StatusBadge status={task.status} />
                </td>
                <td>{task.assignee?.name ?? "—"}</td>
                <td>{task.location?.name ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

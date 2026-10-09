import Link from "next/link";
import { api } from "@/lib/api";
import type { Task } from "@/lib/types";
import { PriorityBadge, StatusBadge, fmtDate } from "@/components/ui";

export const dynamic = "force-dynamic";

const OPEN = (status: string) => status !== "DONE" && status !== "SKIPPED";

export default async function Dashboard() {
  const farms = await api.farms.list();

  const overviews = await Promise.all(
    farms.map(async (farm) => {
      const [detail, tasks, lowStock] = await Promise.all([
        api.farms.get(farm.id).catch(() => farm),
        api.tasks.list(farm.id, "?take=500").catch(() => [] as Task[]),
        api.inventory.lowStock(farm.id).catch(() => []),
      ]);
      return { farm, detail, tasks, lowStock };
    }),
  );

  const upcoming = overviews
    .flatMap(({ farm, tasks }) =>
      tasks.filter((t) => OPEN(t.status)).map((task) => ({ farm, task })),
    )
    .filter(
      ({ task }) =>
        task.dueDate !== null &&
        new Date(task.dueDate) <= new Date(Date.now() + 7 * 864e5),
    )
    .sort((a, b) =>
      (a.task.dueDate ?? "") < (b.task.dueDate ?? "") ? -1 : 1,
    )
    .slice(0, 10);

  return (
    <div>
      <h1>Dashboard</h1>
      <p className="sub">
        All farms, upcoming work and low-stock items.
      </p>

      <div className="grid">
        {overviews.map(({ farm, detail, tasks, lowStock }) => {
          const open = tasks.filter((t) => OPEN(t.status)).length;
          const overdue = tasks.filter(
            (t) =>
              OPEN(t.status) &&
              t.dueDate !== null &&
              new Date(t.dueDate) < new Date(),
          ).length;
          return (
            <Link
              key={farm.id}
              href={`/farms/${farm.id}`}
              className="card-link"
            >
              <div className="card">
                <h3>{farm.name}</h3>
                <div className="meta">
                  {farm.code}
                  {farm.address ? ` · ${farm.address}` : ""}
                </div>
                <div
                  className="detail-list"
                  style={{ marginTop: 12, marginBottom: 0 }}
                >
                  <div className="kv">
                    <div className="k">Locations</div>
                    <div className="v">{detail.locations?.length ?? 0}</div>
                  </div>
                  <div className="kv">
                    <div className="k">Open tasks</div>
                    <div className="v">{open}</div>
                  </div>
                  <div className="kv">
                    <div className="k">Overdue</div>
                    <div className="v">{overdue}</div>
                  </div>
                  <div className="kv">
                    <div className="k">Low stock</div>
                    <div className="v">{lowStock.length}</div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <h2>Upcoming tasks (next 7 days)</h2>
      {upcoming.length === 0 ? (
        <div className="empty">No tasks due in the next 7 days.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Due</th>
              <th>Task</th>
              <th>Farm</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Assignee</th>
            </tr>
          </thead>
          <tbody>
            {upcoming.map(({ farm, task }) => (
              <tr key={task.id}>
                <td>{fmtDate(task.dueDate)}</td>
                <td>
                  <Link href={`/farms/${farm.id}/tasks`}>{task.title}</Link>
                </td>
                <td>{farm.name}</td>
                <td>
                  <PriorityBadge priority={task.priority} />
                </td>
                <td>
                  <StatusBadge status={task.status} />
                </td>
                <td>{task.assignee?.name ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

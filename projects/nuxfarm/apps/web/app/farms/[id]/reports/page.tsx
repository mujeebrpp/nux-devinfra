import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { fmtDateTime } from "@/components/ui";
import { GenerateReportPanel } from "@/components/generate-report-panel";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const farm = await api.farms.get(id).catch(() => null);
  if (!farm) {
    notFound();
  }
  const reports = await api.reports
    .list(id)
    .catch(() => []);

  return (
    <div>
      <h1>Reports</h1>
      <p className="sub">
        <Link href={`/farms/${id}`}>{farm.name}</Link>
      </p>

      <h2>Generate</h2>
      <GenerateReportPanel farmId={id} />

      <h2>History ({reports.length})</h2>
      {reports.length === 0 ? (
        <div className="empty">No reports generated yet.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Generated</th>
              <th>Title</th>
              <th>Type</th>
              <th>Period</th>
              <th>By</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id}>
                <td>{fmtDateTime(report.generatedAt)}</td>
                <td>{report.title}</td>
                <td>{report.type.replace(/_/g, " ").toLowerCase()}</td>
                <td>
                  {report.periodStart
                    ? `${fmtDateTime(report.periodStart)} → ${fmtDateTime(report.periodEnd)}`
                    : "—"}
                </td>
                <td>{report.generatedBy?.name ?? "—"}</td>
                <td>
                  <Link
                    href={`/farms/${id}/reports/${report.id}`}
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

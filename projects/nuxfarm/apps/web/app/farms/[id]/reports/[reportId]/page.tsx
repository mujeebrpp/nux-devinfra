import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { fmtDateTime } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string; reportId: string }>;
}) {
  const { id, reportId } = await params;
  const report = await api.reports
    .get(id, reportId)
    .catch(() => null);
  if (!report) {
    notFound();
  }

  let data: unknown = null;
  try {
    data = JSON.parse(report.dataJson);
  } catch {
    data = null;
  }

  return (
    <div>
      <h1>{report.title}</h1>
      <p className="sub">
        <Link href={`/farms/${id}/reports`}>Reports</Link>
        {" · "}
        {report.type.replace(/_/g, " ").toLowerCase()}
        {" · generated "}
        {fmtDateTime(report.generatedAt)}
        {report.generatedBy ? ` by ${report.generatedBy.name}` : ""}
      </p>

      {report.periodStart && (
        <div className="detail-list">
          <div className="kv">
            <div className="k">Period start</div>
            <div className="v">
              {fmtDateTime(report.periodStart)}
            </div>
          </div>
          <div className="kv">
            <div className="k">Period end</div>
            <div className="v">
              {fmtDateTime(report.periodEnd)}
            </div>
          </div>
        </div>
      )}

      <h2>Data</h2>
      {data === null ? (
        <div className="empty">No data stored for this report.</div>
      ) : (
        <pre
          style={{
            background: "var(--panel)",
            border: "1px solid var(--line)",
            borderRadius: 10,
            padding: 16,
            overflowX: "auto",
            fontSize: 13,
          }}
        >
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

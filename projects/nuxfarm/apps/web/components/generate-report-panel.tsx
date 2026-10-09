"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Report } from "@/lib/types";
import { fmtDateTime } from "@/components/ui";

const REPORT_TYPES = [
  "OPERATIONS_OVERVIEW",
  "CROP_CYCLE_SUMMARY",
  "TASK_SUMMARY",
  "IRRIGATION_SUMMARY",
  "INVENTORY_SUMMARY",
] as const;

export function GenerateReportPanel({
  farmId,
}: {
  farmId: string;
}) {
  const [type, setType] = useState<string>("OPERATIONS_OVERVIEW");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Report | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setCreated(null);
    try {
      const report = await api.reports.generate(farmId, {
        type,
        title: title || `${type} report`,
      });
      setCreated(report);
      setTitle("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate report.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label>
        Report type
        <select value={type} onChange={(e) => setType(e.target.value)}>
          {REPORT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </label>
      <label>
        Title
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={`${type} report`}
          maxLength={300}
        />
      </label>
      <div>
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "Generating…" : "Generate report"}
        </button>
      </div>
      {error && <div className="error-box">{error}</div>}
      {created && (
        <div className="card" style={{ borderColor: "var(--accent)" }}>
          <h3>{created.title}</h3>
          <div className="meta">
            Generated {fmtDateTime(created.generatedAt)}
          </div>
          <div style={{ marginTop: 8 }}>
            <Link
              className="btn secondary"
              href={`/farms/${farmId}/reports/${created.id}`}
            >
              View report
            </Link>
          </div>
        </div>
      )}
    </form>
  );
}

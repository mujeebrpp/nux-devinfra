import type { ReactNode } from "react";

export function Badge({
  children,
  tone = "",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const tone = status.toLowerCase().replace(/_/g, "-");
  return <Badge tone={tone}>{status.replace(/_/g, " ")}</Badge>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  return <Badge tone={priority.toLowerCase()}>{priority}</Badge>;
}

export function fmtDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function fmtDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

import type {
  CropCycle,
  CycleStage,
  Farm,
  FarmLocation,
  InventoryItem,
  InventoryTransaction,
  IrrigationLog,
  IrrigationSummary,
  Report,
  Task,
} from "./types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3093";

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`API ${res.status} for ${path}`);
  }
  const json = await res.json();
  return json.data as T;
}

async function apiSend<T>(
  method: "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof json.message === "string"
        ? json.message
        : `API ${res.status} for ${path}`;
    throw new Error(message);
  }
  return json.data as T;
}

function isoDay(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

export const api = {
  farms: {
    list: (includeInactive = false) =>
      apiGet<Farm[]>(
        `/farms${includeInactive ? "?includeInactive=true" : ""}`,
      ),
    get: (id: string) => apiGet<Farm>(`/farms/${id}`),
    create: (input: Record<string, unknown>) =>
      apiSend<Farm>("POST", "/farms", input),
    update: (id: string, input: Record<string, unknown>) =>
      apiSend<Farm>("PATCH", `/farms/${id}`, input),
  },
  locations: {
    list: (farmId: string) =>
      apiGet<FarmLocation[]>(`/farms/${farmId}/locations`),
    create: (farmId: string, input: Record<string, unknown>) =>
      apiSend<FarmLocation>("POST", `/farms/${farmId}/locations`, input),
    update: (id: string, input: Record<string, unknown>) =>
      apiSend<FarmLocation>("PATCH", `/farms/locations/${id}`, input),
  },
  cycles: {
    list: (farmId: string, status?: string) =>
      apiGet<CropCycle[]>(
        `/farms/${farmId}/cycles${status ? `?status=${status}` : ""}`,
      ),
    get: (farmId: string, cycleId: string) =>
      apiGet<CropCycle>(`/farms/${farmId}/cycles/${cycleId}`),
    create: (farmId: string, input: Record<string, unknown>) =>
      apiSend<CropCycle>("POST", `/farms/${farmId}/cycles`, input),
    update: (farmId: string, cycleId: string, input: Record<string, unknown>) =>
      apiSend<CropCycle>(
        "PATCH",
        `/farms/${farmId}/cycles/${cycleId}`,
        input,
      ),
    createStage: (
      farmId: string,
      cycleId: string,
      input: Record<string, unknown>,
    ) =>
      apiSend<CycleStage>(
        "POST",
        `/farms/${farmId}/cycles/${cycleId}/stages`,
        input,
      ),
  },
  tasks: {
    list: (farmId: string, query = "") =>
      apiGet<Task[]>(`/farms/${farmId}/tasks${query}`),
    get: (farmId: string, taskId: string) =>
      apiGet<Task>(`/farms/${farmId}/tasks/${taskId}`),
    create: (farmId: string, input: Record<string, unknown>) =>
      apiSend<Task>("POST", `/farms/${farmId}/tasks`, input),
    update: (farmId: string, taskId: string, input: Record<string, unknown>) =>
      apiSend<Task>("PATCH", `/farms/${farmId}/tasks/${taskId}`, input),
    timeline: (farmId: string, query = "") =>
      apiGet<Task[]>(`/farms/${farmId}/tasks/timeline${query}`),
  },
  irrigation: {
    list: (farmId: string, query = "") =>
      apiGet<IrrigationLog[]>(`/farms/${farmId}/irrigation${query}`),
    summary: (farmId: string, query = "") =>
      apiGet<IrrigationSummary>(
        `/farms/${farmId}/irrigation/summary${query}`,
      ),
    create: (farmId: string, input: Record<string, unknown>) =>
      apiSend<IrrigationLog>("POST", `/farms/${farmId}/irrigation`, input),
    remove: (farmId: string, logId: string) =>
      apiSend<IrrigationLog>("DELETE", `/farms/${farmId}/irrigation/${logId}`),
  },
  inventory: {
    list: (farmId: string, query = "") =>
      apiGet<InventoryItem[]>(`/farms/${farmId}/inventory${query}`),
    get: (farmId: string, itemId: string) =>
      apiGet<InventoryItem>(`/farms/${farmId}/inventory/${itemId}`),
    create: (farmId: string, input: Record<string, unknown>) =>
      apiSend<InventoryItem>("POST", `/farms/${farmId}/inventory`, input),
    update: (farmId: string, itemId: string, input: Record<string, unknown>) =>
      apiSend<InventoryItem>(
        "PATCH",
        `/farms/${farmId}/inventory/${itemId}`,
        input,
      ),
    transaction: (
      farmId: string,
      itemId: string,
      input: Record<string, unknown>,
    ) =>
      apiSend<{ item: InventoryItem; transaction: InventoryTransaction }>(
        "POST",
        `/farms/${farmId}/inventory/${itemId}/transactions`,
        input,
      ),
    lowStock: (farmId: string) =>
      apiGet<InventoryItem[]>(`/farms/${farmId}/inventory/low-stock`),
  },
  reports: {
    list: (farmId: string, type?: string) =>
      apiGet<Report[]>(
        `/farms/${farmId}/reports${type ? `?type=${type}` : ""}`,
      ),
    get: (farmId: string, reportId: string) =>
      apiGet<Report>(`/farms/${farmId}/reports/${reportId}`),
    generate: (farmId: string, input: Record<string, unknown>) =>
      apiSend<Report>("POST", `/farms/${farmId}/reports/generate`, input),
  },
};

export { isoDay };

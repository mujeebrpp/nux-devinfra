/** Types mirroring the NuxFarm API response payloads. */

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Farm {
  id: string;
  name: string;
  code: string;
  description: string | null;
  timezone: string;
  address: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  locations?: FarmLocation[];
}

export interface FarmLocation {
  id: string;
  farmId: string;
  name: string;
  code: string;
  kind: string;
  areaSqm: number | null;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CycleStage {
  id: string;
  cycleId: string;
  name: string;
  sequence: number;
  status: string;
  plannedStartDate: string | null;
  plannedEndDate: string | null;
  actualStartDate: string | null;
  actualEndDate: string | null;
  notes: string | null;
}

export interface CropCycle {
  id: string;
  farmId: string;
  locationId: string;
  name: string;
  crop: string;
  variety: string | null;
  status: string;
  startDate: string;
  expectedEndDate: string | null;
  actualEndDate: string | null;
  plantingMethod: string | null;
  notes: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  location?: FarmLocation;
  stages?: CycleStage[];
}

export interface Task {
  id: string;
  farmId: string;
  locationId: string | null;
  cycleId: string | null;
  title: string;
  description: string | null;
  category: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  startDate: string | null;
  completedAt: string | null;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
  location?: FarmLocation | null;
  cycle?: CropCycle | null;
  assignee?: User | null;
}

export interface IrrigationLog {
  id: string;
  farmId: string;
  locationId: string | null;
  cycleId: string | null;
  irrigatedAt: string;
  method: string;
  durationMinutes: number | null;
  volumeLiters: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  location?: FarmLocation | null;
  cycle?: CropCycle | null;
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  type: string;
  quantity: number;
  balanceAfter: number;
  transactionAt: string;
  reference: string | null;
  notes: string | null;
}

export interface InventoryItem {
  id: string;
  farmId: string;
  locationId: string | null;
  name: string;
  sku: string | null;
  category: string;
  unit: string;
  quantity: number;
  minQuantity: number | null;
  unitCost: number | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  location?: FarmLocation | null;
  transactions?: InventoryTransaction[];
}

export interface Report {
  id: string;
  farmId: string;
  type: string;
  title: string;
  periodStart: string | null;
  periodEnd: string | null;
  filtersJson: string | null;
  dataJson: string;
  generatedById: string | null;
  generatedAt: string;
  farm?: Farm;
  generatedBy?: User | null;
}

/** Envelope returned by every API route. */
export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  code?: string;
  details?: unknown;
}

export interface IrrigationMethodTotals {
  count: number;
  minutes: number;
  liters: number;
}

export interface IrrigationSummary {
  totalEvents: number;
  totalMinutes: number;
  totalLiters: number;
  byMethod: Record<string, IrrigationMethodTotals>;
}

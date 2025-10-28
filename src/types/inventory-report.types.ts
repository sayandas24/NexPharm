// Types for Inventory Report feature

import { MedicineBatchTable } from "./database-types";
import { ShortageItem } from "@/hooks/useShortages";

/**
 * Aggregated inventory metrics for summary display
 */
export interface InventoryMetrics {
  totalMedicines: number;
  totalCostValue: number;
  totalRetailValue: number;
  profitMargin: number;
  belowReorderCount: number;
  fastMovingCount: number;
  slowMovingCount: number;
}

/**
 * Medicine with sales data for movement classification
 */
export interface MedicineMovementData {
  medicineName: string;
  medicineId?: string;
  genericName?: string | null;
  category?: string | null;
  totalQuantitySold: number;
  totalRevenue: number;
  transactionCount: number;
  currentStock: number;
  movementType: "fast" | "slow" | "dead";
}

/**
 * Medicine below reorder level with shortage details
 */
export interface BelowReorderMedicine {
  medicineId: string;
  medicineName: string;
  genericName: string | null;
  category: string | null;
  currentStock: number;
  reorderLevel: number;
  shortageAmount: number;
  mrp: number;
}

/**
 * Sales data from useSales hook
 */
export interface TopMedicine {
  medicine_name: string;
  total_quantity: number;
  total_revenue: number;
  transaction_count: number;
}

/**
 * Time period options for filtering
 */
export type TimePeriod = "daily" | "weekly" | "monthly" | "all";

/**
 * Movement classification thresholds
 */
export const MOVEMENT_THRESHOLDS = {
  FAST_MOVING: 10, // units sold in period
  DEAD_STOCK: 0, // zero sales in period
} as const;

// Utility functions for Inventory Report feature

import { MedicineBatchTable } from "@/types/database-types";
import { ShortageItem } from "@/hooks/useShortages";
import {
  InventoryMetrics,
  MedicineMovementData,
  BelowReorderMedicine,
  TopMedicine,
  MOVEMENT_THRESHOLDS,
} from "@/types/inventory-report.types";

/**
 * Calculate comprehensive inventory metrics from medicines, batches, and shortages
 */
export const calculateInventoryMetrics = (
  medicinesCount: number,
  batches: MedicineBatchTable[],
  shortages: ShortageItem[],
  salesData: TopMedicine[],
  medicines?: any[]
): InventoryMetrics => {
  let totalCostValue = 0;
  let totalRetailValue = 0;

  // If we have batches, calculate from batches (more accurate)
  if (batches && batches.length > 0) {
    totalCostValue = batches.reduce(
      (sum, batch) => sum + (batch.purchase_price || 0) * (batch.available_quantity || 0),
      0
    );

    totalRetailValue = batches.reduce(
      (sum, batch) => sum + (batch.mrp || 0) * (batch.available_quantity || 0),
      0
    );
  } 
  // Fallback: calculate from pharmacy medicines if batches not available
  else if (medicines && medicines.length > 0) {
    medicines.forEach((med: any) => {
      const stockQty = med.stock_quantity || 0;
      const mrp = med.mrp || 0;
      
      // Estimate cost as 70% of MRP (typical pharmacy margin)
      const estimatedCost = mrp * 0.7;
      
      totalRetailValue += mrp * stockQty;
      totalCostValue += estimatedCost * stockQty;
    });
  }

  const profitMargin = totalRetailValue - totalCostValue;

  // Below reorder count from shortages (critical and low-stock only)
  const belowReorderCount = shortages.filter(
    (s) => s.shortageType === "critical" || s.shortageType === "low-stock"
  ).length;

  // Fast/slow moving classification
  const fastMovingCount = salesData.filter(
    (s) => s.total_quantity >= MOVEMENT_THRESHOLDS.FAST_MOVING
  ).length;

  const slowMovingCount = medicinesCount - fastMovingCount;

  return {
    totalMedicines: medicinesCount,
    totalCostValue,
    totalRetailValue,
    profitMargin,
    belowReorderCount,
    fastMovingCount,
    slowMovingCount,
  };
};

/**
 * Classify a medicine's movement type based on sales data
 */
export const classifyMedicineMovement = (
  totalQuantitySold: number
): "fast" | "slow" | "dead" => {
  if (totalQuantitySold === MOVEMENT_THRESHOLDS.DEAD_STOCK) {
    return "dead";
  }

  if (totalQuantitySold >= MOVEMENT_THRESHOLDS.FAST_MOVING) {
    return "fast";
  }

  return "slow";
};

/**
 * Transform shortage items to below reorder medicine format
 */
export const transformToBelowReorderMedicines = (
  shortages: ShortageItem[]
): BelowReorderMedicine[] => {
  return shortages
    .filter(
      (s) => s.shortageType === "critical" || s.shortageType === "low-stock"
    )
    .map((shortage) => ({
      medicineId: shortage.medicineId,
      medicineName: shortage.medicineName,
      genericName: shortage.genericName,
      category: shortage.category,
      currentStock: shortage.currentStock,
      reorderLevel: shortage.reorderLevel,
      shortageAmount: shortage.reorderLevel - shortage.currentStock,
      mrp: shortage.batches[0]?.mrp || 0,
    }))
    .sort((a, b) => {
      // Sort by current stock (zero stock first)
      if (a.currentStock === 0 && b.currentStock !== 0) return -1;
      if (a.currentStock !== 0 && b.currentStock === 0) return 1;
      // Then by shortage amount (descending)
      return b.shortageAmount - a.shortageAmount;
    });
};

/**
 * Combine sales data with current stock to create movement data
 */
export const createMedicineMovementData = (
  salesData: TopMedicine[],
  medicinesMap: Map<string, { currentStock: number; genericName?: string | null; category?: string | null }>
): MedicineMovementData[] => {
  return salesData.map((sale) => {
    const medicineInfo = medicinesMap.get(sale.medicine_name);
    const movementType = classifyMedicineMovement(sale.total_quantity);

    return {
      medicineName: sale.medicine_name,
      genericName: medicineInfo?.genericName,
      category: medicineInfo?.category,
      totalQuantitySold: sale.total_quantity,
      totalRevenue: sale.total_revenue,
      transactionCount: sale.transaction_count,
      currentStock: medicineInfo?.currentStock || 0,
      movementType,
    };
  });
};

/**
 * Format currency in Indian Rupees
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format large numbers with Indian numbering system (lakhs, crores)
 */
export const formatNumber = (num: number): string => {
  if (num >= 10000000) {
    // 1 crore or more
    return `${(num / 10000000).toFixed(2)} Cr`;
  } else if (num >= 100000) {
    // 1 lakh or more
    return `${(num / 100000).toFixed(2)} L`;
  } else if (num >= 1000) {
    // 1 thousand or more
    return `${(num / 1000).toFixed(1)} K`;
  }
  return num.toString();
};

/**
 * Format percentage with 2 decimal places
 */
export const formatPercentage = (value: number, total: number): string => {
  if (total === 0) return "0%";
  return `${((value / total) * 100).toFixed(1)}%`;
};

/**
 * Get severity color class based on stock level
 */
export const getStockSeverityColor = (
  currentStock: number,
  reorderLevel: number
): string => {
  if (currentStock === 0) {
    return "text-red-600 bg-red-50";
  } else if (currentStock < reorderLevel) {
    return "text-yellow-600 bg-yellow-50";
  }
  return "text-green-600 bg-green-50";
};

/**
 * Get movement type badge color
 */
export const getMovementTypeBadgeColor = (
  movementType: "fast" | "slow" | "dead"
): string => {
  switch (movementType) {
    case "fast":
      return "bg-blue-100 text-blue-800";
    case "slow":
      return "bg-gray-100 text-gray-800";
    case "dead":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

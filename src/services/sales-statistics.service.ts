// Sales Statistics Service

import { Kysely } from "kysely";
import { PharmacyDatabase } from "@/types/database-types";

export interface SalesStatistics {
  unitsSoldLast30Days: number;
  averageDailySales: number;
  estimatedDaysUntilStockOut: number | null;
  trend: "increasing" | "stable" | "decreasing";
  lastSaleDate: Date | null;
}

class SalesStatisticsService {
  /**
   * Get sales statistics for a medicine
   */
  async getSalesStatistics(
    db: Kysely<PharmacyDatabase>,
    medicineId: string,
    pharmacyId: string,
    currentStock: number
  ): Promise<SalesStatistics | null> {
    try {
      // Get sales from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get sales from last 15 days (for trend calculation)
      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

      // Get all batches for this medicine
      const batches = await db
        .selectFrom("medicine_batches")
        .select("id")
        .where("medicine_id", "=", medicineId)
        .where("pharmacy_id", "=", pharmacyId)
        .execute();

      const batchIds = batches.map((b) => b.id);

      if (batchIds.length === 0) {
        return this.getEmptyStatistics();
      }

      // Get total sales from last 30 days
      const totalSales = await db
        .selectFrom("sale_items")
        .innerJoin("sales", "sales.id", "sale_items.sale_id")
        .select((eb) => [
          eb.fn.sum<number>("sale_items.quantity").as("total_quantity"),
          eb.fn.max("sales.created_at").as("last_sale_date"),
        ])
        .where("sale_items.medicine_batch_id", "in", batchIds)
        .where("sales.created_at", ">=", thirtyDaysAgo.toISOString())
        .where("sales.pharmacy_id", "=", pharmacyId)
        .executeTakeFirst();

      // Get sales from last 15 days (recent)
      const recentSales = await db
        .selectFrom("sale_items")
        .innerJoin("sales", "sales.id", "sale_items.sale_id")
        .select((eb) => eb.fn.sum<number>("sale_items.quantity").as("total_quantity"))
        .where("sale_items.medicine_batch_id", "in", batchIds)
        .where("sales.created_at", ">=", fifteenDaysAgo.toISOString())
        .where("sales.pharmacy_id", "=", pharmacyId)
        .executeTakeFirst();

      // Get sales from 15-30 days ago (previous period)
      const previousSales = await db
        .selectFrom("sale_items")
        .innerJoin("sales", "sales.id", "sale_items.sale_id")
        .select((eb) => eb.fn.sum<number>("sale_items.quantity").as("total_quantity"))
        .where("sale_items.medicine_batch_id", "in", batchIds)
        .where("sales.created_at", ">=", thirtyDaysAgo.toISOString())
        .where("sales.created_at", "<", fifteenDaysAgo.toISOString())
        .where("sales.pharmacy_id", "=", pharmacyId)
        .executeTakeFirst();

      const unitsSold = Number(totalSales?.total_quantity || 0);
      const recentUnits = Number(recentSales?.total_quantity || 0);
      const previousUnits = Number(previousSales?.total_quantity || 0);

      // Calculate average daily sales (over 30 days)
      const averageDailySales = unitsSold / 30;

      // Calculate trend
      const trend = this.calculateTrend(recentUnits, previousUnits);

      // Estimate days until stock out
      const estimatedDaysUntilStockOut = this.estimateDaysUntilStockOut(
        currentStock,
        averageDailySales
      );

      // Parse last sale date
      const lastSaleDate = totalSales?.last_sale_date
        ? new Date(totalSales.last_sale_date)
        : null;

      return {
        unitsSoldLast30Days: unitsSold,
        averageDailySales: Math.round(averageDailySales * 100) / 100,
        estimatedDaysUntilStockOut,
        trend,
        lastSaleDate,
      };
    } catch (error) {
      console.error("Error fetching sales statistics:", error);
      return this.getEmptyStatistics();
    }
  }

  /**
   * Calculate trend based on recent vs previous sales
   */
  calculateTrend(
    recentSales: number,
    previousSales: number
  ): "increasing" | "stable" | "decreasing" {
    if (previousSales === 0) {
      return recentSales > 0 ? "increasing" : "stable";
    }

    const changePercent = ((recentSales - previousSales) / previousSales) * 100;

    if (changePercent > 10) return "increasing";
    if (changePercent < -10) return "decreasing";
    return "stable";
  }

  /**
   * Estimate days until stock runs out
   */
  estimateDaysUntilStockOut(
    currentStock: number,
    averageDailySales: number
  ): number | null {
    if (averageDailySales === 0 || currentStock === 0) return null;
    return Math.floor(currentStock / averageDailySales);
  }

  /**
   * Get empty statistics object
   */
  private getEmptyStatistics(): SalesStatistics {
    return {
      unitsSoldLast30Days: 0,
      averageDailySales: 0,
      estimatedDaysUntilStockOut: null,
      trend: "stable",
      lastSaleDate: null,
    };
  }
}

// Export singleton instance
export const salesStatisticsService = new SalesStatisticsService();

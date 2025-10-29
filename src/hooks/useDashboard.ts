"use client";
import { useKyselyDB, usePowerSync } from "@/lib/powersync/PowersyncProvider";
import { useCallback, useEffect, useState } from "react";
import { sql } from "kysely";

export type InventoryStatus = "Good" | "Warning" | "Critical";
export type TimePeriod = "today" | "week" | "month" | "year";

export interface DashboardMetrics {
  inventoryStatus: InventoryStatus;
  revenue: number;
  medicinesAvailable: number;
  medicineShortage: number;
}

export interface UseDashboardReturn {
  metrics: DashboardMetrics | null;
  loading: boolean;
  error: Error | null;
  selectedPeriod: TimePeriod;
  setSelectedPeriod: (period: TimePeriod) => void;
  refreshMetrics: () => Promise<void>;
}

export function useDashboard(
  pharmacyId: string | undefined
): UseDashboardReturn {
  const db = useKyselyDB();
  const { isReady, powerSyncDb } = usePowerSync();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("month");

  // Calculate inventory status
  const calculateInventoryStatus =
    useCallback(async (): Promise<InventoryStatus> => {
      if (!isReady || !pharmacyId) return "Good";

      try {
        // Check for out of stock medicines (critical)
        const outOfStockResult = await db
          .selectFrom("pharmacy_medicines")
          .select(db.fn.count("id").as("count"))
          .where("pharmacy_id", "=", pharmacyId)
          .where("stock_quantity", "=", 0)
          .executeTakeFirst();

        const outOfStockCount = Number(outOfStockResult?.count) || 0;

        // Check for expired medicines (critical)
        const now = new Date().toISOString();
        const expiredResult = await db
          .selectFrom("medicine_batches")
          .select(db.fn.count("id").as("count"))
          .where("pharmacy_id", "=", pharmacyId)
          .where("available_quantity", ">", 0)
          .where("expiry_date", "<", now)
          .executeTakeFirst();

        const expiredCount = Number(expiredResult?.count) || 0;

        // If any critical conditions, return Critical
        if (outOfStockCount > 0 || expiredCount > 0) {
          return "Critical";
        }

        // Check for low stock medicines (warning)
        const lowStockResult = await db
          .selectFrom("pharmacy_medicines")
          .select(db.fn.count("id").as("count"))
          .where("pharmacy_id", "=", pharmacyId)
          .where((eb) => eb("stock_quantity", "<", eb.ref("reorder_level")))
          .where("stock_quantity", ">", 0)
          .executeTakeFirst();

        const lowStockCount = Number(lowStockResult?.count) || 0;

        // Check for medicines expiring within 30 days (warning)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const expiringResult = await db
          .selectFrom("medicine_batches")
          .select(db.fn.count("id").as("count"))
          .where("pharmacy_id", "=", pharmacyId)
          .where("available_quantity", ">", 0)
          .where("expiry_date", "<=", thirtyDaysFromNow.toISOString())
          .where("expiry_date", ">=", now)
          .executeTakeFirst();

        const expiringCount = Number(expiringResult?.count) || 0;

        // If any warning conditions, return Warning
        if (lowStockCount > 0 || expiringCount > 0) {
          return "Warning";
        }

        return "Good";
      } catch (err) {
        console.error("Error calculating inventory status:", err);
        return "Good";
      }
    }, [db, isReady, pharmacyId]);

  // Calculate revenue for selected period
  const calculateRevenue = useCallback(
    async (period: TimePeriod): Promise<number> => {
      if (!isReady || !pharmacyId) return 0;

      try {
        const now = new Date();
        let startDate: Date;

        switch (period) {
          case "today":
            startDate = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate()
            );
            break;
          case "week":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "month":
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case "year":
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
        }

        const result = await db
          .selectFrom("sales")
          .select(
            sql<number>`CAST(SUM(net_amount) AS REAL)`.as("total_revenue")
          )
          .where("pharmacy_id", "=", pharmacyId)
          .where("created_at", ">=", startDate.toISOString())
          .executeTakeFirst();

        return Number(result?.total_revenue) || 0;
      } catch (err) {
        console.error("Error calculating revenue:", err);
        return 0;
      }
    },
    [db, isReady, pharmacyId]
  );

  // Calculate medicines available count
  const calculateMedicinesAvailable = useCallback(async (): Promise<number> => {
    if (!isReady || !pharmacyId) return 0;

    try {
      const result = await db
        .selectFrom("pharmacy_medicines")
        .select(db.fn.count("id").as("count"))
        .where("pharmacy_id", "=", pharmacyId)
        .where("stock_quantity", ">", 0)
        .executeTakeFirst();

      return Number(result?.count) || 0;
    } catch (err) {
      console.error("Error calculating medicines available:", err);
      return 0;
    }
  }, [db, isReady, pharmacyId]);

  // Calculate medicine shortage count
  const calculateMedicineShortage = useCallback(async (): Promise<number> => {
    if (!isReady || !pharmacyId) return 0;

    try {
      const result = await db
        .selectFrom("pharmacy_medicines")
        .select(db.fn.count("id").as("count"))
        .where("pharmacy_id", "=", pharmacyId)
        .where((eb) => eb("stock_quantity", "<", eb.ref("reorder_level")))
        .executeTakeFirst();

      return Number(result?.count) || 0;
    } catch (err) {
      console.error("Error calculating medicine shortage:", err);
      return 0;
    }
  }, [db, isReady, pharmacyId]);

  // Fetch all metrics
  const fetchMetrics = useCallback(
    async (showLoading = false) => {
      if (!isReady || !pharmacyId) return;

      try {
        if (showLoading) {
          setLoading(true);
        }
        setError(null);

        // Fetch all metrics in parallel
        const [inventoryStatus, revenue, medicinesAvailable, medicineShortage] =
          await Promise.all([
            calculateInventoryStatus(),
            calculateRevenue(selectedPeriod),
            calculateMedicinesAvailable(),
            calculateMedicineShortage(),
          ]);

        setMetrics({
          inventoryStatus,
          revenue,
          medicinesAvailable,
          medicineShortage,
        });
      } catch (err) {
        console.error("Error fetching dashboard metrics:", err);
        setError(err as Error);
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [
      isReady,
      pharmacyId,
      selectedPeriod,
      calculateInventoryStatus,
      calculateRevenue,
      calculateMedicinesAvailable,
      calculateMedicineShortage,
    ]
  );

  // Refresh metrics manually
  const refreshMetrics = useCallback(async () => {
    await fetchMetrics(true);
  }, [fetchMetrics]);

  // Watch for database changes and auto-refresh
  useEffect(() => {
    if (!isReady || !powerSyncDb || !pharmacyId) return;

    console.log("🔍 Setting up PowerSync watch for dashboard metrics...");
    let aborted = false;

    const setupWatch = async () => {
      // Initial fetch with loading state
      await fetchMetrics(true);

      // Build watch query for pharmacy_medicines
      const query = db
        .selectFrom("pharmacy_medicines")
        .selectAll()
        .where("pharmacy_id", "=", pharmacyId);

      const { sql, parameters } = query.compile();
      const mutableParams = [...parameters];

      try {
        for await (const result of powerSyncDb.watch(sql, mutableParams)) {
          if (aborted) break;
          console.log("🔄 Dashboard data change detected");
          await fetchMetrics(false);
        }
      } catch (error) {
        if (!aborted) {
          console.error("Dashboard watch error:", error);
        }
      }
    };

    setupWatch();

    return () => {
      console.log("🛑 Cleaning up PowerSync dashboard watch");
      aborted = true;
    };
  }, [isReady, powerSyncDb, pharmacyId, fetchMetrics, db]);

  // Refetch when period changes
  useEffect(() => {
    if (isReady && pharmacyId) {
      fetchMetrics(false);
    }
  }, [selectedPeriod, isReady, pharmacyId, fetchMetrics, db]);

  return {
    metrics,
    loading,
    error,
    selectedPeriod,
    setSelectedPeriod,
    refreshMetrics,
  };
}

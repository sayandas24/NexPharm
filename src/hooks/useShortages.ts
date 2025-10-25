// hooks/useShortages.ts
"use client";
import { useKyselyDB, usePowerSync } from "@/lib/powersync/PowersyncProvider";
import { useCallback, useEffect, useState } from "react";

// Types for shortage data
export interface BatchInfo {
  id: string;
  batchNumber: string;
  expiryDate: string;
  availableQuantity: number;
  supplierName: string | null;
  mrp: number;
  daysUntilExpiry: number;
}

export interface ShortageItem {
  medicineId: string;
  medicineName: string;
  genericName: string | null;
  category: string | null;
  medicineGroup: string | null;
  currentStock: number;
  totalStock: number;
  reorderLevel: number;
  shortageType: "critical" | "low-stock" | "expiring";
  batches: BatchInfo[];
  isAcknowledged: boolean;
  acknowledgedBy: string | null;
  acknowledgedAt: string | null;
}

export function useShortages(pharmacyId: string | undefined) {
  const db = useKyselyDB();
  const { isReady, powerSyncDb } = usePowerSync();
  const [shortages, setShortages] = useState<ShortageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Calculate days until expiry
  const calculateDaysUntilExpiry = (expiryDate: string): number => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Fetch shortage data
  const fetchShortages = useCallback(
    async (showLoading = false) => {
      if (!isReady || !pharmacyId) return;

      try {
        if (showLoading) {
          setLoading(true);
        }
        setError(null);

        // fix Query 1: Get all pharmacy medicines with their reorder levels
        const pharmacyMedicines = await db
          .selectFrom("pharmacy_medicines")
          .innerJoin(
            "medicines",
            "medicines.id",
            "pharmacy_medicines.medicine_id"
          )
          .select([
            "medicines.id as medicineId",
            "medicines.name as medicineName",
            "medicines.generic_name as genericName",
            "medicines.category",
            "medicines.medicine_group as medicineGroup",
            "pharmacy_medicines.reorder_level as reorderLevel",
            "pharmacy_medicines.stock_quantity as currentStock",
          ])
          .where("pharmacy_medicines.pharmacy_id", "=", pharmacyId)
          .where("pharmacy_medicines.is_available", "=", 1)
          .execute();

        // Query 2: Calculate actual available quantity and total quantity from medicine_batches
        const batchQuantities = await db
          .selectFrom("medicine_batches")
          .select([
            "medicine_batches.medicine_id as medicineId",
            db.fn
              .sum("medicine_batches.available_quantity")
              .as("totalAvailable"),
            db.fn.sum("medicine_batches.quantity").as("totalQuantity"),
          ])
          .where("medicine_batches.pharmacy_id", "=", pharmacyId)
          .groupBy("medicine_batches.medicine_id")
          .execute();

        // Create maps for medicine quantities
        const availableQuantityMap = new Map<string, number>();
        const totalQuantityMap = new Map<string, number>();
        const medicinesWithBatches = new Set<string>();

        batchQuantities.forEach((batch) => {
          const available = Number(batch.totalAvailable) || 0;
          const total = Number(batch.totalQuantity) || 0;

          availableQuantityMap.set(batch.medicineId, available);
          totalQuantityMap.set(batch.medicineId, total);
          medicinesWithBatches.add(batch.medicineId);
        });

        // Filter medicines: only those with batches
        const lowStockMedicines = pharmacyMedicines
          .filter((med) => medicinesWithBatches.has(med.medicineId)) // Only medicines with batches
          .map((med) => ({
            ...med,
            currentStock: availableQuantityMap.get(med.medicineId) || 0,
            totalStock: totalQuantityMap.get(med.medicineId) || 0,
          }))
          .filter((med) => med.currentStock < med.reorderLevel); // Below reorder level

        // Query 3: Get expiring batches (within 90 days)
        const expiringBatches = await db
          .selectFrom("medicine_batches")
          .innerJoin(
            "medicines",
            "medicines.id",
            "medicine_batches.medicine_id"
          )
          .leftJoin("suppliers", "suppliers.id", "medicine_batches.supplier_id")
          .select([
            "medicines.id as medicineId",
            "medicines.name as medicineName",
            "medicines.generic_name as genericName",
            "medicines.category",
            "medicines.medicine_group as medicineGroup",
            "medicine_batches.id as batchId",
            "medicine_batches.batch_number as batchNumber",
            "medicine_batches.expiry_date as expiryDate",
            "medicine_batches.available_quantity as availableQuantity",
            "medicine_batches.mrp",
            "suppliers.name as supplierName",
          ])
          .where("medicine_batches.pharmacy_id", "=", pharmacyId)
          .where("medicine_batches.available_quantity", ">", 0)
          .execute();

        // Filter expiring batches (within 90 days and not expired)
        const now = new Date();
        const ninetyDaysFromNow = new Date();
        ninetyDaysFromNow.setDate(now.getDate() + 90);

        const filteredExpiringBatches = expiringBatches.filter((batch) => {
          const expiryDate = new Date(batch.expiryDate);
          return expiryDate > now && expiryDate <= ninetyDaysFromNow;
        });

        // Query 4: Get all batches for medicines with shortages
        const medicineIds = [
          ...new Set([
            ...lowStockMedicines.map((m) => m.medicineId),
            ...filteredExpiringBatches.map((b) => b.medicineId),
          ]),
        ];

        const allBatches = await db
          .selectFrom("medicine_batches")
          .leftJoin("suppliers", "suppliers.id", "medicine_batches.supplier_id")
          .select([
            "medicine_batches.medicine_id as medicineId",
            "medicine_batches.id as batchId",
            "medicine_batches.batch_number as batchNumber",
            "medicine_batches.expiry_date as expiryDate",
            "medicine_batches.available_quantity as availableQuantity",
            "medicine_batches.mrp",
            "suppliers.name as supplierName",
          ])
          .where("medicine_batches.pharmacy_id", "=", pharmacyId)
          .where("medicine_batches.available_quantity", ">", 0)
          .where("medicine_batches.medicine_id", "in", medicineIds)
          .execute();

        // Build shortage items map
        const shortageMap = new Map<string, ShortageItem>();

        // Add low stock medicines
        lowStockMedicines.forEach((med) => {
          const shortageType =
            med.currentStock === 0 ? "critical" : "low-stock";

          shortageMap.set(med.medicineId, {
            medicineId: med.medicineId,
            medicineName: med.medicineName,
            genericName: med.genericName,
            category: med.category,
            medicineGroup: med.medicineGroup,
            currentStock: med.currentStock,
            totalStock: med.totalStock,
            reorderLevel: med.reorderLevel,
            shortageType,
            batches: [],
            isAcknowledged: false,
            acknowledgedBy: null,
            acknowledgedAt: null,
          });
        });

        // Add expiring medicines (if not already in map)
        filteredExpiringBatches.forEach((batch) => {
          if (!shortageMap.has(batch.medicineId)) {
            // Only add if medicine has batches
            if (!medicinesWithBatches.has(batch.medicineId)) return;

            const currentStock =
              availableQuantityMap.get(batch.medicineId) || 0;

            // Get medicine info
            const medicineInfo = pharmacyMedicines.find(
              (m) => m.medicineId === batch.medicineId
            );

            if (medicineInfo) {
              shortageMap.set(batch.medicineId, {
                medicineId: batch.medicineId,
                medicineName: batch.medicineName,
                genericName: batch.genericName,
                category: batch.category,
                medicineGroup: batch.medicineGroup,
                currentStock: currentStock,
                totalStock: totalQuantityMap.get(batch.medicineId) || 0,
                reorderLevel: medicineInfo.reorderLevel,
                shortageType: "expiring",
                batches: [],
                isAcknowledged: false,
                acknowledgedBy: null,
                acknowledgedAt: null,
              });
            }
          }
        });

        // Attach batches to shortage items
        allBatches.forEach((batch) => {
          const shortageItem = shortageMap.get(batch.medicineId);
          if (shortageItem) {
            const daysUntilExpiry = calculateDaysUntilExpiry(batch.expiryDate);

            shortageItem.batches.push({
              id: batch.batchId,
              batchNumber: batch.batchNumber,
              expiryDate: batch.expiryDate,
              availableQuantity: batch.availableQuantity,
              supplierName: batch.supplierName,
              mrp: batch.mrp,
              daysUntilExpiry,
            });
          }
        });

        // Sort batches by expiry date (nearest first)
        shortageMap.forEach((item) => {
          item.batches.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
        });

        // Convert map to array and sort by shortage type priority
        const shortageArray = Array.from(shortageMap.values()).sort((a, b) => {
          const priority = { critical: 0, "low-stock": 1, expiring: 2 };
          return priority[a.shortageType] - priority[b.shortageType];
        });

        setShortages(shortageArray);
      } catch (err) {
        console.error("Error fetching shortages:", err);
        setError(err as Error);
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [db, isReady, pharmacyId]
  );

  // Watch for database changes and auto-refresh
  useEffect(() => {
    if (!isReady || !powerSyncDb || !pharmacyId) return;

    console.log("🔍 Setting up PowerSync watch for shortages...");
    let aborted = false;

    const setupWatch = async () => {
      // Initial fetch with loading state
      await fetchShortages(true);

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
          console.log("🔄 Shortage data change detected");
          await fetchShortages(false);
        }
      } catch (error) {
        if (!aborted) {
          console.error("Shortage watch error:", error);
        }
      }
    };

    setupWatch();

    return () => {
      console.log("🛑 Cleaning up PowerSync shortage watch");
      aborted = true;
    };
  }, [isReady, powerSyncDb, pharmacyId, fetchShortages, db]);

  // Update reorder level
  const updateReorderLevel = useCallback(
    async (medicineId: string, newLevel: number): Promise<void> => {
      if (!isReady || !pharmacyId) {
        throw new Error("Database not ready or pharmacy not selected");
      }

      if (newLevel < 0 || !Number.isInteger(newLevel)) {
        throw new Error("Reorder level must be a positive integer");
      }

      try {
        await db
          .updateTable("pharmacy_medicines")
          .set({
            reorder_level: newLevel,
            updated_at: new Date().toISOString(),
          })
          .where("pharmacy_id", "=", pharmacyId)
          .where("medicine_id", "=", medicineId)
          .execute();

        // Refresh shortages after update
        await fetchShortages(false);
      } catch (err) {
        console.error("Error updating reorder level:", err);
        throw err;
      }
    },
    [db, isReady, pharmacyId, fetchShortages]
  );

  // Acknowledge shortage (in-memory for now)
  const acknowledgeShortage = useCallback(
    async (medicineId: string, userId: string): Promise<void> => {
      setShortages((prev) =>
        prev.map((item) =>
          item.medicineId === medicineId
            ? {
                ...item,
                isAcknowledged: true,
                acknowledgedBy: userId,
                acknowledgedAt: new Date().toISOString(),
              }
            : item
        )
      );
    },
    []
  );

  // Refresh shortages manually
  const refreshShortages = useCallback(async () => {
    await fetchShortages(true);
  }, [fetchShortages]);

  // Calculate counts
  const criticalCount = shortages.filter(
    (s) => s.shortageType === "critical"
  ).length;
  const lowStockCount = shortages.filter(
    (s) => s.shortageType === "low-stock"
  ).length;
  const expiringCount = shortages.filter(
    (s) => s.shortageType === "expiring"
  ).length;

  return {
    shortages,
    criticalCount,
    lowStockCount,
    expiringCount,
    loading,
    error,
    refreshShortages,
    updateReorderLevel,
    acknowledgeShortage,
  };
}

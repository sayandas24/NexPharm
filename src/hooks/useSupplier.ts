// hooks/useSuppliers.ts
"use client";

import { useKyselyDB, usePowerSync } from "@/lib/powersync/PowersyncProvider";
import { SuppliersTable } from "@/types/database-types";
import { useCallback, useEffect, useState } from "react";

export function useSuppliers(pharmacyId?: string) {
  const db = useKyselyDB();
  const { isReady, powerSyncDb } = usePowerSync();
  const [suppliers, setSuppliers] = useState<SuppliersTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Fetch all suppliers for a pharmacy
  const fetchSuppliers = useCallback(
    async (showLoading = false) => {
      if (!isReady || !pharmacyId) return;

      try {
        if (showLoading) {
          setLoading(true);
        }

        const result = await db
          .selectFrom("suppliers")
          .selectAll()
          .where("pharmacy_id", "=", pharmacyId)
          .orderBy("name", "asc")
          .execute();

        setSuppliers(result as SuppliersTable[]);
      } catch (error) {
        console.error("Error fetching suppliers:", error);
      } finally {
        if (showLoading) {
          setLoading(false);
        }
        if (isInitialLoad) {
          setIsInitialLoad(false);
        }
      }
    },
    [db, isReady, pharmacyId, isInitialLoad]
  );

  // Watch for database changes and auto-refresh
  useEffect(() => {
    if (!isReady || !powerSyncDb || !pharmacyId) return;

    console.log("🔍 Setting up PowerSync watch for suppliers...");
    let aborted = false;

    const setupWatch = async () => {
      // Initial fetch with loading state
      await fetchSuppliers(true);

      // Build Kysely query
      const query = db
        .selectFrom("suppliers")
        .selectAll()
        .where("pharmacy_id", "=", pharmacyId);

      // Compile to SQL
      const { sql, parameters } = query.compile();

      // Convert readonly array to mutable array for PowerSync
      const mutableParams = [...parameters];

      try {
        for await (const result of powerSyncDb.watch(sql, mutableParams)) {
          if (aborted) break;
          console.log("🔄 Suppliers database change detected");
          await fetchSuppliers(false);
        }
      } catch (error) {
        if (!aborted) {
          console.error("Watch error:", error);
        }
      }
    };

    setupWatch();

    return () => {
      console.log("🛑 Cleaning up PowerSync watch for suppliers");
      aborted = true;
    };
  }, [isReady, powerSyncDb, pharmacyId, fetchSuppliers, db]);

  // Get supplier by ID
  const getSupplierById = useCallback(
    async (supplierId: string) => {
      if (!isReady || !supplierId) return undefined;

      try {
        const supplier = await db
          .selectFrom("suppliers")
          .selectAll()
          .where("id", "=", supplierId)
          .executeTakeFirst();

        return supplier as SuppliersTable | undefined;
      } catch (error) {
        console.error("Error fetching supplier:", error);
        return undefined;
      }
    },
    [db, isReady]
  );

  // Get suppliers by pharmacy ID
  const getSuppliersByPharmacyId = useCallback(
    async (pharmacyId: string) => {
      if (!isReady || !pharmacyId) return [];

      try {
        const result = await db
          .selectFrom("suppliers")
          .selectAll()
          .where("pharmacy_id", "=", pharmacyId)
          .orderBy("name", "asc")
          .execute();

        return result as SuppliersTable[];
      } catch (error) {
        console.error("Error fetching suppliers by pharmacy:", error);
        return [];
      }
    },
    [db, isReady]
  );

  // Search suppliers by name
  const searchSuppliersByName = useCallback(
    async (searchTerm: string, pharmacyId: string) => {
      if (!isReady || !searchTerm || !pharmacyId) return [];

      try {
        const result = await db
          .selectFrom("suppliers")
          .selectAll()
          .where("pharmacy_id", "=", pharmacyId)
          .where((eb) =>
            eb.or([
              eb("name", "like", `%${searchTerm}%`),
              eb("contact_person", "like", `%${searchTerm}%`),
              eb("phone", "like", `%${searchTerm}%`),
            ])
          )
          .orderBy("name", "asc")
          .execute();

        return result as SuppliersTable[];
      } catch (error) {
        console.error("Error searching suppliers:", error);
        return [];
      }
    },
    [db, isReady]
  );

  // Create new supplier
  const createSupplier = useCallback(
    async (
      supplierData: Omit<SuppliersTable, "id" | "created_at" | "updated_at">
    ) => {
      if (!isReady) return undefined;

      try {
        await db
          .insertInto("suppliers")
          .values({
            id: supplierData?.id,
            ...supplierData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .execute();

        await fetchSuppliers(false);
        return supplierData?.id;
      } catch (error) {
        console.error("Error creating supplier:", error);
        throw error;
      }
    },
    [db, isReady, fetchSuppliers]
  );

  // Update supplier
  const updateSupplier = useCallback(
    async (
      supplierId: string,
      updates: Partial<Omit<SuppliersTable, "id" | "created_at" | "updated_at">>
    ) => {
      if (!isReady || !supplierId) return;

      try {
        await db
          .updateTable("suppliers")
          .set({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .where("id", "=", supplierId)
          .execute();

        await fetchSuppliers(false);
      } catch (error) {
        console.error("Error updating supplier:", error);
        throw error;
      }
    },
    [db, isReady, fetchSuppliers]
  );

  // Delete supplier
  const deleteSupplier = useCallback(
    async (supplierId: string) => {
      if (!isReady || !supplierId) return;

      try {
        await db.deleteFrom("suppliers").where("id", "=", supplierId).execute();

        await fetchSuppliers(false);
      } catch (error) {
        console.error("Error deleting supplier:", error);
        throw error;
      }
    },
    [db, isReady, fetchSuppliers]
  );

  return {
    // State
    suppliers,
    loading,
    isReady,

    // Methods
    fetchSuppliers,
    getSupplierById,
    getSuppliersByPharmacyId,
    searchSuppliersByName,
    createSupplier,
    updateSupplier,
    deleteSupplier,
  };
}

// hooks/useMedicines.ts
"use client";
import { useKyselyDB, usePowerSync } from "@/lib/powersync/PowersyncProvider";
import {
  MedicineBatchTable,
  MedicinesTable,
  PharmacyMedicineTable,
} from "@/types/database-types";
import { useCallback, useEffect, useState } from "react";

// Type for joined pharmacy medicine data
interface PharmacyMedicineWithDetails extends MedicinesTable {
  pharmacy_id: string;
  mrp: number;
  stock_quantity: number;
  price_range_min: number;
  price_range_max: number;
  reorder_level: number;
  storage_conditions: string | null;
  is_available: boolean;
}

const selectPharmacyMedicinesFields = [
  "medicines.id",
  "medicines.name",
  "medicines.generic_name",
  "medicines.brand_names",
  "medicines.manufacturer",
  "medicines.category",
  "medicines.strength",
  "medicines.pack_size",
  "medicines.how_to_use",
  "medicines.dosage_adults",
  "medicines.dosage_children",
  "medicines.dosage_elderly",
  "medicines.duration",
  "medicines.side_effects",
  "medicines.warnings",
  "medicines.shelf_life",
  "medicines.barcode",
  "medicines.requires_prescription",
  "medicines.medicine_image_url",
  "medicines.medicine_images",
  "medicines.package_image_url",
  "medicines.unit_type",
  "medicines.medicine_group",
  "medicines.tags",
  "medicines.is_active",
  "medicines.is_otc",
  "medicines.created_at as medicine_created_at",
  "medicines.updated_at as medicine_updated_at",

  // Pharmacy-specific fields from junction table
  "pharmacy_medicines.id as pharmacy_medicine_id",
  "pharmacy_medicines.pharmacy_id",
  "pharmacy_medicines.mrp",
  "pharmacy_medicines.price_range_min",
  "pharmacy_medicines.price_range_max",
  "pharmacy_medicines.stock_quantity",
  "pharmacy_medicines.reorder_level",
  "pharmacy_medicines.storage_conditions",
  "pharmacy_medicines.is_available",
  "pharmacy_medicines.created_at",
  "pharmacy_medicines.updated_at",
];

export function useMedicines(pharmacyId?: string) {
  const db = useKyselyDB();
  const { isReady, powerSyncDb } = usePowerSync();
  const [medicines, setMedicines] = useState<
    (MedicinesTable | PharmacyMedicineWithDetails)[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [batches, setBatches] = useState<MedicineBatchTable[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(false);

  // Fetch all medicines (without setting loading state on updates)
  const fetchMedicines = useCallback(
    async (showLoading = false) => {
      if (!isReady) return;

      try {
        if (showLoading) {
          setLoading(true);
        }

        if (pharmacyId) {
          // CLIENT-SIDE JOIN: Get medicines specific to this pharmacy
          const result = await db
            .selectFrom("pharmacy_medicines")
            .innerJoin(
              "medicines",
              "medicines.id",
              "pharmacy_medicines.medicine_id"
            )
            .select(selectPharmacyMedicinesFields as any)
            .where("pharmacy_medicines.pharmacy_id", "=", pharmacyId)
            .orderBy("medicines.name", "asc")
            .execute();

          setMedicines(
            result as PharmacyMedicineWithDetails[] | MedicinesTable[]
          );
        } else {
          // Get all medicines from master catalog (no pharmacy filter)
          const result = await db
            .selectFrom("medicines")
            .selectAll()
            .orderBy("name", "asc")
            .execute();

          setMedicines(result as MedicinesTable[]);
        }
      } catch (error) {
        console.error("Error fetching medicines:", error);
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

  // ✅ Watch for database changes and auto-refresh
  useEffect(() => {
    if (!isReady || !powerSyncDb) return;

    console.log("🔍 Setting up PowerSync watch for medicines...");
    let aborted = false;

    const setupWatch = async () => {
      // Initial fetch with loading state
      await fetchMedicines(true);

      // Build Kysely query
      const query = pharmacyId
        ? db
            .selectFrom("pharmacy_medicines as pm")
            .innerJoin("medicines as m", "m.id", "pm.medicine_id")
            .selectAll(["m", "pm"])
            .where("pm.pharmacy_id", "=", pharmacyId)
        : db.selectFrom("medicines").selectAll();

      // Compile to SQL
      const { sql, parameters } = query.compile();
      // Convert readonly array to mutable array for PowerSync
      const mutableParams = [...parameters];

      try {
        for await (const result of powerSyncDb.watch(sql, mutableParams)) {
          if (aborted) break;
          console.log("🔄 Database change detected");
          await fetchMedicines(false);
        }
      } catch (error) {
        if (!aborted) {
          console.error("Watch error:", error);
        }
      }
    };

    setupWatch();

    return () => {
      console.log("🛑 Cleaning up PowerSync watch");
      aborted = true;
    };
  }, [isReady, powerSyncDb, pharmacyId, fetchMedicines, db]);

  // Fetch batches for a specific medicine
  const fetchBatchesForMedicine = useCallback(
    async (medicineId: string, pharmacyId?: string, showLoading = false) => {
      if (!isReady || !medicineId) return;

      try {
        if (showLoading) {
          setBatchesLoading(true);
        }

        let query = db
          .selectFrom("medicine_batches")
          .selectAll()
          .where("medicine_id", "=", medicineId)
          .where("available_quantity", ">", 0);

        // Filter by pharmacy if provided
        if (pharmacyId) {
          query = query.where("pharmacy_id", "=", pharmacyId);
        }

        const result = await query.orderBy("expiry_date", "asc").execute();

        setBatches(result as MedicineBatchTable[]);
        return result as MedicineBatchTable[] | [];
      } catch (error) {
        console.error("Error fetching batches:", error);
        return [];
      } finally {
        if (showLoading) {
          setBatchesLoading(false);
        }
      }
    },
    [db, isReady]
  );

  const getBatchesByPharmacy = useCallback(
    async (pharmacyId?: string) => {
      if (!isReady || !pharmacyId) return [];

      try {
        const batches = await db
          .selectFrom("medicine_batches")
          .selectAll()
          .where("pharmacy_id", "=", pharmacyId)
          .orderBy("expiry_date", "asc")
          .execute();

        return batches as MedicineBatchTable[];
      } catch (error) {
        console.error("Error fetching batches:", error);
        return [];
      }
    },
    [db, isReady]
  );

  // Watch batches for a specific medicine
  const watchBatchesForMedicine = useCallback(
    (medicineId: string, pharmacyId?: string) => {
      if (!isReady || !powerSyncDb || !medicineId) return () => {};

      console.log("🔍 Setting up PowerSync watch for medicine batches...");
      let aborted = false;

      const setupWatch = async () => {
        // Initial fetch with loading state
        await fetchBatchesForMedicine(medicineId, pharmacyId, true);

        // Build Kysely query
        let query = db
          .selectFrom("medicine_batches")
          .selectAll()
          .where("medicine_id", "=", medicineId)
          .where("available_quantity", ">", 0);

        if (pharmacyId) {
          query = query.where("pharmacy_id", "=", pharmacyId);
        }

        // Compile to SQL
        const { sql, parameters } = query.compile();
        const mutableParams = [...parameters];

        try {
          for await (const result of powerSyncDb.watch(sql, mutableParams)) {
            if (aborted) break;
            console.log("🔄 Batch data change detected");
            await fetchBatchesForMedicine(medicineId, pharmacyId, false);
          }
        } catch (error) {
          if (!aborted) {
            console.error("Batch watch error:", error);
          }
        }
      };

      setupWatch();

      // Return cleanup function
      return () => {
        console.log("🛑 Cleaning up PowerSync batch watch");
        aborted = true;
      };
    },
    [isReady, powerSyncDb, db, fetchBatchesForMedicine]
  );

  // Search medicine by ID, barcode, or name
  const searchMedicine = useCallback(
    async (
      searchTerm: string,
      pharmacyId?: string,
      searchType?: "id" | "barcode" | "name",
    ) => {
      if (!isReady || !searchTerm) return undefined;
      try {
        // Determine search type
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        let actualSearchType = searchType;

        if (!actualSearchType) {
          if (uuidRegex.test(searchTerm)) {
            actualSearchType = "id";
          } else if (/^\d+$/.test(searchTerm)) {
            actualSearchType = "barcode";
          } else {
            actualSearchType = "name";
          }
        }

        if (pharmacyId) {
          // Search in pharmacy-specific medicines
          let query = db
            .selectFrom("pharmacy_medicines")
            .innerJoin(
              "medicines",
              "medicines.id",
              "pharmacy_medicines.medicine_id"
            )
            .selectAll("medicines")
            .select([
              "pharmacy_medicines.pharmacy_id",
              "pharmacy_medicines.mrp",
              "pharmacy_medicines.stock_quantity",
            ])
            .where("pharmacy_medicines.pharmacy_id", "=", pharmacyId);

          if (actualSearchType === "id") {
            query = query.where("medicines.id", "=", searchTerm);
          } else if (actualSearchType === "barcode") {
            query = query.where("medicines.barcode", "=", searchTerm);
          } else {
            query = query.where("medicines.name", "like", `%${searchTerm}%`);
          }

          const result = await query.executeTakeFirst();

          return result as PharmacyMedicineWithDetails | undefined;
        } else {
          // Search in master medicines catalog
          let query = db.selectFrom("medicines").selectAll();

          if (actualSearchType === "id") {
            query = query.where("id", "=", searchTerm);
          } else if (actualSearchType === "barcode") {
            query = query.where("barcode", "=", searchTerm);
          } else {
            query = query.where("name", "like", `%${searchTerm}%`);
          }

          const result = await query.executeTakeFirst();
          return result as MedicinesTable | undefined;
        }
      } catch (error) {
        console.error("Error searching medicine:", error);
        return undefined;
      }
    },
    [db, isReady]
  );

  // Search multiple medicines by name (returns array)
  const searchMedicinesByName = useCallback(
    async (searchTerm: string, pharmacyId?: string) => {
      if (!isReady || !searchTerm) return [];

      try {
        if (pharmacyId) {
          const result = await db
            .selectFrom("pharmacy_medicines")
            .innerJoin(
              "medicines",
              "medicines.id",
              "pharmacy_medicines.medicine_id"
            )
            .select([
              // Medicine fields from global catalog
              "medicines.id",
              "medicines.name",
              "medicines.generic_name",
              "medicines.brand_names",
              "medicines.manufacturer",
              "medicines.category",
              "medicines.strength",
              "medicines.pack_size",
              "medicines.how_to_use",
              "medicines.dosage_adults",
              "medicines.dosage_children",
              "medicines.dosage_elderly",
              "medicines.duration",
              "medicines.side_effects",
              "medicines.warnings",
              "medicines.shelf_life",
              "medicines.barcode",
              "medicines.requires_prescription",
              "medicines.medicine_image_url",
              "medicines.medicine_images",
              "medicines.package_image_url",
              "medicines.unit_type",
              "medicines.medicine_group",
              "medicines.tags",
              "medicines.is_active",
              "medicines.is_otc",
              "medicines.created_at as medicine_created_at",
              "medicines.updated_at as medicine_updated_at",

              // Pharmacy-specific fields from junction table
              "pharmacy_medicines.id as pharmacy_medicine_id",
              "pharmacy_medicines.pharmacy_id",
              "pharmacy_medicines.mrp",
              "pharmacy_medicines.price_range_min",
              "pharmacy_medicines.price_range_max",
              "pharmacy_medicines.stock_quantity",
              "pharmacy_medicines.reorder_level",
              "pharmacy_medicines.storage_conditions",
              "pharmacy_medicines.is_available",
              "pharmacy_medicines.created_at",
              "pharmacy_medicines.updated_at",
            ])
            .where("pharmacy_medicines.pharmacy_id", "=", pharmacyId)
            .where((eb) =>
              eb.or([
                eb("medicines.name", "like", `%${searchTerm}%`),
                eb("medicines.category", "like", `%${searchTerm}%`),
                eb("medicines.medicine_group", "like", `%${searchTerm}%`),
                eb("medicines.generic_name", "like", `%${searchTerm}%`),
              ])
            )
            .orderBy("medicines.name", "asc")
            .execute();

          return result as PharmacyMedicineWithDetails[] | MedicinesTable[];
        } else {
          const result = await db
            .selectFrom("medicines")
            .selectAll()
            .where((eb) =>
              eb.or([
                eb("name", "like", `%${searchTerm}%`),
                eb("category", "like", `%${searchTerm}%`),
                eb("medicine_group", "like", `%${searchTerm}%`),
                eb("generic_name", "like", `%${searchTerm}%`),
              ])
            )
            .orderBy("name", "asc")
            .execute();

          return result as MedicinesTable[];
        }
      } catch (error) {
        console.error("Error searching medicines:", error);
        return [];
      }
    },
    [db, isReady]
  );

  // Get batch by ID
  const getBatchByNum = useCallback(
    async (batchNum: string) => {
      if (!isReady || !batchNum) return undefined;

      try {
        const batch = await db
          .selectFrom("medicine_batches")
          .selectAll()
          .where("batch_number", "=", batchNum)
          .executeTakeFirst();

        return batch as MedicineBatchTable | undefined;
      } catch (error) {
        console.error("Error fetching batch:", error);
        return undefined;
      }
    },
    [db, isReady]
  );

  const getMedicineById = useCallback(
    async (medicineId?: string) => {
      if (!isReady || !medicineId) return undefined;

      try {
        if (medicineId) {
          // CLIENT-SIDE JOIN: Get medicines specific to this pharmacy
          const result = await db
            .selectFrom("pharmacy_medicines")
            .innerJoin(
              "medicines",
              "medicines.id",
              "pharmacy_medicines.medicine_id"
            )
            .select(selectPharmacyMedicinesFields as any)
            .where("pharmacy_medicines.medicine_id", "=", medicineId)
            .orderBy("medicines.name", "asc")
            .execute();

          return result[0] as PharmacyMedicineWithDetails | any;
        }
      } catch (error) {
        console.error("Error fetching medicine:", error);
        return [];
      }
    },
    [db, isReady]
  );

  return {
    // State
    medicines,
    loading,
    isReady,
    batches,
    batchesLoading,

    // Methods
    fetchMedicines,
    fetchBatchesForMedicine,
    watchBatchesForMedicine,
    searchMedicine,
    searchMedicinesByName,
    getBatchByNum,
    getMedicineById,
    getBatchesByPharmacy
  };
}

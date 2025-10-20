// hooks/use-medicines.ts
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

export function useMedicines(pharmacyId?: string) {
  const db = useKyselyDB();
  const { isReady } = usePowerSync();
  const [medicines, setMedicines] = useState<
    (MedicinesTable | PharmacyMedicineWithDetails)[]
  >([]);
  const [batches, setBatches] = useState<MedicineBatchTable[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all medicines
  const fetchMedicines = useCallback(async () => {
    if (!isReady) return;

    try {
      setLoading(true);

      if (pharmacyId) {
        // CLIENT-SIDE JOIN: Get medicines specific to this pharmacy
        // PowerSync syncs these as separate tables, so we join them locally
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
          // .where('pharmacy_medicines.is_available', '=', 1)
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
          // .where('is_active', '=', TRUE)
          .orderBy("name", "asc")
          .execute();

        console.log("All medicines result:", result);
        setMedicines(result as MedicinesTable[]);
      }
    } catch (error) {
      console.error("Error fetching medicines:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
    } finally {
      setLoading(false);
    }
  }, [db, isReady, pharmacyId]);

  // Fetch batches for a specific medicine
  const fetchBatchesForMedicine = useCallback(
    async (medicineId: string, pharmacyId?: string) => {
      if (!isReady || !medicineId) return;

      try {
        setLoading(true);

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
      } catch (error) {
        console.error("Error fetching batches:", error);
      } finally {
        setLoading(false);
      }
    },
    [db, isReady]
  );

  // Search medicine by ID, barcode, or name
  const searchMedicine = useCallback(
    async (
      searchTerm: string,
      searchType?: "id" | "barcode" | "name",
      pharmacyId?: string
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
            .selectAll("medicines")
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
                eb("medicines.generic_name", "like", `%${searchTerm}%`), // bonus: also search generic name
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
                eb("generic_name", "like", `%${searchTerm}%`), // bonus: also search generic name
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
  const getBatchById = useCallback(
    async (batchId: string) => {
      if (!isReady || !batchId) return undefined;

      try {
        const batch = await db
          .selectFrom("medicine_batches")
          .selectAll()
          .where("id", "=", batchId)
          .executeTakeFirst();

        return batch as MedicineBatchTable | undefined;
      } catch (error) {
        console.error("Error fetching batch:", error);
        return undefined;
      }
    },
    [db, isReady]
  );

  // Initial fetch of medicines
  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  return {
    // State
    medicines,
    batches,
    loading,
    isReady,

    // Methods
    fetchMedicines,
    fetchBatchesForMedicine,
    searchMedicine,
    searchMedicinesByName,
    getBatchById,
  };
}

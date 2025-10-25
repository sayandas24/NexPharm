// hooks/useMedicineCRUD.ts
import React, { useCallback, useState } from "react";
import {
  useKyselyDB,
  usePowerSync,
  usePowerSyncStatus,
} from "@/lib/powersync/PowersyncProvider";
import { MedicinesTable, PharmacyMedicineTable } from "@/types/database-types";
import { pickTableColumns } from "@/utils/filterTableData";
import { v4 as uuidv4 } from "uuid";

const validMedicineTableKeys: (keyof MedicinesTable)[] = [
  "id",
  "name",
  "generic_name",
  "brand_names",
  "manufacturer",
  "category",
  "strength",
  "pack_size",
  "how_to_use",
  "dosage_adults",
  "dosage_children",
  "dosage_elderly",
  "duration",
  "side_effects",
  "warnings",
  "shelf_life",
  "barcode",
  "requires_prescription",
  "medicine_image_url",
  "medicine_images",
  "package_image_url",
  "unit_type",
  "medicine_group",
  "tags",
  "is_active",
  "is_otc",
  "created_at",
  "updated_at",
];

const validPharmacyMedicineTableKeys: (keyof PharmacyMedicineTable)[] = [
  "id",
  "medicine_id",
  "pharmacy_id",
  "mrp",
  "price_range_min",
  "price_range_max",
  "stock_quantity",
  "reorder_level",
  "storage_conditions",
  "is_available",
  "created_at",
  "updated_at",
];

export default function useMedicineCRUD() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isReady, powerSyncDb, supabaseConnector } = usePowerSync();

  const db = useKyselyDB();
  const { isConnected, syncStatus } = usePowerSyncStatus();

  // Add medicine to pharmacy_medicines (junction table)
  const addMedicineToPharmacy = useCallback(
    async (medicineData: PharmacyMedicineTable) => {
      if (!isReady) return;

      try {
        console.log("📝 Adding medicine to pharmacy:", medicineData);
        const response = await db
          .insertInto("pharmacy_medicines")
          .values(medicineData)
          .execute();

        console.log("✅ Pharmacy medicine inserted:", response);

        // ✅ No need to call fetchMedicines - useQuery will auto-update!
      } catch (error) {
        console.error("Error adding medicine to pharmacy:", error);
        throw error;
      }
    },
    [db, isReady]
  );

  // Create new medicine in master catalog
  const createMedicine = useCallback(
    async (
      medicineData: Omit<MedicinesTable, "id" | "created_at" | "updated_at">
    ) => {
      if (!isReady) {
        throw new Error("PowerSync is not ready. Please wait and try again.");
      }

      if (!medicineData.name) {
        throw new Error("Medicine name is required");
      }

      try {
        setLoading(true);
        console.log("📝 Creating medicine:", medicineData.name);

        const filteredMedicineData = pickTableColumns<MedicinesTable>(
          medicineData,
          validMedicineTableKeys
        );

        const finalValue: any = {
          ...filteredMedicineData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        console.log("💾 Inserting into local PowerSync DB:", finalValue);

        // Insert into PowerSync local database
        const response = await db
          ?.insertInto("medicines")
          .values(finalValue)
          .execute();

        console.log("✅ Medicine created:", response);

        if (response) {
          const filteredPharmacyMedicineData =
            pickTableColumns<PharmacyMedicineTable>(
              {
                id: uuidv4(),
                medicine_id: medicineData?.id,
                ...medicineData,
              },
              validPharmacyMedicineTableKeys
            );

          await addMedicineToPharmacy(filteredPharmacyMedicineData as any);
        }

        // ✅ No need to call fetchMedicines - useQuery will auto-update!
        return finalValue.id;
      } catch (error: any) {
        console.error("❌ Error creating medicine:", error);

        if (error.message?.includes("UNIQUE constraint")) {
          throw new Error("A medicine with this ID or barcode already exists");
        } else if (error.message?.includes("NOT NULL constraint")) {
          throw new Error("Required field is missing");
        } else if (error.message?.includes("RLS")) {
          throw new Error(
            "Permission denied. Please ensure you are logged in."
          );
        } else {
          throw new Error(`Failed to create medicine: ${error.message}`);
        }
      } finally {
        setLoading(false);
      }
    },
    [db, isReady, addMedicineToPharmacy]
  );

  const deleteMedicine = useCallback(
    async (medicineId: string) => {
      if (!isReady) return;

      try {
        console.log("📝 Deleting medicine:", medicineId);
        const response = await db
          .deleteFrom("medicines")
          .where("id", "=", medicineId)
          .execute();

        console.log("✅ Medicine deleted:", response);

        // ✅ No need to call fetchMedicines - useQuery will auto-update!
      } catch (error) {
        console.error("Error deleting medicine:", error);
        throw error;
      }
    },
    [db, isReady]
  );

  const updateMedicineStock = useCallback(
    async (medicineId: string, pharmacyId: string, newQuantity: number) => {
      if (!isReady) return;

      try {
        await db
          .updateTable("pharmacy_medicines")
          .set({
            stock_quantity: newQuantity,
            updated_at: new Date().toISOString(),
          })
          .where("medicine_id", "=", medicineId)
          .where("pharmacy_id", "=", pharmacyId)
          .execute();

        // ✅ No need to call fetchMedicines - useQuery will auto-update!
      } catch (error) {
        console.error("Error updating stock:", error);
        throw error;
      }
    },
    [db, isReady]
  );

  const createMedicineBatch = useCallback(
    async (medicineId: string, pharmacyId: string, values: any) => {
      if (!isReady) return;

      try {
        console.log("📝 Creating batch:", medicineId, pharmacyId);
        const response = await db
          .insertInto("medicine_batches")
          .values(values)
          .execute();

        console.log("✅ Batch created:", response);

        // ✅ No need to call fetchMedicines - useQuery will auto-update!
      } catch (error) {
        console.error("Error creating batch:", error);
        throw error;
      }
    },
    [db, isReady]
  );
  

  return {
    loading,
    error,
    createMedicine,
    addMedicineToPharmacy,
    updateMedicineStock,
    deleteMedicine,
    createMedicineBatch,
  };
}

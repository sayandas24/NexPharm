import React, { useCallback, useState } from "react";

import { useKyselyDB, usePowerSync, usePowerSyncStatus } from "@/lib/powersync/PowersyncProvider";
import { useMedicines } from "./useMedicines";
import { MedicinesTable } from "@/types/database-types";
import { pickTableColumns } from "@/utils/filterTableData";

export default function useMedicineCRUD() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isReady, powerSyncDb, supabaseConnector } = usePowerSync();
  const { fetchMedicines } = useMedicines();

  const db = useKyselyDB();
  const {isConnected, syncStatus} = usePowerSyncStatus()

  // mark Add medicine to pharmacy_medicines (junction table)
  const addMedicineToPharmacy = useCallback(
    async (
      medicineId: string,
      pharmacyId: string,
      inventoryData: {
        mrp: number;
        price_range_min: number;
        price_range_max: number;
        stock_quantity: number;
        reorder_level: number;
        storage_conditions?: string;
      }
    ) => {
      if (!isReady) return;

      try {
        await db
          .insertInto("pharmacy_medicines")
          // fix generate uuid not from crypto
          .values({
            id: crypto.randomUUID(),
            medicine_id: medicineId,
            pharmacy_id: pharmacyId,
            mrp: inventoryData.mrp,
            price_range_min: inventoryData.price_range_min,
            price_range_max: inventoryData.price_range_max,
            stock_quantity: inventoryData.stock_quantity,
            reorder_level: inventoryData.reorder_level,
            storage_conditions: inventoryData.storage_conditions || null,
            is_available: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .execute();

        // Refresh medicines list after adding
        await fetchMedicines();
      } catch (error) {
        console.error("Error adding medicine to pharmacy:", error);
        throw error;
      }
    },
    [db, isReady, fetchMedicines]
  );

  // Create new medicine in master catalog
  const createMedicine = useCallback(
    async (
      medicineData: Omit<MedicinesTable, "id" | "created_at" | "updated_at">
    ) => {
      // Pre-insert validation
      if (!isReady) {
        throw new Error("PowerSync is not ready. Please wait and try again.");
      }

      // Ensure required fields are present
      if (!medicineData.name) {
        throw new Error("Medicine name is required");
      }

      try {
        console.log("📝 Creating medicine:", medicineData.name);

        const validKeys: (keyof MedicinesTable)[] = [
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

        const filteredData = pickTableColumns<MedicinesTable>(
          medicineData,
          validKeys
        );

        const finalValue: any = {
          ...filteredData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        console.log("💾 Inserting into local PowerSync DB:", finalValue);

        // Insert into PowerSync local database
        await db.insertInto("medicines").values(finalValue).execute();

        console.log("✅ Medicine inserted into local DB");
        console.log("📤 PowerSync will upload to Supabase when online");

        // Trigger immediate upload if online (non-blocking)
        if (powerSyncDb.connected) {
          console.log("🌐 Device is online, triggering immediate upload...");

          // Trigger upload in the background without blocking the return
          // This allows the UI to update immediately while upload happens
          supabaseConnector
            .uploadData(powerSyncDb)
            .then(() => {
              console.log("✅ Upload completed successfully");
              const status = powerSyncDb.currentStatus;
              console.log("📊 Sync status after upload:", {
                connected: status?.connected,
                hasSynced: status?.hasSynced,
              });
            })
            .catch((uploadError: any) => {
              // Log the error but don't throw - PowerSync will retry automatically
              console.warn(
                "⚠️ Manual upload failed, will retry automatically:",
                uploadError.message
              );
            });
        } else {
          console.log(
            "📴 Device is offline, will sync when connection restored"
          );
        }

        // Return immediately without waiting for upload
        await fetchMedicines()
        return finalValue.id;
      } catch (error: any) {
        console.error("❌ Error creating medicine:", error);

        // Provide more specific error messages
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
      }
    },
    [db, isReady, powerSyncDb, supabaseConnector]
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

        await fetchMedicines();
      } catch (error) {
        console.error("Error updating stock:", error);
        throw error;
      }
    },
    [db, isReady, fetchMedicines]
  );

  return {
    loading,
    error,
    createMedicine,
    addMedicineToPharmacy,
    updateMedicineStock,
  };
}

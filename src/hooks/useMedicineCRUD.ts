import React, { useState } from "react";

import { useKyselyDB } from "@/lib/powersync/PowersyncProvider";
import { MedicineInfoTable } from "@/types/database-types";
export default function useMedicineCRUD() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const db = useKyselyDB();

  const addMedicine = async (medicine: MedicineInfoTable) => {
    // first add the medicine in the medicines table, also need pharm_id
    // then grab the medicine id from there,
    // then create a row in medicine_info with attach the medicine_id to it
    try {
      setLoading(true);
      const res = await db
        .insertInto("medicine_info")
        .values(medicine)
        .execute();

      if (res.error) {
        setError(res.error.message);
        throw new Error(res.error.message);
      }

      setLoading(false);
      return res;
    } catch (error) {
      console.error("Error adding medicine:", error);
    }
  };

  return {
    loading,
    error,
    addMedicine,
  };
}

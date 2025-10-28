"use client";
import useAuth from "@/hooks/use-auth";
import { useMedicines } from "@/hooks/useMedicines";
import { useKyselyDB } from "@/lib/powersync/PowersyncProvider";
import { useRouter } from "next/navigation";
import React from "react";
import { v4 as uuidv4 } from "uuid";

export default function HomePage() {
  const { currentUser, profile, logout } = useAuth();
  const router = useRouter();

  const db = useKyselyDB();

  const { medicines, searchMedicinesByName, searchMedicine, fetchMedicines } =
    useMedicines();

  const fetchData = async () => {
    await fetchMedicines();
  };

  // Check what tables PowerSync has created
  const checkTables = async () => {
    try {
      // Query SQLite master table to see all tables
      const tables = await db
        .selectFrom("sqlite_master")
        .select(["name", "type"])
        .where("type", "=", "table")
        .execute();

      console.log("Available tables:", tables);

      // Check if pharmacy_medicines exists
      const hasPM = tables.some((t) => t.name === "pharmacy_medicines");
      console.log("Has pharmacy_medicines?", hasPM);

      // If it exists, check row count
      if (hasPM) {
        const count = await db
          .selectFrom("pharmacy_medicines")
          .select(db.fn.count("id").as("count"))
          .executeTakeFirst();
        console.log("pharmacy_medicines row count:", count);
      }
    } catch (error) {
      console.error("Error checking tables:", error);
    }
  };
  // Check what tables PowerSync has created
  const addMedicines = async () => {
    try {
      // Query SQLite master table to see all tables
    } catch (error) {
      console.error("Error checking tables:", error);
    }
  };

  const toLogin = () => {
    router.push("/login");
  };

  const toLogout = () => {
    router.push("/");
    logout();
  };

  return (
    <div className="p-10 bg-black min-h-screen">
      <button
        onClick={fetchData}
        className="text-white ml-2 border border-zinc-700 bg-zinc-800 rounded-lg p-5 py-2"
      >
        Fetch Data
      </button>
      <button
        onClick={checkTables}
        className="text-white ml-2 border border-zinc-700 bg-zinc-800 rounded-lg p-5 py-2"
      >
        checkTables
      </button>

      <button
        onClick={addMedicines}
        className="text-white ml-2 border border-zinc-700 bg-zinc-800 rounded-lg p-5 py-2"
      >
        Add Into Medicines
      </button>
      <button
        onClick={toLogin}
        className="text-white border ml-2 border-zinc-700 bg-zinc-800 rounded-lg p-5 py-2"
      >
        Login
      </button>
      <button
        onClick={toLogout}
        className="text-white border ml-2 border-zinc-700 bg-zinc-800 rounded-lg p-5 py-2"
      >
        Logout
      </button>
      <button
        onClick={() => router.push("/inventory")}
        className="text-white border ml-2 border-zinc-700 bg-zinc-800 rounded-lg p-5 py-2"
      >
        Inventory
      </button>
      <button
        onClick={() => router.push("/reports/sales")}
        className="text-white border ml-2 border-zinc-700 bg-blue-800 rounded-lg p-5 py-2"
      >
        Sales
      </button>
    </div>
  );
}

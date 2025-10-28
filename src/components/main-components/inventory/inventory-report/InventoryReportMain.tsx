"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useMedicines } from "@/hooks/useMedicines";
import useSales from "@/hooks/useSales";
import { useShortages } from "@/hooks/useShortages";
import useAuth from "@/hooks/use-auth";
import { AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import InventorySummaryCards from "./InventorySummaryCards";
import BelowReorderTable from "./BelowReorderTable";
import FastMovingMedicinesSection from "./FastMovingMedicinesSection";
import SlowMovingMedicinesSection from "./SlowMovingMedicinesSection";
import { TimePeriod, TopMedicine } from "@/types/inventory-report.types";
import {
  calculateInventoryMetrics,
  transformToBelowReorderMedicines,
  createMedicineMovementData,
} from "@/utils/inventory-report.utils";

export default function InventoryReportMain() {
  const { currentPharmacy } = useAuth();
  const pharmacyId = currentPharmacy?.id;

  const [timePeriod, setTimePeriod] = useState<TimePeriod>("monthly");
  const [salesData, setSalesData] = useState<TopMedicine[]>([]);
  const [salesLoading, setSalesLoading] = useState(true);

  // Hooks
  const {
    medicines,
    loading: medicinesLoading,
    getBatchesByPharmacy,
  } = useMedicines(pharmacyId);
  const { shortages, loading: shortagesLoading } = useShortages(pharmacyId);
  const salesHook = useSales(pharmacyId || "");

  // Fetch batches
  const [batches, setBatches] = useState<any[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(true);

  useEffect(() => {
    const fetchBatches = async () => {
      if (pharmacyId && getBatchesByPharmacy) {
        setBatchesLoading(true);
        const result = await getBatchesByPharmacy(pharmacyId);
        setBatches(result || []);
        setBatchesLoading(false);
      }
    };
    fetchBatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pharmacyId]);

  // Fetch sales data based on time period
  useEffect(() => {
    const fetchSalesData = async () => {
      if (!pharmacyId || !salesHook.fetchTopMedicines) return;

      setSalesLoading(true);
      try {
        const data = await salesHook.fetchTopMedicines(
          timePeriod,
          undefined,
          100
        );
        setSalesData(data as TopMedicine[]);
      } catch (error) {
        console.error("Error fetching sales data:", error);
        setSalesData([]);
      } finally {
        setSalesLoading(false);
      }
    };

    fetchSalesData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pharmacyId, timePeriod]);

  // Calculate inventory metrics
  const inventoryMetrics = useMemo(() => {
    if (medicinesLoading || salesLoading) {
      return {
        totalMedicines: 0,
        totalCostValue: 0,
        totalRetailValue: 0,
        profitMargin: 0,
        belowReorderCount: 0,
        fastMovingCount: 0,
        slowMovingCount: 0,
      };
    }

    // Count medicines with stock > 0
    const medicinesWithStock = medicines.filter(
      (m: any) => m.stock_quantity > 0
    );

    return calculateInventoryMetrics(
      medicinesWithStock.length,
      batches,
      shortages,
      salesData,
      medicinesWithStock
    );
  }, [
    medicines,
    batches,
    shortages,
    salesData,
    medicinesLoading,
    salesLoading,
  ]);

  // Transform below reorder medicines
  const belowReorderMedicines = useMemo(() => {
    return transformToBelowReorderMedicines(shortages);
  }, [shortages]);

  // Create medicine movement data
  const movementData = useMemo(() => {
    // Create a map of medicine names to their current stock and details
    const medicinesMap = new Map(
      medicines.map((m: any) => [
        m.name,
        {
          currentStock: m.stock_quantity || 0,
          genericName: m.generic_name,
          category: m.category,
        },
      ])
    );

    return createMedicineMovementData(salesData, medicinesMap);
  }, [salesData, medicines]);

  // Separate fast and slow moving medicines
  const fastMovingMedicines = useMemo(() => {
    return movementData.filter((m) => m.movementType === "fast");
  }, [movementData]);

  const slowMovingMedicines = useMemo(() => {
    return movementData.filter(
      (m) => m.movementType === "slow" || m.movementType === "dead"
    );
  }, [movementData]);

  // Loading state
  const isLoading =
    medicinesLoading || shortagesLoading || batchesLoading || salesLoading;

  // Guard clause for no pharmacy
  if (!currentPharmacy) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No pharmacy selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Sales Movement Analysis
          </h2>
          <p className="text-sm text-gray-500">
            Analyze medicine sales velocity and identify trends
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label
            htmlFor="time-period-select"
            className="text-sm text-gray-600 sr-only"
          >
            Select time period
          </label>
          <Select
            value={timePeriod}
            onValueChange={(value) => setTimePeriod(value as TimePeriod)}
          >
            <SelectTrigger
              className="w-[180px]"
              id="time-period-select"
              aria-label="Select time period for analysis"
            >
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Today</SelectItem>
              <SelectItem value="weekly">Last 7 Days</SelectItem>
              <SelectItem value="monthly">Last 30 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <InventorySummaryCards
        totalMedicines={inventoryMetrics.totalMedicines}
        costValue={inventoryMetrics.totalCostValue}
        retailValue={inventoryMetrics.totalRetailValue}
        profitMargin={inventoryMetrics.profitMargin}
        belowReorderCount={inventoryMetrics.belowReorderCount}
        fastMovingCount={inventoryMetrics.fastMovingCount}
        slowMovingCount={inventoryMetrics.slowMovingCount}
        loading={isLoading}
      />

      {/* Below Reorder Table */}
      <BelowReorderTable
        medicines={belowReorderMedicines}
        loading={shortagesLoading}
      />

      <FastMovingMedicinesSection
        medicines={fastMovingMedicines}
        timePeriod={timePeriod}
        loading={salesLoading}
      />

      <SlowMovingMedicinesSection
        medicines={slowMovingMedicines}
        timePeriod={timePeriod}
        loading={salesLoading}
      />
    </div>
  );
}

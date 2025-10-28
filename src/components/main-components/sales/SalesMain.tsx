"use client";
import useAuth from "@/hooks/use-auth";
import useSales from "@/hooks/useSales";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import SalesFilters from "./SalesFilters";
import SalesSummaryCards from "./SalesSummaryCards";
import RevenueChart from "./RevenueChart";
import TransactionChart from "./TransactionChart";
import MedicineSalesChart from "./MedicineSalesChart";
import TopCustomersSection from "./TopCustomersSection";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function SalesMain() {
  const { currentPharmacy } = useAuth();
  const pharmacyId = currentPharmacy?.id;
  const { fetchSalesAnalytics, fetchSalesSummary, fetchTopMedicines } =
    useSales(pharmacyId || "");

  // State management
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly" | "all">(
    "weekly"
  );
  const [customDateRange, setCustomDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({
    start: null,
    end: null,
  });
  const [isCustomRange, setIsCustomRange] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data state
  const [salesSummary, setSalesSummary] = useState<any>(null);
  const [salesAnalytics, setSalesAnalytics] = useState<any[]>([]);
  const [topMedicinesData, setTopMedicinesData] = useState<any[]>([]);

  // Memoize date range string to prevent unnecessary re-renders
  const dateRangeKey = useMemo(() => {
    if (!isCustomRange) return period;
    return `${customDateRange.start?.getTime()}-${customDateRange.end?.getTime()}`;
  }, [isCustomRange, period, customDateRange.start, customDateRange.end]);

  // Fetch all data when filters change
  useEffect(() => {
    const fetchAllData = async () => {
      if (!pharmacyId) {
        setError("Pharmacy not selected");
        return;
      }

      // Validate custom date range
      if (isCustomRange && (!customDateRange.start || !customDateRange.end)) {
        return;
      }

      if (
        isCustomRange &&
        customDateRange.start &&
        customDateRange.end &&
        customDateRange.start > customDateRange.end
      ) {
        setError("Start date must be before end date");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const dateRange =
          isCustomRange && customDateRange.start && customDateRange.end
            ? { start: customDateRange.start, end: customDateRange.end }
            : undefined;

        const [summary, analytics, topMedicines] = await Promise.all([
          fetchSalesSummary(period, dateRange),
          fetchSalesAnalytics(period, dateRange),
          fetchTopMedicines(period, dateRange),
        ]);

        setSalesSummary(summary);
        setSalesAnalytics(analytics);
        setTopMedicinesData(topMedicines);
      } catch (err) {
        console.error("Error fetching sales data:", err);
        setError("Failed to load sales data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pharmacyId, dateRangeKey]);

  const handlePeriodChange = useCallback(
    (newPeriod: "daily" | "weekly" | "monthly" | "all") => {
      setPeriod(newPeriod);
    },
    []
  );

  const handleCustomDateChange = useCallback(
    (range: { start: Date | null; end: Date | null }) => {
      setCustomDateRange(range);
    },
    []
  );

  const handleToggleCustomRange = useCallback(() => {
    setIsCustomRange((prev) => !prev);
    setCustomDateRange({ start: null, end: null });
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Sales Analysis</h1>
        <p className="text-muted-foreground">
          Comprehensive sales analytics and customer insights
        </p>
      </div>

      <SalesFilters
        period={period}
        onPeriodChange={handlePeriodChange}
        customDateRange={customDateRange}
        onCustomDateChange={handleCustomDateChange}
        isCustomRange={isCustomRange}
        onToggleCustomRange={handleToggleCustomRange}
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <SalesSummaryCards summary={salesSummary} isLoading={isLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RevenueChart data={salesAnalytics} isLoading={isLoading} />
        <TransactionChart data={salesAnalytics} isLoading={isLoading} />
      </div>

      <MedicineSalesChart data={topMedicinesData} isLoading={isLoading} />

      <TopCustomersSection
        pharmacyId={pharmacyId}
        period={period}
        customDateRange={customDateRange}
        isCustomRange={isCustomRange}
      />
    </div>
  );
}

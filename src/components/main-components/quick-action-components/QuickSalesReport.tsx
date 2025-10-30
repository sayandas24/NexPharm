import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import useAuth from "@/hooks/use-auth";
import RevenueChart from "../sales/RevenueChart";
import TransactionChart from "../sales/TransactionChart";
import MedicineSalesChart from "../sales/MedicineSalesChart";
import useSales from "@/hooks/useSales";
import SalesFilters from "../sales/SalesFilters";
import { useRouter } from "next/navigation";

export default function QuickSalesReport() {
  const router = useRouter();
  const [dialogIsOpen, setDialogIsOpen] = useState(false);

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

  // Data state
  const [salesAnalytics, setSalesAnalytics] = useState<any[]>([]);
  const [topMedicinesData, setTopMedicinesData] = useState<any[]>([]);

  // Memoize date range string to prevent unnecessary re-renders
  const dateRangeKey = useMemo(() => {
    if (!isCustomRange) return period;
    return `${customDateRange.start?.getTime()}-${customDateRange.end?.getTime()}`;
  }, [isCustomRange, period, customDateRange.start, customDateRange.end]);

  const handleDialogIsOpen = () => {
    setDialogIsOpen(true);
  };

  useEffect(() => {
    const fetchAllData = async () => {
      if (!pharmacyId) {
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
        return;
      }

      setIsLoading(true);

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

        setSalesAnalytics(analytics);
        setTopMedicinesData(topMedicines);
      } catch (err) {
        console.error("Error fetching sales data:", err);
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
    <div>
      <button
        onClick={handleDialogIsOpen}
        className="group w-full relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-300 to-orange-600 p-6 text-left shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-100"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 transition-transform duration-300 group-hover:scale-150"></div>
        <div className="relative">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-3 backdrop-blur-sm">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 className="text-white font-semibold text-lg mb-1">
            View Reports
          </h3>
          <p className="text-orange-100 text-sm">Sales & analytics</p>
        </div>
      </button>

      {/* Scanner Dialog */}
      <Dialog open={dialogIsOpen} onOpenChange={setDialogIsOpen}>
        <DialogContent className="min-w-[93vw] min-h-[95vh] max-h-[95vh] max-[500px]:min-h-[83vh] max-[500px]:max-h-[83vh] overflow-y-auto p-0">
          <div className="p-5 space-y-3">
            <section className="flex items-center justify-between flex-wrap">
              <div>
                <h1 className="text-xl font-bold">Sales Analysis</h1>
                <p className="text-muted-foreground text-xs mb-2">
                  Comprehensive sales analytics and customer insights
                </p>
              </div>
              {/* mark */}
              <button
                onClick={() => router.push("/reports/sales")}
                className="mr-10 w-[12rem] h-[3rem] relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-left shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-100 flex items-center"
              >
                <div className="relative">
                  <h3 className="text-white font-semibold text-sm">
                    View Full Report
                  </h3>
                </div>

                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 transition-transform duration-300 group-hover:scale-150"></div>
              </button>
            </section>

            <SalesFilters
              period={period}
              onPeriodChange={handlePeriodChange}
              customDateRange={customDateRange}
              onCustomDateChange={handleCustomDateChange}
              isCustomRange={isCustomRange}
              onToggleCustomRange={handleToggleCustomRange}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <RevenueChart data={salesAnalytics} isLoading={isLoading} />
              <TransactionChart data={salesAnalytics} isLoading={isLoading} />
            </div>

            <MedicineSalesChart data={topMedicinesData} isLoading={isLoading} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

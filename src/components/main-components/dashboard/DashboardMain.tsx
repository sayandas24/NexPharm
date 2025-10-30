"use client";
import useAuth from "@/hooks/use-auth";
import { useDashboard } from "@/hooks/useDashboard";
import { InventoryStatusCard } from "./InventoryStatusCard";
import { RevenueCard } from "./RevenueCard";
import { MedicinesAvailableCard } from "./MedicinesAvailableCard";
import { MedicineShortageCard } from "./MedicineShortageCard";
import QuickActions from "../quick-action-components/QuickActionsMain";

export function DashboardMain() {
  const { currentPharmacy, isLoadingFromCache, hasCachedData } = useAuth();
  const { metrics, loading, error, selectedPeriod, setSelectedPeriod } =
    useDashboard(currentPharmacy?.id);

  // Handle loading from cache
  if (isLoadingFromCache) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Handle no pharmacy selected
  if (!currentPharmacy) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            No Pharmacy Selected
          </h2>
          <p className="text-gray-500">
            Please select a pharmacy to view the dashboard
          </p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-red-700 mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-gray-500">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-gray-600">Welcome to {currentPharmacy.name}</p>
          {hasCachedData && loading && (
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
              Syncing...
            </span>
          )}
        </div>
      </div>

      <div className="grid max-[1024px]:grid-cols-2 lg:grid-cols-4 gap-4">
        <InventoryStatusCard
          status={metrics?.inventoryStatus || "Good"}
          loading={loading}
        />
        <RevenueCard
          revenue={metrics?.revenue || 0}
          period={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          loading={loading}
        />
        <MedicinesAvailableCard
          count={metrics?.medicinesAvailable || 0}
          loading={loading}
        />
        <MedicineShortageCard
          count={metrics?.medicineShortage || 0}
          loading={loading}
        />
      </div>

      {/* Quick Actions Section */}
      <QuickActions/>
    </div>
  );
}

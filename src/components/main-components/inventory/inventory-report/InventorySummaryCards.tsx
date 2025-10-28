"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/utils/inventory-report.utils";

interface InventorySummaryCardsProps {
  totalMedicines: number;
  costValue: number;
  retailValue: number;
  profitMargin: number;
  belowReorderCount: number;
  fastMovingCount: number;
  slowMovingCount: number;
  loading: boolean;
}

export default function InventorySummaryCards({
  totalMedicines,
  costValue,
  retailValue,
  profitMargin,
  belowReorderCount,
  fastMovingCount,
  slowMovingCount,
  loading,
}: InventorySummaryCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6" role="region" aria-label="Inventory summary metrics">
      {/* Total Medicines Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Medicines
            </CardTitle>
            <Package className="h-5 w-5 text-blue-600" aria-hidden="true" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900" aria-label={`${totalMedicines} total medicines`}>
            {totalMedicines}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Unique medicines in stock
          </p>
        </CardContent>
      </Card>

      {/* Inventory Value Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">
              Inventory Value
            </CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" aria-hidden="true" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900" aria-label={`Retail value ${formatCurrency(retailValue)}`}>
            {formatCurrency(retailValue)}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-gray-500">
              Cost: {formatCurrency(costValue)}
            </p>
            <span className="text-xs text-green-600 font-medium" aria-label={`Profit margin ${formatCurrency(profitMargin)}`}>
              +{formatCurrency(profitMargin)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Below Reorder Level Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">
              Below Reorder
            </CardTitle>
            <AlertTriangle
              className={`h-5 w-5 ${
                belowReorderCount > 0 ? "text-red-600" : "text-gray-400"
              }`}
              aria-hidden="true"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={`text-3xl font-bold ${
              belowReorderCount > 0 ? "text-red-600" : "text-gray-900"
            }`}
            aria-label={`${belowReorderCount} medicines below reorder level`}
          >
            {belowReorderCount}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {belowReorderCount > 0
              ? "Medicines need restocking"
              : "All medicines adequately stocked"}
          </p>
        </CardContent>
      </Card>

      {/* Movement Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">
              Movement Summary
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-purple-600" aria-hidden="true" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-blue-600" aria-hidden="true" />
                <span className="text-2xl font-bold text-gray-900" aria-label={`${fastMovingCount} fast-moving medicines`}>
                  {fastMovingCount}
                </span>
              </div>
              <p className="text-xs text-gray-500">Fast-moving</p>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <TrendingDown className="h-4 w-4 text-gray-600" aria-hidden="true" />
                <span className="text-2xl font-bold text-gray-900" aria-label={`${slowMovingCount} slow-moving medicines`}>
                  {slowMovingCount}
                </span>
              </div>
              <p className="text-xs text-gray-500">Slow-moving</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

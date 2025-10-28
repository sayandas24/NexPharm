"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingDown, ArrowUpDown, Package, AlertCircle } from "lucide-react";
import { MedicineMovementData, TimePeriod } from "@/types/inventory-report.types";
import { formatCurrency } from "@/utils/inventory-report.utils";

interface SlowMovingMedicinesSectionProps {
  medicines: MedicineMovementData[];
  timePeriod: TimePeriod;
  loading: boolean;
}

type SortField = "name" | "quantity" | "stock" | "revenue";
type SortDirection = "asc" | "desc";

export default function SlowMovingMedicinesSection({
  medicines,
  timePeriod,
  loading,
}: SlowMovingMedicinesSectionProps) {
  const [sortField, setSortField] = useState<SortField>("stock");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedMedicines = React.useMemo(() => {
    return [...medicines].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "name":
          comparison = a.medicineName.localeCompare(b.medicineName);
          break;
        case "quantity":
          comparison = a.totalQuantitySold - b.totalQuantitySold;
          break;
        case "stock":
          comparison = a.currentStock - b.currentStock;
          break;
        case "revenue":
          comparison = a.totalRevenue - b.totalRevenue;
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [medicines, sortField, sortDirection]);

  const deadStockCount = medicines.filter((m) => m.movementType === "dead").length;

  const getPeriodLabel = (period: TimePeriod): string => {
    switch (period) {
      case "daily":
        return "Today";
      case "weekly":
        return "Last 7 Days";
      case "monthly":
        return "Last 30 Days";
      case "all":
        return "All Time";
    }
  };

  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (medicines.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-gray-600" />
            <CardTitle>Slow-Moving Medicines</CardTitle>
            <Badge variant="outline">{getPeriodLabel(timePeriod)}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600 font-medium">
              No slow-moving medicines found
            </p>
            <p className="text-sm text-gray-500 mt-1">
              All medicines are selling well in this period
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-gray-600" />
            <CardTitle>Slow-Moving Medicines</CardTitle>
            <Badge variant="outline">{getPeriodLabel(timePeriod)}</Badge>
            <Badge className="bg-gray-100 text-gray-800">
              {medicines.length}
            </Badge>
            {deadStockCount > 0 && (
              <Badge variant="destructive">
                {deadStockCount} Dead Stock
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 hover:bg-transparent"
                  onClick={() => handleSort("name")}
                >
                  Medicine Name
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>Generic Name</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 hover:bg-transparent"
                  onClick={() => handleSort("quantity")}
                >
                  Quantity Sold
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 hover:bg-transparent"
                  onClick={() => handleSort("revenue")}
                >
                  Revenue
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 hover:bg-transparent"
                  onClick={() => handleSort("stock")}
                >
                  Current Stock
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedMedicines.map((medicine) => {
              const isDead = medicine.movementType === "dead";

              return (
                <TableRow key={medicine.medicineName}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {isDead && (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      {medicine.medicineName}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {medicine.genericName || "-"}
                  </TableCell>
                  <TableCell>
                    {isDead ? (
                      <Badge variant="destructive">0</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800">
                        {medicine.totalQuantitySold}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {isDead ? (
                      <span className="text-red-600">₹0</span>
                    ) : (
                      formatCurrency(medicine.totalRevenue)
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        medicine.currentStock > 50
                          ? "text-orange-600 border-orange-600"
                          : ""
                      }
                    >
                      {medicine.currentStock}
                      {medicine.currentStock > 50 && " (High)"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {isDead ? (
                      <Badge variant="destructive">Dead Stock</Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        Slow-Moving
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {deadStockCount > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">
                  Dead Stock Alert
                </p>
                <p className="text-xs text-red-700 mt-1">
                  {deadStockCount} medicine{deadStockCount > 1 ? "s have" : " has"} had
                  no sales in {getPeriodLabel(timePeriod).toLowerCase()}. Consider
                  promotional strategies or stock adjustments.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

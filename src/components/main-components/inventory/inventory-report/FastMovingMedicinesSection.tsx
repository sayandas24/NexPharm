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
import { TrendingUp, ArrowUpDown, Package } from "lucide-react";
import { MedicineMovementData, TimePeriod } from "@/types/inventory-report.types";
import { formatCurrency } from "@/utils/inventory-report.utils";

interface FastMovingMedicinesSectionProps {
  medicines: MedicineMovementData[];
  timePeriod: TimePeriod;
  loading: boolean;
}

type SortField = "name" | "quantity" | "revenue" | "transactions";
type SortDirection = "asc" | "desc";

export default function FastMovingMedicinesSection({
  medicines,
  timePeriod,
  loading,
}: FastMovingMedicinesSectionProps) {
  const [sortField, setSortField] = useState<SortField>("quantity");
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
        case "revenue":
          comparison = a.totalRevenue - b.totalRevenue;
          break;
        case "transactions":
          comparison = a.transactionCount - b.transactionCount;
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [medicines, sortField, sortDirection]);

  // Calculate max quantity for bar visualization
  const maxQuantity = Math.max(
    ...medicines.map((m) => m.totalQuantitySold),
    1
  );

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
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <CardTitle>Fast-Moving Medicines</CardTitle>
            <Badge variant="outline">{getPeriodLabel(timePeriod)}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600 font-medium">
              No fast-moving medicines found
            </p>
            <p className="text-sm text-gray-500 mt-1">
              No medicines have met the fast-moving threshold in this period
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
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <CardTitle>Fast-Moving Medicines</CardTitle>
            <Badge variant="outline">{getPeriodLabel(timePeriod)}</Badge>
            <Badge className="bg-blue-100 text-blue-800">
              {medicines.length}
            </Badge>
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
              <TableHead>Sales Volume</TableHead>
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
                  onClick={() => handleSort("transactions")}
                >
                  Transactions
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>Current Stock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedMedicines.map((medicine) => {
              const barWidth = (medicine.totalQuantitySold / maxQuantity) * 100;

              return (
                <TableRow key={medicine.medicineName}>
                  <TableCell className="font-medium">
                    {medicine.medicineName}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {medicine.genericName || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-blue-100 text-blue-800">
                      {medicine.totalQuantitySold}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-[60px]">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 min-w-[35px]">
                        {barWidth.toFixed(0)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-green-600">
                    {formatCurrency(medicine.totalRevenue)}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {medicine.transactionCount}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        medicine.currentStock < 10
                          ? "text-yellow-600 border-yellow-600"
                          : ""
                      }
                    >
                      {medicine.currentStock}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

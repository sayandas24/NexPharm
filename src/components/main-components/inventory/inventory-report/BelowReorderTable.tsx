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
import { AlertTriangle, ArrowUpDown, Package } from "lucide-react";
import { BelowReorderMedicine } from "@/types/inventory-report.types";
import {
  formatCurrency,
  getStockSeverityColor,
} from "@/utils/inventory-report.utils";

interface BelowReorderTableProps {
  medicines: BelowReorderMedicine[];
  loading: boolean;
  onReorderClick?: (medicineId: string) => void;
}

type SortField = "name" | "currentStock" | "reorderLevel" | "shortageAmount";
type SortDirection = "asc" | "desc";

export default function BelowReorderTable({
  medicines,
  loading,
  onReorderClick,
}: BelowReorderTableProps) {
  const [sortField, setSortField] = useState<SortField>("shortageAmount");
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
        case "currentStock":
          comparison = a.currentStock - b.currentStock;
          break;
        case "reorderLevel":
          comparison = a.reorderLevel - b.reorderLevel;
          break;
        case "shortageAmount":
          comparison = a.shortageAmount - b.shortageAmount;
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [medicines, sortField, sortDirection]);

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
            <AlertTriangle className="h-5 w-5 text-gray-400" />
            <CardTitle>Medicines Below Reorder Level</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto text-green-500 mb-3" />
            <p className="text-gray-600 font-medium">
              All medicines are adequately stocked
            </p>
            <p className="text-sm text-gray-500 mt-1">
              No medicines are currently below their reorder level
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
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <CardTitle>Medicines Below Reorder Level</CardTitle>
            <Badge variant="destructive">{medicines.length}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          role="region"
          aria-label="Medicines below reorder level table"
          tabIndex={0}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 hover:bg-transparent"
                    onClick={() => handleSort("name")}
                    aria-label="Sort by medicine name"
                  >
                    Medicine Name
                    <ArrowUpDown className="ml-2 h-3 w-3" aria-hidden="true" />
                  </Button>
                </TableHead>
                <TableHead>Generic Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 hover:bg-transparent"
                    onClick={() => handleSort("currentStock")}
                  >
                    Current Stock
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 hover:bg-transparent"
                    onClick={() => handleSort("reorderLevel")}
                  >
                    Reorder Level
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 hover:bg-transparent"
                    onClick={() => handleSort("shortageAmount")}
                  >
                    Shortage
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>MRP</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedMedicines.map((medicine) => (
                <TableRow key={medicine.medicineId}>
                  <TableCell className="font-medium">
                    {medicine.medicineName}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {medicine.genericName || "-"}
                  </TableCell>
                  <TableCell>
                    {medicine.category ? (
                      <Badge variant="outline">{medicine.category}</Badge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={getStockSeverityColor(
                        medicine.currentStock,
                        medicine.reorderLevel
                      )}
                    >
                      {medicine.currentStock}
                      {medicine.currentStock === 0 && " (Out of Stock)"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {medicine.reorderLevel}
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-red-600">
                      -{medicine.shortageAmount}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {formatCurrency(medicine.mrp)}
                  </TableCell>
                  <TableCell className="text-right">
                    {onReorderClick && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onReorderClick(medicine.medicineId)}
                      >
                        Reorder
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

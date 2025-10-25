"use client";

import React, { useState } from "react";
import { ShortageItem } from "@/hooks/useShortages";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Package,
  CheckCircle2,
  Circle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BatchDetailsExpanded from "./BatchDetailsExpanded";

interface ShortageTableProps {
  shortages: ShortageItem[];
  expandedRows: Set<string>;
  onToggleExpand: (medicineId: string) => void;
  onAcknowledge: (medicineId: string) => void;
  onReorderClick: (medicineId: string) => void;
  onUpdateReorderLevel: (medicineId: string, newLevel: number) => void;
}

export default function ShortageTable({
  shortages,
  expandedRows,
  onToggleExpand,
  onAcknowledge,
  onReorderClick,
  onUpdateReorderLevel,
}: ShortageTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [editingReorderLevel, setEditingReorderLevel] = useState<string | null>(
    null
  );
  const [tempReorderLevel, setTempReorderLevel] = useState<number>(0);
  const itemsPerPage = 20;

  // Pagination
  const totalPages = Math.ceil(shortages.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedShortages = shortages.slice(startIndex, endIndex);

  // Get shortage type badge
  const getShortageTypeBadge = (type: string) => {
    switch (type) {
      case "critical":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300 hover:bg-red-100">
            Critical
          </Badge>
        );
      case "low-stock":
        return (
          <Badge className="bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-100">
            Low Stock
          </Badge>
        );
      case "expiring":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-100">
            Expiring Soon
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  // Get status indicator dot
  const getStatusDot = (type: string) => {
    switch (type) {
      case "critical":
        return <div className="w-2 h-2 rounded-full bg-red-500" />;
      case "low-stock":
        return <div className="w-2 h-2 rounded-full bg-orange-500" />;
      case "expiring":
        return <div className="w-2 h-2 rounded-full bg-blue-500" />;
      default:
        return <div className="w-2 h-2 rounded-full bg-gray-400" />;
    }
  };

  // Handle reorder level edit
  const startEditingReorderLevel = (
    medicineId: string,
    currentLevel: number
  ) => {
    setEditingReorderLevel(medicineId);
    setTempReorderLevel(currentLevel);
  };

  const saveReorderLevel = (medicineId: string) => {
    if (tempReorderLevel > 0) {
      onUpdateReorderLevel(medicineId, tempReorderLevel);
    }
    setEditingReorderLevel(null);
  };

  const cancelEditingReorderLevel = () => {
    setEditingReorderLevel(null);
    setTempReorderLevel(0);
  };

  // Stock level visual indicator
  const getStockLevelBar = (
    current: number,
    total: number,
    reorder: number
  ) => {
    // Calculate percentage based on total quantity (not reorder level)
    const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;
    const color =
      current === 0
        ? "bg-red-500"
        : current < reorder
        ? "bg-orange-500"
        : "bg-green-500";

    return (
      <div className="flex items-center gap-2">
        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${color} transition-all`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm font-medium">{current}</span>
      </div>
    );
  };

  if (shortages.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Shortages Found</h3>
        <p className="text-gray-500">
          All medicines are adequately stocked. Great job!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Mobile Card View */}
      <div className="block md:hidden">
        {paginatedShortages.map((shortage) => {
          const isExpanded = expandedRows.has(shortage.medicineId);
          const isEditing = editingReorderLevel === shortage.medicineId;

          return (
            <div
              key={shortage.medicineId}
              className={`border-b p-4 ${
                shortage.isAcknowledged ? "opacity-60 bg-gray-50" : ""
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-2 flex-1">
                  {getStatusDot(shortage.shortageType)}
                  <div className="flex-1">
                    <div className="font-medium">{shortage.medicineName}</div>
                    {shortage.genericName && (
                      <div className="text-sm text-gray-500">
                        {shortage.genericName}
                      </div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">
                      {shortage.category || "Uncategorized"}
                    </div>
                  </div>
                </div>
                {getShortageTypeBadge(shortage.shortageType)}
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Current Stock:</span>
                  <span className="font-medium">{shortage.currentStock}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Reorder Level:</span>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={tempReorderLevel}
                        onChange={(e) =>
                          setTempReorderLevel(parseInt(e.target.value) || 0)
                        }
                        className="w-20 px-2 py-1 border rounded text-sm"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() => saveReorderLevel(shortage.medicineId)}
                        className="h-7 px-2"
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={cancelEditingReorderLevel}
                        className="h-7 px-2"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() =>
                        startEditingReorderLevel(
                          shortage.medicineId,
                          shortage.reorderLevel
                        )
                      }
                      className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                    >
                      {shortage.reorderLevel}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onReorderClick(shortage.medicineId)}
                  className="flex-1"
                >
                  Reorder
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onToggleExpand(shortage.medicineId)}
                  className="flex-1"
                >
                  {isExpanded ? "Hide" : "View"} Batches
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onAcknowledge(shortage.medicineId)}
                  className="h-9 w-9 p-0"
                  title={
                    shortage.isAcknowledged
                      ? "Acknowledged"
                      : "Mark as acknowledged"
                  }
                >
                  {shortage.isAcknowledged ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400" />
                  )}
                </Button>
              </div>

              {isExpanded && (
                <div className="mt-4">
                  <BatchDetailsExpanded
                    batches={shortage.batches}
                    medicineName={shortage.medicineName}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <Table className="hidden md:table">
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead className="w-12"></TableHead>
            <TableHead>Medicine Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Current Stock</TableHead>
            <TableHead>Reorder Level</TableHead>
            <TableHead>Shortage Type</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedShortages.map((shortage) => {
            const isExpanded = expandedRows.has(shortage.medicineId);
            const isEditing = editingReorderLevel === shortage.medicineId;

            return (
              <React.Fragment key={shortage.medicineId}>
                <TableRow
                  className={`${
                    shortage.isAcknowledged ? "opacity-60 bg-gray-50" : ""
                  }`}
                >
                  {/* Expand/Collapse Button */}
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleExpand(shortage.medicineId)}
                      className="h-8 w-8 p-0"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>

                  {/* Status Indicator */}
                  <TableCell>{getStatusDot(shortage.shortageType)}</TableCell>

                  {/* Medicine Name */}
                  <TableCell>
                    <div>
                      <div className="font-medium">{shortage.medicineName}</div>
                      {shortage.genericName && (
                        <div className="text-sm text-gray-500">
                          {shortage.genericName}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Category */}
                  <TableCell>
                    {shortage.category || (
                      <span className="text-gray-400 italic">
                        Uncategorized
                      </span>
                    )}
                  </TableCell>

                  {/* Current Stock */}
                  <TableCell>
                    {getStockLevelBar(
                      shortage.currentStock,
                      shortage.totalStock,
                      shortage.reorderLevel
                    )}
                  </TableCell>

                  {/* Reorder Level */}
                  <TableCell>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          value={tempReorderLevel}
                          onChange={(e) =>
                            setTempReorderLevel(parseInt(e.target.value) || 0)
                          }
                          className="w-20 px-2 py-1 border rounded text-sm"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={() => saveReorderLevel(shortage.medicineId)}
                          className="h-7 px-2"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={cancelEditingReorderLevel}
                          className="h-7 px-2"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          startEditingReorderLevel(
                            shortage.medicineId,
                            shortage.reorderLevel
                          )
                        }
                        className="text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        {shortage.reorderLevel}
                      </button>
                    )}
                  </TableCell>

                  {/* Shortage Type */}
                  <TableCell>
                    {getShortageTypeBadge(shortage.shortageType)}
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onReorderClick(shortage.medicineId)}
                        className="h-8"
                      >
                        Reorder
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onAcknowledge(shortage.medicineId)}
                        className="h-8 w-8 p-0"
                        title={
                          shortage.isAcknowledged
                            ? "Acknowledged"
                            : "Mark as acknowledged"
                        }
                      >
                        {shortage.isAcknowledged ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Circle className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>

                {/* Expanded Batch Details */}
                {isExpanded && (
                  <TableRow>
                    <TableCell colSpan={8} className="bg-gray-50">
                      <BatchDetailsExpanded
                        batches={shortage.batches}
                        medicineName={shortage.medicineName}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} - {Math.min(endIndex, shortages.length)} of{" "}
            {shortages.length} shortages
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-600">Page</span>
              <Select
                value={currentPage.toString()}
                onValueChange={(value) => setCurrentPage(parseInt(value))}
              >
                <SelectTrigger className="w-16 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <SelectItem key={page} value={page.toString()}>
                        {page}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-600">of {totalPages}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

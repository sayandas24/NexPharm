"use client";

import React, { useState, useMemo } from "react";
import { useShortages } from "@/hooks/useShortages";
import useAuth from "@/hooks/use-auth";
import { AlertCircle, ChevronRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import ShortageFilters from "./ShortageFilters";
import ShortageTable from "./ShortageTable";
import QuickReorderDialog, { ReorderData } from "./QuickReorderDialog";
import { ShortageItem } from "@/hooks/useShortages";
import Link from "next/link";

export default function MedicineShortageMain() {
  const { currentPharmacy, currentUser } = useAuth();
  const {
    shortages,
    criticalCount,
    lowStockCount,
    expiringCount,
    loading,
    error,
    updateReorderLevel,
    acknowledgeShortage,
  } = useShortages(currentPharmacy?.id);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [reorderDialogOpen, setReorderDialogOpen] = useState(false);
  const [selectedShortage, setSelectedShortage] = useState<ShortageItem | null>(
    null
  );

  // Filter shortages based on search and filters
  const filteredShortages = useMemo(() => {
    return shortages.filter((shortage) => {
      // Search filter
      const matchesSearch =
        !searchTerm ||
        shortage.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shortage.genericName?.toLowerCase().includes(searchTerm.toLowerCase());

      // Type filter
      const matchesType =
        selectedType === "all" || shortage.shortageType === selectedType;

      // Category filter
      const matchesCategory =
        selectedCategory === "all" || shortage.category === selectedCategory;

      return matchesSearch && matchesType && matchesCategory;
    });
  }, [shortages, searchTerm, selectedType, selectedCategory]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = shortages
      .map((s) => s.category)
      .filter((c): c is string => c !== null && c !== undefined);
    return Array.from(new Set(cats)).sort();
  }, [shortages]);

  // Toggle row expansion
  const handleToggleExpand = (medicineId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(medicineId)) {
        newSet.delete(medicineId);
      } else {
        newSet.add(medicineId);
      }
      return newSet;
    });
  };

  // Handle acknowledge
  const handleAcknowledge = async (medicineId: string) => {
    if (!currentUser?.id) {
      toast.error("User not authenticated");
      return;
    }

    try {
      await acknowledgeShortage(medicineId, currentUser.id);
      toast.success("Shortage acknowledged");
    } catch (err) {
      console.error("Error acknowledging shortage:", err);
      toast.error("Failed to acknowledge shortage");
    }
  };

  // Handle reorder click
  const handleReorderClick = (medicineId: string) => {
    const shortage = shortages.find((s) => s.medicineId === medicineId);
    if (shortage) {
      setSelectedShortage(shortage);
      setReorderDialogOpen(true);
    }
  };

  // Handle reorder submit
  const handleReorderSubmit = async (data: ReorderData) => {
    try {
      // TODO: Implement actual reorder logic (create purchase order, etc.)
      console.log("Reorder data:", data);
      toast.success("Reorder request created successfully");
    } catch (err) {
      console.error("Error creating reorder:", err);
      toast.error("Failed to create reorder request");
      throw err;
    }
  };

  // Handle reorder level update
  const handleUpdateReorderLevel = async (
    medicineId: string,
    newLevel: number
  ) => {
    try {
      await updateReorderLevel(medicineId, newLevel);
      toast.success("Reorder level updated successfully");
    } catch (err) {
      console.error("Error updating reorder level:", err);
      toast.error("Failed to update reorder level");
    }
  };

  // Handle export
  const handleExport = () => {
    try {
      // Create CSV content
      const headers = [
        "Medicine Name",
        "Generic Name",
        "Category",
        "Current Stock",
        "Reorder Level",
        "Shortage Type",
        "Batch Count",
        "Status",
      ];

      const rows = filteredShortages.map((shortage) => [
        shortage.medicineName,
        shortage.genericName || "",
        shortage.category || "",
        shortage.currentStock.toString(),
        shortage.reorderLevel.toString(),
        shortage.shortageType,
        shortage.batches.length.toString(),
        shortage.isAcknowledged ? "Acknowledged" : "Pending",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `${currentPharmacy?.name || "pharmacy"}-shortages-${timestamp}.csv`;

      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Report exported successfully");
    } catch (err) {
      console.error("Error exporting report:", err);
      toast.error("Failed to export report");
    }
  };

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

  // Loading state
  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading shortage data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-red-400 mb-4" />
          <p className="text-gray-600 mb-4">Error loading shortage data</p>
          <p className="text-sm text-gray-500">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <Link href={"/inventory"} className="font-semibold text-gray-700">Inventory</Link>
          <ChevronRight className="h-4 w-4 mx-1" />
          <span>Medicine Shortage ({filteredShortages.length})</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Medicine Shortage Tracking
            </h1>
            <p className="text-gray-600 mt-1">
              Monitor and manage inventory shortages and expiring medicines
            </p>
          </div>
          <Button
            onClick={handleExport}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <ShortageFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
        counts={{
          critical: criticalCount,
          lowStock: lowStockCount,
          expiring: expiringCount,
          total: shortages.length,
        }}
      />

      {/* Shortage Table */}
      <ShortageTable
        shortages={filteredShortages}
        expandedRows={expandedRows}
        onToggleExpand={handleToggleExpand}
        onAcknowledge={handleAcknowledge}
        onReorderClick={handleReorderClick}
        onUpdateReorderLevel={handleUpdateReorderLevel}
      />

      {/* Quick Reorder Dialog */}
      <QuickReorderDialog
        shortage={selectedShortage}
        isOpen={reorderDialogOpen}
        onClose={() => {
          setReorderDialogOpen(false);
          setSelectedShortage(null);
        }}
        onSubmit={handleReorderSubmit}
      />
    </div>
  );
}

"use client";

import React, { useState, useMemo } from "react";
import { useAlerts } from "@/hooks/useAlerts";
import useAuth from "@/hooks/use-auth";
import { AlertCircle, ChevronRight, Download } from "lucide-react";
import Link from "next/link";
import AlertTable from "./AlertTable";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

export default function AlertsMain() {
  const { currentPharmacy, currentUser } = useAuth();
  const {
    alerts,
    loading,
    error,
    lowStockCount,
    expiryCount,
    criticalCount,
    acknowledgeAlert,
  } = useAlerts(currentPharmacy?.id);

  const [activeTab, setActiveTab] = useState<"all" | "low_stock" | "expiry">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<"all" | "critical" | "warning" | "info">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "acknowledged">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = alerts
      .map((a) => a.category)
      .filter((c): c is string => c !== null && c !== undefined);
    return Array.from(new Set(cats)).sort();
  }, [alerts]);

  // Filter alerts based on all filters
  const filteredAlerts = useMemo(() => {
    let filtered = alerts;

    // Tab filter
    if (activeTab !== "all") {
      filtered = filtered.filter((alert) => alert.type === activeTab);
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (alert) =>
          alert.medicineName.toLowerCase().includes(search) ||
          alert.genericName?.toLowerCase().includes(search)
      );
    }

    // Severity filter
    if (severityFilter !== "all") {
      filtered = filtered.filter((alert) => alert.severity === severityFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        filtered = filtered.filter((alert) => !alert.isAcknowledged);
      } else {
        filtered = filtered.filter((alert) => alert.isAcknowledged);
      }
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((alert) => alert.category === categoryFilter);
    }

    return filtered;
  }, [alerts, activeTab, searchTerm, severityFilter, statusFilter, categoryFilter]);

  // Handle acknowledge
  const handleAcknowledge = async (alertId: string, alertType: "low_stock" | "expiry") => {
    if (!currentUser?.id) {
      toast.error("User not authenticated");
      return;
    }

    try {
      await acknowledgeAlert(alertId, alertType, currentUser.id);
      toast.success("Alert acknowledged successfully");
    } catch (err) {
      console.error("Error acknowledging alert:", err);
      toast.error("Failed to acknowledge alert");
    }
  };

  // Handle export
  const handleExport = () => {
    try {
      // Create CSV content
      const headers = [
        "Type",
        "Medicine Name",
        "Generic Name",
        "Category",
        "Severity",
        "Details",
        "Status",
        "Created Date",
      ];

      const rows = filteredAlerts.map((alert) => {
        let details = "";
        if (alert.type === "low_stock") {
          details = `Stock: ${alert.currentStock}/${alert.reorderLevel}`;
        } else {
          details = `Expires: ${new Date(alert.expiryDate!).toLocaleDateString()}, Batch: ${alert.batchNumber}`;
        }

        return [
          alert.type === "low_stock" ? "Low Stock" : "Expiry",
          alert.medicineName,
          alert.genericName || "",
          alert.category || "",
          alert.severity,
          details,
          alert.isAcknowledged ? "Acknowledged" : "Active",
          new Date(alert.createdAt).toLocaleString(),
        ];
      });

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `${currentPharmacy?.name || "pharmacy"}-alerts-${timestamp}.csv`;

      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Alerts exported successfully");
    } catch (err) {
      console.error("Error exporting alerts:", err);
      toast.error("Failed to export alerts");
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedAlerts.size === filteredAlerts.filter(a => !a.isAcknowledged).length) {
      setSelectedAlerts(new Set());
    } else {
      const unacknowledgedIds = filteredAlerts
        .filter(a => !a.isAcknowledged)
        .map(a => a.id);
      setSelectedAlerts(new Set(unacknowledgedIds));
    }
  };

  // Handle select single
  const handleSelectAlert = (alertId: string) => {
    setSelectedAlerts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(alertId)) {
        newSet.delete(alertId);
      } else {
        newSet.add(alertId);
      }
      return newSet;
    });
  };

  // Handle bulk acknowledge
  const handleBulkAcknowledge = async () => {
    if (!currentUser?.id) {
      toast.error("User not authenticated");
      return;
    }

    if (selectedAlerts.size === 0) {
      toast.error("No alerts selected");
      return;
    }

    setBulkProcessing(true);
    let successCount = 0;
    let failCount = 0;

    try {
      const selectedAlertsList = filteredAlerts.filter(a => selectedAlerts.has(a.id));
      
      for (const alert of selectedAlertsList) {
        try {
          await acknowledgeAlert(alert.id, alert.type, currentUser.id);
          successCount++;
        } catch (err) {
          console.error(`Error acknowledging alert ${alert.id}:`, err);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} alert(s) acknowledged successfully`);
      }
      if (failCount > 0) {
        toast.error(`${failCount} alert(s) failed to acknowledge`);
      }

      setSelectedAlerts(new Set());
    } catch (err) {
      console.error("Error in bulk acknowledge:", err);
      toast.error("Failed to acknowledge alerts");
    } finally {
      setBulkProcessing(false);
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
          <p className="text-gray-500">Loading alerts...</p>
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
          <p className="text-gray-600 mb-4">Error loading alerts</p>
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
          <Link href="/inventory" className="font-semibold text-gray-700">
            Inventory
          </Link>
          <ChevronRight className="h-4 w-4 mx-1" />
          <span>Alerts ({filteredAlerts.length})</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Pharmacy Alerts
            </h1>
            <p className="text-gray-600 mt-1">
              Monitor low stock and expiring medicines
            </p>
          </div>
          <Button
            onClick={handleExport}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Low Stock</p>
              <p className="text-2xl font-bold text-orange-600">{lowStockCount}</p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Expiring Soon</p>
              <p className="text-2xl font-bold text-yellow-600">{expiryCount}</p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Critical</p>
              <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Medicine
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Severity Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Severity
            </label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="acknowledged">Acknowledged</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "all"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            All Alerts ({alerts.length})
          </button>
          <button
            onClick={() => setActiveTab("low_stock")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "low_stock"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Low Stock ({lowStockCount})
          </button>
          <button
            onClick={() => setActiveTab("expiry")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "expiry"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Expiring ({expiryCount})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">
              {activeTab === "all" && "No alerts at this time"}
              {activeTab === "low_stock" && "No low stock alerts"}
              {activeTab === "expiry" && "No expiry alerts"}
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-500">
                Showing {filteredAlerts.length} {activeTab === "all" ? "" : activeTab.replace("_", " ")} alerts
              </p>
              {selectedAlerts.size > 0 && (
                <Button
                  onClick={handleBulkAcknowledge}
                  disabled={bulkProcessing}
                  className="flex items-center gap-2"
                >
                  {bulkProcessing ? "Processing..." : `Acknowledge Selected (${selectedAlerts.size})`}
                </Button>
              )}
            </div>
            <AlertTable 
              alerts={filteredAlerts} 
              onAcknowledge={handleAcknowledge}
              selectedAlerts={selectedAlerts}
              onSelectAlert={handleSelectAlert}
              onSelectAll={handleSelectAll}
            />
          </div>
        )}
      </div>
    </div>
  );
}

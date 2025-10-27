import React, { useState } from "react";
import { Alert } from "@/hooks/useAlerts";
import { ChevronDown, ChevronRight, Package, Calendar } from "lucide-react";

interface AlertTableProps {
  alerts: Alert[];
  onAcknowledge: (alertId: string, alertType: "low_stock" | "expiry") => void;
  selectedAlerts?: Set<string>;
  onSelectAlert?: (alertId: string) => void;
  onSelectAll?: () => void;
}

interface ProcessingState {
  [alertId: string]: boolean;
}

export default function AlertTable({ 
  alerts, 
  onAcknowledge,
  selectedAlerts = new Set(),
  onSelectAlert,
  onSelectAll,
}: AlertTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"severity" | "date" | "name">("severity");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [processing, setProcessing] = useState<ProcessingState>({});

  const toggleExpand = (alertId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(alertId)) {
        newSet.delete(alertId);
      } else {
        newSet.add(alertId);
      }
      return newSet;
    });
  };

  const handleSort = (column: "severity" | "date" | "name") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const sortedAlerts = [...alerts].sort((a, b) => {
    let comparison = 0;

    if (sortBy === "severity") {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      comparison = severityOrder[a.severity] - severityOrder[b.severity];
    } else if (sortBy === "date") {
      comparison =
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortBy === "name") {
      comparison = a.medicineName.localeCompare(b.medicineName);
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  const handleAcknowledge = async (alertId: string, alertType: "low_stock" | "expiry") => {
    setProcessing((prev) => ({ ...prev, [alertId]: true }));
    try {
      await onAcknowledge(alertId, alertType);
    } finally {
      setProcessing((prev) => ({ ...prev, [alertId]: false }));
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {onSelectAll && (
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedAlerts.size > 0 && selectedAlerts.size === alerts.filter(a => !a.isAcknowledged).length}
                  onChange={onSelectAll}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
              </th>
            )}
            <th className="w-12 px-4 py-3"></th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort("name")}
            >
              Medicine Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Details
            </th>
            <th
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort("severity")}
            >
              Severity
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedAlerts.map((alert) => (
            <React.Fragment key={alert.id}>
              <tr className="hover:bg-gray-50">
                {onSelectAlert && (
                  <td className="px-4 py-4">
                    {!alert.isAcknowledged && (
                      <input
                        type="checkbox"
                        checked={selectedAlerts.has(alert.id)}
                        onChange={() => onSelectAlert(alert.id)}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                    )}
                  </td>
                )}
                <td className="px-4 py-4">
                  <button
                    onClick={() => toggleExpand(alert.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {expandedRows.has(alert.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {alert.type === "low_stock" ? (
                      <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <Package className="h-4 w-4 text-orange-600" />
                      </div>
                    ) : (
                      <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-yellow-600" />
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {alert.medicineName}
                  </div>
                  {alert.genericName && (
                    <div className="text-sm text-gray-500">
                      {alert.genericName}
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {alert.type === "low_stock" && (
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        Current: {alert.currentStock}
                      </div>
                      <div className="text-sm text-gray-500">
                        Reorder: {alert.reorderLevel}
                      </div>
                    </div>
                  )}
                  {alert.type === "expiry" && (
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {alert.daysUntilExpiry} days
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(alert.expiryDate!).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        Batch: {alert.batchNumber}
                      </div>
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      alert.severity === "critical"
                        ? "bg-red-100 text-red-800"
                        : alert.severity === "warning"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                    title={
                      alert.severity === "critical"
                        ? "Requires immediate attention"
                        : alert.severity === "warning"
                        ? "Needs attention soon"
                        : "For your information"
                    }
                  >
                    {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {alert.isAcknowledged ? (
                    <div>
                      <div className="text-sm font-medium text-green-600">
                        Acknowledged
                      </div>
                      {alert.acknowledgedBy && (
                        <div className="text-xs text-gray-500">
                          {new Date(alert.acknowledgedAt!).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      Active
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  {!alert.isAcknowledged && (
                    <button
                      onClick={() => handleAcknowledge(alert.id, alert.type)}
                      disabled={processing[alert.id]}
                      className={`px-3 py-1 rounded-md font-medium transition-colors ${
                        processing[alert.id]
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-primary text-white hover:bg-primary-dark"
                      }`}
                    >
                      {processing[alert.id] ? "Processing..." : "Acknowledge"}
                    </button>
                  )}
                </td>
              </tr>
              {expandedRows.has(alert.id) && (
                <tr>
                  <td colSpan={onSelectAlert ? 8 : 7} className="px-4 py-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Medicine Information */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">
                          Medicine Information
                        </h4>
                        <dl className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <dt className="text-gray-500">Generic Name:</dt>
                            <dd className="text-gray-900 font-medium">
                              {alert.genericName || "N/A"}
                            </dd>
                          </div>
                          <div className="flex justify-between text-sm">
                            <dt className="text-gray-500">Category:</dt>
                            <dd className="text-gray-900 font-medium">
                              {alert.category || "N/A"}
                            </dd>
                          </div>
                        </dl>
                      </div>

                      {/* Alert Details */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">
                          Alert Details
                        </h4>
                        <dl className="space-y-1">
                          {alert.type === "low_stock" && (
                            <>
                              <div className="flex justify-between text-sm">
                                <dt className="text-gray-500">Current Stock:</dt>
                                <dd className="text-gray-900 font-medium">
                                  {alert.currentStock} units
                                </dd>
                              </div>
                              <div className="flex justify-between text-sm">
                                <dt className="text-gray-500">Reorder Level:</dt>
                                <dd className="text-gray-900 font-medium">
                                  {alert.reorderLevel} units
                                </dd>
                              </div>
                              <div className="flex justify-between text-sm">
                                <dt className="text-gray-500">Status:</dt>
                                <dd className="text-gray-900 font-medium">
                                  {alert.isResolved ? "Resolved" : "Active"}
                                </dd>
                              </div>
                            </>
                          )}
                          {alert.type === "expiry" && (
                            <>
                              <div className="flex justify-between text-sm">
                                <dt className="text-gray-500">Batch Number:</dt>
                                <dd className="text-gray-900 font-medium">
                                  {alert.batchNumber}
                                </dd>
                              </div>
                              <div className="flex justify-between text-sm">
                                <dt className="text-gray-500">Expiry Date:</dt>
                                <dd className="text-gray-900 font-medium">
                                  {new Date(alert.expiryDate!).toLocaleDateString()}
                                </dd>
                              </div>
                              <div className="flex justify-between text-sm">
                                <dt className="text-gray-500">Days Until Expiry:</dt>
                                <dd className="text-gray-900 font-medium">
                                  {alert.daysUntilExpiry} days
                                </dd>
                              </div>
                              <div className="flex justify-between text-sm">
                                <dt className="text-gray-500">Available Quantity:</dt>
                                <dd className="text-gray-900 font-medium">
                                  {alert.availableQuantity} units
                                </dd>
                              </div>
                              <div className="flex justify-between text-sm">
                                <dt className="text-gray-500">Alert Type:</dt>
                                <dd className="text-gray-900 font-medium">
                                  {alert.alertType?.replace("_", " ")}
                                </dd>
                              </div>
                            </>
                          )}
                          <div className="flex justify-between text-sm">
                            <dt className="text-gray-500">Created:</dt>
                            <dd className="text-gray-900 font-medium">
                              {new Date(alert.createdAt).toLocaleString()}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

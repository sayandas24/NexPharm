"use client";

import React from "react";
import { RecentScan } from "@/types/scanner-types";
import { Badge } from "@/components/ui/badge";
import { Clock, Package } from "lucide-react";
import { recentScansService } from "@/services/recent-scans.service";

interface RecentScansProps {
  scans: RecentScan[];
  onSelectScan: (scan: RecentScan) => void;
}

export default function RecentScans({
  scans,
  onSelectScan,
}: RecentScansProps) {
  if (scans.length === 0) {
    return null;
  }

  const formatTimestamp = (timestamp: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return timestamp.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-gray-600" />
        <h3 className="text-sm font-semibold text-gray-900">Recent Scans</h3>
      </div>

      <div className="space-y-2">
        {scans.map((scan) => (
          <button
            key={scan.id}
            onClick={() => onSelectScan(scan)}
            className="w-full p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors text-left"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Package className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {scan.medicine.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatTimestamp(scan.timestamp)}
                  </p>
                </div>
              </div>
              <Badge
                variant={recentScansService.getStockStatusVariant(
                  scan.stockStatus
                )}
                className="ml-2 flex-shrink-0"
              >
                {recentScansService.getStockStatusText(scan.stockStatus)}
              </Badge>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

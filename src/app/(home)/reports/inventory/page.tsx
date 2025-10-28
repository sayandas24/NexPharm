"use client";

import React from "react";
import InventoryReportMain from "@/components/main-components/inventory/inventory-report/InventoryReportMain";
import useAuth from "@/hooks/use-auth";
import { ChevronRight, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function InventoryReportPage() {
  const { currentPharmacy } = useAuth();
  if (!currentPharmacy) {
    return <Loader2 className="animate-spin h-8 w-8 text-gray-400" />;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <Link href="/reports" className="font-semibold text-gray-700">
            Reports
          </Link>
          <ChevronRight className="h-4 w-4 mx-1" />
          <span>Inventory Report</span>
        </div>
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Inventory Report
            </h1>
            <p className="text-gray-600 mt-1">
              Comprehensive inventory analysis and insights
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <InventoryReportMain />
    </div>
  );
}

"use client";
import { Shield, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { InventoryStatus } from "@/hooks/useDashboard";

interface InventoryStatusCardProps {
  status: InventoryStatus;
  loading?: boolean;
}

export function InventoryStatusCard({
  status,
  loading,
}: InventoryStatusCardProps) {
  const router = useRouter();

  const statusConfig = {
    Good: {
      borderColor: "border-emerald-600",
      iconColor: "text-emerald-600",
      buttonBg: "bg-emerald-200",
      buttonText: "text-emerald-900",
      buttonHover: "hover:bg-emerald-300",
    },
    Warning: {
      borderColor: "border-yellow-600",
      iconColor: "text-yellow-600",
      buttonBg: "bg-yellow-200",
      buttonText: "text-yellow-900",
      buttonHover: "hover:bg-yellow-300",
    },
    Critical: {
      borderColor: "border-red-600",
      iconColor: "text-red-600",
      buttonBg: "bg-red-200",
      buttonText: "text-red-900",
      buttonHover: "hover:bg-red-300",
    },
  };

  const config = statusConfig[status];

  if (loading) {
    return (
      <div className="relative rounded-xl border-2 h-[13rem] border-gray-300 overflow-hidden bg-gray-200 flex flex-col">
        {/* Upper white section */}
        <div className="h-full bg-white rounded-xl flex flex-col items-center justify-center">
          <div className="flex flex-col items-center space-y-2">
            {/* Icon skeleton */}
            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
            {/* Text skeletons */}
            <div className="space-y-2 flex flex-col items-center">
              <div className="h-7 bg-gray-200 rounded w-20 animate-pulse" />
              <div className="h-7 bg-gray-200 rounded w-36 animate-pulse" />
            </div>
          </div>
        </div>
        {/* Bottom action area skeleton */}
        <div className="relative w-full flex justify-center h-8">
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-xl border-2 h-[13rem] ${config.borderColor} overflow-hidden ${config.buttonBg} flex flex-col`}
    >
      {/* Upper white section */}
      <div className=" h-full bg-white rounded-xl flex flex-col items-center justify-center">
        <div className="flex flex-col items-center space-y-2 rounded-xl">
          {/* Icon */}
          <div className="w-10 h-10 flex items-center justify-center">
            <Shield
              className={`w-10 h-10 ${config.iconColor}`}
              strokeWidth={2.5}
            />
          </div>

          {/* Status Text */}
          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-900 mb-1">{status}</h2>
            <p className="text-lg text-gray-700">Inventory Status</p>
          </div>
        </div>
      </div>

      {/* Curved transition */}
      <div
        className="relative cursor-pointer w-full flex justify-center h-8 opacity-75"
        onClick={() => router.push("/reports/inventory")}
      >
        <span className="flex gap-1 items-center text-sm">
          View Full details <ChevronRight className="w-4 h-4" strokeWidth={3} />
          <ChevronRight className="w-4 h-4 -ml-3" strokeWidth={3} />
        </span>
      </div>
    </div>
  );
}

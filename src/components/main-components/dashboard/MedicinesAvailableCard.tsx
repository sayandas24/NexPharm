"use client";
import { Package, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface MedicinesAvailableCardProps {
  count: number;
  loading?: boolean;
}

export function MedicinesAvailableCard({ count, loading }: MedicinesAvailableCardProps) {
  const router = useRouter();

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
              <div className="h-7 bg-gray-200 rounded w-16 animate-pulse" />
              <div className="h-7 bg-gray-200 rounded w-44 animate-pulse" />
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
      className="relative rounded-xl border-2 h-[13rem] border-blue-600 overflow-hidden bg-blue-200 flex flex-col"
    >
      {/* Upper white section */}
      <div className="h-full bg-white rounded-xl flex flex-col items-center justify-center">
        <div className="flex flex-col items-center space-y-2 rounded-xl">
          {/* Icon */}
          <div className="w-10 h-10 flex items-center justify-center">
            <Package
              className="w-10 h-10 text-blue-600"
              strokeWidth={2.5}
            />
          </div>
          {/* Count and Label */}
          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-900 mb-1">{count}</h2>
            <p className="text-lg text-gray-700">Medicines Available</p>
          </div>
        </div>
      </div>
      {/* Bottom action area */}
      <div
        className="relative cursor-pointer w-full flex justify-center h-8 opacity-75"
        onClick={() => router.push("/inventory/med-list")}
      >
        <span className="flex gap-1 items-center text-sm">
          Visit Inventory <ChevronRight className="w-4 h-4" strokeWidth={3} />
          <ChevronRight className="w-4 h-4 -ml-3" strokeWidth={3} />
        </span>
      </div>
    </div>
  );
}
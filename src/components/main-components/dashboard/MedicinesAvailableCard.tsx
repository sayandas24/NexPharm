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
      <div className="relative rounded-xl border-2 h-[13rem] md:h-[10rem] border-gray-300 overflow-hidden bg-gray-200 flex flex-col">
        {/* Upper white section */}
        <div className="h-full bg-white rounded-xl flex flex-col items-center justify-center">
          <div className="flex flex-col items-center space-y-1 md:space-y-2">
            {/* Icon skeleton */}
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-200 rounded-full animate-pulse" />
            {/* Text skeletons */}
            <div className="space-y-1 md:space-y-2 flex flex-col items-center">
              <div className="h-5 md:h-7 bg-gray-200 rounded w-16 animate-pulse" />
              <div className="h-5 md:h-7 bg-gray-200 rounded w-44 animate-pulse" />
            </div>
          </div>
        </div>
        {/* Bottom action area skeleton */}
        <div className="relative w-full flex justify-center h-7 md:h-8">
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative rounded-xl border-2 h-[13rem] md:h-[10rem] border-blue-600 overflow-hidden bg-blue-200 flex flex-col"
    >
      {/* Upper white section */}
      <div className="h-full bg-white rounded-xl flex flex-col items-center justify-center">
        <div className="flex flex-col items-center space-y-1 md:space-y-2 rounded-xl">
          {/* Icon */}
          <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center">
            <Package
              className="w-8 h-8 md:w-10 md:h-10 text-blue-600"
              strokeWidth={2.5}
            />
          </div>
          {/* Count and Label */}
          <div className="text-center">
            <h2 className="text-base md:text-lg font-bold text-gray-900 mb-0.5 md:mb-1">{count}</h2>
            <p className="text-base md:text-lg text-gray-700">Medicines Available</p>
          </div>
        </div>
      </div>
      {/* Bottom action area */}
      <div
        className="relative cursor-pointer w-full flex justify-center h-7 md:h-8 opacity-75"
        onClick={() => router.push("/inventory/med-list")}
      >
        <span className="flex gap-1 items-center text-xs md:text-sm">
          Visit Inventory <ChevronRight className="w-3 h-3 md:w-4 md:h-4" strokeWidth={3} />
          <ChevronRight className="w-3 h-3 md:w-4 md:h-4 -ml-2 md:-ml-3" strokeWidth={3} />
        </span>
      </div>
    </div>
  );
}
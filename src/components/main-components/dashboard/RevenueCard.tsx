"use client";
import { IndianRupee, ChevronRight, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

type TimePeriod = "today" | "week" | "month" | "year";

interface RevenueCardProps {
  revenue: number;
  period: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  loading?: boolean;
}

export function RevenueCard({ revenue, period, onPeriodChange, loading }: RevenueCardProps) {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const periodLabels: Record<TimePeriod, string> = {
    today: "Today",
    week: "This Week",
    month: "This Month",
    year: "This Year",
  };

  // Format number in Indian rupee format
  const formatIndianCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
              <div className="h-7 bg-gray-200 rounded w-28 animate-pulse" />
              <div className="h-7 bg-gray-200 rounded w-24 animate-pulse" />
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
      className="relative rounded-xl border-2 h-[13rem] border-green-600 bg-green-200 flex flex-col"
    >
      {/* Upper white section */}
      <div className="h-full bg-white rounded-xl flex flex-col items-center justify-center">
        <div className="flex flex-col items-center space-y-2 rounded-xl">
          {/* Icon */}
          <div className="w-10 h-10 flex items-center justify-center">
            <IndianRupee
              className="w-10 h-10 text-green-600"
              strokeWidth={2.5}
            />
          </div>
          {/* Revenue Amount */}
          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              {formatIndianCurrency(revenue)}
            </h2>
            {/* Period Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1 text-lg text-gray-700 hover:text-gray-900 transition-colors"
              >
                {periodLabels[period]}
                <ChevronDown className="w-4 h-4" />
              </button>
              {isDropdownOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white border border-green-200 rounded-lg shadow-lg z-10 min-w-[140px]">
                  {(Object.keys(periodLabels) as TimePeriod[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        onPeriodChange(p);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-green-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                        p === period ? "bg-green-50 text-green-700 font-medium" : "text-gray-700"
                      }`}
                    >
                      {periodLabels[p]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Curved transition */}
      <div
        className="relative cursor-pointer w-full flex justify-center h-8 opacity-75"
        onClick={() => router.push("/reports/sales")}
      >
        <span className="flex gap-1 items-center text-sm">
          View Full details <ChevronRight className="w-4 h-4" strokeWidth={3} />
          <ChevronRight className="w-4 h-4 -ml-3" strokeWidth={3} />
        </span>
      </div>
    </div>
  );
}
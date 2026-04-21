"use client";
import { IndianRupee, ChevronRight, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

type TimePeriod = "today" | "week" | "month" | "year";

interface RevenueCardProps {
  revenue: number;
  period: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  loading?: boolean;
}

export function RevenueCard({
  revenue,
  period,
  onPeriodChange,
  loading,
}: RevenueCardProps) {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const periodLabels: Record<TimePeriod, string> = {
    today: "Today",
    week: "This Week",
    month: "This Month",
    year: "This Year",
  };

  const formatIndianCurrency = (amount: number): string =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  /**
   * Capture the trigger's viewport position when opening so the portal-rendered
   * dropdown can be placed precisely below the button, independent of ancestors.
   */
  const openDropdown = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + rect.width / 2 + window.scrollX,
      });
    }
    setIsDropdownOpen(true);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      )
        return;
      setIsDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  // Close on scroll or resize to avoid the menu floating away from the trigger
  useEffect(() => {
    if (!isDropdownOpen) return;
    const close = () => setIsDropdownOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [isDropdownOpen]);

  if (loading) {
    return (
      <div className="relative rounded-xl border-2 h-[13rem] md:h-[10rem] border-gray-300 overflow-hidden bg-gray-200 flex flex-col">
        <div className="h-full bg-white rounded-xl flex flex-col items-center justify-center">
          <div className="flex flex-col items-center space-y-1 md:space-y-2">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-200 rounded-full animate-pulse" />
            <div className="space-y-1 md:space-y-2 flex flex-col items-center">
              <div className="h-5 md:h-7 bg-gray-200 rounded w-28 animate-pulse" />
              <div className="h-5 md:h-7 bg-gray-200 rounded w-24 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="relative w-full flex justify-center h-7 md:h-8"></div>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl border-2 h-[13rem] md:h-[10rem] border-green-600 bg-green-200 flex flex-col">
      {/* Upper white section */}
      <div className="h-full bg-white rounded-xl flex flex-col items-center justify-center">
        <div className="flex flex-col items-center space-y-1 md:space-y-2 rounded-xl">
          {/* Icon */}
          <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center">
            <IndianRupee
              className="w-8 h-8 md:w-10 md:h-10 text-green-600"
              strokeWidth={2.5}
            />
          </div>

          {/* Revenue Amount */}
          <div className="text-center">
            <h2 className="text-base md:text-lg font-bold text-gray-900 mb-0.5 md:mb-1">
              {formatIndianCurrency(revenue)}
            </h2>

            {/* Period trigger button */}
            <button
              ref={triggerRef}
              onClick={() =>
                isDropdownOpen ? setIsDropdownOpen(false) : openDropdown()
              }
              className="flex items-center gap-1 text-base md:text-lg text-gray-700 hover:text-gray-900 transition-colors"
            >
              {periodLabels[period]}
              <ChevronDown
                className={`w-3 h-3 md:w-4 md:h-4 transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="relative cursor-pointer w-full flex justify-center h-7 md:h-8 opacity-75"
        onClick={() => router.push("/reports/sales")}
      >
        <span className="flex gap-1 items-center text-xs md:text-sm">
          View Full details{" "}
          <ChevronRight className="w-3 h-3 md:w-4 md:h-4" strokeWidth={3} />
          <ChevronRight
            className="w-3 h-3 md:w-4 md:h-4 -ml-2 md:-ml-3"
            strokeWidth={3}
          />
        </span>
      </div>

      {/*
       * Portal dropdown — rendered directly under <body> so it escapes
       * the card's fixed height and any ancestor stacking/overflow constraints.
       * z-index via inline style to guarantee precedence over Tailwind's layers.
       */}
      {isDropdownOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "absolute",
              top: dropdownPos.top,
              left: dropdownPos.left,
              transform: "translateX(-50%)",
              zIndex: 9999,
            }}
            className="bg-white border border-green-200 rounded-lg shadow-xl max-w-[140px]"
          >
            {(Object.keys(periodLabels) as TimePeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => {
                  onPeriodChange(p);
                  setIsDropdownOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-green-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                  p === period
                    ? "bg-green-50 text-green-700 font-medium"
                    : "text-gray-700"
                }`}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}

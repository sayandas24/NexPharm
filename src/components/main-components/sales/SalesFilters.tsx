"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface SalesFiltersProps {
  period: "daily" | "weekly" | "monthly" | "all";
  onPeriodChange: (period: "daily" | "weekly" | "monthly" | "all") => void;
  customDateRange: { start: Date | null; end: Date | null };
  onCustomDateChange: (range: { start: Date | null; end: Date | null }) => void;
  isCustomRange: boolean;
  onToggleCustomRange: () => void;
}

export default function SalesFilters({
  period,
  onPeriodChange,
  customDateRange,
  onCustomDateChange,
  isCustomRange,
  onToggleCustomRange,
}: SalesFiltersProps) {
  const periods = [
    { value: "daily" as const, label: "Today" },
    { value: "weekly" as const, label: "Last 7 Days" },
    { value: "monthly" as const, label: "Last 30 Days" },
    { value: "all" as const, label: "All Time" },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 bg-white rounded-lg border">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">Filter by:</span>
          <div className="flex gap-2   flex-wrap">
            {periods.map((p) => (
              <Button
                key={p.value}
                variant={
                  !isCustomRange && period === p.value ? "default" : "outline"
                }
                size="sm"
                onClick={() => {
                  if (isCustomRange) onToggleCustomRange();
                  onPeriodChange(p.value);
                }}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>

        <Button
          variant={isCustomRange ? "default" : "outline"}
          size="sm"
          onClick={onToggleCustomRange}
        >
          Custom Range
        </Button>
      </div>

      {isCustomRange && (
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm">From:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-[200px] justify-start"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customDateRange.start
                    ? format(customDateRange.start, "PPP")
                    : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={customDateRange.start || undefined}
                  onSelect={(date) =>
                    onCustomDateChange({
                      ...customDateRange,
                      start: date || null,
                    })
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm">To:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-[200px] justify-start"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customDateRange.end
                    ? format(customDateRange.end, "PPP")
                    : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={customDateRange.end || undefined}
                  onSelect={(date) =>
                    onCustomDateChange({
                      ...customDateRange,
                      end: date || null,
                    })
                  }
                  initialFocus
                  disabled={(date) =>
                    customDateRange.start ? date < customDateRange.start : false
                  }
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}
    </div>
  );
}

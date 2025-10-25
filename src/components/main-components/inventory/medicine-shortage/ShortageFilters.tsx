"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ShortageFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedType: string;
  onTypeChange: (type: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
  counts: {
    critical: number;
    lowStock: number;
    expiring: number;
    total: number;
  };
}

export default function ShortageFilters({
  searchTerm,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedCategory,
  onCategoryChange,
  categories,
  counts,
}: ShortageFiltersProps) {
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(debouncedSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [debouncedSearch, onSearchChange]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      {/* Summary Badges */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Badge
          variant="outline"
          className="px-3 py-1.5 bg-red-50 text-red-700 border-red-200"
        >
          <span className="font-semibold">{counts.critical}</span>
          <span className="ml-1.5">Critical</span>
        </Badge>
        <Badge
          variant="outline"
          className="px-3 py-1.5 bg-orange-50 text-orange-700 border-orange-200"
        >
          <span className="font-semibold">{counts.lowStock}</span>
          <span className="ml-1.5">Low Stock</span>
        </Badge>
        <Badge
          variant="outline"
          className="px-3 py-1.5 bg-blue-50 text-blue-700 border-blue-200"
        >
          <span className="font-semibold">{counts.expiring}</span>
          <span className="ml-1.5">Expiring Soon</span>
        </Badge>
        <Badge
          variant="outline"
          className="px-3 py-1.5 bg-gray-50 text-gray-700 border-gray-200"
        >
          <span className="font-semibold">{counts.total}</span>
          <span className="ml-1.5">Total Issues</span>
        </Badge>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        {/* Search Input */}
        <div className="flex-1 w-full md:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by medicine name or generic name..."
              className="pl-10"
              value={debouncedSearch}
              onChange={(e) => setDebouncedSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Shortage Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <Select value={selectedType} onValueChange={onTypeChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="low-stock">Low Stock</SelectItem>
                <SelectItem value="expiring">Expiring Soon</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <Select value={selectedCategory} onValueChange={onCategoryChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCustomers } from "@/hooks/useCustomers";
import { CustomerTable } from "./CustomerTable";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Users, TrendingUp } from "lucide-react";

interface CustomerListMainProps {
  pharmacyId: string;
}

type SortColumn = "name" | "purchases" | "spending";
type SortOrder = "asc" | "desc";

export function CustomerListMain({ pharmacyId }: CustomerListMainProps) {
  const router = useRouter();
  const { customers, loading, error, searchCustomers } = useCustomers(pharmacyId);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortColumn>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Debounced search
  const filteredCustomers = useMemo(() => {
    return searchCustomers(searchQuery);
  }, [searchCustomers, searchQuery]);

  // Sorted customers
  const sortedCustomers = useMemo(() => {
    const sorted = [...filteredCustomers];
    
    sorted.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "purchases":
          comparison = a.total_purchases - b.total_purchases;
          break;
        case "spending":
          comparison = a.total_spending - b.total_spending;
          break;
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });
    
    return sorted;
  }, [filteredCustomers, sortBy, sortOrder]);

  // Calculate summary stats
  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.total_spending, 0);

  // Handle sort
  const handleSort = useCallback((column: SortColumn) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  }, [sortBy, sortOrder]);

  // Handle customer click
  const handleCustomerClick = useCallback((customerId: string) => {
    router.push(`/pos/customers/${customerId}`);
  }, [router]);

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-gray-500 mb-5">
        <button onClick={() => router.push("/")} className="hover:text-gray-700">
          Dashboard
        </button>
        <span className="mx-2">›</span>
        <button onClick={() => router.push("/pos")} className="hover:text-gray-700">
          POS
        </button>
        <span className="mx-2">›</span>
        <span className="text-gray-900 font-semibold">Customers</span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
        <p className="text-gray-600 mt-1">View and manage your customer database</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{totalCustomers}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{totalRevenue.toFixed(2)}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by name or phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Customer Table */}
      {loading ? (
        <Card className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        </Card>
      ) : (
        <CustomerTable
          customers={sortedCustomers}
          onCustomerClick={handleCustomerClick}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      )}
    </div>
  );
}

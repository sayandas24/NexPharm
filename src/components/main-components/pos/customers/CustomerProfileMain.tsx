"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCustomers, CustomerWithStats, CustomerAnalytics } from "@/hooks/useCustomers";
import { CustomerInfoCard } from "./CustomerInfoCard";
import { CustomerAnalyticsCard } from "./CustomerAnalyticsCard";
import { PurchaseHistoryTable } from "./PurchaseHistoryTable";
import { TopMedicinesCard } from "./TopMedicinesCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface CustomerProfileMainProps {
  customerId: string;
  pharmacyId: string;
}

export function CustomerProfileMain({
  customerId,
  pharmacyId,
}: CustomerProfileMainProps) {
  const router = useRouter();
  const { getCustomerById, getCustomerAnalytics, loading, error } = useCustomers(pharmacyId);
  
  const [customer, setCustomer] = useState<CustomerWithStats | null>(null);
  const [analytics, setAnalytics] = useState<CustomerAnalytics | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const customerData = await getCustomerById(customerId);
      const analyticsData = await getCustomerAnalytics(customerId);
      
      setCustomer(customerData);
      setAnalytics(analyticsData);
    };

    fetchData();
  }, [customerId, getCustomerById, getCustomerAnalytics]);

  if (loading && !customer) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading customer details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Customer Not Found
          </h3>
          <p className="text-red-600 mb-4">
            {error || "The customer you're looking for doesn't exist."}
          </p>
          <Button onClick={() => router.push("/pos/customers")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Customers
          </Button>
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
        <button
          onClick={() => router.push("/pos/customers")}
          className="hover:text-gray-700"
        >
          Customers
        </button>
        <span className="mx-2">›</span>
        <span className="text-gray-900 font-semibold">{customer.name}</span>
      </div>

      {/* Back Button */}
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push("/pos/customers")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Customers
        </Button>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
        <p className="text-gray-600 mt-1">Customer Profile & Purchase History</p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          <CustomerInfoCard customer={customer} />
          {analytics && <CustomerAnalyticsCard analytics={analytics} />}
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2">
          <PurchaseHistoryTable
            customerId={customerId}
            pharmacyId={pharmacyId}
          />
        </div>
      </div>

      {/* Full Width Section */}
      <div className="mt-6">
        <TopMedicinesCard customerId={customerId} />
      </div>
    </div>
  );
}

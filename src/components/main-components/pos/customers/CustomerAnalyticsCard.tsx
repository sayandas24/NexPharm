"use client";

import { Card } from "@/components/ui/card";
import { CustomerAnalytics } from "@/hooks/useCustomers";
import { IndianRupee, ShoppingBag, Calculator, Calendar, Clock } from "lucide-react";

interface CustomerAnalyticsCardProps {
  analytics: CustomerAnalytics;
}

export function CustomerAnalyticsCard({ analytics }: CustomerAnalyticsCardProps) {
  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Calculator className="h-5 w-5 mr-2 text-green-600" />
        Customer Analytics
      </h3>

      <div className="space-y-4">
        {/* Total Lifetime Spending */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center mb-2">
            <IndianRupee className="h-5 w-5 mr-2 text-green-600" />
            <p className="text-sm text-green-700 font-medium">Total Lifetime Spending</p>
          </div>
          <p className="text-3xl font-bold text-green-900">
            {formatCurrency(analytics.total_spending)}
          </p>
        </div>

        {/* Grid of Metrics */}
        <div className="grid grid-cols-2 gap-4">
          {/* Total Purchases */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-center mb-1">
              <ShoppingBag className="h-4 w-4 mr-1 text-blue-600" />
              <p className="text-xs text-blue-700">Total Purchases</p>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {analytics.total_purchases}
            </p>
          </div>

          {/* Average Transaction */}
          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
            <div className="flex items-center mb-1">
              <Calculator className="h-4 w-4 mr-1 text-purple-600" />
              <p className="text-xs text-purple-700">Avg Transaction</p>
            </div>
            <p className="text-lg font-bold text-purple-900">
              {formatCurrency(analytics.average_transaction_value)}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-4"></div>

        {/* First Purchase */}
        <div className="flex items-start">
          <Calendar className="h-4 w-4 mr-2 mt-1 text-gray-500" />
          <div>
            <p className="text-xs text-gray-600">First Purchase</p>
            <p className="text-sm font-medium text-gray-900">
              {formatDate(analytics.first_purchase_date)}
            </p>
          </div>
        </div>

        {/* Most Recent Purchase */}
        <div className="flex items-start">
          <Clock className="h-4 w-4 mr-2 mt-1 text-gray-500" />
          <div>
            <p className="text-xs text-gray-600">Most Recent Purchase</p>
            <p className="text-sm font-medium text-gray-900">
              {formatDate(analytics.last_purchase_date)}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

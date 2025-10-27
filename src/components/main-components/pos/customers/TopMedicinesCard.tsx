"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useCustomers, TopMedicine } from "@/hooks/useCustomers";
import { Pill, ShoppingCart, TrendingUp } from "lucide-react";

interface TopMedicinesCardProps {
  customerId: string;
}

export function TopMedicinesCard({ customerId }: TopMedicinesCardProps) {
  const { getTopMedicines, loading } = useCustomers();
  const [topMedicines, setTopMedicines] = useState<TopMedicine[]>([]);

  useEffect(() => {
    const fetchTopMedicines = async () => {
      const data = await getTopMedicines(customerId, 5);
      setTopMedicines(data);
    };

    fetchTopMedicines();
  }, [customerId, getTopMedicines]);

  if (loading && topMedicines.length === 0) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </Card>
    );
  }

  if (topMedicines.length === 0) {
    return (
      <Card className="p-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-orange-600" />
          Most Purchased Medicines
        </h3>
        <div className="text-center text-muted-foreground">
          <p className="text-base">No purchase data available</p>
          <p className="text-sm mt-2">This customer has not purchased any medicines yet</p>
        </div>
      </Card>
    );
  }

  // Find max quantity for progress bar calculation
  const maxQuantity = Math.max(...topMedicines.map((m) => m.total_quantity));

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-6 flex items-center">
        <TrendingUp className="h-5 w-5 mr-2 text-orange-600" />
        Most Purchased Medicines
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {topMedicines.map((medicine, index) => {
          const percentage = (medicine.total_quantity / maxQuantity) * 100;

          return (
            <div
              key={index}
              className="bg-gradient-to-br from-orange-50 to-yellow-50 p-4 rounded-lg border border-orange-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">
                    {medicine.medicine_name}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <div className="flex items-center">
                      <Pill className="h-3 w-3 mr-1 text-orange-600" />
                      <span className="font-medium">{medicine.total_quantity} units</span>
                    </div>
                    <div className="flex items-center">
                      <ShoppingCart className="h-3 w-3 mr-1 text-blue-600" />
                      <span>{medicine.purchase_count} purchases</span>
                    </div>
                  </div>
                </div>
                <div className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded">
                  #{index + 1}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-orange-500 to-yellow-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

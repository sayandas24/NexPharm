"use client";

import React from "react";
import { MedicineMatch, StockInfo } from "@/types/scanner-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package,
  Building2,
  Pill,
  AlertTriangle,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { stockCheckerService } from "@/services/stock-checker.service";
import Link from "next/link";

interface MedicineCardProps {
  match: MedicineMatch;
  stockInfo: StockInfo | null;
  onViewDetails: () => void;
}

export default function MedicineCard({
  match,
  stockInfo,
  onViewDetails,
}: MedicineCardProps) {
  const { medicine } = match;

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4">
        <h2 className="text-xl font-bold mb-1">{medicine.name}</h2>
        {medicine.generic_name && (
          <p className="text-red-100 text-sm">{medicine.generic_name}</p>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Stock Status */}
        {stockInfo && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Stock Quantity
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stockInfo.totalQuantity}
                </p>
              </div>
            </div>
            <Badge
              variant={stockCheckerService.getStockStatusVariant(
                stockInfo.totalQuantity,
                stockInfo.isLowStock
              )}
              className="text-sm"
            >
              {stockCheckerService.getStockStatusText(
                stockInfo.totalQuantity,
                stockInfo.isLowStock
              )}
            </Badge>
          </div>
        )}

        {/* Low Stock Warning */}
        {stockInfo && stockInfo.isLowStock && stockInfo.totalQuantity > 0 && (
          <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-orange-900">Low Stock Alert</p>
              <p className="text-orange-700">
                Stock is below reorder level ({stockInfo.reorderLevel} units).
                Consider reordering soon.
              </p>
            </div>
          </div>
        )}

        {/* Out of Stock Warning */}
        {stockInfo && stockInfo.totalQuantity === 0 && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-red-900">Out of Stock</p>
              <p className="text-red-700">
                This medicine is currently out of stock. Please reorder.
              </p>
            </div>
          </div>
        )}

        {/* Medicine Details */}
        <div className="space-y-3">
          {medicine.manufacturer && (
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 uppercase">Manufacturer</p>
                <p className="text-sm font-medium text-gray-900">
                  {medicine.manufacturer}
                </p>
              </div>
            </div>
          )}

          {medicine.strength && (
            <div className="flex items-start gap-3">
              <Pill className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 uppercase">Strength</p>
                <p className="text-sm font-medium text-gray-900">
                  {medicine.strength}
                </p>
              </div>
            </div>
          )}

          {medicine.category && (
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 uppercase">Category</p>
                <p className="text-sm font-medium text-gray-900">
                  {medicine.category}
                </p>
              </div>
            </div>
          )}

          {medicine.mrp && (
            <div className="flex items-start gap-3">
              <div className="h-5 w-5 flex items-center justify-center text-gray-400 flex-shrink-0 mt-0.5">
                ₹
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">MRP</p>
                <p className="text-sm font-medium text-gray-900">
                  ₹{medicine.mrp.toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Batch Information */}
        {stockInfo && stockInfo.availableBatches.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Available Batches ({stockInfo.availableBatches.length})
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {stockInfo.availableBatches.slice(0, 3).map((batch) => (
                <div
                  key={batch.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {batch.batch_number}
                    </p>
                    <p className="text-xs text-gray-500">
                      Qty: {batch.available_quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <p
                        className={`text-xs ${stockCheckerService.getExpiryStatusColor(
                          batch.expiry_date
                        )}`}
                      >
                        {stockCheckerService.formatExpiryDate(batch.expiry_date)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {stockInfo.availableBatches.length > 3 && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                +{stockInfo.availableBatches.length - 3} more batches
              </p>
            )}
          </div>
        )}

        {/* Near Expiry Warning */}
        {stockInfo && stockInfo.nearExpiryBatches.length > 0 && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-yellow-900">
                Near Expiry Alert
              </p>
              <p className="text-yellow-700">
                {stockInfo.nearExpiryBatches.length} batch(es) expiring within
                30 days.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 bg-gray-50 border-t">
        <Button
          onClick={onViewDetails}
          className="w-full bg-red-500 hover:bg-red-600"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          View Full Details
        </Button>
      </div>
    </div>
  );
}

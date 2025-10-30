/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import {
  MedicineMatch,
  StockInfo,
  SupplierInfo,
  SalesStatistics,
} from "@/types/scanner-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package,
  Building2,
  Pill,
  AlertTriangle,
  Calendar,
  ExternalLink,
  ShoppingCart,
  RotateCcw,
  Package2,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  Barcode,
  Thermometer,
  Tag,
  AlertCircle,
  Clock,
} from "lucide-react";
import { stockCheckerService } from "@/services/stock-checker.service";

interface EnhancedMedicineCardProps {
  match: MedicineMatch;
  stockInfo: StockInfo | null;
  salesStats: SalesStatistics | null;
  onViewDetails: () => void;
  onAddToCart: () => void;
  onViewBatches: () => void;
}

export default function EnhancedMedicineCard({
  match,
  stockInfo,
  salesStats,
  onViewDetails,
  onAddToCart,
  onViewBatches,
}: EnhancedMedicineCardProps) {
  const { medicine } = match;
  const [showAllBatches, setShowAllBatches] = useState(false);

  console.log(match.medicine.medicine_image_url)

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden shadow-lg ">
      {/* Header with Gradient */}
       <div className="bg-gradient-to-r from-purple-500 to-purple-300 text-white p-2">
        <div className="flex items-center gap-4">
          {/* Medicine Image */}
          {medicine.medicine_image_url && (
            <div className="flex-shrink-0 ">
              <div className="w-[9rem] h-[9rem] bg-white rounded-lg overflow-hidden shadow-lg border-2 border-white/20">
                <img
                  src={medicine.medicine_image_url}
                  alt={medicine.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}
          
          {/* Text Content */}
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold mb-2">{medicine.name}</h2>
            {medicine.generic_name && (
              <p className="text-purple-100 text-base">{medicine.generic_name}</p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-[500px]:p-3 space-y-6">
        {/* Stock Status Section */}
        {stockInfo && (
          <div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <Package className="h-6 w-6 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Stock Quantity
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stockInfo.totalQuantity}
                  </p>
                </div>
              </div>
              <Badge
                className={`text-base px-4 py-2 ${
                  stockInfo.isLowStock ? "bg-red-500" : "bg-green-500"
                }`}
              >
                {stockCheckerService.getStockStatusText(
                  stockInfo.totalQuantity,
                  stockInfo.isLowStock
                )}
              </Badge>
            </div>

            {/* Low Stock Warning */}
            {stockInfo.isLowStock && stockInfo.totalQuantity > 0 && (
              <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg mt-4">
                <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-orange-900">
                    Low Stock Alert
                  </p>
                  <p className="text-orange-700">
                    Stock is below reorder level ({stockInfo.reorderLevel}{" "}
                    units). Consider reordering soon.
                  </p>
                </div>
              </div>
            )}

            {/* Out of Stock Warning */}
            {stockInfo.totalQuantity === 0 && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mt-4">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-red-900">Out of Stock</p>
                  <p className="text-red-700">
                    This medicine is currently out of stock. Please reorder
                    immediately.
                  </p>
                </div>
              </div>
            )}

            {/* Near Expiry Warning */}
            {stockInfo.nearExpiryBatches.length > 0 && (
              <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg mt-4">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-yellow-900">
                    Near Expiry Alert
                  </p>
                  <p className="text-yellow-700">
                    {stockInfo.nearExpiryBatches.length} batch(es) expiring
                    within 30 days.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* mark Medicine Details Section */}
        <MedicineDetailsMore medicine={medicine} />

        {/* Batch Information Section */}
        {stockInfo && stockInfo.availableBatches.length > 0 && (
          <BatchInformation
            stockInfo={stockInfo}
            showAllBatches={showAllBatches}
            setShowAllBatches={setShowAllBatches}
          />
        )}

        {/* Sales Statistics Section */}
        {salesStats && <SalesStatisticsComponent salesStats={salesStats} />}
      </div>

      {/*mark Footer Actions */}

      <FooterComponent
        onViewDetails={onViewDetails}
        onAddToCart={onAddToCart}
        onViewBatches={onViewBatches}
      />
    </div>
  );
}

const MedicineDetailsMore = ({ medicine }: any) => {
  return (
    <div className="border-t pt-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">
        Medicine Details
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {medicine.unit_type && (
          <div className="flex items-start gap-3">
            <Pill className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 uppercase">Dosage Form</p>
              <p className="text-sm font-medium text-gray-900">
                {medicine.unit_type}
              </p>
            </div>
          </div>
        )}

        {medicine.mrp && (
          <div className="flex items-start gap-3">
            <div className="h-5 w-5 flex items-center justify-center text-gray-400 flex-shrink-0 mt-0.5 font-bold">
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

        {medicine.barcode && (
          <div className="flex items-start gap-3">
            <Barcode className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 uppercase">Barcode</p>
              <p className="text-sm font-medium text-gray-900 font-mono">
                {medicine.barcode}
              </p>
            </div>
          </div>
        )}

        {medicine.storage_conditions && (
          <div className="flex items-start gap-3">
            <Thermometer className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 uppercase">Storage</p>
              <p className="text-sm font-medium text-gray-900">
                {medicine.storage_conditions}
              </p>
            </div>
          </div>
        )}

        {medicine.medicine_group && (
          <div className="flex items-start gap-3">
            <Tag className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 uppercase">Medicine Group</p>
              <p className="text-sm font-medium text-gray-900">
                {medicine.medicine_group}
              </p>
            </div>
          </div>
        )}
      </div>

      {medicine.how_to_use && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700 uppercase font-semibold mb-1">
            How to Use
          </p>
          <p className="text-sm text-blue-900">{medicine.how_to_use}</p>
        </div>
      )}
    </div>
  );
};

const BatchInformation = ({ stockInfo, showAllBatches, setShowAllBatches }: any) => {
  const batches = showAllBatches ? stockInfo.availableBatches : stockInfo.availableBatches.slice(0, 3);
  
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-indigo-100 rounded-lg">
          <Package className="h-4 w-4 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">Available Batches</h3>
          <p className="text-xs text-gray-500">
            {stockInfo.availableBatches.length} batch{stockInfo.availableBatches.length !== 1 && "es"} in stock
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {batches.map((batch: any) => (
          <div key={batch.id} className="flex-1 min-w-[200px] p-3 bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-xs truncate">{batch.batch_number}</p>
                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border mt-1">
                  {stockCheckerService.formatExpiryDate(batch.expiry_date)}
                </span>
              </div>
              <div className="text-right bg-white px-2 py-1.5 rounded border border-gray-200">
                <p className="text-sm font-bold text-gray-900">₹{batch.purchase_price.toFixed(2)}</p>
                <p className="text-[10px] text-gray-500">Price</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="px-2 py-1 bg-blue-50 border border-blue-200 rounded">
                <p className="text-xs font-semibold text-blue-900">
                  {batch.available_quantity} <span className="text-[10px] font-normal text-blue-700">units</span>
                </p>
              </div>
              {batch.manufacture_date && (
                <div className="flex items-center gap-1 text-gray-500">
                  <Clock className="h-3 w-3" />
                  <p className="text-[10px]">Mfg: {new Date(batch.manufacture_date).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {stockInfo.availableBatches.length > 3 && (
        <Button onClick={() => setShowAllBatches(!showAllBatches)} variant="outline" className="w-full mt-3 text-xs font-semibold h-8">
          {showAllBatches ? (
            <><ChevronUp className="h-3 w-3 mr-1" />Show Less</>
          ) : (
            <><ChevronDown className="h-3 w-3 mr-1" />View All {stockInfo.availableBatches.length} Batches</>
          )}
        </Button>
      )}
    </div>
  );
};

const SalesStatisticsComponent = ({ salesStats }: any) => {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-100">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-blue-600 rounded-lg">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Sales Statistics</h3>
          <p className="text-sm text-gray-600">
            Performance over the last 30 days
          </p>
        </div>
      </div>

      {salesStats.unitsSoldLast30Days > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border-2 border-blue-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-blue-700 uppercase font-bold tracking-wide">
                  Units Sold
                </p>
                <Package className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-3xl font-extrabold text-blue-900">
                {salesStats.unitsSoldLast30Days}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Total units this month
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border-2 border-green-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-green-700 uppercase font-bold tracking-wide">
                  Daily Average
                </p>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-3xl font-extrabold text-green-900">
                {salesStats.averageDailySales.toFixed(1)}
              </p>
              <p className="text-xs text-gray-600 mt-1">Units per day</p>
            </div>

            {salesStats.estimatedDaysUntilStockOut !== null && (
              <div className="bg-white p-5 rounded-xl border-2 border-orange-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-orange-700 uppercase font-bold tracking-wide">
                    Stock Forecast
                  </p>
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                </div>
                <p className="text-3xl font-extrabold text-orange-900">
                  {salesStats.estimatedDaysUntilStockOut}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Days until stockout
                </p>
              </div>
            )}
          </div>

          {salesStats.lastSaleDate && (
            <div className="bg-white/60 backdrop-blur-sm px-4 py-3 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Last sale:</span>{" "}
                  {new Date(salesStats.lastSaleDate).toLocaleDateString(
                    "en-US",
                    {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-xl border-2 border-gray-200 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-base font-semibold text-gray-900 mb-1">
            No Sales This Month
          </p>
          <p className="text-sm text-gray-500">
            Sales data will appear here once transactions are recorded
          </p>
        </div>
      )}
    </div>
  );
};

const FooterComponent = ({
  onViewDetails,
  onAddToCart,
  onViewBatches,
}: any) => {
  return (
    <div className="p-4 bg-gray-50 border-t space-y-3">
      <div className="grid grid-cols-3 gap-3 max-[500px]:grid-cols-2">
        <Button onClick={onViewDetails} className="bg-red-500 hover:bg-red-600">
          <ExternalLink className="h-4 w-4 mr-2" />
          View Details
        </Button>
        <Button onClick={onAddToCart} variant="outline">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add to Cart
        </Button>
        <Button onClick={onViewBatches} variant="outline">
          <Package2 className="h-4 w-4 mr-2" />
          View Batches
        </Button>
      </div> 
    </div>
  );
};

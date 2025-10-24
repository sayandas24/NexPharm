/* eslint-disable react/no-unescaped-entities */
"use client";
import { useMedicines } from "@/hooks/useMedicines";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import {
  ChevronRight,
  Pencil,
  Trash2,
  Package,
  Calendar,
  DollarSign,
  AlertCircle,
  Building2,
  Loader2,
  TrendingUp,
  Hash,
  BoxIcon,
} from "lucide-react";
import { MedicinesTable } from "@/types/database-types";

export default function BatchDetails() {
  const params = useParams();
  const router = useRouter();
  const medicineId = params?.medicineId as string;
  const batchNum = params?.batchNum as string;

  const { getBatchByNum, getMedicineById, isReady } = useMedicines();
  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [medicine, setMedicine] = useState<MedicinesTable[] | any>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (isReady && batchNum && medicineId) {
        setLoading(true);
        try {
          const medicineData = await getMedicineById(medicineId);
          setMedicine(medicineData);
          const batchData = await getBatchByNum(batchNum);
          setBatch(batchData);
        } catch (error) {
          console.error("Error fetching batch:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [isReady, batchNum, medicineId, getBatchByNum, getMedicineById]);
 

  // Show loading state
  if (loading || !isReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          <p className="text-gray-600">Loading batch details...</p>
        </div>
      </div>
    );
  }

  // Show not found state
  if (!batch) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Batch not found</h2>
          <p className="text-gray-600 mb-4">
            The batch you're looking for doesn't exist.
          </p>
          <button
            onClick={() => router.push(`/inventory/medicines/${medicineId}/batches`)}
            className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Batches
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <span
                className="cursor-pointer hover:text-gray-700"
                onClick={() => router.push("/inventory")}
              >
                Inventory
              </span>
              <ChevronRight className="w-4 h-4 mx-1" />
              <span
                className="cursor-pointer hover:text-gray-700"
                onClick={() => router.push("/inventory/med-list")}
              >
                List of Medicines
              </span>
              <ChevronRight className="w-4 h-4 mx-1" />
              <span
                className="cursor-pointer hover:text-gray-700"
                onClick={() => router.push(`/inventory/med-list/${medicineId}`)}
              >
                {medicine?.name || "Medicine"}
              </span>
              <ChevronRight className="w-4 h-4 mx-1" />
              <span className="text-gray-900 font-semibold">
                {batch.batch_number}
              </span>
            </div>
            <p className="text-gray-600">Batch details and information.</p>
          </div>
          <button className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors">
            <Pencil className="w-4 h-4" />
            Edit Batch
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        {/* Batch Header Card */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Package className="w-8 h-8 text-green-600" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {batch.batch_number}
                  </h1>
                  <p className="text-sm text-gray-600">Batch Number</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-700">
                {batch.available_quantity}
              </div>
              <p className="text-sm text-gray-600">Available Quantity</p>
            </div>
          </div>
        </div>

        {/* Information Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Quantity Information */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <BoxIcon className="w-5 h-5 text-blue-600" />
                Quantity Information
              </h2>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-gray-600">Total Quantity</span>
                <span className="font-semibold text-gray-900">
                  {batch.quantity || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-gray-600">Available Quantity</span>
                <span className="font-semibold text-gray-900 text-green-600">
                  {batch.available_quantity}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Sold Quantity</span>
                <span className="font-semibold text-gray-900">
                  {(batch.quantity || 0) - batch.available_quantity}
                </span>
              </div>
            </div>
          </div>

          {/* Pricing Information */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Pricing Information
              </h2>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-gray-600">MRP</span>
                <span className="font-semibold text-gray-900">₹{batch.mrp}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-gray-600">Purchase Price</span>
                <span className="font-semibold text-gray-900">
                  ₹{batch.purchase_price || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-gray-600">Selling Price</span>
                <span className="font-semibold text-gray-900">
                  ₹{batch.selling_price || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">GST Percentage</span>
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-medium">
                  {batch.gst_percentage}%
                </span>
              </div>
            </div>
          </div>

          {/* Date Information */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                Date Information
              </h2>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-gray-600">Manufacture Date</span>
                <span className="font-semibold text-gray-900">
                  {batch.manufacture_date
                    ? formatDate(batch.manufacture_date)
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-gray-600">Expiry Date</span>
                <span className="font-semibold text-red-600">
                  {formatDate(batch.expiry_date)}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-gray-600">Created At</span>
                <span className="font-semibold text-gray-900 text-xs">
                  {formatDateTime(batch.created_at)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Updated At</span>
                <span className="font-semibold text-gray-900 text-xs">
                  {formatDateTime(batch.updated_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Supplier Information */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Supplier Information
              </h2>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-gray-600">Supplier ID</span>
                <span className="font-semibold text-gray-900 font-mono text-xs">
                  {batch.supplier_id || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-gray-600">Pharmacy ID</span>
                <span className="font-semibold text-gray-900 font-mono text-xs">
                  {batch.pharmacy_id || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Medicine ID</span>
                <span className="font-semibold text-gray-900 font-mono text-xs">
                  {batch.medicine_id || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="bg-white border border-gray-200 rounded-lg lg:col-span-2">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Hash className="w-5 h-5 text-indigo-600" />
                Additional Details
              </h2>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm text-gray-600">Batch ID</span>
                  <span className="font-semibold text-gray-900 font-mono text-xs">
                    {batch.id}
                  </span>
                </div>
                {batch.notes && (
                  <div className="md:col-span-2 border-b pb-2">
                    <span className="text-sm text-gray-600 block mb-1">Notes</span>
                    <p className="text-gray-900">{batch.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stock Status Alert */}
        {batch.available_quantity < 10 && batch.available_quantity > 0 && (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6 rounded">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-semibold text-amber-800">Low Stock Warning</h3>
                <p className="text-sm text-amber-700 mt-1">
                  This batch is running low on stock. Consider reordering soon.
                </p>
              </div>
            </div>
          </div>
        )}

        {batch.available_quantity === 0 && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-semibold text-red-800">Out of Stock</h3>
                <p className="text-sm text-red-700 mt-1">
                  This batch is completely out of stock.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Expiry Warning */}
        {(() => {
          const expiryDate = new Date(batch.expiry_date);
          const today = new Date();
          const daysUntilExpiry = Math.ceil(
            (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysUntilExpiry < 0) {
            return (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
                  <div>
                    <h3 className="text-sm font-semibold text-red-800">Expired Batch</h3>
                    <p className="text-sm text-red-700 mt-1">
                      This batch has expired and should not be sold.
                    </p>
                  </div>
                </div>
              </div>
            );
          } else if (daysUntilExpiry <= 30) {
            return (
              <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-6 rounded">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 mr-3" />
                  <div>
                    <h3 className="text-sm font-semibold text-orange-800">
                      Expiring Soon
                    </h3>
                    <p className="text-sm text-orange-700 mt-1">
                      This batch will expire in {daysUntilExpiry} day
                      {daysUntilExpiry !== 1 ? "s" : ""}. Consider selling it soon.
                    </p>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            // onClick={() =>
            //   router.push(`/inventory/medicines/${medicineId}/batches/${batchId}/edit`)
            // }
            className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Edit Batch
          </button>
          <button className="border-2 border-red-500 text-red-500 hover:bg-red-50 px-6 py-3 rounded-lg flex items-center gap-2 transition-colors">
            <Trash2 className="w-4 h-4" />
            Delete Batch
          </button>
        </div>
      </div>
    </div>
  );
}
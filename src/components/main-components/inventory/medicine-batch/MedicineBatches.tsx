/* eslint-disable react/no-unescaped-entities */
"use client";
import { useMedicines } from "@/hooks/useMedicines";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import {
  Search,
  ChevronRight,
  Plus,
  Loader2,
  Package,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import useAuth from "@/hooks/use-auth";
import { MedicineBatchTable, MedicinesTable } from "@/types/database-types";

export default function MedicineBatches() {
  const params = useParams();
  const router = useRouter();
  const medicineId = params?.medicineId as string;

  const [batches, setBatches] = useState<MedicineBatchTable[] | any>([]);
  const [medicine, setMedicine] = useState<MedicinesTable[] | any>([]);

  const { currentPharmacy } = useAuth();
  const { getMedicineById, fetchBatchesForMedicine, loading, isReady } =
    useMedicines();

  useEffect(() => {
    if (isReady && medicineId) {
      const fetchData = async () => {
        const medicine = await getMedicineById(medicineId);
        setMedicine(medicine);
        const batches = await fetchBatchesForMedicine(
          medicineId,
          currentPharmacy?.id
        );
        setBatches(batches);
      };
      fetchData();
    }
  }, [
    isReady,
    medicineId,
    getMedicineById,
    fetchBatchesForMedicine,
    currentPharmacy,
  ]);

  // Show loading state
  if (loading || !isReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          <p className="text-gray-600">Loading batches...</p>
        </div>
      </div>
    );
  }

  // Show not found state
  if (!medicine) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Medicine not found
          </h2>
          <p className="text-gray-600 mb-4">
            The medicine you're looking for doesn't exist.
          </p>
          <button
            onClick={() => router.push("/inventory/medicines")}
            className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Medicines
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
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
              <span className="text-gray-900 font-semibold">
                {medicine.name}
              </span>
            </div>
            <p className="text-gray-600">
              List of medicines available for sales.
            </p>
          </div>
          <button
            onClick={() =>
              router.push(`/inventory/med-list/${medicineId}/batches/add`)
            }
            className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Batch
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search in Medicine Details"
              className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* Batches Grid */}
        {batches.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No batches found
            </h3>
            <p className="text-gray-600 mb-4">
              Start by adding a new batch for this medicine
            </p>
            <button
              onClick={() =>
                router.push(`/inventory/med-list/${medicineId}/batches/add`)
              }
              className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add First Batch
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {batches.map((batch: any, index: any) => (
              <Card
                key={batch.id}
                className="bg-green-50 border-2 border-green-400 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() =>
                  router.push(
                    `/inventory/med-list/${medicineId}/batches/${batch.batch_number}`
                  )
                }
              >
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {formatDate(batch.created_at)}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(
                          `/inventory/med-list/${medicineId}/batches/${batch.batch_number}`
                        );
                      }}
                      className="text-green-700 hover:text-green-900 text-sm font-medium flex items-center gap-1"
                    >
                      More
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-center mb-3">
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">
                      Batch {index + 1}
                    </h3>
                    <p className="text-lg font-semibold text-gray-700">
                      {batch.batch_number}
                    </p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Available Qty:</span>
                      <span className="font-semibold text-gray-900">
                        {batch.available_quantity}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expiry:</span>
                      <span className="font-semibold text-gray-900">
                        {formatDate(batch.expiry_date)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">MRP:</span>
                      <span className="font-semibold text-gray-900">
                        ₹{batch.mrp}
                      </span>
                    </div>
                    {batch.gst_percentage && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">GST:</span>
                        <Badge variant="secondary" className="text-xs">
                          {batch.gst_percentage}%
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

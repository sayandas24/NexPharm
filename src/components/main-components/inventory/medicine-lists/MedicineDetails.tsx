/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-unescaped-entities */
"use client";
import { useMedicines } from "@/hooks/useMedicines";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import {
  Pencil,
  Search,
  ChevronRight,
  Trash2,
  Calendar,
  DollarSign,
  AlertCircle,
  Pill,
  Building2,
  ShoppingCart,
  ClipboardList,
  Thermometer,
  Clock,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MedicineBatchTable, MedicinesTable } from "@/types/database-types";
import useAuth from "@/hooks/use-auth";
import Link from "next/link";
import useMedicineCRUD from "@/hooks/useMedicineCRUD";

export default function MedicineDetails() {
  const params = useParams();
  const router = useRouter();
  const medicineId = params?.medicineId as string;

  const [medicine, setMedicine] = useState<MedicinesTable[] | any>([]);
  const [batches, setBatches] = useState<MedicineBatchTable[] | any>([]);

  const { getMedicineById, fetchBatchesForMedicine, loading, isReady } =
    useMedicines();
  const { currentPharmacy } = useAuth();

  const { deleteMedicine } = useMedicineCRUD();

  console.log(medicine.medicine_image_url, "medicine");

  // Fetch medicine data on mount and when medicineId changes
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

  const handleDeleteMedicine = async () => {
    try {
      await deleteMedicine(medicineId);
      router.back();
    } catch (error) {
      console.error("Error deleting medicine:", error);
    }
  };

  // Show loading state
  if (loading || !isReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          <p className="text-gray-600">Loading medicine details...</p>
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

  // Calculate inventory values
  const lifetimeSupply = medicine.stock_quantity || 0;
  const lifetimeSales = 0; // This would come from sales data
  const stockLeft = lifetimeSupply - lifetimeSales;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Batches Card - Smaller */}
          <Link
            href={`/inventory/med-list/${medicineId}/batches`}
            className="bg-green-50 border-2 border-green-400 rounded-lg p-6 text-center"
          >
            <div className="text-4xl font-bold text-gray-800 mb-1">
              {batches?.length || 0}
            </div>
            <div className="text-base text-gray-700">Batches</div>
          </Link>

          {/* Inventory Card - Smaller */}
          <div className="lg:col-span-2 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-800">
                Inventory in Qty
              </h2>
              <button className="text-gray-600 hover:text-gray-800 flex items-center gap-1 text-xs">
                Send Stock Request
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-bold text-gray-800 mb-0.5">
                  {lifetimeSupply}
                </div>
                <div className="text-xs text-gray-600">Lifetime Supply</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800 mb-0.5">
                  {lifetimeSales}
                </div>
                <div className="text-xs text-gray-600">Lifetime Sales</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800 mb-0.5">
                  {stockLeft.toString().padStart(2, "0")}
                </div>
                <div className="text-xs text-gray-600">Stock Left</div>
              </div>
            </div>
          </div>
        </div>

        {/* Medicine Information Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Basic Information with Image */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-cyan-600" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Medicine Image */}

              <div className="space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm text-gray-600">Medicine Name</span>
                  <span className="font-semibold text-gray-900">
                    {medicine.name}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm text-gray-600">Generic Name</span>
                  <span className="font-semibold text-gray-900">
                    {medicine.generic_name || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm text-gray-600">Category</span>
                  <Badge variant="secondary">
                    {medicine.category || "N/A"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm text-gray-600">Medicine Group</span>
                  <span className="font-semibold text-gray-900">
                    {medicine.medicine_group || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm text-gray-600">Unit Type</span>
                  <span className="font-semibold text-gray-900">
                    {medicine.unit_type || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Strength</span>
                  <span className="font-semibold text-gray-900">
                    {medicine.strength || "N/A"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {medicine.medicine_image_url && (
            <Card>
              <CardContent>
                <div className="flex justify-center">
                  <div className="h-[20rem] rounded-lg overflow-hidden">
                    <img
                      src={medicine.medicine_image_url}
                      alt={medicine.name || "Medicine"}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pricing & Stock */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Pricing & Stock
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-gray-600">MRP</span>
                <span className="font-semibold text-gray-900">
                  ₹{medicine.mrp || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-gray-600">
                  Price Range (Min-Max)
                </span>
                <span className="font-semibold text-gray-900">
                  ₹{medicine.price_range_min || "N/A"} - ₹
                  {medicine.price_range_max || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-gray-600">Stock Quantity</span>
                <span className="font-semibold text-gray-900">
                  {medicine.stock_quantity || 0}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-gray-600">Pack Size</span>
                <span className="font-semibold text-gray-900">
                  {medicine.pack_size || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-gray-600">Reorder Level</span>
                <span className="font-semibold text-gray-900">
                  {medicine.reorder_level || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status</span>
                {medicine.is_active ? (
                  <Badge className="bg-green-500 hover:bg-green-600">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="destructive">Inactive</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Manufacturer & Pharmacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Manufacturer & Pharmacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-gray-600">Manufacturer</span>
                <span className="font-semibold text-gray-900">
                  {medicine.manufacturer || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-gray-600">Pharmacy ID</span>
                <span className="font-semibold text-gray-900 font-mono text-xs">
                  {medicine.pharmacy_id || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-gray-600">Medicine ID</span>
                <span className="font-semibold text-gray-900 font-mono text-xs">
                  {medicine.pharmacy_medicine_id || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Barcode</span>
                <span className="font-semibold text-gray-900 font-mono text-xs">
                  {medicine.barcode || "N/A"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Storage & Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                Storage & Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-gray-600">
                  Storage Conditions
                </span>
                <span className="font-semibold text-gray-900 flex items-center gap-1">
                  <Thermometer className="w-4 h-4 text-orange-500" />
                  {medicine.storage_conditions || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-gray-600">Shelf Life</span>
                <span className="font-semibold text-gray-900 flex items-center gap-1">
                  <Clock className="w-4 h-4 text-blue-500" />
                  {medicine.shelf_life || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-gray-600">Duration</span>
                <span className="font-semibold text-gray-900">
                  {medicine.duration || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-gray-600">Created At</span>
                <span className="font-semibold text-gray-900 text-xs">
                  {medicine.created_at
                    ? new Date(medicine.created_at).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Updated At</span>
                <span className="font-semibold text-gray-900 text-xs">
                  {medicine.updated_at
                    ? new Date(medicine.updated_at).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Dosage Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-indigo-600" />
                Dosage Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="border-b pb-2">
                <span className="text-sm text-gray-600 block mb-1">
                  Dosage for Adults
                </span>
                <span className="font-semibold text-gray-900">
                  {medicine.dosage_adults || "N/A"}
                </span>
              </div>
              <div className="border-b pb-2">
                <span className="text-sm text-gray-600 block mb-1">
                  Dosage for Children
                </span>
                <span className="font-semibold text-gray-900">
                  {medicine.dosage_children || "N/A"}
                </span>
              </div>
              <div className="border-b pb-2">
                <span className="text-sm text-gray-600 block mb-1">
                  Dosage for Elderly
                </span>
                <span className="font-semibold text-gray-900">
                  {medicine.dosage_elderly || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-600 block mb-1">
                  Requires Prescription
                </span>
                {medicine.requires_prescription ? (
                  <Badge variant="destructive">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Yes
                  </Badge>
                ) : (
                  <Badge variant="secondary">No</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Availability */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-teal-600" />
                Availability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-gray-600">Available</span>
                {medicine.is_available ? (
                  <Badge className="bg-green-500 hover:bg-green-600">
                    In Stock
                  </Badge>
                ) : (
                  <Badge variant="destructive">Out of Stock</Badge>
                )}
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-gray-600">OTC Available</span>
                {medicine.is_otc ? (
                  <Badge variant="secondary">Yes</Badge>
                ) : (
                  <Badge variant="outline">No</Badge>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tags</span>
                <div className="flex gap-1 flex-wrap justify-end">
                  {medicine.tags ? (
                    medicine.tags.split(",").map((tag: any, idx: any) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {tag.trim()}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">N/A</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* How to use Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>How to use</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">
              {medicine.how_to_use ||
                "Take this medication by mouth with or without food as directed by your doctor, usually once daily."}
            </p>
          </CardContent>
        </Card>

        {/* Side Effects Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Side Effects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">
              {medicine.side_effects ||
                "Dizziness, lightheadedness, drowsiness, nausea, vomiting, tiredness, excess saliva/drooling, blurred vision, weight gain, constipation, headache, and trouble sleeping may occur. If any of these effects persist or worsen, consult your doctor."}
            </p>
          </CardContent>
        </Card>

        {/* Warnings Card */}
        {medicine.warnings && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                Warnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-amber-900">{medicine.warnings}</p>
            </CardContent>
          </Card>
        )}

        {/* Delete Button */}
        <button
          onClick={handleDeleteMedicine}
          className="border-2 border-red-500 text-red-500 hover:bg-red-50 px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Delete Medicine
        </button>
      </div>
    </div>
  );
}

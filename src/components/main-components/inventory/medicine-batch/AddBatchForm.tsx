"use client";
import { useMedicines } from "@/hooks/useMedicines";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { SheetClose, SheetFooter } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useAuth from "@/hooks/use-auth";
import { MedicineBatchTable, MedicinesTable } from "@/types/database-types";
import { Formik, Form, Field, FormikHelpers } from "formik";
import * as Yup from "yup";
import { useKyselyDB } from "@/lib/powersync/PowersyncProvider";
import { useSuppliers } from "@/hooks/useSupplier";
import { v4 as uuidv4 } from "uuid";
import useMedicineCRUD from "@/hooks/useMedicineCRUD";

// Form values type
interface BatchFormValues {
  batch_number: string;
  expiry_date: string;
  mrp: string;
  purchase_price: string;
  selling_price: string;
  quantity: string;
  available_quantity: string;
  manufacture_date: string;
  gst_percentage: string;
  supplier_id: string;
}

// Validation Schema
const batchValidationSchema = Yup.object({
  batch_number: Yup.string()
    .required("Batch number is required")
    .matches(
      /^[A-Z]{3,5}\d{3}$/,
      "Batch number must be 6-8 characters (3-5 letters + 3 numbers, e.g., ABC123)"
    )
    .min(6, "Batch number must be at least 6 characters")
    .max(8, "Batch number must be at most 8 characters"),
  expiry_date: Yup.date()
    .required("Expiry date is required")
    .min(new Date(), "Expiry date must be in the future"),
  mrp: Yup.number()
    .required("MRP is required")
    .positive("MRP must be positive")
    .min(1, "MRP must be at least 1"),
  purchase_price: Yup.number()
    .required("Purchase price is required")
    .positive("Purchase price must be positive")
    .min(1, "Purchase price must be at least 1"),
  selling_price: Yup.number()
    .required("Selling price is required")
    .positive("Selling price must be positive")
    .min(1, "Selling price must be at least 1")
    .test(
      "selling-price-validation",
      "Selling price must be between purchase price and MRP",
      function (value) {
        const { purchase_price, mrp } = this.parent;
        if (!value || !purchase_price || !mrp) return true;
        return value >= purchase_price && value <= mrp;
      }
    ),
  quantity: Yup.number()
    .required("Quantity is required")
    .positive("Quantity must be positive")
    .integer("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1"),
  available_quantity: Yup.number()
    .required("Available quantity is required")
    .positive("Available quantity must be positive")
    .integer("Available quantity must be a whole number")
    .test(
      "available-quantity-validation",
      "Available quantity cannot exceed total quantity",
      function (value) {
        const { quantity } = this.parent;
        if (!value || !quantity) return true;
        return value <= quantity;
      }
    ),
  manufacture_date: Yup.date().nullable(),
  gst_percentage: Yup.number()
    .min(0, "GST must be at least 0")
    .max(100, "GST cannot exceed 100")
    .nullable(),
  supplier_id: Yup.string().required("Supplier is required"),
});

interface AddBatchFormProps {
  onSuccess?: () => void;
}

export default function AddBatchForm({ onSuccess }: AddBatchFormProps) {
  const params = useParams();
  const medicineId = params?.medicineId as string;
  const db = useKyselyDB();

  const [isCheckingBatchNumber, setIsCheckingBatchNumber] = useState(false);
  const [batchNumberError, setBatchNumberError] = useState("");

  const { currentPharmacy } = useAuth();
  const { fetchSuppliers, suppliers, createSupplier } = useSuppliers(
    currentPharmacy?.id
  );
  const { getMedicineById, fetchBatchesForMedicine, loading, isReady } =
    useMedicines();
  const { createMedicineBatch } = useMedicineCRUD();

  useEffect(() => {
    if (currentPharmacy?.id) {
      fetchSuppliers();
    }
  }, [currentPharmacy?.id, fetchSuppliers]);

  useEffect(() => {
    if (isReady && medicineId) {
      const fetchData = async () => {
        const medicine = await getMedicineById(medicineId);
        const batches = await fetchBatchesForMedicine(
          medicineId,
          currentPharmacy?.id
        );
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

  // Check if batch number exists
  const checkBatchNumberExists = async (batchNumber: string) => {
    if (!batchNumber || batchNumber.length < 6) return false;

    setIsCheckingBatchNumber(true);
    try {
      const existing = await db
        .selectFrom("medicine_batches")
        .selectAll()
        .where("batch_number", "=", batchNumber.toUpperCase())
        // .where("pharmacy_id", "=", currentPharmacy?.id || "")
        .executeTakeFirst();

      setIsCheckingBatchNumber(false);
      return !!existing;
    } catch (error) {
      console.error("Error checking batch number:", error);
      setIsCheckingBatchNumber(false);
      return false;
    }
  };

  const initialValues: BatchFormValues = {
    batch_number: "",
    expiry_date: "",
    mrp: "",
    purchase_price: "",
    selling_price: "",
    quantity: "",
    available_quantity: "",
    manufacture_date: "",
    gst_percentage: "12",
    supplier_id: suppliers.length > 0 ? suppliers[0].id : "",
  };

  const handleSubmit = async (
    values: BatchFormValues,
    { setSubmitting, setFieldError, resetForm }: FormikHelpers<BatchFormValues>
  ) => {
    try {
      // Check if batch number already exists
      const exists = await checkBatchNumberExists(values.batch_number);
      if (exists) {
        setFieldError("batch_number", "This batch number already exists");
        setBatchNumberError("This batch number already exists");
        setSubmitting(false);
        return;
      }

      // Create new batch
      const newBatch = {
        id: uuidv4(),
        pharmacy_id: currentPharmacy?.id || "",
        medicine_id: medicineId,
        supplier_id: values.supplier_id,
        batch_number: values.batch_number.toUpperCase(),
        expiry_date: values.expiry_date,
        mrp: parseFloat(values.mrp),
        purchase_price: parseFloat(values.purchase_price),
        selling_price: parseFloat(values.selling_price),
        quantity: parseInt(values.quantity),
        available_quantity: parseInt(values.available_quantity),
        manufacture_date: values.manufacture_date || null,
        gst_percentage: values.gst_percentage
          ? parseFloat(values.gst_percentage)
          : 12,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (currentPharmacy?.id && medicineId) {
        await createMedicineBatch(
          medicineId,
          currentPharmacy?.id,
          newBatch as any
        );
      } else {
        console.error(
          "Error creating batch: Pharmacy or medicine ID is missing"
        );
      }

      // Close sheet and reset form
      resetForm();
      setBatchNumberError("");

      // Call onSuccess callback to close the sheet
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error adding batch:", error);
      alert("Failed to add batch. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-5">
      {/* Add Batch Sheet */}

      <Formik
        initialValues={initialValues}
        validationSchema={batchValidationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({
          values,
          errors,
          touched,
          isSubmitting,
          setFieldValue,
          setFieldError,
          handleBlur,
        }) => (
          <Form className="space-y-4 py-4">
            {/* Supplier Select */}
            <div className="space-y-2">
              <Label htmlFor="supplier_id">
                Supplier <span className="text-red-500">*</span>
              </Label>
              <Select
                value={values.supplier_id}
                onValueChange={(value) => setFieldValue("supplier_id", value)}
              >
                <SelectTrigger
                  className={
                    touched.supplier_id && errors.supplier_id
                      ? "border-red-500"
                      : ""
                  }
                >
                  <SelectValue placeholder="Select a supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.length > 0 ? (
                    suppliers.map((supplier: any) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-suppliers" disabled>
                      No suppliers available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {touched.supplier_id && errors.supplier_id && (
                <p className="text-sm text-red-500">{errors.supplier_id}</p>
              )}
            </div>

            {/* Batch Number */}
            <div className="space-y-2">
              <Label htmlFor="batch_number">
                Batch Number <span className="text-red-500">*</span>
              </Label>
              <Field name="batch_number">
                {({ field }: any) => (
                  <Input
                    {...field}
                    id="batch_number"
                    placeholder="ABC123"
                    value={field.value?.toUpperCase() || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      // Convert to uppercase before updating
                      const upperValue = e.target.value.toUpperCase();
                      field.onChange({
                        ...e,
                        target: {
                          ...e.target,
                          value: upperValue,
                          name: field.name,
                        },
                      });
                      setBatchNumberError("");
                    }}
                    onBlur={async (e: React.FocusEvent<HTMLInputElement>) => {
                      handleBlur(e);
                      if (field.value && !errors.batch_number) {
                        const exists = await checkBatchNumberExists(
                          field.value
                        );
                        if (exists) {
                          setBatchNumberError(
                            "This batch number already exists"
                          );
                          setFieldError(
                            "batch_number",
                            "This batch number already exists"
                          );
                        } else {
                          setBatchNumberError("");
                        }
                      }
                    }}
                    className={
                      touched.batch_number &&
                      (errors.batch_number || batchNumberError)
                        ? "border-red-500"
                        : ""
                    }
                  />
                )}
              </Field>
              {isCheckingBatchNumber && (
                <p className="text-sm text-blue-600 flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Checking availability...
                </p>
              )}
              {touched.batch_number &&
                (errors.batch_number || batchNumberError) && (
                  <p className="text-sm text-red-500">
                    {errors.batch_number || batchNumberError}
                  </p>
                )}
              <p className="text-xs text-gray-500">
                Format: 3-5 uppercase letters + 3 numbers (e.g., ABC123,
                BATCH001)
              </p>
            </div>

            {/* Expiry Date */}
            <div className="space-y-2">
              <Label htmlFor="expiry_date">
                Expiry Date <span className="text-red-500">*</span>
              </Label>
              <Field name="expiry_date">
                {({ field }: any) => (
                  <Input
                    {...field}
                    id="expiry_date"
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    className={
                      touched.expiry_date && errors.expiry_date
                        ? "border-red-500"
                        : ""
                    }
                  />
                )}
              </Field>
              {touched.expiry_date && errors.expiry_date && (
                <p className="text-sm text-red-500">{errors.expiry_date}</p>
              )}
            </div>

            {/* MRP */}
            <div className="space-y-2">
              <Label htmlFor="mrp">
                MRP (₹) <span className="text-red-500">*</span>
              </Label>
              <Field name="mrp">
                {({ field }: any) => (
                  <Input
                    {...field}
                    id="mrp"
                    type="number"
                    step="0.01"
                    placeholder="100.00"
                    className={
                      touched.mrp && errors.mrp ? "border-red-500" : ""
                    }
                  />
                )}
              </Field>
              {touched.mrp && errors.mrp && (
                <p className="text-sm text-red-500">{errors.mrp}</p>
              )}
            </div>

            {/* Purchase Price */}
            <div className="space-y-2">
              <Label htmlFor="purchase_price">
                Purchase Price (₹) <span className="text-red-500">*</span>
              </Label>
              <Field name="purchase_price">
                {({ field }: any) => (
                  <Input
                    {...field}
                    id="purchase_price"
                    type="number"
                    step="0.01"
                    placeholder="80.00"
                    className={
                      touched.purchase_price && errors.purchase_price
                        ? "border-red-500"
                        : ""
                    }
                  />
                )}
              </Field>
              {touched.purchase_price && errors.purchase_price && (
                <p className="text-sm text-red-500">{errors.purchase_price}</p>
              )}
            </div>

            {/* Selling Price */}
            <div className="space-y-2">
              <Label htmlFor="selling_price">
                Selling Price (₹) <span className="text-red-500">*</span>
              </Label>
              <Field name="selling_price">
                {({ field }: any) => (
                  <Input
                    {...field}
                    id="selling_price"
                    type="number"
                    step="0.01"
                    placeholder="95.00"
                    className={
                      touched.selling_price && errors.selling_price
                        ? "border-red-500"
                        : ""
                    }
                  />
                )}
              </Field>
              {touched.selling_price && errors.selling_price && (
                <p className="text-sm text-red-500">{errors.selling_price}</p>
              )}
              <p className="text-xs text-gray-500">
                Must be between purchase price and MRP
              </p>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">
                Total Quantity <span className="text-red-500">*</span>
              </Label>
              <Field name="quantity">
                {({ field }: any) => (
                  <Input
                    {...field}
                    id="quantity"
                    type="number"
                    placeholder="100"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      field.onChange(e);
                      // Auto-fill available quantity
                      if (e.target.value && !values.available_quantity) {
                        setFieldValue("available_quantity", e.target.value);
                      }
                    }}
                    className={
                      touched.quantity && errors.quantity
                        ? "border-red-500"
                        : ""
                    }
                  />
                )}
              </Field>
              {touched.quantity && errors.quantity && (
                <p className="text-sm text-red-500">{errors.quantity}</p>
              )}
            </div>

            {/* Available Quantity */}
            <div className="space-y-2">
              <Label htmlFor="available_quantity">
                Available Quantity <span className="text-red-500">*</span>
              </Label>
              <Field name="available_quantity">
                {({ field }: any) => (
                  <Input
                    {...field}
                    id="available_quantity"
                    type="number"
                    placeholder="100"
                    className={
                      touched.available_quantity && errors.available_quantity
                        ? "border-red-500"
                        : ""
                    }
                  />
                )}
              </Field>
              {touched.available_quantity && errors.available_quantity && (
                <p className="text-sm text-red-500">
                  {errors.available_quantity}
                </p>
              )}
            </div>

            {/* Manufacture Date */}
            <div className="space-y-2">
              <Label htmlFor="manufacture_date">Manufacture Date</Label>
              <Field name="manufacture_date">
                {({ field }: any) => (
                  <Input
                    {...field}
                    id="manufacture_date"
                    type="date"
                    max={new Date().toISOString().split("T")[0]}
                  />
                )}
              </Field>
            </div>

            {/* GST Percentage */}
            <div className="space-y-2">
              <Label htmlFor="gst_percentage">GST Percentage (%)</Label>
              <Field name="gst_percentage">
                {({ field }: any) => (
                  <Input
                    {...field}
                    id="gst_percentage"
                    type="number"
                    step="0.01"
                    placeholder="12.00"
                    className={
                      touched.gst_percentage && errors.gst_percentage
                        ? "border-red-500"
                        : ""
                    }
                  />
                )}
              </Field>
              {touched.gst_percentage && errors.gst_percentage && (
                <p className="text-sm text-red-500">{errors.gst_percentage}</p>
              )}
            </div>

            <SheetFooter className="pt-4">
              <SheetClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setBatchNumberError("");
                  }}
                >
                  Cancel
                </Button>
              </SheetClose>
              <Button
                type="submit"
                disabled={isSubmitting || isCheckingBatchNumber}
                className="bg-cyan-500 hover:bg-cyan-600"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding Batch...
                  </>
                ) : (
                  "Add Batch"
                )}
              </Button>
            </SheetFooter>
          </Form>
        )}
      </Formik>
    </div>
  );
}

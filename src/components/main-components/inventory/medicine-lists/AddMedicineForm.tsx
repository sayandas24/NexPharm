"use client";

import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";
import {
  Save,
  X,
  Pill,
  Package,
  DollarSign,
  AlertTriangle,
  Info,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import useMedicineCRUD from "@/hooks/useMedicineCRUD";
import { v4 as uuidv4 } from "uuid";

const medicineSchema = Yup.object().shape({
  name: Yup.string().min(2, "Too short").required("Medicine name is required"),
  generic_name: Yup.string().nullable(),
  brand_names: Yup.string().nullable(),
  manufacturer: Yup.string().nullable(),
  category: Yup.string().nullable(),
  strength: Yup.string().nullable(),
  pack_size: Yup.string().nullable(),
  how_to_use: Yup.string().nullable(),
  dosage_adults: Yup.string().nullable(),
  dosage_children: Yup.string().nullable(),
  dosage_elderly: Yup.string().nullable(),
  duration: Yup.string().nullable(),
  side_effects: Yup.string().nullable(),
  warnings: Yup.string().nullable(),
  shelf_life: Yup.string().nullable(),
  barcode: Yup.string().nullable(),
  requires_prescription: Yup.number().oneOf([0, 1]).nullable(),
  medicine_image_url: Yup.string().url("Invalid URL").nullable(),
  medicine_images: Yup.string().nullable(),
  package_image_url: Yup.string().url("Invalid URL").nullable(),
  unit_type: Yup.string().nullable(),
  medicine_group: Yup.string().nullable(),
  tags: Yup.string().nullable(),
  is_active: Yup.number().oneOf([0, 1]).nullable(),
  is_otc: Yup.number().oneOf([0, 1]).nullable(),
});

interface AddMedicineFormProps {
  onSuccess?: () => void;
  pharmacy?: any;
}

export function AddMedicineForm({ onSuccess, pharmacy }: AddMedicineFormProps) {
  const { createMedicine, error, loading } = useMedicineCRUD();

  const handleSubmit = async (
    values: any,
    { setSubmitting, resetForm }: any
  ) => {
    try {
      const res = await createMedicine({
        id: uuidv4(),
        pharmacy_id: pharmacy?.id,
        ...values,
      });
      console.log(res, "Medicine adding response");
      // toast.success('Medicine added successfully!');
      resetForm();
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to add medicine");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik
      initialValues={{
        name: "",
        generic_name: null,
        brand_names: null,
        manufacturer: null,
        category: null,
        strength: null,
        pack_size: null,
        how_to_use: null,
        dosage_adults: null,
        dosage_children: null,
        dosage_elderly: null,
        duration: null,
        side_effects: null,
        warnings: null,
        shelf_life: null,
        barcode: null,
        requires_prescription: 0,
        medicine_image_url: null,
        medicine_images: null,
        package_image_url: null,
        unit_type: null,
        medicine_group: null,
        tags: null,
        is_active: 1,
        is_otc: 0,
      }}
      validationSchema={medicineSchema}
      onSubmit={handleSubmit}
    >
      {({ errors, touched, isSubmitting, setFieldValue, values }) => (
        <Form className="space-y-6 mt-6 p-5">
          {/* Basic Information */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Pill className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Basic Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label className="mb-2" htmlFor="name">
                  Medicine Name <span className="text-red-500">*</span>
                </Label>
                <Field
                  as={Input}
                  id="name"
                  name="name"
                  placeholder="e.g., Paracetamol 500mg"
                  className={
                    touched.name && errors.name ? "border-red-500" : ""
                  }
                />
                {touched.name && errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <Label className="mb-2" htmlFor="generic_name">Generic Name</Label>
                <Field
                  as={Input}
                  id="generic_name"
                  name="generic_name"
                  placeholder="e.g., Acetaminophen"
                />
              </div>

              <div>
                <Label className="mb-2" htmlFor="brand_names">Brand Names</Label>
                <Field
                  as={Input}
                  id="brand_names"
                  name="brand_names"
                  placeholder="e.g., Tylenol, Crocin"
                />
              </div>

              <div>
                <Label className="mb-2" htmlFor="manufacturer">Manufacturer</Label>
                <Field
                  as={Input}
                  id="manufacturer"
                  name="manufacturer"
                  placeholder="e.g., Sun Pharma"
                />
              </div>

              <div>
                <Label className="mb-2" htmlFor="category">Category</Label>
                <Select
                  onValueChange={(value) => setFieldValue("category", value)}
                  value={values.category || ""}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Generic Medicine">
                      Generic Medicine
                    </SelectItem>
                    <SelectItem value="Diabetes">Diabetes</SelectItem>
                    <SelectItem value="Analgesic">Analgesic</SelectItem>
                    <SelectItem value="Antibiotic">Antibiotic</SelectItem>
                    <SelectItem value="Antacid">Antacid</SelectItem>
                    <SelectItem value="Cardiovascular">
                      Cardiovascular
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2" htmlFor="barcode">Barcode</Label>
                <Field
                  as={Input}
                  id="barcode"
                  name="barcode"
                  placeholder="e.g., 8901234567890"
                />
              </div>

              <div>
                <Label className="mb-2" htmlFor="strength">Strength</Label>
                <Field
                  as={Input}
                  id="strength"
                  name="strength"
                  placeholder="e.g., 500mg"
                />
              </div>

              <div>
                <Label className="mb-2" htmlFor="pack_size">Pack Size</Label>
                <Field
                  as={Input}
                  id="pack_size"
                  name="pack_size"
                  placeholder="e.g., 10 tablets"
                />
              </div>

              <div>
                <Label className="mb-2" htmlFor="shelf_life">Shelf Life</Label>
                <Field
                  as={Input}
                  id="shelf_life"
                  name="shelf_life"
                  placeholder="e.g., 24 months"
                />
              </div>
            </div>
          </Card>

          {/* Pricing */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Pricing Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="mb-2" htmlFor="mrp">MRP (₹)</Label>
                <Field
                  as={Input}
                  type="number"
                  id="mrp"
                  name="mrp"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div>
                <Label className="mb-2" htmlFor="price_range_min">Min Price (₹)</Label>
                <Field
                  as={Input}
                  type="number"
                  id="price_range_min"
                  name="price_range_min"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div>
                <Label className="mb-2" htmlFor="price_range_max">Max Price (₹)</Label>
                <Field
                  as={Input}
                  type="number"
                  id="price_range_max"
                  name="price_range_max"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>
          </Card>

          {/* Dosage Information */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Info className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Dosage & Usage</h3>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="mb-2" htmlFor="how_to_use">How to Use</Label>
                <Field
                  as={Textarea}
                  id="how_to_use"
                  name="how_to_use"
                  placeholder="Instructions on how to use this medicine"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="mb-2" htmlFor="dosage_adults">Dosage (Adults)</Label>
                  <Field
                    as={Input}
                    id="dosage_adults"
                    name="dosage_adults"
                    placeholder="e.g., 1-2 tablets"
                  />
                </div>

                <div>
                  <Label className="mb-2" htmlFor="dosage_children">Dosage (Children)</Label>
                  <Field
                    as={Input}
                    id="dosage_children"
                    name="dosage_children"
                    placeholder="e.g., Half tablet"
                  />
                </div>

                <div>
                  <Label className="mb-2" htmlFor="dosage_elderly">Dosage (Elderly)</Label>
                  <Field
                    as={Input}
                    id="dosage_elderly"
                    name="dosage_elderly"
                    placeholder="e.g., 1 tablet"
                  />
                </div>
              </div>

              <div>
                <Label className="mb-2" htmlFor="duration">Duration</Label>
                <Field
                  as={Input}
                  id="duration"
                  name="duration"
                  placeholder="e.g., 5-7 days"
                />
              </div>
            </div>
          </Card>

          {/* Safety Information */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Safety Information</h3>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="mb-2" htmlFor="side_effects">Side Effects</Label>
                <Field
                  as={Textarea}
                  id="side_effects"
                  name="side_effects"
                  placeholder="List possible side effects"
                  rows={2}
                />
              </div>

              <div>
                <Label className="mb-2" htmlFor="warnings">Warnings & Precautions</Label>
                <Field
                  as={Textarea}
                  id="warnings"
                  name="warnings"
                  placeholder="Important warnings and precautions"
                  rows={2}
                />
              </div>
            </div>
          </Card>

          {/* Images & Media */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Images & Media</h3>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="mb-2" htmlFor="medicine_image_url">Medicine Image URL</Label>
                <Field
                  as={Input}
                  id="medicine_image_url"
                  name="medicine_image_url"
                  placeholder="https://example.com/medicine.jpg"
                  type="url"
                />
              </div>

              <div>
                <Label className="mb-2" htmlFor="package_image_url">Package Image URL</Label>
                <Field
                  as={Input}
                  id="package_image_url"
                  name="package_image_url"
                  placeholder="https://example.com/package.jpg"
                  type="url"
                />
              </div>

              <div>
                <Label className="mb-2" htmlFor="medicine_images">
                  Additional Images (JSON array)
                </Label>
                <Field
                  as={Textarea}
                  id="medicine_images"
                  name="medicine_images"
                  placeholder='["url1", "url2"]'
                  rows={2}
                />
              </div>

              <div>
                <Label className="mb-2" htmlFor="tags">Tags (comma-separated)</Label>
                <Field
                  as={Input}
                  id="tags"
                  name="tags"
                  placeholder="fever, pain relief, headache"
                />
              </div>
            </div>
          </Card>

          {/* Status Flags */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Medicine Status</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requires_prescription"
                  checked={values.requires_prescription === 1}
                  onCheckedChange={(checked) =>
                    setFieldValue("requires_prescription", checked ? 1 : 0)
                  }
                />
                <Label 
                  htmlFor="requires_prescription"
                  className="cursor-pointer mb-2"
                >
                  Requires Prescription (Rx)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_otc"
                  checked={values.is_otc === 1}
                  onCheckedChange={(checked) =>
                    setFieldValue("is_otc", checked ? 1 : 0)
                  }
                />
                <Label  htmlFor="is_otc" className="cursor-pointer mb-2">
                  Over-the-Counter (OTC) Medicine
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={values.is_active === 1}
                  onCheckedChange={(checked) =>
                    setFieldValue("is_active", checked ? 1 : 0)
                  }
                />
                <Label  htmlFor="is_active" className="cursor-pointer mb-2">
                  Active in Inventory
                </Label>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t sticky bottom-0 bg-white pb-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? "Saving..." : "Save Medicine"}
            </Button>
            <Button type="button" variant="outline" className="flex-1">
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
}

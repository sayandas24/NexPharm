import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSuppliers } from "@/hooks/useSupplier";
import { useFormik } from "formik";
import { Loader2 } from "lucide-react";
import React from "react";
import * as Yup from "yup";
import {v4 as uuidv4} from "uuid";

const supplierSchema = Yup.object({
  name: Yup.string().required("Supplier name is required"),
  contact_person: Yup.string(),
  phone: Yup.string().required("Phone number is required"),
  email: Yup.string().email("Invalid email"),
  address: Yup.string(),
  gst_number: Yup.string(),
});

interface AddSupplierFormProps {
  createSupplier: (supplierData: any) => Promise<any>;
  pharmacyId: string | undefined;
  setIsSheetOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function AddSupplierForm({createSupplier, pharmacyId, setIsSheetOpen}: AddSupplierFormProps) {

   const formik = useFormik({
    initialValues: {
      name: "",
      contact_person: "",
      phone: "",
      email: "",
      address: "",
      gst_number: "",
    },
    validationSchema: supplierSchema,
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      try {
        console.log("values", values);
        await createSupplier({
          id: uuidv4(),
          pharmacy_id: pharmacyId,
          ...values,
        });
        resetForm();
        setIsSheetOpen(false);
      } catch (error) {
        console.error("Error creating supplier:", error);
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div>
      <form onSubmit={formik.handleSubmit} className="space-y-4 mt-6 p-5">
        <div className="space-y-2">
          <Label htmlFor="name">
            Supplier Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {formik.touched.name && formik.errors.name && (
            <p className="text-sm text-red-500">{formik.errors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_person">Contact Person</Label>
          <Input
            id="contact_person"
            name="contact_person"
            value={formik.values.contact_person}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">
            Phone <span className="text-red-500">*</span>
          </Label>
          <Input
            id="phone"
            name="phone"
            value={formik.values.phone}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {formik.touched.phone && formik.errors.phone && (
            <p className="text-sm text-red-500">{formik.errors.phone}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {formik.touched.email && formik.errors.email && (
            <p className="text-sm text-red-500">{formik.errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            name="address"
            value={formik.values.address}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gst_number">GST Number</Label>
          <Input
            id="gst_number"
            name="gst_number"
            value={formik.values.gst_number}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
        </div>

        <Button type="submit" className="w-full" disabled={formik.isSubmitting}>
          {formik.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            "Add Supplier"
          )}
        </Button>
      </form>
    </div>
  );
}

"use client";
import React, { useState } from "react";
import { useSuppliers } from "@/hooks/useSupplier";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, ChevronRight, Loader2 } from "lucide-react";
import { useFormik } from "formik";
import useAuth from "@/hooks/use-auth";
import Link from "next/link";
import AddSupplierForm from "./AddSupplierForm";



export default function SupplierManageMain() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const { currentPharmacy } = useAuth();
  const pharmacyId = currentPharmacy?.id;
  const { suppliers, loading, createSupplier } = useSuppliers(pharmacyId);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Supplier management</h1>
          <p className="text-muted-foreground">
            Manage your supplier data from here
          </p>
        </div>

        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Supplier
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Add New Supplier</SheetTitle>
              <SheetDescription>
                Fill in the details to add a new supplier
              </SheetDescription>
            </SheetHeader>

            <AddSupplierForm createSupplier={createSupplier} pharmacyId={pharmacyId} setIsSheetOpen={setIsSheetOpen}/>
            
          </SheetContent>
        </Sheet>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="border rounded-lg p-4 hover:border-primary transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="text-sm text-muted-foreground">
                  Last ordered 12 sept 2025
                </div>
                <Link href={`/suppliers/${supplier.id}`}>
                  <Button variant="ghost" size="sm">
                    More
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <h3 className="text-xl font-bold">{supplier.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {supplier.address || "No address"}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    Total Bill
                  </div>
                  <div className="text-lg font-semibold">₹12,000</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

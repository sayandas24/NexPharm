"use client";

import React, { useState, useEffect } from "react";
import { ShortageItem } from "@/hooks/useShortages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useKyselyDB } from "@/lib/powersync/PowersyncProvider";
import useAuth from "@/hooks/use-auth";

interface QuickReorderDialogProps {
  shortage: ShortageItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ReorderData) => Promise<void>;
}

export interface ReorderData {
  medicineId: string;
  supplierId: string;
  quantity: number;
  notes: string;
}

export default function QuickReorderDialog({
  shortage,
  isOpen,
  onClose,
  onSubmit,
}: QuickReorderDialogProps) {
  const db = useKyselyDB();
  const { currentPharmacy } = useAuth();
  const [suppliers, setSuppliers] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    supplierId: "",
    quantity: 0,
    notes: "",
  });

  // Calculate suggested quantity
  const suggestedQuantity = shortage
    ? Math.max((shortage.reorderLevel - shortage.currentStock) * 2, 0)
    : 0;

  // Load suppliers
  useEffect(() => {
    if (!currentPharmacy?.id || !isOpen) return;

    const loadSuppliers = async () => {
      try {
        const result = await db
          .selectFrom("suppliers")
          .select(["id", "name"])
          .where("pharmacy_id", "=", currentPharmacy.id)
          .orderBy("name", "asc")
          .execute();

        setSuppliers(result);
      } catch (error) {
        console.error("Error loading suppliers:", error);
      }
    };

    loadSuppliers();
  }, [db, currentPharmacy?.id, isOpen]);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen && shortage) {
      setFormData({
        supplierId: "",
        quantity: suggestedQuantity,
        notes: "",
      });
    }
  }, [isOpen, shortage, suggestedQuantity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!shortage || !formData.supplierId || formData.quantity <= 0) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        medicineId: shortage.medicineId,
        supplierId: formData.supplierId,
        quantity: formData.quantity,
        notes: formData.notes,
      });
      onClose();
    } catch (error) {
      console.error("Error submitting reorder:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!shortage) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Quick Reorder</SheetTitle>
          <SheetDescription>
            Create a reorder request for this medicine
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Medicine Name (Read-only) */}
            <div className="space-y-2">
              <Label>Medicine</Label>
              <div className="p-3 bg-gray-50 rounded-md border">
                <div className="font-medium">{shortage.medicineName}</div>
                {shortage.genericName && (
                  <div className="text-sm text-gray-500">
                    {shortage.genericName}
                  </div>
                )}
              </div>
            </div>

            {/* Current Stock Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Current Stock</Label>
                <div className="p-2 bg-red-50 rounded-md border border-red-200 text-center">
                  <span className="font-semibold text-red-700">
                    {shortage.currentStock}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reorder Level</Label>
                <div className="p-2 bg-gray-50 rounded-md border text-center">
                  <span className="font-semibold">{shortage.reorderLevel}</span>
                </div>
              </div>
            </div>

            {/* Supplier Selection */}
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier *</Label>
              <Select
                value={formData.supplierId}
                onValueChange={(value) =>
                  setFormData({ ...formData, supplierId: value })
                }
                required
              >
                <SelectTrigger id="supplier">
                  <SelectValue placeholder="Select a supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500 text-center">
                      No suppliers found
                    </div>
                  ) : (
                    suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantity: parseInt(e.target.value) || 0,
                  })
                }
                required
              />
              <p className="text-xs text-gray-500">
                Suggested: {suggestedQuantity} units (based on reorder level)
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes for this reorder..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                loading ||
                !formData.supplierId ||
                formData.quantity <= 0 ||
                suppliers.length === 0
              }
              className="flex-1"
            >
              {loading ? "Creating..." : "Create Reorder Request"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

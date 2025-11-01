"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface MedicineBatch {
  id: string;
  batch_number: string;
  expiry_date: string;
  available_quantity: number;
  selling_price: number;
  mrp: number;
  gst_percentage: number;
}

interface PharmacyMedicineWithDetails {
  id: string;
  name: string;
  generic_name: string | null;
}

interface BatchSelectorProps {
  medicine: PharmacyMedicineWithDetails | null;
  pharmacyId: string;
  onBatchSelect: (batch: MedicineBatch, quantity: number) => void;
  onClose: () => void;
  fetchBatchesForMedicine: (
    medicineId: string,
    pharmacyId: string
  ) => Promise<MedicineBatch[]>;
}

export function BatchSelector({
  medicine,
  pharmacyId,
  onBatchSelect,
  onClose,
  fetchBatchesForMedicine,
}: BatchSelectorProps) {
  const [batches, setBatches] = useState<MedicineBatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadBatches = async () => {
      if (!medicine) return;

      setLoading(true);
      const fetchedBatches = await fetchBatchesForMedicine(
        medicine.id,
        pharmacyId
      );
      setBatches(fetchedBatches);
      setLoading(false);

      // Initialize quantities
      const initialQuantities: Record<string, number> = {};
      fetchedBatches.forEach((batch) => {
        initialQuantities[batch.id] = 1;
      });
      setQuantities(initialQuantities);
    };

    if (medicine) {
      loadBatches();
    }
  }, [medicine, pharmacyId, fetchBatchesForMedicine]);

  const handleQuantityChange = (batchId: string, value: string) => {
    const quantity = parseInt(value, 10);
    setQuantities((prev) => ({ ...prev, [batchId]: quantity || 0 }));

    // Clear error when user changes quantity
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[batchId];
      return newErrors;
    });
  };

  const handleSelect = (batch: MedicineBatch) => {
    const quantity = quantities[batch.id] || 1;

    if (quantity <= 0) {
      setErrors((prev) => ({
        ...prev,
        [batch.id]: "Quantity must be greater than 0",
      }));
      return;
    }

    if (quantity > batch.available_quantity) {
      setErrors((prev) => ({
        ...prev,
        [batch.id]: `Only ${batch.available_quantity} available`,
      }));
      return;
    }

    onBatchSelect(batch, quantity);
    onClose();
  };

  const getExpiryColor = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.floor(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry < 0) return "text-red-600 font-semibold";
    if (daysUntilExpiry < 30) return "text-red-500";
    if (daysUntilExpiry < 90) return "text-yellow-600";
    return "text-purple-700";
  };

  return (
    <Sheet open={!!medicine} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl lg:max-w-3xl overflow-y-auto bg-white p-3 sm:p-4"
      >
        <SheetHeader className="border-b border-purple-100 pb-3">
          <SheetTitle className="text-lg sm:text-xl text-purple-900">
            Select Batch
          </SheetTitle>
          {medicine && (
            <div className="text-xs sm:text-sm mt-1">
              <div className="font-semibold text-purple-800">
                {medicine.name}
              </div>
              {medicine.generic_name && (
                <div className="text-purple-600">{medicine.generic_name}</div>
              )}
            </div>
          )}
        </SheetHeader>

        <div className="mt-4">
          {loading ? (
            <p className="text-center text-purple-600 py-8 text-sm">
              Loading batches...
            </p>
          ) : batches.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-purple-500 text-sm">
                No batches available for this medicine
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block border border-purple-200 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-purple-50 hover:bg-purple-50">
                      <TableHead className="text-purple-900 font-semibold text-xs">
                        Batch No.
                      </TableHead>
                      <TableHead className="text-purple-900 font-semibold text-xs">
                        Expiry
                      </TableHead>
                      <TableHead className="text-purple-900 font-semibold text-xs">
                        Avail.
                      </TableHead>
                      <TableHead className="text-purple-900 font-semibold text-xs">
                        Price
                      </TableHead>
                      <TableHead className="text-purple-900 font-semibold text-xs">
                        MRP
                      </TableHead>
                      <TableHead className="text-purple-900 font-semibold text-xs">
                        GST
                      </TableHead>
                      <TableHead className="text-purple-900 font-semibold text-xs">
                        Qty
                      </TableHead>
                      <TableHead className="text-purple-900 font-semibold text-xs">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.map((batch) => (
                      <TableRow key={batch.id} className="hover:bg-purple-50">
                        <TableCell className="font-semibold text-purple-900 text-xs">
                          {batch.batch_number}
                        </TableCell>
                        <TableCell className={`${getExpiryColor(batch.expiry_date)} text-xs`}>
                          {new Date(batch.expiry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                        </TableCell>
                        <TableCell className="text-purple-700 font-medium text-xs">
                          {batch.available_quantity}
                        </TableCell>
                        <TableCell className="text-purple-700 text-xs">
                          ₹{batch.selling_price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-purple-700 text-xs">
                          ₹{batch.mrp.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-purple-700 text-xs">
                          {batch.gst_percentage}%
                        </TableCell>
                        <TableCell>
                          <div>
                            <Input
                              type="number"
                              min="1"
                              max={batch.available_quantity}
                              value={quantities[batch.id] || 1}
                              onChange={(e) =>
                                handleQuantityChange(batch.id, e.target.value)
                              }
                              className="w-16 h-8 text-xs border-purple-300 focus:border-purple-500"
                            />
                            {errors[batch.id] && (
                              <p className="text-xs text-red-500 mt-0.5">
                                {errors[batch.id]}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => handleSelect(batch)}
                            className="bg-purple-600 hover:bg-purple-700 text-white h-7 text-xs"
                          >
                            Add
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {batches.map((batch) => (
                  <Card key={batch.id} className="p-3 border-purple-200">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-purple-900 text-sm">
                            {batch.batch_number}
                          </p>
                          <p className={`${getExpiryColor(batch.expiry_date)} text-xs mt-0.5`}>
                            Exp: {new Date(batch.expiry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                          </p>
                        </div>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                          {batch.available_quantity} avail.
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Price:</span>
                          <p className="font-medium">₹{batch.selling_price.toFixed(2)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">MRP:</span>
                          <p className="font-medium">₹{batch.mrp.toFixed(2)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">GST:</span>
                          <p className="font-medium">{batch.gst_percentage}%</p>
                        </div>
                      </div>

                      <div className="flex gap-2 items-end pt-2 border-t">
                        <div className="flex-1">
                          <Label htmlFor={`qty-${batch.id}`} className="text-xs">Quantity</Label>
                          <Input
                            id={`qty-${batch.id}`}
                            type="number"
                            min="1"
                            max={batch.available_quantity}
                            value={quantities[batch.id] || 1}
                            onChange={(e) =>
                              handleQuantityChange(batch.id, e.target.value)
                            }
                            className="h-8 text-sm border-purple-300"
                          />
                          {errors[batch.id] && (
                            <p className="text-xs text-red-500 mt-0.5">
                              {errors[batch.id]}
                            </p>
                          )}
                        </div>
                        <Button
                          onClick={() => handleSelect(batch)}
                          className="bg-purple-600 hover:bg-purple-700 text-white h-8 px-4 text-sm"
                        >
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

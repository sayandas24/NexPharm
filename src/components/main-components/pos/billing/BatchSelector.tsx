"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    return "text-gray-700";
  };

  return (
    <Sheet open={!!medicine} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Select Batch</SheetTitle>
          {medicine && (
            <div className="text-sm text-muted-foreground">
              <div className="font-medium">{medicine.name}</div>
              {medicine.generic_name && <div>{medicine.generic_name}</div>}
            </div>
          )}
        </SheetHeader>

        <div className="mt-6">
          {loading ? (
            <p className="text-center text-muted-foreground">Loading batches...</p>
          ) : batches.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No batches available for this medicine</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch No.</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>MRP</TableHead>
                  <TableHead>GST %</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-medium">
                      {batch.batch_number}
                    </TableCell>
                    <TableCell className={getExpiryColor(batch.expiry_date)}>
                      {new Date(batch.expiry_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{batch.available_quantity}</TableCell>
                    <TableCell>₹{batch.selling_price.toFixed(2)}</TableCell>
                    <TableCell>₹{batch.mrp.toFixed(2)}</TableCell>
                    <TableCell>{batch.gst_percentage}%</TableCell>
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
                          className="w-20"
                        />
                        {errors[batch.id] && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors[batch.id]}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => handleSelect(batch)}
                      >
                        Add
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCustomers, SaleItemDetail } from "@/hooks/useCustomers";

interface PurchaseItemsExpandedProps {
  saleId: string;
}

export function PurchaseItemsExpanded({ saleId }: PurchaseItemsExpandedProps) {
  const { getSaleItems, loading, error } = useCustomers();
  const [items, setItems] = useState<SaleItemDetail[]>([]);

  useEffect(() => {
    const fetchItems = async () => {
      const data = await getSaleItems(saleId);
      setItems(data);
    };

    fetchItems();
  }, [saleId, getSaleItems]);

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-600">
        <p>Failed to load sale items</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-4 text-gray-600">
        <p>No items found</p>
      </div>
    );
  }

  // Calculate totals
  const subtotal = items.reduce((sum, item) => {
    const baseAmount = item.unit_price * item.quantity;
    return sum + baseAmount;
  }, 0);

  const totalTax = items.reduce((sum, item) => {
    return sum + (item.gst_amount || 0);
  }, 0);

  const grandTotal = items.reduce((sum, item) => {
    return sum + item.total_price;
  }, 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-100">
            <TableHead>Medicine Name</TableHead>
            <TableHead>Batch #</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Unit Price</TableHead>
            <TableHead className="text-right">GST %</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.medicine_name}</TableCell>
              <TableCell className="text-sm text-gray-600">
                {item.batch_number || "N/A"}
              </TableCell>
              <TableCell className="text-right">{item.quantity}</TableCell>
              <TableCell className="text-right">
                ₹{item.unit_price.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                {item.gst_percentage ? `${item.gst_percentage}%` : "N/A"}
              </TableCell>
              <TableCell className="text-right font-semibold">
                ₹{item.total_price.toFixed(2)}
              </TableCell>
            </TableRow>
          ))}

          {/* Subtotal Row */}
          <TableRow className="bg-gray-50 font-semibold">
            <TableCell colSpan={5} className="text-right">
              Subtotal (before GST):
            </TableCell>
            <TableCell className="text-right">₹{subtotal.toFixed(2)}</TableCell>
          </TableRow>

          {/* Tax Row */}
          <TableRow className="bg-gray-50 font-semibold">
            <TableCell colSpan={5} className="text-right">
              Total Tax (GST):
            </TableCell>
            <TableCell className="text-right">₹{totalTax.toFixed(2)}</TableCell>
          </TableRow>

          {/* Grand Total Row */}
          <TableRow className="bg-blue-50 font-bold">
            <TableCell colSpan={5} className="text-right text-blue-900">
              Grand Total:
            </TableCell>
            <TableCell className="text-right text-blue-900">
              ₹{grandTotal.toFixed(2)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { CartItem } from "@/hooks/usePOS";

interface CartTableProps {
  items: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
}

export function CartTable({
  items,
  onUpdateQuantity,
  onRemoveItem,
}: CartTableProps) {
  const handleQuantityChange = (itemId: string, value: string) => {
    const quantity = parseInt(value, 10);
    if (quantity > 0) {
      onUpdateQuantity(itemId, quantity);
    }
  };

  if (items.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          <p className="text-lg">Cart is empty</p>
          <p className="text-sm mt-2">Search and add medicines to start billing</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Cart Items</h3>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Medicine</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>GST %</TableHead>
              <TableHead>GST Amt</TableHead>
              <TableHead>Total</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {item.medicineName}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {item.batchNumber}
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="1"
                    max={item.availableQuantity}
                    value={item.quantity}
                    onChange={(e) =>
                      handleQuantityChange(item.id, e.target.value)
                    }
                    className="w-16"
                  />
                </TableCell>
                <TableCell>₹{item.unitPrice.toFixed(2)}</TableCell>
                <TableCell>{item.gstPercentage}%</TableCell>
                <TableCell>₹{item.gstAmount.toFixed(2)}</TableCell>
                <TableCell className="font-semibold">
                  ₹{item.totalPrice.toFixed(2)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

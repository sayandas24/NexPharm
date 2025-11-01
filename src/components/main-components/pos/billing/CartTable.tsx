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
      <div className="text-center text-muted-foreground py-6">
        <p className="text-sm">Cart is empty</p>
        <p className="text-xs mt-1">Add medicines to start</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Medicine</TableHead>
              <TableHead className="text-xs">Batch</TableHead>
              <TableHead className="text-xs">Qty</TableHead>
              <TableHead className="text-xs">Price</TableHead>
              <TableHead className="text-xs">GST</TableHead>
              <TableHead className="text-xs">Total</TableHead>
              <TableHead className="text-xs"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium text-xs">
                  {item.medicineName}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
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
                    className="w-14 h-8 text-xs"
                  />
                </TableCell>
                <TableCell className="text-xs">₹{item.unitPrice.toFixed(2)}</TableCell>
                <TableCell className="text-xs">{item.gstPercentage}%</TableCell>
                <TableCell className="font-semibold text-xs">
                  ₹{item.totalPrice.toFixed(2)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveItem(item.id)}
                    className="h-7 w-7 p-0"
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-2">
        {items.map((item) => (
          <Card key={item.id} className="p-3">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{item.medicineName}</p>
                <p className="text-xs text-muted-foreground">Batch: {item.batchNumber}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveItem(item.id)}
                className="h-7 w-7 p-0 flex-shrink-0 ml-2"
              >
                <Trash2 className="h-3 w-3 text-red-500" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Price: </span>
                <span className="font-medium">₹{item.unitPrice.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">GST: </span>
                <span className="font-medium">{item.gstPercentage}%</span>
              </div>
            </div>
            <div className="flex justify-between items-center mt-2 pt-2 border-t">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Qty:</span>
                <Input
                  type="number"
                  min="1"
                  max={item.availableQuantity}
                  value={item.quantity}
                  onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                  className="w-16 h-7 text-xs"
                />
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="font-bold text-sm">₹{item.totalPrice.toFixed(2)}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

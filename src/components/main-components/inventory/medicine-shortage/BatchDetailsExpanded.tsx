"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BatchInfo } from "@/hooks/useShortages";
import { AlertTriangle, Clock } from "lucide-react";

interface BatchDetailsExpandedProps {
  batches: BatchInfo[];
  medicineName: string;
}

export default function BatchDetailsExpanded({
  batches,
  medicineName,
}: BatchDetailsExpandedProps) {
  // Get expiry status color and label
  const getExpiryStatus = (daysUntilExpiry: number) => {
    if (daysUntilExpiry < 0) {
      return {
        color: "bg-red-100 text-red-800 border-red-300",
        label: "Expired",
        icon: <AlertTriangle className="h-3 w-3" />,
      };
    } else if (daysUntilExpiry <= 30) {
      return {
        color: "bg-red-100 text-red-800 border-red-300",
        label: `${daysUntilExpiry}d left`,
        icon: <AlertTriangle className="h-3 w-3" />,
      };
    } else if (daysUntilExpiry <= 60) {
      return {
        color: "bg-orange-100 text-orange-800 border-orange-300",
        label: `${daysUntilExpiry}d left`,
        icon: <Clock className="h-3 w-3" />,
      };
    } else if (daysUntilExpiry <= 90) {
      return {
        color: "bg-yellow-100 text-yellow-800 border-yellow-300",
        label: `${daysUntilExpiry}d left`,
        icon: <Clock className="h-3 w-3" />,
      };
    }
    return {
      color: "bg-green-100 text-green-800 border-green-300",
      label: `${daysUntilExpiry}d left`,
      icon: null,
    };
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (batches.length === 0) {
    return (
      <div className="p-6 text-center bg-gray-50 rounded-lg">
        <AlertTriangle className="h-8 w-8 mx-auto text-gray-400 mb-2" />
        <p className="text-gray-600 font-medium">No Active Batches</p>
        <p className="text-sm text-gray-500 mt-1">
          This medicine has zero inventory across all batches
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">
        Batch Details for {medicineName}
      </h4>

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-3">
        {batches.map((batch) => {
          const expiryStatus = getExpiryStatus(batch.daysUntilExpiry);
          return (
            <div key={batch.id} className="bg-white rounded-md border p-3">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-xs text-gray-500">Batch Number</div>
                  <div className="font-mono text-sm font-medium">
                    {batch.batchNumber}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`${expiryStatus.color} flex items-center gap-1`}
                >
                  {expiryStatus.icon}
                  {expiryStatus.label}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-xs text-gray-500">Expiry Date</div>
                  <div>{formatDate(batch.expiryDate)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Available Qty</div>
                  <div className="font-medium">{batch.availableQuantity}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Supplier</div>
                  <div>
                    {batch.supplierName || (
                      <span className="text-gray-400 italic">Unknown</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">MRP</div>
                  <div className="font-medium">₹{batch.mrp.toFixed(2)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch Number</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Available Qty</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>MRP</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.map((batch) => {
              const expiryStatus = getExpiryStatus(batch.daysUntilExpiry);
              return (
                <TableRow key={batch.id}>
                  <TableCell className="font-mono text-sm">
                    {batch.batchNumber}
                  </TableCell>
                  <TableCell>{formatDate(batch.expiryDate)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{batch.availableQuantity}</Badge>
                  </TableCell>
                  <TableCell>
                    {batch.supplierName || (
                      <span className="text-gray-400 italic">Unknown</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    ₹{batch.mrp.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`${expiryStatus.color} flex items-center gap-1 w-fit`}
                    >
                      {expiryStatus.icon}
                      {expiryStatus.label}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

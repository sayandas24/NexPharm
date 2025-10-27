"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCustomers, PurchaseHistoryItem } from "@/hooks/useCustomers";
import { PurchaseItemsExpanded } from "./PurchaseItemsExpanded";
import { ChevronDown, ChevronRight, ShoppingCart } from "lucide-react";

interface PurchaseHistoryTableProps {
  customerId: string;
  pharmacyId: string;
}

export function PurchaseHistoryTable({
  customerId,
  pharmacyId,
}: PurchaseHistoryTableProps) {
  const { getPurchaseHistory, loading } = useCustomers(pharmacyId);
  const [purchases, setPurchases] = useState<PurchaseHistoryItem[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    const fetchHistory = async () => {
      const data = await getPurchaseHistory(customerId, currentPage, pageSize);
      setPurchases(data);
    };

    fetchHistory();
  }, [customerId, currentPage, getPurchaseHistory]);

  const toggleRow = (saleId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(saleId)) {
      newExpanded.delete(saleId);
    } else {
      newExpanded.add(saleId);
    }
    setExpandedRows(newExpanded);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid date";
    }
  };

  const formatPaymentMethod = (method: string | null) => {
    if (!method) return "N/A";
    return method.charAt(0).toUpperCase() + method.slice(1);
  };

  if (loading && purchases.length === 0) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </Card>
    );
  }

  if (purchases.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium">No purchases yet</p>
          <p className="text-sm mt-2">This customer has not made any purchases</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <ShoppingCart className="h-5 w-5 mr-2 text-blue-600" />
        Purchase History
      </h3>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Invoice #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Items</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.map((purchase) => (
              <>
                <TableRow
                  key={purchase.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleRow(purchase.id)}
                >
                  <TableCell>
                    <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
                      {expandedRows.has(purchase.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">
                    {purchase.invoice_number}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(purchase.created_at)}
                  </TableCell>
                  <TableCell className="font-semibold">
                    ₹{purchase.net_amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {formatPaymentMethod(purchase.payment_method)}
                    </span>
                  </TableCell>
                  <TableCell>{purchase.item_count}</TableCell>
                </TableRow>

                {expandedRows.has(purchase.id) && (
                  <TableRow>
                    <TableCell colSpan={6} className="bg-gray-50 p-4">
                      <PurchaseItemsExpanded saleId={purchase.id} />
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {purchases.length === pageSize && (
        <div className="flex justify-between items-center mt-4">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">Page {currentPage}</span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={purchases.length < pageSize}
          >
            Next
          </Button>
        </div>
      )}
    </Card>
  );
}

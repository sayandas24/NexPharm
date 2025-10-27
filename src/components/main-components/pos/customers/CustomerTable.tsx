"use client";

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
import { CustomerWithStats } from "@/hooks/useCustomers";
import { ArrowUpDown, Eye } from "lucide-react";

interface CustomerTableProps {
  customers: CustomerWithStats[];
  onCustomerClick: (customerId: string) => void;
  sortBy: "name" | "purchases" | "spending";
  sortOrder: "asc" | "desc";
  onSort: (column: "name" | "purchases" | "spending") => void;
}

export function CustomerTable({
  customers,
  onCustomerClick,
  sortBy,
  sortOrder,
  onSort,
}: CustomerTableProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    try {
      return new Date(dateString).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  const SortIcon = ({ column }: { column: "name" | "purchases" | "spending" }) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1 text-gray-400" />;
    }
    return (
      <ArrowUpDown
        className={`h-4 w-4 ml-1 ${
          sortOrder === "asc" ? "text-blue-600" : "text-blue-600 rotate-180"
        }`}
      />
    );
  };

  if (customers.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          <p className="text-lg">No customers found</p>
          <p className="text-sm mt-2">Try adjusting your search criteria</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  onClick={() => onSort("name")}
                  className="flex items-center hover:text-gray-900 font-semibold"
                >
                  Name
                  <SortIcon column="name" />
                </button>
              </TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>
                <button
                  onClick={() => onSort("purchases")}
                  className="flex items-center hover:text-gray-900 font-semibold"
                >
                  Purchases
                  <SortIcon column="purchases" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => onSort("spending")}
                  className="flex items-center hover:text-gray-900 font-semibold"
                >
                  Total Spending
                  <SortIcon column="spending" />
                </button>
              </TableHead>
              <TableHead>Last Purchase</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow
                key={customer.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => onCustomerClick(customer.id)}
              >
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell>{customer.phone || "N/A"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {customer.email || "Not provided"}
                </TableCell>
                <TableCell>{customer.total_purchases}</TableCell>
                <TableCell className="font-semibold">
                  ₹{customer.total_spending.toFixed(2)}
                </TableCell>
                <TableCell className="text-sm">
                  {formatDate(customer.last_purchase_date)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCustomerClick(customer.id);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
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

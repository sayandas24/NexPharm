'use client'
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface CustomerMedicineBreakdownProps {
  medicines: Array<{
    medicine_name: string
    total_quantity: number
    total_amount: number
    purchase_count: number
  }>
  customerName: string
  isLoading: boolean
}

export default function CustomerMedicineBreakdown({
  medicines,
  customerName,
  isLoading,
}: CustomerMedicineBreakdownProps) {
  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Purchase Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!customerName) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Purchase Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Select a customer to view their purchase details
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!medicines || medicines.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Purchase Details - {customerName}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No purchase data available for this customer in the selected period
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchase Details - {customerName}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Medicine Name</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead className="text-right">Times Purchased</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {medicines.map((medicine, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{medicine.medicine_name}</TableCell>
                <TableCell className="text-right">{medicine.total_quantity}</TableCell>
                <TableCell className="text-right">{formatCurrency(medicine.total_amount)}</TableCell>
                <TableCell className="text-right">{medicine.purchase_count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

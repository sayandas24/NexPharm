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

interface TopCustomersListProps {
  customers: Array<{
    customer_id: string
    customer_name: string
    total_spent: number
    transaction_count: number
  }>
  selectedCustomerId: string | null
  onSelectCustomer: (customerId: string) => void
  isLoading: boolean
}

export default function TopCustomersList({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  isLoading,
}: TopCustomersListProps) {
  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Customers</CardTitle>
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

  if (!customers || customers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No customer data available for the selected period
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Customers</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Customer Name</TableHead>
              <TableHead className="text-right">Total Spent</TableHead>
              <TableHead className="text-right">Transactions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer, index) => (
              <TableRow
                key={customer.customer_id}
                className={`cursor-pointer hover:bg-muted/50 ${
                  selectedCustomerId === customer.customer_id ? 'bg-muted' : ''
                }`}
                onClick={() => onSelectCustomer(customer.customer_id)}
              >
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>{customer.customer_name}</TableCell>
                <TableCell className="text-right">{formatCurrency(customer.total_spent)}</TableCell>
                <TableCell className="text-right">{customer.transaction_count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

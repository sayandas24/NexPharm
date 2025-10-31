'use client'
import React, { memo } from 'react'
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

interface MedicineSalesChartProps {
  data: Array<{
    medicine_name: string
    total_quantity: number
    total_revenue: number
    transaction_count: number
  }>
  isLoading: boolean
}

const MedicineSalesChart = memo(function MedicineSalesChart({ data, isLoading }: MedicineSalesChartProps) {
  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Selling Medicines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Selling Medicines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No medicine sales data available for the selected period
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className='max-[600px]:w-[83vw]'>
      <CardHeader>
        <CardTitle>Top Selling Medicines</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Medicine Name</TableHead>
              <TableHead className="text-right">Quantity Sold</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Transactions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((medicine, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell className="font-medium">{medicine.medicine_name}</TableCell>
                <TableCell className="text-right">{medicine.total_quantity}</TableCell>
                <TableCell className="text-right">{formatCurrency(medicine.total_revenue)}</TableCell>
                <TableCell className="text-right">{medicine.transaction_count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
})

export default MedicineSalesChart

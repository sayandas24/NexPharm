'use client'
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DollarSign, ShoppingCart, TrendingUp, Tag, Receipt, BarChart3 } from 'lucide-react'

interface SalesSummaryCardsProps {
  summary: {
    total_revenue: number
    total_sales: number
    total_discount: number
    total_tax: number
    total_transactions: number
    avg_sale_value: number
  } | null
  isLoading: boolean
}

export default function SalesSummaryCards({ summary, isLoading }: SalesSummaryCardsProps) {
  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '₹0.00'
    return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const cards = [
    {
      title: 'Total Revenue',
      value: summary?.total_revenue,
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      title: 'Total Sales',
      value: summary?.total_sales,
      icon: ShoppingCart,
      color: 'text-blue-600',
    },
    {
      title: 'Total Transactions',
      value: summary?.total_transactions,
      icon: Receipt,
      color: 'text-purple-600',
      isCount: true,
    },
    {
      title: 'Average Sale Value',
      value: summary?.avg_sale_value,
      icon: TrendingUp,
      color: 'text-orange-600',
    },
    {
      title: 'Total Discount',
      value: summary?.total_discount,
      icon: Tag,
      color: 'text-red-600',
    },
    {
      title: 'Total Tax',
      value: summary?.total_tax,
      icon: BarChart3,
      color: 'text-indigo-600',
    },
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[120px]" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[100px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {card.isCount
                  ? (card.value || 0).toLocaleString('en-IN')
                  : formatCurrency(card.value)}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

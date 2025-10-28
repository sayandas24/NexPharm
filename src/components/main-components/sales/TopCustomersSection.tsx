'use client'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import useSales from '@/hooks/useSales'
import TopCustomersList from './TopCustomersList'
import CustomerMedicineBreakdown from './CustomerMedicineBreakdown'

interface TopCustomersSectionProps {
  pharmacyId: string | undefined
  period: 'daily' | 'weekly' | 'monthly' | 'all'
  customDateRange: { start: Date | null; end: Date | null }
  isCustomRange: boolean
}

export default function TopCustomersSection({
  pharmacyId,
  period,
  customDateRange,
  isCustomRange,
}: TopCustomersSectionProps) {
  const { fetchTopCustomers, fetchCustomerTopMedicines } = useSales(pharmacyId || '')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>('')
  const [topCustomers, setTopCustomers] = useState<any[]>([])
  const [customerMedicines, setCustomerMedicines] = useState<any[]>([])
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false)
  const [isLoadingMedicines, setIsLoadingMedicines] = useState(false)

  // Memoize date range key to prevent unnecessary re-renders
  const dateRangeKey = useMemo(() => {
    if (!isCustomRange) return period
    return `${customDateRange.start?.getTime()}-${customDateRange.end?.getTime()}`
  }, [isCustomRange, period, customDateRange.start, customDateRange.end])

  useEffect(() => {
    const loadTopCustomers = async () => {
      if (!pharmacyId) return

      setIsLoadingCustomers(true)
      try {
        const dateRange =
          isCustomRange && customDateRange.start && customDateRange.end
            ? { start: customDateRange.start, end: customDateRange.end }
            : undefined

        const data = await fetchTopCustomers(period, dateRange)
        setTopCustomers(data)
      } catch (error) {
        console.error('Error fetching top customers:', error)
      } finally {
        setIsLoadingCustomers(false)
      }
    }

    loadTopCustomers()
    setSelectedCustomerId(null)
    setSelectedCustomerName('')
    setCustomerMedicines([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pharmacyId, dateRangeKey])

  useEffect(() => {
    const loadCustomerMedicines = async () => {
      if (!pharmacyId || !selectedCustomerId) return

      setIsLoadingMedicines(true)
      try {
        const dateRange =
          isCustomRange && customDateRange.start && customDateRange.end
            ? { start: customDateRange.start, end: customDateRange.end }
            : undefined

        const data = await fetchCustomerTopMedicines(selectedCustomerId, period, dateRange)
        setCustomerMedicines(data)
      } catch (error) {
        console.error('Error fetching customer medicines:', error)
      } finally {
        setIsLoadingMedicines(false)
      }
    }

    loadCustomerMedicines()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCustomerId, pharmacyId, dateRangeKey])

  const handleSelectCustomer = useCallback((customerId: string) => {
    const customer = topCustomers.find((c) => c.customer_id === customerId)
    setSelectedCustomerId(customerId)
    setSelectedCustomerName(customer?.customer_name || '')
  }, [topCustomers])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <TopCustomersList
        customers={topCustomers}
        selectedCustomerId={selectedCustomerId}
        onSelectCustomer={handleSelectCustomer}
        isLoading={isLoadingCustomers}
      />
      <CustomerMedicineBreakdown
        medicines={customerMedicines}
        customerName={selectedCustomerName}
        isLoading={isLoadingMedicines}
      />
    </div>
  )
}

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import React from 'react'

export default function POSPage() {
  return (
    <div>
      <h1>Point of Sale</h1>
      <div className="w-full flex gap-5">
        <Link href="/pos/billing">
          <Button color="light">Billing</Button>
        </Link>
        <Link href="/pos/customers">
          <Button>Customers</Button>
        </Link> 
      </div>
    </div>
  )
}

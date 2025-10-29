'use client';
import ScanComponentMain from '@/components/scanner/ScanComponentMain'
import useAuth from '@/hooks/use-auth';
import React from 'react'

export default function ScanComponentMainPage() {

  const { currentPharmacy } = useAuth();

  return (
    <ScanComponentMain currentPharmacy={currentPharmacy}/>
  )
}

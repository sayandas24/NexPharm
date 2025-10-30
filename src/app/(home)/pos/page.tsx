import { ChevronRight, Landmark, Users } from "lucide-react";
import Link from "next/link";
import React from "react";

export default function POSPage() {
  return (
    <div className="p-6 max-w-[50rem]">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Point of Sale</h1>
        <p className="text-gray-600">Manage billing and customer operations</p>
      </div>

      {/* Cards Grid */}
      <div className="flex gap-6 flex-wrap">
        {/* Billing Card */}
        <Link href="/pos/billing" className="flex-1 min-w-[20rem]">
          <div className="min-w-[20rem] relative rounded-xl border-2 h-[13rem] border-blue-600 overflow-hidden bg-blue-200 flex flex-col">
            {/* Upper white section */}
            <div className="h-full bg-white rounded-xl flex flex-col items-center justify-center">
              <div className="flex flex-col items-center space-y-2 rounded-xl">
                {/* Icon */}
                <div className="w-14 h-14 flex items-center justify-center rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors">
                  <Landmark
                    className="w-8 h-8 text-blue-600"
                    strokeWidth={2.5}
                  />
                </div>
                {/* Count and Label */}
                <div className="text-center">
                  <p className="text-lg text-gray-700">Billing zone</p>
                </div>
              </div>
            </div>
            {/* Bottom action area */}
            <div className="relative cursor-pointer w-full flex justify-center h-8 opacity-75">
              <span className="flex gap-1 items-center text-sm">
                Bill Medicines
                <ChevronRight className="w-4 h-4" strokeWidth={3} />
                <ChevronRight className="w-4 h-4 -ml-3" strokeWidth={3} />
              </span>
            </div>
          </div>
        </Link>

        {/* Customers Card */}
        <Link href="/pos/customers" className="flex-1 min-w-[20rem]">
          <div className="min-w-[20rem] relative rounded-xl border-2 h-[13rem] border-green-600 overflow-hidden bg-green-200 flex flex-col">
            {/* Upper white section */}
            <div className="h-full bg-white rounded-xl flex flex-col items-center justify-center">
              <div className="flex flex-col items-center space-y-2 rounded-xl">
                {/* Icon */}
                <div className="w-14 h-14 flex items-center justify-center rounded-full bg-green-100 group-hover:bg-green-200 transition-colors">
                  <Users className="w-8 h-8 text-green-600" strokeWidth={2.5} />
                </div>
                {/* Count and Label */}
                <div className="text-center">
                  <p className="text-lg text-gray-700">Customer Statistics</p>
                </div>
              </div>
            </div>
            {/* Bottom action area */}
            <div className="relative cursor-pointer w-full flex justify-center h-8 opacity-75">
              <span className="flex gap-1 items-center text-sm">
                View Details
                <ChevronRight className="w-4 h-4" strokeWidth={3} />
                <ChevronRight className="w-4 h-4 -ml-3" strokeWidth={3} />
              </span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

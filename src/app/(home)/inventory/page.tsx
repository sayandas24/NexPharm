import { ChevronRight, FileText, Layers, AlertTriangle, Bell } from "lucide-react";
import Link from "next/link";
import React from "react";

export default function Inventory() {
  return (
    <div className="p-6 ">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Inventory</h1>
        <p className="text-gray-600">Manage medicines, stock levels and alerts</p>
      </div>

      {/* Cards Grid */}
      <div className="flex gap-6 flex-wrap">
        {/* Medicine Lists Card */}
        <Link href="/inventory/med-list"  className="flex-1 min-w-[20rem]">
          <div className="min-w-[20rem] relative rounded-xl border-2 h-[13rem] border-blue-600 overflow-hidden bg-blue-200 flex flex-col">
            {/* Upper white section */}
            <div className="h-full bg-white rounded-xl flex flex-col items-center justify-center">
              <div className="flex flex-col items-center space-y-2 rounded-xl">
                {/* Icon */}
                <div className="w-14 h-14 flex items-center justify-center rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors">
                  <FileText
                    className="w-8 h-8 text-blue-600"
                    strokeWidth={2.5}
                  />
                </div>
                {/* Count and Label */}
                <div className="text-center">
                  <p className="text-lg text-gray-700">Medicine Lists</p>
                </div>
              </div>
            </div>

            {/* Bottom action area */}
            <div className="relative cursor-pointer w-full flex justify-center h-8 opacity-75">
              <span className="flex gap-1 items-center text-sm">
                View All Medicines
                <ChevronRight className="w-4 h-4" strokeWidth={3} />
                <ChevronRight className="w-4 h-4 -ml-3" strokeWidth={3} />
              </span>
            </div>
          </div>
        </Link>

        {/* Medicine Groups Card */}
        <Link href="/inventory/med-groups"  className="flex-1 min-w-[20rem]">
          <div className="min-w-[20rem] relative rounded-xl border-2 h-[13rem] border-green-600 overflow-hidden bg-green-200 flex flex-col">
            {/* Upper white section */}
            <div className="h-full bg-white rounded-xl flex flex-col items-center justify-center">
              <div className="flex flex-col items-center space-y-2 rounded-xl">
                {/* Icon */}
                <div className="w-14 h-14 flex items-center justify-center rounded-full bg-green-100 group-hover:bg-green-200 transition-colors">
                  <Layers className="w-8 h-8 text-green-600" strokeWidth={2.5} />
                </div>
                {/* Count and Label */}
                <div className="text-center">
                  <p className="text-lg text-gray-700">Medicine Groups</p>
                </div>
              </div>
            </div>

            {/* Bottom action area */}
            <div className="relative cursor-pointer w-full flex justify-center h-8 opacity-75">
              <span className="flex gap-1 items-center text-sm">
                Manage Groups
                <ChevronRight className="w-4 h-4" strokeWidth={3} />
                <ChevronRight className="w-4 h-4 -ml-3" strokeWidth={3} />
              </span>
            </div>
          </div>
        </Link>

        {/* Medicine Shortage Card */}
        <Link href="/inventory/med-shortage"  className="flex-1 min-w-[20rem]">
          <div className="min-w-[20rem] relative rounded-xl border-2 h-[13rem] border-red-600 overflow-hidden bg-red-200 flex flex-col">
            {/* Upper white section */}
            <div className="h-full bg-white rounded-xl flex flex-col items-center justify-center">
              <div className="flex flex-col items-center space-y-2 rounded-xl">
                {/* Icon */}
                <div className="w-14 h-14 flex items-center justify-center rounded-full bg-red-100 group-hover:bg-red-200 transition-colors">
                  <AlertTriangle
                    className="w-8 h-8 text-red-600"
                    strokeWidth={2.5}
                  />
                </div>
                {/* Count and Label */}
                <div className="text-center">
                  <p className="text-lg text-gray-700">Medicine Shortage</p>
                </div>
              </div>
            </div>

            {/* Bottom action area */}
            <div className="relative cursor-pointer w-full flex justify-center h-8 opacity-75">
              <span className="flex gap-1 items-center text-sm">
                View Shortages
                <ChevronRight className="w-4 h-4" strokeWidth={3} />
                <ChevronRight className="w-4 h-4 -ml-3" strokeWidth={3} />
              </span>
            </div>
          </div>
        </Link>

        {/* Alerts Card */}
        <Link href="/inventory/alerts"  className="flex-1 min-w-[20rem]">
          <div className="min-w-[20rem] relative rounded-xl border-2 h-[13rem] border-orange-600 overflow-hidden bg-orange-200 flex flex-col">
            {/* Upper white section */}
            <div className="h-full bg-white rounded-xl flex flex-col items-center justify-center">
              <div className="flex flex-col items-center space-y-2 rounded-xl">
                {/* Icon */}
                <div className="w-14 h-14 flex items-center justify-center rounded-full bg-orange-100 group-hover:bg-orange-200 transition-colors">
                  <Bell
                    className="w-8 h-8 text-orange-600"
                    strokeWidth={2.5}
                  />
                </div>
                {/* Count and Label */}
                <div className="text-center">
                  <p className="text-lg text-gray-700">Alerts</p>
                </div>
              </div>
            </div>

            {/* Bottom action area */}
            <div className="relative cursor-pointer w-full flex justify-center h-8 opacity-75">
              <span className="flex gap-1 items-center text-sm">
                View Alerts
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
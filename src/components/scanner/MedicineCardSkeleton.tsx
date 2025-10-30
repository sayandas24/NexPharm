"use client";

import React from "react";

export default function MedicineCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden shadow-lg animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-gradient-to-r from-gray-300 to-gray-400 p-6">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-5 bg-gray-200 rounded w-1/2"></div>
      </div>

      {/* Content Skeleton */}
      <div className="p-6 space-y-6">
        {/* Stock Status Skeleton */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 bg-gray-300 rounded"></div>
            <div>
              <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-300 rounded w-16"></div>
            </div>
          </div>
          <div className="h-8 w-24 bg-gray-300 rounded"></div>
        </div>

        {/* Medicine Details Skeleton */}
        <div className="border-t pt-6">
          <div className="h-5 bg-gray-300 rounded w-32 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-5 w-5 bg-gray-300 rounded"></div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-300 rounded w-20 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-32"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Supplier Section Skeleton */}
        <div className="border-t pt-6">
          <div className="h-5 bg-gray-300 rounded w-40 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-5 w-5 bg-gray-300 rounded"></div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-300 rounded w-20 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-40"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Batches Section Skeleton */}
        <div className="border-t pt-6">
          <div className="h-5 bg-gray-300 rounded w-36 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-4 bg-gray-50 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <div className="h-5 bg-gray-300 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-20"></div>
                  </div>
                  <div>
                    <div className="h-4 bg-gray-300 rounded w-20 mb-1"></div>
                    <div className="h-3 bg-gray-300 rounded w-24"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sales Stats Skeleton */}
        <div className="border-t pt-6">
          <div className="h-5 bg-gray-300 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-4 bg-gray-50 border border-gray-200 rounded-lg"
              >
                <div className="h-3 bg-gray-300 rounded w-20 mb-2"></div>
                <div className="h-8 bg-gray-300 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Skeleton */}
      <div className="p-4 bg-gray-50 border-t space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="h-10 bg-gray-300 rounded"></div>
          <div className="h-10 bg-gray-300 rounded"></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-10 bg-gray-300 rounded"></div>
          <div className="h-10 bg-gray-300 rounded"></div>
        </div>
        <div className="h-10 bg-gray-300 rounded"></div>
      </div>
    </div>
  );
}

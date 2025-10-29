import { useRouter } from "next/navigation";
import React from "react";

export default function QuickLinks() {
  const router = useRouter();

  return (
    <div className="mt-10">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Visit</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <button
          onClick={() => router.push("/suppliers")}
          className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-teal-300 to-teal-500 p-6 text-left shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-100"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 transition-transform duration-300 group-hover:scale-150"></div>
          <div className="relative">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-3 backdrop-blur-sm">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-white font-semibold text-lg mb-1">Suppliers</h3>
            <p className="text-teal-100 text-sm">Manage suppliers</p>
          </div>
        </button>

        {/* Inventory Overview */}
        <button
          onClick={() => router.push("/reports/inventory")}
          className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-300 to-indigo-500 p-6 text-left shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-100"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 transition-transform duration-300 group-hover:scale-150"></div>
          <div className="relative">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-3 backdrop-blur-sm">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <h3 className="text-white font-semibold text-lg mb-1">
              Inventory Report
            </h3>
            <p className="text-indigo-100 text-sm">
              View inventory full report
            </p>
          </div>
        </button>

        {/* medicine alerts */}
        <button
          onClick={() => router.push("/inventory/alerts")}
          className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-red-300 to-red-500 p-6 text-left shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-100"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 transition-transform duration-300 group-hover:scale-150"></div>
          <div className="relative">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-3 backdrop-blur-sm">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <h3 className="text-white font-semibold text-lg mb-1">
              Medicine Alerts
            </h3>
            <p className="text-indigo-100 text-sm">
              See all the alerts for medicines
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}

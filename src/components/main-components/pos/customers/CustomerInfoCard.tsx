"use client";

import { Card } from "@/components/ui/card";
import { CustomerWithStats } from "@/hooks/useCustomers";
import { Phone, Mail, Calendar, Clock, User } from "lucide-react";

interface CustomerInfoCardProps {
  customer: CustomerWithStats;
}

export function CustomerInfoCard({ customer }: CustomerInfoCardProps) {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <User className="h-5 w-5 mr-2 text-blue-600" />
        Customer Information
      </h3>

      <div className="space-y-4">
        {/* Name */}
        <div>
          <p className="text-sm text-gray-600 mb-1">Full Name</p>
          <p className="text-lg font-semibold text-gray-900">{customer.name}</p>
        </div>

        {/* Phone */}
        <div className="flex items-start">
          <Phone className="h-4 w-4 mr-2 mt-1 text-gray-500" />
          <div>
            <p className="text-sm text-gray-600">Phone Number</p>
            <p className="text-base font-medium text-gray-900">
              {customer.phone || "Not provided"}
            </p>
          </div>
        </div>

        {/* Email */}
        <div className="flex items-start">
          <Mail className="h-4 w-4 mr-2 mt-1 text-gray-500" />
          <div>
            <p className="text-sm text-gray-600">Email Address</p>
            <p className="text-base font-medium text-gray-900">
              {customer.email || "Not provided"}
            </p>
          </div>
        </div>

        {/* Date of Birth */}
        <div className="flex items-start">
          <Calendar className="h-4 w-4 mr-2 mt-1 text-gray-500" />
          <div>
            <p className="text-sm text-gray-600">Date of Birth</p>
            <p className="text-base font-medium text-gray-900">
              {customer.date_of_birth
                ? formatDate(customer.date_of_birth)
                : "Not provided"}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-4"></div>

        {/* Account Created */}
        <div className="flex items-start">
          <Clock className="h-4 w-4 mr-2 mt-1 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">Account Created</p>
            <p className="text-sm text-gray-700">{formatDate(customer.created_at)}</p>
          </div>
        </div>

        {/* Last Updated */}
        <div className="flex items-start">
          <Clock className="h-4 w-4 mr-2 mt-1 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">Last Updated</p>
            <p className="text-sm text-gray-700">{formatDate(customer.updated_at)}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

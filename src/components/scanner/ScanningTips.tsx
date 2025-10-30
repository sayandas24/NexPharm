"use client";

import React from "react";
import { Lightbulb } from "lucide-react";

interface ScanningTipsProps {
  isVisible: boolean;
}

export default function ScanningTips({ isVisible }: ScanningTipsProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-start gap-3">
        <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-semibold mb-2">Tips for best results:</p>
          <ul className="list-disc list-inside space-y-1 text-blue-800">
            <li>Ensure good lighting</li>
            <li>Hold camera steady and focus on medicine name</li>
            <li>Position packaging within the frame</li>
            <li>Avoid shadows and reflections</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

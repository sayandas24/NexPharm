"use client";

import * as React from "react";
import { Cardio } from "ldrs/react";
import { cn } from "@/lib/utils";

export interface LoadingStateProps {
  message?: string;
  subtitle?: string;
  size?: number;
  stroke?: number;
  speed?: number;
  color?: string;
  className?: string;
  fullScreen?: boolean;
}

export function LoadingState({
  message = "Loading...",
  subtitle,
  size = 50,
  stroke = 4,
  speed = 2,
  color = "hsl(var(--primary))",
  className,
  fullScreen = false,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 p-6",
        fullScreen && "min-h-screen",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Cardio size={size} stroke={stroke} speed={speed} color={color} />
      
      {message && (
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">{message}</h2>
          {subtitle && (
            <p className="text-gray-600 mt-2 max-w-md">{subtitle}</p>
          )}
        </div>
      )}
    </div>
  );
}

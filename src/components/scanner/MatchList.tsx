"use client";

import React from "react";
import { MedicineMatch } from "@/types/scanner-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { medicineMatchService } from "@/services/medicine-match.service";

interface MatchListProps {
  matches: MedicineMatch[];
  onSelectMedicine: (match: MedicineMatch) => void;
}

export default function MatchList({ matches, onSelectMedicine }: MatchListProps) {
  if (matches.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
        <h3 className="text-base sm:text-lg font-semibold">
          {matches.length === 1 ? "Medicine Found" : "Multiple Matches Found"}
        </h3>
        {matches.length > 1 && (
          <span className="text-xs sm:text-sm text-gray-500">
            Select the correct medicine
          </span>
        )}
      </div>

      <div className="space-y-2">
        {matches.map((match, index) => (
          <MatchItem
            key={match.medicine.id}
            match={match}
            index={index}
            onSelect={() => onSelectMedicine(match)}
          />
        ))}
      </div>
    </div>
  );
}

interface MatchItemProps {
  match: MedicineMatch;
  index: number;
  onSelect: () => void;
}

function MatchItem({ match, index, onSelect }: MatchItemProps) {
  const { medicine, confidence, matchedText, matchType } = match;

  // Get confidence color
  const confidenceColor = medicineMatchService.getConfidenceColor(confidence);

  // Get confidence icon
  const ConfidenceIcon =
    confidence >= 70 ? CheckCircle2 : AlertCircle;

  return (
    <button
      onClick={onSelect}
      className="w-full text-left p-2.5 sm:p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-red-500 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-2 sm:gap-4">
        <div className="flex-1 min-w-0">
          {/* Medicine Name */}
          <div className="flex items-start flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1.5 sm:mb-1">
            <h4 className="font-semibold text-sm sm:text-base text-gray-900 break-words">
              {medicine.name}
            </h4>
            {index === 0 && confidence >= 90 && (
              <Badge variant="default" className="bg-green-600 text-[10px] sm:text-xs w-fit">
                Best Match
              </Badge>
            )}
          </div>

          {/* Medicine Details */}
          <div className="space-y-0.5 sm:space-y-1 text-xs sm:text-sm text-gray-600">
            {medicine.generic_name && (
              <p className="break-words">
                <span className="font-medium">Generic:</span>{" "}
                {medicine.generic_name}
              </p>
            )}
            {medicine.manufacturer && (
              <p className="break-words">
                <span className="font-medium">Manufacturer:</span>{" "}
                {medicine.manufacturer}
              </p>
            )}
            {medicine.strength && (
              <p className="break-words">
                <span className="font-medium">Strength:</span>{" "}
                {medicine.strength}
              </p>
            )}
          </div>

          {/* Matched Text */}
          {matchedText !== medicine.name && (
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1.5 sm:mt-2 break-words">
              Matched: &quot;{matchedText}&quot;
            </p>
          )}
        </div>

        {/* Confidence Score */}
        <div className="flex flex-col items-end gap-0.5 sm:gap-1 flex-shrink-0">
          <div className={`flex items-center gap-0.5 sm:gap-1 ${confidenceColor}`}>
            <ConfidenceIcon className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="font-semibold text-xs sm:text-base whitespace-nowrap">{Math.round(confidence)}%</span>
          </div>
          <Badge
            variant={medicineMatchService.getConfidenceBadgeVariant(confidence)}
            className="text-[10px] sm:text-xs"
          >
            {matchType}
          </Badge>
        </div>
      </div>

      {/* Low Confidence Warning */}
      {confidence < 70 && (
        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200">
          <div className="flex items-start gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-orange-600">
            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 mt-0.5" />
            <span>
              Low confidence match. Please verify this is the correct medicine.
            </span>
          </div>
        </div>
      )}
    </button>
  );
}
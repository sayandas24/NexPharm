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
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {matches.length === 1 ? "Medicine Found" : "Multiple Matches Found"}
        </h3>
        {matches.length > 1 && (
          <span className="text-sm text-gray-500">
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
      className="w-full text-left p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-red-500 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Medicine Name */}
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-900 truncate">
              {medicine.name}
            </h4>
            {index === 0 && confidence >= 90 && (
              <Badge variant="default" className="bg-green-600">
                Best Match
              </Badge>
            )}
          </div>

          {/* Medicine Details */}
          <div className="space-y-1 text-sm text-gray-600">
            {medicine.generic_name && (
              <p className="truncate">
                <span className="font-medium">Generic:</span>{" "}
                {medicine.generic_name}
              </p>
            )}
            {medicine.manufacturer && (
              <p className="truncate">
                <span className="font-medium">Manufacturer:</span>{" "}
                {medicine.manufacturer}
              </p>
            )}
            {medicine.strength && (
              <p className="truncate">
                <span className="font-medium">Strength:</span>{" "}
                {medicine.strength}
              </p>
            )}
          </div>

          {/* Matched Text */}
          {matchedText !== medicine.name && (
            <p className="text-xs text-gray-500 mt-2 truncate">
              Matched: &quot;{matchedText}&quot;
            </p>
          )}
        </div>

        {/* Confidence Score */}
        <div className="flex flex-col items-end gap-1">
          <div className={`flex items-center gap-1 ${confidenceColor}`}>
            <ConfidenceIcon className="h-4 w-4" />
            <span className="font-semibold">{Math.round(confidence)}%</span>
          </div>
          <Badge
            variant={medicineMatchService.getConfidenceBadgeVariant(confidence)}
            className="text-xs"
          >
            {matchType}
          </Badge>
        </div>
      </div>

      {/* Low Confidence Warning */}
      {confidence < 70 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-start gap-2 text-xs text-orange-600">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>
              Low confidence match. Please verify this is the correct medicine.
            </span>
          </div>
        </div>
      )}
    </button>
  );
}

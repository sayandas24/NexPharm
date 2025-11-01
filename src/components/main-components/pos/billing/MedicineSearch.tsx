"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Search } from "lucide-react";

interface PharmacyMedicineWithDetails {
  id: string;
  name: string;
  generic_name: string | null;
  strength: string | null;
  stock_quantity: number;
  mrp: number;
  is_available: number;
}

interface MedicineSearchProps {
  pharmacyId: string;
  onMedicineSelect: (medicine: PharmacyMedicineWithDetails) => void;
  searchMedicinesByName: (
    searchTerm: string,
    pharmacyId: string
  ) => Promise<PharmacyMedicineWithDetails[]>;
}
export function MedicineSearch({
  pharmacyId,
  onMedicineSelect,
  searchMedicinesByName,
}: MedicineSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<PharmacyMedicineWithDetails[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    const search = async () => {
      if (searchTerm.trim().length < 2) {
        // setResults([]);
        setShowDropdown(false);
        return;
      }

      setIsSearching(true);
      const medicines = await searchMedicinesByName(searchTerm, pharmacyId);
      console.log(medicines?.length, "medicines");
      setResults(medicines);

      setShowDropdown(medicines?.length > 0);

      setIsSearching(false);
    };

    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, pharmacyId, searchMedicinesByName]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (medicine: PharmacyMedicineWithDetails) => {
    onMedicineSelect(medicine);
    setSearchTerm("");
    setShowDropdown(false);
    setResults([]);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Label htmlFor="medicine-search" className="text-xs sm:text-sm mb-1">Medicine Name</Label>
      <div className="relative mt-1">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
        <Input
          id="medicine-search"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search medicine..."
          className="pl-8 sm:pl-9 h-9 text-sm"
        />
      </div>

      {isSearching && (
        <p className="text-xs text-muted-foreground mt-1">Searching...</p>
      )}

      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-purple-200 rounded-md shadow-lg max-h-64 sm:max-h-80 overflow-y-auto">
          {results.map((medicine) => (
            <button
              key={medicine.id}
              onClick={() => handleSelect(medicine)}
              className="w-full text-left px-3 py-2 sm:py-2.5 hover:bg-purple-50 border-b last:border-b-0 transition-colors"
            >
              <div className="font-medium text-sm">{medicine.name}</div>
              {medicine.generic_name && (
                <div className="text-xs text-gray-600 mt-0.5">
                  {medicine.generic_name}
                </div>
              )}
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">
                  {medicine.strength || "N/A"}
                </span>
                <span
                  className={`text-xs font-medium ${
                    medicine.stock_quantity > 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  Stock: {medicine.stock_quantity}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {searchTerm.length >= 2 && !isSearching && results.length === 0 && (
        <p className="text-xs text-muted-foreground mt-1">
          No medicines found
        </p>
      )}
    </div>
  );
}

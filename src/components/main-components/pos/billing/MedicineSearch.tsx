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
// fix the search not working properly, it only fetches one medicine don't know why
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
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Search Medicine</h3>
      <div className="relative" ref={dropdownRef}>
        <Label htmlFor="medicine-search">Medicine Name</Label>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="medicine-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, generic name, or category..."
            className="pl-9"
          />
        </div>

        {isSearching && (
          <p className="text-xs text-muted-foreground mt-2">Searching...</p>
        )}

        {showDropdown && results.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-80 overflow-y-auto">
            {results.map((medicine) => (
              <button
                key={medicine.id}
                onClick={() => handleSelect(medicine)}
                className="w-full text-left px-4 py-3 hover:bg-gray-100 border-b last:border-b-0 transition-colors"
              >
                <div className="font-medium">{medicine.name}</div>
                {medicine.generic_name && (
                  <div className="text-sm text-gray-600">
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
          <p className="text-sm text-muted-foreground mt-2">
            No medicines found
          </p>
        )}
      </div>
    </Card>
  );
}

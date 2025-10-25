"use client";

import React, { useState, useMemo } from "react";
import { useMedicines } from "@/hooks/useMedicines";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, X, Search } from "lucide-react";

interface AddMedicineToGroupDialogProps {
  groupName: string;
  onClose: () => void;
  onMedicineAdded?: (medicineId: string, medicineName: string) => void;
  isNewGroup?: boolean;
}

export default function AddMedicineToGroupDialog({
  groupName,
  onClose,
  onMedicineAdded,
  isNewGroup = false,
}: AddMedicineToGroupDialogProps) {
  const { medicines } = useMedicines();
  const [medicineSearchTerm, setMedicineSearchTerm] = useState("");
  const [selectedMedicines, setSelectedMedicines] = useState<
    Array<{ id: string; name: string }>
  >([]);

  // Filter medicines for adding to group
  const availableMedicines = useMemo(() => {
    if (!medicineSearchTerm) return [];
    return medicines.filter(
      (med) =>
        (med.name.toLowerCase().includes(medicineSearchTerm.toLowerCase()) ||
          med.id.toLowerCase().includes(medicineSearchTerm.toLowerCase())) &&
        med.medicine_group !== groupName &&
        !selectedMedicines.some((selected) => selected.id === med.id)
    );
  }, [medicines, medicineSearchTerm, groupName, selectedMedicines]);

  // mark
  const handleAddMedicine = (medicineId: string, medicineName: string) => {
    if (isNewGroup) {
      // For new groups, allow multiple selections
      setSelectedMedicines((prev) => [...prev, { id: medicineId, name: medicineName }]);
      setMedicineSearchTerm("");
    } else {
      // For existing groups, add immediately
      if (onMedicineAdded) {
        onMedicineAdded(medicineId, medicineName);
      }
      onClose();
    }
  };

  const handleRemoveSelected = (medicineId: string) => {
    setSelectedMedicines((prev) => prev.filter((med) => med.id !== medicineId));
  };

  const handleFinish = () => {
    if (isNewGroup && selectedMedicines.length > 0 && onMedicineAdded) {
      // Call onMedicineAdded for each selected medicine
      selectedMedicines.forEach((med) => {
        onMedicineAdded(med.id, med.name);
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 bg-opacity-50 flex items-center justify-center z-50">
      <Card className="bg-white p-6 rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Add Medicine</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Medicine
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Enter Medicine Name or Medicine ID"
                value={medicineSearchTerm}
                onChange={(e) => setMedicineSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {/* Search Results */}
            {medicineSearchTerm && availableMedicines.length > 0 && (
              <div className="mt-2 border rounded-md max-h-48 overflow-y-auto">
                {availableMedicines.slice(0, 5).map((med) => (
                  <button
                    key={med.id}
                    onClick={() => handleAddMedicine(med.id, med.name)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b last:border-b-0"
                  >
                    <div className="font-medium">{med.name}</div>
                    <div className="text-xs text-gray-500">{med.id}</div>
                  </button>
                ))}
              </div>
            )}
            {medicineSearchTerm && availableMedicines.length === 0 && (
              <div className="mt-2 text-sm text-gray-500 text-center py-2">
                No medicines found
              </div>
            )}
          </div>
          {/* Selected Medicines (for new groups) */}
          {isNewGroup && selectedMedicines.length > 0 && (
            <div className="border rounded-md p-3 space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Selected Medicines ({selectedMedicines.length})
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {selectedMedicines.map((med) => (
                  <div
                    key={med.id}
                    className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded text-sm"
                  >
                    <span>{med.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSelected(med.id)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isNewGroup ? (
            <div className="flex gap-2">
              <Button
                onClick={handleFinish}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                disabled={selectedMedicines.length === 0}
              >
                Finish & Create Group
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1"
              >
                Skip
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => {
                if (medicineSearchTerm.trim()) {
                  alert(`Would add medicine to ${groupName}`);
                  onClose();
                }
              }}
              className="w-full bg-red-500 hover:bg-red-600 text-white"
              disabled={!medicineSearchTerm.trim()}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Medicine to Group
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

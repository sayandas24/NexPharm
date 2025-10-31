"use client";

import React, { useState, useMemo } from "react";
import { useMedicines } from "@/hooks/useMedicines";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Plus, ArrowRight, Package, Pill } from "lucide-react";
import { MedicinesTable } from "@/types/database-types";
import AddGroupDialog from "./AddGroupDialog";
import AddMedicineToGroupDialog from "./AddMedicineToGroupDialog";
import useMedicineCRUD from "@/hooks/useMedicineCRUD";

interface MedicineGroupsListProps {
  onSelectGroup: (groupName: string) => void;
}

export default function MedicineGroupsList({
  onSelectGroup,
}: MedicineGroupsListProps) {
  const { medicines, loading } = useMedicines();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddGroupDialog, setShowAddGroupDialog] = useState(false);
  const [showAddMedicineDialog, setShowAddMedicineDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const { updateMedicineGroup } = useMedicineCRUD();

  // Extract unique groups from medicines
  const medicineGroups = useMemo(() => {
    const groupMap = new Map<string, MedicinesTable[]>();

    medicines.forEach((medicine) => {
      if (medicine.medicine_group) {
        const groupName = medicine.medicine_group;
        if (!groupMap.has(groupName)) {
          groupMap.set(groupName, []);
        }
        groupMap.get(groupName)?.push(medicine);
      }
    });

    return Array.from(groupMap.entries()).map(([name, meds]) => ({
      name,
      medicines: meds,
    }));
  }, [medicines]);

  // Filter groups based on search
  const filteredGroups = useMemo(() => {
    if (!searchTerm) return medicineGroups;
    return medicineGroups.filter((group) =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [medicineGroups, searchTerm]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-red-200 border-t-red-500 rounded-full animate-spin"></div>
          <Package className="w-6 h-6 text-red-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-gray-600 font-medium">Loading medicine groups...</p>
      </div>
    );
  }

  const handleAddNewGroup = async (
    medicineId: string,
    medicineName: string,
    groupName: string
  ) => {
    await updateMedicineGroup(medicineId, groupName);
  };

  const totalMedicines = medicineGroups.reduce(
    (sum, group) => sum + group.medicines.length,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-lg">
                  <Package className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Medicine Groups
                  </h1>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-700">
                      {medicineGroups.length.toString().padStart(2, "0")} Groups
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                      <Pill className="w-3 h-3 mr-1" />
                      {totalMedicines} Medicines
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 ml-14">
                Organize and manage your medicine inventory by groups
              </p>
            </div>
            <Button
              onClick={() => setShowAddGroupDialog(true)}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-red-500/40 hover:scale-105"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Group
            </Button>
          </div>
        </div>

        {/* Search Section */}
        <Card className="border border-gray-200 shadow-sm p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search medicine groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 pr-4 h-11 border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            )}
          </div>
        </Card>

        {/* Groups Table */}
        <Card className="border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left font-semibold text-gray-900 py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-500" />
                      Group Name
                    </div>
                  </th>
                  <th className="text-left font-semibold text-gray-900 py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Pill className="w-4 h-4 text-gray-500" />
                      Medicines Count
                    </div>
                  </th>
                  <th className="text-right font-semibold text-gray-900 py-4 px-6">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredGroups.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="text-center py-12 text-gray-500 px-6"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-gray-100 rounded-full">
                          <Package className="w-8 h-8 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">
                            {searchTerm
                              ? "No matching groups found"
                              : "No medicine groups yet"}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {searchTerm
                              ? "Try adjusting your search"
                              : "Create your first group to get started"}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredGroups.map((group, index) => (
                    <tr
                      key={group.name}
                      className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                      style={{
                        animation: `fadeIn 0.3s ease-in-out ${index * 0.05}s both`,
                      }}
                    >
                      <td className="font-medium text-gray-900 py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
                            <Package className="w-5 h-5 text-red-600" />
                          </div>
                          {group.name}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-50 text-blue-700">
                          {group.medicines.length.toString().padStart(2, "0")}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Button
                          variant="ghost"
                          onClick={() => onSelectGroup(group.name)}
                          className="text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                        >
                          View Details
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Add Group Dialog */}
      {showAddGroupDialog && (
        <AddGroupDialog
          onClose={() => setShowAddGroupDialog(false)}
          onGroupCreated={(groupName) => {
            setNewGroupName(groupName);
            setShowAddGroupDialog(false);
            setShowAddMedicineDialog(true);
          }}
        />
      )}

      {/* Add Medicine Dialog (after creating group) */}
      {showAddMedicineDialog && newGroupName && (
        <AddMedicineToGroupDialog
          groupName={newGroupName}
          isNewGroup={true}
          onClose={() => {
            setShowAddMedicineDialog(false);
            setNewGroupName("");
          }}
          onMedicineAdded={(medicineId, medicineName) =>
            handleAddNewGroup(medicineId, medicineName, newGroupName)
          }
        />
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
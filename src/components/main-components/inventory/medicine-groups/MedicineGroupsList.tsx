"use client";

import React, { useState, useMemo } from "react";
import { useMedicines } from "@/hooks/useMedicines";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Plus, ArrowRight } from "lucide-react";
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

  const {updateMedicineGroup} = useMedicineCRUD()

  // Extract unique groups from medicines
  const medicineGroups = useMemo(() => {
    const groupMap = new Map<string, MedicinesTable[]>();

    medicines.forEach((medicine) => {
      const groupName = medicine.medicine_group || "Uncategorized";
      if (!groupMap.has(groupName)) {
        groupMap.set(groupName, []);
      }
      groupMap.get(groupName)?.push(medicine);
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
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading medicine groups...</p>
      </div>
    );
  }

  const handleAddNewGroup = async(
    medicineId: string,
    medicineName: string,
    groupName: string
  ) => { 

    // there can be multiple medicines, so add a loop here
    await updateMedicineGroup(medicineId, groupName);
    
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Medicine Groups ({medicineGroups.length.toString().padStart(2, "0")}
            )
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            List of medicines groups.
          </p>
        </div>
        <Button
          onClick={() => setShowAddGroupDialog(true)}
          className="bg-red-500 hover:bg-red-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Group
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search Medicine Groups.."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Groups Table */}
      <Card className="border-2 border-blue-500">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold text-gray-900">
                Group Name ⇅
              </TableHead>
              <TableHead className="font-semibold text-gray-900">
                No of Medicines ⇅
              </TableHead>
              <TableHead className="font-semibold text-gray-900">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGroups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-gray-500">
                  No medicine groups found
                </TableCell>
              </TableRow>
            ) : (
              filteredGroups.map((group) => (
                <TableRow key={group.name}>
                  <TableCell className="font-medium">{group.name}</TableCell>
                  <TableCell>
                    {group.medicines.length.toString().padStart(2, "0")}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      onClick={() => onSelectGroup(group.name)}
                      className="text-gray-700 hover:text-gray-900"
                    >
                      View Full Detail
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

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
    </div>
  );
}

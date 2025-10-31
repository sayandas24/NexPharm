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
import { Search, Plus, Trash2 } from "lucide-react";
import AddMedicineToGroupDialog from "./AddMedicineToGroupDialog";
import useMedicineCRUD from "@/hooks/useMedicineCRUD";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface MedicineGroupDetailProps {
  groupName: string;
  onBack: () => void;
}

export default function MedicineGroupDetail({
  groupName,
  onBack,
}: MedicineGroupDetailProps) {
  const { medicines } = useMedicines();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddMedicineDialog, setShowAddMedicineDialog] = useState(false);

  const { updateMedicineGroup } = useMedicineCRUD();

  // Get medicines in this group
  const groupMedicines = useMemo(() => {
    return medicines.filter((med) => med.medicine_group === groupName);
  }, [medicines, groupName]);

  // Filter medicines based on search
  const filteredMedicines = useMemo(() => {
    if (!searchTerm) return groupMedicines;
    return groupMedicines.filter((med) =>
      med.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [groupMedicines, searchTerm]);

  const handleAddMedicineToGroup = async (
    medicineId: string,
    medicineName: string,
    groupName: string
  ) => {
    await updateMedicineGroup(medicineId, groupName);
  };

  const handleRemoveFromGroup = async (medicineId: string) => {
    // there can be multiple medicines, so add a loop here
    await updateMedicineGroup(medicineId, "");
  };

  const handleDeleteGroup = async (medicinesId: any) => {
    // console.log("medicineId", medicineId);

    for (const medicineId of medicinesId) {
      await updateMedicineGroup(medicineId, "");
    }

    onBack();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header with breadcrumb */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <span>Inventory</span>
            <span className="mx-2">›</span>
            <button onClick={onBack} className="hover:text-gray-700">
              Medicine Groups
            </button>
            <span className="mx-2">›</span>
            <span className="text-gray-900 font-semibold">
              {groupName} ({groupMedicines.length.toString().padStart(2, "0")})
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Detailed view of a medicine group.
          </p>
        </div>
        <Button
          onClick={() => setShowAddMedicineDialog(true)}
          className="bg-red-500 hover:bg-red-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Medicine
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search for Medicine"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Medicines Table */}
      {/* Medicines Table */}
      <Card className="border border-zinc-200 shadow-sm overflow-hidden px-2">
        <Table className="">
          <TableHeader>
            <TableRow className="">
              <TableHead className="font-semibold text-gray-900 py-4">
                Medicine Name ⇅
              </TableHead>
              <TableHead className="font-semibold text-gray-900 py-4">
                Medicine Category ⇅
              </TableHead>
              <TableHead className="font-semibold text-gray-900 py-4">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMedicines.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={3}
                  className="text-center text-gray-500 py-12"
                >
                  No medicines in this group
                </TableCell>
              </TableRow>
            ) : (
              filteredMedicines.map((medicine) => (
                <TableRow
                  key={medicine.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <TableCell className="font-medium text-gray-900 py-4">
                    {medicine.name}
                  </TableCell>
                  <TableCell className="text-gray-600 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      {medicine?.category}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 hover:text-red-700 hover:border-red-300 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove from Group
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Want to remove {medicine.name} from this group?
                          </AlertDialogTitle>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveFromGroup(medicine.id)}
                            className="bg-red-500 hover:bg-red-600 border-red-500"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Delete Group Button */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">Delete Group</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you absolutely sure you want to delete this group?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove the
              medicines from this group.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                handleDeleteGroup(filteredMedicines.map((med) => med.id))
              }
              className="bg-red-500 hover:bg-red-600 border-red-500"
            >
              <Trash2 />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Medicine Dialog */}
      {showAddMedicineDialog && (
        <AddMedicineToGroupDialog
          groupName={groupName}
          onClose={() => setShowAddMedicineDialog(false)}
          onMedicineAdded={(medicineId, medicineName) =>
            handleAddMedicineToGroup(medicineId, medicineName, groupName)
          }
        />
      )}
    </div>
  );
}

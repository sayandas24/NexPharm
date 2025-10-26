"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useSuppliers } from "@/hooks/useSupplier";

interface SupplierActionsMenuProps {
  supplierId: string;
  supplierName: string;
  pharmacyId: string;
}

export function SupplierActionsMenu({
  supplierId,
  supplierName,
  pharmacyId,
}: SupplierActionsMenuProps) {
  const router = useRouter();
  const { deleteSupplier } = useSuppliers(pharmacyId);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = () => {
    // Navigate to edit page or open edit modal
    // You can implement this based on your routing structure
    console.log("Edit supplier:", supplierId);
    // router.push(`/suppliers/${supplierId}/edit`);
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteSupplier(supplierId);
      setShowDeleteDialog(false);
      router.push("/suppliers");
    } catch (error) {
      console.error("Failed to delete supplier:", error);
      // You can add toast notification here
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="h-9 w-9">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Supplier
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive bg-red-50 hover:!bg-red-100 transition-colors duration-200"
          >
            <Trash2 className="mr-2 h-4 w-4" color="red" />
            Delete Supplier
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the supplier{" "}
              <span className="font-semibold">{supplierName}</span> and remove
              all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive  hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4" color="white" />

              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

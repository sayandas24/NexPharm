"use client";

import React, { useState } from "react";
import { useMedicines } from "@/hooks/useMedicines";
import { useKyselyDB } from "@/lib/powersync/PowersyncProvider";
import {
  Search,
  Plus,
  Filter,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import toast from "react-hot-toast";
import { AddMedicineForm } from "./AddMedicineForm";
import useAuth from "@/hooks/use-auth";

export default function MedicineListMain() {
  const { currentPharmacy } = useAuth();

  const { medicines, loading, searchMedicinesByName } = useMedicines(
    currentPharmacy?.id
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredMedicines, setFilteredMedicines] = useState(medicines);
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const itemsPerPage = 8;

  const handleSearch = async (value: string) => {
    setSearchTerm(value);
    if (value.trim()) {
      const results = await searchMedicinesByName(value, currentPharmacy?.id);
      setFilteredMedicines(results);
    } else {
      setFilteredMedicines(medicines);
    }
    setCurrentPage(1);
  };

  const displayMedicines = searchTerm ? filteredMedicines : medicines;

  // Apply both category and group filters
  const fullyFilteredMedicines = displayMedicines.filter((med) => {
    const categoryMatch =
      selectedCategory === "all" || med.category === selectedCategory;
    const groupMatch =
      selectedGroup === "all" || med.medicine_group === selectedGroup;
    return categoryMatch && groupMatch;
  });

  // Get unique categories
  const categories = Array.from(
    new Set(medicines.map((m) => m.category).filter(Boolean))
  );

  const groups = Array.from(
    new Set(medicines.map((m) => m.medicine_group).filter(Boolean))
  );

  // Pagination
  const totalPages = Math.ceil(fullyFilteredMedicines.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMedicines = fullyFilteredMedicines.slice(startIndex, endIndex);

  const handleMedicineAdded = () => {
    setIsDrawerOpen(false);
    toast.success("Medicine added successfully!");
  };

  const handleCatChange = (e: any) => {
    setSelectedCategory(e);
    setCurrentPage(1);
  };

  const handleGroupChange = (e: any) => {
    setSelectedGroup(e);
    setCurrentPage(1);
  };

  // Guard clause for no pharmacy
  if (!currentPharmacy) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No pharmacy selected</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading medicines...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <span className="font-semibold text-gray-700">Inventory</span>
          <ChevronRight className="h-4 w-4 mx-1" />
          <span>List of Medicines ({fullyFilteredMedicines.length})</span>
        </div>
        <p className="text-gray-600">List of medicines available for sales.</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1 w-full md:max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, category, group.."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <Select value={selectedCategory} onValueChange={handleCatChange}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="- Select Category -" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category || ""}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Filter className="h-4 w-4 text-gray-400" />
              <Select value={selectedGroup} onValueChange={handleGroupChange}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="- Select Group -" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Group</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g} value={g || ""}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
              <SheetTrigger asChild>
                <Button className="bg-red-500 hover:bg-red-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Item
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-full sm:max-w-2xl overflow-y-auto"
              >
                <SheetHeader>
                  <SheetTitle>Add New Medicine</SheetTitle>
                  <SheetDescription>
                    Fill in the details to add a new medicine to your inventory
                  </SheetDescription>
                </SheetHeader>
                <AddMedicineForm onSuccess={handleMedicineAdded} />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Medicines Table */}
      {paginatedMedicines.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No medicines found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || selectedCategory !== "all" || selectedGroup !== "all"
              ? "Try adjusting your search term or filters"
              : "Get started by adding your first medicine"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicine Name</TableHead>
                <TableHead>Medicine ID</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Stock in Qty</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedMedicines.map((medicine) => (
                <TableRow key={medicine.id}>
                  <TableCell className="font-medium">
                    {medicine.name}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {medicine.id.substring(0, 15)}
                  </TableCell>
                  <TableCell>
                    {medicine.category || "Generic Medicine"}
                  </TableCell>
                  <TableCell>
                    {medicine.medicine_group || "Generic Medicine"}
                  </TableCell>
                  <TableCell>
                    {medicine?.stock_quantity && medicine?.stock_quantity > 0 ? (
                      <Badge variant="outline">
                        {medicine.stock_quantity}
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Out of Stock</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="link"
                      className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal"
                    >
                      View Full Detail »
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} -{" "}
              {Math.min(endIndex, fullyFilteredMedicines.length)} results of{" "}
              {fullyFilteredMedicines.length}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-600">Page</span>
                <Select
                  value={currentPage.toString()}
                  onValueChange={(value) => setCurrentPage(parseInt(value))}
                >
                  <SelectTrigger className="w-16 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <SelectItem key={page} value={page.toString()}>
                          {page}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600">of {totalPages}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
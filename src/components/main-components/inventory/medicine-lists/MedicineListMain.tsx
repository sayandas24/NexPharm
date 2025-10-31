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
  Package,
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
import { Card } from "@/components/ui/card";
import toast from "react-hot-toast";
import { AddMedicineForm } from "./AddMedicineForm";
import useAuth from "@/hooks/use-auth";
import Link from "next/link";

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
      <div className="p-6 flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="p-12 text-center max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Pharmacy Selected
          </h3>
          <p className="text-gray-600">
            Please select a pharmacy to view medicines
          </p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="p-12 text-center max-w-md">
          <div className="animate-spin h-12 w-12 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading medicines...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Medicine Inventory
              </h1>
              <p className="text-gray-600 text-sm">
                List of medicines available for sales
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filter Card */}
        <Card className="p-5 shadow-sm border border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search Bar */}
            <div className="flex-1 w-full lg:max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, category, or group..."
                  className="pl-10 bg-white border-gray-300 focus:border-red-500 focus:ring-red-500"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Filters and Add Button */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select value={selectedCategory} onValueChange={handleCatChange}>
                  <SelectTrigger className="w-[180px] bg-white border-gray-300">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category || ""}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Select value={selectedGroup} onValueChange={handleGroupChange}>
                <SelectTrigger className="w-[180px] bg-white border-gray-300">
                  <SelectValue placeholder="All Groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g} value={g || ""}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <SheetTrigger asChild>
                  <Button className="bg-red-500 hover:bg-red-600 shadow-sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Medicine
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-full sm:max-w-2xl overflow-y-auto"
                >
                  <SheetHeader>
                    <SheetTitle>Add New Medicine</SheetTitle>
                    <SheetDescription>
                      Fill in the details to add a new medicine to your
                      inventory
                    </SheetDescription>
                  </SheetHeader>
                  <AddMedicineForm
                    onSuccess={handleMedicineAdded}
                    pharmacy={currentPharmacy}
                  />
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </Card>

        {/* Medicines Table or Empty State */}
        {paginatedMedicines.length === 0 ? (
          <Card className="p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No medicines found
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchTerm ||
              selectedCategory !== "all" ||
              selectedGroup !== "all"
                ? "Try adjusting your search term or filters to find what you're looking for"
                : "Get started by adding your first medicine to the inventory"}
            </p>
            {!searchTerm &&
              selectedCategory === "all" &&
              selectedGroup === "all" && (
                <Button
                  onClick={() => setIsDrawerOpen(true)}
                  className="bg-red-500 hover:bg-red-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Medicine
                </Button>
              )}
          </Card>
        ) : (
          <Card className="shadow-sm border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50 border-b border-gray-200">
                  <TableHead className="font-semibold text-gray-900 py-4 pl-4">
                    Medicine Name
                  </TableHead>
                  <TableHead className="font-semibold text-gray-900 py-4">
                    Medicine ID
                  </TableHead>
                  <TableHead className="font-semibold text-gray-900 py-4">
                    Category
                  </TableHead>
                  <TableHead className="font-semibold text-gray-900 py-4">
                    Group
                  </TableHead>
                  <TableHead className="font-semibold text-gray-900 py-4">
                    Stock
                  </TableHead>
                  <TableHead className="font-semibold text-gray-900 py-4">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMedicines.map((medicine: any) => (
                  <TableRow
                    key={medicine.id}
                    className="hover:bg-gray-50/50 transition-colors border-b border-gray-100"
                  >
                    <TableCell className="font-semibold text-gray-900 py-4 pl-4">
                      {medicine.name}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-gray-600 py-4">
                      {medicine.id.substring(0, 15)}...
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {medicine.category || "Generic Medicine"}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                        {medicine.medicine_group || "Generic Medicine"}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      {medicine?.stock_quantity &&
                      medicine?.stock_quantity > 0 ? (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200 font-semibold"
                        >
                          {medicine.stock_quantity} units
                        </Badge>
                      ) : (
                        <Badge
                          variant="destructive"
                          className="bg-red-50 text-red-700 border-red-200 font-semibold"
                        >
                          Out of Stock
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      <Link href={`/inventory/med-list/${medicine.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 font-medium"
                        >
                          View Details →
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600 font-medium">
                Showing {startIndex + 1} to{" "}
                {Math.min(endIndex, fullyFilteredMedicines.length)} of{" "}
                {fullyFilteredMedicines.length} results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="border-gray-300 hover:bg-gray-100"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md">
                  <span className="text-sm text-gray-600">Page</span>
                  <Select
                    value={currentPage.toString()}
                    onValueChange={(value) => setCurrentPage(parseInt(value))}
                  >
                    <SelectTrigger className="w-16 h-7 border-0 bg-transparent">
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
                  className="border-gray-300 hover:bg-gray-100"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
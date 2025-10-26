"use client";
import useAuth from "@/hooks/use-auth";
import { useMedicines } from "@/hooks/useMedicines";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Package,
  Calendar,
  IndianRupee,
  Percent,
  AlertCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSuppliers } from "@/hooks/useSupplier";
import { SupplierActionsMenu } from "./SupplierActionsMenu";

interface Supplier {
  id: string;
  name: string;
  pharmacy_id: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  gst_number: string;
}

interface Batch {
  id: string;
  medicine_id: string;
  pharmacy_id: string;
  supplier_id: string;
  batch_number: string;
  manufacture_date: string;
  expiry_date: string;
  quantity: number;
  available_quantity: number;
  purchase_price: number;
  selling_price: number;
  mrp: number;
  gst_percentage: number;
  created_at: string;
  updated_at: string;
}

export default function SupplierDetails() {
  const params = useParams();
  const router = useRouter();
  const { getBatchesByPharmacy } = useMedicines();
  const { currentPharmacy } = useAuth();

  const pharmacyId = currentPharmacy?.id;
  const supplierId = params.supplierId as string;

  const { getSupplierById } = useSuppliers(pharmacyId);

  const [batches, setBatches] = useState<any[]>([]);
  const [supplier, setSupplier] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pharmacyId && supplierId) {
      const fetchData = async () => {
        try {
          setLoading(true);

          const allBatches = await getBatchesByPharmacy(pharmacyId);
          const supplierBatches = allBatches.filter(
            (batch: any) => batch.supplier_id === supplierId
          );

          setBatches(supplierBatches);

          const foundSupplier = await getSupplierById(supplierId);
          setSupplier(foundSupplier || []);
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [getBatchesByPharmacy, pharmacyId, supplierId, getSupplierById]);

  const getExpiryStatus = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry < 0) return { status: "expired", color: "destructive" };
    if (daysUntilExpiry <= 30)
      return { status: "expiring-soon", color: "warning" };
    return { status: "valid", color: "success" };
  };

  const totalInventoryValue = batches.reduce(
    (sum, batch) => sum + batch.available_quantity * batch.purchase_price,
    0
  );

  const totalItems = batches.reduce(
    (sum, batch) => sum + batch.available_quantity,
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading supplier details...</p>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Supplier not found. Please check the supplier ID and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Supplier Details
            </h1>
            <p className="text-muted-foreground">
              View supplier information and manage inventory batches
            </p>
          </div>
        </div>
        {supplier && pharmacyId && (
          <SupplierActionsMenu
            supplierId={supplierId}
            supplierName={supplier.name}
            pharmacyId={pharmacyId}
          />
        )}
      </div>

      {/* Supplier Information Card */}
      {supplier && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {supplier?.name}
            </CardTitle>
            <CardDescription>
              Supplier ID: {supplier?.id?.slice(0, 10)}...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Contact Person
                  </p>
                  <p className="text-base font-semibold">
                    {supplier.contact_person}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Phone
                  </p>
                  <p className="text-base font-semibold">{supplier.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Email
                  </p>
                  <p className="text-base font-semibold break-all">
                    {supplier.email}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    GST Number
                  </p>
                  <p className="text-base font-semibold">
                    {supplier.gst_number}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 md:col-span-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Address
                  </p>
                  <p className="text-base font-semibold">{supplier.address}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Batches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{batches.length}</div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Items in Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{totalItems}</div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inventory Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">
                ₹{totalInventoryValue.toFixed(2)}
              </div>
              <IndianRupee className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Batches Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory Batches
          </CardTitle>
          <CardDescription>
            All batches supplied by {supplier.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {batches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No batches found</h3>
              <p className="text-muted-foreground max-w-sm">
                There are no inventory batches from this supplier yet.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch Number</TableHead>
                    <TableHead>Medicine ID</TableHead>
                    <TableHead>Manufacture Date</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead className="text-right">Purchase Price</TableHead>
                    <TableHead className="text-right">Selling Price</TableHead>
                    <TableHead className="text-right">MRP</TableHead>
                    <TableHead className="text-center">GST %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((batch) => {
                    const expiryStatus = getExpiryStatus(batch.expiry_date);
                    return (
                      <TableRow key={batch.id}>
                        <TableCell className="font-medium">
                          {batch.batch_number}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {batch.medicine_id.substring(0, 12)}...
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {new Date(
                              batch.manufacture_date
                            ).toLocaleDateString("en-IN")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              {new Date(batch.expiry_date).toLocaleDateString(
                                "en-IN"
                              )}
                            </div>
                            {expiryStatus.status === "expired" && (
                              <Badge variant="destructive" className="text-xs">
                                Expired
                              </Badge>
                            )}
                            {expiryStatus.status === "expiring-soon" && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-orange-100 text-orange-800"
                              >
                                Expiring Soon
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {batch.available_quantity}
                            </span>
                            <span className="text-muted-foreground">
                              / {batch.quantity}
                            </span>
                            {batch.available_quantity <
                              batch.quantity * 0.2 && (
                              <TrendingDown className="h-4 w-4 text-orange-600" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{batch.purchase_price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{batch.selling_price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{batch.mrp.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="font-mono">
                            {batch.gst_percentage}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

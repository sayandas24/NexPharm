"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CustomerData } from "@/hooks/usePOS";
import { CircleX, CrossIcon } from "lucide-react";

interface CustomerFormProps {
  onCustomerSelect: (customer: CustomerData) => void;
  pharmacyId: string;
  searchCustomerByPhoneOrName: (params: {
    name?: string;
    phone?: string;
    pharmacyId: string;
  }) => Promise<any[]>;
  createCustomer: (data: any) => Promise<string>;
}

export function CustomerForm({
  onCustomerSelect,
  pharmacyId,
  searchCustomerByPhoneOrName,
  createCustomer,
}: CustomerFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Auto-search when name or phone changes
  useEffect(() => {
    const searchCustomer = async () => {
      if (name?.length >= 2 || phone?.length >= 2) {
        setIsSearching(true);
        setShowResults(true);

        try {
          const customers = await searchCustomerByPhoneOrName({
            name: name?.length >= 2 ? name : undefined,
            phone: phone?.length >= 2 ? phone : undefined,
            pharmacyId: pharmacyId,
          });

          setSearchResults(customers || []);
        } catch (err) {
          console.error("Search error:", err);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    };

    const timer = setTimeout(searchCustomer, 500);

    return () => clearTimeout(timer);
  }, [phone, name, pharmacyId, searchCustomerByPhoneOrName]);

  // Handle customer selection from search results
  const handleSelectCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setName(customer.name);
    setPhone(customer.phone || "");
    setEmail(customer.email || "");
    setDateOfBirth(customer.date_of_birth || "");
    setShowResults(false);
    setSearchResults([]);
  };

  // Clear selection when user manually changes name or phone
  useEffect(() => {
    if (selectedCustomer) {
      if (name !== selectedCustomer.name || phone !== selectedCustomer.phone) {
        setSelectedCustomer(null);
      }
    }
  }, [name, phone, selectedCustomer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Customer name is required");
      return;
    }

    try {
      let customerId = selectedCustomer?.id;

      if (!selectedCustomer) {
        // Create new customer
        customerId = await createCustomer({
          pharmacy_id: pharmacyId,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || null,
          date_of_birth: dateOfBirth || null,
        });
      }

      onCustomerSelect({
        id: customerId,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        date_of_birth: dateOfBirth,
      });

      // Reset form
      setName("");
      setPhone("");
      setEmail("");
      setDateOfBirth("");
      setSelectedCustomer(null);
    } catch (err) {
      setError("Failed to save customer");
    }
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Customer Details</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Label className="mb-2" htmlFor="name">
            Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter customer name"
            required
          />
        </div>

        <div className="relative">
          <Label className="mb-2" htmlFor="phone">
            Phone Number
          </Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter phone number"
          />

          {selectedCustomer && (
            <div className="mt-1 p-2 bg-green-50 border border-green-200 rounded">
              <p className="text-xs text-green-700 font-medium">
                ✓ Existing customer selected
              </p>
            </div>
          )}

          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && !selectedCustomer && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-green-300 rounded-md shadow-lg max-h-60 overflow-y-auto min-h-[10rem] py-4 ">
              <div className="justify-between items-center flex px-2 mb-2">
                <div className="text-green-400 text-xs">
                  Existing Customers found
                </div>
                <CircleX
                  size={16}
                  onClick={() => setShowResults(false)}
                  className="text-red-400 hover:text-red-500 cursor-pointer"
                />
              </div>
              {searchResults.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => handleSelectCustomer(customer)}
                  className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <p className="text-sm font-medium text-gray-900">
                    {customer.name}
                  </p>
                  {customer.phone && (
                    <p className="text-xs text-gray-600">{customer.phone}</p>
                  )}
                  {customer.email && (
                    <p className="text-xs text-gray-500">{customer.email}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {showResults &&
            searchResults.length === 0 &&
            !isSearching &&
            (name?.length >= 2 || phone?.length >= 2) && (
              <p className="text-xs text-gray-500 mt-1">No customers found</p>
            )}
        </div>

        <div>
          <Label className="mb-2" htmlFor="email">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email (optional)"
          />
        </div>

        <div>
          <Label className="mb-2" htmlFor="dob">
            Date of Birth
          </Label>
          <Input
            id="dob"
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button
          type="submit"
          className="w-full bg-purple-800 hover:bg-purple-900 text-white font-medium !py-4 px-4 rounded-md"
        >
          {selectedCustomer ? "Use Customer" : "Add Customer"}
        </Button>
      </form>
    </Card>
  );
}

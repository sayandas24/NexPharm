// app/(auth)/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFormik } from "formik";
import * as Yup from "yup";
import useAuth from "@/hooks/use-auth";
import {
  Building2,
  Mail,
  Shield,
  User,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Step = "pharmacy" | "details";

export default function RegisterPage() {
  const [step, setStep] = useState<Step>("pharmacy");
  const [pharmacyInfo, setPharmacyInfo] = useState<any>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const { verifyPharmacyId, signUpWithPharmacy } = useAuth();

  // ============ Step 1: Pharmacy ID Validation ============
  const pharmacyFormik = useFormik({
    initialValues: {
      pharmacyId: "",
    },
    validationSchema: Yup.object({
      pharmacyId: Yup.string()
        .required("Pharmacy ID is required")
        .min(3, "Invalid Pharmacy ID"),
    }),
    onSubmit: async (values) => {
      setError("");
      setIsLoading(true);

      try {
        const pharmacy = await verifyPharmacyId(values.pharmacyId);

        if (!pharmacy) {
          setError("Invalid Pharmacy ID. Please check and try again.");
          return;
        }

        setPharmacyInfo(pharmacy);
        setStep("details");
        console.log("✅ Pharmacy verified:", pharmacy.name);
      } catch (err: any) {
        setError(err.message || "Failed to verify pharmacy");
      } finally {
        setIsLoading(false);
      }
    },
  });

  // ============ Step 2: User Details & Registration ============
  const detailsFormik = useFormik({
    initialValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "cashier" as "admin" | "pharmacist" | "cashier",
    },
    validationSchema: Yup.object({
      fullName: Yup.string()
        .required("Full name is required")
        .min(2, "Name must be at least 2 characters"),
      email: Yup.string()
        .email("Invalid email address")
        .required("Email is required"),
      password: Yup.string()
        .required("Password is required")
        .min(6, "Password must be at least 6 characters"),
      confirmPassword: Yup.string()
        .required("Please confirm your password")
        .oneOf([Yup.ref("password")], "Passwords must match"),
      role: Yup.string()
        .oneOf(["admin", "pharmacist", "cashier"])
        .required("Role is required"),
    }),
    onSubmit: async (values) => {
      setError("");
      setIsLoading(true);

      try {
        await signUpWithPharmacy(
          values.email,
          values.password,
          values.fullName,
          pharmacyFormik.values.pharmacyId,
          values.role
        );

        console.log("✅ Registration successful!");
        router.push("/dashboard");
      } catch (err: any) {
        setError(err.message || "Registration failed");
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-4">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === "pharmacy"
                  ? "bg-blue-600 text-white"
                  : "bg-green-500 text-white"
              }`}
            >
              {step === "pharmacy" ? "1" : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div
              className={`h-1 w-16 ${
                step === "pharmacy" ? "bg-gray-300" : "bg-green-500"
              }`}
            />
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === "details"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-300 text-gray-600"
              }`}
            >
              2
            </div>
          </div>

          {/* Title */}
          <CardTitle className="text-2xl font-bold text-center">
            {step === "pharmacy" && "Verify Pharmacy"}
            {step === "details" && "Create Account"}
          </CardTitle>

          {/* Subtitle */}
          <p className="text-center text-sm text-gray-600">
            {step === "pharmacy" && "Enter your pharmacy ID to begin"}
            {step === "details" &&
              `Joining: ${pharmacyInfo?.name || "Pharmacy"}`}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* ============ Step 1: Pharmacy ID ============ */}
          {step === "pharmacy" && (
            <form onSubmit={pharmacyFormik.handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pharmacyId" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Pharmacy ID
                </Label>
                <Input
                  id="pharmacyId"
                  type="text"
                  placeholder="e.g., abc-123-xyz"
                  className="font-mono"
                  {...pharmacyFormik.getFieldProps("pharmacyId")}
                />
                {pharmacyFormik.touched.pharmacyId &&
                  pharmacyFormik.errors.pharmacyId && (
                    <p className="text-sm text-red-500">
                      {pharmacyFormik.errors.pharmacyId}
                    </p>
                  )}
                <p className="text-xs text-gray-500">
                  Get this from your pharmacy administrator
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !pharmacyFormik.isValid}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify Pharmacy
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Login here
                </Link>
              </p>
            </form>
          )}

          {/* ============ Step 2: User Details ============ */}
          {step === "details" && (
            <form onSubmit={detailsFormik.handleSubmit} className="space-y-4">
              {/* Pharmacy Info */}
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Building2 className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900">
                      {pharmacyInfo?.name}
                    </p>
                    <p className="text-xs text-green-700">
                      License: {pharmacyInfo?.license_number}
                    </p>
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  {...detailsFormik.getFieldProps("fullName")}
                />
                {detailsFormik.touched.fullName &&
                  detailsFormik.errors.fullName && (
                    <p className="text-sm text-red-500">
                      {detailsFormik.errors.fullName}
                    </p>
                  )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  {...detailsFormik.getFieldProps("email")}
                />
                {detailsFormik.touched.email && detailsFormik.errors.email && (
                  <p className="text-sm text-red-500">
                    {detailsFormik.errors.email}
                  </p>
                )}
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Your Role
                </Label>
                <Select
                  value={detailsFormik.values.role}
                  onValueChange={(value) =>
                    detailsFormik.setFieldValue("role", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cashier">💼 Cashier</SelectItem>
                    <SelectItem value="pharmacist">💊 Pharmacist</SelectItem>
                    <SelectItem value="admin">👑 Admin</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Choose the role that matches your responsibilities
                </p>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...detailsFormik.getFieldProps("password")}
                />
                {detailsFormik.touched.password &&
                  detailsFormik.errors.password && (
                    <p className="text-sm text-red-500">
                      {detailsFormik.errors.password}
                    </p>
                  )}
                <p className="text-xs text-gray-500">
                  Minimum 6 characters
                </p>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  {...detailsFormik.getFieldProps("confirmPassword")}
                />
                {detailsFormik.touched.confirmPassword &&
                  detailsFormik.errors.confirmPassword && (
                    <p className="text-sm text-red-500">
                      {detailsFormik.errors.confirmPassword}
                    </p>
                  )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStep("pharmacy");
                    setPharmacyInfo(null);
                    setError("");
                  }}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isLoading || !detailsFormik.isValid}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Create Account
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

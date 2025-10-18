// app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFormik } from "formik";
import * as Yup from "yup";
import useAuth from "@/hooks/use-auth";
import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const { signInWithPassword } = useAuth();

  // ============ Login Form ============
  const loginFormik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email("Invalid email address")
        .required("Email is required"),
      password: Yup.string()
        .required("Password is required")
        .min(6, "Password must be at least 6 characters"),
    }),
    onSubmit: async (values) => {
      setError("");
      setIsLoading(true);

      try {
        await signInWithPassword(values.email, values.password);
        console.log("✅ Login successful!");
        router.push("/dashboard");
      } catch (err: any) {
        setError(err.message || "Invalid email or password");
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-4">
          {/* Logo/Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <LogIn className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Title */}
          <CardTitle className="text-2xl font-bold text-center">
            Welcome Back
          </CardTitle>

          {/* Subtitle */}
          <p className="text-center text-sm text-gray-600">
            Sign in to your pharmacy account
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

          {/* Login Form */}
          <form onSubmit={loginFormik.handleSubmit} className="space-y-4">
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
                className="h-11"
                {...loginFormik.getFieldProps("email")}
              />
              {loginFormik.touched.email && loginFormik.errors.email && (
                <p className="text-sm text-red-500">
                  {loginFormik.errors.email}
                </p>
              )}
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
                className="h-11"
                {...loginFormik.getFieldProps("password")}
              />
              {loginFormik.touched.password && loginFormik.errors.password && (
                <p className="text-sm text-red-500">
                  {loginFormik.errors.password}
                </p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-blue-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full h-11"
              disabled={isLoading || !loginFormik.isValid}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">
                Don't have an account?
              </span>
            </div>
          </div>

          {/* Register Link */}
          <Link href="/register">
            <Button type="button" variant="outline" className="w-full h-11">
              Create New Account
            </Button>
          </Link>

          {/* Help Text */}
          <p className="text-center text-xs text-gray-500">
            Secure access to your pharmacy management system
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

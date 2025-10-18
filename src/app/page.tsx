"use client";
import useAuth from "@/hooks/use-auth";
import { usePowerSync } from "@/lib/powersync/PowersyncProvider";
import { useRouter } from "next/navigation";
import React from "react";

export default function HomePage() {
  const { currentUser, profile, logout } = useAuth();
  const router = useRouter();

  const fetchData = async () => {
    console.log(currentUser, "curren");
    console.log(profile, "profile");
  };

  const toLogin = () => {
    router.push("/login");
  };

  const toLogout = () => {
    router.push("/");
    logout()
  };

  return (
    <div className="p-10 bg-black min-h-screen">
      <button
        onClick={fetchData}
        className="text-white border border-zinc-700 bg-zinc-800 rounded-lg p-5 py-2"
      >
        Fetch Data
      </button>
      <button
        onClick={toLogin}
        className="text-white border ml-2 border-zinc-700 bg-zinc-800 rounded-lg p-5 py-2"
      >
        Login
      </button>
      <button                                                                   
        onClick={toLogout}
        className="text-white border ml-2 border-zinc-700 bg-zinc-800 rounded-lg p-5 py-2"
      >
        Logout
      </button>
    </div>
  );
}

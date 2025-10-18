"use client";
import useAuth from "@/hooks/use-auth";
import { usePowerSync } from "@/lib/powersync/PowersyncProvider";
import { useRouter } from "next/navigation";
import React from "react";

export default function HomePage() {
  const { currentUser, profile } = useAuth();
  const router = useRouter();

  const fetchData = async () => {
    console.log(currentUser, "curren");
    console.log(profile, "profile");
  };

  const toLogin = () => {
    router.push("/login");
  };

  return (
    <div className="p-10">
      <button
        onClick={fetchData}
        className="border border-zinc-700 bg-zinc-800 rounded-lg p-5 py-2"
      >
        Fetch Data
      </button>
      <button
        onClick={toLogin}
        className="border ml-2 border-zinc-700 bg-zinc-800 rounded-lg p-5 py-2"
      >
        Login
      </button>
    </div>
  );
}

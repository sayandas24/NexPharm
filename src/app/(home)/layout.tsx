"use client";

import { PowerSyncProvider, usePowerSyncStatus } from "@/lib/powersync/PowersyncProvider";
import { Toaster } from "react-hot-toast";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/shadcn-sidebar/app-sidebar";
import Header from "@/components/main-components/navigation/header/Header";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { error } = usePowerSyncStatus();
 
  // Show error state if PowerSync fails
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Connection Failed</h2>
        <p className="text-gray-600 mb-4 text-center max-w-md">
          {error.message}
        </p>
        <Button onClick={() => window.location.reload()}>
          Retry Connection
        </Button>
      </div>
    );
  }

  // Normal layout rendering
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div>
          <Header />
          {children}
        </div>
        <Toaster position="top-right" />
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PowerSyncProvider>
      <LayoutContent>{children}</LayoutContent>
    </PowerSyncProvider>
  );
}

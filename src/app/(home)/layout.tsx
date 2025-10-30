"use client";

import { PowerSyncProvider } from "@/lib/powersync/PowersyncProvider";
import { Toaster } from "react-hot-toast";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/shadcn-sidebar/app-sidebar";
import Header from "@/components/main-components/navigation/header/Header";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PowerSyncProvider>
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
    </PowerSyncProvider>
  );
}

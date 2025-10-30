"use client";

import * as React from "react";
import {
  Home,
  Package,
  ShoppingCart,
  BarChart3,
  Truck,
  ScanLine,
  Command,
  LifeBuoy,
  Send,
  Settings2,
} from "lucide-react";

import { NavMain } from "@/components/shadcn-sidebar/nav-main";
import { NavSecondary } from "@/components/shadcn-sidebar/nav-secondary";
import { NavUser } from "@/components/shadcn-sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { PharmacySwitcher } from "./PharmacySwitcher";
import ConnectionStatus from "../ConnectionStatus";

const data = {
  user: {
    name: "sayan",
    email: "sayan@pharmacy.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: Home,
      isActive: true,
      color: "blue-500",
    },
    {
      title: "Inventory",
      url: "/inventory",
      icon: Package,
      isActive: true,
      color: "green-500",
      items: [
        {
          title: "Medicine List",
          url: "/inventory/med-list",
        },
        {
          title: "Medicine Groups",
          url: "/inventory/med-groups",
        },
        {
          title: "Alerts",
          url: "/inventory/alerts",
        },
        {
          title: "Medicine Shortage",
          url: "/inventory/med-shortage",
        },
      ],
    },
    {
      title: "Point of Sale",
      url: "/pos",
      icon: ShoppingCart,
      isActive: true,
      color: "purple-500",
      items: [
        {
          title: "Billing",
          url: "/pos/billing",
        },
        {
          title: "Customers",
          url: "/pos/customers",
        },
      ],
    },
    {
      title: "Reports",
      url: "/reports",
      icon: BarChart3,
      isActive: true,
      color: "orange-500",
      items: [
        {
          title: "Sales Report",
          url: "/reports/sales",
        },
        {
          title: "Inventory Report",
          url: "/reports/inventory",
        },
      ],
    },
    {
      title: "Suppliers",
      url: "/suppliers",
      icon: Truck,
      color: "cyan-500",
    },
    {
      title: "Scan Medicine",
      url: "/scan",
      icon: ScanLine,
      color: "red-500",
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
    },
    {
      title: "Support",
      url: "/support",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "/feedback",
      icon: Send,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <PharmacySwitcher
                versions={["v1.0", "v1.1"]}
                defaultVersion="v1.0"
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <div className="mt-auto">
          <ConnectionStatus />
        </div>
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}

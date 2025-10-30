"use client";

import * as React from "react";
import { Check, ChevronsUpDown, GalleryVerticalEnd } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import useAuth from "@/hooks/use-auth";
import { Separator } from "../ui/separator";

export function PharmacySwitcher({
  versions,
  defaultVersion,
}: {
  versions: string[];
  defaultVersion: string;
}) {
  const [selectedVersion, setSelectedVersion] = React.useState(defaultVersion);

  const {
    currentPharmacy,
    currentRole,
    getUser,
    pharmacies,
    profile,
    switchPharmacy,
    currentUser,
  } = useAuth();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <GalleryVerticalEnd className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none truncate">
                <span className="font-medium">{currentPharmacy?.name}</span>
                <span className="text-[.6rem] text-zinc-500">{currentPharmacy?.address}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            // className="w-(--radix-dropdown-menu-trigger-width)"
            align="start"
          >
            {pharmacies.map((pharmacy) => (
              <DropdownMenuItem
                key={pharmacy?.pharmacy_id}
                onSelect={() => switchPharmacy(pharmacy?.pharmacy_id)}
              >
                <div className="flex flex-col  gap-2 truncate">
                  <p>{pharmacy?.pharmacies?.name}</p>
                  <span className="text-xs text-gray-500">{pharmacy?.pharmacies?.address}</span>
                </div>
                {currentPharmacy?.id === pharmacy?.id && <Check className="ml-auto" />}
                {/* <Separator/> */}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

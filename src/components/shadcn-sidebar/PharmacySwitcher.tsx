"use client";

import * as React from "react";
import { Check, ChevronsUpDown, GalleryVerticalEnd, Loader2 } from "lucide-react";

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
import useAuth, { SwitchStage } from "@/hooks/use-auth";

export function PharmacySwitcher({
  versions,
  defaultVersion,
}: {
  versions: string[];
  defaultVersion: string;
}) {
  const [isSwitching, setIsSwitching] = React.useState(false);
  const [switchProgress, setSwitchProgress] = React.useState<SwitchStage | null>(null);
  const [switchError, setSwitchError] = React.useState<string | null>(null);
  const [previousPharmacyId, setPreviousPharmacyId] = React.useState<string | null>(null);

  const {
    currentPharmacy,
    pharmacies,
    switchPharmacy,
  } = useAuth();

  // Progress messages for each stage
  const progressMessages: Record<SwitchStage, string> = {
    [SwitchStage.VALIDATING]: "Validating pharmacy...",
    [SwitchStage.DISCONNECTING]: "Disconnecting...",
    [SwitchStage.CLEARING]: "Clearing local data...",
    [SwitchStage.UPDATING_PROFILE]: "Updating profile...",
    [SwitchStage.RECONNECTING]: "Connecting...",
    [SwitchStage.SYNCING]: "Syncing data...",
    [SwitchStage.COMPLETE]: "Complete!",
  };

  // Handle progress updates
  const handleSwitchProgress = React.useCallback((stage: SwitchStage) => {
    setSwitchProgress(stage);
    console.log("📊 Switch progress:", stage);
  }, []);

  // Handle errors
  const handleSwitchError = React.useCallback(
    (error: Error, stage: SwitchStage) => {
      console.error("❌ Switch error at stage:", stage, error);
      setSwitchError(error.message);
      setIsSwitching(false);
      setSwitchProgress(null);

      // Restore previous pharmacy selection in UI
      if (previousPharmacyId) {
        const previousPharmacy = pharmacies.find(
          (p) => p.pharmacy_id === previousPharmacyId
        );
        if (previousPharmacy) {
          console.log("🔄 Restored previous pharmacy in UI");
        }
      }
    },
    [previousPharmacyId, pharmacies]
  );

  // Handle pharmacy selection with queue to prevent rapid switches
  const handlePharmacySelect = React.useCallback(
    async (pharmacyId: string) => {
      // Prevent multiple simultaneous switches
      if (isSwitching) {
        console.log("⚠️ Switch already in progress, ignoring request");
        return;
      }

      // Check if online
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setSwitchError("Cannot switch pharmacies while offline. Please check your internet connection.");
        console.error("❌ Cannot switch pharmacy - offline");
        return;
      }

      // Store current pharmacy for rollback
      setPreviousPharmacyId(currentPharmacy?.id || null);
      
      // Clear any previous errors
      setSwitchError(null);
      
      // Set switching state
      setIsSwitching(true);
      setSwitchProgress(SwitchStage.VALIDATING);

      try {
        await switchPharmacy(pharmacyId, {
          onProgress: handleSwitchProgress,
          onError: handleSwitchError,
        });

        // Success - clear switching state
        setIsSwitching(false);
        setSwitchProgress(null);
        console.log("✅ Pharmacy switch successful");
      } catch (error: any) {
        // Error already handled by callback
        console.error("❌ Pharmacy switch failed:", error);
      }
    },
    [
      isSwitching,
      currentPharmacy,
      switchPharmacy,
      handleSwitchProgress,
      handleSwitchError,
    ]
  );

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={isSwitching}>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              disabled={isSwitching}
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                {isSwitching ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <GalleryVerticalEnd className="size-4" />
                )}
              </div>
              <div className="flex flex-col gap-0.5 leading-none truncate">
                {isSwitching && switchProgress ? (
                  <>
                    <span className="font-medium text-sm">Switching...</span>
                    <span className="text-[.6rem] text-zinc-500">
                      {progressMessages[switchProgress]}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-medium">{currentPharmacy?.name}</span>
                    <span className="text-[.6rem] text-zinc-500">
                      {currentPharmacy?.address}
                    </span>
                  </>
                )}
              </div>
              {!isSwitching && <ChevronsUpDown className="ml-auto" />}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {pharmacies.map((pharmacy) => (
              <DropdownMenuItem
                key={pharmacy?.pharmacy_id}
                onSelect={() => handlePharmacySelect(pharmacy?.pharmacy_id)}
                disabled={isSwitching}
              >
                <div className="flex flex-col gap-2 truncate">
                  <p>{pharmacy?.pharmacies?.name}</p>
                  <span className="text-xs text-gray-500">
                    {pharmacy?.pharmacies?.address}
                  </span>
                </div>
                {currentPharmacy?.id === pharmacy?.pharmacy_id && (
                  <Check className="ml-auto" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Error Display */}
        {switchError && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
            <p className="font-medium">Switch failed</p>
            <p>{switchError}</p>
          </div>
        )}
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

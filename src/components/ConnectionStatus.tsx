"use client";
import { MoveDown, MoveUp, RefreshCcw, Wifi, WifiOff } from "lucide-react";
import {
  usePowerSync,
  usePowerSyncStatus,
} from "@/lib/powersync/PowersyncProvider";

export default function ConnectionStatus() {
  const {
    connect,
    disconnect,
    reconnect,
    isConnecting,
    isConnected,
    powerSyncDb,
  } = usePowerSync();
  const { syncStatus } = usePowerSyncStatus();

  // Safely get status from PowerSync
  const status = powerSyncDb?.currentStatus;

  const refreshConnection = async () => {
    console.log("🔄 Refreshing connection...", syncStatus);
    await reconnect();
  };

  return (
    <div className="w-full px-3 py-2">
      <div className="flex items-center justify-between bg-gray-200 rounded-lg px-3 py-2">
        {/* Data Flow Icons */}
        <div className="flex items-center gap-0.5">
          <MoveUp
            size={12}
            className={status?.dataFlowStatus?.uploading ? "text-blue-500" : "text-green-500"}
          />
          <MoveDown
            size={12}
            className={status?.dataFlowStatus?.downloading ? "text-blue-500" : "text-green-500"}
          />
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-1 flex-1 ml-1">
          {isConnected ? (
            <>
              <Wifi size={12} className="text-green-500" />
              <span className="text-green-600 text-xs font-medium">Online</span>
            </>
          ) : (
            <>
              <WifiOff size={12} className="text-orange-500" />
              <span className="text-orange-600 text-xs font-medium">Offline</span>
            </>
          )}
        </div>

        {/* Refresh Button */}
        <button
          onClick={refreshConnection}
          disabled={isConnecting}
          className="p-1 hover:bg-gray-300 rounded transition-colors disabled:opacity-50 mr-1"
          title="Refresh"
        >
          <RefreshCcw
            className={`${isConnecting && "animate-spin"} text-gray-700`}
            size={12}
          />
        </button>

        {/* Connect/Disconnect Button */}
        <button
          onClick={isConnected ? disconnect : refreshConnection}
          disabled={isConnecting}
          className="text-gray-700 text-xs px-2 py-1 bg-gray-300 rounded-sm hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isConnected ? "Disconnect" : "Connect"}
        </button>
      </div>
    </div>
  );
}
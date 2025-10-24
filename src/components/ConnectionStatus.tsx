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
    <div className="w-full">
      <div className="w-10 fixed m-2 right-[25rem] bottom-0 flex items-center gap-2 text-sm ">
        <div className="flex bg-zinc-700 rounded-lg p-3 items-center ">
          <div className="flex">
            <MoveUp
              color={status?.dataFlowStatus?.uploading ? "blue" : "green"}
            />
            <MoveDown
              color={status?.dataFlowStatus?.downloading ? "blue" : "green"}
            />
          </div>

          <div className="flex items-center gap-2 text-sm">
            {isConnected ? (
              <>
                <Wifi size={16} className="text-green-400" />
                <span className="text-green-400">Online</span>
              </>
            ) : (
              <>
                <WifiOff size={16} className="text-orange-400" />
                <span className="text-orange-400">Offline</span>
              </>
            )}
          </div>

          <div className="ml-2">
            <RefreshCcw
              className={`${isConnecting && "animate-spin"} text-amber-100`}
              onClick={() => refreshConnection()}
              size={18}
            />
          </div>

          <div className="flex">
            <button
              onClick={connect}
              disabled={isConnecting || isConnected}
              className="text-white ml-2 border border-zinc-700 bg-zinc-800 rounded-lg p-5 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Connect
            </button>
            <button
              onClick={disconnect}
              disabled={isConnecting || !isConnected}
              className="text-white ml-2 border border-zinc-700 bg-zinc-800 rounded-lg p-5 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

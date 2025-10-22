"use client";

import { useEffect, useState } from "react";
import { MoveDown, MoveUp, RefreshCcw, Wifi, WifiOff } from "lucide-react";
import { useStatus } from "@powersync/react";
import {
  usePowerSync,
  usePowerSyncStatus,
} from "@/lib/powersync/PowersyncProvider";

export default function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(false);

  const status = useStatus();

  const { supabaseConnector, powerSyncDb, reconnect,isConnecting } = usePowerSync();
  const { syncStatus } = usePowerSyncStatus();

  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(powerSyncDb.connected);
    };

    // Check initial connection
    checkConnection();

    // Check connection status periodically
    const interval = setInterval(checkConnection, 2000);

    return () => clearInterval(interval);
  }, [powerSyncDb]);

  console.log(isConnecting, "connecting");

  const refreshConnection = async () => {
    console.log(syncStatus, "syncStatus");
    // if (supabaseConnector) {
    //   powerSyncDb.connect(supabaseConnector);
    //   console.log("Refreshing connection");
    // }
    await reconnect();
  };

  return (
    <div className="w-10 absolute   top-0 flex items-center gap-2 text-sm ">
      <div className="flex bg-zinc-700 rounded-lg p-3 items-center ">
        <div className="flex">
          <MoveUp color={status?.dataFlowStatus.uploading ? "blue" : "green"} />
          <MoveDown
            color={status?.dataFlowStatus.downloading ? "blue" : "green"}
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
            onClick={() => powerSyncDb.connect(supabaseConnector)}
            className="text-white ml-2 border border-zinc-700 bg-zinc-800 rounded-lg p-5 py-2"
          >
            Connect
          </button>
          <button
            onClick={() => powerSyncDb.disconnectAndClear()}
            className="text-white ml-2 border border-zinc-700 bg-zinc-800 rounded-lg p-5 py-2"
          >
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}

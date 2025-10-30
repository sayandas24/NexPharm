import { PowerSyncProvider } from "@/lib/powersync/PowersyncProvider";
import { Toaster } from "react-hot-toast";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PowerSyncProvider>
      {children}
      <Toaster position="top-right" />
    </PowerSyncProvider>
  );
}

import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";

export default function Inventory() {
  return (
    <div>
      <h1>Inventory</h1>
      <div className="w-full flex gap-5">
        <Link href="/inventory/med-list">
          <Button color="light">Medicine lists</Button>
        </Link>
        <Link href="/inventory/med-groups">
          <Button>Medicine Groups</Button>
        </Link>

        <Link href="/inventory/med-shortage">
          <Button>Medicine Shortage</Button>
        </Link>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import MedicineGroupsList from "./MedicineGroupsList";
import MedicineGroupDetail from "./MedicineGroupDetail";

export default function MedicineGroupMain() {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  if (selectedGroup) {
    return (
      <MedicineGroupDetail
        groupName={selectedGroup}
        onBack={() => setSelectedGroup(null)}
      />
    );
  }

  return <MedicineGroupsList onSelectGroup={setSelectedGroup} />;
}

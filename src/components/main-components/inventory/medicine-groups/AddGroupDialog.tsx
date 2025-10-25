"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, X } from "lucide-react";

interface AddGroupDialogProps {
  onClose: () => void;
  onGroupCreated: (groupName: string) => void;
}

export default function AddGroupDialog({
  onClose,
  onGroupCreated,
}: AddGroupDialogProps) {
  const [newGroupName, setNewGroupName] = useState("");

  const handleCreateGroup = () => {
    if (newGroupName.trim()) {
      onGroupCreated(newGroupName.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center z-50">
      <Card className="bg-white p-6 rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Add New Group</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Group Name
            </label>
            <Input
              placeholder="Enter group name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreateGroup();
                }
              }}
            />
          </div>
          <Button
            onClick={handleCreateGroup}
            className="w-full bg-red-500 hover:bg-red-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Group
          </Button>
        </div>
      </Card>
    </div>
  );
}

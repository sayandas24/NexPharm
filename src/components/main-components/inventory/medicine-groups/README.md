# Medicine Groups Components

## Component Structure

- **MedicineGroupMain.tsx** - Main container that manages routing
- **MedicineGroupsList.tsx** - List view of all groups
- **MedicineGroupDetail.tsx** - Detail view of a single group
- **AddGroupDialog.tsx** - Dialog for creating new groups
- **AddMedicineToGroupDialog.tsx** - Dialog for adding medicines to groups

## Flow

### Creating a New Group with Medicines

1. User clicks "Add New Group" button
2. `AddGroupDialog` opens → user enters group name
3. After clicking "Create Group", `onGroupCreated(groupName)` is called
4. `AddMedicineToGroupDialog` opens automatically with `isNewGroup={true}`
5. User can search and select multiple medicines
6. When user clicks "Finish & Create Group", `onMedicineAdded(medicineId, medicineName)` is called for each selected medicine
7. You can implement your CRUD logic in the callback

### Adding Medicine to Existing Group

1. User navigates to a group detail page
2. User clicks "Add Medicine" button
3. `AddMedicineToGroupDialog` opens with `isNewGroup={false}`
4. User searches and clicks on a medicine
5. `onMedicineAdded(medicineId, medicineName)` is called immediately
6. Dialog closes

## Implementation Example

In `MedicineGroupsList.tsx`, the callback receives:

```typescript
onMedicineAdded={(medicineId, medicineName) => {
  // Available data:
  // - newGroupName: string (the group name)
  // - medicineId: string (medicine UUID)
  // - medicineName: string (medicine name)
  
  // Example implementation:
  // await updateMedicine(medicineId, { medicine_group: newGroupName });
}}
```

## TODO: Implement CRUD Operations

You need to implement the following operations using your `useMedicineCRUD` hook:

1. **Create Group**: Update medicines' `medicine_group` field
2. **Add Medicine to Group**: Update medicine's `medicine_group` field
3. **Remove Medicine from Group**: Set medicine's `medicine_group` to null
4. **Delete Group**: Set all medicines' `medicine_group` to null for that group

Note: Groups are not stored in a separate table - they are derived from the `medicine_group` field in the medicines table.

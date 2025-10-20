# Requirements Document

## Introduction

This feature addresses the issue where medicines added through the PowerSync local database (test1, test2, test3, test4, etc.) are not syncing back to Supabase. The system currently allows users to add medicines locally, but these changes remain only in the PowerSync local database and never reach the Supabase backend, causing data inconsistency between offline and online states.

## Glossary

- **PowerSync**: A sync engine that enables offline-first applications by maintaining a local database that syncs with a backend database
- **Supabase**: The backend PostgreSQL database and authentication service
- **CRUD Queue**: PowerSync's internal queue that tracks local changes (Create, Read, Update, Delete) that need to be uploaded to the backend
- **SupabaseConnector**: The PowerSync connector class that handles authentication and data upload to Supabase
- **Kysely**: A type-safe SQL query builder used to interact with the PowerSync local database
- **RLS (Row Level Security)**: Supabase's security feature that controls which rows users can access or modify
- **Sync Rules**: PowerSync configuration that defines which data flows from Supabase to the client
- **Upload Data**: The process of sending local changes from PowerSync to Supabase

## Requirements

### Requirement 1

**User Story:** As a pharmacy staff member, I want my newly added medicines to sync to Supabase, so that the data persists across devices and is available when I'm online

#### Acceptance Criteria

1. WHEN the user adds a new medicine through the AddMedicineForm, THE System SHALL insert the medicine record into the PowerSync local database
2. WHEN the medicine record is inserted into PowerSync, THE System SHALL add the operation to the CRUD upload queue
3. WHEN the device has network connectivity, THE System SHALL upload pending medicine records from the CRUD queue to Supabase
4. WHEN the upload completes successfully, THE System SHALL remove the operation from the CRUD queue
5. WHEN the upload fails due to network issues, THE System SHALL retry the upload when connectivity is restored

### Requirement 2

**User Story:** As a pharmacy staff member, I want to see confirmation that my data is syncing, so that I know my changes are being saved to the server

#### Acceptance Criteria

1. WHEN a medicine is successfully uploaded to Supabase, THE System SHALL log a success message to the console
2. WHEN an upload fails, THE System SHALL log an error message with details to the console
3. WHEN the sync status changes, THE System SHALL update the connection status indicator
4. WHEN there are pending uploads in the queue, THE System SHALL display the uploading status

### Requirement 3

**User Story:** As a system administrator, I want proper RLS policies on the medicines table, so that authenticated users can create medicines while maintaining security

#### Acceptance Criteria

1. THE Supabase medicines table SHALL have an RLS policy that allows authenticated users to insert records
2. THE Supabase medicines table SHALL have an RLS policy that allows authenticated users to update their own records
3. THE Supabase medicines table SHALL have an RLS policy that allows authenticated users to read all active medicines
4. IF a user is not authenticated, THEN THE System SHALL deny write access to the medicines table
5. WHEN RLS policies are violated, THE System SHALL return a clear error message

### Requirement 4

**User Story:** As a developer, I want the SupabaseConnector to properly handle medicine uploads, so that local changes are reliably synced to the backend

#### Acceptance Criteria

1. WHEN the SupabaseConnector processes a PUT operation for medicines, THE System SHALL upsert the record to Supabase
2. WHEN the SupabaseConnector processes a PATCH operation for medicines, THE System SHALL update the existing record in Supabase
3. WHEN the SupabaseConnector processes a DELETE operation for medicines, THE System SHALL delete the record from Supabase
4. IF the Supabase operation returns an error, THEN THE System SHALL log the error and throw an exception
5. WHEN a fatal error occurs (RLS violation, constraint violation), THE System SHALL discard the transaction to prevent infinite retries
6. WHEN a non-fatal error occurs (network timeout), THE System SHALL keep the operation in the queue for retry

### Requirement 5

**User Story:** As a pharmacy staff member, I want to verify that my medicines have synced, so that I can confirm my data is safe

#### Acceptance Criteria

1. WHEN a medicine is added locally, THE System SHALL assign it a unique UUID
2. WHEN the medicine syncs to Supabase, THE System SHALL preserve the same UUID
3. WHEN the sync completes, THE System SHALL download the confirmed record from Supabase
4. WHEN I query the medicines table after sync, THE System SHALL return the newly added medicine with all its properties
5. WHEN I check Supabase directly, THE System SHALL show the medicine record in the database

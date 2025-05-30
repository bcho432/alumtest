# Migration Scripts

This directory contains scripts for data migration and maintenance tasks.

## Memorials to Profiles Migration

The `migrate-memorials-to-profiles.ts` script migrates all memorials from the legacy `memorials` collection to the new `profiles` collection.

### Prerequisites

1. Node.js 16+ installed
2. Firebase project configured with environment variables
3. Admin access to the Firebase project

### Running the Migration

1. Build the TypeScript files:
```bash
npm run build
```

2. Run the migration script:
```bash
node dist/scripts/migrate-memorials-to-profiles.js
```

### What the Script Does

1. Reads all documents from the `memorials` collection
2. Transforms each memorial into a profile document:
   - Retains original document ID
   - Sets status to 'draft'
   - Adds isDeceased flag
   - Preserves creation date
   - Removes deprecated fields (candles, memorialOnly)
   - Adds createdBy field

3. Writes logs to `/migrationLogs/{docId}` for each document:
   - Success: Document migrated successfully
   - Skipped: Missing required fields
   - Error: Failed to migrate

4. Uses batched writes (500 documents per batch) for better performance

### Monitoring Progress

The script outputs progress to the console:
- Total documents found
- Batch commit confirmations
- Final statistics (migrated, skipped, errors)

### Error Handling

- Script stops after 10 consecutive batch errors
- Failed documents are logged with error details
- Migration can be safely re-run (skips existing profiles)

### Security

- Requires admin credentials
- Cannot be triggered via UI or frontend routes
- Logs all operations for audit trail 
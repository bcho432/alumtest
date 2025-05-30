import { getDb } from '../lib/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  writeBatch, 
  serverTimestamp,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';

interface MigrationLog {
  oldId: string;
  newId: string;
  status: 'success' | 'skipped' | 'error';
  reason?: string;
  timestamp: Date;
}

interface Profile {
  id: string;
  name: string;
  isDeceased: boolean;
  createdBy: string;
  status: 'draft' | 'published';
  createdAt: Date;
  universityId: string;
  basicInfo?: {
    dateOfBirth?: string;
    birthLocation?: string;
    dateOfDeath?: string;
    deathLocation?: string;
  };
  lifeStory?: {
    education?: string;
    notableAchievements?: string;
    jobs?: string;
    majorLifeEvents?: string;
    hobbies?: string;
    personalStories?: string;
    memorableQuotes?: string;
    values?: string;
    communityInvolvement?: string;
  };
}

const BATCH_SIZE = 500;
const MAX_ERRORS_PER_BATCH = 10;

async function migrateMemorialsToProfiles() {
  console.log('Starting migration of memorials to profiles...');
  
  const db = await getDb();
  if (!db) throw new Error('Firestore is not initialized');
  const memorialsRef = collection(db, 'memorials');
  const profilesRef = collection(db, 'profiles');
  const logsRef = collection(db, 'migrationLogs');
  
  let totalMigrated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  let currentBatch = writeBatch(db);
  let batchCount = 0;
  let errorCount = 0;
  
  try {
    // Get all memorials
    const memorialsSnapshot = await getDocs(memorialsRef);
    console.log(`Found ${memorialsSnapshot.size} memorials to migrate`);
    
    // Process each memorial
    for (const memorialDoc of memorialsSnapshot.docs) {
      const memorialData = memorialDoc.data();
      
      // Skip if missing required fields
      if (!memorialData.name || !memorialData.creatorId) {
        const log: MigrationLog = {
          oldId: memorialDoc.id,
          newId: '',
          status: 'skipped',
          reason: 'Missing required fields (name or creatorId)',
          timestamp: new Date()
        };
        
        currentBatch.set(doc(logsRef, memorialDoc.id), log);
        totalSkipped++;
        continue;
      }
      
      // Create profile document
      const profile: Profile = {
        id: memorialDoc.id, // Retain original ID
        name: memorialData.name,
        isDeceased: !!memorialData.dateOfDeath, // Set based on dateOfDeath existence
        createdBy: memorialData.creatorId,
        status: 'draft',
        createdAt: memorialData.createdAt?.toDate() || new Date(),
        universityId: memorialData.universityId,
        basicInfo: memorialData.basicInfo,
        lifeStory: memorialData.lifeStory
      };
      
      // Add to batch
      currentBatch.set(doc(profilesRef, profile.id), profile);
      batchCount++;
      
      // Log success
      const log: MigrationLog = {
        oldId: memorialDoc.id,
        newId: profile.id,
        status: 'success',
        timestamp: new Date()
      };
      
      currentBatch.set(doc(logsRef, memorialDoc.id), log);
      totalMigrated++;
      
      // Commit batch if size limit reached
      if (batchCount >= BATCH_SIZE) {
        try {
          await currentBatch.commit();
          console.log(`Committed batch of ${batchCount} documents`);
          currentBatch = writeBatch(db);
          batchCount = 0;
          errorCount = 0;
        } catch (error) {
          console.error('Error committing batch:', error);
          totalErrors += batchCount;
          errorCount++;
          
          if (errorCount >= MAX_ERRORS_PER_BATCH) {
            console.error('Too many errors in batch, stopping migration');
            break;
          }
        }
      }
    }
    
    // Commit any remaining documents
    if (batchCount > 0) {
      try {
        await currentBatch.commit();
        console.log(`Committed final batch of ${batchCount} documents`);
      } catch (error) {
        console.error('Error committing final batch:', error);
        totalErrors += batchCount;
      }
    }
    
    // Log final statistics
    console.log('\nMigration completed:');
    console.log(`Total memorials processed: ${memorialsSnapshot.size}`);
    console.log(`Successfully migrated: ${totalMigrated}`);
    console.log(`Skipped: ${totalSkipped}`);
    console.log(`Errors: ${totalErrors}`);
    
  } catch (error) {
    console.error('Fatal error during migration:', error);
    throw error;
  }
}

// Execute migration
migrateMemorialsToProfiles()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  }); 
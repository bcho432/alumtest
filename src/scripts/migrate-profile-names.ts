import { getDb } from '@/lib/firebase';
import { collection, getDocs, updateDoc, doc, FieldPath } from 'firebase/firestore';

export async function migrateProfileNames() {
  const db = await getDb();
  console.log('Starting profile name migration...');
  let migratedCount = 0;
  let errorCount = 0;

  try {
    const profilesRef = collection(db, 'profiles');
    const querySnapshot = await getDocs(profilesRef);

    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      
      if (data.fullName && !data.name) {
        try {
          await updateDoc(doc(db, 'profiles', docSnapshot.id), {
            name: data.fullName,
            fullName: null // Set to null first to avoid conflicts
          });
          
          // Remove fullName field
          await updateDoc(doc(db, 'profiles', docSnapshot.id), {
            fullName: null
          });
          
          migratedCount++;
          console.log(`Migrated profile ${docSnapshot.id}: ${data.fullName} -> ${data.name}`);
        } catch (err) {
          errorCount++;
          console.error(`Error migrating profile ${docSnapshot.id}:`, err);
        }
      }
    }

    console.log('\nMigration Summary:');
    console.log(`Total profiles processed: ${querySnapshot.size}`);
    console.log(`Successfully migrated: ${migratedCount}`);
    console.log(`Errors encountered: ${errorCount}`);

    // Track migration analytics
    await updateDoc(doc(db, 'analytics', 'migrations'), {
      'profile_name_migration.timestamp': new Date(),
      'profile_name_migration.totalProcessed': querySnapshot.size,
      'profile_name_migration.migratedCount': migratedCount,
      'profile_name_migration.errorCount': errorCount
    } as any, { merge: true });

  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateProfileNames()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
} 
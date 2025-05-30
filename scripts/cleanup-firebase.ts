const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
const result = dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
if (result.error) {
  console.error('Error loading .env.local file:', result.error);
  process.exit(1);
}

// Debug: Print environment variables (without sensitive data)
console.log('Environment check:');
console.log('Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✓ Set' : '✗ Missing');
console.log('Client Email:', process.env.FIREBASE_ADMIN_CLIENT_EMAIL ? '✓ Set' : '✗ Missing');
console.log('Private Key:', process.env.FIREBASE_ADMIN_PRIVATE_KEY ? '✓ Set' : '✗ Missing');

// Validate required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'FIREBASE_ADMIN_CLIENT_EMAIL',
  'FIREBASE_ADMIN_PRIVATE_KEY'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
};

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error: any) {
  console.error('Failed to initialize Firebase Admin:', error.message || error);
  process.exit(1);
}

async function cleanupFirebase() {
  try {
    console.log('Starting Firebase cleanup...');

    // Delete all users
    console.log('Deleting users...');
    const listUsersResult = await admin.auth().listUsers();
    console.log(`Found ${listUsersResult.users.length} users to delete`);
    
    for (const user of listUsersResult.users) {
      try {
        await admin.auth().deleteUser(user.uid);
        console.log(`✓ Deleted user: ${user.email}`);
      } catch (error: any) {
        console.error(`✗ Error deleting user ${user.email}:`, error.message || error);
      }
    }

    // Delete all Firestore collections
    console.log('\nDeleting Firestore data...');
    const db = admin.firestore();
    const collections = ['users', 'organizations', 'profiles', 'memories', 'universities'];
    
    for (const collectionName of collections) {
      try {
        const querySnapshot = await db.collection(collectionName).get();
        console.log(`Found ${querySnapshot.size} documents in ${collectionName}`);
        
        for (const doc of querySnapshot.docs) {
          try {
            await doc.ref.delete();
            console.log(`✓ Deleted document: ${collectionName}/${doc.id}`);
          } catch (error: any) {
            console.error(`✗ Error deleting document ${collectionName}/${doc.id}:`, error.message || error);
          }
        }
      } catch (error: any) {
        console.error(`✗ Error accessing collection ${collectionName}:`, error.message || error);
      }
    }

    // Delete all Storage files
    console.log('\nDeleting Storage files...');
    const bucket = admin.storage().bucket();
    const [files] = await bucket.getFiles();
    console.log(`Found ${files.length} files to delete`);
    
    for (const file of files) {
      try {
        await file.delete();
        console.log(`✓ Deleted file: ${file.name}`);
      } catch (error: any) {
        console.error(`✗ Error deleting file ${file.name}:`, error.message || error);
      }
    }

    console.log('\nFirebase cleanup completed successfully!');
  } catch (error: any) {
    console.error('\nError during cleanup:', error.message || error);
  } finally {
    // Clean up the admin app
    try {
      await admin.app().delete();
      console.log('\nFirebase Admin app cleaned up successfully');
    } catch (error: any) {
      console.error('\nError cleaning up Firebase Admin app:', error.message || error);
    }
  }
}

// Run the cleanup
cleanupFirebase().catch((error: any) => {
  console.error('Fatal error:', error.message || error);
  process.exit(1);
}); 
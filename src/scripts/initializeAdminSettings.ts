import { getDb } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

const INITIAL_ADMIN_EMAILS = [
  'matthew.bo@storiats.com',
  'justin.lontoh@storiats.com',
  'derek.lee@storiats.com'
];

async function initializeAdminSettings() {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error('Firestore is not initialized');
    }

    // Create the adminSettings document
    await setDoc(doc(db, 'adminSettings', 'storiatsAdmins'), {
      adminEmails: INITIAL_ADMIN_EMAILS.map(email => email.toLowerCase()),
      lastUpdated: new Date(),
      updatedBy: 'system'
    });

    console.log('Admin settings initialized successfully');
  } catch (error) {
    console.error('Error initializing admin settings:', error);
    throw error;
  }
}

// Run the initialization
initializeAdminSettings().catch(console.error); 
const admin = require('firebase-admin');

// You can use a service account key or application default credentials
// For local development, set GOOGLE_APPLICATION_CREDENTIALS env variable to your service account key file

const INITIAL_ADMIN_EMAILS = [
  'matthew.bo@storiats.com',
  'justin.lontoh@storiats.com',
  'derek.lee@storiats.com'
];

async function initializeAdminSettings() {
  try {
    if (!admin.apps.length) {
      admin.initializeApp();
    }
    const db = admin.firestore();

    await db.collection('adminSettings').doc('storiatsAdmins').set({
      adminEmails: INITIAL_ADMIN_EMAILS.map(email => email.toLowerCase()),
      lastUpdated: admin.firestore.Timestamp.now(),
      updatedBy: 'system'
    });

    console.log('Admin settings initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing admin settings:', error);
    process.exit(1);
  }
}

initializeAdminSettings(); 
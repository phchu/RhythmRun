const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Path to the service account key JSON file
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('\n❌ Error: serviceAccountKey.json not found!');
  console.error('====================================================');
  console.error('Please download your Service Account Key from Firebase:');
  console.error('1. Go to Firebase Console -> Project Settings -> Service Accounts');
  console.error('2. Click "Generate new private key"');
  console.error(`3. Save the downloaded file as "serviceAccountKey.json" inside the "scripts" folder.`);
  console.error(`Expected path: ${serviceAccountPath}`);
  console.error('====================================================\n');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

/**
 * Helper to delete a collection in batches
 */
async function deleteCollection(collectionRef, batchSize = 100) {
  const query = collectionRef.orderBy('__name__').limit(batchSize);
  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(query, resolve) {
  const snapshot = await query.get();
  const batchSize = snapshot.size;
  if (batchSize === 0) {
    resolve();
    return;
  }
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
  process.nextTick(() => {
    deleteQueryBatch(query, resolve);
  });
}

/**
 * Main execution function
 */
async function clearAnonymousUsers() {
  console.log('🔍 Fetching all users from Firebase Auth...');
  let anonymousUsers = [];
  
  // List all users in batches of 1000
  const listAllUsers = async (nextPageToken) => {
    const listUsersResult = await auth.listUsers(1000, nextPageToken);
    listUsersResult.users.forEach((userRecord) => {
      // Anonymous users have empty providerData
      if (userRecord.providerData.length === 0) {
        anonymousUsers.push(userRecord.uid);
      }
    });
    if (listUsersResult.pageToken) {
      await listAllUsers(listUsersResult.pageToken);
    }
  };

  await listAllUsers();
  
  console.log(`\nFound ${anonymousUsers.length} anonymous users in total.`);
  
  if (anonymousUsers.length === 0) {
    console.log('✅ No anonymous users to delete.');
    return;
  }

  console.log('\n🗑️  Starting deletion process...');
  
  let deletedCount = 0;
  for (const uid of anonymousUsers) {
    // 1. Delete all runs in the user's subcollection
    const runsRef = db.collection('users').doc(uid).collection('runs');
    await deleteCollection(runsRef);
    
    // 2. Delete the user's document itself
    await db.collection('users').doc(uid).delete();
    
    // 3. Delete the account from Firebase Auth
    await auth.deleteUser(uid);
    
    deletedCount++;
    process.stdout.write(`\r✅ Deleted data and account for ${uid} (${deletedCount}/${anonymousUsers.length})`);
  }
  
  console.log('\n\n🎉 All anonymous users and their data have been cleared successfully!');
}

clearAnonymousUsers().catch(console.error);

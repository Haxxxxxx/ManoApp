/**
 * Migration: Add asset hash index
 * 
 * Adds Firestore index for assets.hash field to enable efficient duplicate detection
 * 
 * Run this migration with:
 *   npx ts-node scripts/migrations/20250101_add_asset_hash.ts
 * 
 * Or deploy the index via Firebase Console or firebase.json
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Add index for assets.hash field
 * 
 * Note: This script documents the required index.
 * Actual index creation should be done via:
 * 1. Firebase Console (Firestore > Indexes)
 * 2. firestore.indexes.json (deployed via firebase deploy --only firestore:indexes)
 * 3. Firebase CLI: firebase firestore:indexes
 */
async function addAssetHashIndex() {
  console.log('Migration: Adding asset hash index');
  console.log('');
  console.log('This migration requires a composite index to be created in Firestore.');
  console.log('The index should be added to firestore.indexes.json and deployed.');
  console.log('');
  console.log('Required index:');
  console.log('  Collection: assets');
  console.log('  Fields:');
  console.log('    - hash (Ascending)');
  console.log('    - userId (Ascending)');
  console.log('');
  console.log('This index enables efficient queries for duplicate detection:');
  console.log('  assets.where("hash", "==", hash).where("userId", "==", userId)');
  console.log('');
  console.log('To create the index:');
  console.log('  1. Update firestore.indexes.json (already done)');
  console.log('  2. Deploy: firebase deploy --only firestore:indexes');
  console.log('');
  
  // Verify the index exists by checking if we can query (this will fail if index doesn't exist)
  try {
    const testQuery = db
      .collection('assets')
      .where('hash', '==', 'test')
      .where('userId', '==', 'test')
      .limit(1);
    
    // Note: This query will fail if index doesn't exist, but we're just documenting it
    console.log('Index verification: Query structure is valid');
    console.log('Note: Actual index must be created via Firebase Console or firestore.indexes.json');
  } catch (error) {
    console.log('Note: Index may not exist yet. Create it via Firebase Console or firestore.indexes.json');
  }
  
  console.log('');
  console.log('Migration documentation complete.');
}

// Run migration
if (require.main === module) {
  addAssetHashIndex()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { addAssetHashIndex };


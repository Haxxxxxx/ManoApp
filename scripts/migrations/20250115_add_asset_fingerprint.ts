/**
 * Migration: Add asset fingerprint field
 * 
 * Adds fingerprint field to existing assets in Firestore.
 * This field is optional and will be populated when assets are re-processed or newly imported.
 * 
 * Run this migration with:
 *   npx ts-node scripts/migrations/20250115_add_asset_fingerprint.ts
 * 
 * Rollback:
 *   This migration is non-destructive (only adds optional field).
 *   To rollback, you can remove the field manually or use a separate rollback script.
 */

import * as admin from 'firebase-admin';
import * as readline from 'readline';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Add fingerprint field to all assets
 */
async function addFingerprintField() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise<void>((resolve, reject) => {
    rl.question(
      'This will add fingerprint field to all assets. Continue? (yes/no): ',
      async (answer) => {
        rl.close();

        if (answer.toLowerCase() !== 'yes') {
          console.log('Migration cancelled.');
          resolve();
          return;
        }

        try {
          console.log('Starting migration...');

          // Get all assets
          const assetsSnapshot = await db.collection('assets').get();
          const totalAssets = assetsSnapshot.size;
          let processed = 0;
          let updated = 0;
          let skipped = 0;
          let errors = 0;

          console.log(`Found ${totalAssets} assets to process.`);

          // Process in batches to avoid overwhelming Firestore
          const batchSize = 100;
          const batches: admin.firestore.DocumentSnapshot[][] = [];

          for (let i = 0; i < assetsSnapshot.docs.length; i += batchSize) {
            batches.push(assetsSnapshot.docs.slice(i, i + batchSize));
          }

          for (const batch of batches) {
            const writeBatch = db.batch();

            for (const doc of batch) {
              const data = doc.data();

              // Skip if fingerprint already exists
              if (data.fingerprint) {
                skipped++;
                continue;
              }

              // Add fingerprint field as null (will be populated when asset is re-processed)
              writeBatch.update(doc.ref, {
                fingerprint: null,
                updatedAt: new Date().toISOString(),
              });

              updated++;
            }

            try {
              await writeBatch.commit();
              processed += batch.length;
              console.log(`Processed ${processed}/${totalAssets} assets...`);
            } catch (error) {
              console.error(`Error processing batch:`, error);
              errors += batch.length;
            }
          }

          console.log('');
          console.log('Migration completed:');
          console.log(`  Total assets: ${totalAssets}`);
          console.log(`  Updated: ${updated}`);
          console.log(`  Skipped (already had fingerprint): ${skipped}`);
          console.log(`  Errors: ${errors}`);
          console.log('');
          console.log('Note: Fingerprint values will be computed when assets are re-imported or re-processed.');

          resolve();
        } catch (error) {
          console.error('Migration failed:', error);
          reject(error);
        }
      }
    );
  });
}

// Main execution
addFingerprintField()
  .then(() => {
    console.log('Migration script finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });


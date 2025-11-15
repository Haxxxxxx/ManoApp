/**
 * Migration Script: Add AI Metadata Fields to Songs
 * 
 * This script adds aiMetadata and suggestedTags fields to all existing songs
 * in the Firestore database. These fields are optional and will be populated
 * when AI metadata is generated for a song.
 * 
 * Usage:
 *   ts-node scripts/migrations/add_ai_metadata_field.ts
 * 
 * Rollback:
 *   This migration is non-destructive (only adds optional fields).
 *   To rollback, you can remove the fields manually or use a separate rollback script.
 */

import * as admin from 'firebase-admin';
import * as readline from 'readline';

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : undefined;

  admin.initializeApp({
    credential: serviceAccount
      ? admin.credential.cert(serviceAccount)
      : admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

/**
 * Add AI metadata fields to all songs
 */
async function addAIMetadataFields() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise<void>((resolve, reject) => {
    rl.question(
      'This will add aiMetadata and suggestedTags fields to all songs. Continue? (yes/no): ',
      async (answer) => {
        rl.close();

        if (answer.toLowerCase() !== 'yes') {
          console.log('Migration cancelled.');
          resolve();
          return;
        }

        try {
          console.log('Starting migration...');

          // Get all songs
          const songsSnapshot = await db.collection('songs').get();
          const totalSongs = songsSnapshot.size;
          let processed = 0;
          let updated = 0;
          let skipped = 0;
          let errors = 0;

          console.log(`Found ${totalSongs} songs to process.`);

          // Process in batches to avoid overwhelming Firestore
          const batchSize = 100;
          const batches: admin.firestore.DocumentSnapshot[][] = [];

          for (let i = 0; i < songsSnapshot.docs.length; i += batchSize) {
            batches.push(songsSnapshot.docs.slice(i, i + batchSize));
          }

          for (const batch of batches) {
            const writeBatch = db.batch();

            for (const doc of batch) {
              try {
                const data = doc.data();
                const needsUpdate =
                  !data.metadata?.aiMetadata && !data.metadata?.suggestedTags;

                if (needsUpdate) {
                  // Add empty AI metadata fields if they don't exist
                  const updateData: any = {};

                  if (!data.metadata) {
                    updateData.metadata = {
                      aiMetadata: null,
                      suggestedTags: [],
                    };
                  } else {
                    if (!data.metadata.aiMetadata) {
                      updateData['metadata.aiMetadata'] = null;
                    }
                    if (!data.metadata.suggestedTags) {
                      updateData['metadata.suggestedTags'] = [];
                    }
                  }

                  writeBatch.update(doc.ref, updateData);
                  updated++;
                } else {
                  skipped++;
                }

                processed++;
              } catch (error) {
                console.error(`Error processing song ${doc.id}:`, error);
                errors++;
                processed++;
              }
            }

            // Commit batch
            if (updated > 0) {
              await writeBatch.commit();
              console.log(
                `Processed ${processed}/${totalSongs} songs (${updated} updated, ${skipped} skipped, ${errors} errors)`
              );
            }
          }

          console.log('\nMigration completed!');
          console.log(`Total songs: ${totalSongs}`);
          console.log(`Updated: ${updated}`);
          console.log(`Skipped: ${skipped}`);
          console.log(`Errors: ${errors}`);

          resolve();
        } catch (error) {
          console.error('Migration failed:', error);
          reject(error);
        }
      }
    );
  });
}

/**
 * Rollback: Remove AI metadata fields from all songs
 */
async function rollbackAIMetadataFields() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise<void>((resolve, reject) => {
    rl.question(
      'This will remove aiMetadata and suggestedTags fields from all songs. Continue? (yes/no): ',
      async (answer) => {
        rl.close();

        if (answer.toLowerCase() !== 'yes') {
          console.log('Rollback cancelled.');
          resolve();
          return;
        }

        try {
          console.log('Starting rollback...');

          const songsSnapshot = await db.collection('songs').get();
          const totalSongs = songsSnapshot.size;
          let processed = 0;
          let updated = 0;

          console.log(`Found ${totalSongs} songs to process.`);

          const batchSize = 100;
          const batches: admin.firestore.DocumentSnapshot[][] = [];

          for (let i = 0; i < songsSnapshot.docs.length; i += batchSize) {
            batches.push(songsSnapshot.docs.slice(i, i + batchSize));
          }

          for (const batch of batches) {
            const writeBatch = db.batch();

            for (const doc of batch) {
              try {
                const data = doc.data();
                if (data.metadata?.aiMetadata || data.metadata?.suggestedTags) {
                  const updateData: any = {};

                  if (data.metadata.aiMetadata) {
                    updateData['metadata.aiMetadata'] = admin.firestore.FieldValue.delete();
                  }
                  if (data.metadata.suggestedTags) {
                    updateData['metadata.suggestedTags'] = admin.firestore.FieldValue.delete();
                  }

                  writeBatch.update(doc.ref, updateData);
                  updated++;
                }

                processed++;
              } catch (error) {
                console.error(`Error processing song ${doc.id}:`, error);
                processed++;
              }
            }

            if (updated > 0) {
              await writeBatch.commit();
              console.log(
                `Processed ${processed}/${totalSongs} songs (${updated} updated)`
              );
            }
          }

          console.log('\nRollback completed!');
          console.log(`Total songs: ${totalSongs}`);
          console.log(`Updated: ${updated}`);

          resolve();
        } catch (error) {
          console.error('Rollback failed:', error);
          reject(error);
        }
      }
    );
  });
}

// Main execution
const command = process.argv[2];

if (command === 'rollback') {
  rollbackAIMetadataFields()
    .then(() => {
      console.log('Rollback script finished.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Rollback script failed:', error);
      process.exit(1);
    });
} else {
  addAIMetadataFields()
    .then(() => {
      console.log('Migration script finished.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}


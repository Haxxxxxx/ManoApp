/**
 * Split-Sheet Generation API
 * 
 * Firebase Function endpoint for generating split-sheets
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { generateCSV, generatePDF } from '../../services/rights/splitSheetService';
import * as admin from 'firebase-admin';
import { ReleaseManifest } from '../../types/export';

const db = admin.firestore();

/**
 * Generate split-sheet
 * 
 * Request: { releaseId: string, format: 'pdf' | 'csv' }
 * Response: { data: string (base64), format: string }
 */
export const generateSplitSheet = onCall(
  {
    cors: true,
    maxInstances: 10,
  },
  async (request) => {
    try {
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const userId = request.auth.uid;
      const { releaseId, format } = request.data;

      if (!releaseId || typeof releaseId !== 'string') {
        throw new HttpsError('invalid-argument', 'releaseId is required and must be a string');
      }

      if (!format || (format !== 'pdf' && format !== 'csv')) {
        throw new HttpsError('invalid-argument', 'format must be "pdf" or "csv"');
      }

      // Get release
      const releaseDoc = await db.collection('releases').doc(releaseId).get();
      if (!releaseDoc.exists) {
        throw new HttpsError('not-found', 'Release not found');
      }

      const releaseData = releaseDoc.data();
      if (!releaseData) {
        throw new HttpsError('not-found', 'Release data not found');
      }

      // Verify access
      if (releaseData.userId !== userId) {
        if (releaseData.projectId) {
          const tripDoc = await db.collection('trips').doc(releaseData.projectId).get();
          const tripData = tripDoc.data();
          const collaborators = tripData?.collaborators || [];

          if (!collaborators.includes(userId)) {
            throw new HttpsError('permission-denied', 'User does not have access to this release');
          }
        } else {
          throw new HttpsError('permission-denied', 'User does not have access to this release');
        }
      }

      // Build manifest (simplified - in production, fetch full manifest with tracks)
      const manifest: ReleaseManifest = {
        releaseId,
        title: releaseData.title || '',
        description: releaseData.description,
        type: releaseData.type || 'single',
        releaseDate: releaseData.releaseDate,
        tracks: [], // TODO: Fetch tracks
        rightsSplits: releaseData.rightsSplits || [],
      };

      let data: string;
      let mimeType: string;

      if (format === 'csv') {
        if (!manifest.rightsSplits || manifest.rightsSplits.length === 0) {
          throw new HttpsError('invalid-argument', 'No rights splits found for this release');
        }
        const csv = generateCSV(manifest.rightsSplits);
        data = Buffer.from(csv).toString('base64');
        mimeType = 'text/csv';
      } else {
        if (!manifest.rightsSplits || manifest.rightsSplits.length === 0) {
          throw new HttpsError('invalid-argument', 'No rights splits found for this release');
        }
        const pdfBuffer = await generatePDF(manifest, manifest.rightsSplits);
        data = pdfBuffer.toString('base64');
        mimeType = 'application/pdf';
      }

      return {
        data,
        format,
        mimeType,
        filename: `split-sheet-${releaseId}.${format}`,
      };
    } catch (error) {
      logger.error('Error generating split-sheet', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to generate split-sheet'
      );
    }
  }
);


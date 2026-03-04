# Split-Sheet Generation & Signing

## Overview

Split-sheets document the rights splits for a release, showing who owns what percentage. They can be exported as PDF or CSV and sent for electronic signature.

## Generating Split-Sheets

### From Rights Editor
1. Configure rights splits in the Rights Editor
2. Click "Export Split Sheet"
3. Choose format: PDF or CSV
4. File downloads automatically

### Formats

**PDF Format**:
- Professional layout
- Includes release info, track list, splits table
- Signature fields for each collaborator
- Suitable for legal documentation

**CSV Format**:
- Spreadsheet-friendly
- Columns: userId, userName, sharePercent, role, contact
- Easy to import into other systems

## Send for Signature

1. Click "Send for Signature" in Rights Editor
2. System creates signature record
3. Collaborators receive signing link (mock implementation)
4. Signatures tracked in database

## Signature Status

Signatures stored in `releases/{releaseId}/signatures/{signatureId}`:
- Status: `pending` | `signed`
- Signed timestamp
- Signer ID

## Mock Implementation

Current implementation is a mock. For production:
1. Integrate e-signature service (DocuSign, HelloSign, etc.)
2. Replace `mockSignService.ts` with real implementation
3. Handle signature webhooks
4. Store signed documents

## Best Practices

1. Generate split-sheets before distribution
2. Get all signatures before publishing
3. Keep signed copies for records
4. Update splits if collaborators change


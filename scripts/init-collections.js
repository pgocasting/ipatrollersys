/**
 * init-collections.js
 * ─────────────────────────────────────────────────────────────────
 * One-time Firestore collection initializer for ipatrollersys.
 * Run with: node scripts/init-collections.js
 *
 * What it does:
 *  - Creates a _metadata document in each required collection
 *    so they become visible in the Firebase console.
 *  - NEVER overwrites existing documents (uses { merge: false } check).
 *  - Safe to run multiple times.
 * ─────────────────────────────────────────────────────────────────
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Service Account ──────────────────────────────────────────────
// Download from Firebase Console → Project Settings → Service Accounts
// Save as: scripts/serviceAccountKey.json
const SERVICE_KEY_PATH = resolve(__dirname, 'serviceAccountKey.json');

if (!existsSync(SERVICE_KEY_PATH)) {
  console.error('❌ Service account key not found!');
  console.error('');
  console.error('To fix this:');
  console.error('  1. Go to https://console.firebase.google.com/project/ipatrollersys/settings/serviceaccounts/adminsdk');
  console.error('  2. Click "Generate new private key"');
  console.error('  3. Save the file as: scripts/serviceAccountKey.json');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(SERVICE_KEY_PATH, 'utf8'));

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// ── Collections to initialize ────────────────────────────────────
// Each entry: { collection, docId, data }
// Only created if the document does NOT already exist.
const COLLECTIONS_TO_INIT = [
  {
    collection: 'actionReports',
    docId: '_metadata',
    data: {
      _type: 'metadata',
      description: 'Action reports — month-based structure (e.g. 04-2026)',
      structure: 'actionReports/{MM-YYYY} → { data: [...reports] }',
      createdAt: new Date().toISOString(),
    }
  },
  {
    collection: 'incidents',
    docId: '_metadata',
    data: {
      _type: 'metadata',
      description: 'Incident reports collection',
      structure: 'incidents/{docId} → { date, incidentType, location, ... }',
      createdAt: new Date().toISOString(),
    }
  },
  {
    collection: 'weeklyReports',
    docId: '_metadata',
    data: {
      _type: 'metadata',
      description: 'Weekly reports collection (flat structure)',
      structure: 'weeklyReports/{MM_YYYY_Municipality_timestamp} → { ... }',
      createdAt: new Date().toISOString(),
    }
  },
  {
    collection: 'barangays',
    docId: '_metadata',
    data: {
      _type: 'metadata',
      description: 'Barangays list — individual documents per barangay',
      structure: 'barangays/{docId} → { name, municipality, district }',
      createdAt: new Date().toISOString(),
    }
  },
  {
    collection: 'concernTypes',
    docId: '_metadata',
    data: {
      _type: 'metadata',
      description: 'Concern types for Command Center',
      structure: 'concernTypes/{docId} → { name, description }',
      createdAt: new Date().toISOString(),
    }
  },
  {
    collection: 'userPresence',
    docId: '_metadata',
    data: {
      _type: 'metadata',
      description: 'Real-time user presence tracking',
      structure: 'userPresence/{userEmail} → { status, lastSeen, ... }',
      createdAt: new Date().toISOString(),
    }
  },
  {
    collection: 'adminAccessLogs',
    docId: '_metadata',
    data: {
      _type: 'metadata',
      description: 'Admin access audit logs',
      structure: 'adminAccessLogs/{logId} → { action, user, timestamp }',
      createdAt: new Date().toISOString(),
    }
  },
  {
    collection: 'userActivityLogs',
    docId: '_metadata',
    data: {
      _type: 'metadata',
      description: 'User activity logs',
      structure: 'userActivityLogs/{logId} → { action, user, timestamp }',
      createdAt: new Date().toISOString(),
    }
  },
  {
    collection: 'patrolData',
    docId: '_metadata',
    data: {
      _type: 'metadata',
      description: 'IPatroller patrol data — month-based with municipality subcollections',
      structure: 'patrolData/{MM-YYYY}/municipalities/{District-Municipality} → { data: [...] }',
      createdAt: new Date().toISOString(),
    }
  },
  {
    collection: 'commandCenter',
    docId: '_metadata',
    data: {
      _type: 'metadata',
      description: 'Command Center root — contains barangays, concernTypes docs and weeklyReports subcollection',
      structure: 'commandCenter/barangays, commandCenter/concernTypes, commandCenter/weeklyReports/{Municipality}/{Month_Year}',
      createdAt: new Date().toISOString(),
    }
  },
];

// ── Main ─────────────────────────────────────────────────────────
async function initCollections() {
  console.log('🔥 Firestore Collection Initializer — ipatrollersys');
  console.log('═'.repeat(55));
  console.log('');

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const entry of COLLECTIONS_TO_INIT) {
    const ref = db.collection(entry.collection).doc(entry.docId);
    try {
      const snap = await ref.get();
      if (snap.exists) {
        console.log(`⏭️  SKIP   ${entry.collection}/_metadata  (already exists)`);
        skipped++;
      } else {
        await ref.set(entry.data);
        console.log(`✅ CREATED ${entry.collection}/_metadata`);
        created++;
      }
    } catch (err) {
      console.error(`❌ ERROR   ${entry.collection}/_metadata — ${err.message}`);
      errors++;
    }
  }

  console.log('');
  console.log('═'.repeat(55));
  console.log(`✅ Created : ${created}`);
  console.log(`⏭️  Skipped : ${skipped}`);
  console.log(`❌ Errors  : ${errors}`);
  console.log('');
  console.log('Done! Open Firebase Console to see all collections:');
  console.log('https://console.firebase.google.com/project/ipatrollersys/firestore');
  process.exit(errors > 0 ? 1 : 0);
}

initCollections();

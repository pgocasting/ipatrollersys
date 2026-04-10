/**
 * check-data.js
 * Scans all Firestore collections and reports exactly where data lives.
 * Run with: node --input-type=module -e "import './scripts/check-data.js'"
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(resolve(__dirname, 'serviceAccountKey.json'), 'utf8'));

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function scanCollection(colRef, depth = 0) {
  const indent = '  '.repeat(depth);
  const snap = await colRef.get();
  
  const realDocs = snap.docs.filter(d => d.id !== '_metadata');
  const total = snap.docs.length;
  const real = realDocs.length;

  if (total === 0) {
    console.log(`${indent}📂 ${colRef.id || colRef.path}  (empty)`);
    return;
  }

  console.log(`${indent}📂 ${colRef.id || colRef.path}  [${real} real doc${real !== 1 ? 's' : ''} + ${total - real} metadata]`);

  for (const docSnap of snap.docs) {
    if (docSnap.id === '_metadata') continue;
    const data = docSnap.data();
    const keys = Object.keys(data);

    // Show array lengths for data arrays
    const summary = keys.map(k => {
      const v = data[k];
      if (Array.isArray(v)) return `${k}[${v.length}]`;
      if (typeof v === 'object' && v !== null && !v.toDate) return `${k}{${Object.keys(v).length}}`;
      return k;
    }).join(', ');

    console.log(`${indent}  📄 ${docSnap.id}  →  { ${summary} }`);

    // Check subcollections
    const subCols = await docSnap.ref.listCollections();
    for (const subCol of subCols) {
      await scanCollection(subCol, depth + 2);
    }
  }
}

async function main() {
  console.log('🔍 Firestore Data Scanner — ipatrollersys');
  console.log('═'.repeat(60));
  console.log('');

  const rootCols = await db.listCollections();

  for (const col of rootCols) {
    await scanCollection(col, 0);
    console.log('');
  }

  console.log('═'.repeat(60));
  console.log('✅ Scan complete');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

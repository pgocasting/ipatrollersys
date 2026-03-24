import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs/promises';
import path from 'path';

const serviceAccountPath = 'C:/Users/pgoca/Downloads/bataan-ipatroller-firebase-adminsdk-fbsvc-e2a4d4ae1d.json';

// Ensure the service account file exists
try {
  await fs.access(serviceAccountPath);
} catch (error) {
  console.error(`Error: Service account file not found at ${serviceAccountPath}`);
  console.error('Please make sure the file exists and the path is correct.');
  process.exit(1);
}

// Read the service account JSON
const serviceAccount = JSON.parse(
  await fs.readFile(serviceAccountPath, 'utf8')
);

// Initialize Firebase Admin SDK
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

/**
 * Helper to safely handle Timestamp and other special Firestore types
 */
function serializeFirestoreData(data) {
  if (!data) return data;
  
  const serialized = {};
  for (const [key, value] of Object.entries(data)) {
    // Check if it's a Firestore Timestamp (has toMillis method)
    if (value && typeof value === 'object' && typeof value.toMillis === 'function') {
      serialized[key] = {
        _datatype: 'timestamp',
        value: value.toDate().toISOString() // Or keep as toMillis() if preferred
      };
    } 
    // Check for GeoPoint
    else if (value && typeof value === 'object' && typeof value.latitude === 'number' && typeof value.longitude === 'number') {
      serialized[key] = {
        _datatype: 'geopoint',
        latitude: value.latitude,
        longitude: value.longitude
      };
    }
    // Handle DocumentReference
    else if (value && typeof value === 'object' && typeof value.path === 'string' && typeof value.firestore === 'object') {
      serialized[key] = {
        _datatype: 'reference',
        path: value.path
      };
    }
    // Handle nested arrays
    else if (Array.isArray(value)) {
       serialized[key] = value.map(item => {
           if (typeof item === 'object' && item !== null) {
               // Quick check for timestamp in array
               if (typeof item.toMillis === 'function') {
                   return { _datatype: 'timestamp', value: item.toDate().toISOString() };
               }
               // Further recursive serialization could go here if needed
               // but typically arrays don't have deep nested specials as often
               return item; 
           }
           return item;
       });
    }
    // Handle nested objects
    else if (value && typeof value === 'object' && Object.keys(value).length > 0) {
      serialized[key] = serializeFirestoreData(value);
    }
    // Primitive values
    else {
      serialized[key] = value;
    }
  }
  return serialized;
}

/**
 * Recursively fetch collection data, including subcollections.
 */
async function getCollectionData(collectionRef) {
  const collectionData = {};
  const snapshot = await collectionRef.get();
  
  console.log(`  Found ${snapshot.size} documents in ${collectionRef.path}`);

  // Fetch all documents in parallel to speed things up
  const docPromises = snapshot.docs.map(async (doc) => {
    const data = serializeFirestoreData(doc.data());
    
    // Fetch any subcollections for this document
    const subcollections = await doc.ref.listCollections();
    let subcollectionsData = null;
    
    if (subcollections.length > 0) {
      subcollectionsData = {};
      for (const subcol of subcollections) {
        console.log(`    Fetching subcollection: ${subcol.path}`);
        subcollectionsData[subcol.id] = await getCollectionData(subcol);
      }
    }
    
    return {
      id: doc.id,
      data,
      subcollections: subcollectionsData
    };
  });

  const results = await Promise.all(docPromises);
  
  for (const result of results) {
    collectionData[result.id] = result.data;
    if (result.subcollections) {
      collectionData[result.id].__subcollections__ = result.subcollections;
    }
  }
  
  return collectionData;
}

async function exportDatabase() {
  console.log('-----------------------------------');
  console.log('Starting Firestore full export...');
  console.log(`Using Service Account: ${serviceAccountPath}`);
  console.log('-----------------------------------');
  
  const exportData = {};
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputDir = path.join(process.cwd(), 'backups');
  const outputPath = path.join(outputDir, `firestore_export_${timestamp}.json`);
  
  // Ensure the backups directory exists
  try {
    await fs.mkdir(outputDir, { recursive: true });
  } catch (err) {
    console.error('Failed to create backups directory:', err);
  }

  try {
    // Get all root collections
    const collections = await db.listCollections();
    
    if (collections.length === 0) {
      console.log('No collections found in the database.');
      return;
    }

    console.log(`Found ${collections.length} root collections.`);

    for (const collection of collections) {
      console.log(`\nExporting root collection: [${collection.id}]`);
      exportData[collection.id] = await getCollectionData(collection);
    }

    await fs.writeFile(outputPath, JSON.stringify(exportData, null, 2));
    
    console.log('\n-----------------------------------');
    console.log('✅ Export completed successfully!');
    console.log(`💾 Data saved to: ${outputPath}`);
    
    // Print a quick summary
    console.log('\nCollections Exported:');
    for (const col of Object.keys(exportData)) {
      console.log(`- ${col} (${Object.keys(exportData[col]).length} docs)`);
    }

  } catch (error) {
    console.error('❌ Error during export:', error);
  } finally {
    process.exit(0);
  }
}

exportDatabase();

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  query, 
  getDocs,
  connectFirestoreEmulator,
  enableNetwork,
  disableNetwork,
  enableIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBeRQNGiuTIqFHIF7m1Z4DMhtlo9BlMQNo",
  authDomain: "ipatrollersys.firebaseapp.com",
  projectId: "ipatrollersys",
  storageBucket: "ipatrollersys.firebasestorage.app",
  messagingSenderId: "773272104147",
  appId: "1:773272104147:web:7e3266144ed23de1e6f826",
  measurementId: "G-HPK93S27LM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services with enhanced error handling
let analytics, auth, db, storage;
let connectionRetries = 0;
const MAX_RETRIES = 3;

// Enhanced Firebase initialization with retry logic
const initializeFirebaseServices = async () => {
  try {
    console.log('🔧 Initializing Firebase services...');
    
    // Initialize analytics
    try {
      analytics = getAnalytics(app);
      console.log('✅ Analytics initialized');
    } catch (error) {
      console.warn('⚠️ Analytics initialization failed:', error.message);
      analytics = null;
    }

    // Initialize auth
    try {
      auth = getAuth(app);
      console.log('✅ Auth initialized');
    } catch (error) {
      console.error('❌ Auth initialization failed:', error.message);
      auth = null;
    }

    // Initialize Firestore with enhanced settings
    try {
      db = getFirestore(app);
      
      // Enable offline persistence with unlimited cache
      try {
        await enableIndexedDbPersistence(db, {
          synchronizeTabs: true
        });
        console.log('✅ Firestore offline persistence enabled');
      } catch (persistenceError) {
        if (persistenceError.code === 'failed-precondition') {
          console.warn('⚠️ Multiple tabs open, persistence disabled');
        } else if (persistenceError.code === 'unimplemented') {
          console.warn('⚠️ Browser doesn\'t support persistence');
        } else {
          console.warn('⚠️ Persistence setup failed:', persistenceError.message);
        }
      }

      console.log('✅ Firestore initialized');
    } catch (error) {
      console.error('❌ Firestore initialization failed:', error.message);
      db = null;
    }

    // Initialize storage
    try {
      storage = getStorage(app);
      console.log('✅ Storage initialized');
    } catch (error) {
      console.warn('⚠️ Storage initialization failed:', error.message);
      storage = null;
    }

    console.log('✅ Firebase services initialization completed');
    return true;
  } catch (error) {
    console.error('❌ Firebase services initialization failed:', error);
    return false;
  }
};

// Enhanced connection test with retry logic
const testFirebaseConnection = async () => {
  try {
    console.log('🔧 Testing Firebase connection...');
    console.log('✅ Firebase app initialized:', app.name);
    
    if (auth) {
      console.log('✅ Auth service initialized:', auth.app.name);
    } else {
      console.warn('⚠️ Auth service not available');
    }
    
    if (db) {
      console.log('✅ Firestore service initialized:', db.app.name);
    } else {
      console.warn('⚠️ Firestore service not available');
    }
    
    console.log('✅ Project ID:', firebaseConfig.projectId);
    console.log('✅ Auth Domain:', firebaseConfig.authDomain);
    
    // Test Firestore connection specifically
    if (db) {
      try {
        // Test with a simple query that shouldn't require permissions
        const testQuery = query(collection(db, '_test_connection'));
        await getDocs(testQuery);
        console.log('✅ Firestore connection test successful');
        connectionRetries = 0; // Reset retry counter on success
        return true;
      } catch (firestoreError) {
        console.warn('⚠️ Firestore connection test failed:', firestoreError.message);
        
        if (firestoreError.code === 'permission-denied') {
          console.warn('⚠️ Firestore permission denied (this is normal for new projects)');
          return true; // Consider this a successful connection
        } else if (firestoreError.code === 'unavailable' || firestoreError.code === 'deadline-exceeded') {
          console.warn('⚠️ Firestore temporarily unavailable');
          return await retryConnection();
        } else if (firestoreError.code === 'resource-exhausted') {
          console.warn('⚠️ Firestore resource exhausted, retrying...');
          return await retryConnection();
        } else {
          console.warn('⚠️ Firestore connection test failed:', firestoreError.message);
          return await retryConnection();
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
    return await retryConnection();
  }
};

// Retry connection logic
const retryConnection = async () => {
  if (connectionRetries < MAX_RETRIES) {
    connectionRetries++;
    console.log(`🔄 Retrying connection (${connectionRetries}/${MAX_RETRIES})...`);
    
    // Wait before retrying (exponential backoff)
    const delay = Math.min(1000 * Math.pow(2, connectionRetries - 1), 10000);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Try to reconnect
    try {
      if (db) {
        await enableNetwork(db);
        console.log('✅ Firestore network re-enabled');
      }
      return await testFirebaseConnection();
    } catch (retryError) {
      console.warn('⚠️ Retry failed:', retryError.message);
      return false;
    }
  } else {
    console.error('❌ Max connection retries reached');
    return false;
  }
};

// Connection health checker
const checkConnectionHealth = async () => {
  try {
    if (!db) {
      return { status: 'disconnected', message: 'Firestore not initialized' };
    }

    // Try to enable network
    await enableNetwork(db);
    
    // Test with a simple operation
    const testQuery = query(collection(db, '_health_check'));
    await getDocs(testQuery);
    
    return { status: 'connected', message: 'Connection healthy' };
  } catch (error) {
    console.warn('⚠️ Connection health check failed:', error.message);
    
    // Try to recover
    try {
      if (db) {
        await disableNetwork(db);
        await new Promise(resolve => setTimeout(resolve, 1000));
        await enableNetwork(db);
        console.log('✅ Network connection recovered');
        return { status: 'recovered', message: 'Connection recovered' };
      }
    } catch (recoveryError) {
      console.error('❌ Recovery failed:', recoveryError.message);
    }
    
    return { status: 'error', message: error.message };
  }
};

// Initialize services and run connection test
const initializeAndTest = async () => {
  const initSuccess = await initializeFirebaseServices();
  if (initSuccess) {
    await testFirebaseConnection();
  }
};

// Run initialization
initializeAndTest();

// Connection status checker
const checkFirebaseConnection = () => {
  return {
    app: !!app,
    auth: !!auth,
    db: !!db,
    storage: !!storage,
    isConnected: !!(app && auth && db),
    retryCount: connectionRetries
  };
};

// Export enhanced functions
export { 
  app, 
  analytics, 
  auth, 
  db, 
  storage, 
  testFirebaseConnection, 
  checkFirebaseConnection,
  checkConnectionHealth,
  initializeAndTest
}; 
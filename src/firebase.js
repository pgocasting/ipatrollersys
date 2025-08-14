// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, query, getDocs } from "firebase/firestore";
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

// Initialize Firebase services with error handling
let analytics, auth, db, storage;

try {
  analytics = getAnalytics(app);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  
  console.log('✅ Firebase services initialized successfully');
} catch (error) {
  console.error('❌ Error initializing Firebase services:', error);
  // Provide fallback values
  analytics = null;
  auth = null;
  db = null;
  storage = null;
}

// Test Firebase connection
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
        const testQuery = query(collection(db, '_test_connection'));
        await getDocs(testQuery);
        console.log('✅ Firestore connection test successful');
      } catch (firestoreError) {
        if (firestoreError.code === 'permission-denied') {
          console.warn('⚠️ Firestore permission denied (this is normal for new projects)');
        } else if (firestoreError.code === 'unavailable') {
          console.warn('⚠️ Firestore temporarily unavailable, retrying...');
          // Wait a bit and try again
          await new Promise(resolve => setTimeout(resolve, 2000));
          try {
            await getDocs(testQuery);
            console.log('✅ Firestore connection test successful on retry');
          } catch (retryError) {
            console.warn('⚠️ Firestore connection test failed on retry:', retryError.message);
          }
        } else {
          console.warn('⚠️ Firestore connection test failed:', firestoreError.message);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
    return false;
  }
};

// Run connection test on import
testFirebaseConnection();

// Connection status checker
const checkFirebaseConnection = () => {
  return {
    app: !!app,
    auth: !!auth,
    db: !!db,
    storage: !!storage,
    isConnected: !!(app && auth && db)
  };
};

export { app, analytics, auth, db, storage, testFirebaseConnection, checkFirebaseConnection }; 
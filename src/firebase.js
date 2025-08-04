// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
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

// Initialize Firebase services
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Test Firebase connection
const testFirebaseConnection = async () => {
  try {
    console.log('🔧 Testing Firebase connection...');
    console.log('✅ Firebase app initialized:', app.name);
    console.log('✅ Auth service initialized:', auth.app.name);
    console.log('✅ Firestore service initialized:', db.app.name);
    console.log('✅ Project ID:', firebaseConfig.projectId);
    console.log('✅ Auth Domain:', firebaseConfig.authDomain);
    return true;
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
    return false;
  }
};

// Run connection test on import
testFirebaseConnection();

export { app, analytics, auth, db, storage, testFirebaseConnection }; 
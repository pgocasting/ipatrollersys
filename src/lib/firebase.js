import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { getFirestore, initializeFirestore, memoryLocalCache } from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBeRQNGiuTIqFHIF7m1Z4DMhtlo9BlMQNo",
  authDomain: "ipatrollersys.firebaseapp.com",
  projectId: "ipatrollersys",
  storageBucket: "ipatrollersys.appspot.com",
  messagingSenderId: "773272104147",
  appId: "1:773272104147:web:7e3266144ed23de1e6f826",
  measurementId: "G-HPK93S27LM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Set default session persistence (auto-logout when browser is closed)
setPersistence(auth, browserSessionPersistence).catch((error) => {
  console.warn('Failed to set default session persistence:', error);
});

// Initialize Cloud Firestore using WebSocket (fastest) transport + in-memory cache
// NOTE: experimentalForceLongPolling was removed — long-polling is ~3-5x slower than WebSockets
export const db = initializeFirestore(app, {
  localCache: memoryLocalCache()
});

export default app;

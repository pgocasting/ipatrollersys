// Console helper functions for debugging Firebase issues
// You can copy and paste these into your browser console

// Test Firebase connection
window.testFirebase = async () => {
  console.log('🧪 Testing Firebase connection...');
  
  try {
    // Import Firebase functions dynamically
    const { checkConnectionHealth, initializeAndTest } = await import('./firebase.js');
    
    console.log('✅ Firebase modules loaded');
    
    // Test connection health
    const health = await checkConnectionHealth();
    console.log('🏥 Connection health:', health);
    
    return health;
  } catch (error) {
    console.error('❌ Firebase test failed:', error);
    return { status: 'error', message: error.message };
  }
};

// Run comprehensive diagnostics
window.runFirebaseDiagnostics = async () => {
  console.log('🔍 Running Firebase diagnostics...');
  
  try {
    const { firebaseDiagnostics } = await import('./firebaseDiagnostics.js');
    const results = await firebaseDiagnostics.runDiagnostics();
    
    console.log('📊 Diagnostics results:', results);
    
    // Display results in a formatted way
    console.group('🔍 Firebase Diagnostics Results');
    console.log('Basic Connection:', results.basic);
    console.log('Network Status:', results.network);
    console.log('Permissions:', results.permissions);
    console.log('Performance:', results.performance);
    console.log('Recommendations:', results.recommendations);
    console.groupEnd();
    
    return results;
  } catch (error) {
    console.error('❌ Diagnostics failed:', error);
    return { error: error.message };
  }
};

// Check specific Firebase services
window.checkFirebaseServices = () => {
  console.log('🔧 Checking Firebase services...');
  
  try {
    // Check if Firebase is available globally
    if (typeof window.firebase !== 'undefined') {
      console.log('✅ Firebase SDK available');
    } else {
      console.log('❌ Firebase SDK not available');
    }
    
    // Check if our Firebase instance is available
    if (window.db) {
      console.log('✅ Firestore instance available');
      console.log('Network enabled:', window.db._delegate._networkEnabled);
      console.log('Persistence enabled:', window.db._delegate._persistenceEnabled);
    } else {
      console.log('❌ Firestore instance not available');
    }
    
    // Check authentication
    if (window.auth) {
      console.log('✅ Auth instance available');
      console.log('Current user:', window.auth.currentUser);
    } else {
      console.log('❌ Auth instance not available');
    }
    
  } catch (error) {
    console.error('❌ Service check failed:', error);
  }
};

// Test specific Firestore operations
window.testFirestoreOperations = async () => {
  console.log('🧪 Testing Firestore operations...');
  
  try {
    if (!window.db) {
      throw new Error('Firestore not available');
    }
    
    const { collection, query, getDocs } = await import('firebase/firestore');
    
    // Test 1: Basic collection query
    console.log('Testing basic collection query...');
    const testQuery = query(collection(window.db, '_test_collection'));
    const snapshot = await getDocs(testQuery);
    console.log('✅ Basic query successful, docs count:', snapshot.size);
    
    // Test 2: Network connectivity
    console.log('Testing network connectivity...');
    const startTime = performance.now();
    await getDocs(testQuery);
    const endTime = performance.now();
    console.log(`✅ Network test successful, response time: ${(endTime - startTime).toFixed(2)}ms`);
    
    return { success: true, responseTime: (endTime - startTime).toFixed(2) };
    
  } catch (error) {
    console.error('❌ Firestore operations test failed:', error);
    console.log('Error code:', error.code);
    console.log('Error message:', error.message);
    
    // Provide specific suggestions based on error
    if (error.code === 'permission-denied') {
      console.log('💡 Suggestion: Check Firestore security rules');
    } else if (error.code === 'unavailable') {
      console.log('💡 Suggestion: Check internet connection and Firebase service status');
    } else if (error.code === 'deadline-exceeded') {
      console.log('💡 Suggestion: Network timeout, check connection quality');
    }
    
    return { success: false, error: error.message, code: error.code };
  }
};

// Force Firebase reconnection
window.forceFirebaseReconnect = async () => {
  console.log('🔄 Forcing Firebase reconnection...');
  
  try {
    const { initializeAndTest } = await import('./firebase.js');
    
    await initializeAndTest();
    console.log('✅ Firebase reconnection completed');
    
    // Test connection after reconnection
    const health = await window.testFirebase();
    console.log('🏥 Post-reconnection health:', health);
    
    return health;
  } catch (error) {
    console.error('❌ Force reconnection failed:', error);
    return { status: 'error', message: error.message };
  }
};

// Monitor Firebase connection in real-time
window.monitorFirebaseConnection = (intervalMs = 5000) => {
  console.log(`📡 Starting Firebase connection monitoring (${intervalMs}ms intervals)...`);
  
  const intervalId = setInterval(async () => {
    try {
      const health = await window.testFirebase();
      const timestamp = new Date().toLocaleTimeString();
      
      console.log(`[${timestamp}] Connection status:`, health.status);
      
      if (health.status !== 'connected') {
        console.warn(`⚠️ Connection issue detected at ${timestamp}:`, health.message);
      }
      
    } catch (error) {
      console.error(`❌ Monitoring check failed at ${new Date().toLocaleTimeString()}:`, error);
    }
  }, intervalMs);
  
  // Store interval ID for stopping
  window.firebaseMonitoringInterval = intervalId;
  
  console.log('✅ Monitoring started. Use window.stopFirebaseMonitoring() to stop.');
  
  return intervalId;
};

// Stop Firebase connection monitoring
window.stopFirebaseMonitoring = () => {
  if (window.firebaseMonitoringInterval) {
    clearInterval(window.firebaseMonitoringInterval);
    window.firebaseMonitoringInterval = null;
    console.log('🛑 Firebase connection monitoring stopped');
  } else {
    console.log('ℹ️ No active monitoring to stop');
  }
};

// Get Firebase configuration info
window.getFirebaseConfig = () => {
  console.log('⚙️ Firebase Configuration:');
  
  try {
    // Try to access config from our firebase.js
    if (window.firebaseConfig) {
      console.log('Project ID:', window.firebaseConfig.projectId);
      console.log('Auth Domain:', window.firebaseConfig.authDomain);
      console.log('API Key:', window.firebaseConfig.apiKey ? '✅ Available' : '❌ Missing');
      console.log('Storage Bucket:', window.firebaseConfig.storageBucket);
      console.log('Messaging Sender ID:', window.firebaseConfig.messagingSenderId);
      console.log('App ID:', window.firebaseConfig.appId);
    } else {
      console.log('❌ Firebase config not accessible');
    }
    
    // Check if Firebase is initialized
    if (window.firebase && window.firebase.apps && window.firebase.apps.length > 0) {
      const app = window.firebase.apps[0];
      console.log('Firebase App Name:', app.name);
      console.log('Firebase App Options:', app.options);
    } else {
      console.log('❌ Firebase app not initialized');
    }
    
  } catch (error) {
    console.error('❌ Error getting Firebase config:', error);
  }
};

// Display all available console helpers
window.showFirebaseHelpers = () => {
  console.log('🔧 Available Firebase Console Helpers:');
  console.log('• window.testFirebase() - Test basic connection');
  console.log('• window.runFirebaseDiagnostics() - Run comprehensive diagnostics');
  console.log('• window.checkFirebaseServices() - Check service availability');
  console.log('• window.testFirestoreOperations() - Test Firestore operations');
  console.log('• window.forceFirebaseReconnect() - Force reconnection');
  console.log('• window.monitorFirebaseConnection(intervalMs) - Monitor connection');
  console.log('• window.stopFirebaseMonitoring() - Stop monitoring');
  console.log('• window.getFirebaseConfig() - Get configuration info');
  console.log('• window.showFirebaseHelpers() - Show this help');
};

// Auto-run helpers setup
console.log('🚀 Firebase Console Helpers loaded!');
console.log('Type window.showFirebaseHelpers() to see available commands');
console.log('Type window.testFirebase() to start debugging');

export default {
  testFirebase: window.testFirebase,
  runFirebaseDiagnostics: window.runFirebaseDiagnostics,
  checkFirebaseServices: window.checkFirebaseServices,
  testFirestoreOperations: window.testFirestoreOperations,
  forceFirebaseReconnect: window.forceFirebaseReconnect,
  monitorFirebaseConnection: window.monitorFirebaseConnection,
  stopFirebaseMonitoring: window.stopFirebaseMonitoring,
  getFirebaseConfig: window.getFirebaseConfig,
  showFirebaseHelpers: window.showFirebaseHelpers
};

// Firebase utility functions for connection management and error handling

import { 
  enableNetwork, 
  disableNetwork, 
  collection, 
  query, 
  getDocs,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  connectFirestoreEmulator
} from 'firebase/firestore';
import { db } from '../firebase';

// Connection recovery utilities
export const firebaseUtils = {
  // Test if Firestore is accessible
  async testConnection() {
    try {
      if (!db) {
        throw new Error('Firestore not initialized');
      }

      // Try to enable network
      await enableNetwork(db);
      
      // Test with a simple query
      const testQuery = query(collection(db, '_connection_test'));
      await getDocs(testQuery);
      
      return { success: true, message: 'Connection successful' };
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return { success: false, error: error.message, code: error.code };
    }
  },

  // Attempt to recover connection
  async recoverConnection() {
    try {
      if (!db) {
        throw new Error('Firestore not initialized');
      }

      console.log('🔧 Attempting connection recovery...');
      
      // Disable network first
      await disableNetwork(db);
      console.log('✅ Network disabled');
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Re-enable network
      await enableNetwork(db);
      console.log('✅ Network re-enabled');
      
      // Test connection
      const testResult = await this.testConnection();
      
      if (testResult.success) {
        console.log('✅ Connection recovered successfully');
        return { success: true, message: 'Connection recovered' };
      } else {
        throw new Error(testResult.error);
      }
    } catch (error) {
      console.error('❌ Connection recovery failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Safe Firestore operations with retry logic
  async safeOperation(operation, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Test connection before operation
        const connectionTest = await this.testConnection();
        if (!connectionTest.success) {
          console.log(`⚠️ Connection test failed on attempt ${attempt}, trying to recover...`);
          await this.recoverConnection();
        }
        
        // Execute the operation
        const result = await operation();
        return { success: true, data: result };
        
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Operation failed on attempt ${attempt}/${maxRetries}:`, error.message);
        
        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Try to recover connection
          await this.recoverConnection();
        }
      }
    }
    
    return { success: false, error: lastError.message, attempts: maxRetries };
  },

  // Safe document operations
  async safeGetDocs(collectionRef, options = {}) {
    return this.safeOperation(async () => {
      const q = options.query || query(collectionRef);
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
  },

  async safeSetDoc(docRef, data) {
    return this.safeOperation(async () => {
      await setDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    });
  },

  async safeUpdateDoc(docRef, updates) {
    return this.safeOperation(async () => {
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    });
  },

  async safeDeleteDoc(docRef) {
    return this.safeOperation(async () => {
      await deleteDoc(docRef);
      return { success: true };
    });
  },

  // Batch operations with safety
  async safeBatchOperation(operations) {
    return this.safeOperation(async () => {
      const batch = writeBatch(db);
      
      operations.forEach(({ type, ref, data }) => {
        switch (type) {
          case 'set':
            batch.set(ref, data);
            break;
          case 'update':
            batch.update(ref, data);
            break;
          case 'delete':
            batch.delete(ref);
            break;
          default:
            throw new Error(`Unknown operation type: ${type}`);
        }
      });
      
      await batch.commit();
      return { success: true };
    });
  },

  // Monitor connection health
  async monitorConnectionHealth() {
    try {
      const testResult = await this.testConnection();
      
      if (testResult.success) {
        return { status: 'healthy', message: 'Connection is working properly' };
      } else {
        // Try to recover
        const recoveryResult = await this.recoverConnection();
        
        if (recoveryResult.success) {
          return { status: 'recovered', message: 'Connection was recovered' };
        } else {
          return { status: 'unhealthy', message: recoveryResult.error };
        }
      }
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  },

  // Get connection statistics
  getConnectionStats() {
    return {
      timestamp: new Date().toISOString(),
      dbInitialized: !!db,
      networkEnabled: db ? db._delegate._networkEnabled : false,
      persistenceEnabled: db ? db._delegate._persistenceEnabled : false
    };
  }
};

// Error handling utilities
export const handleFirebaseError = (error) => {
  console.error('🔥 Firebase error occurred:', error);
  
  // Common error codes and their meanings
  const errorMessages = {
    'permission-denied': 'Access denied. Please check your permissions.',
    'unauthenticated': 'Please log in to continue.',
    'unavailable': 'Service temporarily unavailable. Please try again.',
    'deadline-exceeded': 'Request timed out. Please try again.',
    'resource-exhausted': 'Service quota exceeded. Please try again later.',
    'failed-precondition': 'Operation cannot be completed in current state.',
    'aborted': 'Operation was aborted. Please try again.',
    'out-of-range': 'Requested data is out of range.',
    'unimplemented': 'Operation not implemented.',
    'internal': 'Internal error occurred. Please try again.',
    'data-loss': 'Data loss occurred. Please check your data.',
    'unknown': 'An unknown error occurred. Please try again.'
  };

  const message = errorMessages[error.code] || error.message || 'An unexpected error occurred';
  
  return {
    code: error.code || 'unknown',
    message,
    originalError: error,
    timestamp: new Date().toISOString()
  };
};

// Retry utilities
export const withRetry = async (operation, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        console.log(`⚠️ Operation failed, retrying in ${delay}ms... (${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }
  
  throw lastError;
};

export default firebaseUtils;

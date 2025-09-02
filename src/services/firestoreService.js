import {
  collection,
  query,
  onSnapshot,
  orderBy,
  limit,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  addDoc,
  serverTimestamp,
  enableIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED
} from 'firebase/firestore';
import { db } from '../firebase';

class FirestoreService {
  constructor() {
    this.db = db;
    this.connectionStatus = 'connecting';
    this.retryAttempts = 0;
    this.maxRetries = 3;
    this.initializeService();
  }

  async initializeService() {
    try {
      // Enable offline persistence
      await enableIndexedDbPersistence(this.db, {
        synchronizeTabs: true
      });
      this.connectionStatus = 'connected';
      console.log('✅ Firestore service initialized with offline persistence');
    } catch (error) {
      if (error.code === 'failed-precondition') {
        console.warn('⚠️ Multiple tabs open, persistence disabled');
        this.connectionStatus = 'connected';
      } else if (error.code === 'unimplemented') {
        console.warn('⚠️ Browser doesn\'t support persistence');
        this.connectionStatus = 'connected';
      } else {
        console.error('❌ Firestore service initialization failed:', error);
        this.connectionStatus = 'error';
      }
    }
  }

  // Connection status
  getConnectionStatus() {
    return this.connectionStatus;
  }

  // Test connection
  async testConnection() {
    try {
      const testQuery = query(collection(this.db, '_test_connection'));
      await getDocs(testQuery);
      this.connectionStatus = 'connected';
      return { success: true, status: 'connected' };
    } catch (error) {
      if (error.code === 'permission-denied') {
        // This is normal for new projects
        this.connectionStatus = 'connected';
        return { success: true, status: 'connected' };
      }
      this.connectionStatus = 'error';
      return { success: false, error: error.message };
    }
  }

  // Generic document operations
  async getDocument(collectionName, documentId) {
    try {
      const docRef = doc(this.db, collectionName, documentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
      } else {
        return { success: true, data: null };
      }
    } catch (error) {
      console.error(`❌ Error getting document ${collectionName}/${documentId}:`, error);
      return { success: false, error: error.message };
    }
  }

  async setDocument(collectionName, documentId, data) {
    try {
      const docRef = doc(this.db, collectionName, documentId);
      await setDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error(`❌ Error setting document ${collectionName}/${documentId}:`, error);
      return { success: false, error: error.message };
    }
  }

  async updateDocument(collectionName, documentId, updates) {
    try {
      const docRef = doc(this.db, collectionName, documentId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error(`❌ Error updating document ${collectionName}/${documentId}:`, error);
      return { success: false, error: error.message };
    }
  }

  async deleteDocument(collectionName, documentId) {
    try {
      const docRef = doc(this.db, collectionName, documentId);
      await deleteDoc(docRef);
      return { success: true };
    } catch (error) {
      console.error(`❌ Error deleting document ${collectionName}/${documentId}:`, error);
      return { success: false, error: error.message };
    }
  }

  async addDocument(collectionName, data) {
    try {
      const docRef = await addDoc(collection(this.db, collectionName), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error(`❌ Error adding document to ${collectionName}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Query operations
  async queryDocuments(collectionName, constraints = []) {
    try {
      let q = collection(this.db, collectionName);
      
      // Apply constraints
      constraints.forEach(constraint => {
        if (constraint.type === 'where') {
          q = query(q, where(constraint.field, constraint.operator, constraint.value));
        } else if (constraint.type === 'orderBy') {
          q = query(q, orderBy(constraint.field, constraint.direction || 'asc'));
        } else if (constraint.type === 'limit') {
          q = query(q, limit(constraint.value));
        }
      });

      const querySnapshot = await getDocs(q);
      const documents = [];
      
      querySnapshot.forEach((doc) => {
        documents.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return { success: true, data: documents };
    } catch (error) {
      console.error(`❌ Error querying collection ${collectionName}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Real-time listeners
  subscribeToCollection(collectionName, constraints = [], callback) {
    try {
      let q = collection(this.db, collectionName);
      
      // Apply constraints
      constraints.forEach(constraint => {
        if (constraint.type === 'where') {
          q = query(q, where(constraint.field, constraint.operator, constraint.value));
        } else if (constraint.type === 'orderBy') {
          q = query(q, orderBy(constraint.field, constraint.direction || 'asc'));
        } else if (constraint.type === 'limit') {
          q = query(q, limit(constraint.value));
        }
      });

      return onSnapshot(q, (snapshot) => {
        const documents = [];
        snapshot.forEach((doc) => {
          documents.push({
            id: doc.id,
            ...doc.data()
          });
        });
        callback({ success: true, data: documents });
      }, (error) => {
        console.error(`❌ Error in collection subscription ${collectionName}:`, error);
        callback({ success: false, error: error.message });
      });
    } catch (error) {
      console.error(`❌ Error setting up collection subscription ${collectionName}:`, error);
      callback({ success: false, error: error.message });
      return null;
    }
  }

  // Batch operations
  async executeBatch(operations) {
    try {
      const batch = writeBatch(this.db);
      
      operations.forEach(operation => {
        if (operation.type === 'set') {
          const docRef = doc(this.db, operation.collection, operation.id);
          batch.set(docRef, operation.data);
        } else if (operation.type === 'update') {
          const docRef = doc(this.db, operation.collection, operation.id);
          batch.update(docRef, operation.data);
        } else if (operation.type === 'delete') {
          const docRef = doc(this.db, operation.collection, operation.id);
          batch.delete(docRef);
        }
      });

      await batch.commit();
      return { success: true };
    } catch (error) {
      console.error('❌ Error executing batch operation:', error);
      return { success: false, error: error.message };
    }
  }

  // Month-based structure methods for action reports
  async getActionReportsByMonth(monthKey) {
    try {
      const result = await this.getDocument('actionReports', monthKey);
      if (result.success && result.data) {
        return { success: true, data: result.data.data || [] };
      }
      return { success: true, data: [] };
    } catch (error) {
      console.error(`❌ Error getting action reports for month ${monthKey}:`, error);
      return { success: false, error: error.message };
    }
  }

  async saveActionReport(actionReport) {
    try {
      // Generate month key from the report date
      const reportDate = actionReport.when ? new Date(actionReport.when) : new Date();
      const monthKey = `${String(reportDate.getMonth() + 1).padStart(2, '0')}-${reportDate.getFullYear()}`;
      
      // Get existing reports for this month
      const existingResult = await this.getDocument('actionReports', monthKey);
      let existingReports = [];
      
      if (existingResult.success && existingResult.data) {
        existingReports = existingResult.data.data || [];
      }

      if (actionReport.id) {
        // Update existing report
        const reportIndex = existingReports.findIndex(r => r.id === actionReport.id);
        if (reportIndex !== -1) {
          existingReports[reportIndex] = {
            ...actionReport,
            updatedAt: new Date().toISOString()
          };
        }
      } else {
        // Add new report
        const newReport = {
          ...actionReport,
          id: `report_${Date.now()}_${Math.random().toString(36).substring(2)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        existingReports.push(newReport);
      }

      // Save the updated month document
      const saveResult = await this.setDocument('actionReports', monthKey, {
        data: existingReports,
        monthKey: monthKey,
        totalReports: existingReports.length,
        lastUpdated: new Date().toISOString(),
        metadata: {
          year: reportDate.getFullYear(),
          month: reportDate.getMonth() + 1,
          districts: [...new Set(existingReports.map(r => r.district).filter(Boolean))],
          municipalities: [...new Set(existingReports.map(r => r.municipality).filter(Boolean))]
        }
      });

      if (saveResult.success) {
        return { success: true, monthKey, reportCount: existingReports.length };
      } else {
        return { success: false, error: saveResult.error };
      }
    } catch (error) {
      console.error('❌ Error saving action report:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteActionReport(reportId, monthKey) {
    try {
      // Get existing reports for this month
      const existingResult = await this.getDocument('actionReports', monthKey);
      if (!existingResult.success || !existingResult.data) {
        return { success: false, error: 'Month document not found' };
      }

      let existingReports = existingResult.data.data || [];
      
      // Remove the report
      existingReports = existingReports.filter(r => r.id !== reportId);

      // Update the month document
      const updateResult = await this.setDocument('actionReports', monthKey, {
        data: existingReports,
        monthKey: monthKey,
        totalReports: existingReports.length,
        lastUpdated: new Date().toISOString(),
        metadata: {
          year: parseInt(monthKey.split('-')[1]),
          month: parseInt(monthKey.split('-')[0]),
          districts: [...new Set(existingReports.map(r => r.district).filter(Boolean))],
          municipalities: [...new Set(existingReports.map(r => r.municipality).filter(Boolean))]
        }
      });

      if (updateResult.success) {
        return { success: true, monthKey, reportCount: existingReports.length };
      } else {
        return { success: false, error: updateResult.error };
      }
    } catch (error) {
      console.error('❌ Error deleting action report:', error);
      return { success: false, error: error.message };
    }
  }

  async getAllActionReportsMonths() {
    try {
      const result = await this.queryDocuments('actionReports');
      if (result.success) {
        // Filter out documents that don't have a valid monthKey
        const validMonthDocuments = result.data.filter(doc => {
          return doc.monthKey && 
                 typeof doc.monthKey === 'string' && 
                 doc.monthKey.includes('-') &&
                 doc.monthKey.split('-').length === 2;
        });

        if (validMonthDocuments.length === 0) {
          console.log('ℹ️ No valid month-based action report documents found');
          return { success: true, data: [] };
        }

        // Sort by month key (MM-YYYY format)
        const sortedMonths = validMonthDocuments.sort((a, b) => {
          try {
            const [monthA, yearA] = a.monthKey.split('-').map(Number);
            const [monthB, yearB] = b.monthKey.split('-').map(Number);
            
            if (yearA !== yearB) return yearB - yearA;
            return monthB - monthA;
          } catch (sortError) {
            console.warn('⚠️ Error sorting month:', sortError, 'for documents:', a.monthKey, b.monthKey);
            return 0; // Keep original order if sorting fails
          }
        });
        
        console.log(`✅ Found ${validMonthDocuments.length} valid month-based action report documents`);
        return { success: true, data: sortedMonths };
      }
      return { success: false, error: result.error };
    } catch (error) {
      console.error('❌ Error getting all action report months:', error);
      return { success: false, error: error.message };
    }
  }

  // Specific business logic methods for patrol data
  async getPatrolData(monthKey) {
    return await this.getDocument('patrolData', monthKey);
  }

  async savePatrolData(monthKey, data, userId) {
    return await this.setDocument('patrolData', monthKey, {
      data: data,
      userId: userId,
      monthKey: monthKey,
      lastUpdated: new Date().toISOString()
    });
  }

  async clearPatrolData(monthKey, year = null) {
    try {
      if (year) {
        // Clear all months for a specific year
        const months = [
          { name: "January", monthIndex: 0 },
          { name: "February", monthIndex: 1 },
          { name: "March", monthIndex: 2 },
          { name: "April", monthIndex: 3 },
          { name: "May", monthIndex: 4 },
          { name: "June", monthIndex: 5 },
          { name: "July", monthIndex: 6 },
          { name: "August", monthIndex: 7 },
          { name: "September", monthIndex: 8 },
          { name: "October", monthIndex: 9 },
          { name: "November", monthIndex: 10 },
          { name: "December", monthIndex: 11 },
        ];
        
        const batch = writeBatch(this.db);
        let clearedMonths = 0;
        
        for (const month of months) {
          const monthYearId = `${String(month.monthIndex + 1).padStart(2, "0")}-${year}`;
          try {
            // Delete the month-year document
            const monthYearDocRef = doc(this.db, "patrolData", monthYearId);
            batch.delete(monthYearDocRef);
            clearedMonths++;
          } catch (error) {
            console.warn(`Could not clear ${month.name} data:`, error);
          }
        }
        
        await batch.commit();
        return { success: true, clearedMonths, year };
      } else {
        // Clear only the specific month
        const result = await this.deleteDocument('patrolData', monthKey);
        return { success: result.success, monthKey };
      }
    } catch (error) {
      console.error('❌ Error clearing patrol data:', error);
      return { success: false, error: error.message };
    }
  }

  async getIncidents(limit = 50) {
    return await this.queryDocuments('incidents', [
      { type: 'orderBy', field: 'date', direction: 'desc' },
      { type: 'limit', value: limit }
    ]);
  }

  async getUsers() {
    const result = await this.getDocument('users', 'management');
    if (result.success && result.data) {
      return { success: true, data: result.data.users || [] };
    }
    return { success: true, data: [] };
  }

  async saveUsers(users, updatedBy) {
    return await this.setDocument('users', 'management', {
      users: users,
      updatedBy: updatedBy,
      lastUpdated: new Date().toISOString()
    });
  }

  // Migration function to convert individual action reports to monthly documents
  async migrateActionReportsToMonthly() {
    try {
      console.log('🔄 Starting migration of individual action reports to monthly structure...');
      
      // Get all documents from actionReports collection
      const result = await this.queryDocuments('actionReports');
      if (!result.success) {
        return { success: false, error: result.error };
      }

      const allDocuments = result.data;
      console.log(`📊 Found ${allDocuments.length} total documents in actionReports collection`);

      // Separate individual reports from monthly documents
      const individualReports = allDocuments.filter(doc => 
        doc.id.startsWith('action-') && !doc.monthKey
      );
      const monthlyDocuments = allDocuments.filter(doc => 
        doc.monthKey && doc.monthKey.includes('-')
      );

      console.log(`📋 Found ${individualReports.length} individual reports to migrate`);
      console.log(`📅 Found ${monthlyDocuments.length} existing monthly documents`);

      if (individualReports.length === 0) {
        return { success: true, message: 'No individual reports found to migrate', migrated: 0 };
      }

      // Group individual reports by month
      const reportsByMonth = {};
      let processedReports = 0;

      for (const report of individualReports) {
        try {
          let reportDate;
          
          // Try to parse the date from different possible formats
          if (report.when) {
            if (typeof report.when === 'string') {
              reportDate = new Date(report.when);
            } else if (report.when.seconds) {
              // Firestore timestamp
              reportDate = new Date(report.when.seconds * 1000);
            } else if (report.when instanceof Date) {
              reportDate = report.when;
            }
          }
          
          // If no valid date, use current date
          if (!reportDate || isNaN(reportDate.getTime())) {
            reportDate = new Date();
            console.warn(`⚠️ Invalid date for report ${report.id}, using current date`);
          }
          
          const monthKey = `${String(reportDate.getMonth() + 1).padStart(2, '0')}-${reportDate.getFullYear()}`;
          
          if (!reportsByMonth[monthKey]) {
            reportsByMonth[monthKey] = [];
          }
          
          // Clean up the report data
          const cleanReport = {
            ...report,
            id: report.id, // Keep original ID
            when: reportDate.toISOString(), // Normalize date
            migratedAt: new Date().toISOString()
          };
          
          reportsByMonth[monthKey].push(cleanReport);
          processedReports++;
          
        } catch (error) {
          console.error(`❌ Error processing report ${report.id}:`, error);
        }
      }

      console.log(`📅 Grouped reports into ${Object.keys(reportsByMonth).length} months:`, Object.keys(reportsByMonth));

      // Create or update monthly documents
      let migratedCount = 0;
      const batch = writeBatch(this.db);

      for (const [monthKey, reports] of Object.entries(reportsByMonth)) {
        try {
          // Check if monthly document already exists
          const existingResult = await this.getDocument('actionReports', monthKey);
          let existingReports = [];
          
          if (existingResult.success && existingResult.data) {
            existingReports = existingResult.data.data || [];
            console.log(`📄 Month ${monthKey} already exists with ${existingReports.length} reports`);
          }

          // Merge with existing reports (avoid duplicates)
          const existingIds = new Set(existingReports.map(r => r.id));
          const newReports = reports.filter(r => !existingIds.has(r.id));
          
          if (newReports.length > 0) {
            const allReports = [...existingReports, ...newReports];
            
            const monthData = {
              data: allReports,
              monthKey: monthKey,
              totalReports: allReports.length,
              lastUpdated: new Date().toISOString(),
              metadata: {
                year: parseInt(monthKey.split('-')[1]),
                month: parseInt(monthKey.split('-')[0]),
                districts: [...new Set(allReports.map(r => r.district).filter(Boolean))],
                municipalities: [...new Set(allReports.map(r => r.municipality).filter(Boolean))],
                departments: [...new Set(allReports.map(r => r.department).filter(Boolean))]
              }
            };

            // Add to batch
            const docRef = doc(this.db, 'actionReports', monthKey);
            batch.set(docRef, monthData);
            
            migratedCount += newReports.length;
            console.log(`✅ Prepared ${newReports.length} reports for month ${monthKey} (total: ${allReports.length})`);
          } else {
            console.log(`ℹ️ No new reports to add to month ${monthKey}`);
          }
          
        } catch (monthError) {
          console.error(`❌ Error preparing month ${monthKey}:`, monthError);
        }
      }

      // Commit the batch
      if (migratedCount > 0) {
        await batch.commit();
        console.log(`✅ Successfully migrated ${migratedCount} reports to monthly structure`);
      }

      // Delete individual reports after successful migration
      if (migratedCount > 0) {
        const deleteBatch = writeBatch(this.db);
        let deletedCount = 0;
        
        for (const report of individualReports) {
          try {
            const docRef = doc(this.db, 'actionReports', report.id);
            deleteBatch.delete(docRef);
            deletedCount++;
          } catch (error) {
            console.error(`❌ Error deleting report ${report.id}:`, error);
          }
        }
        
        if (deletedCount > 0) {
          await deleteBatch.commit();
          console.log(`🗑️ Deleted ${deletedCount} individual reports after migration`);
        }
      }

      return { 
        success: true, 
        migrated: migratedCount,
        months: Object.keys(reportsByMonth).length,
        message: `Successfully migrated ${migratedCount} reports to ${Object.keys(reportsByMonth).length} monthly documents`
      };

    } catch (error) {
      console.error('❌ Error during migration:', error);
      return { success: false, error: error.message };
    }
  }

  // Health check
  async healthCheck() {
    try {
      const testQuery = query(collection(this.db, '_health_check'));
      await getDocs(testQuery);
      return { success: true, status: 'healthy' };
    } catch (error) {
      if (error.code === 'permission-denied') {
        return { success: true, status: 'healthy' };
      }
      return { success: false, status: 'unhealthy', error: error.message };
    }
  }
}

// Create singleton instance
const firestoreService = new FirestoreService();

export default firestoreService;

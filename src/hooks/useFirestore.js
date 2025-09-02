import { useState, useEffect, useCallback } from 'react';
import firestoreService from '../services/firestoreService';

export const useFirestore = () => {
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  useEffect(() => {
    const testConnection = async () => {
      const result = await firestoreService.testConnection();
      setConnectionStatus(result.status || 'error');
    };
    testConnection();
  }, []);

  // Connection management
  const getConnectionStatus = useCallback(() => {
    return firestoreService.getConnectionStatus();
  }, []);

  const testConnection = useCallback(async () => {
    const result = await firestoreService.testConnection();
    setConnectionStatus(result.status || 'error');
    return result;
  }, []);

  const healthCheck = useCallback(async () => {
    return await firestoreService.healthCheck();
  }, []);

  // Generic document operations
  const getDocument = useCallback(async (collectionName, documentId) => {
    return await firestoreService.getDocument(collectionName, documentId);
  }, []);

  const setDocument = useCallback(async (collectionName, documentId, data) => {
    return await firestoreService.setDocument(collectionName, documentId, data);
  }, []);

  const updateDocument = useCallback(async (collectionName, documentId, updates) => {
    return await firestoreService.updateDocument(collectionName, documentId, updates);
  }, []);

  const deleteDocument = useCallback(async (collectionName, documentId) => {
    return await firestoreService.deleteDocument(collectionName, documentId);
  }, []);

  const addDocument = useCallback(async (collectionName, data) => {
    return await firestoreService.addDocument(collectionName, data);
  }, []);

  // Query operations
  const queryDocuments = useCallback(async (collectionName, constraints = []) => {
    return await firestoreService.queryDocuments(collectionName, constraints);
  }, []);

  // Real-time subscriptions
  const subscribeToCollection = useCallback((collectionName, constraints = [], callback) => {
    return firestoreService.subscribeToCollection(collectionName, constraints, callback);
  }, []);

  // Batch operations
  const executeBatch = useCallback(async (operations) => {
    return await firestoreService.executeBatch(operations);
  }, []);

  // Action Reports - Month-based structure
  const getActionReportsByMonth = useCallback(async (monthKey) => {
    return await firestoreService.getActionReportsByMonth(monthKey);
  }, []);

  const saveActionReport = useCallback(async (actionReport) => {
    return await firestoreService.saveActionReport(actionReport);
  }, []);

  const deleteActionReport = useCallback(async (reportId, monthKey) => {
    return await firestoreService.deleteActionReport(reportId, monthKey);
  }, []);

  const getAllActionReportsMonths = useCallback(async () => {
    return await firestoreService.getAllActionReportsMonths();
  }, []);

  // Patrol Data
  const getPatrolData = useCallback(async (monthKey) => {
    return await firestoreService.getPatrolData(monthKey);
  }, []);

  const savePatrolData = useCallback(async (monthKey, data, userId) => {
    return await firestoreService.savePatrolData(monthKey, data, userId);
  }, []);

  const clearPatrolData = useCallback(async (monthKey, year = null) => {
    return await firestoreService.clearPatrolData(monthKey, year);
  }, []);

  // Incidents
  const getIncidents = useCallback(async (limit = 50) => {
    return await firestoreService.getIncidents(limit);
  }, []);

  // Users
  const getUsers = useCallback(async () => {
    return await firestoreService.getUsers();
  }, []);

  const saveUsers = useCallback(async (users, updatedBy) => {
    return await firestoreService.saveUsers(users, updatedBy);
  }, []);

  return {
    connectionStatus,
    getConnectionStatus,
    testConnection,
    healthCheck,
    getDocument,
    setDocument,
    updateDocument,
    deleteDocument,
    addDocument,
    queryDocuments,
    subscribeToCollection,
    executeBatch,
    // Action Reports
    getActionReportsByMonth,
    saveActionReport,
    deleteActionReport,
    getAllActionReportsMonths,
    // Patrol Data
    getPatrolData,
    savePatrolData,
    clearPatrolData,
    // Incidents
    getIncidents,
    // Users
    getUsers,
    saveUsers
  };
};

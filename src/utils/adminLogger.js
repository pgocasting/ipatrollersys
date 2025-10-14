import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Admin Logger Utility
 * Tracks administrator access level usage throughout the system
 */

const LOG_COLLECTION = 'adminAccessLogs';

/**
 * Log administrator access activity
 * @param {string} action - The action being performed
 * @param {string} page - The page/component being accessed
 * @param {Object} userInfo - User information object
 * @param {Object} additionalData - Any additional data to log
 */
export const logAdminAccess = async (action, page, userInfo, additionalData = {}) => {
  try {
    // Only log if user is an administrator
    if (!userInfo.isAdmin && userInfo.userAccessLevel !== 'admin') {
      return;
    }

    const logEntry = {
      timestamp: serverTimestamp(),
      action: action,
      page: page,
      userInfo: {
        email: userInfo.email || '',
        firstName: userInfo.firstName || '',
        lastName: userInfo.lastName || '',
        username: userInfo.username || '',
        accessLevel: userInfo.userAccessLevel || '',
        municipality: userInfo.municipality || '',
        department: userInfo.department || '',
        isAdmin: userInfo.isAdmin || false
      },
      additionalData: additionalData,
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: getSessionId()
    };

    await addDoc(collection(db, LOG_COLLECTION), logEntry);
    
    // Also log to console for development
    console.log('🔐 Admin Access Logged:', {
      action,
      page,
      user: userInfo.email,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to log admin access:', error);
  }
};

/**
 * Get recent admin access logs
 * @param {number} limitCount - Number of logs to retrieve (default: 50)
 * @returns {Array} Array of log entries
 */
export const getAdminAccessLogs = async (limitCount = 50) => {
  try {
    const logsRef = collection(db, LOG_COLLECTION);
    const q = query(logsRef, orderBy('timestamp', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    
    const logs = [];
    querySnapshot.forEach((doc) => {
      logs.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return logs;
  } catch (error) {
    console.error('❌ Failed to retrieve admin access logs:', error);
    return [];
  }
};

/**
 * Generate a session ID for tracking user sessions
 * @returns {string} Session ID
 */
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('adminSessionId');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('adminSessionId', sessionId);
  }
  return sessionId;
};

/**
 * Log page navigation for administrators
 * @param {string} fromPage - Previous page
 * @param {string} toPage - New page
 * @param {Object} userInfo - User information
 */
export const logPageNavigation = async (fromPage, toPage, userInfo) => {
  await logAdminAccess(
    'PAGE_NAVIGATION',
    toPage,
    userInfo,
    {
      fromPage: fromPage,
      toPage: toPage,
      navigationType: 'internal'
    }
  );
};

/**
 * Log administrator login
 * @param {Object} userInfo - User information
 */
export const logAdminLogin = async (userInfo) => {
  await logAdminAccess(
    'ADMIN_LOGIN',
    'login',
    userInfo,
    {
      loginTime: new Date().toISOString(),
      loginType: 'authentication'
    }
  );
};

/**
 * Log administrator logout
 * @param {Object} userInfo - User information
 */
export const logAdminLogout = async (userInfo) => {
  await logAdminAccess(
    'ADMIN_LOGOUT',
    'logout',
    userInfo,
    {
      logoutTime: new Date().toISOString(),
      logoutType: 'authentication'
    }
  );
};

/**
 * Log user management actions
 * @param {string} action - Action type (CREATE_USER, UPDATE_USER, DELETE_USER, etc.)
 * @param {Object} userInfo - Admin user information
 * @param {Object} targetUser - Target user information
 */
export const logUserManagementAction = async (action, userInfo, targetUser) => {
  await logAdminAccess(
    `USER_MANAGEMENT_${action}`,
    'users',
    userInfo,
    {
      targetUser: {
        email: targetUser.email || '',
        username: targetUser.username || '',
        accessLevel: targetUser.accessLevel || '',
        municipality: targetUser.municipality || ''
      },
      actionType: 'user_management'
    }
  );
};

/**
 * Log report access
 * @param {string} reportType - Type of report accessed
 * @param {Object} userInfo - User information
 * @param {Object} reportFilters - Any filters applied to the report
 */
export const logReportAccess = async (reportType, userInfo, reportFilters = {}) => {
  await logAdminAccess(
    'REPORT_ACCESS',
    'reports',
    userInfo,
    {
      reportType: reportType,
      filters: reportFilters,
      actionType: 'report_access'
    }
  );
};

/**
 * Log system settings changes
 * @param {string} settingType - Type of setting changed
 * @param {Object} userInfo - User information
 * @param {Object} oldValue - Previous value
 * @param {Object} newValue - New value
 */
export const logSettingsChange = async (settingType, userInfo, oldValue, newValue) => {
  await logAdminAccess(
    'SETTINGS_CHANGE',
    'settings',
    userInfo,
    {
      settingType: settingType,
      oldValue: oldValue,
      newValue: newValue,
      actionType: 'settings_change'
    }
  );
};

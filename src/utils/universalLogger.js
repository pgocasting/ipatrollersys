import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Universal Logger Utility
 * Tracks all user activities across different access levels
 */

const LOG_COLLECTION = 'userActivityLogs';

/**
 * Log user activity for all access levels
 * @param {string} action - The action being performed
 * @param {string} page - The page/component being accessed
 * @param {Object} userInfo - User information object
 * @param {Object} additionalData - Any additional data to log
 */
export const logUserActivity = async (action, page, userInfo, additionalData = {}) => {
  try {
    const logEntry = {
      timestamp: serverTimestamp(),
      action: action,
      page: page,
      userInfo: {
        email: userInfo.email || '',
        firstName: userInfo.firstName || '',
        lastName: userInfo.lastName || '',
        username: userInfo.username || '',
        accessLevel: userInfo.userAccessLevel || userInfo.accessLevel || '',
        municipality: userInfo.municipality || '',
        department: userInfo.department || '',
        isAdmin: userInfo.isAdmin || false,
        role: userInfo.role || ''
      },
      additionalData: additionalData,
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: getSessionId()
    };

    await addDoc(collection(db, LOG_COLLECTION), logEntry);
    
    // Also log to console for development
    console.log('📝 User Activity Logged:', {
      action,
      page,
      user: userInfo.email,
      accessLevel: userInfo.userAccessLevel || userInfo.accessLevel,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to log user activity:', error);
  }
};

/**
 * Get recent user activity logs
 * @param {number} limitCount - Number of logs to retrieve (default: 100)
 * @returns {Array} Array of log entries
 */
export const getUserActivityLogs = async (limitCount = 100) => {
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
    console.error('❌ Failed to retrieve user activity logs:', error);
    return [];
  }
};

/**
 * Generate a session ID for tracking user sessions
 * @returns {string} Session ID
 */
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('userSessionId');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('userSessionId', sessionId);
  }
  return sessionId;
};

/**
 * Log user login
 * @param {Object} userInfo - User information
 */
export const logUserLogin = async (userInfo) => {
  await logUserActivity(
    'USER_LOGIN',
    'login',
    userInfo,
    {
      loginTime: new Date().toISOString(),
      loginType: 'authentication'
    }
  );
};

/**
 * Log user logout
 * @param {Object} userInfo - User information
 */
export const logUserLogout = async (userInfo) => {
  await logUserActivity(
    'USER_LOGOUT',
    'logout',
    userInfo,
    {
      logoutTime: new Date().toISOString(),
      logoutType: 'authentication'
    }
  );
};

/**
 * Log page navigation for all users
 * @param {string} fromPage - Previous page
 * @param {string} toPage - New page
 * @param {Object} userInfo - User information
 */
export const logPageNavigation = async (fromPage, toPage, userInfo) => {
  await logUserActivity(
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
 * Log data access/viewing
 * @param {string} dataType - Type of data accessed
 * @param {Object} userInfo - User information
 * @param {Object} filters - Any filters applied
 */
export const logDataAccess = async (dataType, userInfo, filters = {}) => {
  await logUserActivity(
    'DATA_ACCESS',
    'data',
    userInfo,
    {
      dataType: dataType,
      filters: filters,
      actionType: 'data_access'
    }
  );
};

/**
 * Log report generation/access
 * @param {string} reportType - Type of report accessed
 * @param {Object} userInfo - User information
 * @param {Object} reportFilters - Any filters applied to the report
 */
export const logReportAccess = async (reportType, userInfo, reportFilters = {}) => {
  await logUserActivity(
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
 * Log incident report creation/update
 * @param {string} action - Action type (CREATE_INCIDENT, UPDATE_INCIDENT, etc.)
 * @param {Object} userInfo - User information
 * @param {Object} incidentData - Incident data
 */
export const logIncidentAction = async (action, userInfo, incidentData = {}) => {
  await logUserActivity(
    `INCIDENT_${action}`,
    'incidents',
    userInfo,
    {
      incidentId: incidentData.id || '',
      incidentType: incidentData.type || '',
      location: incidentData.location || '',
      actionType: 'incident_management'
    }
  );
};

/**
 * Log patrol data entry/update
 * @param {string} action - Action type (CREATE_PATROL, UPDATE_PATROL, etc.)
 * @param {Object} userInfo - User information
 * @param {Object} patrolData - Patrol data
 */
export const logPatrolAction = async (action, userInfo, patrolData = {}) => {
  await logUserActivity(
    `PATROL_${action}`,
    'patrol',
    userInfo,
    {
      patrolId: patrolData.id || '',
      patrolType: patrolData.type || '',
      location: patrolData.location || '',
      actionType: 'patrol_management'
    }
  );
};

/**
 * Log quarry monitoring activities
 * @param {string} action - Action type (MONITOR_QUARRY, UPDATE_STATUS, etc.)
 * @param {Object} userInfo - User information
 * @param {Object} quarryData - Quarry data
 */
export const logQuarryAction = async (action, userInfo, quarryData = {}) => {
  await logUserActivity(
    `QUARRY_${action}`,
    'quarry',
    userInfo,
    {
      quarryId: quarryData.id || '',
      quarryName: quarryData.name || '',
      status: quarryData.status || '',
      actionType: 'quarry_monitoring'
    }
  );
};

/**
 * Log command center activities
 * @param {string} action - Action type (COMMAND_CENTER_ACCESS, DISPATCH_ORDER, etc.)
 * @param {Object} userInfo - User information
 * @param {Object} commandData - Command data
 */
export const logCommandCenterAction = async (action, userInfo, commandData = {}) => {
  await logUserActivity(
    `COMMAND_${action}`,
    'commandcenter',
    userInfo,
    {
      commandId: commandData.id || '',
      commandType: commandData.type || '',
      priority: commandData.priority || '',
      actionType: 'command_center'
    }
  );
};

/**
 * Log settings changes (for users who have permission)
 * @param {string} settingType - Type of setting changed
 * @param {Object} userInfo - User information
 * @param {Object} oldValue - Previous value
 * @param {Object} newValue - New value
 */
export const logSettingsChange = async (settingType, userInfo, oldValue, newValue) => {
  await logUserActivity(
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

/**
 * Log file upload/download activities
 * @param {string} action - Action type (UPLOAD_FILE, DOWNLOAD_FILE, etc.)
 * @param {Object} userInfo - User information
 * @param {Object} fileData - File information
 */
export const logFileAction = async (action, userInfo, fileData = {}) => {
  await logUserActivity(
    `FILE_${action}`,
    'files',
    userInfo,
    {
      fileName: fileData.name || '',
      fileType: fileData.type || '',
      fileSize: fileData.size || '',
      actionType: 'file_management'
    }
  );
};

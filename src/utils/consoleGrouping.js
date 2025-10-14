/**
 * Console Grouping Utility for iPatroller System
 * 
 * This utility provides organized console logging with collapsible groups
 * for different sections of the application to reduce console clutter.
 */

// Define the available console groups
export const CONSOLE_GROUPS = {
  DASHBOARD: '📊 Dashboard',
  IPATROLLER: '🚀 iPatroller',
  COMMAND_CENTER: '🎯 Command Center',
  ACTION_CENTER: '⚡ Action Center',
  INCIDENTS: '🚨 Incidents',
  QUARRY_MONITORING: '🏔️ Quarry Monitoring',
  USERS: '👥 Users',
  SETTINGS: '⚙️ Settings',
  AUTH: '🔐 Authentication',
  FIREBASE: '🔥 Firebase',
  FIRESTORE: '📡 Firestore',
  CLOUDINARY: '☁️ Cloudinary',
  REPORTS: '📋 Reports',
  UTILS: '🛠️ Utils',
  DEBUG: '🐛 Debug',
  ERROR: '❌ Error',
  SUCCESS: '✅ Success',
  WARNING: '⚠️ Warning',
  INFO: 'ℹ️ Info'
};

// Store active groups to manage them
const activeGroups = new Map();

/**
 * Create a console group for a specific section
 * @param {string} groupName - The group name from CONSOLE_GROUPS
 * @param {boolean} collapsed - Whether the group should start collapsed (default: false)
 * @returns {string} - The group identifier
 */
export const createGroup = (groupName, collapsed = false) => {
  const groupId = `${groupName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  if (collapsed) {
    console.groupCollapsed(groupName);
  } else {
    console.group(groupName);
  }
  
  activeGroups.set(groupId, groupName);
  return groupId;
};

/**
 * End a console group
 * @param {string} groupId - The group identifier returned by createGroup
 */
export const endGroup = (groupId) => {
  if (activeGroups.has(groupId)) {
    console.groupEnd();
    activeGroups.delete(groupId);
  }
};

/**
 * Log a message within a specific group
 * @param {string} groupName - The group name from CONSOLE_GROUPS
 * @param {string} message - The message to log
 * @param {any} data - Optional data to log
 * @param {string} level - Log level (log, warn, error, info, debug)
 */
export const logInGroup = (groupName, message, data = null, level = 'log') => {
  const groupId = createGroup(groupName, true); // Start collapsed for individual logs
  
  switch (level) {
    case 'warn':
      console.warn(message, data);
      break;
    case 'error':
      console.error(message, data);
      break;
    case 'info':
      console.info(message, data);
      break;
    case 'debug':
      console.debug(message, data);
      break;
    default:
      console.log(message, data);
  }
  
  endGroup(groupId);
};

/**
 * Create a section group that can contain multiple logs
 * @param {string} groupName - The group name from CONSOLE_GROUPS
 * @param {boolean} collapsed - Whether the group should start collapsed
 * @returns {object} - Group controller with log methods
 */
export const createSectionGroup = (groupName, collapsed = false) => {
  const groupId = createGroup(groupName, collapsed);
  
  return {
    groupId,
    groupName,
    
    // Log methods
    log: (message, data) => {
      console.log(message, data);
    },
    
    warn: (message, data) => {
      console.warn(message, data);
    },
    
    error: (message, data) => {
      console.error(message, data);
    },
    
    info: (message, data) => {
      console.info(message, data);
    },
    
    debug: (message, data) => {
      console.debug(message, data);
    },
    
    // End the group
    end: () => {
      endGroup(groupId);
    },
    
    // Create a sub-group within this group
    subGroup: (subGroupName, subCollapsed = true) => {
      return createSectionGroup(`${groupName} > ${subGroupName}`, subCollapsed);
    }
  };
};

/**
 * Quick logging functions for each section
 */
export const dashboardLog = (message, data, level = 'log') => {
  logInGroup(CONSOLE_GROUPS.DASHBOARD, message, data, level);
};

export const ipatrollerLog = (message, data, level = 'log') => {
  logInGroup(CONSOLE_GROUPS.IPATROLLER, message, data, level);
};

export const commandCenterLog = (message, data, level = 'log') => {
  logInGroup(CONSOLE_GROUPS.COMMAND_CENTER, message, data, level);
};

export const actionCenterLog = (message, data, level = 'log') => {
  logInGroup(CONSOLE_GROUPS.ACTION_CENTER, message, data, level);
};

export const incidentsLog = (message, data, level = 'log') => {
  logInGroup(CONSOLE_GROUPS.INCIDENTS, message, data, level);
};

export const quarryLog = (message, data, level = 'log') => {
  logInGroup(CONSOLE_GROUPS.QUARRY_MONITORING, message, data, level);
};

export const usersLog = (message, data, level = 'log') => {
  logInGroup(CONSOLE_GROUPS.USERS, message, data, level);
};

export const settingsLog = (message, data, level = 'log') => {
  logInGroup(CONSOLE_GROUPS.SETTINGS, message, data, level);
};

export const authLog = (message, data, level = 'log') => {
  logInGroup(CONSOLE_GROUPS.AUTH, message, data, level);
};

export const firebaseLog = (message, data, level = 'log') => {
  logInGroup(CONSOLE_GROUPS.FIREBASE, message, data, level);
};

export const firestoreLog = (message, data, level = 'log') => {
  logInGroup(CONSOLE_GROUPS.FIRESTORE, message, data, level);
};

export const cloudinaryLog = (message, data, level = 'log') => {
  logInGroup(CONSOLE_GROUPS.CLOUDINARY, message, data, level);
};

export const reportsLog = (message, data, level = 'log') => {
  logInGroup(CONSOLE_GROUPS.REPORTS, message, data, level);
};

export const utilsLog = (message, data, level = 'log') => {
  logInGroup(CONSOLE_GROUPS.UTILS, message, data, level);
};

export const debugLog = (message, data, level = 'debug') => {
  logInGroup(CONSOLE_GROUPS.DEBUG, message, data, level);
};

export const errorLog = (message, data) => {
  logInGroup(CONSOLE_GROUPS.ERROR, message, data, 'error');
};

export const successLog = (message, data) => {
  logInGroup(CONSOLE_GROUPS.SUCCESS, message, data, 'log');
};

export const warningLog = (message, data) => {
  logInGroup(CONSOLE_GROUPS.WARNING, message, data, 'warn');
};

export const infoLog = (message, data) => {
  logInGroup(CONSOLE_GROUPS.INFO, message, data, 'info');
};

/**
 * Performance timing utilities
 */
export const performanceLog = {
  start: (label) => {
    console.time(label);
  },
  
  end: (label) => {
    console.timeEnd(label);
  },
  
  mark: (label) => {
    console.timeStamp(label);
  }
};

/**
 * Table logging for structured data
 */
export const tableLog = (groupName, data, title = 'Data Table') => {
  const group = createSectionGroup(groupName, true);
  group.log(title);
  console.table(data);
  group.end();
};

/**
 * Clear all active groups (useful for cleanup)
 */
export const clearAllGroups = () => {
  activeGroups.forEach((groupName, groupId) => {
    console.groupEnd();
  });
  activeGroups.clear();
};

/**
 * Get active groups count
 */
export const getActiveGroupsCount = () => {
  return activeGroups.size;
};

/**
 * Check if a group is active
 */
export const isGroupActive = (groupId) => {
  return activeGroups.has(groupId);
};

// Export all console groups for easy access
export default {
  CONSOLE_GROUPS,
  createGroup,
  endGroup,
  logInGroup,
  createSectionGroup,
  dashboardLog,
  ipatrollerLog,
  commandCenterLog,
  actionCenterLog,
  incidentsLog,
  quarryLog,
  usersLog,
  settingsLog,
  authLog,
  firebaseLog,
  firestoreLog,
  cloudinaryLog,
  reportsLog,
  utilsLog,
  debugLog,
  errorLog,
  successLog,
  warningLog,
  infoLog,
  performanceLog,
  tableLog,
  clearAllGroups,
  getActiveGroupsCount,
  isGroupActive
};

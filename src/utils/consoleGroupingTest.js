/**
 * Console Grouping Test Utility
 * 
 * This file demonstrates how to use the console grouping system
 * and can be used to test the functionality.
 */

import { 
  dashboardLog, 
  ipatrollerLog, 
  commandCenterLog, 
  actionCenterLog, 
  incidentsLog, 
  quarryLog, 
  usersLog, 
  settingsLog,
  createSectionGroup,
  CONSOLE_GROUPS,
  performanceLog,
  tableLog
} from './consoleGrouping';

/**
 * Test function to demonstrate console grouping functionality
 */
export const testConsoleGrouping = () => {
  console.log('🧪 Testing Console Grouping System...\n');

  // Test individual log functions
  dashboardLog('Testing Dashboard logging');
  ipatrollerLog('Testing iPatroller logging');
  commandCenterLog('Testing Command Center logging');
  actionCenterLog('Testing Action Center logging');
  incidentsLog('Testing Incidents logging');
  quarryLog('Testing Quarry Monitoring logging');
  usersLog('Testing Users logging');
  settingsLog('Testing Settings logging');

  // Test section groups
  const dashboardGroup = createSectionGroup(CONSOLE_GROUPS.DASHBOARD, false);
  dashboardGroup.log('Dashboard group test - this should be expanded');
  dashboardGroup.log('Multiple logs in the same group');
  dashboardGroup.warn('Warning message in dashboard group');
  dashboardGroup.error('Error message in dashboard group');
  dashboardGroup.end();

  // Test collapsed group
  const collapsedGroup = createSectionGroup(CONSOLE_GROUPS.IPATROLLER, true);
  collapsedGroup.log('This group should be collapsed by default');
  collapsedGroup.log('Multiple logs in collapsed group');
  collapsedGroup.end();

  // Test sub-groups
  const mainGroup = createSectionGroup(CONSOLE_GROUPS.ACTION_CENTER, false);
  mainGroup.log('Main Action Center group');
  
  const subGroup = mainGroup.subGroup('Data Processing', false);
  subGroup.log('Processing data...');
  subGroup.log('Data processed successfully');
  subGroup.end();
  
  mainGroup.log('Main group continues...');
  mainGroup.end();

  // Test performance logging
  performanceLog.start('Test Operation');
  // Simulate some work
  setTimeout(() => {
    performanceLog.end('Test Operation');
  }, 100);

  // Test table logging
  const sampleData = [
    { name: 'John Doe', age: 30, role: 'Admin' },
    { name: 'Jane Smith', age: 25, role: 'User' },
    { name: 'Bob Johnson', age: 35, role: 'Moderator' }
  ];
  tableLog(CONSOLE_GROUPS.USERS, sampleData, 'Sample User Data');

  console.log('\n✅ Console Grouping Test Completed!');
  console.log('Check the console to see the organized log groups.');
};

/**
 * Test function for error scenarios
 */
export const testErrorLogging = () => {
  console.log('🧪 Testing Error Logging...\n');

  try {
    // Simulate an error
    throw new Error('This is a test error');
  } catch (error) {
    dashboardLog('Caught error in dashboard:', error, 'error');
    actionCenterLog('Error in action center:', error, 'error');
  }

  // Test warning
  dashboardLog('This is a warning message', null, 'warn');
  
  // Test info
  ipatrollerLog('This is an info message', null, 'info');
  
  // Test debug
  commandCenterLog('This is a debug message', null, 'debug');

  console.log('\n✅ Error Logging Test Completed!');
};

/**
 * Test function for performance monitoring
 */
export const testPerformanceLogging = () => {
  console.log('🧪 Testing Performance Logging...\n');

  performanceLog.start('Data Loading');
  
  // Simulate data loading
  setTimeout(() => {
    performanceLog.end('Data Loading');
    
    performanceLog.start('Data Processing');
    
    // Simulate data processing
    setTimeout(() => {
      performanceLog.end('Data Processing');
      performanceLog.mark('Data Ready');
      
      console.log('\n✅ Performance Logging Test Completed!');
    }, 200);
  }, 300);
};

// Export all test functions
export default {
  testConsoleGrouping,
  testErrorLogging,
  testPerformanceLogging
};

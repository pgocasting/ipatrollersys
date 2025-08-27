// Firebase diagnostics utility for troubleshooting connection issues

import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  setDoc,
  enableNetwork,
  disableNetwork,
  connectFirestoreEmulator
} from 'firebase/firestore';
import { db } from '../firebase';

export const firebaseDiagnostics = {
  // Run comprehensive diagnostics
  async runDiagnostics() {
    console.log('🔍 Starting Firebase diagnostics...');
    
    const results = {
      timestamp: new Date().toISOString(),
      basic: await this.checkBasicConnection(),
      network: await this.checkNetworkStatus(),
      permissions: await this.checkPermissions(),
      performance: await this.checkPerformance(),
      recommendations: []
    };

    // Generate recommendations based on results
    results.recommendations = this.generateRecommendations(results);
    
    console.log('📊 Diagnostics completed:', results);
    return results;
  },

  // Check basic Firebase connection
  async checkBasicConnection() {
    try {
      if (!db) {
        return { status: 'error', message: 'Firestore not initialized' };
      }

      // Test basic connectivity
      const testQuery = query(collection(db, '_diagnostic_test'));
      await getDocs(testQuery);
      
      return { status: 'success', message: 'Basic connection successful' };
    } catch (error) {
      return { 
        status: 'error', 
        message: error.message, 
        code: error.code,
        details: this.analyzeError(error)
      };
    }
  },

  // Check network status
  async checkNetworkStatus() {
    try {
      if (!db) {
        return { status: 'error', message: 'Firestore not initialized' };
      }

      // Check if network is enabled
      const networkEnabled = db._delegate._networkEnabled;
      
      if (!networkEnabled) {
        // Try to enable network
        await enableNetwork(db);
        return { status: 'recovered', message: 'Network was disabled, now enabled' };
      }

      return { status: 'success', message: 'Network is enabled' };
    } catch (error) {
      return { 
        status: 'error', 
        message: error.message, 
        code: error.code 
      };
    }
  },

  // Check permissions and access
  async checkPermissions() {
    try {
      if (!db) {
        return { status: 'error', message: 'Firestore not initialized' };
      }

      // Try to read from a test collection
      const testQuery = query(collection(db, '_permission_test'));
      await getDocs(testQuery);
      
      return { status: 'success', message: 'Read permissions verified' };
    } catch (error) {
      if (error.code === 'permission-denied') {
        return { 
          status: 'warning', 
          message: 'Permission denied - check Firestore rules',
          code: error.code,
          suggestion: 'Verify that your Firestore security rules allow read access'
        };
      }
      
      return { 
        status: 'error', 
        message: error.message, 
        code: error.code 
      };
    }
  },

  // Check performance and response times
  async checkPerformance() {
    try {
      if (!db) {
        return { status: 'error', message: 'Firestore not initialized' };
      }

      const startTime = performance.now();
      
      // Perform a simple query to measure response time
      const testQuery = query(collection(db, '_performance_test'));
      await getDocs(testQuery);
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      let status = 'success';
      let message = `Response time: ${responseTime.toFixed(2)}ms`;
      
      if (responseTime > 5000) {
        status = 'warning';
        message += ' - Slow response time detected';
      } else if (responseTime > 10000) {
        status = 'error';
        message += ' - Very slow response time';
      }
      
      return { 
        status, 
        message, 
        responseTime: responseTime.toFixed(2),
        threshold: responseTime > 5000 ? 'high' : 'normal'
      };
    } catch (error) {
      return { 
        status: 'error', 
        message: error.message, 
        code: error.code 
      };
    }
  },

  // Analyze error details
  analyzeError(error) {
    const analysis = {
      type: 'unknown',
      severity: 'medium',
      suggestions: []
    };

    // Analyze by error code
    switch (error.code) {
      case 'permission-denied':
        analysis.type = 'permissions';
        analysis.severity = 'high';
        analysis.suggestions = [
          'Check Firestore security rules',
          'Verify user authentication',
          'Ensure proper user roles'
        ];
        break;
        
      case 'unavailable':
        analysis.type = 'service';
        analysis.severity = 'high';
        analysis.suggestions = [
          'Check Firebase service status',
          'Verify project configuration',
          'Check internet connection'
        ];
        break;
        
      case 'deadline-exceeded':
        analysis.type = 'timeout';
        analysis.severity = 'medium';
        analysis.suggestions = [
          'Check network connection',
          'Verify Firebase quotas',
          'Consider reducing data size'
        ];
        break;
        
      case 'resource-exhausted':
        analysis.type = 'quota';
        analysis.severity = 'high';
        analysis.suggestions = [
          'Check Firebase usage quotas',
          'Upgrade Firebase plan if needed',
          'Optimize data operations'
        ];
        break;
        
      case 'failed-precondition':
        analysis.type = 'state';
        analysis.severity = 'medium';
        analysis.suggestions = [
          'Check application state',
          'Verify data consistency',
          'Try refreshing the page'
        ];
        break;
        
      default:
        analysis.type = 'unknown';
        analysis.severity = 'medium';
        analysis.suggestions = [
          'Check browser console for details',
          'Verify Firebase configuration',
          'Contact support if issue persists'
        ];
    }

    return analysis;
  },

  // Generate recommendations based on diagnostic results
  generateRecommendations(results) {
    const recommendations = [];

    // Check basic connection
    if (results.basic.status === 'error') {
      recommendations.push({
        priority: 'critical',
        category: 'connection',
        message: 'Fix basic Firebase connection issues first',
        action: 'Check Firebase configuration and internet connection'
      });
    }

    // Check network status
    if (results.network.status === 'error') {
      recommendations.push({
        priority: 'high',
        category: 'network',
        message: 'Network connectivity issues detected',
        action: 'Check internet connection and firewall settings'
      });
    }

    // Check permissions
    if (results.permissions.status === 'warning') {
      recommendations.push({
        priority: 'high',
        category: 'permissions',
        message: 'Permission issues detected',
        action: 'Review Firestore security rules and user roles'
      });
    }

    // Check performance
    if (results.performance.status === 'warning' || results.performance.status === 'error') {
      recommendations.push({
        priority: 'medium',
        category: 'performance',
        message: 'Performance issues detected',
        action: 'Check network quality and Firebase quotas'
      });
    }

    // Add general recommendations
    if (recommendations.length === 0) {
      recommendations.push({
        priority: 'low',
        category: 'general',
        message: 'All systems appear to be functioning normally',
        action: 'Continue monitoring for any changes'
      });
    }

    return recommendations;
  },

  // Test specific operations
  async testOperation(operation, description) {
    try {
      console.log(`🧪 Testing: ${description}`);
      const startTime = performance.now();
      
      const result = await operation();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`✅ ${description} completed in ${duration.toFixed(2)}ms`);
      
      return {
        success: true,
        duration: duration.toFixed(2),
        result
      };
    } catch (error) {
      console.error(`❌ ${description} failed:`, error);
      
      return {
        success: false,
        error: error.message,
        code: error.code,
        analysis: this.analyzeError(error)
      };
    }
  },

  // Quick health check
  async quickHealthCheck() {
    try {
      const basic = await this.checkBasicConnection();
      const network = await this.checkNetworkStatus();
      
      const overallStatus = 
        basic.status === 'success' && network.status === 'success' 
          ? 'healthy' 
          : 'unhealthy';
      
      return {
        status: overallStatus,
        basic,
        network,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
};

export default firebaseDiagnostics;

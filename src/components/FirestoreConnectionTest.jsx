import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useFirestore } from '../hooks/useFirestore';
import { useFirebase } from '../hooks/useFirebase';

export default function FirestoreConnectionTest() {
  const { user } = useFirebase();
  const {
    connectionStatus,
    testConnection,
    healthCheck,
    getDocument,
    setDocument,
    getConnectionStatus,
    saveActionReport,
    getActionReportsByMonth,
    getAllActionReportsMonths
  } = useFirestore();

  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addTestResult = (testName, success, message, data = null) => {
    setTestResults(prev => [...prev, {
      id: Date.now(),
      testName,
      success,
      message,
      data,
      timestamp: new Date().toISOString()
    }]);
  };

  const runConnectionTest = async () => {
    setLoading(true);
    addTestResult('Connection Test', 'running', 'Testing Firebase connection...');
    
    try {
      const result = await testConnection();
      if (result.success) {
        addTestResult('Connection Test', true, 'Firebase connection successful', result);
      } else {
        addTestResult('Connection Test', false, `Connection failed: ${result.error}`, result);
      }
    } catch (error) {
      addTestResult('Connection Test', false, `Connection error: ${error.message}`, error);
    } finally {
      setLoading(false);
    }
  };

  const runHealthCheck = async () => {
    setLoading(true);
    addTestResult('Health Check', 'running', 'Running health check...');
    
    try {
      const result = await healthCheck();
      if (result.success) {
        addTestResult('Health Check', true, 'Health check passed', result);
      } else {
        addTestResult('Health Check', false, `Health check failed: ${result.error}`, result);
      }
    } catch (error) {
      addTestResult('Health Check', false, `Health check error: ${error.message}`, error);
    } finally {
      setLoading(false);
    }
  };

  const testMonthBasedStructure = async () => {
    setLoading(true);
    addTestResult('Month-Based Structure', 'running', 'Testing month-based structure...');
    
    try {
      // Test 1: Get all available months
      const monthsResult = await getAllActionReportsMonths();
      if (monthsResult.success) {
        addTestResult('Month-Based Structure', true, `Found ${monthsResult.data.length} months`, monthsResult.data);
        
        // Test 2: Try to get data for current month
        const currentDate = new Date();
        const currentMonthKey = `${String(currentDate.getMonth() + 1).padStart(2, '0')}-${currentDate.getFullYear()}`;
        
        const monthDataResult = await getActionReportsByMonth(currentMonthKey);
        if (monthDataResult.success) {
          addTestResult('Month Data Retrieval', true, `Retrieved data for ${currentMonthKey}`, monthDataResult);
        } else {
          addTestResult('Month Data Retrieval', false, `Failed to get data for ${currentMonthKey}: ${monthDataResult.error}`, monthDataResult);
        }
      } else {
        addTestResult('Month-Based Structure', false, `Failed to get months: ${monthsResult.error}`, monthsResult);
      }
    } catch (error) {
      addTestResult('Month-Based Structure', false, `Month structure test error: ${error.message}`, error);
    } finally {
      setLoading(false);
    }
  };

  const testActionReportCreation = async () => {
    setLoading(true);
    addTestResult('Action Report Creation', 'running', 'Testing action report creation...');
    
    try {
      const testReport = {
        when: new Date().toISOString(),
        where: 'Test Location',
        what: 'Test Action Report',
        who: 'Test User',
        district: '1ST DISTRICT',
        municipality: 'Abucay',
        actionTaken: 'Test action',
        outcome: 'Test outcome',
        notes: 'This is a test report'
      };

      const result = await saveActionReport(testReport);
      if (result.success) {
        addTestResult('Action Report Creation', true, `Successfully created report for month ${result.monthKey}`, result);
        
        // Verify the report was saved
        const verifyResult = await getActionReportsByMonth(result.monthKey);
        if (verifyResult.success && verifyResult.data.length > 0) {
          addTestResult('Action Report Verification', true, `Verified report was saved correctly`, verifyResult);
        } else {
          addTestResult('Action Report Verification', false, `Failed to verify saved report`, verifyResult);
        }
      } else {
        addTestResult('Action Report Creation', false, `Failed to create report: ${result.error}`, result);
      }
    } catch (error) {
      addTestResult('Action Report Creation', false, `Report creation error: ${error.message}`, error);
    } finally {
      setLoading(false);
    }
  };

  const runAllTests = async () => {
    setTestResults([]);
    await runConnectionTest();
    await runHealthCheck();
    await testMonthBasedStructure();
    await testActionReportCreation();
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Firestore Connection & Month-Based Structure Test</span>
          <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'}>
            {connectionStatus}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Test Controls */}
        <div className="flex gap-2 flex-wrap">
          <Button onClick={runConnectionTest} disabled={loading}>
            Test Connection
          </Button>
          <Button onClick={runHealthCheck} disabled={loading}>
            Health Check
          </Button>
          <Button onClick={testMonthBasedStructure} disabled={loading}>
            Test Month Structure
          </Button>
          <Button onClick={testActionReportCreation} disabled={loading}>
            Test Report Creation
          </Button>
          <Button onClick={runAllTests} disabled={loading} variant="default">
            Run All Tests
          </Button>
          <Button onClick={clearResults} variant="outline">
            Clear Results
          </Button>
        </div>

        {/* Connection Status */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Connection Status</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Status:</strong> {connectionStatus}
            </div>
            <div>
              <strong>User:</strong> {user ? user.email : 'Not authenticated'}
            </div>
          </div>
        </div>

        {/* Test Results */}
        <div className="space-y-2">
          <h3 className="font-semibold">Test Results</h3>
          {testResults.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No tests run yet. Click a test button above to start.</p>
          ) : (
            testResults.map((result) => (
              <div
                key={result.id}
                className={`p-3 rounded-lg border ${
                  result.success === true
                    ? 'border-green-200 bg-green-50'
                    : result.success === false
                    ? 'border-red-200 bg-red-50'
                    : 'border-yellow-200 bg-yellow-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        result.success === true
                          ? 'default'
                          : result.success === false
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {result.success === true ? 'PASS' : result.success === false ? 'FAIL' : 'RUNNING'}
                    </Badge>
                    <span className="font-medium">{result.testName}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="mt-1 text-sm">{result.message}</p>
                {result.data && (
                  <details className="mt-2">
                    <summary className="text-sm text-gray-600 cursor-pointer">View Details</summary>
                    <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))
          )}
        </div>

        {/* Instructions */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2 text-blue-900">What This Tests</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Connection Test:</strong> Verifies Firebase connection is working</li>
            <li>• <strong>Health Check:</strong> Tests Firestore service health</li>
            <li>• <strong>Month Structure:</strong> Tests the new month-based document structure</li>
            <li>• <strong>Report Creation:</strong> Tests creating and saving action reports by month</li>
          </ul>
          <p className="text-xs text-blue-700 mt-2">
            The month-based structure organizes action reports by month (MM-YYYY format) similar to patrolData,
            making it easier to manage and query data by time periods.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  onSnapshot,
  query,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Database, Wifi, WifiOff, Activity, AlertTriangle } from 'lucide-react';

const FirestoreTest = () => {
  const [connectionStatus, setConnectionStatus] = useState('testing');
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [readCount, setReadCount] = useState(0);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    setLoading(true);
    setConnectionStatus('testing');
    setTestResults([]);

    try {
      // Test 1: Basic connection
      addTestResult('Testing basic connection...', 'info');
      const testDoc = doc(db, 'test', 'connection-test');
      await setDoc(testDoc, { 
        test: true, 
        timestamp: serverTimestamp() 
      });
      addTestResult('✅ Basic connection successful', 'success');
      
      // Test 2: Read operation
      addTestResult('Testing read operation...', 'info');
      const readSnapshot = await getDocs(collection(db, 'test'));
      setReadCount(readSnapshot.size);
      addTestResult(`✅ Read operation successful (${readSnapshot.size} documents)`, 'success');
      
      // Test 3: Check if patrolData collection exists
      addTestResult('Checking patrolData collection...', 'info');
      try {
        const patrolSnapshot = await getDocs(collection(db, 'patrolData'));
        addTestResult(`✅ patrolData collection found (${patrolSnapshot.size} month documents)`, 'success');
        
        // Test 4: Check for quota issues
        if (patrolSnapshot.size > 0) {
          addTestResult('Checking for quota issues...', 'info');
          const firstMonth = patrolSnapshot.docs[0];
          const municipalitiesRef = collection(firstMonth.ref, 'municipalities');
          const municipalitiesSnapshot = await getDocs(municipalitiesRef);
          addTestResult(`✅ Municipalities subcollection accessible (${municipalitiesSnapshot.size} municipalities)`, 'success');
        }
      } catch (error) {
        if (error.code === 'resource-exhausted') {
          addTestResult('❌ QUOTA EXCEEDED - You have hit the 50k reads limit', 'error');
          setConnectionStatus('quota-exceeded');
        } else {
          addTestResult(`❌ Error accessing patrolData: ${error.message}`, 'error');
        }
      }
      
      // Clean up test document
      await updateDoc(testDoc, { deleted: true });
      addTestResult('✅ Test cleanup completed', 'success');
      
      setConnectionStatus('connected');
      
    } catch (error) {
      console.error('Connection test failed:', error);
      addTestResult(`❌ Connection test failed: ${error.message}`, 'error');
      
      if (error.code === 'resource-exhausted') {
        setConnectionStatus('quota-exceeded');
        addTestResult('❌ QUOTA EXCEEDED - You have hit the 50k reads limit', 'error');
      } else if (error.code === 'permission-denied') {
        setConnectionStatus('permission-denied');
        addTestResult('❌ Permission denied - Check Firestore rules', 'error');
      } else {
        setConnectionStatus('error');
      }
    } finally {
      setLoading(false);
    }
  };

  const addTestResult = (message, type) => {
    setTestResults(prev => [...prev, { message, type, timestamp: new Date() }]);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'quota-exceeded': return 'text-red-600';
      case 'permission-denied': return 'text-red-600';
      case 'error': return 'text-red-600';
      case 'testing': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected': return <Database className="h-5 w-5 text-green-600" />;
      case 'quota-exceeded': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'permission-denied': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'error': return <WifiOff className="h-5 w-5 text-red-600" />;
      case 'testing': return <Activity className="h-5 w-5 text-yellow-600 animate-pulse" />;
      default: return <WifiOff className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case 'connected': return 'Firestore Connected';
      case 'quota-exceeded': return 'Quota Exceeded (50k reads)';
      case 'permission-denied': return 'Permission Denied';
      case 'error': return 'Connection Error';
      case 'testing': return 'Testing Connection...';
      default: return 'Unknown Status';
    }
  };

  const getStatusDescription = (status) => {
    switch (status) {
      case 'connected': return 'All systems operational';
      case 'quota-exceeded': return 'You have exceeded the free tier limit. Consider upgrading or waiting for reset.';
      case 'permission-denied': return 'Check your Firestore security rules';
      case 'error': return 'Unable to connect to Firestore';
      case 'testing': return 'Running connection tests...';
      default: return 'Status unknown';
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Firestore Connection Test</h1>
      
      {/* Status Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(connectionStatus)}
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <span className="font-medium">Status: </span>
              <span className={getStatusColor(connectionStatus)}>
                {getStatusMessage(connectionStatus)}
              </span>
            </div>
            <div>
              <span className="font-medium">Description: </span>
              <span className="text-gray-600">
                {getStatusDescription(connectionStatus)}
              </span>
            </div>
            {readCount > 0 && (
              <div>
                <span className="font-medium">Documents Read: </span>
                <span className="text-blue-600">{readCount}</span>
              </div>
            )}
          </div>
          
          <div className="mt-4">
            <Button
              onClick={testConnection}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {loading ? 'Testing...' : 'Test Connection'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500">No tests run yet</p>
            ) : (
              testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-2 rounded text-sm ${
                    result.type === 'success' ? 'bg-green-50 text-green-800' :
                    result.type === 'error' ? 'bg-red-50 text-red-800' :
                    result.type === 'info' ? 'bg-blue-50 text-blue-800' :
                    'bg-gray-50 text-gray-800'
                  }`}
                >
                  <span className="font-mono text-xs">
                    {result.timestamp.toLocaleTimeString()}
                  </span>
                  {' '}
                  {result.message}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quota Exceeded Help */}
      {connectionStatus === 'quota-exceeded' && (
        <Card className="mt-6 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Quota Exceeded - What to do?</CardTitle>
          </CardHeader>
          <CardContent className="text-red-700">
            <div className="space-y-2">
              <p>• <strong>Free Tier Limit:</strong> You've exceeded the 50,000 reads per day limit</p>
              <p>• <strong>Solutions:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Wait until midnight (UTC) for the quota to reset</li>
                <li>Upgrade to the Blaze (pay-as-you-go) plan</li>
                <li>Optimize your app to use fewer reads</li>
                <li>Use local storage temporarily</li>
              </ul>
              <p>• <strong>Current Status:</strong> Your app will work with local storage until the quota resets</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FirestoreTest;

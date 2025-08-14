import React, { useState, useEffect } from 'react';
import { checkFirebaseConnection, testFirebaseConnection } from '../firebase';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function FirebaseStatus() {
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [lastTest, setLastTest] = useState(null);

  const runConnectionTest = async () => {
    setIsTesting(true);
    try {
      const result = await testFirebaseConnection();
      setConnectionStatus(result);
      setLastTest(new Date());
    } catch (error) {
      setConnectionStatus({ success: false, error: error.message });
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    // Check initial connection status
    const status = checkFirebaseConnection();
    setConnectionStatus(status);
    
    // Run initial test
    runConnectionTest();
  }, []);

  if (!connectionStatus) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <div className="animate-pulse">Checking Firebase connection...</div>
      </div>
    );
  }

  const getStatusIcon = (isConnected) => {
    if (isConnected) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  const getStatusColor = (isConnected) => {
    return isConnected ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="p-4 bg-white rounded-lg border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Firebase Connection Status</h3>
        <button
          onClick={runConnectionTest}
          disabled={isTesting}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
          {isTesting ? 'Testing...' : 'Test Connection'}
        </button>
      </div>

      <div className="space-y-3">
        {/* Overall Status */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          {getStatusIcon(connectionStatus.isConnected)}
          <div>
            <p className={`font-medium ${getStatusColor(connectionStatus.isConnected)}`}>
              {connectionStatus.isConnected ? 'Connected' : 'Connection Issues'}
            </p>
            <p className="text-sm text-gray-600">
              {connectionStatus.isConnected 
                ? 'Firebase services are available' 
                : 'Some Firebase services are unavailable'
              }
            </p>
          </div>
        </div>

        {/* Individual Service Status */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(connectionStatus.app)}
              <span className="text-sm font-medium">Firebase App</span>
            </div>
            <p className="text-xs text-gray-600">
              {connectionStatus.app ? 'Initialized' : 'Not available'}
            </p>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(connectionStatus.auth)}
              <span className="text-sm font-medium">Authentication</span>
            </div>
            <p className="text-xs text-gray-600">
              {connectionStatus.auth ? 'Available' : 'Not available'}
            </p>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(connectionStatus.db)}
              <span className="text-sm font-medium">Firestore</span>
            </div>
            <p className="text-xs text-gray-600">
              {connectionStatus.db ? 'Available' : 'Not available'}
            </p>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(connectionStatus.storage)}
              <span className="text-sm font-medium">Storage</span>
            </div>
            <p className="text-xs text-gray-600">
              {connectionStatus.storage ? 'Available' : 'Not available'}
            </p>
          </div>
        </div>

        {/* Last Test Time */}
        {lastTest && (
          <div className="text-xs text-gray-500 text-center">
            Last tested: {lastTest.toLocaleTimeString()}
          </div>
        )}

        {/* Troubleshooting Tips */}
        {!connectionStatus.isConnected && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Troubleshooting Tips</span>
            </div>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>• Check your internet connection</li>
              <li>• Verify Firebase project configuration</li>
              <li>• Check Firebase console for service status</li>
              <li>• Ensure Firestore rules allow read/write access</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

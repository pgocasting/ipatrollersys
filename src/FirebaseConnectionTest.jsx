import React, { useState, useEffect } from 'react';
import { 
  testFirebaseConnection, 
  checkFirebaseConnection, 
  checkConnectionHealth,
  handleQUICError 
} from './firebase';

const FirebaseConnectionTest = () => {
  const [connectionStatus, setConnectionStatus] = useState('Testing...');
  const [connectionDetails, setConnectionDetails] = useState({});
  const [healthStatus, setHealthStatus] = useState('Checking...');
  const [isTesting, setIsTesting] = useState(false);

  const testConnection = async () => {
    setIsTesting(true);
    setConnectionStatus('Testing connection...');
    
    try {
      const result = await testFirebaseConnection();
      setConnectionStatus(result ? '✅ Connection successful' : '❌ Connection failed');
      
      const details = checkFirebaseConnection();
      setConnectionDetails(details);
    } catch (error) {
      setConnectionStatus(`❌ Error: ${error.message}`);
      console.error('Connection test error:', error);
    } finally {
      setIsTesting(false);
    }
  };

  const checkHealth = async () => {
    setHealthStatus('Checking health...');
    
    try {
      const health = await checkConnectionHealth();
      setHealthStatus(`${health.status}: ${health.message}`);
    } catch (error) {
      setHealthStatus(`Error: ${error.message}`);
      console.error('Health check error:', error);
    }
  };

  const handleQUICErrorTest = async () => {
    setIsTesting(true);
    setConnectionStatus('Testing QUIC error handling...');
    
    try {
      const result = await handleQUICError();
      setConnectionStatus(result ? '✅ QUIC error handled successfully' : '❌ QUIC error handling failed');
    } catch (error) {
      setConnectionStatus(`❌ QUIC error handling error: ${error.message}`);
      console.error('QUIC error handling error:', error);
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    testConnection();
    checkHealth();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Firebase Connection Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Connection Status */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Connection Status</h2>
          <div className="space-y-3">
            <div>
              <span className="font-medium">Status: </span>
              <span className={connectionStatus.includes('✅') ? 'text-green-600' : 'text-red-600'}>
                {connectionStatus}
              </span>
            </div>
            
            <div>
              <span className="font-medium">Health: </span>
              <span className={healthStatus.includes('connected') ? 'text-green-600' : 'text-red-600'}>
                {healthStatus}
              </span>
            </div>
          </div>
          
          <button
            onClick={testConnection}
            disabled={isTesting}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isTesting ? 'Testing...' : 'Test Connection'}
          </button>
        </div>

        {/* Connection Details */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Connection Details</h2>
          <div className="space-y-2">
            {Object.entries(connectionDetails).map(([key, value]) => (
              <div key={key}>
                <span className="font-medium">{key}: </span>
                <span className={value ? 'text-green-600' : 'text-red-600'}>
                  {typeof value === 'boolean' ? (value ? '✅' : '❌') : value}
                </span>
              </div>
            ))}
          </div>
          
          <button
            onClick={checkHealth}
            className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Check Health
          </button>
        </div>
      </div>

      {/* QUIC Error Handling Test */}
      <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">QUIC Error Handling Test</h2>
        <p className="text-gray-600 mb-4">
          This button tests the QUIC protocol error handling mechanism. Use this if you're experiencing 
          <code className="bg-gray-100 px-2 py-1 rounded">net::ERR_QUIC_PROTOCOL_ERROR</code> issues.
        </p>
        
        <button
          onClick={handleQUICErrorTest}
          disabled={isTesting}
          className="px-6 py-3 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
        >
          {isTesting ? 'Testing QUIC Error Handling...' : 'Test QUIC Error Handling'}
        </button>
      </div>

      {/* Troubleshooting Tips */}
      <div className="mt-6 bg-blue-50 p-6 rounded-lg">
        <h2 className="text-lg font-semibold mb-4 text-blue-800">Troubleshooting Tips</h2>
        <div className="space-y-2 text-blue-700">
          <p>• <strong>QUIC Protocol Error:</strong> This usually indicates network/firewall restrictions blocking QUIC traffic.</p>
          <p>• <strong>Solution:</strong> The app now forces HTTP/2 connections and includes automatic QUIC error recovery.</p>
          <p>• <strong>Network Issues:</strong> Try refreshing the page or checking your network connection.</p>
          <p>• <strong>Firewall:</strong> Ensure your firewall allows connections to Firebase services.</p>
        </div>
      </div>
    </div>
  );
};

export default FirebaseConnectionTest;

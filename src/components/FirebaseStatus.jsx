import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  XCircle,
  Activity,
  Database,
  Shield
} from 'lucide-react';
import { 
  checkFirebaseConnection, 
  checkConnectionHealth, 
  initializeAndTest 
} from '../firebase';

export default function FirebaseStatus() {
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [lastCheck, setLastCheck] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      console.log('🔍 Checking Firebase connection status...');
      
      // Check basic connection
      const basicStatus = checkFirebaseConnection();
      console.log('📊 Basic connection status:', basicStatus);
      
      // Check detailed health
      const healthStatus = await checkConnectionHealth();
      console.log('🏥 Health check status:', healthStatus);
      
      setConnectionStatus(healthStatus.status);
      setErrorDetails(healthStatus.message);
      setLastCheck(new Date());
      setRetryCount(basicStatus.retryCount || 0);
      
      // If there are connection issues, try to recover
      if (healthStatus.status === 'error' || healthStatus.status === 'disconnected') {
        console.log('⚠️ Connection issues detected, attempting recovery...');
        await attemptRecovery();
      }
      
    } catch (error) {
      console.error('❌ Error checking connection status:', error);
      setConnectionStatus('error');
      setErrorDetails(error.message);
      setLastCheck(new Date());
    } finally {
      setIsChecking(false);
    }
  };

  const attemptRecovery = async () => {
    try {
      console.log('🔧 Attempting connection recovery...');
      
      // Wait a bit before attempting recovery
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Try to reinitialize Firebase services
      await initializeAndTest();
      
      // Check status again
      await checkStatus();
      
    } catch (error) {
      console.error('❌ Recovery attempt failed:', error);
    }
  };

  const forceReconnect = async () => {
    try {
      setIsChecking(true);
      console.log('🔄 Force reconnecting to Firebase...');
      
      // Force reinitialization
      await initializeAndTest();
      
      // Wait a bit and check status
      await new Promise(resolve => setTimeout(resolve, 1000));
      await checkStatus();
      
    } catch (error) {
      console.error('❌ Force reconnect failed:', error);
      setErrorDetails(`Force reconnect failed: ${error.message}`);
    } finally {
      setIsChecking(false);
    }
  };

  // Check status on component mount
  useEffect(() => {
    checkStatus();
    
    // Set up periodic health checks
    const healthCheckInterval = setInterval(checkStatus, 30000); // Check every 30 seconds
    
    return () => clearInterval(healthCheckInterval);
  }, []);

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'recovered':
        return <Activity className="h-5 w-5 text-blue-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'disconnected':
        return <WifiOff className="h-5 w-5 text-red-500" />;
      case 'checking':
        return <RefreshCw className={`h-5 w-5 text-gray-500 ${isChecking ? 'animate-spin' : ''}`} />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'recovered':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'disconnected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'checking':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'recovered':
        return 'Recovered';
      case 'error':
        return 'Connection Error';
      case 'disconnected':
        return 'Disconnected';
      case 'checking':
        return 'Checking...';
      default:
        return 'Unknown Status';
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Database className="h-5 w-5" />
          Firebase Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium">Status:</span>
          </div>
          <Badge className={getStatusColor()}>
            {getStatusText()}
          </Badge>
        </div>

        {/* Connection Details */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-gray-500" />
            <span>Connection: {connectionStatus === 'connected' ? 'Active' : 'Inactive'}</span>
          </div>
          
          {retryCount > 0 && (
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-gray-500" />
              <span>Retry Count: {retryCount}</span>
            </div>
          )}
          
          {lastCheck && (
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-gray-500" />
              <span>Last Check: {lastCheck.toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        {/* Error Details */}
        {errorDetails && connectionStatus !== 'connected' && (
          <div className="rounded-md bg-yellow-50 p-3 border border-yellow-200">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Issue Detected:</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">{errorDetails}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={checkStatus}
            disabled={isChecking}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
            Check Status
          </Button>
          
          {connectionStatus !== 'connected' && (
            <Button
              onClick={forceReconnect}
              disabled={isChecking}
              variant="default"
              size="sm"
              className="flex-1"
            >
              <Wifi className="h-4 w-4 mr-2" />
              Reconnect
            </Button>
          )}
        </div>

        {/* Troubleshooting Tips */}
        {connectionStatus !== 'connected' && (
          <div className="rounded-md bg-blue-50 p-3 border border-blue-200">
            <div className="flex items-center gap-2 text-blue-800 mb-2">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Troubleshooting Tips:</span>
            </div>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Check your internet connection</li>
              <li>• Verify Firebase project configuration</li>
              <li>• Check browser console for detailed errors</li>
              <li>• Try refreshing the page</li>
              <li>• Contact administrator if issues persist</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { 
  Wifi, 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  XCircle,
  Activity,
  Shield,
  Zap
} from 'lucide-react';
import { firebaseDiagnostics } from './utils/firebaseDiagnostics';
import { checkConnectionHealth, initializeAndTest } from './firebase';

export default function FirebaseTest() {
  const [diagnostics, setDiagnostics] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [healthStatus, setHealthStatus] = useState(null);
  const [lastCheck, setLastCheck] = useState(null);

  const runDiagnostics = async () => {
    setIsRunning(true);
    try {
      console.log('🔍 Starting comprehensive Firebase diagnostics...');
      const results = await firebaseDiagnostics.runDiagnostics();
      setDiagnostics(results);
      setLastCheck(new Date());
      console.log('✅ Diagnostics completed:', results);
    } catch (error) {
      console.error('❌ Diagnostics failed:', error);
      setDiagnostics({ error: error.message });
    } finally {
      setIsRunning(false);
    }
  };

  const checkHealth = async () => {
    try {
      const health = await checkConnectionHealth();
      setHealthStatus(health);
      console.log('🏥 Health check result:', health);
    } catch (error) {
      console.error('❌ Health check failed:', error);
      setHealthStatus({ status: 'error', message: error.message });
    }
  };

  const forceReconnect = async () => {
    try {
      setIsRunning(true);
      console.log('🔄 Force reconnecting to Firebase...');
      
      await initializeAndTest();
      await checkHealth();
      
      console.log('✅ Force reconnect completed');
    } catch (error) {
      console.error('❌ Force reconnect failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
      case 'connected':
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
      case 'recovered':
        return <Activity className="h-5 w-5 text-blue-500" />;
      case 'error':
      case 'disconnected':
      case 'unhealthy':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
      case 'connected':
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
      case 'recovered':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'error':
      case 'disconnected':
      case 'unhealthy':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Firebase Connection Diagnostics</h1>
          <p className="text-gray-600">Comprehensive testing and troubleshooting for Firebase connectivity issues</p>
        </div>

        {/* Quick Health Check */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Quick Health Check
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {healthStatus && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(healthStatus.status)}
                  <div>
                    <p className="font-medium">Status: {healthStatus.status}</p>
                    <p className="text-sm text-gray-600">{healthStatus.message}</p>
                  </div>
                </div>
                <Badge className={getStatusColor(healthStatus.status)}>
                  {healthStatus.status}
                </Badge>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button onClick={checkHealth} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Check Health
              </Button>
              <Button onClick={forceReconnect} variant="default" size="sm">
                <Zap className="h-4 w-4 mr-2" />
                Force Reconnect
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Comprehensive Diagnostics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Comprehensive Diagnostics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={runDiagnostics} 
              disabled={isRunning}
              className="w-full"
              size="lg"
            >
              <RefreshCw className={`h-5 w-5 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
              {isRunning ? 'Running Diagnostics...' : 'Run Full Diagnostics'}
            </Button>

            {diagnostics && (
              <div className="space-y-4">
                {/* Basic Connection */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-2">Basic Connection</h3>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(diagnostics.basic?.status)}
                    <span className="text-sm">{diagnostics.basic?.message}</span>
                    {diagnostics.basic?.code && (
                      <Badge variant="outline" className="text-xs">
                        {diagnostics.basic.code}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Network Status */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-2">Network Status</h3>
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4" />
                    <span className="text-sm">{diagnostics.network?.message}</span>
                  </div>
                </div>

                {/* Permissions */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-2">Permissions</h3>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm">{diagnostics.permissions?.message}</span>
                    {diagnostics.permissions?.suggestion && (
                      <p className="text-xs text-gray-600 mt-1">{diagnostics.permissions.suggestion}</p>
                    )}
                  </div>
                </div>

                {/* Performance */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-2">Performance</h3>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    <span className="text-sm">{diagnostics.performance?.message}</span>
                    {diagnostics.performance?.responseTime && (
                      <Badge variant="outline" className="text-xs">
                        {diagnostics.performance.responseTime}ms
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Recommendations */}
                {diagnostics.recommendations && diagnostics.recommendations.length > 0 && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-medium text-blue-800 mb-2">Recommendations</h3>
                    <div className="space-y-2">
                      {diagnostics.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <Badge 
                            className={`text-xs ${
                              rec.priority === 'critical' ? 'bg-red-100 text-red-800' :
                              rec.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}
                          >
                            {rec.priority}
                          </Badge>
                          <div className="text-sm">
                            <p className="font-medium">{rec.message}</p>
                            <p className="text-gray-600">{rec.action}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timestamp */}
                {lastCheck && (
                  <div className="text-xs text-gray-500 text-center">
                    Last diagnostics run: {lastCheck.toLocaleString()}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Troubleshooting Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Troubleshooting Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">Common Issues</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• 400 Bad Request errors</li>
                    <li>• Permission denied errors</li>
                    <li>• Network connectivity issues</li>
                    <li>• Service unavailable errors</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Quick Fixes</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Refresh the page</li>
                    <li>• Check internet connection</li>
                    <li>• Clear browser cache</li>
                    <li>• Try incognito mode</li>
                  </ul>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">If Problems Persist</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Check Firebase Console for service status</li>
                  <li>• Verify project configuration in firebase.js</li>
                  <li>• Check Firestore security rules</li>
                  <li>• Contact system administrator</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

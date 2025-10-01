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

export default function FirebaseTest() {
  const [diagnostics, setDiagnostics] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [healthStatus, setHealthStatus] = useState(null);
  const [lastCheck, setLastCheck] = useState(null);

  const runDiagnostics = async () => {
    setIsRunning(true);
    try {
      console.warn('⚠️ Firebase has been removed from this project');
      setDiagnostics({ error: 'Firebase has been removed from this project' });
      setLastCheck(new Date());
    } catch (error) {
      console.error('❌ Diagnostics failed:', error);
      setDiagnostics({ error: error.message });
    } finally {
      setIsRunning(false);
    }
  };

  const checkHealth = async () => {
    try {
      console.warn('⚠️ Firebase has been removed from this project');
      setHealthStatus({ status: 'disconnected', message: 'Firebase has been removed from this project' });
    } catch (error) {
      console.error('❌ Health check failed:', error);
      setHealthStatus({ status: 'error', message: error.message });
    }
  };

  const forceReconnect = async () => {
    try {
      setIsRunning(true);
      console.warn('⚠️ Firebase has been removed from this project');
      await checkHealth();
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Database className="w-8 h-8" />
              Firebase Connection Test - DISABLED
            </CardTitle>
            <p className="text-lg text-gray-600">
              ⚠️ Firebase has been removed from this project. All testing is disabled.
            </p>
          </CardHeader>
        </Card>

        {/* Health Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Connection Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {getStatusIcon(healthStatus?.status)}
              <div>
                <Badge className={getStatusColor(healthStatus?.status)}>
                  {healthStatus?.status || 'unknown'}
                </Badge>
                <p className="text-sm text-gray-600 mt-1">
                  {healthStatus?.message || 'Firebase has been removed from this project'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button onClick={runDiagnostics} disabled={isRunning || true}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Run Diagnostics
              </Button>
              <Button onClick={checkHealth} disabled={isRunning || true}>
                <Activity className="w-4 h-4 mr-2" />
                Check Health
              </Button>
              <Button onClick={forceReconnect} disabled={isRunning || true}>
                <Zap className="w-4 h-4 mr-2" />
                Force Reconnect
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Diagnostics Results */}
        {diagnostics && (
          <Card>
            <CardHeader>
              <CardTitle>Diagnostics Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">
                  ⚠️ Firebase has been removed from this project. No diagnostics available.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Last Check */}
        {lastCheck && (
          <Card>
            <CardHeader>
              <CardTitle>Last Check</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Last check: {lastCheck.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

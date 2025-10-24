import React, { useState } from 'react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Alert, AlertDescription } from './components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';

export default function FirebaseAuthTest() {
  const [email, setEmail] = useState('admin@ipatroller.gov.ph');
  const [password, setPassword] = useState('admin123456');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testDirectLogin = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.warn('⚠️ Firebase has been removed from this project');
      setResult({
        type: 'error',
        message: 'Firebase has been removed from this project',
        details: { success: false, error: 'Firebase has been removed from this project' }
      });
    } catch (error) {
      setResult({
        type: 'error',
        message: `Test error: ${error.message}`,
        details: error
      });
    } finally {
      setLoading(false);
    }
  };

  const testAppLogin = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.warn('⚠️ Firebase has been removed from this project');
      setResult({
        type: 'error',
        message: 'Firebase has been removed from this project',
        details: { success: false, error: 'Firebase has been removed from this project' }
      });
    } catch (error) {
      setResult({
        type: 'error',
        message: `App login error: ${error.message}`,
        details: error
      });
    } finally {
      setLoading(false);
    }
  };

  const createAdmin = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.warn('⚠️ Firebase has been removed from this project');
      setResult({
        type: 'error',
        message: 'Firebase has been removed from this project',
        details: { success: false, error: 'Firebase has been removed from this project' }
      });
    } catch (error) {
      setResult({
        type: 'error',
        message: `Admin creation error: ${error.message}`,
        details: error
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Firebase Authentication Test - DISABLED</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertDescription>
                ⚠️ Firebase has been removed from this project. Authentication testing is disabled.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                  disabled
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  disabled
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={testDirectLogin} disabled={loading || true}>
                Test Direct Firebase Login
              </Button>
              <Button onClick={testAppLogin} disabled={loading || true}>
                Test App Login
              </Button>
              <Button onClick={createAdmin} disabled={loading || true}>
                Create Admin User
              </Button>
            </div>

            {result && (
              <Alert variant={result.type === 'success' ? 'default' : 'destructive'}>
                <AlertDescription>
                  {result.message}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

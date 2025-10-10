import React, { useState, useEffect } from 'react';
import { useFirebase } from '../hooks/useFirebase';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { 
  CheckCircle, 
  AlertCircle,
  Shield,
  Database,
  User,
  Key,
  RefreshCw
} from 'lucide-react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebase';

export default function AuthDiagnostic() {
  const { getUsers, addUser, user: currentUser, loading } = useFirebase();
  const [diagnosticResults, setDiagnosticResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const runFullDiagnostic = async () => {
    setIsRunning(true);
    setError('');
    setSuccess('');
    
    const results = {
      firebaseAuth: { status: 'unknown', message: '' },
      firestore: { status: 'unknown', message: '' },
      adminUser: { status: 'unknown', message: '' },
      loginTest: { status: 'unknown', message: '' }
    };

    try {
      console.log('🔍 Starting full authentication diagnostic...');

      // Test 1: Firebase Auth Connection
      console.log('🔧 Test 1: Checking Firebase Auth connection...');
      try {
        if (auth) {
          results.firebaseAuth = { 
            status: 'success', 
            message: 'Firebase Auth is properly initialized' 
          };
        } else {
          results.firebaseAuth = { 
            status: 'error', 
            message: 'Firebase Auth is not initialized' 
          };
        }
      } catch (error) {
        results.firebaseAuth = { 
          status: 'error', 
          message: `Firebase Auth error: ${error.message}` 
        };
      }

      // Test 2: Firestore Connection
      console.log('🔧 Test 2: Checking Firestore connection...');
      try {
        const usersResult = await getUsers();
        if (usersResult.success) {
          results.firestore = { 
            status: 'success', 
            message: `Firestore connected. Found ${usersResult.data?.length || 0} users` 
          };
        } else {
          results.firestore = { 
            status: 'error', 
            message: `Firestore error: ${usersResult.error}` 
          };
        }
      } catch (error) {
        results.firestore = { 
          status: 'error', 
          message: `Firestore connection error: ${error.message}` 
        };
      }

      // Test 3: Check Admin User
      console.log('🔧 Test 3: Checking admin user...');
      try {
        const usersResult = await getUsers();
        if (usersResult.success) {
          const users = usersResult.data || [];
          const adminUser = users.find(u => u.email === 'admin@ipatroller.gov.ph');
          
          if (adminUser) {
            results.adminUser = { 
              status: 'success', 
              message: `Admin user found. Status: ${adminUser.status}, Role: ${adminUser.role}` 
            };
          } else {
            results.adminUser = { 
              status: 'warning', 
              message: 'Admin user not found in Firestore database' 
            };
          }
        } else {
          results.adminUser = { 
            status: 'error', 
            message: 'Cannot check admin user due to Firestore error' 
          };
        }
      } catch (error) {
        results.adminUser = { 
          status: 'error', 
          message: `Error checking admin user: ${error.message}` 
        };
      }

      // Test 4: Login Test
      console.log('🔧 Test 4: Testing login...');
      try {
        // First try to sign in
        const loginResult = await signInWithEmailAndPassword(auth, 'admin@ipatroller.gov.ph', 'admin123');
        results.loginTest = { 
          status: 'success', 
          message: `Login successful! User: ${loginResult.user.email}` 
        };
        
        // Sign out after test
        await signOut(auth);
        
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          results.loginTest = { 
            status: 'error', 
            message: 'Login failed: User not found in Firebase Auth' 
          };
        } else if (error.code === 'auth/wrong-password') {
          results.loginTest = { 
            status: 'error', 
            message: 'Login failed: Wrong password' 
          };
        } else if (error.code === 'auth/invalid-credential') {
          results.loginTest = { 
            status: 'error', 
            message: 'Login failed: Invalid credentials (user may not exist)' 
          };
        } else {
          results.loginTest = { 
            status: 'error', 
            message: `Login failed: ${error.message}` 
          };
        }
      }

      setDiagnosticResults(results);
      
      // Provide summary
      const hasErrors = Object.values(results).some(r => r.status === 'error');
      const hasWarnings = Object.values(results).some(r => r.status === 'warning');
      
      if (hasErrors) {
        setError('❌ Authentication diagnostic found errors. Check the results below.');
      } else if (hasWarnings) {
        setError('⚠️ Authentication diagnostic found warnings. Some issues need attention.');
      } else {
        setSuccess('✅ All authentication tests passed! Your system is working correctly.');
      }

    } catch (error) {
      setError(`❌ Diagnostic failed: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const createAdminUser = async () => {
    try {
      setIsRunning(true);
      setError('');
      setSuccess('');

      console.log('🔧 Creating admin user...');

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        'admin@ipatroller.gov.ph', 
        'admin123'
      );

      // Create Firestore user
      const userData = {
        name: "Administrator",
        email: "admin@ipatroller.gov.ph",
        role: "Admin",
        status: "Active",
        district: "ALL DISTRICTS",
        firebaseUID: userCredential.user.uid,
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: "system"
      };

      const result = await addUser(userData);
      if (result.success) {
        setSuccess(`✅ Admin user created successfully!

Email: admin@ipatroller.gov.ph
Password: admin123
Firebase UID: ${userCredential.user.uid}

You can now log in!`);
        
        // Run diagnostic again
        setTimeout(() => runFullDiagnostic(), 1000);
      } else {
        setError('Failed to create Firestore user: ' + result.error);
      }

    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setError('Admin user already exists in Firebase Auth. Creating Firestore user only...');
        
        try {
          const userData = {
            name: "Administrator",
            email: "admin@ipatroller.gov.ph",
            role: "Admin",
            status: "Active",
            district: "ALL DISTRICTS",
            firebaseUID: "IFY4rMQjmpYebztwNIWeVHt8UJk1",
            lastLogin: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            createdBy: "system"
          };

          const result = await addUser(userData);
          if (result.success) {
            setSuccess(`✅ Firestore user created for existing Firebase Auth user!

Email: admin@ipatroller.gov.ph
Password: admin123
Firebase UID: IFY4rMQjmpYebztwNIWeVHt8UJk1

You can now log in!`);
            setTimeout(() => runFullDiagnostic(), 1000);
          } else {
            setError('Failed to create Firestore user: ' + result.error);
          }
        } catch (firestoreError) {
          setError('Error creating Firestore user: ' + firestoreError.message);
        }
      } else {
        setError('Error creating admin user: ' + error.message);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <RefreshCw className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-600">PASS</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-600">WARNING</Badge>;
      case 'error':
        return <Badge variant="destructive">FAIL</Badge>;
      default:
        return <Badge variant="outline">UNKNOWN</Badge>;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Authentication Diagnostic</h1>
        <p className="text-gray-600">Comprehensive check of your authentication system</p>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="whitespace-pre-line">{success}</AlertDescription>
        </Alert>
      )}

      {/* Diagnostic Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Run Diagnostic
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Run a comprehensive diagnostic to check all aspects of your authentication system.
          </p>
          <div className="flex space-x-4">
            <Button 
              onClick={runFullDiagnostic}
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isRunning ? 'Running...' : 'Run Full Diagnostic'}
            </Button>
            <Button 
              onClick={createAdminUser}
              disabled={isRunning}
              variant="outline"
            >
              {isRunning ? 'Creating...' : 'Create Admin User'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Diagnostic Results */}
      {Object.keys(diagnosticResults).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Diagnostic Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Firebase Auth Test */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(diagnosticResults.firebaseAuth?.status)}
                <div>
                  <h3 className="font-semibold">Firebase Auth Connection</h3>
                  <p className="text-sm text-gray-600">{diagnosticResults.firebaseAuth?.message}</p>
                </div>
              </div>
              {getStatusBadge(diagnosticResults.firebaseAuth?.status)}
            </div>

            {/* Firestore Test */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(diagnosticResults.firestore?.status)}
                <div>
                  <h3 className="font-semibold">Firestore Connection</h3>
                  <p className="text-sm text-gray-600">{diagnosticResults.firestore?.message}</p>
                </div>
              </div>
              {getStatusBadge(diagnosticResults.firestore?.status)}
            </div>

            {/* Admin User Test */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(diagnosticResults.adminUser?.status)}
                <div>
                  <h3 className="font-semibold">Admin User Check</h3>
                  <p className="text-sm text-gray-600">{diagnosticResults.adminUser?.message}</p>
                </div>
              </div>
              {getStatusBadge(diagnosticResults.adminUser?.status)}
            </div>

            {/* Login Test */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(diagnosticResults.loginTest?.status)}
                <div>
                  <h3 className="font-semibold">Login Test</h3>
                  <p className="text-sm text-gray-600">{diagnosticResults.loginTest?.message}</p>
                </div>
              </div>
              {getStatusBadge(diagnosticResults.loginTest?.status)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Auth Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            Current Authentication Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Firebase Auth</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Loading:</span>
                  <Badge variant={loading ? "destructive" : "default"}>
                    {loading ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>User Logged In:</span>
                  <Badge variant={currentUser ? "default" : "secondary"}>
                    {currentUser ? "Yes" : "No"}
                  </Badge>
                </div>
                {currentUser && (
                  <div className="text-sm">
                    <p><strong>Email:</strong> {currentUser.email}</p>
                    <p><strong>UID:</strong> {currentUser.uid}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Quick Actions</h3>
              <div className="space-y-2">
                <Button 
                  onClick={() => window.location.href = '/user-manager'}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Go to User Manager
                </Button>
                <Button 
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Go to Login Page
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Common Issues & Solutions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-red-50 rounded-lg">
              <h4 className="font-semibold text-red-900 mb-2">"User not found in system"</h4>
              <p className="text-red-700">User exists in Firebase Auth but not in Firestore. Click "Create Admin User" to fix.</p>
            </div>
            
            <div className="p-3 bg-yellow-50 rounded-lg">
              <h4 className="font-semibold text-yellow-900 mb-2">"Account disabled"</h4>
              <p className="text-yellow-700">User exists but status is "Inactive" in Firestore. User will be created with "Active" status.</p>
            </div>
            
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Firestore Connection Errors</h4>
              <p className="text-blue-700">Check Firebase project settings, Firestore rules, and network connection.</p>
            </div>
            
            <div className="p-3 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">All Tests Pass</h4>
              <p className="text-green-700">Your authentication system is working correctly. You can log in normally.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

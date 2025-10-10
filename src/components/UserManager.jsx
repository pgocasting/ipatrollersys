import React, { useState, useEffect } from 'react';
import { useFirebase } from '../hooks/useFirebase';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { 
  UserPlus, 
  Users, 
  CheckCircle, 
  AlertCircle,
  Shield,
  Key,
  Database
} from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

export default function UserManager() {
  const { getUsers, addUser, user: currentUser } = useFirebase();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await getUsers();
      if (result.success) {
        setUsers(result.data || []);
        console.log('📊 Loaded users:', result.data?.length || 0);
      } else {
        setError('Failed to load users: ' + result.error);
      }
    } catch (error) {
      setError('Error loading users: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createAdminUser = async () => {
    try {
      setCreatingUser(true);
      setError('');
      setSuccess('');
      
      console.log('🔧 Step 1: Creating Firebase Auth user...');
      
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        'admin@ipatroller.gov.ph', 
        'admin123'
      );
      
      console.log('✅ Firebase Auth user created:', userCredential.user.email);
      console.log('👤 Firebase UID:', userCredential.user.uid);
      
      // Create Firestore user
      console.log('🔧 Step 2: Creating Firestore user...');
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
        console.log('✅ Firestore user created successfully');
        setSuccess(`✅ Administrator user created successfully!

Email: admin@ipatroller.gov.ph
Password: admin123
Firebase UID: ${userCredential.user.uid}

You can now log in with these credentials!`);
        
        // Reload users list
        await loadUsers();
      } else {
        setError('Failed to create Firestore user: ' + result.error);
      }
      
    } catch (error) {
      console.error('❌ Error creating admin user:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError('⚠️ Administrator user already exists in Firebase Auth. Creating Firestore user only...');
        
        // Try to create Firestore user only
        try {
          const userData = {
            name: "Administrator",
            email: "admin@ipatroller.gov.ph",
            role: "Admin",
            status: "Active",
            district: "ALL DISTRICTS",
            firebaseUID: "IFY4rMQjmpYebztwNIWeVHt8UJk1", // Use the provided UID
            lastLogin: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            createdBy: "system"
          };

          const result = await addUser(userData);
          if (result.success) {
            setSuccess(`✅ Firestore user created for existing Firebase Auth user!

Email: admin@ipatroller.gov.ph
Password: admin123 (use existing password)
Firebase UID: IFY4rMQjmpYebztwNIWeVHt8UJk1

You can now log in!`);
            await loadUsers();
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
      setCreatingUser(false);
    }
  };

  const createTestUser = async () => {
    try {
      setCreatingUser(true);
      setError('');
      setSuccess('');
      
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        'test@ipatroller.gov.ph', 
        'test123'
      );
      
      // Create Firestore user
      const userData = {
        name: "Test User",
        email: "test@ipatroller.gov.ph",
        role: "User",
        status: "Active",
        district: "DISTRICT 1",
        firebaseUID: userCredential.user.uid,
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: "system"
      };

      const result = await addUser(userData);
      if (result.success) {
        setSuccess(`✅ Test user created successfully!

Email: test@ipatroller.gov.ph
Password: test123
Firebase UID: ${userCredential.user.uid}

You can now log in with these credentials!`);
        await loadUsers();
      } else {
        setError('Failed to create test user: ' + result.error);
      }
      
    } catch (error) {
      console.error('❌ Error creating test user:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError('Test user already exists in Firebase Auth. You can try logging in with test@ipatroller.gov.ph / test123');
      } else {
        setError('Error creating test user: ' + error.message);
      }
    } finally {
      setCreatingUser(false);
    }
  };

  const checkFirestoreConnection = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔧 Testing Firestore connection...');
      const result = await getUsers();
      
      if (result.success) {
        setSuccess(`✅ Firestore connection successful!

Found ${result.data?.length || 0} users in database.
Connection is working properly.`);
      } else {
        setError(`❌ Firestore connection failed: ${result.error}

Possible issues:
1. Firestore rules are too restrictive
2. Network connectivity issues
3. Firebase project configuration
4. Database permissions`);
      }
    } catch (error) {
      setError(`❌ Firestore connection error: ${error.message}

Please check:
1. Firebase project settings
2. Firestore security rules
3. Network connection`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">User Manager</h1>
        <p className="text-gray-600">Fix authentication issues and manage users</p>
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

      {/* Firestore Connection Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="w-5 h-5 mr-2" />
            Firestore Connection Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Test the connection to Firestore database to identify connection issues.
          </p>
          <Button 
            onClick={checkFirestoreConnection}
            disabled={loading}
            variant="outline"
          >
            {loading ? 'Testing...' : 'Test Firestore Connection'}
          </Button>
        </CardContent>
      </Card>

      {/* User Creation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserPlus className="w-5 h-5 mr-2" />
            Create Users
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Administrator User</h3>
              <p className="text-sm text-gray-600 mb-3">
                Creates admin user in both Firebase Auth and Firestore
              </p>
              <div className="text-xs text-gray-500 mb-3">
                <strong>Email:</strong> admin@ipatroller.gov.ph<br/>
                <strong>Password:</strong> admin123<br/>
                <strong>Role:</strong> Admin
              </div>
              <Button 
                onClick={createAdminUser}
                disabled={creatingUser}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {creatingUser ? 'Creating...' : 'Create Administrator'}
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Test User</h3>
              <p className="text-sm text-gray-600 mb-3">
                Creates test user for verification
              </p>
              <div className="text-xs text-gray-500 mb-3">
                <strong>Email:</strong> test@ipatroller.gov.ph<br/>
                <strong>Password:</strong> test123<br/>
                <strong>Role:</strong> User
              </div>
              <Button 
                onClick={createTestUser}
                disabled={creatingUser}
                variant="outline"
                className="w-full"
              >
                {creatingUser ? 'Creating...' : 'Create Test User'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Current Users ({users.length})
            </span>
            <Button variant="outline" size="sm" onClick={loadUsers} disabled={loading}>
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No users found in Firestore database.</p>
              <p className="text-sm text-gray-400 mt-2">
                Create users above to fix the "User not found in system" error.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{user.name}</h3>
                      <Badge variant={user.status === 'Active' ? 'default' : 'secondary'}>
                        {user.status}
                      </Badge>
                      <Badge variant="outline">{user.role}</Badge>
                    </div>
                    <p className="text-gray-600 text-sm">{user.email}</p>
                    <p className="text-gray-500 text-sm">{user.district}</p>
                    {user.firebaseUID && (
                      <p className="text-xs text-gray-400">UID: {user.firebaseUID}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Fix Login Issues</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Step 1: Test Firestore Connection</h4>
              <p className="text-blue-700">Click "Test Firestore Connection" to verify database access.</p>
            </div>
            
            <div className="p-3 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">Step 2: Create Administrator User</h4>
              <p className="text-green-700">Click "Create Administrator" to create the admin user in both Firebase Auth and Firestore.</p>
            </div>
            
            <div className="p-3 bg-yellow-50 rounded-lg">
              <h4 className="font-semibold text-yellow-900 mb-2">Step 3: Test Login</h4>
              <p className="text-yellow-700">Try logging in with admin@ipatroller.gov.ph / admin123</p>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Common Issues:</h4>
              <ul className="text-gray-700 list-disc list-inside space-y-1">
                <li>"User not found in system" = User exists in Firebase Auth but not in Firestore</li>
                <li>"Account disabled" = User exists but status is "Inactive" in Firestore</li>
                <li>Firestore connection errors = Database access or rules issues</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

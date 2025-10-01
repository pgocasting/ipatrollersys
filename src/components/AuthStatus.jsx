import React from 'react';
import { useFirebase } from '../hooks/useFirebase';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Loader2, User, Mail, Calendar } from 'lucide-react';

export default function AuthStatus() {
  const { user, loading } = useFirebase();

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Authentication Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Loading authentication status...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {user ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
          Authentication Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {user ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="default" className="bg-green-100 text-green-800">
                Authenticated
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-500" />
                <span className="font-medium">User ID:</span>
                <span className="text-gray-600 font-mono text-xs">{user.uid}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Email:</span>
                <span className="text-gray-600">{user.email}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Last Sign In:</span>
                <span className="text-gray-600">
                  {user.metadata?.lastSignInTime 
                    ? new Date(user.metadata.lastSignInTime).toLocaleString()
                    : 'Unknown'
                  }
                </span>
              </div>
            </div>

            {user.emailVerified === false && (
              <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  Email not verified
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="destructive">
                Not Authenticated
              </Badge>
            </div>
            
            <p className="text-gray-600 text-sm">
              Please log in to access the IPatroller system.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import React, { useState } from "react";
import Layout from "./Layout";
import { settingsLog, createSectionGroup, CONSOLE_GROUPS } from './utils/consoleGrouping';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert";
import { Progress } from "./components/ui/progress";
import { 
  Lock,
  Key,
  Save, 
  Eye, 
  EyeOff,
  CheckCircle2,
  AlertCircle,
  LogOut,
  User,
  UserCircle,
  Shield
} from "lucide-react";
import { useFirebase } from "./hooks/useFirebase";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./components/ui/dialog";

export default function Settings({ onLogout, onNavigate, currentPage }) {
  const { changePassword } = useFirebase();
  
  // Password change state
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  // Password validation
  const validatePassword = (password) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;
    
    const validCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar, isLongEnough]
      .filter(Boolean).length;
    
    return {
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      isLongEnough,
      strength: (validCount / 5) * 100,
      isValid: hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar && isLongEnough
    };
  };

  // Handle password change
  const handlePasswordChange = async () => {
    setMessage({ type: '', text: '' });

    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill in all password fields' });
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    const passwordValidation = validatePassword(passwords.newPassword);
    if (!passwordValidation.isValid) {
      setMessage({ type: 'error', text: 'Password does not meet all requirements' });
      return;
    }

    setIsLoading(true);
    try {
      const result = await changePassword(passwords.currentPassword, passwords.newPassword);
      
      if (result.success) {
        setShowSuccessDialog(true);
        setPasswords({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const passwordValidation = validatePassword(passwords.newPassword);

  return (
    <Layout onLogout={onLogout} onNavigate={onNavigate} currentPage={currentPage}>
      <div className="container mx-auto p-6 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Manage your account settings and preferences.</p>
          </div>
        </div>

        <Tabs defaultValue="account" className="space-y-6 [&_*]:border-gray-200">
          <TabsList>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <UserCircle className="h-4 w-4" />
              Account
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Password Requirements Card */}
                <Card className="border-gray-200 bg-muted/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <CardTitle className="text-sm">Password Strength</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Progress value={passwordValidation.strength} className="h-2" />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        {passwordValidation.isLongEnough ? 
                          <CheckCircle2 className="h-4 w-4 text-green-600" /> : 
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                        <span>At least 8 characters</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {passwordValidation.hasUpperCase ? 
                          <CheckCircle2 className="h-4 w-4 text-green-600" /> : 
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                        <span>Uppercase letter</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {passwordValidation.hasLowerCase ? 
                          <CheckCircle2 className="h-4 w-4 text-green-600" /> : 
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                        <span>Lowercase letter</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {passwordValidation.hasNumbers ? 
                          <CheckCircle2 className="h-4 w-4 text-green-600" /> : 
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                        <span>Number</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {passwordValidation.hasSpecialChar ? 
                          <CheckCircle2 className="h-4 w-4 text-green-600" /> : 
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                        <span>Special character</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {message.text && (
                  <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                    {message.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                    <AlertTitle>
                      {message.type === 'error' ? 'Error' : 'Success'}
                    </AlertTitle>
                    <AlertDescription>{message.text}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        name="currentPassword"
                        type={showPasswords.current ? "text" : "password"}
                        value={passwords.currentPassword}
                        onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
                        className="pr-10"
                        autoComplete="current-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => togglePasswordVisibility('current')}
                      >
                        {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type={showPasswords.new ? "text" : "password"}
                        value={passwords.newPassword}
                        autoComplete="new-password"
                        onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => togglePasswordVisibility('new')}
                      >
                        {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showPasswords.confirm ? "text" : "password"}
                        value={passwords.confirmPassword}
                        onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                        className="pr-10"
                        autoComplete="new-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => togglePasswordVisibility('confirm')}
                      >
                        {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <Button
                    onClick={handlePasswordChange}
                    disabled={isLoading}
                    className="flex-1 bg-black hover:bg-black/90 text-white"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Key className="mr-2 h-4 w-4" />
                        Update Password
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPasswords({
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: ""
                      });
                    }}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Clear Form
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="sm:max-w-[425px] bg-white border border-slate-200">
            <DialogHeader className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Password Updated Successfully
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Your password has been changed. For security reasons, you can choose to:
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-gray-200 hover:bg-gray-50"
                  onClick={() => {
                    setShowSuccessDialog(false);
                    onLogout();
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout Now
                </Button>
                <Button
                  className="flex-1 bg-black hover:bg-black/90 text-white"
                  onClick={() => setShowSuccessDialog(false)}
                >
                  <User className="mr-2 h-4 w-4" />
                  Stay Logged In
                </Button>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700 text-center font-medium">
                  💡 Note: Staying logged in means you'll continue using your current session
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
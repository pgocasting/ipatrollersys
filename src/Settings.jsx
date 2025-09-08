import React, { useState } from "react";
import Layout from "./Layout";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { 
  Lock,
  Key,
  Save, 
  Eye, 
  EyeOff,
  Shield,
  CheckCircle,
  AlertCircle,
  LogOut,
  User,
  Database,
  Cloud,
  Code,
  TestTube
} from "lucide-react";
import { useFirebase } from "./hooks/useFirebase";

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
  const [showChoiceModal, setShowChoiceModal] = useState(false);

  // Password validation
  const validatePassword = (password) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;
    
    return {
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      isLongEnough,
      isValid: hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar && isLongEnough
    };
  };

  // Handle password change
  const handlePasswordChange = async () => {
    // Clear previous messages
    setMessage({ type: '', text: '' });

    // Validation
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
        // Show choice modal instead of success message
        setShowChoiceModal(true);
        // Reset form
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

  return (
    <Layout onLogout={onLogout} onNavigate={onNavigate} currentPage={currentPage}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Settings</h1>
            <p className="text-lg text-gray-600">Change your account password</p>
              </div>

          {/* Password Change Card */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-center justify-center">
                <Lock className="w-8 h-8 text-red-600" />
                Change Password
                    </CardTitle>
              <p className="text-center text-gray-600">
                Update your password to keep your account secure
              </p>
              </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Password Requirements */}
              <div className="p-6 rounded-xl border bg-blue-50 border-blue-200">
                  <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Shield className="w-5 h-5 text-blue-600" />
                    </div>
                  <h3 className="text-lg font-semibold text-blue-700">
                      Password Requirements
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`flex items-center gap-2 p-3 rounded-lg ${validatePassword(passwords.newPassword).isLongEnough ? 'bg-green-100/50' : 'bg-blue-100/50'}`}>
                      {validatePassword(passwords.newPassword).isLongEnough ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-blue-500" />}
                      <span className={`text-sm ${validatePassword(passwords.newPassword).isLongEnough ? 'text-green-700' : 'text-blue-700'}`}>Minimum 8 characters</span>
                    </div>
                    <div className={`flex items-center gap-2 p-3 rounded-lg ${validatePassword(passwords.newPassword).hasUpperCase ? 'bg-green-100/50' : 'bg-blue-100/50'}`}>
                      {validatePassword(passwords.newPassword).hasUpperCase ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-blue-500" />}
                      <span className={`text-sm ${validatePassword(passwords.newPassword).hasUpperCase ? 'text-green-700' : 'text-blue-700'}`}>Uppercase letter</span>
                    </div>
                    <div className={`flex items-center gap-2 p-3 rounded-lg ${validatePassword(passwords.newPassword).hasLowerCase ? 'bg-green-100/50' : 'bg-blue-100/50'}`}>
                      {validatePassword(passwords.newPassword).hasLowerCase ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-blue-500" />}
                      <span className={`text-sm ${validatePassword(passwords.newPassword).hasLowerCase ? 'text-green-700' : 'text-blue-700'}`}>Lowercase letter</span>
                    </div>
                    <div className={`flex items-center gap-2 p-3 rounded-lg ${validatePassword(passwords.newPassword).hasNumbers ? 'bg-green-100/50' : 'bg-blue-100/50'}`}>
                      {validatePassword(passwords.newPassword).hasNumbers ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-blue-500" />}
                      <span className={`text-sm ${validatePassword(passwords.newPassword).hasNumbers ? 'text-green-700' : 'text-blue-700'}`}>Numbers</span>
                    </div>
                    <div className={`flex items-center gap-2 p-3 rounded-lg ${validatePassword(passwords.newPassword).hasSpecialChar ? 'bg-green-100/50' : 'bg-blue-100/50'}`}>
                      {validatePassword(passwords.newPassword).hasSpecialChar ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-blue-500" />}
                      <span className={`text-sm ${validatePassword(passwords.newPassword).hasSpecialChar ? 'text-green-700' : 'text-blue-700'}`}>Special character</span>
                    </div>
                  </div>
                                  </div>

                {/* Message Display */}
                {message.text && (
                  <div className={`p-4 rounded-lg border ${
                    message.type === 'success' 
                      ? 'bg-green-50 border-green-200 text-green-800' 
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    <div className="flex items-center gap-2">
                      {message.type === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className="font-medium">{message.text}</span>
                    </div>
                  </div>
                )}

                {/* Password Change Form */}
                <div className="space-y-6">
                  <div>
                  <Label htmlFor="currentPassword" className="text-lg font-semibold text-gray-900">
                      Current Password
                    </Label>
                  <div className="relative mt-2">
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? "text" : "password"}
                      value={passwords.currentPassword}
                      onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
                      placeholder="Enter your current password"
                      className="pr-12 text-lg py-3"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  </div>

                  <div>
                  <Label htmlFor="newPassword" className="text-lg font-semibold text-gray-900">
                      New Password
                    </Label>
                  <div className="relative mt-2">
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? "text" : "password"}
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                      placeholder="Enter your new password"
                      className="pr-12 text-lg py-3"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  </div>

                  <div>
                  <Label htmlFor="confirmPassword" className="text-lg font-semibold text-gray-900">
                      Confirm New Password
                    </Label>
                  <div className="relative mt-2">
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwords.confirmPassword}
                      onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                      placeholder="Confirm your new password"
                      className="pr-12 text-lg py-3"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  </div>

                  {/* Action Buttons */}
                <div className="flex items-center gap-4 pt-6">
                    <Button
                    onClick={handlePasswordChange}
                    disabled={isLoading}
                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          <span>Updating...</span>
                        </div>
                      ) : (
                        <>
                          <Key className="w-5 h-5 mr-2" />
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
                    className="px-8 py-3 text-lg font-medium transition-all duration-300 hover:scale-105 border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                      Clear Form
                    </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Development Tools Section */}
          <div className="mt-8">
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl text-blue-900">
                  <Code className="w-6 h-6" />
                  Development Tools
                </CardTitle>
                <p className="text-blue-700 text-sm">
                  Access development and testing tools for system administration
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Firebase Testing */}
                  <Button
                    onClick={() => onNavigate('firebase-test')}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-100 hover:border-blue-400 transition-all duration-200"
                  >
                    <Database className="w-8 h-8" />
                    <div className="text-center">
                      <div className="font-semibold">Firebase Testing</div>
                      <div className="text-xs text-blue-600">Connection diagnostics & health checks</div>
                    </div>
                  </Button>

                  {/* Firestore Test */}
                  <Button
                    onClick={() => onNavigate('firestoretest')}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2 border-indigo-300 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-400 transition-all duration-200"
                  >
                    <TestTube className="w-8 h-8" />
                    <div className="text-center">
                      <div className="font-semibold">Firestore Test</div>
                      <div className="text-xs text-indigo-600">Database connection & data testing</div>
                    </div>
                  </Button>

                  {/* Cloudinary Demo */}
                  <Button
                    onClick={() => onNavigate('cloudinary-demo')}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2 border-purple-300 text-purple-700 hover:bg-purple-100 hover:border-purple-400 transition-all duration-200"
                  >
                    <Cloud className="w-8 h-8" />
                    <div className="text-center">
                      <div className="font-semibold">Cloudinary Demo</div>
                      <div className="text-xs text-purple-600">File upload & management testing</div>
                    </div>
                  </Button>

                                 {/* Firebase-Cloudinary Integration */}
               <Button
                 onClick={() => onNavigate('firebase-cloudinary-demo')}
                 variant="outline"
                 className="h-auto p-4 flex flex-col items-center gap-2 border-green-300 text-green-700 hover:bg-green-100 hover:border-green-400 transition-all duration-200"
               >
                 <TestTube className="w-8 h-8" />
                 <div className="text-center">
                   <div className="font-semibold">Integration Demo</div>
                   <div className="text-xs text-green-600">Firebase + Cloudinary integration testing</div>
                 </div>
               </Button>

               {/* Photo Migration Tool */}
               <Button
                 onClick={() => onNavigate('photo-migration')}
                 variant="outline"
                 className="h-auto p-4 flex flex-col items-center gap-2 border-orange-300 text-orange-700 hover:bg-orange-100 hover:border-orange-400 transition-all duration-200"
               >
                 <Cloud className="w-8 h-8" />
                 <div className="text-center">
                   <div className="font-semibold">Photo Migration</div>
                   <div className="text-xs text-orange-600">Migrate existing photos to Cloudinary</div>
                 </div>
               </Button>
                </div>
                
                <div className="pt-4 border-t border-blue-200">
                  <p className="text-xs text-blue-600 text-center">
                    These tools are for development and testing purposes. Use them to verify system functionality.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Choice Modal */}
      {showChoiceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Password Updated Successfully!
              </h3>
              <p className="text-gray-600">
                Your password has been changed. For security reasons, you can choose to:
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => {
                  setShowChoiceModal(false);
                  onLogout();
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 text-lg font-semibold"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Logout Now
              </Button>
              
              <Button
                onClick={() => setShowChoiceModal(false)}
                variant="outline"
                className="w-full py-3 text-lg font-medium border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <User className="w-5 h-5 mr-2" />
                Stay Logged In
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              Note: Staying logged in means you'll continue using your current session
            </p>
          </div>
        </div>
      )}
    </Layout>
  );
}

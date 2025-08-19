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
  CheckCircle
} from "lucide-react";

export default function Settings({ onLogout, onNavigate, currentPage }) {
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

  // Handle password change
  const handlePasswordChange = () => {
    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      alert("Please fill in all password fields");
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      alert("New passwords do not match");
      return;
    }

    if (passwords.newPassword.length < 8) {
      alert("New password must be at least 8 characters long");
      return;
    }

    // In a real app, this would validate current password and update
    alert("Password changed successfully!");
    
    // Reset form
    setPasswords({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
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
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-100/50">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-blue-700">Minimum 8 characters</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-100/50">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-blue-700">Uppercase letter</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-100/50">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-blue-700">Lowercase letter</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-100/50">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-blue-700">Special character</span>
                  </div>
                </div>
              </div>

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
                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Key className="w-5 h-5 mr-2" />
                    Update Password
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
        </div>
      </div>
    </Layout>
  );
}
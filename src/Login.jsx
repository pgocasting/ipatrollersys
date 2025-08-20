import React, { useState } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Alert, AlertDescription } from "./components/ui/alert";
import { Loader2, Shield, Eye, EyeOff, Lock, Mail, Building2 } from "lucide-react";
import { useFirebase } from "./hooks/useFirebase";

// Import logo images
import ipatrollerLogo from "/images/Ipatroller_Logo.png";
import logoFallback from "/images/logo.svg";

export default function Login({ onLogin }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useFirebase();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      console.log('🔐 Attempting login with:', formData.email);
      const result = await signIn(formData.email, formData.password);
      
      if (result.success) {
        console.log('✅ Login successful:', result.user?.email);
        onLogin();
      } else {
        console.error('❌ Login failed:', result.error);
        setError(result.error || "Invalid email or password");
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      if (error.code === 'auth/user-not-found') {
        setError("User not found. Please check your email or contact administrator.");
      } else if (error.code === 'auth/wrong-password') {
        setError("Incorrect password. Please try again.");
      } else if (error.code === 'auth/too-many-requests') {
        setError("Too many failed attempts. Please try again later.");
      } else if (error.code === 'auth/network-request-failed') {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError(`Login error: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 sm:p-6">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-300/5 to-indigo-300/5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo and Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-0">
            <div className="relative group">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl blur-2xl opacity-30 group-hover:opacity-40 transition-opacity duration-500 scale-110"></div>
              
              {/* Logo Container */}
              <div className="relative group-hover:shadow-blue-500/25 transition-all duration-500">
                <div className="w-48 h-48 relative">
                  <img 
                    src={ipatrollerLogo}
                    alt="IPatroller Logo"
                    className="w-full h-full object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      console.error('Failed to load logo image:', e.target.src);
                      // Fallback to SVG if PNG fails
                      e.target.src = logoFallback;
                    }}
                  />
                  {/* Subtle inner glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Title Section */}
          <div className="space-y-3">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
              LOG IN
            </h1>
            <p className="text-gray-600 text-lg font-medium">
              Login to your IPatroller account
            </p>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 p-8 sm:p-10">
          <form onSubmit={handleSubmit} className="space-y-7">
            {/* Email Field */}
            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                Email Address
              </Label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors duration-200" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl text-gray-900 placeholder-gray-500 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/70 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg"
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-3">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600" />
                Password
              </Label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors duration-200" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-2xl text-gray-900 placeholder-gray-500 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/70 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="animate-in slide-in-from-top-2 duration-300">
                <Alert variant="destructive" className="border-red-200 bg-red-50/80 backdrop-blur-sm text-red-800 rounded-2xl shadow-lg">
                  <AlertDescription className="font-medium text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 text-white font-semibold text-lg rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
              >
                {/* Button Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                
                {isLoading ? (
                  <div className="flex items-center justify-center relative z-10">
                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                    <span>Logging in...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center relative z-10">
                    <Lock className="w-6 h-6 mr-3" />
                    <span>Log in</span>
                  </div>
                )}
              </Button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-10 pt-6 border-t border-gray-200/50 text-center">
            <p className="text-sm text-gray-600 font-medium">
              © 2025 IPatroller System. All rights reserved.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Advanced Security Management Platform
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 
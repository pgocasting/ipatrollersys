import React, { useState } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Alert, AlertDescription } from "./components/ui/alert";
import { Loader2 } from "lucide-react";
import { useFirebase } from "./hooks/useFirebase";
import { useTheme } from "./ThemeContext";

export default function Login({ onLogin }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useFirebase();
  const { isDarkMode } = useTheme();

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
    <div className={`min-h-screen flex items-stretch transition-all duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}>
      {/* Left Side - Enhanced Logo Section */}
      <div className="hidden lg:flex flex-col items-center justify-center w-1/2 relative overflow-hidden">
        {/* Animated Background Gradients */}
        <div className={`absolute inset-0 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900' 
            : 'bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600'
        }`}></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/30 via-transparent to-blue-900/30"></div>
        
        {/* Animated Floating Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-l from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-2xl animate-pulse delay-500"></div>
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
        
        {/* Content Container */}
        <div className="relative z-10 text-center max-w-2xl mx-auto px-8">
          {/* Enhanced Logo Container */}
          <div className="mb-16 relative">
            {/* Logo Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-full blur-2xl scale-150"></div>
            
            {/* Logo Container with Enhanced Styling */}
            <div className="relative flex items-center justify-center w-40 h-40 mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 rounded-full blur-xl"></div>
              <div className="relative bg-white/10 backdrop-blur-sm rounded-full p-6 border border-white/20 shadow-2xl">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/a/a2/Ph_seal_bataan2.png"
                  alt="Bataan Seal"
                  className="w-full h-full object-contain drop-shadow-2xl"
                  loading="eager"
                />
              </div>
            </div>
          </div>

          {/* Enhanced Text Content */}
          <div className="mb-16">
            <h1 className="text-5xl font-bold mb-6 text-white drop-shadow-2xl">
              <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                Patrol
              </span>
              <span className="block text-3xl font-semibold text-blue-200 mt-2">System</span>
            </h1>
            <p className="text-xl mb-8 text-blue-100 font-medium leading-relaxed">
              Welcome to Bataan's Integrated Patrol Management System
            </p>
            
            {/* Enhanced Feature Points */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-8 text-left max-w-xl mx-auto">
              <div className="group flex items-center space-x-4 p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">Real-time Tracking</h3>
                  <p className="text-blue-200 text-sm">Live patrol monitoring</p>
                </div>
              </div>
              
              <div className="group flex items-center space-x-4 p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-r from-green-500 to-green-600 shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">Smart Reporting</h3>
                  <p className="text-blue-200 text-sm">Automated incident logs</p>
                </div>
              </div>
              
              <div className="group flex items-center space-x-4 p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-r from-purple-500 to-purple-600 shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">GPS Integration</h3>
                  <p className="text-blue-200 text-sm">Precise location tracking</p>
                </div>
              </div>
              
              <div className="group flex items-center space-x-4 p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-r from-red-500 to-red-600 shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">Secure Access</h3>
                  <p className="text-blue-200 text-sm">Encrypted data protection</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Decorative Element */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center space-x-2 text-blue-200/80">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Powered by Advanced Technology</span>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-500"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Enhanced Card Design */}
          <div className="relative">
            {/* Background Gradient */}
            <div className={`absolute inset-0 rounded-3xl blur-xl opacity-60 ${
              isDarkMode 
                ? 'bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800' 
                : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
            }`}></div>
            
            {/* Main Card */}
            <div className={`relative backdrop-blur-xl rounded-3xl shadow-2xl p-8 lg:p-10 border transition-all duration-300 ${
              isDarkMode 
                ? 'bg-gray-900/95 border-gray-700' 
                : 'bg-white/95 border-white/30'
            }`}>
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-400/20 to-blue-400/20 rounded-full blur-2xl"></div>
              
              {/* Mobile Logo (visible on small screens) */}
              <div className="lg:hidden text-center mb-8">
                <div className="flex items-center justify-center w-28 h-28 mx-auto mb-4">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/a/a2/Ph_seal_bataan2.png"
                    alt="Bataan Seal"
                    className="w-full h-full object-contain"
                    loading="eager"
                  />
                </div>
                <h1 className={`text-2xl font-bold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
            Patrol System
          </h1>
              </div>

              {/* Enhanced Login Form Title */}
              <div className="text-center space-y-3 mb-10">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
                <h2 className={`text-3xl font-bold ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent' 
                    : 'bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent'
                }`}>
                  Welcome Back
                </h2>
                <p className={`font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Sign in to access your dashboard
          </p>
        </div>

              {/* Enhanced Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field with Icon */}
                <div className="space-y-3">
                  <Label htmlFor="email" className={`text-sm font-semibold flex items-center gap-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                    Email Address
              </Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
              <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                onChange={handleChange}
                required
                      className={`w-full pl-12 pr-4 py-4 border-2 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md ${
                        isDarkMode 
                          ? 'border-gray-600 bg-gray-800/80 text-white placeholder-gray-400 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500' 
                          : 'border-gray-200 bg-white/80 text-gray-900 placeholder-gray-500 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500'
                      }`}
                      placeholder="Enter your email address"
                    />
                  </div>
            </div>

                {/* Password Field with Icon */}
                <div className="space-y-3">
                  <Label htmlFor="password" className={`text-sm font-semibold flex items-center gap-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                Password
              </Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                      className={`w-full pl-12 pr-4 py-4 border-2 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md ${
                        isDarkMode 
                          ? 'border-gray-600 bg-gray-800/80 text-white placeholder-gray-400 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500' 
                          : 'border-gray-200 bg-white/80 text-gray-900 placeholder-gray-500 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500'
                      }`}
                placeholder="Enter your password"
              />
                  </div>
            </div>

                {/* Enhanced Error Message */}
            {error && (
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-2xl blur-xl"></div>
                    <Alert variant="destructive" className={`relative rounded-2xl shadow-lg ${
                      isDarkMode 
                        ? 'bg-red-900/20 border-red-700/50' 
                        : 'bg-red-50/90 border-red-200/50'
                    }`}>
                      <AlertDescription className={`font-medium ${
                        isDarkMode ? 'text-red-300' : 'text-red-800'
                      }`}>
                  {error}
                </AlertDescription>
              </Alert>
                  </div>
            )}

                {/* Enhanced Submit Button */}
                <div className="pt-4">
            <Button
              type="submit"
              disabled={isLoading}
                    className="w-full font-bold py-4 rounded-2xl shadow-xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 hover:from-blue-700 hover:via-blue-800 hover:to-purple-700 text-white text-lg relative overflow-hidden group"
            >
                    {/* Button Background Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
              {isLoading ? (
                      <div className="flex items-center justify-center relative z-10">
                        <Loader2 className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" />
                        <span className="text-lg">Signing in...</span>
                </div>
              ) : (
                      <div className="flex items-center justify-center relative z-10">
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        <span className="text-lg">Sign In</span>
                      </div>
              )}
            </Button>
                </div>
          </form>

                {/* Enhanced Footer */}
              <div className="text-center mt-8 pt-6 border-t border-gray-200/50">
                <p className="text-sm text-gray-600 font-medium">
                  © 2025 Patrol System. All rights reserved.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Secure • Reliable • Efficient
            </p>
          </div>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
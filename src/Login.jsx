import React, { useState } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Alert, AlertDescription } from "./components/ui/alert";
import { Loader2, Shield, MapPin, Activity, BarChart3, Eye, EyeOff } from "lucide-react";
import { useFirebase } from "./hooks/useFirebase";
import { useTheme } from "./ThemeContext";

export default function Login({ onLogin }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
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
    
    // Set typing effect
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 1000);
  };

  return (
    <div className={`h-screen flex flex-col lg:flex-row transition-all duration-500 overflow-hidden ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900' 
        : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'
    }`}>
      
      {/* Left Side - Login Form (No Card) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6">
            <div className="flex items-center justify-center w-20 h-20 mx-auto mb-3">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/a/a2/Ph_seal_bataan2.png"
                alt="Bataan Seal"
                className="w-full h-full object-contain"
                loading="eager"
              />
            </div>
            <h1 className={`text-xl font-bold mb-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              iPatroller System
            </h1>
          </div>

          {/* Form Header */}
          <div className="text-center space-y-3 mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
            <h2 className={`text-2xl font-bold ${
              isDarkMode 
                ? 'bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent' 
                : 'bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent'
            }`}>
              Welcome Back
            </h2>
            <p className={`text-sm font-medium ${
              isDarkMode ? 'text-slate-300' : 'text-slate-600'
            }`}>
              Sign in to access your dashboard
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className={`text-xs font-semibold flex items-center gap-2 ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
                Email Address
              </Label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className={`w-full pl-10 pr-3 py-3 border-2 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-lg text-sm ${
                    isDarkMode 
                      ? 'border-slate-600 bg-slate-800/80 text-white placeholder-slate-400 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500' 
                      : 'border-slate-200 bg-white/80 text-slate-900 placeholder-slate-500 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500'
                  }`}
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className={`text-xs font-semibold flex items-center gap-2 ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Password
              </Label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className={`w-full pl-10 pr-10 py-3 border-2 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-lg text-sm ${
                    isDarkMode 
                      ? 'border-slate-600 bg-slate-800/80 text-white placeholder-slate-400 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500' 
                      : 'border-slate-200 bg-white/80 text-slate-900 placeholder-slate-500 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500'
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="relative animate-in slide-in-from-top-2 duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-xl blur-xl"></div>
                <Alert variant="destructive" className={`relative rounded-xl shadow-lg border-0 text-sm ${
                  isDarkMode 
                    ? 'bg-red-900/20 text-red-300' 
                    : 'bg-red-50/90 text-red-800'
                }`}>
                  <AlertDescription className="font-medium">
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
                className="w-full font-bold py-3 rounded-xl shadow-xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white text-base relative overflow-hidden group"
              >
                {/* Button Background Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {isLoading ? (
                  <div className="flex items-center justify-center relative z-10">
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                    <span className="text-sm">Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center relative z-10">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span className="text-sm">Sign In</span>
                  </div>
                )}
              </Button>
            </div>
          </form>

          {/* Footer */}
          <div className="text-center mt-6 pt-4 border-t border-slate-200/50">
            <p className={`text-xs font-medium ${
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>
              © 2025 iPatroller System. All rights reserved.
            </p>
            <p className={`text-xs mt-1 ${
              isDarkMode ? 'text-slate-500' : 'text-slate-500'
            }`}>
              Secure • Reliable • Efficient
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Redesigned Blue Gradient Background with Typing Effects */}
      <div className="hidden lg:flex flex-col items-center justify-center w-1/2 relative overflow-hidden">
        {/* Blue Gradient Background */}
        <div className="absolute inset-0">
          {/* Primary Blue Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800"></div>
          
          {/* Secondary Blue Overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/30 via-transparent to-indigo-900/40"></div>
          
          {/* Accent Blue Layer */}
          <div className="absolute inset-0 bg-gradient-to-bl from-cyan-500/20 via-transparent to-blue-800/30"></div>
        </div>
        
        {/* Animated Blue Elements */}
        <div className="absolute inset-0">
          {/* Floating Blue Circles */}
          <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-blue-400/40 to-cyan-400/40 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-l from-indigo-400/40 to-blue-400/40 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-gradient-to-r from-cyan-400/30 to-blue-400/30 rounded-full blur-2xl animate-pulse delay-500"></div>
          
          {/* Additional Blue Elements */}
          <div className="absolute top-1/4 right-1/4 w-20 h-20 bg-gradient-to-r from-blue-300/30 to-indigo-300/30 rounded-full blur-2xl animate-pulse delay-700"></div>
          <div className="absolute bottom-1/4 left-1/4 w-28 h-28 bg-gradient-to-l from-indigo-300/30 to-blue-300/30 rounded-full blur-2xl animate-pulse delay-300"></div>
        </div>
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
        
        {/* Content */}
        <div className="relative z-10 text-center max-w-xl mx-auto px-6">
          {/* Logo Section with Blue Glow */}
          <div className="mb-12 relative group">
            {/* Enhanced Blue Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/60 to-indigo-400/60 rounded-full blur-3xl scale-150 group-hover:scale-175 transition-transform duration-700"></div>
            
            {/* Logo Container */}
            <div className="relative flex items-center justify-center w-36 h-36 mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-white/15 rounded-full blur-xl"></div>
              <div className="relative bg-white/20 backdrop-blur-sm rounded-full p-6 border border-white/30 shadow-2xl group-hover:shadow-blue-400/50 transition-all duration-500">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/a/a2/Ph_seal_bataan2.png"
                  alt="Bataan Seal"
                  className="w-full h-full object-contain drop-shadow-2xl group-hover:scale-110 transition-transform duration-500"
                  loading="eager"
                />
              </div>
            </div>
          </div>

          {/* Hero Text with Blue Theme */}
          <div className="mb-12 space-y-6">
            <h1 className="text-5xl font-bold mb-4 text-white drop-shadow-2xl">
              <span className="bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent">
                iPatroller
              </span>
              <span className="block text-3xl font-semibold text-blue-200 mt-2 bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent">
                System
              </span>
            </h1>
            <p className="text-lg mb-6 text-blue-100 font-medium leading-relaxed max-w-lg mx-auto">
              Advanced Patrol Management & Incident Reporting System for Bataan Province
            </p>
            
            {/* Feature Cards with Blue Theme */}
            <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
              <div className="group p-4 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 hover:bg-white/25 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-400/25">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg group-hover:shadow-xl transition-all duration-300 mb-3 mx-auto">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-semibold text-base mb-1">Smart Patrol</h3>
                <p className="text-blue-200 text-xs leading-relaxed">Real-time location tracking & route optimization</p>
              </div>
              
              <div className="group p-4 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 hover:bg-white/25 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-400/25">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg group-hover:shadow-xl transition-all duration-300 mb-3 mx-auto">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-semibold text-base mb-1">Live Monitoring</h3>
                <p className="text-blue-200 text-xs leading-relaxed">Instant incident alerts & response tracking</p>
              </div>
              
              <div className="group p-4 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 hover:bg-white/25 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-400/25">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg group-hover:shadow-xl transition-all duration-300 mb-3 mx-auto">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-semibold text-base mb-1">Analytics</h3>
                <p className="text-blue-200 text-xs leading-relaxed">Comprehensive reporting & performance insights</p>
              </div>
              
              <div className="group p-4 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 hover:bg-white/25 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-400/25">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r from-red-500 to-orange-500 shadow-lg group-hover:shadow-xl transition-all duration-300 mb-3 mx-auto">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-semibold text-base mb-1">Secure</h3>
                <p className="text-blue-200 text-xs leading-relaxed">Enterprise-grade security & data protection</p>
              </div>
            </div>
          </div>
          
          {/* Bottom Badge with Blue Theme */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/25">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              <span className="text-cyan-200 text-xs font-medium">Powered by Advanced Technology</span>
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-500"></div>
            </div>
          </div>
        </div>
        
        {/* Typing Effect Overlay */}
        {isTyping && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Blue Ripple Effect */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-96 h-96 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full animate-ping"></div>
            </div>
            
            {/* Floating Blue Particles */}
            <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-blue-400 rounded-full animate-bounce"></div>
            <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
            <div className="absolute bottom-1/4 right-1/4 w-5 h-5 bg-cyan-400 rounded-full animate-bounce delay-200"></div>
            <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-blue-300 rounded-full animate-bounce delay-300"></div>
          </div>
        )}
      </div>
    </div>
  );
} 
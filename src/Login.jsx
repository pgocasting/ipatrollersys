import React, { useState } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Alert, AlertDescription } from "./components/ui/alert";
import { Loader2, Lock, Eye, EyeOff, Mail, Shield, Brain } from "lucide-react";
import { useFirebase } from "./hooks/useFirebase";

// Import logo images
import ipatrollerLogo from "/images/Ipatroller_Logo.png";
import logoFallback from "/images/logo.svg";

export default function Login({ onLogin }) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    keepLoggedIn: false,
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
      const result = await signIn(formData.username, formData.password, formData.keepLoggedIn);
      
      if (result.success) {
        onLogin();
      } else {
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
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="min-h-screen flex lg:flex-row-reverse">
      {/* Left Section - Enhanced Gradient Branding */}
      <div className="hidden lg:flex flex-col justify-center items-center w-3/5 relative overflow-hidden">
        {/* Multi-layer Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/30 via-transparent to-purple-600/20"></div>
        <div className="absolute inset-0 bg-gradient-to-bl from-cyan-500/20 via-transparent to-blue-900/30"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-cyan-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-10 w-24 h-24 bg-purple-400/15 rounded-full blur-lg animate-pulse delay-500"></div>
        <div className="absolute bottom-1/3 right-10 w-20 h-20 bg-blue-400/20 rounded-full blur-lg animate-pulse delay-700"></div>
        
        {/* Geometric Shapes */}
        <div className="absolute top-32 right-32 w-16 h-16 border border-white/20 rotate-45"></div>
        <div className="absolute bottom-32 left-32 w-12 h-12 border border-white/15 rotate-12"></div>
        <div className="absolute top-1/3 left-1/4 w-8 h-8 border border-cyan-300/25 rotate-45"></div>
        
        {/* Content Container */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          {/* Logo */}
          <div className="mb-12 text-center w-full">
            <div className="flex flex-col items-center mb-8">
              <div className="mb-6 relative">
                {/* Logo Glow Effect */}
                <div className="absolute inset-0 bg-blue-400/30 rounded-full blur-2xl scale-150"></div>
                <img 
                  src={ipatrollerLogo}
                  alt="IPatroller Logo"
                  className="w-48 h-48 object-contain relative z-10 drop-shadow-2xl"
                  onError={(e) => {
                    console.error('Failed to load logo image:', e.target.src);
                    e.target.src = logoFallback;
                  }}
                />
              </div>
              <span className="text-5xl font-bold text-center drop-shadow-lg" style={{ fontFamily: 'Arial Black, Helvetica Bold, sans-serif' }}>
                - 1Bataan I-Patroller -
              </span>
            </div>
          </div>

          {/* Main Content */}
          <div className="text-center w-full">
            <h1 className="text-3xl mb-6 text-white/90 italic drop-shadow-md" style={{ fontFamily: 'Calibri, sans-serif' }}>
              Provincial Government of Bataan
            </h1>
            <p className="text-xl text-blue-100/90 italic whitespace-nowrap drop-shadow-md leading-relaxed" style={{ fontFamily: 'Calibri, sans-serif' }}>
              Advanced patrol management and incident reporting system for enhanced security operations.
            </p>
          </div>
          
          {/* Bottom Decorative Elements */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center">
            <div className="flex space-x-4">
              <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-cyan-300/60 rounded-full animate-pulse delay-300"></div>
              <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse delay-600"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="w-full lg:w-2/5 flex items-center justify-center p-6 lg:p-12 bg-white">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Log in
            </h1>
            <p className="text-gray-600">
              Login to your IPatroller account
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-semibold text-gray-700">
                Username *
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full py-3 border-2 border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                placeholder="Enter your username"
                autoComplete="username"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                Password *
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pr-12 py-3 border-2 border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Keep me logged in checkbox */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="keepLoggedIn"
                name="keepLoggedIn"
                checked={formData.keepLoggedIn}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 hover:border-blue-500 transition-colors duration-200"
              />
              <Label htmlFor="keepLoggedIn" className="text-sm text-gray-700 cursor-pointer hover:text-blue-600 transition-colors duration-200">
                Keep me logged in
              </Label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="animate-in slide-in-from-top-2 duration-300">
                <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800 rounded-lg">
                  <AlertDescription className="font-medium text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Login Button */}
            <Button
              type="submit"
              name="login"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  <span>Logging in...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Lock className="w-5 h-5 mr-2" />
                  <span>Log in now</span>
                </div>
              )}
            </Button>
          </form>



          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              © 2025 IPatroller System. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 
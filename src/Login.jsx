import React, { useState } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Alert, AlertDescription } from "./components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./components/ui/card";
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
    <div className="min-h-screen flex items-start justify-center bg-white p-4 pt-30">
      {/* Login Card Container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Login Form Card with Shadow */}
        <Card className="shadow-xl border-gray-200 bg-white">
          {/* Logo Section - Inside Card */}
          <CardHeader className="text-center pt-8 pb-8">
            <div className="inline-block mb-4">
              <img 
                src={ipatrollerLogo}
                alt="IPatroller Logo"
                className="w-36 h-36 object-contain mx-auto drop-shadow-lg"
                onError={(e) => {
                  console.error('Failed to load logo image:', e.target.src);
                  e.target.src = logoFallback;
                }}
              />
            </div>
            <CardTitle className="text-4xl font-bold text-gray-900 mb-2">1Bataan I-Patroller</CardTitle>
            <CardDescription className="text-base text-gray-600">
              Provincial Government of Bataan
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Field */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-base font-medium text-gray-700">
                  Username
                </Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="h-12 text-base bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter your username"
                  autoComplete="username"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-base font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="h-12 text-base pr-12 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Keep me logged in */}
              <div className="flex items-center pt-2">
                <input
                  type="checkbox"
                  id="keepLoggedIn"
                  name="keepLoggedIn"
                  checked={formData.keepLoggedIn}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <Label htmlFor="keepLoggedIn" className="ml-2 text-base text-gray-700 cursor-pointer">
                  Keep me logged in
                </Label>
              </div>

              {/* Error Message */}
              {error && (
                <Alert variant="destructive" className="border-red-300 bg-red-50">
                  <AlertDescription className="text-base text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Login Button */}
              <Button
                type="submit"
                name="login"
                disabled={isLoading}
                className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin h-5 w-5" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Lock className="w-5 h-5" />
                    <span>Sign in</span>
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            © 2025 IPatroller System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
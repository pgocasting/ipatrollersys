import React, { useState } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./components/ui/dialog";
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
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useFirebase();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setShowErrorModal(false);
    setIsLoading(true);

    try {
      const result = await signIn(formData.username, formData.password, formData.keepLoggedIn);
      
      if (result.success) {
        onLogin();
      } else {
        setError(result.error || "Invalid email or password");
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      if (error.code === 'auth/user-not-found') {
        setError("User not found. Please check your email or contact administrator.");
        setShowErrorModal(true);
      } else if (error.code === 'auth/wrong-password') {
        setError("Incorrect password. Please try again.");
        setShowErrorModal(true);
      } else if (error.code === 'auth/too-many-requests') {
        setError("Too many failed attempts. Please try again later.");
        setShowErrorModal(true);
      } else if (error.code === 'auth/network-request-failed') {
        setError("Network error. Please check your connection and try again.");
        setShowErrorModal(true);
      } else {
        setError(`Login error: ${error.message}`);
        setShowErrorModal(true);
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
    <div className="min-h-screen flex items-start justify-center bg-white p-2 sm:p-4 pt-8 sm:pt-30">
      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Login failed</DialogTitle>
            <DialogDescription>
              {error || "Login failed. Please try again."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" onClick={() => setShowErrorModal(false)}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Login Card Container */}
      <div className="relative z-10 w-full max-w-md">

        {/* Login Form Card with Shadow */}
        <Card className="shadow-xl border-gray-200 bg-white">
          {/* Logo Section - Inside Card */}
          <CardHeader className="text-center pt-4 sm:pt-8 pb-4 sm:pb-8 px-4">
            <div className="inline-block mb-2 sm:mb-4">
              <img 
                src={ipatrollerLogo}
                alt="IPatroller Logo"
                className="w-24 h-24 sm:w-36 sm:h-36 object-contain mx-auto drop-shadow-lg"
                onError={(e) => {
                  console.error('Failed to load logo image:', e.target.src);
                  e.target.src = logoFallback;
                }}
              />
            </div>
            <CardTitle className="text-2xl sm:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">1Bataan I-Patroller</CardTitle>
            <CardDescription className="text-sm sm:text-base text-gray-600">
              Provincial Government of Bataan
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-4 sm:px-8 pb-6 sm:pb-8">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Username Field */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm sm:text-base font-medium text-gray-700">
                  Username
                </Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  style={{ color: "#000", WebkitTextFillColor: "#000", caretColor: "#000" }}
                  className="h-10 sm:h-12 text-sm sm:text-base bg-white border-gray-300 text-gray-900 caret-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter your username"
                  autoComplete="username"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm sm:text-base font-medium text-gray-700">
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
                    style={{ color: "#000", WebkitTextFillColor: "#000", caretColor: "#000" }}
                    className="h-10 sm:h-12 text-sm sm:text-base pr-12 bg-white border-gray-300 text-gray-900 caret-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
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
                <Label htmlFor="keepLoggedIn" className="ml-2 text-sm sm:text-base text-gray-700 cursor-pointer">
                  Keep me logged in
                </Label>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                name="login"
                disabled={isLoading}
                className="w-full h-10 sm:h-12 text-sm sm:text-base bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="mt-4 sm:mt-8 text-center px-2">
          <p className="text-xs sm:text-sm text-gray-500">
            © 2025 IPatroller System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
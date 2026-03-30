import React, { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Loader2, Lock, Eye, EyeOff, Mail, Shield, Brain } from "lucide-react";
import { useFirebase } from "../hooks/useFirebase";

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
    <div className="min-h-screen lg:h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden px-4 py-4 sm:py-8">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 animate-gradient-x"></div>
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-50"></div>

      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent className="sm:max-w-md rounded-2xl border-none shadow-2xl" showCloseButton={false}>
          <DialogHeader className="items-center text-center">
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-rose-500" />
            </div>
            <DialogTitle className="text-xl font-black text-slate-900">Authentication Failed</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
              {error || "Invalid credentials provided. Please try again."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center mt-2">
            <Button 
               type="button" 
               onClick={() => setShowErrorModal(false)}
               className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl px-8"
            >
              Acknowledge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Login Card Container */}
      <div className="relative z-10 w-full max-w-[420px] flex flex-col items-center">
        {/* Top Branding Section */}
        <div className="text-center mb-4">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 shadow-sm mb-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <p className="text-[9px] text-blue-700 font-black uppercase tracking-widest">Secure Government Portal</p>
           </div>
        </div>

        <Card className="w-full shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-white/60 bg-white/80 backdrop-blur-xl rounded-[2rem] overflow-hidden border">
          <CardHeader className="text-center pt-8 pb-4 px-8 relative">
            <div className="relative z-10">
              <div className="inline-block mb-4 group transition-transform hover:scale-110 duration-500">
                <img 
                  src={ipatrollerLogo}
                  alt="IPatroller Logo"
                  className="w-32 h-32 sm:w-40 sm:h-40 object-contain mx-auto drop-shadow-2xl"
                  onError={(e) => { e.target.src = logoFallback; }}
                />
              </div>
              <CardTitle className="text-2xl font-black text-slate-900 mb-1 tracking-tight uppercase">
                1Bataan <span className="text-blue-600">I-Patroller</span>
              </CardTitle>
              <CardDescription className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em]">
                System Administration Access
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="px-10 pb-10">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Field */}
              <div className="space-y-1.5 group">
                <Label htmlFor="username" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  System Identity
                </Label>
                <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500 text-slate-300">
                      <Mail className="w-4 h-4" />
                   </div>
                   <Input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    style={{ color: "#000", WebkitTextFillColor: "#000", caretColor: "#000" }}
                    className="h-11 pl-11 bg-slate-50/50 border-slate-200 text-slate-900 placeholder:text-slate-200 focus:border-blue-400 focus:ring-blue-100/50 rounded-xl transition-all font-bold text-sm"
                    placeholder="Registered Identity"
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5 group">
                <Label htmlFor="password" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Access Key
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500 text-slate-300">
                      <Lock className="w-4 h-4" />
                   </div>
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    style={{ color: "#000", WebkitTextFillColor: "#000", caretColor: "#000" }}
                    className="h-11 pl-11 pr-12 bg-slate-50/50 border-slate-200 text-slate-900 placeholder:text-slate-200 focus:border-blue-400 focus:ring-blue-100/50 rounded-xl transition-all font-bold text-sm"
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-slate-500 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Keep me logged in */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center group cursor-pointer">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      id="keepLoggedIn"
                      name="keepLoggedIn"
                      checked={formData.keepLoggedIn}
                      onChange={handleChange}
                      className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-slate-200 bg-white transition-all checked:bg-blue-600 checked:border-blue-600"
                    />
                    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100">
                      <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <span className="ml-2 text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-700 transition-colors">Remember Session</span>
                </label>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-black rounded-xl shadow-[0_10px_20px_rgba(37,99,235,0.2)] hover:shadow-[0_15px_30px_rgba(37,99,235,0.3)] transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 mt-2 uppercase tracking-[0.1em] text-xs"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin h-4 w-4" />
                    <span>Login...</span>
                  </div>
                ) : (
                  <span>Login</span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center space-y-3">
           <div className="px-3 py-1.5 bg-slate-100/50 rounded-xl border border-slate-200/30 inline-flex items-center gap-2 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
              <Shield className="w-3 h-3 text-slate-400" />
              <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">
                Protected by Provincial Security Protocols
              </p>
           </div>
           <p className="text-[9px] text-slate-400 font-medium uppercase tracking-[0.3em] block">
             © 2025 IPatroller System • BATAAN Provincial Government
           </p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 15s ease infinite;
        }
      `}} />
    </div>
  );
}
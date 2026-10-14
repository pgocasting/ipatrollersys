import React from 'react';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Ethereal Light Background Glows */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-100 dark:bg-blue-900/20 rounded-full blur-[100px] opacity-60 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-100 dark:bg-purple-900/20 rounded-full blur-[100px] opacity-60 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* WHITE THEME ATOMIC SPINNER */}
        <div className="relative w-64 h-64 flex items-center justify-center mb-12">
          
          {/* Nucleus (Bataan Logo) - Glassmorphism */}
          <div className="relative z-20 w-32 h-32 p-4 bg-white/40 dark:bg-slate-900/60 backdrop-blur-xl rounded-full border border-white dark:border-slate-700/50 shadow-[0_8px_32px_rgba(37,99,235,0.1)] animate-pulse flex items-center justify-center">
            <img 
              src="/images/Ipatroller_Logo.png"
              alt="Bataan Logo"
              className="w-full h-full object-contain drop-shadow-md"
            />
          </div>

          {/* Orbit 1 - Blue */}
          <div className="absolute w-full h-[80px] border-[2px] border-blue-500/20 rounded-[100%] rotate-x-60 animate-orbit-1">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-blue-500 rounded-full shadow-[0_0_12px_#3B82F6]"></div>
          </div>

          {/* Orbit 2 - Purple */}
          <div className="absolute w-full h-[80px] border-[2px] border-purple-500/20 rounded-[100%] rotate-[60deg] rotate-x-60 animate-orbit-2">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-purple-500 rounded-full shadow-[0_0_12px_#A855F7]"></div>
          </div>

          {/* Orbit 3 - Emerald/Teal */}
          <div className="absolute w-full h-[80px] border-[2px] border-emerald-500/20 rounded-[100%] rotate-[-60deg] rotate-x-60 animate-orbit-3">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-emerald-500 rounded-full shadow-[0_0_12px_#10B981]"></div>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-black tracking-tight text-slate-800 dark:text-slate-100 mb-3 uppercase drop-shadow-sm">
            Initializing <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">System</span>
          </h2>
          <div className="flex items-center justify-center w-56 mx-auto px-6 py-3 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-200/60 dark:border-slate-800 transition-transform hover:scale-105 duration-300">
            <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
              <div className="absolute inset-y-0 bg-blue-500 rounded-full animate-loading-bar"></div>
            </div>
          </div>
        </div>
        
        <p className="mt-16 text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[0.4em] italic opacity-80">Provincial Government of Bataan</p>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .rotate-x-60 { transform: rotateX(60deg); }
        @keyframes orbit-1 {
          from { transform: rotateX(65deg) rotate(0deg); }
          to { transform: rotateX(65deg) rotate(360deg); }
        }
        @keyframes orbit-2 {
          from { transform: rotateX(65deg) rotate(60deg) rotate(0deg); }
          to { transform: rotateX(65deg) rotate(60deg) rotate(360deg); }
        }
        @keyframes orbit-3 {
          from { transform: rotateX(65deg) rotate(-60deg) rotate(0deg); }
          to { transform: rotateX(65deg) rotate(-60deg) rotate(360deg); }
        }
        .animate-orbit-1 { animation: orbit-1 3.5s infinite linear; }
        .animate-orbit-2 { animation: orbit-2 4.5s infinite linear; }
        .animate-orbit-3 { animation: orbit-3 5.5s infinite linear; }
        @keyframes loading-bar {
          0% { left: -30%; width: 30%; }
          50% { width: 40%; }
          100% { left: 100%; width: 30%; }
        }
        .animate-loading-bar { animation: loading-bar 1.5s infinite ease-in-out; }
      `}} />
    </div>
  );
}

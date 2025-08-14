import React from "react";
import Layout from "./Layout";
import { useTheme } from "./ThemeContext";
import { FileText, Clock } from "lucide-react";

export default function Reports({ onLogout, onNavigate, currentPage }) {
  const { isDarkMode } = useTheme();

  return (
    <Layout onLogout={onLogout} onNavigate={onNavigate} currentPage={currentPage}>
      <div className="flex-1 p-6">
        {/* Coming Soon Message */}
        <div className={`flex items-center justify-center min-h-[600px] p-12 rounded-2xl shadow-lg transition-all duration-300 ${
          isDarkMode ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
        }`}>
          <div className="text-center">
            <div className={`w-32 h-32 mx-auto mb-8 rounded-full flex items-center justify-center transition-all duration-300 ${
              isDarkMode ? 'bg-blue-900/30 border border-blue-700/50' : 'bg-blue-100 border border-blue-200'
            }`}>
              <FileText className={`w-16 h-16 transition-colors duration-300 ${
                isDarkMode ? 'text-blue-400' : 'text-blue-600'
              }`} />
            </div>
            <h1 className={`text-5xl font-bold mb-6 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
              🚧 Coming Soon
            </h1>
            <h2 className={`text-2xl mb-6 transition-colors duration-300 ${
             isDarkMode ? 'text-gray-300' : 'text-gray-600'
           }`}>
              Reports & Analytics
             </h2>
            <p className={`text-xl mb-8 transition-colors duration-300 ${
                           isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              We're working hard to bring you comprehensive data analysis, reporting, and analytics features.
            </p>
            <div className={`inline-flex items-center gap-3 px-8 py-4 rounded-full text-lg font-medium transition-all duration-300 ${
              isDarkMode ? 'bg-blue-900/40 text-blue-200 border border-blue-700/50' : 'bg-blue-100/50 text-blue-800 border border-blue-300'
            }`}>
              <Clock className="w-6 h-6" />
              <span>Stay tuned for updates!</span>
                            </div>
                          </div>
                        </div>
      </div>
    </Layout>
  );
} 

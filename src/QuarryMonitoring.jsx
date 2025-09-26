import React from 'react';
import Layout from './Layout';
import { Card, CardContent } from './components/ui/card';
import { 
  Clock, 
  Wrench
} from 'lucide-react';

export default function QuarryMonitoring({ onLogout, onNavigate, currentPage }) {
  return (
    <Layout onLogout={onLogout} onNavigate={onNavigate} currentPage={currentPage}>
      <div className="container mx-auto p-6 space-y-8 relative">
        {/* Watermark */}
        <div className="fixed inset-0 pointer-events-none z-10 flex items-center justify-center">
          <div className="text-gray-200 text-8xl font-bold transform rotate-45 opacity-10 select-none">
            UNDER MAINTENANCE
          </div>
        </div>
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quarry Site Monitoring</h1>
            <p className="text-gray-500 mt-2">Monitor and manage quarry operations with comprehensive compliance tracking</p>
          </div>
        </div>

        {/* Under Maintenance Message - Main Content */}
        <div className="flex items-center justify-center min-h-[500px]">
          <Card className="w-full max-w-2xl mx-auto text-center shadow-lg">
            <CardContent className="p-12 space-y-6">
              <div className="mx-auto mb-6 p-6 bg-orange-100 rounded-full w-fit">
                <Wrench className="h-16 w-16 text-orange-600" />
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Under Maintenance</h2>
              <p className="text-gray-600 text-xl mb-6">
                The Quarry Site Monitoring system is currently under maintenance.
              </p>
              <div className="flex items-center justify-center gap-3 text-lg text-gray-500 mb-8">
                <Clock className="h-6 w-6" />
                <span>System will be back online shortly</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

import React from 'react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { testConsoleGrouping, testErrorLogging, testPerformanceLogging } from './utils/consoleGroupingTest';

/**
 * Console Grouping Demo Component
 * 
 * This component demonstrates the console grouping functionality
 * and allows users to test different logging scenarios.
 */
export default function ConsoleGroupingDemo() {
  const handleTestBasicLogging = () => {
    testConsoleGrouping();
  };

  const handleTestErrorLogging = () => {
    testErrorLogging();
  };

  const handleTestPerformanceLogging = () => {
    testPerformanceLogging();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🧪 Console Grouping Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            This demo showcases the console grouping system that organizes console logs 
            by different sections of the application. Open your browser's developer console 
            to see the organized log groups.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={handleTestBasicLogging}
              className="w-full"
            >
              Test Basic Logging
            </Button>
            
            <Button 
              onClick={handleTestErrorLogging}
              variant="destructive"
              className="w-full"
            >
              Test Error Logging
            </Button>
            
            <Button 
              onClick={handleTestPerformanceLogging}
              variant="outline"
              className="w-full"
            >
              Test Performance Logging
            </Button>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Individual Logs:</strong> Each section has its own logging function</li>
              <li>• <strong>Grouped Logs:</strong> Related logs are grouped together and can be collapsed</li>
              <li>• <strong>Sub-groups:</strong> Groups can contain sub-groups for better organization</li>
              <li>• <strong>Performance:</strong> Built-in performance timing utilities</li>
              <li>• <strong>Table Logging:</strong> Structured data display in console</li>
            </ul>
          </div>
          
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">Available Console Groups:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-green-800">
              <div>📊 Dashboard</div>
              <div>🚀 iPatroller</div>
              <div>🎯 Command Center</div>
              <div>⚡ Action Center</div>
              <div>🚨 Incidents</div>
              <div>🏔️ Quarry Monitoring</div>
              <div>👥 Users</div>
              <div>⚙️ Settings</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

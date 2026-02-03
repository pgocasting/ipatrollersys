import React, { useState } from "react";
import Layout from "./Layout";
import { settingsLog, createSectionGroup, CONSOLE_GROUPS } from './utils/consoleGrouping';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";

import { 
  Lock,
  UserCircle,
  Clock
} from "lucide-react";
import { useAuth } from "./contexts/AuthContext";

export default function Settings({ onLogout, onNavigate, currentPage }) {
  const { isAdmin } = useAuth();

  return (
    <Layout onLogout={onLogout} onNavigate={onNavigate} currentPage={currentPage}>
      <div className="h-full flex flex-col overflow-hidden">
        <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 ${isAdmin ? 'sticky top-0 z-40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 py-3 border-b border-slate-200' : ''} w-full px-4 sm:px-6 lg:px-8`}>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">Manage your account settings and preferences.</p>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="w-full">
            <Tabs defaultValue="account" className="space-y-4 sm:space-y-6 [&_*]:border-gray-200">
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="account" className="flex items-center gap-2 text-sm sm:text-base">
                  <UserCircle className="h-4 w-4" />
                  Account
                </TabsTrigger>
              </TabsList>

              <TabsContent value="account" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5 text-primary" />
                      Account
                    </CardTitle>
                    <CardDescription className="text-gray-900">Coming Soon</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4">
                      <div className="mt-0.5 rounded-lg bg-gray-100 p-2">
                        <Clock className="h-5 w-5 text-gray-700" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-900">Coming Soon</div>
                        <div className="text-sm text-gray-700">Password change is temporarily unavailable.</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
}
import React, { useState, useCallback, useEffect, useRef } from "react";
import Layout from "./Layout";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { useData } from "./DataContext";
import { BarChart } from './components/ui/bar-chart';
import { PieChart } from './components/ui/pie-chart';
import { 
  MapPin, 
  AlertTriangle, 
  Target,
  BarChart3,
  PieChart as PieChartIcon
} from "lucide-react";

export default function Dashboard({ onLogout, onNavigate, currentPage }) {
  const { 
    summaryStats, 
    loading: dataLoading
  } = useData();

  const [selectedTimePeriod, setSelectedTimePeriod] = useState('weekly');

  const handleLogout = async () => {
    try {
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Calculate activity data based on selected time period
  const getActivityData = (period) => {
    const weeklyTotals = [45, 52, 38, 61, 42, 35, 48];
    const monthlyTotals = [320, 280, 350, 290, 410, 380, 340, 360, 300, 330, 370, 310];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    switch (period) {
      case 'monthly':
        return {
          labels: monthNames,
          datasets: [
            {
              label: 'Last 12 Months',
              data: monthlyTotals,
              backgroundColor: [
                '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
                '#8B5CF6', '#06B6D4', '#84CC16', '#F97316',
                '#EC4899', '#6366F1', '#14B8A6', '#F43F5E'
              ],
            },
          ],
        };
      case 'weekly':
      default:
        return {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [
            {
              label: 'This Week',
              data: weeklyTotals,
              backgroundColor: [
                '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
                '#8B5CF6', '#06B6D4', '#84CC16'
              ],
            },
          ],
        };
    }
  };

  // Sample district data
  const districtData = {
    labels: ['1st District (33%)', '2nd District (33%)', '3rd District (34%)'],
    datasets: [
      {
        data: [100, 100, 100],
        backgroundColor: [
          '#3B82F6', // 1st District - Blue
          '#10B981', // 2nd District - Emerald
          '#F59E0B', // 3rd District - Amber
        ],
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  if (dataLoading) {
    return (
      <Layout onLogout={handleLogout} onNavigate={onNavigate} currentPage={currentPage}>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
            <span className="text-sm font-medium text-gray-700">
              Loading dashboard data...
            </span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout onLogout={handleLogout} onNavigate={onNavigate} currentPage={currentPage}>
      <div className="min-h-screen bg-white">
        <div className="container mx-auto p-6 space-y-8">
          
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-6 border-b border-gray-200">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-black tracking-tight">Dashboard</h1>
              <p className="text-gray-600 text-lg">Real-time overview of patrol activities and system performance</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Patrols</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {summaryStats.totalPatrols.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-blue-500 rounded-lg">
                    <MapPin className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Incidents</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {summaryStats.totalIncidents.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-500 rounded-lg">
                    <AlertTriangle className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Actions</p>
                    <p className="text-3xl font-bold text-green-600">
                      {summaryStats.totalActions.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-green-500 rounded-lg">
                    <Target className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-2 border-gray-200 shadow-lg">
              <CardHeader className="pb-6">
                <CardTitle className="text-xl font-bold text-black">Weekly Activity</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="h-80">
                  <BarChart data={getActivityData(selectedTimePeriod)} />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-2 border-gray-200 shadow-lg">
              <CardHeader className="pb-6">
                <CardTitle className="text-xl font-bold text-black">District Distribution</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="h-80">
                  <PieChart data={districtData} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}

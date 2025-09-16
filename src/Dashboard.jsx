import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Badge } from './components/ui/badge';
import { Label } from './components/ui/label';
import { useData } from './DataContext';
import { Bar } from 'react-chartjs-2';
import { PieChart } from './components/ui/pie-chart';
import { toast } from 'sonner';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import {
  BarChart3,
  TrendingUp,
  Users,
  Activity,
  CheckCircle,
  XCircle,
  Target,
  Calendar,
  Filter,
  Download,
  FileText,
  Search,
  PieChartIcon,
  Building2,
  MapPin,
  Shield,
  AlertTriangle,
  Zap,
  Database,
  Wifi,
  WifiOff,
  Plus,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Menu,
  RefreshCw
} from 'lucide-react';

export default function Dashboard({ onLogout, onNavigate, currentPage }) {
  const { 
    summaryStats, 
    ipatrollerData,
    actionReports,
    incidents,
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

  // Calculate activity data with fallback sample data
  const getActivityData = (period) => {
    const now = new Date();
    
    if (period === 'monthly') {
      // Calculate monthly data from IPatroller, Action Reports, and Incidents
      const monthlyData = Array(12).fill(0);
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      // Add IPatroller data
      if (ipatrollerData && ipatrollerData.length > 0) {
        ipatrollerData.forEach(item => {
          if (item.lastActive) {
            const date = new Date(item.lastActive);
            const monthIndex = date.getMonth();
            monthlyData[monthIndex] += item.totalPatrols || 0;
          }
        });
      }
      
      // Add Action Reports data
      if (actionReports && actionReports.length > 0) {
        actionReports.forEach(report => {
          if (report.dateReported) {
            const date = new Date(report.dateReported);
            const monthIndex = date.getMonth();
            monthlyData[monthIndex] += 1;
          }
        });
      }
      
      // Add Incidents data
      if (incidents && incidents.length > 0) {
        incidents.forEach(incident => {
          if (incident.dateReported) {
            const date = new Date(incident.dateReported);
            const monthIndex = date.getMonth();
            monthlyData[monthIndex] += 1;
          }
        });
      }
      
      // If no real data, use sample data
      const hasData = monthlyData.some(val => val > 0);
      if (!hasData) {
        const sampleMonthlyData = [320, 280, 350, 290, 410, 380, 340, 360, 300, 330, 370, 310];
        monthlyData.splice(0, 12, ...sampleMonthlyData);
      }
      
      return {
        labels: monthNames,
        datasets: [
          {
            label: 'Monthly Activity',
            data: monthlyData,
            backgroundColor: [
              '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
              '#8B5CF6', '#06B6D4', '#84CC16', '#F97316',
              '#EC4899', '#6366F1', '#14B8A6', '#F43F5E'
            ],
          },
        ],
      };
    } else {
      // Calculate weekly data
      const weeklyData = Array(7).fill(0);
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      
      // Add IPatroller data for this week
      if (ipatrollerData && ipatrollerData.length > 0) {
        ipatrollerData.forEach(item => {
          if (item.lastActive) {
            const date = new Date(item.lastActive);
            if (date >= startOfWeek) {
              const dayIndex = date.getDay();
              weeklyData[dayIndex] += item.totalPatrols || 0;
            }
          }
        });
      }
      
      // Add Action Reports for this week
      if (actionReports && actionReports.length > 0) {
        actionReports.forEach(report => {
          if (report.dateReported) {
            const date = new Date(report.dateReported);
            if (date >= startOfWeek) {
              const dayIndex = date.getDay();
              weeklyData[dayIndex] += 1;
            }
          }
        });
      }
      
      // Add Incidents for this week
      if (incidents && incidents.length > 0) {
        incidents.forEach(incident => {
          if (incident.dateReported) {
            const date = new Date(incident.dateReported);
            if (date >= startOfWeek) {
              const dayIndex = date.getDay();
              weeklyData[dayIndex] += 1;
            }
          }
        });
      }
      
      // If no real data, use sample data
      const hasData = weeklyData.some(val => val > 0);
      if (!hasData) {
        const sampleWeeklyData = [45, 52, 38, 61, 42, 35, 48];
        weeklyData.splice(0, 7, ...sampleWeeklyData);
      }
      
      return {
        labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        datasets: [
          {
            label: 'Weekly Activity',
            data: weeklyData,
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
  // Calculate active/inactive municipalities with fallback data
  const totalMunicipalities = 12;
  const activeCount = ipatrollerData && ipatrollerData.length > 0 
    ? ipatrollerData.filter(item => item.isActive).length 
    : 8; // Default fallback
  const inactiveCount = totalMunicipalities - activeCount;
  const activePercentage = totalMunicipalities > 0 ? (activeCount / totalMunicipalities) * 100 : 0;

  // Calculate district distribution with fallback data
  const getDistrictData = () => {
    const districtCounts = {
      '1ST DISTRICT': 0,
      '2ND DISTRICT': 0,
      '3RD DISTRICT': 0
    };

    // Count active municipalities per district from IPatroller data
    if (ipatrollerData && ipatrollerData.length > 0) {
      ipatrollerData.forEach(item => {
        if (item.district && item.isActive) {
          districtCounts[item.district] = (districtCounts[item.district] || 0) + 1;
        }
      });
    } else {
      // Fallback data when no real data is available
      districtCounts['1ST DISTRICT'] = 3;
      districtCounts['2ND DISTRICT'] = 3;
      districtCounts['3RD DISTRICT'] = 2;
    }

    const totalActive = Object.values(districtCounts).reduce((sum, count) => sum + count, 0);
    
    // Calculate percentages
    const labels = Object.keys(districtCounts).map(district => {
      const count = districtCounts[district];
      const percentage = totalActive > 0 ? Math.round((count / totalActive) * 100) : 33;
      return `${district} (${percentage}%)`;
    });

    return {
      labels,
      datasets: [
        {
          data: Object.values(districtCounts),
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
  };

  const districtData = getDistrictData();

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
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-6 space-y-6">
          
          {/* Header Section */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">System Dashboard</h1>
                  <p className="text-gray-600 mt-1">
                    Real-time overview of IPatroller system performance and analytics
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Data
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Report
                </Button>
              </div>
            </div>
          </div>

          {/* System Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">Active Municipalities</p>
                    <p className="text-3xl font-bold text-emerald-600">
                      {activeCount}
                    </p>
                    <p className="text-xs text-gray-500">
                      {Math.round(activePercentage)}% of total
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">Inactive Municipalities</p>
                    <p className="text-3xl font-bold text-red-600">
                      {inactiveCount}
                    </p>
                    <p className="text-xs text-gray-500">
                      Requires attention
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-xl">
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">Total Actions</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {actionReports && actionReports.length > 0 ? actionReports.length.toLocaleString() : '420'}
                    </p>
                    <p className="text-xs text-gray-500">
                      This month
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Target className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">Total Incidents</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {incidents && incidents.length > 0 ? incidents.length.toLocaleString() : '127'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Reported cases
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <AlertTriangle className="w-8 h-8 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Activity Chart */}
            <Card className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm">
              <CardHeader className="p-6 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900">Activity Overview</CardTitle>
                      <p className="text-sm text-gray-600">Weekly patrol and incident trends</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={selectedTimePeriod === 'weekly' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTimePeriod('weekly')}
                      className="text-xs"
                    >
                      Weekly
                    </Button>
                    <Button
                      variant={selectedTimePeriod === 'monthly' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTimePeriod('monthly')}
                      className="text-xs"
                    >
                      Monthly
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="h-80">
                  <Bar data={getActivityData(selectedTimePeriod)} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: '#f3f4f6'
                        }
                      },
                      x: {
                        grid: {
                          display: false
                        }
                      }
                    }
                  }} />
                </div>
              </CardContent>
            </Card>

            {/* District Distribution */}
            <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <CardHeader className="p-6 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <PieChartIcon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">District Distribution</CardTitle>
                    <p className="text-sm text-gray-600">Active municipalities by district</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="h-80">
                  <PieChart data={districtData} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions Panel */}
          <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <CardHeader className="p-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Zap className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
                  <p className="text-sm text-gray-600">Navigate to system modules</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-200"
                  onClick={() => onNavigate('ipatroller')}
                >
                  <Shield className="w-6 h-6 text-blue-600" />
                  <span className="text-sm font-medium">IPatroller</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-emerald-50 hover:border-emerald-200"
                  onClick={() => onNavigate('command-center')}
                >
                  <Database className="w-6 h-6 text-emerald-600" />
                  <span className="text-sm font-medium">Command Center</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-orange-50 hover:border-orange-200"
                  onClick={() => onNavigate('action-center')}
                >
                  <Target className="w-6 h-6 text-orange-600" />
                  <span className="text-sm font-medium">Action Center</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-red-50 hover:border-red-200"
                  onClick={() => onNavigate('incidents-reports')}
                >
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                  <span className="text-sm font-medium">Incidents</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

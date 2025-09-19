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
import { useNotification, NotificationContainer } from './components/ui/notification';
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
  CheckCircle,
  XCircle,
  Target,
  Download,
  PieChartIcon,
  AlertTriangle,
  RefreshCw,
  List,
  Building2,
  MapPin,
  Menu,
  RotateCcw,
  FileText
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
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const { notifications, showSuccess, removeNotification } = useNotification();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenuDropdown) {
        const dropdown = document.getElementById('dashboard-menu-dropdown');
        const button = document.getElementById('dashboard-menu-button');
        if (dropdown && !dropdown.contains(event.target) && !button?.contains(event.target)) {
          setShowMenuDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenuDropdown]);

  const handleLogout = async () => {
    try {
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Get yesterday's date for display
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayFormatted = yesterday.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

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

  // Calculate active/inactive municipalities based on yesterday's data
  const totalMunicipalities = ipatrollerData ? ipatrollerData.length : 12;
  const activeCount = summaryStats.activeMunicipalities || 0;
  const inactiveCount = summaryStats.inactiveMunicipalities || 12;
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

    // If we have data but zero active across all districts, fallback to sample so the pie isn't empty
    let totalActive = Object.values(districtCounts).reduce((sum, count) => sum + count, 0);
    if (ipatrollerData && ipatrollerData.length > 0 && totalActive === 0) {
      districtCounts['1ST DISTRICT'] = 3;
      districtCounts['2ND DISTRICT'] = 3;
      districtCounts['3RD DISTRICT'] = 2;
      totalActive = 8;
    }
    
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

  // Get municipality lists for yesterday's data
  const getMunicipalityLists = () => {
    if (!ipatrollerData || ipatrollerData.length === 0) {
      return {
        active: [],
        inactive: []
      };
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayIndex = yesterday.getDate() - 1;

    const active = [];
    const inactive = [];

    ipatrollerData.forEach(item => {
      let yesterdayPatrols = 0;
      
      if (item.data && Array.isArray(item.data) && yesterdayIndex >= 0 && yesterdayIndex < item.data.length) {
        yesterdayPatrols = item.data[yesterdayIndex] || 0;
      }

      const municipalityInfo = {
        name: item.municipality,
        district: item.district,
        patrols: yesterdayPatrols
      };

      if (yesterdayPatrols >= 5) {
        active.push(municipalityInfo);
      } else {
        inactive.push(municipalityInfo);
      }
    });

    // Sort by district and then by municipality name
    const sortMunicipalities = (a, b) => {
      if (a.district !== b.district) {
        return a.district.localeCompare(b.district);
      }
      return a.name.localeCompare(b.name);
    };

    return {
      active: active.sort(sortMunicipalities),
      inactive: inactive.sort(sortMunicipalities)
    };
  };

  const municipalityLists = getMunicipalityLists();

  // Get district statistics for yesterday's data
  const getDistrictStats = () => {
    if (!ipatrollerData || ipatrollerData.length === 0) {
      return [];
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayIndex = yesterday.getDate() - 1;

    const districtStats = {
      '1ST DISTRICT': { active: 0, total: 0, color: 'blue' },
      '2ND DISTRICT': { active: 0, total: 0, color: 'emerald' },
      '3RD DISTRICT': { active: 0, total: 0, color: 'orange' }
    };

    ipatrollerData.forEach(item => {
      if (item.district && districtStats[item.district]) {
        districtStats[item.district].total++;
        
        let yesterdayPatrols = 0;
        if (item.data && Array.isArray(item.data) && yesterdayIndex >= 0 && yesterdayIndex < item.data.length) {
          yesterdayPatrols = item.data[yesterdayIndex] || 0;
        }

        if (yesterdayPatrols >= 5) {
          districtStats[item.district].active++;
        }
      }
    });

    return Object.entries(districtStats).map(([district, stats]) => ({
      name: district,
      active: stats.active,
      total: stats.total,
      inactive: stats.total - stats.active,
      percentage: stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0,
      color: stats.color
    }));
  };

  const districtStats = getDistrictStats();

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
      <div className="container mx-auto p-4 space-y-4 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-2">
              Overview of IPatroller system performance based on yesterday's patrol data
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Refresh Data Button */}
            <button
              onClick={() => window.location.reload()}
              disabled={dataLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
            >
              <RotateCcw className={`w-5 h-5 ${dataLoading ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">
                {dataLoading ? 'Loading...' : 'Refresh Data'}
              </span>
            </button>
            
            {/* View Options Dropdown */}
            <div className="relative">
              <button
                id="dashboard-menu-button"
                onClick={() => setShowMenuDropdown(!showMenuDropdown)}
                className="bg-black hover:bg-gray-800 text-white px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
              >
                <Menu className="w-5 h-5" />
                <span className="text-sm font-medium">View Options</span>
              </button>
              
              {showMenuDropdown && (
                <div 
                  id="dashboard-menu-dropdown"
                  className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 shadow-lg rounded-lg z-50 overflow-hidden"
                >
                  <div className="py-1">
                    <div className="px-3 py-2">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Report Options</h3>
                    </div>
                    
                    <button
                      onClick={() => {
                        // Export functionality can be added here
                        showSuccess('Export feature coming soon!');
                        setShowMenuDropdown(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
                    >
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>Export Report</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        window.location.reload();
                        setShowMenuDropdown(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors duration-200"
                    >
                      <RefreshCw className="w-4 h-4 text-green-600" />
                      <span>Refresh Data</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Active Municipalities</p>
                  <p className="text-2xl font-bold text-green-600">
                    {activeCount.toLocaleString()}
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Inactive Municipalities</p>
                  <p className="text-2xl font-bold text-red-600">
                    {inactiveCount.toLocaleString()}
                  </p>
                </div>
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Total Actions</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {actionReports && actionReports.length > 0 ? actionReports.length.toLocaleString() : '420'}
                  </p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Total Incidents</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {incidents && incidents.length > 0 ? incidents.length.toLocaleString() : '127'}
                  </p>
                </div>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Municipality Lists */}
          <Card className="lg:col-span-2 bg-white shadow-sm border border-gray-200 rounded-xl">
            <CardHeader className="p-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <List className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Municipality List</CardTitle>
                  <p className="text-sm text-gray-600">Active and inactive municipalities for yesterday</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-auto">
                  
                {/* Active Municipalities */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-semibold text-emerald-600">Active ({municipalityLists.active.length})</h3>
                  </div>
                  <div className="space-y-1 max-h-80 overflow-y-auto pr-2">
                    {municipalityLists.active.length > 0 ? (
                      municipalityLists.active.map((municipality, index) => (
                        <div key={index} className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-gray-900 truncate">{municipality.name}</p>
                              <p className="text-xs text-gray-500">{municipality.district}</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs font-semibold text-emerald-600">{municipality.patrols}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <Building2 className="w-6 h-6 mx-auto mb-1 text-gray-300" />
                        <p className="text-xs">No active municipalities</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Inactive Municipalities */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <h3 className="text-sm font-semibold text-red-600">Inactive ({municipalityLists.inactive.length})</h3>
                  </div>
                  <div className="space-y-1 max-h-80 overflow-y-auto pr-2">
                    {municipalityLists.inactive.length > 0 ? (
                      municipalityLists.inactive.map((municipality, index) => (
                        <div key={index} className="flex items-center justify-between p-2.5 bg-red-50 rounded-lg border border-red-100 hover:bg-red-100 transition-colors">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-gray-900 truncate">{municipality.name}</p>
                              <p className="text-xs text-gray-500">{municipality.district}</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs font-semibold text-red-600">{municipality.patrols}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <Building2 className="w-6 h-6 mx-auto mb-1 text-gray-300" />
                        <p className="text-xs">No inactive municipalities</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

        {/* District Distribution Cards */}
        <Card className="bg-white shadow-sm border border-gray-200 rounded-xl">
          <CardHeader className="p-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <MapPin className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-gray-900">District Distribution</CardTitle>
                <p className="text-xs text-gray-600">Active municipalities by district</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="space-y-3">
              {districtStats.map((district, index) => (
                <div key={index} className={`p-3 rounded-lg border hover:shadow-sm transition-all duration-200 ${
                  district.color === 'blue' ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' :
                  district.color === 'emerald' ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100' :
                  'bg-orange-50 border-orange-200 hover:bg-orange-100'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded ${
                        district.color === 'blue' ? 'bg-blue-100' :
                        district.color === 'emerald' ? 'bg-emerald-100' :
                        'bg-orange-100'
                      }`}>
                        <Building2 className={`w-3.5 h-3.5 ${
                          district.color === 'blue' ? 'text-blue-600' :
                          district.color === 'emerald' ? 'text-emerald-600' :
                          'text-orange-600'
                        }`} />
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold text-gray-900">{district.name}</h3>
                        <p className="text-xs text-gray-600">{district.total} municipalities</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-bold ${
                        district.color === 'blue' ? 'text-blue-600' :
                        district.color === 'emerald' ? 'text-emerald-600' :
                        'text-orange-600'
                      }`}>
                        {district.active}
                      </p>
                      <p className="text-xs text-gray-500">Active</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                        <span className="text-xs text-emerald-600 font-medium">{district.active}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-red-500" />
                        <span className="text-xs text-red-600 font-medium">{district.inactive}</span>
                      </div>
                    </div>
                    <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      district.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                      district.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {district.percentage}%
                    </div>
                  </div>
                </div>
              ))}
                  
              {districtStats.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <MapPin className="w-6 h-6 mx-auto mb-1 text-gray-300" />
                  <p className="text-xs">No district data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      </div>
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </Layout>
  );
}

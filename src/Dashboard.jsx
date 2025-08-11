import React, { useState } from "react";
import Layout from "./Layout";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { useTheme } from "./ThemeContext";
import { useData } from "./DataContext";
import { useFirebase } from "./hooks/useFirebase";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { 
  MapPin, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Search, 
  Clock, 
  FileText, 
  User, 
  Activity,
  BarChart3,
  PieChart,
  Users,
  Building2,
  Shield,
  TrendingUp,
  AlertCircle,
  X
} from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard({ onLogout, onNavigate, currentPage }) {
  const { isDarkMode } = useTheme();
  const { 
    patrolData, 
    actionReports, 
    incidents, 
    summaryStats, 
    loading: dataLoading 
  } = useData();
  const { logout } = useFirebase();
  const [showActiveModal, setShowActiveModal] = useState(false);
  const [showInactiveModal, setShowInactiveModal] = useState(false);
  const [showTotalPatrolsModal, setShowTotalPatrolsModal] = useState(false);
  const [showTotalIncidentsModal, setShowTotalIncidentsModal] = useState(false);
  const [showTotalActionsModal, setShowTotalActionsModal] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Helper function to format time ago
  const getTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} sec ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hour ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} day ago`;
    return date.toLocaleDateString();
  };



  // Sample data for charts
  const monthlyData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Patrols Completed',
        data: [65, 59, 80, 81, 56, 55, 40, 45, 60, 70, 85, 90],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Incidents Reported',
        data: [28, 48, 40, 19, 86, 27, 90, 35, 50, 40, 30, 45],
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
      },
    ],
  };

     // Calculate weekly activity from real patrol data
   const weeklyTotals = [0, 0, 0, 0, 0, 0, 0]; // Mon, Tue, Wed, Thu, Fri, Sat, Sun
   
   patrolData.forEach(row => {
     row.data.forEach((patrols, dayIndex) => {
       if (dayIndex < 7) { // Ensure we only count the first 7 days (week)
         weeklyTotals[dayIndex] += patrols;
       }
     });
   });

   // Debug: Log the weekly totals to verify data
   console.log('Weekly Activity Data:', {
     patrolDataLength: patrolData.length,
     weeklyTotals,
     sampleMunicipality: patrolData[0] ? patrolData[0].municipality : 'No data'
   });

   const weeklyData = {
     labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
     datasets: [
       {
         label: 'This Week',
         data: weeklyTotals,
         backgroundColor: [
           'rgba(59, 130, 246, 0.8)',
           'rgba(16, 185, 129, 0.8)',
           'rgba(245, 158, 11, 0.8)',
           'rgba(239, 68, 68, 0.8)',
           'rgba(139, 92, 246, 0.8)',
           'rgba(236, 72, 153, 0.8)',
           'rgba(34, 197, 94, 0.8)',
         ],
       },
     ],
   };

     // Calculate district distribution from real patrol data
   const districtTotals = {};
   patrolData.forEach(row => {
     const district = row.district;
     const totalPatrols = row.data.reduce((sum, val) => sum + val, 0);
     districtTotals[district] = (districtTotals[district] || 0) + totalPatrols;
   });

   // Calculate total patrols across all districts
   const totalPatrols = Object.values(districtTotals).reduce((sum, val) => sum + val, 0);

   // Calculate percentages for each district
   const districtPercentages = {};
   Object.keys(districtTotals).forEach(district => {
     districtPercentages[district] = totalPatrols > 0 ? Math.round((districtTotals[district] / totalPatrols) * 100) : 0;
   });

   const districtData = {
     labels: Object.keys(districtTotals).map(district => `${district} (${districtPercentages[district]}%)`),
     datasets: [
       {
         data: Object.values(districtTotals),
         backgroundColor: [
           'rgba(59, 130, 246, 0.8)',
           'rgba(16, 185, 129, 0.8)',
           'rgba(245, 158, 11, 0.8)',
         ],
         borderWidth: 2,
         borderColor: '#fff',
       },
     ],
   };

  // Calculate active and inactive municipalities using real patrol data
  const activeMunicipalitiesList = patrolData.filter(row => {
    if (!row.data || !Array.isArray(row.data)) return false;
    const avgPatrols = row.data.reduce((a, b) => a + (b || 0), 0) / row.data.length;
    return avgPatrols >= 5;
  });
  const inactiveMunicipalitiesList = patrolData.filter(row => {
    if (!row.data || !Array.isArray(row.data)) return false;
    const avgPatrols = row.data.reduce((a, b) => a + (b || 0), 0) / row.data.length;
    return avgPatrols <= 4;
  });
  
  const totalMunicipalities = patrolData.length;
  const percentagePerMunicipality = totalMunicipalities > 0 ? Math.round((summaryStats.activeMunicipalities / totalMunicipalities) * 100) : 0;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: isDarkMode ? '#ffffff' : '#000000',
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: isDarkMode ? '#9ca3af' : '#6b7280',
        },
        grid: {
          color: isDarkMode ? '#374151' : '#e5e7eb',
        },
      },
      y: {
        ticks: {
          color: isDarkMode ? '#9ca3af' : '#6b7280',
        },
        grid: {
          color: isDarkMode ? '#374151' : '#e5e7eb',
        },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: isDarkMode ? '#ffffff' : '#000000',
        },
      },
    },
  };

  return (
            <Layout onLogout={handleLogout} onNavigate={onNavigate} currentPage={currentPage}>
      {/* Dashboard Content */}
      <section className="flex-1 p-6 space-y-6">
        {/* Loading State and Refresh */}
        <div className={`mb-4 p-4 rounded-lg ${
          isDarkMode ? 'bg-blue-900/20 border border-blue-600/30' : 'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {dataLoading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className={`text-sm font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-blue-300' : 'text-blue-700'
                  }`}>
                    Loading dashboard data...
                  </span>
                </>
              ) : (
                <>
                  <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-green-600"></div>
                  </div>
                  <span className={`text-sm font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-green-300' : 'text-green-700'
                  }`}>
                    Dashboard data loaded successfully
                  </span>
                </>
              )}
            </div>
            <button
              onClick={() => window.location.reload()}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
              disabled={dataLoading}
            >
              Refresh
            </button>
          </div>
        </div>
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">

          <Card 
            className={`backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 ${
              isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'
            }`}
            onClick={() => setShowTotalPatrolsModal(true)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>Total Patrols</p>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{summaryStats.totalPatrols.toLocaleString()}</p>
                </div>
                                 <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors duration-300 ${
                   isDarkMode ? 'bg-orange-900/30' : 'bg-orange-100'
                 }`}>
                   <MapPin className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                 </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 ${
              isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'
            }`}
            onClick={() => setShowActiveModal(true)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>Active Municipalities</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">{summaryStats.activeMunicipalities}</p>
                </div>
                                 <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors duration-300 ${
                   isDarkMode ? 'bg-green-900/30' : 'bg-green-100'
                 }`}>
                   <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                 </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 ${
              isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'
            }`}
            onClick={() => setShowInactiveModal(true)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>Inactive Municipalities</p>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">{summaryStats.inactiveMunicipalities}</p>
                </div>
                                 <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors duration-300 ${
                   isDarkMode ? 'bg-red-900/30' : 'bg-red-100'
                 }`}>
                   <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                 </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 ${
              isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'
            }`}
            onClick={() => setShowTotalIncidentsModal(true)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>Total Incidents</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{summaryStats.totalIncidents}</p>
                  <p className={`text-xs transition-colors duration-300 mt-1 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {summaryStats.resolvedIncidents} resolved
                  </p>
                </div>
                                 <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors duration-300 ${
                   isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100'
                 }`}>
                   <AlertTriangle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                 </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 ${
              isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'
            }`}
            onClick={() => setShowTotalActionsModal(true)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>Total Actions</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{summaryStats.totalActions}</p>
                  <p className={`text-xs transition-colors duration-300 mt-1 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {summaryStats.pendingActions} pending
                  </p>
                </div>
                                 <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors duration-300 ${
                   isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'
                 }`}>
                   <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Weekly Bar Chart */}
          <Card className={`backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${
            isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'
          }`}>
            <CardHeader className="pb-4">
              <CardTitle className={`text-lg font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Weekly Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="h-80">
                <Bar data={weeklyData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>

          {/* District Distribution Pie Chart */}
          <Card className={`backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${
            isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'
          }`}>
            <CardHeader className="pb-4">
              <CardTitle className={`text-lg font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>District Distribution</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="h-80">
                <Pie data={districtData} options={pieOptions} />
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className={`backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${
            isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'
          }`}>
            <CardHeader className="pb-4">
              <CardTitle className={`text-lg font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="space-y-4">
                {summaryStats.recentActivity.length > 0 ? (
                  summaryStats.recentActivity.map((activity, index) => {
                    const getActivityIcon = (iconName) => {
                      switch (iconName) {
                        case 'MapPin':
                          return <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
                        case 'FileText':
                          return <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />;
                        case 'AlertTriangle':
                          return <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
                        default:
                          return <Activity className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
                      }
                    };

                    const getActivityColor = (type) => {
                      switch (type) {
                        case 'patrol':
                          return {
                            bg: isDarkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200',
                            icon: 'bg-blue-900/30'
                          };
                        case 'action':
                          return {
                            bg: isDarkMode ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200',
                            icon: 'bg-green-900/30'
                          };
                        case 'incident':
                          return {
                            bg: isDarkMode ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200',
                            icon: 'bg-yellow-900/30'
                          };
                        default:
                          return {
                            bg: isDarkMode ? 'bg-gray-900/20 border-gray-800' : 'bg-gray-50 border-gray-200',
                            icon: 'bg-gray-900/30'
                          };
                      }
                    };

                    const colors = getActivityColor(activity.type);
                    const timeAgo = activity.timestamp?.toDate ? 
                      getTimeAgo(activity.timestamp.toDate()) : 
                      getTimeAgo(new Date(activity.timestamp));

                    return (
                      <div key={index} className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-300 ${colors.bg}`}>
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors duration-300 ${colors.icon}`}>
                            {getActivityIcon(activity.icon)}
                          </div>
                          <div>
                            <p className={`font-medium transition-colors duration-300 ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>{activity.title}</p>
                            <p className={`text-sm transition-colors duration-300 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-500'
                            }`}>{activity.description}</p>
                          </div>
                        </div>
                        <span className={`text-xs transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>{timeAgo}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className={`text-center py-8 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium">No Recent Activity</p>
                    <p className="text-sm">Start using the system to see recent activity here.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Incidents Activity */}
          <Card className={`backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${
            isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'
          }`}>
            <CardHeader className="pb-4">
              <CardTitle className={`text-lg font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Incidents Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="space-y-4">
                {incidents.length > 0 ? (
                  incidents.slice(0, 5).map((incident, index) => {
                    // Get status color based on incident status
                    const getStatusColor = (status) => {
                      switch (status) {
                        case "Resolved":
                          return {
                            bg: isDarkMode ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200',
                            icon: 'bg-green-900/30',
                            iconColor: 'text-green-600 dark:text-green-400',
                                                         svg: <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                          };
                        case "Under Investigation":
                          return {
                            bg: isDarkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200',
                            icon: 'bg-blue-900/30',
                            iconColor: 'text-blue-600 dark:text-blue-400',
                                                         svg: <Search className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          };
                        default: // Pending
                          return {
                            bg: isDarkMode ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200',
                            icon: 'bg-yellow-900/30',
                            iconColor: 'text-yellow-600 dark:text-yellow-400',
                                                         svg: <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                          };
                      }
                    };

                    const statusColors = getStatusColor(incident.status);
                    const timeAgo = incident.date ? new Date(incident.date).toLocaleDateString() : 'No date';

                    return (
                      <div key={incident.id} className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-300 ${statusColors.bg}`}>
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors duration-300 ${statusColors.icon}`}>
                            {statusColors.svg}
                          </div>
                          <div>
                            <p className={`font-medium transition-colors duration-300 ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>{incident.incidentType || 'Incident'}</p>
                            <p className={`text-sm transition-colors duration-300 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-500'
                            }`}>{incident.district} - {incident.municipality}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={`transition-colors duration-300 ${
                            incident.status === 'Resolved' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : incident.status === 'Under Investigation'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {incident.status}
                          </Badge>
                          <p className={`text-xs transition-colors duration-300 mt-1 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>{timeAgo}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                                     <div className={`text-center py-8 transition-colors duration-300 ${
                     isDarkMode ? 'text-gray-400' : 'text-gray-500'
                   }`}>
                     <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                     <p className="text-lg font-medium">No Incidents Found</p>
                     <p className="text-sm">No incidents have been reported yet. Check the Incidents Reports page to add new incidents.</p>
                   </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Active Municipalities Modal */}
      {showActiveModal && (
        <div className="fixed inset-0 flex items-center justify-center z-40 p-4">
          <div className={`rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden ${
            isDarkMode ? 'bg-gray-900' : 'bg-white'
          }`}>
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                                 <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                   isDarkMode ? 'bg-green-900/30' : 'bg-green-100'
                 }`}>
                   <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                 </div>
                <div>
                  <h3 className={`text-xl font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>Active Municipalities</h3>
                  <p className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>{summaryStats.activeMunicipalities} municipalities with ≥5 average patrols per day</p>
                </div>
              </div>
                             <button
                 onClick={() => setShowActiveModal(false)}
                 className={`p-2 rounded-lg transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                   isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                 }`}
               >
                 <X className="h-6 w-6" />
               </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {activeMunicipalitiesList.length > 0 ? (
                <div className="space-y-4">
                  {activeMunicipalitiesList.map((municipality, index) => {
                    const avgPatrols = municipality.data.reduce((a, b) => a + b, 0) / municipality.data.length;
                    return (
                      <div key={index} className={`p-4 rounded-lg border transition-all duration-300 ${
                        isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className={`font-semibold transition-colors duration-300 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>{municipality.municipality}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
                          }`}>
                            {municipality.district}
                          </span>
                        </div>
                        <div className={`text-sm transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          Average Patrols: <span className="font-semibold text-green-600 dark:text-green-400">{avgPatrols.toFixed(1)}</span> per day
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                                 <div className={`text-center py-8 transition-colors duration-300 ${
                   isDarkMode ? 'text-gray-400' : 'text-gray-500'
                 }`}>
                   <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                   <p className="text-lg font-medium">No Active Municipalities</p>
                   <p className="text-sm">No municipalities meet the active criteria (≥5 average patrols per day)</p>
                 </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Inactive Municipalities Modal */}
      {showInactiveModal && (
        <div className="fixed inset-0 flex items-center justify-center z-40 p-4">
          <div className={`rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden ${
            isDarkMode ? 'bg-gray-900' : 'bg-white'
          }`}>
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                                 <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                   isDarkMode ? 'bg-red-900/30' : 'bg-red-100'
                 }`}>
                   <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                 </div>
                <div>
                  <h3 className={`text-xl font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>Inactive Municipalities</h3>
                  <p className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>{summaryStats.inactiveMunicipalities} municipalities with ≤4 average patrols per day</p>
                </div>
              </div>
                             <button
                 onClick={() => setShowInactiveModal(false)}
                 className={`p-2 rounded-lg transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                   isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                 }`}
               >
                 <X className="h-6 w-6" />
               </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {inactiveMunicipalitiesList.length > 0 ? (
                <div className="space-y-4">
                  {inactiveMunicipalitiesList.map((municipality, index) => {
                    const avgPatrols = municipality.data.reduce((a, b) => a + b, 0) / municipality.data.length;
                    return (
                      <div key={index} className={`p-4 rounded-lg border transition-all duration-300 ${
                        isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className={`font-semibold transition-colors duration-300 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>{municipality.municipality}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            isDarkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'
                          }`}>
                            {municipality.district}
                          </span>
                        </div>
                        <div className={`text-sm transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          Average Patrols: <span className="font-semibold text-red-600 dark:text-red-400">{avgPatrols.toFixed(1)}</span> per day
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                                 <div className={`text-center py-8 transition-colors duration-300 ${
                   isDarkMode ? 'text-gray-400' : 'text-gray-500'
                 }`}>
                   <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                   <p className="text-lg font-medium">No Inactive Municipalities</p>
                   <p className="text-sm">All municipalities meet the active criteria (≥5 average patrols per day)</p>
                 </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Total Patrols Modal */}
      {showTotalPatrolsModal && (
        <div className="fixed inset-0 flex items-center justify-center z-40 p-4">
          <div className={`rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden ${
            isDarkMode ? 'bg-gray-900' : 'bg-white'
          }`}>
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  isDarkMode ? 'bg-orange-900/30' : 'bg-orange-100'
                }`}>
                  <MapPin className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className={`text-xl font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>Total Patrols Breakdown</h3>
                  <p className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>{summaryStats.totalPatrols.toLocaleString()} total patrols across all municipalities</p>
                </div>
              </div>
              <button
                onClick={() => setShowTotalPatrolsModal(false)}
                className={`p-2 rounded-lg transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {patrolData.length > 0 ? (
                <div className="space-y-4">
                  {patrolData.map((municipality, index) => {
                    const totalPatrols = municipality.data ? municipality.data.reduce((sum, val) => sum + (val || 0), 0) : 0;
                    const avgPatrols = municipality.data && municipality.data.length > 0 ? totalPatrols / municipality.data.length : 0;
                    
                    return (
                      <div key={index} className={`p-4 rounded-lg border transition-all duration-300 ${
                        isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className={`font-semibold transition-colors duration-300 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>{municipality.municipality || 'Unknown Municipality'}</h4>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            isDarkMode ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {municipality.district || 'Unknown District'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className={`text-sm transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            <span className="font-semibold text-orange-600 dark:text-orange-400">{totalPatrols}</span> total patrols
                          </div>
                          <div className={`text-sm transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            <span className="font-semibold text-orange-600 dark:text-orange-400">{avgPatrols.toFixed(1)}</span> avg per day
                          </div>
                          <div className={`text-sm transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            <span className="font-semibold text-orange-600 dark:text-orange-400">{municipality.data?.length || 0}</span> days tracked
                          </div>
                        </div>
                        {municipality.data && municipality.data.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className={`text-xs font-medium mb-2 transition-colors duration-300 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>Daily Breakdown:</div>
                            <div className="grid grid-cols-7 md:grid-cols-10 gap-1">
                              {municipality.data.slice(0, 30).map((patrols, dayIndex) => (
                                <div key={dayIndex} className={`text-center p-1 rounded text-xs ${
                                  patrols > 0 
                                    ? isDarkMode ? 'bg-orange-900/30 text-orange-300' : 'bg-orange-100 text-orange-700'
                                    : isDarkMode ? 'bg-gray-800 text-gray-500' : 'bg-gray-200 text-gray-400'
                                }`}>
                                  {patrols || 0}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={`text-center py-8 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium">No Patrol Data</p>
                  <p className="text-sm">No patrol data has been recorded yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Total Incidents Modal */}
      {showTotalIncidentsModal && (
        <div className="fixed inset-0 flex items-center justify-center z-40 p-4">
          <div className={`rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden ${
            isDarkMode ? 'bg-gray-900' : 'bg-white'
          }`}>
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100'
                }`}>
                  <AlertTriangle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className={`text-xl font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>Total Incidents Breakdown</h3>
                  <p className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>{summaryStats.totalIncidents} total incidents reported</p>
                </div>
              </div>
              <button
                onClick={() => setShowTotalIncidentsModal(false)}
                className={`p-2 rounded-lg transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {incidents.length > 0 ? (
                <div className="space-y-4">
                  {incidents.map((incident, index) => (
                    <div key={index} className={`p-4 rounded-lg border transition-all duration-300 ${
                      isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={`font-semibold transition-colors duration-300 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>{incident.incidentType || 'Unknown Type'}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          incident.status === 'Resolved' || incident.actionType
                            ? isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
                            : isDarkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {incident.status === 'Resolved' || incident.actionType ? 'Resolved' : 'Pending'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className={`transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          <span className="font-medium">Location:</span> {incident.location || 'Unknown'}
                        </div>
                        <div className={`transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          <span className="font-medium">Date:</span> {incident.date?.toDate ? incident.date.toDate().toLocaleDateString() : new Date(incident.date).toLocaleDateString()}
                        </div>
                        {incident.description && (
                          <div className={`md:col-span-2 transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            <span className="font-medium">Description:</span> {incident.description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`text-center py-8 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium">No Incidents Found</p>
                  <p className="text-sm">No incidents have been reported yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Total Actions Modal */}
      {showTotalActionsModal && (
        <div className="fixed inset-0 flex items-center justify-center z-40 p-4">
          <div className={`rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden ${
            isDarkMode ? 'bg-gray-900' : 'bg-white'
          }`}>
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'
                }`}>
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className={`text-xl font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>Total Actions Breakdown</h3>
                  <p className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>{summaryStats.totalActions} total actions taken</p>
                </div>
              </div>
              <button
                onClick={() => setShowTotalActionsModal(false)}
                className={`p-2 rounded-lg transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {actionReports.length > 0 ? (
                <div className="space-y-4">
                  {actionReports.map((report, index) => (
                    <div key={index} className={`p-4 rounded-lg border transition-all duration-300 ${
                      isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={`font-semibold transition-colors duration-300 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>{report.what || 'Action Report'}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          report.status === 'Resolved' || report.actionTaken === 'Resolved'
                            ? isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
                            : isDarkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {report.status === 'Resolved' || report.actionTaken === 'Resolved' ? 'Resolved' : 'Pending'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className={`transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          <span className="font-medium">Location:</span> {report.where || 'Unknown'}
                        </div>
                        <div className={`transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          <span className="font-medium">Date:</span> {report.when?.toDate ? report.when.toDate().toLocaleDateString() : new Date(report.when).toLocaleDateString()}
                        </div>
                        <div className={`transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          <span className="font-medium">Action Taken:</span> {report.actionTaken || 'Not specified'}
                        </div>
                        <div className={`transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          <span className="font-medium">Priority:</span> {report.priority || 'Not specified'}
                        </div>
                        {report.otherInfo && (
                          <div className={`md:col-span-2 transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            <span className="font-medium">Additional Info:</span> {report.otherInfo}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`text-center py-8 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium">No Action Reports</p>
                  <p className="text-sm">No action reports have been submitted yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
} 
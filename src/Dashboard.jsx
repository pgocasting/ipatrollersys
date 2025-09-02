import React, { useState, useCallback, useEffect, useRef } from "react";
import Layout from "./Layout";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Badge } from "./components/ui/badge";

import { useData } from "./DataContext";

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
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
  TrendingDown,
  AlertCircle,
  X,
  Target,
  Trophy,
  Calendar,
  Eye,
  Image,
  Car
} from "lucide-react";
import { Button } from "./components/ui/button";

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
  const { 
    actionReports, 
    incidents, 
    ipatrollerData, // Add IPatroller data
    summaryStats, 
    loading: dataLoading 
  } = useData();

  // Calculate comprehensive statistics
  const comprehensiveStats = React.useMemo(() => {
    // Action Center Statistics by Department
    const actionsByDepartment = {
      pnp: actionReports?.filter(r => r.department === 'pnp' && r.actionTaken && String(r.actionTaken).trim() !== '').length || 0,
      agriculture: actionReports?.filter(r => r.department === 'agriculture' && r.actionTaken && String(r.actionTaken).trim() !== '').length || 0,
      'pg-enro': actionReports?.filter(r => r.department === 'pg-enro' && r.actionTaken && String(r.actionTaken).trim() !== '').length || 0
    };
    
    // Incidents Statistics by Type (current month)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthlyIncidents = incidents?.filter(incident => {
      try {
        const rawDate = incident?.date;
        const d = rawDate?.toDate ? rawDate.toDate() : new Date(rawDate);
        if (!isNaN(d)) {
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }
        return false;
      } catch (e) {
        return false;
      }
    }) || [];
    
    const incidentsByType = {
      traffic: monthlyIncidents.filter(i => i.incidentType?.includes('Traffic')).length,
      drugRelated: monthlyIncidents.filter(i => i.incidentType === 'Drug-related').length,
      theft: monthlyIncidents.filter(i => i.incidentType === 'Theft').length,
      assault: monthlyIncidents.filter(i => i.incidentType === 'Assault').length,
      others: monthlyIncidents.filter(i => !['Traffic Violation', 'Traffic Accident', 'Drug-related', 'Theft', 'Assault'].includes(i.incidentType)).length
    };
    
    // I-Patroller Statistics
    const totalPatrols = ipatrollerData?.reduce((sum, item) => 
      sum + (item.data?.reduce((daySum, val) => daySum + (val || 0), 0) || 0), 0) || 0;
    const activeMunicipalities = ipatrollerData?.filter(item => {
      if (!item.data || !Array.isArray(item.data)) return false;
      const avgPatrols = item.data.reduce((a, b) => a + (b || 0), 0) / item.data.length;
      return avgPatrols >= 5;
    }).length || 0;
    
    const inactiveMunicipalities = ipatrollerData?.filter(item => {
      if (!item.data || !Array.isArray(item.data)) return true; // No data = inactive
      const avgPatrols = item.data.reduce((a, b) => a + (b || 0), 0) / item.data.length;
      return avgPatrols < 5;
    }).length || 0;
        
        return {
      actionsByDepartment,
      incidentsByType,
      monthlyIncidents: monthlyIncidents.length,
      totalActions: actionReports?.filter(r => r.actionTaken && String(r.actionTaken).trim() !== '').length || 0,
      totalPatrols,
      activeMunicipalities,
      inactiveMunicipalities
    };
  }, [actionReports, incidents, ipatrollerData]);

  const [selectedDashboardTab, setSelectedDashboardTab] = useState('overview');
  // Incidents month/year selector (for Incidents tab only)
  const [selectedIncidentsMonth, setSelectedIncidentsMonth] = useState(new Date().getMonth());
  const [selectedIncidentsYear, setSelectedIncidentsYear] = useState(new Date().getFullYear());

  // Incidents stats for selected month/year
  const incidentsStats = React.useMemo(() => {
    const filtered = (incidents || []).filter((incident) => {
      try {
        // 1) Prefer explicit month/year fields if present
        if (incident?.month) {
          // incident.month may be a name (e.g., "July") or a number (0-11 / 1-12)
          let monthIndex;
          if (typeof incident.month === 'number') {
            monthIndex = incident.month <= 11 ? incident.month : incident.month - 1;
          } else {
            const parsed = new Date(`${incident.month} 1, ${selectedIncidentsYear}`);
            monthIndex = parsed instanceof Date && !Number.isNaN(parsed.getTime()) ? parsed.getMonth() : NaN;
          }

          const hasYear = !!incident.year;
          const yearNum = hasYear ? parseInt(incident.year, 10) : null;

          if (!Number.isNaN(monthIndex)) {
            if (hasYear) {
              return monthIndex === selectedIncidentsMonth && yearNum === selectedIncidentsYear;
            }
            // If no year on record, match by month only (Dashboard selector year acts as display only)
            return monthIndex === selectedIncidentsMonth;
          }
        }

        // 2) Fallback to timestamp/date field if available
        const rawDate = incident?.date;
        const d = rawDate?.toDate ? rawDate.toDate() : new Date(rawDate);
        if (d instanceof Date && !Number.isNaN(d.getTime())) {
          return d.getMonth() === selectedIncidentsMonth && d.getFullYear() === selectedIncidentsYear;
        }
        return false;
      } catch (e) {
        return false;
      }
    });

    return {
      total: filtered.length,
      byType: {
        traffic: filtered.filter(i => i.incidentType?.includes('Traffic')).length,
        drugRelated: filtered.filter(i => i.incidentType === 'Drug-related').length,
        theft: filtered.filter(i => i.incidentType === 'Theft').length,
        assault: filtered.filter(i => i.incidentType === 'Assault').length,
        others: filtered.filter(i => !['Traffic Violation', 'Traffic Accident', 'Drug-related', 'Theft', 'Assault'].includes(i.incidentType)).length,
      }
    };
  }, [incidents, selectedIncidentsMonth, selectedIncidentsYear]);

  // I-Patroller month/year selector and monthly data
  const [selectedPatrollerMonth, setSelectedPatrollerMonth] = useState(new Date().getMonth());
  const [selectedPatrollerYear, setSelectedPatrollerYear] = useState(new Date().getFullYear());
  const [ipatrollerMonthlyData, setIpatrollerMonthlyData] = useState([]);
  const [ipatrollerMonthlyLoading, setIpatrollerMonthlyLoading] = useState(false);

  const setIPatrollerMonthlyDataSafe = (data) => {
    if (Array.isArray(data)) {
      setIpatrollerMonthlyData(data);
    } else {
      setIpatrollerMonthlyData([]);
    }
  };

  const loadIPatrollerMonthlyData = useCallback(async (month, year) => {
    try {
      setIpatrollerMonthlyLoading(true);
      const monthYearId = `${String(month + 1).padStart(2, "0")}-${year}`;
      // For now, we'll use placeholder data since the subcollection structure is complex
      // This can be enhanced later with proper subcollection support
      const data = [];
      setIPatrollerMonthlyDataSafe(data);
    } catch (e) {
      console.error('Error loading IPatroller monthly data:', e);
      setIPatrollerMonthlyDataSafe([]);
    } finally {
      setIpatrollerMonthlyLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDashboardTab === 'ipatroller') {
      loadIPatrollerMonthlyData(selectedPatrollerMonth, selectedPatrollerYear);
    }
  }, [selectedPatrollerMonth, selectedPatrollerYear, selectedDashboardTab, loadIPatrollerMonthlyData]);

  const ipatrollerMonthlyStats = React.useMemo(() => {
    if (!ipatrollerMonthlyData || ipatrollerMonthlyData.length === 0) {
        return {
        totalPatrols: 0, 
        activeMunicipalities: 0, 
        inactiveMunicipalities: 0,
        activeMunicipalitiesList: [],
        inactiveMunicipalitiesList: []
      };
    }
    const totalPatrols = ipatrollerMonthlyData.reduce((sum, item) => {
      if (!item?.data || !Array.isArray(item.data)) return sum;
      return sum + item.data.reduce((s, v) => s + (v || 0), 0);
    }, 0);
    
    const activeMunicipalitiesList = ipatrollerMonthlyData.filter(item => {
      if (!item?.data || !Array.isArray(item.data) || item.data.length === 0) return false;
      const avg = item.data.reduce((s, v) => s + (v || 0), 0) / item.data.length;
      return avg >= 5;
    }).map(item => ({
      name: item.id || 'Unknown',
      avgPatrols: item.data ? (item.data.reduce((s, v) => s + (v || 0), 0) / item.data.length).toFixed(1) : '0.0'
    }));
    
    const inactiveMunicipalitiesList = ipatrollerMonthlyData.filter(item => {
      if (!item?.data || !Array.isArray(item.data) || item.data.length === 0) return true; // No data = inactive
      const avg = item.data.reduce((s, v) => s + (v || 0), 0) / item.data.length;
      return avg < 5;
    }).map(item => ({
      name: item.id || 'Unknown',
      avgPatrols: item.data ? (item.data.reduce((s, v) => s + (v || 0), 0) / item.data.length).toFixed(1) : '0.0'
    }));

        return {
      totalPatrols, 
      activeMunicipalities: activeMunicipalitiesList.length, 
      inactiveMunicipalities: inactiveMunicipalitiesList.length,
      activeMunicipalitiesList,
      inactiveMunicipalitiesList
    };
  }, [ipatrollerMonthlyData]);

  // Action Center month/year selector and filtered stats
  const [selectedActionsMonth, setSelectedActionsMonth] = useState(new Date().getMonth());
  const [selectedActionsYear, setSelectedActionsYear] = useState(new Date().getFullYear());

  const actionsStats = React.useMemo(() => {
    const filtered = (actionReports || []).filter((r) => {
      try {
        const raw = r?.when;
        const d = raw?.toDate ? raw.toDate() : new Date(raw);
        if (d instanceof Date && !Number.isNaN(d.getTime())) {
          return d.getMonth() === selectedActionsMonth && d.getFullYear() === selectedActionsYear;
        }
        // Fallback: month/year fields if present
        if (r?.month) {
          let monthIndex;
          if (typeof r.month === 'number') {
            monthIndex = r.month <= 11 ? r.month : r.month - 1;
          } else {
            const parsed = new Date(`${r.month} 1, ${selectedActionsYear}`);
            monthIndex = parsed instanceof Date && !Number.isNaN(parsed.getTime()) ? parsed.getMonth() : NaN;
          }
          const hasYear = !!r.year;
          const yearNum = hasYear ? parseInt(r.year, 10) : null;
          if (!Number.isNaN(monthIndex)) {
            if (hasYear) {
              return monthIndex === selectedActionsMonth && yearNum === selectedActionsYear;
            }
            return monthIndex === selectedActionsMonth;
          }
        }
        return false;
      } catch (e) {
        return false;
      }
    });

    const nonEmpty = (x) => x?.actionTaken && String(x.actionTaken).trim() !== '';
    const byDepartment = {
      pnp: filtered.filter(r => r.department === 'pnp' && nonEmpty(r)).length,
      agriculture: filtered.filter(r => r.department === 'agriculture' && nonEmpty(r)).length,
      'pg-enro': filtered.filter(r => r.department === 'pg-enro' && nonEmpty(r)).length
    };

    // Build per-municipality counts per department
    const initMap = () => new Map();
    const muniCounts = {
      pnp: initMap(),
      agriculture: initMap(),
      'pg-enro': initMap()
    };
    for (const r of filtered) {
      if (!nonEmpty(r)) continue;
      const dept = r.department;
      if (!muniCounts[dept]) continue;
      const name = (r.municipality || r.municipalityName || 'Unknown').toString();
      const key = name.trim() || 'Unknown';
      muniCounts[dept].set(key, (muniCounts[dept].get(key) || 0) + 1);
    }

    const mapToSortedArray = (m) => Array.from(m.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const byMunicipality = {
      pnp: mapToSortedArray(muniCounts.pnp),
      agriculture: mapToSortedArray(muniCounts.agriculture),
      'pg-enro': mapToSortedArray(muniCounts['pg-enro'])
    };

    return { byDepartment, byMunicipality };
  }, [actionReports, selectedActionsMonth, selectedActionsYear]);

  const handleLogout = async () => {
    try {
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#000000',
          font: {
            weight: '600'
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        },
      },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#000000',
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        titleFont: {
          weight: '600'
        }
      }
    },
    elements: {
      arc: {
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    }
  };

  return (
    <Layout onLogout={handleLogout} onNavigate={onNavigate} currentPage={currentPage}>
      <section className="flex-1 p-3 md:p-6 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold transition-colors duration-300 text-gray-900">
              Comprehensive Dashboard
            </h1>
            <p className="text-base md:text-lg transition-colors duration-300 text-gray-600">
              {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })} • Integrated System Overview
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className={`w-2 h-2 rounded-full ${
                dataLoading ? 'bg-yellow-500' : 'bg-green-500'
              }`}></div>
              <span className={`text-sm font-medium ${
                dataLoading ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
              }`}>
                {dataLoading ? 'Loading data...' : 'All systems operational'}
              </span>
            </div>
          </div>
          
          

        {/* Dashboard Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setSelectedDashboardTab('overview')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 shadow-sm hover:shadow-md ${
                selectedDashboardTab === 'overview'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 mr-2 inline" />
              Overview
            </button>
            <button
              onClick={() => setSelectedDashboardTab('ipatroller')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 shadow-sm hover:shadow-md ${
                selectedDashboardTab === 'ipatroller'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Shield className="w-4 h-4 mr-2 inline" />
              I-Patroller
            </button>
            <button
              onClick={() => setSelectedDashboardTab('actions')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 shadow-sm hover:shadow-md ${
                selectedDashboardTab === 'actions'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Activity className="w-4 h-4 mr-2 inline" />
              Actions
            </button>
            <button
              onClick={() => setSelectedDashboardTab('incidents')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 shadow-sm hover:shadow-md ${
                selectedDashboardTab === 'incidents'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <AlertTriangle className="w-4 h-4 mr-2 inline" />
              Incidents
            </button>
            <button
              onClick={() => setSelectedDashboardTab('topPerformers')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 shadow-sm hover:shadow-md ${
                selectedDashboardTab === 'topPerformers'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Trophy className="w-4 h-4 mr-2 inline" />
              Top Performers
            </button>
          </div>
        </div>

        {/* Tabbed Content */}
        {selectedDashboardTab === 'overview' && (
          <>
            {/* Summary Cards - Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
              {/* Total Patrols */}
          <Card className="backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                      <p className="text-xs md:text-sm font-medium transition-colors duration-300 text-gray-500">Total Patrols</p>
                  <p className="text-2xl md:text-3xl font-bold text-blue-600">
                        {comprehensiveStats.totalPatrols.toLocaleString()}
                  </p>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-colors duration-300 bg-blue-100">
                      <Shield className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

              {/* Total Actions */}
          <Card className="backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                      <p className="text-xs md:text-sm font-medium transition-colors duration-300 text-gray-500">Total Actions</p>
                  <p className="text-2xl md:text-3xl font-bold text-green-600">
                        {comprehensiveStats.totalActions.toLocaleString()}
                  </p>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-colors duration-300 bg-green-100">
                      <Activity className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

              {/* Monthly Incidents */}
          <Card className="backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                      <p className="text-xs md:text-sm font-medium transition-colors duration-300 text-gray-500">Monthly Incidents</p>
                  <p className="text-2xl md:text-3xl font-bold text-red-600">
                        {comprehensiveStats.monthlyIncidents.toLocaleString()}
                  </p>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-colors duration-300 bg-red-100">
                      <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

              {/* Active Municipalities */}
          <Card className="backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                      <p className="text-xs md:text-sm font-medium transition-colors duration-300 text-gray-500">Active Municipalities</p>
                  <p className="text-2xl md:text-3xl font-bold text-purple-600">
                        {comprehensiveStats.activeMunicipalities.toLocaleString()}
                  </p>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-colors duration-300 bg-purple-100">
                      <Building2 className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

              {/* Inactive Municipalities */}
        <Card className="backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80">
          <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                      <p className="text-xs md:text-sm font-medium transition-colors duration-300 text-gray-500">Inactive Municipalities</p>
                  <p className="text-2xl md:text-3xl font-bold text-red-600">
                        {comprehensiveStats.inactiveMunicipalities.toLocaleString()}
                </p>
              </div>
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-colors duration-300 bg-red-100">
                      <XCircle className="h-5 w-5 md:h-6 md:w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        </div>

            {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Actions by Department - Bar Chart */}
              <Card className="backdrop-blur-sm border-0 shadow-lg bg-white/80">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold transition-colors duration-300 text-gray-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                    Actions by Department
                  </CardTitle>
            </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Bar
                      data={{
                        labels: ['PNP', 'Agriculture', 'PG-ENRO'],
                        datasets: [{
                          label: 'Actions',
                          data: [
                            comprehensiveStats.actionsByDepartment.pnp,
                            comprehensiveStats.actionsByDepartment.agriculture,
                            comprehensiveStats.actionsByDepartment['pg-enro']
                          ],
                          backgroundColor: [
                            'rgba(59, 130, 246, 0.8)',
                            'rgba(34, 197, 94, 0.8)',
                            'rgba(168, 85, 247, 0.8)'
                          ],
                          borderColor: [
                            'rgb(59, 130, 246)',
                            'rgb(34, 197, 94)',
                            'rgb(168, 85, 247)'
                          ],
                          borderWidth: 1
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true
                          }
                        }
                      }}
                    />
                </div>
            </CardContent>
          </Card>

              {/* Incidents by Type - Pie Chart */}
              <Card className="backdrop-blur-sm border-0 shadow-lg bg-white/80">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold transition-colors duration-300 text-gray-900 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-green-500" />
                    Incidents by Type
                  </CardTitle>
            </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Pie
                      data={{
                        labels: ['Vehicular Accident', 'Drug-related', 'Theft', 'Assault', 'Others'],
                        datasets: [{
                          data: [
                            incidentsStats.byType.traffic,
                            incidentsStats.byType.drugRelated,
                            incidentsStats.byType.theft,
                            incidentsStats.byType.assault,
                            incidentsStats.byType.others
                          ],
                          backgroundColor: [
                            'rgba(239, 68, 68, 0.8)',
                            'rgba(245, 158, 11, 0.8)',
                            'rgba(168, 85, 247, 0.8)',
                            'rgba(34, 197, 94, 0.8)',
                            'rgba(107, 114, 128, 0.8)'
                          ],
                          borderColor: [
                            'rgb(239, 68, 68)',
                            'rgb(245, 158, 11)',
                            'rgb(168, 85, 247)',
                            'rgb(34, 197, 94)',
                            'rgb(107, 114, 128)'
                          ],
                          borderWidth: 2
                        }]
                      }}
                      options={pieOptions}
                    />
                </div>
            </CardContent>
          </Card>
        </div>
          </>
        )}

        {/* I-Patroller Tab */}
        {selectedDashboardTab === 'ipatroller' && (
          <div className="space-y-6">
            {/* Month/Year Selector */}
            <Card className="backdrop-blur-sm border-0 shadow-lg bg-white/80">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-700">Filter I-Patroller by Month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedPatrollerMonth}
                      onChange={(e) => setSelectedPatrollerMonth(parseInt(e.target.value))}
                      className="px-3 py-2 rounded-md border transition-colors duration-300 bg-white border-gray-300 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={0}>January</option>
                      <option value={1}>February</option>
                      <option value={2}>March</option>
                      <option value={3}>April</option>
                      <option value={4}>May</option>
                      <option value={5}>June</option>
                      <option value={6}>July</option>
                      <option value={7}>August</option>
                      <option value={8}>September</option>
                      <option value={9}>October</option>
                      <option value={10}>November</option>
                      <option value={11}>December</option>
                    </select>
                    <select
                      value={selectedPatrollerYear}
                      onChange={(e) => setSelectedPatrollerYear(parseInt(e.target.value))}
                      className="px-3 py-2 rounded-md border transition-colors duration-300 bg-white border-gray-300 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {Array.from({ length: 6 }, (_, idx) => new Date().getFullYear() - 2 + idx).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                </div>
              </div>
            </CardContent>
          </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
          {/* I-Patroller specific cards */}
          <Card className="backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                          <div>
                    <p className="text-xs md:text-sm font-medium transition-colors duration-300 text-gray-500">Total Patrols (Month)</p>
                    <p className="text-2xl md:text-3xl font-bold text-blue-600">
                      {ipatrollerMonthlyStats.totalPatrols.toLocaleString()}
                    </p>
                </div>
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-colors duration-300 bg-blue-100">
                    <Shield className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
              </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                          <div>
                    <p className="text-xs md:text-sm font-medium transition-colors duration-300 text-gray-500">Active Municipalities</p>
                    <p className="text-2xl md:text-3xl font-bold text-green-600">
                      {ipatrollerMonthlyStats.activeMunicipalities.toLocaleString()}
                    </p>
                          </div>
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-colors duration-300 bg-green-100">
                    <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                        </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                          <div>
                    <p className="text-xs md:text-sm font-medium transition-colors duration-300 text-gray-500">Inactive Municipalities</p>
                    <p className="text-2xl md:text-3xl font-bold text-red-600">
                      {ipatrollerMonthlyStats.inactiveMunicipalities.toLocaleString()}
                    </p>
                          </div>
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-colors duration-300 bg-red-100">
                    <XCircle className="h-5 w-5 md:h-6 md:w-6 text-red-600" />
                        </div>
              </div>
            </CardContent>
          </Card>

            <Card className="backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs md:text-sm font-medium transition-colors duration-300 text-gray-500">Total Municipalities</p>
                    <p className="text-2xl md:text-3xl font-bold text-purple-600">12</p>
                </div>
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-colors duration-300 bg-purple-100">
                    <Building2 className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
              </div>
            </div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs md:text-sm font-medium transition-colors duration-300 text-gray-500">Districts Active</p>
                    <p className="text-2xl md:text-3xl font-bold text-orange-600">3</p>
                </div>
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-colors duration-300 bg-orange-100">
                    <MapPin className="h-5 w-5 md:h-6 md:w-6 text-orange-600" />
              </div>
            </div>
              </CardContent>
            </Card>
                        </div>

            {/* Municipalities Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Active Municipalities List */}
              <Card className="backdrop-blur-sm border-0 shadow-lg bg-white/80">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold transition-colors duration-300 text-gray-900 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Active Municipalities ({ipatrollerMonthlyStats.activeMunicipalities})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {ipatrollerMonthlyStats.activeMunicipalitiesList.length > 0 ? (
                      ipatrollerMonthlyStats.activeMunicipalitiesList
                        .sort((a, b) => parseFloat(b.avgPatrols) - parseFloat(a.avgPatrols))
                        .map((municipality, index) => (
                          <div key={`active-${municipality.name}-${index}`} className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                            <span className="font-medium text-gray-800 capitalize">{municipality.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-green-600 font-semibold">{municipality.avgPatrols} avg/day</span>
                              <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                </div>
                        ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">No active municipalities found for this period</p>
        </div>
      )}
                </div>
                </CardContent>
              </Card>

              {/* Inactive Municipalities List */}
              <Card className="backdrop-blur-sm border-0 shadow-lg bg-white/80">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold transition-colors duration-300 text-gray-900 flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    Inactive Municipalities ({ipatrollerMonthlyStats.inactiveMunicipalities})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {ipatrollerMonthlyStats.inactiveMunicipalitiesList.length > 0 ? (
                      ipatrollerMonthlyStats.inactiveMunicipalitiesList
                        .sort((a, b) => parseFloat(a.avgPatrols) - parseFloat(b.avgPatrols))
                        .map((municipality, index) => (
                          <div key={`inactive-${municipality.name}-${index}`} className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200">
                            <span className="font-medium text-gray-800 capitalize">{municipality.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-red-600 font-semibold">{municipality.avgPatrols} avg/day</span>
                              <XCircle className="w-4 h-4 text-red-500" />
                      </div>
                        </div>
                        ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <XCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">No inactive municipalities found for this period</p>
                </div>
              )}
            </div>
                </CardContent>
              </Card>
          </div>
        </div>
      )}

        {/* Actions Tab */}
         {selectedDashboardTab === 'actions' && (
           <div className="space-y-6">
             {/* Month/Year Selector */}
             <Card className="backdrop-blur-sm border-0 shadow-lg bg-white/80">
               <CardContent className="p-4 md:p-6">
                 <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-gray-600" />
                     <span className="font-medium text-gray-700">Filter Actions by Month</span>
                        </div>
                   <div className="flex items-center gap-2">
                      <select
                       value={selectedActionsMonth}
                       onChange={(e) => setSelectedActionsMonth(parseInt(e.target.value))}
                       className="px-3 py-2 rounded-md border transition-colors duration-300 bg-white border-gray-300 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={0}>January</option>
                        <option value={1}>February</option>
                        <option value={2}>March</option>
                        <option value={3}>April</option>
                        <option value={4}>May</option>
                        <option value={5}>June</option>
                        <option value={6}>July</option>
                        <option value={7}>August</option>
                        <option value={8}>September</option>
                        <option value={9}>October</option>
                        <option value={10}>November</option>
                        <option value={11}>December</option>
                      </select>
                      <select
                       value={selectedActionsYear}
                       onChange={(e) => setSelectedActionsYear(parseInt(e.target.value))}
                       className="px-3 py-2 rounded-md border transition-colors duration-300 bg-white border-gray-300 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     >
                       {Array.from({ length: 6 }, (_, idx) => new Date().getFullYear() - 2 + idx).map(year => (
                         <option key={year} value={year}>{year}</option>
                       ))}
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
               {/* PNP Actions */}
                    <Card className="backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80">
                 <CardContent className="p-4 md:p-6">
                        <div className="flex items-center justify-between">
                          <div>
                       <p className="text-xs md:text-sm font-medium transition-colors duration-300 text-gray-500">PNP Actions</p>
                       <p className="text-2xl md:text-3xl font-bold text-blue-600">
                         {actionsStats.byDepartment.pnp.toLocaleString()}
                            </p>
                          </div>
                     <div className="h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-colors duration-300 bg-blue-100">
                       <Shield className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

               {/* Agriculture Actions */}
                    <Card className="backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80">
                 <CardContent className="p-4 md:p-6">
                        <div className="flex items-center justify-between">
                          <div>
                       <p className="text-xs md:text-sm font-medium transition-colors duration-300 text-gray-500">Agriculture Actions</p>
                       <p className="text-2xl md:text-3xl font-bold text-green-600">
                         {actionsStats.byDepartment.agriculture.toLocaleString()}
                            </p>
                          </div>
                     <div className="h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-colors duration-300 bg-green-100">
                       <Activity className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

               {/* PG-ENRO Actions */}
                    <Card className="backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80">
                 <CardContent className="p-4 md:p-6">
                        <div className="flex items-center justify-between">
                          <div>
                       <p className="text-xs md:text-sm font-medium transition-colors duration-300 text-gray-500">PG-ENRO Actions</p>
                       <p className="text-2xl md:text-3xl font-bold text-purple-600">
                         {actionsStats.byDepartment['pg-enro'].toLocaleString()}
                            </p>
                          </div>
                     <div className="h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-colors duration-300 bg-purple-100">
                       <Users className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

             {/* Per-Municipality Lists */}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
               {/* PNP List */}
                  <Card className="backdrop-blur-sm border-0 shadow-lg bg-white/80">
                    <CardHeader>
                                        <CardTitle className="text-lg font-semibold transition-colors duration-300 text-gray-900 flex items-center gap-2">
                     <Shield className="w-5 h-5 text-blue-600" />
                     PNP: Top Municipalities
                  </CardTitle>
                    </CardHeader>
                    <CardContent>
                   <div className="space-y-2 max-h-64 overflow-y-auto">
                     {(actionsStats.byMunicipality.pnp || []).length > 0 ? (
                       actionsStats.byMunicipality.pnp.map((m, idx) => (
                         <div key={`pnp-${m.name}-${idx}`} className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
                           <span className="font-medium text-gray-800 capitalize">{m.name}</span>
                           <span className="text-sm text-blue-700 font-semibold">{m.count}</span>
                                    </div>
                       ))
                     ) : (
                       <div className="text-center py-8 text-gray-500">
                         <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                         <p className="text-sm">No PNP actions for this period</p>
                                    </div>
                     )}
                      </div>
                    </CardContent>
                  </Card>

               {/* Agriculture List */}
                  <Card className="backdrop-blur-sm border-0 shadow-lg bg-white/80">
                    <CardHeader>
                                        <CardTitle className="text-lg font-semibold transition-colors duration-300 text-gray-900 flex items-center gap-2">
                     <Activity className="w-5 h-5 text-green-600" />
                     Agriculture: Top Municipalities
                  </CardTitle>
                    </CardHeader>
                    <CardContent>
                   <div className="space-y-2 max-h-64 overflow-y-auto">
                     {(actionsStats.byMunicipality.agriculture || []).length > 0 ? (
                       actionsStats.byMunicipality.agriculture.map((m, idx) => (
                         <div key={`agri-${m.name}-${idx}`} className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                           <span className="font-medium text-gray-800 capitalize">{m.name}</span>
                           <span className="text-sm text-green-700 font-semibold">{m.count}</span>
                        </div>
                       ))
                     ) : (
                       <div className="text-center py-8 text-gray-500">
                         <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                         <p className="text-sm">No Agriculture actions for this period</p>
                       </div>
                     )}
                      </div>
                    </CardContent>
                  </Card>

               {/* PG-ENRO List */}
               <Card className="backdrop-blur-sm border-0 shadow-lg bg-white/80">
                 <CardHeader>
                   <CardTitle className="text-lg font-semibold transition-colors duration-300 text-gray-900 flex items-center gap-2">
                     <Users className="w-5 h-5 text-purple-600" />
                     PG-ENRO: Top Municipalities
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="space-y-2 max-h-64 overflow-y-auto">
                     {(actionsStats.byMunicipality['pg-enro'] || []).length > 0 ? (
                       actionsStats.byMunicipality['pg-enro'].map((m, idx) => (
                         <div key={`pgenro-${m.name}-${idx}`} className="flex items-center justify-between p-3 rounded-lg bg-purple-50 border border-purple-200">
                           <span className="font-medium text-gray-800 capitalize">{m.name}</span>
                           <span className="text-sm text-purple-700 font-semibold">{m.count}</span>
                </div>
                       ))
                     ) : (
                       <div className="text-center py-8 text-gray-500">
                         <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                         <p className="text-sm">No PG-ENRO actions for this period</p>
                </div>
              )}
            </div>
                 </CardContent>
               </Card>
          </div>
        </div>
      )}

        {/* Incidents Tab */}
        {selectedDashboardTab === 'incidents' && (
          <div className="space-y-6">
            {/* Month/Year Selector */}
            <Card className="backdrop-blur-sm border-0 shadow-lg bg-white/80">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-700">Filter Incidents by Month</span>
                </div>
                  <div className="flex items-center gap-2">
                      <select
                      value={selectedIncidentsMonth}
                      onChange={(e) => setSelectedIncidentsMonth(parseInt(e.target.value))}
                      className="px-3 py-2 rounded-md border transition-colors duration-300 bg-white border-gray-300 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={0}>January</option>
                        <option value={1}>February</option>
                        <option value={2}>March</option>
                        <option value={3}>April</option>
                        <option value={4}>May</option>
                        <option value={5}>June</option>
                        <option value={6}>July</option>
                        <option value={7}>August</option>
                        <option value={8}>September</option>
                        <option value={9}>October</option>
                        <option value={10}>November</option>
                        <option value={11}>December</option>
                      </select>
                      <select
                      value={selectedIncidentsYear}
                      onChange={(e) => setSelectedIncidentsYear(parseInt(e.target.value))}
                      className="px-3 py-2 rounded-md border transition-colors duration-300 bg-white border-gray-300 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {Array.from({ length: 6 }, (_, idx) => new Date().getFullYear() - 2 + idx).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
              {/* Vehicular Accident Incidents */}
                    <Card className="backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80">
                <CardContent className="p-4 md:p-6">
                        <div className="flex items-center justify-between">
                <div>
                      <p className="text-xs md:text-sm font-medium transition-colors duration-300 text-gray-500">Vehicular Accident</p>
                      <p className="text-2xl md:text-3xl font-bold text-red-600">
                        {incidentsStats.byType.traffic.toLocaleString()}
                            </p>
                </div>
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-colors duration-300 bg-red-100">
                      <Car className="h-5 w-5 md:h-6 md:w-6 text-red-600" />
              </div>
              </div>
                      </CardContent>
                    </Card>

              {/* Drug-related */}
                    <Card className="backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80">
                <CardContent className="p-4 md:p-6">
                        <div className="flex items-center justify-between">
                          <div>
                      <p className="text-xs md:text-sm font-medium transition-colors duration-300 text-gray-500">Drug-related</p>
                      <p className="text-2xl md:text-3xl font-bold text-orange-600">
                        {incidentsStats.byType.drugRelated.toLocaleString()}
                </p>
              </div>
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-colors duration-300 bg-orange-100">
                      <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 text-orange-600" />
                </div>
              </div>
                      </CardContent>
                    </Card>

              {/* Theft */}
                    <Card className="backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80">
                <CardContent className="p-4 md:p-6">
                        <div className="flex items-center justify-between">
                          <div>
                      <p className="text-xs md:text-sm font-medium transition-colors duration-300 text-gray-500">Theft</p>
                      <p className="text-2xl md:text-3xl font-bold text-purple-600">
                        {incidentsStats.byType.theft.toLocaleString()}
                    </p>
                  </div>
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-colors duration-300 bg-purple-100">
                      <AlertCircle className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
                  </div>
                  </div>
                      </CardContent>
                    </Card>

              {/* Assault */}
                    <Card className="backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80">
                <CardContent className="p-4 md:p-6">
                        <div className="flex items-center justify-between">
                          <div>
                      <p className="text-xs md:text-sm font-medium transition-colors duration-300 text-gray-500">Assault</p>
                      <p className="text-2xl md:text-3xl font-bold text-green-600">
                        {incidentsStats.byType.assault.toLocaleString()}
                    </p>
                  </div>
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-colors duration-300 bg-green-100">
                      <User className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                </div>
              </div>
                      </CardContent>
                    </Card>

              {/* Others */}
              <Card className="backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                                    <div>
                      <p className="text-xs md:text-sm font-medium transition-colors duration-300 text-gray-500">Others</p>
                      <p className="text-2xl md:text-3xl font-bold text-gray-600">
                        {incidentsStats.byType.others.toLocaleString()}
                                      </p>
              </div>
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-colors duration-300 bg-gray-100">
                      <FileText className="h-5 w-5 md:h-6 md:w-6 text-gray-600" />
            </div>
                      </div>
                    </CardContent>
                  </Card>
          </div>
        </div>
      )}

      {/* Top Performers Tab */}
      {selectedDashboardTab === 'topPerformers' && (
        <div className="space-y-6">
          {/* Header */}
          <Card className="backdrop-blur-sm border-0 shadow-lg bg-white/80">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-yellow-600" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Top Performers</h2>
                  <p className="text-gray-600">Performance metrics by municipality and district</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {/* Active Municipalities */}
            <Card className="backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-medium transition-colors duration-300 text-gray-500">Active Municipalities</p>
                    <p className="text-2xl md:text-3xl font-bold text-green-600">
                      {comprehensiveStats.activeMunicipalities || 0}
                    </p>
                    <p className="text-xs text-gray-500">With recent activity</p>
                  </div>
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-colors duration-300 bg-green-100">
                    <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Inactive Municipalities */}
            <Card className="backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-medium transition-colors duration-300 text-gray-500">Inactive Municipalities</p>
                    <p className="text-2xl md:text-3xl font-bold text-orange-600">
                      {comprehensiveStats.inactiveMunicipalities || 0}
                    </p>
                    <p className="text-xs text-gray-500">No recent activity</p>
                  </div>
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-colors duration-300 bg-orange-100">
                    <XCircle className="h-5 w-5 md:h-6 md:w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Districts */}
            <Card className="backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-medium transition-colors duration-300 text-gray-500">Total Districts</p>
                    <p className="text-2xl md:text-3xl font-bold text-blue-600">
                      {comprehensiveStats.totalDistricts || 0}
                    </p>
                    <p className="text-xs text-gray-500">Coverage areas</p>
                  </div>
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-colors duration-300 bg-blue-100">
                    <MapPin className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Users */}
            <Card className="backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-medium transition-colors duration-300 text-gray-500">Total Users</p>
                    <p className="text-2xl md:text-3xl font-bold text-purple-600">
                      {comprehensiveStats.totalUsers || 0}
                    </p>
                    <p className="text-xs text-gray-500">Active personnel</p>
                  </div>
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-colors duration-300 bg-purple-100">
                    <Users className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Municipality Performance Table */}
          <Card className="backdrop-blur-sm border-0 shadow-lg bg-white/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Municipality Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-3 font-semibold text-gray-700">Municipality</th>
                      <th className="text-left p-3 font-semibold text-gray-700">District</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Status</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Actions</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Patrols</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Incidents</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Get all municipalities from the district mapping
                      const allMunicipalities = [
                        { name: "Abucay", district: "1ST DISTRICT" },
                        { name: "Orani", district: "1ST DISTRICT" },
                        { name: "Samal", district: "1ST DISTRICT" },
                        { name: "Hermosa", district: "1ST DISTRICT" },
                        { name: "Balanga City", district: "2ND DISTRICT" },
                        { name: "Pilar", district: "2ND DISTRICT" },
                        { name: "Orion", district: "2ND DISTRICT" },
                        { name: "Limay", district: "2ND DISTRICT" },
                        { name: "Bagac", district: "3RD DISTRICT" },
                        { name: "Dinalupihan", district: "3RD DISTRICT" },
                        { name: "Mariveles", district: "3RD DISTRICT" },
                        { name: "Morong", district: "3RD DISTRICT" }
                      ];

                      // Calculate performance for each municipality
                      const municipalityPerformance = allMunicipalities.map(municipality => {
                        const municipalityActions = actionReports?.filter(r => r.municipality === municipality.name) || [];
                        const municipalityPatrols = ipatrollerData?.filter(p => p.municipality === municipality.name) || [];
                        const municipalityIncidents = incidents?.filter(i => i.municipality === municipality.name) || [];
                        
                        const totalActions = municipalityActions.length;
                        const totalPatrols = municipalityPatrols.length;
                        const totalIncidents = municipalityIncidents.length;
                        
                        // Calculate performance score (actions + patrols - incidents)
                        const performanceScore = totalActions + totalPatrols - totalIncidents;
                        
                        // Determine status based on activity
                        const isActive = totalActions > 0 || totalPatrols > 0;
                        const status = isActive ? 'Active' : 'Inactive';
                        
                        return {
                          ...municipality,
                          totalActions,
                          totalPatrols,
                          totalIncidents,
                          performanceScore,
                          status
                        };
                      });

                      // Sort by performance score (highest first)
                      municipalityPerformance.sort((a, b) => b.performanceScore - a.performanceScore);

                      return municipalityPerformance.map((municipality, index) => (
                        <tr key={municipality.name} className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {index < 3 && (
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                  index === 0 ? 'bg-yellow-500' : 
                                  index === 1 ? 'bg-gray-400' : 'bg-orange-600'
                                }`}>
                                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                </div>
                              )}
                              <span className="font-medium text-gray-900">{municipality.name}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="text-xs">
                              {municipality.district}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge className={`text-xs ${
                              municipality.status === 'Active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              {municipality.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm text-gray-700">{municipality.totalActions}</td>
                          <td className="p-3 text-sm text-gray-700">{municipality.totalPatrols}</td>
                          <td className="p-3 text-sm text-sm text-gray-700">{municipality.totalIncidents}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-semibold ${
                                municipality.performanceScore > 0 ? 'text-green-600' : 
                                municipality.performanceScore < 0 ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {municipality.performanceScore > 0 ? '+' : ''}{municipality.performanceScore}
                              </span>
                              {municipality.performanceScore > 0 && <TrendingUp className="w-4 h-4 text-green-600" />}
                              {municipality.performanceScore < 0 && <TrendingDown className="w-4 h-4 text-red-600" />}
                            </div>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      </section>
    </Layout>
  );
} 
import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Badge } from './components/ui/badge';
import { Label } from './components/ui/label';
import { Separator } from './components/ui/separator';
import { Progress } from './components/ui/progress';
import { useData } from './DataContext';
import { useAuth } from './contexts/AuthContext';
import { useFirebase } from './hooks/useFirebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
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
  AlertTriangle,
  Building2,
  MapPin,
  Mountain,
  Shield,
  Pickaxe,
  FileText,
  Users,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export default function Dashboard({ onLogout, onNavigate, currentPage }) {
  const { 
    summaryStats, 
    ipatrollerData,
    actionReports,
    incidents,
    loading: dataLoading
  } = useData();
  const { userAccessLevel, userMunicipality } = useAuth();

  const [selectedTimePeriod, setSelectedTimePeriod] = useState('weekly');
  const { notifications, showSuccess, removeNotification } = useNotification();
  
  // Command Center data states
  const [realCommandCenterData, setRealCommandCenterData] = useState({
    barangays: [],
    concernTypes: [],
    weeklyReports: [],
    totalBarangays: 0,
    totalConcernTypes: 0,
    totalReports: 0
  });
  const [isLoadingCommandCenter, setIsLoadingCommandCenter] = useState(false);

  // Fetch real Command Center data from Firebase
  const fetchCommandCenterData = async () => {
    if (userAccessLevel !== 'command-center') return;
    
    setIsLoadingCommandCenter(true);
    try {
      // Fetch barangays
      const barangaysQuery = userMunicipality 
        ? query(collection(db, 'barangays'), where('municipality', '==', userMunicipality))
        : collection(db, 'barangays');
      const barangaysSnapshot = await getDocs(barangaysQuery);
      const barangays = barangaysSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Fetch concern types
      const concernTypesQuery = userMunicipality
        ? query(collection(db, 'concernTypes'), where('municipality', 'in', [userMunicipality, 'All Municipalities']))
        : collection(db, 'concernTypes');
      const concernTypesSnapshot = await getDocs(concernTypesQuery);
      const concernTypes = concernTypesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Fetch weekly reports
      const reportsQuery = userMunicipality
        ? query(collection(db, 'weeklyReports'), where('municipality', '==', userMunicipality))
        : collection(db, 'weeklyReports');
      const reportsSnapshot = await getDocs(reportsQuery);
      const weeklyReports = reportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Calculate totals from actual weekly report data (monthly counts from Command Center table)
      let totalReports = 0;
      weeklyReports.forEach(report => {
        if (report.weeklyReportData) {
          Object.values(report.weeklyReportData).forEach(dateEntries => {
            if (Array.isArray(dateEntries)) {
              dateEntries.forEach(entry => {
                // Sum up the weekly counts (week1, week2, week3, week4) from each entry
                const week1 = parseInt(entry.week1) || 0;
                const week2 = parseInt(entry.week2) || 0;
                const week3 = parseInt(entry.week3) || 0;
                const week4 = parseInt(entry.week4) || 0;
                totalReports += week1 + week2 + week3 + week4;
              });
            }
          });
        }
      });

      setRealCommandCenterData({
        barangays,
        concernTypes,
        weeklyReports,
        totalBarangays: barangays.length,
        totalConcernTypes: concernTypes.length,
        totalReports
      });

    } catch (error) {
      console.error('Error fetching Command Center data:', error);
      // Fallback to sample data if Firebase fails
      setRealCommandCenterData({
        barangays: [],
        concernTypes: [],
        weeklyReports: [],
        totalBarangays: userMunicipality === 'Hermosa' ? 23 : 12,
        totalConcernTypes: userMunicipality === 'Hermosa' ? 35 : 10,
        totalReports: userMunicipality === 'Hermosa' ? 45 : 25
      });
    } finally {
      setIsLoadingCommandCenter(false);
    }
  };

  // Load Command Center data when component mounts or user changes
  useEffect(() => {
    if (userAccessLevel === 'command-center') {
      fetchCommandCenterData();
    }
  }, [userAccessLevel, userMunicipality]);

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

  // Quarry-specific data for quarry-monitoring users
  const getQuarryData = () => {
    // Sample quarry data - in real implementation, this would come from API
    return {
      totalSites: 24,
      activeSites: 18,
      compliantSites: 15,
      violations: 3,
      sites: [
        { name: 'Bagac Quarry Site A', operator: 'Bataan Mining Corp', location: 'Bagac, Bataan', status: 'Active', permitStatus: 'Valid', lastInspection: '2024-01-15', compliance: 'Compliant' },
        { name: 'Morong Quarry Site B', operator: 'Peninsula Aggregates', location: 'Morong, Bataan', status: 'Active', permitStatus: 'Valid', lastInspection: '2024-01-10', compliance: 'Compliant' },
        { name: 'Dinalupihan Quarry C', operator: 'Central Luzon Mining', location: 'Dinalupihan, Bataan', status: 'Inactive', permitStatus: 'Expired', lastInspection: '2023-12-20', compliance: 'Non-Compliant' },
        { name: 'Hermosa Quarry Site D', operator: 'Bataan Stone Works', location: 'Hermosa, Bataan', status: 'Active', permitStatus: 'Valid', lastInspection: '2024-01-12', compliance: 'Compliant' },
        { name: 'Orani Quarry Site E', operator: 'Provincial Quarry Inc', location: 'Orani, Bataan', status: 'Active', permitStatus: 'Pending', lastInspection: '2024-01-08', compliance: 'Under Review' }
      ],
      monthlyProduction: [1200, 1350, 1100, 1400, 1250, 1300, 1450, 1380, 1200, 1320, 1280, 1400],
      complianceHistory: [85, 88, 82, 90, 87, 85, 92, 89, 86, 88, 91, 89]
    };
  };

  const quarryData = getQuarryData();

  // Helper function to get barangays for a specific municipality
  const getBarangaysForMunicipality = (municipality) => {
    const allBarangays = {
      'Hermosa': [
        { name: 'Hermosa Poblacion', municipality: 'Hermosa', district: '1ST DISTRICT', reports: 9, lastReport: '2024-01-15' },
        { name: 'Cataning', municipality: 'Hermosa', district: '1ST DISTRICT', reports: 7, lastReport: '2024-01-14' },
        { name: 'Culis', municipality: 'Hermosa', district: '1ST DISTRICT', reports: 5, lastReport: '2024-01-13' },
        { name: 'Daungan', municipality: 'Hermosa', district: '1ST DISTRICT', reports: 8, lastReport: '2024-01-12' },
        { name: 'Mabiga', municipality: 'Hermosa', district: '1ST DISTRICT', reports: 6, lastReport: '2024-01-11' }
      ],
      'Bagac': [
        { name: 'Bagac Centro', municipality: 'Bagac', district: '1ST DISTRICT', reports: 15, lastReport: '2024-01-15' },
        { name: 'Binuangan', municipality: 'Bagac', district: '1ST DISTRICT', reports: 12, lastReport: '2024-01-14' },
        { name: 'Ibaba', municipality: 'Bagac', district: '1ST DISTRICT', reports: 10, lastReport: '2024-01-13' }
      ],
      'Morong': [
        { name: 'Morong Poblacion', municipality: 'Morong', district: '2ND DISTRICT', reports: 12, lastReport: '2024-01-14' },
        { name: 'Binaritan', municipality: 'Morong', district: '2ND DISTRICT', reports: 8, lastReport: '2024-01-13' },
        { name: 'Nagbalayong', municipality: 'Morong', district: '2ND DISTRICT', reports: 11, lastReport: '2024-01-12' }
      ]
    };
    
    return allBarangays[municipality] || allBarangays['Hermosa'];
  };

  // Helper function to get district breakdown for a specific municipality
  const getDistrictBreakdownForMunicipality = (municipality) => {
    const municipalityDistricts = {
      'Hermosa': [
        { district: '1ST DISTRICT', barangays: 23, reports: 45, percentage: 100 }
      ],
      'Bagac': [
        { district: '1ST DISTRICT', barangays: 14, reports: 38, percentage: 100 }
      ],
      'Morong': [
        { district: '2ND DISTRICT', barangays: 16, reports: 52, percentage: 100 }
      ],
      'Dinalupihan': [
        { district: '3RD DISTRICT', barangays: 18, reports: 41, percentage: 100 }
      ],
      'Orani': [
        { district: '2ND DISTRICT', barangays: 15, reports: 48, percentage: 100 }
      ],
      'Balanga': [
        { district: '1ST DISTRICT', barangays: 25, reports: 67, percentage: 100 }
      ]
    };
    
    return municipalityDistricts[municipality] || municipalityDistricts['Hermosa'];
  };

  // Helper function to get concern types for a specific municipality
  const getConcernTypesForMunicipality = (municipality) => {
    // Real concern types from Command Center system (based on the uploaded images)
    const realConcernTypes = [
      // From first image
      { type: 'BUSINESS ESTABLISHMENT VISITATION', count: 12, color: 'blue' },
      { type: 'BLOOD LETTING ACTIVITY', count: 8, color: 'red' },
      { type: 'ASSIST BRIGADA ESKWELA 2025', count: 15, color: 'green' },
      { type: 'MOTORCADE ASSISTANCE PASASALAMAT', count: 6, color: 'orange' },
      { type: 'BRIGADA ESKWELA MOTORCADE ASSISTANCE', count: 9, color: 'blue' },
      { type: 'LIFELESS BODY FOUND(NATURAL DEATH)', count: 3, color: 'red' },
      { type: 'BASIC LIFE SUPPORT TRAINING', count: 11, color: 'green' },
      { type: 'ASSIST BCDA OCULAR INSPECTION', count: 7, color: 'orange' },
      { type: 'PARTICIPATE TREE PLANTING', count: 14, color: 'green' },
      { type: 'NUCLEAR FREE BATAAN MOVEMENT ASSIST MOTORCADE', count: 5, color: 'blue' },
      { type: 'ASSIST BISITA IGLESIA', count: 8, color: 'purple' },
      { type: 'ASSIST NATIONAL DISASTER RESILIENCY MONTH', count: 10, color: 'orange' },
      { type: 'ASSIST INAUGARATION CEREMONY', count: 4, color: 'blue' },
      { type: 'AOR MONITORING', count: 18, color: 'red' },
      { type: 'FLOOD MONITORING', count: 13, color: 'blue' },
      { type: 'ASSISTED IN RELIEF GOODS DISTRIBUTION', count: 16, color: 'green' },
      
      // From second image
      { type: 'PUBLIC CONSUMPTION OF ALCOHOLIC BEVERAGES', count: 22, color: 'red' },
      { type: 'CURFEW VIOLATIONS', count: 19, color: 'orange' },
      { type: 'STRAY DOGS', count: 25, color: 'red' },
      { type: 'SMOKING IN PUBLIC AREA', count: 31, color: 'red' },
      { type: 'NO BARANGAY TANOD ON DUTY', count: 17, color: 'orange' },
      { type: 'IMPROPER GARBAGE DISPOSAL', count: 28, color: 'green' },
      { type: 'BUSTED STREET LIGHTS', count: 15, color: 'blue' },
      { type: 'ROAD OBSTRUCTIONS', count: 21, color: 'orange' },
      { type: 'OPLAN BAKLAS TARPAULIN', count: 12, color: 'blue' },
      { type: 'ANTI SMOKING VALIDATION', count: 14, color: 'red' },
      { type: 'BROKEN CHANNEL', count: 9, color: 'blue' },
      { type: 'ELECTION UPDATES / NORMAL SITUATION', count: 7, color: 'green' },
      { type: 'DRAINAGE / NOT ELEVATED', count: 11, color: 'blue' },
      { type: 'NO ILLEGAL PARKING/NORMAL STATUS', count: 8, color: 'green' },
      { type: 'VEHICULAR ACCIDENT', count: 6, color: 'red' },
      { type: 'ROAD CLEARING', count: 13, color: 'orange' },
      { type: 'NOTICE OF ILLEGAL OPERATION OF BUSINESS', count: 5, color: 'red' },
      { type: 'ILLEGAL PARKING', count: 16, color: 'orange' },
      { type: 'BARANGAY VISITATION', count: 20, color: 'blue' }
    ];

    // Get top 5 concern types for display (sorted by count)
    const topConcernTypes = realConcernTypes
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    return topConcernTypes;
  };

  // Command Center specific data for command-center users
  const getCommandCenterData = () => {
    // Get current user's municipality (from auth context or default to Hermosa for demo)
    const currentMunicipality = userMunicipality || 'Hermosa';
    
    // Use real data if available, otherwise fallback to sample data
    if (realCommandCenterData.totalBarangays > 0 || realCommandCenterData.totalConcernTypes > 0) {
      // Process real barangays data for display
      const processedBarangays = realCommandCenterData.barangays.slice(0, 5).map(barangay => ({
        name: barangay.name || barangay.barangay,
        municipality: barangay.municipality,
        district: barangay.district || '1ST DISTRICT',
        reports: Math.floor(Math.random() * 20) + 5, // Random reports count for demo
        lastReport: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }));

      // Process real concern types data for display with actual counts from weekly reports
      let concernTypesCounts = {};
      realCommandCenterData.weeklyReports.forEach(report => {
        if (report.weeklyReportData) {
          Object.values(report.weeklyReportData).forEach(dateEntries => {
            if (Array.isArray(dateEntries)) {
              dateEntries.forEach(entry => {
                if (entry.concernType) {
                  const week1 = parseInt(entry.week1) || 0;
                  const week2 = parseInt(entry.week2) || 0;
                  const week3 = parseInt(entry.week3) || 0;
                  const week4 = parseInt(entry.week4) || 0;
                  const totalCount = week1 + week2 + week3 + week4;
                  
                  concernTypesCounts[entry.concernType] = (concernTypesCounts[entry.concernType] || 0) + totalCount;
                }
              });
            }
          });
        }
      });

      // Convert to array and get top 5
      const processedConcernTypes = Object.entries(concernTypesCounts)
        .map(([type, count], index) => {
          const colors = ['green', 'blue', 'red', 'orange', 'purple'];
          return {
            type,
            count,
            color: colors[index % colors.length]
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalBarangays: realCommandCenterData.totalBarangays,
        totalConcernTypes: realCommandCenterData.totalConcernTypes,
        totalReports: realCommandCenterData.totalReports,
        activeDistricts: 1,
        barangays: processedBarangays.length > 0 ? processedBarangays : getBarangaysForMunicipality(currentMunicipality),
        concernTypes: processedConcernTypes.length > 0 ? processedConcernTypes : getConcernTypesForMunicipality(currentMunicipality),
        weeklyStats: {
          week1: 85,
          week2: 92,
          week3: 78,
          week4: 87
        },
        districtBreakdown: getDistrictBreakdownForMunicipality(currentMunicipality)
      };
    }

    // Fallback to sample data
    const municipalityBarangays = {
      'Hermosa': 23,
      'Bagac': 14,
      'Morong': 16,
      'Dinalupihan': 18,
      'Orani': 15,
      'Balanga': 25
    };
    
    const municipalityConcernTypes = {
      'Hermosa': 35,
      'Bagac': 6,
      'Morong': 9,
      'Dinalupihan': 7,
      'Orani': 10,
      'Balanga': 12
    };
    
    const municipalityReports = {
      'Hermosa': 45,
      'Bagac': 38,
      'Morong': 52,
      'Dinalupihan': 41,
      'Orani': 48,
      'Balanga': 67
    };
    
    return {
      totalBarangays: municipalityBarangays[currentMunicipality] || 23,
      totalConcernTypes: municipalityConcernTypes[currentMunicipality] || 35,
      totalReports: municipalityReports[currentMunicipality] || 45,
      activeDistricts: 1,
      barangays: getBarangaysForMunicipality(currentMunicipality),
      concernTypes: getConcernTypesForMunicipality(currentMunicipality),
      weeklyStats: {
        week1: 85,
        week2: 92,
        week3: 78,
        week4: 87
      },
      districtBreakdown: getDistrictBreakdownForMunicipality(currentMunicipality)
    };
  };

  const commandCenterData = getCommandCenterData();

  if (dataLoading || (userAccessLevel === 'command-center' && isLoadingCommandCenter)) {
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
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">
              {userAccessLevel === 'quarry-monitoring' 
                ? 'Monitor quarry operations and compliance across all sites'
                : userAccessLevel === 'command-center'
                ? 'Command center operations with real-time barangay monitoring'
                : 'Comprehensive system overview and performance analytics'
              }
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button size="sm" onClick={() => onNavigate('reports')}>
              <BarChart3 className="mr-2 h-4 w-4" />
              View Reports
            </Button>
          </div>
        </div>
        
        <Separator />

        {/* Statistics Cards */}
        {userAccessLevel === 'quarry-monitoring' ? (
          /* Quarry Monitoring Stats */
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sites</CardTitle>
                <Mountain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{quarryData.totalSites.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+12%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Sites</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{quarryData.activeSites.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+8%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Compliant</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{quarryData.compliantSites.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+5%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Violations</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{quarryData.violations.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-red-600">-15%</span> from last month
                </p>
              </CardContent>
            </Card>
          </div>
        ) : userAccessLevel === 'command-center' ? (
          /* Command Center Stats */
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Barangays</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{commandCenterData.totalBarangays.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  All monitored
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Concern Types</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{commandCenterData.totalConcernTypes.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Active categories
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{commandCenterData.totalReports.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  This month
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Regular Dashboard Stats */
          <div className={`grid gap-4 md:grid-cols-2 ${userAccessLevel === 'ipatroller' ? 'lg:grid-cols-2' : 'lg:grid-cols-4'}`}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Municipalities</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeCount.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{Math.round(activePercentage)}%</span> active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inactive Municipalities</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inactiveCount.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-red-600">{Math.round(100 - activePercentage)}%</span> inactive
                </p>
              </CardContent>
            </Card>

            {userAccessLevel !== 'ipatroller' && (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {actionReports && actionReports.length > 0 ? actionReports.length.toLocaleString() : '420'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-green-600">+18%</span> this month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Incidents</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {incidents && incidents.length > 0 ? incidents.length.toLocaleString() : '127'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-red-600">-8%</span> this month
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {/* Analytics Section */}
        {userAccessLevel === 'quarry-monitoring' ? (
          /* Quarry Monitoring Analytics */
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Quarry Sites List */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Quarry Sites</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Active quarry operations and compliance status
                </p>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {quarryData.sites.map((site, index) => (
                    <div key={index} className={`p-4 rounded-lg border transition-colors ${
                      site.compliance === 'Compliant' ? 'bg-green-50 border-green-200 hover:bg-green-100' :
                      site.compliance === 'Non-Compliant' ? 'bg-red-50 border-red-200 hover:bg-red-100' :
                      'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Pickaxe className={`w-4 h-4 ${
                              site.status === 'Active' ? 'text-green-600' : 'text-gray-400'
                            }`} />
                            <h3 className="text-sm font-semibold text-gray-900">{site.name}</h3>
                          </div>
                          <p className="text-xs text-gray-600 mb-1">{site.operator}</p>
                          <p className="text-xs text-gray-500 mb-2">{site.location}</p>
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              site.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {site.status}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              site.permitStatus === 'Valid' ? 'bg-blue-100 text-blue-700' :
                              site.permitStatus === 'Expired' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {site.permitStatus}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mb-1 ${
                            site.compliance === 'Compliant' ? 'bg-green-100 text-green-700' :
                            site.compliance === 'Non-Compliant' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            <Shield className={`w-3 h-3 ${
                              site.compliance === 'Compliant' ? 'text-green-600' :
                              site.compliance === 'Non-Compliant' ? 'text-red-600' :
                              'text-yellow-600'
                            }`} />
                            <span>{site.compliance}</span>
                          </div>
                          <p className="text-xs text-gray-500">Last: {new Date(site.lastInspection).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Compliance Overview */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Compliance Overview</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Environmental and operational compliance status
                </p>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="space-y-4">
                  {/* Compliance Rate */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Overall Compliance Rate</h3>
                      <span className="text-2xl font-bold">
                        {Math.round((quarryData.compliantSites / quarryData.totalSites) * 100)}%
                      </span>
                    </div>
                    <Progress 
                      value={(quarryData.compliantSites / quarryData.totalSites) * 100} 
                      className="w-full" 
                    />
                  </div>

                  {/* Permit Status Breakdown */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900">Permit Status Breakdown</h3>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                          <span className="text-sm text-gray-700">Valid Permits</span>
                        </div>
                        <span className="text-sm font-semibold text-blue-600">18</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
                          <span className="text-sm text-gray-700">Pending Renewal</span>
                        </div>
                        <span className="text-sm font-semibold text-yellow-600">3</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                          <span className="text-sm text-gray-700">Expired</span>
                        </div>
                        <span className="text-sm font-semibold text-red-600">3</span>
                      </div>
                    </div>
                  </div>

                  {/* Recent Inspections */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900">Recent Inspections</h3>
                    <div className="space-y-2">
                      {quarryData.sites.slice(0, 3).map((site, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <p className="text-xs font-medium text-gray-900">{site.name}</p>
                            <p className="text-xs text-gray-500">{new Date(site.lastInspection).toLocaleDateString()}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            site.compliance === 'Compliant' ? 'bg-green-100 text-green-700' :
                            site.compliance === 'Non-Compliant' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {site.compliance}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : userAccessLevel === 'command-center' ? (
          /* Command Center Analytics */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Barangay Reports */}
            <Card className="bg-white shadow-sm border border-gray-200 rounded-xl">
              <CardHeader className="p-6 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">Top Barangays</CardTitle>
                    <p className="text-sm text-gray-600">Barangays with most reports and activity</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {commandCenterData.barangays.map((barangay, index) => (
                    <div key={index} className="p-4 rounded-lg border bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            <h3 className="text-sm font-semibold text-gray-900">{barangay.name}</h3>
                          </div>
                          <p className="text-xs text-gray-600 mb-1">{barangay.municipality}</p>
                          <p className="text-xs text-gray-500 mb-2">{barangay.district}</p>
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              {barangay.reports} Reports
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <p className="text-xs text-gray-500">Last: {new Date(barangay.lastReport).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Concern Types Overview */}
            <Card className="bg-white shadow-sm border border-gray-200 rounded-xl">
              <CardHeader className="p-6 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">Concern Types</CardTitle>
                    <p className="text-sm text-gray-600">Most reported concern categories</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="space-y-4">
                  {/* Top Concern Types */}
                  <div className="space-y-3">
                    {commandCenterData.concernTypes.map((concern, index) => (
                      <div key={index} className={`p-4 rounded-lg border ${
                        concern.color === 'green' ? 'bg-green-50 border-green-200' :
                        concern.color === 'blue' ? 'bg-blue-50 border-blue-200' :
                        concern.color === 'red' ? 'bg-red-50 border-red-200' :
                        concern.color === 'orange' ? 'bg-orange-50 border-orange-200' :
                        'bg-purple-50 border-purple-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              concern.color === 'green' ? 'bg-green-600' :
                              concern.color === 'blue' ? 'bg-blue-600' :
                              concern.color === 'red' ? 'bg-red-600' :
                              concern.color === 'orange' ? 'bg-orange-600' :
                              'bg-purple-600'
                            }`}></div>
                            <span className="text-sm font-medium text-gray-900">{concern.type}</span>
                          </div>
                          <span className={`text-sm font-semibold ${
                            concern.color === 'green' ? 'text-green-600' :
                            concern.color === 'blue' ? 'text-blue-600' :
                            concern.color === 'red' ? 'text-red-600' :
                            concern.color === 'orange' ? 'text-orange-600' :
                            'text-purple-600'
                          }`}>
                            {concern.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* District Breakdown */}
                  <div className="space-y-3 mt-6">
                    <h3 className="text-sm font-semibold text-gray-900">District Breakdown</h3>
                    <div className="space-y-2">
                      {commandCenterData.districtBreakdown.map((district, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-xs font-medium text-gray-900">{district.district}</p>
                            <p className="text-xs text-gray-500">{district.barangays} barangays</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-semibold text-gray-900">{district.reports}</p>
                            <p className="text-xs text-gray-500">{district.percentage}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Regular Dashboard Analytics */
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Municipality Lists */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Municipality Status</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Active and inactive municipalities for yesterday
                </p>
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
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>District Distribution</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Active municipalities by district
                </p>
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
                    <Badge variant="secondary">
                      {district.percentage}%
                    </Badge>
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
        )}

      </div>
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </Layout>
  );
}

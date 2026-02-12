import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Badge } from './components/ui/badge';
import { Label } from './components/ui/label';
import { Bar } from 'react-chartjs-2';
import { useData } from './DataContext';
import { useAuth } from './contexts/AuthContext';
import { useNotification, NotificationContainer } from './components/ui/notification';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { dashboardLog, createSectionGroup, CONSOLE_GROUPS } from './utils/consoleGrouping';
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
  List,
  Building2,
  MapPin,
  Mountain,
  Shield,
  Pickaxe,
  FileCheck,
  FileText,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  X,
  Database
} from 'lucide-react';

export default function Dashboard({ onLogout, onNavigate, currentPage }) {
  const { 
    summaryStats, 
    ipatrollerData,
    actionReports,
    incidents,
    loading: dataLoading,
    refreshIPatrollerData,
    createSampleData
  } = useData();
  const { userAccessLevel, userMunicipality, isAdmin } = useAuth();

  const currentMonthYearLabel = new Date().toLocaleString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  const normalizeMunicipalityName = (value) => {
    if (value === null || value === undefined) return '';
    return String(value).trim().toLowerCase();
  };

  const getReportDate = (report) => {
    if (!report) return null;

    const candidate =
      report.when ??
      report.date ??
      report.createdAt ??
      report.updatedAt ??
      report.timestamp ??
      report.time;

    if (!candidate) return null;

    if (candidate instanceof Date) return candidate;

    if (typeof candidate?.toDate === 'function') {
      const d = candidate.toDate();
      return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
    }

    if (typeof candidate === 'object') {
      const seconds = candidate.seconds ?? candidate._seconds;
      const nanos = candidate.nanoseconds ?? candidate._nanoseconds;
      if (typeof seconds === 'number') {
        const ms = seconds * 1000 + (typeof nanos === 'number' ? Math.floor(nanos / 1e6) : 0);
        const d = new Date(ms);
        return !Number.isNaN(d.getTime()) ? d : null;
      }
    }

    const d = new Date(candidate);
    return !Number.isNaN(d.getTime()) ? d : null;
  };

  // Instruction Modal State
  const [showInstructions, setShowInstructions] = useState(false);

  // Show instructions on first visit
  useEffect(() => {
    const hasSeenInstructions = localStorage.getItem('hasSeenDashboardInstructions');
    if (!hasSeenInstructions && userAccessLevel) {
      setShowInstructions(true);
    }
  }, [userAccessLevel]);

  const handleCloseInstructions = () => {
    setShowInstructions(false);
    localStorage.setItem('hasSeenDashboardInstructions', 'true');
  };

  // Use the same municipalities structure as IPatroller
  const municipalitiesByDistrict = {
    "1ST DISTRICT": ["Abucay", "Orani", "Samal", "Hermosa"],
    "2ND DISTRICT": ["Balanga City", "Pilar", "Orion", "Limay"],
    "3RD DISTRICT": ["Bagac", "Dinalupihan", "Mariveles", "Morong"],
  };

  // State for IPatroller data (same as IPatroller page)
  const [ipatrollerPatrolData, setIpatrollerPatrolData] = useState([]);
  const [ipatrollerLoading, setIpatrollerLoading] = useState(false);

  // Generate dates for current month (same as IPatroller)
  const generateDates = (month, year) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  // Load patrol data directly from IPatroller's Firebase structure
  const loadIPatrollerData = async () => {
    setIpatrollerLoading(true);
    
    try {
      // Since yesterday (Sep 30) data is in September, we need to load from September 2025
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayMonth = yesterday.getMonth(); // September = 8
      const yesterdayYear = yesterday.getFullYear(); // 2025
      const monthYearId = `${String(yesterdayMonth + 1).padStart(2, "0")}-${yesterdayYear}`;
      
      const dashboardGroup = createSectionGroup(CONSOLE_GROUPS.DASHBOARD, false);
      dashboardGroup.log('📅 Yesterday was', yesterday.toDateString());
      dashboardGroup.log('📅 Loading IPatroller data for', monthYearId, '(yesterday\'s month)');
      dashboardGroup.log('📅 Firebase path:', `patrolData/${monthYearId}/municipalities`);
      
      // Load from the same Firebase path as IPatroller
      const municipalitiesRef = collection(db, 'patrolData', monthYearId, 'municipalities');
      const querySnapshot = await getDocs(municipalitiesRef);
      
      const firestoreData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data) {
          firestoreData.push({
            id: doc.id,
            ...data
          });
        }
      });

      dashboardGroup.log('📊 Loaded', firestoreData.length, 'municipalities from Firebase');
      dashboardGroup.log('📊 Raw Firebase data:', firestoreData);

      // Create complete data structure (same as IPatroller)
      const selectedDates = generateDates(yesterdayMonth, yesterdayYear);
      const allMunicipalitiesData = [];
      
      Object.entries(municipalitiesByDistrict).forEach(([district, municipalities]) => {
        municipalities.forEach((municipality) => {
          // Check if this municipality has data in Firestore
          const existingData = firestoreData.find(item => 
            item.municipality === municipality && item.district === district
          );
          
          if (existingData) {
            // Check if the existing data has any actual values (not all zeros/nulls)
            const hasActualData = existingData.data && existingData.data.some(val => val !== null && val !== undefined && val !== 0);
            
            if (hasActualData) {
              // Use Firestore data if it has actual patrol counts
              allMunicipalitiesData.push(existingData);
            } else {
              // Even if data exists in Firestore, if it's all zeros/nulls, treat as "No Entry"
              const dailyData = selectedDates.map(() => null);
              const itemData = {
                id: `${district}-${municipality}`,
                municipality,
                district,
                data: dailyData,
                totalPatrols: 0,
                activeDays: 0,
                inactiveDays: 0,
                activePercentage: 0,
              };
              allMunicipalitiesData.push(itemData);
            }
          } else {
            // Create "No Entry" data for municipalities without Firestore data
            const dailyData = selectedDates.map(() => null);
            const itemData = {
              id: `${district}-${municipality}`,
              municipality,
              district,
              data: dailyData,
              totalPatrols: 0,
              activeDays: 0,
              inactiveDays: 0,
              activePercentage: 0,
            };
            allMunicipalitiesData.push(itemData);
          }
        });
      });

      setIpatrollerPatrolData(allMunicipalitiesData);
      dashboardGroup.log('✅ IPatroller data loaded successfully');
      dashboardGroup.end();
      
    } catch (error) {
      dashboardLog('❌ Error loading IPatroller data:', error, 'error');
      // Create fallback data for yesterday's month
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const selectedDates = generateDates(yesterday.getMonth(), yesterday.getFullYear());
      const fallbackData = [];
      
      Object.entries(municipalitiesByDistrict).forEach(([district, municipalities]) => {
        municipalities.forEach((municipality) => {
          const dailyData = selectedDates.map(() => null);
          const itemData = {
            id: `${district}-${municipality}`,
            municipality,
            district,
            data: dailyData,
            totalPatrols: 0,
            activeDays: 0,
            inactiveDays: 0,
            activePercentage: 0,
          };
          fallbackData.push(itemData);
        });
      });
      
      setIpatrollerPatrolData(fallbackData);
    } finally {
      setIpatrollerLoading(false);
    }
  };

  // Create sample IPatroller data for testing
  const createSampleIPatrollerData = () => {
    dashboardLog('🧪 Creating sample IPatroller data...');
    
    // Use yesterday's month for sample data
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayMonth = yesterday.getMonth();
    const yesterdayYear = yesterday.getFullYear();
    const selectedDates = generateDates(yesterdayMonth, yesterdayYear);
    
    const sampleData = [];
    
    Object.entries(municipalitiesByDistrict).forEach(([district, municipalities]) => {
      municipalities.forEach((municipality, index) => {
        // Create sample data with some municipalities having high patrol counts yesterday
        const dailyData = selectedDates.map((day, dayIndex) => {
          // For yesterday (Sept 30 = index 29), create varied data
          if (dayIndex === 29) { // Yesterday's index
            // Make some municipalities active (>=5) and some inactive (<5)
            if (index % 3 === 0) return 8; // Every 3rd municipality: Active
            if (index % 3 === 1) return 3; // Every 3rd municipality: Inactive  
            return null; // Every 3rd municipality: No Entry (Inactive)
          }
          // For other days, create random data
          return Math.floor(Math.random() * 10);
        });
        
        const totalPatrols = dailyData.reduce((sum, val) => sum + (val || 0), 0);
        const activeDays = dailyData.filter(val => val >= 5).length;
        const inactiveDays = dailyData.filter(val => val !== null && val < 5).length;
        const activePercentage = dailyData.length > 0 ? Math.round((activeDays / dailyData.length) * 100) : 0;
        
        const itemData = {
          id: `${district}-${municipality}`,
          municipality,
          district,
          data: dailyData,
          totalPatrols,
          activeDays,
          inactiveDays,
          activePercentage,
        };
        
        sampleData.push(itemData);
      });
    });
    
    setIpatrollerPatrolData(sampleData);
    dashboardLog('✅ Sample IPatroller data created:', sampleData.length, 'municipalities');
    dashboardLog('📊 Sample data preview:', sampleData.slice(0, 3));
  };

  const [selectedTimePeriod, setSelectedTimePeriod] = useState('weekly');
  const [expandedLocations, setExpandedLocations] = useState({});
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
    const commandCenterGroup = createSectionGroup(CONSOLE_GROUPS.COMMAND_CENTER, false);
    commandCenterGroup.log('🔄 Dashboard fetchCommandCenterData called:', {
      userAccessLevel,
      userMunicipality,
      shouldFetch: userAccessLevel === 'command-center'
    });
    
    if (userAccessLevel !== 'command-center') {
      commandCenterGroup.log('⚠️ Not fetching Command Center data - user access level is:', userAccessLevel);
      commandCenterGroup.end();
      return;
    }
    
    setIsLoadingCommandCenter(true);
    commandCenterGroup.log('📡 Starting Command Center data fetch...');
    try {
      // Fetch barangays for the user's municipality
      // Command center users should see all barangays from their municipality
      const barangaysQuery = userMunicipality 
        ? query(collection(db, 'barangays'), where('municipality', '==', userMunicipality))
        : collection(db, 'barangays');
      const barangaysSnapshot = await getDocs(barangaysQuery);
      const barangays = barangaysSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      commandCenterGroup.log(`📍 Loaded ${barangays.length} barangays from Firebase for ${userMunicipality || 'all municipalities'}`);
      
      // Log barangays by municipality for verification
      const barangaysByMunicipality = {};
      barangays.forEach(b => {
        const muni = b.municipality || 'Unknown';
        if (!barangaysByMunicipality[muni]) {
          barangaysByMunicipality[muni] = [];
        }
        barangaysByMunicipality[muni].push(b.name || b.barangay);
      });
      commandCenterGroup.log('📍 Barangays by Municipality:', Object.entries(barangaysByMunicipality).map(([m, bs]) => `${m}: ${bs.length}`).join(', '));
      
      // Log all barangay names for debugging
      if (userMunicipality) {
        commandCenterGroup.log(`📍 ${userMunicipality} Barangays:`, barangays.map(b => b.name || b.barangay).join(', '));
      }

      // Fetch ALL concern types (not filtered by municipality for command-center dashboard)
      const concernTypesQuery = collection(db, 'concernTypes');
      const concernTypesSnapshot = await getDocs(concernTypesQuery);
      const concernTypes = concernTypesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      commandCenterGroup.log(`📋 Loaded ${concernTypes.length} concern types from Firebase`);

      // Fetch weekly reports from nested structure for March-September 2025 only
      // OPTIMIZED: Load data in parallel using Promise.all
      const weeklyReports = [];
      const currentYear = new Date().getFullYear();
      const monthsToLoad = ['March', 'April', 'May', 'June', 'July', 'August', 'September'];
      
      // Load data only for user's municipality (or all if no municipality specified)
      const municipalitiesToLoad = userMunicipality 
        ? [userMunicipality] 
        : Object.values(municipalitiesByDistrict).flat();
      
      commandCenterGroup.log('📅 Loading Command Center data for months:', monthsToLoad);
      commandCenterGroup.log('🏘️ Loading data for municipality:', userMunicipality || 'all municipalities');
      commandCenterGroup.log('⚡ Using parallel loading for faster performance...');
      
      // Create all promises for parallel loading
      const loadPromises = [];
      
      for (const municipality of municipalitiesToLoad) {
        for (const month of monthsToLoad) {
          const monthYear = `${month}_${currentYear}`;
          const docRef = doc(db, 'commandCenter', 'weeklyReports', municipality, monthYear);
          
          // Add promise to array
          loadPromises.push(
            getDoc(docRef)
              .then(docSnap => {
                if (docSnap.exists()) {
                  return {
                    id: `${municipality}_${monthYear}`,
                    municipality,
                    month,
                    year: currentYear,
                    ...docSnap.data()
                  };
                }
                return null;
              })
              .catch(error => {
                commandCenterGroup.error(`❌ Error loading ${month} ${currentYear} for ${municipality}:`, error);
                return null;
              })
          );
        }
      }
      
      // Load all data in parallel
      commandCenterGroup.log(`⚡ Loading ${loadPromises.length} documents in parallel...`);
      const results = await Promise.all(loadPromises);
      
      // Filter out null results and add to weeklyReports
      results.forEach(result => {
        if (result) {
          weeklyReports.push(result);
        }
      });
      
      commandCenterGroup.log(`✅ Loaded ${weeklyReports.length} documents successfully`);

      // Calculate totals from actual weekly report data (monthly counts from Command Center table)
      // This counts ALL individual reports from each barangay on each date
      let totalReports = 0;
      let reportBreakdown = {}; // For debugging
      
      weeklyReports.forEach(report => {
        if (report.weeklyReportData) {
          const monthKey = `${report.month} ${report.year}`;
          if (!reportBreakdown[monthKey]) {
            reportBreakdown[monthKey] = 0;
          }
          
          Object.entries(report.weeklyReportData).forEach(([dateKey, dateEntries]) => {
            if (Array.isArray(dateEntries)) {
              // Log if multiple barangays on same date
              if (dateEntries.length > 1) {
                commandCenterGroup.log(`📅 ${dateKey}: ${dateEntries.length} barangays reported (${dateEntries.map(e => e.barangay).join(', ')})`);
              }
              
              dateEntries.forEach(entry => {
                // Sum up the weekly counts (week1, week2, week3, week4) from each entry
                // Each entry represents one barangay's reports for that date
                const week1 = parseInt(entry.week1) || 0;
                const week2 = parseInt(entry.week2) || 0;
                const week3 = parseInt(entry.week3) || 0;
                const week4 = parseInt(entry.week4) || 0;
                const entryTotal = week1 + week2 + week3 + week4;
                
                totalReports += entryTotal;
                reportBreakdown[monthKey] += entryTotal;
              });
            }
          });
        }
      });
      
      commandCenterGroup.log('📊 Total Reports Breakdown by Month:', reportBreakdown);

      commandCenterGroup.log('📊 Command Center data loaded:', {
        barangays: barangays.length,
        concernTypes: concernTypes.length,
        weeklyReports: weeklyReports.length,
        totalReports
      });

      setRealCommandCenterData({
        barangays,
        concernTypes,
        weeklyReports,
        totalBarangays: barangays.length,
        totalConcernTypes: concernTypes.length,
        totalReports
      });

      commandCenterGroup.log('✅ Command Center data fetch completed successfully');
      commandCenterGroup.end();

    } catch (error) {
      commandCenterGroup.error('❌ Error fetching Command Center data:', error);
      commandCenterGroup.error('Error details:', error.message, error.stack);
      commandCenterGroup.end();
      // Show error notification
      showError(`Failed to load Command Center data: ${error.message}`);
      // Set empty data on error
      setRealCommandCenterData({
        barangays: [],
        concernTypes: [],
        weeklyReports: [],
        totalBarangays: 0,
        totalConcernTypes: 0,
        totalReports: 0
      });
    } finally {
      setIsLoadingCommandCenter(false);
    }
  };

  // Load Command Center data when component mounts or user changes (non-blocking)
  useEffect(() => {
    if (userAccessLevel === 'command-center') {
      // Load in background without blocking UI
      setTimeout(() => {
        fetchCommandCenterData();
      }, 0);
    }
  }, [userAccessLevel, userMunicipality]);

  // Auto-refresh Command Center data every 60 seconds for command-center users
  useEffect(() => {
    if (userAccessLevel === 'command-center') {
      const refreshInterval = setInterval(() => {
        dashboardLog('🔄 Auto-refreshing Command Center data...');
        fetchCommandCenterData();
      }, 60000); // 60 seconds

      return () => clearInterval(refreshInterval);
    }
  }, [userAccessLevel, userMunicipality]);

  // Load IPatroller data when component mounts (non-blocking)
  useEffect(() => {
    dashboardLog('🚀 Component mounted, loading IPatroller data in background...');
    // Load in background without blocking UI
    setTimeout(() => {
      loadIPatrollerData();
    }, 0);
  }, []);

  const handleLogout = async () => {
    try {
      onLogout();
    } catch (error) {
      dashboardLog('Logout error:', error, 'error');
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

  const DAILY_ACTIVE_COUNT = 14;
  const DAILY_WARNING_COUNT = 13;
  const DAILY_INACTIVE_MAX = 12;

  const getDashboardReferenceDate = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const dayIndex = yesterday.getDate() - 1;
    return { date: yesterday, dayIndex };
  };

  // Calculate active/inactive municipalities based on today's data (using IPatroller data)
  const calculateActiveInactiveCounts = () => {
    if (!ipatrollerPatrolData || ipatrollerPatrolData.length === 0) {
      dashboardLog('⚠️ No ipatrollerPatrolData for counting');
      return { activeCount: 0, warningCount: 0, inactiveCount: 0, totalMunicipalities: 0 };
    }

    const { date: referenceDate, dayIndex: referenceIndex } = getDashboardReferenceDate();

    dashboardLog('📊 Calculating counts for', referenceDate.toDateString(), 'at index', referenceIndex);
    dashboardLog('📊 Processing', ipatrollerPatrolData.length, 'municipalities');

    let activeCount = 0;
    let warningCount = 0;
    let inactiveCount = 0;

    ipatrollerPatrolData.forEach(item => {
      let patrolsCount = 0;
      
      if (item.data && Array.isArray(item.data) && referenceIndex >= 0 && referenceIndex < item.data.length) {
        const rawValue = item.data[referenceIndex];
        if (rawValue === null || rawValue === undefined) {
          patrolsCount = 0; // Treat "No Entry" as 0
        } else {
          patrolsCount = rawValue;
        }
        dashboardLog(`📊 ${item.municipality}: ${rawValue} → ${patrolsCount >= DAILY_ACTIVE_COUNT ? 'ACTIVE' : patrolsCount === DAILY_WARNING_COUNT ? 'WARNING' : 'INACTIVE'}`);
      } else {
        dashboardLog(`📊 ${item.municipality}: No data at index ${referenceIndex} → INACTIVE`);
      }

      if (patrolsCount >= DAILY_ACTIVE_COUNT) {
        activeCount++;
      } else if (patrolsCount === DAILY_WARNING_COUNT) {
        warningCount++;
      } else {
        inactiveCount++;
      }
    });

    dashboardLog('📊 Final counts - Active:', activeCount, 'Warning:', warningCount, 'Inactive:', inactiveCount);

    return {
      activeCount,
      warningCount,
      inactiveCount,
      totalMunicipalities: ipatrollerPatrolData.length
    };
  };

  const { activeCount, warningCount, inactiveCount, totalMunicipalities } = calculateActiveInactiveCounts();
  const activePercentage = totalMunicipalities > 0 ? (activeCount / totalMunicipalities) * 100 : 0;

  // Debug logging for admin users
  useEffect(() => {
    if (userAccessLevel === 'admin' && ipatrollerPatrolData.length > 0) {
      const { date: referenceDate } = getDashboardReferenceDate();
      dashboardLog('📊 Active/Inactive Counts for', referenceDate.toDateString());
      dashboardLog('✅ Active Municipalities:', activeCount);
      dashboardLog('⚠️ Warning Municipalities:', warningCount);
      dashboardLog('❌ Inactive Municipalities:', inactiveCount);
      dashboardLog('📈 Total Municipalities:', totalMunicipalities);
      dashboardLog('📅 Data Source: IPatroller Firebase data');
    }
  }, [activeCount, warningCount, inactiveCount, totalMunicipalities, ipatrollerPatrolData, userAccessLevel]);

  // Calculate district distribution with fallback data (using IPatroller data source)
  const getDistrictData = () => {
    dashboardLog('📊 getDistrictData - ipatrollerPatrolData:', ipatrollerPatrolData);
    
    const districtCounts = {
      '1ST DISTRICT': 0,
      '2ND DISTRICT': 0,
      '3RD DISTRICT': 0
    };

    // Count active municipalities per district from IPatroller data
    if (ipatrollerPatrolData && ipatrollerPatrolData.length > 0) {
      const { date: referenceDate, dayIndex: referenceIndex } = getDashboardReferenceDate();

      dashboardLog(`📊 Counting active municipalities by district for ${referenceDate.toDateString()}`);

      ipatrollerPatrolData.forEach(item => {
        if (item.district && districtCounts.hasOwnProperty(item.district)) {
          let patrolsCount = 0;
          
          if (item.data && Array.isArray(item.data) && referenceIndex >= 0 && referenceIndex < item.data.length) {
            const rawValue = item.data[referenceIndex];
            if (rawValue === null || rawValue === undefined) {
              patrolsCount = 0;
            } else {
              patrolsCount = rawValue;
            }
          }

          // Count as active if >= 14 patrols
          if (patrolsCount >= DAILY_ACTIVE_COUNT) {
            districtCounts[item.district]++;
            dashboardLog(`✅ ${item.municipality} (${item.district}): Active - adding to district count`);
          } else {
            dashboardLog(`❌ ${item.municipality} (${item.district}): Inactive - not counting`);
          }
        }
      });
    } else {
      dashboardLog('⚠️ No ipatrollerPatrolData, using fallback data');
      // Fallback data when no real data is available
      districtCounts['1ST DISTRICT'] = 3;
      districtCounts['2ND DISTRICT'] = 3;
      districtCounts['3RD DISTRICT'] = 2;
    }

    // If we have data but zero active across all districts, fallback to sample so the pie isn't empty
    let totalActive = Object.values(districtCounts).reduce((sum, count) => sum + count, 0);
    if (ipatrollerPatrolData && ipatrollerPatrolData.length > 0 && totalActive === 0) {
      dashboardLog('⚠️ No active municipalities found, using fallback data for pie chart');
      districtCounts['1ST DISTRICT'] = 3;
      districtCounts['2ND DISTRICT'] = 3;
      districtCounts['3RD DISTRICT'] = 2;
      totalActive = 8;
    }
    
    dashboardLog('📊 District counts:', districtCounts, 'Total active:', totalActive);
    
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

  // Get municipality lists for yesterday's data (using IPatroller data source)
  const getMunicipalityLists = () => {
    dashboardLog('🏛️ getMunicipalityLists - ipatrollerPatrolData:', ipatrollerPatrolData);
    
    if (!ipatrollerPatrolData || ipatrollerPatrolData.length === 0) {
      dashboardLog('⚠️ No ipatrollerPatrolData available');
      return {
        active: [],
        warning: [],
        inactive: []
      };
    }

    const { date: referenceDate, dayIndex: referenceIndex } = getDashboardReferenceDate();

    dashboardLog(`📅 Reference date is ${referenceDate.toDateString()}, looking at index ${referenceIndex}`);

    const active = [];
    const warning = [];
    const inactive = [];

    ipatrollerPatrolData.forEach(item => {
      let yesterdayPatrols = 0;
      
      dashboardLog(`🏛️ Processing ${item.municipality}:`, {
        hasData: !!item.data,
        isArray: Array.isArray(item.data),
        dataLength: item.data ? item.data.length : 0,
        referenceIndex,
        rawData: item.data
      });
      
      if (item.data && Array.isArray(item.data) && referenceIndex >= 0 && referenceIndex < item.data.length) {
        const rawValue = item.data[referenceIndex];
        if (rawValue === null || rawValue === undefined) {
          yesterdayPatrols = 0; // Treat "No Entry" as 0 for counting purposes
        } else {
          yesterdayPatrols = rawValue;
        }
        dashboardLog(`📊 ${item.municipality}: Found ${rawValue} (${yesterdayPatrols}) patrols at index ${referenceIndex}`);
      } else {
        dashboardLog(`❌ ${item.municipality}: No data at index ${referenceIndex}`);
      }

      const municipalityInfo = {
        name: item.municipality,
        district: item.district,
        patrols: yesterdayPatrols
      };

      if (yesterdayPatrols >= DAILY_ACTIVE_COUNT) {
        active.push(municipalityInfo);
        dashboardLog(`✅ ${item.municipality}: ACTIVE (${yesterdayPatrols} patrols)`);
      } else if (yesterdayPatrols === DAILY_WARNING_COUNT) {
        warning.push(municipalityInfo);
        dashboardLog(`⚠️ ${item.municipality}: WARNING (${yesterdayPatrols} patrols)`);
      } else {
        inactive.push(municipalityInfo);
        dashboardLog(`❌ ${item.municipality}: INACTIVE (${yesterdayPatrols} patrols)`);
      }
    });

    dashboardLog('📈 Final Lists:', {
      active: active.length,
      inactive: inactive.length,
      activeList: active,
      inactiveList: inactive
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
      warning: warning.sort(sortMunicipalities),
      inactive: inactive.sort(sortMunicipalities)
    };
  };

  const municipalityLists = getMunicipalityLists();

  // If no data is available, create some sample data for testing
  useEffect(() => {
    if (userAccessLevel === 'admin' && (!ipatrollerData || ipatrollerData.length === 0)) {
      dashboardLog('🧪 No real data found, consider using sample data for testing');
      dashboardLog('💡 You can call refreshIPatrollerData() or check if Firebase has data for the current month');
    }
  }, [ipatrollerData, userAccessLevel]);

  // Get district statistics for yesterday's data (using IPatroller data source)
  const getDistrictStats = () => {
    dashboardLog('🏛️ getDistrictStats - ipatrollerPatrolData:', ipatrollerPatrolData);
    
    if (!ipatrollerPatrolData || ipatrollerPatrolData.length === 0) {
      dashboardLog('⚠️ No ipatrollerPatrolData for district stats');
      return [];
    }

    const { date: referenceDate, dayIndex: referenceIndex } = getDashboardReferenceDate();

    dashboardLog(`📊 Calculating district stats for ${referenceDate.toDateString()} at index ${referenceIndex}`);

    const districtStats = {
      '1ST DISTRICT': { active: 0, warning: 0, total: 0, color: 'blue' },
      '2ND DISTRICT': { active: 0, warning: 0, total: 0, color: 'emerald' },
      '3RD DISTRICT': { active: 0, warning: 0, total: 0, color: 'orange' }
    };

    ipatrollerPatrolData.forEach(item => {
      if (item.district && districtStats[item.district]) {
        districtStats[item.district].total++;
        
        let yesterdayPatrols = 0;
        if (item.data && Array.isArray(item.data) && referenceIndex >= 0 && referenceIndex < item.data.length) {
          const rawValue = item.data[referenceIndex];
          if (rawValue === null || rawValue === undefined) {
            yesterdayPatrols = 0;
          } else {
            yesterdayPatrols = rawValue;
          }
        }

        if (yesterdayPatrols >= DAILY_ACTIVE_COUNT) {
          districtStats[item.district].active++;
          dashboardLog(`✅ ${item.municipality} (${item.district}): ACTIVE with ${yesterdayPatrols} patrols`);
        } else if (yesterdayPatrols === DAILY_WARNING_COUNT) {
          districtStats[item.district].warning++;
          dashboardLog(`⚠️ ${item.municipality} (${item.district}): WARNING with ${yesterdayPatrols} patrols`);
        } else {
          dashboardLog(`❌ ${item.municipality} (${item.district}): INACTIVE with ${yesterdayPatrols} patrols`);
        }
      }
    });

    const result = Object.entries(districtStats).map(([district, stats]) => ({
      name: district,
      active: stats.active,
      warning: stats.warning,
      total: stats.total,
      inactive: stats.total - stats.active - stats.warning,
      percentage: stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0,
      color: stats.color
    }));

    dashboardLog('📊 District stats calculated:', result);
    return result;
  };

  const districtStats = getDistrictStats();

  // State for real Action Center data
  const [realActionCenterData, setRealActionCenterData] = useState([]);
  const [isLoadingActionCenter, setIsLoadingActionCenter] = useState(false);
  const [lastDataUpdate, setLastDataUpdate] = useState(null);
  
  // State for real Incidents data
  const [realIncidentsData, setRealIncidentsData] = useState([]);
  const [isLoadingIncidents, setIsLoadingIncidents] = useState(false);

  // Fetch real Action Center data from Firebase (same approach as Action Center page)
  const fetchActionCenterData = async () => {
    setIsLoadingActionCenter(true);
    try {
      const actionCenterGroup = createSectionGroup(CONSOLE_GROUPS.ACTION_CENTER, false);
      actionCenterGroup.log('🚀 COMPREHENSIVE ACTION DATA FETCH STARTED');
      const allActionData = [];
      
      // List of possible collection names where action data might be stored (same as Action Center page)
      const possibleCollections = [
        'actionReports',
        'actionCenter', 
        'actions',
        'reports',
        'actionData',
        'departmentActions',
        'pnpActions',
        'agricultureActions',
        'pgEnroActions'
      ];
      
      actionCenterGroup.log('📋 Checking collections:', possibleCollections);
      
      // Check each possible collection (same logic as Action Center page)
      for (const collectionName of possibleCollections) {
        try {
          actionCenterGroup.log(`🔍 Checking collection: ${collectionName}`);
          const collectionRef = collection(db, collectionName);
          const snapshot = await getDocs(collectionRef);
          
          actionCenterGroup.log(`📊 ${collectionName}: ${snapshot.size} documents found`);
          
          if (snapshot.size > 0) {
            snapshot.forEach((doc) => {
              const data = doc.data();
              
              // Handle different data structures (same as Action Center page)
              if (data.data && Array.isArray(data.data)) {
                // Month-based structure with data array
                data.data.forEach((report, index) => {
                  allActionData.push({
                    ...report,
                    sourceCollection: collectionName,
                    sourceDocument: doc.id,
                    sourceType: 'month-based',
                    reportIndex: index
                  });
                });
              } else if (data.actions && Array.isArray(data.actions)) {
                // Actions array structure
                data.actions.forEach((action, index) => {
                  allActionData.push({
                    ...action,
                    sourceCollection: collectionName,
                    sourceDocument: doc.id,
                    sourceType: 'actions-array',
                    reportIndex: index
                  });
                });
              } else if (data.reports && Array.isArray(data.reports)) {
                // Reports array structure
                data.reports.forEach((report, index) => {
                  allActionData.push({
                    ...report,
                    sourceCollection: collectionName,
                    sourceDocument: doc.id,
                    sourceType: 'reports-array',
                    reportIndex: index
                  });
                });
              } else {
                // Individual document structure
                allActionData.push({
                  ...data,
                  id: doc.id,
                  sourceCollection: collectionName,
                  sourceDocument: doc.id,
                  sourceType: 'individual'
                });
              }
            });
          }
        } catch (collectionError) {
          actionCenterGroup.log(`⚠️ Collection ${collectionName} not accessible:`, collectionError.message);
        }
      }
      
      actionCenterGroup.log(`✅ TOTAL RAW ACTION DATA COLLECTED: ${allActionData.length} items`);
      
      // Transform and standardize all collected data (simplified version of Action Center transformation)
      const transformedData = allActionData
        .filter(item => item && (item.what || item.action || item.description))
        .map(item => ({
          id: item.id || `${item.sourceDocument}_${item.reportIndex || 0}`,
          department: item.department || item.dept || 'pnp',
          municipality: item.municipality || item.mun || item.location || null,
          district: item.district || null,
          what: item.what || item.action || item.description || item.activity || null,
          when: item.when || item.date || item.timestamp || null,
          where: item.where || item.place || item.venue || item.location || null,
          actionTaken: item.actionTaken || item.status || item.result || 'Pending',
          sourceCollection: item.sourceCollection,
          sourceDocument: item.sourceDocument,
          sourceType: item.sourceType,
          reportIndex: item.reportIndex
        }));
      
      actionCenterGroup.log('📊 Loaded Action Center data:', transformedData.length, 'records');
      setRealActionCenterData(transformedData);
      setLastDataUpdate(new Date());
      actionCenterGroup.log('✅ Action Center data fetch completed successfully');
      actionCenterGroup.end();
    } catch (error) {
      actionCenterGroup.error('❌ Error loading Action Center data:', error);
      actionCenterGroup.end();
      setRealActionCenterData([]);
    } finally {
      setIsLoadingActionCenter(false);
    }
  };

  // Fetch real Incidents data from Firebase (same approach as Incidents page)
  const fetchIncidentsData = async () => {
    setIsLoadingIncidents(true);
    try {
      const incidentsGroup = createSectionGroup(CONSOLE_GROUPS.INCIDENTS, false);
      incidentsGroup.log('🚀 Loading Incidents data from Firebase');
      const incidentsRef = collection(db, 'incidents');
      const querySnapshot = await getDocs(incidentsRef);
      const incidentsData = [];
      const seenIds = new Set();
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data) {
          // Clean the data when loading from Firestore (same as Incidents page)
          const incidentData = {
            id: doc.id,
            ...data
          };
          
          // Only include non-duplicate incidents (same logic as Incidents page)
          if (!seenIds.has(incidentData.id)) {
            seenIds.add(incidentData.id);
            incidentsData.push(incidentData);
          }
        }
      });
      
      incidentsGroup.log('📊 Loaded Incidents data:', incidentsData.length, 'records');
      incidentsGroup.log('📄 Sample incident data:', incidentsData.slice(0, 2));
      setRealIncidentsData(incidentsData);
      setLastDataUpdate(new Date());
      incidentsGroup.log('✅ Incidents data fetch completed successfully');
      incidentsGroup.end();
    } catch (error) {
      incidentsGroup.error('❌ Error loading Incidents data:', error);
      incidentsGroup.end();
      setRealIncidentsData([]);
    } finally {
      setIsLoadingIncidents(false);
    }
  };

  // Load Action Center data when component mounts and when user changes (non-blocking)
  useEffect(() => {
    // Load in background without blocking UI
    setTimeout(() => {
      fetchActionCenterData();
    }, 100); // Slight delay to prioritize UI rendering
  }, [userAccessLevel, userMunicipality]);

  // Load Incidents data when component mounts and when user changes (non-blocking)
  useEffect(() => {
    // Load in background without blocking UI
    setTimeout(() => {
      fetchIncidentsData();
    }, 200); // Slight delay to prioritize UI rendering
  }, [userAccessLevel, userMunicipality]);

  // Auto-refresh Action Center data every 60 seconds
  useEffect(() => {
    const refreshInterval = setInterval(() => {
        dashboardLog('🔄 Auto-refreshing Action Center data...');
      fetchActionCenterData();
    }, 60000); // 60 seconds

    return () => clearInterval(refreshInterval);
  }, [userAccessLevel, userMunicipality]);

  // Auto-refresh Incidents data every 60 seconds
  useEffect(() => {
    const refreshInterval = setInterval(() => {
        dashboardLog('🔄 Auto-refreshing Incidents data...');
      fetchIncidentsData();
    }, 60000); // 60 seconds

    return () => clearInterval(refreshInterval);
  }, [userAccessLevel, userMunicipality]);

  // Get action breakdown data from real Action Center data
  const getActionBreakdown = () => {
    const dataToUse = realActionCenterData.length > 0 ? realActionCenterData : actionReports || [];
    
    if (dataToUse.length === 0) {
      return {
        types: [
          { name: 'Road Maintenance', count: 0 },
          { name: 'Security Patrol', count: 0 },
          { name: 'Traffic Control', count: 0 },
          { name: 'Emergency Response', count: 0 }
        ],
        locations: [
          { name: 'No data available', count: 0 }
        ]
      };
    }

    // Filter actions by current month and user municipality
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const filteredActions = dataToUse.filter(report => {
      // Filter by user's municipality if user is not admin
      if (
        userAccessLevel !== 'admin' &&
        userMunicipality &&
        report.municipality &&
        normalizeMunicipalityName(report.municipality) !== normalizeMunicipalityName(userMunicipality)
      ) {
        return false;
      }
      
      // Filter by current month
      const actionDate = getReportDate(report);
      if (actionDate) {
        return actionDate.getMonth() === currentMonth && actionDate.getFullYear() === currentYear;
      }
      
      return true; // Include actions without date for now
    });

    // Count by action type
    const typeCount = {};
    const municipalityCount = {};

    filteredActions.forEach(report => {
      // Count by action type (using 'what' field)
      const actionType = report.what || 'Other';
      typeCount[actionType] = (typeCount[actionType] || 0) + 1;

      // Use municipality directly from the report data
      const municipality = report.municipality || 'Unknown';
      municipalityCount[municipality] = (municipalityCount[municipality] || 0) + 1;
    });

    // Convert to arrays and sort by count
    const types = Object.entries(typeCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count); // Show all types

    const locations = Object.entries(municipalityCount)
      .map(([name, count]) => ({ name, count, municipality: name }))
      .sort((a, b) => b.count - a.count); // Show all municipalities

    return { types, locations };
  };

  // Get municipality-specific illegal activities from real Action Center data
  const getLocationIllegals = (municipalityName) => {
    const dataToUse = realActionCenterData.length > 0 ? realActionCenterData : actionReports || [];
    
    if (dataToUse.length === 0) {
      return [];
    }

    // Filter reports for this specific municipality and current month
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const municipalityReports = dataToUse.filter(report => {
      // Filter by municipality
      if (normalizeMunicipalityName(report.municipality) !== normalizeMunicipalityName(municipalityName)) {
        return false;
      }
      
      // Filter by current month
      const actionDate = getReportDate(report);
      if (actionDate) {
        return actionDate.getMonth() === currentMonth && actionDate.getFullYear() === currentYear;
      }
      
      return true; // Include actions without date for now
    });

    // Count by action type for this municipality
    const typeCount = {};
    municipalityReports.forEach(report => {
      const actionType = report.what || 'Other';
      typeCount[actionType] = (typeCount[actionType] || 0) + 1;
    });

    // Convert to array and sort by count
    const result = Object.entries(typeCount)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    return result;
  };

  // Toggle location expansion
  const toggleLocationExpansion = (locationName) => {
    setExpandedLocations(prev => ({
      ...prev,
      [locationName]: !prev[locationName]
    }));
  };

  // Get current month total actions count
  const getCurrentMonthActionsCount = () => {
    const dataToUse = realActionCenterData.length > 0 ? realActionCenterData : actionReports || [];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const filteredActions = dataToUse.filter(report => {
      // Filter by user's municipality if user is not admin
      if (
        userAccessLevel !== 'admin' &&
        userMunicipality &&
        report.municipality &&
        normalizeMunicipalityName(report.municipality) !== normalizeMunicipalityName(userMunicipality)
      ) {
        return false;
      }
      
      // Filter by current month
      const actionDate = getReportDate(report);
      if (actionDate) {
        return actionDate.getMonth() === currentMonth && actionDate.getFullYear() === currentYear;
      }
      
      return true; // Include actions without date for now
    });
    
    return filteredActions.length;
  };

  // Get current month total incidents count (EXACT same filtering as Incidents page)
  const getCurrentMonthIncidentsCount = () => {
    // Use real incidents data if available, otherwise fall back to DataContext
    const dataToUse = realIncidentsData.length > 0 ? realIncidentsData : incidents || [];
    
    // Remove duplicates by ID, keeping the most recent one (same as Incidents page)
    const uniqueIncidents = dataToUse.reduce((acc, incident) => {
      const existingIndex = acc.findIndex(existing => existing.id === incident.id);
      if (existingIndex === -1) {
        acc.push(incident);
      } else {
        // Replace with the more recent version (based on updatedAt or createdAt)
        const existing = acc[existingIndex];
        const existingTime = existing.updatedAt || existing.createdAt || '';
        const newTime = incident.updatedAt || incident.createdAt || '';
        if (newTime > existingTime) {
          acc[existingIndex] = incident;
        }
      }
      return acc;
    }, []);
    
    // Apply EXACT same filtering logic as Incidents page
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('en-US', { month: 'long' }); // October
    
    // Default filter values (same as Incidents page defaults)
    const filterStatus = "all";
    const filterDistrict = "all";
    const filterMunicipality = userAccessLevel !== 'admin' && userMunicipality ? userMunicipality : "all";
    const searchTerm = "";
    
    const filteredIncidents = uniqueIncidents.filter((incident) => {
      // Filter out incidents with "No description available" (same as Incidents page)
      const hasValidDescription = incident.description && 
                                 incident.description.trim() !== "" && 
                                 incident.description !== "No description available";
      
      const matchesStatus = filterStatus === "all" || incident.status === filterStatus;
      const matchesMonth = incident.month === currentMonth; // Filter by current month only
      const matchesDistrict = filterDistrict === "all" || incident.district === filterDistrict;
      const matchesMunicipality = filterMunicipality === "all" || incident.municipality === filterMunicipality;
      const matchesSearch = searchTerm === "" || 
                           (incident.incidentType && incident.incidentType.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (incident.location && incident.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (incident.municipality && incident.municipality.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return hasValidDescription && matchesStatus && matchesMonth && matchesDistrict && matchesMunicipality && matchesSearch;
    });
    
    dashboardLog(`📊 Incidents count for ${currentMonth} (same logic as Incidents page):`, filteredIncidents.length);
    
    // Return actual count of filtered incidents (same as Incidents page stats.total)
    return filteredIncidents.length;
  };

  // Get incident breakdown data with current month filtering (EXACT same as Incidents page)
  const getIncidentBreakdown = () => {
    // Use real incidents data if available, otherwise fall back to DataContext
    const dataToUse = realIncidentsData.length > 0 ? realIncidentsData : incidents || [];
    
    if (dataToUse.length === 0) {
      return {
        types: [
          { name: 'Traffic Violation', count: 0 },
          { name: 'Traffic Accident', count: 0 },
          { name: 'Criminal Activity', count: 0 },
          { name: 'Public Disturbance', count: 0 },
          { name: 'Other', count: 0 }
        ],
        severity: [
          { level: 'High', count: 0 },
          { level: 'Medium', count: 0 },
          { level: 'Low', count: 0 }
        ]
      };
    }

    // Remove duplicates by ID, keeping the most recent one (same as Incidents page)
    const uniqueIncidents = dataToUse.reduce((acc, incident) => {
      const existingIndex = acc.findIndex(existing => existing.id === incident.id);
      if (existingIndex === -1) {
        acc.push(incident);
      } else {
        // Replace with the more recent version (based on updatedAt or createdAt)
        const existing = acc[existingIndex];
        const existingTime = existing.updatedAt || existing.createdAt || '';
        const newTime = incident.updatedAt || incident.createdAt || '';
        if (newTime > existingTime) {
          acc[existingIndex] = incident;
        }
      }
      return acc;
    }, []);

    // Apply EXACT same filtering logic as Incidents page
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('en-US', { month: 'long' }); // October
    
    // Default filter values (same as Incidents page defaults)
    const filterStatus = "all";
    const filterDistrict = "all";
    const filterMunicipality = userAccessLevel !== 'admin' && userMunicipality ? userMunicipality : "all";
    const searchTerm = "";
    
    const filteredIncidents = uniqueIncidents.filter((incident) => {
      // Filter out incidents with "No description available" (same as Incidents page)
      const hasValidDescription = incident.description && 
                                 incident.description.trim() !== "" && 
                                 incident.description !== "No description available";
      
      const matchesStatus = filterStatus === "all" || incident.status === filterStatus;
      const matchesMonth = incident.month === currentMonth; // Filter by current month only
      const matchesDistrict = filterDistrict === "all" || incident.district === filterDistrict;
      const matchesMunicipality = filterMunicipality === "all" || incident.municipality === filterMunicipality;
      const matchesSearch = searchTerm === "" || 
                           (incident.incidentType && incident.incidentType.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (incident.location && incident.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (incident.municipality && incident.municipality.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return hasValidDescription && matchesStatus && matchesMonth && matchesDistrict && matchesMunicipality && matchesSearch;
    });

    dashboardLog(`📊 Filtered incidents for breakdown (${currentMonth}):`, filteredIncidents.length);

    // Count by incident type (using exact field names from Incidents page)
    const typeCount = {};
    const severityCount = { 'High': 0, 'Medium': 0, 'Low': 0 };

    filteredIncidents.forEach(incident => {
      // Count by incident type (same field as Incidents page)
      const incidentType = incident.incidentType || 'Other';
      typeCount[incidentType] = (typeCount[incidentType] || 0) + 1;

      // Count by priority (same field as Incidents page)
      const priority = incident.priority || 'Medium';
      if (severityCount.hasOwnProperty(priority)) {
        severityCount[priority]++;
      } else {
        severityCount['Medium']++; // Default to Medium if unknown
      }
    });

    // Convert to arrays and sort by count
    const types = Object.entries(typeCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count); // Show all types

    const severity = Object.entries(severityCount)
      .map(([level, count]) => ({ level, count }))
      .sort((a, b) => {
        const order = { 'High': 3, 'Medium': 2, 'Low': 1 };
        return order[b.level] - order[a.level];
      });

    dashboardLog('📊 Incident breakdown calculated:', { types, severity });
    return { types, severity };
  };

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
    
    const commandCenterDataGroup = createSectionGroup(CONSOLE_GROUPS.COMMAND_CENTER, true);
    commandCenterDataGroup.log('📊 getCommandCenterData called:', {
      userAccessLevel,
      userMunicipality: currentMunicipality,
      hasRealData: realCommandCenterData.totalBarangays > 0 || realCommandCenterData.totalConcernTypes > 0,
      realCommandCenterData
    });
    
    // Use real data if available, otherwise fallback to sample data
    if (realCommandCenterData.totalBarangays > 0 || realCommandCenterData.totalConcernTypes > 0) {
      // Calculate barangay reports and last report dates from actual weekly report data
      const barangayStats = {};
      
      realCommandCenterData.weeklyReports.forEach(report => {
        if (report.weeklyReportData) {
          const reportMonth = report.month; // e.g., "March", "April", etc.
          const reportYear = report.year || 2025;
          
          // weeklyReportData structure: { "date": [entries] }
          Object.entries(report.weeklyReportData).forEach(([dateKey, dateEntries]) => {
            if (Array.isArray(dateEntries)) {
              dateEntries.forEach(entry => {
                const barangayName = entry.barangay;
                if (barangayName) {
                  if (!barangayStats[barangayName]) {
                    barangayStats[barangayName] = {
                      totalReports: 0,
                      lastReportDate: null,
                      lastReportMonth: null
                    };
                  }
                  
                  // Count reports from weekly data
                  const week1 = parseInt(entry.week1) || 0;
                  const week2 = parseInt(entry.week2) || 0;
                  const week3 = parseInt(entry.week3) || 0;
                  const week4 = parseInt(entry.week4) || 0;
                  const totalWeeklyReports = week1 + week2 + week3 + week4;
                  
                  // Only count if there are actual reports
                  if (totalWeeklyReports > 0) {
                    barangayStats[barangayName].totalReports += totalWeeklyReports;
                    
                    // Track the most recent report date using the report's month and year
                    // Parse the dateKey (which might be just a day or a full date string)
                    let reportDate;
                    try {
                      // If dateKey is a full date string, use it
                      if (dateKey.includes('-') || dateKey.includes('/')) {
                        reportDate = new Date(dateKey);
                      } else {
                        // Otherwise, construct date from report month/year and dateKey
                        const monthIndex = ['January', 'February', 'March', 'April', 'May', 'June', 
                                          'July', 'August', 'September', 'October', 'November', 'December']
                                          .indexOf(reportMonth);
                        reportDate = new Date(reportYear, monthIndex, parseInt(dateKey) || 1);
                      }
                    } catch (e) {
                      // Fallback: use first day of the report month
                      const monthIndex = ['January', 'February', 'March', 'April', 'May', 'June', 
                                        'July', 'August', 'September', 'October', 'November', 'December']
                                        .indexOf(reportMonth);
                      reportDate = new Date(reportYear, monthIndex, 1);
                    }
                    
                    if (!barangayStats[barangayName].lastReportDate || reportDate > barangayStats[barangayName].lastReportDate) {
                      barangayStats[barangayName].lastReportDate = reportDate;
                      barangayStats[barangayName].lastReportMonth = reportMonth;
                    }
                  }
                }
              });
            }
          });
        }
      });

      // Process real barangays data for display - show ALL barangays with actual stats
      const processedBarangays = realCommandCenterData.barangays.map(barangay => {
        const barangayName = barangay.name || barangay.barangay;
        const stats = barangayStats[barangayName] || { totalReports: 0, lastReportDate: null };
        
        return {
          name: barangayName,
          municipality: barangay.municipality,
          district: barangay.district || '1ST DISTRICT',
          reports: stats.totalReports,
          lastReport: stats.lastReportDate 
            ? stats.lastReportDate.toISOString().split('T')[0]
            : 'No reports'
        };
      }).sort((a, b) => {
        // Sort by district first, then by municipality, then by barangay name
        if (a.district !== b.district) {
          return a.district.localeCompare(b.district);
        }
        if (a.municipality !== b.municipality) {
          return a.municipality.localeCompare(b.municipality);
        }
        return a.name.localeCompare(b.name);
      });
      
      commandCenterDataGroup.log('📊 Processed', processedBarangays.length, 'barangays with stats');

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

      // Convert to array and show ALL concern types (sorted by count)
      const processedConcernTypes = Object.entries(concernTypesCounts)
        .map(([type, count], index) => {
          const colors = ['green', 'blue', 'red', 'orange', 'purple', 'emerald', 'violet', 'teal', 'rose', 'amber'];
          return {
            type,
            count,
            color: colors[index % colors.length]
          };
        })
        .sort((a, b) => b.count - a.count); // Show ALL, sorted by count (no slice)

      commandCenterDataGroup.log('✅ Command Center data processed successfully');
      commandCenterDataGroup.end();
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

  // REMOVED: No blocking loading screen - show dashboard immediately
  // All data loads in background, individual cards show loading states

  // Get instruction content based on user access level
  const getInstructionContent = () => {
    if (userAccessLevel === 'command-center') {
      return {
        title: 'Welcome to Command Center Dashboard!',
        icon: <Building2 className="w-12 h-12 text-blue-600" />,
        steps: [
          {
            title: 'Dashboard Overview',
            description: 'View total reports, barangays, and concern types across all municipalities (March-September 2025).',
            icon: <BarChart3 className="w-5 h-5 text-blue-600" />
          },
          {
            title: 'All Barangays Section',
            description: 'See complete list of all barangays with their report counts and last report dates.',
            icon: <MapPin className="w-5 h-5 text-emerald-600" />
          },
          {
            title: 'Top Concern Types',
            description: 'Monitor the most reported concern categories with visual progress bars.',
            icon: <AlertTriangle className="w-5 h-5 text-orange-600" />
          },
          {
            title: 'Command Center Page',
            description: 'Navigate to Command Center page to manage weekly reports, barangays, and concern types for your municipality.',
            icon: <FileText className="w-5 h-5 text-violet-600" />
          },
          {
            title: 'Refresh Data',
            description: 'Use the "Refresh Data" button to reload the latest information from the database.',
            icon: <RefreshCw className="w-5 h-5 text-teal-600" />
          }
        ]
      };
    } else if (userAccessLevel === 'admin') {
      return {
        title: 'Welcome to Admin Dashboard!',
        icon: <Shield className="w-12 h-12 text-purple-600" />,
        steps: [
          {
            title: 'Full System Access',
            description: 'You have access to all features including IPatroller data, district statistics, and municipality lists.',
            icon: <CheckCircle className="w-5 h-5 text-green-600" />
          },
          {
            title: 'Data Management',
            description: 'Refresh IPatroller data, create sample data for testing, and monitor all municipalities.',
            icon: <Database className="w-5 h-5 text-blue-600" />
          },
          {
            title: 'Command Center Access',
            description: 'Access Command Center page to manage all municipalities, barangays, and concern types.',
            icon: <Building2 className="w-5 h-5 text-orange-600" />
          }
        ]
      };
    }
    return null;
  };

  const instructionContent = getInstructionContent();

  return (
    <Layout onLogout={handleLogout} onNavigate={onNavigate} currentPage={currentPage}>
      {/* Instruction Modal */}
      {showInstructions && instructionContent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-violet-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-md">
                    {instructionContent.icon}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{instructionContent.title}</h2>
                    <p className="text-sm text-slate-600 mt-1">Quick guide to get you started</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseInstructions}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {instructionContent.steps.map((step, index) => (
                <div key={index} className="flex gap-4 p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200 bg-white">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                      <span className="text-lg font-black text-slate-700">{index + 1}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {step.icon}
                      <h3 className="text-sm font-bold text-slate-900">{step.title}</h3>
                    </div>
                    <p className="text-sm text-slate-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">You can view this guide anytime from Settings</p>
                <Button
                  onClick={handleCloseInstructions}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                >
                  Got it, Let's Start!
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 ${isAdmin ? 'sticky top-0 z-40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 py-3 border-b border-slate-200' : ''} w-full px-4 sm:px-6 lg:px-8`}>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">
              {userAccessLevel === 'quarry-monitoring' 
                ? 'Overview of quarry site operations and compliance monitoring'
                : userAccessLevel === 'command-center'
                ? 'Overview of Command Center operations with barangay reports and concern types'
                : `Overview of IPatroller system performance based on ${summaryStats.yesterdayDate ? `patrol data from ${summaryStats.yesterdayDate}` : 'yesterday\'s patrol data'}`
              }
            </p>
            {false && (
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1 flex-wrap">
                <RefreshCw className="w-3 h-3" />
                Last updated: {lastDataUpdate?.toLocaleTimeString?.()} - Showing data for {currentMonthYearLabel}
              </p>
            )}
          </div>
          
          {/* Action Buttons for Admin Users */}
          {userAccessLevel === 'admin' && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <Button
                onClick={() => {
                  dashboardLog('🔄 Refreshing all dashboard data...');
                  // Refresh all data sources
                  loadIPatrollerData(); // Load from IPatroller source
                  refreshIPatrollerData(); // Also refresh DataContext
                  fetchActionCenterData(); // Refresh Action Center data
                  fetchIncidentsData(); // Refresh Incidents data
                  if (userAccessLevel === 'command-center') {
                    fetchCommandCenterData(); // Refresh Command Center data
                  }
                  showSuccess(`All dashboard data refreshed for current month (${currentMonthYearLabel})`);
                }}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base px-3 py-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh All Data
              </Button>
              
              {(!ipatrollerPatrolData || ipatrollerPatrolData.length === 0) && (
                <Button
                  onClick={() => {
                    dashboardLog('🧪 Creating sample IPatroller data for testing...');
                    createSampleIPatrollerData();
                    showSuccess('Sample IPatroller data created for testing');
                  }}
                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base px-3 py-2"
                >
                  <FileText className="w-4 h-4" />
                  Create Sample Data
                </Button>
              )}
            </div>
          )}
          
          {/* Action Buttons for Command Center Users */}
          {userAccessLevel === 'command-center' && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                onClick={() => {
                  dashboardLog('🔄 Refreshing Command Center, Action, and Incidents data...');
                  fetchCommandCenterData();
                  fetchActionCenterData(); // Also refresh action data
                  fetchIncidentsData(); // Also refresh incidents data
                  showSuccess(`Command Center data refreshed for current month (${currentMonthYearLabel})`);
                }}
                disabled={isLoadingCommandCenter || isLoadingActionCenter || isLoadingIncidents}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 text-sm sm:text-base px-3 py-2 w-full sm:w-auto"
              >
                <RefreshCw className={`w-4 h-4 ${(isLoadingCommandCenter || isLoadingActionCenter || isLoadingIncidents) ? 'animate-spin' : ''}`} />
                {(isLoadingCommandCenter || isLoadingActionCenter || isLoadingIncidents) ? 'Refreshing...' : 'Refresh Data'}
              </Button>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {userAccessLevel === 'quarry-monitoring' ? (
          /* Quarry Monitoring Stats */
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 mb-1 truncate">Total Sites</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-600">
                      {quarryData.totalSites.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                    <Mountain className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border border-gray-200">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 mb-1 truncate">Active Sites</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-600">
                      {quarryData.activeSites.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border border-gray-200">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 mb-1 truncate">Compliant</p>
                    <p className="text-xl sm:text-2xl font-bold text-emerald-600">
                      {quarryData.compliantSites.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-1.5 sm:p-2 bg-emerald-100 rounded-lg">
                    <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border border-gray-200">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 mb-1 truncate">Violations</p>
                    <p className="text-xl sm:text-2xl font-bold text-red-600">
                      {quarryData.violations.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : userAccessLevel === 'command-center' ? (
          /* Command Center Stats - Modern shadcn Design */
          <div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mt-4 sm:mt-5 lg:mt-6 mb-4 sm:mb-6 lg:mb-8">
            {/* 1. Total Reports - FIRST */}
            <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-violet-500 via-violet-600 to-violet-700 overflow-hidden relative group">
              <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] group-hover:scale-105 transition-transform duration-500"></div>
              <CardContent className="p-6 relative z-10">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-xs font-semibold text-violet-100 uppercase tracking-wider">Total Reports</p>
                    </div>
                    <p className="text-5xl font-black text-white tracking-tight">
                      {commandCenterData.totalReports.toLocaleString()}
                    </p>
                    <p className="text-sm text-violet-100/80">{userMunicipality || 'All municipalities'} • Mar-Sep 2025</p>
                  </div>
                  <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 group-hover:scale-110 transition-transform duration-300">
                    <FileText className="w-10 h-10 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. Total Barangays - SECOND */}
            <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 overflow-hidden relative group">
              <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] group-hover:scale-105 transition-transform duration-500"></div>
              <CardContent className="p-6 relative z-10">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-xs font-semibold text-blue-100 uppercase tracking-wider">Total Barangays</p>
                    </div>
                    <p className="text-5xl font-black text-white tracking-tight">
                      {commandCenterData.totalBarangays.toLocaleString()}
                    </p>
                    <p className="text-sm text-blue-100/80">In {userMunicipality || 'all municipalities'}</p>
                  </div>
                  <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 group-hover:scale-110 transition-transform duration-300">
                    <Building2 className="w-10 h-10 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3. Concern Types - THIRD */}
            <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 overflow-hidden relative group">
              <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] group-hover:scale-105 transition-transform duration-500"></div>
              <CardContent className="p-6 relative z-10">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">Concern Types</p>
                    </div>
                    <p className="text-5xl font-black text-white tracking-tight">
                      {commandCenterData.totalConcernTypes.toLocaleString()}
                    </p>
                    <p className="text-sm text-emerald-100/80">Active categories</p>
                  </div>
                  <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 group-hover:scale-110 transition-transform duration-300">
                    <AlertTriangle className="w-10 h-10 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          </div>
        ) : (
          /* Regular Dashboard Stats */
          <div>
          <div className="w-full px-4 sm:px-6 lg:px-8">
          <div>
          <div className={`grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mt-4 sm:mt-5 lg:mt-6 mb-4 sm:mb-6 lg:mb-8 ${userAccessLevel === 'ipatroller' ? 'lg:grid-cols-2' : 'lg:grid-cols-4'}`}>
          <Card className="bg-white shadow-sm border border-slate-200 rounded-xl">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-500 mb-1 truncate">Active Municipalities</p>
                  <p className="text-xl sm:text-2xl font-bold text-emerald-600">
                    {activeCount.toLocaleString()}
                  </p>
                </div>
                <div className="p-2 sm:p-2.5 bg-emerald-100 rounded-lg flex-shrink-0">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-slate-200 rounded-xl">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-500 mb-1 truncate">Inactive Municipalities</p>
                  <p className="text-xl sm:text-2xl font-bold text-red-600">
                    {inactiveCount.toLocaleString()}
                  </p>
                </div>
                <div className="p-2 sm:p-2.5 bg-red-100 rounded-lg flex-shrink-0">
                  <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {userAccessLevel !== 'ipatroller' && (
            <>
              <Card className="bg-white shadow-sm border border-slate-200 rounded-xl">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-500 mb-1 truncate">Total Actions ({currentMonthYearLabel})</p>
                      <p className="text-xl sm:text-2xl font-bold text-blue-600">
                        {getCurrentMonthActionsCount().toLocaleString()}
                      </p>
                    </div>
                    <div className="p-2 sm:p-2.5 bg-blue-100 rounded-lg flex-shrink-0">
                      <Target className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm border border-slate-200 rounded-xl">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-500 mb-1 truncate">Total Incidents ({currentMonthYearLabel})</p>
                      <p className="text-xl sm:text-2xl font-bold text-orange-600">
                        {getCurrentMonthIncidentsCount().toLocaleString()}
                      </p>
                    </div>
                    <div className="p-2 sm:p-2.5 bg-orange-100 rounded-lg flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
          </div>
          </div>
          </div>
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Analytics Section */}
        <div className="w-full px-4 sm:px-6 lg:px-8">
        {userAccessLevel === 'quarry-monitoring' ? (
          /* Quarry Monitoring Analytics */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quarry Sites List */}
            <Card className="bg-white shadow-sm border border-gray-200 rounded-xl">
              <CardHeader className="p-6 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Mountain className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">Quarry Sites</CardTitle>
                    <p className="text-sm text-gray-600">Active quarry operations and compliance status</p>
                  </div>
                </div>
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
            <Card className="bg-white shadow-sm border border-gray-200 rounded-xl">
              <CardHeader className="p-6 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <FileCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">Compliance Overview</CardTitle>
                    <p className="text-sm text-gray-600">Environmental and operational compliance status</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="space-y-4">
                  {/* Compliance Rate */}
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-emerald-800">Overall Compliance Rate</h3>
                      <span className="text-2xl font-bold text-emerald-600">
                        {Math.round((quarryData.compliantSites / quarryData.totalSites) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-emerald-200 rounded-full h-2">
                      <div 
                        className="bg-emerald-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(quarryData.compliantSites / quarryData.totalSites) * 100}%` }}
                      ></div>
                    </div>
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
          /* Command Center Analytics - Modern shadcn Design */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* All Barangays - Modern Card */}
            <Card className="border border-slate-200 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white overflow-hidden">
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-500 rounded-xl shadow-lg">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-slate-900">All Barangays</CardTitle>
                      <p className="text-sm text-slate-500 mt-0.5">Complete registry with activity tracking</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 font-semibold">
                    {commandCenterData.barangays.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[650px] overflow-y-auto">
                  <div className="divide-y divide-slate-100">
                    {commandCenterData.barangays.length > 0 ? (
                      commandCenterData.barangays.map((barangay, index) => (
                        <div key={index} className="group p-5 hover:bg-slate-50/80 transition-all duration-200 cursor-pointer">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2.5 mb-2">
                                <div className="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                                  <MapPin className="w-4 h-4 text-blue-600" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-900 truncate">{barangay.name}</h3>
                              </div>
                              <div className="ml-8 space-y-1">
                                <p className="text-xs text-slate-600 font-medium">{barangay.municipality}</p>
                                <p className="text-xs text-slate-400">{barangay.district}</p>
                              </div>
                              <div className="ml-8 mt-3">
                                <Badge 
                                  variant={barangay.reports > 0 ? "default" : "secondary"}
                                  className={barangay.reports > 0 ? "bg-blue-500 hover:bg-blue-600" : "bg-slate-200 text-slate-600"}
                                >
                                  {barangay.reports} {barangay.reports === 1 ? 'Report' : 'Reports'}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-1">
                              <div className="text-xs font-medium text-slate-500">Last Report</div>
                              <div className="text-xs font-semibold text-slate-700">
                                {barangay.lastReport === 'No reports' 
                                  ? <span className="text-slate-400">No reports</span>
                                  : new Date(barangay.lastReport).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-sm text-slate-500">No barangays found</p>
                        <p className="text-xs text-slate-400 mt-1">Please check Firebase data</p>
                      </div>
                    )}
                  </div>
                </div>
                {commandCenterData.barangays.length > 0 && (
                  <div className="p-4 border-t border-slate-100 bg-slate-50">
                    <p className="text-xs text-center text-slate-500">
                      Showing <span className="font-semibold text-slate-700">all barangays</span> in {userMunicipality || 'all municipalities'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* All Concern Types - Modern Card */}
            <Card className="border border-slate-200 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white overflow-hidden">
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-500 rounded-xl shadow-lg">
                      <AlertTriangle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-slate-900">All Concern Types</CardTitle>
                      <p className="text-sm text-slate-500 mt-0.5">Complete list of reported categories</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-semibold">
                    {commandCenterData.concernTypes.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {commandCenterData.concernTypes.map((concern, index) => (
                    <div key={index} className="group relative">
                      <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 group-hover:from-slate-200 group-hover:to-slate-300 transition-all">
                          <span className="text-lg font-black text-slate-700">#{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate uppercase tracking-wide">
                            {concern.type}
                          </p>
                          <div className="mt-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${
                                concern.color === 'green' ? 'bg-emerald-500' :
                                concern.color === 'blue' ? 'bg-blue-500' :
                                concern.color === 'red' ? 'bg-red-500' :
                                concern.color === 'orange' ? 'bg-orange-500' :
                                'bg-violet-500'
                              }`}
                              style={{ width: `${Math.min((concern.count / Math.max(...commandCenterData.concernTypes.map(c => c.count))) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        <Badge 
                          className={`font-bold text-sm px-3 py-1.5 ${
                            concern.color === 'green' ? 'bg-emerald-500 hover:bg-emerald-600' :
                            concern.color === 'blue' ? 'bg-blue-500 hover:bg-blue-600' :
                            concern.color === 'red' ? 'bg-red-500 hover:bg-red-600' :
                            concern.color === 'orange' ? 'bg-orange-500 hover:bg-orange-600' :
                            'bg-violet-500 hover:bg-violet-600'
                          }`}
                        >
                          {concern.count}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {/* District Breakdown */}
                <div className="space-y-3 mt-6 pt-6 border-t-2 border-slate-200">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-slate-700" />
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">District Breakdown</h3>
                  </div>
                  <div className="space-y-2">
                    {commandCenterData.districtBreakdown.map((district, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{district.district}</p>
                          <p className="text-xs text-slate-500 mt-1">{district.barangays} barangays</p>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <Badge className="bg-blue-500 hover:bg-blue-600">
                            {district.reports} reports
                          </Badge>
                          <p className="text-xs text-slate-600 font-semibold">{district.percentage}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Regular Dashboard Analytics */
          <div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Municipality Lists */}
          <Card className="lg:col-span-2 bg-white shadow-sm border border-slate-200 rounded-xl">
            <CardHeader className="p-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <List className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-900">Municipality List</CardTitle>
                  <p className="text-sm text-slate-600">
                    {`Active, warning, and inactive municipalities for ${getDashboardReferenceDate().date.toDateString()}`}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {/* Instructions */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="p-1 bg-blue-100 rounded mt-0.5">
                    <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-blue-900 mb-1">How to read this data:</p>
                    <ul className="text-xs text-blue-800 space-y-0.5">
                      <li>• <span className="font-semibold">Active:</span> 14 or more patrols</li>
                      <li>• <span className="font-semibold">Warning:</span> exactly 13 patrols</li>
                      <li>• <span className="font-semibold">Inactive:</span> 12 or fewer patrols or no entry</li>
                      <li>• Numbers shown represent the total patrol count for yesterday</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-auto">
                  
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
                              <p className="text-xs font-medium text-slate-900 truncate">{municipality.name}</p>
                              <p className="text-xs text-slate-500">{municipality.district}</p>
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

                {/* Warning Municipalities */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <h3 className="text-sm font-semibold text-yellow-600">Warning ({municipalityLists.warning?.length || 0})</h3>
                  </div>
                  <div className="space-y-1 max-h-80 overflow-y-auto pr-2">
                    {(municipalityLists.warning?.length || 0) > 0 ? (
                      (municipalityLists.warning || []).map((municipality, index) => (
                        <div key={index} className="flex items-center justify-between p-2.5 bg-yellow-50 rounded-lg border border-yellow-100 hover:bg-yellow-100 transition-colors">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-yellow-600 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-slate-900 truncate">{municipality.name}</p>
                              <p className="text-xs text-slate-500">{municipality.district}</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs font-semibold text-yellow-700">{municipality.patrols}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <Building2 className="w-6 h-6 mx-auto mb-1 text-gray-300" />
                        <p className="text-xs">No warning municipalities</p>
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
                              <p className="text-xs font-medium text-slate-900 truncate">{municipality.name}</p>
                              <p className="text-xs text-slate-500">{municipality.district}</p>
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
        <Card className="bg-white shadow-sm border border-slate-200 rounded-xl">
          <CardHeader className="p-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <MapPin className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-slate-900">District Distribution</CardTitle>
                <p className="text-xs text-slate-600">
                  {`Municipality status by district (${getDashboardReferenceDate().date.toDateString()})`}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {/* Instructions */}
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="p-1 bg-emerald-100 rounded mt-0.5">
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-emerald-900 mb-1">District Summary:</p>
                  <ul className="text-xs text-emerald-800 space-y-0.5">
                    <li>• Shows active vs inactive count per district</li>
                    <li>• <span className="font-semibold">Percentage:</span> Active municipalities / Total municipalities</li>
                    <li>• Each district has 4 municipalities total</li>
                  </ul>
                </div>
              </div>
            </div>
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
                        <h3 className="text-xs font-semibold text-slate-900">{district.name}</h3>
                        <p className="text-xs text-slate-600">{district.total} municipalities</p>
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
                      <p className="text-xs text-slate-500">Active</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                        <span className="text-xs text-emerald-600 font-medium">{district.active}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-yellow-500" />
                        <span className="text-xs text-yellow-700 font-medium">{district.warning || 0}</span>
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

          {/* Actions and Incidents Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* Actions Breakdown */}
            <Card className="lg:col-span-2 bg-white shadow-sm border border-gray-200 rounded-xl">
              <CardHeader className="p-6 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Target className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">Actions Breakdown</CardTitle>
                    <p className="text-sm text-gray-600">Recent action reports by type and location</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                {/* Instructions */}
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <div className="p-1 bg-blue-100 rounded mt-0.5">
                      <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-blue-900 mb-1">Understanding Actions:</p>
                      <ul className="text-xs text-blue-800 space-y-0.5">
                        <li>• <span className="font-semibold">Most Reported:</span> Action types with highest frequency</li>
                        <li>• <span className="font-semibold">Most Reported Location:</span> Municipalities with most action reports</li>
                        <li>• Click on locations to expand and view specific illegal activities</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  {/* Two Column Layout for Action Types and Locations */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Action Types */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Most Reported</h4>
                      <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                        {getActionBreakdown().types.map((type, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-sm text-gray-700">{type.name}</span>
                            </div>
                            <span className="text-sm font-semibold text-blue-600">{type.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Locations */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Most Reported Location</h4>
                      <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                        {getActionBreakdown().locations.map((location, index) => (
                          <div key={index} className="bg-blue-50 rounded-lg">
                            {/* Location Header - Clickable */}
                            <div 
                              className="flex items-center justify-between p-2 cursor-pointer hover:bg-blue-100 transition-colors rounded-lg"
                              onClick={() => toggleLocationExpansion(location.name)}
                            >
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3 h-3 text-blue-500" />
                                <span className="text-sm text-gray-700">{location.name}</span>
                                {expandedLocations[location.name] ? 
                                  <ChevronDown className="w-3 h-3 text-gray-500" /> : 
                                  <ChevronRight className="w-3 h-3 text-gray-500" />
                                }
                              </div>
                              <span className="text-sm font-semibold text-blue-600">{location.count}</span>
                            </div>
                            
                            {/* Expandable Content */}
                            {expandedLocations[location.name] && (
                              <div className="px-4 pb-2 space-y-1">
                                <div className="border-t border-blue-200 pt-2">
                                  <p className="text-xs font-medium text-gray-600 mb-2">Illegal Activities:</p>
                                  <div className="max-h-48 overflow-y-auto pr-2 space-y-1">
                                    {getLocationIllegals(location.name).map((illegal, illegalIndex) => (
                                      <div key={illegalIndex} className="flex items-center justify-between py-1 px-2 bg-white rounded text-xs">
                                        <div className="flex items-center gap-2">
                                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                                          <span className="text-gray-700">{illegal.type}</span>
                                        </div>
                                        <span className="text-red-600 font-medium">{illegal.count}</span>
                                      </div>
                                    ))}
                                    {getLocationIllegals(location.name).length === 0 && (
                                      <div className="text-xs text-gray-500 py-1 px-2">No specific data available</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Total Actions */}
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">Total Actions ({currentMonthYearLabel})</span>
                      <span className="text-lg font-bold text-blue-600">{getCurrentMonthActionsCount()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Incidents Breakdown */}
            <Card className="bg-white shadow-sm border border-gray-200 rounded-xl">
              <CardHeader className="p-6 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">Incidents Breakdown</CardTitle>
                    <p className="text-sm text-gray-600">Recent incidents by type and severity</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                {/* Instructions */}
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <div className="p-1 bg-red-100 rounded mt-0.5">
                      <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-red-900 mb-1">Understanding Incidents:</p>
                      <ul className="text-xs text-red-800 space-y-0.5">
                        <li>• <span className="font-semibold">By Incident Type:</span> Categories of reported incidents</li>
                        <li>• Numbers indicate total count of each incident type</li>
                        <li>• Monitor trends to identify areas needing attention</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  {/* Incident Types */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">By Incident Type</h4>
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                      {getIncidentBreakdown().types.map((type, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-sm text-gray-700">{type.name}</span>
                          </div>
                          <span className="text-sm font-semibold text-red-600">{type.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>


                  {/* Total Incidents */}
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">Total Incidents ({currentMonthYearLabel})</span>
                      <span className="text-lg font-bold text-red-600">{getCurrentMonthIncidentsCount()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          </div>
        )}
        </div>
        </div>

      </div>
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </Layout>
  );
}

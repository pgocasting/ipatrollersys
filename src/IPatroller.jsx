import React, { useState, useEffect, useRef } from "react";
import Layout from "./Layout";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Badge } from "./components/ui/badge";
import { Label } from "./components/ui/label";
import { toast } from "sonner";
import { useNotification, NotificationContainer } from './components/ui/notification';
import { 
  collection, 
  query, 
  getDocs, 
  getDoc,
  doc, 
  setDoc, 
  updateDoc, 
  orderBy, 
  limit,
  where,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ipatrollerLog, createSectionGroup, CONSOLE_GROUPS } from './utils/consoleGrouping';
import {
  Plus,
  Save,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  BarChart3,
  Building2,
  MapPin,
  Calendar,
  Filter,
  Search,
  FileText,
  Printer,
  Edit,
  Trash2,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Activity,
  TrendingUp,
  FileSpreadsheet,
  Trash,
  FileBarChart,
  Shield,
  Users,
  Target,
  Trophy,
  AlertTriangle,
  Zap,
  Sun,
  Moon,
  Camera,
  MoreVertical,
  Database,
  Wifi,
  WifiOff,
  Menu,
  Eye,
  Loader2
} from "lucide-react";

export default function IPatroller({ onLogout, onNavigate, currentPage }) {
  const [patrolData, setPatrolData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [firestoreStatus, setFirestoreStatus] = useState('connecting');
  const { notifications, showSuccess, showError, removeNotification } = useNotification();
  const DAILY_ACTIVE_COUNT = 14;
  const DAILY_WARNING_COUNT = 13;
  const DAILY_INACTIVE_MAX = 12;
  const YEAR_OPTIONS_START = 2023;
  const YEAR_OPTIONS_END = new Date().getFullYear() + 10;
  const [selectedDistrict, setSelectedDistrict] = useState("ALL");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("daily");
  const [expandedDistricts, setExpandedDistricts] = useState({
    "1ST DISTRICT": true,
    "2ND DISTRICT": true,
    "3RD DISTRICT": true,
  });
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Command Center Action Taken data state
  const [commandCenterActionData, setCommandCenterActionData] = useState({});

  // Top Performers state variables
  const [showTopPerformersModal, setShowTopPerformersModal] = useState(false);
  const [showTopPerformersPreview, setShowTopPerformersPreview] = useState(false);
  const [selectedTopPerformersMonth, setSelectedTopPerformersMonth] = useState(new Date().getMonth());
  const [selectedTopPerformersYear, setSelectedTopPerformersYear] = useState(new Date().getFullYear());
  const [filteredTopPerformersData, setFilteredTopPerformersData] = useState([]);
  const [loadingTopPerformers, setLoadingTopPerformers] = useState(false);
  const topPerformersPreviewRef = useRef(null);

  // Date Range PDF Modal state variables
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [pdfFromMonth, setPdfFromMonth] = useState(new Date().getMonth());
  const [pdfFromYear, setPdfFromYear] = useState(new Date().getFullYear());
  const [pdfToMonth, setPdfToMonth] = useState(new Date().getMonth());
  const [pdfToYear, setPdfToYear] = useState(new Date().getFullYear());
  const [isGeneratingRangePdf, setIsGeneratingRangePdf] = useState(false);

  // Calculate daily summary data for a specific day
  const getDailySummaryData = (dayIndex) => {
    const summaryData = {};
    
    Object.keys(municipalitiesByDistrict).forEach(district => {
      summaryData[district] = municipalitiesByDistrict[district].map(municipality => {
        const municipalityData = patrolData.find(item => item.municipality === municipality);
        const dailyCount = municipalityData ? municipalityData.data[dayIndex] || 0 : 0;
        const isActive = dailyCount >= DAILY_ACTIVE_COUNT;
        
        return {
          municipality,
          dailyCount,
          isActive,
          percentage: dailyCount >= DAILY_ACTIVE_COUNT ? 100 : Math.round((dailyCount / DAILY_ACTIVE_COUNT) * 100)
        };
      });
    });

    return summaryData;
  };
  // Remove unused state
  const moreOptionsRef = useRef(null);

  // Handle click outside for more options dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (moreOptionsRef.current && !moreOptionsRef.current.contains(event.target)) {
        setShowMoreOptions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  // Generate dates for selected month and year
  const generateDates = (month, year) => {
    const dates = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const currentDate = new Date();
    const isCurrentMonth =
      month === currentDate.getMonth() && year === currentDate.getFullYear();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isCurrentDay = isCurrentMonth && day === currentDate.getDate();
      dates.push({
        date: date,
        dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
        dayNumber: day,
        fullDate: date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
        isCurrentDay: isCurrentDay,
      });
    }
    return dates;
  };

  const selectedDates = generateDates(selectedMonth, selectedYear);

  // Municipalities by district with barangay counts
  const municipalitiesByDistrict = {
    "1ST DISTRICT": ["Abucay", "Orani", "Samal", "Hermosa"],
    "2ND DISTRICT": ["Balanga City", "Pilar", "Orion", "Limay"],
    "3RD DISTRICT": ["Bagac", "Dinalupihan", "Mariveles", "Morong"],
  };

  // Barangay counts per municipality
  const barangayCounts = {
    "Abucay": 9,
    "Orani": 29,
    "Samal": 14,
    "Hermosa": 23,
    "Balanga City": 25,
    "Pilar": 19,
    "Orion": 23,
    "Limay": 12,
    "Bagac": 14,
    "Dinalupihan": 46,
    "Mariveles": 18,
    "Morong": 5
  };

  // Number of days to complete a C/M (Complete Monitoring)
  const daysToCompleteCM = {
    "Hermosa": 3,
    "Orani": 4,
    "Samal": 2,
    "Abucay": 1,
    "Balanga City": 4,
    "Pilar": 3,
    "Orion": 3,
    "Limay": 2,
    "Dinalupihan": 7,
    "Morong": 1,
    "Bagac": 2,
    "Mariveles": 3
  };

  // Frequency of visit for every barangay within a week
  const weeklyVisitFrequency = {
    "Hermosa": 2,
    "Orani": 2,
    "Samal": 4,
    "Abucay": 5,
    "Balanga City": 2,
    "Pilar": 3,
    "Orion": 2,
    "Limay": 4,
    "Dinalupihan": 1,
    "Morong": 2,
    "Bagac": 4,
    "Mariveles": 3
  };

  // Cache for Firestore data to avoid redundant reads
  const firestoreCache = useRef({});
  const lastLoadedRef = useRef({ month: null, year: null });

  // Load patrol data from Firestore
  useEffect(() => {
    loadPatrolDataFromFirestore();
    loadCommandCenterActionData();
  }, [selectedMonth, selectedYear]);

  // Load Top Performers data when modal is shown
  useEffect(() => {
    if (showTopPerformersModal) {
      loadTopPerformersData(selectedTopPerformersMonth, selectedTopPerformersYear);
    }
  }, [selectedTopPerformersMonth, selectedTopPerformersYear, showTopPerformersModal]);

  const loadPatrolDataFromFirestore = async () => {
    setLoading(true);
    setFirestoreStatus('connecting');
    
    try {
      // Create month-year ID for the selected month
      const monthYearId = `${String(selectedMonth + 1).padStart(2, "0")}-${selectedYear}`;
      
      // Define months that should be locked "No Entry" for 2025 (0-based: 0=Jan, 1=Feb)
      const lockedNoEntryMonths = [0, 1]; // January, February 2025
      const isLockedNoEntry = lockedNoEntryMonths.includes(selectedMonth) && selectedYear === 2025;
      
      // If it's a locked "No Entry" month in 2025, create locked data
      if (isLockedNoEntry) {
        const lockedData = [];
        Object.entries(municipalitiesByDistrict).forEach(([district, municipalities]) => {
          municipalities.forEach((municipality) => {
            const dailyData = selectedDates.map(() => null); // Set all days to null for "No Entry"
            const itemData = {
              id: `${district}-${municipality}`,
              municipality,
              district,
              data: dailyData,
              totalPatrols: 0,
              activeDays: 0,
              inactiveDays: 0,
              activePercentage: 0,
              isLocked: true, // Mark as locked
            };
            lockedData.push(itemData);
          });
        });
        
        setPatrolData(lockedData);
        setFirestoreStatus('connected');
        setLoading(false);
        return;
      }
      
      // Check cache first to avoid redundant reads
      const cacheKey = monthYearId;
      if (firestoreCache.current[cacheKey] && 
          lastLoadedRef.current.month === selectedMonth && 
          lastLoadedRef.current.year === selectedYear) {
        ipatrollerLog('📦 Using cached data for:', monthYearId);
        setPatrolData(firestoreCache.current[cacheKey]);
        setFirestoreStatus('connected');
        setLoading(false);
        return;
      }

      // Try to get data from Firestore for other months
      const monthDocRef = doc(db, 'patrolData', monthYearId);
      const municipalitiesRef = collection(monthDocRef, 'municipalities');
      
      // Use getDocs instead of onSnapshot to reduce reads
      const snapshot = await getDocs(municipalitiesRef);
      const firestoreData = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data) {
          firestoreData.push({
            id: doc.id,
            ...data
          });
        }
      });

        // Always create initial structure for all municipalities first
        const allMunicipalitiesData = [];
        Object.entries(municipalitiesByDistrict).forEach(([district, municipalities]) => {
          municipalities.forEach((municipality) => {
            // Check if this municipality has data in Firestore
            const existingData = firestoreData.find(item => 
              item.municipality === municipality && item.district === district
            );
            
            if (existingData) {
              // Check if the existing data has any actual values (not all nulls)
              // Include 0 as valid data since it represents an actual entry
              const hasActualData = existingData.data && existingData.data.some(val => val !== null && val !== undefined);
              
              if (hasActualData) {
                // Recalculate activeDays and inactiveDays to exclude 0 values
                const requiredBarangays = barangayCounts[municipality] || 0;
                const activeDays = existingData.data.filter((val) => val !== null && val !== undefined && val >= DAILY_ACTIVE_COUNT).length;
                const inactiveDays = existingData.data.filter((val) => val !== null && val !== undefined && val > 0 && val <= DAILY_INACTIVE_MAX).length;
                const totalPatrols = existingData.data.reduce((sum, val) => sum + (val || 0), 0);
                const activePercentage = existingData.data.length > 0 ? Math.round((activeDays / existingData.data.length) * 100) : 0;
                
                // Use Firestore data but with recalculated stats
                allMunicipalitiesData.push({
                  ...existingData,
                  activeDays,
                  inactiveDays,
                  totalPatrols,
                  activePercentage
                });
              } else {
                // Even if data exists in Firestore, if it's all nulls, treat as "No Entry"
                const dailyData = selectedDates.map(() => null); // Set all days to null for "No Entry"
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
              const dailyData = selectedDates.map(() => null); // Set all days to null for "No Entry"
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

      // Cache the data
      firestoreCache.current[cacheKey] = allMunicipalitiesData;
      lastLoadedRef.current = { month: selectedMonth, year: selectedYear };

      setPatrolData(allMunicipalitiesData);
      setFirestoreStatus('connected');
      
    } catch (error) {
      ipatrollerLog('❌ Error loading from Firestore:', error, 'error');
      setFirestoreStatus('error');
      // Fallback to local data
      createLocalFallbackData();
    } finally {
      setLoading(false);
    }
  };

  // Cache for Command Center data
  const commandCenterCache = useRef({});

  // Load Command Center Action Taken data for weekly attended reports
  const loadCommandCenterActionData = async () => {
    const actionDataGroup = createSectionGroup(CONSOLE_GROUPS.ACTION_CENTER, false);
    
    try {
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const selectedMonthName = monthNames[selectedMonth];
      const monthYear = `${selectedMonthName}_${selectedYear}`;
      
      // Check cache first
      const cacheKey = `${selectedMonth}-${selectedYear}`;
      if (commandCenterCache.current[cacheKey]) {
        actionDataGroup.log('📦 Using cached Command Center data for:', monthYear);
        setCommandCenterActionData(commandCenterCache.current[cacheKey]);
        actionDataGroup.end();
        return;
      }
      
      actionDataGroup.log(`🔄 Loading Command Center Action Taken data for: ${selectedMonthName} ${selectedYear}`);
      
      const actionData = {};
      
      // Load data for all municipalities
      const municipalities = [
        "Abucay", "Bagac", "Balanga City", "Dinalupihan", "Hermosa", 
        "Limay", "Mariveles", "Morong", "Orani", "Orion", "Pilar", "Samal"
      ];
      
      for (const municipality of municipalities) {
        try {
          const docRef = doc(db, 'commandCenter', 'weeklyReports', municipality, monthYear);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            const weeklyReportData = data.weeklyReportData || {};
            
            // Count Action Taken entries by week for this municipality
            const weeklyActionCounts = [0, 0, 0, 0]; // Week 1, 2, 3, 4
            
            Object.entries(weeklyReportData).forEach(([dateKey, dateEntries]) => {
              if (Array.isArray(dateEntries)) {
                dateEntries.forEach(entry => {
                  // For March to October (months 2-9), count based on action taken
                  // For other months, count only entries with BOTH before and after photos
                  const isMarchToOctober = selectedMonth >= 2 && selectedMonth <= 9;
                  
                  let shouldCount = false;
                  
                  if (isMarchToOctober) {
                    // Count if action taken field has a value
                    shouldCount = entry.actionTaken && entry.actionTaken.trim() !== '';
                  } else {
                    // Count 1 per row that has after photos (not per photo)
                    let rowsWithAfterPhotos = 0;
                    
                    // Check new format: rows array
                    if (entry.photos && entry.photos.rows && Array.isArray(entry.photos.rows)) {
                      rowsWithAfterPhotos = entry.photos.rows.filter(row => 
                        row.after && Array.isArray(row.after) && row.after.length > 0
                      ).length;
                    } else {
                      // Check old format: before/after arrays
                      const hasBeforePhoto = entry.photos && entry.photos.before;
                      const hasAfterPhoto = entry.photos && entry.photos.after && hasBeforePhoto;
                      
                      if (hasAfterPhoto) {
                        rowsWithAfterPhotos = 1; // Count as 1 row in old format
                      }
                    }
                    
                    // Only count if there are rows with after photos
                    if (rowsWithAfterPhotos > 0) {
                      // Determine which week this date falls into
                      const entryDate = new Date(dateKey);
                      const dayOfMonth = entryDate.getDate();
                      const weekIndex = Math.floor((dayOfMonth - 1) / 7);
                      
                      // Ensure weekIndex is within bounds (0-3)
                      if (weekIndex >= 0 && weekIndex < 4) {
                        weeklyActionCounts[weekIndex] += rowsWithAfterPhotos; // Count 1 per row with after photos
                      }
                    }
                  }
                  
                  if (isMarchToOctober && shouldCount) {
                    // For March-October, still use the old logic (count entries with action taken)
                    const entryDate = new Date(dateKey);
                    const dayOfMonth = entryDate.getDate();
                    const weekIndex = Math.floor((dayOfMonth - 1) / 7);
                    
                    // Ensure weekIndex is within bounds (0-3)
                    if (weekIndex >= 0 && weekIndex < 4) {
                      weeklyActionCounts[weekIndex]++;
                    }
                  }
                });
              }
            });
            
            actionData[municipality] = weeklyActionCounts;
            actionDataGroup.log(`✅ ${municipality}: Action Taken counts by week:`, weeklyActionCounts);
          } else {
            // No data for this municipality
            actionData[municipality] = [0, 0, 0, 0];
          }
        } catch (error) {
          actionDataGroup.error(`❌ Error loading data for ${municipality}:`, error);
          actionData[municipality] = [0, 0, 0, 0];
        }
      }
      
      // Cache the data
      commandCenterCache.current[cacheKey] = actionData;
      
      setCommandCenterActionData(actionData);
      actionDataGroup.log('📊 Command Center Action Taken data loaded:', actionData);
      actionDataGroup.log('✅ Action Center data loading completed successfully');
      actionDataGroup.end();
      
    } catch (error) {
      actionDataGroup.error('❌ Error loading Command Center Action Taken data:', error);
      actionDataGroup.end();
      setCommandCenterActionData({});
    }
  };

  const createInitialFirestoreStructure = async (monthYearId) => {
    try {
      const initialData = [];
      
      Object.entries(municipalitiesByDistrict).forEach(([district, municipalities]) => {
        municipalities.forEach((municipality) => {
          const dailyData = selectedDates.map(() => null); // Initialize with null for "No Entry"
          const totalPatrols = 0; // Keep as 0 for "No Entry" state
          
          // Calculate active/inactive days based on barangay count for this municipality
          const requiredBarangays = barangayCounts[municipality] || 0;
          const activeDays = 0; // No active days for "No Entry" state
          const inactiveDays = 0; // No inactive days for "No Entry" state
          const activePercentage = 0; // 0% for "No Entry" state
          
          const itemData = {
            id: `${district}-${municipality}`,
            municipality,
            district,
            data: dailyData,
            totalPatrols,
            activeDays,
            inactiveDays,
            activePercentage,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          
          initialData.push(itemData);
        });
      });

      // Save to Firestore
      const batch = [];
      initialData.forEach((item) => {
        const docRef = doc(db, 'patrolData', monthYearId, 'municipalities', item.id);
        batch.push(setDoc(docRef, item));
      });

      // Execute batch write
      await Promise.all(batch);
      
      // Update local state
      setPatrolData(initialData);
      setFirestoreStatus('connected');
      
    } catch (error) {
      ipatrollerLog('❌ Error creating Firestore structure:', error, 'error');
      setFirestoreStatus('error');
      // Fallback to local data
      createLocalFallbackData();
    }
  };

  const createInitialNoEntryStructure = () => {
    // Create "No Entry" data for all municipalities when no Firestore data exists
    const noEntryData = [];
    Object.entries(municipalitiesByDistrict).forEach(([district, municipalities]) => {
      municipalities.forEach((municipality) => {
        const dailyData = selectedDates.map(() => null); // Set all days to null for "No Entry"
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
        noEntryData.push(itemData);
      });
    });
    
    setPatrolData(noEntryData);
  };

  const createLocalFallbackData = () => {
    // Create fallback data with "No Entry" for all municipalities
    createInitialNoEntryStructure();
    setFirestoreStatus('offline');
  };

  const syncToFirestore = async () => {
    if (firestoreStatus !== 'connected') {
      return;
    }

    try {
      setLoading(true);
      const monthYearId = `${String(selectedMonth + 1).padStart(2, "0")}-${selectedYear}`;
      
      // Find municipalities that have actual data (not all nulls)
      // Include entries with 0 as they represent actual data entry
      const municipalitiesWithData = patrolData.filter(item => 
        item.data.some(value => value !== null && value !== undefined)
      );

      if (municipalitiesWithData.length === 0) {
        toast.info('No changes to save', {
          description: 'No patrol data has been entered yet',
          duration: 3000,
          position: 'top-right',
          style: { background: 'white' },
        });
        showSuccess('No changes to save - No patrol data has been entered yet');
        setLoading(false);
        return;
      }

      // Save only municipalities with data
      const batch = [];
      municipalitiesWithData.forEach((item) => {
        const docRef = doc(db, 'patrolData', monthYearId, 'municipalities', item.id);
        batch.push(setDoc(docRef, {
          ...item,
          updatedAt: serverTimestamp()
        }));
      });

      await Promise.all(batch);
      setFirestoreStatus('connected');
      
      // Show success toast with details about actually updated municipalities
      const municipalityNames = municipalitiesWithData.map(item => item.municipality).join(', ');
      toast.success('Changes saved successfully', {
        description: municipalitiesWithData.length === 1
          ? `Updated patrol data for ${municipalityNames}`
          : `Updated patrol data for ${municipalitiesWithData.length} municipalities: ${municipalityNames}`,
        duration: 3000,
        position: 'top-right',
        style: { background: 'white' },
      });
      showSuccess('Changes saved successfully!');

    } catch (error) {
      ipatrollerLog('❌ Error syncing to Firestore:', error, 'error');
      setFirestoreStatus('error');
      // Show error toast with more details
      toast.error('Failed to save changes', {
        description: `Error: ${error.message || 'Failed to sync with Firestore'}`,
        duration: 4000,
        position: 'top-right',
        style: { background: 'white' },
      });
      showError('Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPatrolData = (municipality, district, dayIndex, value) => {
    // Check if this is a locked "No Entry" month (January/February 2025)
    const lockedNoEntryMonths = [0, 1]; // January, February 2025
    const isLockedNoEntry = lockedNoEntryMonths.includes(selectedMonth) && selectedYear === 2025;
    
    // Prevent editing in locked "No Entry" months
    if (isLockedNoEntry) {
      return;
    }
    
    // Only update local state, don't save to Firestore
    const updatedData = patrolData.map((item) => {
      if (item.municipality === municipality && item.district === district) {
        const newData = [...item.data];
        newData[dayIndex] = value; // Keep null values as null, numbers as numbers
        const totalPatrols = newData.reduce((sum, val) => sum + (val || 0), 0);
        
        // Calculate active/inactive days based on barangay count for this municipality
        const requiredBarangays = barangayCounts[municipality] || 0;
        const activeDays = newData.filter((val) => val !== null && val !== undefined && val >= DAILY_ACTIVE_COUNT).length;
        const inactiveDays = newData.filter((val) => val !== null && val !== undefined && val > 0 && val <= DAILY_INACTIVE_MAX).length;
        const activePercentage = Math.round((activeDays / newData.length) * 100);
        
        return {
          ...item,
          data: newData,
          totalPatrols,
          activeDays,
          inactiveDays,
          activePercentage,
        };
      }
      return item;
    });
    
    setPatrolData(updatedData);
  };

  const toggleDistrictExpansion = (district) => {
    setExpandedDistricts((prev) => ({
      ...prev,
      [district]: !prev[district],
    }));
  };

  // Function to clear all 0 values after a specific day and set them to null (No Entry)
  const clearZeroValuesAfterDay = (afterDayIndex) => {
    const updatedData = patrolData.map((item) => {
      const newData = [...item.data];
      
      // Set all values after the specified day to null if they are 0
      for (let i = afterDayIndex + 1; i < newData.length; i++) {
        if (newData[i] === 0) {
          newData[i] = null;
        }
      }
      
      // Recalculate totals
      const totalPatrols = newData.reduce((sum, val) => sum + (val || 0), 0);
      const requiredBarangays = barangayCounts[item.municipality] || 0;
      const activeDays = newData.filter((val) => val !== null && val !== undefined && val >= DAILY_ACTIVE_COUNT).length;
      const inactiveDays = newData.filter((val) => val !== null && val !== undefined && val > 0 && val <= DAILY_INACTIVE_MAX).length;
      const activePercentage = Math.round((activeDays / newData.length) * 100);
      
      return {
        ...item,
        data: newData,
        totalPatrols,
        activeDays,
        inactiveDays,
        activePercentage,
      };
    });
    
    setPatrolData(updatedData);
    toast.success('Cleared unwanted 0 values', {
      description: 'All 0 values after the specified day have been set to "No Entry"',
      duration: 3000,
      position: 'top-right',
      style: { background: 'white' },
    });
    showSuccess('Cleared unwanted 0 values successfully');
  };

  const getStatusColor = (value, municipality) => {
    if (value === null || value === undefined)
      return "bg-gray-100 text-gray-800";
    if (value === 0)
      return "bg-red-600 text-white";
    
    if (value >= DAILY_ACTIVE_COUNT)
      return "bg-green-600 text-white";
    if (value === DAILY_WARNING_COUNT)
      return "bg-yellow-500 text-white";
    return "bg-red-600 text-white";
  };

  const getStatusText = (value, municipality) => {
    if (value === null || value === undefined) return "No Entry";
    if (value === 0) return "Inactive";
    
    if (value >= DAILY_ACTIVE_COUNT) return "Active";
    if (value === DAILY_WARNING_COUNT) return "Warning";
    return "Inactive";
  };

  // Top Performers functions
  const loadTopPerformersData = async (month, year) => {
    try {
      setLoadingTopPerformers(true);
      const monthYearId = `${String(month + 1).padStart(2, "0")}-${year}`;
      
      const municipalitiesRef = collection(db, 'patrolData', monthYearId, 'municipalities');
      const querySnapshot = await getDocs(municipalitiesRef);
      
      const topPerformersData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data && data.municipality) {
          topPerformersData.push({
            id: doc.id,
            municipality: data.municipality,
            district: data.district,
            data: data.data || []
          });
        }
      });
      
      setFilteredTopPerformersData(topPerformersData);
    } catch (error) {
      ipatrollerLog('Error loading top performers data:', error, 'error');
      setFilteredTopPerformersData([]);
    } finally {
      setLoadingTopPerformers(false);
    }
  };

  const getTopPerformers = () => {
    const dataToUse = filteredTopPerformersData;
    
    if (!dataToUse || dataToUse.length === 0) {
      return [];
    }
    
    return dataToUse
      .filter(item => item && (item.municipality || item.id))
      .map(item => {
        // Calculate Active Days from Daily Counts tab logic (days with >= 14 patrols)
        const activeDays = item.data.filter(count => count >= DAILY_ACTIVE_COUNT).length;
        const inactiveDays = item.data.filter(count => count <= DAILY_INACTIVE_MAX && count > 0).length;
        const totalDays = item.data.length;
        
        // Calculate Total Patrols from Criteria tab logic (sum of all daily patrols)
        const totalPatrols = item.data.reduce((sum, count) => sum + (count || 0), 0);
        
        // Calculate Performance % based on selected month and year
        let activePercentage;
        
        // Check if it's November or December 2025 (months 10-11 in 0-based index)
        const isNovDec2025 = selectedTopPerformersYear === 2025 && (selectedTopPerformersMonth === 10 || selectedTopPerformersMonth === 11);
        
        // For March to October (months 2-9), use Total Patrols percentage
        const isMarchToOctober = selectedTopPerformersMonth >= 2 && selectedTopPerformersMonth <= 9;
        
        if (isNovDec2025) {
          // November-December 2025: Performance % based on reports attended per week
          const WEEKLY_TARGET = 98; // Target reports per week (14 × 7)
          const weeklyEfficiency = [];
          
          // Get Action Taken counts from Command Center data for this municipality
          const municipalityActionCounts = commandCenterActionData[item.municipality] || [0, 0, 0, 0];
          
          // Calculate efficiency for each of the 4 weeks based on reports attended
          for (let week = 0; week < 4; week++) {
            const reportsAttended = municipalityActionCounts[week] || 0;
            const efficiency = Math.min(Math.floor((reportsAttended / WEEKLY_TARGET) * 100), 100); // Cap at 100% per week
            weeklyEfficiency.push(efficiency);
          }
          
          // Calculate average weekly efficiency (sum of weekly percentages / 4)
          activePercentage = Math.round(weeklyEfficiency.reduce((sum, efficiency) => sum + efficiency, 0) / 4);
          
        } else if (isMarchToOctober) {
          // March-October: Performance % based on Total Patrols
          const expectedMaxPatrols = totalDays * DAILY_ACTIVE_COUNT;
          const rawPercentage = expectedMaxPatrols > 0 ? Math.round((totalPatrols / expectedMaxPatrols) * 100) : 0;
          activePercentage = Math.min(rawPercentage, 100);
        } else {
          // Other months: Use complex weekly efficiency calculation
          const WEEKLY_MIN = 98; // Minimum reports per week (14 × 7)
          const weeklyEfficiency = [];
          
          // Get Action Taken counts from Command Center data for this municipality
          const municipalityActionCounts = commandCenterActionData[item.municipality] || [0, 0, 0, 0];
          
          // Calculate efficiency for each of the 4 weeks
          for (let week = 0; week < 4; week++) {
            const weekStart = week * 7;
            const weekEnd = Math.min(weekStart + 7, totalDays);
            
            if (weekStart < totalDays) {
              const attended = municipalityActionCounts[week] || 0;
              const efficiency = Math.min(Math.floor((attended / WEEKLY_MIN) * 100), 100);
              weeklyEfficiency.push(efficiency);
            } else {
              weeklyEfficiency.push(0);
            }
          }

          const shouldUseCombinedMetric = selectedTopPerformersYear >= 2026;

          if (shouldUseCombinedMetric) {
            const weeklyScore = Math.round(weeklyEfficiency.reduce((sum, efficiency) => sum + efficiency, 0) / 4);
            const activeDaysScore = totalDays > 0 ? Math.round((activeDays / totalDays) * 100) : 0;
            activePercentage = Math.round((weeklyScore * 0.70) + (activeDaysScore * 0.30));
          } else {
            // Backward-compatible behavior for older months/years
            activePercentage = weeklyEfficiency.reduce((sum, efficiency) => sum + efficiency, 0);
          }
        }
        
        // Ensure Performance % stays within 0-100
        activePercentage = Math.max(0, Math.min(Number(activePercentage) || 0, 100));
        
        return {
          ...item,
          activeDays,
          inactiveDays,
          totalDays,
          activePercentage,
          totalPatrols
        };
      })
      .sort((a, b) => {
        // For March to October (months 2-9), sort by total patrols first
        // For November-December 2025, sort by performance percentage (reports attended) first
        // For other months, sort by performance percentage first
        const isMarchToOctober = selectedTopPerformersMonth >= 2 && selectedTopPerformersMonth <= 9;
        const isNovDec2025 = selectedTopPerformersYear === 2025 && (selectedTopPerformersMonth === 10 || selectedTopPerformersMonth === 11);
        
        if (isMarchToOctober) {
          // March to October: Total Patrols is primary metric
          if (b.totalPatrols !== a.totalPatrols) {
            return b.totalPatrols - a.totalPatrols;
          }
          // Secondary: Active Days
          if (b.activeDays !== a.activeDays) {
            return b.activeDays - a.activeDays;
          }
          // Tertiary: Performance Percentage
          return b.activePercentage - a.activePercentage;
        } else if (isNovDec2025) {
          // November-December 2025: Performance % (reports attended) is primary metric
          if (b.activePercentage !== a.activePercentage) {
            return b.activePercentage - a.activePercentage;
          }
          // Secondary: Total Patrols
          if (b.totalPatrols !== a.totalPatrols) {
            return b.totalPatrols - a.totalPatrols;
          }
          // Tertiary: Active Days
          return b.activeDays - a.activeDays;
        } else {
          // Other months: Performance Percentage is primary metric
          if (b.activePercentage !== a.activePercentage) {
            return b.activePercentage - a.activePercentage;
          }
          // Secondary: Active Days
          if (b.activeDays !== a.activeDays) {
            return b.activeDays - a.activeDays;
          }
          // Tertiary: Total Patrols
          return b.totalPatrols - a.totalPatrols;
        }
      })
      .slice(0, 12); // Top 12 performers
  };

  // Function to generate PDF report for Top Performers
  const generateTopPerformersPDF = () => {
    try {
      const topPerformers = getTopPerformers();
      if (topPerformers.length === 0) {
        toast.error('No performance data available to export');
        showError('No performance data available to export');
        return;
      }

      // Create new PDF document
      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      
      // Set font
      doc.setFont('helvetica');
      
      // Get page dimensions
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Add border around the page
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(1);
      doc.rect(20, 20, pageWidth - 40, pageHeight - 40);
      
      // Add title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(59, 130, 246); // Blue color
      doc.text('Top Performers Ranking Report', pageWidth / 2, 50, { align: 'center' });
      
      // Add subtitle
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(`Performance Analysis for ${new Date(selectedTopPerformersYear, selectedTopPerformersMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`, pageWidth / 2, 70, { align: 'center' });
      
      // Add generation date
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
      })}`, pageWidth / 2, 85, { align: 'center' });
      
      // Prepare table data
      const tableData = topPerformers.map((performer, index) => {
        // Use the pre-calculated activePercentage from Criteria tab logic
        const activePercentage = performer.activePercentage;
        
        const getStatusText = () => {
          if (activePercentage >= 96) return 'Very Satisfactory';
          if (activePercentage >= 86) return 'Very Good';
          if (activePercentage >= 75) return 'Good';
          return 'Needs Improvement';
        };

        return [
          index + 1,
          performer.municipality,
          performer.district,
          performer.activeDays,
          performer.totalPatrols,
          `${activePercentage}%`,
          getStatusText()
        ];
      });

      // Add table using autoTable with auto-fit columns
      autoTable(doc, {
        head: [['Rank', 'Municipality', 'District', 'Active\nDays', 'Total\nPatrols', 'Performa\nnce', 'Status']],
        body: tableData,
        startY: 105,
        margin: { left: 30, right: 30 },
        tableWidth: 'auto',
        styles: {
          fontSize: 9,
          cellPadding: 5,
          halign: 'center',
          valign: 'middle',
          lineColor: [200, 200, 200],
          lineWidth: 0.5
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          cellPadding: 6,
          halign: 'center'
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 'auto', minCellWidth: 30 },  // Rank
          1: { halign: 'left', cellWidth: 'auto', minCellWidth: 80 },    // Municipality
          2: { halign: 'center', cellWidth: 'auto', minCellWidth: 70 },  // District
          3: { halign: 'center', cellWidth: 'auto', minCellWidth: 45 },  // Active Days
          4: { halign: 'center', cellWidth: 'auto', minCellWidth: 45 },  // Total Patrols
          5: { halign: 'center', cellWidth: 'auto', minCellWidth: 55 },  // Performance
          6: { halign: 'center', cellWidth: 'auto', minCellWidth: 90 }   // Status
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        didParseCell: function(data) {
          // Color coding for Rank column (Gold, Silver, Bronze)
          if (data.column.index === 0 && data.section === 'body') {
            const rank = parseInt(data.cell.text[0]);
            if (rank === 1) {
              data.cell.styles.fillColor = [255, 215, 0]; // Gold
              data.cell.styles.textColor = [255, 255, 255];
              data.cell.styles.fontStyle = 'bold';
            } else if (rank === 2) {
              data.cell.styles.fillColor = [192, 192, 192]; // Silver
              data.cell.styles.textColor = [0, 0, 0];
              data.cell.styles.fontStyle = 'bold';
            } else if (rank === 3) {
              data.cell.styles.fillColor = [205, 127, 50]; // Bronze
              data.cell.styles.textColor = [255, 255, 255];
              data.cell.styles.fontStyle = 'bold';
            } else {
              data.cell.styles.fillColor = [156, 163, 175]; // Gray
              data.cell.styles.textColor = [255, 255, 255];
              data.cell.styles.fontStyle = 'bold';
            }
          }
          
          // Color coding for status column
          if (data.column.index === 6 && data.section === 'body') {
            const status = data.cell.text[0];
            if (status === 'Very Satisfactory') {
              data.cell.styles.fillColor = [59, 130, 246]; // Blue
              data.cell.styles.textColor = [255, 255, 255];
            } else if (status === 'Very Good') {
              data.cell.styles.fillColor = [34, 197, 94]; // Green
              data.cell.styles.textColor = [255, 255, 255];
            } else if (status === 'Good') {
              data.cell.styles.fillColor = [245, 158, 11]; // Yellow
              data.cell.styles.textColor = [0, 0, 0];
            } else if (status === 'Needs Improvement') {
              data.cell.styles.fillColor = [239, 68, 68]; // Red
              data.cell.styles.textColor = [255, 255, 255];
            }
          }
          
          // Color coding for Active Days column (green)
          if (data.column.index === 3 && data.section === 'body') {
            data.cell.styles.textColor = [34, 197, 94]; // Green
            data.cell.styles.fontStyle = 'bold';
          }
          
          // Color coding for Total Patrols column (blue)
          if (data.column.index === 4 && data.section === 'body') {
            data.cell.styles.textColor = [59, 130, 246]; // Blue
            data.cell.styles.fontStyle = 'bold';
          }
          
          // Color coding for Performance column (purple)
          if (data.column.index === 5 && data.section === 'body') {
            data.cell.styles.textColor = [147, 51, 234]; // Purple
            data.cell.styles.fontStyle = 'bold';
          }
        }
      });

      // Add summary statistics in formal format
      const finalY = doc.lastAutoTable.finalY + 40;
      
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Summary Statistics', 30, finalY);
      
      // Calculate summary stats
      const totalActiveDays = topPerformers.reduce((sum, p) => sum + p.activeDays, 0);
      const totalPatrols = topPerformers.reduce((sum, p) => sum + p.totalPatrols, 0);
      const avgActiveDays = (totalActiveDays / topPerformers.length).toFixed(1);
      const avgPatrols = (totalPatrols / topPerformers.length).toFixed(1);
      const avgPercentage = Math.round(topPerformers.reduce((sum, p) => sum + p.activePercentage, 0) / topPerformers.length);
      
      // Create formal summary table
      const summaryTableData = [
        ['Most Active Municipality', `${topPerformers[0]?.municipality || 'N/A'} (${topPerformers[0]?.activeDays || 0} days)`],
        ['Total Active Days', totalActiveDays.toString()],
        ['Average Active Days', avgActiveDays],
        ['Total Patrols', totalPatrols.toLocaleString()],
        ['Average Patrols', avgPatrols],
        ['Average Performance', `${avgPercentage}%`]
      ];
      
      autoTable(doc, {
        body: summaryTableData,
        startY: finalY + 10,
        margin: { left: 30, right: 30 },
        theme: 'grid',
        styles: {
          fontSize: 10,
          cellPadding: 6,
          lineColor: [200, 200, 200],
          lineWidth: 0.5,
          halign: 'left',
          valign: 'middle'
        },
        columnStyles: {
          0: { 
            fontStyle: 'bold', 
            cellWidth: 140,
            fillColor: [248, 250, 252],
            textColor: [0, 0, 0],
            halign: 'left'
          },
          1: { 
            cellWidth: 'auto',
            textColor: [0, 0, 0],
            halign: 'left'
          }
        },
        didParseCell: function(data) {
          // Highlight the Most Active Municipality value in green
          if (data.row.index === 0 && data.column.index === 1) {
            data.cell.styles.textColor = [34, 197, 94]; // Green
            data.cell.styles.fontStyle = 'bold';
          }
          // Highlight numeric values
          if (data.column.index === 1 && data.row.index > 0) {
            data.cell.styles.fontStyle = 'bold';
          }
        }
      });

      // Add Prepared By and Approved By sections after summary statistics
      // Add roughly 1 inch (72pt) of space above the signature blocks
      const signatureY = Math.min(doc.lastAutoTable.finalY + 72, pageHeight - 120);

      // Common horizontal padding inside the page border
      const signatureMarginX = 40; // left & right padding from border

      // X positions for the two blocks
      const preparedX = signatureMarginX; // left block
      // Right block: keep a right padding while allowing enough width for the full title on one line
      const approvedX = pageWidth - signatureMarginX - 220;

      // Prepared By: aligned using common left padding
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text('Prepared By:', preparedX, signatureY);

      // Prepared By name (add ~0.5 inch ≈ 36pt below label)
      doc.setFont('helvetica', 'bold');
      doc.text('Peter Carlos V. Ronquillo', preparedX, signatureY + 36);

      // Prepared By position (smaller gap below name)
      doc.setFont('helvetica', 'normal');
      doc.text('Security Agent I', preparedX, signatureY + 52);

      // Approved By label
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text('Approved By:', approvedX, signatureY);

      // Approved By name (add ~0.5 inch ≈ 36pt below label)
      doc.setFont('helvetica', 'bold');
      doc.text('Jeffrey T. Calma', approvedX, signatureY + 36);

      // Approved By position (single line title, kept within right margin)
      doc.setFont('helvetica', 'normal');
      doc.text('OIC - Office of the Provincial Governor', approvedX, signatureY + 52);

      // Add footer
      const footerY = pageHeight - 40;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(0, 0, 0);
      doc.text('Report generated by iPatroller Management System', pageWidth / 2, footerY, { align: 'center' });
      doc.text('Page 1 of 1', pageWidth / 2, footerY + 15, { align: 'center' });

      // Save the PDF
      const fileName = `top-performers-ranking-${selectedTopPerformersMonth + 1}-${selectedTopPerformersYear}.pdf`;
      doc.save(fileName);

      toast.success('PDF report generated successfully', {
        description: `Top Performers Ranking report saved as ${fileName}`,
        duration: 3000,
        position: 'top-right',
        style: { background: 'white' },
      });
      showSuccess('PDF report generated successfully!');

    } catch (error) {
      ipatrollerLog('Error generating PDF:', error, 'error');
      toast.error('Failed to generate PDF report', {
        description: 'Please try again or contact support if the issue persists',
        duration: 4000,
        position: 'top-right',
        style: { background: 'white' },
      });
      showError('Failed to generate PDF report');
    }
  };

  // Function to generate Range PDF report for Top Performers (multiple months)
  const generateRangePDF = async () => {
    try {
      // Create new PDF document
      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      
      // Get page dimensions
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Calculate the range of months to include
      const fromDate = new Date(pdfFromYear, pdfFromMonth);
      const toDate = new Date(pdfToYear, pdfToMonth);
      
      let currentDate = new Date(fromDate);
      let pageCount = 0;
      
      // Loop through each month in the range
      while (currentDate <= toDate) {
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        // Load data for this specific month directly
        console.log(`🔍 Loading data for ${new Date(currentYear, currentMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`);
        const monthData = await loadTopPerformersDataForMonth(currentMonth, currentYear);
        console.log(`📊 Loaded ${monthData.length} performers for ${new Date(currentYear, currentMonth).toLocaleDateString("en-US", { month: "long" })}:`, monthData.slice(0, 3));
        
        if (pageCount > 0) {
          doc.addPage(); // Add new page for each month after the first
        }
        pageCount++;
        
        // Add border around the page
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(1);
        doc.rect(20, 20, pageWidth - 40, pageHeight - 40);
        
        // Add title
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(59, 130, 246); // Blue color
        doc.text('Top Performers Ranking Report', pageWidth / 2, 50, { align: 'center' });
        
        // Add subtitle with current month
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(`Performance Analysis for ${new Date(currentYear, currentMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`, pageWidth / 2, 70, { align: 'center' });
        
        // Add generation date
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric'
        })}`, pageWidth / 2, 85, { align: 'center' });
        
        if (monthData && monthData.length > 0) {
          // Prepare table data for this month
          const tableData = monthData.map((performer, index) => {
            const activePercentage = performer.activePercentage;
            
            const getStatusText = () => {
              if (activePercentage >= 96) return 'Very Satisfactory';
              if (activePercentage >= 86) return 'Very Good';
              if (activePercentage >= 75) return 'Good';
              return 'Needs Improvement';
            };

            return [
              index + 1,
              performer.municipality,
              performer.district,
              performer.activeDays,
              performer.totalPatrols,
              `${activePercentage}%`,
              getStatusText()
            ];
          });

          // Add table using autoTable
          autoTable(doc, {
            head: [['Rank', 'Municipality', 'District', 'Active\nDays', 'Total\nPatrols', 'Performa\nnce', 'Status']],
            body: tableData,
            startY: 105,
            margin: { left: 30, right: 30 },
            tableWidth: 'auto',
            styles: {
              fontSize: 9,
              cellPadding: 5,
              halign: 'center',
              valign: 'middle',
              lineColor: [200, 200, 200],
              lineWidth: 0.5
            },
            headStyles: {
              fillColor: [59, 130, 246],
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              fontSize: 9,
              cellPadding: 6,
              halign: 'center'
            },
            columnStyles: {
              0: { halign: 'center', cellWidth: 'auto', minCellWidth: 30 },
              1: { halign: 'left', cellWidth: 'auto', minCellWidth: 80 },
              2: { halign: 'center', cellWidth: 'auto', minCellWidth: 70 },
              3: { halign: 'center', cellWidth: 'auto', minCellWidth: 45 },
              4: { halign: 'center', cellWidth: 'auto', minCellWidth: 45 },
              5: { halign: 'center', cellWidth: 'auto', minCellWidth: 55 },
              6: { halign: 'center', cellWidth: 'auto', minCellWidth: 90 }
            },
            alternateRowStyles: {
              fillColor: [248, 250, 252]
            },
            didParseCell: function(data) {
              // Color coding for Rank column (Gold, Silver, Bronze)
              if (data.column.index === 0 && data.section === 'body') {
                const rank = parseInt(data.cell.text[0]);
                if (rank === 1) {
                  data.cell.styles.fillColor = [255, 215, 0]; // Gold
                  data.cell.styles.textColor = [255, 255, 255];
                  data.cell.styles.fontStyle = 'bold';
                } else if (rank === 2) {
                  data.cell.styles.fillColor = [192, 192, 192]; // Silver
                  data.cell.styles.textColor = [0, 0, 0];
                  data.cell.styles.fontStyle = 'bold';
                } else if (rank === 3) {
                  data.cell.styles.fillColor = [205, 127, 50]; // Bronze
                  data.cell.styles.textColor = [255, 255, 255];
                  data.cell.styles.fontStyle = 'bold';
                } else {
                  data.cell.styles.fillColor = [156, 163, 175]; // Gray
                  data.cell.styles.textColor = [255, 255, 255];
                  data.cell.styles.fontStyle = 'bold';
                }
              }
              
              // Color coding for status column
              if (data.column.index === 6 && data.section === 'body') {
                const status = data.cell.text[0];
                if (status === 'Very Satisfactory') {
                  data.cell.styles.fillColor = [59, 130, 246];
                  data.cell.styles.textColor = [255, 255, 255];
                } else if (status === 'Very Good') {
                  data.cell.styles.fillColor = [34, 197, 94];
                  data.cell.styles.textColor = [255, 255, 255];
                } else if (status === 'Good') {
                  data.cell.styles.fillColor = [245, 158, 11];
                  data.cell.styles.textColor = [0, 0, 0];
                } else if (status === 'Needs Improvement') {
                  data.cell.styles.fillColor = [239, 68, 68];
                  data.cell.styles.textColor = [255, 255, 255];
                }
              }
              
              // Color coding for columns
              if (data.column.index === 3 && data.section === 'body') {
                data.cell.styles.textColor = [34, 197, 94]; // Green
                data.cell.styles.fontStyle = 'bold';
              }
              if (data.column.index === 4 && data.section === 'body') {
                data.cell.styles.textColor = [59, 130, 246]; // Blue
                data.cell.styles.fontStyle = 'bold';
              }
              if (data.column.index === 5 && data.section === 'body') {
                data.cell.styles.textColor = [147, 51, 234]; // Purple
                data.cell.styles.fontStyle = 'bold';
              }
            }
          });

          // Add summary statistics
          const finalY = doc.lastAutoTable.finalY + 40;
          
          doc.setFontSize(13);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 0);
          doc.text('Summary Statistics', 30, finalY);
          
          // Calculate summary stats for this month
          const totalActiveDays = monthData.reduce((sum, p) => sum + p.activeDays, 0);
          const totalPatrols = monthData.reduce((sum, p) => sum + p.totalPatrols, 0);
          const avgActiveDays = (totalActiveDays / monthData.length).toFixed(1);
          const avgPatrols = (totalPatrols / monthData.length).toFixed(1);
          const avgPercentage = Math.round(monthData.reduce((sum, p) => sum + p.activePercentage, 0) / monthData.length);
          
          const summaryTableData = [
            ['Most Active Municipality', `${monthData[0]?.municipality || 'N/A'} (${monthData[0]?.activeDays || 0} days)`],
            ['Total Active Days', totalActiveDays.toString()],
            ['Average Active Days', avgActiveDays],
            ['Total Patrols', totalPatrols.toLocaleString()],
            ['Average Patrols', avgPatrols],
            ['Average Performance', `${avgPercentage}%`]
          ];
          
          autoTable(doc, {
            body: summaryTableData,
            startY: finalY + 10,
            margin: { left: 30, right: 30 },
            theme: 'grid',
            styles: {
              fontSize: 10,
              cellPadding: 6,
              lineColor: [200, 200, 200],
              lineWidth: 0.5,
              halign: 'left',
              valign: 'middle'
            },
            columnStyles: {
              0: { 
                fontStyle: 'bold', 
                cellWidth: 140,
                fillColor: [248, 250, 252],
                textColor: [0, 0, 0],
                halign: 'left'
              },
              1: { 
                cellWidth: 'auto',
                textColor: [0, 0, 0],
                halign: 'left'
              }
            },
            didParseCell: function(data) {
              if (data.row.index === 0 && data.column.index === 1) {
                data.cell.styles.textColor = [34, 197, 94];
                data.cell.styles.fontStyle = 'bold';
              }
              if (data.column.index === 1 && data.row.index > 0) {
                data.cell.styles.fontStyle = 'bold';
              }
            }
          });

          // Signatures for range PDF (match single-month layout)
          const rangeSignatureY = doc.lastAutoTable.finalY + 80;

          // Common horizontal padding inside the page border
          const rangeSignatureMarginX = 40; // same as single-month

          // X positions for the two blocks
          const rangePreparedX = rangeSignatureMarginX;
          const rangeApprovedX = pageWidth - rangeSignatureMarginX - 220;

          // Prepared By block (left)
          doc.setFontSize(11);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          doc.text('Prepared By:', rangePreparedX, rangeSignatureY);

          doc.setFont('helvetica', 'bold');
          doc.text('Peter Carlos V. Ronquillo', rangePreparedX, rangeSignatureY + 36);

          doc.setFont('helvetica', 'normal');
          doc.text('Security Agent I', rangePreparedX, rangeSignatureY + 52);

          // Approved By block (right)
          doc.setFontSize(11);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          doc.text('Approved By:', rangeApprovedX, rangeSignatureY);

          doc.setFont('helvetica', 'bold');
          doc.text('Jeffrey T. Calma', rangeApprovedX, rangeSignatureY + 36);

          doc.setFont('helvetica', 'normal');
          doc.text('OIC - Office of the Provincial Governor', rangeApprovedX, rangeSignatureY + 52);
        } else {
          // No data for this month in range PDF
          doc.setTextColor(100, 100, 100);
          doc.setFontSize(11);
          doc.text('No performance data available for this month', pageWidth / 2, 200, { align: 'center' });
        }

        // Add footer
        const footerY = pageHeight - 40;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(0, 0, 0);
        doc.text('Report generated by iPatroller Management System', pageWidth / 2, footerY, { align: 'center' });
        
        // Calculate total pages
        const totalMonths = Math.ceil((toDate.getYear() - fromDate.getYear()) * 12 + (toDate.getMonth() - fromDate.getMonth())) + 1;
        doc.text(`Page ${pageCount} of ${totalMonths}`, pageWidth / 2, footerY + 15, { align: 'center' });
        
        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      
      // Save the PDF
      const fromMonthName = new Date(pdfFromYear, pdfFromMonth).toLocaleDateString("en-US", { month: "short" });
      const toMonthName = new Date(pdfToYear, pdfToMonth).toLocaleDateString("en-US", { month: "short" });
      const fileName = `top-performers-range-${fromMonthName}-${toMonthName}-${pdfFromYear}.pdf`;
      doc.save(fileName);
      
      toast.success('Range PDF report generated successfully', {
        description: `Top Performers Range report saved as ${fileName}`,
        duration: 3000,
        position: 'top-right',
        style: { background: 'white' },
      });
      showSuccess('Range PDF report generated successfully!');
      
    } catch (error) {
      console.error('Error generating range PDF:', error);
      toast.error('Failed to generate range PDF report', {
        description: 'Please try again or contact support if the issue persists',
        duration: 4000,
        position: 'top-right',
        style: { background: 'white' },
      });
      showError('Failed to generate range PDF report');
      throw error;
    }
  };

  // Helper function to load Top Performers data for a specific month
  const loadTopPerformersDataForMonth = async (month, year) => {
    try {
      console.log(`🔄 loadTopPerformersDataForMonth called for ${new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`);
      
      // Load the actual Top Performers data for the specified month/year
      const tempFilteredData = await loadTopPerformersDataDirectly(month, year);
      console.log(`📥 Raw data loaded:`, tempFilteredData.length, 'items');
      
      if (!tempFilteredData || tempFilteredData.length === 0) {
        console.log(`❌ No data available for ${new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`);
        return [];
      }

      // Apply the same ranking logic as getTopPerformers() but for this specific month's data
      const isMarchToOctober = month >= 2 && month <= 9;
      console.log(`📅 Month ${month + 1} is ${isMarchToOctober ? 'March-October' : 'Other months'} - using ${isMarchToOctober ? 'Total Patrols' : 'Performance %'} priority`);
      
      const sortedData = [...tempFilteredData].sort((a, b) => {
        if (isMarchToOctober) {
          // March-October: Primary = Total Patrols, Secondary = Active Days, Tertiary = Performance %
          if (b.totalPatrols !== a.totalPatrols) return b.totalPatrols - a.totalPatrols;
          if (b.activeDays !== a.activeDays) return b.activeDays - a.activeDays;
          return b.activePercentage - a.activePercentage;
        } else {
          // Other months: Primary = Performance %, Secondary = Active Days, Tertiary = Total Patrols
          if (b.activePercentage !== a.activePercentage) return b.activePercentage - a.activePercentage;
          if (b.activeDays !== a.activeDays) return b.activeDays - a.activeDays;
          return b.totalPatrols - a.totalPatrols;
        }
      });

      // Return top 12 performers
      const top12 = sortedData.slice(0, 12);
      console.log(`🏆 Top 3 performers for ${new Date(year, month).toLocaleDateString("en-US", { month: "long" })}:`);
      top12.slice(0, 3).forEach((performer, index) => {
        console.log(`${index + 1}. ${performer.municipality}: ${performer.activeDays} active days, ${performer.totalPatrols} patrols, ${performer.activePercentage}%`);
      });
      return top12;
      
    } catch (error) {
      console.error('Error loading data for month:', month, year, error);
      return [];
    }
  };

  // Function to directly load Top Performers data for any month/year
  const loadTopPerformersDataDirectly = async (month, year) => {
    try {
      // Create month-year ID for the specified month
      const monthYearId = `${String(month + 1).padStart(2, "0")}-${year}`;
      console.log(`🔍 Loading Firestore data for monthYearId: ${monthYearId}`);
      
      // Check if it's a locked "No Entry" month
      const lockedNoEntryMonths = [0, 1]; // January, February 2025
      const isLockedNoEntry = lockedNoEntryMonths.includes(month) && year === 2025;
      
      if (isLockedNoEntry) {
        return []; // No data for locked months
      }

      // Try to get data from Firestore for this specific month
      const monthDocRef = doc(db, 'patrolData', monthYearId);
      const municipalitiesRef = collection(monthDocRef, 'municipalities');
      
      const snapshot = await getDocs(municipalitiesRef);
      const firestoreData = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data) {
          firestoreData.push({
            id: doc.id,
            ...data
          });
        }
      });
      
      console.log(`📦 Found ${firestoreData.length} documents in Firestore for ${monthYearId}`);

      // If no Firestore data, create default structure
      if (firestoreData.length === 0) {
        const defaultData = [];
        Object.entries(municipalitiesByDistrict).forEach(([district, municipalities]) => {
          municipalities.forEach((municipality) => {
            defaultData.push({
              id: `${district}-${municipality}`,
              municipality,
              district,
              data: new Array(31).fill(0), // Default to 0 patrols
              totalPatrols: 0,
              activeDays: 0,
              inactiveDays: 0,
              activePercentage: 0,
            });
          });
        });
        return defaultData;
      }

      // Process the Firestore data to ensure it has all the calculated fields
      const processedData = firestoreData.map(item => {
        // Always recalculate the fields to ensure they're correct for this month
        console.log(`🔧 Processing ${item.municipality} for ${new Date(year, month).toLocaleDateString("en-US", { month: "long" })}`);
        console.log(`📊 Raw item data:`, { totalPatrols: item.totalPatrols, activeDays: item.activeDays, activePercentage: item.activePercentage });
        
        // Always recalculate instead of using stored values
        if (true) { // Changed from checking undefined to always recalculate
          // Calculate from raw data if needed
          const dailyData = item.data || [];
          console.log(`📅 ${item.municipality} daily data (first 10 days):`, dailyData.slice(0, 10));
          const totalPatrols = dailyData.reduce((sum, day) => sum + (day || 0), 0);
          const activeDays = dailyData.filter(day => (day || 0) >= DAILY_ACTIVE_COUNT).length;
          console.log(`📈 ${item.municipality}: ${totalPatrols} total patrols, ${activeDays} active days from ${dailyData.length} days`);
          
          // Calculate performance percentage based on month type
          const isMarchToOctober = month >= 2 && month <= 9;
          let activePercentage = 0;
          
          if (isMarchToOctober) {
            // March-October: (Total Patrols / Expected Max Patrols) × 100 - CAPPED AT 100%
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const expectedMaxPatrols = daysInMonth * DAILY_ACTIVE_COUNT;
            const rawPercentage = expectedMaxPatrols > 0 ? Math.round((totalPatrols / expectedMaxPatrols) * 100) : 0;
            activePercentage = Math.min(rawPercentage, 100); // Cap at 100%
            console.log(`🧮 ${item.municipality}: ${totalPatrols} patrols / ${expectedMaxPatrols} expected = ${rawPercentage}% → capped at ${activePercentage}%`);
          } else {
            // Other months: Use existing percentage or calculate from active days
            activePercentage = item.activePercentage || (dailyData.length > 0 ? Math.round((activeDays / dailyData.length) * 100) : 0);
            console.log(`🧮 ${item.municipality}: ${activeDays} active days / ${dailyData.length} total days = ${activePercentage}%`);
          }
          
          return {
            ...item,
            totalPatrols,
            activeDays,
            activePercentage
          };
        }
        
        return item;
      });

      return processedData;
      
    } catch (error) {
      console.error('Error loading direct data for month:', month, year, error);
      return [];
    }
  };

  const filteredData = patrolData
    .filter((item) => {
      const matchesDistrict =
        selectedDistrict === "ALL" || item.district === selectedDistrict;
      const matchesSearch = item.municipality
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchesDistrict && matchesSearch;
    })
    .sort((a, b) => {
      // Sort by district first, then by municipality order within each district
      const districtOrder = ["1ST DISTRICT", "2ND DISTRICT", "3RD DISTRICT"];
      const districtA = districtOrder.indexOf(a.district);
      const districtB = districtOrder.indexOf(b.district);
      if (districtA !== districtB) {
        return districtA - districtB;
      }
      // Sort by municipality order within district
      const municipalitiesInDistrict = municipalitiesByDistrict[a.district];
      const municipalityA = municipalitiesInDistrict.indexOf(a.municipality);
      const municipalityB = municipalitiesInDistrict.indexOf(b.municipality);
      return municipalityA - municipalityB;
    });

  // Group filtered data by district
  const groupedData = filteredData.reduce((acc, item) => {
    if (!acc[item.district]) {
      acc[item.district] = [];
    }
    acc[item.district].push(item);
    return acc;
  }, {});

  const getDistrictSummary = (district) => {
    const districtData = patrolData.filter(
      (item) => item.district === district,
    );
    const totalPatrols = districtData.reduce(
      (sum, item) => sum + item.totalPatrols,
      0,
    );
    const totalActive = districtData.reduce(
      (sum, item) => sum + item.activeDays,
      0,
    );
    const totalInactive = districtData.reduce(
      (sum, item) => sum + item.inactiveDays,
      0,
    );
    const avgActivePercentage =
      districtData.length > 0
        ? Math.round(
            districtData.reduce((sum, item) => sum + item.activePercentage, 0) /
              districtData.length,
          )
        : 0;
    return {
      totalPatrols,
      totalActive,
      totalInactive,
      avgActivePercentage,
      municipalityCount: districtData.length,
    };
  };

  // Calculate active and inactive counts per day, then sum for the month
  // This shows cumulative monthly totals: how many municipalities were active/inactive each day
  const { activeDays, inactiveDays } = (() => {
    let totalActive = 0;
    let totalInactive = 0;
    let totalWarning = 0;
    
    // Iterate through each day of the month
    const daysInMonth = selectedDates.length;
    for (let dayIndex = 0; dayIndex < daysInMonth; dayIndex++) {
      let activeMunicipalitiesThisDay = 0;
      let inactiveMunicipalitiesThisDay = 0;
      let warningMunicipalitiesThisDay = 0;
      
      // For each day, count how many municipalities are active/inactive
      patrolData.forEach((municipality) => {
        const patrols = municipality.data[dayIndex];
        
        // Only count if there's actual patrol data (not null/undefined)
        if (patrols !== null && patrols !== undefined && patrols !== '') {
          if (patrols >= DAILY_ACTIVE_COUNT) {
            activeMunicipalitiesThisDay++;
          }
          else if (patrols === DAILY_WARNING_COUNT) {
            warningMunicipalitiesThisDay++;
          }
          else {
            inactiveMunicipalitiesThisDay++;
          }
        }
      });
      
      // Add this day's counts to the monthly total
      totalActive += activeMunicipalitiesThisDay;
      totalInactive += inactiveMunicipalitiesThisDay;
    }
    
    return { activeDays: totalActive, inactiveDays: totalInactive };
  })();

  const overallSummary = {
    totalPatrols: patrolData.reduce((sum, item) => sum + item.totalPatrols, 0),
    totalActive: activeDays, // Total number of active days across all municipalities
    totalInactive: inactiveDays, // Total number of inactive days (only counting days with patrols < required barangays)
    avgActivePercentage:
      patrolData.length > 0
        ? Math.round(
            (activeDays / (activeDays + inactiveDays)) * 100
          )
        : 0,
    municipalityCount: patrolData.length,
  };

  // Generate preview data for the report based on IPatroller daily counts
  const generatePreviewData = () => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    // Calculate additional statistics based on daily counts
    const totalDaysInMonth = selectedDates.length;
    const totalPossibleDays = patrolData.length * totalDaysInMonth;
    const daysWithData = patrolData.reduce((acc, municipality) => {
      return acc + municipality.data.filter(day => day !== null && day !== undefined && day !== '').length;
    }, 0);

    const previewData = {
      title: "I-Patroller Monthly Summary Report",
      generatedDate: new Date().toLocaleDateString(),
      month: months[selectedMonth],
      year: selectedYear,
      reportPeriod: new Date(selectedYear, selectedMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      dataSource: "Based on IPatroller Daily Counts",
      totalDaysInMonth,
      totalPossibleDays,
      daysWithData,
      dataCompleteness: totalPossibleDays > 0 ? Math.round((daysWithData / totalPossibleDays) * 100) : 0,
      overallSummary: overallSummary,
      districtSummary: Object.keys(groupedData).map(district => ({
        district,
        ...getDistrictSummary(district)
      })),
      municipalityPerformance: patrolData.map(item => ({
        municipality: item.municipality,
        district: item.district,
        requiredBarangays: barangayCounts[item.municipality] || 0,
        totalPatrols: item.totalPatrols,
        activeDays: item.activeDays,
        inactiveDays: item.inactiveDays,
        activePercentage: item.activePercentage,
        dailyData: item.data // Include daily data for reference
      }))
    };

    // Log to verify data source
    // Generate summary report based on IPatroller daily counts
    const reportData = {
      totalMunicipalities: patrolData.length,
      totalDaysInMonth: totalDaysInMonth,
      daysWithData: daysWithData,
      dataCompleteness: previewData.dataCompleteness + '%',
      overallSummary: overallSummary
    };

    setPreviewData(previewData);
    setShowPrintPreview(true);
  };

  // Generate Monthly Summary Report
  const generateMonthlySummaryReport = () => {
    setIsGeneratingReport(true);
    
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      
      // Header - Centered with tighter top spacing
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      const pageWidth = doc.internal.pageSize.width;
      const titleWidth = doc.getTextWidth('I-Patroller Monthly Summary Report');
      doc.text('I-Patroller Monthly Summary Report', (pageWidth - titleWidth) / 2, 20);
      
      // Report details - tighter vertical spacing
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const generatedText = `Generated: ${new Date().toLocaleDateString()}`;
      const monthText = `Month: ${months[selectedMonth]} ${selectedYear}`;
      const periodText = `Report Period: ${new Date(selectedYear, selectedMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
      const dataSourceText = `Data Source: Based on IPatroller Daily Counts`;
      
      const generatedWidth = doc.getTextWidth(generatedText);
      const monthWidth = doc.getTextWidth(monthText);
      const periodWidth = doc.getTextWidth(periodText);
      const dataSourceWidth = doc.getTextWidth(dataSourceText);
      
      doc.text(generatedText, (pageWidth - generatedWidth) / 2, 30);
      doc.text(monthText, (pageWidth - monthWidth) / 2, 36);
      doc.text(periodText, (pageWidth - periodWidth) / 2, 42);
      doc.text(dataSourceText, (pageWidth - dataSourceWidth) / 2, 48);
      
      // District Summary Table - matching preview format
      if (Object.keys(groupedData).length > 0) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('District Summary', 20, 55);
        
        const districtTableData = Object.keys(groupedData).map(district => {
          const summary = getDistrictSummary(district);
          return [
            district,
            summary.municipalityCount.toString(),
            summary.totalPatrols.toLocaleString(),
            summary.totalActive.toString(),
            summary.totalInactive.toString(),
            `${summary.avgActivePercentage}%`
          ];
        });
        
        autoTable(doc, {
          head: [['District', 'Municipalities', 'Total Patrols', 'Active Days', 'Inactive Days', 'Avg Active %']],
          body: districtTableData,
          startY: 60,
          styles: {
            fontSize: 9,
            cellPadding: 2,
            overflow: 'linebreak',
            halign: 'left',
            lineColor: [0, 0, 0],
            lineWidth: 0.1
          },
          headStyles: {
            fillColor: [59, 130, 246], // Blue background like preview
            fontStyle: 'bold',
            textColor: [255, 255, 255],
            fontSize: 10,
            lineColor: [0, 0, 0],
            lineWidth: 0.1
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252] // Light gray alternating rows like preview
          },
          columnStyles: {
            0: { cellWidth: 'auto', halign: 'left' },
            1: { cellWidth: 'auto', halign: 'center' },
            2: { cellWidth: 'auto', halign: 'center' },
            3: { cellWidth: 'auto', halign: 'center' },
            4: { cellWidth: 'auto', halign: 'center' },
            5: { cellWidth: 'auto', halign: 'center' }
          },
          margin: { left: 20, right: 20 },
          tableWidth: 'auto',
          showHead: 'everyPage',
          pageBreak: 'auto',
          didDrawPage: function (data) {
            // Add page numbers
            const pageCount = doc.internal.getNumberOfPages();
            const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
            doc.setFontSize(8);
            doc.text(`Page ${currentPage} of ${pageCount}`, 20, doc.internal.pageSize.height - 10);
          }
        });
      }
      
      // Municipality Performance Table - matching preview format
      if (patrolData.length > 0) {
        const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 200;
        
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Municipality Performance', 20, finalY);
        
        const municipalityTableData = patrolData.map(item => [
          item.municipality,
          item.district,
          (barangayCounts[item.municipality] || 0).toString(),
          item.totalPatrols.toLocaleString(),
          item.activeDays.toString(),
          item.inactiveDays.toString(),
          `${item.activePercentage}%`
        ]);
        
        autoTable(doc, {
          head: [['Municipality', 'District', 'Required Barangays', 'Total Patrols', 'Active Days', 'Inactive Days', 'Active %']],
          body: municipalityTableData,
          startY: finalY + 7,
          styles: {
            fontSize: 8,
            cellPadding: 2,
            overflow: 'linebreak',
            halign: 'left',
            lineColor: [0, 0, 0],
            lineWidth: 0.1
          },
          headStyles: {
            fillColor: [34, 197, 94], // Green background like preview
            fontStyle: 'bold',
            textColor: [255, 255, 255],
            fontSize: 9,
            lineColor: [0, 0, 0],
            lineWidth: 0.1
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252] // Light gray alternating rows like preview
          },
          columnStyles: {
            0: { cellWidth: 'auto', halign: 'left' },
            1: { cellWidth: 'auto', halign: 'left' },
            2: { cellWidth: 'auto', halign: 'center' },
            3: { cellWidth: 'auto', halign: 'center' },
            4: { cellWidth: 'auto', halign: 'center' },
            5: { cellWidth: 'auto', halign: 'center' },
            6: { cellWidth: 'auto', halign: 'center' }
          },
          margin: { left: 20, right: 20 },
          tableWidth: 'auto',
          showHead: 'everyPage',
          pageBreak: 'auto',
          didDrawPage: function (data) {
            // Add page numbers
            const pageCount = doc.internal.getNumberOfPages();
            const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
            doc.setFontSize(8);
            doc.text(`Page ${currentPage} of ${pageCount}`, 20, doc.internal.pageSize.height - 10);
          }
        });
        
        // Overall Summary Statistics - auto-fit table layout
        const summaryY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 200;
        
        // Separator
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.line(20, summaryY, pageWidth - 20, summaryY);
        
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Overall Summary Statistics', 20, summaryY + 10);
        
        // Two-column key/value table that auto-fits to page width
        const summaryRows = [
          ['Total Patrols', overallSummary.totalPatrols.toLocaleString(), 'Average Active Percentage', `${overallSummary.avgActivePercentage}%`],
          ['Total Active Days', overallSummary.totalActive.toLocaleString(), 'Total Municipalities', `${overallSummary.municipalityCount}`],
          ['Total Inactive Days', overallSummary.totalInactive.toLocaleString(), '', '']
        ];
        
        autoTable(doc, {
          head: [['Metric', 'Value', 'Metric', 'Value']],
          body: summaryRows,
          startY: summaryY + 16,
          margin: { left: 20, right: 20 },
          tableWidth: 'auto',
          styles: { fontSize: 9, cellPadding: 3, lineWidth: 0.1, lineColor: [0,0,0] },
          headStyles: { fillColor: [243, 244, 246], textColor: [0,0,0], fontStyle: 'bold' },
          columnStyles: {
            0: { cellWidth: 'auto', halign: 'left' },
            1: { cellWidth: 'auto', halign: 'center' },
            2: { cellWidth: 'auto', halign: 'left' },
            3: { cellWidth: 'auto', halign: 'center' }
          }
        });
        
      } else {
        // No data message
        const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 200;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'italic');
        doc.text('No patrol data available for the selected period.', 20, finalY);
        
        // Overall Summary Statistics - even when no data, show as auto-fit table
        const summaryY = finalY + 10;
        
        // Separator
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.line(20, summaryY, pageWidth - 20, summaryY);
        
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Overall Summary Statistics', 20, summaryY + 10);
        
        const summaryRowsNoData = [
          ['Total Patrols', overallSummary.totalPatrols.toLocaleString(), 'Average Active Percentage', `${overallSummary.avgActivePercentage}%`],
          ['Total Active Days', overallSummary.totalActive.toLocaleString(), 'Total Municipalities', `${overallSummary.municipalityCount}`],
          ['Total Inactive Days', overallSummary.totalInactive.toLocaleString(), '', '']
        ];
        
        autoTable(doc, {
          head: [['Metric', 'Value', 'Metric', 'Value']],
          body: summaryRowsNoData,
          startY: summaryY + 16,
          margin: { left: 20, right: 20 },
          tableWidth: 'auto',
          styles: { fontSize: 9, cellPadding: 3, lineWidth: 0.1, lineColor: [0,0,0] },
          headStyles: { fillColor: [243, 244, 246], textColor: [0,0,0], fontStyle: 'bold' },
          columnStyles: {
            0: { cellWidth: 'auto', halign: 'left' },
            1: { cellWidth: 'auto', halign: 'center' },
            2: { cellWidth: 'auto', halign: 'left' },
            3: { cellWidth: 'auto', halign: 'center' }
          }
        });
      }
      
      // Save the PDF
      const fileName = `ipatroller-monthly-summary-${months[selectedMonth]}-${selectedYear}.pdf`;
      doc.save(fileName);
      
      // Show success toast
      toast.success('Monthly Summary Report Generated', {
        description: `Report saved as ${fileName}`,
        duration: 3000,
        position: 'top-right',
        style: { background: 'white' },
      });
      showSuccess('Monthly Summary Report Generated!');
      
    } catch (error) {
      ipatrollerLog('Error generating report:', error, 'error');
      toast.error('Failed to generate report', {
        description: error.message || 'An error occurred while generating the report',
        duration: 4000,
        position: 'top-right',
        style: { background: 'white' },
      });
      showError('Failed to generate report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <Layout onLogout={onLogout} onNavigate={onNavigate} currentPage={currentPage}>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 w-full px-4 sm:px-6 lg:px-8 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 py-3 border-b border-slate-200">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">I-Patroller Management</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">
              {new Date(selectedYear, selectedMonth).toLocaleDateString(
                "en-US",
                { month: "long", year: "numeric" },
              )} • Patrol Activity Dashboard
            </p>
            {false && (
              <div className="flex items-center gap-2 mt-2">
                <div className={`w-2 h-2 rounded-full ${
                  firestoreStatus === 'connected' ? 'bg-green-500' : 
                  firestoreStatus === 'connecting' ? 'bg-yellow-500' : 
                  firestoreStatus === 'error' ? 'bg-red-500' : 'bg-gray-500'
                }`}></div>
                <span className="text-xs font-medium text-gray-600">
                  {firestoreStatus === 'connected' ? 'Firestore Connected' :
                   firestoreStatus === 'connecting' ? 'Connecting to Firestore...' :
                   firestoreStatus === 'error' ? 'Firestore Error - Using Local' :
                   'Offline Mode - Local Storage'}
                </span>
                {firestoreStatus === 'error' && (
                  <Button
                    onClick={loadPatrolDataFromFirestore}
                    size="sm"
                    variant="outline"
                    className="ml-2 h-6 px-2 text-xs"
                  >
                    <Wifi className="w-3 h-3 mr-1" />
                    Retry
                  </Button>
                )}
              </div>
            )}
          </div>
          <div className="w-full sm:w-auto sm:ml-auto">
            <button
              onClick={() => syncToFirestore()}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-300 bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none w-full sm:w-auto"
            >
              <Save className="w-4 h-4" />
              Save Data
            </button>
          </div>
        </div>

        <div className="w-full px-4 sm:px-6 lg:px-8 mt-3 sm:mt-4">
          <div className="flex flex-col lg:flex-row lg:items-stretch gap-3">
            <div className="w-full lg:max-w-3xl">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-1 sm:gap-2 mr-auto">
                <Card className="bg-white shadow-sm border border-gray-200">
                  <CardContent className="py-1.5 px-2.5 sm:py-2 sm:px-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500 mb-0.5 truncate">Total Patrols</p>
                        <p className="text-xl sm:text-2xl font-bold text-blue-600">
                          {overallSummary.totalPatrols.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-1 sm:p-1.5 bg-blue-100 rounded-lg flex-shrink-0">
                        <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border border-gray-200">
                  <CardContent className="py-1.5 px-2.5 sm:py-2 sm:px-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500 mb-0.5 truncate">Active Card Counts</p>
                        <p className="text-xl sm:text-2xl font-bold text-green-600">
                          {overallSummary.totalActive.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0">Monthly Total</p>
                      </div>
                      <div className="p-1 sm:p-1.5 bg-green-100 rounded-lg flex-shrink-0">
                        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border border-gray-200">
                  <CardContent className="py-1.5 px-2.5 sm:py-2 sm:px-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500 mb-0.5 truncate">Inactive Card Counts</p>
                        <p className="text-xl sm:text-2xl font-bold text-red-600">
                          {overallSummary.totalInactive.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0">Monthly Total</p>
                      </div>
                      <div className="p-1 sm:p-1.5 bg-red-100 rounded-lg flex-shrink-0">
                        <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border border-gray-200">
                  <CardContent className="py-1.5 px-2.5 sm:py-2 sm:px-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500 mb-0.5 truncate">Avg Active %</p>
                        <p className="text-xl sm:text-2xl font-bold text-orange-600">
                          {overallSummary.avgActivePercentage}%
                        </p>
                      </div>
                      <div className="p-1 sm:p-1.5 bg-orange-100 rounded-lg flex-shrink-0">
                        <Target className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="w-full lg:flex-1">
              {/* Filters and Search */}
              <Card className="bg-white shadow-sm border border-gray-200 rounded-xl h-full">
                <CardContent className="p-2 sm:p-2.5 h-full">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between w-full">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 whitespace-nowrap">Filters & Search</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      <div className="flex flex-col justify-end">
                        <Label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-0.5 leading-none">
                          Search
                        </Label>
                        <Input
                          id="search"
                          name="search"
                          placeholder="Search municipalities..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full h-8 px-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          autoComplete="off"
                        />
                      </div>

                      <div className="flex flex-col justify-end">
                        <Label htmlFor="month-filter" className="block text-sm font-medium text-gray-700 mb-0.5 leading-none">
                          Month
                        </Label>
                        <select
                          id="month-filter"
                          name="month-filter"
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                          className="w-full h-8 px-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
                      </div>

                      <div className="flex flex-col justify-end">
                        <Label htmlFor="year-filter" className="block text-sm font-medium text-gray-700 mb-0.5 leading-none">
                          Year
                        </Label>
                        <select
                          id="year-filter"
                          name="year-filter"
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                          className="w-full h-8 px-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                          {Array.from({ length: YEAR_OPTIONS_END - YEAR_OPTIONS_START + 1 }, (_, i) => YEAR_OPTIONS_START + i).map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col justify-end">
                        <Label htmlFor="district-filter" className="block text-sm font-medium text-gray-700 mb-0.5 leading-none">
                          District
                        </Label>
                        <select
                          id="district-filter"
                          name="district-filter"
                          value={selectedDistrict}
                          onChange={(e) => setSelectedDistrict(e.target.value)}
                          className="w-full h-8 px-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                          <option value="ALL">All Districts</option>
                          <option value="1ST DISTRICT">1ST DISTRICT</option>
                          <option value="2ND DISTRICT">2ND DISTRICT</option>
                          <option value="3RD DISTRICT">3RD DISTRICT</option>
                        </select>
                      </div>

                      <div className="flex items-end">
                        <Button
                          onClick={() => {
                            setSelectedMonth(new Date().getMonth());
                            setSelectedYear(new Date().getFullYear());
                          }}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 h-8 w-full"
                        >
                          <Calendar className="w-4 h-4" />
                          Current Month
                        </Button>
                      </div>

                      <div className="flex items-end">
                        <Button
                          onClick={() => {
                            setSearchTerm("");
                            setSelectedDistrict("ALL");
                          }}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 h-8 w-full"
                        >
                          Clear Filters
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="w-full px-4 sm:px-6 lg:px-8 flex-1 overflow-y-auto min-h-0 pb-6 mt-4">

        {/* Patrol Data Table */}
        <Card className="bg-white shadow-sm border border-gray-200 rounded-xl mt-4">
          <CardHeader className="p-3 sm:p-4">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-2 w-full">
              <div className="flex flex-col gap-1">
                <CardTitle className="text-base sm:text-lg font-semibold transition-colors duration-300 text-gray-900">
                  {new Date(selectedYear, selectedMonth).toLocaleDateString(
                    "en-US",
                    { month: "long", year: "numeric" },
                  )} Patrol Data ({filteredData.length} municipalities)
                </CardTitle>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                    <button
                      onClick={() => setActiveTab("daily")}
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-300 ${
                        activeTab === "daily"
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Calendar className="w-4 h-4" />
                      Daily Counts
                    </button>
                    <button
                      onClick={() => setActiveTab("criteria")}
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-300 ${
                        activeTab === "criteria"
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Criteria
                    </button>
                    <button
                      onClick={() => setShowTopPerformersModal(true)}
                      className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-300 text-gray-600 hover:text-gray-900 hover:bg-emerald-50"
                    >
                      <Target className="w-4 h-4" />
                      Top Performers
                    </button>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                    <BarChart3 className="w-4 h-4 text-blue-700" />
                    <span className="text-xs font-medium text-blue-800 whitespace-nowrap">Required Counts per Daily:</span>
                    <span className="px-2 py-1 bg-green-600 text-white rounded-md text-xs font-medium whitespace-nowrap">14 = Active</span>
                    <span className="px-2 py-1 bg-yellow-500 text-white rounded-md text-xs font-medium whitespace-nowrap">13 = Warning</span>
                    <span className="px-2 py-1 bg-red-600 text-white rounded-md text-xs font-medium whitespace-nowrap">12 = Inactive</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Taken Data Status - HIDDEN */}
            {/* {Object.keys(commandCenterActionData).length > 0 && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-green-800">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Command Center Integration:</span>
                  <span className="text-gray-600">
                    Action Taken data loaded for {Object.keys(commandCenterActionData).length} municipalities
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className="text-xs text-gray-600">
                    "No. of Report Attended / Week" now shows Action Taken counts from Command Center for entries that have both before and after photos. Multiple after photos per entry are counted individually.
                  </span>
                </div>
              </div>
            )} */}

          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b transition-all duration-300 border-gray-200 bg-gray-50">
                    {activeTab === "daily" ? (
                      <>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider transition-colors duration-300 text-gray-700">
                          Municipality
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider transition-colors duration-300 text-gray-700">
                          District
                        </th>
                        {selectedDates.map((date, index) => (
                          <th
                            key={index}
                            className={`px-2 py-4 text-center text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                              date.isCurrentDay ? 'bg-blue-100 text-blue-800' : ''
                            }`}
                          >
                            {date.dayName} {date.dayNumber}
                          </th>
                        ))}
                      </>
                    ) : (
                      <>
                        <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-700 w-16 align-top">Number</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 min-w-[180px] align-top">Municipality / City</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-700 min-w-[100px] align-top">
                          <div className="leading-tight">Number of<br/>Barangay</div>
                        </th>
                        <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-700 min-w-[120px] align-top">
                          <div className="leading-tight">Minimum<br/>Number of<br/>Reports<br/>(Constant)/<br/>Day</div>
                        </th>
                        <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-700 min-w-[120px] align-top">
                          <div className="leading-tight">Target no. of<br/>Barangays<br/>per Day</div>
                        </th>
                        <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-700 min-w-[100px] align-top">
                          <div className="leading-tight">No. of<br/>Days to<br/>Complete<br/>a C/M</div>
                        </th>
                        <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-700 min-w-[120px] align-top">
                          <div className="leading-tight">Frequency<br/>of Visit<br/>for Every<br/>Barangay<br/>Within a<br/>Week</div>
                        </th>
                        <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-700 min-w-[120px] align-top">
                          <div className="leading-tight">Minimum<br/>Number of<br/>Reports<br/>(Constant)/<br/>Week</div>
                        </th>
                        <th colSpan="4" className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider text-gray-700 border-l-2 border-gray-300 align-top">
                          <div className="leading-tight mb-2">Actual No. of Report / Week</div>
                          <div className="flex justify-around text-[10px] font-medium text-gray-600">
                            <span className="w-12">Week 1</span>
                            <span className="w-12">Week 2</span>
                            <span className="w-12">Week 3</span>
                            <span className="w-12">Week 4</span>
                          </div>
                        </th>
                        <th colSpan="4" className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider text-gray-700 border-l-2 border-gray-300 align-top">
                          <div className="leading-tight mb-2">No. of Report Attended / Week</div>
                          <div className="flex justify-around text-[10px] font-medium text-gray-600">
                            <span className="w-12">Week 1</span>
                            <span className="w-12">Week 2</span>
                            <span className="w-12">Week 3</span>
                            <span className="w-12">Week 4</span>
                          </div>
                        </th>
                        <th colSpan="4" className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider text-gray-700 border-l-2 border-gray-300 align-top">
                          <div className="leading-tight mb-2">% of Efficiency<br/>(Minimum Number of Reports / Week) /<br/>(No. of Report Attended / Week) * 100</div>
                          <div className="flex justify-around text-[10px] font-medium text-gray-600">
                            <span className="w-12">Week 1</span>
                            <span className="w-12">Week 2</span>
                            <span className="w-12">Week 3</span>
                            <span className="w-12">Week 4</span>
                          </div>
                        </th>
                        <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-700 border-l-2 border-gray-300 min-w-[100px] align-top">
                          <div className="leading-tight">Overall<br/>Percentage</div>
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {Object.keys(groupedData).map((district) => (
                    <React.Fragment key={district}>
                      {/* District Header */}
                      <tr className="border-b transition-all duration-300 bg-gray-50 border-gray-200">
                        <td
                          colSpan={
                            activeTab === "daily" ? selectedDates.length + 2 : 21
                          }
                          className="px-6 py-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Building2 className="w-5 h-5 text-gray-600" />
                              <span className="font-semibold transition-colors duration-300 text-gray-900">
                                {district}
                              </span>
                              <Badge className="transition-all duration-300 bg-gray-100 text-gray-800 border-gray-200">
                                {groupedData[district].length} municipalities
                              </Badge>
                            </div>
                            <button
                              onClick={() =>
                                toggleDistrictExpansion(district)
                              }
                              className={`p-2 rounded-lg transition-colors duration-200 hover:bg-gray-200 ${
                                expandedDistricts[district] ? 'bg-gray-200' : ''
                              }`}
                            >
                              {expandedDistricts[district] ? (
                                <ChevronUp className="w-4 h-4 text-gray-600" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-600" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Municipality Rows */}
                      {expandedDistricts[district] &&
                        groupedData[district].map((item, idx) => (
                          <tr
                            key={item.id}
                            className="transition-colors duration-200 hover:bg-gray-50"
                          >
                            {activeTab === "daily" ? (
                              <>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <MapPin className="w-4 h-4 text-gray-600" />
                                    <div>
                                      <span className="font-medium transition-colors duration-300 text-gray-900">
                                        {item.municipality}
                                      </span>
                                      <div className="text-xs text-gray-500">
                                        {barangayCounts[item.municipality] || 0} barangays • {daysToCompleteCM[item.municipality] || 0} days C/M • {weeklyVisitFrequency[item.municipality] || 0}x/week
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <Badge className="transition-all duration-300 bg-gray-100 text-gray-800 border-gray-200">
                                    {item.district}
                                  </Badge>
                                </td>
                              </>
                            ) : null}
                            {activeTab === "daily" ? (
                              // Daily Counts Tab - Show all date columns
                              selectedDates.map((date, index) => (
                                <td key={index} className="px-2 py-4 text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <input
                                      id={`patrol-data-${item.municipality}-${index}`}
                                      name={`patrol-data-${item.municipality}-${index}`}
                                      type="number"
                                      min="0"
                                      value={item.data[index] !== null && item.data[index] !== undefined ? item.data[index] : ""}
                                      onChange={(e) => {
                                        const inputValue = e.target.value;
                                        let parsedValue;
                                        
                                        if (inputValue === "" || inputValue === null) {
                                          parsedValue = null; // Empty input = No Entry
                                        } else {
                                          const num = parseInt(inputValue);
                                          parsedValue = isNaN(num) ? null : num; // Valid number or null
                                        }
                                        
                                        handleAddPatrolData(
                                          item.municipality,
                                          item.district,
                                          index,
                                          parsedValue
                                        );
                                      }}
                                      disabled={item.isLocked || ([0, 1].includes(selectedMonth) && selectedYear === 2025)}
                                      className={`w-16 h-8 text-center text-xs border transition-all duration-300 ${
                                        item.isLocked || ([0, 1].includes(selectedMonth) && selectedYear === 2025)
                                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' 
                                          : 'focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-300 bg-white text-gray-900'
                                      }`}
                                    />
                                    <Badge className={getStatusColor(item.data[index], item.municipality)}>
                                      {getStatusText(item.data[index], item.municipality)}
                                    </Badge>
                                  </div>
                                </td>
                              ))
                            ) : (
                              // Status Tab - KPI Matrix per municipality
                              (() => {
                                const DAILY_MIN = 14;
                                const WEEKLY_MIN = DAILY_MIN * 7; // 98
                                const brgy = barangayCounts[item.municipality] || 0;
                                const daysToComplete = daysToCompleteCM[item.municipality] || 1;
                                const frequencyPerWeek = weeklyVisitFrequency[item.municipality] || 1;
                                const totalDays = selectedDates.length;
                                
                                // Calculate weekly data for each of the 4 weeks
                                const weeklyActual = [];
                                const weeklyAttended = [];
                                
                                // Get Action Taken counts from Command Center data for this municipality
                                const municipalityActionCounts = commandCenterActionData[item.municipality] || [0, 0, 0, 0];
                                
                                // Debug logging for Action Taken integration
                                if (municipalityActionCounts.some(count => count > 0)) {
                                  ipatrollerLog(`📊 ${item.municipality}: Using Action Taken counts:`, municipalityActionCounts);
                                }
                                
                                for (let week = 0; week < 4; week++) {
                                  const weekStart = week * 7;
                                  const weekEnd = Math.min(weekStart + 7, totalDays);
                                  
                                  if (weekStart < totalDays) {
                                    const weekData = item.data.slice(weekStart, weekEnd);
                                    const weekSum = weekData.reduce((sum, v) => sum + (v || 0), 0);
                                    weeklyActual.push(weekSum);
                                    // Use Action Taken count from Command Center data
                                    weeklyAttended.push(municipalityActionCounts[week] || 0);
                                  } else {
                                    weeklyActual.push(0);
                                    weeklyAttended.push(0);
                                  }
                                }
                                
                                // Calculate efficiency for each week: (No. of Report Attended / Minimum Number of Reports) × 100
                                const weeklyEfficiency = weeklyAttended.map(attended => 
                                  Math.floor((attended / WEEKLY_MIN) * 100)
                                );
                                
                                // Calculate overall percentage: Total of Week 1-4 efficiency percentages
                                const overallPercentage = weeklyEfficiency.reduce((sum, efficiency) => sum + efficiency, 0);
                                return (
                                  <>
                                    <td className="px-3 py-4 text-center text-sm text-gray-700">{idx + 1}</td>
                                    <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                        <MapPin className="w-4 h-4 text-gray-600" />
                                        <div>
                                          <span className="font-medium text-gray-900">{item.municipality}</span>
                                          <div className="text-xs text-gray-500">{item.district}</div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-center text-sm text-gray-700">{brgy}</td>
                                    <td className="px-6 py-4 text-center text-sm text-gray-700">{DAILY_MIN}</td>
                                    <td className="px-6 py-4 text-center text-sm text-gray-700">7</td>
                                    <td className="px-6 py-4 text-center text-sm text-gray-700">{daysToComplete}</td>
                                    <td className="px-6 py-4 text-center text-sm text-gray-700">{frequencyPerWeek}</td>
                                    <td className="px-6 py-4 text-center text-sm text-gray-700">{WEEKLY_MIN}</td>
                                    {/* Actual No. of report / week - Week 1-4 */}
                                    {weeklyActual.map((value, weekIndex) => (
                                      <td key={`actual-${weekIndex}`} className={`px-3 py-4 text-center text-sm font-semibold text-blue-600 ${weekIndex === 0 ? 'border-l-2 border-gray-300' : ''}`}>
                                        {value}
                                      </td>
                                    ))}
                                    {/* No. of report attended / week - Week 1-4 */}
                                    {weeklyAttended.map((value, weekIndex) => (
                                      <td key={`attended-${weekIndex}`} className={`px-3 py-4 text-center text-sm font-semibold text-red-600 ${weekIndex === 0 ? 'border-l-2 border-gray-300' : ''}`}>
                                        {value}
                                        {value > 0 && (
                                          <div className="text-xs text-green-600 mt-1" title="Data from Command Center Action Taken">
                                            ✓
                                          </div>
                                        )}
                                      </td>
                                    ))}
                                    {/* % of Efficiency / week - Week 1-4 */}
                                    {weeklyEfficiency.map((efficiency, weekIndex) => (
                                      <td key={`efficiency-${weekIndex}`} className={`px-3 py-4 text-center text-sm font-semibold text-purple-600 ${weekIndex === 0 ? 'border-l-2 border-gray-300' : ''}`}>
                                        {efficiency}%
                                      </td>
                                    ))}
                                    {/* Overall Percentage */}
                                    <td className="px-6 py-4 text-center text-sm font-semibold text-green-600 border-l-2 border-gray-300">{overallPercentage}%</td>
                                  </>
                                );
                              })()
                            )}
                          </tr>
                        ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Print Preview Modal */}
      {showPrintPreview && previewData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Monthly Report Preview</h3>
                  <p className="text-sm text-gray-600">Review before printing or downloading</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    setShowPrintPreview(false);
                    setPreviewData(null);
                  }}
                  variant="outline"
                  size="sm"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setShowPrintPreview(false);
                    setPreviewData(null);
                    generateMonthlySummaryReport();
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>

            {/* Modal Content - Print Preview */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
                {/* Report Header */}
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{previewData.title}</h1>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Generated: {previewData.generatedDate}</p>
                    <p>Month: {previewData.month} {previewData.year}</p>
                    <p>Report Period: {previewData.reportPeriod}</p>
                    <p className="font-semibold text-blue-600">{previewData.dataSource}</p>
                    <p>Data Completeness: {previewData.dataCompleteness}% ({previewData.daysWithData} of {previewData.totalPossibleDays} possible days)</p>
                  </div>
                </div>

                {/* District Summary */}
                {previewData.districtSummary.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">District Summary</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-blue-50">
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">District</th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-900">Municipalities</th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-900">Total Patrols</th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-900">Active Days</th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-900">Inactive Days</th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-900">Avg Active %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.districtSummary.map((district, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                              <td className="border border-gray-300 px-4 py-2 font-medium text-gray-900">{district.district}</td>
                              <td className="border border-gray-300 px-4 py-2 text-center text-gray-700">{district.municipalityCount}</td>
                              <td className="border border-gray-300 px-4 py-2 text-center text-gray-700">{district.totalPatrols.toLocaleString()}</td>
                              <td className="border border-gray-300 px-4 py-2 text-center text-green-600 font-semibold">{district.totalActive}</td>
                              <td className="border border-gray-300 px-4 py-2 text-center text-red-600 font-semibold">{district.totalInactive}</td>
                              <td className="border border-gray-300 px-4 py-2 text-center text-purple-600 font-semibold">{district.avgActivePercentage}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Municipality Performance */}
                {previewData.municipalityPerformance.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Municipality Performance</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-green-50">
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">Municipality</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">District</th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-900">Required Barangays</th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-900">Total Patrols</th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-900">Active Days</th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-900">Inactive Days</th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-900">Active %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.municipalityPerformance.map((municipality, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                              <td className="border border-gray-300 px-4 py-2 font-medium text-gray-900">{municipality.municipality}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{municipality.district}</td>
                              <td className="border border-gray-300 px-4 py-2 text-center text-blue-600 font-semibold">{municipality.requiredBarangays}</td>
                              <td className="border border-gray-300 px-4 py-2 text-center text-gray-700">{municipality.totalPatrols.toLocaleString()}</td>
                              <td className="border border-gray-300 px-4 py-2 text-center text-green-600 font-semibold">{municipality.activeDays}</td>
                              <td className="border border-gray-300 px-4 py-2 text-center text-red-600 font-semibold">{municipality.inactiveDays}</td>
                              <td className="border border-gray-300 px-4 py-2 text-center text-purple-600 font-semibold">{municipality.activePercentage}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Overall Summary Statistics */}
                <div className="border-t border-gray-200 pt-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Overall Summary Statistics</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Patrols:</span>
                        <span className="font-semibold text-gray-900">{previewData.overallSummary.totalPatrols.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Active Days:</span>
                        <span className="font-semibold text-green-600">{previewData.overallSummary.totalActive.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Inactive Days:</span>
                        <span className="font-semibold text-red-600">{previewData.overallSummary.totalInactive.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Average Active Percentage:</span>
                        <span className="font-semibold text-purple-600">{previewData.overallSummary.avgActivePercentage}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Municipalities:</span>
                        <span className="font-semibold text-gray-900">{previewData.overallSummary.municipalityCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {showPdfPreview && (
        <div className="fixed inset-0 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Daily Summary Report</h3>
                  <p className="text-sm text-gray-600">
                    {selectedDates[selectedDayIndex]?.fullDate}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={async () => {
                    setIsGeneratingPdf(true);
                    try {
                      const doc = new jsPDF();
                      const pageWidth = doc.internal.pageSize.width;
                      const pageHeight = doc.internal.pageSize.height;
                      const summaryData = getDailySummaryData(selectedDayIndex);
                      
                      // Simple header
                      doc.setFontSize(18);
                      doc.setFont('helvetica', 'bold');
                      doc.setTextColor(0, 0, 0);
                      doc.text('Daily Patrol Summary', 20, 30);
                      
                      doc.setFontSize(12);
                      doc.setFont('helvetica', 'normal');
                      doc.text(`Date: ${selectedDates[selectedDayIndex]?.fullDate}`, 20, 40);
                      
                      // Simple table
                      const allMunicipalities = Object.values(summaryData).flat();
                      const tableData = allMunicipalities.map(data => [
                        data.municipality,
                        data.dailyCount.toString(),
                        { content: data.isActive ? 'Active' : 'Inactive', styles: { textColor: data.isActive ? [34, 197, 94] : [239, 68, 68] } },
                        `${data.percentage}%`
                      ]);
                      
                      // Calculate table width and center it
                      const tableWidth = 60 + 30 + 30 + 30; // Sum of column widths
                      const leftMargin = (pageWidth - tableWidth) / 2;
                      
                      autoTable(doc, {
                        head: [['Municipality', 'Patrols', 'Status', 'Percentage']],
                        body: tableData,
                        startY: 50,
                        margin: { left: leftMargin, right: leftMargin },
                        styles: {
                          fontSize: 9,
                          cellPadding: 4,
                          halign: 'center'
                        },
                        headStyles: {
                          fillColor: [59, 130, 246],
                          textColor: [255, 255, 255],
                          fontStyle: 'bold'
                        },
                        columnStyles: {
                          0: { cellWidth: 60 },
                          1: { cellWidth: 30 },
                          2: { cellWidth: 30 },
                          3: { cellWidth: 30 }
                        }
                      });
                      
                      // Save PDF
                      const fileName = `daily-summary-${selectedDates[selectedDayIndex]?.fullDate.replace(/,/g, '').replace(/ /g, '-')}.pdf`;
                      doc.save(fileName);
                      
                      toast.success('PDF Generated Successfully', {
                        description: `Saved as ${fileName}`,
                        duration: 3000
                      });
                      showSuccess('PDF Generated Successfully!');
                    } catch (error) {
                      ipatrollerLog('Error generating PDF:', error, 'error');
                      toast.error('Failed to generate PDF', {
                        description: error.message,
                        duration: 3000
                      });
                      showError('Failed to generate PDF');
                    } finally {
                      setIsGeneratingPdf(false);
                      setShowPdfPreview(false);
                    }
                  }}
                  disabled={isGeneratingPdf}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setShowPdfPreview(false)}
                  variant="outline"
                  size="sm"
                >
                  Close
                </Button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="max-w-3xl mx-auto space-y-8 bg-white rounded-lg border border-gray-200 p-8">
                {/* Report Header */}
                <div className="text-center border-b border-gray-200 pb-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Daily Patrol Summary Report</h1>
                  <p className="text-gray-600">Date: {selectedDates[selectedDayIndex]?.fullDate}</p>
                  <p className="text-sm text-gray-500 mt-1">Generated: {new Date().toLocaleString()}</p>
                </div>

                {/* Report Content */}
                <div className="space-y-6">
                  {Object.entries(getDailySummaryData(selectedDayIndex)).map(([district, municipalities]) => (
                    <div key={district} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">{district}</h2>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Municipality</th>
                              <th className="px-4 py-2 text-center text-sm font-medium text-gray-600">Daily Count</th>
                              <th className="px-4 py-2 text-center text-sm font-medium text-gray-600">Status</th>
                              <th className="px-4 py-2 text-center text-sm font-medium text-gray-600">Progress</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {municipalities.map((data) => (
                              <tr key={data.municipality}>
                                <td className="px-4 py-2 text-sm font-medium text-gray-900">{data.municipality}</td>
                                <td className="px-4 py-2 text-sm text-center font-medium text-gray-900">{data.dailyCount}</td>
                                <td className="px-4 py-2">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                    ${data.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {data.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                                <td className="px-4 py-2">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${
                                          data.isActive ? 'bg-green-500' :
                                          data.percentage >= 50 ? 'bg-yellow-500' :
                                          'bg-red-500'
                                        }`}
                                        style={{ width: `${data.percentage}%` }}
                                      />
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">{data.percentage}%</span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Removed custom modal in favor of Sonner toast */}

      {/* Top Performers Modal */}
      {showTopPerformersModal && (
        <div className="fixed inset-0 flex items-center justify-center z-40 p-4">
          {console.log('🔵 Top Performers Modal is rendering, showDateRangeModal:', showDateRangeModal)}
          <div className="rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden bg-white">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full flex items-center justify-center bg-emerald-100">
                  <Target className="h-7 w-7 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold transition-colors duration-300 text-gray-900"><i>Top Performers Ranking</i></h3>
                  <p className="text-sm transition-colors duration-300 text-gray-600">
                    Top 12 performing municipalities based on patrol data for {new Date(selectedTopPerformersYear, selectedTopPerformersMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-xs font-medium text-gray-600">Performance Analytics Active</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {/* Month and Year Selection */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Select Period:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedTopPerformersMonth}
                      onChange={(e) => setSelectedTopPerformersMonth(parseInt(e.target.value))}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                    >
                      {[
                        "January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"
                      ].map((month, index) => (
                        <option key={index} value={index}>
                          {month}
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedTopPerformersYear}
                      onChange={(e) => setSelectedTopPerformersYear(parseInt(e.target.value))}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                    >
                      {Array.from({ length: YEAR_OPTIONS_END - YEAR_OPTIONS_START + 1 }, (_, i) => YEAR_OPTIONS_START + i).map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <Button
                    onClick={generateTopPerformersPDF}
                    disabled={loadingTopPerformers || !getTopPerformers().length}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Current Month PDF
                  </Button>
                  <Button
                    onClick={() => {
                      console.log('🟡 Generate Range PDF button clicked, setting showDateRangeModal to true');
                      setShowDateRangeModal(true);
                    }}
                    disabled={loadingTopPerformers}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Range PDF
                  </Button>
                  <Button
                    onClick={() => setShowTopPerformersModal(false)}
                    variant="outline"
                    size="sm"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
              {/* Top Performers Description */}
              <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Trophy className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div className="w-full">
                    <h4 className="font-semibold text-gray-900 mb-3">How Top Performers Ranking Works</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                      <div className="space-y-2">
                        <p><strong>Ranking Criteria:</strong> {selectedTopPerformersMonth >= 2 && selectedTopPerformersMonth <= 9 
                          ? 'March-October: Ranked by total patrols first, then active days, then performance %' 
                          : 'Other months: Ranked by performance % first, then active days, then total patrols'
                        }</p>
                        <p><strong>Active Days:</strong> Days with 14 or more patrols (from Daily Counts tab)</p>
                        <p><strong>Total Patrols:</strong> Sum of Week 1-4 actual reports (from Criteria tab)</p>
                      </div>
                      <div className="space-y-2">
                        <p><strong>Performance %:</strong> {selectedTopPerformersMonth >= 2 && selectedTopPerformersMonth <= 9 
                          ? 'March-October: (Total Patrols / Expected Max Patrols) × 100' 
                          : 'Other months: Overall percentage from Criteria tab (sum of weekly efficiency)'
                        }</p>
                        <p><strong>Status Levels:</strong> Very Satisfactory (96-100%), Very Good (86-95%), Good (75-85%), Needs Improvement (&lt;75%)</p>
                        <p><strong>Top 12 Display:</strong> Shows the best performing municipalities for the selected month</p>
                      </div>
                    </div>
                  </div>
                </div>

                {loadingTopPerformers ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                    <p className="text-lg font-medium text-gray-700">Loading performance data...</p>
                    <p className="text-sm text-gray-500">Fetching data for {new Date(selectedTopPerformersYear, selectedTopPerformersMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
                  </div>
                ) : (!filteredTopPerformersData || filteredTopPerformersData.length === 0) ? (
                  <div className="text-center py-12">
                    <div className="flex flex-col items-center justify-center p-8 mb-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
                      <p className="text-gray-600 text-center">
                        There is no performance data available for {new Date(selectedTopPerformersYear, selectedTopPerformersMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })}.
                      </p>
                    </div>
                  </div>
                ) : getTopPerformers().length > 0 ? (
                  <div className="space-y-6">
                    {/* Summary Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <Card className="backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium transition-colors duration-300 text-gray-500">Most Active</p>
                              <p className="text-3xl font-bold text-emerald-600">
                                {getTopPerformers()[0]?.activeDays || 0}
                              </p>
                            </div>
                            <div className="h-12 w-12 rounded-full flex items-center justify-center transition-colors duration-300 bg-emerald-100">
                              <Trophy className="h-6 w-6 text-emerald-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium transition-colors duration-300 text-gray-500">Total Patrols</p>
                              <p className="text-3xl font-bold text-blue-600">
                                {getTopPerformers().reduce((sum, p) => sum + p.totalPatrols, 0)}
                              </p>
                            </div>
                            <div className="h-12 w-12 rounded-full flex items-center justify-center transition-colors duration-300 bg-blue-100">
                              <Activity className="h-6 w-6 text-blue-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium transition-colors duration-300 text-gray-500">Avg Performance</p>
                              <p className="text-3xl font-bold text-purple-600">
                                {Math.round(getTopPerformers().reduce((sum, p) => sum + p.activePercentage, 0) / Math.max(getTopPerformers().length, 1))}%
                              </p>
                            </div>
                            <div className="h-12 w-12 rounded-full flex items-center justify-center transition-colors duration-300 bg-purple-100">
                              <TrendingUp className="h-6 w-6 text-purple-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium transition-colors duration-300 text-gray-500">Top Municipality</p>
                              <p className="text-lg font-bold text-orange-600">
                                {getTopPerformers()[0]?.municipality || 'N/A'}
                              </p>
                            </div>
                            <div className="h-12 w-12 rounded-full flex items-center justify-center transition-colors duration-300 bg-orange-100">
                              <Building2 className="h-6 w-6 text-orange-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Top Performers Table */}
                    <Card className="backdrop-blur-sm border-0 shadow-lg bg-white/80">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold transition-colors duration-300 text-gray-900 flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-yellow-500" />
                          Top 12 Performers Ranking for {new Date(selectedTopPerformersYear, selectedTopPerformersMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="min-w-full">
                            <thead>
                              <tr className="border-b transition-all duration-300 border-gray-200 bg-gray-50">
                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider transition-colors duration-300 text-gray-700">
                                  Rank
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider transition-colors duration-300 text-gray-700">
                                  Municipality
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider transition-colors duration-300 text-gray-700">
                                  District
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider transition-colors duration-300 text-gray-700">
                                  Active Days
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider transition-colors duration-300 text-gray-700">
                                  Total Patrols
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider transition-colors duration-300 text-gray-700">
                                  Performance
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider transition-colors duration-300 text-gray-700">
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {getTopPerformers().map((performer, index) => {
                                // Use the pre-calculated activePercentage from Criteria tab logic
                                const activePercentage = performer.activePercentage;
                                
                                const getStatusStyle = () => {
                                  if (activePercentage >= 96) return 'bg-blue-100 text-blue-800 border-blue-200'; // Very Satisfactory (96-100)
                                  if (activePercentage >= 86) return 'bg-green-100 text-green-800 border-green-200'; // Very Good (86-95)
                                  if (activePercentage >= 75) return 'bg-yellow-100 text-yellow-800 border-yellow-200'; // Good (75-85)
                                  return 'bg-red-100 text-red-800 border-red-200'; // Needs Improvement (<75)
                                };
                                
                                const getStatusText = () => {
                                  if (activePercentage >= 96) return 'Very Satisfactory';
                                  if (activePercentage >= 86) return 'Very Good';
                                  if (activePercentage >= 75) return 'Good';
                                  return 'Needs Improvement';
                                };

                                return (
                                  <tr key={performer.id} className="transition-colors duration-200 hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                      <div className="flex items-center">
                                        {index < 3 ? (
                                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                                            index === 0 ? 'bg-yellow-500' : 
                                            index === 1 ? 'bg-gray-400' : 
                                            'bg-orange-500'
                                          }`}>
                                            {index + 1}
                                          </div>
                                        ) : (
                                          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-700 font-bold">
                                            {index + 1}
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                        <MapPin className="w-4 h-4 text-gray-600" />
                                        <span className="font-medium transition-colors duration-300 text-gray-900">
                                          {performer.municipality}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      <Badge className="transition-all duration-300 bg-gray-100 text-gray-800 border-gray-200">
                                        {performer.district}
                                      </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      <span className="text-lg font-semibold transition-colors duration-300 text-emerald-600">
                                        {performer.activeDays}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      <span className="text-lg font-semibold transition-colors duration-300 text-blue-600">
                                        {performer.totalPatrols}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      <span className="text-lg font-semibold transition-colors duration-300 text-purple-600">
                                        {activePercentage}%
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      <Badge className={`transition-all duration-300 ${getStatusStyle()}`}>
                                        {getStatusText()}
                                      </Badge>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="flex flex-col items-center justify-center p-8 mb-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Performance Data</h3>
                      <p className="text-gray-600 text-center">
                        No performance data found for the selected period.
                      </p>
                    </div>
                  </div>
                )}
            </div>

            {/* Date Range PDF Modal - Inside Top Performers Modal */}
            {showDateRangeModal && (
              <div className="absolute inset-0 flex items-center justify-center z-10 p-4">
                {console.log('🟢 Date Range Modal is rendering inside Top Performers Modal')}
                <div className="absolute inset-0 bg-navy-900 bg-opacity-70" onClick={() => setShowDateRangeModal(false)}></div>
                <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center bg-green-100">
                        <Calendar className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Select Date Range</h3>
                        <p className="text-sm text-gray-600">Choose the period for your PDF report</p>
                      </div>
                    </div>
                  </div>

                  {/* Date Range Selection */}
                  <div className="space-y-6">
                    {/* From Date */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">From</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={pdfFromMonth}
                          onChange={(e) => setPdfFromMonth(parseInt(e.target.value))}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                        >
                          {[
                            "January", "February", "March", "April", "May", "June",
                            "July", "August", "September", "October", "November", "December"
                          ].map((month, index) => (
                            <option key={index} value={index}>
                              {month}
                            </option>
                          ))}
                        </select>
                        <select
                          value={pdfFromYear}
                          onChange={(e) => setPdfFromYear(parseInt(e.target.value))}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                        >
                          {Array.from({ length: YEAR_OPTIONS_END - YEAR_OPTIONS_START + 1 }, (_, i) => YEAR_OPTIONS_START + i).map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* To Date */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">To</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={pdfToMonth}
                          onChange={(e) => setPdfToMonth(parseInt(e.target.value))}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                        >
                          {[
                            "January", "February", "March", "April", "May", "June",
                            "July", "August", "September", "October", "November", "December"
                          ].map((month, index) => (
                            <option key={index} value={index}>
                              {month}
                            </option>
                          ))}
                        </select>
                        <select
                          value={pdfToYear}
                          onChange={(e) => setPdfToYear(parseInt(e.target.value))}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                        >
                          {Array.from({ length: YEAR_OPTIONS_END - YEAR_OPTIONS_START + 1 }, (_, i) => YEAR_OPTIONS_START + i).map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Date Range Validation */}
                    {(() => {
                      const fromDate = new Date(pdfFromYear, pdfFromMonth);
                      const toDate = new Date(pdfToYear, pdfToMonth);
                      const isInvalidRange = fromDate > toDate;
                      
                      return isInvalidRange && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <span className="text-sm text-red-700 font-medium">Invalid date range</span>
                          </div>
                          <p className="text-xs text-red-600 mt-1">The "From" date must be earlier than or equal to the "To" date.</p>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3 mt-8">
                    <Button
                      onClick={() => setShowDateRangeModal(false)}
                      variant="outline"
                      size="sm"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={async () => {
                        setIsGeneratingRangePdf(true);
                        try {
                          await generateRangePDF();
                          setShowDateRangeModal(false);
                        } catch (error) {
                          console.error('Error generating range PDF:', error);
                          toast.error('Failed to generate range PDF', {
                            description: error.message,
                            duration: 3000
                          });
                        } finally {
                          setIsGeneratingRangePdf(false);
                        }
                      }}
                      disabled={(() => {
                        const fromDate = new Date(pdfFromYear, pdfFromMonth);
                        const toDate = new Date(pdfToYear, pdfToMonth);
                        return fromDate > toDate || isGeneratingRangePdf;
                      })()}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      {isGeneratingRangePdf ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 mr-2" />
                          Generate PDF
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      )}
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </div>
  </Layout>
);
}
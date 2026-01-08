import React, { useState, useEffect, useRef, useCallback } from "react";
import Layout from "./Layout";
import { commandCenterLog, createSectionGroup, CONSOLE_GROUPS } from './utils/consoleGrouping';
import { useFirebase } from "./hooks/useFirebase";
import { useFirestoreQuota } from "./hooks/useFirestoreQuota";
import { useAuth } from "./contexts/AuthContext";
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { 
  Command, 
  Terminal, 
  Send, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  MapPin, 
  Phone,
  MessageSquare,
  FileText,
  Activity,
  Zap,
  Shield,
  Radio,
  Upload,
  Download,
  Building2,
  MapPinIcon,
  BarChart3,
  FileSpreadsheet,
  Save,
  Plus,
  X,
  Database,
  Menu,
  ChevronDown,
  ChevronRight,
  Check,
  Edit,
  HelpCircle,
  Image,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import { useNotification, NotificationContainer } from './components/ui/notification';
import * as XLSX from 'xlsx';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "./components/ui/dialog";
import { Badge } from "./components/ui/badge";
import { cloudinaryUtils } from './utils/cloudinary';
import PhotoCarousel from './components/PhotoCarousel';

export default function CommandCenter({ onLogout, onNavigate, currentPage }) {
  const { user } = useFirebase();
  const { isAdmin, userMunicipality, userAccessLevel } = useAuth();
  const { notifications, showSuccess, showError, showInfo, showWarning, removeNotification } = useNotification();
  const { isBlocked, blockedUntil, timeLeft, executeWithQuotaCheck, resetQuotaBlock } = useFirestoreQuota();
  const isCommandUser = userAccessLevel === 'command-center' && !isAdmin;
  
  // Access level check - only command-center users should access this page
  useEffect(() => {
    if (userAccessLevel && userAccessLevel !== 'command-center' && userAccessLevel !== 'admin') {
      console.warn('⚠️ Unauthorized access attempt to Command Center. Access level:', userAccessLevel);
      // Optionally redirect to dashboard or show error
    }
  }, [userAccessLevel]);
  
  // Municipality tabs state - moved here to be available for useEffect
  const [activeMunicipalityTab, setActiveMunicipalityTab] = useState("");
  
  useEffect(() => {
    if (userMunicipality) {
      setActiveMunicipalityTab(userMunicipality);
    }
  }, [userMunicipality]);

  // Show instructions panel for command-center users on first visit
  useEffect(() => {
    if (userAccessLevel === 'command-center' && !isAdmin) {
      const dismissed = localStorage.getItem('ccHelpDismissed') === '1';
      if (!dismissed) setShowCommandCenterHelp(true);
    } else {
      setShowCommandCenterHelp(false);
    }
  }, [userAccessLevel, isAdmin]);
  const { 
    saveBarangays, 
    getBarangays, 
    saveConcernTypes, 
    getConcernTypes, 
    getWeeklyReport,
    saveWeeklyReportByMunicipality,
    getWeeklyReportsFromCollection,
    updateWeeklyReportInCollection,
    deleteWeeklyReportFromCollection,
    deleteAllWeeklyReports
  } = useFirebase();

  const [terminalInput, setTerminalInput] = useState("");
  const [terminalHistory, setTerminalHistory] = useState([
    { id: 1, command: "system.status", output: "All systems operational", type: "success", timestamp: new Date() },
    { id: 2, command: "patrol.active", output: "12 active patrols detected", type: "info", timestamp: new Date() },
    { id: 3, command: "incidents.pending", output: "3 incidents require attention", type: "warning", timestamp: new Date() }
  ]);
  const [activeUnits, setActiveUnits] = useState([
    { id: "UNIT-001", status: "active", location: "District 1 - Municipality A", lastUpdate: "2 min ago", officer: "Officer Smith" },
    { id: "UNIT-002", status: "active", location: "District 2 - Municipality B", lastUpdate: "5 min ago", officer: "Officer Johnson" },
    { id: "UNIT-003", status: "standby", location: "District 3 - Municipality C", lastUpdate: "10 min ago", officer: "Officer Brown" },
    { id: "UNIT-004", status: "active", location: "District 1 - Municipality D", lastUpdate: "1 min ago", officer: "Officer Davis" }
  ]);
  const [emergencyAlerts, setEmergencyAlerts] = useState([
    { id: 1, type: "high", message: "Suspicious activity reported in District 2", time: "5 min ago", status: "pending" },
    { id: 2, type: "medium", message: "Traffic incident on Main Street", time: "12 min ago", status: "handled" },
    { id: 3, type: "low", message: "Routine patrol check-in overdue", time: "15 min ago", status: "resolved" }
  ]);
  const [communications, setCommunications] = useState([
    { id: 1, from: "UNIT-001", to: "COMMAND", message: "Patrol complete in Sector A", time: "2 min ago", type: "radio" },
    { id: 2, from: "DISPATCH", to: "ALL UNITS", message: "Weather alert: Heavy rain expected", time: "8 min ago", type: "broadcast" },
    { id: 3, from: "UNIT-003", to: "COMMAND", message: "Requesting backup at location", time: "12 min ago", type: "emergency" }
  ]);

  // Barangay Import States
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedMunicipality, setSelectedMunicipality] = useState("");
  const [barangayData, setBarangayData] = useState("");
  const [importedBarangays, setImportedBarangays] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isLoadingBarangays, setIsLoadingBarangays] = useState(false);
  const [selectedBarangays, setSelectedBarangays] = useState([]);
  const [isEditingBarangays, setIsEditingBarangays] = useState(false);
  const [editingBarangay, setEditingBarangay] = useState(null);
  const [barangaySortBy, setBarangaySortBy] = useState('name'); // 'name', 'municipality', 'district', 'importedAt'
  const [barangaySortOrder, setBarangaySortOrder] = useState('asc'); // 'asc', 'desc'
  const [barangayFilterMunicipality, setBarangayFilterMunicipality] = useState(''); // Filter by municipality
  const [expandedMunicipalities, setExpandedMunicipalities] = useState(new Set()); // Track which municipalities are expanded
  const [expandedConcernTypeMunicipalities, setExpandedConcernTypeMunicipalities] = useState(new Set()); // Track which municipalities are expanded for concern types
  const [concernTypeFilterMunicipality, setConcernTypeFilterMunicipality] = useState(''); // Filter concern types by municipality
  const [concernTypeSortBy, setConcernTypeSortBy] = useState('name'); // 'name', 'municipality', 'district', 'importedAt'
  const [concernTypeSortOrder, setConcernTypeSortOrder] = useState('asc'); // 'asc', 'desc'
  const [selectedConcernTypes, setSelectedConcernTypes] = useState([]); // Track selected concern types
  const [isEditingConcernTypes, setIsEditingConcernTypes] = useState(false);
  const [editingConcernType, setEditingConcernType] = useState(null);
  const [allMonthsData, setAllMonthsData] = useState({}); // Store data for all months from Excel
  const [isImportingAllMonths, setIsImportingAllMonths] = useState(false);
  const [importAllMonths, setImportAllMonths] = useState(false); // Checkbox state for import all months
  const [isSavingAllMonths, setIsSavingAllMonths] = useState(false);
  const [saveAllProgress, setSaveAllProgress] = useState({ current: 0, total: 0 });
  
  // Active Tab State
  const [activeTab, setActiveTab] = useState("weekly-report");
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [showCommandCenterHelp, setShowCommandCenterHelp] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(true);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenuDropdown) {
        const dropdown = document.getElementById('commandcenter-menu-dropdown');
        const button = document.getElementById('commandcenter-menu-button');
        if (dropdown && !dropdown.contains(event.target) && !button?.contains(event.target)) {
          setShowMenuDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenuDropdown]);

  // Auto-select district and municipality for non-admin users when on concern types tab
  useEffect(() => {
    if (userMunicipality && activeTab === 'concern-types') {
      // Find the district that contains the user's municipality
      const userDistrict = Object.entries(municipalitiesByDistrict).find(([district, municipalities]) => 
        municipalities.includes(userMunicipality)
      );
      
      if (userDistrict) {
        setSelectedDistrict(userDistrict[0]); // Set the district
        setSelectedMunicipality(userMunicipality); // Set the municipality
      }
    }
  }, [userMunicipality, activeTab]);

  // Weekly Report State
  const [weeklyReports, setWeeklyReports] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedBarangay, setSelectedBarangay] = useState("");
  const [selectedConcernType, setSelectedConcernType] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [remarks, setRemarks] = useState("");
  
  // Weekly Reports Collection State
  const [weeklyReportsCollection, setWeeklyReportsCollection] = useState([]);
  const [isLoadingCollection, setIsLoadingCollection] = useState(false);
  const [showCollectionView, setShowCollectionView] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleDateString("en-US", { month: "long" }));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedReportMunicipality, setSelectedReportMunicipality] = useState("");
  const [importedConcernTypes, setImportedConcernTypes] = useState([]);
  const [concernTypeData, setConcernTypeData] = useState("");
  const [isLoadingConcernTypes, setIsLoadingConcernTypes] = useState(false);
  const [isLoadingWeeklyReports, setIsLoadingWeeklyReports] = useState(false);
  
  // Weekly Report Data - Individual date entries
  const [weeklyReportData, setWeeklyReportData] = useState({});
  const weeklyReportCache = useRef({});
  const lastLoadedWeeklyRef = useRef({ month: null, year: null, municipality: null });
  
  // Cache for barangays and concern types
  const barangaysCache = useRef(null);
  const concernTypesCache = useRef(null);

  // Municipality tabs state - moved to top of component
  
  // Clear data options state
  const [showClearOptions, setShowClearOptions] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [selectedClearMunicipality, setSelectedClearMunicipality] = useState("");
  
  
  // Excel Import States
  const [isImportingExcel, setIsImportingExcel] = useState(false);
  const [excelFile, setExcelFile] = useState(null);

  // Photo Upload States
  const [showPhotoUploadDialog, setShowPhotoUploadDialog] = useState(false);
  const [currentPhotoEntry, setCurrentPhotoEntry] = useState(null);
  const [photoRows, setPhotoRows] = useState([{ id: 1, beforePhotos: [], afterPhotos: [], beforePreviews: [], afterPreviews: [] }]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [showPhotoViewDialog, setShowPhotoViewDialog] = useState(false);
  const [viewingPhotos, setViewingPhotos] = useState(null);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  
  // Ref for debouncing remarks updates
  const remarksDebounceRef = useRef(null);

  // Municipalities by district
  const municipalitiesByDistrict = {
    "District 1": ["Abucay", "Hermosa", "Orani", "Samal"],
    "District 2": ["Balanga City", "Limay", "Orion", "Pilar"],
    "District 3": ["Bagac", "Dinalupihan", "Mariveles", "Morong"]
  };

  // Concern types for dropdown
  const concernTypes = [
    "Security Issue",
    "Traffic Violation",
    "Public Disturbance",
    "Emergency Response",
    "Community Service",
    "Environmental Concern",
    "Health Issue",
    "Infrastructure Problem",
    "Crime Report",
    "Other"
  ];

  // Months and years
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Fixed list to ensure 2025 is always available in the dropdown
  const years = ["2024", "2025", "2026", "2027"];

  // Generate dates for selected month and year
  const generateDates = (month, year) => {
    const dates = [];
    const daysInMonth = new Date(year, months.indexOf(month) + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      dates.push(`${month} ${day}, ${year}`);
    }
    return dates;
  };

  // Normalize any Excel/JS date value to our exact date key in UTC (prevents timezone shifts)
  const toDateKeyUTC = (year, monthIndex, day) => {
    const utcDate = new Date(Date.UTC(year, monthIndex, day));
    return utcDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC"
    });
  };

  const parseExcelDateToKey = (value) => {
    try {
      if (value == null || value === '') return null;
      if (typeof value === 'number') {
        // Excel serial date to UTC date: base is 1899-12-30, no DST/locale impact
        const base = Date.UTC(1899, 11, 30);
        const millis = base + Math.round(value) * 24 * 60 * 60 * 1000;
        const d = new Date(millis);
        if (!isNaN(d.getTime())) {
          return toDateKeyUTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
        }
        return null;
      }
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        return toDateKeyUTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  const currentDates = generateDates(selectedMonth, selectedYear);

  // Wrapper function for Firestore save operations with quota checking
  const saveWithQuotaCheck = useCallback(async (saveOperation, operationName = "Save") => {
    if (isBlocked) {
      const message = `⚠️ Firestore quota exceeded! You can save data again at ${blockedUntil?.toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
      })}. Time remaining: ${timeLeft}`;
      toast.error(message);
      showError(message);
      return { success: false, error: message, quotaExceeded: true };
    }

    try {
      const result = await executeWithQuotaCheck(saveOperation);
      
      if (result.quotaExceeded) {
        const message = `⚠️ Firestore quota exceeded! Pwede ka ulit mag-save sa ${result.resetTime?.toLocaleString("en-PH", {
          dateStyle: "medium",
          timeStyle: "short",
        })}.`;
        toast.error(message);
        showError(message);
      }
      
      return result;
    } catch (error) {
      console.error(`❌ Error in ${operationName}:`, error);
      return { success: false, error: error.message };
    }
  }, [isBlocked, blockedUntil, timeLeft, executeWithQuotaCheck, showError]);

  // Enhanced debug function to check all Firestore collections and data
  const debugFirestoreDocuments = async () => {
    try {
      console.log('🔍 COMPREHENSIVE FIRESTORE DEBUG - Starting analysis...');
      const { collection, getDocs, listCollections } = await import('firebase/firestore');
      const { db } = await import('./firebase');
      
      // Check if database is available
      if (!db) {
        console.error('❌ Firestore database not available');
        return;
      }
      
      console.log('✅ Firestore database connection OK');
      
      // List all available collections
      console.log('📂 Checking available collections...');
      try {
        // Check common collections that might contain Command Center data
        const collectionsToCheck = ['commandCenter', 'weeklyReports', 'reports', 'barangays', 'concernTypes'];
        
        for (const collectionName of collectionsToCheck) {
          try {
            const querySnapshot = await getDocs(collection(db, collectionName));
            const documents = [];
            querySnapshot.forEach((doc) => {
              const data = doc.data();
              documents.push({
                id: doc.id,
                dataKeys: Object.keys(data),
                hasData: !!data.data,
                hasWeeklyReportData: !!(data.data && data.data.weeklyReportData),
                hasWeeklyData: !!data.weeklyReportData,
                dataStructure: typeof data
              });
            });
            
            console.log(`📋 Collection "${collectionName}":`, {
              exists: true,
              documentCount: documents.length,
              documents: documents
            });
            
            // Check for pattern matches in this collection
            if (selectedMonth && selectedYear) {
              const currentPattern = `${selectedMonth}_${selectedYear}`;
              const matchingDocs = documents.filter(doc => 
                doc.id.includes(currentPattern) || 
                doc.id.includes(selectedMonth) || 
                doc.id.includes(selectedYear)
              );
              if (matchingDocs.length > 0) {
                console.log(`🎯 Found potential matches in "${collectionName}":`, matchingDocs);
              }
            }
            
          } catch (collectionError) {
            console.log(`📋 Collection "${collectionName}": Does not exist or no access`);
          }
        }
        
      } catch (error) {
        console.error('❌ Error checking collections:', error);
      }
      
    } catch (error) {
      console.error('❌ Error in comprehensive Firestore debug:', error);
    }
  };

  // Manual data loading function for testing different paths
  const testDataLoading = async (collectionName, documentId) => {
    try {
      console.log(`🧪 TESTING: Loading from ${collectionName}/${documentId}`);
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('./firebase');
      
      const docRef = doc(db, collectionName, documentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log(`✅ TEST SUCCESS: Found document ${collectionName}/${documentId}:`, {
          dataKeys: Object.keys(data),
          hasData: !!data.data,
          hasWeeklyReportData: !!(data.data && data.data.weeklyReportData),
          hasDirectWeeklyData: !!data.weeklyReportData,
          fullData: data
        });
        
        // Try to load this data into the Command Center
        if (data.data && data.data.weeklyReportData) {
          console.log('🔄 Loading nested data structure...');
          setWeeklyReportData(data.data.weeklyReportData);
        } else if (data.weeklyReportData) {
          console.log('🔄 Loading direct data structure...');
          setWeeklyReportData(data.weeklyReportData);
        } else {
          console.log('⚠️ No recognizable weekly report data structure found');
        }
        
      } else {
        console.log(`❌ TEST FAILED: Document ${collectionName}/${documentId} does not exist`);
      }
      
    } catch (error) {
      console.error(`❌ TEST ERROR: Error loading ${collectionName}/${documentId}:`, error);
    }
  };

  // Add test function to window for manual testing
  useEffect(() => {
    window.testCommandCenterData = testDataLoading;
    console.log('🧪 Test function available: window.testCommandCenterData("collectionName", "documentId")');
  }, []);

  // Load data from Firestore on component mount
  useEffect(() => {
    loadBarangaysFromFirestore();
    loadConcernTypesFromFirestore();
    debugFirestoreDocuments();
  }, []);

  // Cleanup debounce timeout when photo upload dialog closes
  useEffect(() => {
    return () => {
      if (remarksDebounceRef.current) {
        clearTimeout(remarksDebounceRef.current);
      }
    };
  }, [showPhotoUploadDialog]);

  // Set default active municipality tab when component loads
  useEffect(() => {
    if (importedBarangays.length > 0 && !activeMunicipalityTab) {
      const allMunicipalities = Object.values(municipalitiesByDistrict).flat();
      const firstMunicipality = allMunicipalities[0];
      setActiveMunicipalityTab(firstMunicipality);
      setSelectedReportMunicipality(firstMunicipality);
    }
  }, [importedBarangays, activeMunicipalityTab]);

  // Load weekly report data when year/municipality/month changes with debouncing
  useEffect(() => {
    // Check if we already have this data cached
    const cacheKey = `${selectedMonth}-${selectedYear}-${activeMunicipalityTab}`;
    const isSameAsLast = lastLoadedWeeklyRef.current.month === selectedMonth &&
                         lastLoadedWeeklyRef.current.year === selectedYear &&
                         lastLoadedWeeklyRef.current.municipality === activeMunicipalityTab;
    
    if (isSameAsLast && weeklyReportCache.current[cacheKey]) {
      console.log('📦 Using cached weekly report data for:', cacheKey);
      return;
    }
    
    console.log('🔄 Loading weekly report data for:', {
      selectedMonth,
      selectedYear,
      activeMunicipalityTab
    });
    
    // Only load if we have a valid month and year
    if (selectedMonth && selectedYear && activeMunicipalityTab) {
      loadWeeklyReportData();
    }
  }, [selectedMonth, selectedYear, activeMunicipalityTab]);

  // Component initialization - removed local storage usage

  // Clear concern types when municipality changes
  useEffect(() => {
    if (activeMunicipalityTab) {
      // Clear concern types that don't match the selected municipality
      const updatedWeeklyData = { ...weeklyReportData };
      const dates = generateDates(selectedMonth, selectedYear);
      
      dates.forEach(date => {
        if (updatedWeeklyData[date]) {
          const currentConcernType = updatedWeeklyData[date].concernType;
          if (currentConcernType) {
            // Check if the current concern type is valid for the selected municipality
            const isValidForMunicipality = importedConcernTypes.some(type => 
              type.name === currentConcernType && 
              (type.municipality === activeMunicipalityTab || type.municipality === "All Municipalities")
            );
            
            if (!isValidForMunicipality) {
              updatedWeeklyData[date].concernType = "";
            }
          }
        }
      });
      
      setWeeklyReportData(updatedWeeklyData);
    }
  }, [activeMunicipalityTab]);

  // Removed local storage functionality - data now comes from Firestore only

  // Find and load available data from Firestore
  const findAndLoadAvailableData = async () => {
    try {
      console.log('🔍 Searching for any available data in nested structure...');
      
      // Search in the nested structure: commandCenter > weeklyReports > [municipalities]
      try {
        const weeklyReportsRef = collection(db, 'commandCenter', 'weeklyReports');
        const municipalitySnapshot = await getDocs(weeklyReportsRef);
        
        if (!municipalitySnapshot.empty) {
          console.log(`📊 Found ${municipalitySnapshot.size} municipalities in weeklyReports`);
          
          // Check each municipality
          for (const municipalityDoc of municipalitySnapshot.docs) {
            const municipalityName = municipalityDoc.id;
            console.log(`🔍 Checking municipality: ${municipalityName}`);
            
            // Get all month/year documents for this municipality
            const monthsRef = collection(db, 'commandCenter', 'weeklyReports', municipalityName);
            const monthsSnapshot = await getDocs(monthsRef);
            
            if (!monthsSnapshot.empty) {
              console.log(`📊 Found ${monthsSnapshot.size} month documents for ${municipalityName}`);
              
              // Check each month document
              for (const monthDoc of monthsSnapshot.docs) {
                const data = monthDoc.data();
                const monthDocId = monthDoc.id;
                
                console.log(`🔍 Checking ${municipalityName}/${monthDocId}:`, Object.keys(data));
                
                if (data.weeklyReportData && Object.keys(data.weeklyReportData).length > 0) {
                  console.log('✅ Found available data! Loading...', Object.keys(data.weeklyReportData).slice(0, 3));
                  setWeeklyReportData(data.weeklyReportData);
                  
                  // Extract month/year from document ID or data
                  const monthYearMatch = monthDocId.match(/([A-Za-z]+)_(\d{4})/);
                  if (monthYearMatch) {
                    const [, month, year] = monthYearMatch;
                    console.log(`📅 Auto-setting month/year to: ${month} ${year}`);
                    setSelectedMonth(month);
                    setSelectedYear(year);
                  } else if (data.selectedMonth && data.selectedYear) {
                    console.log(`📅 Auto-setting from data: ${data.selectedMonth} ${data.selectedYear}`);
                    setSelectedMonth(data.selectedMonth);
                    setSelectedYear(data.selectedYear);
                  }
                  
                  // Set the municipality tab
                  if (municipalityName !== 'All') {
                    console.log(`📍 Auto-setting municipality to: ${municipalityName}`);
                    setActiveMunicipalityTab(municipalityName);
                  }
                  
                  return true;
                }
              }
            }
          }
        }
      } catch (error) {
        console.log('❌ Error checking nested structure:', error);
      }
      
      // Fallback to old structure search
      console.log('🔄 Falling back to old structure search...');
      const collections = ['commandCenter', 'weeklyReports'];
      
      for (const collectionName of collections) {
        try {
          const querySnapshot = await getDocs(collection(db, collectionName));
          
          if (!querySnapshot.empty) {
            console.log(`📊 Found ${querySnapshot.size} documents in ${collectionName}`);
            
            for (const doc of querySnapshot.docs) {
              const data = doc.data();
              console.log(`🔍 Checking document ${doc.id}:`, Object.keys(data));
              
              let weeklyData = null;
              if (data.weeklyReportData && Object.keys(data.weeklyReportData).length > 0) {
                weeklyData = data.weeklyReportData;
              } else if (data.data && data.data.weeklyReportData && Object.keys(data.data.weeklyReportData).length > 0) {
                weeklyData = data.data.weeklyReportData;
              }
              
              if (weeklyData) {
                console.log('✅ Found available data in old structure! Loading...', Object.keys(weeklyData).slice(0, 3));
                setWeeklyReportData(weeklyData);
                return true;
              }
            }
          }
        } catch (error) {
          console.log(`❌ Error checking collection ${collectionName}:`, error);
        }
      }
      
      console.log('❌ No available data found in any structure');
      return false;
    } catch (error) {
      console.error('❌ Error searching for available data:', error);
      return false;
    }
  };

  // Load weekly report data from Firestore
  const loadWeeklyReportData = async () => {
    if (!selectedMonth || !selectedYear) {
      console.log('❌ loadWeeklyReportData: No month or year selected');
      return;
    }
    
    // Check cache first
    const cacheKey = `${selectedMonth}-${selectedYear}-${activeMunicipalityTab}`;
    if (weeklyReportCache.current[cacheKey] &&
        lastLoadedWeeklyRef.current.month === selectedMonth &&
        lastLoadedWeeklyRef.current.year === selectedYear &&
        lastLoadedWeeklyRef.current.municipality === activeMunicipalityTab) {
      console.log('📦 Using cached data, skipping Firestore read');
      setWeeklyReportData(weeklyReportCache.current[cacheKey]);
      return;
    }
    
    console.log(`🔄 Loading weekly report data for: ${selectedMonth} ${selectedYear} (${activeMunicipalityTab})`);
    console.log(`📊 Available months in allMonthsData:`, Object.keys(allMonthsData));
    setIsLoadingWeeklyReports(true);
    try {
      // NEW: Load from nested collection structure: commandCenter > weeklyReports > Municipality > MonthYear
      const monthYear = `${selectedMonth}_${selectedYear}`;
      const municipality = activeMunicipalityTab || 'All';
      const reportKey = `${monthYear}${activeMunicipalityTab ? `_${activeMunicipalityTab}` : ''}`;
      
      console.log('🔍 Loading from nested collection structure:', {
        selectedMonth,
        selectedYear,
        activeMunicipalityTab,
        monthYear,
        municipality,
        expectedPath: `commandCenter/weeklyReports/${municipality}/${monthYear}`
      });
      
      // Try to load from the nested structure first
      let result = null;
      if (activeMunicipalityTab) {
        try {
          const docRef = doc(db, 'commandCenter', 'weeklyReports', municipality, monthYear);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            result = {
              success: true,
              data: docSnap.data()
            };
            console.log('✅ Found data in nested structure:', docSnap.data());
          } else {
            console.log('❌ No document found in nested structure');
            result = { success: false, data: null };
          }
        } catch (error) {
          console.error('❌ Error loading from nested structure:', error);
          result = { success: false, data: null, error };
        }
      }
      
      // Fallback to old structure if nested doesn't work
      if (!result || !result.success) {
        console.log('🔄 Trying fallback to old structure...');
        result = await getWeeklyReport(reportKey);
      }
      
      console.log('🔍 Firestore Query Result:', {
        success: result.success,
        hasData: !!result.data,
        dataKeys: result.data ? Object.keys(result.data) : [],
        hasWeeklyReportData: !!(result.data && result.data.weeklyReportData),
        weeklyReportDataKeys: result.data && result.data.weeklyReportData ? Object.keys(result.data.weeklyReportData) : [],
        error: result.error
      });
      
      if (result.success && result.data && Object.keys(result.data).length > 0) {
        console.log('📊 Found data in Firestore:', result.data);
        console.log('📋 Data structure keys:', Object.keys(result.data));
        
        let weeklyData = null;
        
        // Try different data structure patterns
        if (result.data.weeklyReportData) {
          // New structure: { weeklyReportData: {...}, selectedBarangay: "...", ... }
          console.log('📊 Using new data structure (weeklyReportData)');
          weeklyData = result.data.weeklyReportData;
        } else if (result.data.data && result.data.data.weeklyReportData) {
          // Nested structure: { data: { weeklyReportData: {...}, ... } }
          console.log('📊 Using nested data structure (data.weeklyReportData)');
          weeklyData = result.data.data.weeklyReportData;
        } else if (result.data.data && typeof result.data.data === 'object') {
          // Legacy structure: { data: { "January 1, 2024": [...], ... } }
          console.log('📊 Using legacy data structure (direct data)');
          weeklyData = result.data.data;
        } else {
          // Direct structure: { "January 1, 2024": [...], ... }
          console.log('📊 Checking for direct date structure');
          const dateKeys = Object.keys(result.data).filter(key => 
            key.includes('January') || key.includes('February') || key.includes('March') ||
            key.includes('April') || key.includes('May') || key.includes('June') ||
            key.includes('July') || key.includes('August') || key.includes('September') ||
            key.includes('October') || key.includes('November') || key.includes('December')
          );
          if (dateKeys.length > 0) {
            console.log('📊 Using direct date structure');
            weeklyData = result.data;
          }
        }
        
        if (weeklyData && Object.keys(weeklyData).length > 0) {
          console.log('✅ Loading weekly data with', Object.keys(weeklyData).length, 'dates');
          console.log('📋 Sample data keys:', Object.keys(weeklyData).slice(0, 5));
          console.log('📋 Sample data entry:', Object.keys(weeklyData).length > 0 ? weeklyData[Object.keys(weeklyData)[0]] : 'No data');
          
          // Cache the loaded data
          weeklyReportCache.current[cacheKey] = weeklyData;
          lastLoadedWeeklyRef.current = { month: selectedMonth, year: selectedYear, municipality: activeMunicipalityTab };
          
          setWeeklyReportData(weeklyData);
          
          // Force re-render by updating a dummy state
          setIsLoadingWeeklyReports(false);
          setTimeout(() => setIsLoadingWeeklyReports(false), 100);
          
          // Load form fields if they exist (for backward compatibility)
          const formData = result.data.data || result.data;
          setSelectedBarangay(formData.selectedBarangay || "");
          setSelectedConcernType(formData.selectedConcernType || "");
          setActionTaken(formData.actionTaken || "");
          setRemarks(formData.remarks || "");
          console.log('✅ Loaded weekly report data for:', reportKey);
          return;
        } else {
          console.log('⚠️ Found document but no recognizable weekly data structure');
        }
      } else {
        console.log('❌ No data found in Firestore for key:', reportKey);
        
        // Try to find data for other months/years if current selection has no data
        console.log('🔍 Searching for available data in other months...');
        await findAndLoadAvailableData();
      }
      
      // If no data anywhere, initialize empty structure
      console.log('📝 No data found anywhere, initializing empty structure');
      initializeWeeklyReportData();
      // Clear form fields if no data found
      setSelectedBarangay("");
      setSelectedConcernType("");
      setActionTaken("");
      setRemarks("");
      console.log('📝 No existing weekly report data found for:', reportKey);
    } catch (error) {
      console.error('❌ Error loading weekly report data:', error);
      initializeWeeklyReportData();
    } finally {
      setIsLoadingWeeklyReports(false);
    }
  };

  // Initialize weekly report data structure for all dates
  const initializeWeeklyReportData = () => {
    const dates = generateDates(selectedMonth, selectedYear);
    const initialData = {};
    
    dates.forEach(date => {
      initialData[date] = []; // Array to hold multiple entries per date
    });
    
    setWeeklyReportData(initialData);
  };

  // Update individual date data
  const updateDateData = (date, entryIndex, field, value) => {
    setWeeklyReportData(prev => {
      const dateEntries = prev[date] || [];
      const updatedEntries = [...dateEntries];
      
      if (updatedEntries[entryIndex]) {
        updatedEntries[entryIndex] = { ...updatedEntries[entryIndex], [field]: value };
      }
      
      return {
        ...prev,
        [date]: updatedEntries
      };
    });
  };

  // Add new entry to a date
  const addDateEntry = (date) => {
    setWeeklyReportData(prev => {
      const dateEntries = prev[date] || [];
      const newEntry = {
        id: `entry-${Date.now()}-${Math.random()}`,
        barangay: "",
        concernType: "",
        week1: "",
        week2: "",
        week3: "",
        week4: "",
        actionTaken: "",
        remarks: ""
      };
      
      return {
        ...prev,
        [date]: [...dateEntries, newEntry]
      };
    });
  };

  // Remove entry from a date
  const removeDateEntry = (date, entryIndex) => {
    setWeeklyReportData(prev => {
      const dateEntries = prev[date] || [];
      const updatedEntries = dateEntries.filter((_, index) => index !== entryIndex);
      
      return {
        ...prev,
        [date]: updatedEntries
      };
    });
  };

  // Get data for a specific date (returns array of entries)
  const getDateData = (date) => {
    const data = weeklyReportData[date] || [];
    // Debug logging for data retrieval
    if (Object.keys(weeklyReportData).length > 0 && data.length === 0) {
      console.log(`🔍 getDateData Debug - Looking for: "${date}", Available keys:`, Object.keys(weeklyReportData).slice(0, 5), 'Found:', data.length, 'entries');
    }
    return data;
  };

  // Validate if entry has all required data (required before photo upload)
  const isEntryIncomplete = (entry) => {
    if (!entry) return true;
    
    const hasBarangay = entry.barangay && String(entry.barangay).trim() !== '';
    const hasConcernType = entry.concernType && String(entry.concernType).trim() !== '';
    
    // Handle week data - can be either string or number
    const hasWeekData = (entry.week1 && (typeof entry.week1 === 'number' ? entry.week1 > 0 : String(entry.week1).trim() !== '')) ||
                        (entry.week2 && (typeof entry.week2 === 'number' ? entry.week2 > 0 : String(entry.week2).trim() !== '')) ||
                        (entry.week3 && (typeof entry.week3 === 'number' ? entry.week3 > 0 : String(entry.week3).trim() !== '')) ||
                        (entry.week4 && (typeof entry.week4 === 'number' ? entry.week4 > 0 : String(entry.week4).trim() !== ''));
    
    const hasActionTaken = entry.actionTaken && String(entry.actionTaken).trim() !== '';
    
    // Entry is incomplete if ANY required field is missing
    // All fields must be filled: barangay, concern type, at least one week, and action taken
    return !hasBarangay || !hasConcernType || !hasWeekData || !hasActionTaken;
  };

  // Photo upload handlers
  const handleOpenPhotoUpload = (date, entryIndex) => {
    const entry = weeklyReportData[date]?.[entryIndex];
    
    // Validate that entry has all required data before allowing photo upload
    if (isEntryIncomplete(entry)) {
      showError('Please complete all required fields (Barangay, Concern Type, at least one Week, and Action Taken) before uploading photos.');
      return;
    }
    
    setCurrentPhotoEntry({ date, entryIndex, entry });
    
    // Initialize photoRows from existing data
    let initialRows = [];
    
    // Check if entry has rows structure (new format)
    if (entry?.photos?.rows && Array.isArray(entry.photos.rows) && entry.photos.rows.length > 0) {
      // Load existing rows with their photos as previews
      initialRows = entry.photos.rows.map(row => ({
        id: row.rowId,
        beforePhotos: [],
        afterPhotos: [],
        beforePreviews: row.before || [],
        afterPreviews: row.after || []
      }));
    } else {
      // Fallback to old format (single row with before/after)
      const beforeData = entry?.photos?.before;
      const afterData = entry?.photos?.after;
      
      // Convert to array if it's a string (old format)
      const beforePhotos = Array.isArray(beforeData) ? beforeData : (beforeData ? [beforeData] : []);
      const afterPhotos = Array.isArray(afterData) ? afterData : (afterData ? [afterData] : []);
      
      initialRows = [{
        id: 1,
        beforePhotos: [],
        afterPhotos: [],
        beforePreviews: beforePhotos,
        afterPreviews: afterPhotos
      }];
    }
    
    // If no rows exist, create an empty first row
    if (initialRows.length === 0) {
      initialRows = [{
        id: 1,
        beforePhotos: [],
        afterPhotos: [],
        beforePreviews: [],
        afterPreviews: []
      }];
    }
    
    setPhotoRows(initialRows);
    setShowPhotoUploadDialog(true);
  };

  // Compress image to under 2MB
  const compressImage = async (file, maxSizeMB = 2) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        // Use HTMLImageElement to avoid conflict with lucide-react Image icon
        const img = document.createElement('img');
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions while maintaining aspect ratio
          const maxDimension = 1920; // Max width or height
          if (width > height && width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Start with quality 0.9 and reduce if needed
          let quality = 0.9;
          const tryCompress = () => {
            canvas.toBlob(
              (blob) => {
                const sizeMB = blob.size / 1024 / 1024;
                
                if (sizeMB <= maxSizeMB || quality <= 0.5) {
                  // Convert blob to file
                  const compressedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  });
                  console.log(`✅ Image compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${sizeMB.toFixed(2)}MB (quality: ${quality})`);
                  resolve(compressedFile);
                } else {
                  // Reduce quality and try again
                  quality -= 0.1;
                  tryCompress();
                }
              },
              'image/jpeg',
              quality
            );
          };
          
          tryCompress();
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleBeforePhotoChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      try {
        const compressedFiles = [];
        const previews = [];
        
        for (const file of files) {
          const originalSize = (file.size / 1024 / 1024).toFixed(2);
          console.log(`📸 Original before photo size: ${originalSize}MB`);
          
          // Compress image
          const compressedFile = await compressImage(file, 2);
          compressedFiles.push(compressedFile);
          
          // Create preview
          const reader = new FileReader();
          const preview = await new Promise((resolve) => {
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(compressedFile);
          });
          previews.push(preview);
          
          const compressedSize = (compressedFile.size / 1024 / 1024).toFixed(2);
          if (originalSize > 2) {
            console.log(`✅ Before photo compressed from ${originalSize}MB to ${compressedSize}MB`);
          }
        }
        
        setBeforePhotos(prev => [...prev, ...compressedFiles]);
        setBeforePhotoPreviews(prev => [...prev, ...previews]);
        showSuccess(`${files.length} before photo(s) added successfully`);
      } catch (error) {
        console.error('Error compressing before photos:', error);
        showError('Failed to process images. Please try again.');
      }
    }
  };

  const handleAfterPhotoChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      try {
        const compressedFiles = [];
        const previews = [];
        
        for (const file of files) {
          const originalSize = (file.size / 1024 / 1024).toFixed(2);
          console.log(`📸 Original after photo size: ${originalSize}MB`);
          
          // Compress image
          const compressedFile = await compressImage(file, 2);
          compressedFiles.push(compressedFile);
          
          // Create preview
          const reader = new FileReader();
          const preview = await new Promise((resolve) => {
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(compressedFile);
          });
          previews.push(preview);
          
          const compressedSize = (compressedFile.size / 1024 / 1024).toFixed(2);
          if (originalSize > 2) {
            console.log(`✅ After photo compressed from ${originalSize}MB to ${compressedSize}MB`);
          }
        }
        
        setAfterPhotos(prev => [...prev, ...compressedFiles]);
        setAfterPhotoPreviews(prev => [...prev, ...previews]);
        showSuccess(`${files.length} after photo(s) added successfully`);
      } catch (error) {
        console.error('Error compressing after photos:', error);
        showError('Failed to process images. Please try again.');
      }
    }
  };

  const handleUploadPhotos = async () => {
    if (!currentPhotoEntry) return;
    
    // Check if remarks are required (when after photos exist)
    const hasAfterPhotos = photoRows.some(row => row.afterPreviews.length > 0 || row.afterPhotos.length > 0);
    const remarks = currentPhotoEntry?.entry?.remarks || '';
    
    if (hasAfterPhotos && !remarks.trim()) {
      showError('Please add remarks before uploading. Remarks are required when after photos are present.');
      return;
    }
    
    setIsUploadingPhotos(true);
    try {
      const { date, entryIndex } = currentPhotoEntry;
      const photos = {};
      const uploadTimestamp = new Date().toISOString();
      
      // Process each row separately to maintain row organization
      let totalNewPhotos = 0;
      photos.rows = [];
      
      // First, collect existing rows from database
      const existingRows = currentPhotoEntry?.entry?.photos?.rows || [];
      
      // Get existing before/after photos from old format
      const existingBeforeData = currentPhotoEntry?.entry?.photos?.before;
      const existingBefore = Array.isArray(existingBeforeData) ? existingBeforeData : (existingBeforeData ? [existingBeforeData] : []);
      const existingAfterData = currentPhotoEntry?.entry?.photos?.after;
      const existingAfter = Array.isArray(existingAfterData) ? existingAfterData : (existingAfterData ? [existingAfterData] : []);
      const existingBeforeTimestamps = currentPhotoEntry?.entry?.photos?.beforeUploadedAt || [];
      const existingAfterTimestamps = currentPhotoEntry?.entry?.photos?.afterUploadedAt || [];
      
      for (const row of photoRows) {
        const rowPhotos = {};
        
        // Check if this row already exists in database
        const existingRow = existingRows.find(r => r.rowId === row.id);
        
        // Upload before photos for this row
        if (row.beforePhotos.length > 0) {
          const beforeUrls = [];
          const beforeTimestamps = [];
          
          for (let i = 0; i < row.beforePhotos.length; i++) {
            const result = await cloudinaryUtils.uploadImage(row.beforePhotos[i], {
              folder: `ipatroller/command-center/${activeMunicipalityTab}/${selectedMonth}_${selectedYear}`,
              publicId: `before-${date}-${entryIndex}-row${row.id}-${i}-${Date.now()}`
            });
            
            if (result.success) {
              beforeUrls.push(result.data.url);
              beforeTimestamps.push(uploadTimestamp);
              totalNewPhotos++;
            } else {
              throw new Error(`Failed to upload before photo in row ${row.id}`);
            }
          }
          
          // Combine with existing before photos from this row
          const existingRowBefore = existingRow?.before || [];
          const existingRowBeforeTimestamps = existingRow?.beforeUploadedAt || [];
          
          // For Row 1, also include old format photos if they exist
          let allBefore = [...existingRowBefore];
          let allBeforeTimestamps = [...existingRowBeforeTimestamps];
          if (row.id === 1 && existingBefore.length > 0) {
            allBefore = [...existingBefore, ...existingRowBefore];
            allBeforeTimestamps = [...existingBeforeTimestamps, ...existingRowBeforeTimestamps];
          }
          
          rowPhotos.before = [...allBefore, ...beforeUrls];
          rowPhotos.beforeUploadedAt = [...allBeforeTimestamps, ...beforeTimestamps];
        } else if (existingRow?.before) {
          // Keep existing before photos if no new ones
          rowPhotos.before = existingRow.before;
          rowPhotos.beforeUploadedAt = existingRow.beforeUploadedAt || [];
        } else if (row.id === 1 && existingBefore.length > 0) {
          // For Row 1, include old format photos if they exist
          rowPhotos.before = existingBefore;
          rowPhotos.beforeUploadedAt = existingBeforeTimestamps;
        }
        
        // Upload after photos for this row
        if (row.afterPhotos.length > 0) {
          const afterUrls = [];
          const afterTimestamps = [];
          
          for (let i = 0; i <row.afterPhotos.length; i++) {
            const result = await cloudinaryUtils.uploadImage(row.afterPhotos[i], {
              folder: `ipatroller/command-center/${activeMunicipalityTab}/${selectedMonth}_${selectedYear}`,
              publicId: `after-${date}-${entryIndex}-row${row.id}-${i}-${Date.now()}`
            });
            
            if (result.success) {
              afterUrls.push(result.data.url);
              afterTimestamps.push(uploadTimestamp);
              totalNewPhotos++;
            } else {
              throw new Error(`Failed to upload after photo in row ${row.id}`);
            }
          }
          
          // Combine with existing after photos from this row
          const existingRowAfter = existingRow?.after || [];
          const existingRowAfterTimestamps = existingRow?.afterUploadedAt || [];
          
          // For Row 1, also include old format photos if they exist
          let allAfter = [...existingRowAfter];
          let allAfterTimestamps = [...existingRowAfterTimestamps];
          if (row.id === 1 && existingAfter.length > 0) {
            allAfter = [...existingAfter, ...existingRowAfter];
            allAfterTimestamps = [...existingAfterTimestamps, ...existingRowAfterTimestamps];
          }
          
          rowPhotos.after = [...allAfter, ...afterUrls];
          rowPhotos.afterUploadedAt = [...allAfterTimestamps, ...afterTimestamps];
        } else if (existingRow?.after) {
          // Keep existing after photos if no new ones
          rowPhotos.after = existingRow.after;
          rowPhotos.afterUploadedAt = existingRow.afterUploadedAt || [];
        } else if (row.id === 1 && existingAfter.length > 0) {
          // For Row 1, include old format photos if they exist
          rowPhotos.after = existingAfter;
          rowPhotos.afterUploadedAt = existingAfterTimestamps;
        }
        
        // Add row photos if there are any photos in this row
        if (Object.keys(rowPhotos).length > 0) {
          photos.rows.push({
            rowId: row.id,
            ...rowPhotos
          });
        }
      }
      
      // Also keep existing photos for backward compatibility
      if (existingBefore.length > 0) {
        photos.before = existingBefore;
        photos.beforeUploadedAt = existingBeforeTimestamps;
      }
      if (existingAfter.length > 0) {
        photos.after = existingAfter;
        photos.afterUploadedAt = existingAfterTimestamps;
      }
      
      // Update the entry with photo URLs
      updateDateData(date, entryIndex, 'photos', photos);
      
      showSuccess(`${totalNewPhotos} photo(s) uploaded successfully!`);
      setShowPhotoUploadDialog(false);
      setPhotoRows([{ id: 1, beforePhotos: [], afterPhotos: [], beforePreviews: [], afterPreviews: [] }]);
      setCurrentPhotoEntry(null);
    } catch (error) {
      console.error('Error uploading photos:', error);
      showError('Failed to upload photos. Please try again.');
    } finally {
      setIsUploadingPhotos(false);
    }
  };

  const handleViewPhotos = (date, entryIndex) => {
    const entry = weeklyReportData[date]?.[entryIndex];
    if (entry?.photos) {
      setViewingPhotos({
        ...entry.photos,
        barangay: entry.barangay,
        concernType: entry.concernType,
        remarks: entry.remarks
      });
      setShowPhotoViewDialog(true);
    }
  };

  const handleResetPhotos = async (date, entryIndex) => {
    if (!isAdmin) {
      showError('Only administrators can reset photos');
      return;
    }

    const entry = weeklyReportData[date]?.[entryIndex];
    const hasPhotos = entry?.photos?.before || entry?.photos?.after;

    const confirmReset = window.confirm(
      'Are you sure you want to reset the photos for this entry?\n\n' +
      'This will DELETE the photos from Cloudinary and remove the photo links and remarks.\n' +
      'This action cannot be undone.'
    );

    if (confirmReset) {
      let deletionResults = { before: null, after: null };
      
      // Try to delete photos from Cloudinary
      if (hasPhotos) {
        showInfo('Deleting photos from Cloudinary...');
        
        if (entry.photos.before) {
          console.log('🗑️ Deleting before photo:', entry.photos.before);
          deletionResults.before = await cloudinaryUtils.deleteResource(entry.photos.before);
        }
        
        if (entry.photos.after) {
          console.log('🗑️ Deleting after photo:', entry.photos.after);
          deletionResults.after = await cloudinaryUtils.deleteResource(entry.photos.after);
        }
      }
      
      // Remove photos and remarks from the entry
      updateDateData(date, entryIndex, 'photos', null);
      updateDateData(date, entryIndex, 'remarks', '');
      
      // Determine success message based on deletion results
      const beforeDeleted = !entry?.photos?.before || deletionResults.before?.success;
      const afterDeleted = !entry?.photos?.after || deletionResults.after?.success;
      
      if (beforeDeleted && afterDeleted) {
        showSuccess('Photos deleted from Cloudinary and reset successfully.');
      } else if (deletionResults.before?.partialSuccess || deletionResults.after?.partialSuccess) {
        showWarning('Photo links removed. Note: Could not delete from Cloudinary (may require server-side setup). Files remain in cloud storage.');
      } else {
        showSuccess('Photo links and remarks reset successfully.');
      }
      
      // Add to terminal history
      const newEntry = {
        id: Date.now(),
        command: "photos.reset",
        output: `Admin reset photos and remarks for ${date}, Entry ${entryIndex + 1}. Cloudinary deletion: ${beforeDeleted && afterDeleted ? 'Success' : 'Partial/Failed'}`,
        type: "warning",
        timestamp: new Date()
      };
      setTerminalHistory(prev => [...prev, newEntry]);
    }
  };

  // Clear all weekly report data for active municipality
  const handleClearActiveMunicipalityData = async () => {
    if (window.confirm(`Are you sure you want to clear all weekly report data for ${activeMunicipalityTab}? This action cannot be undone.`)) {
      try {
        // Clear local state
        initializeWeeklyReportData();
        setSelectedBarangay("");
        setSelectedConcernType("");
        setActionTaken("");
        setRemarks("");
        
        // Clear from Firestore
        const monthYear = `${selectedMonth}_${selectedYear}`;
        const municipalityKey = activeMunicipalityTab ? `_${activeMunicipalityTab}` : '';
        const reportKey = `${monthYear}${municipalityKey}`;
        
        const reportData = {
          month: selectedMonth,
          year: selectedYear,
          municipality: activeMunicipalityTab || "All Municipalities",
          selectedBarangay: "",
          selectedConcernType: "",
          actionTaken: "",
          remarks: "",
          weeklyReportData: {},
          savedAt: new Date().toISOString(),
          clearedAt: new Date().toISOString()
        };

        // Save cleared data to nested structure with quota check
        const saveResult = await saveWithQuotaCheck(
          () => saveWeeklyReportByMunicipality(reportData),
          "Clear Weekly Report Data"
        );
        if (saveResult.success) {
          // Update cache with cleared data
          const cacheKey = `${selectedMonth}-${selectedYear}-${activeMunicipalityTab}`;
          weeklyReportCache.current[cacheKey] = {};
          lastLoadedWeeklyRef.current = { month: selectedMonth, year: selectedYear, municipality: activeMunicipalityTab };
          
          toast.success(`Weekly report data cleared for ${activeMunicipalityTab}`);
          showSuccess(`Weekly report data cleared for ${activeMunicipalityTab}`);
        } else {
          toast.warning(`Local data cleared, but failed to clear from database: ${saveResult.error}`);
          showError(`Local data cleared, but failed to clear from database: ${saveResult.error}`);
        }
        
        // Add to terminal history
        const newEntry = {
          id: Date.now(),
          command: "weekly.clear.municipality",
          output: `Cleared weekly report data for ${activeMunicipalityTab}`,
          type: "warning",
          timestamp: new Date()
        };
        setTerminalHistory(prev => [...prev, newEntry]);
      } catch (error) {
        console.error("Error clearing active municipality data:", error);
        toast.error("Error clearing data: " + error.message);
        showError('Error clearing data: ' + error.message);
      }
    }
  };

  // Clear weekly report data for selected municipality
  const handleClearSelectedMunicipalityData = async () => {
    if (!selectedClearMunicipality) {
      toast.error("Please select a municipality to clear data for");
      showError('Please select a municipality to clear data for');
      return;
    }

    if (window.confirm(`Are you sure you want to clear all weekly report data for ${selectedClearMunicipality}? This action cannot be undone.`)) {
      try {
        // Clear data from Firestore for the selected municipality
        const monthYear = `${selectedMonth}_${selectedYear}`;
        const municipalityKey = `_${selectedClearMunicipality}`;
        const reportKey = `${monthYear}${municipalityKey}`;
        
        // Save empty data to Firestore
        const reportData = {
          month: selectedMonth,
          year: selectedYear,
          municipality: selectedClearMunicipality,
          selectedBarangay: "",
          selectedConcernType: "",
          actionTaken: "",
          remarks: "",
          weeklyReportData: {},
          savedAt: new Date().toISOString(),
          clearedAt: new Date().toISOString()
        };

        // Save cleared data to nested structure with quota check
        const saveResult = await saveWithQuotaCheck(
          () => saveWeeklyReportByMunicipality(reportData),
          "Clear Municipality Weekly Report"
        );
        if (saveResult.success) {
          toast.success(`Weekly report data cleared for ${selectedClearMunicipality}`);
          showSuccess(`Weekly report data cleared for ${selectedClearMunicipality}`);
          
          // If the cleared municipality is the active tab, also clear local data
          if (selectedClearMunicipality === activeMunicipalityTab) {
            initializeWeeklyReportData();
            setSelectedBarangay("");
            setSelectedConcernType("");
            setActionTaken("");
            setRemarks("");
          }
          
          // Add to terminal history
          const newEntry = {
            id: Date.now(),
            command: "weekly.clear.selected",
            output: `Cleared weekly report data for ${selectedClearMunicipality}`,
            type: "warning",
            timestamp: new Date()
          };
          setTerminalHistory(prev => [...prev, newEntry]);
        } else {
          toast.error("Failed to clear data from database: " + saveResult.error);
          showError('Failed to clear data from database: ' + saveResult.error);
        }
      } catch (error) {
        console.error("Error clearing selected municipality data:", error);
        toast.error("Error clearing selected municipality data");
        showError('Error clearing selected municipality data');
      }
    }
  };

  // Clear all entries (weekly report data for ALL municipalities across ALL months, keep barangays and concern types)
  const handleClearAllData = async () => {
    const confirmMessage = `⚠️ DANGER: DELETE ALL WEEKLY REPORTS ⚠️

This will permanently DELETE ALL weekly reports from the database:
• ALL municipalities
• ALL months and years  
• ALL weekly report data

Barangays and concern types will be kept.
This action CANNOT be undone.

Are you absolutely sure you want to proceed?`;

    if (window.confirm(confirmMessage)) {
      // Double confirmation for safety
      const doubleConfirm = window.prompt(
        'Type "DELETE ALL WEEKLY REPORTS" (without quotes) to confirm this destructive action:'
      );
      
      if (doubleConfirm === 'DELETE ALL WEEKLY REPORTS') {
        try {
          toast.loading('Deleting all weekly reports from database...', { duration: 0, id: 'clear-all-delete' });
          
          // Use the comprehensive delete function
          const result = await deleteAllWeeklyReports();
          
          toast.dismiss('clear-all-delete');
          
          if (result.success) {
            if (result.errors && result.errors.length > 0) {
              toast.warning(`Deleted ${result.deletedCount} documents with ${result.errors.length} errors. Check console for details.`);
              console.warn('❌ Deletion errors:', result.errors);
            } else {
              toast.success(`Successfully deleted all ${result.deletedCount} weekly reports from database`);
              showSuccess(`All weekly reports deleted successfully! Deleted ${result.deletedCount} documents from database. Barangay and concern type options are preserved.`);
            }
            
            // Clear local state
            initializeWeeklyReportData();
            setSelectedBarangay("");
            setSelectedConcernType("");
            setActionTaken("");
            setRemarks("");
            
            // Reload collection view if open
            if (showCollectionView) {
              await loadWeeklyReportsCollection();
            }
            
            // Add to terminal history
            const newEntry = {
              id: Date.now(),
              command: "clear.all.data.delete",
              output: `Deleted ${result.deletedCount} weekly reports from all database locations`,
              type: "warning",
              timestamp: new Date()
            };
            setTerminalHistory(prev => [...prev, newEntry]);
            
          } else {
            toast.error(`Failed to delete weekly reports: ${result.error}`);
            showError(`Failed to delete weekly reports: ${result.error}`);
          }
        } catch (error) {
          toast.dismiss('clear-all-delete');
          console.error('❌ Error in clear all data:', error);
          toast.error('Error deleting weekly reports from database');
          showError('Error deleting weekly reports from database');
        }
      } else {
        toast.info('Clear all data cancelled - confirmation text did not match');
      }
    }
  };

  // Export weekly report data to CSV
  const handleExportWeeklyReport = () => {
    const dates = generateDates(selectedMonth, selectedYear);
    const csvRows = ["DATE,BARANGAY,TYPE OF CONCERN,Week 1,Week 2,Week 3,Week 4,STATUS,REMARKS"];
    
    dates.forEach(date => {
      const dateEntries = getDateData(date);
      if (dateEntries.length === 0) {
        // Add empty row if no entries for this date
        csvRows.push([
          date,
          "",
          "",
          "0",
          "0",
          "0",
          "0",
          "",
          ""
        ].map(field => `"${field || ''}"`).join(','));
      } else {
        // Add row for each entry
        dateEntries.forEach(entry => {
          csvRows.push([
            date,
            entry.barangay, // This will be "Barangay, Municipality" format
            entry.concernType,
            entry.week1 || '0',
            entry.week2 || '0',
            entry.week3 || '0',
            entry.week4 || '0',
            entry.actionTaken,
            entry.remarks
          ].map(field => `"${field || ''}"`).join(','));
        });
      }
    });
    
    const csvContent = csvRows.join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weekly-report-${selectedMonth}-${selectedYear}-${activeMunicipalityTab || 'all'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success("Weekly report exported successfully");
    showSuccess('Weekly report exported successfully!');
  };

  // Get concern types for a specific municipality
  const getConcernTypesForMunicipality = (municipality) => {
    if (!municipality) return importedConcernTypes;
    
    // Normalize municipality name for comparison (handle "Balanga" vs "Balanga City")
    const normalizedMunicipality = municipality.toLowerCase().replace(/\s+city$/i, '').trim();
    
    return importedConcernTypes.filter(type => {
      if (type.municipality === "All Municipalities") return true;
      const normalizedType = type.municipality.toLowerCase().replace(/\s+city$/i, '').trim();
      return normalizedType === normalizedMunicipality;
    });
  };

  // Calculate summary statistics for weekly report per municipality
  const calculateWeeklyReportSummary = (municipality = null) => {
    try {
      const dates = generateDates(selectedMonth, selectedYear);
      let totalEntries = 0;
      let totalWeek1 = 0;
      let totalWeek2 = 0;
      let totalWeek3 = 0;
      let totalWeek4 = 0;
      let totalWeeklySum = 0;
      let uniqueBarangays = new Set();
      let uniqueConcernTypes = new Set();
      let entriesWithAction = 0;
      let entriesWithRemarks = 0;
      let weekStats = { week1: 0, week2: 0, week3: 0, week4: 0 };
      let concernTypeStats = {};
      let barangayStats = {};

      // Check if we have any data
      if (!weeklyReportData || Object.keys(weeklyReportData).length === 0) {
        return {
          totalEntries: 0,
          totalWeek1: 0,
          totalWeek2: 0,
          totalWeek3: 0,
          totalWeek4: 0,
          totalWeeklySum: 0,
          uniqueBarangays: 0,
          uniqueConcernTypes: 0,
          entriesWithAction: 0,
          entriesWithRemarks: 0,
          weekStats: { week1: 0, week2: 0, week3: 0, week4: 0 },
          topConcernTypes: [],
          topBarangays: [],
          completionRate: 0,
          remarksRate: 0,
          municipality: municipality || "All Municipalities"
        };
      }

    // Process all dates and their entries
    dates.forEach(date => {
      const dateEntries = getDateData(date);
      dateEntries.forEach(entry => {
        // Validate entry exists and has required properties
        if (!entry || typeof entry !== 'object') {
          return;
        }

        // Filter by municipality if specified
        if (municipality && entry.barangay) {
          // Handle different barangay formats
          let barangayMunicipality = '';
          if (entry.barangay.includes(', ')) {
            // Format: "Barangay, Municipality"
            barangayMunicipality = entry.barangay.split(', ')[1];
          } else if (entry.barangay.includes(' (')) {
            // Format: "Barangay (Municipality)"
            const match = entry.barangay.match(/\(([^)]+)\)/);
            barangayMunicipality = match ? match[1] : '';
          } else {
            // Try to find municipality from imported barangays (case-insensitive)
            const matchingBarangay = importedBarangays.find(b => 
              b.name.toLowerCase() === entry.barangay.toLowerCase()
            );
            barangayMunicipality = matchingBarangay ? matchingBarangay.municipality : '';
          }
          
          if (barangayMunicipality !== municipality) {
            return; // Skip this entry if it doesn't match the selected municipality
          }
        }
        
        totalEntries++;
        
        // Count weekly values - ensure they are valid numbers
        const week1 = isNaN(parseInt(entry.week1)) ? 0 : parseInt(entry.week1);
        const week2 = isNaN(parseInt(entry.week2)) ? 0 : parseInt(entry.week2);
        const week3 = isNaN(parseInt(entry.week3)) ? 0 : parseInt(entry.week3);
        const week4 = isNaN(parseInt(entry.week4)) ? 0 : parseInt(entry.week4);
        
        totalWeek1 += week1;
        totalWeek2 += week2;
        totalWeek3 += week3;
        totalWeek4 += week4;
        totalWeeklySum += week1 + week2 + week3 + week4;
        
        // Track unique values
        if (entry.barangay) {
          uniqueBarangays.add(entry.barangay);
          barangayStats[entry.barangay] = (barangayStats[entry.barangay] || 0) + 1;
        }
        
        if (entry.concernType) {
          uniqueConcernTypes.add(entry.concernType);
          concernTypeStats[entry.concernType] = (concernTypeStats[entry.concernType] || 0) + 1;
        }
        
        // Count entries with action taken and remarks
        if (entry.actionTaken && entry.actionTaken.trim()) {
          entriesWithAction++;
        }
        if (entry.remarks && entry.remarks.trim()) {
          entriesWithRemarks++;
        }
      });
    });

    // Calculate week statistics
    weekStats.week1 = totalWeek1;
    weekStats.week2 = totalWeek2;
    weekStats.week3 = totalWeek3;
    weekStats.week4 = totalWeek4;

    // Find top concern types and barangays
    const topConcernTypes = Object.entries(concernTypeStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));

    const topBarangays = Object.entries(barangayStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([barangay, count]) => ({ barangay, count }));

      return {
        totalEntries,
        totalWeek1,
        totalWeek2,
        totalWeek3,
        totalWeek4,
        totalWeeklySum,
        uniqueBarangays: uniqueBarangays.size,
        uniqueConcernTypes: uniqueConcernTypes.size,
        entriesWithAction,
        entriesWithRemarks,
        weekStats,
        topConcernTypes,
        topBarangays,
        completionRate: totalEntries > 0 ? Math.round((entriesWithAction / totalEntries) * 100) : 0,
        remarksRate: totalEntries > 0 ? Math.round((entriesWithRemarks / totalEntries) * 100) : 0,
        municipality: municipality || "All Municipalities"
      };
    } catch (error) {
      console.error('Error calculating weekly report summary:', error);
      return {
        totalEntries: 0,
        totalWeek1: 0,
        totalWeek2: 0,
        totalWeek3: 0,
        totalWeek4: 0,
        totalWeeklySum: 0,
        uniqueBarangays: 0,
        uniqueConcernTypes: 0,
        entriesWithAction: 0,
        entriesWithRemarks: 0,
        weekStats: { week1: 0, week2: 0, week3: 0, week4: 0 },
        topConcernTypes: [],
        topBarangays: [],
        completionRate: 0,
        remarksRate: 0,
        municipality: municipality || "All Municipalities"
      };
    }
  };

  // Calculate quarterly summary statistics
  const calculateQuarterlySummary = (municipality = null) => {
    try {
      const currentYear = selectedYear;
      const quarters = [
        { name: "Q1", months: ["January", "February", "March"], color: "blue" },
        { name: "Q2", months: ["April", "May", "June"], color: "green" },
        { name: "Q3", months: ["July", "August", "September"], color: "orange" },
        { name: "Q4", months: ["October", "November", "December"], color: "purple" }
      ];

      let totalEntries = 0;
      let totalWeeklySum = 0;
      let uniqueBarangays = new Set();
      let uniqueConcernTypes = new Set();
      let entriesWithAction = 0;
      let entriesWithRemarks = 0;
      let concernTypeStats = {};
      let barangayStats = {};
      let quarterlyStats = {};

      // Initialize quarterly stats
      quarters.forEach(quarter => {
        quarterlyStats[quarter.name] = {
          entries: 0,
          weeklySum: 0,
          barangays: new Set(),
          concernTypes: new Set()
        };
      });

      // Check if we have any data
      if (!weeklyReportData || Object.keys(weeklyReportData).length === 0) {
        return {
          totalEntries: 0,
          totalWeeklySum: 0,
          uniqueBarangays: 0,
          uniqueConcernTypes: 0,
          entriesWithAction: 0,
          entriesWithRemarks: 0,
          quarterlyStats: quarters.map(q => ({
            name: q.name,
            entries: 0,
            weeklySum: 0,
            barangays: 0,
            concernTypes: 0,
            color: q.color
          })),
          topConcernTypes: [],
          topBarangays: [],
          completionRate: 0,
          remarksRate: 0,
          municipality: municipality || "All Municipalities",
          year: currentYear
        };
      }

      // Process data for each quarter
      quarters.forEach(quarter => {
        quarter.months.forEach(month => {
          const dates = generateDates(month, currentYear);
          dates.forEach(date => {
            const dateEntries = getDateData(date);
            dateEntries.forEach(entry => {
              // Validate entry exists and has required properties
              if (!entry || typeof entry !== 'object') {
                return;
              }

              // Filter by municipality if specified
              if (municipality && entry.barangay) {
                let barangayMunicipality = '';
                if (entry.barangay.includes(', ')) {
                  barangayMunicipality = entry.barangay.split(', ')[1];
                } else if (entry.barangay.includes(' (')) {
                  const match = entry.barangay.match(/\(([^)]+)\)/);
                  barangayMunicipality = match ? match[1] : '';
                } else {
                  const matchingBarangay = importedBarangays.find(b => 
                    b.name.toLowerCase() === entry.barangay.toLowerCase()
                  );
                  barangayMunicipality = matchingBarangay ? matchingBarangay.municipality : '';
                }
                
                if (barangayMunicipality !== municipality) {
                  return;
                }
              }
              
              totalEntries++;
              quarterlyStats[quarter.name].entries++;
              
              // Count weekly values
              const week1 = isNaN(parseInt(entry.week1)) ? 0 : parseInt(entry.week1);
              const week2 = isNaN(parseInt(entry.week2)) ? 0 : parseInt(entry.week2);
              const week3 = isNaN(parseInt(entry.week3)) ? 0 : parseInt(entry.week3);
              const week4 = isNaN(parseInt(entry.week4)) ? 0 : parseInt(entry.week4);
              
              const entryWeeklySum = week1 + week2 + week3 + week4;
              totalWeeklySum += entryWeeklySum;
              quarterlyStats[quarter.name].weeklySum += entryWeeklySum;
              
              // Track unique values
              if (entry.barangay) {
                uniqueBarangays.add(entry.barangay);
                quarterlyStats[quarter.name].barangays.add(entry.barangay);
                barangayStats[entry.barangay] = (barangayStats[entry.barangay] || 0) + 1;
              }
              
              if (entry.concernType) {
                uniqueConcernTypes.add(entry.concernType);
                quarterlyStats[quarter.name].concernTypes.add(entry.concernType);
                concernTypeStats[entry.concernType] = (concernTypeStats[entry.concernType] || 0) + 1;
              }
              
              // Count entries with action taken and remarks
              if (entry.actionTaken && entry.actionTaken.trim()) {
                entriesWithAction++;
              }
              if (entry.remarks && entry.remarks.trim()) {
                entriesWithRemarks++;
              }
            });
          });
        });
      });

      // Convert quarterly stats to final format
      const finalQuarterlyStats = quarters.map(quarter => ({
        name: quarter.name,
        entries: quarterlyStats[quarter.name].entries,
        weeklySum: quarterlyStats[quarter.name].weeklySum,
        barangays: quarterlyStats[quarter.name].barangays.size,
        concernTypes: quarterlyStats[quarter.name].concernTypes.size,
        color: quarter.color,
        months: quarter.months
      }));

      // Find top concern types and barangays
      const topConcernTypes = Object.entries(concernTypeStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([type, count]) => ({ type, count }));

      const topBarangays = Object.entries(barangayStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([barangay, count]) => ({ barangay, count }));

      return {
        totalEntries,
        totalWeeklySum,
        uniqueBarangays: uniqueBarangays.size,
        uniqueConcernTypes: uniqueConcernTypes.size,
        entriesWithAction,
        entriesWithRemarks,
        quarterlyStats: finalQuarterlyStats,
        topConcernTypes,
        topBarangays,
        completionRate: totalEntries > 0 ? Math.round((entriesWithAction / totalEntries) * 100) : 0,
        remarksRate: totalEntries > 0 ? Math.round((entriesWithRemarks / totalEntries) * 100) : 0,
        municipality: municipality || "All Municipalities",
        year: currentYear
      };
    } catch (error) {
      console.error('Error calculating quarterly summary:', error);
      return {
        totalEntries: 0,
        totalWeeklySum: 0,
        uniqueBarangays: 0,
        uniqueConcernTypes: 0,
        entriesWithAction: 0,
        entriesWithRemarks: 0,
        quarterlyStats: [],
        topConcernTypes: [],
        topBarangays: [],
        completionRate: 0,
        remarksRate: 0,
        municipality: municipality || "All Municipalities",
        year: selectedYear
      };
    }
  };

  // Handle municipality tab switching
  const handleMunicipalityTabChange = (municipality) => {
    setActiveMunicipalityTab(municipality);
    setSelectedReportMunicipality(municipality);
  };

  // Detect month and year from Excel data
  const detectMonthYearFromData = (data) => {
    const monthCounts = {};
    const yearCounts = {};
    
    data.forEach(row => {
      if (row.date) {
        try {
          const parsedDate = new Date(row.date);
          if (!isNaN(parsedDate.getTime())) {
            const month = parsedDate.toLocaleDateString("en-US", { month: "long" });
            const year = parsedDate.getFullYear().toString();
            
            monthCounts[month] = (monthCounts[month] || 0) + 1;
            yearCounts[year] = (yearCounts[year] || 0) + 1;
          }
        } catch (error) {
          console.warn('Error parsing date for detection:', row.date);
        }
      }
    });
    
    // Find the most common month and year
    const mostCommonMonth = Object.keys(monthCounts).reduce((a, b) => 
      monthCounts[a] > monthCounts[b] ? a : b, '');
    const mostCommonYear = Object.keys(yearCounts).reduce((a, b) => 
      yearCounts[a] > yearCounts[b] ? a : b, '');
    
    return {
      month: mostCommonMonth,
      year: mostCommonYear
    };
  };

  // Close clear options when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showClearOptions && !event.target.closest('.clear-options-container')) {
        setShowClearOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showClearOptions]);

  // Load barangays from Firestore
  const loadBarangaysFromFirestore = async () => {
    // Check cache first
    if (barangaysCache.current) {
      console.log('📦 Using cached barangays data');
      setImportedBarangays(barangaysCache.current);
      return;
    }
    
    setIsLoadingBarangays(true);
    try {
      const result = await getBarangays();
      if (result.success) {
        // Cache the data
        barangaysCache.current = result.data || [];
        setImportedBarangays(result.data || []);
        console.log('✅ Loaded barangays from Firestore:', result.data?.length || 0);
      } else {
        console.error('❌ Failed to load barangays:', result.error);
        toast.error('Failed to load barangays from database');
        showError('Failed to load barangays from database');
      }
    } catch (error) {
      console.error('❌ Error loading barangays:', error);
      toast.error('Error loading barangays from database');
      showError('Error loading barangays from database');
    } finally {
      setIsLoadingBarangays(false);
    }
  };

  // Load concern types from Firestore
  const loadConcernTypesFromFirestore = async () => {
    // Check cache first
    if (concernTypesCache.current) {
      console.log('📦 Using cached concern types data');
      setImportedConcernTypes(concernTypesCache.current);
      return;
    }
    
    setIsLoadingConcernTypes(true);
    try {
      const result = await getConcernTypes();
      if (result.success) {
        // Cache the data
        concernTypesCache.current = result.data || [];
        setImportedConcernTypes(result.data || []);
        console.log('✅ Loaded concern types from Firestore:', result.data?.length || 0);
      } else {
        console.error('❌ Failed to load concern types:', result.error);
        toast.error('Failed to load concern types from database');
        showError('Failed to load concern types from database');
      }
    } catch (error) {
      console.error('❌ Error loading concern types:', error);
      toast.error('Error loading concern types from database');
      showError('Error loading concern types from database');
    } finally {
      setIsLoadingConcernTypes(false);
    }
  };

  // Get week number for a given date
  const getWeekNumber = (dateString) => {
    const day = parseInt(dateString.split(' ')[1].replace(',', ''));
    if (day <= 7) return 1;
    if (day <= 14) return 2;
    if (day <= 21) return 3;
    return 4;
  };

  // Get week color
  const getWeekColor = (weekNumber) => {
    return weekNumber % 2 === 1 ? 'bg-yellow-50' : 'bg-green-50';
  };

  // Chart data
  const patrolData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Active Patrols',
        data: [8, 12, 15, 10, 18, 14, 12],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
      },
    ],
  };

  const districtData = {
    labels: ['District 1', 'District 2', 'District 3'],
    datasets: [
      {
        data: [45, 38, 42],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(168, 85, 247, 0.8)',
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(168, 85, 247, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const alertTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Emergency Alerts',
        data: [12, 19, 8, 15, 22, 18],
        borderColor: 'rgba(239, 68, 68, 1)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Resolved',
        data: [10, 16, 7, 13, 20, 16],
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  const handleTerminalCommand = (e) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const command = terminalInput.trim();
    let output = "";
    let type = "info";

    // Simulate command processing
    switch (command.toLowerCase()) {
      case "help":
        output = "Available commands: status, units, alerts, clear, patrol.active, incidents.pending, system.info, barangays.list, excel.help";
        break;
      case "status":
        output = "Command Center Status: OPERATIONAL\nActive Units: 3\nPending Alerts: 1\nSystem Uptime: 24h 15m";
        break;
      case "units":
        output = `Active Units: ${activeUnits.filter(u => u.status === 'active').length}\nStandby Units: ${activeUnits.filter(u => u.status === 'standby').length}`;
        break;
      case "alerts":
        output = `Emergency Alerts: ${emergencyAlerts.filter(a => a.status === 'pending').length} pending`;
        break;
      case "clear":
        setTerminalHistory([]);
        setTerminalInput("");
        return;
      case "patrol.active":
        output = `Active Patrols: ${activeUnits.filter(u => u.status === 'active').length} units deployed`;
        break;
      case "incidents.pending":
        output = `Pending Incidents: ${emergencyAlerts.filter(a => a.status === 'pending').length} require attention`;
        break;
      case "system.info":
        output = "I-Patroller Command Center v2.1\nFirebase Connected: ✓\nReal-time Updates: ✓\nLast Sync: Just now";
        break;
      case "barangays.list":
        output = `Imported Barangays: ${importedBarangays.length}\nDistricts: ${Object.keys(municipalitiesByDistrict).length}\nMunicipalities: ${Object.values(municipalitiesByDistrict).flat().length}`;
        break;
      case "excel.help":
        output = "Excel Import Commands:\n- Use 'Import Excel' button in Weekly Report section\n- Supported formats: .xlsx, .xls, .csv\n- Required columns: Date, Municipality, Barangay, Concern Type, Week 1-4, Action Taken, Remarks\n- Data automatically imports to the weekly report table";
        break;
      default:
        output = `Command not found: ${command}. Type 'help' for available commands.`;
        type = "error";
    }

    const newEntry = {
      id: Date.now(),
      command,
      output,
      type,
      timestamp: new Date()
    };

    setTerminalHistory(prev => [...prev, newEntry]);
    setTerminalInput("");
  };

  const handleBarangayImport = async () => {
    if (!selectedDistrict || !selectedMunicipality || !barangayData.trim()) {
      toast.error("Please select district, municipality and enter barangay data");
      showError('Please select district, municipality and enter barangay data');
      return;
    }

    setIsImporting(true);
    
    try {
      // Parse barangay data (assuming comma-separated or line-separated)
      const barangays = barangayData
        .split(/[,\n]/)
        .map(brgy => brgy.trim())
        .filter(brgy => brgy.length > 0);

      const newBarangays = barangays.map((barangay, index) => ({
        id: `${selectedDistrict}-${selectedMunicipality}-${Date.now()}-${index}`,
        name: barangay,
        district: selectedDistrict,
        municipality: selectedMunicipality,
        importedAt: new Date().toISOString()
      }));

      // Update local state
      const updatedBarangays = [...importedBarangays, ...newBarangays];
      setImportedBarangays(updatedBarangays);
      setBarangayData("");
      
      // Save to Firestore with quota check
      const saveResult = await saveWithQuotaCheck(
        () => saveBarangays(updatedBarangays),
        "Import Barangays"
      );
      if (saveResult.success) {
        toast.success(`Successfully imported ${barangays.length} barangays for ${selectedMunicipality}`);
        showSuccess(`Successfully imported ${barangays.length} barangays for ${selectedMunicipality}`);
        
        // Add to terminal history
        const newEntry = {
          id: Date.now(),
          command: "barangays.import",
          output: `Imported ${barangays.length} barangays to ${selectedMunicipality}, ${selectedDistrict}`,
          type: "success",
          timestamp: new Date()
        };
        setTerminalHistory(prev => [...prev, newEntry]);
      } else {
        toast.error("Failed to save barangays to database: " + saveResult.error);
        showError('Failed to save barangays to database: ' + saveResult.error);
        // Revert local state if save failed
        setImportedBarangays(importedBarangays);
      }
      
    } catch (error) {
      toast.error("Error importing barangays: " + error.message);
      showError('Error importing barangays: ' + error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleConcernTypeImport = async () => {
    if (!selectedDistrict || !selectedMunicipality || !concernTypeData.trim()) {
      toast.error("Please select district, municipality and enter concern type data");
      showError('Please select district, municipality and enter concern type data');
      return;
    }

    setIsImporting(true);
    
    try {
      // Parse concern type data (assuming comma-separated or line-separated)
      const concernTypes = concernTypeData
        .split(/[,\n]/)
        .map(type => type.trim())
        .filter(type => type.length > 0);

      const newConcernTypes = concernTypes.map((concernType, index) => ({
        id: `${selectedDistrict}-${selectedMunicipality}-${Date.now()}-${index}`,
        name: concernType,
        district: selectedDistrict,
        municipality: selectedMunicipality,
        importedAt: new Date().toISOString()
      }));

      // Update local state
      const updatedConcernTypes = [...importedConcernTypes, ...newConcernTypes];
      setImportedConcernTypes(updatedConcernTypes);
      setConcernTypeData("");
      
      // Save to Firestore with quota check
      const saveResult = await saveWithQuotaCheck(
        () => saveConcernTypes(updatedConcernTypes),
        "Import Concern Types"
      );
      if (saveResult.success) {
        toast.success(`Successfully imported ${concernTypes.length} concern types for ${selectedMunicipality}`);
        showSuccess(`Successfully imported ${concernTypes.length} concern types for ${selectedMunicipality}`);
        
        // Add to terminal history
        const newEntry = {
          id: Date.now(),
          command: "concernTypes.import",
          output: `Imported ${concernTypes.length} concern types to ${selectedMunicipality}, ${selectedDistrict}`,
          type: "success",
          timestamp: new Date()
        };
        setTerminalHistory(prev => [...prev, newEntry]);
      } else {
        toast.error("Failed to save concern types to database: " + saveResult.error);
        showError('Failed to save concern types to database: ' + saveResult.error);
        // Revert local state if save failed
        setImportedConcernTypes(importedConcernTypes);
      }
      
    } catch (error) {
      toast.error("Error importing concern types: " + error.message);
      showError('Error importing concern types: ' + error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportBarangays = () => {
    if (importedBarangays.length === 0) {
      toast.error("No barangays to export");
      showError('No barangays to export');
      return;
    }

    const csvContent = [
      "District,Municipality,Barangay,Imported Date",
      ...importedBarangays.map(brgy => 
        `${brgy.district},${brgy.municipality},${brgy.name},${new Date(brgy.importedAt).toLocaleDateString()}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `barangays-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success("Barangays exported successfully");
    showSuccess('Barangays exported successfully!');
  };

  // Barangay sorting functions
  const handleBarangaySort = (sortBy) => {
    if (barangaySortBy === sortBy) {
      setBarangaySortOrder(barangaySortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setBarangaySortBy(sortBy);
      setBarangaySortOrder('asc');
    }
  };

  const getSortedBarangays = () => {
    // First filter by municipality if filter is set
    let filteredBarangays = importedBarangays;
    if (barangayFilterMunicipality) {
      filteredBarangays = importedBarangays.filter(barangay => 
        barangay.municipality.toLowerCase() === barangayFilterMunicipality.toLowerCase()
      );
    }
    
    // Then sort the filtered results
    return [...filteredBarangays].sort((a, b) => {
      let aValue, bValue;
      
      switch (barangaySortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'municipality':
          aValue = a.municipality.toLowerCase();
          bValue = b.municipality.toLowerCase();
          break;
        case 'district':
          aValue = a.district.toLowerCase();
          bValue = b.district.toLowerCase();
          break;
        case 'importedAt':
          aValue = new Date(a.importedAt);
          bValue = new Date(b.importedAt);
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return barangaySortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return barangaySortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const getUniqueMunicipalities = () => {
    const municipalities = [...new Set(importedBarangays.map(barangay => barangay.municipality))];
    return municipalities.sort();
  };

  // Group barangays by municipality
  const getGroupedBarangays = () => {
    const grouped = {};
    const sortedBarangays = getSortedBarangays();
    
    sortedBarangays.forEach(barangay => {
      const municipality = barangay.municipality;
      if (!grouped[municipality]) {
        grouped[municipality] = [];
      }
      grouped[municipality].push(barangay);
    });
    
    return grouped;
  };

  // Toggle municipality expansion
  const toggleMunicipality = (municipality) => {
    const newExpanded = new Set(expandedMunicipalities);
    if (newExpanded.has(municipality)) {
      newExpanded.delete(municipality);
    } else {
      newExpanded.add(municipality);
    }
    setExpandedMunicipalities(newExpanded);
  };

  // Expand all municipalities
  const expandAllMunicipalities = () => {
    const allMunicipalities = getUniqueMunicipalities();
    setExpandedMunicipalities(new Set(allMunicipalities));
  };

  // Collapse all municipalities
  const collapseAllMunicipalities = () => {
    setExpandedMunicipalities(new Set());
  };

  // Auto-expand municipality when filtering
  useEffect(() => {
    if (barangayFilterMunicipality) {
      setExpandedMunicipalities(new Set([barangayFilterMunicipality]));
    }
  }, [barangayFilterMunicipality]);

  // Auto-expand concern type municipality when filtering
  useEffect(() => {
    if (concernTypeFilterMunicipality) {
      setExpandedConcernTypeMunicipalities(new Set([concernTypeFilterMunicipality]));
    }
  }, [concernTypeFilterMunicipality]);

  // Concern types sorting functions
  const handleConcernTypeSort = (sortBy) => {
    if (concernTypeSortBy === sortBy) {
      setConcernTypeSortOrder(concernTypeSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setConcernTypeSortBy(sortBy);
      setConcernTypeSortOrder('asc');
    }
  };

  const getSortedConcernTypes = () => {
    // First filter by municipality if filter is set or if user is not admin
    let filteredConcernTypes = importedConcernTypes;
    
    // For non-admin users, automatically filter by their municipality
    if (!isAdmin && userMunicipality) {
      filteredConcernTypes = importedConcernTypes.filter(concernType => 
        concernType.municipality.toLowerCase() === userMunicipality.toLowerCase()
      );
    } else if (concernTypeFilterMunicipality) {
      filteredConcernTypes = importedConcernTypes.filter(concernType => 
        concernType.municipality.toLowerCase() === concernTypeFilterMunicipality.toLowerCase()
      );
    }
    
    // Then sort the filtered results
    return [...filteredConcernTypes].sort((a, b) => {
      let aValue, bValue;
      
      switch (concernTypeSortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'municipality':
          aValue = a.municipality.toLowerCase();
          bValue = b.municipality.toLowerCase();
          break;
        case 'district':
          aValue = a.district.toLowerCase();
          bValue = b.district.toLowerCase();
          break;
        case 'importedAt':
          aValue = new Date(a.importedAt);
          bValue = new Date(b.importedAt);
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      
      if (aValue < bValue) return concernTypeSortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return concernTypeSortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Group concern types by municipality
  const getGroupedConcernTypes = () => {
    const grouped = {};
    const sortedConcernTypes = getSortedConcernTypes();
    
    sortedConcernTypes.forEach(concernType => {
      const municipality = concernType.municipality;
      if (!grouped[municipality]) {
        grouped[municipality] = [];
      }
      grouped[municipality].push(concernType);
    });
    
    return grouped;
  };

  // Toggle concern type municipality expansion
  const toggleConcernTypeMunicipality = (municipality) => {
    const newExpanded = new Set(expandedConcernTypeMunicipalities);
    if (newExpanded.has(municipality)) {
      newExpanded.delete(municipality);
    } else {
      newExpanded.add(municipality);
    }
    setExpandedConcernTypeMunicipalities(newExpanded);
  };

  // Expand all concern type municipalities
  const expandAllConcernTypeMunicipalities = () => {
    const allMunicipalities = [...new Set(importedConcernTypes.map(type => type.municipality))];
    setExpandedConcernTypeMunicipalities(new Set(allMunicipalities));
  };

  // Collapse all concern type municipalities
  const collapseAllConcernTypeMunicipalities = () => {
    setExpandedConcernTypeMunicipalities(new Set());
  };

  // Concern types selection functions
  const handleConcernTypeSelection = (concernTypeId, isSelected) => {
    if (isSelected) {
      setSelectedConcernTypes([...selectedConcernTypes, concernTypeId]);
    } else {
      setSelectedConcernTypes(selectedConcernTypes.filter(id => id !== concernTypeId));
    }
  };

  const handleSelectAllConcernTypes = () => {
    const allConcernTypeIds = getSortedConcernTypes().map(concernType => concernType.id);
    setSelectedConcernTypes(allConcernTypeIds);
  };

  const handleDeselectAllConcernTypes = () => {
    setSelectedConcernTypes([]);
  };

  // Edit selected concern types
  const handleEditSelectedConcernTypes = () => {
    if (selectedConcernTypes.length === 0) {
      toast.error("No concern types selected");
      showError('No concern types selected');
      return;
    }

    if (selectedConcernTypes.length === 1) {
      // Single edit
      const concernType = importedConcernTypes.find(ct => ct.id === selectedConcernTypes[0]);
      if (concernType) {
        setEditingConcernType({
          ...concernType,
          isBulkEdit: false
        });
        setIsEditingConcernTypes(true);
      }
    } else {
      // Bulk edit - get the first selected concern type's district and municipality as defaults
      const firstConcernType = importedConcernTypes.find(ct => ct.id === selectedConcernTypes[0]);
      const selectedConcernTypeNames = selectedConcernTypes
        .map(id => importedConcernTypes.find(ct => ct.id === id)?.name)
        .filter(name => name)
        .join(', ');

      setEditingConcernType({
        id: 'bulk-edit',
        name: selectedConcernTypeNames,
        district: firstConcernType?.district || Object.keys(municipalitiesByDistrict)[0],
        municipality: firstConcernType?.municipality || '',
        isBulkEdit: true,
        selectedIds: selectedConcernTypes
      });
      setIsEditingConcernTypes(true);
    }
  };

  // Clear selected concern types
  const handleClearSelectedConcernTypes = () => {
    setSelectedConcernTypes([]);
    toast.success("Selection cleared");
    showSuccess('Selection cleared');
  };

  // Save edited concern type(s)
  const handleSaveEditedConcernType = async () => {
    if (!editingConcernType.name.trim() || !editingConcernType.district || !editingConcernType.municipality) {
      toast.error("Please fill in all required fields");
      showError('Please fill in all required fields');
      return;
    }

    try {
      let updatedConcernTypes = [...importedConcernTypes];

      if (editingConcernType.isBulkEdit) {
        // Bulk edit - parse comma-separated names
        const newNames = editingConcernType.name
          .split(',')
          .map(name => name.trim())
          .filter(name => name.length > 0);

        if (newNames.length !== editingConcernType.selectedIds.length) {
          toast.error(`Please provide exactly ${editingConcernType.selectedIds.length} concern type names (comma-separated)`);
          showError(`Please provide exactly ${editingConcernType.selectedIds.length} concern type names (comma-separated)`);
          return;
        }

        // Update each selected concern type
        editingConcernType.selectedIds.forEach((id, index) => {
          const concernTypeIndex = updatedConcernTypes.findIndex(ct => ct.id === id);
          if (concernTypeIndex !== -1) {
            updatedConcernTypes[concernTypeIndex] = {
              ...updatedConcernTypes[concernTypeIndex],
              name: newNames[index],
              district: editingConcernType.district,
              municipality: editingConcernType.municipality,
              updatedAt: new Date().toISOString()
            };
          }
        });

        toast.success(`Updated ${editingConcernType.selectedIds.length} concern types`);
        showSuccess(`Updated ${editingConcernType.selectedIds.length} concern types`);
      } else {
        // Single edit
        const concernTypeIndex = updatedConcernTypes.findIndex(ct => ct.id === editingConcernType.id);
        if (concernTypeIndex !== -1) {
          updatedConcernTypes[concernTypeIndex] = {
            ...updatedConcernTypes[concernTypeIndex],
            name: editingConcernType.name.trim(),
            district: editingConcernType.district,
            municipality: editingConcernType.municipality,
            updatedAt: new Date().toISOString()
          };
        }

        toast.success("Concern type updated successfully");
        showSuccess('Concern type updated successfully');
      }

      // Update local state
      setImportedConcernTypes(updatedConcernTypes);
      
      // Save to Firestore
      const saveResult = await saveWithQuotaCheck(
        () => saveConcernTypes(updatedConcernTypes),
        "Update Concern Types"
      );
      
      if (!saveResult.success) {
        toast.error("Failed to save changes to database: " + saveResult.error);
        showError('Failed to save changes to database: ' + saveResult.error);
        // Revert local state if save failed
        setImportedConcernTypes(importedConcernTypes);
        return;
      }

      // Clear cache to force reload
      concernTypesCache.current = null;
      
      // Close modal and clear selection
      setIsEditingConcernTypes(false);
      setEditingConcernType(null);
      setSelectedConcernTypes([]);

    } catch (error) {
      toast.error("Error updating concern types: " + error.message);
      showError('Error updating concern types: ' + error.message);
    }
  };

  // Cancel edit modal
  const handleCancelEdit = () => {
    setIsEditingBarangays(false);
    setEditingBarangay(null);
    setIsEditingConcernTypes(false);
    setEditingConcernType(null);
  };

  // Export concern types to CSV
  const handleExportConcernTypesCSV = () => {
    const concernTypesToExport = selectedConcernTypes.length > 0 
      ? getSortedConcernTypes().filter(concernType => selectedConcernTypes.includes(concernType.id))
      : getSortedConcernTypes();

    if (concernTypesToExport.length === 0) {
      toast.error("No concern types to export");
      showError('No concern types to export');
      return;
    }

    const csvContent = [
      ['Name', 'Municipality', 'District', 'Imported At'],
      ...concernTypesToExport.map(concernType => [
        concernType.name,
        concernType.municipality,
        concernType.district,
        new Date(concernType.importedAt).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `concern_types_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exported ${concernTypesToExport.length} concern types to CSV`);
    showSuccess(`Exported ${concernTypesToExport.length} concern types to CSV`);
  };

  const handleClearBarangays = async () => {
    if (importedBarangays.length === 0) {
      toast.error("No barangays to clear");
      showError('No barangays to clear');
    try {
      const result = await deleteWeeklyReportFromCollection(docId);
      if (result.success) {
        toast.success('Weekly report deleted successfully');
        // Reload the collection
        await loadWeeklyReportsCollection();
      } else {
        toast.error(`Failed to delete weekly report: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error deleting weekly report:', error);
      toast.error('Error deleting weekly report');
    }
  }
};

// Bulk delete ALL weekly reports from ALL locations in Firestore
const handleDeleteAllWeeklyReports = async () => {
  const confirmMessage = `⚠️ DANGER: DELETE ALL WEEKLY REPORTS ⚠️

This will permanently delete ALL weekly reports from:
• weeklyReports collection
• commandCenter legacy documents (weeklyReports_*)
• Any other weekly report documents in the database

This action affects ALL municipalities, ALL months, and ALL years.
This action CANNOT be undone.

Are you absolutely sure you want to proceed?`;

  if (window.confirm(confirmMessage)) {
    // Double confirmation for safety
    const doubleConfirm = window.prompt(
      'Type "DELETE ALL WEEKLY REPORTS" (without quotes) to confirm this destructive action:'
    );
    
    if (doubleConfirm === 'DELETE ALL WEEKLY REPORTS') {
      try {
        toast.loading('Deleting all weekly reports...', { duration: 0, id: 'bulk-delete' });
        
        const result = await deleteAllWeeklyReports();
        
        toast.dismiss('bulk-delete');
        
        if (result.success) {
          if (result.errors && result.errors.length > 0) {
            toast.warning(`Deleted ${result.deletedCount} documents with ${result.errors.length} errors. Check console for details.`);
            console.warn('❌ Deletion errors:', result.errors);
          } else {
            toast.success(`Successfully deleted all ${result.deletedCount} weekly reports`);
          }
          
          // Clear local state
          initializeWeeklyReportData();
          setSelectedBarangay("");
          setSelectedConcernType("");
          setActionTaken("");
          setRemarks("");
          
          // Reload collection view
          await loadWeeklyReportsCollection();
          
          // Add to terminal history
          const newEntry = {
            id: Date.now(),
            command: "bulk.delete.weekly.reports",
            output: `Deleted ${result.deletedCount} weekly reports from all locations`,
            type: "warning",
            timestamp: new Date()
          };
          setTerminalHistory(prev => [...prev, newEntry]);
          
        } else {
          toast.error(`Failed to delete weekly reports: ${result.error}`);
        }
      } catch (error) {
        toast.dismiss('bulk-delete');
        console.error('❌ Error in bulk delete:', error);
        toast.error('Error deleting weekly reports');
      }
    } else {
      toast.info('Bulk deletion cancelled - confirmation text did not match');
    }
  }
};

// Save weekly report data to Firestore
const handleSaveWeeklyReport = async () => {
  const monthYear = `${selectedMonth}_${selectedYear}`;
  const municipalityKey = selectedReportMunicipality ? `_${selectedReportMunicipality}` : '';
  const reportKey = `${monthYear}${municipalityKey}`;
  setIsLoadingWeeklyReports(true);
  
  try {
    // Sanitize data: remove any empty-string date keys to satisfy Firestore rules
    const sanitizedWeeklyReportData = Object.keys(weeklyReportData || {}).reduce((acc, key) => {
      if (key && key.trim().length > 0) {
        acc[key] = weeklyReportData[key];
      }
      return acc;
    }, {});

    // Collect all form data from the weekly report table
    const reportData = {
      selectedMonth,
      selectedYear,
      activeMunicipalityTab: selectedReportMunicipality || activeMunicipalityTab,
      selectedBarangay,
      selectedConcernType,
      actionTaken,
      remarks,
      weeklyReportData: sanitizedWeeklyReportData, // Include individual date data
      savedAt: new Date().toISOString()
    };

    console.log('💾 Saving weekly report data:', {
      reportKey,
      dataCount: Object.keys(weeklyReportData).length,
      sampleData: Object.keys(weeklyReportData).slice(0, 3)
    });

    // Save to the nested structure: commandCenter > weeklyReports > Municipality > MonthYear
    let nestedSaveResult = { success: false };
    if (activeMunicipalityTab) {
      try {
        const docRef = doc(db, 'commandCenter', 'weeklyReports', activeMunicipalityTab, monthYear);
        await setDoc(docRef, reportData);
        nestedSaveResult = { success: true };
        console.log('✅ Saved to nested structure successfully');
      } catch (error) {
        console.error('❌ Error saving to nested structure:', error);
        nestedSaveResult = { success: false, error };
      }
    }
    
    // Only use nested structure save - no more root level saves
    if (nestedSaveResult.success) {
      toast.success(`Weekly report saved successfully for ${activeMunicipalityTab || 'All Municipalities'}`);
      
      // CLEAR MEMORY DATA: Remove any conflicting memory data for this month
      const monthKey = selectedMonth.toLowerCase();
      if (allMonthsData[monthKey]) {
        console.log('🧹 Clearing memory data for this month to prevent conflicts');
        const updatedAllMonthsData = { ...allMonthsData };
        delete updatedAllMonthsData[monthKey];
        setAllMonthsData(updatedAllMonthsData);
      }
      
      // Add to terminal history
      const newEntry = {
        id: Date.now(),
        command: "weekly.save",
        output: `Weekly report saved for ${selectedMonth} ${selectedYear} - ${activeMunicipalityTab || 'All Municipalities'}`,
        type: "success",
        timestamp: new Date()
      };
      setTerminalHistory(prev => [...prev, newEntry]);
      
    } else {
      toast.error("Failed to save weekly report: " + (nestedSaveResult.error?.message || 'Unknown error'));
    }
  } catch (error) {
    console.error("Error saving weekly report:", error);
    toast.error("Error saving weekly report");
  } finally {
    setIsLoadingWeeklyReports(false);
  }
};

// Handle Excel file selection and import
const handleExcelFileSelect = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  setIsImportingExcel(true);
  setExcelFile(file);

  try {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        if (importAllMonths) {
          // Import all months mode
          setIsImportingAllMonths(true);
          const importedData = {};
          
          // Process each sheet as a month
          workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            // Skip empty sheets
            if (jsonData.length < 2) return;
            
            // Parse the sheet data
            const monthKey = sheetName.toLowerCase().trim();
            const entries = [];
            
            // Assuming first row is headers
            const headers = jsonData[0];
            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i];
              if (!row || row.length === 0) continue;
              
              const entry = {};
              headers.forEach((header, index) => {
                const headerStr = String(header).toLowerCase().trim();
                const value = row[index];
                
                // Map common column names
                if (headerStr.includes('date')) {
                  entry.date = parseExcelDateToKey(value) || value;
                } else if (headerStr.includes('barangay')) {
                  entry.barangay = value;
                } else if (headerStr.includes('concern') || headerStr.includes('type')) {
                  entry.concernType = value;
                } else if (headerStr.includes('action')) {
                  entry.actionTaken = value;
                } else if (headerStr.includes('remark')) {
                  entry.remarks = value;
                } else if (headerStr.includes('municipal')) {
                  entry.municipality = value;
                }
              });
              
              if (entry.date) {
                entries.push(entry);
              }
            }
            
            if (entries.length > 0) {
              importedData[monthKey] = entries;
            }
          });
          
          setAllMonthsData(importedData);
          setIsImportingAllMonths(false);
          toast.success(`Imported ${Object.keys(importedData).length} months from Excel. Click "Save All Months" to save to database.`);
          
        } else {
          // Import single month mode (current month)
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
          
          if (jsonData.length < 2) {
            toast.error('Excel file is empty or has no data');
            return;
          }
          
          const headers = jsonData[0];
          const entries = [];
          
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length === 0) continue;
            
            const entry = {};
            headers.forEach((header, index) => {
              const headerStr = String(header).toLowerCase().trim();
              const value = row[index];
              
              if (headerStr.includes('date')) {
                entry.date = parseExcelDateToKey(value) || value;
              } else if (headerStr.includes('barangay')) {
                entry.barangay = value;
              } else if (headerStr.includes('concern') || headerStr.includes('type')) {
                entry.concernType = value;
              } else if (headerStr.includes('action')) {
                entry.actionTaken = value;
              } else if (headerStr.includes('remark')) {
                entry.remarks = value;
              } else if (headerStr.includes('municipal')) {
                entry.municipality = value;
              }
            });
            
            if (entry.date) {
              entries.push(entry);
            }
          }
          
          // Group entries by date and add to weeklyReportData
          const newWeeklyData = { ...weeklyReportData };
          entries.forEach(entry => {
            if (!newWeeklyData[entry.date]) {
              newWeeklyData[entry.date] = [];
            }
            newWeeklyData[entry.date].push({
              id: Date.now() + Math.random(),
              barangay: entry.barangay || '',
              concernType: entry.concernType || '',
              actionTaken: entry.actionTaken || '',
              remarks: entry.remarks || '',
              municipality: entry.municipality || activeMunicipalityTab
            });
          });
          
          setWeeklyReportData(newWeeklyData);
          toast.success(`Imported ${entries.length} entries from Excel for ${selectedMonth}`);
        }
        
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        toast.error('Error parsing Excel file: ' + error.message);
      } finally {
        setIsImportingExcel(false);
        // Reset file input
        event.target.value = '';
      }
    };
    
    reader.onerror = () => {
      toast.error('Error reading Excel file');
      setIsImportingExcel(false);
      event.target.value = '';
    };
    
    reader.readAsArrayBuffer(file);
    
  } catch (error) {
    console.error('Error importing Excel:', error);
    toast.error('Error importing Excel file');
    setIsImportingExcel(false);
    event.target.value = '';
  }
};

// Save all imported months (from local storage import) to Firestore
const handleSaveAllMonths = async () => {
  try {
    const monthKeys = Object.keys(allMonthsData || {});
    if (!monthKeys.length) {
      toast.error('No imported months found to save');
      return;
    }

    setIsSavingAllMonths(true);
    setSaveAllProgress({ current: 0, total: monthKeys.length });

    for (let i = 0; i < monthKeys.length; i++) {
      const monthKeyLower = monthKeys[i];
      const monthEntries = allMonthsData[monthKeyLower] || [];
      if (!monthEntries.length) continue;

      // Derive displayed month name (capitalize first letter)
      const displayMonth = monthKeyLower.charAt(0).toUpperCase() + monthKeyLower.slice(1);

      // Derive year from first entry date like "January 5, 2025"
      let derivedYear = selectedYear;
      try {
        const sampleDate = monthEntries.find(e => e && e.date)?.date;
        if (sampleDate) {
          const yearMatch = /\b(20\d{2}|19\d{2})\b/.exec(String(sampleDate));
          if (yearMatch) derivedYear = yearMatch[1];
        }
      } catch (_) {}

      // Convert entries into weeklyReportData shape: { [dateKey]: [rows] }
      const aggregated = {};
      monthEntries.forEach((entry) => {
        if (!entry || !entry.date) return;
        const dateKey = entry.date;
        if (!aggregated[dateKey]) aggregated[dateKey] = [];
        aggregated[dateKey].push(entry);
      });

      // Group entries by municipality and save per municipality
      const municipalityToEntries = {};
      monthEntries.forEach((entry) => {
        const muni = entry?.municipality || 'All';
        if (!municipalityToEntries[muni]) municipalityToEntries[muni] = [];
        municipalityToEntries[muni].push(entry);
      });

      const municipalities = Object.keys(municipalityToEntries);
      for (let m = 0; m < municipalities.length; m++) {
        const municipality = municipalities[m];

        // Aggregate per municipality into weeklyReportData shape
        const muniAggregated = {};
        municipalityToEntries[municipality].forEach((entry) => {
          if (!entry || !entry.date) return;
          const dateKey = entry.date;
          if (!muniAggregated[dateKey]) muniAggregated[dateKey] = [];
          muniAggregated[dateKey].push(entry);
        });

        const reportData = {
          selectedMonth: displayMonth,
          selectedYear: derivedYear,
          activeMunicipalityTab: municipality,
          selectedBarangay: '',
          selectedConcernType: '',
          actionTaken: '',
          remarks: '',
          weeklyReportData: muniAggregated,
          savedAt: new Date().toISOString()
        };

        const reportKey = `${displayMonth}_${derivedYear}`;

        try {
          // Only save to nested structure with quota check
          const muniSaveResult = await saveWithQuotaCheck(
            () => saveWeeklyReportByMunicipality(reportData),
            "Save Weekly Report"
          );
          if (muniSaveResult.success) {
            toast.success(`Saved ${displayMonth} ${derivedYear} - ${municipality}`);
          } else {
            const msg = `byMunicipality: ${muniSaveResult.error || 'failed'}`;
            toast.warning(`Partial save for ${displayMonth} ${derivedYear} - ${municipality} (${msg})`);
            }
          } catch (err) {
            console.error('Error saving month by municipality', displayMonth, derivedYear, municipality, err);
            toast.error(`Error saving ${displayMonth} ${derivedYear} - ${municipality}`);
          }
        }

        setSaveAllProgress({ current: i + 1, total: monthKeys.length });
      }

      // After batch save, clear memory cache
      setAllMonthsData({});
      toast.success('Finished saving all imported months');
    } finally {
      setIsSavingAllMonths(false);
    }
  };

  return (
    <Layout onNavigate={onNavigate} currentPage={currentPage} onLogout={onLogout} onShowHelp={() => setShowCommandCenterHelp(true)}>
      <section className={`flex-1 ${isCommandUser ? 'p-2 md:p-4 space-y-3 md:space-y-4 overflow-hidden' : 'p-3 md:p-6 space-y-4 md:space-y-6'}`}>
        {/* Firestore Quota Warning Banner */}
        {isBlocked && blockedUntil && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded-lg p-4 shadow-md">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-red-900 text-lg mb-1">
                  ⚠️ Firestore Quota Exceeded
                </h3>
                <p className="text-red-800 text-sm mb-2">
                  You have reached the daily Firestore write limit. All save operations are temporarily disabled.
                </p>
                <div className="bg-white/50 rounded-md p-3 space-y-1">
                  <p className="text-sm text-red-900">
                    <strong>Pwede ka ulit mag-save sa:</strong>{" "}
                    <span className="font-mono font-semibold">
                      {blockedUntil.toLocaleString("en-PH", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </p>
                  <p className="text-sm text-red-900">
                    <Clock className="inline h-4 w-4 mr-1" />
                    <strong>Time remaining:</strong>{" "}
                    <span className="font-mono font-semibold">{timeLeft}</span>
                  </p>
                </div>
                {isAdmin && (
                  <button
                    onClick={resetQuotaBlock}
                    className="mt-3 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors"
                  >
                    Reset Quota Block (Admin Only)
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        
        {isCommandUser && (
          <style>{`
            /* Compact table for command-center users */
            .cc-compact table thead th { padding: 0.5rem 0.5rem; }
            .cc-compact table tbody td { padding: 0.375rem 0.5rem; }
            .cc-compact table input,
            .cc-compact table select {
              height: 2rem;
              padding: 0.25rem 0.5rem;
              font-size: 0.875rem;
            }
            .cc-compact .add-entry-row td { padding-top: 0.25rem; padding-bottom: 0.25rem; }
          `}</style>
        )}
        
        <style>{`
          /* Hover tooltip for table cells */
          .table-cell-hover {
            position: relative;
          }
          
          .table-cell-hover input,
          .table-cell-hover select {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          
          .table-cell-hover[data-tooltip]:not([data-tooltip=""]):hover::after {
            content: attr(data-tooltip);
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(0, 0, 0, 0.95);
            color: white;
            padding: 10px 14px;
            border-radius: 8px;
            font-size: 0.875rem;
            line-height: 1.4;
            white-space: normal;
            word-wrap: break-word;
            max-width: 350px;
            min-width: 150px;
            z-index: 10000;
            pointer-events: none;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
            margin-bottom: 8px;
            animation: tooltipFadeIn 0.2s ease-in-out;
          }
          
          .table-cell-hover[data-tooltip]:not([data-tooltip=""]):hover::before {
            content: '';
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            border: 7px solid transparent;
            border-top-color: rgba(0, 0, 0, 0.95);
            z-index: 10000;
            pointer-events: none;
            margin-bottom: 1px;
            animation: tooltipFadeIn 0.2s ease-in-out;
          }
          
          @keyframes tooltipFadeIn {
            from {
              opacity: 0;
              transform: translateX(-50%) translateY(5px);
            }
            to {
              opacity: 1;
              transform: translateX(-50%) translateY(0);
            }
          }
        `}</style>
        <Dialog open={showCommandCenterHelp} onOpenChange={(open) => {
          if (!open && dontShowAgain) {
            localStorage.setItem('ccHelpDismissed', '1');
          }
          setShowCommandCenterHelp(open);
        }}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-gray-50">
            <DialogHeader className="gap-4 pb-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center shadow-lg">
                  <Shield className="h-8 w-8" />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                    Command Center Guide
                  </DialogTitle>
                  <DialogDescription className="text-base text-gray-600 mt-1">
                    Your complete guide to recording and managing incident reports
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="space-y-8 py-6 text-base text-gray-700">
              {/* Overview */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2 text-lg">
                  <Activity className="h-6 w-6" />
                  What is Command Center?
                </h3>
                <p className="text-sm text-blue-800 leading-relaxed">
                  Command Center is your central hub for recording and managing weekly incident reports across all barangays in your municipality. 
                  You can track different types of concerns, generate reports, and export data for analysis.
                </p>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-gray-300"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-gradient-to-br from-white to-gray-50 px-4 text-sm font-semibold text-gray-500">STEP-BY-STEP GUIDE</span>
                </div>
              </div>

              {/* Step-by-step instructions */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-xl">How to Record Daily Incidents</h3>
                </div>
                <ol className="space-y-4">
                  <li className="flex gap-4 p-4 bg-white border-2 border-green-100 rounded-xl hover:border-green-300 hover:shadow-md transition-all duration-200">
                    <span className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white font-bold text-lg shadow-md">1</span>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-base">Select Barangay</p>
                      <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">Choose the barangay where the incident occurred from the dropdown menu.</p>
                    </div>
                  </li>
                  <li className="flex gap-4 p-4 bg-white border-2 border-green-100 rounded-xl hover:border-green-300 hover:shadow-md transition-all duration-200">
                    <span className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white font-bold text-lg shadow-md">2</span>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-base">Select Type of Concern</p>
                      <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">Select a concern type from the dropdown menu based on the incident.</p>
                    </div>
                  </li>
                  <li className="flex gap-4 p-4 bg-white border-2 border-green-100 rounded-xl hover:border-green-300 hover:shadow-md transition-all duration-200">
                    <span className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white font-bold text-lg shadow-md">3</span>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-base">Input Weekly Data or Counts</p>
                      <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">Enter the number of incidents for each week (Week 1-4). Input at least one week's data.</p>
                    </div>
                  </li>
                  <li className="flex gap-4 p-4 bg-white border-2 border-green-100 rounded-xl hover:border-green-300 hover:shadow-md transition-all duration-200">
                    <span className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white font-bold text-lg shadow-md">4</span>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-base">Add Entry (If Needed)</p>
                      <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">Click <span className="font-semibold text-green-600">"Add Entry"</span> to create another record for the same date. You can add multiple entries per day for different barangays or concern types.</p>
                    </div>
                  </li>
                  <li className="flex gap-4 p-4 bg-white border-2 border-green-100 rounded-xl hover:border-green-300 hover:shadow-md transition-all duration-200">
                    <span className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white font-bold text-lg shadow-md">5</span>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-base">Action Taken</p>
                      <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">Based on the action taken by the barangay (e.g., "Issued verbal warning", "Confiscated items", "Conducted roving patrol", "Coordinated with PNP", "Apprehended violators", "Repaired street lights", "Cleared road obstruction", "Impounded stray animals").</p>
                    </div>
                  </li>
                  <li className="flex gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200">
                    <span className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-lg shadow-md">6</span>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-base">Upload Photos (Optional)</p>
                      <p className="text-sm text-gray-700 mt-1.5 leading-relaxed">
                        <span className="font-bold text-blue-600">After completing all fields above</span>, click the <span className="font-semibold text-blue-600">"Upload"</span> button to add before and after photos of the action taken. Photos are auto-compressed to under 2MB. You can also add remarks while uploading photos.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl hover:border-red-300 hover:shadow-md transition-all duration-200">
                    <span className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 text-white font-bold text-lg shadow-md">7</span>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-base">Save Data</p>
                      <p className="text-sm text-gray-700 mt-1.5 leading-relaxed">
                        <span className="font-bold text-red-600">⚠️ Important:</span> Always click <span className="font-semibold text-red-600">"Save Data"</span> at the top of the page to save your weekly input to the database. Unsaved data will be lost.
                      </p>
                    </div>
                  </li>
                </ol>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-gray-300"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-gradient-to-br from-white to-gray-50 px-4 text-sm font-semibold text-gray-500">ADDITIONAL FEATURES</span>
                </div>
              </div>

              {/* Managing Concern Types */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-md">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">Managing Concern Types</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="mt-1 h-5 w-5 text-orange-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-700"><span className="font-semibold text-orange-700">View Concern Types:</span> Click <span className="font-semibold">"View Options"</span> (top-right) → <span className="font-semibold">"Concern Types"</span></p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="mt-1 h-5 w-5 text-orange-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-700"><span className="font-semibold text-orange-700">Add New Type:</span> Click the <span className="font-semibold">"+ Add Concern Type"</span> button and enter the concern name</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="mt-1 h-5 w-5 text-orange-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-700"><span className="font-semibold text-orange-700">Edit/Delete:</span> Use the action buttons next to each concern type to modify or remove them</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Exporting Reports */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md">
                    <Download className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">Exporting Reports</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="mt-1 h-5 w-5 text-purple-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-700">Click the <span className="font-semibold text-purple-700">"Export to Excel"</span> button to download your weekly report as a spreadsheet</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="mt-1 h-5 w-5 text-purple-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-700">The exported file includes all barangays, daily counts, and totals for easy analysis</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Tips */}
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-md">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">💡 Quick Tips</h3>
                </div>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="text-yellow-600 font-bold text-lg">✓</span>
                    <span>You can add multiple entries per day for different barangays or concern types</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-yellow-600 font-bold text-lg">✓</span>
                    <span>Your municipality is automatically selected - you only see data for your area</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-yellow-600 font-bold text-lg">✓</span>
                    <span>Photos and remarks are optional but helpful for detailed documentation</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-yellow-600 font-bold text-lg">✓</span>
                    <span>Remember to click "Save Data" after adding all your daily entries</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-yellow-600 font-bold text-lg">✓</span>
                    <span>Use View Options menu to manage Concern Types or switch views</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-yellow-600 font-bold text-lg">✓</span>
                    <span>You can reopen this guide anytime by clicking "View Instructions" in the sidebar</span>
                  </li>
                </ul>
              </div>

              <label className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                <input
                  id="dont-show-again"
                  name="dont-show-again"
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Don't show this again on login
              </label>
            </div>
            
            <DialogFooter className="border-t border-gray-200 pt-6">
              <button
                onClick={() => {
                  if (dontShowAgain) localStorage.setItem('ccHelpDismissed', '1');
                  setShowCommandCenterHelp(false);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 text-white hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Check className="h-5 w-5" />
                Got it, let's start!
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Command Center</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">Manage barangays, concern types, and weekly reports</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
            {/* Municipality Badge - for non-admin users */}
            {(activeMunicipalityTab || userMunicipality) && (
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-green-200 bg-green-50 text-green-800 shadow-sm flex-shrink-0 w-full sm:w-auto justify-between sm:justify-start">
                <Building2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">{activeMunicipalityTab || userMunicipality}</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-green-600 text-white">
                  {(() => {
                    const currentMunicipality = activeMunicipalityTab || userMunicipality;
                    console.log('🔍 Debug barangay count:', {
                      currentMunicipality,
                      totalBarangays: importedBarangays.length,
                      barangayMunicipalities: importedBarangays.map(b => b.municipality)
                    });
                    
                    const filtered = importedBarangays.filter(b => {
                      if (!currentMunicipality) return true;
                      // Normalize municipality names for comparison
                      const normalizedCurrent = currentMunicipality.toLowerCase().replace(/\s+city$/i, '').trim();
                      const normalizedBarangay = b.municipality.toLowerCase().replace(/\s+city$/i, '').trim();
                      console.log('   Comparing:', { 
                        currentMunicipality, 
                        barangayMunicipality: b.municipality,
                        normalizedCurrent, 
                        normalizedBarangay,
                        match: normalizedBarangay === normalizedCurrent
                      });
                      return normalizedBarangay === normalizedCurrent;
                    });
                    
                    console.log('✅ Filtered count:', filtered.length);
                    return filtered.length;
                  })()} brgy • {getConcernTypesForMunicipality(activeMunicipalityTab || userMunicipality).length} types
                </span>
              </div>
            )}
            
            {/* View Options Dropdown */}
            <div className="relative w-full sm:w-auto">
              <button
                id="commandcenter-menu-button"
                onClick={() => setShowMenuDropdown(!showMenuDropdown)}
                className="bg-black hover:bg-gray-800 text-white px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 w-full"
              >
                <Menu className="w-5 h-5" />
                <span className="text-sm font-medium">View Options</span>
              </button>
              
              {/* Dropdown Menu */}
              {showMenuDropdown && (
                <div 
                  id="commandcenter-menu-dropdown"
                  className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden"
                >
                <div className="py-1">
                {/* Navigation Options */}
                <div className="px-3 py-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Navigation</h3>
                </div>


                {/* Weekly Report - available for all users */}
                <button
                  onClick={() => {
                    setActiveTab("weekly-report");
                    setShowMenuDropdown(false);
                  }}
                  className={`flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors duration-200 ${
                    activeTab === "weekly-report"
                      ? "bg-green-50 text-green-700"
                      : "text-gray-700 hover:bg-green-50 hover:text-green-700"
                  }`}
                >
                  <FileText className="w-4 h-4 text-green-600" />
                  <span>Weekly Report</span>
                </button>

                {/* Show Barangay Management only for admin */}
                {isAdmin && (
                  <button
                    onClick={() => {
                      setActiveTab("barangays");
                      setShowMenuDropdown(false);
                    }}
                    className={`flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors duration-200 ${
                      activeTab === "barangays"
                        ? "bg-purple-50 text-purple-700"
                        : "text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-purple-600" />
                    <span>Barangay Management</span>
                  </button>
                )}

                {/* Show Concern Types for all users */}
                <button
                  onClick={() => {
                    setActiveTab("concern-types");
                    setShowMenuDropdown(false);
                  }}
                  className={`flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors duration-200 ${
                    activeTab === "concern-types"
                      ? "bg-orange-50 text-orange-700"
                      : "text-gray-700 hover:bg-orange-50 hover:text-orange-700"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span>Concern Types</span>
                </button>


                </div>
              </div>
              )}
            </div>
          </div>
        </div>

      {/* Main Dashboard */}
      <div className="space-y-3 sm:space-y-4">



        {/* Weekly Report Section */}
        {activeTab === "weekly-report" && (
          <div className="space-y-6">
            {/* Weekly Report Header */}
            <div className="bg-white shadow-sm border border-gray-200 rounded-xl">
              <div className={`${isCommandUser ? 'p-3 sm:p-4' : 'p-4 sm:p-6'} pb-0`}>
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 w-full lg:w-auto">
                    <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                      <FileText className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">Weekly Report - {selectedMonth} {selectedYear}</h3>
                      {activeMunicipalityTab && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-green-600" />
                            <span className="text-xs sm:text-sm font-medium text-green-600">{activeMunicipalityTab}</span>
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600">
                            {getConcernTypesForMunicipality(activeMunicipalityTab).length} concern types • 
                            {importedBarangays.filter(b => {
                              if (!activeMunicipalityTab) return false;
                              const normalizedTab = activeMunicipalityTab.toLowerCase().replace(/\s+city$/i, '').trim();
                              const normalizedBarangay = b.municipality.toLowerCase().replace(/\s+city$/i, '').trim();
                              return normalizedBarangay === normalizedTab;
                            }).length} barangays
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 sm:gap-4 w-full lg:w-auto">
                    {/* Import Options - Admin Only */}
                    {isAdmin && (
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                          <input
                            id="import-all-months"
                            name="import-all-months"
                            type="checkbox"
                            checked={importAllMonths}
                            onChange={(e) => setImportAllMonths(e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span>Import all months at once</span>
                        </label>
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      
                      {isAdmin && (
                        <button 
                          onClick={() => document.getElementById('excel-file-input').click()}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 min-h-[40px] whitespace-nowrap flex-shrink-0 disabled:opacity-50"
                          title={importAllMonths ? "Import All Months" : "Import Excel"}
                          disabled={isImportingExcel || isImportingAllMonths}
                        >
                        {(isImportingExcel || isImportingAllMonths) ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <FileSpreadsheet className="h-4 w-4" />
                        )}
                          <span className="text-sm font-medium">
                            {isImportingExcel ? 'Importing...' : isImportingAllMonths ? 'Importing All...' : importAllMonths ? 'Import All Months' : 'Import Excel'}
                          </span>
                        </button>
                      )}
                      
                      {isAdmin && (
                        <button
                          onClick={handleSaveAllMonths}
                          disabled={isSavingAllMonths || !Object.keys(allMonthsData || {}).length}
                          className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-3 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 min-h-[40px] whitespace-nowrap flex-shrink-0"
                          title="Save All Imported Months"
                        >
                        {isSavingAllMonths ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                          <span className="text-sm font-medium">
                            {isSavingAllMonths
                              ? `Saving ${saveAllProgress.current}/${saveAllProgress.total}`
                              : 'Save All Months'}
                          </span>
                        </button>
                      )}

                      {isAdmin && (
                        <Dialog open={showClearModal} onOpenChange={setShowClearModal}>
                          <DialogTrigger asChild>
                            <button 
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 min-h-[40px] whitespace-nowrap flex-shrink-0"
                              title="Clear Data"
                            >
                              <AlertTriangle className="h-4 w-4" />
                              <span className="text-sm font-medium">Clear Data</span>
                            </button>
                          </DialogTrigger>
                        
                        <DialogContent className="sm:max-w-md bg-white">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-red-600" />
                              Clear Data Options
                            </DialogTitle>
                            <DialogDescription>
                              Choose which data you want to clear. This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            {/* Clear Active Municipality */}
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                              <div className="flex items-center gap-3">
                                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium text-red-800">Clear Active Municipality</h4>
                                  <p className="text-xs text-red-600 mt-1">Clear data for {activeMunicipalityTab}</p>
                                </div>
                                <button
                                  onClick={() => {
                                    handleClearActiveMunicipalityData();
                                    setShowClearModal(false);
                                  }}
                                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors duration-200"
                                >
                                  Clear
                                </button>
                              </div>
                            </div>
                            
                            {/* Clear Selected Municipality */}
                            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                              <h4 className="text-sm font-medium text-gray-800 mb-3">Clear Selected Municipality</h4>
                              <div className="space-y-3">
                                <select 
                                  id="clear-municipality-select"
                                  name="clear-municipality-select"
                                  value={selectedClearMunicipality}
                                  onChange={(e) => setSelectedClearMunicipality(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                >
                                  <option value="">Choose municipality...</option>
                                  {Object.values(municipalitiesByDistrict).flat().map((municipality) => (
                                    <option key={municipality} value={municipality}>{municipality}</option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => {
                                    handleClearSelectedMunicipalityData();
                                    setShowClearModal(false);
                                  }}
                                  disabled={!selectedClearMunicipality}
                                  className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                                >
                                  <AlertTriangle className="h-4 w-4" />
                                  Clear Selected
                                </button>
                              </div>
                            </div>
                            
                            {/* Clear All Entries */}
                            <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
                              <div className="flex items-center gap-3">
                                <AlertTriangle className="h-5 w-5 text-red-700 flex-shrink-0" />
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium text-red-900">Clear All Entries</h4>
                                  <p className="text-xs text-red-700 mt-1">Reset ALL data for ALL municipalities across ALL months and years but keep dropdown options</p>
                                </div>
                                <button
                                  onClick={() => {
                                    handleClearAllData();
                                    setShowClearModal(false);
                                  }}
                                  className="px-3 py-2 bg-red-700 hover:bg-red-800 text-white rounded-md text-sm font-medium transition-colors duration-200"
                                >
                                  Clear All
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          <DialogFooter>
                            <button
                              onClick={() => setShowClearModal(false)}
                              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                            >
                              Cancel
                            </button>
                          </DialogFooter>
                        </DialogContent>
                        </Dialog>
                      )}
                      
                      {(isAdmin || userAccessLevel === 'command-center') && (
                        <button 
                          onClick={handleSaveWeeklyReport}
                          disabled={isLoadingWeeklyReports}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 min-h-[40px] whitespace-nowrap flex-shrink-0"
                          title="Save Data"
                        >
                          {isLoadingWeeklyReports ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          <span className="text-sm font-medium">Save Data</span>
                        </button>
                      )}
                      
                    </div>
                    
                    <input
                      id="excel-file-input"
                      name="excel-file-input"
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleExcelFileSelect}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
              <div className={`${isCommandUser ? 'p-4' : 'p-4 md:p-6'} pt-0`}>
                {/* Month/Year Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label htmlFor="month-select" className="block text-sm font-medium text-gray-700 mb-2">Select Month</label>
                    <select 
                      id="month-select"
                      name="month-select"
                      value={selectedMonth}
                      onChange={(e) => {
                        const newMonth = e.target.value;
                        console.log('📅 Month dropdown changed from:', selectedMonth, 'to:', newMonth);
                        setSelectedMonth(newMonth);
                        // Data will be loaded from Firestore via useEffect for month changes
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      {months.map((month) => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="year-select" className="block text-sm font-medium text-gray-700 mb-2">Select Year</label>
                    <select 
                      id="year-select"
                      name="year-select"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      {years.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Municipality Selection - Admin only */}
                {isAdmin && (
                  <div className="mb-6">
                    <div className="block text-sm font-medium text-gray-700 mb-3">Municipality</div>
                    <div className="flex flex-wrap gap-3">
                      {Object.values(municipalitiesByDistrict).flat().map((municipality) => {
                        const isActive = activeMunicipalityTab === municipality;
                        const concernTypesCount = getConcernTypesForMunicipality(municipality).length;
                        const barangaysCount = importedBarangays.filter(b => {
                          // Normalize municipality names for comparison
                          const normalizedMunicipality = municipality.toLowerCase().replace(/\s+city$/i, '').trim();
                          const normalizedBarangay = b.municipality.toLowerCase().replace(/\s+city$/i, '').trim();
                          return normalizedBarangay === normalizedMunicipality;
                        }).length;
                        
                        return (
                          <Badge
                            key={municipality}
                            variant={isActive ? "default" : "secondary"}
                            className={`px-4 py-2 h-auto cursor-pointer transition-all duration-200 flex items-center gap-2 hover:scale-105 ${
                              isActive
                                ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg border-green-600'
                                : 'bg-white hover:bg-green-50 text-gray-700 border border-gray-300 hover:border-green-300'
                            }`}
                            onClick={() => handleMunicipalityTabChange(municipality)}
                          >
                            <Building2 className="h-4 w-4" />
                            <span className="font-medium">{municipality}</span>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ml-1 ${
                                isActive 
                                  ? 'bg-green-500 border-green-400 text-white hover:bg-green-400' 
                                  : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {barangaysCount} brgy • {concernTypesCount} types
                            </Badge>
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              
              
              <div className={`${isCommandUser ? 'p-3' : 'p-4 md:p-6'} pt-0`}>
                <div className={`overflow-x-auto h-[60vh] md:h-[70vh] overflow-y-auto relative rounded-lg border border-gray-200 bg-white shadow-sm ${isCommandUser ? 'cc-compact' : ''}`} style={{paddingBottom: '8px', marginBottom: '-8px', paddingRight: '8px', marginRight: '-8px'}}>
                  <table className="w-full min-w-[1200px]">
                    <thead className="sticky top-0 z-20">
                      <tr className="bg-white border-b-2 border-gray-300">
                        <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 border-r border-gray-200">DATE</th>
                        <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 border-r border-gray-200 w-32">
                          <div className="flex items-center gap-2">
                            <MapPinIcon className="h-4 w-4 text-blue-500" />
                            BARANGAY
                          </div>
                          <div className="text-xs text-gray-500 font-normal mt-1">Select from dropdown</div>
                        </th>
                        <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 border-r border-gray-200">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                            CONCERN TYPE
                          </div>
                          <div className="text-xs text-gray-500 font-normal mt-1">Select from dropdown</div>
                        </th>
                        <th className="px-4 py-4 text-center text-sm font-bold text-gray-800 border-r border-gray-200" colSpan="4">
                          <div className="flex items-center justify-center gap-2">
                            <BarChart3 className="h-4 w-4 text-purple-500" />
                            WEEKLY REPORT
                          </div>
                        </th>
                        <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 border-r border-gray-200 table-cell-spacing">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-gray-500" />
                            REMARKS
                          </div>
                        </th>
                        <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 table-cell-spacing">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            ACTION TAKEN
                          </div>
                        </th>
                      </tr>
                      <tr className="bg-gray-100 border-b border-gray-300">
                        <th className="px-4 py-3 border-r border-gray-200"></th>
                        <th className="px-4 py-3 border-r border-gray-200"></th>
                        <th className="px-4 py-3 border-r border-gray-200"></th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-white bg-yellow-500 border-r border-gray-200 whitespace-nowrap">
                          <div className="font-bold">Week 1</div>
                          <div className="text-xs opacity-90">{selectedMonth} 1-7</div>
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-white bg-green-500 border-r border-gray-200 whitespace-nowrap">
                          <div className="font-bold">Week 2</div>
                          <div className="text-xs opacity-90">{selectedMonth} 8-14</div>
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-white bg-blue-500 border-r border-gray-200 whitespace-nowrap">
                          <div className="font-bold">Week 3</div>
                          <div className="text-xs opacity-90">{selectedMonth} 15-21</div>
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-white bg-purple-500 border-r border-gray-200 whitespace-nowrap">
                          <div className="font-bold">Week 4</div>
                          <div className="text-xs opacity-90">{selectedMonth} 22-{new Date(selectedYear, months.indexOf(selectedMonth) + 1, 0).getDate()}</div>
                        </th>
                        <th className="px-4 py-3 border-r border-gray-200"></th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {currentDates.map((date, index) => {
                        const weekNumber = getWeekNumber(date);
                        const isWeekend = index % 7 >= 5; // Saturday and Sunday
                        const dateEntries = getDateData(date);
                        
                        // Debug logging for first few dates
                        if (index < 3) {
                          console.log(`🔍 Table Debug - Date: ${date}, Entries:`, dateEntries, 'WeeklyReportData keys:', Object.keys(weeklyReportData));
                        }
                        
                        return (
                          <React.Fragment key={index}>
                            {dateEntries.length === 0 ? (
                              // Empty row when no entries
                              <tr className={`hover:bg-gray-50 transition-colors duration-200 ${isWeekend ? 'bg-blue-50' : 'bg-white'} border-b border-gray-200`}>
                                <td className="px-3 py-2 text-sm font-medium text-gray-700 bg-white/30">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-3 w-3 text-gray-400" />
                                    {date}
                                  </div>
                                </td>
                                <td className="px-3 py-2">
                                  <select 
                                    id={`barangay-select-${date}`}
                                    name={`barangay-select-${date}`}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200"
                                    value=""
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        addDateEntry(date);
                                        updateDateData(date, 0, 'barangay', e.target.value);
                                      }
                                    }}
                                  >
                                    <option value="">Select Barangay</option>
                                    {importedBarangays
                                      .filter(barangay => {
                                        if (!activeMunicipalityTab) return true;
                                        // Normalize municipality names for comparison (handle "Balanga" vs "Balanga City")
                                        const normalizedTab = activeMunicipalityTab.toLowerCase().replace(/\s+city$/i, '').trim();
                                        const normalizedBarangay = barangay.municipality.toLowerCase().replace(/\s+city$/i, '').trim();
                                        return normalizedBarangay === normalizedTab;
                                      })
                                      .map((barangay) => (
                                        <option key={barangay.id} value={`${barangay.name}, ${barangay.municipality}`}>
                                          {barangay.name} ({barangay.municipality})
                                        </option>
                                      ))}
                                  </select>
                                </td>
                                <td className="px-3 py-2">
                                  <select 
                                    id={`concern-type-select-${date}`}
                                    name={`concern-type-select-${date}`}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white transition-all duration-200"
                                    value=""
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        addDateEntry(date);
                                        updateDateData(date, 0, 'concernType', e.target.value);
                                      }
                                    }}
                                  >
                                    <option value="">Select Concern Type</option>
                                    {importedConcernTypes.length > 0 ? (
                                      getConcernTypesForMunicipality(activeMunicipalityTab)
                                        .map((type) => (
                                          <option key={type.id} value={type.name}>
                                            {type.name}
                                          </option>
                                        ))
                                    ) : (
                                      concernTypes.map((type) => (
                                        <option key={type} value={type}>
                                          {type}
                                        </option>
                                      ))
                                    )}
                                  </select>
                                </td>
                                <td className="px-3 py-2">
                                  <input 
                                    id={`week1-${date}`}
                                    name={`week1-${date}`}
                                    type="number" 
                                    min="0"
                                    step="1"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white transition-all duration-200 text-center font-medium"
                                    placeholder="0"
                                    value=""
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        addDateEntry(date);
                                        updateDateData(date, 0, 'week1', e.target.value);
                                      }
                                    }}
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <input 
                                    id={`week2-${date}`}
                                    name={`week2-${date}`}
                                    type="number" 
                                    min="0"
                                    step="1"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-all duration-200 text-center font-medium"
                                    placeholder="0"
                                    value=""
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        addDateEntry(date);
                                        updateDateData(date, 0, 'week2', e.target.value);
                                      }
                                    }}
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <input 
                                    id={`week3-${date}`}
                                    name={`week3-${date}`}
                                    type="number" 
                                    min="0"
                                    step="1"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 text-center font-medium"
                                    placeholder="0"
                                    value=""
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        addDateEntry(date);
                                        updateDateData(date, 0, 'week3', e.target.value);
                                      }
                                    }}
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <input 
                                    id={`week4-${date}`}
                                    name={`week4-${date}`}
                                    type="number" 
                                    min="0"
                                    step="1"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white transition-all duration-200 text-center font-medium"
                                    placeholder="0"
                                    value=""
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        addDateEntry(date);
                                        updateDateData(date, 0, 'week4', e.target.value);
                                      }
                                    }}
                                  />
                                </td>
                                <td className="px-3 py-2 table-cell-spacing table-cell-hover" data-tooltip="">
                                  <input 
                                    id={`action-taken-${date}`}
                                    name={`action-taken-${date}`}
                                    type="text" 
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-all duration-200"
                                    placeholder=""
                                    value=""
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        addDateEntry(date);
                                        updateDateData(date, 0, 'actionTaken', e.target.value);
                                      }
                                    }}
                                  />
                                </td>
                                <td className="px-3 py-2 table-cell-spacing">
                                  <div className="flex items-center justify-center">
                                    <span className="text-xs text-gray-400 italic">Add entry to upload</span>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              // Render existing entries
                              dateEntries.map((entry, entryIndex) => (
                                <tr key={`${date}-${entryIndex}`} className={`hover:bg-gray-50 transition-colors duration-200 ${isWeekend ? 'bg-blue-50' : 'bg-white'} border-b border-gray-200`}>
                                  {entryIndex === 0 && (
                                    <td className="px-3 py-2 text-sm font-medium text-gray-700 bg-white/30" rowSpan={dateEntries.length}>
                                      <div className="flex items-center gap-2">
                                        <Clock className="h-3 w-3 text-gray-400" />
                                        {date}
                                      </div>
                                    </td>
                                  )}
                                  <td className="px-3 py-2 table-cell-hover" data-tooltip={entry.barangay || "Select barangay"}>
                                    <div className="flex items-center gap-2">
                                      <select 
                                        id={`existing-barangay-${date}-${entryIndex}`}
                                        name={`existing-barangay-${date}-${entryIndex}`}
                                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200"
                                        value={entry.barangay}
                                        onChange={(e) => updateDateData(date, entryIndex, 'barangay', e.target.value)}
                                      >
                                        <option value="">Select Barangay</option>
                                        {importedBarangays
                                          .filter(barangay => {
                                            if (!activeMunicipalityTab) return true;
                                            // Normalize municipality names for comparison (handle "Balanga" vs "Balanga City")
                                            const normalizedTab = activeMunicipalityTab.toLowerCase().replace(/\s+city$/i, '').trim();
                                            const normalizedBarangay = barangay.municipality.toLowerCase().replace(/\s+city$/i, '').trim();
                                            return normalizedBarangay === normalizedTab;
                                          })
                                          .map((barangay) => (
                                            <option key={barangay.id} value={`${barangay.name}, ${barangay.municipality}`}>
                                              {barangay.name} ({barangay.municipality})
                                            </option>
                                          ))}
                                      </select>
                                      <button
                                        onClick={() => removeDateEntry(date, entryIndex)}
                                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                        title="Remove entry"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 table-cell-hover" data-tooltip={entry.concernType || "Select concern type"}>
                                    <select 
                                      id={`existing-concern-type-${date}-${entryIndex}`}
                                      name={`existing-concern-type-${date}-${entryIndex}`}
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white transition-all duration-200"
                                      value={entry.concernType}
                                      onChange={(e) => updateDateData(date, entryIndex, 'concernType', e.target.value)}
                                    >
                                      <option value="">Select Concern Type</option>
                                      {importedConcernTypes.length > 0 ? (
                                        getConcernTypesForMunicipality(activeMunicipalityTab)
                                          .map((type) => (
                                            <option key={type.id} value={type.name}>
                                              {type.name}
                                            </option>
                                          ))
                                      ) : (
                                        concernTypes.map((type) => (
                                          <option key={type} value={type}>
                                            {type}
                                          </option>
                                        ))
                                      )}
                                    </select>
                                  </td>
                                  <td className="px-3 py-2">
                                    <input 
                                      id={`existing-week1-${date}-${entryIndex}`}
                                      name={`existing-week1-${date}-${entryIndex}`}
                                      type="number" 
                                      min="0"
                                      step="1"
                                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white shadow-sm transition-all duration-200 text-center font-medium"
                                      placeholder="0"
                                      value={entry.week1}
                                      onChange={(e) => updateDateData(date, entryIndex, 'week1', e.target.value)}
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input 
                                      id={`existing-week2-${date}-${entryIndex}`}
                                      name={`existing-week2-${date}-${entryIndex}`}
                                      type="number" 
                                      min="0"
                                      step="1"
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-all duration-200 text-center font-medium"
                                      placeholder="0"
                                      value={entry.week2}
                                      onChange={(e) => updateDateData(date, entryIndex, 'week2', e.target.value)}
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input 
                                      id={`existing-week3-${date}-${entryIndex}`}
                                      name={`existing-week3-${date}-${entryIndex}`}
                                      type="number" 
                                      min="0"
                                      step="1"
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 text-center font-medium"
                                      placeholder="0"
                                      value={entry.week3}
                                      onChange={(e) => updateDateData(date, entryIndex, 'week3', e.target.value)}
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input 
                                      id={`existing-week4-${date}-${entryIndex}`}
                                      name={`existing-week4-${date}-${entryIndex}`}
                                      type="number" 
                                      min="0"
                                      step="1"
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white transition-all duration-200 text-center font-medium"
                                      placeholder="0"
                                      value={entry.week4}
                                      onChange={(e) => updateDateData(date, entryIndex, 'week4', e.target.value)}
                                    />
                                  </td>
                                  <td className="px-3 py-2 table-cell-spacing table-cell-hover" data-tooltip={entry.actionTaken || ""}>
                                    <input 
                                      id={`existing-action-taken-${date}-${entryIndex}`}
                                      name={`existing-action-taken-${date}-${entryIndex}`}
                                      type="text" 
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-all duration-200"
                                      placeholder=""
                                      value={entry.actionTaken}
                                      onChange={(e) => updateDateData(date, entryIndex, 'actionTaken', e.target.value)}
                                    />
                                  </td>
                                  <td className="px-3 py-2 table-cell-spacing">
                                    <div className="flex items-center justify-center gap-2 h-full">
                                      {entry.photos && (
                                        (entry.photos.before || entry.photos.after) ||
                                        (entry.photos.rows && Array.isArray(entry.photos.rows) && entry.photos.rows.length > 0)
                                      ) ? (
                                        <>
                                          {/* View button when photos exist */}
                                          <button
                                            onClick={() => handleViewPhotos(date, entryIndex)}
                                            className="flex items-center gap-2 px-4 py-1.5 text-green-600 hover:text-white hover:bg-green-600 rounded-md transition-colors duration-200 border border-green-300 hover:border-green-600"
                                            title="View Photos"
                                          >
                                            <Eye className="w-4 h-4" />
                                            <span className="text-sm font-medium">View</span>
                                          </button>
                                          {/* Edit button - show if before OR after photo is missing, OR if user is admin */}
                                          {(isAdmin || (!entry.remarks && ((!entry.photos.before || !entry.photos.after) || (entry.photos.rows && entry.photos.rows.some(row => !row.after || !row.after.length))))) && (
                                            <button
                                              onClick={() => handleOpenPhotoUpload(date, entryIndex)}
                                              className="flex items-center gap-2 px-4 py-1.5 text-blue-600 hover:text-white hover:bg-blue-600 rounded-md transition-colors duration-200 border border-blue-300 hover:border-blue-600"
                                              title={isAdmin ? "Edit Photos & Remarks (Admin)" : "Edit Photos & Remarks"}
                                            >
                                              <Upload className="w-4 h-4" />
                                              <span className="text-sm font-medium">Edit</span>
                                            </button>
                                          )}
                                          {/* Reset button for administrators only */}
                                          {isAdmin && (
                                            <button
                                              onClick={() => handleResetPhotos(date, entryIndex)}
                                              className="p-1.5 text-red-600 hover:text-white hover:bg-red-600 rounded-md transition-colors duration-200 border border-red-300 hover:border-red-600"
                                              title="Reset Photos (Admin Only)"
                                            >
                                              <X className="w-4 h-4" />
                                            </button>
                                          )}
                                        </>
                                      ) : (
                                        // Show Upload button only when no photos exist
                                        <button
                                          onClick={() => handleOpenPhotoUpload(date, entryIndex)}
                                          disabled={isEntryIncomplete(entry)}
                                          className={`flex items-center gap-2 px-4 py-1.5 rounded-md transition-colors duration-200 border ${
                                            isEntryIncomplete(entry)
                                              ? 'text-gray-400 bg-gray-100 border-gray-300 cursor-not-allowed opacity-50'
                                              : 'text-blue-600 hover:text-white hover:bg-blue-600 border-blue-300 hover:border-blue-600'
                                          }`}
                                          title={
                                            isEntryIncomplete(entry)
                                              ? 'Complete all required fields first: Barangay, Concern Type, at least one Week, and Action Taken'
                                              : 'Upload Photos & Add Remarks'
                                          }
                                        >
                                          <Upload className="w-4 h-4" />
                                          <span className="text-sm font-medium">Upload</span>
                                        </button>
                                      )}
                                      {entry.remarks && (
                                        (entry.photos?.after && Array.isArray(entry.photos.after) && entry.photos.after.length > 0) ||
                                        (entry.photos?.rows && Array.isArray(entry.photos.rows) && entry.photos.rows.some(row => row.after && Array.isArray(row.after) && row.after.length > 0))
                                      ) && (
                                        <div className="relative group">
                                          <div className="px-2.5 py-1 bg-yellow-100 border-l-4 border-yellow-400 rounded-r-md shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-1">
                                            <span className="text-yellow-600 text-sm">📝</span>
                                            <span className="text-xs font-medium text-yellow-800">Action Taken</span>
                                          </div>
                                          {/* Tooltip on hover - positioned above and aligned to right, extends to the left */}
                                          <div className="absolute right-0 bottom-full mb-2 min-w-[200px] max-w-[280px] p-3 bg-white border-2 border-yellow-400 rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[9999] pointer-events-none">
                                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-yellow-200">
                                              <span className="text-base">📝</span>
                                              <span className="text-xs font-bold text-yellow-900">Action Taken</span>
                                            </div>
                                            <p className="text-xs text-gray-700 leading-relaxed break-words whitespace-pre-wrap max-h-32 overflow-y-auto pr-1">{entry.remarks}</p>
                                            {/* Arrow pointing down to the button */}
                                            <div className="absolute right-6 -bottom-2 w-3 h-3 bg-white border-r-2 border-b-2 border-yellow-400 transform rotate-45"></div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                            {/* Add new entry button */}
                            <tr className={`${isWeekend ? 'bg-blue-50' : 'bg-gray-50'} border-b border-gray-200`}>
                              <td colSpan="9" className="px-4 py-3 text-center">
                                <button
                                  onClick={() => addDateEntry(date)}
                                  className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200 flex items-center gap-2 mx-auto border border-blue-200 hover:border-blue-300"
                                >
                                  <Plus className="h-4 w-4" />
                                  + Add Entry for {date}
                                </button>
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Barangay Management Section */}
        {activeTab === "barangays" && (
          <div className="space-y-6">
            {/* Municipality Totals Section */}
            <div className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
              <div className="p-4 md:p-6 pb-0">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center transition-colors duration-300 bg-green-100">
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold transition-colors duration-300 text-gray-900">Barangay Totals per Municipality</h3>
                </div>
              </div>
              <div className="p-4 md:p-6 pt-0">
                {isLoadingBarangays ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p>Loading barangays from database...</p>
                  </div>
                ) : importedBarangays.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No barangays imported yet</p>
                    <p className="text-sm">Import barangays to see municipality totals</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.keys(municipalitiesByDistrict).map((district) => {
                      const districtBarangays = importedBarangays.filter(brgy => brgy.district === district);
                      const municipalityCounts = districtBarangays.reduce((acc, barangay) => {
                        acc[barangay.municipality] = (acc[barangay.municipality] || 0) + 1;
                        return acc;
                      }, {});

                      return (
                        <div key={district}>
                          <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                            {district}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {municipalitiesByDistrict[district].map((municipality) => (
                              <div key={municipality} className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h5 className="font-semibold text-gray-900 text-sm">{municipality}</h5>
                                    <p className="text-xs text-gray-600 mt-1">Total Barangays</p>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-2xl font-bold text-purple-600">{municipalityCounts[municipality] || 0}</div>
                                    <div className="text-xs text-gray-500">barangays</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Import Section */}
            <div className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
              <div className="p-4 md:p-6 pb-0">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center transition-colors duration-300 bg-blue-100">
                    <Upload className="h-4 w-4 text-blue-600" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold transition-colors duration-300 text-gray-900">Import Barangays</h3>
                </div>
              </div>
              <div className="p-4 md:p-6 pt-0 space-y-4">
                <div className="space-y-2">
                  <label htmlFor="district-select" className="block text-sm font-medium text-gray-700">Select District</label>
                  <select 
                    id="district-select"
                    value={selectedDistrict} 
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Choose district</option>
                    {Object.keys(municipalitiesByDistrict).map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="municipality-select" className="block text-sm font-medium text-gray-700">Select Municipality</label>
                  <select 
                    id="municipality-select"
                    value={selectedMunicipality} 
                    onChange={(e) => setSelectedMunicipality(e.target.value)}
                    disabled={!selectedDistrict}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Choose municipality</option>
                    {selectedDistrict && municipalitiesByDistrict[selectedDistrict]?.map((municipality) => (
                      <option key={municipality} value={municipality}>
                        {municipality}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="barangay-data" className="block text-sm font-medium text-gray-700">Barangay Names</label>
                  <textarea
                    id="barangay-data"
                    name="barangay-data"
                    placeholder="Enter barangay names separated by commas or new lines&#10;Example:&#10;Barangay 1&#10;Barangay 2&#10;Barangay 3"
                    value={barangayData}
                    onChange={(e) => setBarangayData(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                  />
                </div>

                <button 
                  onClick={handleBarangayImport}
                  disabled={isImporting || !selectedDistrict || !selectedMunicipality || !barangayData.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
                >
                  {isImporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import Barangays
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Barangays List Section */}
            <div className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
              <div className="p-4 md:p-6 pb-0">
                {/* Header with title and count */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center transition-colors duration-300 bg-purple-100">
                      <Building2 className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-bold transition-colors duration-300 text-gray-900">Imported Barangays</h3>
                      <p className="text-sm text-gray-600">
                      {barangayFilterMunicipality 
                        ? `${getSortedBarangays().length} of ${importedBarangays.length} barangays (${barangayFilterMunicipality})`
                        : `${importedBarangays.length} barangays across ${Object.keys(getGroupedBarangays()).length} municipalities`
                      }
                      </p>
                    </div>
                  </div>

                {/* Controls and Actions */}
                                      {importedBarangays.length > 0 && (
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Filter and Sort Controls */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Filter:</span>
                        <select
                          value={barangayFilterMunicipality}
                          onChange={(e) => setBarangayFilterMunicipality(e.target.value)}
                          className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="">All Municipalities</option>
                          {getUniqueMunicipalities().map(municipality => (
                            <option key={municipality} value={municipality}>{municipality}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Sort by:</span>
                        <select
                          value={barangaySortBy}
                          onChange={(e) => handleBarangaySort(e.target.value)}
                          className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="name">Name</option>
                          <option value="municipality">Municipality</option>
                          <option value="district">District</option>
                          <option value="importedAt">Import Date</option>
                        </select>
                        <button
                          onClick={() => setBarangaySortOrder(barangaySortOrder === 'asc' ? 'desc' : 'asc')}
                          className="p-1 hover:bg-gray-100 rounded transition-colors duration-200"
                          title={`Sort ${barangaySortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                        >
                          {barangaySortOrder === 'asc' ? (
                            <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                        <button 
                          onClick={handleSelectAllBarangays}
                          className={`border font-medium py-1 px-3 rounded-md transition-colors duration-200 flex items-center text-sm ${
                            selectedBarangays.length === importedBarangays.length
                              ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {selectedBarangays.length === importedBarangays.length ? 'Deselect All' : 'Select All'}
                        </button>
                        {selectedBarangays.length > 0 && (
                          <>
                            <button 
                              onClick={handleEditSelectedBarangays}
                              className="bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-medium py-1 px-3 rounded-md transition-colors duration-200 flex items-center text-sm"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Edit Selected
                            </button>
                            <button 
                              onClick={handleRemoveSelectedBarangays}
                              className="bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 font-medium py-1 px-3 rounded-md transition-colors duration-200 flex items-center text-sm"
                            >
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              Remove Selected ({selectedBarangays.length})
                            </button>
                          </>
                        )}
                        <button 
                          onClick={handleExportBarangays} 
                          className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-1 px-3 rounded-md transition-colors duration-200 flex items-center text-sm"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export CSV
                        </button>
                        <button
                          onClick={handleEditSelectedBarangays}
                          disabled={selectedBarangays.length === 0}
                          className="bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-medium py-1 px-3 rounded-md transition-colors duration-200 flex items-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Selected ({selectedBarangays.length})
                        </button>
                        <button
                          onClick={handleClearSelectedBarangays}
                          disabled={selectedBarangays.length === 0}
                          className="bg-orange-50 border border-orange-200 hover:bg-orange-100 text-orange-700 font-medium py-1 px-3 rounded-md transition-colors duration-200 flex items-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Clear Selected ({selectedBarangays.length})
                        </button>
                        <button 
                          onClick={handleClearBarangays} 
                          className="bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 font-medium py-1 px-3 rounded-md transition-colors duration-200 flex items-center text-sm"
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Clear All
                        </button>
                    </div>
                      </div>
                    )}
              </div>
              <div className="p-4 md:p-6 pt-0">
                {isLoadingBarangays ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p>Loading barangays from database...</p>
                  </div>
                ) : importedBarangays.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No barangays imported yet</p>
                    <p className="text-sm">Use the import form to add barangays</p>
                  </div>
                ) : (
                                      <div className="space-y-4 max-h-96 overflow-y-auto">
                      {/* Expand/Collapse All Controls */}
                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={expandAllMunicipalities}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                          >
                            Expand All
                          </button>
                          <button
                            onClick={collapseAllMunicipalities}
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                          >
                            Collapse All
                          </button>
                        </div>
                        <div className="text-xs text-gray-500">
                          {Object.keys(getGroupedBarangays()).length} municipalities
                        </div>
                      </div>

                      {/* Grouped Barangays by Municipality */}
                      {Object.entries(getGroupedBarangays()).map(([municipality, barangays]) => {
                        const isExpanded = expandedMunicipalities.has(municipality);
                        const isAllSelected = barangays.every(barangay => selectedBarangays.includes(barangay.id));
                        const isSomeSelected = barangays.some(barangay => selectedBarangays.includes(barangay.id));
                        
                        return (
                          <div key={municipality} className="border border-gray-200 rounded-lg overflow-hidden">
                            {/* Municipality Header */}
                            <div 
                              className="bg-gradient-to-r from-purple-50 to-blue-50 px-4 py-3 cursor-pointer hover:from-purple-100 hover:to-blue-100 transition-colors"
                              onClick={() => toggleMunicipality(municipality)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <input
                                    id={`select-all-barangays-${municipality}`}
                                    name={`select-all-barangays-${municipality}`}
                                    type="checkbox"
                                    checked={isAllSelected}
                                    ref={(input) => {
                                      if (input) input.indeterminate = isSomeSelected && !isAllSelected;
                                    }}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      barangays.forEach(barangay => {
                                        handleBarangaySelection(barangay.id, e.target.checked);
                                      });
                                    }}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  />
                                  <Building2 className="h-5 w-5 text-purple-600" />
                                  <div>
                                    <div className="font-semibold text-gray-900">{municipality}</div>
                                    <div className="text-sm text-gray-600">
                                      {barangays.length} barangay{barangays.length !== 1 ? 's' : ''}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                    {barangays[0]?.district || 'Unknown District'}
                                  </span>
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-gray-500" />
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Barangays List */}
                            {isExpanded && (
                              <div className="bg-white">
                                {barangays.map((barangay) => {
                        const isSelected = selectedBarangays.includes(barangay.id);
                        return (
                          <div 
                            key={barangay.id} 
                                      className={`flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0 transition-colors duration-200 ${
                              isSelected 
                                          ? 'bg-blue-50 border-l-4 border-l-blue-400' 
                                          : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                id={`barangay-${barangay.id}`}
                                name={`barangay-${barangay.id}`}
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => handleBarangaySelection(barangay.id, e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <MapPinIcon className="h-4 w-4 text-blue-500" />
                              <div>
                                <div className="font-medium text-sm">{barangay.name}</div>
                                <div className="text-xs text-gray-600">
                                            {barangay.district}
                                </div>
                              </div>
                            </div>
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {new Date(barangay.importedAt).toLocaleDateString()}
                            </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                )}
              </div>
            </div>

            {/* Edit Barangay Modal */}
            {isEditingBarangays && editingBarangay && (
              <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-200">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {editingBarangay.isBulkEdit ? `Edit ${editingBarangay.selectedIds.length} Selected Barangays` : 'Edit Barangay'}
                      </h3>
                      <button
                        onClick={handleCancelEdit}
                        className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label htmlFor="edit-barangay-name" className="block text-sm font-medium text-gray-700 mb-2">
                          {editingBarangay.isBulkEdit ? 'Barangay Names (comma-separated)' : 'Barangay Name'}
                        </label>
                        <input
                          id="edit-barangay-name"
                          name="edit-barangay-name"
                          type="text"
                          value={editingBarangay.name}
                          onChange={(e) => setEditingBarangay({...editingBarangay, name: e.target.value})}
                          placeholder={editingBarangay.isBulkEdit ? "Enter barangay names separated by commas" : "Enter barangay name"}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {editingBarangay.isBulkEdit && (
                          <p className="text-xs text-gray-500 mt-1">
                            Separate multiple barangay names with commas. All selected barangays will be updated with the same municipality and district.
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="edit-barangay-district" className="block text-sm font-medium text-gray-700 mb-2">District</label>
                        <select
                          id="edit-barangay-district"
                          name="edit-barangay-district"
                          value={editingBarangay.district}
                          onChange={(e) => setEditingBarangay({...editingBarangay, district: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {Object.keys(municipalitiesByDistrict).map((district) => (
                            <option key={district} value={district}>
                              {district}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="edit-barangay-municipality" className="block text-sm font-medium text-gray-700 mb-2">Municipality</label>
                        <select
                          id="edit-barangay-municipality"
                          name="edit-barangay-municipality"
                          value={editingBarangay.municipality}
                          onChange={(e) => setEditingBarangay({...editingBarangay, municipality: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {editingBarangay.district && municipalitiesByDistrict[editingBarangay.district]?.map((municipality) => (
                            <option key={municipality} value={municipality}>
                              {municipality}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={handleSaveEditedBarangay}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Save Changes
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Statistics */}
          {importedBarangays.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
              <div className="p-4 md:p-6 pb-0">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center transition-colors duration-300 bg-indigo-100">
                    <Activity className="h-4 w-4 text-indigo-600" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold transition-colors duration-300 text-gray-900">Barangay Statistics</h3>
                </div>
              </div>
              <div className="p-4 md:p-6 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {importedBarangays.length}
                    </div>
                    <div className="text-sm text-blue-800">Total Barangays</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {new Set(importedBarangays.map(b => b.municipality)).size}
                    </div>
                    <div className="text-sm text-green-800">Municipalities</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {new Set(importedBarangays.map(b => b.district)).size}
                    </div>
                    <div className="text-sm text-purple-800">Districts</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
        )}

        {/* Edit Concern Type Modal */}
        {isEditingConcernTypes && editingConcernType && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingConcernType.isBulkEdit ? `Edit ${editingConcernType.selectedIds.length} Selected Concern Types` : 'Edit Concern Type'}
                  </h3>
                  <button
                    onClick={() => setIsEditingConcernTypes(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="edit-concern-type-name" className="block text-sm font-medium text-gray-700 mb-2">
                      {editingConcernType.isBulkEdit ? 'Concern Type Names (comma-separated)' : 'Concern Type Name'}
                    </label>
                    <input
                      id="edit-concern-type-name"
                      name="edit-concern-type-name"
                      type="text"
                      value={editingConcernType.name}
                      onChange={(e) => setEditingConcernType({...editingConcernType, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder={editingConcernType.isBulkEdit ? "Enter concern type names separated by commas" : "Enter concern type name"}
                    />
                    {editingConcernType.isBulkEdit && (
                      <p className="text-xs text-gray-500 mt-1">
                        Separate multiple concern type names with commas. All selected concern types will be updated with the same municipality and district.
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="edit-concern-type-district" className="block text-sm font-medium text-gray-700 mb-2">District</label>
                    <select
                      id="edit-concern-type-district"
                      name="edit-concern-type-district"
                      value={editingConcernType.district}
                      onChange={(e) => setEditingConcernType({...editingConcernType, district: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      {Object.keys(municipalitiesByDistrict).map((district) => (
                        <option key={district} value={district}>
                          {district}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="edit-concern-type-municipality" className="block text-sm font-medium text-gray-700 mb-2">Municipality</label>
                    <select
                      id="edit-concern-type-municipality"
                      name="edit-concern-type-municipality"
                      value={editingConcernType.municipality}
                      onChange={(e) => setEditingConcernType({...editingConcernType, municipality: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      {editingConcernType.district && municipalitiesByDistrict[editingConcernType.district]?.map((municipality) => (
                        <option key={municipality} value={municipality}>
                          {municipality}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSaveEditedConcernType}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Save Changes
                    </button>
                    <button
                      onClick={() => setIsEditingConcernTypes(false)}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Type of Concern Management Section */}
        {activeTab === "concern-types" && (
          <div className="space-y-6">
            {/* Concern Type Totals Card */}
            <div className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
              <div className="p-4 md:p-6 pb-0">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center transition-colors duration-300 bg-orange-100">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold transition-colors duration-300 text-gray-900">Concern Type Totals</h3>
                </div>
              </div>
              <div className="p-4 md:p-6 pt-0">
                {isLoadingConcernTypes ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                    <p>Loading concern types from database...</p>
                  </div>
                ) : importedConcernTypes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No concern types imported yet</p>
                    <p className="text-sm">Import concern types to see municipality totals</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Show only user's municipality for non-admin users */}
                    {!isAdmin && userMunicipality ? (
                      // Non-admin users see only their municipality
                      (() => {
                        const userMunicipalityConcernTypes = importedConcernTypes.filter(ct => 
                          ct.municipality.toLowerCase() === userMunicipality.toLowerCase()
                        );
                        const userDistrict = userMunicipalityConcernTypes.length > 0 ? userMunicipalityConcernTypes[0].district : null;
                        
                        return userDistrict ? (
                          <div>
                            <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                              {userDistrict}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h5 className="font-semibold text-gray-900 text-sm">{userMunicipality}</h5>
                                    <p className="text-xs text-gray-600 mt-1">Total Concern Types</p>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-2xl font-bold text-orange-600">{userMunicipalityConcernTypes.length}</div>
                                    <div className="text-xs text-gray-500">types</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p>No concern types found for {userMunicipality}</p>
                          </div>
                        );
                      })()
                    ) : (
                      // Admin users see all municipalities
                      Object.keys(municipalitiesByDistrict).map((district) => {
                        const districtConcernTypes = importedConcernTypes.filter(ct => ct.district === district);
                        const municipalityCounts = districtConcernTypes.reduce((acc, concernType) => {
                          acc[concernType.municipality] = (acc[concernType.municipality] || 0) + 1;
                          return acc;
                        }, {});

                        return (
                          <div key={district}>
                            <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                              {district}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {municipalitiesByDistrict[district].map((municipality) => (
                                <div key={municipality} className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h5 className="font-semibold text-gray-900 text-sm">{municipality}</h5>
                                      <p className="text-xs text-gray-600 mt-1">Total Concern Types</p>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-2xl font-bold text-orange-600">{municipalityCounts[municipality] || 0}</div>
                                      <div className="text-xs text-gray-500">types</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Import Section */}
              <div className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
                <div className="p-4 md:p-6 pb-0">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center transition-colors duration-300 bg-orange-100">
                      <Upload className="h-4 w-4 text-orange-600" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold transition-colors duration-300 text-gray-900">Import Concern Types</h3>
                  </div>
                </div>
                <div className="p-4 md:p-6 pt-0 space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="concern-district-select" className="block text-sm font-medium text-gray-700">Select District</label>
                    <select 
                      id="concern-district-select"
                      value={selectedDistrict} 
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      disabled={!!userMunicipality}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Choose district</option>
                      {Object.keys(municipalitiesByDistrict).map((district) => (
                        <option key={district} value={district}>
                          {district}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="concern-municipality-select" className="block text-sm font-medium text-gray-700">Select Municipality</label>
                    <select 
                      id="concern-municipality-select"
                      value={selectedMunicipality} 
                      onChange={(e) => setSelectedMunicipality(e.target.value)}
                      disabled={!selectedDistrict || !!userMunicipality}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Choose municipality</option>
                      {selectedDistrict && municipalitiesByDistrict[selectedDistrict]?.map((municipality) => (
                        <option key={municipality} value={municipality}>
                          {municipality}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="concern-type-data" className="block text-sm font-medium text-gray-700">Concern Type Names</label>
                    <textarea
                      id="concern-type-data"
                      name="concern-type-data"
                      placeholder={`Enter concern types separated by commas or new lines\nExample:\nSecurity Issue\nTraffic Violation\nPublic Disturbance\nEmergency Response\nCommunity Service`}
                      value={concernTypeData}
                      onChange={(e) => setConcernTypeData(e.target.value)}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-vertical"
                    />
                  </div>

                  <button 
                    onClick={handleConcernTypeImport}
                    disabled={isImporting || !selectedDistrict || !selectedMunicipality || !concernTypeData.trim()}
                    className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
                  >
                    {isImporting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Import Concern Types
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Concern Types List Section */}
              <div className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
                <div className="p-4 md:p-6 pb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full flex items-center justify-center transition-colors duration-300 bg-orange-100">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="text-lg md:text-xl font-bold transition-colors duration-300 text-gray-900">Imported Concern Types</h3>
                        <p className="text-sm text-gray-600">
                          {!isAdmin && userMunicipality 
                            ? `${getSortedConcernTypes().length} types in ${userMunicipality}`
                            : concernTypeFilterMunicipality 
                              ? `${getSortedConcernTypes().length} of ${importedConcernTypes.length} types (${concernTypeFilterMunicipality})`
                              : `${importedConcernTypes.length} types across ${Object.keys(getGroupedConcernTypes()).length} municipalities`
                          }
                        </p>
                      </div>
                    </div>
                    {importedConcernTypes.length > 0 && (
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        {/* Filter and Sort Controls */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                          {/* Show filter dropdown only for admin users */}
                          {isAdmin && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">Filter:</span>
                              <select 
                                value={concernTypeFilterMunicipality}
                                onChange={(e) => setConcernTypeFilterMunicipality(e.target.value)}
                                className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              >
                                <option value="">All Municipalities</option>
                                {[...new Set(importedConcernTypes.map(type => type.municipality))].sort().map(municipality => (
                                  <option key={municipality} value={municipality}>{municipality}</option>
                                ))}
                              </select>
                            </div>
                          )}
                          {/* Show municipality info for non-admin users */}
                          {!isAdmin && userMunicipality && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">Municipality:</span>
                              <span className="text-sm font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded">{userMunicipality}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Sort by:</span>
                            <select
                              value={concernTypeSortBy}
                              onChange={(e) => handleConcernTypeSort(e.target.value)}
                              className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            >
                              <option value="name">Name</option>
                              <option value="municipality">Municipality</option>
                              <option value="district">District</option>
                              <option value="importedAt">Import Date</option>
                            </select>
                            <button
                              onClick={() => setConcernTypeSortOrder(concernTypeSortOrder === 'asc' ? 'desc' : 'asc')}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                              title={`Sort ${concernTypeSortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                            >
                              {concernTypeSortOrder === 'asc' ? (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-500" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={selectedConcernTypes.length === getSortedConcernTypes().length ? handleDeselectAllConcernTypes : handleSelectAllConcernTypes}
                            className="bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-medium py-1 px-3 rounded-md transition-colors duration-200 flex items-center text-sm"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            {selectedConcernTypes.length === getSortedConcernTypes().length ? 'Deselect All' : 'Select All'}
                          </button>
                          {/* Show Export CSV button only for admin users */}
                          {isAdmin && (
                            <button
                              onClick={handleExportConcernTypesCSV}
                              className="bg-green-50 border border-green-200 hover:bg-green-100 text-green-700 font-medium py-1 px-3 rounded-md transition-colors duration-200 flex items-center text-sm"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Export CSV
                            </button>
                          )}
                        <button
                          onClick={handleEditSelectedConcernTypes}
                          disabled={selectedConcernTypes.length === 0}
                          className="bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-medium py-1 px-3 rounded-md transition-colors duration-200 flex items-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Selected ({selectedConcernTypes.length})
                        </button>
                        <button
                          onClick={handleClearSelectedConcernTypes}
                          disabled={selectedConcernTypes.length === 0}
                          className="bg-orange-50 border border-orange-200 hover:bg-orange-100 text-orange-700 font-medium py-1 px-3 rounded-md transition-colors duration-200 flex items-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Clear Selected ({selectedConcernTypes.length})
                        </button>
                        {/* Show Clear All Data button only for admin users */}
                        {isAdmin && (
                          <button 
                            onClick={handleClearConcernTypes} 
                            className="bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 font-medium py-1 px-3 rounded-md transition-colors duration-200 flex items-center text-sm"
                          >
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Clear All Data
                          </button>
                        )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-4 md:p-6 pt-0">
                  {isLoadingConcernTypes ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                      <p>Loading concern types from database...</p>
                    </div>
                  ) : importedConcernTypes.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No concern types imported yet</p>
                      <p className="text-sm">Use the import form to add concern types</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {/* Expand/Collapse All Controls */}
                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={expandAllConcernTypeMunicipalities}
                            className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                          >
                            Expand All
                          </button>
                          <button
                            onClick={collapseAllConcernTypeMunicipalities}
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                          >
                            Collapse All
                          </button>
                        </div>
                        <div className="text-xs text-gray-500">
                          {Object.keys(getGroupedConcernTypes()).length} municipalities
                        </div>
                      </div>

                      {/* Grouped Concern Types by Municipality */}
                      {Object.entries(getGroupedConcernTypes()).map(([municipality, concernTypes]) => {
                        const isExpanded = expandedConcernTypeMunicipalities.has(municipality);
                        const isForCurrentMunicipality = activeMunicipalityTab && 
                          (municipality === activeMunicipalityTab || municipality === "All Municipalities");
                        
                        return (
                          <div key={municipality} className="border border-gray-200 rounded-lg overflow-hidden">
                            {/* Municipality Header */}
                            <div 
                              className={`px-4 py-3 cursor-pointer transition-colors ${
                                isForCurrentMunicipality
                                  ? 'bg-gradient-to-r from-orange-50 to-yellow-50 hover:from-orange-100 hover:to-yellow-100'
                                  : 'bg-gradient-to-r from-orange-50 to-yellow-50 hover:from-orange-100 hover:to-yellow-100'
                              }`}
                              onClick={() => toggleConcernTypeMunicipality(municipality)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <AlertTriangle className={`h-5 w-5 ${
                                    isForCurrentMunicipality 
                                      ? 'text-orange-600' 
                                      : 'text-orange-500'
                                  }`} />
                                  <div>
                                    <div className="font-semibold text-gray-900">{municipality}</div>
                                    <div className="text-sm text-gray-600">
                                      {concernTypes.length} concern type{concernTypes.length !== 1 ? 's' : ''}
                                      {isForCurrentMunicipality && (
                                        <span className="ml-2 text-orange-600 font-medium">• Available for {activeMunicipalityTab}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                                    {concernTypes[0]?.district || 'Unknown District'}
                                  </span>
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-gray-500" />
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Concern Types List */}
                            {isExpanded && (
                              <div className="bg-white">
                                {concernTypes.map((type) => {
                        const isForCurrentMunicipality = activeMunicipalityTab && 
                          (type.municipality === activeMunicipalityTab || type.municipality === "All Municipalities");
                                  const isSelected = selectedConcernTypes.includes(type.id);
                                  
                        return (
                          <div 
                            key={type.id} 
                                      className={`flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0 transition-colors duration-200 ${
                                        isSelected
                                          ? 'bg-blue-50 border-l-4 border-l-blue-400' 
                                          : isForCurrentMunicipality 
                                            ? 'bg-orange-50 border-l-4 border-l-orange-400' 
                                            : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                                        <input
                                          id={`concern-type-${type.id}`}
                                          name={`concern-type-${type.id}`}
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={(e) => handleConcernTypeSelection(type.id, e.target.checked)}
                                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                              <AlertTriangle className={`h-4 w-4 ${
                                          isForCurrentMunicipality 
                                  ? 'text-orange-600' 
                                  : 'text-orange-500'
                              }`} />
                              <div>
                                <div className="font-medium text-sm">{type.name}</div>
                                <div className="text-xs text-gray-600">
                                            {type.district}
                                </div>
                              </div>
                            </div>
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              {new Date(type.importedAt).toLocaleDateString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      </section>


      {/* Weekly Reports Collection Modal */}
      {showCollectionView && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Database className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Weekly Reports Collection</h2>
                    <p className="text-sm text-gray-600">View and manage all weekly reports stored in Firestore</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCollectionView(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Filters */}
              <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Month</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Months</option>
                      <option value="January">January</option>
                      <option value="February">February</option>
                      <option value="March">March</option>
                      <option value="April">April</option>
                      <option value="May">May</option>
                      <option value="June">June</option>
                      <option value="July">July</option>
                      <option value="August">August</option>
                      <option value="September">September</option>
                      <option value="October">October</option>
                      <option value="November">November</option>
                      <option value="December">December</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Year</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Years</option>
                      <option value="2024">2024</option>
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Actions</label>
                    <div className="space-y-2">
                      <button
                        onClick={() => loadWeeklyReportsCollection({
                          month: selectedMonth || undefined,
                          year: selectedYear || undefined,
                          municipality: activeMunicipalityTab || undefined
                        })}
                        disabled={isLoadingCollection}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                      >
                        {isLoadingCollection ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium">Filter</span>
                      </button>
                      
                      <button
                        onClick={handleDeleteAllWeeklyReports}
                        className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                        title="Delete ALL weekly reports from ALL locations in Firestore"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm font-medium">Delete All Reports</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Collection Data */}
              <div className="space-y-4">
                {isLoadingCollection ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading collection data...</span>
                  </div>
                ) : weeklyReportsCollection.length === 0 ? (
                  <div className="text-center py-8">
                    <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Found</h3>
                    <p className="text-gray-600">No weekly reports found in the collection with the current filters.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        Showing {weeklyReportsCollection.length} report(s)
                      </p>
                    </div>
                    
                    {weeklyReportsCollection.map((report) => (
                      <div key={report.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {report.selectedMonth} {report.selectedYear}
                              </h3>
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                                {report.activeMunicipalityTab || 'All Municipalities'}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                              <div>
                                <p className="text-sm text-gray-600">Created:</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {new Date(report.createdAt).toLocaleDateString()} {new Date(report.createdAt).toLocaleTimeString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Last Updated:</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {new Date(report.lastUpdated).toLocaleDateString()} {new Date(report.lastUpdated).toLocaleTimeString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Created By:</p>
                                <p className="text-sm font-medium text-gray-900">{report.createdBy}</p>
                              </div>
                            </div>

                            <div className="mb-3">
                              <p className="text-sm text-gray-600">Report Data Summary:</p>
                              <div className="mt-1 text-sm text-gray-900">
                                {report.weeklyReportData && Object.keys(report.weeklyReportData).length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {Object.entries(report.weeklyReportData).map(([date, entries]) => (
                                      <span key={date} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                        {date}: {Array.isArray(entries) ? entries.length : 0} entries
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-500">No data entries</span>
                                )}
                              </div>
                            </div>

                            <div className="text-xs text-gray-500">
                              ID: {report.id}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => handleDeleteWeeklyReport(report.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                              title="Delete Report"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />

      {/* Photo Upload Dialog */}
      <Dialog open={showPhotoUploadDialog} onOpenChange={setShowPhotoUploadDialog}>
        <DialogContent className="sm:max-w-[900px]">
          <div className="flex items-start justify-between gap-2">

            <div className="flex-1">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-900">Upload Before & After Photos</DialogTitle>
                <DialogDescription className="text-gray-600">
                  Document the before and after state of your action with photos.
                </DialogDescription>
              </DialogHeader>
            </div>
            <button
              onClick={() => setShowInstructionsModal(true)}
              className="mt-[0.66rem] flex items-center px-2 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium text-sm flex-shrink-0 mr-2"
              title="View Quick Instructions"
            >

              <HelpCircle className="w-4 h-4" />
            </button>
          </div>

          {/* Paired Photo Upload - Multiple Rows */}
          <div className="space-y-4">
            {/* Photo Rows */}
            <div className="space-y-4 max-h-[500px] overflow-y-auto border rounded-lg p-4 bg-gray-50">
              {photoRows.map((row, rowIndex) => (
                <div key={row.id} className="bg-white rounded-lg border-2 border-gray-300 p-4">
                  {/* Row Header */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-700">Row {rowIndex + 1}</span>
                    </div>
                    {photoRows.length > 1 && (
                      <button
                        onClick={() => {
                          setPhotoRows(photoRows.filter(r => r.id !== row.id));
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete this row"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Row Content - Before and After side by side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Before Photos */}
                    <div className="bg-blue-50 rounded-lg border-2 border-blue-200 p-3 min-h-[260px]">

                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">B</div>
                        <label className="text-xs font-semibold text-blue-700">Before Photos</label>
                      </div>
                      <div className="space-y-2">
                        {row.beforePreviews.length > 0 && (
                          <div className="grid grid-cols-2 gap-2">
                            {row.beforePreviews.map((preview, index) => (
                              <div key={index} className="relative aspect-square border-2 border-blue-300 rounded-lg overflow-hidden bg-gray-100 group">
                                <img src={preview} alt={`Before ${index + 1}`} className="w-full h-full object-cover" />
                                <div className="absolute top-1 right-1 bg-blue-500 text-white px-1.5 py-0.5 rounded text-xs font-medium">{index + 1}</div>
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button
                                    onClick={() => {
                                      const newRows = photoRows.map(r => {
                                        if (r.id === row.id) {
                                          return {
                                            ...r,
                                            beforePreviews: r.beforePreviews.filter((_, idx) => idx !== index),
                                            beforePhotos: r.beforePhotos.filter((_, idx) => idx !== index)
                                          };
                                        }
                                        return r;
                                      });
                                      setPhotoRows(newRows);
                                    }}
                                    className="px-1.5 py-0.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-1 text-xs"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <label
                          htmlFor={`before-photo-input-${row.id}`}
                          className="block aspect-square border-2 border-dashed border-blue-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-100 transition-all"
                        >
                          <Plus className="w-5 h-5 text-blue-400 mb-1" />
                          <span className="text-xs font-medium text-blue-600">+ Add 1 or more photos</span>
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length > 0) {
                              Promise.all(files.map(file => {
                                return new Promise((resolve) => {
                                  const reader = new FileReader();
                                  reader.onload = (event) => resolve(event.target.result);
                                  reader.readAsDataURL(file);
                                });
                              })).then(previews => {
                                const newRows = photoRows.map(r => {
                                  if (r.id === row.id) {
                                    return {
                                      ...r,
                                      beforePreviews: [...r.beforePreviews, ...previews],
                                      beforePhotos: [...r.beforePhotos, ...files]
                                    };
                                  }
                                  return r;
                                });
                                setPhotoRows(newRows);
                              });
                            }
                          }}
                          className="hidden"
                          id={`before-photo-input-${row.id}`}
                        />
                      </div>
                    </div>

                    {/* After Photos */}
                    <div className="bg-green-50 rounded-lg border-2 border-green-200 p-3 min-h-[260px]">

                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">A</div>
                        <label className="text-xs font-semibold text-green-700">After Photos</label>
                      </div>
                      <div className="space-y-2">
                        {row.afterPreviews.length > 0 && (
                          <div className="grid grid-cols-2 gap-2">
                            {row.afterPreviews.map((preview, index) => (
                              <div key={index} className="relative aspect-square border-2 border-green-300 rounded-lg overflow-hidden bg-gray-100 group">
                                <img src={preview} alt={`After ${index + 1}`} className="w-full h-full object-cover" />
                                <div className="absolute top-1 right-1 bg-green-500 text-white px-1.5 py-0.5 rounded text-xs font-medium">{index + 1}</div>
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button
                                    onClick={() => {
                                      const newRows = photoRows.map(r => {
                                        if (r.id === row.id) {
                                          return {
                                            ...r,
                                            afterPreviews: r.afterPreviews.filter((_, idx) => idx !== index),
                                            afterPhotos: r.afterPhotos.filter((_, idx) => idx !== index)
                                          };
                                        }
                                        return r;
                                      });
                                      setPhotoRows(newRows);
                                    }}
                                    className="px-1.5 py-0.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-1 text-xs"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <label
                          htmlFor={`after-photo-input-${row.id}`}
                          className={`block aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-all ${
                            row.beforePreviews.length > 0
                              ? 'cursor-pointer border-green-300 hover:border-green-500 hover:bg-green-100'
                              : 'cursor-not-allowed border-gray-300 bg-gray-100 opacity-50'
                          }`}
                          onClick={(e) => {
                            if (row.beforePreviews.length === 0) {
                              e.preventDefault();
                              showError('Please upload before photos first');
                            }
                          }}
                        >
                          <Plus className="w-5 h-5 text-green-400 mb-1" />
                          <span className="text-xs font-medium text-green-600">+ Add 1 or more photos</span>
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            if (row.beforePreviews.length === 0) {
                              showError('Please upload before photos first');
                              return;
                            }
                            const files = Array.from(e.target.files || []);
                            if (files.length > 0) {
                              Promise.all(files.map(file => {
                                return new Promise((resolve) => {
                                  const reader = new FileReader();
                                  reader.onload = (event) => resolve(event.target.result);
                                  reader.readAsDataURL(file);
                                });
                              })).then(previews => {
                                const newRows = photoRows.map(r => {
                                  if (r.id === row.id) {
                                    return {
                                      ...r,
                                      afterPreviews: [...r.afterPreviews, ...previews],
                                      afterPhotos: [...r.afterPhotos, ...files]
                                    };
                                  }
                                  return r;
                                });
                                setPhotoRows(newRows);
                              });
                            }
                          }}
                          className="hidden"
                          id={`after-photo-input-${row.id}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Taken Section - Only show when both before and after photos exist */}
          {(photoRows.some(row => row.beforePreviews.length > 0) && photoRows.some(row => row.afterPreviews.length > 0)) && (
            <div className="mt-4 border-t pt-4">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                <MessageSquare className="w-4 h-4 inline mr-1" />
                Action Taken <span className="text-red-500">*</span>
              </label>
              <textarea
                value={currentPhotoEntry?.entry?.remarks || ''}
                onChange={(e) => {
                  if (currentPhotoEntry) {
                    const newValue = e.target.value;
                    
                    // Update currentPhotoEntry immediately for responsive UI
                    setCurrentPhotoEntry(prev => ({
                      ...prev,
                      entry: { ...prev.entry, remarks: newValue }
                    }));
                    
                    // Debounce the weeklyReportData update to prevent slowness
                    if (remarksDebounceRef.current) {
                      clearTimeout(remarksDebounceRef.current);
                    }
                    
                    remarksDebounceRef.current = setTimeout(() => {
                      updateDateData(currentPhotoEntry.date, currentPhotoEntry.entryIndex, 'remarks', newValue);
                    }, 300); // Wait 300ms after user stops typing
                  }
                }}
                placeholder="Add any additional notes or action taken about this concern..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Required: Please add action taken after uploading after photos</p>
            </div>
          )}

          <DialogFooter className="mt-6 flex items-center gap-3">
            <button
              onClick={() => {
                const newId = Math.max(...photoRows.map(r => r.id), 0) + 1;
                setPhotoRows([...photoRows, { id: newId, beforePhotos: [], afterPhotos: [], beforePreviews: [], afterPreviews: [] }]);
              }}
              className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Row
            </button>
            <div className="flex gap-3 ml-auto">
              <button
                onClick={() => setShowPhotoUploadDialog(false)}
                className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                disabled={isUploadingPhotos}
              >
                Cancel
              </button>
              <button
                onClick={handleUploadPhotos}
                disabled={isUploadingPhotos || !photoRows.some(row => row.beforePhotos.length > 0 || row.afterPhotos.length > 0)}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-medium shadow-lg"
              >
                {isUploadingPhotos ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload Photos
                  </>
                )}
              </button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo View Dialog */}
      <Dialog open={showPhotoViewDialog} onOpenChange={setShowPhotoViewDialog}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Before & After Photos</DialogTitle>
            <DialogDescription>
              View the before and after photos for this entry.
            </DialogDescription>
          </DialogHeader>
          
          {/* Fixed Header Section - Barangay and Municipality */}
          {viewingPhotos?.barangay && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Barangay - Left Side */}
              <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
                <p className="text-xs font-semibold text-purple-700 mb-1">Barangay</p>
                <p className="text-sm text-gray-800 font-medium">
                  {viewingPhotos.barangay.split(',')[0].trim()}
                </p>
              </div>
              
              {/* Municipality - Right Side */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-xs font-semibold text-blue-700 mb-1">Municipality</p>
                <p className="text-sm text-gray-800 font-medium">
                  {viewingPhotos.barangay.includes(',') ? `${viewingPhotos.barangay.split(',')[1].trim().toUpperCase()}, BATAAN` : 'N/A'}
                </p>
              </div>
            </div>
          )}
          
          {/* Scrollable Photos Section */}
          <div className="max-h-[500px] overflow-y-auto border-t border-b space-y-6 p-4">
            {/* Display photos by row if available */}
            {viewingPhotos?.rows && viewingPhotos.rows.length > 0 ? (
              viewingPhotos.rows.map((row, rowIndex) => (
                <div key={rowIndex} className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                  <div className="mb-4 pb-2 border-b">
                    <h3 className="text-sm font-semibold text-gray-700">Row {rowIndex + 1}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Before Photos for this row */}
                    {row.before && Array.isArray(row.before) && row.before.length > 0 && (
                      <PhotoCarousel
                        photos={row.before}
                        timestamps={row.beforeUploadedAt || []}
                        title={`Before Photos (Row ${rowIndex + 1})`}
                      />
                    )}

                    {/* After Photos for this row */}
                    {row.after && Array.isArray(row.after) && row.after.length > 0 && (
                      <PhotoCarousel
                        photos={row.after}
                        timestamps={row.afterUploadedAt || []}
                        title={`After Photos (Row ${rowIndex + 1})`}
                      />
                    )}
                  </div>
                </div>
              ))
            ) : (
              // Fallback for old format (backward compatibility)
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Before Photos Carousel */}
                {viewingPhotos?.before && Array.isArray(viewingPhotos.before) && viewingPhotos.before.length > 0 && (
                  <PhotoCarousel
                    photos={viewingPhotos.before}
                    timestamps={viewingPhotos.beforeUploadedAt || []}
                    title="Before Photos"
                  />
                )}

                {/* After Photos Carousel */}
                {viewingPhotos?.after && Array.isArray(viewingPhotos.after) && viewingPhotos.after.length > 0 && (
                  <PhotoCarousel
                    photos={viewingPhotos.after}
                    timestamps={viewingPhotos.afterUploadedAt || []}
                    title="After Photos"
                  />
                )}
              </div>
            )}
          </div>

          {/* Fixed Footer Section - Concern Type and Action Taken */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Concern Type - Left Side */}
            {viewingPhotos?.concernType && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-xs font-semibold text-blue-700 mb-1">Concern Type</p>
                <p className="text-sm text-gray-800">{viewingPhotos.concernType}</p>
              </div>
            )}

            {/* Action Taken - Right Side - Only show if after photos exist */}
            {viewingPhotos?.remarks && (
              (viewingPhotos?.after && Array.isArray(viewingPhotos.after) && viewingPhotos.after.length > 0) ||
              (viewingPhotos?.rows && viewingPhotos.rows.some(row => row.after && Array.isArray(row.after) && row.after.length > 0))
            ) && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-xs font-semibold text-green-700 mb-1">Action Taken</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{viewingPhotos.remarks}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <button
              onClick={() => setShowPhotoViewDialog(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Instructions Modal */}
      <Dialog open={showInstructionsModal} onOpenChange={setShowInstructionsModal}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Quick Instructions</DialogTitle>
            <DialogDescription className="text-gray-600">
              Step-by-step guide for uploading before and after photos
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-500 text-white font-bold text-sm">1</div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Before Photo</h4>
                <p className="text-sm text-gray-600">Capture the situation/area BEFORE taking action</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-500 text-white font-bold text-sm">2</div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">After Photo</h4>
                <p className="text-sm text-gray-600">Capture the same area AFTER action completed</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-500 text-white font-bold text-sm">3</div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Multiple Rows</h4>
                <p className="text-sm text-gray-600">Click "Add Row" to upload photos for different areas/concerns</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-orange-500 text-white font-bold text-sm">4</div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Action Taken</h4>
                <p className="text-sm text-gray-600">Describe what action was taken (required when after photos exist)</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                <strong>💡 Tips:</strong> Photos auto-compress to under 2MB • Upload both before & after for complete documentation
              </p>
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => setShowInstructionsModal(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Got it!
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

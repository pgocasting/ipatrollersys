import React, { useState, useEffect, useRef, useCallback } from "react";
import Layout from "./Layout";
import { commandCenterLog, createSectionGroup, CONSOLE_GROUPS } from './utils/consoleGrouping';
import { useFirebase } from "./hooks/useFirebase";
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


export default function CommandCenter({ onLogout, onNavigate, currentPage }) {
  const { user } = useFirebase();
  const { isAdmin, userMunicipality, userAccessLevel } = useAuth();
  const { notifications, showSuccess, showError, showInfo, showWarning, removeNotification } = useNotification();
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
  const [selectedYear, setSelectedYear] = useState("2025");
  const [selectedReportMunicipality, setSelectedReportMunicipality] = useState("");
  const [importedConcernTypes, setImportedConcernTypes] = useState([]);
  const [concernTypeData, setConcernTypeData] = useState("");
  const [isLoadingConcernTypes, setIsLoadingConcernTypes] = useState(false);
  const [isLoadingWeeklyReports, setIsLoadingWeeklyReports] = useState(false);
  
  // Weekly Report Data - Individual date entries
  const [weeklyReportData, setWeeklyReportData] = useState({});
  
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
  const [beforePhotos, setBeforePhotos] = useState([]);
  const [afterPhotos, setAfterPhotos] = useState([]);
  const [beforePhotoPreviews, setBeforePhotoPreviews] = useState([]);
  const [afterPhotoPreviews, setAfterPhotoPreviews] = useState([]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [showPhotoViewDialog, setShowPhotoViewDialog] = useState(false);
  const [viewingPhotos, setViewingPhotos] = useState(null);
  
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

  const currentYear = new Date().getFullYear();
  const years = [currentYear.toString(), (currentYear + 1).toString()];

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

  // Load weekly report data when year/municipality changes (but not month - handled by dropdown)
  useEffect(() => {
    console.log('🔄 Year/Municipality changed, reloading data:', {
      selectedMonth,
      selectedYear,
      activeMunicipalityTab
    });
    console.log('📊 Current allMonthsData state:', Object.keys(allMonthsData));
    
    // Only load if we have a valid month and year, and this is not a month change
    if (selectedMonth && selectedYear) {
      console.log('✅ Valid month/year, calling loadWeeklyReportData()');
      loadWeeklyReportData();
    } else {
      console.log('❌ Invalid month/year, skipping loadWeeklyReportData()');
    }
  }, [selectedYear, activeMunicipalityTab, allMonthsData]); // Removed selectedMonth from dependencies

  // Load weekly report data when month changes
  useEffect(() => {
    console.log('📅 Month changed, reloading data:', {
      selectedMonth,
      selectedYear,
      activeMunicipalityTab
    });
    
    // Only load if we have a valid month and year
    if (selectedMonth && selectedYear) {
      console.log('✅ Valid month selection, calling loadWeeklyReportData()');
      loadWeeklyReportData();
    } else {
      console.log('❌ Invalid month/year for month change, skipping loadWeeklyReportData()');
    }
  }, [selectedMonth]); // Only watch selectedMonth changes

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
    
    // Load existing photos if available (now as arrays)
    // Handle backward compatibility: convert old single photo (string) to array
    if (entry?.photos) {
      const beforeData = entry.photos.before;
      const afterData = entry.photos.after;
      
      // Convert to array if it's a string (old format)
      setBeforePhotoPreviews(
        Array.isArray(beforeData) ? beforeData : 
        (beforeData ? [beforeData] : [])
      );
      setAfterPhotoPreviews(
        Array.isArray(afterData) ? afterData : 
        (afterData ? [afterData] : [])
      );
    } else {
      setBeforePhotoPreviews([]);
      setAfterPhotoPreviews([]);
    }
    
    setBeforePhotos([]);
    setAfterPhotos([]);
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
    
    setIsUploadingPhotos(true);
    try {
      const { date, entryIndex } = currentPhotoEntry;
      const photos = {};
      const uploadTimestamp = new Date().toISOString();
      
      // Upload before photos if selected
      if (beforePhotos.length > 0) {
        const beforeUrls = [];
        const beforeTimestamps = [];
        
        for (let i = 0; i < beforePhotos.length; i++) {
          const result = await cloudinaryUtils.uploadImage(beforePhotos[i], {
            folder: `ipatroller/command-center/${activeMunicipalityTab}/${selectedMonth}_${selectedYear}`,
            publicId: `before-${date}-${entryIndex}-${i}-${Date.now()}`
          });
          
          if (result.success) {
            beforeUrls.push(result.data.url);
            beforeTimestamps.push(uploadTimestamp);
          } else {
            throw new Error(`Failed to upload before photo ${i + 1}`);
          }
        }
        
        // Combine with existing photos
        const existingBefore = Array.isArray(beforePhotoPreviews) ? beforePhotoPreviews : (beforePhotoPreviews ? [beforePhotoPreviews] : []);
        const existingTimestampsData = currentPhotoEntry?.entry?.photos?.beforeUploadedAt;
        const existingTimestamps = Array.isArray(existingTimestampsData) ? existingTimestampsData : (existingTimestampsData ? [existingTimestampsData] : []);
        
        photos.before = [...existingBefore, ...beforeUrls];
        photos.beforeUploadedAt = [...existingTimestamps, ...beforeTimestamps];
      } else if (beforePhotoPreviews.length > 0) {
        // Keep existing before photos and timestamps
        photos.before = beforePhotoPreviews;
        photos.beforeUploadedAt = currentPhotoEntry?.entry?.photos?.beforeUploadedAt || [];
      }
      
      // Upload after photos if selected
      if (afterPhotos.length > 0) {
        const afterUrls = [];
        const afterTimestamps = [];
        
        for (let i = 0; i < afterPhotos.length; i++) {
          const result = await cloudinaryUtils.uploadImage(afterPhotos[i], {
            folder: `ipatroller/command-center/${activeMunicipalityTab}/${selectedMonth}_${selectedYear}`,
            publicId: `after-${date}-${entryIndex}-${i}-${Date.now()}`
          });
          
          if (result.success) {
            afterUrls.push(result.data.url);
            afterTimestamps.push(uploadTimestamp);
          } else {
            throw new Error(`Failed to upload after photo ${i + 1}`);
          }
        }
        
        // Combine with existing photos
        const existingAfter = Array.isArray(afterPhotoPreviews) ? afterPhotoPreviews : (afterPhotoPreviews ? [afterPhotoPreviews] : []);
        const existingTimestampsData = currentPhotoEntry?.entry?.photos?.afterUploadedAt;
        const existingTimestamps = Array.isArray(existingTimestampsData) ? existingTimestampsData : (existingTimestampsData ? [existingTimestampsData] : []);
        
        photos.after = [...existingAfter, ...afterUrls];
        photos.afterUploadedAt = [...existingTimestamps, ...afterTimestamps];
      } else if (afterPhotoPreviews.length > 0) {
        // Keep existing after photos and timestamps
        photos.after = afterPhotoPreviews;
        photos.afterUploadedAt = currentPhotoEntry?.entry?.photos?.afterUploadedAt || [];
      }
      
      // Update the entry with photo URLs
      updateDateData(date, entryIndex, 'photos', photos);
      
      const totalUploaded = beforePhotos.length + afterPhotos.length;
      showSuccess(`${totalUploaded} photo(s) uploaded successfully!`);
      setShowPhotoUploadDialog(false);
      setBeforePhotos([]);
      setAfterPhotos([]);
      setBeforePhotoPreviews([]);
      setAfterPhotoPreviews([]);
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

        // Save cleared data to nested structure
        const saveResult = await saveWeeklyReportByMunicipality(reportData);
        if (saveResult.success) {
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

        // Save cleared data to nested structure
        const saveResult = await saveWeeklyReportByMunicipality(reportData);
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
    setIsLoadingBarangays(true);
    try {
      const result = await getBarangays();
      if (result.success) {
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
    setIsLoadingConcernTypes(true);
    try {
      const result = await getConcernTypes();
      if (result.success) {
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
      
      // Save to Firestore
      const saveResult = await saveBarangays(updatedBarangays);
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
      return;
    }

    if (window.confirm(`Are you sure you want to clear all ${importedBarangays.length} imported barangays? This action cannot be undone.`)) {
      try {
        // Save empty array to Firestore
        const saveResult = await saveBarangays([]);
        if (saveResult.success) {
          setImportedBarangays([]);
          setSelectedBarangays([]);
          toast.success("All barangays cleared successfully");
          showSuccess('All barangays cleared successfully!');
        } else {
          toast.error("Failed to clear barangays from database: " + saveResult.error);
          showError('Failed to clear barangays from database: ' + saveResult.error);
        }
      } catch (error) {
        toast.error("Error clearing barangays: " + error.message);
        showError('Error clearing barangays: ' + error.message);
      }
    }
  };

  const handleClearSelectedBarangays = async () => {
    if (selectedBarangays.length === 0) {
      toast.error("No barangays selected to clear");
      showError('No barangays selected to clear');
      return;
    }

    if (window.confirm(`Are you sure you want to clear ${selectedBarangays.length} selected barangays? This action cannot be undone.`)) {
      try {
        // Filter out selected barangays
        const remainingBarangays = importedBarangays.filter(barangay => !selectedBarangays.includes(barangay.id));
        
        // Save updated array to Firestore
        const saveResult = await saveBarangays(remainingBarangays);
        if (saveResult.success) {
          setImportedBarangays(remainingBarangays);
          setSelectedBarangays([]);
          toast.success(`${selectedBarangays.length} selected barangays cleared successfully`);
          showSuccess(`${selectedBarangays.length} selected barangays cleared successfully!`);
        } else {
          toast.error("Failed to clear selected barangays from database: " + saveResult.error);
          showError('Failed to clear selected barangays from database: ' + saveResult.error);
        }
      } catch (error) {
        toast.error("Error clearing selected barangays: " + error.message);
        showError('Error clearing selected barangays: ' + error.message);
      }
    }
  };

  const handleEditSelectedBarangays = () => {
    if (selectedBarangays.length === 0) {
      toast.error("No barangays selected to edit");
      showError('No barangays selected to edit');
      return;
    }

    const selectedBarangayData = importedBarangays.filter(barangay => selectedBarangays.includes(barangay.id));
    setEditingBarangay({
      id: 'bulk-edit',
      name: selectedBarangayData.map(b => b.name).join(', '),
      municipality: selectedBarangayData[0]?.municipality || '',
      district: selectedBarangayData[0]?.district || '',
      isBulkEdit: true,
      selectedIds: selectedBarangays
    });
    setIsEditingBarangays(true);
  };

  // Handle barangay selection
  const handleBarangaySelection = (barangayId, isSelected) => {
    if (isSelected) {
      setSelectedBarangays(prev => [...prev, barangayId]);
    } else {
      setSelectedBarangays(prev => prev.filter(id => id !== barangayId));
    }
  };

  // Handle select all barangays
  const handleSelectAllBarangays = () => {
    if (selectedBarangays.length === importedBarangays.length) {
      setSelectedBarangays([]);
    } else {
      setSelectedBarangays(importedBarangays.map(brgy => brgy.id));
    }
  };

  // Handle remove selected barangays
  const handleRemoveSelectedBarangays = async () => {
    if (selectedBarangays.length === 0) {
      toast.error("No barangays selected for removal");
      return;
    }

    if (window.confirm(`Are you sure you want to remove ${selectedBarangays.length} selected barangays? This action cannot be undone.`)) {
      try {
        const updatedBarangays = importedBarangays.filter(brgy => !selectedBarangays.includes(brgy.id));
        
        // Save to Firestore
        const saveResult = await saveBarangays(updatedBarangays);
        if (saveResult.success) {
          setImportedBarangays(updatedBarangays);
          setSelectedBarangays([]);
          toast.success(`${selectedBarangays.length} barangays removed successfully`);
        } else {
          toast.error("Failed to remove barangays from database: " + saveResult.error);
        }
      } catch (error) {
        toast.error("Error removing barangays: " + error.message);
      }
    }
  };


  // Handle save edited barangay
  const handleSaveEditedBarangay = async () => {
    if (!editingBarangay) return;

    try {
      let updatedBarangays;
      
      if (editingBarangay.isBulkEdit) {
        // Handle bulk edit
        const barangayNames = editingBarangay.name.split(',').map(name => name.trim()).filter(name => name);
        
        if (barangayNames.length !== editingBarangay.selectedIds.length) {
          toast.error(`Please provide exactly ${editingBarangay.selectedIds.length} barangay names (one for each selected barangay)`);
          return;
        }

        updatedBarangays = importedBarangays.map(brgy => {
          if (editingBarangay.selectedIds.includes(brgy.id)) {
            const nameIndex = editingBarangay.selectedIds.indexOf(brgy.id);
            return {
              ...brgy,
              name: barangayNames[nameIndex],
              municipality: editingBarangay.municipality,
              district: editingBarangay.district
            };
          }
          return brgy;
        });
      } else {
        // Handle single edit
        updatedBarangays = importedBarangays.map(brgy => 
          brgy.id === editingBarangay.id ? editingBarangay : brgy
        );
      }

      // Save to Firestore
      const saveResult = await saveBarangays(updatedBarangays);
      if (saveResult.success) {
        setImportedBarangays(updatedBarangays);
        setEditingBarangay(null);
        setIsEditingBarangays(false);
        setSelectedBarangays([]);
        toast.success(editingBarangay.isBulkEdit ? 
          `${editingBarangay.selectedIds.length} barangays updated successfully` : 
          "Barangay updated successfully"
        );
      } else {
        toast.error("Failed to update barangay in database: " + saveResult.error);
      }
    } catch (error) {
      toast.error("Error updating barangay: " + error.message);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingBarangay(null);
    setIsEditingBarangays(false);
    setSelectedBarangays([]);
  };

  const handleConcernTypeImport = async () => {
    if (!selectedDistrict || !selectedMunicipality || !concernTypeData.trim()) {
      toast.error("Please select district, municipality and enter concern types to import");
      return;
    }

    setIsImporting(true);
    try {
      const lines = concernTypeData.trim().split('\n');
      const newConcernTypes = lines
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map((concernType, index) => ({
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
      
      // Save to Firestore
      const saveResult = await saveConcernTypes(updatedConcernTypes);
      if (saveResult.success) {
        toast.success(`${newConcernTypes.length} concern types imported successfully for ${selectedMunicipality}`);
      } else {
        toast.error("Failed to save concern types to database: " + saveResult.error);
        // Revert local state if save failed
        setImportedConcernTypes(importedConcernTypes);
      }
    } catch (error) {
      console.error("Error importing concern types:", error);
      toast.error("Failed to import concern types");
    } finally {
      setIsImporting(false);
    }
  };

  const handleClearConcernTypes = async () => {
    if (importedConcernTypes.length === 0) {
      toast.error("No concern types to clear");
      return;
    }

    if (window.confirm(`Are you sure you want to clear all ${importedConcernTypes.length} imported concern types? This action cannot be undone.`)) {
      try {
        // Save empty array to Firestore
        const saveResult = await saveConcernTypes([]);
        if (saveResult.success) {
          setImportedConcernTypes([]);
          setSelectedConcernTypes([]);
          toast.success("All concern types cleared successfully");
        } else {
          toast.error("Failed to clear concern types from database: " + saveResult.error);
        }
      } catch (error) {
        toast.error("Error clearing concern types: " + error.message);
      }
    }
  };

  const handleClearSelectedConcernTypes = async () => {
    if (selectedConcernTypes.length === 0) {
      toast.error("No concern types selected to clear");
      return;
    }

    if (window.confirm(`Are you sure you want to clear ${selectedConcernTypes.length} selected concern types? This action cannot be undone.`)) {
      try {
        // Filter out selected concern types
        const remainingConcernTypes = importedConcernTypes.filter(concernType => !selectedConcernTypes.includes(concernType.id));
        
        // Save updated array to Firestore
        const saveResult = await saveConcernTypes(remainingConcernTypes);
        if (saveResult.success) {
          setImportedConcernTypes(remainingConcernTypes);
          setSelectedConcernTypes([]);
          toast.success(`${selectedConcernTypes.length} selected concern types cleared successfully`);
        } else {
          toast.error("Failed to clear selected concern types from database: " + saveResult.error);
        }
      } catch (error) {
        toast.error("Error clearing selected concern types: " + error.message);
      }
    }
  };

  const handleEditSelectedConcernTypes = () => {
    if (selectedConcernTypes.length === 0) {
      toast.error("No concern types selected to edit");
      return;
    }

    const selectedConcernTypeData = importedConcernTypes.filter(concernType => selectedConcernTypes.includes(concernType.id));
    setEditingConcernType({
      id: 'bulk-edit',
      name: selectedConcernTypeData.map(ct => ct.name).join(', '),
      municipality: selectedConcernTypeData[0]?.municipality || '',
      district: selectedConcernTypeData[0]?.district || '',
      isBulkEdit: true,
      selectedIds: selectedConcernTypes
    });
    setIsEditingConcernTypes(true);
  };

  // Handle save edited concern type
  const handleSaveEditedConcernType = async () => {
    if (!editingConcernType) return;

    try {
      let updatedConcernTypes;
      
      if (editingConcernType.isBulkEdit) {
        // Handle bulk edit
        const concernTypeNames = editingConcernType.name.split(',').map(name => name.trim()).filter(name => name);
        
        if (concernTypeNames.length !== editingConcernType.selectedIds.length) {
          toast.error(`Please provide exactly ${editingConcernType.selectedIds.length} concern type names (one for each selected concern type)`);
          return;
        }

        updatedConcernTypes = importedConcernTypes.map(concernType => {
          if (editingConcernType.selectedIds.includes(concernType.id)) {
            const nameIndex = editingConcernType.selectedIds.indexOf(concernType.id);
            return {
              ...concernType,
              name: concernTypeNames[nameIndex],
              municipality: editingConcernType.municipality,
              district: editingConcernType.district
            };
          }
          return concernType;
        });
      } else {
        // Handle single edit
        updatedConcernTypes = importedConcernTypes.map(concernType => 
          concernType.id === editingConcernType.id ? editingConcernType : concernType
        );
      }

      // Save to Firestore
      const saveResult = await saveConcernTypes(updatedConcernTypes);
      if (saveResult.success) {
        setImportedConcernTypes(updatedConcernTypes);
        setEditingConcernType(null);
        setIsEditingConcernTypes(false);
        setSelectedConcernTypes([]);
        toast.success(editingConcernType.isBulkEdit ? 
          `${editingConcernType.selectedIds.length} concern types updated successfully` : 
          "Concern type updated successfully"
        );
      } else {
        toast.error("Failed to update concern type in database: " + saveResult.error);
      }
    } catch (error) {
      toast.error("Error updating concern type: " + error.message);
    }
  };

  // Excel Import Functions
  const handleExcelFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];

    if (!validTypes.includes(file.type)) {
      toast.error("Please select a valid Excel file (.xlsx, .xls) or CSV file");
      return;
    }

    setExcelFile(file);
    
    // Check if user wants to import all months
    if (importAllMonths) {
      handleImportAllMonths(file);
    } else {
    parseExcelFile(file);
    }
  };

  const parseExcelFile = (file) => {
    setIsImportingExcel(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get all worksheet names
        const sheetNames = workbook.SheetNames;
        console.log('Available worksheets:', sheetNames);
        
        // Find the worksheet that matches the selected month
        let targetSheetName = null;
        let targetWorksheet = null;
        
        // First, try to find exact month match
        for (const sheetName of sheetNames) {
          const sheetNameLower = sheetName.toLowerCase();
          const selectedMonthLower = selectedMonth.toLowerCase();
          
          if (sheetNameLower.includes(selectedMonthLower)) {
            targetSheetName = sheetName;
            targetWorksheet = workbook.Sheets[sheetName];
            console.log(`Found matching worksheet: ${sheetName} for month: ${selectedMonth}`);
            break;
          }
        }
        
        // If no exact match, try to find by month number or abbreviation
        if (!targetSheetName) {
          const monthMappings = {
            'january': ['jan', '01', '1'],
            'february': ['feb', '02', '2'],
            'march': ['mar', '03', '3'],
            'april': ['apr', '04', '4'],
            'may': ['may', '05', '5'],
            'june': ['jun', '06', '6'],
            'july': ['jul', '07', '7'],
            'august': ['aug', '08', '8'],
            'september': ['sep', '09', '9'],
            'october': ['oct', '10'],
            'november': ['nov', '11'],
            'december': ['dec', '12']
          };
          
          const selectedMonthLower = selectedMonth.toLowerCase();
          const possibleMatches = monthMappings[selectedMonthLower] || [];
          
          for (const sheetName of sheetNames) {
            const sheetNameLower = sheetName.toLowerCase();
            for (const match of possibleMatches) {
              if (sheetNameLower.includes(match)) {
                targetSheetName = sheetName;
                targetWorksheet = workbook.Sheets[sheetName];
                console.log(`Found worksheet by abbreviation: ${sheetName} for month: ${selectedMonth}`);
                break;
              }
            }
            if (targetSheetName) break;
          }
        }
        
        // If still no match, use the first worksheet but show a warning
        if (!targetSheetName) {
          targetSheetName = sheetNames[0];
          targetWorksheet = workbook.Sheets[targetSheetName];
          console.log(`No matching worksheet found, using first worksheet: ${targetSheetName}`);
          toast.warning(`No worksheet found for "${selectedMonth}". Using first worksheet "${targetSheetName}". Please ensure your Excel file has a worksheet named with the month.`);
        }
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(targetWorksheet, { header: 1 });
        
        if (jsonData.length === 0) {
          toast.error("The Excel file appears to be empty");
          setIsImportingExcel(false);
          return;
        }

        // Validate Excel structure based on photo format
        const headers = jsonData[0];
        const expectedHeaders = ['DATE', 'BARANGAY', 'TYPE OF CONCERN', 'Week 1', 'Week 2', 'Week 3', 'Week 4', 'STATUS', 'REMARKS'];
        
        if (!headers || headers.length < 6) {
          toast.error("Invalid Excel format. Please ensure the file has the correct columns: DATE, BARANGAY, TYPE OF CONCERN, Week 1-4, STATUS, REMARKS");
          setIsImportingExcel(false);
          return;
        }

        // VERIFICATION 1: Check if current selected municipality exists in filename (more flexible matching)
        const fileName = file.name.toLowerCase();
        const currentMunicipality = activeMunicipalityTab?.toLowerCase();
        
        if (currentMunicipality) {
          // Try multiple variations of the municipality name
          const municipalityVariations = [
            currentMunicipality,
            currentMunicipality.replace(/\s+/g, ''), // Remove spaces
            currentMunicipality.replace(/\s+/g, '-'), // Replace spaces with hyphens
            currentMunicipality.replace(/\s+/g, '_'), // Replace spaces with underscores
            currentMunicipality.substring(0, 3), // First 3 characters
            currentMunicipality.substring(0, 4), // First 4 characters
          ];
          
          const foundMatch = municipalityVariations.some(variation => 
            fileName.includes(variation)
          );
          
          if (!foundMatch) {
            console.log('Filename:', fileName);
            console.log('Looking for municipality:', currentMunicipality);
            console.log('Tried variations:', municipalityVariations);
            
            // Ask user if they want to proceed anyway
            const proceed = window.confirm(
              `Municipality verification failed!\n\n` +
              `File: "${file.name}"\n` +
              `Selected Municipality: "${activeMunicipalityTab}"\n\n` +
              `The filename doesn't contain the municipality name. Do you want to proceed with the import anyway?\n\n` +
              `(The system will try to import data and match it to the selected municipality)`
            );
            
            if (!proceed) {
              setIsImportingExcel(false);
              return;
            } else {
              console.log('User chose to proceed despite municipality verification failure');
              toast.warning('Proceeding with import despite municipality verification failure. Please verify the data is correct.');
            }
          } else {
            console.log('Municipality verification passed for:', currentMunicipality);
          }
        }

        // VERIFICATION 2: Since we found the correct worksheet, month verification is already done
        // The worksheet selection above ensures we're reading from the correct month tab
        console.log(`Using worksheet "${targetSheetName}" for month "${selectedMonth}"`);
        
        // Optional: Double-check dates in the selected worksheet
        const dataRows = jsonData.slice(1).filter(row => row[0]); // Get data rows with dates
        if (dataRows.length > 0) {
          const firstDate = dataRows[0][0];
          if (firstDate) {
            try {
              const excelDate = new Date(firstDate);
              const excelMonth = excelDate.toLocaleDateString("en-US", { month: "long" });
              const selectedMonthName = selectedMonth;
              
              // Only warn if there's a mismatch, but don't block import since we selected the correct worksheet
              if (excelMonth.toLowerCase() !== selectedMonthName.toLowerCase()) {
                console.warn(`Date in worksheet doesn't match selected month: ${excelMonth} vs ${selectedMonthName}`);
                toast.warning(`Note: Dates in the worksheet are from "${excelMonth}" but you selected "${selectedMonthName}". Proceeding with import from the correct worksheet.`);
              }
            } catch (error) {
              console.warn('Could not parse date for verification:', firstDate);
            }
          }
        }

        // Check if required columns are present (flexible matching)
        const headerText = headers.join(' ').toLowerCase();
        const hasRequiredColumns = 
          headerText.includes('date') && 
          headerText.includes('barangay') && 
          headerText.includes('concern') && 
          (headerText.includes('week') || headerText.includes('1') || headerText.includes('2') || headerText.includes('3') || headerText.includes('4'));
        
        if (!hasRequiredColumns) {
          toast.error("Missing required columns. Please ensure the file contains: DATE, BARANGAY, TYPE OF CONCERN, and Week columns (1-4)");
          setIsImportingExcel(false);
          return;
        }

        // Process data rows (skip header) - based on photo structure
        const processedData = jsonData.slice(1).map((row, index) => {
          // Keep barangay field as-is (format: "Barangay, Municipality")
          const barangayField = row[1] || '';
          const barangayParts = barangayField.split(',').map(part => part.trim());
          const barangay = barangayParts[0] || '';
          const municipality = barangayParts[1] || '';
          
          console.log(`Processing row ${index}:`, {
            rawBarangay: row[1],
            barangayField,
            barangay,
            municipality,
            rawDate: row[0]
          });
          
          // Handle Excel date properly
          let processedDate = row[0] || '';
          if (typeof processedDate === 'number') {
            // Convert Excel serial date to proper date
            try {
              const excelEpoch = new Date(1900, 0, 1);
              const daysSinceEpoch = processedDate - 2;
              const dateObj = new Date(excelEpoch.getTime() + daysSinceEpoch * 24 * 60 * 60 * 1000);
              if (!isNaN(dateObj.getTime()) && dateObj.getFullYear() > 1900) {
                processedDate = dateObj.toLocaleDateString("en-US", { 
                  month: "long", 
                  day: "numeric", 
                  year: "numeric" 
                });
              }
            } catch (error) {
              console.warn('Error converting Excel date:', processedDate, error);
            }
          }
          
          return {
            id: `excel-${Date.now()}-${index}`,
            date: processedDate,
            municipality: municipality,
            barangay: barangayField, // Keep full "Barangay, Municipality" format
            concernType: row[2] || '',
            week1: row[3] || '',
            week2: row[4] || '',
            week3: row[5] || '',
            week4: row[6] || '',
            status: row[7] || '',
            remarks: row[8] || '',
            importedAt: new Date().toISOString()
          };
        }).filter(row => row.date || row.barangay || row.municipality); // Filter out completely empty rows

        // Auto-detect month and year from Excel data
        const detectedMonthYear = detectMonthYearFromData(processedData);
        if (detectedMonthYear.month && detectedMonthYear.year) {
          setSelectedMonth(detectedMonthYear.month);
          setSelectedYear(detectedMonthYear.year);
          toast.info(`Auto-detected: ${detectedMonthYear.month} ${detectedMonthYear.year}`);
        }

        // Group data by municipality
        const municipalityGroups = {};
        processedData.forEach(row => {
          const municipality = row.municipality || 'Unknown Municipality';
          if (!municipalityGroups[municipality]) {
            municipalityGroups[municipality] = [];
          }
          municipalityGroups[municipality].push(row);
        });

        // AUTO-IMPORT: Since verification passed, automatically import data to the table
        let municipalityData = null;
        
        if (currentMunicipality && municipalityGroups[currentMunicipality]) {
          municipalityData = municipalityGroups[currentMunicipality];
        } else if (currentMunicipality && Object.keys(municipalityGroups).length > 0) {
          // If exact municipality not found, try to find a close match or use the first available
          const availableMunicipalities = Object.keys(municipalityGroups);
          console.log('Available municipalities in Excel:', availableMunicipalities);
          console.log('Looking for:', currentMunicipality);
          
          // Try to find a close match
          const closeMatch = availableMunicipalities.find(mun => 
            mun.toLowerCase().includes(currentMunicipality) || 
            currentMunicipality.includes(mun.toLowerCase())
          );
          
          if (closeMatch) {
            console.log('Found close match:', closeMatch);
            municipalityData = municipalityGroups[closeMatch];
            toast.warning(`Using municipality "${closeMatch}" from Excel file (close match to "${currentMunicipality}")`);
          } else {
            // Use the first available municipality
            const firstMunicipality = availableMunicipalities[0];
            console.log('Using first available municipality:', firstMunicipality);
            municipalityData = municipalityGroups[firstMunicipality];
            toast.warning(`Using municipality "${firstMunicipality}" from Excel file (no match found for "${currentMunicipality}")`);
          }
        } else if (currentMunicipality) {
          // No municipality data found at all
          toast.error(`No data found for municipality "${currentMunicipality}" in the Excel file.`);
          setIsImportingExcel(false);
          return;
        } else {
          // No municipality selected
          toast.error('No municipality selected. Please select a municipality first.');
          setIsImportingExcel(false);
          return;
        }
        
        if (municipalityData) {
          
          // Debug: Show available barangays for this municipality
          const availableBarangays = importedBarangays.filter(b => b.municipality === currentMunicipality);
          console.log(`Available barangays for ${currentMunicipality}:`, availableBarangays.map(b => `${b.name}, ${b.municipality}`));
          
          // CLEAR EXISTING DATA: Clear current weekly report data before importing new data
          console.log('🧹 Clearing existing weekly report data before import...');
          
          // Check if there's existing data and ask for confirmation
          const hasExistingData = Object.keys(weeklyReportData).length > 0;
          if (hasExistingData) {
            const confirmClear = window.confirm(
              `⚠️ WARNING: This will clear all existing data for ${currentMunicipality} municipality.\n\n` +
              `Current data: ${Object.keys(weeklyReportData).length} dates with entries\n` +
              `New data: ${municipalityData.length} rows from Excel\n\n` +
              `Do you want to proceed and replace the existing data?`
            );
            
            if (!confirmClear) {
              console.log('❌ Import cancelled by user');
              toast.info('Import cancelled - existing data preserved');
              setIsImportingExcel(false);
              return;
            }
          }
          
          const updatedWeeklyData = {};
          const currentDates = generateDates(selectedMonth, selectedYear);
          
          municipalityData.forEach(row => {
            // Parse the date from Excel with better handling
            const excelDate = row.date;
            if (excelDate) {
              try {
                let parsedDate;
                
                // Handle different Excel date formats
                if (typeof excelDate === 'number') {
                  // Excel serial date number - convert from Excel's epoch (1900-01-01)
                  // Excel incorrectly treats 1900 as a leap year, so we need to adjust
                  const excelEpoch = new Date(1900, 0, 1); // January 1, 1900
                  const daysSinceEpoch = excelDate - 2; // Subtract 2 to account for Excel's leap year bug
                  parsedDate = new Date(excelEpoch.getTime() + daysSinceEpoch * 24 * 60 * 60 * 1000);
                } else if (typeof excelDate === 'string') {
                  // Try parsing as string date
                  parsedDate = new Date(excelDate);
                } else {
                  // Try direct conversion
                  parsedDate = new Date(excelDate);
                }
                
                // Validate the parsed date
                if (!isNaN(parsedDate.getTime()) && parsedDate.getFullYear() > 1900) {
                  const formattedDate = parsedDate.toLocaleDateString("en-US", { 
                    month: "long", 
                    day: "numeric", 
                    year: "numeric" 
                  });
                  
                  console.log(`Excel date: ${excelDate} -> Parsed: ${formattedDate}`);
                  console.log('Available dates to match:', currentDates.slice(0, 5)); // Show first 5 dates
                  
                  // Find matching date in current dates with better matching
                  const matchingDate = currentDates.find(date => {
                    // Exact match
                    if (date === formattedDate) {
                      console.log(`Exact match found: ${date} === ${formattedDate}`);
                      return true;
                    }
                    
                    // Check if the day numbers match
                    const excelDay = parsedDate.getDate();
                    const dateDay = parseInt(date.split(' ')[1].replace(',', ''));
                    if (excelDay === dateDay) {
                      console.log(`Day match found: ${excelDay} === ${dateDay} for date ${date}`);
                      return true;
                    }
                    
                    // Check if the month and day match
                    const excelMonth = parsedDate.toLocaleDateString("en-US", { month: "long" });
                    const dateMonth = date.split(' ')[0];
                    if (excelMonth === dateMonth && excelDay === dateDay) {
                      console.log(`Month and day match found: ${excelMonth} ${excelDay} === ${dateMonth} ${dateDay} for date ${date}`);
                      return true;
                    }
                    
                    return false;
                  });
                  
                  if (matchingDate) {
                    const dateKey = matchingDate;
                    if (!updatedWeeklyData[dateKey]) {
                      updatedWeeklyData[dateKey] = [];
                    }
                    
                    // Find the correct barangay name from the imported barangays list
                    let correctBarangayName = row.barangay || 'Unknown Barangay';
                    
                    // Helper function for case-insensitive barangay matching
                    const findMatchingBarangay = (excelBarangayName, excelMunicipality, barangayList) => {
                      if (!excelBarangayName || !excelMunicipality || !barangayList.length) {
                        return null;
                      }

                      return barangayList.find(barangay => {
                        // Extract just the barangay name without municipality and (Poblacion)
                        const barangayName = barangay.name.split(' (')[0].trim();
                        const municipality = barangay.municipality;
                        
                        // Case-insensitive comparison
                        const nameMatch = barangayName.toLowerCase() === excelBarangayName.toLowerCase();
                        const municipalityMatch = municipality.toLowerCase() === excelMunicipality.toLowerCase();
                        
                        return nameMatch && municipalityMatch;
                      });
                    };
                    
                    // Try to match with imported barangays to get the correct format
                    if (importedBarangays.length > 0) {
                      // Extract just the barangay name without municipality
                      const excelBarangayName = row.barangay?.split(',')[0]?.trim();
                      const excelMunicipality = row.barangay?.split(',')[1]?.trim();
                      
                      const barangayMatch = findMatchingBarangay(excelBarangayName, excelMunicipality, importedBarangays);
                      
                      if (barangayMatch) {
                        correctBarangayName = barangayMatch.name; // Use the full name with (Poblacion) if it exists
                        console.log(`Matched barangay: ${row.barangay} -> ${correctBarangayName}`);
                      } else {
                        console.warn(`No match found for barangay: ${row.barangay}`);
                      }
                    }
                    
                    // Create entry for this barangay and concern type
                    // Format barangay name to match what the dropdown expects: "Barangay Name, Municipality"
                    const excelMunicipality = row.barangay?.split(',')[1]?.trim();
                    const barangayValue = `${correctBarangayName}, ${excelMunicipality}`;
                    
                    const newEntry = {
                      id: `excel-${Date.now()}-${Math.random()}`,
                      barangay: barangayValue, // Use the format expected by the dropdown
                      concernType: row.concernType || 'Unknown Concern',
                      week1: parseInt(row.week1) || 0,
                      week2: parseInt(row.week2) || 0,
                      week3: parseInt(row.week3) || 0,
                      week4: parseInt(row.week4) || 0,
                      actionTaken: row.status || '',
                      remarks: row.remarks || '',
                      importedFromExcel: true
                    };
                    
                    // Add the entry to the array for this date
                    updatedWeeklyData[dateKey].push(newEntry);
                    console.log(`Added entry for ${dateKey}:`, {
                      barangay: newEntry.barangay,
                      concernType: newEntry.concernType,
                      week1: newEntry.week1,
                      week2: newEntry.week2,
                      week3: newEntry.week3,
                      week4: newEntry.week4
                    });
                    console.log(`Barangay value format: "${barangayValue}" (should match dropdown format)`);
                  } else {
                    console.warn(`No matching date found for: ${formattedDate} in current dates:`, currentDates);
                  }
                } else {
                  console.warn('Invalid date parsed:', excelDate, '->', parsedDate);
                }
              } catch (error) {
                console.warn('Error parsing date:', excelDate, error);
              }
            }
          });
          
          // Update the weekly report data
          setWeeklyReportData(updatedWeeklyData);
          
          // Clear Excel data after successful import
          setExcelFile(null);
          
          toast.success(`✅ Successfully imported ${municipalityData.length} rows for ${currentMunicipality} municipality from worksheet "${targetSheetName}"!`);
          
          // Add to terminal history
          const newEntry = {
            id: Date.now(),
            command: "excel.auto.import",
            output: `Auto-imported ${municipalityData.length} rows from Excel file for ${currentMunicipality} municipality`,
            type: "success",
            timestamp: new Date()
          };
          setTerminalHistory(prev => [...prev, newEntry]);
          
        } else {
          // If municipality not found, show error and don't show preview
          toast.error(`Municipality "${currentMunicipality}" not found in Excel file. Please ensure the Excel file contains data for the selected municipality.`);
          setIsImportingExcel(false);
          return;
        }
        
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        toast.error("Error parsing Excel file. Please ensure the file is not corrupted and has the correct format.");
      } finally {
        setIsImportingExcel(false);
      }
    };

    reader.onerror = () => {
      toast.error("Error reading the file");
      setIsImportingExcel(false);
    };

    reader.readAsArrayBuffer(file);
  };

  // Function to import all months from Excel
  const handleImportAllMonths = async (file) => {
    setIsImportingAllMonths(true);
    
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          console.log('📊 Excel file loaded for all months. Worksheets:', workbook.SheetNames);
          
          // CLEAR EXISTING DATA: Clear current all months data and weekly report data before importing new data
          console.log('🧹 Clearing existing data before import all months...');
          
          // Check if there's existing data and ask for confirmation
          const hasExistingAllMonthsData = Object.keys(allMonthsData).length > 0;
          const hasExistingWeeklyData = Object.keys(weeklyReportData).length > 0;
          
          if (hasExistingAllMonthsData || hasExistingWeeklyData) {
            const confirmClear = window.confirm(
              `⚠️ WARNING: This will clear ALL existing data.\n\n` +
              `Current all months data: ${Object.keys(allMonthsData).length} months\n` +
              `Current weekly report data: ${Object.keys(weeklyReportData).length} dates\n\n` +
              `This action will replace ALL data with the new Excel import.\n\n` +
              `Do you want to proceed and replace all existing data?`
            );
            
            if (!confirmClear) {
              console.log('❌ Import all months cancelled by user');
              toast.info('Import cancelled - existing data preserved');
              setIsImportingAllMonths(false);
              return;
            }
          }
          
          setAllMonthsData({});
          setWeeklyReportData({});
          
          const newAllMonthsData = {};
          const monthNames = [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
          ];
          const monthAbbreviations = [
            'jan', 'feb', 'mar', 'apr', 'may', 'jun',
            'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
          ];
          const monthNumbers = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
          
          // Process each worksheet
          workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (jsonData.length === 0) return;
            
            // Try to determine which month this sheet represents
            let detectedMonth = null;
            const sheetLower = sheetName.toLowerCase();
            
            // Check for exact month name match
            for (let i = 0; i < monthNames.length; i++) {
              if (sheetLower.includes(monthNames[i])) {
                detectedMonth = monthNames[i];
                break;
              }
            }
            
            // Check for abbreviation match
            if (!detectedMonth) {
              for (let i = 0; i < monthAbbreviations.length; i++) {
                if (sheetLower.includes(monthAbbreviations[i])) {
                  detectedMonth = monthNames[i];
                  break;
                }
              }
            }
            
            // Check for number match
            if (!detectedMonth) {
              for (let i = 0; i < monthNumbers.length; i++) {
                if (sheetLower.includes(monthNumbers[i])) {
                  detectedMonth = monthNames[i];
                  break;
                }
              }
            }
            
            // If no month detected, try to get it from the data
            if (!detectedMonth && jsonData.length > 1) {
              const firstRow = jsonData[1];
              const dateIndex = firstRow.findIndex(cell => 
                cell && cell.toString().toLowerCase().includes('date')
              );
              if (dateIndex !== -1 && firstRow[dateIndex]) {
                try {
                  const dateValue = firstRow[dateIndex];
                  let date;
                  if (typeof dateValue === 'number') {
                    date = new Date((dateValue - 25569) * 86400 * 1000);
                  } else {
                    date = new Date(dateValue);
                  }
                  if (!isNaN(date.getTime())) {
                    detectedMonth = monthNames[date.getMonth()];
                  }
                } catch (error) {
                  console.warn(`Could not detect month from date in sheet: ${sheetName}`);
                }
              }
            }
            
            if (!detectedMonth) {
              console.warn(`⚠️ Could not detect month for sheet: ${sheetName}. Skipping.`);
              return;
            }
            
            console.log(`📅 Processing sheet "${sheetName}" as month: ${detectedMonth}`);
            
            // Process the data for this month
            const processedData = processSheetDataForAllMonths(jsonData, detectedMonth);
            if (processedData.length > 0) {
              newAllMonthsData[detectedMonth] = processedData;
              console.log(`✅ Added ${processedData.length} entries for ${detectedMonth}`);
            } else {
              console.log(`⚠️ No data processed for ${detectedMonth} (sheet: ${sheetName})`);
            }
          });
          
          console.log(`✅ Processed data for months:`, Object.keys(newAllMonthsData));
          
          // Data stored in memory only (no local storage)
          setAllMonthsData(newAllMonthsData);
          
          // Debug: Show what's being stored in memory
          console.log(`💾 Stored data in memory:`, Object.keys(newAllMonthsData));
          Object.keys(newAllMonthsData).forEach(month => {
            console.log(`📊 ${month}: ${newAllMonthsData[month].length} entries`);
            if (newAllMonthsData[month].length > 0) {
              console.log(`📋 Sample entry for ${month}:`, newAllMonthsData[month][0]);
            }
          });
          
          // AUTO-POPULATE: If current month data exists, populate it in the table
          const currentMonthKey = selectedMonth?.toLowerCase();
          if (currentMonthKey && newAllMonthsData[currentMonthKey]) {
            console.log(`🔄 Auto-populating current month (${currentMonthKey}) data in table...`);
            
            // Convert the stored data to the format expected by weeklyReportData
            const convertedData = {};
            newAllMonthsData[currentMonthKey].forEach(entry => {
              const dateKey = entry.date;
              if (!convertedData[dateKey]) {
                convertedData[dateKey] = [];
              }
              
              // Fix barangay name case sensitivity for dropdown matching
              let fixedEntry = { ...entry };
              if (entry.barangay && importedBarangays.length > 0) {
                // Extract barangay name and municipality from the entry
                const barangayParts = entry.barangay.split(',').map(part => part.trim());
                const excelBarangayName = barangayParts[0] || '';
                const excelMunicipality = barangayParts[1] || '';
                
                // Helper function for tolerant barangay matching (ignores spaces/punct, allows substring)
                const findMatchingBarangay = (excelBarangayName, excelMunicipality, barangayList) => {
                  if (!excelBarangayName || !excelMunicipality || !barangayList.length) {
                    return null;
                  }

                  const normalize = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                  const excelNameNorm = normalize(excelBarangayName);
                  const excelMuniNorm = normalize(excelMunicipality);

                  return barangayList.find(barangay => {
                    const barangayName = barangay.name.split(' (')[0].trim();
                    const municipality = barangay.municipality;
                    const nameNorm = normalize(barangayName);
                    const muniNorm = normalize(municipality);

                    const nameMatch = nameNorm === excelNameNorm || nameNorm.includes(excelNameNorm) || excelNameNorm.includes(nameNorm);
                    const municipalityMatch = muniNorm === excelMuniNorm;

                    return nameMatch && municipalityMatch;
                  });
                };
                
                // Try to find a matching barangay with correct case
                const matchingBarangay = findMatchingBarangay(excelBarangayName, excelMunicipality, importedBarangays);
                if (matchingBarangay) {
                  // Use the correctly cased barangay name from the imported list
                  fixedEntry.barangay = `${matchingBarangay.name}, ${excelMunicipality}`;
                  console.log(`🔧 Fixed barangay case: "${entry.barangay}" -> "${fixedEntry.barangay}"`);
                }
              }
              
              convertedData[dateKey].push(fixedEntry);
            });
            
            setWeeklyReportData(convertedData);
            console.log(`✅ Auto-populated ${Object.keys(convertedData).length} dates for current month (${currentMonthKey})`);
          }
          
          toast.success(`Successfully imported data for ${Object.keys(newAllMonthsData).length} months! ${currentMonthKey && newAllMonthsData[currentMonthKey] ? `Current month (${currentMonthKey}) data is now visible in the table.` : ''}`);
          
        } catch (error) {
          console.error('❌ Error parsing all months from Excel:', error);
          toast.error("Error parsing Excel file for all months");
        } finally {
          setIsImportingAllMonths(false);
        }
      };
      
      reader.onerror = () => {
        toast.error("Error reading the file");
        setIsImportingAllMonths(false);
      };
      
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error importing all months:', error);
      toast.error("Error importing all months from Excel");
      setIsImportingAllMonths(false);
    }
  };

  // Helper function to process sheet data for all months (using same logic as parseExcelFile)
  const processSheetDataForAllMonths = (jsonData, monthName) => {
    const headers = jsonData[0];
    if (!headers) {
      console.log(`❌ No headers found in sheet for ${monthName}`);
      return [];
    }
    
    console.log(`📋 Headers for ${monthName}:`, headers);
    console.log(`📊 Total rows in ${monthName}:`, jsonData.length);
    
    // Use the same logic as parseExcelFile - expect specific column structure
    const expectedHeaders = ['DATE', 'BARANGAY', 'TYPE OF CONCERN', 'Week 1', 'Week 2', 'Week 3', 'Week 4', 'STATUS', 'REMARKS'];
    
    if (!headers || headers.length < 6) {
      console.log(`❌ Invalid Excel format for ${monthName}. Expected columns:`, expectedHeaders);
      return [];
    }
    
    // Use the same column indices as parseExcelFile
    const dateIndex = 0;
    const barangayIndex = 1;
    const concernTypeIndex = 2;
    const week1Index = 3;
    const week2Index = 4;
    const week3Index = 5;
    const week4Index = 6;
    const statusIndex = 7;
    const remarksIndex = 8;
    
    console.log(`🔍 Using standard column indices for ${monthName}:`, {
      date: dateIndex,
      barangay: barangayIndex,
      concernType: concernTypeIndex,
      week1: week1Index,
      week2: week2Index,
      week3: week3Index,
      week4: week4Index,
      status: statusIndex,
      remarks: remarksIndex
    });
    
    const processedData = [];
    const currentMunicipality = activeMunicipalityTab;
    
    console.log(`🔍 Processing ${jsonData.length - 1} data rows for ${monthName}`);
    console.log(`📋 Available imported barangays:`, importedBarangays.map(b => `${b.name}, ${b.municipality}`));
    
    // Show first few rows of actual data to understand the structure
    console.log(`📊 First 3 data rows for ${monthName}:`, jsonData.slice(1, 4));
    
    // Process data rows (skip header) - same logic as parseExcelFile
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;
      
      // Keep barangay field as-is (format: "Barangay, Municipality")
      const barangayField = row[barangayIndex] || '';
      const barangayParts = barangayField.split(',').map(part => part.trim());
      const barangay = barangayParts[0] || '';
      const municipality = barangayParts[1] || '';
      
      console.log(`🔍 Row ${i} for ${monthName}:`, {
        rawBarangay: row[barangayIndex],
        barangayField,
        barangay,
        municipality,
        rawDate: row[dateIndex]
      });
      
      // Normalize date to exact key using UTC to avoid timezone jumps
      const processedDate = parseExcelDateToKey(row[dateIndex]) || '';
      if (!processedDate) {
        // Skip rows without a valid date to avoid creating empty keys
        continue;
      }
      
      // Find the correct barangay name from the imported barangays list (same as parseExcelFile)
      let correctBarangayName = barangayField || 'Unknown Barangay';
      
      // Helper function for tolerant barangay matching (ignores spaces/punct, allows substring)
      const findMatchingBarangay = (excelBarangayName, excelMunicipality, barangayList) => {
        if (!excelBarangayName || !excelMunicipality || !barangayList.length) {
          return null;
        }

        const normalize = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const excelNameNorm = normalize(excelBarangayName);
        const excelMuniNorm = normalize(excelMunicipality);

        return barangayList.find(barangay => {
          const barangayName = barangay.name.split(' (')[0].trim();
          const municipality = barangay.municipality;
          const nameNorm = normalize(barangayName);
          const muniNorm = normalize(municipality);

          const nameMatch = nameNorm === excelNameNorm || nameNorm.includes(excelNameNorm) || excelNameNorm.includes(nameNorm);
          const municipalityMatch = muniNorm === excelMuniNorm;

          return nameMatch && municipalityMatch;
        });
      };
      
      // Try to match with imported barangays to get the correct format
      let barangayMatch = null;
      if (importedBarangays.length > 0) {
        barangayMatch = findMatchingBarangay(barangay, municipality, importedBarangays);
      }
      
      if (barangayMatch) {
        correctBarangayName = barangayMatch.name; // Use the full name with (Poblacion) if it exists
        console.log(`Matched barangay: ${barangayField} -> ${correctBarangayName}`);
      } else {
        console.warn(`No match found for barangay: ${barangayField}`);
      }
      
      // Create entry for each week that has data (same logic as parseExcelFile)
      const weeks = [
        { index: week1Index, week: 'week1' },
        { index: week2Index, week: 'week2' },
        { index: week3Index, week: 'week3' },
        { index: week4Index, week: 'week4' }
      ];
      
      weeks.forEach(({ index, week }) => {
        if (index !== -1 && row[index] !== undefined && row[index] !== null && row[index] !== '') {
          const weekValue = parseInt(row[index]) || 0;
          if (weekValue > 0) {
            const newEntry = {
              id: `excel-${monthName}-${Date.now()}-${Math.random()}`,
              date: processedDate,
              municipality: municipality,
              barangay: `${correctBarangayName}, ${municipality}`, // Use corrected barangay name
              concernType: row[concernTypeIndex] || '',
              week1: week === 'week1' ? weekValue : 0,
              week2: week === 'week2' ? weekValue : 0,
              week3: week === 'week3' ? weekValue : 0,
              week4: week === 'week4' ? weekValue : 0,
              actionTaken: row[statusIndex] || '',
              remarks: row[remarksIndex] || '',
              importedFromExcel: true
            };
            
            processedData.push(newEntry);
          }
        }
      });
    }
    
    console.log(`📊 Final processed data for ${monthName}:`, processedData.length, 'entries');
    if (processedData.length > 0) {
      console.log(`✅ Sample entry for ${monthName}:`, processedData[0]);
    }
    return processedData;
  };

  const handleImportExcelData = async () => {
    if (excelData.length === 0) {
      toast.error("No data to import");
      return;
    }

    if (!selectedExcelMunicipality) {
      toast.error("Please select a municipality to import data for");
      return;
    }

    setIsImportingExcel(true);
    try {
      // Get data for selected municipality
      const municipalityData = excelMunicipalityData[selectedExcelMunicipality] || [];
      
      if (municipalityData.length === 0) {
        toast.error(`No data found for municipality: ${selectedExcelMunicipality}`);
        return;
      }

      // Set the municipality in the report form
      setSelectedReportMunicipality(selectedExcelMunicipality);
      
      // Import data into weeklyReportData structure
      const updatedWeeklyData = { ...weeklyReportData };
      
      municipalityData.forEach(row => {
        // Parse the date from Excel (format: "March 1, 2025")
        const excelDate = row.date;
        if (excelDate) {
          try {
            // Convert Excel date to our format
            const parsedDate = new Date(excelDate);
            if (!isNaN(parsedDate.getTime())) {
              // Format as "Month Day, Year" to match our date format
              const formattedDate = parsedDate.toLocaleDateString("en-US", { 
                month: "long", 
                day: "numeric", 
                year: "numeric" 
              });
              
              // Normalize to exact key and match strictly
              const normalizedKey = parseExcelDateToKey(excelDate);
              const matchingDate = normalizedKey && currentDates.includes(normalizedKey) ? normalizedKey : null;
              
              if (matchingDate) {
                // Create new entry for this date
                const newEntry = {
                  id: `imported-${Date.now()}-${Math.random()}`,
                  barangay: row.barangay || "", // This will be "Barangay, Municipality" format
                  concernType: row.concernType || "",
                  week1: row.week1 ? String(row.week1) : "",
                  week2: row.week2 ? String(row.week2) : "",
                  week3: row.week3 ? String(row.week3) : "",
                  week4: row.week4 ? String(row.week4) : "",
                  actionTaken: row.status || "", // Map status to actionTaken
                  remarks: row.remarks || ""
                };
                
                // Add to existing entries for this date
                if (!updatedWeeklyData[matchingDate]) {
                  updatedWeeklyData[matchingDate] = [];
                }
                updatedWeeklyData[matchingDate].push(newEntry);
              }
            }
          } catch (error) {
            console.warn('Error parsing date:', excelDate, error);
            // Fallback: try to find by partial match
            const matchingDate = currentDates.find(date => 
              date.includes(excelDate) || excelDate.includes(date.split(' ')[1].replace(',', ''))
            );
            
            if (matchingDate) {
              // Create new entry for this date
              const newEntry = {
                id: `imported-${Date.now()}-${Math.random()}`,
                barangay: row.barangay || "", // This will be "Barangay, Municipality" format
                concernType: row.concernType || "",
                week1: row.week1 ? String(row.week1) : "",
                week2: row.week2 ? String(row.week2) : "",
                week3: row.week3 ? String(row.week3) : "",
                week4: row.week4 ? String(row.week4) : "",
                actionTaken: row.status || "",
                remarks: row.remarks || ""
              };
              
              // Add to existing entries for this date
              if (!updatedWeeklyData[matchingDate]) {
                updatedWeeklyData[matchingDate] = [];
              }
              updatedWeeklyData[matchingDate].push(newEntry);
            }
          }
        }
      });
      
      setWeeklyReportData(updatedWeeklyData);
      
      // Populate form fields with the first row's data from selected municipality (for backward compatibility)
      const firstRow = municipalityData[0];
      setSelectedBarangay(firstRow.barangay);
      setSelectedConcernType(firstRow.concernType);
      setActionTaken(firstRow.actionTaken);
      setRemarks(firstRow.remarks);
      
      toast.success(`Imported ${municipalityData.length} rows for ${selectedExcelMunicipality} municipality`);
      
      // Add to terminal history
      const newEntry = {
        id: Date.now(),
        command: "excel.import",
        output: `Imported ${municipalityData.length} rows from Excel file for ${selectedExcelMunicipality} municipality`,
        type: "success",
        timestamp: new Date()
      };
      setTerminalHistory(prev => [...prev, newEntry]);
      
      // Clear Excel data after import
      setExcelData([]);
      setExcelPreview([]);
      setShowExcelPreview(false);
      setExcelFile(null);
      setExcelMunicipalityData({});
      setSelectedExcelMunicipality("");
      
    } catch (error) {
      console.error('Error importing Excel data:', error);
      toast.error("Error importing Excel data");
    } finally {
      setIsImportingExcel(false);
    }
  };


  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "standby": return "bg-yellow-500";
      case "inactive": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getAlertTypeColor = (type) => {
    switch (type) {
      case "high": return "bg-red-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  const getAlertTypeIcon = (type) => {
    switch (type) {
      case "high": return <AlertTriangle className="h-4 w-4" />;
      case "medium": return <Clock className="h-4 w-4" />;
      case "low": return <CheckCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getCommTypeIcon = (type) => {
    switch (type) {
      case "radio": return <Radio className="h-4 w-4" />;
      case "broadcast": return <MessageSquare className="h-4 w-4" />;
      case "emergency": return <AlertTriangle className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  // Load weekly reports from collection
  const loadWeeklyReportsCollection = async (filters = {}) => {
    setIsLoadingCollection(true);
    try {
      const result = await getWeeklyReportsFromCollection(filters);
      if (result.success) {
        setWeeklyReportsCollection(result.data);
        console.log('✅ Loaded weekly reports from collection:', result.data.length);
      } else {
        console.error('❌ Error loading weekly reports collection:', result.error);
        toast.error('Failed to load weekly reports collection');
      }
    } catch (error) {
      console.error('❌ Error loading weekly reports collection:', error);
      toast.error('Error loading weekly reports collection');
    } finally {
      setIsLoadingCollection(false);
    }
  };

  // Delete weekly report from collection
  const handleDeleteWeeklyReport = async (docId) => {
    if (window.confirm('Are you sure you want to delete this weekly report? This action cannot be undone.')) {
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
            // Only save to nested structure
            const muniSaveResult = await saveWeeklyReportByMunicipality(reportData);
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Command Center</h1>
            <p className="text-gray-500 mt-2">Real-time monitoring and control system with comprehensive analytics</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Municipality Badge - for non-admin users */}
            {(activeMunicipalityTab || userMunicipality) && (
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-green-200 bg-green-50 text-green-800 shadow-sm flex-shrink-0">
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
            <div className="relative">
              <button
                id="commandcenter-menu-button"
                onClick={() => setShowMenuDropdown(!showMenuDropdown)}
                className="bg-black hover:bg-gray-800 text-white px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
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
      <div className="space-y-4">



        {/* Weekly Report Section */}
        {activeTab === "weekly-report" && (
          <div className="space-y-6">
            {/* Weekly Report Header */}
            <div className="bg-white shadow-sm border border-gray-200 rounded-xl">
              <div className={`${isCommandUser ? 'p-4' : 'p-6'} pb-0`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FileText className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Weekly Report - {selectedMonth} {selectedYear}</h3>
                      {activeMunicipalityTab && (
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-600">{activeMunicipalityTab}</span>
                          </div>
                          <div className="text-sm text-gray-600">
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
                  <div className="flex flex-col gap-4">
                    {/* Import Options - Admin Only */}
                    {isAdmin && (
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm text-gray-700">
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
                    <div className="flex gap-3 overflow-x-auto">
                      
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
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            ACTION TAKEN
                          </div>
                        </th>
                        <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 table-cell-spacing">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-gray-500" />
                            REMARKS
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
                                <td className="px-3 py-2 table-cell-spacing">
                                  <input 
                                    id={`action-taken-${date}`}
                                    name={`action-taken-${date}`}
                                    type="text" 
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-all duration-200"
                                    placeholder="Action taken..."
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
                                  <td className="px-3 py-2">
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
                                  <td className="px-3 py-2">
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
                                  <td className="px-3 py-2 table-cell-spacing">
                                    <input 
                                      id={`existing-action-taken-${date}-${entryIndex}`}
                                      name={`existing-action-taken-${date}-${entryIndex}`}
                                      type="text" 
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-all duration-200"
                                      placeholder="Action taken..."
                                      value={entry.actionTaken}
                                      onChange={(e) => updateDateData(date, entryIndex, 'actionTaken', e.target.value)}
                                    />
                                  </td>
                                  <td className="px-3 py-2 table-cell-spacing">
                                    <div className="flex items-center justify-center gap-2 h-full">
                                      {entry.photos && (entry.photos.before || entry.photos.after) ? (
                                        <>
                                          {/* View button when photos exist */}
                                          <button
                                            onClick={() => handleViewPhotos(date, entryIndex)}
                                            className="flex items-center gap-2 px-4 py-1.5 text-green-600 hover:text-white hover:bg-green-600 rounded-md transition-colors duration-200 border border-green-300 hover:border-green-600"
                                            title="View Photos & Remarks"
                                          >
                                            <Eye className="w-4 h-4" />
                                            <span className="text-sm font-medium">View</span>
                                          </button>
                                          {/* Edit button - only show if before OR after photo is missing */}
                                          {(!entry.photos.before || !entry.photos.after) && (
                                            <button
                                              onClick={() => handleOpenPhotoUpload(date, entryIndex)}
                                              className="flex items-center gap-2 px-4 py-1.5 text-blue-600 hover:text-white hover:bg-blue-600 rounded-md transition-colors duration-200 border border-blue-300 hover:border-blue-600"
                                              title="Edit Photos & Remarks"
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
                                        <div className="relative group">
                                          <div className="px-2.5 py-1 bg-yellow-100 border-l-4 border-yellow-400 rounded-r-md shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-1">
                                            <span className="text-yellow-600 text-sm">📝</span>
                                            <span className="text-xs font-medium text-yellow-800">Note</span>
                                          </div>
                                          {/* Tooltip on hover - positioned above and aligned to right, extends to the left */}
                                          <div className="absolute right-0 bottom-full mb-2 min-w-[200px] max-w-[280px] p-3 bg-white border-2 border-yellow-400 rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[9999] pointer-events-none">
                                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-yellow-200">
                                              <span className="text-base">📝</span>
                                              <span className="text-xs font-bold text-yellow-900">Remarks</span>
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
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Upload Before & After Photos</DialogTitle>
            <DialogDescription className="text-gray-600">
              Document the before and after state of your action with photos.
            </DialogDescription>
          </DialogHeader>
          
          {/* Instructions Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">📋</span>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-blue-900 mb-2">Quick Instructions</h4>
                <ul className="space-y-1.5 text-xs text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold mt-0.5">•</span>
                    <span><strong className="text-blue-900">Before Photo:</strong> Capture the situation/area BEFORE taking action</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold mt-0.5">•</span>
                    <span><strong className="text-green-900">After Photo:</strong> Capture the same area AFTER action completed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 font-bold mt-0.5">•</span>
                    <span>Photos auto-compress to under 2MB • Both optional but recommended</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Photo Upload Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Before Photos Card */}
            <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50/30 hover:bg-blue-50/50 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
                  <h3 className="font-semibold text-gray-900">Before Photos</h3>
                </div>
                <span className="text-xs text-gray-500">{Array.isArray(beforePhotoPreviews) ? beforePhotoPreviews.length : 0} photo(s)</span>
              </div>
              
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleBeforePhotoChange}
                className="hidden"
                id="before-photo-input"
              />
              
              {Array.isArray(beforePhotoPreviews) && beforePhotoPreviews.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                    {beforePhotoPreviews.map((preview, index) => (
                      <div key={index} className="relative aspect-video border-2 border-blue-300 rounded-lg overflow-hidden group bg-white">
                        <img
                          src={preview}
                          alt={`Before ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            onClick={() => {
                              setBeforePhotoPreviews(prev => prev.filter((_, i) => i !== index));
                              setBeforePhotos(prev => prev.filter((_, i) => i !== index));
                            }}
                            className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-1 text-xs"
                          >
                            <X className="w-3 h-3" />
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <label
                    htmlFor="before-photo-input"
                    className="block w-full py-2 border-2 border-dashed border-blue-300 rounded-lg text-center cursor-pointer hover:border-blue-500 hover:bg-blue-100/50 transition-all bg-white"
                  >
                    <Plus className="w-4 h-4 inline mr-1" />
                    <span className="text-sm font-medium text-blue-600">Add More</span>
                  </label>
                </div>
              ) : (
                <label
                  htmlFor="before-photo-input"
                  className="w-full aspect-video border-2 border-dashed border-blue-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-100/50 transition-all bg-white"
                >
                  <Image className="w-12 h-12 text-blue-400 mb-2" />
                  <span className="text-sm font-medium text-blue-600">Click to choose photos</span>
                  <span className="text-xs text-gray-500 mt-1">Multiple selection supported</span>
                </label>
              )}
            </div>

            {/* After Photos Card */}
            <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50/30 hover:bg-green-50/50 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
                  <h3 className="font-semibold text-gray-900">After Photos</h3>
                </div>
                <span className="text-xs text-gray-500">{Array.isArray(afterPhotoPreviews) ? afterPhotoPreviews.length : 0} photo(s)</span>
              </div>
              
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleAfterPhotoChange}
                className="hidden"
                id="after-photo-input"
              />
              
              {Array.isArray(afterPhotoPreviews) && afterPhotoPreviews.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                    {afterPhotoPreviews.map((preview, index) => (
                      <div key={index} className="relative aspect-video border-2 border-green-300 rounded-lg overflow-hidden group bg-white">
                        <img
                          src={preview}
                          alt={`After ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            onClick={() => {
                              setAfterPhotoPreviews(prev => prev.filter((_, i) => i !== index));
                              setAfterPhotos(prev => prev.filter((_, i) => i !== index));
                            }}
                            className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-1 text-xs"
                          >
                            <X className="w-3 h-3" />
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <label
                    htmlFor="after-photo-input"
                    className="block w-full py-2 border-2 border-dashed border-green-300 rounded-lg text-center cursor-pointer hover:border-green-500 hover:bg-green-100/50 transition-all bg-white"
                  >
                    <Plus className="w-4 h-4 inline mr-1" />
                    <span className="text-sm font-medium text-green-600">Add More</span>
                  </label>
                </div>
              ) : (
                <label
                  htmlFor="after-photo-input"
                  className="w-full aspect-video border-2 border-dashed border-green-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-100/50 transition-all bg-white"
                >
                  <Image className="w-12 h-12 text-green-400 mb-2" />
                  <span className="text-sm font-medium text-green-600">Click to choose photos</span>
                  <span className="text-xs text-gray-500 mt-1">Multiple selection supported</span>
                </label>
              )}
            </div>
          </div>

          {/* Remarks Section */}
          <div className="mt-4 border-t pt-4">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              <MessageSquare className="w-4 h-4 inline mr-1" />
              Remarks (Optional)
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
              placeholder="Add any additional notes or remarks about this action..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">You can add remarks here while uploading photos</p>
          </div>

          <DialogFooter className="mt-6">
            <button
              onClick={() => setShowPhotoUploadDialog(false)}
              className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={isUploadingPhotos}
            >
              Cancel
            </button>
            <button
              onClick={handleUploadPhotos}
              disabled={isUploadingPhotos || (beforePhotos.length === 0 && afterPhotos.length === 0 && beforePhotoPreviews.length === 0 && afterPhotoPreviews.length === 0)}
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 max-h-[600px] overflow-y-auto">
            {/* Before Photos */}
            {viewingPhotos?.before && Array.isArray(viewingPhotos.before) && viewingPhotos.before.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Before Photos ({viewingPhotos.before.length})</label>
                </div>
                <div className="space-y-3">
                  {viewingPhotos.before.map((photo, index) => (
                    <div key={index} className="space-y-1">
                      <div className="border rounded-md overflow-hidden h-[400px]">
                        <img
                          src={photo}
                          alt={`Before ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {viewingPhotos.beforeUploadedAt?.[index] && (
                        <span className="text-xs text-gray-500 block">
                          {new Date(viewingPhotos.beforeUploadedAt[index]).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                {/* Concern Type below Before Photos */}
                {viewingPhotos.concernType && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-3">
                    <p className="text-xs font-semibold text-blue-700 mb-1">Concern Type</p>
                    <p className="text-sm text-gray-800">{viewingPhotos.concernType}</p>
                  </div>
                )}
              </div>
            )}

            {/* After Photos */}
            {viewingPhotos?.after && Array.isArray(viewingPhotos.after) && viewingPhotos.after.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">After Photos ({viewingPhotos.after.length})</label>
                </div>
                <div className="space-y-3">
                  {viewingPhotos.after.map((photo, index) => (
                    <div key={index} className="space-y-1">
                      <div className="border rounded-md overflow-hidden h-[400px]">
                        <img
                          src={photo}
                          alt={`After ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {viewingPhotos.afterUploadedAt?.[index] && (
                        <span className="text-xs text-gray-500 block">
                          {new Date(viewingPhotos.afterUploadedAt[index]).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                {/* Remarks below After Photos */}
                {viewingPhotos.remarks && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3 mt-3">
                    <p className="text-xs font-semibold text-green-700 mb-1">Remarks</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{viewingPhotos.remarks}</p>
                  </div>
                )}
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
    </Layout>
  );
}
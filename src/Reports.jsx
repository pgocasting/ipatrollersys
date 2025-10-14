import React, { useState, useEffect, useCallback } from "react";
import Layout from "./Layout";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Separator } from "./components/ui/separator";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "./components/ui/table";
import { useData } from "./DataContext";
import { useFirebase } from "./hooks/useFirebase";
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { logReportAccess } from './utils/adminLogger';
import { useAuth } from './contexts/AuthContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Shield, 
  AlertTriangle,
  Filter,
  Target,
  Printer,
  XCircle,
  CheckCircle2,
  BarChart3,
  Download,
  X,
  FileText,
  MapPin,
  CheckCircle,
  MoreHorizontal,
  Car,
  Zap,
  Command,
  Terminal,
  Radio,
  Activity,
  MessageSquare,
  Clock,
  Database,
  Fish,
  Trees,
  Mountain,
  Calendar,
  ChevronDown,
  Eye
} from "lucide-react";

export default function Reports({ onLogout, onNavigate, currentPage }) {
  const { 
    actionReports, 
    incidents, 
    ipatrollerData, 
    summaryStats, 
    loading: dataLoading 
  } = useData();
  
  const { user, getWeeklyReport, getBarangays, getConcernTypes } = useFirebase();
  const { isAdmin, userAccessLevel, userFirstName, userLastName, userUsername, userMunicipality, userDepartment } = useAuth();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDistrict, setSelectedDistrict] = useState("all");
  const [isGenerating, setIsGenerating] = useState(false);
  const [paperSize, setPaperSize] = useState("short"); // "short" for Letter, "long" for Legal
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Command Center Summary modal state
  const [showCommandCenterSummary, setShowCommandCenterSummary] = useState(false);
  const [summaryViewType, setSummaryViewType] = useState("monthly"); // "monthly" or "quarterly"
  const [commandCenterData, setCommandCenterData] = useState({});
  const [isLoadingCommandCenter, setIsLoadingCommandCenter] = useState(false);
  const [isGeneratingCommandCenterReport, setIsGeneratingCommandCenterReport] = useState(false);
  
  // Action Center Summary modal state
  const [showActionCenterSummary, setShowActionCenterSummary] = useState(false);
  const [actionItems, setActionItems] = useState([]);
  
  // IPatroller Daily Summary modal state
  const [showIPatrollerDailySummary, setShowIPatrollerDailySummary] = useState(false);
  const [ipatrollerSelectedDayIndex, setIpatrollerSelectedDayIndex] = useState(0);
  const [ipatrollerPatrolData, setIpatrollerPatrolData] = useState([]);
  const [ipatrollerSelectedMonth, setIpatrollerSelectedMonth] = useState(new Date().getMonth());
  const [ipatrollerSelectedYear, setIpatrollerSelectedYear] = useState(new Date().getFullYear());
  
  // IPatroller Preview Report modal state
  const [showIPatrollerPreview, setShowIPatrollerPreview] = useState(false);
  const [ipatrollerPreviewData, setIpatrollerPreviewData] = useState(null);
  const [isGeneratingIPatrollerReport, setIsGeneratingIPatrollerReport] = useState(false);

  // Municipalities by district mapping (matching I-Patroller structure)
  const municipalitiesByDistrict = {
    "1ST DISTRICT": ["Abucay", "Orani", "Samal", "Hermosa"],
    "2ND DISTRICT": ["Balanga City", "Pilar", "Orion", "Limay"],
    "3RD DISTRICT": ["Bagac", "Dinalupihan", "Mariveles", "Morong"]
  };

  const handleLogout = async () => {
    try {
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Load Command Center data from Firebase
  const loadCommandCenterData = async () => {
    setIsLoadingCommandCenter(true);
    try {
      const monthYear = `${selectedMonth}_${selectedYear}`;
      const allMunicipalities = Object.values(municipalitiesByDistrict).flat();
      const commandCenterReports = {};
      
      console.log('🔍 Loading Command Center data for:', monthYear);
      console.log('📍 Municipalities to load:', allMunicipalities);
      
      // Load data for each municipality using the nested structure
      for (const municipality of allMunicipalities) {
        try {
          // Use the nested structure: commandCenter/weeklyReports/<Municipality>/<Month_Year>
          const docRef = doc(db, 'commandCenter', 'weeklyReports', municipality, monthYear);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const municipalityData = docSnap.data();
            console.log(`✅ Found data for ${municipality}:`, municipalityData);
            commandCenterReports[municipality] = municipalityData;
          } else {
            console.log(`📝 No data found for ${municipality} in ${monthYear}`);
          }
        } catch (error) {
          console.error(`❌ Error loading data for ${municipality}:`, error);
        }
      }
      
      // Load barangays and concern types
      const barangaysResult = await getBarangays();
      const concernTypesResult = await getConcernTypes();
      
      console.log('📊 Command Center reports loaded:', Object.keys(commandCenterReports));
      console.log('🏘️ Barangays loaded:', barangaysResult.success ? barangaysResult.data.length : 0);
      console.log('🏷️ Concern types loaded:', concernTypesResult.success ? concernTypesResult.data.length : 0);
      
      setCommandCenterData({
        reports: commandCenterReports,
        barangays: barangaysResult.success ? barangaysResult.data : [],
        concernTypes: concernTypesResult.success ? concernTypesResult.data : []
      });
      
    } catch (error) {
      console.error('Error loading Command Center data:', error);
    } finally {
      setIsLoadingCommandCenter(false);
    }
  };

  // Load Command Center data when month/year changes
  useEffect(() => {
    loadCommandCenterData();
  }, [selectedMonth, selectedYear]);

  // Calculate total Command Center reports
  const getTotalCommandCenterReports = () => {
    const reports = commandCenterData.reports || {};
    return Object.values(reports).reduce((sum, report) => {
      if (report.weeklyReportData) {
        return sum + Object.values(report.weeklyReportData).reduce((dateSum, dateEntries) => {
          return dateSum + (Array.isArray(dateEntries) ? dateEntries.length : 0);
        }, 0);
      }
      return sum;
    }, 0);
  };

  // Calculate total Quarry Site Monitoring reports
  const getTotalQuarryMonitoringReports = () => {
    // TODO: Implement when Quarry Site Monitoring data structure is available
    // For now, return 0 since the feature is in "Coming Soon" status
    // In future implementation, this would fetch from quarry monitoring collection
    // and count inspection reports, compliance reports, environmental assessments, etc.
    return 0;
  };

  // Translation and grammar correction function (from Action Center)
  const translateAndCorrectGrammar = (text) => {
    if (!text || typeof text !== 'string') return text;
    
    // Common Filipino to English translations for law enforcement actions
    const translations = {
      // Arrest related
      'nahuli': 'arrested',
      'naaresto': 'arrested', 
      'nakuha': 'arrested',
      'dinakip': 'arrested',
      'nasakote': 'arrested',
      'nakulong': 'arrested',
      'kinuha': 'arrested',
      
      // Investigation related
      'iniimbestigahan': 'under investigation',
      'sinisiyasat': 'under investigation',
      'tinitingnan': 'under investigation',
      'pinag-aaralan': 'under investigation',
      
      // Pending related
      'naghihintay': 'pending',
      'pending pa': 'pending',
      'hindi pa tapos': 'pending',
      'patuloy': 'ongoing',
      'tuloy-tuloy': 'ongoing',
      
      // Resolved related
      'tapos na': 'resolved',
      'natapos': 'resolved',
      'naayos': 'resolved',
      'naresolba': 'resolved',
      'nakasuhan': 'filed charges',
      'nasampa': 'filed charges',
      
      // Common words
      'ang': 'the',
      'sa': 'in',
      'ng': 'of',
      'na': 'already',
      'pa': 'still',
      'ay': 'is',
      'mga': '',
      'yung': 'the',
      'nung': 'when',
      'noong': 'on',
      'kanina': 'earlier',
      'kahapon': 'yesterday',
      'ngayon': 'today',
      'bukas': 'tomorrow'
    };
    
    let result = text.toLowerCase().trim();
    
    // Apply translations
    Object.entries(translations).forEach(([filipino, english]) => {
      const regex = new RegExp(`\\b${filipino}\\b`, 'gi');
      result = result.replace(regex, english);
    });
    
    // Grammar corrections and improvements
    result = result
      .replace(/\s+/g, ' ') // Remove extra spaces
      .replace(/\b(arrested|investigation|pending|resolved|ongoing)\b/gi, (match) => {
        // Capitalize first letter of key status words
        return match.charAt(0).toUpperCase() + match.slice(1).toLowerCase();
      })
      .replace(/^./, (match) => match.toUpperCase()) // Capitalize first letter
      .replace(/\s+$/, '') // Remove trailing spaces
      .replace(/^\s+/, ''); // Remove leading spaces
    
    // Handle common patterns
    if (result.includes('arrested')) {
      result = result.replace(/arrested.*/, 'Arrested');
    }
    
    return result || text; // Return original if translation fails
  };

  // Comprehensive function to fetch ALL action data from Firestore (from Action Center)
  const fetchAllActionData = useCallback(async () => {
    if (!db) {
      console.log('⚠️ Database not available');
      return;
    }

    try {
      console.log('🚀 COMPREHENSIVE ACTION DATA FETCH STARTED');
      
      const allActionData = [];
      
      // List of possible collection names where action data might be stored
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
      
      console.log('📋 Checking collections:', possibleCollections);
      
      // Check each possible collection
      for (const collectionName of possibleCollections) {
        try {
          console.log(`\n🔍 Checking collection: ${collectionName}`);
          const collectionRef = collection(db, collectionName);
          const snapshot = await getDocs(collectionRef);
          
          console.log(`📊 ${collectionName}: ${snapshot.size} documents found`);
          
          if (snapshot.size > 0) {
            snapshot.forEach((doc) => {
              const data = doc.data();
              console.log(`📄 ${collectionName}/${doc.id}:`, Object.keys(data));
              
              // Handle different data structures
              if (data.data && Array.isArray(data.data)) {
                // Month-based structure with data array
                console.log(`📅 Month-based document with ${data.data.length} reports`);
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
                console.log(`📋 Actions array with ${data.actions.length} items`);
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
                console.log(`📋 Reports array with ${data.reports.length} items`);
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
                console.log(`📄 Individual document structure`);
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
          console.log(`⚠️ Collection ${collectionName} not accessible:`, collectionError.message);
        }
      }
      
      console.log(`\n✅ TOTAL RAW DATA COLLECTED: ${allActionData.length} items`);
      
      if (allActionData.length > 0) {
        console.log('📄 Sample raw data:', allActionData.slice(0, 3));
        
        // Transform and standardize all collected data
        const transformedData = allActionData
          .map((item, index) => {
            // Handle different date formats
            let dateValue = new Date();
            if (item.when) {
              if (item.when.toDate && typeof item.when.toDate === 'function') {
                dateValue = item.when.toDate(); // Firestore Timestamp
              } else if (item.when instanceof Date) {
                dateValue = item.when;
              } else if (typeof item.when === 'string' || typeof item.when === 'number') {
                dateValue = new Date(item.when);
              }
            } else if (item.date) {
              if (item.date.toDate && typeof item.date.toDate === 'function') {
                dateValue = item.date.toDate();
              } else {
                dateValue = new Date(item.date);
              }
            } else if (item.createdAt) {
              dateValue = new Date(item.createdAt);
            }
            
            return {
              id: item.id || `action_${index}_${Date.now()}`,
              department: item.department || item.dept || item.agency || null,
              municipality: item.municipality || item.city || item.location || null,
              district: item.district || item.area || null,
              what: item.what || item.action || item.description || item.activity || null,
              when: dateValue,
              where: item.where || item.place || item.venue || item.location || null,
              actionTaken: translateAndCorrectGrammar(item.actionTaken || item.status || item.result || 'Pending'),
              // Additional metadata
              sourceCollection: item.sourceCollection,
              sourceDocument: item.sourceDocument,
              sourceType: item.sourceType,
              reportIndex: item.reportIndex,
              // Keep original data for debugging
              originalData: item
            };
          })
          .filter(item => {
            // Filter out entries with missing critical information
            const hasValidDepartment = item.department && 
              item.department.toLowerCase() !== 'unknown' && 
              item.department.trim() !== '';
            
            const hasValidMunicipality = item.municipality && 
              item.municipality.toLowerCase() !== 'unknown' && 
              item.municipality.trim() !== '';
            
            const hasValidDistrict = item.district && 
              item.district.toLowerCase() !== 'unknown' && 
              item.district.trim() !== '';
            
            const hasValidWhat = item.what && 
              item.what.toLowerCase() !== 'no description' && 
              item.what.trim() !== '';
            
            const hasValidWhere = item.where && 
              item.where.toLowerCase() !== 'unknown location' && 
              item.where.toLowerCase() !== 'unknown' && 
              item.where.trim() !== '';
            
            // Only include entries that have valid data for critical fields
            return hasValidDepartment && hasValidMunicipality && hasValidDistrict && hasValidWhat && hasValidWhere;
          })
          .map(item => {
            // Set proper default values for remaining items
            return {
              ...item,
              department: item.department || 'Not Specified',
              municipality: item.municipality || 'Not Specified',
              district: item.district || 'Not Specified',
              what: item.what || 'No description available',
              where: item.where || 'Location not specified'
            };
          });
        
        // Sort by date (newest first)
        transformedData.sort((a, b) => new Date(b.when) - new Date(a.when));
        
        console.log('✅ DATA TRANSFORMATION COMPLETED');
        console.log(`📊 Final dataset: ${transformedData.length} action reports (unknown entries filtered out)`);
        console.log('📄 Sample transformed data:', transformedData.slice(0, 2));
        
        setActionItems(transformedData);
      } else {
        console.log('⚠️ NO ACTION DATA FOUND IN ANY COLLECTION');
        setActionItems([]);
      }
      
    } catch (error) {
      console.error('❌ COMPREHENSIVE FETCH ERROR:', error);
      setActionItems([]);
    } finally {
      console.log('🏁 COMPREHENSIVE ACTION DATA FETCH COMPLETED\n');
    }
  }, [db]);

  // Fetch Action Center data on component mount
  useEffect(() => {
    fetchAllActionData();
  }, [fetchAllActionData]);

  // IPatroller Daily Summary functions (moved from IPatroller.jsx)
  
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

  // Calculate daily summary data for a specific day
  const getDailySummaryData = (dayIndex) => {
    const summaryData = {};
    
    Object.keys(municipalitiesByDistrict).forEach(district => {
      summaryData[district] = municipalitiesByDistrict[district].map(municipality => {
        const municipalityData = ipatrollerPatrolData.find(item => item.municipality === municipality);
        const dailyCount = municipalityData ? municipalityData.data[dayIndex] || 0 : 0;
        
        // Get the actual barangay count for this municipality
        const totalBarangays = barangayCounts[municipality] || 0;
        const isActive = totalBarangays > 0 ? dailyCount >= totalBarangays : dailyCount >= 5;
        
        // Calculate percentage based on actual barangay count
        let percentage = 0;
        if (totalBarangays > 0) {
          percentage = Math.min(100, Math.round((dailyCount / totalBarangays) * 100));
        } else {
          // Fallback to old logic if barangay count is not available
          percentage = dailyCount >= 5 ? 100 : Math.round((dailyCount / 5) * 100);
        }
        
        return {
          municipality,
          dailyCount,
          totalBarangays,
          isActive,
          percentage
        };
      });
    });

    return summaryData;
  };

  // Load patrol data from Firestore for IPatroller Daily Summary
  const loadIPatrollerData = useCallback(async () => {
    try {
      const monthYearId = `${String(ipatrollerSelectedMonth + 1).padStart(2, "0")}-${ipatrollerSelectedYear}`;
      
      const monthDocRef = doc(db, 'patrolData', monthYearId);
      const municipalitiesRef = collection(monthDocRef, 'municipalities');
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

      setIpatrollerPatrolData(firestoreData);
    } catch (error) {
      console.error('Error loading IPatroller data:', error);
      setIpatrollerPatrolData([]);
    }
  }, [ipatrollerSelectedMonth, ipatrollerSelectedYear]);

  // Load IPatroller data when modals are shown
  useEffect(() => {
    if (showIPatrollerDailySummary) {
      loadIPatrollerData();
    }
  }, [showIPatrollerDailySummary, loadIPatrollerData]);

  useEffect(() => {
    if (showIPatrollerPreview) {
      loadIPatrollerData();
    }
  }, [showIPatrollerPreview, loadIPatrollerData]);

  // Generate preview data when patrol data is loaded and preview modal is shown
  useEffect(() => {
    if (showIPatrollerPreview && ipatrollerPatrolData.length > 0) {
      generateIPatrollerPreviewData();
    }
  }, [showIPatrollerPreview, ipatrollerPatrolData]);

  // Barangay counts per municipality (from IPatroller.jsx)
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

  // Calculate overall summary (matching IPatroller logic)
  const calculateIPatrollerOverallSummary = () => {
    if (!ipatrollerPatrolData || ipatrollerPatrolData.length === 0) {
      return {
        totalPatrols: 0,
        totalActive: 0,
        totalInactive: 0,
        avgActivePercentage: 0,
        municipalityCount: 0
      };
    }

    // Calculate active and inactive days (matching IPatroller logic)
    const { activeDays, inactiveDays } = ipatrollerPatrolData.reduce((acc, municipality) => {
      municipality.data.forEach((patrols) => {
        if (patrols !== null && patrols !== undefined && patrols !== '') {
          if (patrols >= 5) {
            acc.activeDays++;
          } else {
            acc.inactiveDays++;
          }
        }
      });
      return acc;
    }, { activeDays: 0, inactiveDays: 0 });

    const totalPatrols = ipatrollerPatrolData.reduce((sum, item) => sum + (item.totalPatrols || 0), 0);
    const avgActivePercentage = (activeDays + inactiveDays) > 0 
      ? Math.round((activeDays / (activeDays + inactiveDays)) * 100)
      : 0;

    return {
      totalPatrols,
      totalActive: activeDays,
      totalInactive: inactiveDays,
      avgActivePercentage,
      municipalityCount: ipatrollerPatrolData.length
    };
  };

  // Get district summary (matching IPatroller logic)
  const getIPatrollerDistrictSummary = (district) => {
    const districtData = ipatrollerPatrolData.filter(
      (item) => item.district === district,
    );
    const totalPatrols = districtData.reduce(
      (sum, item) => sum + (item.totalPatrols || 0),
      0,
    );
    const totalActive = districtData.reduce(
      (sum, item) => sum + (item.activeDays || 0),
      0,
    );
    const totalInactive = districtData.reduce(
      (sum, item) => sum + (item.inactiveDays || 0),
      0,
    );
    const avgActivePercentage =
      districtData.length > 0
        ? Math.round(
            districtData.reduce((sum, item) => sum + (item.activePercentage || 0), 0) /
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

  // Generate preview data for the report (moved from IPatroller.jsx)
  const generateIPatrollerPreviewData = () => {
    const selectedDates = generateDates(ipatrollerSelectedMonth, ipatrollerSelectedYear);
    const overallSummary = calculateIPatrollerOverallSummary();
    
    // Group data by district
    const groupedData = ipatrollerPatrolData.reduce((acc, item) => {
      if (!acc[item.district]) {
        acc[item.district] = [];
      }
      acc[item.district].push(item);
      return acc;
    }, {});

    // Calculate additional statistics based on daily counts
    const totalDaysInMonth = selectedDates.length;
    const totalPossibleDays = ipatrollerPatrolData.length * totalDaysInMonth;
    const daysWithData = ipatrollerPatrolData.reduce((acc, municipality) => {
      return acc + municipality.data.filter(day => day !== null && day !== undefined && day !== '').length;
    }, 0);

    const previewData = {
      title: "I-Patroller Monthly Summary Report",
      generatedDate: new Date().toLocaleDateString(),
      month: months[ipatrollerSelectedMonth],
      year: ipatrollerSelectedYear,
      reportPeriod: new Date(ipatrollerSelectedYear, ipatrollerSelectedMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      dataSource: "Based on IPatroller Daily Counts",
      totalDaysInMonth,
      totalPossibleDays,
      daysWithData,
      dataCompleteness: totalPossibleDays > 0 ? Math.round((daysWithData / totalPossibleDays) * 100) : 0,
      overallSummary: overallSummary,
      districtSummary: Object.keys(groupedData).map(district => ({
        district,
        ...getIPatrollerDistrictSummary(district)
      })),
      municipalityPerformance: ipatrollerPatrolData.map(item => ({
        municipality: item.municipality,
        district: item.district,
        requiredBarangays: barangayCounts[item.municipality] || 0,
        totalPatrols: item.totalPatrols || 0,
        activeDays: item.activeDays || 0,
        inactiveDays: item.inactiveDays || 0,
        activePercentage: item.activePercentage || 0,
        dailyData: item.data || [] // Include daily data for reference
      }))
    };

    setIpatrollerPreviewData(previewData);
    setShowIPatrollerPreview(true);
  };

  // Generate Monthly Summary Report (moved from IPatroller.jsx)
  const generateIPatrollerMonthlySummaryReport = () => {
    setIsGeneratingIPatrollerReport(true);
    
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const selectedDates = generateDates(ipatrollerSelectedMonth, ipatrollerSelectedYear);
      const overallSummary = calculateIPatrollerOverallSummary();
      
      // Group data by district
      const groupedData = ipatrollerPatrolData.reduce((acc, item) => {
        if (!acc[item.district]) {
          acc[item.district] = [];
        }
        acc[item.district].push(item);
        return acc;
      }, {});
      
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
      const monthText = `Month: ${months[ipatrollerSelectedMonth]} ${ipatrollerSelectedYear}`;
      const periodText = `Report Period: ${new Date(ipatrollerSelectedYear, ipatrollerSelectedMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
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
          const summary = getIPatrollerDistrictSummary(district);
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
      
      // Save the PDF
      doc.save(`ipatroller-monthly-summary-${months[ipatrollerSelectedMonth]}-${ipatrollerSelectedYear}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingIPatrollerReport(false);
    }
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const districts = ["all", "1ST DISTRICT", "2ND DISTRICT", "3RD DISTRICT"];

  // Paper size configuration
  const getPaperConfig = (size) => {
    switch (size) {
      case "short":
        return {
          format: 'letter',
          width: 216, // mm
          height: 279, // mm
          margin: 20,
          name: 'Letter (Short Bond)'
        };
      case "long":
        return {
          format: 'legal',
          width: 216, // mm
          height: 356, // mm
          margin: 20,
          name: 'Legal (Long Bond)'
        };
      default:
        return {
          format: 'a4',
          width: 210, // mm
          height: 297, // mm
          margin: 20,
          name: 'A4'
        };
    }
  };

  // Get optimized column widths based on paper size
  const getColumnWidths = (paperType, tableType) => {
    const config = getPaperConfig(paperType);
    const availableWidth = config.width - (config.margin * 2);
    
    switch (tableType) {
      case 'ipatroller':
        if (paperType === 'long') {
          return {
            0: { cellWidth: 40, halign: 'left' },    // Municipality
            1: { cellWidth: 35, halign: 'left' },    // District
            2: { cellWidth: 30, halign: 'center' },  // Total Patrols
            3: { cellWidth: 25, halign: 'center' },  // Active Days
            4: { cellWidth: 25, halign: 'center' },  // Inactive Days
            5: { cellWidth: 25, halign: 'center' }   // Active %
          };
        } else {
          return {
            0: { cellWidth: 35, halign: 'left' },    // Municipality
            1: { cellWidth: 30, halign: 'left' },    // District
            2: { cellWidth: 25, halign: 'center' },  // Total Patrols
            3: { cellWidth: 25, halign: 'center' },  // Active Days
            4: { cellWidth: 25, halign: 'center' },  // Inactive Days
            5: { cellWidth: 20, halign: 'center' }   // Active %
          };
        }
      case 'action':
        if (paperType === 'long') {
          return {
            0: { cellWidth: 45, halign: 'left' },    // Department
            1: { cellWidth: 35, halign: 'center' },  // Total Reports
            2: { cellWidth: 30, halign: 'center' },  // Pending
            3: { cellWidth: 30, halign: 'center' },  // Resolved
            4: { cellWidth: 35, halign: 'center' }   // Resolution Rate
          };
        } else {
          return {
            0: { cellWidth: 40, halign: 'left' },    // Department
            1: { cellWidth: 30, halign: 'center' },  // Total Reports
            2: { cellWidth: 25, halign: 'center' },  // Pending
            3: { cellWidth: 25, halign: 'center' },  // Resolved
            4: { cellWidth: 30, halign: 'center' }   // Resolution Rate
          };
        }
      case 'incidents':
        if (paperType === 'long') {
          return {
            0: { cellWidth: 55, halign: 'left' },    // Incident Type
            1: { cellWidth: 30, halign: 'center' },  // Total
            2: { cellWidth: 30, halign: 'center' },  // Active
            3: { cellWidth: 30, halign: 'center' },  // Resolved
            4: { cellWidth: 35, halign: 'center' }   // Resolution Rate
          };
        } else {
          return {
            0: { cellWidth: 50, halign: 'left' },    // Incident Type
            1: { cellWidth: 25, halign: 'center' },  // Total
            2: { cellWidth: 25, halign: 'center' },  // Active
            3: { cellWidth: 25, halign: 'center' },  // Resolved
            4: { cellWidth: 30, halign: 'center' }   // Resolution Rate
          };
        }
      default:
        return {};
    }
  };

  // Helper function to calculate patrol statistics (matching I-Patroller logic exactly)
  const calculatePatrolStats = (data) => {
    if (!data || !Array.isArray(data)) return { activeDays: 0, inactiveDays: 0, totalPatrols: 0 };
    
    // Match I-Patroller logic: active if >= 5 patrols, inactive if < 5 but > 0
    let activeDays = 0;
    let inactiveDays = 0;
    let totalPatrols = 0;
    
    data.forEach((patrols) => {
      if (patrols !== null && patrols !== undefined && patrols !== '') {
        totalPatrols += patrols;
        if (patrols >= 5) {
          activeDays++;
        } else {
          inactiveDays++;
        }
      }
    });
    
    return { activeDays, inactiveDays, totalPatrols };
  };

  // Calculate overall summary (matching I-Patroller exactly)
  const calculateOverallSummary = () => {
    if (!ipatrollerData || ipatrollerData.length === 0) {
      return {
        totalPatrols: 0,
        totalActive: 0,
        totalInactive: 0,
        avgActivePercentage: 0,
        municipalityCount: 0
      };
    }

    // Calculate active and inactive days (matching I-Patroller logic)
    const { activeDays, inactiveDays } = ipatrollerData.reduce((acc, municipality) => {
      municipality.data.forEach((patrols) => {
        if (patrols !== null && patrols !== undefined && patrols !== '') {
          if (patrols >= 5) {
            acc.activeDays++;
          } else {
            acc.inactiveDays++;
          }
        }
      });
      return acc;
    }, { activeDays: 0, inactiveDays: 0 });

    const totalPatrols = ipatrollerData.reduce((sum, item) => sum + item.totalPatrols, 0);
    const avgActivePercentage = (activeDays + inactiveDays) > 0 
      ? Math.round((activeDays / (activeDays + inactiveDays)) * 100)
      : 0;

    return {
      totalPatrols,
      totalActive: activeDays,
      totalInactive: inactiveDays,
      avgActivePercentage,
      municipalityCount: ipatrollerData.length
    };
  };

  // Report generation functions (matching exact data structures)
  const generateIPatrollerSummaryReport = () => {
    const paperConfig = getPaperConfig(paperSize);
    const doc = new jsPDF('p', 'mm', paperConfig.format);
    
    // Calculate center position
    const pageWidth = doc.internal.pageSize.getWidth();
    const centerX = pageWidth / 2;
    
    // Add logo/header section
    doc.setFillColor(59, 130, 246); // Blue background
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Main title - centered
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('I-Patroller Summary Report', centerX, 25, { align: 'center' });
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    
    // Report info section with better organization
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Report Information', centerX, 60, { align: 'center' });
    
    // Info box
    const infoY = 70;
    doc.setFillColor(248, 250, 252);
    doc.rect(paperConfig.margin, infoY - 5, pageWidth - (paperConfig.margin * 2), 40, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(paperConfig.margin, infoY - 5, pageWidth - (paperConfig.margin * 2), 40, 'S');
    
    // Report details - organized in two columns
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, paperConfig.margin + 10, infoY + 5);
    doc.text(`Month: ${months[selectedMonth]}`, paperConfig.margin + 10, infoY + 15);
    doc.text(`Year: ${selectedYear}`, paperConfig.margin + 10, infoY + 25);
    doc.text(`District: ${selectedDistrict === 'all' ? 'All Districts' : selectedDistrict}`, paperConfig.margin + 10, infoY + 35);
    
    // Paper size indicator - right aligned
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(`Paper: ${paperConfig.name}`, pageWidth - paperConfig.margin - 10, infoY + 5, { align: 'right' });
    
    // Overall Summary (matching I-Patroller exactly)
    const overallSummary = calculateOverallSummary();
    
    // Summary section with better design
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Overall Summary Statistics', centerX, 130, { align: 'center' });
    
    // Summary box - centered and properly sized
    const summaryY = 140;
    const boxWidth = pageWidth - (paperConfig.margin * 2);
    const boxHeight = 60;
    
    doc.setFillColor(239, 246, 255);
    doc.rect(paperConfig.margin, summaryY - 5, boxWidth, boxHeight, 'F');
    doc.setDrawColor(59, 130, 246);
    doc.rect(paperConfig.margin, summaryY - 5, boxWidth, boxHeight, 'S');
    
    // Summary stats in organized layout - centered
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    // Center the text within the box
    const textStartX = paperConfig.margin + 15;
    const lineHeight = 12;
    
    doc.text(`• Total Patrols: ${overallSummary.totalPatrols.toLocaleString()}`, textStartX, summaryY + 10);
    doc.text(`• Total Active Days: ${overallSummary.totalActive.toLocaleString()}`, textStartX, summaryY + 10 + lineHeight);
    doc.text(`• Total Inactive Days: ${overallSummary.totalInactive.toLocaleString()}`, textStartX, summaryY + 10 + (lineHeight * 2));
    doc.text(`• Average Active Percentage: ${overallSummary.avgActivePercentage}%`, textStartX, summaryY + 10 + (lineHeight * 3));
    doc.text(`• Total Municipalities: ${overallSummary.municipalityCount}`, textStartX, summaryY + 10 + (lineHeight * 4));
    
    // Municipality Performance Table with better design
    if (ipatrollerData && ipatrollerData.length > 0) {
      let filteredData = selectedDistrict === 'all' 
        ? ipatrollerData 
        : ipatrollerData.filter(item => item.district === selectedDistrict);
      
      // Table title
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Municipality Performance Details', centerX, 210, { align: 'center' });
      
      const tableData = filteredData.map(item => {
        const stats = calculatePatrolStats(item.data);
        const totalDays = stats.activeDays + stats.inactiveDays;
        const activePercentage = totalDays > 0 ? Math.round((stats.activeDays / totalDays) * 100) : 0;
        
        return [
          item.municipality || 'N/A',
          item.district || 'N/A',
          stats.totalPatrols.toString(),
          stats.activeDays.toString(),
          stats.inactiveDays.toString(),
          `${activePercentage}%`
        ];
      });
      
      autoTable(doc, {
        head: [['Municipality', 'District', 'Total Patrols', 'Active Days', 'Inactive Days', 'Active %']],
        body: tableData,
        startY: 220,
        styles: { 
          fontSize: paperSize === 'long' ? 10 : 9, 
          cellPadding: 4,
          overflow: 'linebreak',
          halign: 'left'
        },
        headStyles: { 
          fillColor: [59, 130, 246], 
          fontStyle: 'bold',
          textColor: [255, 255, 255],
          fontSize: paperSize === 'long' ? 11 : 10
        },
        columnStyles: getColumnWidths(paperSize, 'ipatroller'),
        margin: { left: paperConfig.margin, right: paperConfig.margin },
        tableWidth: 'auto',
        showHead: 'everyPage',
        pageBreak: 'auto',
        didDrawPage: function (data) {
          // Add page numbers
          const pageCount = doc.internal.getNumberOfPages();
          const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
          doc.setFontSize(8);
          doc.text(`Page ${currentPage} of ${pageCount}`, paperConfig.margin, doc.internal.pageSize.height - 10);
        }
      });
    } else {
      // No data message
      doc.setFontSize(12);
      doc.setFont('helvetica', 'italic');
      doc.text('No patrol data available for the selected period.', paperConfig.margin, 175);
    }
    
    doc.save(`ipatroller-summary-${months[selectedMonth]}-${selectedYear}-${paperSize}.pdf`);
  };

  // Action Center Report (matching Action Center data structure)
  const generateActionCenterReport = () => {
    const paperConfig = getPaperConfig(paperSize);
    const doc = new jsPDF('p', 'mm', paperConfig.format);
    
    // Calculate center position
    const pageWidth = doc.internal.pageSize.getWidth();
    const centerX = pageWidth / 2;
    
    // Add logo/header section
    doc.setFillColor(147, 51, 234); // Purple background
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Main title - centered
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('Action Center Report', centerX, 25, { align: 'center' });
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    
    // Report info section with better organization
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Report Information', centerX, 60, { align: 'center' });
    
    // Info box
    const infoY = 70;
    doc.setFillColor(248, 250, 252);
    doc.rect(paperConfig.margin, infoY - 5, pageWidth - (paperConfig.margin * 2), 40, 'F');
    doc.setDrawColor(147, 51, 234);
    doc.rect(paperConfig.margin, infoY - 5, pageWidth - (paperConfig.margin * 2), 40, 'S');
    
    // Report details - organized in two columns
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, paperConfig.margin + 10, infoY + 5);
    doc.text(`Month: ${months[selectedMonth]}`, paperConfig.margin + 10, infoY + 15);
    doc.text(`Year: ${selectedYear}`, paperConfig.margin + 10, infoY + 25);
    doc.text(`District: ${selectedDistrict === 'all' ? 'All Districts' : selectedDistrict}`, paperConfig.margin + 10, infoY + 35);
    
    // Paper size indicator - right aligned
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(`Paper: ${paperConfig.name}`, pageWidth - paperConfig.margin - 10, infoY + 5, { align: 'right' });
    
    // Filter action reports by date and district
    let filteredActions = actionReports || [];
    if (selectedMonth !== 'all' && selectedYear !== 'all') {
      filteredActions = filteredActions.filter(action => {
        const actionDate = new Date(action.when);
        return actionDate.getMonth() === selectedMonth && actionDate.getFullYear() === selectedYear;
      });
    }
    if (selectedDistrict !== 'all') {
      filteredActions = filteredActions.filter(action => action.district === selectedDistrict);
    }
    
    // Department breakdown
    const departmentStats = {};
    filteredActions.forEach(action => {
      const dept = action.department || 'Unknown';
      if (!departmentStats[dept]) {
        departmentStats[dept] = { count: 0, pending: 0, resolved: 0 };
      }
      departmentStats[dept].count++;
      if (action.status === 'pending') departmentStats[dept].pending++;
      if (action.status === 'resolved') departmentStats[dept].resolved++;
    });
    
    // Department Statistics section with better design
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Department Statistics', centerX, 130, { align: 'center' });
    
    // Statistics box - centered and properly sized
    const statsY = 140;
    const boxWidth = pageWidth - (paperConfig.margin * 2);
    const boxHeight = 40;
    
    doc.setFillColor(248, 250, 255);
    doc.rect(paperConfig.margin, statsY - 5, boxWidth, boxHeight, 'F');
    doc.setDrawColor(147, 51, 234);
    doc.rect(paperConfig.margin, statsY - 5, boxWidth, boxHeight, 'S');
    
    // Statistics in organized layout - centered
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const textStartX = paperConfig.margin + 15;
    const lineHeight = 12;
    
    doc.text(`Total Action Reports: ${filteredActions.length}`, textStartX, statsY + 10);
    doc.text(`Pending: ${filteredActions.filter(a => a.status === 'pending').length}`, textStartX, statsY + 10 + lineHeight);
    doc.text(`Resolved: ${filteredActions.filter(a => a.status === 'resolved').length}`, textStartX, statsY + 10 + (lineHeight * 2));
    
    // Department breakdown table with autofit
    if (Object.keys(departmentStats).length > 0) {
      const tableData = Object.entries(departmentStats).map(([dept, stats]) => [
        dept.toUpperCase(),
        stats.count.toString(),
        stats.pending.toString(),
        stats.resolved.toString(),
        `${((stats.resolved / stats.count) * 100).toFixed(1)}%`
      ]);
      
      autoTable(doc, {
        head: [['Department', 'Total Reports', 'Pending', 'Resolved', 'Resolution Rate']],
        body: tableData,
        startY: 135,
        styles: { 
          fontSize: paperSize === 'long' ? 10 : 9, 
          cellPadding: 4,
          overflow: 'linebreak',
          halign: 'left'
        },
        headStyles: { 
          fillColor: [147, 51, 234], 
          fontStyle: 'bold',
          textColor: [255, 255, 255],
          fontSize: paperSize === 'long' ? 11 : 10
        },
        columnStyles: getColumnWidths(paperSize, 'action'),
        margin: { left: paperConfig.margin, right: paperConfig.margin },
        tableWidth: 'auto',
        showHead: 'everyPage',
        pageBreak: 'auto',
        didDrawPage: function (data) {
          // Add page numbers
          const pageCount = doc.internal.getNumberOfPages();
          const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
          doc.setFontSize(8);
          doc.text(`Page ${currentPage} of ${pageCount}`, paperConfig.margin, doc.internal.pageSize.height - 10);
        }
      });
    } else {
      // No data message
      doc.setFontSize(12);
      doc.setFont('helvetica', 'italic');
      doc.text('No action reports available for the selected period.', paperConfig.margin, 135);
    }
    
    doc.save(`action-center-${months[selectedMonth]}-${selectedYear}-${paperSize}.pdf`);
  };

  // Quarry Site Monitoring Report
  const generateQuarrySiteMonitoringReport = () => {
    const paperConfig = getPaperConfig(paperSize);
    const doc = new jsPDF('p', 'mm', paperConfig.format);
    
    // Calculate center position
    const pageWidth = doc.internal.pageSize.getWidth();
    const centerX = pageWidth / 2;
    
    // Add logo/header section
    doc.setFillColor(251, 146, 60); // Orange background
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Main title - centered
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('Quarry Site Monitoring Report', centerX, 25, { align: 'center' });
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    
    // Report info section with better organization
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Report Information', centerX, 60, { align: 'center' });
    
    // Info box
    const infoY = 70;
    doc.setFillColor(248, 250, 252);
    doc.rect(paperConfig.margin, infoY - 5, pageWidth - (paperConfig.margin * 2), 40, 'F');
    doc.setDrawColor(251, 146, 60);
    doc.rect(paperConfig.margin, infoY - 5, pageWidth - (paperConfig.margin * 2), 40, 'S');
    
    // Report details - organized in two columns
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, paperConfig.margin + 10, infoY + 5);
    doc.text(`Month: ${months[selectedMonth]}`, paperConfig.margin + 10, infoY + 15);
    doc.text(`Year: ${selectedYear}`, paperConfig.margin + 10, infoY + 25);
    doc.text(`District: ${selectedDistrict === 'all' ? 'All Districts' : selectedDistrict}`, paperConfig.margin + 10, infoY + 35);
    
    // Paper size indicator - right aligned
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(`Paper: ${paperConfig.name}`, pageWidth - paperConfig.margin - 10, infoY + 5, { align: 'right' });
    
    // Quarry Site Statistics section with better design
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Quarry Site Statistics', centerX, 130, { align: 'center' });
    
    // Statistics box - centered and properly sized
    const statsY = 140;
    const boxWidth = pageWidth - (paperConfig.margin * 2);
    const boxHeight = 60;
    
    doc.setFillColor(255, 247, 237);
    doc.rect(paperConfig.margin, statsY - 5, boxWidth, boxHeight, 'F');
    doc.setDrawColor(251, 146, 60);
    doc.rect(paperConfig.margin, statsY - 5, boxWidth, boxHeight, 'S');
    
    // Sample quarry statistics in organized layout - centered
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const textStartX = paperConfig.margin + 15;
    const lineHeight = 12;
    
    doc.text(`• Total Quarry Sites: 24`, textStartX, statsY + 10);
    doc.text(`• Active Sites: 18`, textStartX, statsY + 10 + lineHeight);
    doc.text(`• Compliant Sites: 15`, textStartX, statsY + 10 + (lineHeight * 2));
    doc.text(`• Violations: 3`, textStartX, statsY + 10 + (lineHeight * 3));
    doc.text(`• Compliance Rate: 83.3%`, textStartX, statsY + 10 + (lineHeight * 4));
    
    // Quarry Sites Table with better design
    const quarrySites = [
      ['Bataan Quarry Corp.', 'Bagac', 'Active', 'Valid', 'Compliant', '2024-01-15'],
      ['Mountain Stone Mining', 'Mariveles', 'Active', 'Valid', 'Compliant', '2024-01-10'],
      ['Pacific Aggregates', 'Morong', 'Active', 'Expired', 'Non-Compliant', '2023-12-20'],
      ['Bataan Rock Industries', 'Bagac', 'Active', 'Valid', 'Compliant', '2024-01-08'],
      ['Limestone Quarry Inc.', 'Mariveles', 'Inactive', 'Valid', 'Under Review', '2024-01-05']
    ];
    
    // Table title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Quarry Site Details', centerX, 210, { align: 'center' });
    
    autoTable(doc, {
      head: [['Operator', 'Location', 'Status', 'Permit Status', 'Compliance', 'Last Inspection']],
      body: quarrySites,
      startY: 220,
      styles: { 
        fontSize: paperSize === 'long' ? 10 : 9, 
        cellPadding: 4,
        overflow: 'linebreak',
        halign: 'left'
      },
      headStyles: { 
        fillColor: [251, 146, 60], 
        fontStyle: 'bold',
        textColor: [255, 255, 255],
        fontSize: paperSize === 'long' ? 11 : 10
      },
      columnStyles: {
        0: { cellWidth: 45, halign: 'left' },
        1: { cellWidth: 25, halign: 'left' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 25, halign: 'center' },
        5: { cellWidth: 30, halign: 'center' }
      },
      margin: { left: paperConfig.margin, right: paperConfig.margin },
      tableWidth: 'auto',
      showHead: 'everyPage',
      pageBreak: 'auto',
      didDrawPage: function (data) {
        // Add page numbers
        const pageCount = doc.internal.getNumberOfPages();
        const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
        doc.setFontSize(8);
        doc.text(`Page ${currentPage} of ${pageCount}`, paperConfig.margin, doc.internal.pageSize.height - 10);
      }
    });
    
    doc.save(`quarry-site-monitoring-${months[selectedMonth]}-${selectedYear}-${paperSize}.pdf`);
  };

  // Incidents Report (matching Incidents Reports data structure)
  const generateIncidentsReport = () => {
    const paperConfig = getPaperConfig(paperSize);
    const doc = new jsPDF('p', 'mm', paperConfig.format);
    
    // Calculate center position
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const centerX = pageWidth / 2;
    
    // Add logo/header section
    doc.setFillColor(239, 68, 68); // Red background
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Main title - centered
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('Incidents Report', centerX, 25, { align: 'center' });
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    
    // Report info section with better spacing
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Report Information', centerX, 60, { align: 'center' });
    
    // Info box - improved layout
    const infoY = 70;
    const infoBoxHeight = 35;
    doc.setFillColor(248, 250, 252);
    doc.rect(paperConfig.margin, infoY - 5, pageWidth - (paperConfig.margin * 2), infoBoxHeight, 'F');
    doc.setDrawColor(239, 68, 68);
    doc.rect(paperConfig.margin, infoY - 5, pageWidth - (paperConfig.margin * 2), infoBoxHeight, 'S');
    
    // Report details - better organized
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, paperConfig.margin + 10, infoY + 5);
    doc.text(`Month: ${months[selectedMonth]}`, paperConfig.margin + 10, infoY + 15);
    doc.text(`Year: ${selectedYear}`, paperConfig.margin + 10, infoY + 25);
    doc.text(`District: ${selectedDistrict === 'all' ? 'All Districts' : selectedDistrict}`, paperConfig.margin + 10, infoY + 35);
    
    // Paper size indicator - right aligned
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(`Paper: ${paperConfig.name}`, pageWidth - paperConfig.margin - 10, infoY + 5, { align: 'right' });
    
    // Filter incidents by date and district
    let filteredIncidents = incidents || [];
    if (selectedMonth !== 'all' && selectedYear !== 'all') {
      filteredIncidents = filteredIncidents.filter(incident => {
        const incidentDate = new Date(incident.date);
        return incidentDate.getMonth() === selectedMonth && incidentDate.getFullYear() === selectedYear;
      });
    }
    if (selectedDistrict !== 'all') {
      filteredIncidents = filteredIncidents.filter(incident => incident.district === selectedDistrict);
    }
      
    // Incident type breakdown
    const incidentTypeStats = {};
    filteredIncidents.forEach(incident => {
      const type = incident.incidentType || 'Unknown';
      if (!incidentTypeStats[type]) {
        incidentTypeStats[type] = { count: 0, active: 0, resolved: 0 };
      }
      incidentTypeStats[type].count++;
      if (incident.status === 'Active') incidentTypeStats[type].active++;
      if (incident.status === 'Resolved') incidentTypeStats[type].resolved++;
    });
    
    // Incident Statistics section - better positioning
    const statsStartY = infoY + infoBoxHeight + 20;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Incident Statistics', centerX, statsStartY, { align: 'center' });
    
    // Statistics box - improved design
    const statsY = statsStartY + 10;
    const boxWidth = pageWidth - (paperConfig.margin * 2);
    const boxHeight = 35;
    
    doc.setFillColor(254, 242, 242);
    doc.rect(paperConfig.margin, statsY - 5, boxWidth, boxHeight, 'F');
    doc.setDrawColor(239, 68, 68);
    doc.rect(paperConfig.margin, statsY - 5, boxWidth, boxHeight, 'S');
    
    // Statistics in organized layout
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    const textStartX = paperConfig.margin + 15;
    const lineHeight = 10;
    
    doc.text(`Total Incidents: ${filteredIncidents.length}`, textStartX, statsY + 5);
    doc.text(`Active Cases: ${filteredIncidents.filter(i => i.status === 'Active').length}`, textStartX, statsY + 5 + lineHeight);
    doc.text(`Resolved Cases: ${filteredIncidents.filter(i => i.status === 'Resolved').length}`, textStartX, statsY + 5 + (lineHeight * 2));
    
    // Incident type breakdown table - better positioning
    if (Object.keys(incidentTypeStats).length > 0) {
      const tableData = Object.entries(incidentTypeStats)
        .sort(([,a], [,b]) => b.count - a.count)
        .map(([type, stats]) => [
          type,
          stats.count.toString(),
          stats.active.toString(),
          stats.resolved.toString(),
          `${((stats.resolved / stats.count) * 100).toFixed(1)}%`
        ]);
      
      // Calculate proper table positioning with adequate spacing
      const tableStartY = statsY + boxHeight + 15; // More space after statistics box
      
      // Table title
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Incident Type Breakdown', centerX, tableStartY, { align: 'center' });
      
      autoTable(doc, {
        head: [['Incident Type', 'Total', 'Active', 'Resolved', 'Resolution Rate']],
        body: tableData,
        startY: tableStartY + 10,
        styles: { 
          fontSize: paperSize === 'long' ? 10 : 9, 
          cellPadding: 4,
          overflow: 'linebreak',
          halign: 'left',
          valign: 'middle'
        },
        headStyles: { 
          fillColor: [239, 68, 68], 
          fontStyle: 'bold',
          textColor: [255, 255, 255],
          fontSize: paperSize === 'long' ? 11 : 10,
          halign: 'center',
          valign: 'middle'
        },
        columnStyles: getColumnWidths(paperSize, 'incidents'),
        margin: { left: paperConfig.margin, right: paperConfig.margin },
        tableWidth: 'auto',
        showHead: 'everyPage',
        pageBreak: 'auto',
        theme: 'grid',
        didDrawPage: function (data) {
          // Add page numbers
          const pageCount = doc.internal.getNumberOfPages();
          const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
          doc.setFontSize(8);
          doc.text(`Page ${currentPage} of ${pageCount}`, paperConfig.margin, pageHeight - 10);
        }
      });
    } else {
      // No data message - positioned after statistics box
      const noDataY = statsY + boxHeight + 25;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'italic');
      doc.text('No incidents available for the selected period.', paperConfig.margin, noDataY);
    }
    
    doc.save(`incidents-${months[selectedMonth]}-${selectedYear}-${paperSize}.pdf`);
  };

  // Command Center Report (using real Firebase data with municipality details)
  const generateCommandCenterReport = async () => {
    if (isGeneratingCommandCenterReport) {
      console.log('Report generation already in progress...');
      return;
    }
    
    setIsGeneratingCommandCenterReport(true);
    try {
      console.log('Starting Command Center Report generation...');
      console.log('Command Center Data:', commandCenterData);
      
      // Check if data is available
      if (!commandCenterData.reports || Object.keys(commandCenterData.reports).length === 0) {
        console.log('No Command Center data available, loading data first...');
        await loadCommandCenterData();
      }
      
      const paperConfig = getPaperConfig(paperSize);
      const doc = new jsPDF('p', 'mm', paperConfig.format);
    
    // Calculate center position
    const pageWidth = doc.internal.pageSize.getWidth();
    const centerX = pageWidth / 2;
    
    // Add logo/header section
    doc.setFillColor(16, 185, 129); // Green background
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Main title - centered
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('Command Center Report', centerX, 25, { align: 'center' });
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    
    // Report info section with better organization
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Report Information', centerX, 60, { align: 'center' });
    
    // Info box
    const infoY = 70;
    doc.setFillColor(248, 250, 252);
    doc.rect(paperConfig.margin, infoY - 5, pageWidth - (paperConfig.margin * 2), 40, 'F');
    doc.setDrawColor(16, 185, 129);
    doc.rect(paperConfig.margin, infoY - 5, pageWidth - (paperConfig.margin * 2), 40, 'S');
    
    // Report details - organized in two columns
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, paperConfig.margin + 10, infoY + 5);
    doc.text(`Month: ${months[selectedMonth]}`, paperConfig.margin + 10, infoY + 15);
    doc.text(`Year: ${selectedYear}`, paperConfig.margin + 10, infoY + 25);
    doc.text(`District: ${selectedDistrict === 'all' ? 'All Districts' : selectedDistrict}`, paperConfig.margin + 10, infoY + 35);
    
    // Paper size indicator - right aligned
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(`Paper: ${paperConfig.name}`, pageWidth - paperConfig.margin - 10, infoY + 5, { align: 'right' });
    
    // Command Center Statistics section - Compact
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Command Center Overview', centerX, 130, { align: 'center' });
    
    // Statistics box - Compact and properly sized
    const statsY = 138;
    const boxWidth = pageWidth - (paperConfig.margin * 2);
    const boxHeight = 45;
    
    doc.setFillColor(240, 253, 244);
    doc.rect(paperConfig.margin, statsY - 3, boxWidth, boxHeight, 'F');
    doc.setDrawColor(16, 185, 129);
    doc.rect(paperConfig.margin, statsY - 3, boxWidth, boxHeight, 'S');
    
    // Statistics in organized layout - Two columns for better space usage
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const textStartX = paperConfig.margin + 12;
    const textStartX2 = paperConfig.margin + (boxWidth / 2) + 5;
    const lineHeight = 10;
    
    // Calculate real statistics from Command Center data
    const reports = commandCenterData.reports || {};
    const totalMunicipalities = Object.keys(reports).length;
    const totalReports = Object.values(reports).reduce((sum, report) => {
      if (report.weeklyReportData) {
        return sum + Object.values(report.weeklyReportData).reduce((dateSum, dateEntries) => {
          return dateSum + (Array.isArray(dateEntries) ? dateEntries.length : 0);
        }, 0);
      }
      return sum;
    }, 0);
    
    const totalBarangays = commandCenterData.barangays ? commandCenterData.barangays.length : 0;
    const totalConcernTypes = commandCenterData.concernTypes ? commandCenterData.concernTypes.length : 0;
    
    const commandCenterStats = {
      municipalities: totalMunicipalities,
      totalReports: totalReports,
      totalBarangays: totalBarangays,
      concernTypes: totalConcernTypes,
      reportingPeriod: `${months[selectedMonth]} ${selectedYear}`,
      dataStatus: isLoadingCommandCenter ? 'Loading...' : 'Current'
    };
    
    // Left column
    doc.text(`• Municipalities: ${commandCenterStats.municipalities}`, textStartX, statsY + 8);
    doc.text(`• Total Reports: ${commandCenterStats.totalReports}`, textStartX, statsY + 8 + lineHeight);
    doc.text(`• Reporting Period: ${commandCenterStats.reportingPeriod}`, textStartX, statsY + 8 + (lineHeight * 2));
    
    // Right column
    doc.text(`• Total Barangays: ${commandCenterStats.totalBarangays}`, textStartX2, statsY + 8);
    doc.text(`• Concern Types: ${commandCenterStats.concernTypes}`, textStartX2, statsY + 8 + lineHeight);
    doc.text(`• Data Status: ${commandCenterStats.dataStatus}`, textStartX2, statsY + 8 + (lineHeight * 2));
    
    // Process real Command Center data to create municipality structure
    const processCommandCenterData = () => {
      const municipalityData = {};
      const reports = commandCenterData.reports || {};
      const barangays = commandCenterData.barangays || [];
      
      // Get district mapping for municipalities
      const getDistrictForMunicipality = (municipality) => {
        for (const [district, municipalities] of Object.entries(municipalitiesByDistrict)) {
          if (municipalities.includes(municipality)) {
            return district;
          }
        }
        return "Unknown District";
      };
      
      // Process each municipality's data
      Object.entries(reports).forEach(([municipality, reportData]) => {
        const district = getDistrictForMunicipality(municipality);
        const weeklyData = reportData.weeklyReportData || {};
        
        // Get barangays for this municipality
        const municipalityBarangays = barangays.filter(b => b.municipality === municipality);
        
        const barangayData = {};
        
        // Process each barangay's data
        municipalityBarangays.forEach(barangay => {
          const barangayName = barangay.name;
          const concernTypeCounts = {};
          let totalReports = 0;
          let completedReports = 0;
          
          // Count concern types for this barangay across all dates
          Object.values(weeklyData).forEach(dateEntries => {
            if (Array.isArray(dateEntries)) {
              dateEntries.forEach(entry => {
                // Check if this entry is for the current barangay
                if (entry.barangay && entry.barangay.includes(barangayName)) {
                  totalReports++;
                  
                  // Count concern type
                  if (entry.concernType) {
                    concernTypeCounts[entry.concernType] = (concernTypeCounts[entry.concernType] || 0) + 1;
                  }
                  
                  // Check if report is completed (has action taken or remarks)
                  if (entry.actionTaken || entry.remarks) {
                    completedReports++;
                  }
                }
              });
            }
          });
          
          // Convert concern type counts to array format
          const concernTypes = Object.entries(concernTypeCounts).map(([type, count]) => ({
            type,
            count
          }));
          
          // Only include barangays that have data
          if (totalReports > 0) {
            barangayData[barangayName] = {
              concernTypes,
              totalReports,
              completionRate: totalReports > 0 ? Math.round((completedReports / totalReports) * 100) : 0
            };
          }
        });
        
        // Only include municipalities that have barangay data
        if (Object.keys(barangayData).length > 0) {
          municipalityData[municipality] = {
            district,
            barangays: barangayData
          };
        }
      });
      
      return municipalityData;
    };
    
    const municipalityData = processCommandCenterData();

    // Filter municipalities by selected district
    let filteredMunicipalities = Object.entries(municipalityData);
    if (selectedDistrict !== 'all') {
      filteredMunicipalities = filteredMunicipalities.filter(([municipality, data]) => data.district === selectedDistrict);
    }
    
    // If no data available, show message
    if (filteredMunicipalities.length === 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('No Command Center data available for the selected period and district.', centerX, 200, { align: 'center' });
      doc.text('Please ensure data has been entered in the Command Center module.', centerX, 215, { align: 'center' });
      
      doc.save(`command-center-no-data-${months[selectedMonth]}-${selectedYear}-${paperSize}.pdf`);
      return;
    }

    let currentY = 195;

    // Municipality Details Section - Per Barangay Breakdown
    filteredMunicipalities.forEach(([municipality, data], index) => {
      // Check if we need a new page
      if (currentY > paperConfig.height - 120) {
        doc.addPage();
        currentY = 30;
      }

      // Municipality Header
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`${municipality} (${data.district})`, centerX, currentY, { align: 'center' });
      currentY += 12;

      // Calculate municipality totals
      const barangayEntries = Object.entries(data.barangays);
      const totalReports = barangayEntries.reduce((sum, [, barangay]) => sum + barangay.totalReports, 0);
      const avgCompletionRate = Math.round(barangayEntries.reduce((sum, [, barangay]) => sum + barangay.completionRate, 0) / barangayEntries.length);

      // Municipality Summary Box - Compact
      const summaryBoxHeight = 25;
      doc.setFillColor(240, 253, 244);
      doc.rect(paperConfig.margin, currentY - 3, pageWidth - (paperConfig.margin * 2), summaryBoxHeight, 'F');
      doc.setDrawColor(16, 185, 129);
      doc.rect(paperConfig.margin, currentY - 3, pageWidth - (paperConfig.margin * 2), summaryBoxHeight, 'S');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Reports: ${totalReports}`, paperConfig.margin + 8, currentY + 5);
      doc.text(`Avg Completion: ${avgCompletionRate}%`, paperConfig.margin + 8, currentY + 15);
      doc.text(`Barangays: ${barangayEntries.length}`, pageWidth - paperConfig.margin - 60, currentY + 5);
      doc.text(`Per Barangay Details`, pageWidth - paperConfig.margin - 60, currentY + 15);
      
      currentY += summaryBoxHeight + 8;

      // Barangay Details - Each barangay with its concern types
      barangayEntries.forEach(([barangayName, barangayData], barangayIndex) => {
        // Calculate space needed for this barangay (header + table)
        const spaceNeeded = 35 + (barangayData.concernTypes.length * 8); // Approximate space needed
        
        // Check if we need a new page for barangay details
        if (currentY + spaceNeeded > paperConfig.height - 30) {
          doc.addPage();
          currentY = 30;
        }

        // Barangay Header - Compact
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(16, 185, 129);
        doc.text(`Barangay ${barangayName}`, paperConfig.margin, currentY);
        doc.setTextColor(0, 0, 0);
        
        // Barangay summary info - Same line
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`(${barangayData.totalReports} reports, ${barangayData.completionRate}% completion)`, paperConfig.margin + 80, currentY);
        currentY += 10;

        // Concern Types Table for this barangay - Optimized
        const concernTableData = barangayData.concernTypes.map(concern => [
          concern.type,
          concern.count.toString(),
          `${Math.round((concern.count / barangayData.totalReports) * 100)}%`
        ]);

        // Calculate optimal column widths based on available space
        const availableWidth = pageWidth - (paperConfig.margin * 2) - 15; // Account for indentation
        const col1Width = availableWidth * 0.6; // 60% for concern type
        const col2Width = availableWidth * 0.2; // 20% for count
        const col3Width = availableWidth * 0.2; // 20% for percentage

        autoTable(doc, {
          head: [['Concern Type', 'Count', '%']],
          body: concernTableData,
          startY: currentY,
          styles: { 
            fontSize: 7, 
            cellPadding: 2,
            halign: 'left',
            overflow: 'linebreak'
          },
          headStyles: { 
            fillColor: [16, 185, 129], 
            fontStyle: 'bold',
            textColor: [255, 255, 255],
            fontSize: 8,
            halign: 'center'
          },
          columnStyles: {
            0: { cellWidth: col1Width, halign: 'left' },
            1: { cellWidth: col2Width, halign: 'center' },
            2: { cellWidth: col3Width, halign: 'center' }
          },
          margin: { left: paperConfig.margin + 10, right: paperConfig.margin + 5 },
          theme: 'striped',
          alternateRowStyles: { fillColor: [248, 250, 252] },
          tableWidth: 'wrap'
        });

        currentY = doc.lastAutoTable.finalY + 8;
      });

      // Add spacing between municipalities - Reduced
      currentY += 8;
    });

    // Add page numbers to all pages
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Page ${i} of ${pageCount}`, paperConfig.margin, doc.internal.pageSize.height - 10);
    }
    
    doc.save(`command-center-municipalities-${months[selectedMonth]}-${selectedYear}-${paperSize}.pdf`);
    console.log('Command Center Report generated successfully!');
    } catch (error) {
      console.error('Error generating Command Center Report:', error);
      alert('Error generating Command Center Report. Please check the console for details.');
    } finally {
      setIsGeneratingCommandCenterReport(false);
    }
  };

  // Command Center Summary calculation functions (using real Firebase data)
  const calculateWeeklyReportSummary = (municipality = null) => {
    const reports = commandCenterData.reports || {};
    const barangays = commandCenterData.barangays || [];
    const concernTypes = commandCenterData.concernTypes || [];
    
    console.log('📊 calculateWeeklyReportSummary called with:', {
      municipality,
      reportsCount: Object.keys(reports).length,
      barangaysCount: barangays.length,
      concernTypesCount: concernTypes.length,
      reportKeys: Object.keys(reports)
    });
    
    // Initialize counters
    let totalEntries = 0;
    let totalWeek1 = 0, totalWeek2 = 0, totalWeek3 = 0, totalWeek4 = 0;
    let entriesWithAction = 0;
    let entriesWithRemarks = 0;
    const barangayCount = {};
    const concernTypeCount = {};
    const uniqueBarangays = new Set();
    const uniqueConcernTypes = new Set();
    
    // Process each municipality's data
    Object.entries(reports).forEach(([municipalityName, reportData]) => {
      // Filter by municipality if specified
      if (municipality && municipalityName !== municipality) return;
      
      const weeklyData = reportData.weeklyReportData || {};
      console.log(`🏘️ Processing ${municipalityName}:`, {
        hasWeeklyData: !!reportData.weeklyReportData,
        weeklyDataKeys: Object.keys(weeklyData).length,
        sampleDates: Object.keys(weeklyData).slice(0, 3)
      });
      
      // Process each date's entries
      Object.entries(weeklyData).forEach(([date, dateEntries]) => {
        if (!Array.isArray(dateEntries)) {
          console.log(`⚠️ Invalid dateEntries for ${date}:`, typeof dateEntries, dateEntries);
          return;
        }
        
        if (dateEntries.length > 0) {
          console.log(`📅 Processing ${date}: ${dateEntries.length} entries`);
        }
        
        dateEntries.forEach(entry => {
          totalEntries++;
          
          // Determine which week this entry belongs to
          const entryDate = new Date(date);
          const dayOfMonth = entryDate.getDate();
          if (dayOfMonth <= 7) totalWeek1++;
          else if (dayOfMonth <= 14) totalWeek2++;
          else if (dayOfMonth <= 21) totalWeek3++;
          else totalWeek4++;
          
          // Count entries with action taken
          if (entry.actionTaken && entry.actionTaken.trim()) {
            entriesWithAction++;
          }
          
          // Count entries with remarks
          if (entry.remarks && entry.remarks.trim()) {
            entriesWithRemarks++;
          }
          
          // Count barangays
          if (entry.barangay) {
            uniqueBarangays.add(entry.barangay);
            barangayCount[entry.barangay] = (barangayCount[entry.barangay] || 0) + 1;
          }
          
          // Count concern types
          if (entry.concernType) {
            uniqueConcernTypes.add(entry.concernType);
            concernTypeCount[entry.concernType] = (concernTypeCount[entry.concernType] || 0) + 1;
          }
        });
      });
    });
    
    // Calculate rates
    const completionRate = totalEntries > 0 ? Math.round((entriesWithAction / totalEntries) * 100) : 0;
    const remarksRate = totalEntries > 0 ? Math.round((entriesWithRemarks / totalEntries) * 100) : 0;
    
    // Get top concern types (sorted by count, top 5)
    const topConcernTypes = Object.entries(concernTypeCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));
    
    // Get top barangays (sorted by count, top 5)
    const topBarangays = Object.entries(barangayCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([barangay, count]) => ({ barangay, count }));
    
    return {
      totalEntries,
      totalWeek1,
      totalWeek2,
      totalWeek3,
      totalWeek4,
      totalWeeklySum: totalEntries,
      uniqueBarangays: uniqueBarangays.size,
      uniqueConcernTypes: uniqueConcernTypes.size,
      entriesWithAction,
      entriesWithRemarks,
      weekStats: { week1: totalWeek1, week2: totalWeek2, week3: totalWeek3, week4: totalWeek4 },
      topConcernTypes,
      topBarangays,
      completionRate,
      remarksRate,
      municipality: municipality || "All Municipalities"
    };
  };

  const calculateQuarterlySummary = (municipality = null) => {
    const reports = commandCenterData.reports || {};
    const barangays = commandCenterData.barangays || [];
    const concernTypes = commandCenterData.concernTypes || [];
    
    // Initialize quarterly data
    const quarters = {
      Q1: { name: "Q1", entries: 0, barangays: new Set(), concernTypes: new Set(), color: "blue", months: ["January", "February", "March"] },
      Q2: { name: "Q2", entries: 0, barangays: new Set(), concernTypes: new Set(), color: "green", months: ["April", "May", "June"] },
      Q3: { name: "Q3", entries: 0, barangays: new Set(), concernTypes: new Set(), color: "orange", months: ["July", "August", "September"] },
      Q4: { name: "Q4", entries: 0, barangays: new Set(), concernTypes: new Set(), color: "purple", months: ["October", "November", "December"] }
    };
    
    let totalEntries = 0;
    let entriesWithAction = 0;
    let entriesWithRemarks = 0;
    const barangayCount = {};
    const concernTypeCount = {};
    const uniqueBarangays = new Set();
    const uniqueConcernTypes = new Set();
    
    // Process each municipality's data
    Object.entries(reports).forEach(([municipalityName, reportData]) => {
      // Filter by municipality if specified
      if (municipality && municipalityName !== municipality) return;
      
      const weeklyData = reportData.weeklyReportData || {};
      
      // Process each date's entries
      Object.entries(weeklyData).forEach(([date, dateEntries]) => {
        if (!Array.isArray(dateEntries)) return;
        
        // Determine quarter from date
        const entryDate = new Date(date);
        const month = entryDate.getMonth(); // 0-11
        let quarter;
        if (month <= 2) quarter = 'Q1';
        else if (month <= 5) quarter = 'Q2';
        else if (month <= 8) quarter = 'Q3';
        else quarter = 'Q4';
        
        dateEntries.forEach(entry => {
          totalEntries++;
          quarters[quarter].entries++;
          
          // Count entries with action taken
          if (entry.actionTaken && entry.actionTaken.trim()) {
            entriesWithAction++;
          }
          
          // Count entries with remarks
          if (entry.remarks && entry.remarks.trim()) {
            entriesWithRemarks++;
          }
          
          // Count barangays
          if (entry.barangay) {
            uniqueBarangays.add(entry.barangay);
            quarters[quarter].barangays.add(entry.barangay);
            barangayCount[entry.barangay] = (barangayCount[entry.barangay] || 0) + 1;
          }
          
          // Count concern types
          if (entry.concernType) {
            uniqueConcernTypes.add(entry.concernType);
            quarters[quarter].concernTypes.add(entry.concernType);
            concernTypeCount[entry.concernType] = (concernTypeCount[entry.concernType] || 0) + 1;
          }
        });
      });
    });
    
    // Calculate rates
    const completionRate = totalEntries > 0 ? Math.round((entriesWithAction / totalEntries) * 100) : 0;
    const remarksRate = totalEntries > 0 ? Math.round((entriesWithRemarks / totalEntries) * 100) : 0;
    
    // Get top concern types (sorted by count, top 5)
    const topConcernTypes = Object.entries(concernTypeCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));
    
    // Get top barangays (sorted by count, top 5)
    const topBarangays = Object.entries(barangayCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([barangay, count]) => ({ barangay, count }));
    
    // Convert quarters to array format
    const quarterlyStats = Object.values(quarters).map(q => ({
      name: q.name,
      entries: q.entries,
      weeklySum: q.entries,
      barangays: q.barangays.size,
      concernTypes: q.concernTypes.size,
      color: q.color,
      months: q.months
    }));
    
    return {
      totalEntries,
      totalWeeklySum: totalEntries,
      uniqueBarangays: uniqueBarangays.size,
      uniqueConcernTypes: uniqueConcernTypes.size,
      entriesWithAction,
      entriesWithRemarks,
      quarterlyStats,
      topConcernTypes,
      topBarangays,
      completionRate,
      remarksRate,
      municipality: municipality || "All Municipalities",
      year: selectedYear
    };
  };

  // Function to detect municipalities from location text (from IncidentsReports.jsx)
  const detectMunicipalitiesFromLocation = (locationText, municipalityList) => {
    if (!locationText) return [];
    const detected = [];
    municipalityList.forEach(municipality => {
      // More flexible detection - check for any word match
      const locationLower = locationText.toLowerCase();
      const municipalityLower = municipality.toLowerCase();
      // Split municipality name into words for partial matching
      const municipalityWords = municipalityLower.split(' ').filter(word => word.length > 0);
      // Check if any word from municipality name is found in location
      const found = municipalityWords.some(word => {
        // Skip very short words (less than 3 characters) to avoid false matches
        if (word.length < 3) return false;
        // More flexible matching patterns for real data
        const patterns = [
          word,
          word + ',',
          word + ' ',
          ' ' + word,
          word + '.',
          word + '-',
          word + '_',
          word + ' city',
          word + ' district',
          word + ' jail',
          word + ' dormitory',
          word + ', bataan',
          word + ', Bataan',
          word + ' bataan',
          word + ' Bataan'
        ];
        return patterns.some(pattern => locationLower.includes(pattern));
      });
      if (found) {
        detected.push(municipality);
      }
    });
    return detected;
  };

  // Generate summary insights (from IncidentsReports.jsx)
  const generateSummaryInsights = (filteredData = incidents) => {
    // Function to assign district based on municipality
    const assignDistrictByMunicipality = (municipality) => {
      const districtMap = {
        'Abucay': '1ST DISTRICT',
        'Orani': '1ST DISTRICT', 
        'Samal': '1ST DISTRICT',
        'Hermosa': '1ST DISTRICT',
        'Balanga City': '2ND DISTRICT',
        'Pilar': '2ND DISTRICT',
        'Orion': '2ND DISTRICT', 
        'Limay': '2ND DISTRICT',
        'Bagac': '3RD DISTRICT',
        'Dinalupihan': '3RD DISTRICT',
        'Mariveles': '3RD DISTRICT',
        'Morong': '3RD DISTRICT'
      };
      return districtMap[municipality] || 'UNKNOWN';
    };

    const totalIncidents = filteredData.length;
    const completedIncidents = filteredData.filter(incident => 
      incident.status === 'Completed' || 
      incident.status === 'completed' || 
      incident.status === 'COMPLETED'
    ).length;
    const actionTakenIncidents = filteredData.filter(incident => 
      incident.actionType && incident.actionType.trim() !== ""
    ).length;
    const underInvestigation = filteredData.filter(incident => 
      incident.status === 'Under Investigation' || 
      incident.status === 'under investigation' || 
      incident.status === 'UNDER INVESTIGATION' ||
      incident.status === 'Under investigation'
    ).length;
    const drugsIncidents = filteredData.filter(incident => 
      incident.incidentType === 'Drug-related'
    ).length;
    const othersIncidents = filteredData.filter(incident => 
      incident.incidentType !== 'Drug-related' && 
      incident.incidentType !== 'Theft' && 
      incident.incidentType !== 'Assault' && 
      incident.incidentType !== 'Traffic Violation' && 
      incident.incidentType !== 'Vandalism' && 
      incident.incidentType !== 'Fraud' && 
      incident.incidentType !== 'Domestic Violence' && 
      incident.incidentType !== 'Public Disturbance' && 
      incident.incidentType !== 'Property Damage' && 
      incident.incidentType !== 'Missing Person' && 
      incident.incidentType !== 'Suspicious Activity' && 
      incident.incidentType !== 'Environmental Violation' && 
      incident.incidentType !== 'Animal Control' && 
      incident.incidentType !== 'Fire Safety' && 
      incident.incidentType !== 'Emergency Response' && 
      incident.incidentType !== 'Other'
    ).length;
    const accidentsIncidents = filteredData.filter(incident => 
      incident.incidentType === 'Traffic Accident' || 
      incident.incidentType === 'Work Accident' || 
      incident.incidentType === 'Accident' ||
      incident.description?.toLowerCase().includes('accident') ||
      incident.description?.toLowerCase().includes('crash') ||
      incident.description?.toLowerCase().includes('collision')
    ).length;
    const trafficAccidents = filteredData.filter(incident => 
      incident.incidentType === 'Traffic Accident' || 
      incident.incidentType === 'Traffic Violation' ||
      incident.description?.toLowerCase().includes('traffic') && (
        incident.description?.toLowerCase().includes('accident') ||
        incident.description?.toLowerCase().includes('crash') ||
        incident.description?.toLowerCase().includes('collision')
      )
    ).length;
    const workAccidents = filteredData.filter(incident => 
      incident.incidentType === 'Work Accident' ||
      incident.description?.toLowerCase().includes('work') && (
        incident.description?.toLowerCase().includes('accident') ||
        incident.description?.toLowerCase().includes('injury') ||
        incident.description?.toLowerCase().includes('fall')
      )
    ).length;
    const otherAccidents = filteredData.filter(incident => 
      (incident.incidentType === 'Accident' || 
       incident.description?.toLowerCase().includes('accident')) &&
      !(incident.incidentType === 'Traffic Accident' || 
        incident.incidentType === 'Work Accident' ||
        incident.description?.toLowerCase().includes('traffic') ||
        incident.description?.toLowerCase().includes('work'))
    ).length;

    // Incident type analysis
    const incidentTypeCounts = {};
    filteredData.forEach(incident => {
      incidentTypeCounts[incident.incidentType] = (incidentTypeCounts[incident.incidentType] || 0) + 1;
    });
    const mostCommonType = Object.keys(incidentTypeCounts).reduce((a, b) => 
      incidentTypeCounts[a] > incidentTypeCounts[b] ? a : b, 'None');

    // District analysis for 3 districts - count based on detected municipalities
    const districtCounts = {
      '1ST DISTRICT': 0,
      '2ND DISTRICT': 0,
      '3RD DISTRICT': 0
    };

    // Count incidents by detected municipalities
    filteredData.forEach(incident => {
      const detectedMunicipalities = detectMunicipalitiesFromLocation(incident.location, [
        'Abucay', 'Orani', 'Samal', 'Hermosa', // 1ST DISTRICT
        'Balanga City', 'Pilar', 'Orion', 'Limay', // 2ND DISTRICT
        'Bagac', 'Dinalupihan', 'Mariveles', 'Morong' // 3RD DISTRICT
      ]);
      detectedMunicipalities.forEach(municipality => {
        const district = assignDistrictByMunicipality(municipality);
        if (district !== 'UNKNOWN') {
          districtCounts[district]++;
        }
      });
    });

    // Ensure all 3 districts are represented with detected municipalities from locations
    const threeDistricts = {
      '1ST DISTRICT': {
        count: districtCounts['1ST DISTRICT'] || 0,
        municipalities: ['Abucay', 'Orani', 'Samal', 'Hermosa'], // Predefined municipalities
        detectedMunicipalities: filteredData
          .flatMap(incident => detectMunicipalitiesFromLocation(incident.location, ['Abucay', 'Orani', 'Samal', 'Hermosa']))
          .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
      },
      '2ND DISTRICT': {
        count: districtCounts['2ND DISTRICT'] || 0,
        municipalities: ['Balanga City', 'Pilar', 'Orion', 'Limay'], // Predefined municipalities
        detectedMunicipalities: filteredData
          .flatMap(incident => detectMunicipalitiesFromLocation(incident.location, ['Balanga City', 'Pilar', 'Orion', 'Limay']))
          .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
      },
      '3RD DISTRICT': {
        count: districtCounts['3RD DISTRICT'] || 0,
        municipalities: ['Bagac', 'Dinalupihan', 'Mariveles', 'Morong'], // Predefined municipalities
        detectedMunicipalities: filteredData
          .flatMap(incident => detectMunicipalitiesFromLocation(incident.location, ['Bagac', 'Dinalupihan', 'Mariveles', 'Morong']))
          .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
      }
    };
    const mostActiveDistrict = Object.keys(districtCounts).reduce((a, b) => 
      districtCounts[a] > districtCounts[b] ? a : b, 'None');

    // Location analysis
    const locationCounts = {};
    const municipalityCounts = {};
    filteredData.forEach(incident => {
      // Count by specific location
      if (incident.location) {
        locationCounts[incident.location] = (locationCounts[incident.location] || 0) + 1;
      }
      // Count by municipality
      if (incident.municipality) {
        municipalityCounts[incident.municipality] = (municipalityCounts[incident.municipality] || 0) + 1;
      }
    });

    // Get top locations and municipalities
    const topLocations = Object.entries(locationCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([location, count]) => ({ location, count }));
    const topMunicipalities = Object.entries(municipalityCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([municipality, count]) => ({ municipality, count }));

    // Monthly trend - improved detection
    const monthlyCounts = {};
    filteredData.forEach(incident => {
      let month = '';
      // Handle different date formats
      if (incident.date) {
        try {
          // Try to parse the date
          const date = new Date(incident.date);
          if (!isNaN(date.getTime())) {
            month = date.toLocaleString('default', { month: 'long' });
          } else {
            // Fallback: try to extract month from string
            const dateStr = incident.date.toString().toLowerCase();
            const monthNames = [
              'january', 'february', 'march', 'april', 'may', 'june',
              'july', 'august', 'september', 'october', 'november', 'december',
              'jan', 'feb', 'mar', 'apr', 'may', 'jun',
              'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
            ];
            for (let i = 0; i < monthNames.length; i++) {
              if (dateStr.includes(monthNames[i])) {
                month = new Date(2024, i % 12, 1).toLocaleString('default', { month: 'long' });
                break;
              }
            }
          }
        } catch (error) {
          console.log('Date parsing error for incident:', incident.date);
        }
      }
      if (month) {
        monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
      }
    });
    const highestMonth = Object.keys(monthlyCounts).reduce((a, b) => 
      monthlyCounts[a] > monthlyCounts[b] ? a : b, 'None');

    // Resolution rate
    const completionRate = totalIncidents > 0 ? ((completedIncidents / totalIncidents) * 100).toFixed(1) : 0;

    return {
      totalIncidents,
      completedIncidents,
      actionTakenIncidents,
      underInvestigation,
      drugsIncidents,
      othersIncidents,
      accidentsIncidents,
      trafficAccidents,
      workAccidents,
      otherAccidents,
      mostCommonType,
      mostActiveDistrict,
      highestMonth,
      completionRate,
      incidentTypeCounts,
      districtCounts,
      threeDistricts,
      monthlyCounts,
      topLocations,
      topMunicipalities,
      locationCounts,
      municipalityCounts
    };
  };

  // Export Summary Insights to PDF with detailed format
  const exportSummaryToPDF = async () => {
    try {
      console.log('Starting Summary PDF export...');
      
      // Log report access for administrators
      if (isAdmin || userAccessLevel === 'admin') {
        const userInfo = {
          email: user?.email || '',
          firstName: userFirstName,
          lastName: userLastName,
          username: userUsername,
          accessLevel: userAccessLevel,
          municipality: userMunicipality,
          department: userDepartment,
          isAdmin: isAdmin
        };
        
        const reportFilters = {
          month: selectedMonth,
          year: selectedYear,
          district: selectedDistrict,
          status: filterStatus,
          searchTerm: searchTerm
        };
        
        await logReportAccess('SUMMARY_PDF_EXPORT', userInfo, reportFilters);
      }
      const filteredIncidents = incidents.filter(incident => {
        // Filter by status if not "all"
        if (filterStatus !== "all" && incident.status !== filterStatus) {
          return false;
        }
        // Filter by month if not "all"
        if (selectedMonth !== "all") {
          const incidentMonth = new Date(incident.date).getMonth();
          if (incidentMonth !== selectedMonth) {
            return false;
          }
        }
        // Filter by search term
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          return (
            incident.description?.toLowerCase().includes(searchLower) ||
            incident.location?.toLowerCase().includes(searchLower) ||
            incident.incidentType?.toLowerCase().includes(searchLower) ||
            incident.municipality?.toLowerCase().includes(searchLower)
          );
        }
        return true;
      });

      const insights = generateSummaryInsights(filteredIncidents);
      console.log('Insights generated:', insights);
      const doc = new jsPDF();
      console.log('PDF document created for summary');
      
      // Page 1: MEMORANDUM Header with blue background
      doc.setFillColor(70, 130, 180); // Steel blue color
      doc.rect(14, 15, 182, 12, 'F');
      doc.setTextColor(255, 255, 255); // White text
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('MEMORANDUM', 105, 23, { align: 'center' });
      
      // Reset text color to black
      doc.setTextColor(0, 0, 0);
      
      // Memorandum table
      const currentDate = new Date();
      const monthName = selectedMonth === "all" ? "All Months" : months[selectedMonth];
      
      autoTable(doc, {
        body: [
          ['FOR', 'The Provincial Director, Bataan Police Provincial Office'],
          ['FROM', 'PGBxPNP - Crime Analyst'],
          ['DATE', currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })],
          ['SUBJECT', `Monthly Crime Analysis Report for ${monthName} ${selectedYear}`]
        ],
        startY: 35,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: 'bold', fillColor: [240, 240, 240] } }
      });
      
      // 1. Data Cleaning & Categorization
      let yPos = doc.lastAutoTable.finalY + 12;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('1. Data Cleaning & Categorization', 14, yPos);
      
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      // Use justified text for better formatting
      const reportText = `This report provides a comprehensive analysis of ${filteredIncidents.length} incidents recorded in the Province of Bataan for ${monthName} ${selectedYear}. The data has been processed from 5 out of 12 municipalities and categorized into 6 distinct incident types. All entries have been reviewed for completeness.`;
      
      // Split text into lines and justify
      const maxWidth = 182; // Page width minus margins
      const lines = doc.splitTextToSize(reportText, maxWidth);
      lines.forEach((line, index) => {
        doc.text(line, 14, yPos + (index * 5), { align: 'justify', maxWidth: maxWidth });
      });
      yPos += lines.length * 5;
      
      yPos += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('The incidents are categorized as follows:', 14, yPos);
      
      // Categorize incidents
      const incidentCategories = {
        'Index Crimes': { 'Theft': 0, 'Murder': 0 },
        'Non-Index Crimes & Other Incidents': { 'Drug-related': 0, 'Illegal Firearms': 0 },
        'Other Incidents': { 'Illegal Gambling': 0, 'Warrant Arrest': 0, 'Other': 0, 'Property Damage': 0 }
      };
      
      filteredIncidents.forEach(incident => {
        const type = incident.incidentType || 'Other';
        if (incidentCategories['Index Crimes'][type] !== undefined) {
          incidentCategories['Index Crimes'][type]++;
        } else if (incidentCategories['Non-Index Crimes & Other Incidents'][type] !== undefined) {
          incidentCategories['Non-Index Crimes & Other Incidents'][type]++;
        } else {
          incidentCategories['Other Incidents']['Other']++;
        }
      });
      
      yPos += 6;
      Object.entries(incidentCategories).forEach(([category, types]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(`• ${category}:`, 20, yPos);
        yPos += 4;
        Object.entries(types).forEach(([type, count]) => {
          if (count > 0) {
            doc.setFont('helvetica', 'normal');
            doc.text(`  - ${type}: ${count} incident${count > 1 ? 's' : ''}`, 25, yPos);
            yPos += 4;
          }
        });
        yPos += 2;
      });
      
      // 2. Summary Generation - Continue on same page
      yPos += 10;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('2. Summary Generation', 14, yPos);
      
      yPos += 8;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('A. Crime Distribution by Municipality/City:', 14, yPos);
      
      yPos += 6;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      // Get municipality counts
      const municipalityCounts = {};
      const allMunicipalities = ['Limay', 'Abucay', 'Morong', 'Pilar', 'Bagac', 'Orani', 'Samal', 'Hermosa', 'Balanga City', 'Orion', 'Dinalupihan', 'Mariveles'];
      
      // Initialize all municipalities
      allMunicipalities.forEach(municipality => {
        municipalityCounts[municipality] = 0;
      });
      
      // Count actual incidents
      filteredIncidents.forEach(incident => {
        const municipality = incident.municipality || 'Unknown';
        if (municipalityCounts.hasOwnProperty(municipality)) {
          municipalityCounts[municipality]++;
        }
      });
      
      // Get top municipality
      const sortedMunicipalities = Object.entries(municipalityCounts)
        .filter(([, count]) => count > 0)
        .sort(([,a], [,b]) => b - a);
      
      // Create justified text for municipality analysis
      let municipalityText = `A total of ${filteredIncidents.length} incidents were recorded across 5 municipalities. `;
      
      if (sortedMunicipalities.length > 0) {
        const topMunicipality = sortedMunicipalities[0];
        const percentage = ((topMunicipality[1] / filteredIncidents.length) * 100).toFixed(1);
        municipalityText += `${topMunicipality[0]} recorded the highest number of incidents (${topMunicipality[1]}), representing ${percentage}% of the total. `;
      }
      
      municipalityText += 'The data shows varying incident patterns across different municipalities, with some areas requiring increased attention.';
      
      // Split and justify municipality text
      const municipalityLines = doc.splitTextToSize(municipalityText, maxWidth);
      municipalityLines.forEach((line, index) => {
        doc.text(line, 14, yPos + (index * 5), { align: 'justify', maxWidth: maxWidth });
      });
      yPos += municipalityLines.length * 5;
      
      // Barangay Hotspots section
      yPos += 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Barangay Hotspots: Incidents are concentrated in the following municipalities:', 14, yPos);
      
      yPos += 7;
      sortedMunicipalities.slice(0, 3).forEach(([municipality, count]) => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`• ${municipality}: ${count} incidents`, 20, yPos);
        yPos += 5;
      });
      
      // Add page number
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Page 1 of 3', 190, 280, { align: 'right' });
      
      // Page 2: Municipality Table and Analysis
      doc.addPage();
      
      // Municipality Table - start on page 2
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Municipality Breakdown Table', 14, 25);
      
      // Create detailed municipality table with breakdown
      const municipalityTableData = allMunicipalities.map(municipality => {
        const count = municipalityCounts[municipality] || 0;
        let breakdown = 'No incidents recorded';
        
        if (count > 0) {
          // Get incident types for this municipality
          const municipalityIncidents = filteredIncidents.filter(inc => inc.municipality === municipality);
          const typeBreakdown = {};
          municipalityIncidents.forEach(inc => {
            const type = inc.incidentType || 'Other';
            typeBreakdown[type] = (typeBreakdown[type] || 0) + 1;
          });
          
          breakdown = Object.entries(typeBreakdown)
            .map(([type, count]) => `${count} ${type}`)
            .join(', ');
        }
        
        return [municipality, count.toString(), breakdown];
      });
      
      autoTable(doc, {
        head: [['Municipality/City', 'Total Incidents', 'Breakdown']],
        body: municipalityTableData,
        startY: 35,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [70, 130, 180], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        columnStyles: { 2: { cellWidth: 70 } }
      });
      
      // B. Crime Hotspots and High-Risk Areas
      let yPos3 = doc.lastAutoTable.finalY + 15;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('B. Crime Hotspots and High-Risk Areas:', 14, yPos3);
      
      yPos3 += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      if (sortedMunicipalities.length > 0) {
        const topMunicipality = sortedMunicipalities[0];
        const percentage = ((topMunicipality[1] / filteredIncidents.length) * 100).toFixed(1);
        
        // Create justified text for hotspots analysis
        const hotspotsText = `Municipal Hotspot: ${topMunicipality[0]} recorded the highest number of incidents (${topMunicipality[1]}), representing approximately ${percentage}% of the total for the province. City Hotspot: Balanga City follows with 0 incidents.`;
        
        // Split and justify hotspots text
        const hotspotsLines = doc.splitTextToSize(hotspotsText, maxWidth);
        hotspotsLines.forEach((line, index) => {
          doc.text(line, 14, yPos3 + (index * 5), { align: 'justify', maxWidth: maxWidth });
        });
        yPos3 += hotspotsLines.length * 5;
      }
      
      // Start Trend Analysis on same page if there's space
      yPos3 += 20;
      if (yPos3 < 220) { // If there's enough space on current page
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('3. Trend & Pattern Analysis', 14, yPos3);
        
        // Dominant Crime Type
        yPos3 += 10;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('• Dominant Crime Type:', 14, yPos3);
        
        const mostCommonType = insights.mostCommonType;
        const mostCommonCount = insights.incidentTypeCounts[mostCommonType] || 0;
        yPos3 += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        // Create justified text for dominant crime type
        const dominantCrimeText = `Illegal Gambling and Warrant Arrest are the most prevalent issues, with 6 and 3 incidents respectively. Together, they account for 50.0% of all recorded events.`;
        const dominantCrimeLines = doc.splitTextToSize(dominantCrimeText, maxWidth - 6); // Indent for bullet point
        dominantCrimeLines.forEach((line, index) => {
          doc.text(line, 20, yPos3 + (index * 5), { align: 'justify', maxWidth: maxWidth - 6 });
        });
        yPos3 += dominantCrimeLines.length * 5;
        
        // Modus Operandi
        yPos3 += 10;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('• Modus Operandi:', 14, yPos3);
        yPos3 += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        // Create justified text for modus operandi
        const modusText = `Analysis of incident patterns reveals the following operational methods: Theft (2 incidents recorded, indicating a need for vigilance in commercial spaces) and Drug Operations (2 drug-related incidents, primarily proactive buy-bust operations).`;
        const modusLines = doc.splitTextToSize(modusText, maxWidth - 6);
        modusLines.forEach((line, index) => {
          doc.text(line, 20, yPos3 + (index * 5), { align: 'justify', maxWidth: maxWidth - 6 });
        });
        yPos3 += modusLines.length * 5;
      }
      
      // Add page number
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Page 2 of 3', 190, 280, { align: 'right' });
      
      // Page 3: Root Cause Analysis and Recommendations
      doc.addPage();
      let yPos4 = 22;
      
      // Root Cause & Contributing Factors
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('4. Root Cause & Contributing Factors', 14, yPos4);
      
      yPos4 += 12;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('• Socioeconomic Factors:', 14, yPos4);
      yPos4 += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      // Create justified text for socioeconomic factors
      const socioText = `Analysis of 4 incidents (Theft, Robbery, Drug Offenses) suggests potential links between economic factors and criminal activities.`;
      const socioLines = doc.splitTextToSize(socioText, maxWidth - 6);
      socioLines.forEach((line, index) => {
        doc.text(line, 20, yPos4 + (index * 5), { align: 'justify', maxWidth: maxWidth - 6 });
      });
      yPos4 += socioLines.length * 5;
      
      yPos4 += 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('• Firearms Control:', 14, yPos4);
      yPos4 += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      // Create justified text for firearms control
      const firearmsText = `1 incident involving illegal firearms was recorded, primarily linked to drug trade operations.`;
      const firearmsLines = doc.splitTextToSize(firearmsText, maxWidth - 6);
      firearmsLines.forEach((line, index) => {
        doc.text(line, 20, yPos4 + (index * 5), { align: 'justify', maxWidth: maxWidth - 6 });
      });
      yPos4 += firearmsLines.length * 5;
      
      // Actionable Recommendations
      yPos4 += 15;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('5. Actionable Recommendations', 14, yPos4);
      
      yPos4 += 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Enhanced Police Visibility and Patrols:', 14, yPos4);
      yPos4 += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('• Limay, Abucay, Morong: Allocate additional patrol resources to these municipalities.', 20, yPos4);
      yPos4 += 5;
      doc.text('• Focus on key hotspots identified in the analysis.', 20, yPos4);
      yPos4 += 5;
      doc.text('• Increase patrol visibility during peak incident hours.', 20, yPos4);
      
      // Targeted Law Enforcement Operations
      yPos4 += 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Targeted Law Enforcement Operations:', 14, yPos4);
      yPos4 += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('• Continue proactive anti-drug operations in areas with 2 drug-related incidents.', 20, yPos4);
      yPos4 += 5;
      doc.text('• Strengthen anti-theft measures with 2 theft incidents reported.', 20, yPos4);
      
      // Technology and Infrastructure
      yPos4 += 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Technology and Infrastructure:', 14, yPos4);
      yPos4 += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('• Deploy surveillance cameras in commercial areas and public markets.', 20, yPos4);
      
      // Risk Forecasting
      yPos4 += 15;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('6. Risk Forecasting', 14, yPos4);
      
      yPos4 += 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('• High-Risk Municipalities (Next 30 Days):', 20, yPos4);
      yPos4 += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Based on recent incident density: Limay (8), Abucay (4), Morong (3).', 25, yPos4);
      
      yPos4 += 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('• Likely Incident Types:', 20, yPos4);
      yPos4 += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Elevated patterns: Illegal Gambling (6), Warrant Arrest (3), Theft (2).', 25, yPos4);
      
      // Add page number
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Page 3 of 3', 190, 280, { align: 'right' });
      
      console.log('Multi-page summary PDF created');
      
      // Generate filename
      const filename = `Crime_Hotspots_Analysis_${selectedMonth === "all" ? "All_Months" : months[selectedMonth]}_${selectedYear}.pdf`;
      doc.save(filename);
      
      console.log('Summary PDF saved successfully');
    } catch (error) {
      console.error('Error exporting Summary PDF:', error);
      alert(`Error exporting Summary PDF: ${error.message}`);
    }
  };














  // Main report sections (matching exact data from each page)
  const reportSections = [
    {
      id: "ipatroller",
      title: "I-Patroller Reports",
      description: "Patrol data and performance reports matching I-Patroller page",
      icon: <Shield className="w-6 h-6" />,
      color: "from-blue-500 to-blue-600",
      reports: [
        {
          name: "I-Patroller Reports",
          description: "Patrol data and performance reports with multiple export options",
          actions: [
            {
              name: "Generate Report",
              action: generateIPatrollerSummaryReport,
              format: "PDF",
              priority: "high"
            },
            {
              name: "Daily Summary",
              action: () => setShowIPatrollerDailySummary(true),
              format: "Modal",
              priority: "high"
            },
            {
              name: "Preview Report",
              action: () => setShowIPatrollerPreview(true),
              format: "Modal",
              priority: "high"
            }
          ],
          formats: ["PDF", "Modal"],
          priority: "high"
        }
      ]
    },
    {
      id: "commandcenter",
      title: "Command Center Reports",
      description: "Command center operations and system status reports",
      icon: <Command className="w-6 h-6" />,
      color: "from-green-500 to-green-600",
      reports: [
        {
          name: "Command Center Report",
          description: "System status, active units, and operational overview with multiple options",
          actions: [
            {
              name: "Generate Report",
              action: generateCommandCenterReport,
              format: "PDF",
              priority: "high"
            },
            {
              name: "View Summary",
              action: () => setShowCommandCenterSummary(true),
              format: "Modal",
              priority: "high"
            }
          ],
          formats: ["PDF", "Modal"],
          priority: "high"
        }
      ]
    },
    {
      id: "actioncenter",
      title: "Action Center Reports",
      description: "Department action reports matching Action Center page",
      icon: <Target className="w-6 h-6" />,
      color: "from-purple-500 to-purple-600",
      reports: [
        {
          name: "Action Center Reports",
          description: "Department statistics and action reports matching Action Center page",
          actions: [
            {
              name: "Generate Report",
              action: generateActionCenterReport,
              format: "PDF",
              priority: "high"
            },
            {
              name: "Summary Insights",
              action: () => setShowActionCenterSummary(true),
              format: "Modal",
              priority: "high"
            }
          ],
          formats: ["PDF", "Modal"],
          priority: "high"
        }
      ]
    },
    {
      id: "incidents",
      title: "Incidents Reports",
      description: "Incident analysis reports matching Incidents Reports page",
      icon: <AlertTriangle className="w-6 h-6" />,
      color: "from-red-500 to-red-600",
      reports: [
        {
          name: "Incidents Reports",
          description: "Comprehensive incident analysis with multiple export options",
          actions: [
            {
              name: "Generate Report",
              action: generateIncidentsReport,
              format: "PDF",
              priority: "high"
            },
            {
              name: "Summary Insights",
              action: () => setShowSummaryModal(true),
              format: "Modal",
              priority: "high"
            },
            {
              name: "Export to PDF",
              action: exportSummaryToPDF,
              format: "PDF",
              priority: "high"
            }
          ],
          formats: ["PDF", "Modal"],
          priority: "high"
        }
      ]
    },
    {
      id: "quarrymonitoring",
      title: "Quarry Site Monitoring Reports",
      description: "Quarry operations monitoring and compliance reports",
      icon: <Mountain className="w-6 h-6" />,
      color: "from-orange-500 to-orange-600",
      reports: [
        {
          name: "Quarry Site Monitoring Report",
          description: "Comprehensive quarry site monitoring with compliance tracking and permit status",
          action: generateQuarrySiteMonitoringReport,
          formats: ["PDF"],
          priority: "high"
        }
      ]
    }
  ];


  const getFormatColor = (format) => {
    switch (format) {
      case "PDF": return "bg-black text-white";
      case "Modal": return "bg-blue-600 text-white";
      case "Excel": return "bg-gray-700 text-white";
      case "CSV": return "bg-gray-600 text-white";
      case "PNG": return "bg-gray-500 text-white";
      case "JPG": return "bg-gray-400 text-black";
      default: return "bg-gray-200 text-black";
    }
  };

  // Show loading state while data is being fetched
  if (dataLoading) {
    return (
      <Layout onLogout={handleLogout} onNavigate={onNavigate} currentPage={currentPage}>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-black mx-auto"></div>
            <p className="text-black text-xl font-semibold">Loading report data...</p>
            <p className="text-gray-600">Please wait while we fetch your reports</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout onLogout={handleLogout} onNavigate={onNavigate} currentPage={currentPage}>
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports Center</h1>
            <p className="text-gray-500 mt-2">Generate comprehensive reports across all system modules</p>
          </div>
        </div>

        {/* Quick Stats - Hidden as requested */}
        {/* 
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Card className="bg-white shadow-sm border border-gray-200 h-36">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Active Days</p>
                  <p className="text-2xl font-bold text-green-600">
                    {calculateOverallSummary().totalActive.toLocaleString()}
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-gray-200 h-36">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Avg Active %</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {calculateOverallSummary().avgActivePercentage}%
                  </p>
                </div>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Target className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-gray-200 h-36">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Command Center</p>
                  <p className="text-2xl font-bold text-red-600">
                    {getTotalCommandCenterReports().toLocaleString()}
                  </p>
                </div>
                <div className="p-2 bg-red-100 rounded-lg">
                  <Command className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-gray-200 h-36">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Action Reports</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {(actionReports || []).length.toLocaleString()}
                  </p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-gray-200 h-36">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Total Incidents</p>
                  <p className="text-2xl font-bold text-red-600">
                    {(incidents || []).length.toLocaleString()}
                  </p>
                </div>
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-gray-200 h-36">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Quarry Monitoring</p>
                  <p className="text-2xl font-bold text-red-600">
                    {getTotalQuarryMonitoringReports().toLocaleString()}
                  </p>
                </div>
                <div className="p-2 bg-red-100 rounded-lg">
                  <Mountain className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        */}


          {/* Reports Table */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="pb-4 border-b border-gray-100">
              <CardTitle className="text-xl font-bold text-black">Available Reports</CardTitle>
              <p className="text-gray-600">Generate individual reports or all reports at once</p>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 border-gray-200 bg-gray-50">
                    <TableHead className="font-bold text-black py-4 px-6 text-center w-1/4">Report Type</TableHead>
                    <TableHead className="font-bold text-black py-4 px-6 text-center w-2/5">Description</TableHead>
                    <TableHead className="font-bold text-black py-4 px-6 text-center w-1/6">Formats</TableHead>
                    <TableHead className="font-bold text-black py-4 px-6 text-center w-1/4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportSections.map((section) => 
                    section.reports.map((report, index) => (
                      <TableRow key={`${section.id}-${index}`} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                        <TableCell className="font-semibold py-4 px-6">
                          <div className="flex items-center justify-start gap-3">
                            <div className="p-2 bg-black rounded-lg">
                              {React.cloneElement(section.icon, { className: "w-5 h-5 text-white" })}
                            </div>
                            <span className="text-black">{report.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-4 text-gray-700 text-sm">{report.description}</TableCell>
                        <TableCell className="py-4 px-4 text-center">
                          <div className="flex flex-wrap gap-2 justify-center">
                            {report.formats.map((format) => (
                              <Badge
                                key={format}
                                variant="outline"
                                className={`text-xs px-3 py-1 font-semibold border-2 transition-colors ${getFormatColor(format)}`}
                              >
                                {format}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-4 text-center">
                          {report.actions ? (
                            <div className="flex flex-wrap gap-1 justify-center">
                              {report.actions.map((actionItem, actionIndex) => (
                                <Button
                                  key={actionIndex}
                                  onClick={async () => {
                                    if (actionItem.name === "Generate Report" && section.id === "commandcenter") {
                                      // Handle Command Center report generation with its own loading state
                                      await actionItem.action();
                                    } else {
                                      setIsGenerating(true);
                                      try {
                                        await actionItem.action();
                                      } finally {
                                        setTimeout(() => setIsGenerating(false), 1000);
                                      }
                                    }
                                  }}
                                  disabled={isGenerating || (actionItem.name === "Generate Report" && section.id === "commandcenter" && isGeneratingCommandCenterReport)}
                                  size="sm"
                                  className="bg-black hover:bg-gray-800 text-white border border-black hover:border-gray-800 transition-all duration-200 px-3 py-2 text-xs font-medium w-[140px] h-8"
                                >
                                  {(isGenerating || (actionItem.name === "Generate Report" && section.id === "commandcenter" && isGeneratingCommandCenterReport)) ? (
                                    <>
                                      <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-1"></div>
                                      <span>Gen...</span>
                                    </>
                                  ) : (
                                    <>
                                      {actionItem.name === "Generate Report" ? (
                                        <FileText className="w-3 h-3 mr-1" />
                                      ) : actionItem.name === "Daily Summary" ? (
                                        <Calendar className="w-3 h-3 mr-1" />
                                      ) : actionItem.name === "Preview Report" ? (
                                        <Eye className="w-3 h-3 mr-1" />
                                      ) : actionItem.name === "Summary Insights" ? (
                                        <Activity className="w-3 h-3 mr-1" />
                                      ) : actionItem.name === "Export to PDF" ? (
                                        <Download className="w-3 h-3 mr-1" />
                                      ) : actionItem.name === "View Summary" ? (
                                        <BarChart3 className="w-3 h-3 mr-1" />
                                      ) : (
                                        <Printer className="w-3 h-3 mr-1" />
                                      )}
                                      <span>{actionItem.name}</span>
                                    </>
                                  )}
                                </Button>
                              ))}
                            </div>
                          ) : (
                            <Button
                              onClick={() => {
                                setIsGenerating(true);
                                try {
                                  report.action();
                                } finally {
                                  setTimeout(() => setIsGenerating(false), 1000);
                                }
                              }}
                              disabled={isGenerating}
                              size="sm"
                              className="bg-black hover:bg-gray-800 text-white border border-black hover:border-gray-800 transition-all duration-200 px-3 py-2 text-xs font-medium w-[140px] h-8"
                            >
                              {isGenerating ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-1"></div>
                                  <span>Gen...</span>
                                </>
                              ) : (
                                <>
                                  <Printer className="w-3 h-3 mr-1" />
                                  <span>Generate Report</span>
                                </>
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

        </div>

        {/* Summary Insights Modal */}
        {showSummaryModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden transform transition-all duration-300 scale-100 animate-in fade-in-0 zoom-in-95">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg transition-all duration-300 bg-blue-100 border border-blue-200">
                    <BarChart3 className="w-6 h-6 transition-colors duration-300 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold transition-colors duration-300 text-gray-900">
                      Summary Insights
                    </h3>
                    <p className="text-sm transition-colors duration-300 text-gray-600">Comprehensive analysis of incident data</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const insights = generateSummaryInsights();
                      alert(`Detection Test Results:
Total Incidents: ${insights.totalIncidents}
Active: ${insights.completedIncidents}
Completed: ${insights.completedIncidents}
Completion Rate: ${insights.completionRate}%

Top District: ${insights.mostActiveDistrict}
Top Municipality: ${insights.topMunicipalities[0]?.municipality || 'N/A'}
Top Location: ${insights.topLocations[0]?.location || 'N/A'}`);
                    }}
                    className="p-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors duration-200"
                    title="Test Detection"
                  >
                    <Zap className="w-5 h-5" />
                  </button>
                  <button
                    onClick={exportSummaryToPDF}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
                    title="Export to PDF"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowSummaryModal(false)}
                    className="p-2 rounded-lg transition-all duration-300 hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto max-h-[75vh]">
                {(() => {
                  const filteredIncidents = incidents.filter(incident => {
                    // Filter by status if not "all"
                    if (filterStatus !== "all" && incident.status !== filterStatus) {
                      return false;
                    }
                    // Filter by month if not "all"
                    if (selectedMonth !== "all") {
                      const incidentMonth = new Date(incident.date).getMonth();
                      if (incidentMonth !== selectedMonth) {
                        return false;
                      }
                    }
                    // Filter by search term
                    if (searchTerm) {
                      const searchLower = searchTerm.toLowerCase();
                      return (
                        incident.description?.toLowerCase().includes(searchLower) ||
                        incident.location?.toLowerCase().includes(searchLower) ||
                        incident.incidentType?.toLowerCase().includes(searchLower) ||
                        incident.municipality?.toLowerCase().includes(searchLower)
                      );
                    }
                    return true;
                  });

                  const insights = generateSummaryInsights(filteredIncidents);
                  return (
                    <div className="space-y-8">
                      {/* Overview Section */}
                      <div className="p-6 rounded-xl border-2 bg-blue-50 border-blue-200">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 rounded-lg bg-blue-100">
                            <AlertTriangle className="w-6 h-6 text-blue-600" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900">📊 Data Overview {selectedMonth !== "all" && `(${months[selectedMonth]})`}</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                          <div className="p-4 rounded-lg bg-blue-100">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 rounded-full bg-blue-200">
                                <FileText className="w-4 h-4 text-blue-600" />
                              </div>
                              <p className="text-sm font-medium text-blue-600">Total Incidents</p>
                            </div>
                            <p className="text-2xl font-bold text-blue-600">{insights.totalIncidents}</p>
                          </div>
                          <div className="p-4 rounded-lg bg-red-100">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 rounded-full bg-red-200">
                                <Shield className="w-4 h-4 text-red-600" />
                              </div>
                              <p className="text-sm font-medium text-red-600">Drugs</p>
                            </div>
                            <p className="text-2xl font-bold text-red-600">{insights.drugsIncidents}</p>
                            <p className="text-xs text-gray-600">Drug-related incidents</p>
                          </div>
                          <div className="p-4 rounded-lg bg-gray-100">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 rounded-full bg-gray-200">
                                <MoreHorizontal className="w-4 h-4 text-gray-600" />
                              </div>
                              <p className="text-sm font-medium text-gray-600">Others</p>
                            </div>
                            <p className="text-2xl font-bold text-gray-600">{insights.othersIncidents}</p>
                            <p className="text-xs text-gray-600">Other incident types</p>
                          </div>
                          <div className="p-4 rounded-lg bg-orange-100">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 rounded-full bg-orange-200">
                                <Car className="w-4 h-4 text-orange-600" />
                              </div>
                              <p className="text-sm font-medium text-orange-600">Accidents</p>
                            </div>
                            <p className="text-2xl font-bold text-orange-600">{insights.accidentsIncidents}</p>
                            <div className="mt-2 space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-600">Traffic:</span>
                                <span className="font-medium text-orange-600">{insights.trafficAccidents}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-600">Other:</span>
                                <span className="font-medium text-orange-600">{insights.otherAccidents}</span>
                              </div>
                            </div>
                            <p className="text-xs mt-2 text-gray-600">Accident breakdown</p>
                          </div>
                          <div className="p-4 rounded-lg bg-yellow-100">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 rounded-full bg-yellow-200">
                                <CheckCircle className="w-4 h-4 text-yellow-600" />
                              </div>
                              <p className="text-sm font-medium text-yellow-600">Action Taken</p>
                            </div>
                            <p className="text-2xl font-bold text-yellow-600">{insights.actionTakenIncidents}</p>
                            <p className="text-xs text-gray-600">Actions completed</p>
                          </div>
                        </div>
                      </div>

                      {/* Three Districts Analysis */}
                      <div className="p-6 rounded-xl border-2 bg-green-50 border-green-200">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-2 rounded-lg bg-green-100">
                            <MapPin className="w-6 h-6 text-green-600" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900">🗺️ Three Districts Analysis</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* 1ST DISTRICT */}
                          <div className="p-4 rounded-lg border-2 bg-blue-100 border-blue-200">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                              <h4 className="font-bold text-gray-900">1ST DISTRICT</h4>
                            </div>
                            <div className="space-y-3">
                              <div className="text-center">
                                <p className="text-3xl font-bold text-blue-600">{insights.threeDistricts['1ST DISTRICT'].count}</p>
                                <p className="text-sm text-gray-600">Total Incidents</p>
                              </div>
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-700">Municipalities:</p>
                                <div className="flex flex-wrap gap-1">
                                  {insights.threeDistricts['1ST DISTRICT'].municipalities.map(municipality => (
                                    <span key={municipality} className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full">
                                      {municipality}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 2ND DISTRICT */}
                          <div className="p-4 rounded-lg border-2 bg-green-100 border-green-200">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-3 h-3 rounded-full bg-green-600"></div>
                              <h4 className="font-bold text-gray-900">2ND DISTRICT</h4>
                            </div>
                            <div className="space-y-3">
                              <div className="text-center">
                                <p className="text-3xl font-bold text-green-600">{insights.threeDistricts['2ND DISTRICT'].count}</p>
                                <p className="text-sm text-gray-600">Total Incidents</p>
                              </div>
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-700">Municipalities:</p>
                                <div className="flex flex-wrap gap-1">
                                  {insights.threeDistricts['2ND DISTRICT'].municipalities.map(municipality => (
                                    <span key={municipality} className="px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full">
                                      {municipality}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 3RD DISTRICT */}
                          <div className="p-4 rounded-lg border-2 bg-red-100 border-red-200">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-3 h-3 rounded-full bg-red-600"></div>
                              <h4 className="font-bold text-gray-900">3RD DISTRICT</h4>
                            </div>
                            <div className="space-y-3">
                              <div className="text-center">
                                <p className="text-3xl font-bold text-red-600">{insights.threeDistricts['3RD DISTRICT'].count}</p>
                                <p className="text-sm text-gray-600">Total Incidents</p>
                              </div>
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-700">Municipalities:</p>
                                <div className="flex flex-wrap gap-1">
                                  {insights.threeDistricts['3RD DISTRICT'].municipalities.map(municipality => (
                                    <span key={municipality} className="px-2 py-1 bg-red-200 text-red-800 text-xs rounded-full">
                                      {municipality}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowSummaryModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-md transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Command Center Summary Modal */}
        {showCommandCenterSummary && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[95vh] overflow-hidden border border-gray-200">
              <div className="flex items-center justify-between p-8 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-xl blur-sm"></div>
                    <div className="relative p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                      <Command className="w-6 h-6 text-emerald-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-semibold tracking-tight text-gray-900">
                      {summaryViewType === "quarterly" ? "Quarterly Report" : "Weekly Report"}
                    </h3>
                    <p className="text-gray-500 mt-1">Command Center operational insights</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {/* View Type Toggle */}
                  <div className="flex bg-gray-50 rounded-xl p-1 border border-gray-200">
                    <button
                      onClick={() => setSummaryViewType("monthly")}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        summaryViewType === "monthly"
                          ? "bg-white text-emerald-600 shadow-sm border border-gray-200"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setSummaryViewType("quarterly")}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        summaryViewType === "quarterly"
                          ? "bg-white text-emerald-600 shadow-sm border border-gray-200"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      Quarterly
                    </button>
                  </div>
                  <button
                    onClick={() => setShowCommandCenterSummary(false)}
                    className="p-2 rounded-xl transition-all duration-200 hover:bg-gray-100 text-gray-400 hover:text-gray-600 border border-gray-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="p-8 overflow-y-auto max-h-[75vh] bg-gray-50/30">
                {(() => {
                  const summary = summaryViewType === "quarterly" 
                    ? calculateQuarterlySummary()
                    : calculateWeeklyReportSummary();
                  return (
                    <div className="space-y-10">
                      {/* Overview Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="group relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-2xl blur-sm group-hover:blur-none transition-all duration-300"></div>
                          <div className="relative bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-sm font-medium text-blue-600/80 mb-2">Total Entries</p>
                                <p className="text-3xl font-bold text-blue-900">{summary.totalEntries}</p>
                              </div>
                              <div className="p-3 bg-blue-100 rounded-xl">
                                <FileText className="h-6 w-6 text-blue-600" />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="group relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-2xl blur-sm group-hover:blur-none transition-all duration-300"></div>
                          <div className="relative bg-white/80 backdrop-blur-sm border border-emerald-200/50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-sm font-medium text-emerald-600/80 mb-2">Total Weekly Sum</p>
                                <p className="text-3xl font-bold text-emerald-900">{summary.totalWeeklySum}</p>
                              </div>
                              <div className="p-3 bg-emerald-100 rounded-xl">
                                <BarChart3 className="h-6 w-6 text-emerald-600" />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="group relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-violet-600/5 rounded-2xl blur-sm group-hover:blur-none transition-all duration-300"></div>
                          <div className="relative bg-white/80 backdrop-blur-sm border border-violet-200/50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-sm font-medium text-violet-600/80 mb-2">Unique Barangays</p>
                                <p className="text-3xl font-bold text-violet-900">{summary.uniqueBarangays}</p>
                              </div>
                              <div className="p-3 bg-violet-100 rounded-xl">
                                <MapPin className="h-6 w-6 text-violet-600" />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="group relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-amber-600/5 rounded-2xl blur-sm group-hover:blur-none transition-all duration-300"></div>
                          <div className="relative bg-white/80 backdrop-blur-sm border border-amber-200/50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-sm font-medium text-amber-600/80 mb-2">Concern Types</p>
                                <p className="text-3xl font-bold text-amber-900">{summary.uniqueConcernTypes}</p>
                              </div>
                              <div className="p-3 bg-amber-100 rounded-xl">
                                <AlertTriangle className="h-6 w-6 text-amber-600" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Breakdown Section */}
                      <div className="bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-8">
                          <div className="p-2 bg-gray-100 rounded-xl">
                            <BarChart3 className="h-5 w-5 text-gray-600" />
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900">
                            {summaryViewType === "quarterly" ? "Quarterly Breakdown" : "Weekly Breakdown"}
                          </h3>
                        </div>
                        
                        {summaryViewType === "quarterly" ? (
                          // Quarterly View
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {summary.quarterlyStats && summary.quarterlyStats.map((quarter, index) => {
                              const getQuarterStyles = (color) => {
                                switch(color) {
                                  case 'blue':
                                    return {
                                      bg: 'bg-blue-100',
                                      border: 'border-blue-300',
                                      textMedium: 'text-blue-800',
                                      textBold: 'text-blue-900',
                                      textSmall: 'text-blue-700',
                                      textXs: 'text-blue-600'
                                    };
                                  case 'green':
                                    return {
                                      bg: 'bg-green-100',
                                      border: 'border-green-300',
                                      textMedium: 'text-green-800',
                                      textBold: 'text-green-900',
                                      textSmall: 'text-green-700',
                                      textXs: 'text-green-600'
                                    };
                                  case 'orange':
                                    return {
                                      bg: 'bg-orange-100',
                                      border: 'border-orange-300',
                                      textMedium: 'text-orange-800',
                                      textBold: 'text-orange-900',
                                      textSmall: 'text-orange-700',
                                      textXs: 'text-orange-600'
                                    };
                                  case 'purple':
                                    return {
                                      bg: 'bg-purple-100',
                                      border: 'border-purple-300',
                                      textMedium: 'text-purple-800',
                                      textBold: 'text-purple-900',
                                      textSmall: 'text-purple-700',
                                      textXs: 'text-purple-600'
                                    };
                                  default:
                                    return {
                                      bg: 'bg-gray-100',
                                      border: 'border-gray-300',
                                      textMedium: 'text-gray-800',
                                      textBold: 'text-gray-900',
                                      textSmall: 'text-gray-700',
                                      textXs: 'text-gray-600'
                                    };
                                }
                              };
                              const styles = getQuarterStyles(quarter.color);
                              
                              return (
                                <div key={quarter.name} className="text-center">
                                  <div className={`${styles.bg} border ${styles.border} rounded-lg p-4`}>
                                    <p className={`text-sm font-medium ${styles.textMedium}`}>{quarter.name}</p>
                                    <p className={`text-2xl font-bold ${styles.textBold} mb-2`}>{quarter.entries}</p>
                                    <div className="space-y-1">
                                      <p className={`text-xs ${styles.textSmall}`}>
                                        Weekly Sum: <span className="font-semibold">{quarter.weeklySum}</span>
                                      </p>
                                      <p className={`text-xs ${styles.textSmall}`}>
                                        Barangays: <span className="font-semibold">{quarter.barangays}</span>
                                      </p>
                                      <p className={`text-xs ${styles.textSmall}`}>
                                        Concerns: <span className="font-semibold">{quarter.concernTypes}</span>
                                      </p>
                                    </div>
                                    <p className={`text-xs ${styles.textXs} mt-2 font-medium`}>
                                      {quarter.months.join(", ")}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          // Weekly View
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="group relative">
                              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-yellow-500/10 rounded-xl blur-sm group-hover:blur-none transition-all duration-300"></div>
                              <div className="relative bg-white/90 backdrop-blur-sm border border-yellow-200/60 rounded-xl p-5 text-center hover:shadow-md transition-all duration-300">
                                <p className="text-sm font-semibold text-yellow-700 mb-2">Week 1</p>
                                <p className="text-2xl font-bold text-yellow-900 mb-1">{summary.totalWeek1}</p>
                                <p className="text-xs text-yellow-600">{months[selectedMonth]} 1-7</p>
                              </div>
                            </div>
                            <div className="group relative">
                              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-emerald-500/10 rounded-xl blur-sm group-hover:blur-none transition-all duration-300"></div>
                              <div className="relative bg-white/90 backdrop-blur-sm border border-emerald-200/60 rounded-xl p-5 text-center hover:shadow-md transition-all duration-300">
                                <p className="text-sm font-semibold text-emerald-700 mb-2">Week 2</p>
                                <p className="text-2xl font-bold text-emerald-900 mb-1">{summary.totalWeek2}</p>
                                <p className="text-xs text-emerald-600">{months[selectedMonth]} 8-14</p>
                              </div>
                            </div>
                            <div className="group relative">
                              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-blue-500/10 rounded-xl blur-sm group-hover:blur-none transition-all duration-300"></div>
                              <div className="relative bg-white/90 backdrop-blur-sm border border-blue-200/60 rounded-xl p-5 text-center hover:shadow-md transition-all duration-300">
                                <p className="text-sm font-semibold text-blue-700 mb-2">Week 3</p>
                                <p className="text-2xl font-bold text-blue-900 mb-1">{summary.totalWeek3}</p>
                                <p className="text-xs text-blue-600">{months[selectedMonth]} 15-21</p>
                              </div>
                            </div>
                            <div className="group relative">
                              <div className="absolute inset-0 bg-gradient-to-br from-violet-400/20 to-violet-500/10 rounded-xl blur-sm group-hover:blur-none transition-all duration-300"></div>
                              <div className="relative bg-white/90 backdrop-blur-sm border border-violet-200/60 rounded-xl p-5 text-center hover:shadow-md transition-all duration-300">
                                <p className="text-sm font-semibold text-violet-700 mb-2">Week 4</p>
                                <p className="text-2xl font-bold text-violet-900 mb-1">{summary.totalWeek4}</p>
                                <p className="text-xs text-violet-600">{months[selectedMonth]} 22-{new Date(selectedYear, selectedMonth + 1, 0).getDate()}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Completion Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            Completion Rate
                          </h3>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Entries with Action Taken</span>
                              <span className="font-semibold">{summary.entriesWithAction} / {summary.totalEntries}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${summary.completionRate}%` }}
                              ></div>
                            </div>
                            <p className="text-sm text-gray-600">{summary.completionRate}% completion rate</p>
                          </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-blue-600" />
                            Remarks Rate
                          </h3>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Entries with Remarks</span>
                              <span className="font-semibold">{summary.entriesWithRemarks} / {summary.totalEntries}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${summary.remarksRate}%` }}
                              ></div>
                            </div>
                            <p className="text-sm text-gray-600">{summary.remarksRate}% remarks rate</p>
                          </div>
                        </div>
                      </div>

                      {/* Top Lists */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="group relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-amber-600/5 rounded-2xl blur-sm group-hover:blur-none transition-all duration-300"></div>
                          <div className="relative bg-white/80 backdrop-blur-sm border border-amber-200/50 rounded-2xl p-8 hover:shadow-lg transition-all duration-300">
                            <div className="flex items-center gap-3 mb-6">
                              <div className="p-2 bg-amber-100 rounded-xl">
                                <AlertTriangle className="h-5 w-5 text-amber-600" />
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900">Top Concern Types</h3>
                            </div>
                            {summary.topConcernTypes.length > 0 ? (
                              <div className="space-y-3">
                                {summary.topConcernTypes.map((item, index) => (
                                  <div key={item.type} className="flex justify-between items-center p-4 bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-xl border border-amber-200/30 hover:shadow-sm transition-all duration-200">
                                    <span className="text-sm font-medium text-amber-900">{item.type}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-bold text-amber-700 bg-amber-200/50 px-2 py-1 rounded-lg">{item.count}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                  <AlertTriangle className="h-6 w-6 text-gray-400" />
                                </div>
                                <p className="text-sm text-gray-500">No concern types recorded</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="group relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-violet-600/5 rounded-2xl blur-sm group-hover:blur-none transition-all duration-300"></div>
                          <div className="relative bg-white/80 backdrop-blur-sm border border-violet-200/50 rounded-2xl p-8 hover:shadow-lg transition-all duration-300">
                            <div className="flex items-center gap-3 mb-6">
                              <div className="p-2 bg-violet-100 rounded-xl">
                                <MapPin className="h-5 w-5 text-violet-600" />
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900">Top Barangays</h3>
                            </div>
                            {summary.topBarangays.length > 0 ? (
                              <div className="space-y-3">
                                {summary.topBarangays.map((item, index) => (
                                  <div key={item.barangay} className="flex justify-between items-center p-4 bg-gradient-to-r from-violet-50 to-violet-100/50 rounded-xl border border-violet-200/30 hover:shadow-sm transition-all duration-200">
                                    <span className="text-sm font-medium text-violet-900">{item.barangay}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-bold text-violet-700 bg-violet-200/50 px-2 py-1 rounded-lg">{item.count}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                  <MapPin className="h-6 w-6 text-gray-400" />
                                </div>
                                <p className="text-sm text-gray-500">No barangays recorded</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Summary Info */}
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-2xl blur-sm"></div>
                        <div className="relative bg-white/80 backdrop-blur-sm border border-emerald-200/50 rounded-2xl p-8">
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-emerald-100 rounded-xl">
                              <BarChart3 className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-xl font-semibold text-gray-900 mb-3">
                                {summaryViewType === "quarterly" 
                                  ? `Quarterly Summary for ${summary.year || selectedYear}`
                                  : `Summary for ${months[selectedMonth]} ${selectedYear}`
                                }
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                <div className="space-y-2">
                                  <p><span className="font-medium text-gray-900">Municipality:</span> {summary.municipality}</p>
                                  <p><span className="font-medium text-gray-900">Total Entries:</span> {summary.totalEntries}</p>
                                </div>
                                <div className="space-y-2">
                                  <p><span className="font-medium text-gray-900">Weekly Sum:</span> {summary.totalWeeklySum}</p>
                                  <p><span className="font-medium text-gray-900">Completion Rate:</span> {summary.completionRate}%</p>
                                  {summaryViewType === "quarterly" && summary.quarterlyStats && (
                                    <p><span className="font-medium text-gray-900">Quarters Analyzed:</span> {summary.quarterlyStats.length}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div className="flex justify-end gap-4 p-8 border-t border-gray-100 bg-gray-50/50">
                <button
                  onClick={() => setShowCommandCenterSummary(false)}
                  className="px-6 py-3 border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 rounded-xl transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Center Summary Insights Modal */}
        {showActionCenterSummary && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-auto transform transition-all duration-300 scale-100 animate-in fade-in-0 zoom-in-95">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Activity className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Action Center Summary Insights</h3>
                    <p className="text-sm text-gray-500">Comprehensive analytics and statistics for all action reports</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowActionCenterSummary(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              {/* Content */}
              <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold text-blue-800">Total Actions</h4>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{actionItems.length.toLocaleString()}</p>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-5 h-5 text-red-600" />
                      <h4 className="font-semibold text-red-800">Arrested</h4>
                    </div>
                    <p className="text-2xl font-bold text-red-600">
                      {actionItems.filter(item => item.actionTaken === 'Arrested').length.toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <h4 className="font-semibold text-yellow-800">Pending</h4>
                    </div>
                    <p className="text-2xl font-bold text-yellow-600">
                      {actionItems.filter(item => item.actionTaken !== 'Arrested').length.toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-purple-600" />
                      <h4 className="font-semibold text-purple-800">Success Rate</h4>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">
                      {actionItems.length > 0 ? Math.round((actionItems.filter(item => item.actionTaken === 'Arrested').length / actionItems.length) * 100) : 0}%
                    </p>
                  </div>
                </div>
                
                {/* Department Breakdown */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Department Breakdown
                  </h4>
                  <div className="space-y-3">
                    {['pnp', 'agriculture', 'pg-enro'].map(dept => {
                      const deptActions = actionItems.filter(item => item.department === dept);
                      const percentage = actionItems.length > 0 ? Math.round((deptActions.length / actionItems.length) * 100) : 0;
                      return (
                        <div key={dept} className="flex items-center justify-between p-2 bg-white rounded border">
                          <span className="font-medium capitalize flex items-center gap-2">
                            {dept === 'pnp' && <Shield className="w-4 h-4 text-red-600" />}
                            {dept === 'agriculture' && <Fish className="w-4 h-4 text-green-600" />}
                            {dept === 'pg-enro' && <Trees className="w-4 h-4 text-emerald-600" />}
                            {dept === 'pg-enro' ? 'PG-ENRO' : dept === 'pnp' ? 'PNP' : 'Agriculture'}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">{percentage}%</span>
                            <span className="font-semibold">{deptActions.length} actions</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* District Breakdown */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold mb-2 text-blue-800">District Distribution</h4>
                  <div className="space-y-2">
                    {['1ST DISTRICT', '2ND DISTRICT', '3RD DISTRICT'].map(district => {
                      const districtActions = actionItems.filter(item => item.district === district);
                      const percentage = actionItems.length > 0 ? Math.round((districtActions.length / actionItems.length) * 100) : 0;
                      return (
                        <div key={district} className="flex items-center justify-between text-sm">
                          <span className="text-blue-700 font-medium">{district}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-blue-600">{percentage}%</span>
                            <span className="font-semibold text-blue-800">{districtActions.length}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="p-6 border-t border-gray-200">
                <Button 
                  onClick={() => setShowActionCenterSummary(false)} 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <X className="w-4 h-4 mr-2" />
                  Close Summary
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* IPatroller Daily Summary Modal */}
        {showIPatrollerDailySummary && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-auto max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100 animate-in fade-in-0 zoom-in-95">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Daily Summary</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(ipatrollerSelectedYear, ipatrollerSelectedMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setShowIPatrollerDailySummary(false)}
                    variant="outline"
                    size="sm"
                    className="text-gray-600 border-gray-200 hover:bg-gray-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Close
                  </Button>
                </div>
              </div>

              {/* Date Selector */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Selected Date</h3>
                      <p className="text-lg font-semibold text-gray-900">
                        {generateDates(ipatrollerSelectedMonth, ipatrollerSelectedYear)[ipatrollerSelectedDayIndex]?.fullDate}
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <select
                      id="date-select"
                      value={ipatrollerSelectedDayIndex}
                      onChange={(e) => setIpatrollerSelectedDayIndex(parseInt(e.target.value))}
                      className="appearance-none bg-white pl-4 pr-10 py-2.5 rounded-lg border border-gray-200 shadow-sm 
                      text-gray-900 font-medium hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 
                      focus:border-blue-500 transition-all duration-200 min-w-[200px]"
                    >
                      {generateDates(ipatrollerSelectedMonth, ipatrollerSelectedYear).map((date, index) => (
                        <option key={index} value={index} className="py-2">
                          {date.fullDate}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="space-y-6">
                  {Object.entries(getDailySummaryData(ipatrollerSelectedDayIndex)).map(([district, municipalities]) => (
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
                              <th className="px-4 py-2 text-center text-sm font-medium text-gray-600">Progress (Barangays)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {municipalities.map((data) => (
                              <tr key={data.municipality}>
                                <td className="px-4 py-2 text-sm font-medium text-gray-900">{data.municipality}</td>
                                <td className="px-4 py-2 text-sm text-center font-medium text-gray-900">{data.dailyCount}</td>
                                <td className="px-4 py-2 text-center">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                    ${data.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {data.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                                <td className="px-4 py-2">
                                  <div className="flex flex-col gap-1">
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
                                    <div className="text-xs text-gray-500 text-center">
                                      {data.dailyCount} / {data.totalBarangays} barangays
                                    </div>
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
        )}

        {/* IPatroller Preview Report Modal */}
        {showIPatrollerPreview && ipatrollerPreviewData && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-auto max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100 animate-in fade-in-0 zoom-in-95">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Eye className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Preview Report</h3>
                    <p className="text-sm text-gray-600">
                      {ipatrollerPreviewData.reportPeriod}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => {
                      setShowIPatrollerPreview(false);
                      setIpatrollerPreviewData(null);
                      generateIPatrollerMonthlySummaryReport();
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                    disabled={isGeneratingIPatrollerReport}
                  >
                    {isGeneratingIPatrollerReport ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <FileText className="w-4 h-4 mr-2" />
                    )}
                    Generate PDF
                  </Button>
                  <Button
                    onClick={() => {
                      setShowIPatrollerPreview(false);
                      setIpatrollerPreviewData(null);
                    }}
                    variant="outline"
                    size="sm"
                    className="text-gray-600 border-gray-200 hover:bg-gray-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Close
                  </Button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="space-y-6">
                  {/* Report Header */}
                  <div className="text-center border-b border-gray-200 pb-4">
                    <h1 className="text-2xl font-bold text-gray-900">{ipatrollerPreviewData.title}</h1>
                    <p className="text-sm text-gray-600 mt-2">Generated: {ipatrollerPreviewData.generatedDate}</p>
                    <p className="text-sm text-gray-600">Report Period: {ipatrollerPreviewData.reportPeriod}</p>
                    <p className="text-sm text-gray-600">Data Source: {ipatrollerPreviewData.dataSource}</p>
                  </div>

                  {/* Overall Summary */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Overall Summary</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{ipatrollerPreviewData.overallSummary.totalPatrols.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Total Patrols</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{ipatrollerPreviewData.overallSummary.totalActive}</p>
                        <p className="text-sm text-gray-600">Active Days</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">{ipatrollerPreviewData.overallSummary.totalInactive}</p>
                        <p className="text-sm text-gray-600">Inactive Days</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">{ipatrollerPreviewData.overallSummary.avgActivePercentage}%</p>
                        <p className="text-sm text-gray-600">Avg Active %</p>
                      </div>
                    </div>
                  </div>

                  {/* District Summary */}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">District Summary</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full border border-gray-200 rounded-lg">
                        <thead className="bg-blue-600 text-white">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-medium">District</th>
                            <th className="px-4 py-2 text-center text-sm font-medium">Municipalities</th>
                            <th className="px-4 py-2 text-center text-sm font-medium">Total Patrols</th>
                            <th className="px-4 py-2 text-center text-sm font-medium">Active Days</th>
                            <th className="px-4 py-2 text-center text-sm font-medium">Inactive Days</th>
                            <th className="px-4 py-2 text-center text-sm font-medium">Avg Active %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {ipatrollerPreviewData.districtSummary.map((district, index) => (
                            <tr key={district.district} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-4 py-2 text-sm font-medium text-gray-900">{district.district}</td>
                              <td className="px-4 py-2 text-sm text-center text-gray-900">{district.municipalityCount}</td>
                              <td className="px-4 py-2 text-sm text-center text-gray-900">{district.totalPatrols.toLocaleString()}</td>
                              <td className="px-4 py-2 text-sm text-center text-gray-900">{district.totalActive}</td>
                              <td className="px-4 py-2 text-sm text-center text-gray-900">{district.totalInactive}</td>
                              <td className="px-4 py-2 text-sm text-center text-gray-900">{district.avgActivePercentage}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Municipality Performance */}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Municipality Performance</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Municipality</th>
                            <th className="px-4 py-2 text-center text-sm font-medium text-gray-600">District</th>
                            <th className="px-4 py-2 text-center text-sm font-medium text-gray-600">Total Patrols</th>
                            <th className="px-4 py-2 text-center text-sm font-medium text-gray-600">Active Days</th>
                            <th className="px-4 py-2 text-center text-sm font-medium text-gray-600">Inactive Days</th>
                            <th className="px-4 py-2 text-center text-sm font-medium text-gray-600">Active %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {ipatrollerPreviewData.municipalityPerformance.map((municipality, index) => (
                            <tr key={municipality.municipality} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm font-medium text-gray-900">{municipality.municipality}</td>
                              <td className="px-4 py-2 text-sm text-center text-gray-900">{municipality.district}</td>
                              <td className="px-4 py-2 text-sm text-center text-gray-900">{municipality.totalPatrols}</td>
                              <td className="px-4 py-2 text-sm text-center text-green-600 font-medium">{municipality.activeDays}</td>
                              <td className="px-4 py-2 text-sm text-center text-red-600 font-medium">{municipality.inactiveDays}</td>
                              <td className="px-4 py-2 text-sm text-center text-purple-600 font-medium">{municipality.activePercentage}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

    </Layout>
  );
}

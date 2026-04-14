import React, { useState, useEffect, useCallback } from "react";
import Layout from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Separator } from "../components/ui/separator";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { useData } from "../contexts/DataContext";
import { useFirebase } from "../hooks/useFirebase";
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { logReportAccess } from '../utils/adminLogger';
import { useAuth } from '../contexts/AuthContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import * as htmlToImage from 'html-to-image';
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
  Eye,
  Image as ImageIcon
} from "lucide-react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

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

  const [fromMonth, setFromMonth] = useState(new Date().getMonth());
  const [fromYear, setFromYear] = useState(new Date().getFullYear());
  const [toMonth, setToMonth] = useState(new Date().getMonth());
  const [toYear, setToYear] = useState(new Date().getFullYear());
  const [selectedDistrict, setSelectedDistrict] = useState("all");

  // Backward compatibility: use fromMonth/fromYear as selectedMonth/selectedYear for existing code
  const selectedMonth = fromMonth;
  const selectedYear = fromYear;
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
  const [showActionCenterGenerateModal, setShowActionCenterGenerateModal] = useState(false);
  const [isGeneratingActionCenterRangeReport, setIsGeneratingActionCenterRangeReport] = useState(false);
  const [actionCenterReportYear, setActionCenterReportYear] = useState(new Date().getFullYear());
  const [actionCenterFromMonth, setActionCenterFromMonth] = useState(0); // 0 = January
  const [actionCenterToMonth, setActionCenterToMonth] = useState(1);    // 1 = February

  // IPatroller Daily Summary modal state
  const [showIPatrollerDailySummary, setShowIPatrollerDailySummary] = useState(false);
  const [ipatrollerSelectedDayIndex, setIpatrollerSelectedDayIndex] = useState(() => {
    const today = new Date();
    return Math.max(0, today.getDate() - 1);
  });
  const [ipatrollerPatrolData, setIpatrollerPatrolData] = useState([]);
  const [ipatrollerSelectedMonth, setIpatrollerSelectedMonth] = useState(new Date().getMonth());
  const [ipatrollerSelectedYear, setIpatrollerSelectedYear] = useState(new Date().getFullYear());

  // IPatroller Preview Report modal state
  const [showIPatrollerPreview, setShowIPatrollerPreview] = useState(false);
  const [ipatrollerPreviewData, setIpatrollerPreviewData] = useState(null);
  const [isGeneratingIPatrollerReport, setIsGeneratingIPatrollerReport] = useState(false);

  // Quarterly Report Preview modal state
  const [showQuarterlyPreview, setShowQuarterlyPreview] = useState(false);
  const [quarterlyPreviewData, setQuarterlyPreviewData] = useState(null);

  // Top Barangay modal state
  const [showTopBarangay, setShowTopBarangay] = useState(false);
  const [isLoadingTopBarangay, setIsLoadingTopBarangay] = useState(false);
  const [topBarangayData, setTopBarangayData] = useState(null);
  const [topBarangayTab, setTopBarangayTab] = useState('all');
  const [topBarangayMonth, setTopBarangayMonth] = useState('all'); // 'all' or 0-11
  const [topBarangayYear, setTopBarangayYear] = useState(new Date().getFullYear());

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
      const monthName = months[selectedMonth];
      const monthYear = `${monthName}_${selectedYear}`;
      const allMunicipalities = Object.values(municipalitiesByDistrict).flat();

      // OPTIMIZED: Load all municipalities in PARALLEL + barangays/concern types simultaneously
      const [municipalityResults, barangaysResult, concernTypesResult] = await Promise.all([
        Promise.all(allMunicipalities.map(async (municipality) => {
          try {
            const docRef = doc(db, 'commandCenter', 'weeklyReports', municipality, monthYear);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              return { municipality, data: docSnap.data() };
            }
            return null;
          } catch (error) {
            return null;
          }
        })),
        getBarangays(),
        getConcernTypes()
      ]);

      const commandCenterReports = {};
      municipalityResults.forEach(result => {
        if (result) commandCenterReports[result.municipality] = result.data;
      });

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

        // Use fixed daily target instead of barangay counts
        const totalTarget = 14;
        const isActive = dailyCount >= totalTarget; // kept for backward compatibility
        // Determine tri-state status
        const status = dailyCount >= 14 ? 'Active' : (dailyCount === 13 ? 'Warning' : 'Inactive');

        // Calculate percentage based on requested bands
        // - 12 and below: 0–74%
        // - exactly 13: 75–85% (use midpoint 80%)
        // - 14 and above: 86–100% (linear, capped at 100)
        let percentage = 0;
        if (dailyCount <= 12) {
          percentage = Math.max(0, Math.min(74, Math.round((dailyCount / 12) * 74)));
        } else if (dailyCount === 13) {
          percentage = 80;
        } else {
          // 14 and above
          percentage = Math.min(100, 86 + (dailyCount - 14));
        }

        return {
          municipality,
          dailyCount,
          totalTarget,
          isActive,
          status,
          percentage
        };
      });
    });

    return summaryData;
  };

  const generateDailySummaryPdf = () => {
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'letter' });
      const dateObj = generateDates(selectedMonth, selectedYear)[ipatrollerSelectedDayIndex];
      const title = 'Daily Summary';
      const subtitle = new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const dateLine = dateObj ? dateObj.fullDate : '';
      doc.setFontSize(16);
      doc.text(title, 40, 40);
      doc.setFontSize(10);
      doc.text(subtitle, 40, 58);
      if (dateLine) doc.text(`Selected Date: ${dateLine}`, 40, 74);

      const dailyData = getDailySummaryData(ipatrollerSelectedDayIndex);
      let startY = 100;
      Object.entries(dailyData).forEach(([district, rows], idx) => {
        if (idx > 0) startY += 16;
        doc.setFontSize(12);
        doc.text(String(district), 40, startY);
        const body = rows.map(r => [
          r.municipality,
          String(r.dailyCount),
          r.status,
          `${r.percentage}% (${Math.min(r.dailyCount, r.totalTarget)} / ${r.totalTarget})`
        ]);
        // Append TOTAL row per district
        const totalCount = rows.reduce((sum, r) => sum + (r.dailyCount || 0), 0);
        const totalTargetAll = rows.reduce((sum, r) => sum + (r.totalTarget || 14), 0);
        const overallNumerator = Math.min(totalCount, totalTargetAll);
        const overallPct = totalTargetAll > 0 ? Math.round((overallNumerator / totalTargetAll) * 100) : 0;
        const activeCount = rows.filter(r => r.status === 'Active').length;
        const warningCount = rows.filter(r => r.status === 'Warning').length;
        const inactiveCount = rows.filter(r => r.status === 'Inactive').length;
        body.push([
          'TOTAL',
          String(totalCount),
          `A:${activeCount} W:${warningCount} I:${inactiveCount}`,
          `${overallPct}% (${overallNumerator} / ${totalTargetAll})`
        ]);
        autoTable(doc, {
          startY: startY + 8,
          head: [[
            'Municipality',
            'Daily Count',
            'Status',
            'Progress'
          ]],
          body,
          margin: { left: 40, right: 40 },
          styles: { fontSize: 9, cellPadding: 6 },
          headStyles: { fillColor: [59, 130, 246] },
          willDrawCell: (data) => {
            if (data.section === 'head') return;
          }
        });
        startY = doc.lastAutoTable.finalY || startY + 40;
      });

      const fileNameDate = dateObj ? dateObj.fullDate.replace(/[, ]/g, '_') : `${selectedYear}_${selectedMonth + 1}`;
      doc.save(`Daily_Summary_${fileNameDate}.pdf`);
    } catch (e) {
      console.error('Failed to generate Daily Summary PDF', e);
    }
  };

  // Helper function to get all months between from and to dates
  const getMonthsInRange = (fromMonth, fromYear, toMonth, toYear) => {
    const months = [];
    let currentMonth = fromMonth;
    let currentYear = fromYear;

    while (currentYear < toYear || (currentYear === toYear && currentMonth <= toMonth)) {
      months.push({ month: currentMonth, year: currentYear });
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
    }

    return months;
  };

  // Load patrol data from Firestore for IPatroller (supports multiple months)
  const loadIPatrollerData = useCallback(async () => {
    try {
      const monthsToLoad = getMonthsInRange(fromMonth, fromYear, toMonth, toYear);

      // OPTIMIZED: Load all months in PARALLEL
      const monthResults = await Promise.all(
        monthsToLoad.map(async ({ month, year }) => {
          const monthYearId = `${String(month + 1).padStart(2, "0")}-${year}`;
          try {
            const monthDocRef = doc(db, 'patrolData', monthYearId);
            const municipalitiesRef = collection(monthDocRef, 'municipalities');
            const querySnapshot = await getDocs(municipalitiesRef);
            const monthData = [];
            querySnapshot.forEach((d) => {
              const data = d.data();
              if (data) {
                monthData.push({ id: d.id, month, year, monthYearId, ...data });
              }
            });
            return monthData;
          } catch {
            return [];
          }
        })
      );

      setIpatrollerPatrolData(monthResults.flat());
    } catch (error) {
      console.error('Error loading IPatroller data:', error);
      setIpatrollerPatrolData([]);
    }
  }, [fromMonth, fromYear, toMonth, toYear]);

  // Load IPatroller data when modals are shown
  useEffect(() => {
    if (showIPatrollerDailySummary) {
      loadIPatrollerData();
    }
  }, [showIPatrollerDailySummary, loadIPatrollerData]);

  // When opening Daily Summary, default the selected date to the current day (bounded to the month length)
  useEffect(() => {
    if (showIPatrollerDailySummary) {
      const today = new Date();
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const day = Math.min(Math.max(1, today.getDate()), daysInMonth);
      setIpatrollerSelectedDayIndex(day - 1);
    }
  }, [showIPatrollerDailySummary, selectedMonth, selectedYear]);

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

  // Generate preview data for the report (supports multi-month)
  const generateIPatrollerPreviewData = () => {
    const overallSummary = calculateIPatrollerOverallSummary();

    // Group data by municipality and aggregate across months
    const municipalityAggregates = {};
    ipatrollerPatrolData.forEach(item => {
      const key = item.municipality;
      if (!municipalityAggregates[key]) {
        municipalityAggregates[key] = {
          municipality: item.municipality,
          district: item.district,
          totalPatrols: 0,
          activeDays: 0,
          inactiveDays: 0,
          dataPoints: []
        };
      }
      municipalityAggregates[key].totalPatrols += item.totalPatrols || 0;
      municipalityAggregates[key].activeDays += item.activeDays || 0;
      municipalityAggregates[key].inactiveDays += item.inactiveDays || 0;
      municipalityAggregates[key].dataPoints.push(...(item.data || []));
    });

    // Convert to array and calculate percentages
    const aggregatedData = Object.values(municipalityAggregates).map(item => ({
      ...item,
      activePercentage: (item.activeDays + item.inactiveDays) > 0
        ? Math.round((item.activeDays / (item.activeDays + item.inactiveDays)) * 100)
        : 0
    }));

    // Group by district
    const groupedData = aggregatedData.reduce((acc, item) => {
      if (!acc[item.district]) {
        acc[item.district] = [];
      }
      acc[item.district].push(item);
      return acc;
    }, {});

    // Calculate total days across all months
    const monthsInRange = getMonthsInRange(fromMonth, fromYear, toMonth, toYear);
    const totalDays = monthsInRange.reduce((sum, { month, year }) => {
      return sum + new Date(year, month + 1, 0).getDate();
    }, 0);

    // Generate report period text
    const reportPeriod = fromMonth === toMonth && fromYear === toYear
      ? `${months[fromMonth]} ${fromYear}`
      : `${months[fromMonth]} ${fromYear} - ${months[toMonth]} ${toYear}`;

    const previewData = {
      title: fromMonth === toMonth && fromYear === toYear
        ? "I-Patroller Monthly Summary Report"
        : "I-Patroller Multi-Month Summary Report",
      generatedDate: new Date().toLocaleDateString(),
      month: months[fromMonth],
      year: fromYear,
      reportPeriod: reportPeriod,
      dataSource: "Based on IPatroller Daily Counts",
      totalDaysInRange: totalDays,
      monthsCount: monthsInRange.length,
      overallSummary: overallSummary,
      districtSummary: Object.keys(groupedData).map(district => {
        const districtMunicipalities = groupedData[district];
        const totalPatrols = districtMunicipalities.reduce((sum, m) => sum + m.totalPatrols, 0);
        const totalActive = districtMunicipalities.reduce((sum, m) => sum + m.activeDays, 0);
        const totalInactive = districtMunicipalities.reduce((sum, m) => sum + m.inactiveDays, 0);
        const avgActivePercentage = (totalActive + totalInactive) > 0
          ? Math.round((totalActive / (totalActive + totalInactive)) * 100)
          : 0;

        return {
          district,
          municipalityCount: districtMunicipalities.length,
          totalPatrols,
          totalActive,
          totalInactive,
          avgActivePercentage
        };
      }),
      municipalityPerformance: aggregatedData.map(item => ({
        municipality: item.municipality,
        district: item.district,
        requiredBarangays: barangayCounts[item.municipality] || 0,
        totalPatrols: item.totalPatrols,
        activeDays: item.activeDays,
        inactiveDays: item.inactiveDays,
        activePercentage: item.activePercentage
      })),
      monthlyBreakdown: monthsInRange.map(({ month, year }) => {
        const monthYearId = `${String(month + 1).padStart(2, "0")}-${year}`;
        const monthData = ipatrollerPatrolData.filter(item => item.monthYearId === monthYearId);
        const monthTotalPatrols = monthData.reduce((sum, item) => sum + (item.totalPatrols || 0), 0);
        const monthActiveDays = monthData.reduce((sum, item) => sum + (item.activeDays || 0), 0);
        const monthInactiveDays = monthData.reduce((sum, item) => sum + (item.inactiveDays || 0), 0);
        const monthActivePercentage = (monthActiveDays + monthInactiveDays) > 0
          ? Math.round((monthActiveDays / (monthActiveDays + monthInactiveDays)) * 100)
          : 0;
        return {
          label: `${months[month]} ${year}`,
          municipalities: monthData.map(item => ({
            municipality: item.municipality,
            district: item.district,
            totalPatrols: item.totalPatrols || 0,
            activeDays: item.activeDays || 0,
            inactiveDays: item.inactiveDays || 0,
            activePercentage: item.activePercentage || 0
          })),
          totals: {
            totalPatrols: monthTotalPatrols,
            activeDays: monthActiveDays,
            inactiveDays: monthInactiveDays,
            activePercentage: monthActivePercentage
          }
        };
      })
    };

    setIpatrollerPreviewData(previewData);
    setShowIPatrollerPreview(true);
  };

  // Generate Monthly/Multi-Month Summary Report (supports date ranges)
  const generateIPatrollerMonthlySummaryReport = () => {
    setIsGeneratingIPatrollerReport(true);

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const overallSummary = calculateIPatrollerOverallSummary();

      // Aggregate data by municipality across all months
      const municipalityAggregates = {};
      ipatrollerPatrolData.forEach(item => {
        const key = item.municipality;
        if (!municipalityAggregates[key]) {
          municipalityAggregates[key] = {
            municipality: item.municipality,
            district: item.district,
            totalPatrols: 0,
            activeDays: 0,
            inactiveDays: 0
          };
        }
        municipalityAggregates[key].totalPatrols += item.totalPatrols || 0;
        municipalityAggregates[key].activeDays += item.activeDays || 0;
        municipalityAggregates[key].inactiveDays += item.inactiveDays || 0;
      });

      // Convert to array and calculate percentages
      const aggregatedData = Object.values(municipalityAggregates).map(item => ({
        ...item,
        activePercentage: (item.activeDays + item.inactiveDays) > 0
          ? Math.round((item.activeDays / (item.activeDays + item.inactiveDays)) * 100)
          : 0
      }));

      // Group by district
      const groupedData = aggregatedData.reduce((acc, item) => {
        if (!acc[item.district]) {
          acc[item.district] = [];
        }
        acc[item.district].push(item);
        return acc;
      }, {});

      // Determine report title and period
      const isMultiMonth = fromMonth !== toMonth || fromYear !== toYear;
      const reportTitle = isMultiMonth ? 'I-Patroller Multi-Month Summary Report' : 'I-Patroller Monthly Summary Report';
      const reportPeriod = isMultiMonth
        ? `${months[fromMonth]} ${fromYear} - ${months[toMonth]} ${toYear}`
        : `${months[fromMonth]} ${fromYear}`;

      // Header - Centered with tighter top spacing
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      const pageWidth = doc.internal.pageSize.width;
      const titleWidth = doc.getTextWidth(reportTitle);
      doc.text(reportTitle, (pageWidth - titleWidth) / 2, 20);

      // Report details - tighter vertical spacing
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const generatedText = `Generated: ${new Date().toLocaleDateString()}`;
      const periodText = `Report Period: ${reportPeriod}`;
      const dataSourceText = `Data Source: Based on IPatroller Daily Counts`;

      const generatedWidth = doc.getTextWidth(generatedText);
      const periodWidth = doc.getTextWidth(periodText);
      const dataSourceWidth = doc.getTextWidth(dataSourceText);

      doc.text(generatedText, (pageWidth - generatedWidth) / 2, 30);
      doc.text(periodText, (pageWidth - periodWidth) / 2, 36);
      doc.text(dataSourceText, (pageWidth - dataSourceWidth) / 2, 42);

      let currentY = 50;

      // District Summary Table - Show first
      if (Object.keys(groupedData).length > 0) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(isMultiMonth ? 'Overall District Summary' : 'District Summary', 20, currentY);

        const districtTableData = Object.keys(groupedData).map(district => {
          const districtMunicipalities = groupedData[district];
          const totalPatrols = districtMunicipalities.reduce((sum, m) => sum + m.totalPatrols, 0);
          const totalActive = districtMunicipalities.reduce((sum, m) => sum + m.activeDays, 0);
          const totalInactive = districtMunicipalities.reduce((sum, m) => sum + m.inactiveDays, 0);
          const avgActivePercentage = (totalActive + totalInactive) > 0
            ? Math.round((totalActive / (totalActive + totalInactive)) * 100)
            : 0;

          return [
            district,
            districtMunicipalities.length.toString(),
            totalPatrols.toLocaleString(),
            totalActive.toString(),
            totalInactive.toString(),
            `${avgActivePercentage}%`
          ];
        });

        autoTable(doc, {
          head: [['District', 'Municipalities', 'Total Patrols', 'Active Days', 'Inactive Days', 'Avg Active %']],
          body: districtTableData,
          startY: currentY + 5,
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

        currentY = doc.lastAutoTable.finalY + 15;
      }

      // Per-Month Breakdown (always included, even for single month)
      {
        // Add separator before monthly breakdown
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.line(20, currentY, pageWidth - 20, currentY);
        currentY += 10;

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Monthly Breakdown', 20, currentY);
        currentY += 7;

        // Group data by month
        const monthsInRange = getMonthsInRange(fromMonth, fromYear, toMonth, toYear);

        monthsInRange.forEach(({ month, year }) => {
          const monthYearId = `${String(month + 1).padStart(2, "0")}-${year}`;
          const monthData = ipatrollerPatrolData.filter(item => item.monthYearId === monthYearId);

          if (monthData.length > 0) {
            // Month header
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(`${months[month]} ${year}`, 20, currentY);
            currentY += 5;

            // Calculate month summary
            const monthTotalPatrols = monthData.reduce((sum, item) => sum + (item.totalPatrols || 0), 0);
            const monthActiveDays = monthData.reduce((sum, item) => sum + (item.activeDays || 0), 0);
            const monthInactiveDays = monthData.reduce((sum, item) => sum + (item.inactiveDays || 0), 0);
            const monthActivePercentage = (monthActiveDays + monthInactiveDays) > 0
              ? Math.round((monthActiveDays / (monthActiveDays + monthInactiveDays)) * 100)
              : 0;

            // Month data table
            const monthTableData = monthData.map(item => [
              item.municipality,
              item.district,
              (item.totalPatrols || 0).toLocaleString(),
              (item.activeDays || 0).toString(),
              (item.inactiveDays || 0).toString(),
              `${item.activePercentage || 0}%`
            ]);

            // Add summary row
            monthTableData.push([
              { content: 'Month Total', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
              { content: monthTotalPatrols.toLocaleString(), styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
              { content: monthActiveDays.toString(), styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
              { content: monthInactiveDays.toString(), styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
              { content: `${monthActivePercentage}%`, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }
            ]);

            autoTable(doc, {
              head: [['Municipality', 'District', 'Total Patrols', 'Active Days', 'Inactive Days', 'Active %']],
              body: monthTableData,
              startY: currentY,
              styles: {
                fontSize: 8,
                cellPadding: 2,
                overflow: 'linebreak',
                halign: 'left',
                lineColor: [0, 0, 0],
                lineWidth: 0.1
              },
              headStyles: {
                fillColor: [147, 51, 234], // Purple background for monthly tables
                fontStyle: 'bold',
                textColor: [255, 255, 255],
                fontSize: 9,
                lineColor: [0, 0, 0],
                lineWidth: 0.1
              },
              alternateRowStyles: {
                fillColor: [248, 250, 252]
              },
              columnStyles: {
                0: { cellWidth: 'auto', halign: 'left' },
                1: { cellWidth: 'auto', halign: 'left' },
                2: { cellWidth: 'auto', halign: 'center' },
                3: { cellWidth: 'auto', halign: 'center' },
                4: { cellWidth: 'auto', halign: 'center' },
                5: { cellWidth: 'auto', halign: 'center' }
              },
              margin: { left: 20, right: 20 },
              tableWidth: 'auto',
              didDrawPage: function (data) {
                const pageCount = doc.internal.getNumberOfPages();
                const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
                doc.setFontSize(8);
                doc.text(`Page ${currentPage} of ${pageCount}`, 20, doc.internal.pageSize.height - 10);
              }
            });

            currentY = doc.lastAutoTable.finalY + 10;
          }
        });
      }

      if (aggregatedData.length > 0) {
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
          styles: { fontSize: 9, cellPadding: 3, lineWidth: 0.1, lineColor: [0, 0, 0] },
          headStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: 'bold' },
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
          styles: { fontSize: 9, cellPadding: 3, lineWidth: 0.1, lineColor: [0, 0, 0] },
          headStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: 'bold' },
          columnStyles: {
            0: { cellWidth: 'auto', halign: 'left' },
            1: { cellWidth: 'auto', halign: 'center' },
            2: { cellWidth: 'auto', halign: 'left' },
            3: { cellWidth: 'auto', halign: 'center' }
          }
        });
      }

      // Save the PDF with appropriate filename
      const filename = isMultiMonth
        ? `ipatroller-summary-${months[fromMonth]}-${fromYear}-to-${months[toMonth]}-${toYear}.pdf`
        : `ipatroller-monthly-summary-${months[fromMonth]}-${fromYear}.pdf`;
      doc.save(filename);

    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingIPatrollerReport(false);
    }
  };

  const months = MONTH_NAMES;

  const districts = ["all", "1ST DISTRICT", "2ND DISTRICT", "3RD DISTRICT"];

  // Shared Top Barangay loader — reads current filter state via args so it's never stale
  const loadTopBarangayReport = useCallback(async (monthFilter, yearFilter) => {
    setIsLoadingTopBarangay(true);
    try {
      const allMunicipalities = Object.values(municipalitiesByDistrict).flat();
      const allQueries = [];
      const queryMap = [];
      const monthsToQuery = monthFilter === 'all'
        ? Array.from({ length: 12 }, (_, i) => i)
        : [parseInt(monthFilter)];
      for (const municipality of allMunicipalities) {
        for (const monthIndex of monthsToQuery) {
          const monthName = MONTH_NAMES[monthIndex];
          const monthYear = `${monthName}_${yearFilter}`;
          const docRef = doc(db, 'commandCenter', 'weeklyReports', municipality, monthYear);
          allQueries.push(getDoc(docRef));
          queryMap.push({ municipality, monthName });
        }
      }
      const [queryResults, barangaysResult] = await Promise.all([
        Promise.allSettled(allQueries),
        getBarangays()
      ]);
      const normalizeMunicipality = (mun) => {
        const s = (mun || '').trim();
        const lower = s.toLowerCase();
        if (lower === 'balanga' || lower === 'balanga city') return 'Balanga City';
        if (lower === 'dinalupihan') return 'Dinalupihan';
        if (lower === 'limay') return 'Limay';
        if (lower === 'orion') return 'Orion';
        if (lower === 'orani') return 'Orani';
        if (lower === 'abucay') return 'Abucay';
        if (lower === 'pilar') return 'Pilar';
        if (lower === 'hermosa') return 'Hermosa';
        if (lower === 'samal') return 'Samal';
        if (lower === 'bagac') return 'Bagac';
        if (lower === 'morong') return 'Morong';
        if (lower === 'mariveles') return 'Mariveles';
        return s;
      };
      const barangayTotals = {};
      const rawRegistered = barangaysResult.success ? barangaysResult.data : [];
      const seenRegistered = new Set();
      const allRegistered = [];
      rawRegistered.forEach(b => {
        const canonMun = normalizeMunicipality(b.municipality);
        const dedupeKey = `${b.name.trim().toLowerCase()}|||${canonMun.toLowerCase()}`;
        if (!seenRegistered.has(dedupeKey)) {
          seenRegistered.add(dedupeKey);
          allRegistered.push({ ...b, municipality: canonMun });
        }
      });
      const canonicalLookup = {};
      allRegistered.forEach(b => {
        const key = `${b.name}|||${b.municipality}`;
        barangayTotals[key] = { name: b.name, municipality: b.municipality, total: 0, registered: true, actionTakenCount: 0 };
        if (!canonicalLookup[b.municipality]) canonicalLookup[b.municipality] = {};
        canonicalLookup[b.municipality][b.name.toLowerCase()] = key;
      });
      const parseBarangayName = (raw) => {
        const s = (raw || '').trim();
        if (!s) return '';
        const commaIdx = s.indexOf(',');
        return commaIdx > 0 ? s.substring(0, commaIdx).trim() : s;
      };
      queryResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.exists()) {
          const canonMun = normalizeMunicipality(queryMap[index].municipality);
          const weeklyData = result.value.data().weeklyReportData || {};
          Object.values(weeklyData).forEach(dateEntries => {
            if (!Array.isArray(dateEntries)) return;
            dateEntries.forEach(entry => {
              const rawBarangay = (entry.barangay || '').trim();
              if (!rawBarangay) return;
              const bname = parseBarangayName(rawBarangay);
              
              // Sum up the activity quantities for this entry across week1-week4
              let activityCount = 0;
              ['week1', 'week2', 'week3', 'week4'].forEach(w => {
                const val = parseInt(entry[w], 10);
                if (!isNaN(val)) activityCount += val;
              });
              // Fallback to 1 if user left them blank but there's an entry, or keep it strictly zero if they put zero?
              // The user said "entries dapat tugma sa command center page na nilalagay nilang counts"
              // So if counts sum to 0, it contributes 0. Except maybe they didn't input anything yet? 
              // We will just strictly add the numeric values.

              let hasAfterPhoto = false;
              if (entry?.photos?.rows && Array.isArray(entry.photos.rows)) {
                hasAfterPhoto = entry.photos.rows.some(row => row.after && Array.isArray(row.after) && row.after.length > 0);
              } else if (entry?.photos?.after) {
                const afterData = entry.photos.after;
                hasAfterPhoto = Array.isArray(afterData) ? afterData.length > 0 : !!afterData;
              }
              const actionCount = hasAfterPhoto ? 1 : 0;

              const munMap = canonicalLookup[canonMun] || {};
              const canonicalKey = munMap[bname.toLowerCase()];
              if (canonicalKey) {
                barangayTotals[canonicalKey].total += activityCount;
                barangayTotals[canonicalKey].actionTakenCount += actionCount;
              } else {
                const fallbackKey = `${bname}|||${canonMun}`;
                if (!barangayTotals[fallbackKey]) {
                  barangayTotals[fallbackKey] = { name: bname, municipality: canonMun, total: 0, actionTakenCount: 0 };
                }
                barangayTotals[fallbackKey].total += activityCount;
                barangayTotals[fallbackKey].actionTakenCount += actionCount;
              }
            });
          });
        }
      });
      const ranked = Object.values(barangayTotals).sort((a, b) => b.actionTakenCount - a.actionTakenCount || b.total - a.total);
      const rankedWithActivity = ranked.filter(b => b.total > 0 || b.actionTakenCount > 0);
      setTopBarangayData({ ranked, rankedWithActivity, year: yearFilter, month: monthFilter });
      setShowTopBarangay(true);
    } catch (err) {
      console.error('Error loading Top Barangay data:', err);
      alert('Error loading Top Barangay data.');
    } finally {
      setIsLoadingTopBarangay(false);
    }
  }, [getBarangays, municipalitiesByDistrict]);

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

    // Main title - centered and bold
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('I-Patroller Monthly Summary Report', centerX, 25, { align: 'center' });

    // Report details - centered
    const isMultiMonth = fromMonth !== toMonth || fromYear !== toYear;
    const reportPeriod = isMultiMonth
      ? `${months[fromMonth]} ${fromYear} - ${months[toMonth]} ${toYear}`
      : `${months[fromMonth]} ${fromYear}`;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, centerX, 35, { align: 'center' });
    doc.text(`Report Period: ${reportPeriod}`, centerX, 42, { align: 'center' });
    doc.text('Data Source: Based on IPatroller Daily Counts', centerX, 49, { align: 'center' });

    // District Summary Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('District Summary', 20, 75);

    // Calculate district summary data
    const districtSummaryData = [];
    Object.keys(municipalitiesByDistrict).forEach(district => {
      const municipalities = municipalitiesByDistrict[district];
      let totalPatrols = 0;
      let activeDays = 0;
      let inactiveDays = 0;

      municipalities.forEach(municipality => {
        const municipalityData = ipatrollerData?.find(item => item.municipality === municipality);
        if (municipalityData) {
          const stats = calculatePatrolStats(municipalityData.data);
          totalPatrols += stats.totalPatrols;
          activeDays += stats.activeDays;
          inactiveDays += stats.inactiveDays;
        }
      });

      const avgActivePercentage = (activeDays + inactiveDays) > 0
        ? Math.round((activeDays / (activeDays + inactiveDays)) * 100)
        : 0;

      districtSummaryData.push([
        district,
        municipalities.length.toString(),
        totalPatrols.toLocaleString(),
        activeDays.toString(),
        inactiveDays.toString(),
        `${avgActivePercentage}%`
      ]);
    });

    // District Summary Table
    autoTable(doc, {
      head: [['District', 'Municipalities', 'Total Patrols', 'Active Days', 'Inactive Days', 'Avg Active %']],
      body: districtSummaryData,
      startY: 80,
      styles: {
        fontSize: 9,
        cellPadding: 3,
        overflow: 'linebreak',
        halign: 'center',
        lineColor: [0, 0, 0],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [59, 130, 246], // Blue background
        fontStyle: 'bold',
        textColor: [255, 255, 255],
        fontSize: 10,
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // Light gray alternating rows
      },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center' }
      },
      margin: { left: 20, right: 20 }
    });

    // Overall Summary Statistics Section
    const overallFinalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 200;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Overall Summary Statistics', 20, overallFinalY);

    // Calculate overall statistics
    const overallSummary = calculateOverallSummary();
    const totalMunicipalities = Object.values(municipalitiesByDistrict).flat().length;

    const overallStatsData = [
      ['Total Patrols', overallSummary.totalPatrols.toLocaleString(), 'Average Active Percentage', `${overallSummary.avgActivePercentage}%`],
      ['Total Active Days', overallSummary.totalActive.toString(), 'Total Municipalities', totalMunicipalities.toString()],
      ['Total Inactive Days', overallSummary.totalInactive.toString(), '', '']
    ];

    // Overall Summary Statistics Table
    autoTable(doc, {
      body: overallStatsData,
      startY: overallFinalY + 5,
      styles: {
        fontSize: 10,
        cellPadding: 4,
        overflow: 'linebreak',
        halign: 'left',
        lineColor: [0, 0, 0],
        lineWidth: 0.1
      },
      columnStyles: {
        0: { fontStyle: 'bold', halign: 'left', cellWidth: 40 },
        1: { halign: 'left', cellWidth: 40 },
        2: { fontStyle: 'bold', halign: 'left', cellWidth: 40 },
        3: { halign: 'left', cellWidth: 40 }
      },
      margin: { left: 20, right: 20 },
      showHead: false
    });

    // Page footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Page ${i} of ${pageCount}`, centerX, doc.internal.pageSize.height - 10, { align: 'center' });
    }

    // Save with appropriate filename
    const filename = (fromMonth !== toMonth || fromYear !== toYear)
      ? `ipatroller-summary-${months[fromMonth]}-${fromYear}-to-${months[toMonth]}-${toYear}.pdf`
      : `ipatroller-monthly-summary-${months[fromMonth]}-${fromYear}.pdf`;
    doc.save(filename);
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
    // Use actionItems (loaded from fetchAllActionData) instead of actionReports from DataContext
    let filteredActions = actionItems.length > 0 ? actionItems : (actionReports || []);

    console.log('📊 Generating Action Center Report with', filteredActions.length, 'total actions');

    if (selectedMonth !== 'all' && selectedYear !== 'all') {
      filteredActions = filteredActions.filter(action => {
        const actionDate = action.when ? new Date(action.when) : null;
        if (!actionDate) return false;
        return actionDate.getMonth() === selectedMonth && actionDate.getFullYear() === selectedYear;
      });
      console.log('📅 After month/year filter:', filteredActions.length, 'actions');
    }
    if (selectedDistrict !== 'all') {
      filteredActions = filteredActions.filter(action => action.district === selectedDistrict);
      console.log('🗺️ After district filter:', filteredActions.length, 'actions');
    }

    // Department breakdown
    const departmentStats = {};
    filteredActions.forEach(action => {
      const dept = action.department || 'Unknown';
      if (!departmentStats[dept]) {
        departmentStats[dept] = { count: 0, pending: 0, resolved: 0 };
      }
      departmentStats[dept].count++;

      // Check both status and actionTaken fields (actionTaken is the actual field used)
      const status = (action.status || action.actionTaken || '').toLowerCase();
      if (status.includes('pending') || status.includes('ongoing') || status.includes('investigation')) {
        departmentStats[dept].pending++;
      } else if (status.includes('resolved') || status.includes('arrested') || status.includes('filed')) {
        departmentStats[dept].resolved++;
      } else {
        // Default to pending if status is unclear
        departmentStats[dept].pending++;
      }
    });

    // Department Statistics section - cleaner design
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Department Statistics', centerX, 120, { align: 'center' });

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
        startY: 130,
        styles: {
          fontSize: 10,
          cellPadding: 3,
          overflow: 'linebreak',
          halign: 'center',
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        headStyles: {
          fillColor: [147, 51, 234],
          fontStyle: 'bold',
          textColor: [255, 255, 255],
          fontSize: 11,
          halign: 'center'
        },
        columnStyles: {
          0: { halign: 'left', cellWidth: 'auto' },
          1: { halign: 'center', cellWidth: 'auto' },
          2: { halign: 'center', cellWidth: 'auto' },
          3: { halign: 'center', cellWidth: 'auto' },
          4: { halign: 'center', cellWidth: 'auto' }
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
    } else {
      // No data message
      doc.setFontSize(12);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text('No action reports available for the selected period.', centerX, 150, { align: 'center' });
    }

    doc.save(`action-center-${months[selectedMonth]}-${selectedYear}-${paperSize}.pdf`);
  };

  const generateActionCenterReportJanFebByDepartment = async (department, year = actionCenterReportYear, fromMonth = actionCenterFromMonth, toMonth = actionCenterToMonth) => {
    setIsGeneratingActionCenterRangeReport(true);
    try {
      const normalizedDept = department === 'PG-ENRO' ? 'pg-enro' : department.toLowerCase();

      const paperConfig = getPaperConfig(paperSize);
      const doc = new jsPDF('p', 'mm', paperConfig.format);

      const pageWidth = doc.internal.pageSize.getWidth();
      const centerX = pageWidth / 2;

      const usableWidth = pageWidth - (paperConfig.margin * 2);
      const baseColumnWidths = [16, 18, 18, 36, 16, 36, 44];
      const baseTotalWidth = baseColumnWidths.reduce((sum, w) => sum + w, 0);
      const scale = baseTotalWidth > 0 ? Math.min(1, usableWidth / baseTotalWidth) : 1;
      let scaledWidths = baseColumnWidths.map(w => Math.max(12, Math.floor(w * scale * 10) / 10));

      // If mins still overflow (portrait is narrow), shrink flexible columns further.
      const sumWidths = () => scaledWidths.reduce((sum, w) => sum + w, 0);
      if (sumWidths() > usableWidth) {
        const overflow = sumWidths() - usableWidth;
        const flexibleIdx = [3, 5, 6];
        const flexibleTotal = flexibleIdx.reduce((sum, i) => sum + scaledWidths[i], 0);
        flexibleIdx.forEach(i => {
          const share = flexibleTotal > 0 ? (scaledWidths[i] / flexibleTotal) : (1 / flexibleIdx.length);
          const reduceBy = overflow * share;
          scaledWidths[i] = Math.max(24, Math.floor((scaledWidths[i] - reduceBy) * 10) / 10);
        });
      }

      const firstSixWidth = scaledWidths.slice(0, 6).reduce((sum, w) => sum + w, 0);
      scaledWidths[6] = Math.max(30, Math.floor((usableWidth - firstSixWidth) * 10) / 10);

      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Action Center Report', centerX, 18, { align: 'center' });

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`${department} | ${months[fromMonth]} - ${months[toMonth]} ${year}`, centerX, 26, { align: 'center' });

      let filteredActions = actionItems.length > 0 ? actionItems : (actionReports || []);

      const parseSafeDate = (value) => {
        if (!value) return null;
        let s = String(value).replace(/at about/ig, '').replace(/at around/ig, '').trim();
        const d = new Date(s);
        return !isNaN(d.getTime()) ? d : null;
      };

      const getComparableDate = (value) => {
        const d = parseSafeDate(value);
        return d ? d.getTime() : null;
      };

      const sortActions = (actions) => {
        return [...actions].sort((a, b) => {
          const aTime = getComparableDate(a?.when);
          const bTime = getComparableDate(b?.when);
          if (aTime !== null && bTime !== null && aTime !== bTime) return aTime - bTime;
          if (aTime !== null && bTime === null) return -1;
          if (aTime === null && bTime !== null) return 1;
          const aMun = (a?.municipality || '').toString().toLowerCase();
          const bMun = (b?.municipality || '').toString().toLowerCase();
          if (aMun < bMun) return -1;
          if (aMun > bMun) return 1;
          return 0;
        });
      };

      // Build per-month action arrays for every month in the selected range
      const monthRange = [];
      for (let m = fromMonth; m <= toMonth; m++) {
        const monthActions = filteredActions.filter(action => {
          const dept = (action.department || '').toLowerCase();
          if (dept !== normalizedDept) return false;
          if (selectedDistrict !== 'all') {
            if ((action.district || '') !== selectedDistrict) return false;
          }
          const actionDate = parseSafeDate(action.when);
          if (!actionDate) return false;
          return actionDate.getFullYear() === Number(year) && actionDate.getMonth() === m;
        });
        monthRange.push({ month: m, actions: sortActions(monthActions) });
      }
      const infoY = 40;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, paperConfig.margin, infoY);
      doc.text(`District: ${selectedDistrict === 'all' ? 'All Districts' : selectedDistrict}`, paperConfig.margin, infoY + 6);
      const startY = infoY + 16;

      const deptAbbr = (dept) => {
        const d = (dept || '').toLowerCase();
        if (d === 'agriculture') return 'AGRI';
        if (d === 'pg-enro') return 'PG-ENRO';
        if (d === 'pnp') return 'PNP';
        return (dept || '').toUpperCase();
      };

      // Inline what-label cleaner (mirrors ActionCenter.jsx cleanWhatLabel)
      const cleanWhatForReport = (raw) => {
        if (!raw) return '';
        let text = raw.trim();
        const greetingRx = /^(good\s+(morning|afternoon|evening|night|day)|hello|hi|magandang|maayong|kumusta|greetings)\b/i;
        if (greetingRx.test(text)) {
          const idx = text.search(/alleged\s+illegal/i);
          if (idx > 0) text = text.slice(idx);
          else return text; // keep raw if no pattern found
        }
        let cleaned = text
          .replace(/\s*\([^)]*\)/g, '')
          .replace(/\s*\([^)]*$/, '')
          .replace(/,.*$/, '')
          .trim();
        const words = cleaned.split(/\s+/);
        // Normalize "Allegedly" → "Alleged" so both spellings map to the same label
        if (/^allegedly$/i.test(words[0])) {
          words[0] = 'Alleged';
          cleaned = words.join(' ');
        }
        if (words[0]?.toLowerCase() === 'alleged' && words[1]?.toLowerCase() === 'illegal') {
          if (words.length > 3) {
            const w4 = words[3]?.toLowerCase();
            if (
              ['of', 'using', 'with', 'via', 'ng', 'sa', 'na'].includes(w4) &&
              words.length >= 5
            ) {
              // "Alleged Illegal User of Dragon Bubu ..." → up to 6 words (preserve object)
              cleaned = words.slice(0, Math.min(6, words.length)).join(' ');
            } else {
              // "Allegedly Illegal Sapra and Sudsud seen" → "Alleged Illegal Sapra"
              // "Allegedly Illegal Sapra seen"            → "Alleged Illegal Sapra"
              cleaned = words.slice(0, 3).join(' ');
            }
          }
          return cleaned;
        }
        const stopW = new Set(['of', 'for', 'in', 'at', 'with', 'by', 'the', 'a', 'an', 'and']);
        const si = words.findIndex((w, i) => i > 0 && stopW.has(w.toLowerCase()));
        if (si > 0) cleaned = words.slice(0, si).join(' ');
        return cleaned;
      };

      const fmtDate = (when) => {
        if (!when) return '';
        const d = parseSafeDate(when);
        return d ? d.toLocaleDateString() : String(when);
      };

      const drawMonthSection = (title, actions, y) => {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(title, paperConfig.margin, y);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total Records: ${actions.length}`, paperConfig.margin, y + 6);

        if (actions.length === 0) return y + 20;

        // ── Group by district ──────────────────────────────────────────────
        const districtOrder = ['1ST DISTRICT', '2ND DISTRICT', '3RD DISTRICT'];
        const byDistrict = {};
        actions.forEach(a => {
          const dist = (a.district || 'UNKNOWN').trim().toUpperCase();
          if (!byDistrict[dist]) byDistrict[dist] = [];
          byDistrict[dist].push(a);
        });
        const orderedDistricts = [
          ...districtOrder.filter(d => byDistrict[d]),
          ...Object.keys(byDistrict).filter(d => !districtOrder.includes(d) && byDistrict[d])
        ];

        // ── Build flat body array with header rows ─────────────────────────
        const tableBody = [];

        orderedDistricts.forEach(dist => {
          // District header — spans all 7 columns
          tableBody.push([{
            content: `  ${dist}`,
            colSpan: 7,
            styles: {
              fontStyle: 'bold',
              fillColor: [180, 180, 180],
              textColor: [0, 0, 0],
              halign: 'left',
              fontSize: 8.5,
              cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 2 }
            }
          }]);

          // Group by cleaned what label
          const byWhat = {};
          byDistrict[dist].forEach(a => {
            const label = cleanWhatForReport(a.what || '') || (a.what || 'Unknown');
            const key = label.toLowerCase().trim();
            if (!byWhat[key]) byWhat[key] = { label, items: [] };
            byWhat[key].items.push(a);
          });

          // Sort what-groups alphabetically
          const whatGroups = Object.values(byWhat)
            .sort((a, b) => a.label.localeCompare(b.label));

          whatGroups.forEach(({ label: whatLabel, items: whatItems }) => {
            // Sort items within the group by date (ascending)
            const sorted = [...whatItems].sort((a, b) => {
              const dA = parseSafeDate(a.when);
              const dB = parseSafeDate(b.when);
              const at = dA ? dA.getTime() : 0;
              const bt = dB ? dB.getTime() : 0;
              return at - bt;
            });

            // Compute date range for the group
            const validDates = sorted
              .map(a => parseSafeDate(a.when))
              .filter(d => d !== null);
            const minD = validDates.length ? new Date(Math.min(...validDates.map(d => d.getTime()))) : null;
            const maxD = validDates.length ? new Date(Math.max(...validDates.map(d => d.getTime()))) : null;
            const dateRange = minD && maxD
              ? minD.getTime() === maxD.getTime()
                ? minD.toLocaleDateString()
                : `${minD.toLocaleDateString()} – ${maxD.toLocaleDateString()}`
              : '';

            // What-type group header — spans all 7 columns
            tableBody.push([{
              content: `    ${whatLabel}${dateRange ? '   |   ' + dateRange : ''}`,
              colSpan: 7,
              styles: {
                fontStyle: 'bold',
                fillColor: [235, 235, 235],
                textColor: [30, 30, 30],
                halign: 'left',
                fontSize: 7.5,
                cellPadding: { top: 1.5, bottom: 1.5, left: 8, right: 2 }
              }
            }]);

            // Individual rows for this what-group
            sorted.forEach(a => {
              tableBody.push([
                deptAbbr(a.department),
                a.municipality || '',
                a.district || '',
                a.what || '',
                fmtDate(a.when),
                a.where || '',
                (a.actionTaken && a.actionTaken.toLowerCase() !== 'pending' ? a.actionTaken : '')
              ]);
            });
          });
        });

        autoTable(doc, {
          head: [['Dept', 'Mun', 'Dist', 'What', 'Date', 'Where', 'Action']],
          body: tableBody,
          startY: y + 10,
          styles: {
            fontSize: 8,
            cellPadding: 1.5,
            overflow: 'linebreak',
            valign: 'top',
            halign: 'left',
            textColor: [0, 0, 0],
            lineColor: [0, 0, 0],
            lineWidth: 0.1
          },
          headStyles: {
            fillColor: [230, 230, 230],
            fontStyle: 'bold',
            textColor: [0, 0, 0],
            fontSize: 9,
            halign: 'center',
            valign: 'middle',
            lineColor: [0, 0, 0],
            lineWidth: 0.2,
            overflow: 'visible',
            cellPadding: 2,
            minCellHeight: 8
          },
          theme: 'grid',
          tableLineColor: [0, 0, 0],
          tableLineWidth: 0.2,
          columnStyles: {
            0: { halign: 'center', cellWidth: scaledWidths[0] },
            1: { cellWidth: scaledWidths[1] },
            2: { halign: 'center', cellWidth: scaledWidths[2] },
            3: { cellWidth: scaledWidths[3] },
            4: { halign: 'center', cellWidth: scaledWidths[4] },
            5: { cellWidth: scaledWidths[5] },
            6: { cellWidth: scaledWidths[6] }
          },
          margin: { left: paperConfig.margin, right: paperConfig.margin },
          showHead: 'everyPage',
          tableWidth: 'wrap',
          rowPageBreak: 'avoid',
          pageBreak: 'auto'
        });

        return doc.lastAutoTable?.finalY || (y + 25);
      };

      let nextY = startY;
      for (const { month, actions } of monthRange) {
        if (actions.length === 0) continue; // skip months with no data
        if (nextY !== startY) {
          const pageHeight = doc.internal.pageSize.getHeight();
          if (pageHeight - nextY < 60) {
            doc.addPage();
            nextY = paperConfig.margin;
          } else {
            nextY += 12;
          }
        }
        nextY = drawMonthSection(`${months[month]} ${year}`, actions, nextY);
      }

      const filename = `action-center-${normalizedDept}-${months[fromMonth].toLowerCase()}-${months[toMonth].toLowerCase()}-${year}-${paperSize}.pdf`;
      doc.save(filename);
    } finally {
      setIsGeneratingActionCenterRangeReport(false);
    }
  };

  // Incidents Report (matching Incidents Reports data structure) - Compact Single Page
  const generateIncidentsReport = () => {
    const paperConfig = getPaperConfig(paperSize);
    const doc = new jsPDF('p', 'mm', paperConfig.format);

    // Calculate center position
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const centerX = pageWidth / 2;

    // Add compact header section
    doc.setFillColor(239, 68, 68); // Red background
    doc.rect(0, 0, pageWidth, 30, 'F'); // Reduced height

    // Main title - centered and smaller
    doc.setFontSize(18); // Reduced from 24
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('Incidents Report', centerX, 20, { align: 'center' });

    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Compact report info section
    doc.setFontSize(12); // Reduced from 14
    doc.setFont('helvetica', 'bold');
    doc.text('Report Information', centerX, 45, { align: 'center' });

    // Compact info box
    const infoY = 50;
    const infoBoxHeight = 25; // Reduced from 35
    doc.setFillColor(248, 250, 252);
    doc.rect(paperConfig.margin, infoY - 3, pageWidth - (paperConfig.margin * 2), infoBoxHeight, 'F');
    doc.setDrawColor(239, 68, 68);
    doc.rect(paperConfig.margin, infoY - 3, pageWidth - (paperConfig.margin * 2), infoBoxHeight, 'S');

    // Compact report details in two columns
    doc.setFontSize(9); // Reduced from 10
    doc.setFont('helvetica', 'normal');
    const leftCol = paperConfig.margin + 5;
    const rightCol = centerX + 10;

    doc.text(`Generated: ${new Date().toLocaleDateString()}`, leftCol, infoY + 5);
    doc.text(`Month: ${months[selectedMonth]}`, leftCol, infoY + 12);
    doc.text(`Year: ${selectedYear}`, rightCol, infoY + 5);
    doc.text(`District: ${selectedDistrict === 'all' ? 'All Districts' : selectedDistrict}`, rightCol, infoY + 12);

    // Paper size indicator
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.text(`Paper: ${paperConfig.name}`, pageWidth - paperConfig.margin - 5, infoY + 19, { align: 'right' });

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

    // Compact statistics section
    const statsStartY = infoY + infoBoxHeight + 10; // Reduced spacing
    doc.setFontSize(12); // Reduced from 16
    doc.setFont('helvetica', 'bold');
    doc.text('Incident Statistics', centerX, statsStartY, { align: 'center' });

    // Compact statistics box
    const statsY = statsStartY + 8;
    const boxWidth = pageWidth - (paperConfig.margin * 2);
    const boxHeight = 20; // Reduced from 35

    doc.setFillColor(254, 242, 242);
    doc.rect(paperConfig.margin, statsY - 3, boxWidth, boxHeight, 'F');
    doc.setDrawColor(239, 68, 68);
    doc.rect(paperConfig.margin, statsY - 3, boxWidth, boxHeight, 'S');

    // Statistics in horizontal layout
    doc.setFontSize(9); // Reduced from 11
    doc.setFont('helvetica', 'normal');

    const stat1X = paperConfig.margin + 10;
    const stat2X = centerX - 30;
    const stat3X = centerX + 30;

    doc.text(`Total Incidents: ${filteredIncidents.length}`, stat1X, statsY + 8);
    doc.text(`Active Cases: ${filteredIncidents.filter(i => i.status === 'Active').length}`, stat2X, statsY + 8);
    doc.text(`Resolved Cases: ${filteredIncidents.filter(i => i.status === 'Resolved').length}`, stat3X, statsY + 8);

    // Compact incident type breakdown table
    if (Object.keys(incidentTypeStats).length > 0) {
      const tableData = Object.entries(incidentTypeStats)
        .sort(([, a], [, b]) => b.count - a.count)
        .map(([type, stats]) => [
          type,
          stats.count.toString(),
          stats.active.toString(),
          stats.resolved.toString(),
          `${((stats.resolved / stats.count) * 100).toFixed(1)}%`
        ]);

      // Compact table positioning
      const tableStartY = statsY + boxHeight + 8; // Reduced spacing

      // Compact table title
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Incident Type Breakdown', centerX, tableStartY, { align: 'center' });

      autoTable(doc, {
        head: [['Incident Type', 'Total', 'Active', 'Resolved', 'Resolution Rate']],
        body: tableData,
        startY: tableStartY + 6,
        styles: {
          fontSize: 8, // Reduced font size
          cellPadding: 2, // Reduced padding
          overflow: 'linebreak',
          halign: 'left',
          valign: 'middle'
        },
        headStyles: {
          fillColor: [239, 68, 68],
          fontStyle: 'bold',
          textColor: [255, 255, 255],
          fontSize: 9, // Reduced header font
          halign: 'center',
          valign: 'middle'
        },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 20, halign: 'center' },
          4: { cellWidth: 25, halign: 'center' }
        },
        margin: { left: paperConfig.margin, right: paperConfig.margin },
        tableWidth: 'auto',
        showHead: 'firstPage',
        pageBreak: 'avoid', // Prevent page breaks
        theme: 'grid'
      });
    } else {
      // Compact no data message
      const noDataY = statsY + boxHeight + 15;
      doc.setFontSize(10);
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

      // Load fresh data for report generation
      let reportData = commandCenterData;

      // Always reload data to ensure we have the latest
      console.log('⚡ Loading fresh Command Center data for report with parallel queries...');
      const startTime = performance.now();
      const monthName = months[selectedMonth];
      const monthYear = `${monthName}_${selectedYear}`;
      const allMunicipalities = Object.values(municipalitiesByDistrict).flat();

      // Create all Firebase queries in parallel
      const municipalityQueries = allMunicipalities.map(municipality => {
        const docRef = doc(db, 'commandCenter', 'weeklyReports', municipality, monthYear);
        return getDoc(docRef);
      });

      // Load all data in parallel
      const [municipalityResults, barangaysResult, concernTypesResult] = await Promise.all([
        Promise.allSettled(municipalityQueries),
        getBarangays(),
        getConcernTypes()
      ]);

      // Process results
      const commandCenterReports = {};
      municipalityResults.forEach((result, index) => {
        const municipality = allMunicipalities[index];
        if (result.status === 'fulfilled' && result.value.exists()) {
          const municipalityData = result.value.data();
          console.log(`✅ Loaded ${municipality} for report`);
          commandCenterReports[municipality] = municipalityData;
        } else if (result.status === 'rejected') {
          console.error(`❌ Error loading ${municipality}:`, result.reason);
        }
      });

      const endTime = performance.now();
      console.log(`✅ Data loaded in ${((endTime - startTime) / 1000).toFixed(2)}s`);

      reportData = {
        reports: commandCenterReports,
        barangays: barangaysResult.success ? barangaysResult.data : [],
        concernTypes: concernTypesResult.success ? concernTypesResult.data : []
      };

      console.log('📊 Report data loaded:', {
        municipalities: Object.keys(reportData.reports).length,
        barangays: reportData.barangays.length,
        concernTypes: reportData.concernTypes.length
      });

      const paperConfig = getPaperConfig(paperSize);
      const pdfDoc = new jsPDF('p', 'mm', paperConfig.format);

      // Calculate center position
      const pageWidth = pdfDoc.internal.pageSize.getWidth();
      const centerX = pageWidth / 2;

      // ============ PAGE 1: COVER PAGE ============

      // Add logo/header section - Full width banner
      pdfDoc.setFillColor(16, 185, 129); // Green background
      pdfDoc.rect(0, 0, pageWidth, 50, 'F');

      // Main title - centered
      pdfDoc.setFontSize(28);
      pdfDoc.setFont('helvetica', 'bold');
      pdfDoc.setTextColor(255, 255, 255);
      pdfDoc.text('Command Center Report', centerX, 32, { align: 'center' });

      // Reset text color
      pdfDoc.setTextColor(0, 0, 0);

      // Report Information Section - Table Style
      let currentY = 65;
      pdfDoc.setFontSize(14);
      pdfDoc.setFont('helvetica', 'bold');
      pdfDoc.text('Report Information', centerX, currentY, { align: 'center' });
      currentY += 8;

      // Report Information Table - Compact
      const reportInfoData = [
        ['Generated Date', new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })],
        ['Report Month', months[selectedMonth]],
        ['Report Year', selectedYear.toString()],
        ['District Filter', selectedDistrict === 'all' ? 'All Districts' : selectedDistrict],
        ['Paper Size', paperConfig.name]
      ];

      autoTable(pdfDoc, {
        body: reportInfoData,
        startY: currentY,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 3,
          lineColor: [200, 200, 200],
          lineWidth: 0.3
        },
        columnStyles: {
          0: {
            cellWidth: 50,
            fontStyle: 'bold',
            fillColor: [240, 253, 244],
            halign: 'left'
          },
          1: {
            cellWidth: 'auto',
            halign: 'left'
          }
        },
        margin: { left: paperConfig.margin, right: paperConfig.margin }
      });

      currentY = pdfDoc.lastAutoTable.finalY + 12;

      // Command Center Overview Section - Table Style
      pdfDoc.setFontSize(14);
      pdfDoc.setFont('helvetica', 'bold');
      pdfDoc.text('Command Center Overview', centerX, currentY, { align: 'center' });
      currentY += 8;

      // Calculate real statistics from Command Center data
      const reports = reportData.reports || {};
      const totalMunicipalities = Object.keys(reports).length;
      const totalReports = Object.values(reports).reduce((sum, report) => {
        if (report.weeklyReportData) {
          return sum + Object.values(report.weeklyReportData).reduce((dateSum, dateEntries) => {
            return dateSum + (Array.isArray(dateEntries) ? dateEntries.length : 0);
          }, 0);
        }
        return sum;
      }, 0);

      const totalBarangays = reportData.barangays ? reportData.barangays.length : 0;
      const totalConcernTypes = reportData.concernTypes ? reportData.concernTypes.length : 0;

      // Command Center Statistics Table - Compact
      const statsData = [
        ['Total Municipalities', totalMunicipalities.toString()],
        ['Total Reports', totalReports.toString()],
        ['Total Barangays', totalBarangays.toString()],
        ['Total Concern Types', totalConcernTypes.toString()],
        ['Reporting Period', `${months[selectedMonth]} ${selectedYear}`],
        ['Data Status', isLoadingCommandCenter ? 'Loading...' : 'Current']
      ];

      autoTable(pdfDoc, {
        body: statsData,
        startY: currentY,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 3,
          lineColor: [200, 200, 200],
          lineWidth: 0.3
        },
        columnStyles: {
          0: {
            cellWidth: 50,
            fontStyle: 'bold',
            fillColor: [240, 253, 244],
            halign: 'left'
          },
          1: {
            cellWidth: 'auto',
            halign: 'left',
            fontSize: 10,
            fontStyle: 'bold',
            textColor: [16, 185, 129]
          }
        },
        margin: { left: paperConfig.margin, right: paperConfig.margin }
      });

      // Add footer note on first page
      currentY = pdfDoc.lastAutoTable.finalY + 20;
      pdfDoc.setFontSize(9);
      pdfDoc.setFont('helvetica', 'italic');
      pdfDoc.setTextColor(100, 100, 100);
      pdfDoc.text('Detailed breakdown by district, municipality, and barangay follows on the next pages.', centerX, currentY, { align: 'center' });
      pdfDoc.setTextColor(0, 0, 0);

      // ============ START PAGE 2: DISTRICT DATA ============
      pdfDoc.addPage();

      // Process real Command Center data to create district-based hierarchical structure
      const processCommandCenterData = () => {
        const districtData = {};
        const reports = reportData.reports || {};
        const barangays = reportData.barangays || [];

        console.log('🔍 Processing Command Center Data:');
        console.log('📊 Reports:', reports);
        console.log('📊 Reports keys:', Object.keys(reports));
        console.log('🏘️ Barangays:', barangays.length);
        console.log('📋 Command Center Data:', commandCenterData);

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
          console.log(`🏙️ Processing municipality: ${municipality}`, reportData);
          const district = getDistrictForMunicipality(municipality);
          const weeklyData = reportData.weeklyReportData || {};

          // Initialize district if not exists
          if (!districtData[district]) {
            districtData[district] = {};
          }

          // Get barangays for this municipality
          const municipalityBarangays = barangays.filter(b => b.municipality === municipality);

          const barangayData = {};

          // Process each barangay's data
          municipalityBarangays.forEach(barangay => {
            const barangayName = barangay.name;
            const concernTypeData = {};
            let totalReports = 0;

            // Count concern types for this barangay across all dates
            Object.values(weeklyData).forEach(dateEntries => {
              if (Array.isArray(dateEntries)) {
                dateEntries.forEach(entry => {
                  // Check if this entry is for the current barangay
                  if (entry.barangay && entry.barangay.includes(barangayName)) {
                    totalReports++;

                    // Count concern type with action taken tracking
                    if (entry.concernType) {
                      if (!concernTypeData[entry.concernType]) {
                        concernTypeData[entry.concernType] = {
                          total: 0,
                          actionTaken: 0
                        };
                      }
                      concernTypeData[entry.concernType].total++;

                      // Check if action was taken
                      if (entry.actionTaken && entry.actionTaken.trim() !== '') {
                        concernTypeData[entry.concernType].actionTaken++;
                      }
                    }
                  }
                });
              }
            });

            // Convert concern type data to array format
            const concernTypes = Object.entries(concernTypeData).map(([type, data]) => ({
              type,
              total: data.total,
              actionTaken: data.actionTaken
            }));

            // Only include barangays that have data
            if (totalReports > 0) {
              barangayData[barangayName] = {
                concernTypes,
                totalReports
              };
            }
          });

          // Only include municipalities that have barangay data
          if (Object.keys(barangayData).length > 0) {
            districtData[district][municipality] = {
              barangays: barangayData
            };
          }
        });

        console.log('✅ Final districtData:', districtData);
        console.log('✅ District keys:', Object.keys(districtData));
        return districtData;
      };

      const districtData = processCommandCenterData();
      console.log('📦 Processed districtData:', districtData);

      // Filter districts by selected district
      let filteredDistricts = Object.entries(districtData);
      console.log('🔍 All districts:', filteredDistricts.map(([d]) => d));
      console.log('🎯 Selected district:', selectedDistrict);

      if (selectedDistrict !== 'all') {
        filteredDistricts = filteredDistricts.filter(([district]) => district === selectedDistrict);
        console.log('🔍 Filtered districts:', filteredDistricts.map(([d]) => d));
      }

      console.log('📊 Filtered districts length:', filteredDistricts.length);

      // If no data available, show message
      if (filteredDistricts.length === 0) {
        console.log('❌ No data available - generating empty report');
        console.log('❌ reportData:', reportData);
        console.log('❌ districtData:', districtData);
        pdfDoc.setFontSize(12);
        pdfDoc.setFont('helvetica', 'normal');
        pdfDoc.text('No Command Center data available for the selected period and district.', centerX, 200, { align: 'center' });
        pdfDoc.text('Please ensure data has been entered in the Command Center module.', centerX, 215, { align: 'center' });

        pdfDoc.save(`command-center-no-data-${months[selectedMonth]}-${selectedYear}-${paperSize}.pdf`);
        return;
      }

      // Start districts on page 2 with proper Y position
      currentY = 30;

      // District-based hierarchical report structure
      filteredDistricts.forEach(([district, municipalities], districtIndex) => {
        // Start each district on a new page for better organization
        if (districtIndex > 0) {
          pdfDoc.addPage();
          currentY = 30;
        }

        // DISTRICT HEADER - Full width banner
        pdfDoc.setFillColor(16, 185, 129);
        pdfDoc.rect(paperConfig.margin, currentY, pageWidth - (paperConfig.margin * 2), 18, 'F');
        pdfDoc.setFontSize(18);
        pdfDoc.setFont('helvetica', 'bold');
        pdfDoc.setTextColor(255, 255, 255);
        pdfDoc.text(district, centerX, currentY + 12, { align: 'center' });
        pdfDoc.setTextColor(0, 0, 0);
        currentY += 25;

        // Calculate district totals
        const municipalityEntries = Object.entries(municipalities);
        const districtTotalReports = municipalityEntries.reduce((sum, [, munData]) => {
          return sum + Object.values(munData.barangays).reduce((mSum, brgy) => mSum + brgy.totalReports, 0);
        }, 0);
        const districtTotalBarangays = municipalityEntries.reduce((sum, [, munData]) => {
          return sum + Object.keys(munData.barangays).length;
        }, 0);

        // District Summary Box
        pdfDoc.setFillColor(240, 253, 244);
        pdfDoc.rect(paperConfig.margin, currentY, pageWidth - (paperConfig.margin * 2), 15, 'F');
        pdfDoc.setDrawColor(16, 185, 129);
        pdfDoc.rect(paperConfig.margin, currentY, pageWidth - (paperConfig.margin * 2), 15, 'S');

        pdfDoc.setFontSize(10);
        pdfDoc.setFont('helvetica', 'italic');
        pdfDoc.setTextColor(0, 0, 0);
        pdfDoc.text(`District Summary: ${municipalityEntries.length} Municipalities | ${districtTotalBarangays} Barangays | ${districtTotalReports} Total Reports`, centerX, currentY + 10, { align: 'center' });
        currentY += 22;

        // Process each municipality in the district
        municipalityEntries.forEach(([municipality, munData], munIndex) => {
          // Check if we need a new page
          if (currentY > paperConfig.height - 100) {
            pdfDoc.addPage();
            currentY = 30;
          }

          // MUNICIPALITY HEADER - Clean box design
          pdfDoc.setFillColor(34, 139, 34);
          pdfDoc.rect(paperConfig.margin + 5, currentY, pageWidth - (paperConfig.margin * 2) - 10, 12, 'F');
          pdfDoc.setFontSize(14);
          pdfDoc.setFont('helvetica', 'bold');
          pdfDoc.setTextColor(255, 255, 255);
          pdfDoc.text(municipality, paperConfig.margin + 10, currentY + 8);
          pdfDoc.setTextColor(0, 0, 0);
          currentY += 17;

          // Calculate municipality totals
          const barangayEntries = Object.entries(munData.barangays);
          const munTotalReports = barangayEntries.reduce((sum, [, brgy]) => sum + brgy.totalReports, 0);

          // Municipality Summary - inline with better spacing
          pdfDoc.setFontSize(9);
          pdfDoc.setFont('helvetica', 'normal');
          pdfDoc.setTextColor(100, 100, 100);
          pdfDoc.text(`${barangayEntries.length} Barangays | ${munTotalReports} Reports`, paperConfig.margin + 10, currentY);
          pdfDoc.setTextColor(0, 0, 0);
          currentY += 10;

          // Process each barangay in the municipality
          barangayEntries.forEach(([barangayName, barangayData], brgyIndex) => {
            // Calculate space needed for this barangay
            const spaceNeeded = 40 + (barangayData.concernTypes.length * 8);

            // Check if we need a new page
            if (currentY + spaceNeeded > paperConfig.height - 30) {
              pdfDoc.addPage();
              currentY = 30;
            }

            // BARANGAY HEADER - Cleaner design without symbols
            pdfDoc.setFillColor(245, 248, 250);
            pdfDoc.rect(paperConfig.margin + 15, currentY, pageWidth - (paperConfig.margin * 2) - 30, 10, 'F');
            pdfDoc.setDrawColor(70, 130, 180);
            pdfDoc.setLineWidth(0.5);
            pdfDoc.rect(paperConfig.margin + 15, currentY, pageWidth - (paperConfig.margin * 2) - 30, 10, 'S');

            pdfDoc.setFontSize(11);
            pdfDoc.setFont('helvetica', 'bold');
            pdfDoc.setTextColor(70, 130, 180);
            pdfDoc.text(`Barangay ${barangayName}`, paperConfig.margin + 20, currentY + 7);

            // Barangay total - right aligned
            pdfDoc.setFontSize(9);
            pdfDoc.setFont('helvetica', 'normal');
            pdfDoc.setTextColor(100, 100, 100);
            pdfDoc.text(`(${barangayData.totalReports} reports)`, pageWidth - paperConfig.margin - 50, currentY + 7);
            pdfDoc.setTextColor(0, 0, 0);
            currentY += 15;

            // CONCERN TYPES TABLE with Total and Action Taken columns
            const concernTableData = barangayData.concernTypes.map(concern => [
              concern.type,
              concern.total.toString(),
              concern.actionTaken.toString()
            ]);

            // Add totals row
            const totalConcerns = barangayData.concernTypes.reduce((sum, c) => sum + c.total, 0);
            const totalActions = barangayData.concernTypes.reduce((sum, c) => sum + c.actionTaken, 0);
            concernTableData.push(['TOTAL', totalConcerns.toString(), totalActions.toString()]);

            // Calculate optimal column widths - better proportions
            const tableWidth = pageWidth - (paperConfig.margin * 2) - 40;
            const col1Width = tableWidth * 0.60; // 60% for concern type
            const col2Width = tableWidth * 0.20; // 20% for total
            const col3Width = tableWidth * 0.20; // 20% for action taken

            autoTable(pdfDoc, {
              head: [['Concern Type', 'Total', 'Action Taken']],
              body: concernTableData,
              startY: currentY,
              styles: {
                fontSize: 9,
                cellPadding: 3,
                halign: 'left',
                overflow: 'linebreak',
                lineColor: [200, 200, 200],
                lineWidth: 0.3
              },
              headStyles: {
                fillColor: [70, 130, 180],
                fontStyle: 'bold',
                textColor: [255, 255, 255],
                fontSize: 10,
                halign: 'center',
                cellPadding: 4
              },
              columnStyles: {
                0: { cellWidth: col1Width, halign: 'left', fontStyle: 'normal' },
                1: { cellWidth: col2Width, halign: 'center', fontStyle: 'normal' },
                2: { cellWidth: col3Width, halign: 'center', fontStyle: 'normal' }
              },
              margin: { left: paperConfig.margin + 20, right: paperConfig.margin + 20 },
              theme: 'striped',
              alternateRowStyles: { fillColor: [248, 250, 252] },
              tableWidth: 'wrap',
              didParseCell: function (data) {
                // Make totals row bold with distinct background
                if (data.row.index === concernTableData.length - 1) {
                  data.cell.styles.fontStyle = 'bold';
                  data.cell.styles.fillColor = [200, 230, 255];
                  data.cell.styles.fontSize = 10;
                }
              }
            });

            currentY = pdfDoc.lastAutoTable.finalY + 10;
          });

          // Add spacing between municipalities
          currentY += 8;
        });

        // Add spacing between districts
        currentY += 12;
      });

      // Add page numbers to all pages
      const pageCount = pdfDoc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdfDoc.setPage(i);
        pdfDoc.setFontSize(8);
        pdfDoc.text(`Page ${i} of ${pageCount}`, paperConfig.margin, pdfDoc.internal.pageSize.height - 10);
      }

      pdfDoc.save(`command-center-municipalities-${months[selectedMonth]}-${selectedYear}-${paperSize}.pdf`);
      console.log('Command Center Report generated successfully!');
    } catch (error) {
      console.error('Error generating Command Center Report:', error);
      alert('Error generating Command Center Report. Please check the console for details.');
    } finally {
      setIsGeneratingCommandCenterReport(false);
    }
  };

  // Load and prepare quarterly data for preview
  const loadQuarterlyReportData = async () => {
    setIsLoadingCommandCenter(true);
    try {
      console.log('⚡ Loading Quarterly Command Center Report data with parallel queries...');
      const startTime = performance.now();

      // Load data for all months of the selected year
      const allMunicipalities = Object.values(municipalitiesByDistrict).flat();

      // Create all Firebase queries in parallel
      const allQueries = [];
      const queryMap = [];

      for (const municipality of allMunicipalities) {
        for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
          const monthName = months[monthIndex];
          const monthYear = `${monthName}_${selectedYear}`;

          const docRef = doc(db, 'commandCenter', 'weeklyReports', municipality, monthYear);
          allQueries.push(getDoc(docRef));
          queryMap.push({ municipality, monthName });
        }
      }

      // Load barangays and concern types in parallel with data queries
      const [queryResults, barangaysResult, concernTypesResult] = await Promise.all([
        Promise.allSettled(allQueries),
        getBarangays(),
        getConcernTypes()
      ]);

      // Process results
      const yearlyData = {};
      queryResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.exists()) {
          const { municipality, monthName } = queryMap[index];
          if (!yearlyData[municipality]) {
            yearlyData[municipality] = {};
          }
          const municipalityData = result.value.data();
          yearlyData[municipality][monthName] = municipalityData.weeklyReportData || {};
        } else if (result.status === 'rejected') {
          const { municipality, monthName } = queryMap[index];
          console.error(`❌ Error loading ${municipality} for ${monthName}:`, result.reason);
        }
      });

      const endTime = performance.now();
      console.log(`✅ Data loaded in ${((endTime - startTime) / 1000).toFixed(2)}s`);

      // Process data into quarterly format by municipality and concern type
      const barangays = barangaysResult.success ? barangaysResult.data : [];
      const concernTypes = concernTypesResult.success ? concernTypesResult.data : [];
      const processedData = processQuarterlyData(yearlyData, concernTypes, barangays);

      setQuarterlyPreviewData(processedData);
      setShowQuarterlyPreview(true);

    } catch (error) {
      console.error('Error loading Quarterly Report data:', error);
      alert('Error loading Quarterly Report data. Please check the console for details.');
    } finally {
      setIsLoadingCommandCenter(false);
    }
  };

  // Process yearly data into quarterly format grouped by municipality and concern type
  const processQuarterlyData = (yearlyData, concernTypes, barangays = []) => {
    const quarters = {
      Q1: ['January', 'February', 'March'],
      Q2: ['April', 'May', 'June'],
      Q3: ['July', 'August', 'September'],
      Q4: ['October', 'November', 'December']
    };

    const municipalityData = {};
    const emptyQtrs = () => ({ Q1: 0, Q2: 0, Q3: 0, Q4: 0, total: 0 });

    // Build a case-insensitive lookup map: lowercase name → canonical master list name
    const canonicalCTMap = new Map(concernTypes.map(ct => [ct.name.toLowerCase(), ct.name]));
    // Normalize: case-insensitive match → canonical name; no match or empty → null (skip, no "Other" row)
    const normalizeCT = (raw) => {
      const v = (raw || '').trim();
      if (!v) return null;
      return canonicalCTMap.get(v.toLowerCase()) || v;
    };

    const getQuarter = (monthName) => {
      for (const [q, qMonths] of Object.entries(quarters)) {
        if (qMonths.includes(monthName)) return q;
      }
      return null;
    };

    // Process each municipality
    Object.entries(yearlyData).forEach(([municipality, monthsData]) => {

      // ── PASS 1: collect only the (normalized) concern types recorded in this municipality ──
      const municipalConcernTypeSet = new Set();
      Object.values(monthsData).forEach(weeklyData => {
        Object.values(weeklyData).forEach(dateEntries => {
          if (!Array.isArray(dateEntries)) return;
          dateEntries.forEach(entry => {
            const ct = normalizeCT(entry.concernType);
            if (ct) municipalConcernTypeSet.add(ct);
          });
        });
      });

      const municipalConcernTypes = Array.from(municipalConcernTypeSet); // only this municipality's types

      // ── Initialize data structures ──
      const concernTypeData = {};
      municipalConcernTypes.forEach(ct => {
        concernTypeData[ct] = { Q1: 0, Q2: 0, Q3: 0, Q4: 0, total: 0, strayDogs: 0 };
      });

      const barangayData = {};
      // Pre-initialize all registered barangays for this municipality with this municipality's concern types
      const municipalityBarangays = barangays.filter(b => b.municipality === municipality);
      municipalityBarangays.forEach(b => {
        barangayData[b.name] = {};
        municipalConcernTypes.forEach(ct => {
          barangayData[b.name][ct] = emptyQtrs();
        });
      });

      // ── PASS 2: count entries (using normalized concern types) ──
      Object.entries(monthsData).forEach(([monthName, weeklyData]) => {
        const quarter = getQuarter(monthName);
        if (!quarter) return;

        Object.values(weeklyData).forEach(dateEntries => {
          if (!Array.isArray(dateEntries)) return;

          dateEntries.forEach(entry => {
            const concernType = normalizeCT(entry.concernType); // normalized = no extra types
            if (!concernType) return; // skip entries with no valid concern type
            // Municipality-level totals
            if (!concernTypeData[concernType]) {
              concernTypeData[concernType] = { Q1: 0, Q2: 0, Q3: 0, Q4: 0, total: 0, strayDogs: 0 };
            }
            concernTypeData[concernType][quarter]++;
            concernTypeData[concernType].total++;
            if (entry.strayDogs || concernType.toLowerCase().includes('stray')) {
              concernTypeData[concernType].strayDogs++;
            }

            // Per-barangay breakdown
            const barangayName = entry.barangay || 'Unknown';
            if (!barangayData[barangayName]) {
              // barangay not in registered list — still track it
              barangayData[barangayName] = {};
              municipalConcernTypes.forEach(ct => { barangayData[barangayName][ct] = emptyQtrs(); });
            }
            if (!barangayData[barangayName][concernType]) {
              barangayData[barangayName][concernType] = emptyQtrs();
            }
            barangayData[barangayName][concernType][quarter]++;
            barangayData[barangayName][concernType].total++;
          });
        });
      });

      const hasData = Object.values(concernTypeData).some(ct => ct.total > 0);
      if (hasData) {
        municipalityData[municipality] = { concernTypeData, barangayData };
      }
    });

    return {
      municipalityData,
      year: selectedYear,
      district: selectedDistrict
    };
  };

  // Generate Quarterly Command Center Report PDF from preview data
  const generateQuarterlyCommandCenterReport = async () => {
    if (!quarterlyPreviewData || isGeneratingCommandCenterReport) {
      console.log('No preview data or report generation already in progress...');
      return;
    }

    setIsGeneratingCommandCenterReport(true);
    try {
      console.log('Starting Quarterly Command Center Report PDF generation...');

      const paperConfig = getPaperConfig(paperSize);
      const pdfDoc = new jsPDF('l', 'mm', paperConfig.format); // Landscape orientation
      const pageWidth = pdfDoc.internal.pageSize.getWidth();
      const pageHeight = pdfDoc.internal.pageSize.getHeight();
      const centerX = pageWidth / 2;

      // ============ HEADER ============
      pdfDoc.setFillColor(16, 185, 129);
      pdfDoc.rect(0, 0, pageWidth, 35, 'F');

      pdfDoc.setFontSize(22);
      pdfDoc.setFont('helvetica', 'bold');
      pdfDoc.setTextColor(255, 255, 255);
      pdfDoc.text('Quarterly Command Center Report', centerX, 15, { align: 'center' });

      pdfDoc.setFontSize(12);
      pdfDoc.setFont('helvetica', 'normal');
      pdfDoc.text(`Year: ${quarterlyPreviewData.year} | District: ${quarterlyPreviewData.district === 'all' ? 'All Districts' : quarterlyPreviewData.district}`, centerX, 25, { align: 'center' });

      pdfDoc.setTextColor(0, 0, 0);

      let currentY = 45;

      // Filter municipalities by selected district
      let municipalitiesToShow = Object.keys(quarterlyPreviewData.municipalityData);
      if (quarterlyPreviewData.district !== 'all') {
        const districtMunicipalities = municipalitiesByDistrict[quarterlyPreviewData.district] || [];
        municipalitiesToShow = municipalitiesToShow.filter(m => districtMunicipalities.includes(m));
      }

      // Helper: render one concern-type table and return the new Y position
      const renderConcernTypeTable = (concernTypeDataObj, startY, lMargin, rMargin, fSize) => {
        const getTrendLabel = (cur, prev) => {
          if (cur > prev) return 'Increased';
          if (cur < prev) return 'Decreased';
          return 'Unchanged';
        };
        const tableData = [];
        Object.entries(concernTypeDataObj).forEach(([ct, q]) => {
          tableData.push([
            ct,
            (q.Q1 || 0).toString(),
            `${q.Q2 || 0}\n${getTrendLabel(q.Q2 || 0, q.Q1 || 0)}`,
            `${q.Q3 || 0}\n${getTrendLabel(q.Q3 || 0, q.Q2 || 0)}`,
            `${q.Q4 || 0}\n${getTrendLabel(q.Q4 || 0, q.Q3 || 0)}`,
            (q.total || 0).toString()
          ]);
        });
        if (tableData.length === 0) return startY;
        autoTable(pdfDoc, {
          head: [['Concern Type', 'Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)', 'Total']],
          body: tableData,
          startY,
          theme: 'grid',
          styles: { fontSize: fSize || 9, cellPadding: 3, lineColor: [200, 200, 200], lineWidth: 0.5 },
          headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
          columnStyles: {
            0: { cellWidth: 70, halign: 'left' },
            1: { cellWidth: 28, halign: 'center' },
            2: { cellWidth: 28, halign: 'center' },
            3: { cellWidth: 28, halign: 'center' },
            4: { cellWidth: 28, halign: 'center' },
            5: { cellWidth: 28, halign: 'center', fontStyle: 'bold', fillColor: [240, 253, 244] }
          },
          margin: { left: lMargin, right: rMargin },
          didParseCell: function (data) {
            if (data.section === 'body' && data.column.index >= 2 && data.column.index <= 4) {
              const cellText = data.cell.text.join('\n');
              if (cellText.includes('Increased')) {
                data.cell.styles.fillColor = [254, 202, 202];
                data.cell.styles.textColor = [185, 28, 28];
              } else if (cellText.includes('Decreased')) {
                data.cell.styles.fillColor = [187, 247, 208];
                data.cell.styles.textColor = [21, 128, 61];
              } else if (cellText.includes('Unchanged')) {
                data.cell.styles.fillColor = [254, 240, 138];
                data.cell.styles.textColor = [161, 98, 7];
              }
            }
          }
        });
        return pdfDoc.lastAutoTable.finalY + 6;
      };

      // ============ MUNICIPALITY + BARANGAY TABLES ============
      municipalitiesToShow.forEach((municipality) => {
        const munEntry = quarterlyPreviewData.municipalityData[municipality];
        // Support both old shape (plain object) and new shape ({concernTypeData, barangayData})
        const concernTypeData = munEntry.concernTypeData || munEntry;
        const barangayData = munEntry.barangayData || {};

        if (currentY > pageHeight - 60) {
          pdfDoc.addPage();
          currentY = 20;
        }

        // MUNICIPALITY HEADER
        pdfDoc.setFillColor(16, 185, 129);
        pdfDoc.rect(paperConfig.margin, currentY - 2, pageWidth - (paperConfig.margin * 2), 12, 'F');
        pdfDoc.setFontSize(13);
        pdfDoc.setFont('helvetica', 'bold');
        pdfDoc.setTextColor(255, 255, 255);
        pdfDoc.text(municipality.toUpperCase(), paperConfig.margin + 4, currentY + 7);
        // Draw barangay count badge
        if (barangayCounts[municipality]) {
          const countText = String(barangayCounts[municipality]);
          const badgeX = paperConfig.margin + 4 + pdfDoc.getTextWidth(municipality.toUpperCase()) + 5;
          pdfDoc.setFillColor(255, 255, 255);
          pdfDoc.circle(badgeX + 3, currentY + 6, 4, 'F');
          pdfDoc.setFontSize(8);
          pdfDoc.setTextColor(21, 128, 61);
          pdfDoc.text(countText, badgeX + 3, currentY + 8, { align: 'center' });
          pdfDoc.setFontSize(13);
          pdfDoc.setTextColor(255, 255, 255);
        }
        pdfDoc.setTextColor(0, 0, 0);
        currentY += 16;

        const barangayEntries = Object.entries(barangayData);
        if (barangayEntries.length > 0) {
          // Render per-barangay sub-tables
          barangayEntries.forEach(([barangayName, brgyData]) => {
            const hasBrgyData = Object.values(brgyData).some(q => (q.total || 0) > 0);
            if (!hasBrgyData) return;

            if (currentY > pageHeight - 60) {
              pdfDoc.addPage();
              currentY = 20;
            }

            // Barangay sub-header
            pdfDoc.setFillColor(229, 246, 235);
            pdfDoc.rect(paperConfig.margin + 5, currentY - 1, pageWidth - (paperConfig.margin * 2) - 10, 10, 'F');
            pdfDoc.setDrawColor(21, 128, 61);
            pdfDoc.setLineWidth(0.4);
            pdfDoc.rect(paperConfig.margin + 5, currentY - 1, pageWidth - (paperConfig.margin * 2) - 10, 10, 'S');
            pdfDoc.setFontSize(10);
            pdfDoc.setFont('helvetica', 'bold');
            pdfDoc.setTextColor(21, 128, 61);
            pdfDoc.text(barangayName, paperConfig.margin + 9, currentY + 7);
            pdfDoc.setTextColor(0, 0, 0);
            currentY += 13;

            currentY = renderConcernTypeTable(
              brgyData,
              currentY,
              paperConfig.margin + 10,
              paperConfig.margin + 10,
              8
            );
          });
        } else {
          // Fallback: municipality-level table when no barangay data available
          currentY = renderConcernTypeTable(
            concernTypeData,
            currentY,
            paperConfig.margin,
            paperConfig.margin,
            9
          );
        }

        currentY += 6;
      });

      // Add page numbers
      const pageCount = pdfDoc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdfDoc.setPage(i);
        pdfDoc.setFontSize(8);
        pdfDoc.setTextColor(100, 100, 100);
        pdfDoc.text(`Page ${i} of ${pageCount}`, pageWidth - paperConfig.margin - 20, pageHeight - 10);
        pdfDoc.text(`Generated: ${new Date().toLocaleDateString()}`, paperConfig.margin, pageHeight - 10);
      }

      pdfDoc.save(`quarterly-command-center-${quarterlyPreviewData.year}-${paperSize}.pdf`);
      console.log('Quarterly Command Center Report generated successfully!');
      setShowQuarterlyPreview(false);
    } catch (error) {
      console.error('Error generating Quarterly Command Center Report:', error);
      alert('Error generating Quarterly Command Center Report. Please check the console for details.');
    } finally {
      setIsGeneratingCommandCenterReport(false);
    }
  };

  // Export Quarterly Report to Excel — one sheet per municipality (ExcelJS for borders + styling)
  const exportQuarterlyToExcel = async () => {
    if (!quarterlyPreviewData) return;

    const ExcelWorkbook = new ExcelJS.Workbook();
    ExcelWorkbook.creator = 'iPatroller System';
    const year = quarterlyPreviewData.year;

    let municipalitiesToExport = Object.keys(quarterlyPreviewData.municipalityData);
    if (quarterlyPreviewData.district !== 'all') {
      const districtMunicipalities = municipalitiesByDistrict[quarterlyPreviewData.district] || [];
      municipalitiesToExport = municipalitiesToExport.filter(m => districtMunicipalities.includes(m));
    }

    // Shared style helpers
    const thinBorder = { style: 'thin', color: { argb: 'FFB0B0B0' } };
    const allBorders = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };
    const thickBorder = { style: 'medium', color: { argb: 'FF10B981' } };

    municipalitiesToExport.forEach(municipality => {
      const munEntry = quarterlyPreviewData.municipalityData[municipality];
      const barangayData = munEntry.barangayData || {};
      const brgyCount = barangayCounts[municipality] || '';

      // Safe sheet name (Excel limit: 31 chars, no special chars)
      const sheetName = municipality.replace(/[\\/*?\[\]:]/g, '').slice(0, 31);
      const ws = ExcelWorkbook.addWorksheet(sheetName);

      // Column widths
      ws.columns = [
        { width: 40 }, // Concern Type / Barangay Name
        { width: 2 }, // spacer
        { width: 15 }, // Q1
        { width: 15 }, // Q2
        { width: 15 }, // Q3
        { width: 15 }, // Q4
        { width: 12 }  // Total
      ];

      // ── Title row
      const titleRow = ws.addRow([`${municipality} (${brgyCount} Barangays) — Quarterly Report ${year}`]);
      titleRow.getCell(1).font = { bold: true, size: 13, color: { argb: 'FF065F46' } };
      ws.mergeCells(titleRow.number, 1, titleRow.number, 7);
      ws.addRow([]); // blank spacer

      // ── Loop barangays
      Object.entries(barangayData).forEach(([barangayName, brgyData]) => {
        const allConcernEntries = Object.entries(brgyData);

        // Skip barangays with no data
        const brgyTotal = allConcernEntries.reduce((sum, [, q]) => sum + (q.total || 0), 0);
        if (brgyTotal === 0) return;

        // Barangay header row (green)
        const brgyHeaderRow = ws.addRow([barangayName]);
        ws.mergeCells(brgyHeaderRow.number, 1, brgyHeaderRow.number, 7);
        brgyHeaderRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
        brgyHeaderRow.getCell(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        brgyHeaderRow.getCell(1).border = { top: thickBorder, bottom: thickBorder, left: thickBorder, right: thickBorder };
        brgyHeaderRow.height = 20;

        // Column sub-header row (gray)
        const colHeaderRow = ws.addRow(['Concern Type', '', 'Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)', 'Total']);
        [1, 3, 4, 5, 6, 7].forEach(c => {
          const cell = colHeaderRow.getCell(c);
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
          cell.font = { bold: true, color: { argb: 'FF065F46' } };
          cell.border = allBorders;
          cell.alignment = { horizontal: c === 1 ? 'left' : 'center', vertical: 'middle' };
        });
        colHeaderRow.height = 18;

        // Concern type data rows
        allConcernEntries.forEach(([concernType, q]) => {
          const dataRow = ws.addRow([concernType, '', q.Q1 || 0, q.Q2 || 0, q.Q3 || 0, q.Q4 || 0, q.total || 0]);
          [1, 3, 4, 5, 6, 7].forEach(c => {
            const cell = dataRow.getCell(c);
            cell.border = allBorders;
            cell.alignment = { horizontal: c === 1 ? 'left' : 'center', vertical: 'middle' };
            if (c === 7) cell.font = { bold: true, color: { argb: 'FF065F46' } }; // Total col bold green
          });
        });

        // Subtotal row
        const totals = allConcernEntries.reduce((acc, [, q]) => ({
          Q1: acc.Q1 + (q.Q1 || 0), Q2: acc.Q2 + (q.Q2 || 0),
          Q3: acc.Q3 + (q.Q3 || 0), Q4: acc.Q4 + (q.Q4 || 0),
          total: acc.total + (q.total || 0)
        }), { Q1: 0, Q2: 0, Q3: 0, Q4: 0, total: 0 });

        const subtotalRow = ws.addRow(['SUBTOTAL', '', totals.Q1, totals.Q2, totals.Q3, totals.Q4, totals.total]);
        [1, 3, 4, 5, 6, 7].forEach(c => {
          const cell = subtotalRow.getCell(c);
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } };
          cell.font = { bold: true, color: { argb: 'FF065F46' } };
          cell.border = { top: { style: 'medium', color: { argb: 'FF10B981' } }, ...allBorders };
          cell.alignment = { horizontal: c === 1 ? 'left' : 'center', vertical: 'middle' };
        });

        ws.addRow([]); // spacer between barangays
      });
    });

    // Download
    const buffer = await ExcelWorkbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quarterly-report-${year}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };


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
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));

    // Get top barangays (sorted by count, top 5)
    const topBarangays = Object.entries(barangayCount)
      .sort(([, a], [, b]) => b - a)
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
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));

    // Get top barangays (sorted by count, top 5)
    const topBarangays = Object.entries(barangayCount)
      .sort(([, a], [, b]) => b - a)
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

    // Completed incidents calculation
    const completedIncidents = filteredData.filter(incident =>
      incident.status === 'Completed' ||
      incident.status === 'completed' ||
      incident.status === 'COMPLETED' ||
      incident.status === 'Resolved' ||
      incident.status === 'resolved' ||
      incident.status === 'RESOLVED'
    ).length;

    // Under investigation calculation
    const underInvestigation = filteredData.filter(incident =>
      incident.status === 'Under Investigation' ||
      incident.status === 'under investigation' ||
      incident.status === 'UNDER INVESTIGATION' ||
      incident.status === 'Under investigation'
    ).length;

    // Improved action taken calculation - check multiple fields
    const actionTakenIncidents = filteredData.filter(incident => {
      const hasActionType = incident.actionType && incident.actionType.trim() !== "";
      const hasActionTaken = incident.actionTaken && incident.actionTaken.trim() !== "";
      const hasStatus = incident.status &&
        (incident.status.toLowerCase().includes('resolved') ||
          incident.status.toLowerCase().includes('completed') ||
          incident.status.toLowerCase().includes('arrested') ||
          incident.status.toLowerCase().includes('filed'));
      return hasActionType || hasActionTaken || hasStatus;
    }).length;

    // Drug-related incidents - improved detection
    const drugsIncidents = filteredData.filter(incident =>
      incident.incidentType === 'Drug-related' ||
      incident.incidentType === 'Drugs' ||
      incident.description?.toLowerCase().includes('drug') ||
      incident.description?.toLowerCase().includes('shabu') ||
      incident.description?.toLowerCase().includes('marijuana') ||
      incident.description?.toLowerCase().includes('illegal substance')
    ).length;

    // Accidents - improved categorization
    const trafficAccidents = filteredData.filter(incident =>
      incident.incidentType === 'Traffic Accident' ||
      incident.incidentType === 'Traffic Violation' ||
      incident.incidentType === 'Vehicle Accident' ||
      (incident.description?.toLowerCase().includes('traffic') && (
        incident.description?.toLowerCase().includes('accident') ||
        incident.description?.toLowerCase().includes('crash') ||
        incident.description?.toLowerCase().includes('collision')
      )) ||
      incident.description?.toLowerCase().includes('vehicular')
    ).length;

    const workAccidents = filteredData.filter(incident =>
      incident.incidentType === 'Work Accident' ||
      (incident.description?.toLowerCase().includes('work') && (
        incident.description?.toLowerCase().includes('accident') ||
        incident.description?.toLowerCase().includes('injury') ||
        incident.description?.toLowerCase().includes('fall')
      ))
    ).length;

    const otherAccidents = filteredData.filter(incident =>
      (incident.incidentType === 'Accident' ||
        incident.description?.toLowerCase().includes('accident')) &&
      !(incident.incidentType === 'Traffic Accident' ||
        incident.incidentType === 'Vehicle Accident' ||
        incident.incidentType === 'Work Accident' ||
        incident.description?.toLowerCase().includes('traffic') ||
        incident.description?.toLowerCase().includes('vehicular') ||
        (incident.description?.toLowerCase().includes('work') && (
          incident.description?.toLowerCase().includes('accident') ||
          incident.description?.toLowerCase().includes('injury') ||
          incident.description?.toLowerCase().includes('fall')
        )))
    ).length;

    const accidentsIncidents = trafficAccidents + workAccidents + otherAccidents;

    // Others - everything that's not drugs or accidents
    const othersIncidents = totalIncidents - drugsIncidents - accidentsIncidents;

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
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([location, count]) => ({ location, count }));
    const topMunicipalities = Object.entries(municipalityCounts)
      .sort(([, a], [, b]) => b - a)
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
        .sort(([, a], [, b]) => b - a);

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
              action: generateIPatrollerMonthlySummaryReport,
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
              name: "Quarterly Report",
              action: loadQuarterlyReportData,
              format: "PDF",
              priority: "high"
            },
            {
              name: "Top Barangay",
              action: async () => {
                await loadTopBarangayReport(topBarangayMonth, topBarangayYear);
              },
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
              action: () => setShowActionCenterGenerateModal(true),
              format: "PDF",
              priority: "high"
            },
            {
              name: "Summary",
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
              action: exportSummaryToPDF,
              format: "PDF",
              priority: "high"
            }
          ],
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
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header/Navbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 w-full px-4 sm:px-6 lg:px-8 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 py-3 border-b border-slate-200 sticky top-0 z-50">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Reports Center</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Generate comprehensive reports across all system modules</p>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
          {/* Quick Stats - Hidden as requested */}

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

        </div>
        */}

          {/* Month and Year Filters */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="pb-4 border-b border-gray-100">
              <CardTitle className="text-lg font-semibold text-black flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Report Filters
              </CardTitle>
              <p className="text-gray-700 font-medium">Select month and year for report generation</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* From Date Section */}
                <div className="space-y-4">
                  <Label className="text-sm font-semibold text-gray-900 block">From</Label>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Label htmlFor="from-month-filter" className="text-sm font-semibold text-gray-900 mb-2 block">
                        Month
                      </Label>
                      <Select
                        value={fromMonth.toString()}
                        onValueChange={(value) => setFromMonth(parseInt(value))}
                      >
                        <SelectTrigger id="from-month-filter" className="w-full bg-white border border-gray-300 !text-black">
                          <span>{months[fromMonth]}</span>
                        </SelectTrigger>
                        <SelectContent>
                          {months.map((month, index) => (
                            <SelectItem key={index} value={index.toString()}>
                              {month}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex-1">
                      <Label htmlFor="from-year-filter" className="text-sm font-semibold text-gray-900 mb-2 block">
                        Year
                      </Label>
                      <Select
                        value={fromYear.toString()}
                        onValueChange={(value) => setFromYear(parseInt(value))}
                      >
                        <SelectTrigger id="from-year-filter" className="w-full bg-white border border-gray-300 !text-black">
                          <span>{fromYear}</span>
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* To Date Section */}
                <div className="space-y-4">
                  <Label className="text-sm font-semibold text-gray-900 block">To</Label>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Label htmlFor="to-month-filter" className="text-sm font-semibold text-gray-900 mb-2 block">
                        Month
                      </Label>
                      <Select
                        value={toMonth.toString()}
                        onValueChange={(value) => setToMonth(parseInt(value))}
                      >
                        <SelectTrigger id="to-month-filter" className="w-full bg-white border border-gray-300 !text-black">
                          <span>{months[toMonth]}</span>
                        </SelectTrigger>
                        <SelectContent>
                          {months.map((month, index) => (
                            <SelectItem key={index} value={index.toString()}>
                              {month}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex-1">
                      <Label htmlFor="to-year-filter" className="text-sm font-semibold text-gray-900 mb-2 block">
                        Year
                      </Label>
                      <Select
                        value={toYear.toString()}
                        onValueChange={(value) => setToYear(parseInt(value))}
                      >
                        <SelectTrigger id="to-year-filter" className="w-full bg-white border border-gray-300 !text-black">
                          <span>{toYear}</span>
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Selection Display */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <Label className="text-sm font-semibold text-gray-900 mb-2 block">
                  Current Selection
                </Label>
                <div className="bg-gray-50 border border-gray-200 rounded-md px-4 py-3 text-sm text-gray-900">
                  {fromMonth === toMonth && fromYear === toYear ? (
                    <span className="font-medium">{months[fromMonth]} {fromYear}</span>
                  ) : (
                    <span className="font-medium">{months[fromMonth]} {fromYear} - {months[toMonth]} {toYear}</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

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
                                    if ((actionItem.name === "Generate Report" || actionItem.name === "Quarterly Report" || actionItem.name === "Top Barangay") && section.id === "commandcenter") {
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
                                  disabled={isGenerating || ((actionItem.name === "Generate Report" || actionItem.name === "Quarterly Report") && section.id === "commandcenter" && (isGeneratingCommandCenterReport || isLoadingCommandCenter)) || (actionItem.name === "Top Barangay" && section.id === "commandcenter" && isLoadingTopBarangay)}
                                  size="sm"
                                  className="bg-black hover:bg-gray-800 text-white border border-black hover:border-gray-800 transition-all duration-200 px-3 py-2 text-xs font-medium w-[140px] h-8"
                                >
                                  {(isGenerating || ((actionItem.name === "Generate Report" || actionItem.name === "Quarterly Report") && section.id === "commandcenter" && (isGeneratingCommandCenterReport || isLoadingCommandCenter)) || (actionItem.name === "Top Barangay" && section.id === "commandcenter" && isLoadingTopBarangay)) ? (
                                    <>
                                      <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-1"></div>
                                      <span>{isLoadingCommandCenter ? 'Loading...' : 'Gen...'}</span>
                                    </>
                                  ) : (
                                    <>
                                      {actionItem.name === "Generate Report" ? (
                                        <FileText className="w-3 h-3 mr-1" />
                                      ) : actionItem.name === "Quarterly Report" ? (
                                        <BarChart3 className="w-3 h-3 mr-1" />
                                      ) : actionItem.name === "Top Barangay" ? (
                                        <MapPin className="w-3 h-3 mr-1" />
                                      ) : actionItem.name === "Daily Summary" ? (
                                        <Calendar className="w-3 h-3 mr-1" />
                                      ) : actionItem.name === "Preview Report" ? (
                                        <Eye className="w-3 h-3 mr-1" />
                                      ) : actionItem.name === "Summary" ? (
                                        <Activity className="w-3 h-3 mr-1" />
                                      ) : actionItem.name === "Generate PDF" ? (
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

        {/* Summary Modal */}
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
                      Summary
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
                    title="Generate PDF"
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
                    <div className="space-y-6">
                      {/* Summary Statistics Header */}
                      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-2xl font-bold">Incidents Summary Report</h3>
                            <p className="text-blue-100 mt-1">
                              {selectedMonth !== "all" ? `${months[selectedMonth]} ${selectedYear}` : `Full Year ${selectedYear}`} Analysis
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold">{insights.totalIncidents}</div>
                            <div className="text-blue-100 text-sm">Total Incidents</div>
                          </div>
                        </div>
                      </div>

                      {/* Main Overview Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg border border-red-200 p-4 hover:shadow-lg transition-shadow">
                          <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                              <Shield className="w-5 h-5 text-red-600" />
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-red-600">{insights.drugsIncidents}</div>
                              <div className="text-xs text-gray-500">
                                {insights.totalIncidents > 0 ? Math.round((insights.drugsIncidents / insights.totalIncidents) * 100) : 0}%
                              </div>
                            </div>
                          </div>
                          <div className="text-sm font-medium text-gray-900">Drug-Related</div>
                          <div className="text-xs text-gray-600">Illegal drugs, substances</div>
                        </div>

                        <div className="bg-white rounded-lg border border-orange-200 p-4 hover:shadow-lg transition-shadow">
                          <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                              <Car className="w-5 h-5 text-orange-600" />
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-orange-600">{insights.accidentsIncidents}</div>
                              <div className="text-xs text-gray-500">
                                {insights.totalIncidents > 0 ? Math.round((insights.accidentsIncidents / insights.totalIncidents) * 100) : 0}%
                              </div>
                            </div>
                          </div>
                          <div className="text-sm font-medium text-gray-900">Accidents</div>
                          <div className="text-xs text-gray-600">Traffic: {insights.trafficAccidents} | Work: {insights.workAccidents} | Other: {insights.otherAccidents}</div>
                        </div>

                        <div className="bg-white rounded-lg border border-green-200 p-4 hover:shadow-lg transition-shadow">
                          <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-green-600">{insights.actionTakenIncidents}</div>
                              <div className="text-xs text-gray-500">
                                {insights.totalIncidents > 0 ? Math.round((insights.actionTakenIncidents / insights.totalIncidents) * 100) : 0}%
                              </div>
                            </div>
                          </div>
                          <div className="text-sm font-medium text-gray-900">Action Taken</div>
                          <div className="text-xs text-gray-600">Resolved, arrested, filed</div>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow">
                          <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              <MoreHorizontal className="w-5 h-5 text-gray-600" />
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-gray-600">{insights.othersIncidents}</div>
                              <div className="text-xs text-gray-500">
                                {insights.totalIncidents > 0 ? Math.round((insights.othersIncidents / insights.totalIncidents) * 100) : 0}%
                              </div>
                            </div>
                          </div>
                          <div className="text-sm font-medium text-gray-900">Other Types</div>
                          <div className="text-xs text-gray-600">Theft, assault, etc.</div>
                        </div>
                      </div>

                      {/* Status Overview */}
                      <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Activity className="w-5 h-5 text-blue-600" />
                          Status Overview
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{insights.completedIncidents}</div>
                            <div className="text-sm text-gray-600">Completed/Resolved</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {insights.totalIncidents > 0 ? Math.round((insights.completedIncidents / insights.totalIncidents) * 100) : 0}% completion rate
                            </div>
                          </div>
                          <div className="text-center p-4 bg-yellow-50 rounded-lg">
                            <div className="text-2xl font-bold text-yellow-600">{insights.underInvestigation}</div>
                            <div className="text-sm text-gray-600">Under Investigation</div>
                            <div className="text-xs text-gray-500 mt-1">Ongoing cases</div>
                          </div>
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-600">
                              {insights.totalIncidents - insights.completedIncidents - insights.underInvestigation}
                            </div>
                            <div className="text-sm text-gray-600">Other Status</div>
                            <div className="text-xs text-gray-500 mt-1">Pending, new, etc.</div>
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

        {showActionCenterGenerateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Generate Action Center Report</h3>
                  <p className="text-sm text-gray-500">
                    {months[actionCenterFromMonth]} – {months[actionCenterToMonth]} {actionCenterReportYear}
                  </p>
                </div>
                <button
                  onClick={() => setShowActionCenterGenerateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  disabled={isGeneratingActionCenterRangeReport}
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Year + Month selectors */}
              <div className="px-6 pt-4 pb-2 grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
                  <select
                    value={actionCenterReportYear}
                    onChange={e => setActionCenterReportYear(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={isGeneratingActionCenterRangeReport}
                  >
                    {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">From Month</label>
                  <select
                    value={actionCenterFromMonth}
                    onChange={e => setActionCenterFromMonth(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={isGeneratingActionCenterRangeReport}
                  >
                    {months.map((m, i) => <option key={i} value={i}>{m.slice(0, 3)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">To Month</label>
                  <select
                    value={actionCenterToMonth}
                    onChange={e => setActionCenterToMonth(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={isGeneratingActionCenterRangeReport}
                  >
                    {months.map((m, i) => <option key={i} value={i}>{m.slice(0, 3)}</option>)}
                  </select>
                </div>
              </div>

              <div className="px-6 pb-6 pt-2 space-y-3">
                <Button
                  onClick={async () => {
                    await generateActionCenterReportJanFebByDepartment('AGRICULTURE');
                    setShowActionCenterGenerateModal(false);
                  }}
                  disabled={isGeneratingActionCenterRangeReport}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {isGeneratingActionCenterRangeReport ? 'Generating...' : 'AGRICULTURE'}
                </Button>
                <Button
                  onClick={async () => {
                    await generateActionCenterReportJanFebByDepartment('PG-ENRO');
                    setShowActionCenterGenerateModal(false);
                  }}
                  disabled={isGeneratingActionCenterRangeReport}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isGeneratingActionCenterRangeReport ? 'Generating...' : 'PG-ENRO'}
                </Button>
                <Button
                  onClick={async () => {
                    await generateActionCenterReportJanFebByDepartment('PNP');
                    setShowActionCenterGenerateModal(false);
                  }}
                  disabled={isGeneratingActionCenterRangeReport}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  {isGeneratingActionCenterRangeReport ? 'Generating...' : 'PNP'}
                </Button>

                <div className="pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowActionCenterGenerateModal(false)}
                    disabled={isGeneratingActionCenterRangeReport}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
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
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${summaryViewType === "monthly"
                        ? "bg-white text-emerald-600 shadow-sm border border-gray-200"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setSummaryViewType("quarterly")}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${summaryViewType === "quarterly"
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
                                switch (color) {
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

        {/* Action Center Summary Modal */}
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
                    <h3 className="text-lg font-semibold text-gray-900">Action Center Summary</h3>
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
                      {new Date(selectedYear, selectedMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={generateDailySummaryPdf}
                    variant="default"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
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
                        {generateDates(selectedMonth, selectedYear)[ipatrollerSelectedDayIndex]?.fullDate}
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <select
                      id="date-select"
                      name="date-select"
                      value={ipatrollerSelectedDayIndex}
                      onChange={(e) => setIpatrollerSelectedDayIndex(parseInt(e.target.value))}
                      className="appearance-none bg-white pl-4 pr-10 py-2.5 rounded-lg border border-gray-200 shadow-sm 
                      text-gray-900 font-medium hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 
                      focus:border-blue-500 transition-all duration-200 min-w-[200px]"
                    >
                      {generateDates(selectedMonth, selectedYear).map((date, index) => (
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
                {/* Legend */}
                <div className="mb-4 text-xs text-gray-600 flex items-center gap-4">
                  <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-green-500" /> Active ≥ 14</span>
                  <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-yellow-500" /> Warning = 13</span>
                  <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-red-500" /> Inactive ≤ 12</span>
                </div>
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
                              <th className="px-4 py-2 text-center text-sm font-medium text-gray-600">Progress (Daily Target)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {municipalities.map((data) => (
                              <tr key={data.municipality}>
                                <td className="px-4 py-2 text-sm font-medium text-gray-900">{data.municipality}</td>
                                <td className="px-4 py-2 text-sm text-center font-medium text-gray-900">{data.dailyCount}</td>
                                <td className="px-4 py-2 text-center">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                    ${data.status === 'Active' ? 'bg-green-100 text-green-800' : data.status === 'Warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                    {data.status}
                                  </span>
                                </td>
                                <td className="px-4 py-2">
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                          className={`h-full rounded-full ${data.status === 'Active' ? 'bg-green-500' :
                                            data.status === 'Warning' ? 'bg-yellow-500' :
                                              'bg-red-500'
                                            }`}
                                          style={{ width: `${data.percentage}%` }}
                                        />
                                      </div>
                                      <span className="text-sm font-medium text-gray-900">{data.percentage}%</span>
                                    </div>
                                    <div className="text-xs text-gray-500 text-center">
                                      {Math.min(data.dailyCount, data.totalTarget)} / {data.totalTarget} total
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
                  {/* Report Header - Centered */}
                  <div className="text-center space-y-1">
                    <p className="text-sm text-gray-700">Generated: {ipatrollerPreviewData.generatedDate}</p>
                    <p className="text-sm text-gray-700">Month: {ipatrollerPreviewData.month} {ipatrollerPreviewData.year}</p>
                    <p className="text-sm text-gray-700">Report Period: {ipatrollerPreviewData.reportPeriod}</p>
                    <p className="text-sm text-gray-700">Data Source: {ipatrollerPreviewData.dataSource}</p>
                  </div>

                  {/* District Summary */}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">District Summary</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full border border-gray-300">
                        <thead>
                          <tr className="bg-blue-500 text-white">
                            <th className="px-4 py-3 text-center text-sm font-semibold border border-gray-300">District</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold border border-gray-300">Municipalities</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold border border-gray-300">Total Patrols</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold border border-gray-300">Active Days</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold border border-gray-300">Inactive Days</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold border border-gray-300">Avg Active %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ipatrollerPreviewData.districtSummary.map((district, index) => (
                            <tr key={district.district} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-4 py-2 text-sm text-center border border-gray-300">{district.district}</td>
                              <td className="px-4 py-2 text-sm text-center border border-gray-300">{district.municipalityCount}</td>
                              <td className="px-4 py-2 text-sm text-center border border-gray-300">{district.totalPatrols.toLocaleString()}</td>
                              <td className="px-4 py-2 text-sm text-center border border-gray-300">{district.totalActive}</td>
                              <td className="px-4 py-2 text-sm text-center border border-gray-300">{district.totalInactive}</td>
                              <td className="px-4 py-2 text-sm text-center border border-gray-300">{district.avgActivePercentage}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>


                  {/* Overall Summary Statistics */}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Overall Summary Statistics</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full border border-gray-300">
                        <tbody>
                          <tr className="bg-gray-50">
                            <td className="px-4 py-2 text-sm font-semibold border border-gray-300">Metric</td>
                            <td className="px-4 py-2 text-sm font-semibold border border-gray-300">Value</td>
                            <td className="px-4 py-2 text-sm font-semibold border border-gray-300">Metric</td>
                            <td className="px-4 py-2 text-sm font-semibold border border-gray-300">Value</td>
                          </tr>
                          <tr className="bg-white">
                            <td className="px-4 py-2 text-sm border border-gray-300">Total Patrols</td>
                            <td className="px-4 py-2 text-sm border border-gray-300">{ipatrollerPreviewData.overallSummary.totalPatrols.toLocaleString()}</td>
                            <td className="px-4 py-2 text-sm border border-gray-300">Average Active Percentage</td>
                            <td className="px-4 py-2 text-sm border border-gray-300">{ipatrollerPreviewData.overallSummary.avgActivePercentage}%</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="px-4 py-2 text-sm border border-gray-300">Total Active Days</td>
                            <td className="px-4 py-2 text-sm border border-gray-300">{ipatrollerPreviewData.overallSummary.totalActive}</td>
                            <td className="px-4 py-2 text-sm border border-gray-300">Total Municipalities</td>
                            <td className="px-4 py-2 text-sm border border-gray-300">{ipatrollerPreviewData.overallSummary.municipalityCount}</td>
                          </tr>
                          <tr className="bg-white">
                            <td className="px-4 py-2 text-sm border border-gray-300">Total Inactive Days</td>
                            <td className="px-4 py-2 text-sm border border-gray-300">{ipatrollerPreviewData.overallSummary.totalInactive}</td>
                            <td className="px-4 py-2 text-sm border border-gray-300"></td>
                            <td className="px-4 py-2 text-sm border border-gray-300"></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Monthly Breakdown - always shown */}
                  {ipatrollerPreviewData.monthlyBreakdown && ipatrollerPreviewData.monthlyBreakdown.length > 0 && (
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-4">Monthly Breakdown</h2>
                      <div className="space-y-6">
                        {ipatrollerPreviewData.monthlyBreakdown.map((monthEntry) => (
                          <div key={monthEntry.label} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-blue-500 px-4 py-3">
                              <h3 className="text-md font-bold text-white">{monthEntry.label}</h3>
                            </div>
                            {monthEntry.municipalities.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="w-full border border-gray-300">
                                  <thead>
                                    <tr className="bg-gray-100">
                                      <th className="px-4 py-2 text-center text-sm font-semibold border border-gray-300">Municipality</th>
                                      <th className="px-4 py-2 text-center text-sm font-semibold border border-gray-300">District</th>
                                      <th className="px-4 py-2 text-center text-sm font-semibold border border-gray-300">Total Patrols</th>
                                      <th className="px-4 py-2 text-center text-sm font-semibold border border-gray-300">Active Days</th>
                                      <th className="px-4 py-2 text-center text-sm font-semibold border border-gray-300">Inactive Days</th>
                                      <th className="px-4 py-2 text-center text-sm font-semibold border border-gray-300">Active %</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {monthEntry.municipalities.map((mun, idx) => (
                                      <tr key={mun.municipality} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="px-4 py-2 text-sm text-center border border-gray-300 font-medium">{mun.municipality}</td>
                                        <td className="px-4 py-2 text-sm text-center border border-gray-300">{mun.district}</td>
                                        <td className="px-4 py-2 text-sm text-center border border-gray-300">{mun.totalPatrols.toLocaleString()}</td>
                                        <td className="px-4 py-2 text-sm text-center border border-gray-300">{mun.activeDays}</td>
                                        <td className="px-4 py-2 text-sm text-center border border-gray-300">{mun.inactiveDays}</td>
                                        <td className="px-4 py-2 text-sm text-center border border-gray-300 font-semibold">{mun.activePercentage}%</td>
                                      </tr>
                                    ))}
                                    {/* Totals row */}
                                    <tr className="bg-blue-50 font-bold border-t-2 border-blue-300">
                                      <td className="px-4 py-2 text-sm text-center border border-gray-300">TOTAL</td>
                                      <td className="px-4 py-2 text-sm text-center border border-gray-300">—</td>
                                      <td className="px-4 py-2 text-sm text-center border border-gray-300">{monthEntry.totals.totalPatrols.toLocaleString()}</td>
                                      <td className="px-4 py-2 text-sm text-center border border-gray-300">{monthEntry.totals.activeDays}</td>
                                      <td className="px-4 py-2 text-sm text-center border border-gray-300">{monthEntry.totals.inactiveDays}</td>
                                      <td className="px-4 py-2 text-sm text-center border border-gray-300">{monthEntry.totals.activePercentage}%</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="p-4 text-center text-sm text-gray-500">No data available for this month.</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quarterly Report Preview Modal */}
        {showQuarterlyPreview && quarterlyPreviewData && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl mx-auto max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100 animate-in fade-in-0 zoom-in-95">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Quarterly Report Preview</h3>
                    <p className="text-sm text-gray-600">
                      Year: {quarterlyPreviewData.year} | District: {quarterlyPreviewData.district === 'all' ? 'All Districts' : quarterlyPreviewData.district}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Year selector */}
                  <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1 shadow-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <select
                      value={fromYear}
                      onChange={(e) => {
                        setFromYear(Number(e.target.value));
                        setShowQuarterlyPreview(false);
                        setQuarterlyPreviewData(null);
                        setTimeout(() => loadQuarterlyReportData(), 100);
                      }}
                      className="text-sm font-medium text-gray-700 bg-transparent outline-none cursor-pointer pr-1"
                    >
                      {[2025, 2026, 2027].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  {/* Export Excel */}
                  <Button
                    onClick={exportQuarterlyToExcel}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Excel
                  </Button>
                  {/* Generate PDF */}
                  <Button
                    onClick={generateQuarterlyCommandCenterReport}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                    disabled={isGeneratingCommandCenterReport}
                  >
                    {isGeneratingCommandCenterReport ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Generate PDF
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowQuarterlyPreview(false);
                      setQuarterlyPreviewData(null);
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
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] bg-gray-50">
                <div className="space-y-6">
                  {(() => {
                    // Filter municipalities by selected district
                    let municipalitiesToShow = Object.keys(quarterlyPreviewData.municipalityData);
                    if (quarterlyPreviewData.district !== 'all') {
                      const districtMunicipalities = municipalitiesByDistrict[quarterlyPreviewData.district] || [];
                      municipalitiesToShow = municipalitiesToShow.filter(m => districtMunicipalities.includes(m));
                    }

                    return municipalitiesToShow.map((municipality) => {
                      const munEntry = quarterlyPreviewData.municipalityData[municipality];
                      // Support both old shape (plain object) and new shape ({concernTypeData, barangayData})
                      const barangayData = munEntry.barangayData || {};
                      const barangayEntries = Object.entries(barangayData).filter(([, brgyData]) =>
                        Object.values(brgyData).some(q => (q.total || 0) > 0)
                      );

                      const renderBrgyTable = (brgyData, rowKey) => {
                        const getTrend = (cur, prev) => {
                          if (cur > prev) return { label: 'Increased', color: 'text-red-700', bg: 'bg-red-200' };
                          if (cur < prev) return { label: 'Decreased', color: 'text-green-700', bg: 'bg-green-200' };
                          return { label: 'Unchanged', color: 'text-yellow-700', bg: 'bg-yellow-200' };
                        };

                        return (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-gray-100 border-b-2 border-gray-300">
                                  <th className="px-3 py-2 text-left font-semibold text-gray-700 border-r border-gray-300">Concern Type</th>
                                  <th className="px-3 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Q1<br /><span className="text-xs font-normal">(Jan-Mar)</span></th>
                                  <th className="px-3 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Q2<br /><span className="text-xs font-normal">(Apr-Jun)</span></th>
                                  <th className="px-3 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Q3<br /><span className="text-xs font-normal">(Jul-Sep)</span></th>
                                  <th className="px-3 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Q4<br /><span className="text-xs font-normal">(Oct-Dec)</span></th>
                                  <th className="px-3 py-2 text-center font-semibold text-gray-700 bg-green-50">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(brgyData).map(([concernType, q], idx) => {
                                  const q2t = getTrend(q.Q2 || 0, q.Q1 || 0);
                                  const q3t = getTrend(q.Q3 || 0, q.Q2 || 0);
                                  const q4t = getTrend(q.Q4 || 0, q.Q3 || 0);
                                  return (
                                    <tr key={`${rowKey}-${concernType}`} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-200 hover:bg-blue-50 transition-colors`}>
                                      <td className="px-3 py-2 text-gray-900 font-medium border-r border-gray-200">{concernType}</td>
                                      <td className="px-3 py-2 text-center text-gray-700 border-r border-gray-200 font-semibold">{q.Q1 || 0}</td>
                                      <td className={`px-3 py-2 text-center border-r border-gray-200 ${q2t.bg}`}>
                                        <div className="font-semibold text-gray-900">{q.Q2 || 0}</div>
                                        <div className={`text-xs font-medium mt-0.5 ${q2t.color}`}>{q2t.label}</div>
                                      </td>
                                      <td className={`px-3 py-2 text-center border-r border-gray-200 ${q3t.bg}`}>
                                        <div className="font-semibold text-gray-900">{q.Q3 || 0}</div>
                                        <div className={`text-xs font-medium mt-0.5 ${q3t.color}`}>{q3t.label}</div>
                                      </td>
                                      <td className={`px-3 py-2 text-center border-r border-gray-200 ${q4t.bg}`}>
                                        <div className="font-semibold text-gray-900">{q.Q4 || 0}</div>
                                        <div className={`text-xs font-medium mt-0.5 ${q4t.color}`}>{q4t.label}</div>
                                      </td>
                                      <td className="px-3 py-2 text-center font-bold text-green-700 bg-green-50">{q.total || 0}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        );
                      };

                      return (
                        <div key={municipality} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                          {/* Municipality Header */}
                          <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-3 flex items-center gap-3">
                            <h3 className="text-lg font-bold text-white">{municipality.toUpperCase()}</h3>
                            {barangayCounts[municipality] && (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white text-green-700 text-sm font-extrabold shadow">
                                {barangayCounts[municipality]}
                              </span>
                            )}
                          </div>

                          {/* Per-Barangay sub-tables */}
                          {barangayEntries.length > 0 ? (
                            <div className="divide-y divide-gray-200">
                              {barangayEntries.map(([barangayName, brgyData]) => (
                                <div key={barangayName} className="p-0">
                                  {/* Barangay Sub-Header */}
                                  <div className="bg-green-50 border-b border-green-200 px-4 py-2 flex items-center gap-2">
                                    <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                                    <span className="text-sm font-semibold text-green-800">
                                      {barangayName}
                                    </span>
                                  </div>
                                  {renderBrgyTable(brgyData, `${municipality}-${barangayName}`)}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-4 text-center text-gray-500 text-sm italic">No barangay data available</div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Barangay Modal */}
        {showTopBarangay && topBarangayData && (() => {
          const allRanked = topBarangayData.ranked;           // all barangays incl. 0-entry
          const activityRanked = topBarangayData.rankedWithActivity; // only barangays with entries

          // Build deduplicated municipality list using case-insensitive keys
          // canonicalMunMap: lowercase-trimmed name → canonical display name (first seen wins)
          const canonicalMunMap = {};   // lowercase → canonical name
          const municipalityTotalsMap = {}; // canonical name → total
          // Only registered barangays drive the municipality tabs/order
          const registeredRanked = allRanked.filter(b => b.registered === true);
          registeredRanked.forEach(b => {
            const norm = (b.municipality || '').trim().toLowerCase();
            if (!norm) return;
            if (!canonicalMunMap[norm]) {
              canonicalMunMap[norm] = b.municipality.trim();
              municipalityTotalsMap[b.municipality.trim()] = 0;
            }
            const canonical = canonicalMunMap[norm];
            municipalityTotalsMap[canonical] = (municipalityTotalsMap[canonical] || 0) + (b.actionTakenCount || 0);
          });
          // Unique canonical municipality names sorted by total action taken descending
          const municipalityOrder = Object.values(canonicalMunMap)
            .filter((v, i, arr) => arr.indexOf(v) === i)
            .sort((a, b) => (municipalityTotalsMap[b] || 0) - (municipalityTotalsMap[a] || 0));

          // Barangays for the active tab — only registered, case-insensitive filter, alphabetical
          const activeTabNorm = topBarangayTab.trim().toLowerCase();
          const activeRanked = topBarangayTab === 'all'
            ? activityRanked   // All tab: global leaderboard (only active barangays)
            : registeredRanked // Municipality tab: only registered barangays, sorted by actionTakenCount descending
              .filter(b => (b.municipality || '').trim().toLowerCase() === activeTabNorm)
              .sort((a, b) => b.actionTakenCount - a.actionTakenCount || b.total - a.total);

          // Max for activity bar — use the highest entry based on actionTakenCount, or 1
          const maxEntry = [...activeRanked].sort((a, b) => b.actionTakenCount - a.actionTakenCount).find(b => b.actionTakenCount > 0);
          const maxForTab = maxEntry ? maxEntry.actionTakenCount : 1;

          const exportTopBarangayToPDF = () => {
            const doc = new jsPDF();
            const reportLabel = topBarangayData.month === 'all'
              ? `Year: ${topBarangayData.year} — All Months`
              : `${MONTH_NAMES[parseInt(topBarangayData.month)]} ${topBarangayData.year}`;

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Top Barangay Report', 14, 18);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`${reportLabel} — Ranked by total activity`, 14, 24);

            const head = topBarangayTab === 'all'
              ? [['Rank', 'Barangay', 'Municipality', 'Entries', 'Action Taken']]
              : [['Rank', 'Barangay', 'Entries', 'Action Taken']];

            const body = activeRanked.map((b, idx) => {
              const rankLabel = `#${idx + 1}`;
              const entries = (b.total ?? 0).toLocaleString();
              const actionTaken = (b.actionTakenCount ?? 0).toLocaleString();
              if (topBarangayTab === 'all') {
                return [rankLabel, b.name || '', b.municipality || '', entries, actionTaken];
              }
              return [rankLabel, b.name || '', entries, actionTaken];
            });

            autoTable(doc, {
              head,
              body,
              startY: 32,
              theme: 'grid',
              styles: { fontSize: 9, cellPadding: 3 },
              headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
              columnStyles: {
                0: { cellWidth: 16 }
              }
            });

            const tabLabel = topBarangayTab === 'all' ? 'All_Municipalities' : String(topBarangayTab).replace(/\s+/g, '_');
            const monthPart = topBarangayData.month === 'all' ? 'All_Months' : MONTH_NAMES[parseInt(topBarangayData.month)].replace(/\s+/g, '_');
            doc.save(`Top_Barangay_Report_${tabLabel}_${monthPart}_${topBarangayData.year}.pdf`);
          };

          const exportTopBarangayToJPEG = async () => {
            const exportContainer = document.getElementById('top-barangay-jpeg-export');
            
            if (exportContainer) {
              const originalParent = exportContainer.parentNode;
              const originalStyle = exportContainer.getAttribute('style') || '';
              
              // Move to body and make it explicitly visible behind the modal for capturing
              document.body.appendChild(exportContainer);
              exportContainer.style.position = 'fixed';
              exportContainer.style.left = '0';
              exportContainer.style.top = '0';
              exportContainer.style.zIndex = '-9999';
              exportContainer.style.opacity = '1';
              exportContainer.style.display = 'block';

              try {
                // Wait a tiny bit for browser to apply layout
                await new Promise(r => setTimeout(r, 100));

                const dataUrl = await htmlToImage.toJpeg(exportContainer, {
                  quality: 0.9,
                  backgroundColor: '#ffffff',
                  pixelRatio: 2
                });

                const tabLabel = topBarangayTab === 'all' ? 'All_Municipalities' : String(topBarangayTab).replace(/\s+/g, '_');
                const monthPart = topBarangayData.month === 'all' ? 'All_Months' : MONTH_NAMES[parseInt(topBarangayData.month)].replace(/\s+/g, '_');
                const filename = `Top_Barangay_Report_${tabLabel}_${monthPart}_${topBarangayData.year}.jpg`;

                const link = document.createElement('a');
                link.download = filename;
                link.href = dataUrl;
                link.click();
              } catch (error) {
                console.error("Error exporting to JPEG:", error);
              } finally {
                // Revert completely
                if (originalParent) {
                  originalParent.appendChild(exportContainer);
                }
                exportContainer.setAttribute('style', originalStyle);
              }
            }
          };

          return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div id="top-barangay-modal-window" className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-auto max-h-[90vh] overflow-hidden flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <MapPin className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Top Barangay Report</h3>
                      <p className="text-sm text-gray-500">
                        {topBarangayData.month === 'all'
                          ? `Year: ${topBarangayData.year} — All Months`
                          : `${MONTH_NAMES[parseInt(topBarangayData.month)]} ${topBarangayData.year}`
                        } — Ranked by total activity
                      </p>
                    </div>
                  </div>
                  <div id="top-barangay-controls" className="flex items-center gap-2 flex-wrap justify-end">
                    <button
                      onClick={exportTopBarangayToJPEG}
                      disabled={isLoadingTopBarangay || activeRanked.length === 0}
                      title="Export to JPEG"
                      className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors text-gray-700 disabled:opacity-50"
                    >
                      <ImageIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={exportTopBarangayToPDF}
                      disabled={isLoadingTopBarangay || activeRanked.length === 0}
                      title="Export to PDF"
                      className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors text-gray-700 disabled:opacity-50"
                    >
                      <FileText className="w-5 h-5" />
                    </button>
                    {/* Month Filter */}
                    <select
                      value={topBarangayMonth}
                      onChange={e => setTopBarangayMonth(e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    >
                      <option value="all">All Months</option>
                      {MONTH_NAMES.map((m, i) => (
                        <option key={i} value={i}>{m}</option>
                      ))}
                    </select>
                    {/* Year Filter */}
                    <select
                      value={topBarangayYear}
                      onChange={e => setTopBarangayYear(parseInt(e.target.value))}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                    {/* Apply Button */}
                    <button
                      onClick={() => loadTopBarangayReport(topBarangayMonth, topBarangayYear)}
                      disabled={isLoadingTopBarangay}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      {isLoadingTopBarangay ? (
                        <><div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-1 inline-block"></div>Loading…</>
                      ) : 'Apply'}
                    </button>
                    <button
                      onClick={() => { setShowTopBarangay(false); setTopBarangayData(null); setTopBarangayTab('all'); }}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Summary Chips */}
                <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-gray-100 bg-white flex-shrink-0">
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                    <MapPin className="w-3 h-3" />
                    {activityRanked.length} Barangays with Activity
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-full">
                    <MapPin className="w-3 h-3" />
                    {registeredRanked.length} Total Registered Barangays
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                    <BarChart3 className="w-3 h-3" />
                    Total: {activityRanked.reduce((s, b) => s + (b.actionTakenCount || 0), 0).toLocaleString()} Actions
                  </span>
                  {topBarangayTab !== 'all' && (
                    <span className="inline-flex items-center gap-1.5 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                      <BarChart3 className="w-3 h-3" />
                      {topBarangayTab}: {(municipalityTotalsMap[Object.values(canonicalMunMap).find(v => v.trim().toLowerCase() === topBarangayTab.trim().toLowerCase()) || topBarangayTab] || 0).toLocaleString()} Actions
                    </span>
                  )}
                </div>

                {/* Municipality Tabs */}
                <div className="flex-shrink-0 border-b border-gray-200 bg-white overflow-x-auto">
                  <div className="flex min-w-max">
                    {/* All tab */}
                    <button
                      onClick={() => setTopBarangayTab('all')}
                      className={`px-4 py-3 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors whitespace-nowrap ${topBarangayTab === 'all'
                        ? 'border-emerald-500 text-emerald-700 bg-emerald-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      All Municipalities
                    </button>
                    {municipalityOrder.map(mun => (
                      <button
                        key={mun}
                        onClick={() => setTopBarangayTab(mun)}
                        className={`px-4 py-3 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${topBarangayTab.trim().toLowerCase() === mun.trim().toLowerCase()
                          ? 'border-emerald-500 text-emerald-700 bg-emerald-50'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        {mun}
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${topBarangayTab.trim().toLowerCase() === mun.trim().toLowerCase() ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                          {registeredRanked.filter(b => (b.municipality || '').trim().toLowerCase() === mun.trim().toLowerCase()).length}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table Body */}
                <div id="top-barangay-table-container" className="overflow-y-auto flex-1">
                  {activeRanked.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                      <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-lg font-medium">No barangay data found</p>
                      <p className="text-sm">No records available for {topBarangayData.month === 'all' ? topBarangayData.year : `${MONTH_NAMES[parseInt(topBarangayData.month)]} ${topBarangayData.year}`}</p>
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="py-3 px-4 text-left font-bold text-gray-700 w-14">Rank</th>
                          <th className="py-3 px-4 text-left font-bold text-gray-700">Barangay</th>
                          {topBarangayTab === 'all' && (
                            <th className="py-3 px-4 text-left font-bold text-gray-700">Municipality</th>
                          )}
                          <th className="py-3 px-4 text-center font-bold text-gray-700">Entries</th>
                          <th className="py-3 px-4 text-left font-bold text-gray-700">Action Taken</th>
                          <th className="py-3 px-4 text-left font-bold text-gray-700 w-48">Activity Bar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {activeRanked.map((brgy, idx) => {
                          const actionCount = brgy.actionTakenCount || 0;
                          const pct = maxForTab > 0 ? Math.round((actionCount / maxForTab) * 100) : 0;
                          const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;
                          const rowBg =
                            idx === 0 ? 'bg-amber-50' :
                              idx === 1 ? 'bg-gray-50' :
                                idx === 2 ? 'bg-orange-50' : 'bg-white';
                          return (
                            <tr key={`${brgy.name}-${brgy.municipality}`} className={`${rowBg} hover:bg-emerald-50/40 transition-colors`}>
                              <td className="py-3 px-4">
                                <span className="text-sm font-bold text-gray-500">
                                  {medal ? <span className="text-base">{medal}</span> : `#${idx + 1}`}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-semibold text-gray-900">{brgy.name}</td>
                              {topBarangayTab === 'all' && (
                                <td className="py-3 px-4 text-gray-500 text-xs font-medium">{brgy.municipality}</td>
                              )}
                              <td className="py-3 px-4 text-center">
                                <span className={`inline-flex items-center justify-center min-w-[2.5rem] px-2.5 py-0.5 rounded-full text-xs font-bold ${idx === 0 ? 'bg-amber-100 text-amber-800' :
                                  idx === 1 ? 'bg-gray-200 text-gray-700' :
                                    idx === 2 ? 'bg-orange-100 text-orange-700' :
                                      'bg-emerald-50 text-emerald-700'
                                  }`}>
                                  {brgy.total.toLocaleString()}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`inline-flex items-center justify-center min-w-[2.5rem] px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                  (brgy.actionTakenCount || 0) > 0 ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'
                                }`}>
                                  {(brgy.actionTakenCount || 0).toLocaleString()}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-500 ${idx === 0 ? 'bg-amber-400' :
                                        idx === 1 ? 'bg-gray-400' :
                                          idx === 2 ? 'bg-orange-400' :
                                            'bg-emerald-400'
                                        }`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Hidden container for JPEG export to exactly match PDF */}
                <div 
                  id="top-barangay-jpeg-export" 
                  style={{
                    display: 'none',
                    width: '800px',
                    backgroundColor: '#ffffff',
                    padding: '40px',
                    fontFamily: 'helvetica, arial, sans-serif',
                    color: '#000'
                  }}
                >
                  <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Top Barangay Report</h1>
                  <p style={{ fontSize: '14px', margin: '0 0 24px 0' }}>
                    {topBarangayData.month === 'all'
                      ? `Year: ${topBarangayData.year} — All Months`
                      : `${MONTH_NAMES[parseInt(topBarangayData.month)]} ${topBarangayData.year}`
                    } — Ranked by total activity
                  </p>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr>
                        <th style={{ backgroundColor: '#10B981', color: '#ffffff', padding: '8px', border: '1px solid #e5e7eb', textAlign: 'left', width: '40px', fontWeight: 'bold' }}>Rank</th>
                        <th style={{ backgroundColor: '#10B981', color: '#ffffff', padding: '8px', border: '1px solid #e5e7eb', textAlign: 'left', fontWeight: 'bold' }}>Barangay</th>
                        {topBarangayTab === 'all' && (
                          <th style={{ backgroundColor: '#10B981', color: '#ffffff', padding: '8px', border: '1px solid #e5e7eb', textAlign: 'left', fontWeight: 'bold' }}>Municipality</th>
                        )}
                        <th style={{ backgroundColor: '#10B981', color: '#ffffff', padding: '8px', border: '1px solid #e5e7eb', textAlign: 'left', fontWeight: 'bold' }}>Entries</th>
                        <th style={{ backgroundColor: '#10B981', color: '#ffffff', padding: '8px', border: '1px solid #e5e7eb', textAlign: 'left', fontWeight: 'bold' }}>Action Taken</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeRanked.map((b, idx) => (
                        <tr key={idx}>
                          <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>#{idx + 1}</td>
                          <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>{b.name || ''}</td>
                          {topBarangayTab === 'all' && (
                            <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>{b.municipality || ''}</td>
                          )}
                          <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>{(b.total ?? 0).toLocaleString()}</td>
                          <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>{(b.actionTakenCount ?? 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            </div>
          );
        })()}
      </div>
    </Layout>
  );
}
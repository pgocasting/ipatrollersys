import React, { useState, useEffect, useRef } from "react";
import Layout from "./Layout";
import { useFirebase } from "./hooks/useFirebase";
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
  Plus,
  X
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export default function CommandCenter({ onLogout, onNavigate, currentPage }) {
  const { 
    saveBarangays, 
    getBarangays, 
    saveConcernTypes, 
    getConcernTypes, 
    saveWeeklyReport, 
    getWeeklyReport 
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
  
  // Active Tab State
  const [activeTab, setActiveTab] = useState("overview");

  // Weekly Report State
  const [weeklyReports, setWeeklyReports] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedBarangay, setSelectedBarangay] = useState("");
  const [selectedConcernType, setSelectedConcernType] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [remarks, setRemarks] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleDateString("en-US", { month: "long" }));
  const [selectedYear, setSelectedYear] = useState("2025");
  const [selectedReportMunicipality, setSelectedReportMunicipality] = useState("");
  const [importedConcernTypes, setImportedConcernTypes] = useState([]);
  const [concernTypeData, setConcernTypeData] = useState("");
  const [isLoadingConcernTypes, setIsLoadingConcernTypes] = useState(false);
  const [isLoadingWeeklyReports, setIsLoadingWeeklyReports] = useState(false);
  
  // Weekly Report Data - Individual date entries
  const [weeklyReportData, setWeeklyReportData] = useState({});
  
  // Municipality tabs state
  const [activeMunicipalityTab, setActiveMunicipalityTab] = useState("");
  
  // Clear data options state
  const [showClearOptions, setShowClearOptions] = useState(false);
  const [selectedClearMunicipality, setSelectedClearMunicipality] = useState("");
  
  // Excel Import States
  const [isImportingExcel, setIsImportingExcel] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [excelData, setExcelData] = useState([]);
  const [excelPreview, setExcelPreview] = useState([]);
  const [showExcelPreview, setShowExcelPreview] = useState(false);
  const [excelMunicipalityData, setExcelMunicipalityData] = useState({});
  const [selectedExcelMunicipality, setSelectedExcelMunicipality] = useState("");

  // Municipalities by district
  const municipalitiesByDistrict = {
    "District 1": ["Abucay", "Hermosa", "Orani", "Samal"],
    "District 2": ["Balanga", "Limay", "Orion", "Pilar"],
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
  const years = [(currentYear - 1).toString(), currentYear.toString(), (currentYear + 1).toString()];

  // Generate dates for selected month and year
  const generateDates = (month, year) => {
    const dates = [];
    const daysInMonth = new Date(year, months.indexOf(month) + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      dates.push(`${month} ${day}, ${year}`);
    }
    return dates;
  };

  const currentDates = generateDates(selectedMonth, selectedYear);

  // Load data from Firestore on component mount
  useEffect(() => {
    loadBarangaysFromFirestore();
    loadConcernTypesFromFirestore();
  }, []);

  // Set default active municipality tab when component loads
  useEffect(() => {
    if (importedBarangays.length > 0 && !activeMunicipalityTab) {
      const allMunicipalities = Object.values(municipalitiesByDistrict).flat();
      const firstMunicipality = allMunicipalities[0];
      setActiveMunicipalityTab(firstMunicipality);
      setSelectedReportMunicipality(firstMunicipality);
    }
  }, [importedBarangays, activeMunicipalityTab]);

  // Load weekly report data when month/year/municipality changes
  useEffect(() => {
    loadWeeklyReportData();
  }, [selectedMonth, selectedYear, activeMunicipalityTab]);

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

  // Load weekly report data from Firestore
  const loadWeeklyReportData = async () => {
    if (!selectedMonth || !selectedYear) return;
    
    setIsLoadingWeeklyReports(true);
    try {
      const monthYear = `${selectedMonth}_${selectedYear}`;
      const municipalityKey = activeMunicipalityTab ? `_${activeMunicipalityTab}` : '';
      const reportKey = `${monthYear}${municipalityKey}`;
      
      const result = await getWeeklyReport(reportKey);
      if (result.success && result.data) {
        // Load existing data into weeklyReportData state
        if (result.data.weeklyReportData) {
          setWeeklyReportData(result.data.weeklyReportData);
        } else {
          // Initialize empty data structure for all dates
          initializeWeeklyReportData();
        }
        
        // Load form fields if they exist (for backward compatibility)
        setSelectedBarangay(result.data.selectedBarangay || "");
        setSelectedConcernType(result.data.selectedConcernType || "");
        setActionTaken(result.data.actionTaken || "");
        setRemarks(result.data.remarks || "");
        console.log('✅ Loaded weekly report data for:', reportKey);
      } else {
        // Initialize empty data structure for all dates
        initializeWeeklyReportData();
        // Clear form fields if no data found
        setSelectedBarangay("");
        setSelectedConcernType("");
        setActionTaken("");
        setRemarks("");
        console.log('📝 No existing weekly report data found for:', reportKey);
      }
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
    return weeklyReportData[date] || [];
  };

  // Validate weekly report data
  const validateWeeklyReportData = () => {
    const errors = [];
    const dates = generateDates(selectedMonth, selectedYear);
    
    // Check if at least one date has data
    let hasData = false;
    dates.forEach(date => {
      const dateEntries = getDateData(date);
      dateEntries.forEach(entry => {
        if (entry.barangay || entry.concernType || entry.week1 || 
            entry.week2 || entry.week3 || entry.week4 || 
            entry.actionTaken || entry.remarks) {
          hasData = true;
        }
      });
    });
    
    if (!hasData) {
      errors.push("Please enter data for at least one date");
    }
    
    // Check for incomplete entries (barangay selected but no concern type, etc.)
    dates.forEach(date => {
      const dateEntries = getDateData(date);
      dateEntries.forEach((entry, entryIndex) => {
        if (entry.barangay && !entry.concernType) {
          errors.push(`Date ${date}, Entry ${entryIndex + 1}: Concern type is required when barangay is selected`);
        }
        if (entry.concernType && !entry.barangay) {
          errors.push(`Date ${date}, Entry ${entryIndex + 1}: Barangay is required when concern type is selected`);
        }
        
        // Validate week numbers
        const weekFields = ['week1', 'week2', 'week3', 'week4'];
        weekFields.forEach(weekField => {
          const value = entry[weekField];
          if (value && (isNaN(Number(value)) || Number(value) < 0)) {
            errors.push(`Date ${date}, Entry ${entryIndex + 1}: ${weekField} must be a valid positive number`);
          }
        });
      });
    });
    
    return errors;
  };

  // Clear all weekly report data for active municipality
  const handleClearActiveMunicipalityData = () => {
    if (window.confirm(`Are you sure you want to clear all weekly report data for ${activeMunicipalityTab}? This action cannot be undone.`)) {
      initializeWeeklyReportData();
      setSelectedBarangay("");
      setSelectedConcernType("");
      setActionTaken("");
      setRemarks("");
      toast.success(`Weekly report data cleared for ${activeMunicipalityTab}`);
      
      // Add to terminal history
      const newEntry = {
        id: Date.now(),
        command: "weekly.clear.municipality",
        output: `Cleared weekly report data for ${activeMunicipalityTab}`,
        type: "warning",
        timestamp: new Date()
      };
      setTerminalHistory(prev => [...prev, newEntry]);
    }
  };

  // Clear weekly report data for selected municipality
  const handleClearSelectedMunicipalityData = async () => {
    if (!selectedClearMunicipality) {
      toast.error("Please select a municipality to clear data for");
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

        const saveResult = await saveWeeklyReport(reportKey, reportData);
        if (saveResult.success) {
          toast.success(`Weekly report data cleared for ${selectedClearMunicipality}`);
          
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
        }
      } catch (error) {
        console.error("Error clearing selected municipality data:", error);
        toast.error("Error clearing selected municipality data");
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
  };

  // Get concern types for a specific municipality
  const getConcernTypesForMunicipality = (municipality) => {
    if (!municipality) return importedConcernTypes;
    
    return importedConcernTypes.filter(type => 
      type.municipality === municipality || 
      type.municipality === "All Municipalities"
    );
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
      }
    } catch (error) {
      console.error('❌ Error loading barangays:', error);
      toast.error('Error loading barangays from database');
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
      }
    } catch (error) {
      console.error('❌ Error loading concern types:', error);
      toast.error('Error loading concern types from database');
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
        output = "Available commands: status, units, alerts, clear, patrol.active, incidents.pending, system.info, barangays.list, excel.help, excel.status";
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
        output = "Excel Import Commands:\n- Use 'Import Excel' button in Weekly Report section\n- Supported formats: .xlsx, .xls, .csv\n- Required columns: Date, Municipality, Barangay, Concern Type, Week 1-4, Action Taken, Remarks\n- Data is grouped by municipality for selective import";
        break;
      case "excel.status":
        output = `Excel Import Status:\nFile loaded: ${excelFile ? excelFile.name : 'None'}\nRows parsed: ${excelData.length}\nMunicipalities detected: ${Object.keys(excelMunicipalityData).length}\nSelected municipality: ${selectedExcelMunicipality || 'None'}\nPreview shown: ${showExcelPreview ? 'Yes' : 'No'}`;
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
        // Revert local state if save failed
        setImportedBarangays(importedBarangays);
      }
      
    } catch (error) {
      toast.error("Error importing barangays: " + error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportBarangays = () => {
    if (importedBarangays.length === 0) {
      toast.error("No barangays to export");
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
  };

  const handleClearBarangays = async () => {
    if (importedBarangays.length === 0) {
      toast.error("No barangays to clear");
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
        } else {
          toast.error("Failed to clear barangays from database: " + saveResult.error);
        }
      } catch (error) {
        toast.error("Error clearing barangays: " + error.message);
      }
    }
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

  // Handle edit selected barangays
  const handleEditSelectedBarangays = () => {
    if (selectedBarangays.length === 0) {
      toast.error("No barangays selected for editing");
      return;
    }

    if (selectedBarangays.length > 1) {
      toast.error("Please select only one barangay to edit at a time");
      return;
    }

    const barangayToEdit = importedBarangays.find(brgy => brgy.id === selectedBarangays[0]);
    if (barangayToEdit) {
      setEditingBarangay(barangayToEdit);
      setIsEditingBarangays(true);
    }
  };

  // Handle save edited barangay
  const handleSaveEditedBarangay = async () => {
    if (!editingBarangay) return;

    try {
      const updatedBarangays = importedBarangays.map(brgy => 
        brgy.id === editingBarangay.id ? editingBarangay : brgy
      );

      // Save to Firestore
      const saveResult = await saveBarangays(updatedBarangays);
      if (saveResult.success) {
        setImportedBarangays(updatedBarangays);
        setEditingBarangay(null);
        setIsEditingBarangays(false);
        setSelectedBarangays([]);
        toast.success("Barangay updated successfully");
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
          toast.success("All concern types cleared successfully");
        } else {
          toast.error("Failed to clear concern types from database: " + saveResult.error);
        }
      } catch (error) {
        toast.error("Error clearing concern types: " + error.message);
      }
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
    parseExcelFile(file);
  };

  const parseExcelFile = (file) => {
    setIsImportingExcel(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first worksheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
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
          
          return {
            id: `excel-${Date.now()}-${index}`,
            date: row[0] || '',
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

        setExcelData(processedData);
        setExcelMunicipalityData(municipalityGroups);
        setExcelPreview(processedData.slice(0, 5)); // Show first 5 rows as preview
        setShowExcelPreview(true);
        
        // Set the first municipality as default selection
        const firstMunicipality = Object.keys(municipalityGroups)[0];
        if (firstMunicipality) {
          setSelectedExcelMunicipality(firstMunicipality);
        }
        
        toast.success(`Successfully parsed ${processedData.length} rows from Excel file`);
        
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
              
              // Find matching date in our current dates
              const matchingDate = currentDates.find(date => 
                date === formattedDate || 
                date.includes(excelDate) || 
                excelDate.includes(date.split(' ')[1].replace(',', ''))
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

  const handleClearExcelData = () => {
    setExcelData([]);
    setExcelPreview([]);
    setShowExcelPreview(false);
    setExcelFile(null);
    setExcelMunicipalityData({});
    setSelectedExcelMunicipality("");
    toast.info("Excel data cleared");
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

  // Save weekly report data to Firestore
  const handleSaveWeeklyReport = async () => {
    const monthYear = `${selectedMonth}_${selectedYear}`;
    const municipalityKey = selectedReportMunicipality ? `_${selectedReportMunicipality}` : '';
    const reportKey = `${monthYear}${municipalityKey}`;
    setIsLoadingWeeklyReports(true);
    
    try {
      // Validate data before saving
      const validationErrors = validateWeeklyReportData();
      if (validationErrors.length > 0) {
        toast.error("Validation errors: " + validationErrors.join(", "));
        setIsLoadingWeeklyReports(false);
        return;
      }

      // Collect all form data from the weekly report table
      const reportData = {
        month: selectedMonth,
        year: selectedYear,
        municipality: activeMunicipalityTab || "All Municipalities",
        selectedBarangay,
        selectedConcernType,
        actionTaken,
        remarks,
        weeklyReportData, // Include individual date data
        savedAt: new Date().toISOString()
      };

      const saveResult = await saveWeeklyReport(reportKey, reportData);
      if (saveResult.success) {
        toast.success(`Weekly report saved successfully for ${activeMunicipalityTab || 'All Municipalities'}`);
        
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
        toast.error("Failed to save weekly report: " + saveResult.error);
      }
    } catch (error) {
      console.error("Error saving weekly report:", error);
      toast.error("Error saving weekly report");
    } finally {
      setIsLoadingWeeklyReports(false);
    }
  };

  return (
    <Layout onNavigate={onNavigate} currentPage={currentPage} onLogout={onLogout}>
      <section className="flex-1 p-3 md:p-6 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold transition-colors duration-300 text-gray-900">
              Command Center
            </h1>
            <p className="text-base md:text-lg transition-colors duration-300 text-gray-600">
              {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })} • Real-time monitoring and control system
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                All systems operational
              </span>
            </div>
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setActiveTab("overview")}
              className={`h-12 w-12 rounded-full transition-all duration-200 flex items-center justify-center shadow-lg ${
                activeTab === "overview"
                  ? "bg-blue-600 text-white"
                  : "bg-white/80 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
              }`}
              title="Overview"
            >
              <BarChart3 className="h-6 w-6" />
            </button>
            <button
              onClick={() => setActiveTab("weekly-report")}
              className={`h-12 w-12 rounded-full transition-all duration-200 flex items-center justify-center shadow-lg ${
                activeTab === "weekly-report"
                  ? "bg-green-600 text-white"
                  : "bg-white/80 text-gray-600 hover:bg-green-50 hover:text-green-600"
              }`}
              title="Weekly Report"
            >
              <FileText className="h-6 w-6" />
            </button>
            <button
              onClick={() => setActiveTab("barangays")}
              className={`h-12 w-12 rounded-full transition-all duration-200 flex items-center justify-center shadow-lg ${
                activeTab === "barangays"
                  ? "bg-purple-600 text-white"
                  : "bg-white/80 text-gray-600 hover:bg-purple-50 hover:text-purple-600"
              }`}
              title="Barangay Management"
            >
              <Building2 className="h-6 w-6" />
            </button>
            <button
              onClick={() => setActiveTab("concern-types")}
              className={`h-12 w-12 rounded-full transition-all duration-200 flex items-center justify-center shadow-lg ${
                activeTab === "concern-types"
                  ? "bg-orange-600 text-white"
                  : "bg-white/80 text-gray-600 hover:bg-orange-50 hover:text-orange-600"
              }`}
              title="Type of Concern Management"
            >
              <AlertTriangle className="h-6 w-6" />
            </button>
          </div>
        </div>

      {/* Main Dashboard */}
      <div className="space-y-4">

        {/* Barangay Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium transition-colors duration-300 text-gray-500">Total Barangays</p>
                  <p className="text-2xl md:text-3xl font-bold text-purple-600">
                    {importedBarangays.length}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    All municipalities
                  </p>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-colors duration-300 bg-purple-100">
                  <Building2 className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium transition-colors duration-300 text-gray-500">Total Districts</p>
                  <p className="text-2xl md:text-3xl font-bold text-blue-600">
                    {new Set(importedBarangays.map(b => b.district)).size}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Active districts
                  </p>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-colors duration-300 bg-blue-100">
                  <MapPin className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium transition-colors duration-300 text-gray-500">Total Municipalities</p>
                  <p className="text-2xl md:text-3xl font-bold text-green-600">
                    {new Set(importedBarangays.map(b => b.municipality)).size}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    With barangays
                  </p>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-colors duration-300 bg-green-100">
                  <Users className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium transition-colors duration-300 text-gray-500">Avg per Municipality</p>
                  <p className="text-2xl md:text-3xl font-bold text-orange-600">
                    {new Set(importedBarangays.map(b => b.municipality)).size > 0 
                      ? Math.round(importedBarangays.length / new Set(importedBarangays.map(b => b.municipality)).size)
                      : 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Barangays per municipality
                  </p>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-colors duration-300 bg-orange-100">
                  <Activity className="h-5 w-5 md:h-6 md:w-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Overview Section */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekly Patrol Activity */}
              <div className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
                <div className="p-4 md:p-6 pb-0">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center transition-colors duration-300 bg-blue-100">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold transition-colors duration-300 text-gray-900">Weekly Patrol Activity</h3>
                  </div>
                </div>
                <div className="p-4 md:p-6 pt-0">
                  <div className="h-64">
                    <Bar data={patrolData} options={chartOptions} />
                  </div>
                </div>
              </div>

              {/* District Distribution */}
              <div className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
                <div className="p-4 md:p-6 pb-0">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center transition-colors duration-300 bg-purple-100">
                      <Users className="h-4 w-4 text-purple-600" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold transition-colors duration-300 text-gray-900">District Distribution</h3>
                  </div>
                </div>
                <div className="p-4 md:p-6 pt-0">
                  <div className="h-64">
                    <Doughnut data={districtData} options={doughnutOptions} />
                  </div>
                </div>
              </div>
            </div>

            {/* Alert Trends */}
            <div className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
              <div className="p-4 md:p-6 pb-0">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center transition-colors duration-300 bg-red-100">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold transition-colors duration-300 text-gray-900">Alert Trends (6 Months)</h3>
                </div>
              </div>
              <div className="p-4 md:p-6 pt-0">
                <div className="h-80">
                  <Line data={alertTrendData} options={chartOptions} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Weekly Report Section */}
        {activeTab === "weekly-report" && (
          <div className="space-y-6">
            {/* Weekly Report Header */}
            <div className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
              <div className="p-4 md:p-6 pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center transition-colors duration-300 bg-green-100">
                      <FileText className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-bold transition-colors duration-300 text-gray-900">Weekly Report - {selectedMonth} {selectedYear}</h3>
                      {activeMunicipalityTab && (
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-600">{activeMunicipalityTab}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {getConcernTypesForMunicipality(activeMunicipalityTab).length} concern types • 
                            {importedBarangays.filter(b => b.municipality === activeMunicipalityTab).length} barangays
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleExportWeeklyReport}
                      className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors duration-200 flex items-center justify-center"
                      title="Export Report"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <div className="relative clear-options-container">
                      <button 
                        onClick={() => setShowClearOptions(!showClearOptions)}
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors duration-200 flex items-center justify-center"
                        title="Clear Data"
                      >
                        <AlertTriangle className="h-4 w-4" />
                      </button>
                      
                      {showClearOptions && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                          <div className="p-4">
                            <h4 className="text-sm font-semibold text-gray-900 mb-3">Clear Data Options</h4>
                            
                            {/* Clear Active Municipality */}
                            <div className="mb-4">
                              <button
                                onClick={() => {
                                  handleClearActiveMunicipalityData();
                                  setShowClearOptions(false);
                                }}
                                className="w-full text-left p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors duration-200"
                              >
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4 text-red-600" />
                                  <div>
                                    <div className="text-sm font-medium text-red-800">Clear Active Municipality</div>
                                    <div className="text-xs text-red-600">Clear data for {activeMunicipalityTab}</div>
                                  </div>
                                </div>
                              </button>
                            </div>
                            
                            {/* Clear Selected Municipality */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-2">Select Municipality to Clear</label>
                              <div className="flex gap-2">
                                <select 
                                  value={selectedClearMunicipality}
                                  onChange={(e) => setSelectedClearMunicipality(e.target.value)}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                >
                                  <option value="">Choose municipality...</option>
                                  {Object.values(municipalitiesByDistrict).flat().map((municipality) => (
                                    <option key={municipality} value={municipality}>{municipality}</option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => {
                                    handleClearSelectedMunicipalityData();
                                    setShowClearOptions(false);
                                  }}
                                  disabled={!selectedClearMunicipality}
                                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-1"
                                >
                                  <AlertTriangle className="h-4 w-4" />
                                  Clear
                                </button>
                              </div>
                            </div>
                            
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <button
                                onClick={() => setShowClearOptions(false)}
                                className="w-full text-center text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={handleSaveWeeklyReport}
                      disabled={isLoadingWeeklyReports}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white p-2 rounded-lg transition-colors duration-200 flex items-center justify-center"
                      title="Save Data"
                    >
                      {isLoadingWeeklyReports ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                    </button>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleExcelFileSelect}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        id="excel-file-input"
                      />
                      <label
                        htmlFor="excel-file-input"
                        className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg transition-colors duration-200 flex items-center justify-center cursor-pointer"
                        title="Import Excel"
                      >
                        <Upload className="h-4 w-4" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 md:p-6 pt-0">
                {/* Month/Year Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Month</label>
                    <select 
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      {months.map((month) => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Year</label>
                    <select 
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

                {/* Municipality Tabs */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Select Municipality</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.values(municipalitiesByDistrict).flat().map((municipality) => {
                      const isActive = activeMunicipalityTab === municipality;
                      const concernTypesCount = getConcernTypesForMunicipality(municipality).length;
                      const barangaysCount = importedBarangays.filter(b => b.municipality === municipality).length;
                      
                      return (
                        <button
                          key={municipality}
                          onClick={() => handleMunicipalityTabChange(municipality)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                            isActive
                              ? 'bg-green-600 text-white shadow-lg'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-green-50 hover:border-green-300'
                          }`}
                        >
                          <Building2 className="h-4 w-4" />
                          <span>{municipality}</span>
                          <div className={`text-xs px-2 py-1 rounded-full ${
                            isActive 
                              ? 'bg-green-500 text-white' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {barangaysCount} brgy • {concernTypesCount} types
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* Excel Import Preview Section */}
              {showExcelPreview && excelPreview.length > 0 && (
                <div className="p-4 md:p-6 pt-0">
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center bg-purple-100">
                          <FileSpreadsheet className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">Excel Import Preview</h4>
                          <p className="text-sm text-gray-600">
                            {excelData.length} rows ready to import • {Object.keys(excelMunicipalityData).length} municipalities detected
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleImportExcelData}
                          disabled={isImportingExcel}
                          className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
                        >
                          {isImportingExcel ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Importing...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              Import Data
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleClearExcelData}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
                        >
                          <AlertTriangle className="h-4 w-4" />
                          Clear
                        </button>
                      </div>
                    </div>
                    
                    {/* Municipality Selection */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Municipality to Import</label>
                      <select 
                        value={selectedExcelMunicipality}
                        onChange={(e) => setSelectedExcelMunicipality(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">Choose municipality...</option>
                        {Object.keys(excelMunicipalityData).map((municipality) => (
                          <option key={municipality} value={municipality}>
                            {municipality} ({excelMunicipalityData[municipality].length} rows)
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-white/50 border-b border-purple-200">
                            <th className="px-3 py-2 text-left font-medium text-gray-700">DATE</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-700">BARANGAY</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-700">TYPE OF CONCERN</th>
                            <th className="px-3 py-2 text-center font-medium text-gray-700">Week 1</th>
                            <th className="px-3 py-2 text-center font-medium text-gray-700">Week 2</th>
                            <th className="px-3 py-2 text-center font-medium text-gray-700">Week 3</th>
                            <th className="px-3 py-2 text-center font-medium text-gray-700">Week 4</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-700">STATUS</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-700">REMARKS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-purple-100">
                          {(selectedExcelMunicipality && excelMunicipalityData[selectedExcelMunicipality] 
                            ? excelMunicipalityData[selectedExcelMunicipality].slice(0, 5)
                            : excelPreview
                          ).map((row, index) => (
                            <tr key={row.id} className="hover:bg-white/30">
                              <td className="px-3 py-2 text-gray-700">{row.date}</td>
                              <td className="px-3 py-2 text-gray-700 font-medium">{row.barangay}</td>
                              <td className="px-3 py-2 text-gray-700">{row.concernType}</td>
                              <td className="px-3 py-2 text-center text-gray-700">{row.week1 || '0'}</td>
                              <td className="px-3 py-2 text-center text-gray-700">{row.week2 || '0'}</td>
                              <td className="px-3 py-2 text-center text-gray-700">{row.week3 || '0'}</td>
                              <td className="px-3 py-2 text-center text-gray-700">{row.week4 || '0'}</td>
                              <td className="px-3 py-2 text-gray-700">{row.status}</td>
                              <td className="px-3 py-2 text-gray-700">{row.remarks}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {selectedExcelMunicipality && excelMunicipalityData[selectedExcelMunicipality] && excelMunicipalityData[selectedExcelMunicipality].length > 5 && (
                      <div className="mt-3 text-center">
                        <span className="text-sm text-gray-600">
                          ... and {excelMunicipalityData[selectedExcelMunicipality].length - 5} more rows for {selectedExcelMunicipality}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="p-4 md:p-6 pt-0">
                <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                  <table className="w-full min-w-[1200px]">
                    <thead>
                      <tr className="bg-white border-b-2 border-gray-300">
                        <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 border-r border-gray-200">DATE</th>
                        <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 border-r border-gray-200">
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
                        <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 border-r border-gray-200">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            ACTION TAKEN
                          </div>
                        </th>
                        <th className="px-4 py-4 text-left text-sm font-bold text-gray-800">
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
                        <th className="px-4 py-3 text-center text-xs font-bold text-white bg-yellow-500 border-r border-gray-200">
                          <div className="font-bold">Week 1</div>
                          <div className="text-xs opacity-90">{selectedMonth} 1-7</div>
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-white bg-green-500 border-r border-gray-200">
                          <div className="font-bold">Week 2</div>
                          <div className="text-xs opacity-90">{selectedMonth} 8-14</div>
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-white bg-blue-500 border-r border-gray-200">
                          <div className="font-bold">Week 3</div>
                          <div className="text-xs opacity-90">{selectedMonth} 15-21</div>
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-white bg-purple-500 border-r border-gray-200">
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
                        
                        return (
                          <React.Fragment key={index}>
                            {dateEntries.length === 0 ? (
                              // Empty row when no entries
                              <tr className={`hover:bg-gray-50 transition-colors duration-200 ${isWeekend ? 'bg-blue-50' : 'bg-white'} border-b border-gray-200`}>
                                <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-white/30">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-3 w-3 text-gray-400" />
                                    {date}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <select 
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
                                      .filter(barangay => 
                                        !activeMunicipalityTab || barangay.municipality === activeMunicipalityTab
                                      )
                                      .map((barangay) => (
                                        <option key={barangay.id} value={`${barangay.name}, ${barangay.municipality}`}>
                                          {barangay.name} ({barangay.municipality})
                                        </option>
                                      ))}
                                  </select>
                                </td>
                                <td className="px-4 py-3">
                                  <select 
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
                                <td className="px-4 py-3">
                                  <input 
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
                                <td className="px-4 py-3">
                                  <input 
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
                                <td className="px-4 py-3">
                                  <input 
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
                                <td className="px-4 py-3">
                                  <input 
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
                                <td className="px-4 py-3">
                                  <input 
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
                                <td className="px-4 py-3">
                                  <input 
                                    type="text" 
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white transition-all duration-200"
                                    placeholder="Add remarks..."
                                    value=""
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        addDateEntry(date);
                                        updateDateData(date, 0, 'remarks', e.target.value);
                                      }
                                    }}
                                  />
                                </td>
                              </tr>
                            ) : (
                              // Render existing entries
                              dateEntries.map((entry, entryIndex) => (
                                <tr key={`${date}-${entryIndex}`} className={`hover:bg-gray-50 transition-colors duration-200 ${isWeekend ? 'bg-blue-50' : 'bg-white'} border-b border-gray-200`}>
                                  {entryIndex === 0 && (
                                    <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-white/30" rowSpan={dateEntries.length}>
                                      <div className="flex items-center gap-2">
                                        <Clock className="h-3 w-3 text-gray-400" />
                                        {date}
                                      </div>
                                    </td>
                                  )}
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <select 
                                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200"
                                        value={entry.barangay}
                                        onChange={(e) => updateDateData(date, entryIndex, 'barangay', e.target.value)}
                                      >
                                        <option value="">Select Barangay</option>
                                        {importedBarangays
                                          .filter(barangay => 
                                            !activeMunicipalityTab || barangay.municipality === activeMunicipalityTab
                                          )
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
                                        <X className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <select 
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
                                  <td className="px-4 py-3">
                                    <input 
                                      type="number" 
                                      min="0"
                                      step="1"
                                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white shadow-sm transition-all duration-200 text-center font-medium"
                                      placeholder="0"
                                      value={entry.week1}
                                      onChange={(e) => updateDateData(date, entryIndex, 'week1', e.target.value)}
                                    />
                                  </td>
                                  <td className="px-4 py-3">
                                    <input 
                                      type="number" 
                                      min="0"
                                      step="1"
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-all duration-200 text-center font-medium"
                                      placeholder="0"
                                      value={entry.week2}
                                      onChange={(e) => updateDateData(date, entryIndex, 'week2', e.target.value)}
                                    />
                                  </td>
                                  <td className="px-4 py-3">
                                    <input 
                                      type="number" 
                                      min="0"
                                      step="1"
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 text-center font-medium"
                                      placeholder="0"
                                      value={entry.week3}
                                      onChange={(e) => updateDateData(date, entryIndex, 'week3', e.target.value)}
                                    />
                                  </td>
                                  <td className="px-4 py-3">
                                    <input 
                                      type="number" 
                                      min="0"
                                      step="1"
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white transition-all duration-200 text-center font-medium"
                                      placeholder="0"
                                      value={entry.week4}
                                      onChange={(e) => updateDateData(date, entryIndex, 'week4', e.target.value)}
                                    />
                                  </td>
                                  <td className="px-4 py-3">
                                    <input 
                                      type="text" 
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-all duration-200"
                                      placeholder="Action taken..."
                                      value={entry.actionTaken}
                                      onChange={(e) => updateDateData(date, entryIndex, 'actionTaken', e.target.value)}
                                    />
                                  </td>
                                  <td className="px-4 py-3">
                                    <input 
                                      type="text" 
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white transition-all duration-200"
                                      placeholder="Add remarks..."
                                      value={entry.remarks}
                                      onChange={(e) => updateDateData(date, entryIndex, 'remarks', e.target.value)}
                                    />
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center transition-colors duration-300 bg-purple-100">
                      <Building2 className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-bold transition-colors duration-300 text-gray-900">Imported Barangays</h3>
                      <p className="text-sm text-gray-600">
                        {importedBarangays.length} barangays imported
                      </p>
                    </div>
                  </div>
                                      {importedBarangays.length > 0 && (
                      <div className="flex gap-2">
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
                          onClick={handleClearBarangays} 
                          className="bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 font-medium py-1 px-3 rounded-md transition-colors duration-200 flex items-center text-sm"
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Clear All
                        </button>
                      </div>
                    )}
                </div>
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
                                      <div className="space-y-2 max-h-96 overflow-y-auto">
                      {importedBarangays.map((barangay) => {
                        const isSelected = selectedBarangays.includes(barangay.id);
                        return (
                          <div 
                            key={barangay.id} 
                            className={`flex items-center justify-between p-3 rounded-lg transition-colors duration-200 ${
                              isSelected 
                                ? 'bg-blue-50 border-2 border-blue-200' 
                                : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => handleBarangaySelection(barangay.id, e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <MapPinIcon className="h-4 w-4 text-blue-500" />
                              <div>
                                <div className="font-medium text-sm">{barangay.name}</div>
                                <div className="text-xs text-gray-600">
                                  {barangay.municipality}, {barangay.district}
                                </div>
                              </div>
                            </div>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                              {new Date(barangay.importedAt).toLocaleDateString()}
                            </span>
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
                      <h3 className="text-lg font-semibold text-gray-900">Edit Barangay</h3>
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Barangay Name</label>
                        <input
                          type="text"
                          value={editingBarangay.name}
                          onChange={(e) => setEditingBarangay({...editingBarangay, name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter barangay name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
                        <select
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Municipality</label>
                        <select
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

        {/* Type of Concern Management Section */}
        {activeTab === "concern-types" && (
          <div className="space-y-6">
            {/* Concern Type Totals Section */}
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
                    {Object.keys(municipalitiesByDistrict).map((district) => {
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
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                      disabled={!selectedDistrict}
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
                      placeholder="Enter concern types separated by commas or new lines&#10;Example:&#10;Security Issue&#10;Traffic Violation&#10;Public Disturbance&#10;Emergency Response&#10;Community Service"
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
                          {importedConcernTypes.length} types imported
                        </p>
                      </div>
                    </div>
                    {importedConcernTypes.length > 0 && (
                      <div className="flex gap-2">
                        <select 
                          value={activeMunicipalityTab}
                          onChange={(e) => handleMunicipalityTabChange(e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        >
                          <option value="">All Municipalities</option>
                          {Object.values(municipalitiesByDistrict).flat().map((municipality) => (
                            <option key={municipality} value={municipality}>{municipality}</option>
                          ))}
                        </select>
                        <button 
                          onClick={handleClearConcernTypes} 
                          className="bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 font-medium py-1 px-3 rounded-md transition-colors duration-200 flex items-center text-sm"
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Clear Data
                        </button>
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
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {importedConcernTypes.map((type) => {
                        const isForCurrentMunicipality = activeMunicipalityTab && 
                          (type.municipality === activeMunicipalityTab || type.municipality === "All Municipalities");
                        return (
                          <div 
                            key={type.id} 
                            className={`flex items-center justify-between p-3 rounded-lg transition-colors duration-200 ${
                              activeMunicipalityTab && isForCurrentMunicipality 
                                ? 'bg-orange-50 border border-orange-200' 
                                : 'bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <AlertTriangle className={`h-4 w-4 ${
                                activeMunicipalityTab && isForCurrentMunicipality 
                                  ? 'text-orange-600' 
                                  : 'text-orange-500'
                              }`} />
                              <div>
                                <div className="font-medium text-sm">{type.name}</div>
                                <div className="text-xs text-gray-600">
                                  {type.municipality}, {type.district}
                                  {activeMunicipalityTab && isForCurrentMunicipality && (
                                    <span className="ml-2 text-orange-600 font-medium">• Available for {activeMunicipalityTab}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                              {new Date(type.importedAt).toLocaleDateString()}
                            </span>
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
    </Layout>
  );
}

import React, { useState, useEffect } from "react";
import Layout from "./Layout";
import { useTheme } from "./ThemeContext";
import { useData } from "./DataContext";
import { useFirebase } from "./hooks/useFirebase";
import { db } from "./firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Badge } from "./components/ui/badge";
import { 
  FileText, 
  Clock, 
  Download, 
  Printer, 
  Filter, 
  Calendar, 
  BarChart3, 
  TrendingUp, 
  Users, 
  MapPin, 
  Activity, 
  AlertTriangle, 
  Shield, 
  Database,
  RefreshCw,
  Eye,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  CalendarRange,
  CalendarCheck,
  CalendarX,
  PieChart,
  LineChart,
  Target,
  Zap,
  Star,
  Award,
  TrendingDown,
  ActivitySquare
} from "lucide-react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function Reports({ onLogout, onNavigate, currentPage }) {
  const { isDarkMode } = useTheme();
  const { dashboardData, loading } = useData();
  const { getActionReports, getIncidents } = useFirebase();
  
  // Report type selection
  const [selectedReportType, setSelectedReportType] = useState('ipatroller');
  const [showFilters, setShowFilters] = useState(false);
  const [showReportTypes, setShowReportTypes] = useState(false);
  
  // Filter states
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedMunicipality, setSelectedMunicipality] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Data states
  const [actionReports, setActionReports] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  
  // Date range
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Report period selection
  const [selectedPeriod, setSelectedPeriod] = useState('summary');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  


  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const municipalitiesByDistrict = {
    "1ST DISTRICT": ["Abucay", "Orani", "Samal", "Hermosa"],
    "2ND DISTRICT": ["Balanga City", "Pilar", "Orion", "Limay"],
    "3RD DISTRICT": ["Bagac", "Dinalupihan", "Mariveles", "Morong"]
  };

  // Function to load IPatroller data directly from Firestore
  const loadIPatrollerData = async (month = null, year = null) => {
    try {
      setReportLoading(true);
      
      // Use provided month/year or current date
      const targetMonth = month !== null ? month : new Date().getMonth();
      const targetYear = year !== null ? year : new Date().getFullYear();
      
      // Create month-year document ID (e.g., "03-2025")
      const monthYearId = `${String(targetMonth + 1).padStart(2, "0")}-${targetYear}`;
      
      // Load data from Firestore
      const municipalitiesRef = collection(db, "patrolData", monthYearId, "municipalities");
      const querySnapshot = await getDocs(municipalitiesRef);
      const patrolData = [];
      
      querySnapshot.forEach((doc) => {
        patrolData.push(doc.data());
      });
      
      // Ensure all municipalities are present
      const completeData = ensureAllMunicipalitiesPresent(patrolData, targetMonth, targetYear);
      return completeData;
    } catch (error) {
      console.error('Error loading IPatroller data:', error);
      return [];
    }
  };

  // Function to ensure all municipalities are present
  const ensureAllMunicipalitiesPresent = (data, month, year) => {
    const completeData = [];
    
    // Generate dates for the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const selectedDates = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    Object.entries(municipalitiesByDistrict).forEach(([district, municipalities]) => {
      municipalities.forEach((municipality) => {
        const existingItem = data.find(
          item => item.municipality === municipality && item.district === district
        );
        
        if (existingItem) {
          // Use existing data
          completeData.push(existingItem);
        } else {
          // Create new entry with 0 counts
          const dailyData = selectedDates.map(() => null);
          completeData.push({
            id: `${district}-${municipality}`,
            municipality,
            district,
            data: dailyData,
            totalPatrols: 0,
            activeDays: 0,
            inactiveDays: 0,
            activePercentage: 0,
            month: month,
            year: year
          });
        }
      });
    });
    
    return completeData;
  };

  // Report period options
  const reportPeriods = [
    { id: 'daily', title: 'Daily Report', icon: CalendarDays, description: '24-hour activity summary', color: 'bg-blue-500' },
    { id: 'weekly', title: 'Weekly Report', icon: CalendarRange, description: '7-day activity summary', color: 'bg-green-500' },
    { id: 'monthly', title: 'Monthly Report', icon: CalendarCheck, description: '30-day activity summary', color: 'bg-purple-500' },
    { id: 'quarterly', title: 'Quarterly Report', icon: CalendarX, description: '3-month activity summary', color: 'bg-orange-500' },
    { id: 'summary', title: 'Summary Report', icon: PieChart, description: 'Comprehensive overview', color: 'bg-indigo-500' }
  ];

  // Load data based on report type
  useEffect(() => {
    loadReportData();
  }, [selectedReportType]);

  // Load IPatroller data when period changes
  useEffect(() => {
    if (selectedReportType === 'ipatroller') {
      loadIPatrollerDataForPeriod();
    }
  }, [selectedPeriod, selectedReportType]);

  // Reload IPatroller data when month/year filters change
  useEffect(() => {
    if (selectedReportType === 'ipatroller' && (selectedMonth !== 'all' || selectedYear !== 'all')) {
      const month = selectedMonth !== 'all' ? months.indexOf(selectedMonth) : new Date().getMonth();
      const year = selectedYear !== 'all' ? parseInt(selectedYear) : new Date().getFullYear();
      loadIPatrollerData(month, year).then(data => {
        setFilteredData(data);
      });
    }
  }, [selectedMonth, selectedYear, selectedReportType]);

  const loadReportData = async () => {
    setReportLoading(true);
    try {
      switch (selectedReportType) {
        case 'ipatroller':
          // Load IPatroller data directly from Firestore
          const ipatrollerData = await loadIPatrollerData();
          setFilteredData(ipatrollerData);
          break;
        case 'actioncenter':
          const actionResult = await getActionReports();
          if (actionResult.success) {
            setActionReports(actionResult.data);
            setFilteredData(actionResult.data);
          }
          break;
        case 'incidents':
          const incidentsResult = await getIncidents();
          if (incidentsResult.success) {
            setIncidents(incidentsResult.data);
            setFilteredData(incidentsResult.data);
          }
          break;
        default:
          setFilteredData([]);
      }
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setReportLoading(false);
    }
  };

  // Apply filters when filters change (but not when filteredData changes)
  useEffect(() => {
    // Only apply filters if we have source data
    const hasSourceData = (selectedReportType === 'ipatroller' && filteredData.length > 0) ||
                         (selectedReportType === 'actioncenter' && actionReports.length > 0) ||
                         (selectedReportType === 'incidents' && incidents.length > 0);
    
    if (hasSourceData) {
      applyFilters();
    }
  }, [selectedMonth, selectedYear, selectedDistrict, selectedMunicipality, selectedDepartment, searchTerm, startDate, endDate, selectedReportType]);

  const applyFilters = () => {
    // Get the source data based on report type
    let sourceData = [];
    switch (selectedReportType) {
      case 'ipatroller':
        sourceData = filteredData;
        break;
      case 'actioncenter':
        sourceData = actionReports;
        break;
      case 'incidents':
        sourceData = incidents;
        break;
      default:
        sourceData = [];
    }
    
    // If no source data, don't filter
    if (!sourceData || sourceData.length === 0) {
      setFilteredData([]);
      return;
    }
    
    let filtered = [...sourceData];

    // Filter by month and year
    if (selectedMonth !== 'all' || selectedYear !== 'all') {
      filtered = filtered.filter(item => {
        if (selectedReportType === 'ipatroller') {
          // For IPatroller data, use the month and year from the data
          const itemMonth = item.month !== undefined ? item.month : new Date().getMonth();
          const itemYear = item.year !== undefined ? item.year : new Date().getFullYear();
          
          if (selectedMonth !== 'all' && months.indexOf(selectedMonth) !== itemMonth) return false;
          if (selectedYear !== 'all' && parseInt(selectedYear) !== itemYear) return false;
          return true;
        } else {
          // For Action Center, use the exact same date logic as ActionCenter page
          const toDate = (when) => {
            if (when && typeof when === 'object' && 'seconds' in when) {
              return new Date(when.seconds * 1000);
            }
            if (when instanceof Date) return when;
            if (typeof when === 'string' && when.trim()) {
              const d = new Date(when);
              return isNaN(d.getTime()) ? null : d;
            }
            return null;
          };
          const d = toDate(item.when);
          return selectedMonth === 'all' || selectedYear === 'all' || 
            (d ? (d.getMonth() === months.indexOf(selectedMonth) && d.getFullYear() === parseInt(selectedYear)) : false);
        }
      });
    }

    // Filter by district
    if (selectedDistrict !== 'all') {
      filtered = filtered.filter(item => item.district === selectedDistrict);
    }

    // Filter by municipality
    if (selectedMunicipality !== 'all') {
      filtered = filtered.filter(item => item.municipality === selectedMunicipality);
    }

    // Filter by department (for action center)
    if (selectedDepartment !== 'all' && selectedReportType === 'actioncenter') {
      filtered = filtered.filter(item => item.department === selectedDepartment);
    }

    // Filter by date range
    if (startDate && endDate) {
      filtered = filtered.filter(item => {
        if (selectedReportType === 'ipatroller') {
          // For IPatroller data, check if the month/year falls within the date range
          const itemMonth = item.month !== undefined ? item.month : new Date().getMonth();
          const itemYear = item.year !== undefined ? item.year : new Date().getFullYear();
          const itemDate = new Date(itemYear, itemMonth, 1);
          const start = new Date(startDate);
          const end = new Date(endDate);
          return itemDate >= start && itemDate <= end;
        } else {
          // For Action Center, use the exact same date logic as ActionCenter page
          const toDate = (when) => {
            if (when && typeof when === 'object' && 'seconds' in when) {
              return new Date(when.seconds * 1000);
            }
            if (when instanceof Date) return when;
            if (typeof when === 'string' && when.trim()) {
              const d = new Date(when);
              return isNaN(d.getTime()) ? null : d;
            }
            return null;
          };
          const d = toDate(item.when);
          if (!d) return false;
          
          const start = new Date(startDate);
          const end = new Date(endDate);
          return d >= start && d <= end;
        }
      });
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item => {
        if (selectedReportType === 'ipatroller') {
          // For IPatroller data, search in municipality and district fields
          const searchFields = [
            item.municipality || '',
            item.district || '',
            String(item.totalPatrols || 0),
            String(item.activeDays || 0),
            String(item.activePercentage || 0)
          ].join(' ').toLowerCase();
          return searchFields.includes(searchTerm.toLowerCase());
        } else {
          // For Action Center, use the exact same search logic as ActionCenter page
          const st = String(searchTerm || "").trim().toLowerCase();
          const includes = (v) => String(v ?? "").toLowerCase().includes(st);
          return st === "" ||
            includes(item.municipality) ||
            includes(item.district) ||
            includes(item.what) ||
            includes(item.who) ||
            includes(item.where) ||
            includes(item.why) ||
            includes(item.how) ||
            includes(item.source) ||
            includes(item.actionTaken) ||
            includes(item.otherInfo);
        }
      });
    }

    // Update filtered data
    setFilteredData(filtered);
  };

  // Get date range based on selected period
  const getDateRangeForPeriod = () => {
    const now = new Date();
    const start = new Date();
    const end = new Date();

    switch (selectedPeriod) {
      case 'daily':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'monthly':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        start.setMonth(quarter * 3, 1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(start.getMonth() + 3, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'summary':
        start.setFullYear(now.getFullYear(), 0, 1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      default:
        return { start: null, end: null };
    }

    return { start, end };
  };

  // Function to load IPatroller data for specific period
  const loadIPatrollerDataForPeriod = async () => {
    if (selectedReportType !== 'ipatroller') return;
    
    try {
      setReportLoading(true);
      const { start, end } = getDateRangeForPeriod();
      let allData = [];
      
      // For IPatroller, we need to load data for each month in the period
      if (selectedPeriod === 'summary') {
        // Load data for the entire year
        for (let month = 0; month < 12; month++) {
          const monthData = await loadIPatrollerData(month, start.getFullYear());
          allData = allData.concat(monthData);
        }
      } else if (selectedPeriod === 'quarterly') {
        // Load data for the 3 months in the quarter
        const quarterStart = Math.floor(start.getMonth() / 3) * 3;
        for (let month = quarterStart; month < quarterStart + 3; month++) {
          const monthData = await loadIPatrollerData(month, start.getFullYear());
          allData = allData.concat(monthData);
        }
      } else if (selectedPeriod === 'monthly') {
        // Load data for the specific month
        allData = await loadIPatrollerData(start.getMonth(), start.getFullYear());
      } else {
        // For daily/weekly, load current month data
        allData = await loadIPatrollerData(start.getMonth(), start.getFullYear());
      }
      
      setFilteredData(allData);
    } catch (error) {
      console.error('Error loading IPatroller data for period:', error);
    } finally {
      setReportLoading(false);
    }
  };

  // Generate PDF Report
  const generatePDFReport = async () => {
    try {
      // Validate data availability
      if (!filteredData || filteredData.length === 0) {
        alert('No data available to export. Please check your filters or load data first.');
        return;
      }
      
      // Show loading state
      const button = document.querySelector('[onclick="generatePDFReport()"]');
      if (button) {
        button.disabled = true;
        button.innerHTML = '<RefreshCw className="w-4 h-4 animate-spin" /> Generating PDF...';
      }
      
      const doc = new jsPDF();
      const { start, end } = getDateRangeForPeriod();
    
    // Add title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(`${getReportTypeTitle()} - ${getPeriodTitle()} Report`, 14, 22);
    
    // Add report details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 35);
    doc.text(`Period: ${getPeriodTitle()}`, 14, 42);
    if (start && end) {
      doc.text(`Date Range: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`, 14, 49);
    }
    doc.text(`Month: ${selectedMonth === 'all' ? 'All Months' : selectedMonth}`, 14, 56);
    doc.text(`Year: ${selectedYear === 'all' ? 'All Years' : selectedYear}`, 14, 63);
    doc.text(`District: ${selectedDistrict === 'all' ? 'All Districts' : selectedDistrict}`, 14, 70);
    doc.text(`Municipality: ${selectedMunicipality === 'all' ? 'All Municipalities' : selectedMunicipality}`, 14, 77);
    
    // Add summary statistics
    const summaryStats = getSummaryStatistics();
    let yPosition = 85;
    
    Object.entries(summaryStats).forEach(([key, value]) => {
      doc.text(`${key}: ${value}`, 14, yPosition);
      yPosition += 7;
    });

    // Add department breakdown for Action Center
    if (selectedReportType === 'actioncenter') {
      yPosition += 10;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Department Breakdown:', 14, yPosition);
      yPosition += 10;
      
      const deptData = getDepartmentData();
      Object.entries(deptData).forEach(([dept, stats]) => {
        const deptLabels = {
          'pnp': 'PNP',
          'agriculture': 'Agriculture / Bantay Dagat',
          'pg-enro': 'PG-ENRO / Agriculture'
        };
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${deptLabels[dept]}:`, 14, yPosition);
        yPosition += 7;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`  Total Reports: ${stats.totalReports}`, 20, yPosition);
        yPosition += 5;
        doc.text(`  Action Taken: ${stats.resolvedActions}`, 20, yPosition);
        yPosition += 5;
        doc.text(`  Pending: ${stats.pendingActions}`, 20, yPosition);
        yPosition += 5;
        doc.text(`  Average: ${stats.resolutionRate}%`, 20, yPosition);
        yPosition += 5;
        doc.text(`  Photos: ${stats.totalPhotos}`, 20, yPosition);
        yPosition += 5;
        doc.text(`  Municipalities: ${stats.municipalities.join(', ') || 'None'}`, 20, yPosition);
        yPosition += 5;
        doc.text(`  Districts: ${stats.districts.join(', ') || 'None'}`, 20, yPosition);
        yPosition += 10;
      });
    }
    
    // Add table data
    const tableData = getTableData();
    const tableHeaders = getTableHeaders();
    
    if (tableData.length > 0) {
      console.log('Table data available:', tableData.length, 'rows');
      console.log('AutoTable available:', typeof autoTable);
      
      try {
        // Use the imported autoTable function
        if (typeof autoTable === 'function') {
          autoTable(doc, {
            head: [tableHeaders],
            body: tableData,
            startY: yPosition + 10,
            styles: {
              fontSize: 8,
              cellPadding: 2
            },
            headStyles: {
              fillColor: [59, 130, 246],
              textColor: 255,
              fontStyle: 'bold'
            },
            alternateRowStyles: {
              fillColor: [248, 250, 252]
            },
            margin: { top: yPosition + 10 }
          });
        } else {
          throw new Error('AutoTable function not available');
        }
      } catch (autoTableError) {
        console.warn('AutoTable failed, adding table as text:', autoTableError);
        // Fallback: add table data as simple text
        let tableY = yPosition + 10;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Table Data:', 14, tableY);
        tableY += 10;
        
        // Add headers
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        const headerText = tableHeaders.join(' | ');
        doc.text(headerText, 14, tableY);
        tableY += 8;
        
        // Add data rows
        doc.setFont('helvetica', 'normal');
        tableData.slice(0, 20).forEach((row, index) => { // Limit to 20 rows to avoid overflow
          const rowText = row.join(' | ');
          doc.text(rowText, 14, tableY);
          tableY += 6;
        });
        
        if (tableData.length > 20) {
          doc.text(`... and ${tableData.length - 20} more rows`, 14, tableY);
        }
      }
    }
    
    // Save the PDF
    const periodSuffix = selectedPeriod !== 'summary' ? `-${selectedPeriod}` : '';
    doc.save(`${selectedReportType}${periodSuffix}-report-${new Date().toISOString().split('T')[0]}.pdf`);
    
    // Show success message
    console.log('PDF generated successfully');
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Error generating PDF. Please try again.');
  } finally {
    // Reset button state
    const button = document.querySelector('[onclick="generatePDFReport()"]');
    if (button) {
      button.disabled = false;
      button.innerHTML = '<FileText className="w-4 h-4" /> Export PDF';
    }
  }
  };

  // Generate Excel Report
  const generateExcelReport = async () => {
    try {
      // Validate data availability
      if (!filteredData || filteredData.length === 0) {
        alert('No data available to export. Please check your filters or load data first.');
        return;
      }
      
      // Show loading state
      const button = document.querySelector('[onclick="generateExcelReport()"]');
      if (button) {
        button.disabled = true;
        button.innerHTML = '<RefreshCw className="w-4 h-4 animate-spin" /> Generating Excel...';
      }
      
      const tableData = getTableData();
      const tableHeaders = getTableHeaders();
      const { start, end } = getDateRangeForPeriod();
    
    const ws = XLSX.utils.aoa_to_sheet([tableHeaders, ...tableData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report Data');
    
    // Add summary sheet
    const summaryStats = getSummaryStatistics();
    const summaryData = [
      ['Report Information'],
      ['Report Type', getReportTypeTitle()],
      ['Period', getPeriodTitle()],
      ['Generated Date', new Date().toLocaleDateString()],
      [''],
      ['Summary Statistics']
    ];
    
    if (start && end) {
      summaryData.push(['Date Range', `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`]);
    }
    
    Object.entries(summaryStats).forEach(([key, value]) => {
      summaryData.push([key, value]);
    });
    
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
    
    // Add charts sheet
    const chartsData = generateChartsData();
    const chartsWs = XLSX.utils.aoa_to_sheet(chartsData);
    XLSX.utils.book_append_sheet(wb, chartsWs, 'Charts Data');

    // Add department breakdown sheet for Action Center
    if (selectedReportType === 'actioncenter') {
      const deptData = getDepartmentData();
      const deptBreakdownData = [
        ['Department Breakdown'],
        ['Department', 'Total Reports', 'Action Taken', 'Pending', 'Average', 'Photos', 'Municipalities', 'Districts']
      ];
      
      Object.entries(deptData).forEach(([dept, stats]) => {
        const deptLabels = {
          'pnp': 'PNP',
          'agriculture': 'Agriculture / Bantay Dagat',
          'pg-enro': 'PG-ENRO / Agriculture'
        };
        
        deptBreakdownData.push([
          deptLabels[dept],
          stats.totalReports,
          stats.resolvedActions,
          stats.pendingActions,
          stats.resolutionRate + '%',
          stats.totalPhotos,
          stats.municipalities.join(', ') || 'None',
          stats.districts.join(', ') || 'None'
        ]);
      });
      
      const deptWs = XLSX.utils.aoa_to_sheet(deptBreakdownData);
      XLSX.utils.book_append_sheet(wb, deptWs, 'Department Breakdown');
    }
    
    const periodSuffix = selectedPeriod !== 'summary' ? `-${selectedPeriod}` : '';
    XLSX.writeFile(wb, `${selectedReportType}${periodSuffix}-report-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    // Show success message
    console.log('Excel file generated successfully');
  } catch (error) {
    console.error('Error generating Excel file:', error);
    alert('Error generating Excel file. Please try again.');
  } finally {
    // Reset button state
    const button = document.querySelector('[onclick="generateExcelReport()"]');
    if (button) {
      button.disabled = false;
      button.innerHTML = '<Database className="w-4 h-4" /> Export Excel';
    }
  }
  };

  // Generate charts data for Excel
  const generateChartsData = () => {
    const data = [];
    
    switch (selectedReportType) {
      case 'ipatroller':
        data.push(['Municipality', 'Total Patrols', 'Active Days', 'Active Percentage']);
        filteredData.forEach(item => {
          data.push([
            item.municipality || 'N/A',
            item.totalPatrols || 0,
            item.activeDays || 0,
            (item.activePercentage || 0) + '%'
          ]);
        });
        break;
      case 'actioncenter':
        data.push(['Department', 'Municipality', 'District', 'Action Taken', 'Status']);
        filteredData.forEach(item => {
          data.push([
            item.department || 'N/A',
            item.municipality || 'N/A',
            item.district || 'N/A',
            item.actionTaken || 'N/A',
            item.status || 'N/A'
          ]);
        });
        
        // Add department summary data
        data.push(['']);
        data.push(['Department Summary']);
        data.push(['Department', 'Total Reports', 'Action Taken', 'Pending', 'Average']);
        
        const deptData = getDepartmentData();
        Object.entries(deptData).forEach(([dept, stats]) => {
          const deptLabels = {
            'pnp': 'PNP',
            'agriculture': 'Agriculture / Bantay Dagat',
            'pg-enro': 'PG-ENRO / Agriculture'
          };
          
          data.push([
            deptLabels[dept],
            stats.totalReports,
            stats.resolvedActions,
            stats.pendingActions,
            stats.resolutionRate + '%'
          ]);
        });
        break;
      case 'incidents':
        data.push(['Type', 'Municipality', 'District', 'Priority', 'Status']);
        filteredData.forEach(item => {
          data.push([
            item.type || 'N/A',
            item.municipality || 'N/A',
            item.district || 'N/A',
            item.priority || 'N/A',
            item.status || 'N/A'
          ]);
        });
        break;
    }
    
    return data;
  };

  // Get period title
  const getPeriodTitle = () => {
    switch (selectedPeriod) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'quarterly': return 'Quarterly';
      case 'summary': return 'Summary';
      default: return 'Summary';
    }
  };

  // Get report type title
  const getReportTypeTitle = () => {
    switch (selectedReportType) {
      case 'ipatroller': return 'IPatroller';
      case 'actioncenter': return 'Action Center';
      case 'incidents': return 'Incidents';
      default: return 'General';
    }
  };

  // Get summary statistics
  const getSummaryStatistics = () => {
    if (selectedReportType === 'ipatroller') {
      // For IPatroller, use filteredData directly since it's already filtered by period
      const periodData = filteredData;
      return {
        'Total Municipalities': periodData.length,
        'Total Patrols': periodData.reduce((sum, item) => sum + (item.totalPatrols || 0), 0),
        'Active Days': periodData.reduce((sum, item) => sum + (item.activeDays || 0), 0),
        'Average Active Percentage': periodData.length > 0 
          ? Math.round(periodData.reduce((sum, item) => sum + (item.activePercentage || 0), 0) / periodData.length) + '%'
          : '0%',
        'Period': getPeriodTitle(),
        'Data Points': periodData.length
      };
    }

    // For other report types, apply period filtering
    const { start, end } = getDateRangeForPeriod();
    let periodData = filteredData;

    // Filter data by period if not summary
    if (selectedPeriod !== 'summary' && start && end) {
      periodData = filteredData.filter(item => {
        // Use the exact same date logic as ActionCenter page
        const toDate = (when) => {
          if (when && typeof when === 'object' && 'seconds' in when) {
            return new Date(when.seconds * 1000);
          }
          if (when instanceof Date) return when;
          if (typeof when === 'string' && when.trim()) {
            const d = new Date(when);
            return isNaN(d.getTime()) ? null : d;
          }
          return null;
        };
        const d = toDate(item.when);
        if (!d) return false;
        
        return d >= start && d <= end;
      });
    }

    switch (selectedReportType) {
      case 'actioncenter':
        // Enhanced logic to count all items that have been acted upon
        const normalize = (value) => String(value ?? '').trim().toLowerCase();
        
        // Count items that have been acted upon (not just resolved)
        const hasActionTaken = (item) => {
          // Check if any action has been taken
          const hasStatus = item.status && normalize(item.status) !== '' && normalize(item.status) !== 'pending' && normalize(item.status) !== 'n/a';
          const hasActionTaken = item.actionTaken && normalize(item.actionTaken) !== '' && normalize(item.actionTaken) !== 'pending' && normalize(item.actionTaken) !== 'n/a';
          const hasOtherInfo = item.otherInfo && normalize(item.otherInfo) !== '' && normalize(item.otherInfo) !== 'n/a';
          
          return hasStatus || hasActionTaken || hasOtherInfo;
        };
        
        const isResolved = (item) => normalize(item.status) === 'resolved' || normalize(item.actionTaken) === 'resolved';
        const isPending = (item) => !hasActionTaken(item);
        
        const actionTakenCount = periodData.filter(hasActionTaken).length;
        const pendingCount = periodData.filter(isPending).length;
        
        // Department-specific statistics
        const pnpCount = periodData.filter(item => item.department === 'pnp').length;
        const agricultureCount = periodData.filter(item => item.department === 'agriculture').length;
        const pgenroCount = periodData.filter(item => item.department === 'pgenro').length;
        
        return {
          'Total Reports': periodData.length,
          'PNP Reports': pnpCount,
          'Agriculture/Bantay Dagat': agricultureCount,
          'PG-ENRO/Agriculture': pgenroCount,
          'Action Taken': actionTakenCount,
          'Pending Actions': pendingCount,
          'Average': periodData.length > 0 ? Math.round((actionTakenCount / periodData.length) * 100) + '%' : '0%',
          'Total Photos': periodData.reduce((sum, item) => sum + (item.photos?.length || 0), 0),
          'Period': getPeriodTitle(),
          'Data Points': periodData.length
        };
      case 'incidents':
        const highPriority = periodData.filter(item => item.priority === 'high').length;
        const mediumPriority = periodData.filter(item => item.priority === 'medium').length;
        const lowPriority = periodData.filter(item => item.priority === 'low').length;
        return {
          'Total Incidents': periodData.length,
          'High Priority': highPriority,
          'Medium Priority': mediumPriority,
          'Low Priority': lowPriority,
          'High Priority Rate': periodData.length > 0 ? Math.round((highPriority / periodData.length) * 100) + '%' : '0%',
          'Period': getPeriodTitle(),
          'Data Points': periodData.length
        };
      default:
        return {};
    }
  };

  // Get table headers
  const getTableHeaders = () => {
    switch (selectedReportType) {
      case 'ipatroller':
        return ['Municipality', 'District', 'Total Patrols', 'Active Days', 'Inactive Days', 'Active %'];
      case 'actioncenter':
        return ['Department', 'Municipality', 'District', 'What', 'When', 'Where', 'Action Taken', 'Status'];
      case 'incidents':
        return ['Type', 'Municipality', 'District', 'Description', 'Priority', 'Status', 'Date', 'Location'];
      default:
        return [];
    }
  };

  // Get department-specific data for Action Center
  const getDepartmentData = () => {
    if (selectedReportType !== 'actioncenter') return {};
    
    const { start, end } = getDateRangeForPeriod();
    let periodData = filteredData;

    // Filter data by period if not summary
    if (selectedPeriod !== 'summary' && start && end) {
      periodData = filteredData.filter(item => {
        // Use the exact same date logic as ActionCenter page
        const toDate = (when) => {
          if (when && typeof when === 'object' && 'seconds' in when) {
            return new Date(when.seconds * 1000);
          }
          if (when instanceof Date) return when;
          if (typeof when === 'string' && when.trim()) {
            const d = new Date(when);
            return isNaN(d.getTime()) ? null : d;
          }
          return null;
        };
        const d = toDate(item.when);
        if (!d) return false;
        
        return d >= start && d <= end;
      });
    }

    // Group by department
    const departmentData = {
      pnp: periodData.filter(item => item.department === 'pnp'),
      agriculture: periodData.filter(item => item.department === 'agriculture'),
      'pgenro': periodData.filter(item => item.department === 'pgenro')
    };

    // Calculate statistics for each department
    const stats = {};
    Object.entries(departmentData).forEach(([dept, data]) => {
      // Enhanced logic to count all items that have been acted upon
      const normalize = (value) => String(value ?? '').trim().toLowerCase();
      
      // Count items that have been acted upon (not just resolved)
      const hasActionTaken = (item) => {
        // Check if any action has been taken
        const hasStatus = item.status && normalize(item.status) !== '' && normalize(item.status) !== 'pending' && normalize(item.status) !== 'n/a';
        const hasActionTaken = item.actionTaken && normalize(item.actionTaken) !== '' && normalize(item.actionTaken) !== 'pending' && normalize(item.actionTaken) !== 'n/a';
        const hasOtherInfo = item.otherInfo && normalize(item.otherInfo) !== '' && normalize(item.otherInfo) !== 'n/a';
        
        return hasStatus || hasActionTaken || hasOtherInfo;
      };
      
      const isResolved = (item) => normalize(item.status) === 'resolved' || normalize(item.actionTaken) === 'resolved';
      const isPending = (item) => !hasActionTaken(item);
      
      const actionTakenCount = data.filter(hasActionTaken).length;
      const pendingCount = data.filter(isPending).length;
      const totalPhotos = data.reduce((sum, item) => sum + (item.photos?.length || 0), 0);
      
      stats[dept] = {
        totalReports: data.length,
        resolvedActions: actionTakenCount,
        pendingActions: pendingCount,
        resolutionRate: data.length > 0 ? Math.round((actionTakenCount / data.length) * 100) : 0,
        totalPhotos: totalPhotos,
        municipalities: [...new Set(data.map(item => item.municipality))],
        districts: [...new Set(data.map(item => item.district))]
      };
    });

    return stats;
  };

  // Get table data
  const getTableData = () => {
    if (selectedReportType === 'ipatroller') {
      // For IPatroller, use filteredData directly since it's already filtered by period
      return filteredData.map(item => [
        item.municipality || 'N/A',
        item.district || 'N/A',
        item.totalPatrols || 0,
        item.activeDays || 0,
        item.inactiveDays || 0,
        (item.activePercentage || 0) + '%'
      ]);
    }

    // For other report types, apply period filtering
    const { start, end } = getDateRangeForPeriod();
    let periodData = filteredData;

    // Filter data by period if not summary
    if (selectedPeriod !== 'summary' && start && end) {
      periodData = filteredData.filter(item => {
        // Use the exact same date logic as ActionCenter page
        const toDate = (when) => {
          if (when && typeof when === 'object' && 'seconds' in when) {
            return new Date(when.seconds * 1000);
          }
          if (when instanceof Date) return when;
          if (typeof when === 'string' && when.trim()) {
            const d = new Date(when);
            return isNaN(d.getTime()) ? null : d;
          }
          return null;
        };
        const d = toDate(item.when);
        if (!d) return false;
        
        return d >= start && d <= end;
      });
    }

    return periodData.map(item => {
      switch (selectedReportType) {
        case 'actioncenter':
          return [
            item.department || 'N/A',
            item.municipality || 'N/A',
            item.district || 'N/A',
            item.what || 'N/A',
            item.when ? new Date(item.when.seconds * 1000).toLocaleDateString() : 'N/A',
            item.where || 'N/A',
            item.actionTaken || 'N/A',
            item.status || 'N/A'
          ];
        case 'incidents':
          return [
            item.type || 'N/A',
            item.municipality || 'N/A',
            item.district || 'N/A',
            item.description || 'N/A',
            item.priority || 'N/A',
            item.status || 'N/A',
            item.date ? new Date(item.date.seconds * 1000).toLocaleDateString() : 'N/A',
            item.location || 'N/A'
          ];
        default:
          return [];
      }
    });
  };

  // Print report
  const handlePrint = async () => {
    try {
      // Show loading state
      const button = document.querySelector('[onclick="handlePrint()"]');
      if (button) {
        button.disabled = true;
        button.innerHTML = '<RefreshCw className="w-4 h-4 animate-spin" /> Preparing Print...';
      }
      
      // Add print-specific styles
      const style = document.createElement('style');
      style.id = 'print-styles';
      style.textContent = `
        @media print {
          body * { visibility: hidden; }
          .print-content, .print-content * { visibility: visible; }
          .print-content { position: absolute; left: 0; top: 0; }
        }
      `;
      document.head.appendChild(style);
      
      // Trigger print
      window.print();
      
      // Remove print styles after printing
      setTimeout(() => {
        const printStyle = document.getElementById('print-styles');
        if (printStyle) {
          printStyle.remove();
        }
      }, 1000);
      
      console.log('Print dialog opened successfully');
    } catch (error) {
      console.error('Error opening print dialog:', error);
      alert('Error opening print dialog. Please try again.');
    } finally {
      // Reset button state
      const button = document.querySelector('[onclick="handlePrint()"]');
      if (button) {
        button.disabled = false;
        button.innerHTML = '<Printer className="w-4 h-4" /> Print Report';
      }
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSelectedMonth('all');
    setSelectedYear('all');
    setSelectedDistrict('all');
    setSelectedMunicipality('all');
    setSelectedDepartment('all');
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setSelectedPeriod('summary');
    setCustomStartDate('');
    setCustomEndDate('');
    
    // Reload IPatroller data if that's the current report type
    if (selectedReportType === 'ipatroller') {
      loadIPatrollerDataForPeriod();
    }
  };

  return (
    <Layout onLogout={onLogout} onNavigate={currentPage}>
      <div className="flex-1 p-6 space-y-6 print-content">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Reports & Analytics
            </h1>
            <p className={`text-lg transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Generate comprehensive reports for IPatroller, Action Center, and Incidents
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowReportTypes(!showReportTypes)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              {showReportTypes ? 'Hide Report Types' : 'Show Report Types'}
            </Button>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            <Button
              onClick={loadReportData}
              disabled={reportLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${reportLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Report Period Selection */}
        {showReportTypes && (
          <Card className={isDarkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Report Period Selection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {reportPeriods.map((period) => (
                  <Card
                    key={period.id}
                    className={`cursor-pointer transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${
                      selectedPeriod === period.id
                        ? isDarkMode 
                          ? 'bg-blue-900/80 border-blue-600' 
                          : 'bg-blue-50 border-blue-300'
                        : isDarkMode 
                          ? 'bg-gray-800/80 border-gray-700 hover:bg-blue-900/20' 
                          : 'bg-white border-gray-200 hover:bg-blue-50'
                    }`}
                    onClick={() => setSelectedPeriod(period.id)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className={`p-3 rounded-lg mx-auto mb-3 w-12 h-12 flex items-center justify-center ${period.color} text-white`}>
                        <period.icon className="h-6 w-6" />
                      </div>
                      <h3 className={`font-bold text-sm transition-colors duration-300 ${
                        selectedPeriod === period.id 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : isDarkMode ? 'text-gray-300' : 'text-gray-900'
                      }`}>
                        {period.title}
                      </h3>
                      <p className={`text-xs transition-colors duration-300 ${
                        selectedPeriod === period.id 
                          ? 'text-blue-500 dark:text-blue-300' 
                          : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {period.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Custom Date Range for non-summary periods */}
              {selectedPeriod !== 'summary' && (
                <div className="mt-6 p-4 border rounded-lg">
                  <h4 className="font-semibold mb-3">Custom Date Range</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Start Date</label>
                      <Input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">End Date</label>
                      <Input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Report Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { id: 'ipatroller', title: 'IPatroller', icon: Shield, description: 'Patrol data and municipality statistics' },
            { id: 'actioncenter', title: 'Action Center', icon: Activity, description: 'Action reports and response tracking' },
            { id: 'incidents', title: 'Incidents', icon: AlertTriangle, description: 'Incident reports and priority analysis' }
          ].map((type) => (
            <Card
              key={type.id}
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${
                selectedReportType === type.id
                  ? isDarkMode 
                    ? 'bg-blue-900/80 border-blue-600' 
                    : 'bg-blue-50 border-blue-300'
                  : isDarkMode 
                    ? 'bg-gray-800/80 border-gray-700 hover:bg-blue-900/20' 
                    : 'bg-white border-gray-200 hover:bg-blue-50'
              }`}
              onClick={() => setSelectedReportType(type.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${
                    selectedReportType === type.id 
                      ? 'bg-blue-600 text-white' 
                      : isDarkMode ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-100 text-blue-600'
                  }`}>
                    <type.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg transition-colors duration-300 ${
                      selectedPeriod === type.id 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : isDarkMode ? 'text-gray-300' : 'text-gray-900'
                    }`}>
                      {type.title}
                    </h3>
                    <p className={`text-sm transition-colors duration-300 ${
                      selectedPeriod === type.id 
                        ? 'text-blue-500 dark:text-blue-300' 
                        : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {type.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        {showFilters && (
          <Card className={isDarkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Month Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">Month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className={`w-full p-2 rounded-md border transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="all">All Months</option>
                    {months.map((month, index) => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                </div>

                {/* Year Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className={`w-full p-2 rounded-md border transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="all">All Years</option>
                    {[2024, 2025, 2026].map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                {/* District Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">District</label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className={`w-full p-2 rounded-md border transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="all">All Districts</option>
                    {Object.keys(municipalitiesByDistrict).map(district => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                </div>

                {/* Municipality Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">Municipality</label>
                  <select
                    value={selectedMunicipality}
                    onChange={(e) => setSelectedMunicipality(e.target.value)}
                    className={`w-full p-2 rounded-md border transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="all">All Municipalities</option>
                    {selectedDistrict !== 'all' 
                      ? municipalitiesByDistrict[selectedDistrict]?.map(municipality => (
                          <option key={municipality} value={municipality}>{municipality}</option>
                        ))
                      : Object.values(municipalitiesByDistrict).flat().map(municipality => (
                          <option key={municipality} value={municipality}>{municipality}</option>
                        ))
                    }
                  </select>
                </div>
              </div>

              {/* Department Filter (Action Center only) */}
              {selectedReportType === 'actioncenter' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Department</label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className={`w-full p-2 rounded-md border transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="all">All Departments</option>
                    <option value="pnp">PNP</option>
                    <option value="agriculture">Agriculture / Bantay Dagat</option>
                    <option value="pgenro">PG-ENRO / Agriculture</option>
                  </select>
                </div>
              )}

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Date</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                  />
                </div>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search in reports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`pl-10 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                  />
                </div>
              </div>

              {/* Clear Filters */}
              <div className="flex justify-end">
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(getSummaryStatistics()).map(([key, value]) => (
            <Card key={key} className={isDarkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {key}
                    </p>
                    <p className={`text-2xl font-bold transition-colors duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${
                    isDarkMode ? 'bg-blue-900/40' : 'bg-blue-100'
                  }`}>
                    <BarChart3 className={`w-6 h-6 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Department Breakdown for Action Center */}
        {selectedReportType === 'actioncenter' && selectedDepartment === 'all' && (
          <Card className={isDarkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Department Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(getDepartmentData()).map(([dept, stats]) => {
                  const deptLabels = {
                    'pnp': 'PNP',
                    'agriculture': 'Agriculture / Bantay Dagat',
                    'pgenro': 'PG-ENRO / Agriculture'
                  };
                  
                  return (
                    <div key={dept} className={`p-4 rounded-lg border ${
                      isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <h4 className={`font-semibold text-lg mb-3 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {deptLabels[dept]}
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Total Reports:</span>
                          <span className="font-semibold">{stats.totalReports}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Action Taken:</span>
                          <span className="text-green-600 font-semibold">{stats.resolvedActions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Pending:</span>
                          <span className="text-orange-600 font-semibold">{stats.pendingActions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Average:</span>
                          <span className="font-semibold">{stats.resolutionRate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Photos:</span>
                          <span className="font-semibold">{stats.totalPhotos}</span>
                        </div>
                        <div className="pt-2 border-t border-gray-300 dark:border-gray-600">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            <div>Municipalities: {stats.municipalities.join(', ') || 'None'}</div>
                            <div>Districts: {stats.districts.join(', ') || 'None'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Department-Specific Summary for Action Center */}
        {selectedReportType === 'actioncenter' && selectedDepartment !== 'all' && (
          <Card className={isDarkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                {selectedDepartment === 'pnp' ? 'PNP' : 
                 selectedDepartment === 'agriculture' ? 'Agriculture / Bantay Dagat' : 
                 'PG-ENRO / Agriculture'} Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(() => {
                  const deptData = getDepartmentData();
                  const stats = deptData[selectedDepartment] || {};
                  
                  return [
                    { label: 'Total Reports', value: stats.totalReports || 0, color: 'text-blue-600' },
                    { label: 'Action Taken', value: stats.resolvedActions || 0, color: 'text-green-600' },
                    { label: 'Pending Actions', value: stats.pendingActions || 0, color: 'text-orange-600' },
                    { label: 'Average', value: (stats.resolutionRate || 0) + '%', color: 'text-purple-600' }
                  ].map((item, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${
                      isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="text-center">
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {item.label}
                        </p>
                        <p className={`text-2xl font-bold ${item.color}`}>
                          {item.value}
                        </p>
                      </div>
                    </div>
                  ));
                })()}
              </div>
              
              {/* Additional details */}
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Coverage Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Municipalities: </span>
                    <span className="font-medium">
                      {(() => {
                        const deptData = getDepartmentData();
                        const stats = deptData[selectedDepartment] || {};
                        return stats.municipalities?.join(', ') || 'None';
                      })()}
                    </span>
                  </div>
                  <div>
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Districts: </span>
                    <span className="font-medium">
                      {(() => {
                        const deptData = getDepartmentData();
                        const stats = deptData[selectedDepartment] || {};
                        return stats.districts?.join(', ') || 'None';
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Export Options */}
        <Card className={isDarkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Options - {getPeriodTitle()} Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* PDF Export */}
              <div className="text-center">
                <Button
                  onClick={generatePDFReport}
                  className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 w-full mb-3"
                >
                  <FileText className="w-4 h-4" />
                  Export PDF
                </Button>
                <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <p className="font-medium mb-1">Professional PDF Report</p>
                  <p>Download a formatted PDF with all report data, statistics, and department breakdowns. Perfect for official documentation and presentations.</p>
                </div>
              </div>

              {/* Excel Export */}
              <div className="text-center">
                <Button
                  onClick={generateExcelReport}
                  className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 w-full mb-3"
                >
                  <Database className="w-4 h-4" />
                  Export Excel
                </Button>
                <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <p className="font-medium mb-1">Data Analysis Ready</p>
                  <p>Export to Excel with multiple sheets including raw data, summary statistics, and department breakdowns. Ideal for further analysis and reporting.</p>
                </div>
              </div>

              {/* Print Report */}
              <div className="text-center">
                <Button
                  onClick={handlePrint}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 w-full mb-3"
                >
                  <Printer className="w-4 h-4" />
                  Print Report
                </Button>
                <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <p className="font-medium mb-1">Print-Friendly Format</p>
                  <p>Print the report directly to your printer or save as PDF. Optimized layout for paper printing with clean formatting.</p>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Current Report:</strong> {getReportTypeTitle()} - {getPeriodTitle()} Report
                {selectedPeriod !== 'summary' && (
                  <span> • Period: {getDateRangeForPeriod().start?.toLocaleDateString()} to {getDateRangeForPeriod().end?.toLocaleDateString()}</span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card className={isDarkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                {getReportTypeTitle()} Data - {getPeriodTitle()} Report
              </span>
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                {getTableData().length} records
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reportLoading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600 dark:text-gray-400">Loading report data...</p>
              </div>
            ) : getTableData().length === 0 ? (
              <div className="text-center py-12">
                <Database className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">No data found for the selected filters and period.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b transition-colors duration-300 ${
                      isDarkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      {getTableHeaders().map((header, index) => (
                        <th key={index} className={`text-left p-4 font-semibold transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {getTableData().slice(0, 50).map((item, index) => (
                      <tr key={index} className={`border-b transition-colors duration-300 ${
                        isDarkMode ? 'border-gray-700 hover:bg-gray-700/30' : 'border-gray-200 hover:bg-gray-50'
                      }`}>
                        {item.map((cell, cellIndex) => (
                          <td key={cellIndex} className={`p-4 text-sm transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {getTableData().length > 50 && (
                  <div className="text-center py-4 text-sm text-gray-500">
                    Showing first 50 records. Use filters to narrow down results or export for full data.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
} 

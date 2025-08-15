import React, { useState, useEffect } from "react";
import Layout from "./Layout";
import { useTheme } from "./ThemeContext";
import { useData } from "./DataContext";
import { usePatrolData } from "./PatrolDataContext";
import { useFirebase } from "./hooks/useFirebase";
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
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function Reports({ onLogout, onNavigate, currentPage }) {
  const { isDarkMode } = useTheme();
  const { dashboardData, loading } = useData();
  const { patrolData } = usePatrolData();
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

  const loadReportData = async () => {
    setReportLoading(true);
    try {
      switch (selectedReportType) {
        case 'ipatroller':
          // IPatroller data is already in patrolData context
          setFilteredData(patrolData);
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

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [selectedMonth, selectedYear, selectedDistrict, selectedMunicipality, selectedDepartment, searchTerm, startDate, endDate, filteredData]);

  const applyFilters = () => {
    let filtered = [...filteredData];

    // Filter by month and year
    if (selectedMonth !== 'all' || selectedYear !== 'all') {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.when?.seconds * 1000 || item.timestamp || item.date);
        const itemMonth = itemDate.getMonth();
        const itemYear = itemDate.getFullYear();
        
        if (selectedMonth !== 'all' && months.indexOf(selectedMonth) !== itemMonth) return false;
        if (selectedYear !== 'all' && parseInt(selectedYear) !== itemYear) return false;
        return true;
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
        const itemDate = new Date(item.when?.seconds * 1000 || item.timestamp || item.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return itemDate >= start && itemDate <= end;
      });
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item => {
        const searchFields = [
          item.what || '',
          item.why || '',
          item.how || '',
          item.where || '',
          item.who || '',
          item.municipality || '',
          item.district || ''
        ].join(' ').toLowerCase();
        return searchFields.includes(searchTerm.toLowerCase());
      });
    }

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

  // Generate PDF Report
  const generatePDFReport = () => {
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
    
    // Add table data
    const tableData = getTableData();
    const tableHeaders = getTableHeaders();
    
    if (tableData.length > 0) {
      doc.autoTable({
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
    }
    
    // Save the PDF
    const periodSuffix = selectedPeriod !== 'summary' ? `-${selectedPeriod}` : '';
    doc.save(`${selectedReportType}${periodSuffix}-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Generate Excel Report
  const generateExcelReport = () => {
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
    
    const periodSuffix = selectedPeriod !== 'summary' ? `-${selectedPeriod}` : '';
    XLSX.writeFile(wb, `${selectedReportType}${periodSuffix}-report-${new Date().toISOString().split('T')[0]}.xlsx`);
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
    const { start, end } = getDateRangeForPeriod();
    let periodData = filteredData;

    // Filter data by period if not summary
    if (selectedPeriod !== 'summary' && start && end) {
      periodData = filteredData.filter(item => {
        const itemDate = new Date(item.when?.seconds * 1000 || item.timestamp || item.date);
        return itemDate >= start && itemDate <= end;
      });
    }

    switch (selectedReportType) {
      case 'ipatroller':
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
      case 'actioncenter':
        const resolvedCount = periodData.filter(item => item.actionTaken === 'Resolved').length;
        const pendingCount = periodData.filter(item => item.actionTaken !== 'Resolved').length;
        return {
          'Total Reports': periodData.length,
          'Resolved Actions': resolvedCount,
          'Pending Actions': pendingCount,
          'Resolution Rate': periodData.length > 0 ? Math.round((resolvedCount / periodData.length) * 100) + '%' : '0%',
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

  // Get table data
  const getTableData = () => {
    const { start, end } = getDateRangeForPeriod();
    let periodData = filteredData;

    // Filter data by period if not summary
    if (selectedPeriod !== 'summary' && start && end) {
      periodData = filteredData.filter(item => {
        const itemDate = new Date(item.when?.seconds * 1000 || item.timestamp || item.date);
        return itemDate >= start && itemDate <= end;
      });
    }

    return periodData.map(item => {
      switch (selectedReportType) {
        case 'ipatroller':
          return [
            item.municipality || 'N/A',
            item.district || 'N/A',
            item.totalPatrols || 0,
            item.activeDays || 0,
            item.inactiveDays || 0,
            (item.activePercentage || 0) + '%'
          ];
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
  const handlePrint = () => {
    window.print();
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
  };

  return (
    <Layout onLogout={onLogout} onNavigate={currentPage}>
      <div className="flex-1 p-6 space-y-6">
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
                    <option value="agriculture">Agriculture</option>
                    <option value="pg-enro">PG-ENRO</option>
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

        {/* Export Options */}
        <Card className={isDarkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Options - {getPeriodTitle()} Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={generatePDFReport}
                className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Export PDF
              </Button>
              <Button
                onClick={generateExcelReport}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                <Database className="w-4 h-4" />
                Export Excel
              </Button>
              <Button
                onClick={handlePrint}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print Report
              </Button>
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

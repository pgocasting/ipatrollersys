import React, { useState, useEffect } from "react";
import Layout from "./Layout";
import { useTheme } from "./ThemeContext";
import { Card } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { 
  CheckCircle, 
  XCircle, 
  BarChart3, 
  FileText,
  TrendingUp,
  AlertTriangle,
  X,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  Eye,
  Download,
  Printer,
  MapPin,
  Users,
  Activity,
  Shield,
  Car,
  Home,
  Building2,
  Star,
  Zap,
  Target,
  Flag,
  Bell,
  Settings,
  Database,
  Save,
  RefreshCw,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Minus,
  Maximize2,
  Minimize2,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Move,
  Copy,
  Scissors,
  Link,
  Unlink,
  Lock,
  Unlock,
  Key,
  Mail,
  Phone,
  MessageSquare,
  Video,
  Camera,
  Mic,
  Headphones,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Rewind,
  FastForward,
  Shuffle,
  Repeat,
  Volume1,
  Volume,
  Speaker,
  Radio,
  Tv,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Server,
  Mouse,
  Keyboard,
  MonitorSpeaker,
  User,
  AlertCircle,















} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function Reports({ onLogout, onNavigate, currentPage }) {
  const { isDarkMode } = useTheme();
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [reportType, setReportType] = useState("summary");
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [patrolData, setPatrolData] = useState([]);
  const [monthlyData, setMonthlyData] = useState(new Map());
  const [importedMonths, setImportedMonths] = useState(new Set());
  const [activeTab, setActiveTab] = useState("overview");
  const [incidentsData, setIncidentsData] = useState([]);

  // Initialize with empty data
  useEffect(() => {
    // Data will be loaded from state instead of localStorage
  }, []);

  // Get current data from patrol data
  const currentPatrolData = patrolData.filter(row => {
    // Filter by district if selected
    if (selectedDistrict && row.district !== selectedDistrict) {
      return false;
    }
    // For now, use all patrol data since it represents the current active data
    // In the future, we can add date filtering when patrol data includes timestamps
    return true;
  });

  // Calculate analytics from patrol data
  const totalPatrols = currentPatrolData.reduce((sum, row) => 
    sum + row.data.reduce((a, b) => a + b, 0), 0
  );
  const totalMunicipalities = currentPatrolData.length;
  const avgPatrolsPerMunicipality = totalMunicipalities ? Math.round(totalPatrols / totalMunicipalities) : 0;
  
  // Debug logging for overview data
  console.log('Overview Data from patrol data:', {
    totalPatrols,
    totalMunicipalities,
    avgPatrolsPerMunicipality,
    patrolDataLength: patrolData.length,
    currentPatrolDataLength: currentPatrolData.length
  });
  
  // Calculate percentage of active municipalities
  const activeMunicipalities = currentPatrolData.filter(row => {
    const avgPatrols = row.data.reduce((a, b) => a + b, 0) / row.data.length;
    return avgPatrols >= 5;
  }).length;
  const percentagePerMunicipality = totalMunicipalities > 0 ? Math.round((activeMunicipalities / totalMunicipalities) * 100) : 0;
  
  // Get districts
  const districts = [...new Set(currentPatrolData.map(row => row.district))].filter(Boolean);
  
  // Filter data by district (already filtered above, but keeping for consistency)
  const filteredData = currentPatrolData;

  // Get month name - using current data
  const monthName = "Current Patrol Data";

     // Generate report data
   const generateReport = () => {
     const reportData = {
       month: monthName,
       year: selectedYear,
       district: selectedDistrict || "All Districts",
       totalPatrols,
       totalMunicipalities,
       avgPatrolsPerMunicipality,
       percentagePerMunicipality,
       districts: districts.length,
       data: filteredData
     };

     if (reportType === "quarterly") {
       generateQuarterlyReport();
     } else if (reportType === "csv") {
       exportToCSV(reportData);
     } else if (reportType === "pdf") {
       exportToPDF(reportData);
     } else {
       // Summary report - just display
       console.log("Report generated:", reportData);
     }
   };

       // Generate quarterly report
    const generateQuarterlyReport = () => {
      const quarterMonths = [];
      
      // Get the 3 months for the selected quarter
      const startMonth = (selectedQuarter - 1) * 3;
      for (let i = 0; i < 3; i++) {
        const monthIndex = startMonth + i;
        if (monthIndex < 12) {
          quarterMonths.push(monthIndex);
        }
      }

     // Collect data for all months in the quarter
     const quarterlyData = [];

     // For quarterly reports, we'll distribute the current patrol data across the three months
     // This represents the current active patrol data for the quarter
     const currentPatrolData = patrolData.filter(row => {
       // Filter by district if selected
       if (selectedDistrict && row.district !== selectedDistrict) {
         return false;
       }
       return true;
     });

     // Calculate total patrols and municipalities for the quarter
     const totalQuarterlyPatrols = currentPatrolData.reduce((sum, row) => 
       sum + row.data.reduce((a, b) => a + b, 0), 0
     );
     const totalQuarterlyMunicipalities = currentPatrolData.length;

     // Distribute the data across the three months of the quarter
     quarterMonths.forEach((monthIndex, index) => {
       // For now, we'll show the same data for each month since it represents current active data
       // In the future, when patrol data includes timestamps, we can filter by actual month
       const monthPatrols = Math.round(totalQuarterlyPatrols / 3); // Distribute evenly
       const monthMunicipalities = Math.round(totalQuarterlyMunicipalities / 3); // Distribute evenly
       
       quarterlyData.push({
         month: new Date(selectedYear, monthIndex, 1).toLocaleString('en-US', { month: 'long' }),
         data: currentPatrolData, // Use the same data for all months
         patrols: monthPatrols,
         municipalities: monthMunicipalities
       });
     });

           const quarterlyReport = {
        quarter: selectedQuarter,
        year: selectedYear,
        district: selectedDistrict || "All Districts",
        totalPatrols: totalQuarterlyPatrols,
        totalMunicipalities: totalQuarterlyMunicipalities,
        avgPatrolsPerMunicipality: totalQuarterlyMunicipalities ? Math.round(totalQuarterlyPatrols / totalQuarterlyMunicipalities) : 0,
      percentagePerMunicipality: totalQuarterlyMunicipalities > 0 ? Math.round((quarterlyData.filter(month => {
        const activeCount = month.data.filter(row => {
          const avgPatrols = row.data.reduce((a, b) => a + b, 0) / row.data.length;
          return avgPatrols >= 5;
        }).length;
        return activeCount > 0;
      }).length / quarterlyData.length) * 100) : 0,
        months: quarterlyData
      };

      console.log("Quarterly Report:", quarterlyReport);
      console.log("Patrol Data:", patrolData.length, "records");
      console.log("Selected Quarter:", selectedQuarter, "Year:", selectedYear);
      console.log("Selected District:", selectedDistrict || "All Districts");
      console.log("Quarterly Data Distribution:", {
        totalPatrols: totalQuarterlyPatrols,
        totalMunicipalities: totalQuarterlyMunicipalities,
        activeMunicipalities: currentPatrolData.filter(row => {
          const avgPatrols = row.data.reduce((a, b) => a + b, 0) / row.data.length;
          return avgPatrols >= 5;
        }).length,
        monthlyDistribution: quarterlyData.map(q => ({
          month: q.month,
          patrols: q.patrols,
          municipalities: q.municipalities
        }))
      });
      
      // Export quarterly report based on report type
      if (reportType === "csv") {
        exportQuarterlyToCSV(quarterlyReport);
      } else if (reportType === "pdf") {
        exportQuarterlyToPDF(quarterlyReport);
      } else {
        // Display quarterly report
        alert(`Quarterly Report Generated!\n\nQuarter: Q${selectedQuarter} ${selectedYear}\nTotal Patrols: ${totalQuarterlyPatrols.toLocaleString()}\nTotal Municipalities: ${totalQuarterlyMunicipalities}\nAverage per Municipality: ${quarterlyReport.avgPatrolsPerMunicipality}`);
      }
   };

  const exportToCSV = (reportData) => {
    let csv = [
      ["Patrol Report", ""],
      ["Month", reportData.month],
      ["Year", reportData.year],
      ["District", reportData.district],
      ["Total Patrols", reportData.totalPatrols],
      ["Total Municipalities", reportData.totalMunicipalities],
      ["Percentage per Municipality", `${reportData.percentagePerMunicipality}%`],
      ["", ""],
      ["Municipality", "District", "Total Patrols", "Total Active", "Total Inactive", "Active Percentage", "Daily Breakdown"]
    ];

    reportData.data.forEach(row => {
      const totalPatrols = row.data.reduce((a, b) => a + b, 0);
      const totalActive = row.data.filter(day => day > 0).length;
      const totalInactive = row.data.filter(day => day === 0).length;
      const activePercentage = row.data.length > 0 ? Math.round((totalActive / row.data.length) * 100) : 0;
      const dailyBreakdown = row.data.join(", ");
      csv.push([row.municipality, row.district, totalPatrols, totalActive, totalInactive, `${activePercentage}%`, dailyBreakdown]);
    });

    const blob = new Blob([csv.map(row => row.join(",")).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `patrol-report-${reportData.month.toLowerCase()}-${reportData.year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToPDF = (reportData) => {
    // Simple PDF export using window.print
    const printWindow = window.open("", "", "width=800,height=600");
    printWindow.document.write(`
      <html>
        <head>
          <title>Patrol Report - ${reportData.month} ${reportData.year}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
            .stat-card { border: 1px solid #ddd; padding: 15px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Patrol Report</h1>
            <h2>${reportData.month} ${reportData.year}</h2>
          </div>
          
          <div class="summary">
            <h3>Summary</h3>
            <div class="stats">
              <div class="stat-card">
                <h4>Total Patrols</h4>
                <p>${reportData.totalPatrols.toLocaleString()}</p>
              </div>
              <div class="stat-card">
                <h4>Municipalities</h4>
                <p>${reportData.totalMunicipalities}</p>
              </div>
              <div class="stat-card">
                <h4>Percentage per Municipality</h4>
                <p>${reportData.percentagePerMunicipality}%</p>
              </div>
            </div>
        </div>
          
          <table>
            <thead>
              <tr>
                <th>Municipality</th>
                <th>District</th>
                <th>Total Patrols</th>
                <th>Total Active</th>
                <th>Total Inactive</th>
                <th>Active Percentage</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.data.map(row => {
                const totalPatrols = row.data.reduce((a, b) => a + b, 0);
                const totalActive = row.data.filter(day => day > 0).length;
                const totalInactive = row.data.filter(day => day === 0).length;
                const activePercentage = row.data.length > 0 ? Math.round((totalActive / row.data.length) * 100) : 0;
                return `
                  <tr>
                    <td>${row.municipality}</td>
                    <td>${row.district}</td>
                    <td>${totalPatrols}</td>
                    <td>${totalActive}</td>
                    <td>${totalInactive}</td>
                    <td>${activePercentage}%</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const exportQuarterlyToCSV = (quarterlyReport) => {
    let csv = [
      ["Patrol Quarterly Report", ""],
      ["Quarter", `Q${quarterlyReport.quarter}`],
      ["Year", quarterlyReport.year],
      ["District", quarterlyReport.district],
      ["Total Patrols", quarterlyReport.totalPatrols],
      ["Total Municipalities", quarterlyReport.totalMunicipalities],
      ["Percentage per Municipality", `${quarterlyReport.percentagePerMunicipality}%`],
      ["", ""],
      ["Month", "Total Patrols", "Municipalities"]
    ];

    quarterlyReport.months.forEach(monthData => {
      csv.push([monthData.month, monthData.patrols, monthData.data.length]);
    });

    const blob = new Blob([csv.map(row => row.join(",")).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `patrol-quarterly-report-q${quarterlyReport.quarter}-${quarterlyReport.year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportQuarterlyToPDF = (quarterlyReport) => {
    const printWindow = window.open("", "", "width=800,height=600");
    printWindow.document.write(`
      <html>
        <head>
          <title>Patrol Quarterly Report - Q${quarterlyReport.quarter} ${quarterlyReport.year}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
            .stat-card { border: 1px solid #ddd; padding: 15px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Patrol Quarterly Report</h1>
            <h2>Q${quarterlyReport.quarter} ${quarterlyReport.year}</h2>
          </div>
          
          <div class="summary">
            <h3>Summary</h3>
            <div class="stats">
              <div class="stat-card">
                <h4>Total Patrols</h4>
                <p>${quarterlyReport.totalPatrols.toLocaleString()}</p>
              </div>
              <div class="stat-card">
                <h4>Municipalities</h4>
                <p>${quarterlyReport.totalMunicipalities}</p>
              </div>
              <div class="stat-card">
                <h4>Percentage per Municipality</h4>
                <p>${quarterlyReport.percentagePerMunicipality}%</p>
              </div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Total Patrols</th>
                <th>Municipalities</th>
              </tr>
            </thead>
            <tbody>
              ${quarterlyReport.months.map(monthData => `
                <tr>
                  <td>${monthData.month}</td>
                  <td>${monthData.patrols.toLocaleString()}</td>
                  <td>${monthData.data.length}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  // Incidents Analysis Functions
  const generateIncidentsReport = () => {
    const totalIncidents = incidentsData.length;
    const resolvedIncidents = incidentsData.filter(incident => incident.status === 'Resolved').length;
    const pendingIncidents = incidentsData.filter(incident => incident.status === 'Pending').length;
    const underInvestigation = incidentsData.filter(incident => incident.status === 'Under Investigation').length;
    
    // Incident type analysis
    const incidentTypeCounts = {};
    incidentsData.forEach(incident => {
      incidentTypeCounts[incident.incidentType] = (incidentTypeCounts[incident.incidentType] || 0) + 1;
    });
    const mostCommonType = Object.keys(incidentTypeCounts).reduce((a, b) => 
      incidentTypeCounts[a] > incidentTypeCounts[b] ? a : b, 'None');
    
    // District analysis
    const districtCounts = {};
    incidentsData.forEach(incident => {
      districtCounts[incident.district] = (districtCounts[incident.district] || 0) + 1;
    });
    const mostActiveDistrict = Object.keys(districtCounts).reduce((a, b) => 
      districtCounts[a] > districtCounts[b] ? a : b, 'None');
    
    // Municipality analysis
    const municipalityCounts = {};
    incidentsData.forEach(incident => {
      if (incident.municipality) {
        municipalityCounts[incident.municipality] = (municipalityCounts[incident.municipality] || 0) + 1;
      }
    });
    
    // Monthly trend
    const monthlyCounts = {};
    incidentsData.forEach(incident => {
      if (incident.date) {
        const month = new Date(incident.date).toLocaleString('default', { month: 'long' });
        monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
      }
    });
    
    return {
      totalIncidents,
      resolvedIncidents,
      pendingIncidents,
      underInvestigation,
      resolutionRate: totalIncidents > 0 ? Math.round((resolvedIncidents / totalIncidents) * 100) : 0,
      incidentTypeCounts,
      mostCommonType,
      districtCounts,
      mostActiveDistrict,
      municipalityCounts,
      monthlyCounts
    };
  };

  const exportIncidentsToCSV = (incidentsReport) => {
    let csv = [
      ["Incidents Report", ""],
      ["Total Incidents", incidentsReport.totalIncidents],
      ["Resolved", incidentsReport.resolvedIncidents],
      ["Pending", incidentsReport.pendingIncidents],
      ["Under Investigation", incidentsReport.underInvestigation],
      ["Resolution Rate", `${incidentsReport.resolutionRate}%`],
      ["Most Common Type", incidentsReport.mostCommonType],
      ["Most Active District", incidentsReport.mostActiveDistrict],
      ["", ""],
      ["Incident Type", "Count"]
    ];

    Object.entries(incidentsReport.incidentTypeCounts).forEach(([type, count]) => {
      csv.push([type, count]);
    });

    csv.push(["", ""]);
    csv.push(["District", "Count"]);
    Object.entries(incidentsReport.districtCounts).forEach(([district, count]) => {
      csv.push([district, count]);
    });

    const blob = new Blob([csv.map(row => row.join(",")).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `incidents-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportIncidentsToPDF = (incidentsReport) => {
    const printWindow = window.open("", "", "width=800,height=600");
    printWindow.document.write(`
      <html>
        <head>
          <title>Incidents Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
            .stat-card { border: 1px solid #ddd; padding: 15px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Incidents Report</h1>
            <h2>Generated on ${new Date().toLocaleDateString()}</h2>
          </div>
          
          <div class="summary">
            <h3>Summary</h3>
            <div class="stats">
              <div class="stat-card">
                <h4>Total Incidents</h4>
                <p>${incidentsReport.totalIncidents}</p>
              </div>
              <div class="stat-card">
                <h4>Resolved</h4>
                <p>${incidentsReport.resolvedIncidents}</p>
              </div>
              <div class="stat-card">
                <h4>Pending</h4>
                <p>${incidentsReport.pendingIncidents}</p>
              </div>
              <div class="stat-card">
                <h4>Resolution Rate</h4>
                <p>${incidentsReport.resolutionRate}%</p>
              </div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Incident Type</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(incidentsReport.incidentTypeCounts).map(([type, count]) => `
                <tr>
                  <td>${type}</td>
                  <td>${count}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <Layout onLogout={onLogout} onNavigate={onNavigate} currentPage={currentPage}>
      <div className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className={`rounded-2xl p-6 shadow-lg transition-all duration-300 ${
          isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Reports & Analytics</h1>
              <p className={`transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Generate comprehensive reports and analyze patrol data</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={`rounded-2xl p-6 shadow-lg transition-all duration-300 ${
          isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'
        }`}>
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value === "all" ? "all" : parseInt(e.target.value))}
                className={`px-4 py-3 rounded-lg border transition-all duration-300 focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode
                    ? 'border-gray-600 bg-gray-800 text-white'
                    : 'border-gray-300 bg-white text-gray-900'
                }`}
              >
                <option value="all">All Months</option>
                {[
                  { value: 0, label: "January" },
                  { value: 1, label: "February" },
                  { value: 2, label: "March" },
                  { value: 3, label: "April" },
                  { value: 4, label: "May" },
                  { value: 5, label: "June" },
                  { value: 6, label: "July" },
                  { value: 7, label: "August" },
                  { value: 8, label: "September" },
                  { value: 9, label: "October" },
                  { value: 10, label: "November" },
                  { value: 11, label: "December" }
                ].map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className={`px-4 py-3 rounded-lg border transition-all duration-300 focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode
                    ? 'border-gray-600 bg-gray-800 text-white'
                    : 'border-gray-300 bg-white text-gray-900'
                }`}
              >
                {[2024, 2025, 2026].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>

              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className={`px-4 py-3 rounded-lg border transition-all duration-300 focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode
                    ? 'border-gray-600 bg-gray-800 text-white'
                    : 'border-gray-300 bg-white text-gray-900'
                }`}
              >
                <option value="">All Districts</option>
                {districts.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>

                             <select
                 value={reportType}
                 onChange={(e) => setReportType(e.target.value)}
                 className={`px-4 py-3 rounded-lg border transition-all duration-300 focus:ring-2 focus:ring-blue-500 ${
                   isDarkMode
                     ? 'border-gray-600 bg-gray-800 text-white'
                     : 'border-gray-300 bg-white text-gray-900'
                 }`}
               >
                 <option value="summary">Summary Report</option>
                 <option value="quarterly">Quarterly Report</option>
                 <option value="csv">Export CSV</option>
                 <option value="pdf">Export PDF</option>
               </select>

               {reportType === "quarterly" && (
                 <select
                   value={selectedQuarter}
                   onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
                   className={`px-4 py-3 rounded-lg border transition-all duration-300 focus:ring-2 focus:ring-blue-500 ${
                     isDarkMode
                       ? 'border-gray-600 bg-gray-800 text-white'
                       : 'border-gray-300 bg-white text-gray-900'
                   }`}
                 >
                   <option value={1}>Q1 (January - March)</option>
                   <option value={2}>Q2 (April - June)</option>
                   <option value={3}>Q3 (July - September)</option>
                   <option value={4}>Q4 (October - December)</option>
                 </select>
               )}
            </div>

            <button
              onClick={generateReport}
              className="p-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300 shadow-lg"
              title="Export Report"
            >
              <FileText className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`rounded-2xl p-6 shadow-lg transition-all duration-300 ${
          isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'
        }`}>
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                activeTab === "overview"
                  ? isDarkMode 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-blue-600 text-white shadow-lg'
                  : isDarkMode 
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Overview
              </div>
            </button>
            <button
              onClick={() => setActiveTab("performance")}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                activeTab === "performance"
                  ? isDarkMode 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-blue-600 text-white shadow-lg'
                  : isDarkMode 
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Performance Insights
              </div>
            </button>
            <button
              onClick={() => setActiveTab("incidents")}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                activeTab === "incidents"
                  ? isDarkMode 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-blue-600 text-white shadow-lg'
                  : isDarkMode 
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Incidents Reports
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <>
            {/* Overview Header */}
            <div className="mb-6">
              <h2 className={`text-2xl font-bold mb-2 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Overview
              </h2>
              <p className={`text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                📊 Connected to patrol data: {patrolData.length} active records
              </p>
            </div>
            
            {/* Analytics Cards */}
         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           <Card className={`p-6 transition-all duration-300 ${
             isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'
           }`}>
             <div className="flex items-center justify-between">
               <div>
                 <p className={`text-sm font-medium transition-colors duration-300 ${
                   isDarkMode ? 'text-gray-400' : 'text-gray-500'
                 }`}>Total Patrols</p>
                 <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                   {totalPatrols.toLocaleString()}
                 </p>
               </div>
               <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors duration-300 ${
                 isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'
               }`}>
                 <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
                 </svg>
               </div>
             </div>
           </Card>

           <Card className={`p-6 transition-all duration-300 ${
             isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'
           }`}>
             <div className="flex items-center justify-between">
               <div>
                 <p className={`text-sm font-medium transition-colors duration-300 ${
                   isDarkMode ? 'text-gray-400' : 'text-gray-500'
                 }`}>Municipalities</p>
                 <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                   {totalMunicipalities}
                 </p>
               </div>
               <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors duration-300 ${
                 isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100'
               }`}>
                 <Building2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
               </div>
             </div>
           </Card>

           <Card className={`p-6 transition-all duration-300 ${
             isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'
           }`}>
             <div className="flex items-center justify-between">
               <div>
                 <p className={`text-sm font-medium transition-colors duration-300 ${
                   isDarkMode ? 'text-gray-400' : 'text-gray-500'
                 }`}>Active Municipalities</p>
                 <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                   {(() => {
                     const activeCount = filteredData.filter(row => {
                       const avgPatrols = row.data.reduce((a, b) => a + b, 0) / row.data.length;
                       return avgPatrols >= 5;
                     }).length;
                     return activeCount;
                   })()}
                 </p>
               </div>
               <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors duration-300 ${
                 isDarkMode ? 'bg-green-900/30' : 'bg-green-100'
               }`}>
                 <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
               </div>
             </div>
           </Card>

           <Card className={`p-6 transition-all duration-300 ${
             isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'
           }`}>
             <div className="flex items-center justify-between">
               <div>
                 <p className={`text-sm font-medium transition-colors duration-300 ${
                   isDarkMode ? 'text-gray-400' : 'text-gray-500'
                 }`}>Percentage per Municipality</p>
                 <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                   {percentagePerMunicipality}%
                 </p>
               </div>
               <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors duration-300 ${
                 isDarkMode ? 'bg-indigo-900/30' : 'bg-indigo-100'
               }`}>
                 <BarChart3 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
               </div>
             </div>
           </Card>
         </div>

                 {/* Data Status */}
         <div className={`rounded-2xl p-6 shadow-lg transition-all duration-300 ${
           isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'
         }`}>
           <div className="flex items-center justify-between mb-4">
             <h2 className={`text-xl font-bold transition-colors duration-300 ${
               isDarkMode ? 'text-white' : 'text-gray-900'
             }`}>Data Status</h2>
                                     <Badge variant={patrolData.length > 0 ? "default" : "secondary"}>
                          {patrolData.length > 0 ? "Data Available" : "No Data"}
                        </Badge>
           </div>
           
           <div className={`text-sm transition-colors duration-300 ${
             isDarkMode ? 'text-gray-300' : 'text-gray-600'
           }`}>
             <p><strong>Current Period:</strong> {monthName} {selectedYear}</p>
             <p><strong>Selected District:</strong> {selectedDistrict || "All Districts"}</p>
                                     <p><strong>Data Source:</strong> {patrolData.length > 0 ? "iPatroller Data" : "No iPatroller data"}</p>
           </div>
         </div>



                 {/* Detailed Data Table */}
         {filteredData.length > 0 && (
           <div className={`rounded-2xl p-6 shadow-lg transition-all duration-300 ${
             isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'
           }`}>
             <h2 className={`text-xl font-bold mb-4 transition-colors duration-300 ${
               isDarkMode ? 'text-white' : 'text-gray-900'
             }`}>
               {reportType === "quarterly" ? "Quarterly Data" : "Detailed Data"}
             </h2>
             {reportType === "quarterly" && (
               <p className={`text-sm mb-4 transition-colors duration-300 ${
                 isDarkMode ? 'text-gray-400' : 'text-gray-600'
               }`}>
                 📊 Connected to patrol data: {patrolData.length} active records
               </p>
             )}
            
                         <div className="overflow-x-auto">
               <table className="min-w-full">
                 <thead>
                   <tr className={`border-b transition-colors duration-300 ${
                     isDarkMode ? 'border-gray-700' : 'border-gray-200'
                   }`}>
                     {reportType === "quarterly" ? (
                       <>
                         <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                           isDarkMode ? 'text-gray-400' : 'text-gray-500'
                         }`}>Month</th>
                         <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                           isDarkMode ? 'text-gray-400' : 'text-gray-500'
                         }`}>Total Patrols</th>
                         <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                           isDarkMode ? 'text-gray-400' : 'text-gray-500'
                         }`}>Municipalities</th>
                         <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                           isDarkMode ? 'text-gray-400' : 'text-gray-500'
                         }`}>Active Percentage</th>
                       </>
                     ) : (
                       <>
                         <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                           isDarkMode ? 'text-gray-400' : 'text-gray-500'
                         }`}>Month</th>
                         <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                           isDarkMode ? 'text-gray-400' : 'text-gray-500'
                         }`}>Municipality</th>
                         <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                           isDarkMode ? 'text-gray-400' : 'text-gray-500'
                         }`}>District</th>
                         <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                           isDarkMode ? 'text-gray-400' : 'text-gray-500'
                         }`}>Total Patrols</th>
                         <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                           isDarkMode ? 'text-gray-400' : 'text-gray-500'
                         }`}>Total Active</th>
                         <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                           isDarkMode ? 'text-gray-400' : 'text-gray-500'
                         }`}>Total Inactive</th>
                         <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                           isDarkMode ? 'text-gray-400' : 'text-gray-500'
                         }`}>Active Percentage</th>
                       </>
                     )}
                   </tr>
                 </thead>
                                 <tbody>
                   {(() => {
                     if (reportType === "quarterly") {
                       // Generate quarterly data for display
                       const quarterMonths = [];
                       const startMonth = (selectedQuarter - 1) * 3;
                       for (let i = 0; i < 3; i++) {
                         const monthIndex = startMonth + i;
                         if (monthIndex < 12) {
                           quarterMonths.push(monthIndex);
                         }
                       }

                       // For quarterly display, distribute the current patrol data across the three months
                       const currentPatrolData = patrolData.filter(row => {
                         // Filter by district if selected
                         if (selectedDistrict && row.district !== selectedDistrict) {
                           return false;
                         }
                         return true;
                       });

                       const totalQuarterlyPatrols = currentPatrolData.reduce((sum, row) => 
                         sum + row.data.reduce((a, b) => a + b, 0), 0
                       );
                       const totalQuarterlyMunicipalities = currentPatrolData.length;
                       const activeMunicipalities = currentPatrolData.filter(row => {
                         const avgPatrols = row.data.reduce((a, b) => a + b, 0) / row.data.length;
                         return avgPatrols >= 5;
                       }).length;
                       const activePercentage = totalQuarterlyMunicipalities > 0 
                         ? Math.round((activeMunicipalities / totalQuarterlyMunicipalities) * 100) 
                         : 0;

                       const quarterlyData = [];
                       quarterMonths.forEach((monthIndex, index) => {
                         // Distribute the data evenly across the three months
                         const monthPatrols = Math.round(totalQuarterlyPatrols / 3);
                         const monthMunicipalities = Math.round(totalQuarterlyMunicipalities / 3);
                         
                         quarterlyData.push({
                           month: new Date(selectedYear, monthIndex, 1).toLocaleString('en-US', { month: 'long' }),
                           patrols: monthPatrols,
                           municipalities: monthMunicipalities,
                           activePercentage
                         });
                       });

                       return quarterlyData.map((monthData, index) => (
                         <tr key={index} className={`border-b transition-colors duration-300 ${
                           isDarkMode ? 'border-gray-700' : 'border-gray-200'
                         }`}>
                           <td className={`px-4 py-3 whitespace-nowrap font-medium transition-colors duration-300 ${
                             isDarkMode ? 'text-white' : 'text-gray-900'
                           }`}>{monthData.month}</td>
                           <td className={`px-4 py-3 whitespace-nowrap transition-colors duration-300 ${
                             isDarkMode ? 'text-gray-200' : 'text-gray-700'
                           }`}>{monthData.patrols.toLocaleString()}</td>
                           <td className={`px-4 py-3 whitespace-nowrap transition-colors duration-300 ${
                             isDarkMode ? 'text-gray-200' : 'text-gray-700'
                           }`}>{monthData.municipalities}</td>
                           <td className={`px-4 py-3 whitespace-nowrap transition-colors duration-300 ${
                             isDarkMode ? 'text-gray-200' : 'text-gray-700'
                           }`}>{monthData.activePercentage}%</td>
                         </tr>
                       ));
                     } else {
                       // Regular monthly data
                       const totalPatrolsAll = filteredData.reduce((sum, row) => 
                         sum + row.data.reduce((a, b) => a + b, 0), 0
                       );
                       
                       // If "All Months" is selected, we need to show month information
                       if (selectedMonth === "all") {
                         // Create a list of all data with month information
                         const allDataWithMonths = [];
                         
                         monthlyData.forEach((monthData, monthKey) => {
                           if (monthData.length > 0) {
                             const [year, month] = monthKey.split('-');
                             const monthName = new Date(parseInt(year), parseInt(month), 1).toLocaleString('en-US', { month: 'long' });
                             
                             monthData.forEach(row => {
                               if (!selectedDistrict || row.district === selectedDistrict) {
                                 const totalPatrols = row.data.reduce((a, b) => a + b, 0);
                                 const totalActive = row.data.filter(day => day > 0).length;
                                 const totalInactive = row.data.filter(day => day === 0).length;
                                 const activePercentage = row.data.length > 0 
                                   ? Math.round((totalActive / row.data.length) * 100) 
                                   : 0;
                                 
                                 allDataWithMonths.push({
                                   month: monthName,
                                   municipality: row.municipality,
                                   district: row.district,
                                   totalPatrols,
                                   totalActive,
                                   totalInactive,
                                   activePercentage
                                 });
                               }
                             });
                           }
                         });
                         
                         return allDataWithMonths.map((row, index) => (
                           <tr key={index} className={`border-b transition-colors duration-300 ${
                             isDarkMode ? 'border-gray-700' : 'border-gray-200'
                           }`}>
                             <td className={`px-4 py-3 whitespace-nowrap font-medium transition-colors duration-300 ${
                               isDarkMode ? 'text-blue-400' : 'text-blue-600'
                             }`}>{row.month}</td>
                             <td className={`px-4 py-3 whitespace-nowrap font-medium transition-colors duration-300 ${
                               isDarkMode ? 'text-white' : 'text-gray-900'
                             }`}>{row.municipality}</td>
                             <td className={`px-4 py-3 whitespace-nowrap transition-colors duration-300 ${
                               isDarkMode ? 'text-gray-200' : 'text-gray-700'
                             }`}>{row.district}</td>
                             <td className={`px-4 py-3 whitespace-nowrap transition-colors duration-300 ${
                               isDarkMode ? 'text-gray-200' : 'text-gray-700'
                             }`}>{row.totalPatrols}</td>
                             <td className={`px-4 py-3 whitespace-nowrap transition-colors duration-300 ${
                               isDarkMode ? 'text-gray-200' : 'text-gray-700'
                             }`}>{row.totalActive}</td>
                             <td className={`px-4 py-3 whitespace-nowrap transition-colors duration-300 ${
                               isDarkMode ? 'text-gray-200' : 'text-gray-700'
                             }`}>{row.totalInactive}</td>
                             <td className={`px-4 py-3 whitespace-nowrap transition-colors duration-300 ${
                               isDarkMode ? 'text-gray-200' : 'text-gray-700'
                             }`}>{row.activePercentage}%</td>
                           </tr>
                         ));
                       } else {
                         // Single month data - show the selected month
                         const monthName = new Date(selectedYear, selectedMonth, 1).toLocaleString('en-US', { month: 'long' });
                         
                         return filteredData.map((row, index) => {
                           const totalPatrols = row.data.reduce((a, b) => a + b, 0);
                           const totalActive = row.data.filter(day => day > 0).length;
                           const totalInactive = row.data.filter(day => day === 0).length;
                           const activePercentage = row.data.length > 0 
                             ? Math.round((totalActive / row.data.length) * 100) 
                             : 0;
                          
                           return (
                             <tr key={index} className={`border-b transition-colors duration-300 ${
                               isDarkMode ? 'border-gray-700' : 'border-gray-200'
                             }`}>
                               <td className={`px-4 py-3 whitespace-nowrap font-medium transition-colors duration-300 ${
                                 isDarkMode ? 'text-blue-400' : 'text-blue-600'
                               }`}>{monthName}</td>
                               <td className={`px-4 py-3 whitespace-nowrap font-medium transition-colors duration-300 ${
                                 isDarkMode ? 'text-white' : 'text-gray-900'
                               }`}>{row.municipality}</td>
                               <td className={`px-4 py-3 whitespace-nowrap transition-colors duration-300 ${
                                 isDarkMode ? 'text-gray-200' : 'text-gray-700'
                               }`}>{row.district}</td>
                               <td className={`px-4 py-3 whitespace-nowrap transition-colors duration-300 ${
                                 isDarkMode ? 'text-gray-200' : 'text-gray-700'
                               }`}>{totalPatrols}</td>
                               <td className={`px-4 py-3 whitespace-nowrap transition-colors duration-300 ${
                                 isDarkMode ? 'text-gray-200' : 'text-gray-700'
                               }`}>{totalActive}</td>
                               <td className={`px-4 py-3 whitespace-nowrap transition-colors duration-300 ${
                                 isDarkMode ? 'text-gray-200' : 'text-gray-700'
                               }`}>{totalInactive}</td>
                               <td className={`px-4 py-3 whitespace-nowrap transition-colors duration-300 ${
                                 isDarkMode ? 'text-gray-200' : 'text-gray-700'
                               }`}>{activePercentage}%</td>
                             </tr>
                           );
                         });
                       }
                     }
                   })()}
                 </tbody>
              </table>
            </div>
          </div>
        )}

        {/* No Data Message */}
        {filteredData.length === 0 && (
          <div className={`rounded-2xl p-8 text-center shadow-lg transition-all duration-300 ${
            isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'
          }`}>
            <div className={`text-xl font-bold mb-3 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>No Data Available</div>
            <div className={`text-base mb-6 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {patrolData.length > 0 
                ? "No data found for the selected filters. Try changing the district filter."
                : "No patrol data has been entered. Add patrol data first."
              }
            </div>
          </div>
        )}
          </>
        )}

        {/* Performance Insights Tab */}
        {activeTab === "performance" && (
          <>
            {/* Performance Insights */}
            {filteredData.length > 0 && (
              <div className={`rounded-2xl p-8 shadow-xl transition-all duration-300 ${
                isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700' : 'bg-gradient-to-br from-white via-gray-50 to-white border border-gray-200'
              }`}>
                {/* Header with Icon */}
                <div className="flex items-center gap-3 mb-8">
                  <div className={`p-3 rounded-xl transition-all duration-300 ${
                    isDarkMode ? 'bg-blue-600/20 border border-blue-500/30' : 'bg-blue-100 border border-blue-200'
                  }`}>
                    <svg className={`w-6 h-6 transition-colors duration-300 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className={`text-2xl font-bold transition-colors duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Performance Insights</h2>
                    <p className={`text-sm transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>Monitor active and inactive municipalities based on patrol performance</p>
                  </div>
                </div>

                {/* Performance Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {(() => {
                    const activeCount = filteredData.filter(row => {
                      const avgPatrols = row.data.reduce((a, b) => a + b, 0) / row.data.length;
                      return avgPatrols >= 5;
                    }).length;
                    const inactiveCount = filteredData.filter(row => {
                      const avgPatrols = row.data.reduce((a, b) => a + b, 0) / row.data.length;
                      return avgPatrols <= 4;
                    }).length;
                    const activeRate = filteredData.length > 0 ? Math.round((activeCount / filteredData.length) * 100) : 0;
                    const inactiveRate = filteredData.length > 0 ? Math.round((inactiveCount / filteredData.length) * 100) : 0;

                    return (
                      <>
                        {/* Active Rate Card */}
                        <div className={`relative overflow-hidden rounded-xl p-6 transition-all duration-300 ${
                          isDarkMode ? 'bg-gradient-to-br from-green-900/40 to-green-800/20 border border-green-600/30' : 'bg-gradient-to-br from-green-50 to-green-100 border border-green-200'
                        }`}>
                          <div className="flex items-center justify-between mb-4">
                            <div className={`p-2 rounded-lg transition-all duration-300 ${
                              isDarkMode ? 'bg-green-600/20' : 'bg-green-100'
                            }`}>
                              <CheckCircle className={`w-5 h-5 transition-colors duration-300 ${
                                isDarkMode ? 'text-green-400' : 'text-green-600'
                              }`} />
                            </div>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full transition-all duration-300 ${
                              isDarkMode ? 'bg-green-600/30 text-green-300' : 'bg-green-200 text-green-700'
                            }`}>Active</span>
                          </div>
                          <div className="mb-2">
                            <span className={`text-3xl font-bold transition-colors duration-300 ${
                              isDarkMode ? 'text-green-400' : 'text-green-700'
                            }`}>{activeRate}%</span>
                          </div>
                          <p className={`text-sm transition-colors duration-300 ${
                            isDarkMode ? 'text-green-300' : 'text-green-600'
                          }`}>{activeCount} municipalities</p>
                        </div>

                        {/* Inactive Rate Card */}
                        <div className={`relative overflow-hidden rounded-xl p-6 transition-all duration-300 ${
                          isDarkMode ? 'bg-gradient-to-br from-red-900/40 to-red-800/20 border border-red-600/30' : 'bg-gradient-to-br from-red-50 to-red-100 border border-red-200'
                        }`}>
                          <div className="flex items-center justify-between mb-4">
                            <div className={`p-2 rounded-lg transition-all duration-300 ${
                              isDarkMode ? 'bg-red-600/20' : 'bg-red-100'
                            }`}>
                              <X className={`w-5 h-5 transition-colors duration-300 ${
                                isDarkMode ? 'text-red-400' : 'text-red-600'
                              }`} />
                            </div>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full transition-all duration-300 ${
                              isDarkMode ? 'bg-red-600/30 text-red-300' : 'bg-red-200 text-red-700'
                            }`}>Inactive</span>
                          </div>
                          <div className="mb-2">
                            <span className={`text-3xl font-bold transition-colors duration-300 ${
                              isDarkMode ? 'text-red-400' : 'text-red-700'
                            }`}>{inactiveRate}%</span>
                          </div>
                          <p className={`text-sm transition-colors duration-300 ${
                            isDarkMode ? 'text-red-300' : 'text-red-600'
                          }`}>{inactiveCount} municipalities</p>
                        </div>

                        {/* Total Municipalities Card */}
                        <div className={`relative overflow-hidden rounded-xl p-6 transition-all duration-300 ${
                          isDarkMode ? 'bg-gradient-to-br from-blue-900/40 to-blue-800/20 border border-blue-600/30' : 'bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200'
                        }`}>
                          <div className="flex items-center justify-between mb-4">
                            <div className={`p-2 rounded-lg transition-all duration-300 ${
                              isDarkMode ? 'bg-blue-600/20' : 'bg-blue-100'
                            }`}>
                              <Building2 className={`w-5 h-5 transition-colors duration-300 ${
                                isDarkMode ? 'text-blue-400' : 'text-blue-600'
                              }`} />
                            </div>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full transition-all duration-300 ${
                              isDarkMode ? 'bg-blue-600/30 text-blue-300' : 'bg-blue-200 text-blue-700'
                            }`}>Total</span>
                          </div>
                          <div className="mb-2">
                            <span className={`text-3xl font-bold transition-colors duration-300 ${
                              isDarkMode ? 'text-blue-400' : 'text-blue-700'
                            }`}>{filteredData.length}</span>
                          </div>
                          <p className={`text-sm transition-colors duration-300 ${
                            isDarkMode ? 'text-blue-300' : 'text-blue-600'
                          }`}>municipalities</p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Performance Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  {/* Performance Distribution Chart */}
                  <div className={`rounded-xl p-6 transition-all duration-300 ${
                    isDarkMode ? 'bg-gradient-to-br from-gray-900/20 to-gray-800/10 border border-gray-600/20' : 'bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200'
                  }`}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`p-2 rounded-lg transition-all duration-300 ${
                        isDarkMode ? 'bg-purple-600/20' : 'bg-purple-100'
                      }`}>
                        <BarChart3 className={`w-5 h-5 transition-colors duration-300 ${
                          isDarkMode ? 'text-purple-400' : 'text-purple-600'
                        }`} />
                      </div>
                      <div>
                        <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                          isDarkMode ? 'text-purple-300' : 'text-purple-700'
                        }`}>Performance Distribution</h3>
                        <p className={`text-sm transition-colors duration-300 ${
                          isDarkMode ? 'text-purple-400' : 'text-purple-600'
                        }`}>Active vs Inactive municipalities</p>
                      </div>
                    </div>
                    
                    <div className="h-64">
                      <Doughnut
                        data={{
                          labels: ['Active', 'Inactive'],
                          datasets: [{
                            data: [
                              filteredData.filter(row => {
                                const avgPatrols = row.data.reduce((a, b) => a + b, 0) / row.data.length;
                                return avgPatrols >= 5;
                              }).length,
                              filteredData.filter(row => {
                                const avgPatrols = row.data.reduce((a, b) => a + b, 0) / row.data.length;
                                return avgPatrols <= 4;
                              }).length
                            ],
                            backgroundColor: [
                              isDarkMode ? 'rgba(34, 197, 94, 0.8)' : 'rgba(34, 197, 94, 0.8)',
                              isDarkMode ? 'rgba(239, 68, 68, 0.8)' : 'rgba(239, 68, 68, 0.8)'
                            ],
                            borderColor: [
                              isDarkMode ? 'rgba(34, 197, 94, 1)' : 'rgba(34, 197, 94, 1)',
                              isDarkMode ? 'rgba(239, 68, 68, 1)' : 'rgba(239, 68, 68, 1)'
                            ],
                            borderWidth: 2,
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom',
                              labels: {
                                color: isDarkMode ? '#ffffff' : '#000000',
                                padding: 20,
                                font: {
                                  size: 12
                                }
                              }
                            },
                            tooltip: {
                              backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                              titleColor: isDarkMode ? '#ffffff' : '#000000',
                              bodyColor: isDarkMode ? '#ffffff' : '#000000',
                              borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                              borderWidth: 1
                            }
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Average Patrols by District Chart */}
                  <div className={`rounded-xl p-6 transition-all duration-300 ${
                    isDarkMode ? 'bg-gradient-to-br from-gray-900/20 to-gray-800/10 border border-gray-600/20' : 'bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200'
                  }`}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`p-2 rounded-lg transition-all duration-300 ${
                        isDarkMode ? 'bg-blue-600/20' : 'bg-blue-100'
                      }`}>
                        <BarChart3 className={`w-5 h-5 transition-colors duration-300 ${
                          isDarkMode ? 'text-blue-400' : 'text-blue-600'
                        }`} />
                      </div>
                      <div>
                        <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                          isDarkMode ? 'text-blue-300' : 'text-blue-700'
                        }`}>Average Patrols by District</h3>
                        <p className={`text-sm transition-colors duration-300 ${
                          isDarkMode ? 'text-blue-400' : 'text-blue-600'
                        }`}>Performance comparison across districts</p>
                      </div>
                    </div>
                    
                    <div className="h-64">
                      <Bar
                        data={{
                          labels: [...new Set(filteredData.map(row => row.district))],
                          datasets: [{
                            label: 'Average Patrols',
                            data: [...new Set(filteredData.map(row => row.district))].map(district => {
                              const districtData = filteredData.filter(row => row.district === district);
                              const totalPatrols = districtData.reduce((sum, row) => 
                                sum + row.data.reduce((a, b) => a + b, 0), 0
                              );
                              return districtData.length > 0 ? Math.round(totalPatrols / districtData.length) : 0;
                            }),
                            backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.8)' : 'rgba(59, 130, 246, 0.8)',
                            borderColor: isDarkMode ? 'rgba(59, 130, 246, 1)' : 'rgba(59, 130, 246, 1)',
                            borderWidth: 1,
                            borderRadius: 4,
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false
                            },
                            tooltip: {
                              backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                              titleColor: isDarkMode ? '#ffffff' : '#000000',
                              bodyColor: isDarkMode ? '#ffffff' : '#000000',
                              borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                              borderWidth: 1
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              grid: {
                                color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                              },
                              ticks: {
                                color: isDarkMode ? '#ffffff' : '#000000'
                              }
                            },
                            x: {
                              grid: {
                                color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                              },
                              ticks: {
                                color: isDarkMode ? '#ffffff' : '#000000'
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Performance Trends Chart */}
                <div className={`rounded-xl p-6 transition-all duration-300 mb-8 ${
                  isDarkMode ? 'bg-gradient-to-br from-gray-900/20 to-gray-800/10 border border-gray-600/20' : 'bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200'
                }`}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`p-2 rounded-lg transition-all duration-300 ${
                      isDarkMode ? 'bg-green-600/20' : 'bg-green-100'
                    }`}>
                      <svg className={`w-5 h-5 transition-colors duration-300 ${
                        isDarkMode ? 'text-green-400' : 'text-green-600'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                        isDarkMode ? 'text-green-300' : 'text-green-700'
                      }`}>Performance Trends</h3>
                      <p className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-green-400' : 'text-green-600'
                      }`}>Daily patrol performance over the month</p>
                    </div>
                  </div>
                  
                  <div className="h-64">
                    <Line
                      data={{
                        labels: Array.from({ length: 31 }, (_, i) => `Day ${i + 1}`),
                        datasets: [
                          {
                            label: 'Active Municipalities',
                            data: Array.from({ length: 31 }, (_, dayIndex) => {
                              return filteredData.filter(row => {
                                const dayPatrols = row.data[dayIndex] || 0;
                                return dayPatrols >= 5;
                              }).length;
                            }),
                            borderColor: isDarkMode ? 'rgba(34, 197, 94, 1)' : 'rgba(34, 197, 94, 1)',
                            backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                            tension: 0.4,
                            fill: true
                          },
                          {
                            label: 'Inactive Municipalities',
                            data: Array.from({ length: 31 }, (_, dayIndex) => {
                              return filteredData.filter(row => {
                                const dayPatrols = row.data[dayIndex] || 0;
                                return dayPatrols <= 4;
                              }).length;
                            }),
                            borderColor: isDarkMode ? 'rgba(239, 68, 68, 1)' : 'rgba(239, 68, 68, 1)',
                            backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            tension: 0.4,
                            fill: true
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top',
                            labels: {
                              color: isDarkMode ? '#ffffff' : '#000000',
                              padding: 20,
                              font: {
                                size: 12
                              }
                            }
                          },
                          tooltip: {
                            backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                            titleColor: isDarkMode ? '#ffffff' : '#000000',
                            bodyColor: isDarkMode ? '#ffffff' : '#000000',
                            borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                            borderWidth: 1
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            grid: {
                              color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                            },
                            ticks: {
                              color: isDarkMode ? '#ffffff' : '#000000'
                            }
                          },
                          x: {
                            grid: {
                              color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                            },
                            ticks: {
                              color: isDarkMode ? '#ffffff' : '#000000',
                              maxTicksLimit: 10
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Detailed Lists */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Active Municipalities */}
                  <div className={`rounded-xl p-6 transition-all duration-300 ${
                    isDarkMode ? 'bg-gradient-to-br from-green-900/20 to-green-800/10 border border-green-600/20' : 'bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200'
                  }`}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`p-2 rounded-lg transition-all duration-300 ${
                        isDarkMode ? 'bg-green-600/20' : 'bg-green-100'
                      }`}>
                        <svg className={`w-5 h-5 transition-colors duration-300 ${
                          isDarkMode ? 'text-green-400' : 'text-green-600'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                          isDarkMode ? 'text-green-300' : 'text-green-700'
                        }`}>Active Municipalities</h3>
                        <p className={`text-sm transition-colors duration-300 ${
                          isDarkMode ? 'text-green-400' : 'text-green-600'
                        }`}>≥5 average patrols per day</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {(() => {
                        const activeMunicipalities = filteredData.filter(row => {
                          const avgPatrols = row.data.reduce((a, b) => a + b, 0) / row.data.length;
                          return avgPatrols >= 5;
                        });
                        
                        return activeMunicipalities.length > 0 ? (
                          activeMunicipalities.map((row, index) => {
                            const avgPatrols = Math.round(row.data.reduce((a, b) => a + b, 0) / row.data.length);
                            return (
                              <div key={index} className={`flex items-center justify-between p-3 rounded-lg transition-all duration-300 ${
                                isDarkMode ? 'bg-green-900/30 hover:bg-green-900/50' : 'bg-green-100/50 hover:bg-green-100'
                              }`}>
                                <div className="flex items-center gap-3">
                                  <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                    isDarkMode ? 'bg-green-400' : 'bg-green-600'
                                  }`}></div>
                                  <div>
                                    <span className={`font-medium transition-colors duration-300 ${
                                      isDarkMode ? 'text-green-200' : 'text-green-800'
                                    }`}>{row.municipality}</span>
                                    <p className={`text-xs transition-colors duration-300 ${
                                      isDarkMode ? 'text-green-400' : 'text-green-600'
                                    }`}>{row.district}</p>
                                  </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-sm font-bold transition-all duration-300 ${
                                  isDarkMode ? 'bg-green-600/30 text-green-300' : 'bg-green-200 text-green-700'
                                }`}>
                                  {avgPatrols} avg
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className={`text-center py-8 transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            <svg className={`w-12 h-12 mx-auto mb-3 transition-colors duration-300 ${
                              isDarkMode ? 'text-gray-600' : 'text-gray-400'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-sm">No active municipalities found</p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Inactive Municipalities */}
                  <div className={`rounded-xl p-6 transition-all duration-300 ${
                    isDarkMode ? 'bg-gradient-to-br from-red-900/20 to-red-800/10 border border-red-600/20' : 'bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200'
                  }`}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`p-2 rounded-lg transition-all duration-300 ${
                        isDarkMode ? 'bg-red-600/20' : 'bg-red-100'
                      }`}>
                        <svg className={`w-5 h-5 transition-colors duration-300 ${
                          isDarkMode ? 'text-red-400' : 'text-red-600'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <div>
                        <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                          isDarkMode ? 'text-red-300' : 'text-red-700'
                        }`}>Inactive Municipalities</h3>
                        <p className={`text-sm transition-colors duration-300 ${
                          isDarkMode ? 'text-red-400' : 'text-red-600'
                        }`}>≤4 average patrols per day</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {(() => {
                        const inactiveMunicipalities = filteredData.filter(row => {
                          const avgPatrols = row.data.reduce((a, b) => a + b, 0) / row.data.length;
                          return avgPatrols <= 4;
                        });
                        
                        return inactiveMunicipalities.length > 0 ? (
                          inactiveMunicipalities.map((row, index) => {
                            const avgPatrols = Math.round(row.data.reduce((a, b) => a + b, 0) / row.data.length);
                            return (
                              <div key={index} className={`flex items-center justify-between p-3 rounded-lg transition-all duration-300 ${
                                isDarkMode ? 'bg-red-900/30 hover:bg-red-900/50' : 'bg-red-100/50 hover:bg-red-100'
                              }`}>
                                <div className="flex items-center gap-3">
                                  <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                    isDarkMode ? 'bg-red-400' : 'bg-red-600'
                                  }`}></div>
                                  <div>
                                    <span className={`font-medium transition-colors duration-300 ${
                                      isDarkMode ? 'text-red-200' : 'text-red-800'
                                    }`}>{row.municipality}</span>
                                    <p className={`text-xs transition-colors duration-300 ${
                                      isDarkMode ? 'text-red-400' : 'text-red-600'
                                    }`}>{row.district}</p>
                                  </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-sm font-bold transition-all duration-300 ${
                                  isDarkMode ? 'bg-red-600/30 text-red-300' : 'bg-red-200 text-red-700'
                                }`}>
                                  {avgPatrols} avg
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className={`text-center py-8 transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            <svg className={`w-12 h-12 mx-auto mb-3 transition-colors duration-300 ${
                              isDarkMode ? 'text-gray-600' : 'text-gray-400'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-sm">No inactive municipalities found</p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Performance Criteria Section */}
                <div className={`mt-8 rounded-xl transition-all duration-300 ${
                  isDarkMode ? 'bg-gradient-to-br from-gray-900/40 to-gray-800/20 border border-gray-600/30' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200'
                }`}>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`p-3 rounded-xl transition-all duration-300 ${
                        isDarkMode ? 'bg-blue-600/20 border border-blue-500/30' : 'bg-blue-100 border border-blue-200'
                      }`}>
                        <svg className={`w-6 h-6 transition-colors duration-300 ${
                          isDarkMode ? 'text-blue-400' : 'text-blue-600'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className={`text-xl font-bold transition-colors duration-300 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>Performance Evaluation Criteria</h3>
                        <p className={`text-sm transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>Standards for assessing patrol effectiveness and municipality performance</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Active Performance Standards */}
                      <div className={`p-5 rounded-lg transition-all duration-300 ${
                        isDarkMode ? 'bg-green-900/20 border border-green-600/30' : 'bg-green-50 border border-green-200'
                      }`}>
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`p-2 rounded-lg transition-all duration-300 ${
                            isDarkMode ? 'bg-green-600/20' : 'bg-green-100'
                          }`}>
                            <CheckCircle className={`w-5 h-5 transition-colors duration-300 ${
                              isDarkMode ? 'text-green-400' : 'text-green-600'
                            }`} />
                          </div>
                          <h4 className={`text-lg font-semibold transition-colors duration-300 ${
                            isDarkMode ? 'text-green-300' : 'text-green-700'
                          }`}>Active Performance Standards</h4>
                        </div>
                        
                        <div className="space-y-3">
                          <div className={`p-3 rounded-lg transition-all duration-300 ${
                            isDarkMode ? 'bg-green-900/30' : 'bg-green-100/50'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className={`font-medium transition-colors duration-300 ${
                                isDarkMode ? 'text-green-200' : 'text-green-800'
                              }`}>Minimum Threshold</span>
                              <span className={`px-3 py-1 rounded-full text-sm font-bold transition-all duration-300 ${
                                isDarkMode ? 'bg-green-600/30 text-green-300' : 'bg-green-200 text-green-700'
                              }`}>≥5 patrols/day</span>
                            </div>
                            <p className={`text-sm transition-colors duration-300 ${
                              isDarkMode ? 'text-green-300' : 'text-green-600'
                            }`}>
                              Municipalities maintaining an average of 5 or more patrols per day are classified as active performers.
                            </p>
                          </div>
                          
                          <div className={`p-3 rounded-lg transition-all duration-300 ${
                            isDarkMode ? 'bg-green-900/30' : 'bg-green-100/50'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className={`font-medium transition-colors duration-300 ${
                                isDarkMode ? 'text-green-200' : 'text-green-800'
                              }`}>Performance Indicators</span>
                              <span className={`px-3 py-1 rounded-full text-sm font-bold transition-all duration-300 ${
                                isDarkMode ? 'bg-green-600/30 text-green-300' : 'bg-green-200 text-green-700'
                              }`}>Excellent</span>
                            </div>
                            <p className={`text-sm transition-colors duration-300 ${
                              isDarkMode ? 'text-green-300' : 'text-green-600'
                            }`}>
                              Demonstrates consistent patrol coverage, effective resource utilization, and strong operational commitment.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Inactive Performance Standards */}
                      <div className={`p-5 rounded-lg transition-all duration-300 ${
                        isDarkMode ? 'bg-red-900/20 border border-red-600/30' : 'bg-red-50 border border-red-200'
                      }`}>
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`p-2 rounded-lg transition-all duration-300 ${
                            isDarkMode ? 'bg-red-600/20' : 'bg-red-100'
                          }`}>
                            <svg className={`w-5 h-5 transition-colors duration-300 ${
                              isDarkMode ? 'text-red-400' : 'text-red-600'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                          <h4 className={`text-lg font-semibold transition-colors duration-300 ${
                            isDarkMode ? 'text-red-300' : 'text-red-700'
                          }`}>Inactive Performance Standards</h4>
                        </div>
                        
                        <div className="space-y-3">
                          <div className={`p-3 rounded-lg transition-all duration-300 ${
                            isDarkMode ? 'bg-red-900/30' : 'bg-red-100/50'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className={`font-medium transition-colors duration-300 ${
                                isDarkMode ? 'text-red-200' : 'text-red-800'
                              }`}>Minimum Threshold</span>
                              <span className={`px-3 py-1 rounded-full text-sm font-bold transition-all duration-300 ${
                                isDarkMode ? 'bg-red-600/30 text-red-300' : 'bg-red-200 text-red-700'
                              }`}>≤4 patrols/day</span>
                            </div>
                            <p className={`text-sm transition-colors duration-300 ${
                              isDarkMode ? 'text-red-300' : 'text-red-600'
                            }`}>
                              Municipalities with an average of 4 or fewer patrols per day require attention and improvement.
                            </p>
                          </div>
                          
                          <div className={`p-3 rounded-lg transition-all duration-300 ${
                            isDarkMode ? 'bg-red-900/30' : 'bg-red-100/50'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className={`font-medium transition-colors duration-300 ${
                                isDarkMode ? 'text-red-200' : 'text-red-800'
                              }`}>Performance Indicators</span>
                              <span className={`px-3 py-1 rounded-full text-sm font-bold transition-all duration-300 ${
                                isDarkMode ? 'bg-red-600/30 text-red-300' : 'bg-red-200 text-red-700'
                              }`}>Needs Improvement</span>
                            </div>
                            <p className={`text-sm transition-colors duration-300 ${
                              isDarkMode ? 'text-red-300' : 'text-red-600'
                            }`}>
                              Indicates potential resource constraints, operational challenges, or areas requiring strategic intervention.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Evaluation Methodology */}
                    <div className={`mt-6 p-5 rounded-lg transition-all duration-300 ${
                      isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/50 border border-gray-200'
                    }`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-lg transition-all duration-300 ${
                          isDarkMode ? 'bg-yellow-600/20' : 'bg-yellow-100'
                        }`}>
                          <svg className={`w-5 h-5 transition-colors duration-300 ${
                            isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h4 className={`text-lg font-semibold transition-colors duration-300 ${
                          isDarkMode ? 'text-yellow-300' : 'text-yellow-700'
                        }`}>Evaluation Methodology</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className={`p-3 rounded-lg transition-all duration-300 ${
                          isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100/50'
                        }`}>
                          <span className={`font-medium transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-200' : 'text-gray-800'
                          }`}>📊 Data Collection</span>
                          <p className={`mt-1 transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            Daily patrol data is collected and aggregated over the reporting period.
                          </p>
                        </div>
                        
                        <div className={`p-3 rounded-lg transition-all duration-300 ${
                          isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100/50'
                        }`}>
                          <span className={`font-medium transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-200' : 'text-gray-800'
                          }`}>📈 Analysis Process</span>
                          <p className={`mt-1 transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            Average daily patrols are calculated and compared against established thresholds.
                          </p>
                        </div>
                        
                        <div className={`p-3 rounded-lg transition-all duration-300 ${
                          isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100/50'
                        }`}>
                          <span className={`font-medium transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-200' : 'text-gray-800'
                          }`}>🎯 Classification</span>
                          <p className={`mt-1 transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            Municipalities are classified based on performance standards for strategic planning.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Key Insights */}
                    <div className={`mt-6 p-4 rounded-lg transition-all duration-300 ${
                      isDarkMode ? 'bg-blue-900/20 border border-blue-600/30' : 'bg-blue-50 border border-blue-200'
                    }`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg transition-all duration-300 ${
                          isDarkMode ? 'bg-blue-600/20' : 'bg-blue-100'
                        }`}>
                          <svg className={`w-5 h-5 transition-colors duration-300 ${
                            isDarkMode ? 'text-blue-400' : 'text-blue-600'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h5 className={`font-semibold transition-colors duration-300 ${
                          isDarkMode ? 'text-blue-300' : 'text-blue-700'
                        }`}>Key Insights for Discussion</h5>
                      </div>
                      
                      <div className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-blue-200' : 'text-blue-600'
                      }`}>
                        <p className="mb-2">
                          <strong>Performance Trends:</strong> Monitor changes in active vs inactive municipalities over time to identify improvement patterns or emerging challenges.
                        </p>
                        <p className="mb-2">
                          <strong>Resource Allocation:</strong> Use performance data to guide resource distribution and support initiatives for underperforming municipalities.
                        </p>
                        <p>
                          <strong>Strategic Planning:</strong> Leverage insights to develop targeted interventions and capacity-building programs for enhanced patrol effectiveness.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* No Data Message for Performance Tab */}
            {filteredData.length === 0 && (
              <div className={`rounded-2xl p-8 text-center shadow-lg transition-all duration-300 ${
                isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'
              }`}>
                <div className={`text-xl font-bold mb-3 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>No Data Available</div>
                <div className={`text-base mb-6 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {patrolData.length > 0 
                    ? "No data found for the selected filters. Try changing the district filter."
                    : "No patrol data has been entered. Add patrol data first."
                  }
                </div>
              </div>
            )}
          </>
        )}

        {/* Incidents Reports Tab */}
        {activeTab === "incidents" && (
          <>
            {/* Incidents Reports Content */}
            <div className={`rounded-2xl p-8 shadow-xl transition-all duration-300 ${
              isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700' : 'bg-gradient-to-br from-white via-gray-50 to-white border border-gray-200'
            }`}>
              {/* Header with Icon */}
              <div className="flex items-center gap-3 mb-8">
                <div className={`p-3 rounded-xl transition-all duration-300 ${
                  isDarkMode ? 'bg-red-600/20 border border-red-500/30' : 'bg-red-100 border border-red-200'
                }`}>
                  <svg className={`w-6 h-6 transition-colors duration-300 ${
                    isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h2 className={`text-2xl font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>Incidents Reports</h2>
                  <p className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Comprehensive analysis of incident data from the Incidents Reports module</p>
                </div>
              </div>

              {/* Generate Report Button */}
              <div className="flex flex-wrap gap-4 mb-8">
                <button
                  onClick={() => {
                    const incidentsReport = generateIncidentsReport();
                    alert(`Incidents Report Generated!\n\nTotal Incidents: ${incidentsReport.totalIncidents}\nResolved: ${incidentsReport.resolvedIncidents}\nPending: ${incidentsReport.pendingIncidents}\nUnder Investigation: ${incidentsReport.underInvestigation}\nResolution Rate: ${incidentsReport.resolutionRate}%\nMost Common Type: ${incidentsReport.mostCommonType}\nMost Active District: ${incidentsReport.mostActiveDistrict}`);
                  }}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                  }`}
                >
                  Generate Report
                </button>
                <button
                  onClick={() => {
                    const incidentsReport = generateIncidentsReport();
                    exportIncidentsToCSV(incidentsReport);
                  }}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg' 
                      : 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
                  }`}
                >
                  Export to CSV
                </button>
                <button
                  onClick={() => {
                    const incidentsReport = generateIncidentsReport();
                    exportIncidentsToPDF(incidentsReport);
                  }}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg' 
                      : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg'
                  }`}
                >
                  Export to PDF
                </button>
              </div>

              {/* Incidents Overview */}
              {incidentsData.length > 0 ? (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {(() => {
                      const incidentsReport = generateIncidentsReport();
                      return (
                        <>
                          <Card className={`p-6 transition-all duration-300 ${
                            isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className={`text-sm font-medium transition-colors duration-300 ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>Total Incidents</p>
                                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                  {incidentsReport.totalIncidents}
                                </p>
                              </div>
                              <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors duration-300 ${
                                isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'
                              }`}>
                                                 <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                              </div>
                            </div>
                          </Card>

                          <Card className={`p-6 transition-all duration-300 ${
                            isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className={`text-sm font-medium transition-colors duration-300 ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>Resolved</p>
                                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                                  {incidentsReport.resolvedIncidents}
                                </p>
                              </div>
                              <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors duration-300 ${
                                isDarkMode ? 'bg-green-900/30' : 'bg-green-100'
                              }`}>
                                <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                            </div>
                          </Card>

                          <Card className={`p-6 transition-all duration-300 ${
                            isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className={`text-sm font-medium transition-colors duration-300 ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>Resolution Rate</p>
                                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                                  {incidentsReport.resolutionRate}%
                                </p>
                              </div>
                              <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors duration-300 ${
                                isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100'
                              }`}>
                                <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                              </div>
                            </div>
                          </Card>

                          <Card className={`p-6 transition-all duration-300 ${
                            isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className={`text-sm font-medium transition-colors duration-300 ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>Most Common Type</p>
                                <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                                  {incidentsReport.mostCommonType}
                                </p>
                              </div>
                              <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors duration-300 ${
                                isDarkMode ? 'bg-orange-900/30' : 'bg-orange-100'
                              }`}>
                                <svg className="h-6 w-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                              </div>
                            </div>
                          </Card>
                        </>
                      );
                    })()}
                  </div>

                  {/* Incident Types Chart */}
                  <div className={`p-6 rounded-xl border-2 ${
                    isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    <h3 className={`text-xl font-bold mb-4 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Incident Types Distribution</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(() => {
                        const incidentsReport = generateIncidentsReport();
                        return Object.entries(incidentsReport.incidentTypeCounts).map(([type, count]) => (
                          <div key={type} className={`p-4 rounded-lg ${
                            isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className={`font-medium ${
                                isDarkMode ? 'text-gray-200' : 'text-gray-800'
                              }`}>{type}</span>
                              <Badge variant="secondary">{count}</Badge>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* District Analysis */}
                  <div className={`p-6 rounded-xl border-2 ${
                    isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    <h3 className={`text-xl font-bold mb-4 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>District Analysis</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(() => {
                        const incidentsReport = generateIncidentsReport();
                        return Object.entries(incidentsReport.districtCounts).map(([district, count]) => (
                          <div key={district} className={`p-4 rounded-lg ${
                            isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className={`font-medium ${
                                isDarkMode ? 'text-gray-200' : 'text-gray-800'
                              }`}>{district}</span>
                              <Badge variant="secondary">{count}</Badge>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Recent Incidents */}
                  <div className={`p-6 rounded-xl border-2 ${
                    isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    <h3 className={`text-xl font-bold mb-4 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Recent Incidents</h3>
                    <div className="space-y-3">
                      {incidentsData.slice(0, 5).map((incident, index) => (
                        <div key={index} className={`p-4 rounded-lg ${
                          isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`font-medium ${
                                isDarkMode ? 'text-gray-200' : 'text-gray-800'
                              }`}>{incident.incidentType}</p>
                              <p className={`text-sm ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>{incident.location}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={incident.status === 'Resolved' ? 'default' : 'secondary'}>
                                {incident.status}
                              </Badge>
                              <span className={`text-sm ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>{incident.date}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`text-center py-12 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <div className={`text-xl font-bold mb-3 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>No Incidents Data Available</div>
                  <p className="mb-4">No incidents data has been imported yet.</p>
                  <p className="text-sm">Go to the Incidents Reports page to add or import incidents data.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
} 
import React, { useState, useEffect } from "react";
import Layout from "./Layout";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { useData } from "./DataContext";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  FileText, 
  Download, 
  Calendar, 
  BarChart3, 
  TrendingUp, 
  Shield, 
  Users, 
  MapPin,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Search,
  Eye,
  Building2,
  Target,
  Star,
  Briefcase,
  ArrowRight,
  Plus,
  Settings,
  Database,
  PieChart,
  LineChart,
  Printer,
  XCircle,
  CheckCircle2
} from "lucide-react";

export default function Reports({ onLogout, onNavigate, currentPage }) {
  const { 
    actionReports, 
    incidents, 
    ipatrollerData, 
    summaryStats, 
    loading: dataLoading 
  } = useData();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDistrict, setSelectedDistrict] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [paperSize, setPaperSize] = useState("short"); // "short" for Letter, "long" for Legal

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
    
    // Header with better formatting
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('I-Patroller Summary Report', paperConfig.margin, 30);
    
    // Paper size indicator
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Paper: ${paperConfig.name}`, paperConfig.margin, 40);
    
    // Date and filters with better spacing
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, paperConfig.margin, 50);
    doc.text(`Month: ${months[selectedMonth]}`, paperConfig.margin, 60);
    doc.text(`Year: ${selectedYear}`, paperConfig.margin, 70);
    doc.text(`District: ${selectedDistrict === 'all' ? 'All Districts' : selectedDistrict}`, paperConfig.margin, 80);
    
    // Overall Summary (matching I-Patroller exactly)
    const overallSummary = calculateOverallSummary();
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Overall Summary Statistics', paperConfig.margin, 100);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`• Total Patrols: ${overallSummary.totalPatrols.toLocaleString()}`, paperConfig.margin, 115);
    doc.text(`• Total Active Days: ${overallSummary.totalActive.toLocaleString()}`, paperConfig.margin, 125);
    doc.text(`• Total Inactive Days: ${overallSummary.totalInactive.toLocaleString()}`, paperConfig.margin, 135);
    doc.text(`• Average Active Percentage: ${overallSummary.avgActivePercentage}%`, paperConfig.margin, 145);
    doc.text(`• Total Municipalities: ${overallSummary.municipalityCount}`, paperConfig.margin, 155);
    
    // Municipality Performance Table with autofit
    if (ipatrollerData && ipatrollerData.length > 0) {
      let filteredData = selectedDistrict === 'all' 
        ? ipatrollerData 
        : ipatrollerData.filter(item => item.district === selectedDistrict);
      
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
        startY: 175,
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
    
    // Header with better formatting
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Action Center Report', paperConfig.margin, 30);
    
    // Paper size indicator
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Paper: ${paperConfig.name}`, paperConfig.margin, 40);
    
    // Date and filters with better spacing
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, paperConfig.margin, 50);
    doc.text(`Month: ${months[selectedMonth]}`, paperConfig.margin, 60);
    doc.text(`Year: ${selectedYear}`, paperConfig.margin, 70);
    doc.text(`District: ${selectedDistrict === 'all' ? 'All Districts' : selectedDistrict}`, paperConfig.margin, 80);
    
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
    
    doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
    doc.text('Department Statistics', paperConfig.margin, 100);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
    doc.text(`Total Action Reports: ${filteredActions.length}`, paperConfig.margin, 115);
    
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

  // Incidents Report (matching Incidents Reports data structure)
  const generateIncidentsReport = () => {
    const paperConfig = getPaperConfig(paperSize);
    const doc = new jsPDF('p', 'mm', paperConfig.format);
    
    // Header with better formatting
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Incidents Report', paperConfig.margin, 30);
    
    // Paper size indicator
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Paper: ${paperConfig.name}`, paperConfig.margin, 40);
    
    // Date and filters with better spacing
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, paperConfig.margin, 50);
    doc.text(`Month: ${months[selectedMonth]}`, paperConfig.margin, 60);
    doc.text(`Year: ${selectedYear}`, paperConfig.margin, 70);
    doc.text(`District: ${selectedDistrict === 'all' ? 'All Districts' : selectedDistrict}`, paperConfig.margin, 80);
    
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
    
    doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
    doc.text('Incident Statistics', paperConfig.margin, 100);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
    doc.text(`Total Incidents: ${filteredIncidents.length}`, paperConfig.margin, 115);
    doc.text(`Active Cases: ${filteredIncidents.filter(i => i.status === 'Active').length}`, paperConfig.margin, 125);
    doc.text(`Resolved Cases: ${filteredIncidents.filter(i => i.status === 'Resolved').length}`, paperConfig.margin, 135);
    
    // Incident type breakdown table with autofit
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
      
      autoTable(doc, {
        head: [['Incident Type', 'Total', 'Active', 'Resolved', 'Resolution Rate']],
        body: tableData,
        startY: 155,
        styles: { 
          fontSize: paperSize === 'long' ? 10 : 9, 
          cellPadding: 4,
          overflow: 'linebreak',
          halign: 'left'
        },
        headStyles: { 
          fillColor: [239, 68, 68], 
          fontStyle: 'bold',
          textColor: [255, 255, 255],
          fontSize: paperSize === 'long' ? 11 : 10
        },
        columnStyles: getColumnWidths(paperSize, 'incidents'),
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
      doc.text('No incidents available for the selected period.', paperConfig.margin, 155);
    }
    
    doc.save(`incidents-${months[selectedMonth]}-${selectedYear}-${paperSize}.pdf`);
  };













  const generateAllReports = async () => {
    setIsGenerating(true);
    
    try {
      // Generate all specific reports with proper error handling
      const reportFunctions = [
        { name: 'I-Patroller Summary', func: generateIPatrollerSummaryReport },
        { name: 'Action Center Report', func: generateActionCenterReport },
        { name: 'Incidents Report', func: generateIncidentsReport }
      ];

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < reportFunctions.length; i++) {
        try {
          await new Promise(resolve => setTimeout(resolve, 200)); // Small delay between reports
          reportFunctions[i].func();
          successCount++;
        } catch (error) {
          console.error(`Error generating ${reportFunctions[i].name}:`, error);
          errorCount++;
        }
      }
      
      // Show success message with details
      if (errorCount === 0) {
        alert(`All ${successCount} reports generated successfully! Check your downloads folder.`);
      } else {
        alert(`${successCount} reports generated successfully, ${errorCount} failed. Check console for details.`);
      }
    } catch (error) {
      console.error('Error generating reports:', error);
      alert('Error generating reports. Please try again.');
    } finally {
      setIsGenerating(false);
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
          name: "I-Patroller Summary",
          description: "Complete patrol statistics matching I-Patroller page exactly",
          action: generateIPatrollerSummaryReport,
          formats: ["PDF"],
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
          name: "Action Center Report",
          description: "Department statistics and action reports matching Action Center page",
          action: generateActionCenterReport,
          formats: ["PDF"],
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
          name: "Incidents Report",
          description: "Incident statistics and analysis matching Incidents Reports page",
          action: generateIncidentsReport,
          formats: ["PDF"],
          priority: "high"
        }
      ]
    }
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getFormatColor = (format) => {
    switch (format) {
      case "PDF": return "bg-red-100 text-red-700";
      case "Excel": return "bg-green-100 text-green-700";
      case "CSV": return "bg-blue-100 text-blue-700";
      case "PNG": return "bg-purple-100 text-purple-700";
      case "JPG": return "bg-orange-100 text-orange-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const filteredSections = reportSections.filter(section => {
    if (!searchTerm) return true;
    return section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           section.reports.some(report => 
             report.name.toLowerCase().includes(searchTerm.toLowerCase())
           );
  });

  // Show loading state while data is being fetched
  if (dataLoading) {
    return (
      <Layout onLogout={handleLogout} onNavigate={onNavigate} currentPage={currentPage}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading report data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout onLogout={handleLogout} onNavigate={onNavigate} currentPage={currentPage}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Reports Center
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
              Generate comprehensive reports across all system modules. Select your report type, apply filters, and export in your preferred format.
            </p>
            
            {/* Paper Size Indicator */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6 max-w-md mx-auto">
              <div className="flex items-center justify-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">Paper Size</p>
                  <p className="text-lg font-bold text-blue-600">
                    {paperSize === 'short' ? 'Short Bond (Letter)' : 'Long Bond (Legal)'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Data availability warning */}
            {(!ipatrollerData || ipatrollerData.length === 0) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                  <p className="text-yellow-800 text-sm">
                    <strong>Note:</strong> No patrol data found for the current period. Some reports may show limited information.
                  </p>
                </div>
              </div>
            )}
            
            <Button
              onClick={generateAllReports}
              disabled={isGenerating}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  Generating All Reports...
                </>
              ) : (
                <>
                  <Printer className="w-6 h-6 mr-3" />
                  Generate All Reports
                </>
              )}
            </Button>
          </div>

          {/* Quick Stats - Matching exact data from each page */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white shadow-lg border-0 rounded-xl hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Patrols</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {calculateOverallSummary().totalPatrols.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Shield className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg border-0 rounded-xl hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Active Days</p>
                    <p className="text-3xl font-bold text-green-600">
                      {calculateOverallSummary().totalActive.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-xl">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg border-0 rounded-xl hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Inactive Days</p>
                    <p className="text-3xl font-bold text-red-600">
                      {calculateOverallSummary().totalInactive.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-xl">
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg border-0 rounded-xl hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Avg Active %</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {calculateOverallSummary().avgActivePercentage}%
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Target className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white shadow-lg border-0 rounded-xl hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Action Reports</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {actionReports?.length || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Target className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg border-0 rounded-xl hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Incidents</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {incidents?.length || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-xl">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg border-0 rounded-xl hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Municipalities</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {calculateOverallSummary().municipalityCount}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Building2 className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Report Filters */}
          <Card className="mb-8 bg-white shadow-lg border-0 rounded-xl">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Filter className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Report Filters</h3>
                    <p className="text-sm text-gray-600">Refine your report data</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">Month</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      {months.map((month, index) => (
                        <option key={index} value={index}>{month}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">Year</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      {[2023, 2024, 2025, 2026, 2027].map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">District</label>
                    <select
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      {districts.map((district) => (
                        <option key={district} value={district}>
                          {district === "all" ? "All Districts" : district}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">Paper Size</label>
                    <select
                      value={paperSize}
                      onChange={(e) => setPaperSize(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="short">Short Bond (Letter)</option>
                      <option value="long">Long Bond (Legal)</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search */}
          <div className="mb-8">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
              />
            </div>
          </div>

          {/* Report Sections */}
          <div className="space-y-8">
            {filteredSections.map((section) => (
              <Card key={section.id} className="bg-white shadow-lg border-0 overflow-hidden rounded-xl hover:shadow-xl transition-all duration-300">
                <CardHeader className={`bg-gradient-to-r ${section.color} text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {section.icon}
                      <div>
                        <CardTitle className="text-xl">{section.title}</CardTitle>
                        <p className="text-blue-100 text-sm mt-1">{section.description}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {section.reports.map((report, index) => (
                      <div key={index} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-blue-200 bg-gray-50/50">
                        <div className="flex items-start justify-between mb-4">
                          <h4 className="font-semibold text-gray-900 text-lg">{report.name}</h4>
                          <Badge className={`${getPriorityColor(report.priority)} text-xs px-3 py-1`}>
                            {report.priority}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-6 leading-relaxed">{report.description}</p>
                        
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">Available Formats:</p>
                            <div className="flex flex-wrap gap-2">
                              {report.formats.map((format) => (
                                <span
                                  key={format}
                                  className={`px-3 py-1 text-xs rounded-full font-medium ${getFormatColor(format)}`}
                                >
                                  {format}
                                </span>
                              ))}
                            </div>
                          </div>
                          
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
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50 py-3 rounded-lg transition-all duration-200 hover:shadow-md"
                          >
                            {isGenerating ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Generating...
                              </>
                            ) : (
                              <>
                                <Printer className="w-4 h-4 mr-2" />
                                Generate PDF
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <Card className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl rounded-xl overflow-hidden">
            <CardContent className="p-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-4">Need Help with Reports?</h3>
                <p className="text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed">
                  Navigate directly to any module to access detailed reports, analytics, and export options. Each section provides comprehensive data and multiple export formats.
                </p>
                
                <div className="flex flex-wrap justify-center gap-4">
                  <Button
                    onClick={() => onNavigate('dashboard')}
                    className="bg-white text-blue-600 hover:bg-gray-100 px-6 py-3 rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-105"
                  >
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Dashboard Analytics
                  </Button>
                  
                  <Button
                    onClick={() => onNavigate('ipatroller')}
                    className="bg-white text-blue-600 hover:bg-gray-100 px-6 py-3 rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-105"
                  >
                    <Shield className="w-5 h-5 mr-2" />
                    Patrol Data
                  </Button>
                  
                  <Button
                    onClick={() => onNavigate('incidents')}
                    className="bg-white text-blue-600 hover:bg-gray-100 px-6 py-3 rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-105"
                  >
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Incident Reports
                  </Button>
                  
                  <Button
                    onClick={() => onNavigate('actioncenter')}
                    className="bg-white text-blue-600 hover:bg-gray-100 px-6 py-3 rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-105"
                  >
                    <Target className="w-5 h-5 mr-2" />
                    Action Center
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer Info */}
          <div className="mt-12 text-center text-gray-500 text-sm">
            <p>Reports are generated based on current filters and data availability.</p>
            <p className="mt-1">For custom reports or additional formats, please contact your system administrator.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

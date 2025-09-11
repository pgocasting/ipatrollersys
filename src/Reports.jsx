import React, { useState, useEffect } from "react";
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
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Shield, 
  AlertTriangle,
  Filter,
  Target,
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

  // Incidents Report (matching Incidents Reports data structure)
  const generateIncidentsReport = () => {
    const paperConfig = getPaperConfig(paperSize);
    const doc = new jsPDF('p', 'mm', paperConfig.format);
    
    // Calculate center position
    const pageWidth = doc.internal.pageSize.getWidth();
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
    
    // Report info section with better organization
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Report Information', centerX, 60, { align: 'center' });
    
    // Info box
    const infoY = 70;
    doc.setFillColor(248, 250, 252);
    doc.rect(paperConfig.margin, infoY - 5, pageWidth - (paperConfig.margin * 2), 40, 'F');
    doc.setDrawColor(239, 68, 68);
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
    
    // Incident Statistics section with better design
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Incident Statistics', centerX, 130, { align: 'center' });
    
    // Statistics box - centered and properly sized
    const statsY = 140;
    const boxWidth = pageWidth - (paperConfig.margin * 2);
    const boxHeight = 50;
    
    doc.setFillColor(254, 242, 242);
    doc.rect(paperConfig.margin, statsY - 5, boxWidth, boxHeight, 'F');
    doc.setDrawColor(239, 68, 68);
    doc.rect(paperConfig.margin, statsY - 5, boxWidth, boxHeight, 'S');
    
    // Statistics in organized layout - centered
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const textStartX = paperConfig.margin + 15;
    const lineHeight = 12;
    
    doc.text(`Total Incidents: ${filteredIncidents.length}`, textStartX, statsY + 10);
    doc.text(`Active Cases: ${filteredIncidents.filter(i => i.status === 'Active').length}`, textStartX, statsY + 10 + lineHeight);
    doc.text(`Resolved Cases: ${filteredIncidents.filter(i => i.status === 'Resolved').length}`, textStartX, statsY + 10 + (lineHeight * 2));
    
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
      <div className="container mx-auto p-6 space-y-8">
          
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports Center</h1>
              <p className="text-gray-500 mt-2">Generate comprehensive reports across all system modules</p>
            </div>
            <Button
              onClick={generateAllReports}
              disabled={isGenerating}
              className="bg-black hover:bg-black/90 text-white"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating All Reports...
                </>
              ) : (
                <>
                  <Printer className="mr-2 h-4 w-4" />
                  Generate All Reports
                </>
              )}
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-white shadow-sm border border-gray-200">
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

            <Card className="bg-white shadow-sm border border-gray-200">
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

            <Card className="bg-white shadow-sm border border-gray-200">
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

            <Card className="bg-white shadow-sm border border-gray-200">
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

          {/* Report Filters */}
          <Card className="bg-white shadow-sm border border-gray-200">
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
                    <Label htmlFor="month-select" className="text-xs font-medium text-gray-600">Month</Label>
                    <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month, index) => (
                          <SelectItem key={index} value={index.toString()}>{month}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="year-select" className="text-xs font-medium text-gray-600">Year</Label>
                    <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                      <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {[2023, 2024, 2025, 2026, 2027].map(year => (
                          <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="district-select" className="text-xs font-medium text-gray-600">District</Label>
                    <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Select district" />
                      </SelectTrigger>
                      <SelectContent>
                        {districts.map((district) => (
                          <SelectItem key={district} value={district}>
                            {district === "all" ? "All Districts" : district}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="paper-size-select" className="text-xs font-medium text-gray-600">Paper Size</Label>
                    <Select value={paperSize} onValueChange={setPaperSize}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select paper size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Short Bond (Letter)</SelectItem>
                        <SelectItem value="long">Long Bond (Legal)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reports Table */}
          <div className="border rounded-md border-gray-200 shadow-sm">
            <Table className="border-gray-200">
              <TableCaption className="text-slate-500">Available reports for generation.</TableCaption>
              <TableHeader>
                <TableRow className="border-b border-gray-200">
                  <TableHead className="w-[200px] border-gray-200">Report Type</TableHead>
                  <TableHead className="border-gray-200">Description</TableHead>
                  <TableHead className="border-gray-200">Priority</TableHead>
                  <TableHead className="border-gray-200">Formats</TableHead>
                  <TableHead className="text-right border-gray-200">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportSections.map((section) => 
                  section.reports.map((report, index) => (
                    <TableRow key={`${section.id}-${index}`} className="border-gray-200">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {section.icon}
                          {report.name}
                        </div>
                      </TableCell>
                      <TableCell>{report.description}</TableCell>
                      <TableCell>
                        <Badge className={`${getPriorityColor(report.priority)} text-xs px-2 py-1`}>
                          {report.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {report.formats.map((format) => (
                            <Badge
                              key={format}
                              variant="secondary"
                              className={`text-xs ${getFormatColor(format)}`}
                            >
                              {format}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
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
                          variant="ghost"
                          size="sm"
                        >
                          {isGenerating ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                              Generating...
                            </>
                          ) : (
                            <>
                              <Printer className="w-4 h-4 mr-2" />
                              Generate
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

        </div>
      </Layout>
    );
  }

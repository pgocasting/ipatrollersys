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
  Printer
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

  // Report generation functions
  const generateTopPerformersReport = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Top Performers Ranking Report', 20, 30);
    
    // Date and filters
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45);
    doc.text(`Month: ${months[selectedMonth]}`, 20, 55);
    doc.text(`Year: ${selectedYear}`, 20, 65);
    doc.text(`District: ${selectedDistrict === 'all' ? 'All Districts' : selectedDistrict}`, 20, 75);
    
    // Performance Analysis
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Top 12 Performers Analysis', 20, 95);
    
    if (ipatrollerData && ipatrollerData.length > 0) {
      let filteredData = selectedDistrict === 'all' 
        ? ipatrollerData 
        : ipatrollerData.filter(item => item.district === selectedDistrict);
      
      // Sort by total active days and get top 12
      const topPerformers = [...filteredData]
        .sort((a, b) => (b.activeDays || 0) - (a.activeDays || 0))
        .slice(0, 12);
      
      const tableData = topPerformers.map((item, index) => {
        const totalActive = item.activeDays || 0;
        const totalInactive = item.inactiveDays || 0;
        const activePercentage = totalActive + totalInactive > 0 
          ? ((totalActive / (totalActive + totalInactive)) * 100).toFixed(1)
          : '0.0';
        
        let status = 'Needs Improvement';
        if (parseFloat(activePercentage) === 100) status = 'Very Satisfactory';
        else if (parseFloat(activePercentage) >= 75) status = 'Very Good';
        else if (parseFloat(activePercentage) >= 50) status = 'Good';
        
        return [
          index + 1,
          item.municipality || 'N/A',
          item.district || 'N/A',
          totalActive,
          totalInactive,
          `${activePercentage}%`,
          status
        ];
      });
      
      autoTable(doc, {
        head: [['Rank', 'Municipality', 'District', 'Total Active', 'Total Inactive', 'Active %', 'Status']],
        body: tableData,
        startY: 110,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' },
        columnStyles: {
          0: { halign: 'center' },
          3: { halign: 'center' },
          4: { halign: 'center' },
          5: { halign: 'center' },
          6: { halign: 'center' }
        }
      });
      
      // Summary statistics
      const finalY = doc.lastAutoTable.finalY + 20;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary Statistics', 20, finalY);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const totalMunicipalities = topPerformers.length;
      const avgActive = topPerformers.reduce((sum, item) => sum + (item.activeDays || 0), 0) / totalMunicipalities;
      const topPerformer = topPerformers[0];
      
      doc.text(`• Total Municipalities Analyzed: ${totalMunicipalities}`, 20, finalY + 15);
      doc.text(`• Average Active Days: ${avgActive.toFixed(1)}`, 20, finalY + 25);
      doc.text(`• Top Performer: ${topPerformer?.municipality || 'N/A'} (${topPerformer?.activeDays || 0} active days)`, 20, finalY + 35);
      doc.text(`• Report Period: ${months[selectedMonth]} ${selectedYear}`, 20, finalY + 45);
    }
    
    doc.save(`top-performers-ranking-${months[selectedMonth]}-${selectedYear}.pdf`);
  };

  const generateSystemOverviewReport = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('System Overview Report', 20, 30);
    
    // Date and filters
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45);
    doc.text(`Month: ${months[selectedMonth]}`, 20, 55);
    doc.text(`Year: ${selectedYear}`, 20, 65);
    doc.text(`District: ${selectedDistrict === 'all' ? 'All Districts' : selectedDistrict}`, 20, 75);
    
    // System Statistics
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Complete System Statistics', 20, 95);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Municipalities: ${ipatrollerData?.length || 0}`, 20, 110);
    doc.text(`Total Incidents Recorded: ${incidents?.length || 0}`, 20, 120);
    doc.text(`Total Actions Taken: ${actionReports?.length || 0}`, 20, 130);
    
    // Districts breakdown
    if (ipatrollerData && ipatrollerData.length > 0) {
      const districtStats = {};
      ipatrollerData.forEach(item => {
        if (!districtStats[item.district]) {
          districtStats[item.district] = { count: 0, totalActive: 0, totalPatrols: 0 };
        }
        districtStats[item.district].count++;
        districtStats[item.district].totalActive += item.activeDays || 0;
        districtStats[item.district].totalPatrols += item.totalPatrols || 0;
      });
      
      const tableData = Object.entries(districtStats).map(([district, stats]) => [
        district || 'N/A',
        stats.count,
        stats.totalActive,
        stats.totalPatrols,
        `${((stats.totalActive / stats.count) || 0).toFixed(1)}`
      ]);
      
      autoTable(doc, {
        head: [['District', 'Municipalities', 'Total Active Days', 'Total Patrols', 'Avg Active/Municipality']],
        body: tableData,
        startY: 150,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' }
      });
    }
    
    doc.save(`system-overview-${months[selectedMonth]}-${selectedYear}.pdf`);
  };

  const generateDailyPatrolSummary = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Daily Patrol Summary Report', 20, 30);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45);
    doc.text(`Month: ${months[selectedMonth]}`, 20, 55);
    doc.text(`Year: ${selectedYear}`, 20, 65);
    doc.text(`District: ${selectedDistrict === 'all' ? 'All Districts' : selectedDistrict}`, 20, 75);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Daily Patrol Counts by Municipality', 20, 95);
    
    if (ipatrollerData && ipatrollerData.length > 0) {
      const filteredData = selectedDistrict === 'all' 
        ? ipatrollerData 
        : ipatrollerData.filter(item => item.district === selectedDistrict);
      
      const tableData = filteredData.map(item => [
        item.municipality || 'N/A',
        item.district || 'N/A',
        item.activeDays || 0,
        item.inactiveDays || 0,
        (item.activeDays || 0) + (item.inactiveDays || 0),
        `${((item.activeDays / 31) * 100).toFixed(1)}%`
      ]);
      
      autoTable(doc, {
        head: [['Municipality', 'District', 'Active Days', 'Inactive Days', 'Total Days', 'Activity Rate']],
        body: tableData,
        startY: 110,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [34, 197, 94], fontStyle: 'bold' }
      });
      
      // Summary
      const finalY = doc.lastAutoTable.finalY + 20;
      const totalActive = filteredData.reduce((sum, item) => sum + (item.activeDays || 0), 0);
      const totalInactive = filteredData.reduce((sum, item) => sum + (item.inactiveDays || 0), 0);
      const avgActivity = filteredData.length > 0 ? (totalActive / (totalActive + totalInactive) * 100).toFixed(1) : 0;
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary', 20, finalY);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`• Total Active Days: ${totalActive}`, 20, finalY + 15);
      doc.text(`• Total Inactive Days: ${totalInactive}`, 20, finalY + 25);
      doc.text(`• Overall Activity Rate: ${avgActivity}%`, 20, finalY + 35);
    }
    
    doc.save(`daily-patrol-summary-${months[selectedMonth]}-${selectedYear}.pdf`);
  };

  const generateMonthlyPerformance = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Monthly Performance Analysis', 20, 30);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45);
    doc.text(`Analysis Period: ${months[selectedMonth]} ${selectedYear}`, 20, 55);
    doc.text(`District: ${selectedDistrict === 'all' ? 'All Districts' : selectedDistrict}`, 20, 65);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Performance Metrics', 20, 85);
    
    if (ipatrollerData && ipatrollerData.length > 0) {
      const filteredData = selectedDistrict === 'all' 
        ? ipatrollerData 
        : ipatrollerData.filter(item => item.district === selectedDistrict);
      
      const tableData = filteredData.map(item => {
        const totalActive = item.activeDays || 0;
        const totalInactive = item.inactiveDays || 0;
        const totalDays = totalActive + totalInactive;
        const efficiency = totalDays > 0 ? ((totalActive / totalDays) * 100).toFixed(1) : '0.0';
        
        let performance = 'Poor';
        if (parseFloat(efficiency) >= 80) performance = 'Excellent';
        else if (parseFloat(efficiency) >= 65) performance = 'Good';
        else if (parseFloat(efficiency) >= 50) performance = 'Average';
        
        return [
          item.municipality || 'N/A',
          item.district || 'N/A',
          totalActive,
          totalDays,
          `${efficiency}%`,
          performance
        ];
      });
      
      autoTable(doc, {
        head: [['Municipality', 'District', 'Active Days', 'Total Days', 'Efficiency', 'Performance']],
        body: tableData,
        startY: 100,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [34, 197, 94], fontStyle: 'bold' }
      });
    }
    
    doc.save(`monthly-performance-${months[selectedMonth]}-${selectedYear}.pdf`);
  };

  const generateDistrictComparison = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('District Performance Comparison', 20, 30);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45);
    doc.text(`Month: ${months[selectedMonth]}`, 20, 55);
    doc.text(`Year: ${selectedYear}`, 20, 65);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Cross-District Performance Analysis', 20, 85);
    
    if (ipatrollerData && ipatrollerData.length > 0) {
      const districtStats = {};
      ipatrollerData.forEach(item => {
        if (!districtStats[item.district]) {
          districtStats[item.district] = { 
            municipalities: 0, 
            totalActive: 0, 
            totalInactive: 0,
            totalPatrols: 0 
          };
        }
        districtStats[item.district].municipalities++;
        districtStats[item.district].totalActive += item.activeDays || 0;
        districtStats[item.district].totalInactive += item.inactiveDays || 0;
        districtStats[item.district].totalPatrols += item.totalPatrols || 0;
      });
      
      const tableData = Object.entries(districtStats).map(([district, stats]) => {
        const totalDays = stats.totalActive + stats.totalInactive;
        const avgEfficiency = totalDays > 0 ? ((stats.totalActive / totalDays) * 100).toFixed(1) : '0.0';
        const avgActivePerMunicipality = (stats.totalActive / stats.municipalities).toFixed(1);
        
        return [
          district || 'N/A',
          stats.municipalities,
          stats.totalActive,
          stats.totalInactive,
          `${avgEfficiency}%`,
          avgActivePerMunicipality
        ];
      });
      
      autoTable(doc, {
        head: [['District', 'Municipalities', 'Total Active', 'Total Inactive', 'Efficiency', 'Avg Active/Municipality']],
        body: tableData,
        startY: 100,
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: [34, 197, 94], fontStyle: 'bold' }
      });
    }
    
    doc.save(`district-comparison-${months[selectedMonth]}-${selectedYear}.pdf`);
  };

  const generateCrimeAnalysis = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Crime Analysis Report', 20, 30);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45);
    doc.text(`Analysis Period: ${months[selectedMonth]} ${selectedYear}`, 20, 55);
    doc.text(`District: ${selectedDistrict === 'all' ? 'All Districts' : selectedDistrict}`, 20, 65);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Crime Statistics and Patterns', 20, 85);
    
    if (incidents && incidents.length > 0) {
      let filteredIncidents = incidents.filter(incident => {
        const incidentDate = new Date(incident.date);
        const matchesMonth = incidentDate.getMonth() === selectedMonth && incidentDate.getFullYear() === selectedYear;
        const matchesDistrict = selectedDistrict === 'all' || incident.district === selectedDistrict;
        return matchesMonth && matchesDistrict;
      });
      
      // Crime type analysis
      const crimeTypes = {};
      filteredIncidents.forEach(incident => {
        const type = incident.incidentType || 'Unknown';
        crimeTypes[type] = (crimeTypes[type] || 0) + 1;
      });
      
      const crimeTableData = Object.entries(crimeTypes)
        .sort(([,a], [,b]) => b - a)
        .map(([type, count]) => [
          type,
          count,
          `${((count / filteredIncidents.length) * 100).toFixed(1)}%`
        ]);
      
      autoTable(doc, {
        head: [['Crime Type', 'Count', 'Percentage']],
        body: crimeTableData,
        startY: 100,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [239, 68, 68], fontStyle: 'bold' }
      });
      
      // Summary statistics
      const finalY = doc.lastAutoTable.finalY + 20;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Analysis Summary', 20, finalY);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const activeIncidents = filteredIncidents.filter(i => i.status === 'Active').length;
      const resolvedIncidents = filteredIncidents.filter(i => i.status === 'Resolved').length;
      const mostCommonCrime = Object.entries(crimeTypes).sort(([,a], [,b]) => b - a)[0];
      
      doc.text(`• Total Incidents: ${filteredIncidents.length}`, 20, finalY + 15);
      doc.text(`• Active Cases: ${activeIncidents}`, 20, finalY + 25);
      doc.text(`• Resolved Cases: ${resolvedIncidents}`, 20, finalY + 35);
      doc.text(`• Most Common: ${mostCommonCrime ? mostCommonCrime[0] : 'N/A'} (${mostCommonCrime ? mostCommonCrime[1] : 0} cases)`, 20, finalY + 45);
    }
    
    doc.save(`crime-analysis-${months[selectedMonth]}-${selectedYear}.pdf`);
  };

  const generateIncidentSummary = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Incident Summary Report', 20, 30);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45);
    doc.text(`Month: ${months[selectedMonth]}`, 20, 55);
    doc.text(`Year: ${selectedYear}`, 20, 65);
    doc.text(`District: ${selectedDistrict === 'all' ? 'All Districts' : selectedDistrict}`, 20, 75);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Detailed Incident Logs and Status', 20, 95);
    
    if (incidents && incidents.length > 0) {
      let filteredIncidents = incidents.filter(incident => {
        const incidentDate = new Date(incident.date);
        const matchesMonth = incidentDate.getMonth() === selectedMonth && incidentDate.getFullYear() === selectedYear;
        const matchesDistrict = selectedDistrict === 'all' || incident.district === selectedDistrict;
        return matchesMonth && matchesDistrict;
      });
      
      const tableData = filteredIncidents.map(incident => [
        incident.incidentType || 'N/A',
        incident.date || 'N/A',
        incident.time || 'N/A',
        incident.location || 'N/A',
        incident.municipality || 'N/A',
        incident.status || 'N/A',
        incident.officer || 'N/A'
      ]);
      
      autoTable(doc, {
        head: [['Type', 'Date', 'Time', 'Location', 'Municipality', 'Status', 'Officer']],
        body: tableData,
        startY: 110,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [239, 68, 68], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 20 },
          2: { cellWidth: 15 },
          3: { cellWidth: 30 },
          4: { cellWidth: 25 },
          5: { cellWidth: 20 },
          6: { cellWidth: 25 }
        }
      });
    }
    
    doc.save(`incident-summary-${months[selectedMonth]}-${selectedYear}.pdf`);
  };

  const generateMonthlyTrends = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Monthly Incident Trends Analysis', 20, 30);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45);
    doc.text(`Analysis Month: ${months[selectedMonth]} ${selectedYear}`, 20, 55);
    doc.text(`District: ${selectedDistrict === 'all' ? 'All Districts' : selectedDistrict}`, 20, 65);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Incident Type Trends and Patterns', 20, 85);
    
    if (incidents && incidents.length > 0) {
      let filteredIncidents = incidents.filter(incident => {
        const incidentDate = new Date(incident.date);
        const matchesMonth = incidentDate.getMonth() === selectedMonth && incidentDate.getFullYear() === selectedYear;
        const matchesDistrict = selectedDistrict === 'all' || incident.district === selectedDistrict;
        return matchesMonth && matchesDistrict;
      });
      
      // District breakdown
      const districtBreakdown = {};
      filteredIncidents.forEach(incident => {
        const district = incident.district || 'Unknown';
        if (!districtBreakdown[district]) {
          districtBreakdown[district] = { total: 0, active: 0, resolved: 0 };
        }
        districtBreakdown[district].total++;
        if (incident.status === 'Active') districtBreakdown[district].active++;
        if (incident.status === 'Resolved') districtBreakdown[district].resolved++;
      });
      
      const trendTableData = Object.entries(districtBreakdown).map(([district, stats]) => [
        district,
        stats.total,
        stats.active,
        stats.resolved,
        `${((stats.resolved / stats.total) * 100).toFixed(1)}%`
      ]);
      
      autoTable(doc, {
        head: [['District', 'Total Incidents', 'Active', 'Resolved', 'Resolution Rate']],
        body: trendTableData,
        startY: 100,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [239, 68, 68], fontStyle: 'bold' }
      });
      
      // Trend analysis
      const finalY = doc.lastAutoTable.finalY + 20;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Trend Analysis', 20, finalY);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const totalIncidents = filteredIncidents.length;
      const resolutionRate = filteredIncidents.length > 0 ? 
        ((filteredIncidents.filter(i => i.status === 'Resolved').length / totalIncidents) * 100).toFixed(1) : '0.0';
      
      doc.text(`• Total Monthly Incidents: ${totalIncidents}`, 20, finalY + 15);
      doc.text(`• Overall Resolution Rate: ${resolutionRate}%`, 20, finalY + 25);
      doc.text(`• Peak Activity Period: ${months[selectedMonth]} ${selectedYear}`, 20, finalY + 35);
    }
    
    doc.save(`monthly-trends-${months[selectedMonth]}-${selectedYear}.pdf`);
  };

  const generatePNPActions = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('PNP Action Reports', 20, 30);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45);
    doc.text(`Month: ${months[selectedMonth]}`, 20, 55);
    doc.text(`Year: ${selectedYear}`, 20, 65);
    doc.text(`District: ${selectedDistrict === 'all' ? 'All Districts' : selectedDistrict}`, 20, 75);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Police Enforcement and Action Activities', 20, 95);
    
    if (actionReports && actionReports.length > 0) {
      let filteredActions = actionReports.filter(action => {
        const actionDate = new Date(action.when);
        const matchesMonth = actionDate.getMonth() === selectedMonth && actionDate.getFullYear() === selectedYear;
        const matchesDistrict = selectedDistrict === 'all' || action.district === selectedDistrict;
        const isPNP = action.department === 'pnp';
        return matchesMonth && matchesDistrict && isPNP;
      });
      
      const tableData = filteredActions.map(action => [
        action.municipality || 'N/A',
        action.district || 'N/A',
        action.what || 'N/A',
        action.where || 'N/A',
        action.actionTaken || 'N/A',
        action.status || 'N/A'
      ]);
      
      autoTable(doc, {
        head: [['Municipality', 'District', 'What', 'Where', 'Action Taken', 'Status']],
        body: tableData,
        startY: 110,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [147, 51, 234], fontStyle: 'bold' }
      });
      
      // Summary
      const finalY = doc.lastAutoTable.finalY + 20;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('PNP Summary', 20, finalY);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`• Total PNP Actions: ${filteredActions.length}`, 20, finalY + 15);
      doc.text(`• Active Cases: ${filteredActions.filter(a => a.status === 'Active').length}`, 20, finalY + 25);
      doc.text(`• Resolved Cases: ${filteredActions.filter(a => a.status === 'Resolved').length}`, 20, finalY + 35);
    }
    
    doc.save(`pnp-actions-${months[selectedMonth]}-${selectedYear}.pdf`);
  };

  const generateAgricultureActions = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Agriculture Department Reports', 20, 30);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45);
    doc.text(`Month: ${months[selectedMonth]}`, 20, 55);
    doc.text(`Year: ${selectedYear}`, 20, 65);
    doc.text(`District: ${selectedDistrict === 'all' ? 'All Districts' : selectedDistrict}`, 20, 75);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Agricultural Enforcement Reports', 20, 95);
    
    if (actionReports && actionReports.length > 0) {
      let filteredActions = actionReports.filter(action => {
        const actionDate = new Date(action.when);
        const matchesMonth = actionDate.getMonth() === selectedMonth && actionDate.getFullYear() === selectedYear;
        const matchesDistrict = selectedDistrict === 'all' || action.district === selectedDistrict;
        const isAgriculture = action.department === 'agriculture';
        return matchesMonth && matchesDistrict && isAgriculture;
      });
      
      const tableData = filteredActions.map(action => [
        action.municipality || 'N/A',
        action.district || 'N/A',
        action.what || 'N/A',
        action.where || 'N/A',
        action.actionTaken || 'N/A',
        action.status || 'N/A'
      ]);
      
      autoTable(doc, {
        head: [['Municipality', 'District', 'What', 'Where', 'Action Taken', 'Status']],
        body: tableData,
        startY: 110,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [147, 51, 234], fontStyle: 'bold' }
      });
      
      // Summary
      const finalY = doc.lastAutoTable.finalY + 20;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Agriculture Department Summary', 20, finalY);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`• Total Agriculture Actions: ${filteredActions.length}`, 20, finalY + 15);
      doc.text(`• Active Cases: ${filteredActions.filter(a => a.status === 'Active').length}`, 20, finalY + 25);
      doc.text(`• Resolved Cases: ${filteredActions.filter(a => a.status === 'Resolved').length}`, 20, finalY + 35);
    }
    
    doc.save(`agriculture-actions-${months[selectedMonth]}-${selectedYear}.pdf`);
  };

  const generateENROActions = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('PG-ENRO Action Reports', 20, 30);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45);
    doc.text(`Month: ${months[selectedMonth]}`, 20, 55);
    doc.text(`Year: ${selectedYear}`, 20, 65);
    doc.text(`District: ${selectedDistrict === 'all' ? 'All Districts' : selectedDistrict}`, 20, 75);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Environmental Regulation Actions', 20, 95);
    
    if (actionReports && actionReports.length > 0) {
      let filteredActions = actionReports.filter(action => {
        const actionDate = new Date(action.when);
        const matchesMonth = actionDate.getMonth() === selectedMonth && actionDate.getFullYear() === selectedYear;
        const matchesDistrict = selectedDistrict === 'all' || action.district === selectedDistrict;
        const isENRO = action.department === 'pg-enro';
        return matchesMonth && matchesDistrict && isENRO;
      });
      
      const tableData = filteredActions.map(action => [
        action.municipality || 'N/A',
        action.district || 'N/A',
        action.what || 'N/A',
        action.where || 'N/A',
        action.actionTaken || 'N/A',
        action.status || 'N/A'
      ]);
      
      autoTable(doc, {
        head: [['Municipality', 'District', 'What', 'Where', 'Action Taken', 'Status']],
        body: tableData,
        startY: 110,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [147, 51, 234], fontStyle: 'bold' }
      });
      
      // Summary
      const finalY = doc.lastAutoTable.finalY + 20;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('PG-ENRO Summary', 20, finalY);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`• Total ENRO Actions: ${filteredActions.length}`, 20, finalY + 15);
      doc.text(`• Active Cases: ${filteredActions.filter(a => a.status === 'Active').length}`, 20, finalY + 25);
      doc.text(`• Resolved Cases: ${filteredActions.filter(a => a.status === 'Resolved').length}`, 20, finalY + 35);
    }
    
    doc.save(`enro-actions-${months[selectedMonth]}-${selectedYear}.pdf`);
  };

  const generateAllReports = () => {
    setIsGenerating(true);
    
    try {
      // Generate all specific reports with a slight delay between each
      setTimeout(() => generateTopPerformersReport(), 100);
      setTimeout(() => generateSystemOverviewReport(), 200);
      setTimeout(() => generateDailyPatrolSummary(), 300);
      setTimeout(() => generateMonthlyPerformance(), 400);
      setTimeout(() => generateDistrictComparison(), 500);
      setTimeout(() => generateCrimeAnalysis(), 600);
      setTimeout(() => generateIncidentSummary(), 700);
      setTimeout(() => generateMonthlyTrends(), 800);
      setTimeout(() => generatePNPActions(), 900);
      setTimeout(() => generateAgricultureActions(), 1000);
      setTimeout(() => generateENROActions(), 1100);
      
      // Show success message
      setTimeout(() => {
        alert('All 11 reports generated successfully! Check your downloads folder.');
        setIsGenerating(false);
      }, 1500);
    } catch (error) {
      console.error('Error generating reports:', error);
      alert('Error generating reports. Please try again.');
      setIsGenerating(false);
    }
  };

  // Main report sections
  const reportSections = [
    {
      id: "dashboard",
      title: "Dashboard Reports",
      description: "Analytics and performance reports",
      icon: <BarChart3 className="w-6 h-6" />,
      color: "from-blue-500 to-blue-600",
      reports: [
        {
          name: "Top Performers Ranking",
          description: "Municipality performance rankings with metrics",
          action: generateTopPerformersReport,
          formats: ["PDF"],
          priority: "high"
        },
        {
          name: "System Overview",
          description: "Complete system statistics and trends",
          action: generateSystemOverviewReport,
          formats: ["PDF"],
          priority: "medium"
        }
      ]
    },
    {
      id: "patrol",
      title: "Patrol Reports",
      description: "Daily and monthly patrol data reports",
      icon: <Shield className="w-6 h-6" />,
      color: "from-emerald-500 to-emerald-600",
      reports: [
        {
          name: "Daily Patrol Summary",
          description: "Daily patrol counts by municipality",
          action: generateDailyPatrolSummary,
          formats: ["PDF"],
          priority: "high"
        },
        {
          name: "Monthly Performance",
          description: "Monthly patrol performance analysis",
          action: generateMonthlyPerformance,
          formats: ["PDF"],
          priority: "medium"
        },
        {
          name: "District Comparison",
          description: "Compare performance across districts",
          action: generateDistrictComparison,
          formats: ["PDF"],
          priority: "low"
        }
      ]
    },
    {
      id: "incidents",
      title: "Incident Reports",
      description: "Crime and incident analysis reports",
      icon: <AlertTriangle className="w-6 h-6" />,
      color: "from-red-500 to-red-600",
      reports: [
        {
          name: "Crime Analysis",
          description: "Comprehensive crime statistics and patterns",
          action: generateCrimeAnalysis,
          formats: ["PDF"],
          priority: "high"
        },
        {
          name: "Incident Summary",
          description: "Detailed incident logs and status",
          action: generateIncidentSummary,
          formats: ["PDF"],
          priority: "high"
        },
        {
          name: "Monthly Trends",
          description: "Monthly incident type analysis",
          action: generateMonthlyTrends,
          formats: ["PDF"],
          priority: "medium"
        }
      ]
    },
    {
      id: "actions",
      title: "Action Center Reports",
      description: "Department action and enforcement reports",
      icon: <Target className="w-6 h-6" />,
      color: "from-purple-500 to-purple-600",
      reports: [
        {
          name: "PNP Actions",
          description: "Police enforcement and action reports",
          action: generatePNPActions,
          formats: ["PDF"],
          priority: "high"
        },
        {
          name: "Agriculture Actions",
          description: "Agricultural enforcement reports",
          action: generateAgricultureActions,
          formats: ["PDF"],
          priority: "medium"
        },
        {
          name: "ENRO Actions",
          description: "Environmental regulation actions",
          action: generateENROActions,
          formats: ["PDF"],
          priority: "medium"
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
            
            <Button
              onClick={generateAllReports}
              disabled={isGenerating}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
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

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white shadow-lg border-0 rounded-xl hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Reports</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {reportSections.reduce((sum, section) => sum + section.reports.length, 0)}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <FileText className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg border-0 rounded-xl hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Patrol Data</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {ipatrollerData?.length || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-xl">
                    <Shield className="w-8 h-8 text-green-600" />
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
                    <p className="text-sm font-medium text-gray-500 mb-1">Actions</p>
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

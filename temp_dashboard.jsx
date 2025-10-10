
import React, { useState, useCallback, useEffect, useRef } from "react";
import Layout from "./Layout";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Badge } from "./components/ui/badge";

import { useData } from "./DataContext";

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
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
import { Line, Bar, Pie } from 'react-chartjs-2';
import { 
  MapPin, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Search, 
  Clock, 
  FileText, 
  User, 
  Activity,
  BarChart3,
  PieChart,
  Users,
  Building2,
  Shield,
  TrendingUp,
  AlertCircle,
  X,
  Target,
  Trophy,
  Calendar,
  Eye,
  Image,
  Menu
} from "lucide-react";
import { Button } from "./components/ui/button";

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

export default function Dashboard({ onLogout, onNavigate, currentPage }) {
  const { 
    actionReports, 
    incidents, 
    ipatrollerData, // Add IPatroller data
    summaryStats, 
    loading: dataLoading,
    refreshIPatrollerData,
    createSampleData
  } = useData();
  const [showActiveModal, setShowActiveModal] = useState(false);
  const [showInactiveModal, setShowInactiveModal] = useState(false);
  const [showTotalIncidentsModal, setShowTotalIncidentsModal] = useState(false);
  const [showTotalActionsModal, setShowTotalActionsModal] = useState(false);
  const [showTopPerformersModal, setShowTopPerformersModal] = useState(false);
  const [showTopPerformersPreview, setShowTopPerformersPreview] = useState(false);
  const [selectedTopPerformersMonth, setSelectedTopPerformersMonth] = useState(new Date().getMonth());
  const [selectedTopPerformersYear, setSelectedTopPerformersYear] = useState(new Date().getFullYear());
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenuDropdown) {
        const dropdown = document.getElementById('dashboard-menu-dropdown');
        const button = document.getElementById('dashboard-menu-button');
        if (dropdown && !dropdown.contains(event.target) && !button?.contains(event.target)) {
          setShowMenuDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenuDropdown]);

  const handleLogout = async () => {
    try {
      // Call the App's centralized logout handler
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Helper function to format time ago
  const getTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} sec ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hour ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} day ago`;
    return date.toLocaleDateString();
  };

  // State for filtered top performers data
  const [filteredTopPerformersData, setFilteredTopPerformersData] = useState([]);
  const [loadingTopPerformers, setLoadingTopPerformers] = useState(false);
  
  // Ref for the preview modal to capture as image
  const topPerformersPreviewRef = useRef(null);

  // Function to load top performers data for specific month and year
  const loadTopPerformersData = useCallback(async (month, year) => {
    try {
      setLoadingTopPerformers(true);
      const monthYearId = `${String(month + 1).padStart(2, "0")}-${year}`;
      
      // Import Firebase functions dynamically to avoid circular dependencies
      const { collection, getDocs } = await import('firebase/firestore');
      const { db } = await import('./firebase');
      
      const municipalitiesRef = collection(db, 'patrolData', monthYearId, 'municipalities');
      const querySnapshot = await getDocs(municipalitiesRef);
      const monthData = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data) {
          monthData.push({
            id: doc.id,
            ...data
          });
        }
      });
      
      // If no documents were found, set empty array
      if (monthData.length === 0) {
        console.log(`ℹ️ No data found for ${monthYearId}`);
        setFilteredTopPerformersData([]);
      } else {
        setFilteredTopPerformersData(monthData);
        console.log(`✅ Top performers data loaded for ${monthYearId}:`, monthData.length, 'municipalities');
      }
    } catch (error) {
      console.error(`❌ Error loading top performers data for ${month}-${year}:`, error);
      
      // Provide user feedback on error
      if (error.code === 'permission-denied') {
        console.warn('Permission denied - falling back to local data');
      } else if (error.code === 'unavailable') {
        console.warn('Firestore unavailable - falling back to local data');
      }
      
      // Don't fall back to current data, just set empty array if no data exists
      setFilteredTopPerformersData([]);
    } finally {
      setLoadingTopPerformers(false);
    }
  }, [ipatrollerData]);

  // Load data when month/year changes
  useEffect(() => {
    if (showTopPerformersModal) {
      loadTopPerformersData(selectedTopPerformersMonth, selectedTopPerformersYear);
    }
  }, [selectedTopPerformersMonth, selectedTopPerformersYear, showTopPerformersModal, loadTopPerformersData]);

  // Helper function to get top performers data
  const getTopPerformers = () => {
    // Only use filtered data, no fallback to current data
    const dataToUse = filteredTopPerformersData;
    
    if (!dataToUse || dataToUse.length === 0) {
      console.warn('No data available for selected month');
      return [];
    }
    
    return dataToUse
      .filter(item => item && (item.municipality || item.id)) // Filter out invalid entries
      .map(item => {
        // Calculate actual active days and percentage from monthly patrol data
        let actualActiveDays = 0;
        let actualInactiveDays = 0;
        let actualTotalPatrols = 0;
        
        if (item.data && Array.isArray(item.data) && item.data.length > 0) {
          // Count days with patrols > 0 as active days
          actualActiveDays = item.data.filter(patrols => typeof patrols === 'number' && patrols > 0).length;
          actualInactiveDays = item.data.filter(patrols => typeof patrols === 'number' && patrols === 0).length;
          actualTotalPatrols = item.data.reduce((sum, patrols) => sum + (Number(patrols) || 0), 0);
        }
        
        return {
          municipality: item.municipality || item.id || 'Unknown',
          district: item.district || 'Unknown',
          totalPatrols: actualTotalPatrols,
          activeDays: actualActiveDays,
          inactiveDays: actualInactiveDays,
          activePercentage: actualActiveDays, // Store actual active days count
          avgPatrolsPerDay: item.data && item.data.length > 0 
            ? (actualActiveDays / item.data.length).toFixed(1) 
            : '0.0'
        };
      })
      .filter(item => item.activeDays > 0 || item.inactiveDays > 0) // Only include municipalities with data
      .sort((a, b) => {
        // Sort by active days first, then by total patrols if tied
        if (b.activeDays !== a.activeDays) {
          return b.activeDays - a.activeDays;
        }
        return b.totalPatrols - a.totalPatrols;
      })
      .slice(0, 12); // Top 12 performers by active days
  };

  // Function to export top performers to PDF
  const exportTopPerformersToPDF = () => {
    try {
      console.log('🚀 Starting PDF export...');
      console.log('📊 autoTable function:', typeof autoTable);
      console.log('📊 jsPDF constructor:', typeof jsPDF);
      
      const topPerformers = getTopPerformers();
      if (topPerformers.length === 0) {
        alert('No performance data available to export.');
        return;
      }

      // Use portrait orientation and points for better width control
      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      
      // Set font fallback system for better compatibility
      try {
        doc.setFont('times');
      } catch (e) {
        try {
          doc.setFont('helvetica');
        } catch (e2) {
          try {
            doc.setFont('arial');
          } catch (e3) {
            console.warn('Using default font due to compatibility issues');
          }
        }
      }
      
      // Add header - center based on page width
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Add border around the entire page
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(1);
              doc.rect(18, 18, pageWidth - 36, pageHeight - 36);
      
      // Add title with better styling
      doc.setFontSize(18);
      doc.setFont('times', 'bold');
      doc.setTextColor(59, 130, 246); // Blue color
      doc.text('Top Performers Report', pageWidth / 2, 45, { align: 'center' });
      
      // Add subtitle
      doc.setFontSize(10);
      doc.setFont('times', 'normal');
      doc.setTextColor(0, 0, 0); // Black color
      doc.text(`Performance Analysis for ${new Date(selectedTopPerformersYear, selectedTopPerformersMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`, pageWidth / 2, 62, { align: 'center' });
      
      // Add generation info
      doc.setFontSize(8);
      doc.setFont('times', 'normal');
      doc.setTextColor(0, 0, 0); // Black color
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
      })} at ${new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })}`, pageWidth / 2, 75, { align: 'center' });
      
      // Add "Performance Data Table" title
      doc.setFontSize(12);
      doc.setFont('times', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Performance Data Table', 30, 100);
      
      // Add table
      const tableData = topPerformers.map((performer, index) => {
        const activePercentage = performer.activeDays + performer.inactiveDays > 0 
          ? Math.round((performer.activeDays / (performer.activeDays + performer.inactiveDays)) * 100)
          : 0;
        
        let status = 'Needs Improvement';
        if (activePercentage === 100) status = 'Very Satisfactory';
        else if (activePercentage >= 75) status = 'Very Good';
        else if (activePercentage >= 50) status = 'Good';
        
        return [
          index + 1,
          performer.municipality,
          performer.district,
          performer.activeDays,
          performer.inactiveDays,
          `${activePercentage}%`,
          status
        ];
      });
      
      // Use the imported autoTable function with error handling
      let tableResult;
      try {
        // Check if autoTable is available
        if (typeof autoTable !== 'function') {
          throw new Error('autoTable function not available');
        }
        
        // Use the correct autoTable API - it modifies the doc and returns undefined
        autoTable(doc, {
          head: [['Rank', 'Municipality', 'District', 'Total Active', 'Total Inactive', 'Active %', 'Status']],
          body: tableData,
          startY: 115,
          styles: {
            font: 'times',
            fontSize: 9,
            cellPadding: 5,
            overflow: 'linebreak',
            halign: 'center',
            valign: 'middle',
            textColor: [0, 0, 0],
            lineColor: [200, 200, 200],
            lineWidth: 0.5
          },
          headStyles: {
            fillColor: [59, 130, 246],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 11,
            cellPadding: 6,
            halign: 'center'
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252]
          },
          // Fit within page width with optimal distribution
          margin: { top: 115, left: 25, right: 25 },
          tableWidth: 'auto',
          columnStyles: {
            0: { halign: 'center', fontStyle: 'bold' },   // Rank
            1: { halign: 'left' },                        // Municipality
            2: { halign: 'left' },                        // District  
            3: { halign: 'center' },                      // Total Active
            4: { halign: 'center' },                      // Total Inactive
            5: { halign: 'center' },                      // Active %
            6: { halign: 'center' }                       // Status
          },
          didParseCell: function(data) {
            try {
              // Color coding for status column
              if (data.column.index === 6 && data.section === 'body') {
                const status = data.cell.text[0];
                if (status === 'Very Satisfactory') {
                  data.cell.styles.fillColor = [16, 185, 129]; // Emerald
                  data.cell.styles.textColor = [255, 255, 255];
                } else if (status === 'Very Good') {
                  data.cell.styles.fillColor = [34, 197, 94]; // Green
                  data.cell.styles.textColor = [255, 255, 255];
                } else if (status === 'Good') {
                  data.cell.styles.fillColor = [245, 158, 11]; // Yellow
                  data.cell.styles.textColor = [0, 0, 0];
                } else if (status === 'Needs Improvement') {
                  data.cell.styles.fillColor = [239, 68, 68]; // Red
                  data.cell.styles.textColor = [255, 255, 255];
                }
              }
              
              // Color coding for Total Active column (green)
              if (data.column.index === 3 && data.section === 'body') {
                data.cell.styles.textColor = [34, 197, 94]; // Green
                data.cell.styles.fontStyle = 'bold';
              }
              
              // Color coding for Total Inactive column (red)
              if (data.column.index === 4 && data.section === 'body') {
                data.cell.styles.textColor = [239, 68, 68]; // Red
                data.cell.styles.fontStyle = 'bold';
              }
              
              // Color coding for Active % column (purple)
              if (data.column.index === 5 && data.section === 'body') {
                data.cell.styles.textColor = [147, 51, 234]; // Purple
                data.cell.styles.fontStyle = 'bold';
              }
            } catch (cellError) {
              console.warn('Error in cell styling:', cellError);
            }
          }
        });
        
        // Get the finalY from the document's lastAutoTable property
        tableResult = { 
          finalY: doc.lastAutoTable ? doc.lastAutoTable.finalY : 
                 doc.autoTable ? doc.autoTable.previous.finalY : 
                 125 + (tableData.length * 20) + 30 // Fallback calculation
        };
      } catch (tableError) {
        console.error('Error creating table:', tableError);
        tableResult = { finalY: 400 };
      }
      
      // Ensure tableResult has a valid finalY value
      if (!tableResult || typeof tableResult.finalY === 'undefined') {
        tableResult = { finalY: 400 };
      }
      
      // Add "Summary Statistics" section
      const summaryStartY = tableResult.finalY + 40;
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Summary Statistics', 40, summaryStartY);
      
      // Create summary statistics in a grid layout
      const summaryY = summaryStartY + 20;
      const leftColumn = 60;
      const rightColumn = 320;
      
      // Most Active (top left)
      doc.setFontSize(10);
      doc.setFont('times', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('• Most Active', leftColumn, summaryY);
      doc.setFont('times', 'normal');
      doc.text(`${topPerformers[0]?.municipality || 'N/A'} (${topPerformers[0]?.activeDays || 0} active days)`, leftColumn, summaryY + 15);
      
      // Average Active Days (top right)
      doc.setFont('times', 'bold');
      doc.text('• Average Active Days', rightColumn, summaryY);
      doc.setFont('times', 'normal');
      doc.text(`${(topPerformers.reduce((sum, p) => sum + p.activeDays, 0) / Math.max(topPerformers.length, 1)).toFixed(1)}`, rightColumn, summaryY + 15);
      
      // Total Active Days (bottom left)
      doc.setFont('times', 'bold');
      doc.text('• Total Active Days', leftColumn, summaryY + 50);
      doc.setFont('times', 'normal');
      doc.text(`${topPerformers.reduce((sum, p) => sum + p.activeDays, 0)}`, leftColumn, summaryY + 65);
      
      // Average Active % (bottom right)
      doc.setFont('times', 'bold');
      doc.text('• Average Active %', rightColumn, summaryY + 50);
      doc.setFont('times', 'normal');
      const avgPercentage = Math.round(topPerformers.reduce((sum, p) => {
        const activePercentage = p.activeDays + p.inactiveDays > 0 
          ? Math.round((p.activeDays / (p.activeDays + p.inactiveDays)) * 100)
          : 0;
        return sum + activePercentage;
      }, 0) / Math.max(topPerformers.length, 1));
      doc.text(`${avgPercentage}%`, rightColumn, summaryY + 65);
      
      // Add footer
      const footerY = pageHeight - 60;
      doc.setFontSize(9);
      doc.setFont('times', 'italic');
      doc.setTextColor(0, 0, 0);
      doc.text('Report generated by iPatroller Management System', pageWidth / 2, footerY, { align: 'center' });
      doc.text('Page 1 of 1', pageWidth / 2, footerY + 15, { align: 'center' });
      
      // Save the PDF
      doc.save(`top-performers-${selectedTopPerformersMonth + 1}-${selectedTopPerformersYear}.pdf`);
      
      console.log('✅ PDF exported successfully');
    } catch (error) {
      console.error('❌ Error exporting PDF:', error);
      alert('Error exporting PDF. Please try again or contact support.');
    }
  };

  // Function to export top performers as image (PNG/JPG)
  const exportTopPerformersAsImage = async (format = 'png') => {
    try {
      console.log(`🚀 Starting ${format.toUpperCase()} export...`);
      
      if (!topPerformersPreviewRef.current) {
        alert('Preview not available. Please view the report first.');
        return;
      }

      // Show loading state
      const exportButton = document.querySelector(`[data-export-image="${format}"]`);
      if (exportButton) {
        exportButton.disabled = true;
        exportButton.innerHTML = 'Exporting...';
      }

      // Create a completely clean export container
      const exportContainer = document.createElement('div');
      exportContainer.style.cssText = `
        position: fixed;
        top: -9999px;
        left: -9999px;
        width: 800px;
        background: white;
        padding: 20px;
        font-family: Arial, sans-serif;
        color: black;
        z-index: -1;
        border: 1px solid #ccc;
      `;
      
      // Get the data and create a simple HTML structure
      const topPerformers = getTopPerformers();
      const monthYear = new Date(selectedTopPerformersYear, selectedTopPerformersMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" });
      
      exportContainer.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #3b82f6; font-size: 24px; margin: 0 0 10px 0;">Top Performers Report</h1>
          <p style="color: #6b7280; margin: 5px 0;">Performance Analysis for ${monthYear}</p>
          <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">Generated on: ${new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric'
          })} at ${new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #374151; font-size: 18px; margin: 20px 0 10px 0;">Performance Data Table</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #ccc;">
            <thead>
              <tr style="background: #3b82f6; color: white;">
                <th style="padding: 8px; border: 1px solid #ccc; text-align: center;">Rank</th>
                <th style="padding: 8px; border: 1px solid #ccc; text-align: left;">Municipality</th>
                <th style="padding: 8px; border: 1px solid #ccc; text-align: left;">District</th>
                <th style="padding: 8px; border: 1px solid #ccc; text-align: center;">Total Active</th>
                <th style="padding: 8px; border: 1px solid #ccc; text-align: center;">Total Inactive</th>
                <th style="padding: 8px; border: 1px solid #ccc; text-align: center;">Active %</th>
                <th style="padding: 8px; border: 1px solid #ccc; text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${topPerformers.map((performer, index) => {
                const activePercentage = performer.activeDays + performer.inactiveDays > 0 
                  ? Math.round((performer.activeDays / (performer.activeDays + performer.inactiveDays)) * 100)
                  : 0;
                
                let status = 'Needs Improvement';
                let statusColor = '#ef4444';
                if (activePercentage === 100) {
                  status = 'Very Satisfactory';
                  statusColor = '#10b981';
                } else if (activePercentage >= 75) {
                  status = 'Very Good';
                  statusColor = '#22c55e';
                } else if (activePercentage >= 50) {
                  status = 'Good';
                  statusColor = '#eab308';
                }
                
                return `
                  <tr>
                    <td style="padding: 8px; border: 1px solid #ccc; text-align: center; font-weight: bold;">${index + 1}</td>
                    <td style="padding: 8px; border: 1px solid #ccc;">${performer.municipality}</td>
                    <td style="padding: 8px; border: 1px solid #ccc;">${performer.district}</td>
                    <td style="padding: 8px; border: 1px solid #ccc; text-align: center; color: #22c55e; font-weight: bold;">${performer.activeDays}</td>
                    <td style="padding: 8px; border: 1px solid #ccc; text-align: center; color: #ef4444; font-weight: bold;">${performer.inactiveDays}</td>
                    <td style="padding: 8px; border: 1px solid #ccc; text-align: center; color: #a855f7; font-weight: bold;">${activePercentage}%</td>
                    <td style="padding: 8px; border: 1px solid #ccc; text-align: center; background: ${statusColor}; color: white; font-weight: bold;">${status}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #374151; font-size: 18px; margin: 20px 0 10px 0;">Summary Statistics</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div style="padding: 15px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
              <h4 style="color: #374151; margin: 0 0 10px 0;">• Most Active</h4>
              <p style="color: #6b7280; margin: 5px 0;">${topPerformers[0]?.municipality || 'N/A'} (${topPerformers[0]?.activeDays || 0} active days)</p>
            </div>
            <div style="padding: 15px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
              <h4 style="color: #374151; margin: 0 0 10px 0;">• Average Active Days</h4>
              <p style="color: #6b7280; margin: 5px 0;">${(topPerformers.reduce((sum, p) => sum + p.activeDays, 0) / Math.max(topPerformers.length, 1)).toFixed(1)}</p>
            </div>
            <div style="padding: 15px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
              <h4 style="color: #374151; margin: 0 0 10px 0;">• Total Active Days</h4>
              <p style="color: #6b7280; margin: 5px 0;">${topPerformers.reduce((sum, p) => sum + p.activeDays, 0)}</p>
            </div>
            <div style="padding: 15px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
              <h4 style="color: #374151; margin: 0 0 10px 0;">• Average Active %</h4>
              <p style="color: #6b7280; margin: 5px 0;">${Math.round(topPerformers.reduce((sum, p) => {
                const activePercentage = p.activeDays + p.inactiveDays > 0 
                  ? Math.round((p.activeDays / (p.activeDays + p.inactiveDays)) * 100)
                  : 0;
                return sum + activePercentage;
              }, 0) / Math.max(topPerformers.length, 1))}%</p>
            </div>
          </div>
        </div>
        
        <div style="text-align: center; padding: 15px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
          <p style="color: #6b7280; font-style: italic; margin: 5px 0;">Report generated by iPatroller Management System</p>
          <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">Page 1 of 1</p>
        </div>
      `;
      
      document.body.appendChild(exportContainer);
      
      // Capture the clean content
      const canvas = await html2canvas(exportContainer, {
        scale: 2,
        backgroundColor: '#ffffff',
        width: 800,
        height: exportContainer.scrollHeight,
        logging: false,
        useCORS: false,
        allowTaint: false
      });
      
      // Clean up
      document.body.removeChild(exportContainer);
      
      // Convert canvas to blob
      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, `image/${format}`, 0.95);
      });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `top-performers-${selectedTopPerformersMonth + 1}-${selectedTopPerformersYear}.${format}`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      URL.revokeObjectURL(url);

      console.log(`✅ ${format.toUpperCase()} exported successfully`);
      
      // Reset button state
      if (exportButton) {
        exportButton.disabled = false;
        exportButton.innerHTML = format === 'png' ? 'Export PNG' : 'Export JPG';
      }
    } catch (error) {
      console.error(`❌ Error exporting ${format.toUpperCase()}:`, error);
      alert(`Error exporting ${format.toUpperCase()}. Please try the PDF export instead.`);
      
      // Reset button state on error
      const exportButton = document.querySelector(`[data-export-image="${format}"]`);
      if (exportButton) {
        exportButton.disabled = false;
        exportButton.innerHTML = format === 'png' ? 'Export PNG' : 'Export JPG';
      }
    }
  };

     // State for time period selection
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('weekly');

  // Calculate activity data based on selected time period
  const getActivityData = (period) => {
    switch (period) {
      case 'monthly':
        // Monthly data for the last 12 months
        const monthlyTotals = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        const monthNames = [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
        
        ipatrollerData.forEach(row => {
          row.data.forEach((patrols, monthIndex) => {
            if (monthIndex < 12) {
              monthlyTotals[monthIndex] += patrols;
            }
          });
        });
        
        return {
          labels: monthNames,
          datasets: [{
            label: 'Last 12 Months',
            data: monthlyTotals,
            backgroundColor: [
              'rgba(59, 130, 246, 0.8)',
              'rgba(16, 185, 129, 0.8)',
              'rgba(245, 158, 11, 0.8)',
              'rgba(239, 68, 68, 0.8)',
              'rgba(139, 92, 246, 0.8)',
              'rgba(236, 72, 153, 0.8)',
              'rgba(34, 197, 94, 0.8)',
              'rgba(168, 85, 247, 0.8)',
              'rgba(236, 72, 153, 0.8)',
              'rgba(34, 197, 94, 0.8)',
              'rgba(59, 130, 246, 0.8)',
              'rgba(16, 185, 129, 0.8)',
            ],
          }],
        };

      case 'weekly':
      default:
        // Weekly data (existing logic)
   const weeklyTotals = [0, 0, 0, 0, 0, 0, 0]; // Mon, Tue, Wed, Thu, Fri, Sat, Sun
   
   ipatrollerData.forEach(row => {
     row.data.forEach((patrols, dayIndex) => {
            if (dayIndex < 7) {
         weeklyTotals[dayIndex] += patrols;
       }
     });
   });

        return {
     labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
         label: 'This Week',
         data: weeklyTotals,
         backgroundColor: [
           'rgba(59, 130, 246, 0.8)',
           'rgba(16, 185, 129, 0.8)',
           'rgba(245, 158, 11, 0.8)',
           'rgba(239, 68, 68, 0.8)',
           'rgba(139, 92, 246, 0.8)',
           'rgba(236, 72, 153, 0.8)',
           'rgba(34, 197, 94, 0.8)',
         ],
          }],
        };
    }
  };

  // Get current activity data based on selected time period
  const currentActivityData = getActivityData(selectedTimePeriod);

  // Debug: Log the activity data to verify
  console.log('Activity Data:', {
    selectedTimePeriod,
    ipatrollerDataLength: ipatrollerData.length,
    currentActivityData,
    sampleMunicipality: ipatrollerData[0] ? ipatrollerData[0].municipality : 'No IPatroller data'
  });

     // Calculate district distribution from IPatroller data
   const districtTotals = {};
   ipatrollerData.forEach(row => {
     const district = row.district;
     // Safety check before calling reduce
     if (row.data && Array.isArray(row.data)) {
       const totalPatrols = row.data.reduce((sum, val) => sum + (val || 0), 0);
       districtTotals[district] = (districtTotals[district] || 0) + totalPatrols;
     }
   });

   // Calculate total patrols across all districts
   const totalPatrols = Object.values(districtTotals).reduce((sum, val) => sum + val, 0);

   // Calculate percentages for each district
   const districtPercentages = {};
   Object.keys(districtTotals).forEach(district => {
     districtPercentages[district] = totalPatrols > 0 ? Math.round((districtTotals[district] / totalPatrols) * 100) : 0;
   });

   const districtData = {
     labels: Object.keys(districtTotals).map(district => `${district} (${districtPercentages[district]}%)`),
     datasets: [
       {
         data: Object.values(districtTotals),
         backgroundColor: [
           'rgba(59, 130, 246, 0.8)',
           'rgba(16, 185, 129, 0.8)',
           'rgba(245, 158, 11, 0.8)',
         ],
         borderWidth: 2,
         borderColor: '#fff',
       },
     ],
   };

  // Define all 12 municipalities (3 districts × 4 municipalities each)
  const allMunicipalities = [
    "Abucay", "Orani", "Samal", "Hermosa",           // 1ST DISTRICT
    "Balanga City", "Pilar", "Orion", "Limay",       // 2ND DISTRICT
    "Bagac", "Dinalupihan", "Mariveles", "Morong"   // 3RD DISTRICT
  ];

  // Use data from DataContext instead of calculating locally
  const totalMunicipalities = 12; // Always 12 municipalities
  
  // Calculate active municipalities for YESTERDAY (previous day of the month)
  const getYesterdayActiveCount = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const currentDay = yesterday.getDate() - 1; // Array index (0-based) for yesterday
    
    console.log('🔍 getYesterdayActiveCount Debug:');
    console.log('  Today:', today.toLocaleDateString());
    console.log('  Today full date:', today.toString());
    console.log('  Yesterday:', yesterday.toLocaleDateString());
    console.log('  Yesterday full date:', yesterday.toString());
    console.log('  Yesterday day of month:', yesterday.getDate());
    console.log('  Calculated array index:', currentDay);
    console.log('  IPatroller data length:', ipatrollerData.length);
    
    if (ipatrollerData.length === 0) return 0;
    
    let activeYesterday = 0;
    let debugDetails = [];
    
    // Log the first few municipalities' data structure to understand the format
    console.log('🔍 Sample data structure:');
    ipatrollerData.forEach((item, index) => {
      console.log(`  ${item.municipality}:`, {
        dataLength: item.data ? item.data.length : 'No data',
        sampleData: item.data ? item.data.slice(0, 10) : 'No data',
        totalPatrols: item.totalPatrols,
        month: item.month,
        year: item.year,
        patrolsForYesterday: item.data ? item.data[currentDay] : 'No data',
        isActiveYesterday: item.data ? item.data[currentDay] >= 5 : false
      });
    });
    
    ipatrollerData.forEach((item, index) => {
      if (item.data && Array.isArray(item.data) && item.data[currentDay] !== undefined) {
        const patrols = item.data[currentDay];
        const isActive = patrols >= 5; // Municipality is active only if it has 5 or more patrols
        
        debugDetails.push({
          municipality: item.municipality,
          dayIndex: currentDay,
          patrols: patrols,
          isActive: isActive,
          dataArray: item.data.slice(0, 10) // Show first 10 elements for debugging
        });
        
        // Check if municipality has patrols for yesterday
        if (isActive) {
          activeYesterday++;
        }
      } else {
        console.log(`⚠️ Municipality ${item.municipality} has no data for day ${currentDay}`);
        console.log(`  Data structure:`, item.data);
      }
    });
    
    console.log('  Debug details for each municipality:', debugDetails);
    console.log('  Final active count:', activeYesterday);
    
    return activeYesterday;
  };
  
  const activeCount = getYesterdayActiveCount();
  const inactiveCount = totalMunicipalities - activeCount;
  const correctedInactiveCount = inactiveCount;

  // Calculate active municipalities list for modals (for YESTERDAY only)
  const activeMunicipalitiesList = ipatrollerData.filter(item => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const currentDay = yesterday.getDate() - 1; // Array index (0-based) for yesterday
    
    if (item.data && Array.isArray(item.data) && item.data[currentDay] !== undefined) {
      // Municipality is active YESTERDAY if it has 5 or more patrols for yesterday
      return item.data[currentDay] >= 5;
    }
    return false;
  });
  
  // Debug logging
  console.log('Dashboard Data:', {
    ipatrollerDataLength: ipatrollerData.length,
    allMunicipalitiesCount: allMunicipalities.length,
    activeCount,
    inactiveCount,
    correctedInactiveCount,
    totalMunicipalities: 12,
    calculatedTotal: activeCount + correctedInactiveCount,
    activeMunicipalities: activeMunicipalitiesList,
    summaryStats: {
      activeMunicipalities: summaryStats.activeMunicipalities,
      inactiveMunicipalities: summaryStats.inactiveMunicipalities,
      totalDailyPatrols: summaryStats.totalDailyPatrols,
      activeDistricts: summaryStats.activeDistricts
    },
    sampleIPatrollerData: ipatrollerData[0] ? ipatrollerData[0].data : 'No IPatroller data'
  });
  
  // Debug: Log what data is actually being used for calculations
  console.log('🔍 Dashboard Calculation Debug:');
  console.log('  summaryStats.activeMunicipalities:', summaryStats.activeMunicipalities);
  console.log('  summaryStats.inactiveMunicipalities:', summaryStats.inactiveMunicipalities);
  console.log('  ipatrollerData.length:', ipatrollerData.length);
  console.log('  activeMunicipalitiesList.length:', activeMunicipalitiesList.length);
  
  // Debug: Log yesterday's data calculations
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const currentDay = yesterday.getDate() - 1; // Array index (0-based) for yesterday
  console.log('📅 Yesterday\'s date:', yesterday.toLocaleDateString());
  console.log('📊 Current day index for yesterday:', currentDay);
  console.log('📊 Calculated activeCount for yesterday:', activeCount);
  console.log('📊 Calculated inactiveCount for yesterday:', correctedInactiveCount);

  // Validation: Ensure counts add up to total municipalities
  if (activeCount + correctedInactiveCount !== totalMunicipalities) {
    console.warn(`⚠️ Municipality count mismatch: Active (${activeCount}) + Corrected Inactive (${correctedInactiveCount}) = ${activeCount + correctedInactiveCount}, Expected: ${totalMunicipalities}`);
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#000000',
          font: {
            weight: '600'
          }
        },
      },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#000000',
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        titleFont: {
          weight: '600'
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#6b7280',
          font: {
            weight: '500'
          }
        },
        grid: {
          color: '#e5e7eb',
          borderColor: '#e5e7eb'
        },
        border: {
          color: '#e5e7eb'
        }
      },
      y: {
        ticks: {
          color: '#6b7280',
          font: {
            weight: '500'
          }
        },
        grid: {
          color: '#e5e7eb',
          borderColor: '#e5e7eb'
        },
        border: {
          color: '#e5e7eb'
        }
      },
    },
    elements: {
      point: {
        backgroundColor: '#2563eb',
        borderColor: '#ffffff',
        borderWidth: 2,
        radius: 4,
        hoverRadius: 6
      },
      line: {
        borderWidth: 3
      }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#000000',
          font: {
            weight: '600'
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        },
      },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#000000',
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        titleFont: {
          weight: '600'
        }
      }
    },
    elements: {
      arc: {
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    }
  };

  return (
    <Layout onLogout={handleLogout} onNavigate={onNavigate} currentPage={currentPage}>
      <section className="flex-1 p-3 md:p-6 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold transition-colors duration-300 text-gray-900">
              Dashboard Management
            </h1>
            <p className="text-base md:text-lg transition-colors duration-300 text-gray-600">
              {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })} • System Overview Dashboard
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className={`w-2 h-2 rounded-full ${
                dataLoading ? 'bg-yellow-500' : 'bg-green-500'
              }`}></div>
              <span className={`text-sm font-medium ${
                dataLoading ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
              }`}>
                {dataLoading ? 'Loading data...' : 'All systems operational'}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {/* 3-Dots Menu */}
            <div className="relative">
              <Button
                id="dashboard-menu-button"
                onClick={() => setShowMenuDropdown(!showMenuDropdown)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                title="Dashboard Actions & Options"
              >
                <Menu className="w-5 h-5" />
                <span className="text-sm font-medium">View Options</span>
              </Button>
              
              {/* Dropdown Menu */}
              {showMenuDropdown && (
                <div 
                  id="dashboard-menu-dropdown"
                  className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden"
                >
                  <div className="py-1">
                    {/* View Options */}
                    <div className="px-3 py-2">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">View Options</h3>
                    </div>
                    
                    <button
                      onClick={() => {
                        setShowActiveModal(true);
                        setShowMenuDropdown(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors duration-200"
                    >
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Active Municipalities</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowInactiveModal(true);
                        setShowMenuDropdown(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
                    >
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span>Inactive Municipalities</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowTotalIncidentsModal(true);
                        setShowMenuDropdown(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors duration-200"
                    >
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                      <span>Total Incidents</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowTotalActionsModal(true);
                        setShowMenuDropdown(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-200"
                    >
                      <Activity className="w-4 h-4 text-indigo-600" />
                      <span>Total Actions</span>
                    </button>
                    
                    
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Loading Indicator */}
        {dataLoading && (
          <div className="mb-4 p-3 md:p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="animate-spin rounded-full h-5 w-5 md:h-6 md:w-6 border-b-2 border-blue-600"></div>
              <span className="text-xs md:text-sm font-medium transition-colors duration-300 text-blue-700">
                Loading dashboard data...
              </span>
            </div>
          </div>
        )}

        {/* Yesterday's Data Header */}
        <div className="mb-4 p-3 md:p-4 rounded-lg bg-yellow-50 border border-yellow-200">
          <p className="text-sm transition-colors duration-300 text-yellow-700 text-center">
            📅 Showing data for yesterday ({new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })})
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium transition-colors duration-300 text-gray-500">Total Municipalities</p>
                  <p className="text-2xl md:text-3xl font-bold text-blue-600">
                    {totalMunicipalities.toLocaleString()}
                  </p>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-colors duration-300 bg-blue-100">
                  <Building2 className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium transition-colors duration-300 text-gray-500">Active Municipalities</p>
                  <p className="text-2xl md:text-3xl font-bold text-green-600">
                    {activeCount.toLocaleString()}
                  </p>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-colors duration-300 bg-green-100">
                  <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium transition-colors duration-300 text-gray-500">Inactive Municipalities</p>
                  <p className="text-2xl md:text-3xl font-bold text-red-600">
                    {inactiveCount.toLocaleString()}
                  </p>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-colors duration-300 bg-red-100">
                  <XCircle className="h-5 w-5 md:h-6 md:w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium transition-colors duration-300 text-gray-500">Active Percentage</p>
                  <p className="text-2xl md:text-3xl font-bold text-purple-600">
                    {totalMunicipalities > 0 ? Math.round((activeCount / totalMunicipalities) * 100) : 0}%
                  </p>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-colors duration-300 bg-purple-100">
                  <Target className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* IPatroller Data Card - Full Width */}
        <Card className="backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80">
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
              <div className="text-center">
                <div className="h-12 w-12 md:h-16 md:w-16 rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4 bg-blue-100">
                  <Activity className="h-6 w-6 md:h-8 md:w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-2xl md:text-3xl font-bold transition-colors duration-300 text-gray-900">
                  {summaryStats.totalDailyPatrols ? summaryStats.totalDailyPatrols.toLocaleString() : '0'}
                </p>
                <p className="text-sm md:text-lg font-medium transition-colors duration-300 text-gray-600">
                  Daily Patrols
                </p>
              </div>
              <div className="text-center">
                <div className="h-12 w-12 md:h-16 md:w-16 rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4 bg-indigo-100">
                  <Building2 className="h-6 w-6 md:h-8 md:w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <p className="text-2xl md:text-3xl font-bold transition-colors duration-300 text-gray-900">
                  {summaryStats.activeDistricts || 0}
                </p>
                <p className="text-sm md:text-lg font-medium transition-colors duration-300 text-gray-600">
                  Active Districts
                </p>
              </div>
              <div className="text-center">
                <div className="h-12 w-12 md:h-16 md:w-16 rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4 bg-purple-100">
                  <Users className="h-6 w-6 md:h-8 md:w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-2xl md:text-3xl font-bold transition-colors duration-300 text-gray-900">
                  12
                </p>
                <p className="text-sm md:text-lg font-medium transition-colors duration-300 text-gray-600">
                  Total Municipalities
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          
          {/* Activity Chart with Time Period Selector */}
          <Card className="backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80">
            <CardHeader className="pb-3 md:pb-4">
              <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl flex items-center justify-center bg-blue-100">
                  <BarChart3 className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                </div>
                  <CardTitle className="text-lg md:text-xl font-bold transition-colors duration-300 text-gray-900">
                    {selectedTimePeriod === 'monthly' ? 'Monthly Activity' : 'Weekly Activity'}
                  </CardTitle>
                </div>
                
                {/* Time Period Selector */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setSelectedTimePeriod('weekly')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                      selectedTimePeriod === 'weekly'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => setSelectedTimePeriod('monthly')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                      selectedTimePeriod === 'monthly'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Monthly
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <div className="h-60 md:h-80">
                <Bar data={currentActivityData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>

          {/* District Distribution Chart */}
          <Card className="backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80">
            <CardHeader className="pb-3 md:pb-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl flex items-center justify-center bg-green-100">
                  <PieChart className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                </div>
                <CardTitle className="text-lg md:text-xl font-bold transition-colors duration-300 text-gray-900">District Distribution</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <div className="h-60 md:h-80">
                <Pie data={districtData} options={pieOptions} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity and Incidents Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          
          {/* Recent Activity */}
          <Card className="backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80">
            <CardHeader className="pb-3 md:pb-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl flex items-center justify-center bg-orange-100">
                  <Activity className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
                </div>
                <CardTitle className="text-lg md:text-xl font-bold transition-colors duration-300 text-gray-900">Recent Activity</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {summaryStats.recentActivity.length > 0 ? (
                  summaryStats.recentActivity.map((activity, index) => {
                    const getActivityIcon = (iconName) => {
                      switch (iconName) {
                        case 'MapPin':
                          return <MapPin className="h-4 w-4 text-blue-600" />;
                        case 'FileText':
                          return <FileText className="h-4 w-4 text-green-600" />;
                        case 'AlertTriangle':
                          return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
                        default:
                          return <Activity className="h-4 w-4 text-gray-600" />;
                      }
                    };

                    const getActivityColor = (type) => {
                      switch (type) {
                        case 'patrol':
                          return {
                            bg: 'bg-blue-50 border-blue-200',
                            icon: 'bg-blue-100'
                          };
                        case 'action':
                          return {
                            bg: 'bg-green-50 border-green-200',
                            icon: 'bg-green-100'
                          };
                        case 'incident':
                          return {
                            bg: 'bg-yellow-50 border-yellow-200',
                            icon: 'bg-yellow-900/30'
                          };
                        default:
                          return {
                            bg: 'bg-gray-50 border-gray-200',
                            icon: 'bg-gray-900/30'
                          };
                      }
                    };

                    const colors = getActivityColor(activity.type);
                    const timeAgo = activity.timestamp?.toDate ? 
                      getTimeAgo(activity.timestamp.toDate()) : 
                      getTimeAgo(new Date(activity.timestamp));

                    return (
                      <div key={index} className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 hover:scale-105 ${colors.bg}`}>
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-xl flex items-center justify-center transition-colors duration-300 ${colors.icon}`}>
                            {getActivityIcon(activity.icon)}
                          </div>
                          <div>
                            <p className="font-semibold transition-colors duration-300 text-gray-900">{activity.title}</p>
                            <p className="text-sm transition-colors duration-300 text-gray-500">{activity.description}</p>
                          </div>
                        </div>
                        <span className="text-xs font-medium px-3 py-1 rounded-full transition-colors duration-300 bg-gray-100 text-gray-600">{timeAgo}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 transition-colors duration-300 text-gray-500">
                    <Activity className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-semibold">No Recent Activity</p>
                    <p className="text-sm">Start using the system to see recent activity here.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Incidents Activity */}
          <Card className="backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80">
            <CardHeader className="pb-3 md:pb-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl flex items-center justify-center bg-purple-100">
                  <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
                </div>
                <CardTitle className="text-lg md:text-xl font-bold transition-colors duration-300 text-gray-900">Incidents Activity</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {incidents.length > 0 ? (
                  incidents.slice(0, 5).map((incident, index) => {
                    const getIncidentStyle = () => {
                      return {
                        bg: 'bg-blue-50 border-blue-200',
                        icon: 'bg-blue-100',
                        iconColor: 'text-blue-600',
                        svg: <AlertTriangle className="h-4 w-4 text-blue-600" />
                      };
                    };

                    const incidentStyle = getIncidentStyle();
                    const timeAgo = incident.date ? new Date(incident.date).toLocaleDateString() : 'No date';

                    return (
                      <div key={incident.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 hover:scale-105 ${incidentStyle.bg}`}>
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-xl flex items-center justify-center transition-colors duration-300 ${incidentStyle.icon}`}>
                            {incidentStyle.svg}
                          </div>
                          <div>
                            <p className="font-semibold transition-colors duration-300 text-gray-900">{incident.title || 'Incident Report'}</p>
                            <p className="text-sm transition-colors duration-300 text-gray-500">{incident.description || 'No description available'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-medium px-3 py-1 rounded-full transition-colors duration-300 bg-gray-100 text-gray-600">{timeAgo}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 transition-colors duration-300 text-gray-500">
                    <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-semibold">No Incidents</p>
                    <p className="text-sm">No incidents have been reported yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Section */}
        <div className="text-center py-6 md:py-8 border-t text-slate-500 border-slate-200">
          <div className="flex items-center justify-center gap-4">
            <p className="text-xs md:text-sm">
              Dashboard updated automatically • Data refreshes every 30 seconds
            </p>
            <button
              onClick={() => {
                console.log('🔄 Manually refreshing iPatroller data...');
                refreshIPatrollerData();
              }}
              className="text-xs px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full transition-colors duration-200"
              title="Refresh iPatroller data"
            >
              🔄 Refresh Data
            </button>
            <button
              onClick={() => {
                console.log('🧪 Creating sample data for testing...');
                createSampleData();
              }}
              className="text-xs px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded-full transition-colors duration-200"
              title="Create sample data for testing"
            >
              🧪 Sample Data
            </button>
          </div>
        </div>
      </section>

      {/* Active Municipalities Modal */}
      {showActiveModal && (
        <div className="fixed inset-0 flex items-center justify-center z-40 p-4">
          <div className="rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden bg-white">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                                 <div className="h-10 w-10 rounded-full flex items-center justify-center bg-green-100">
                   <CheckCircle className="h-6 w-6 text-green-600" />
                 </div>
                <div>
                  <h3 className="text-xl font-bold transition-colors duration-300 text-gray-900">Active Municipalities</h3>
                  <p className="text-sm transition-colors duration-300 text-gray-600">{activeCount} municipalities with patrols yesterday</p>
                </div>
              </div>
                             <button
                 onClick={() => setShowActiveModal(false)}
                 className="p-2 rounded-lg transition-all duration-300 hover:bg-gray-100 text-gray-500 hover:text-gray-700"
               >
                 <X className="h-6 w-6" />
               </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {activeMunicipalitiesList.length > 0 ? (
                <div className="space-y-4">
                  {activeMunicipalitiesList.map((municipality, index) => {
                    // Get yesterday's patrol count
                    const today = new Date();
                    const yesterday = new Date(today);
                    yesterday.setDate(today.getDate() - 1);
                    const currentDay = yesterday.getDate() - 1; // Array index (0-based) for yesterday
                    let yesterdayPatrols = 0;
                    
                    if (municipality.data && Array.isArray(municipality.data)) {
                      yesterdayPatrols = municipality.data[currentDay] || 0;
                    }
                    
                    return (
                      <div key={index} className="p-4 rounded-lg border transition-all duration-300 border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold transition-colors duration-300 text-gray-900">{municipality.municipality}</h4>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            {municipality.district}
                          </span>
                        </div>
                        <div className="text-sm transition-colors duration-300 text-gray-600">
                          Yesterday's Patrols: <span className="font-semibold text-green-600">{yesterdayPatrols}</span> patrols
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                                 <div className="text-center py-8 transition-colors duration-300 text-gray-500">
                   <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                   <p className="text-lg font-medium">No Active Municipalities</p>
                   <p className="text-sm">No municipalities have patrols yesterday</p>
                 </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Inactive Municipalities Modal */}
      {showInactiveModal && (
        <div className="fixed inset-0 flex items-center justify-center z-40 p-4">
          <div className="rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden bg-white">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full flex items-center justify-center bg-red-100">
                  <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold transition-colors duration-300 text-gray-900">Inactive Municipalities</h3>
                  <p className="text-sm transition-colors duration-300 text-gray-600">{correctedInactiveCount} municipalities with no patrols yesterday</p>
                </div>
              </div>
              <button
                onClick={() => setShowInactiveModal(false)}
                className="p-2 rounded-lg transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {correctedInactiveCount > 0 ? (
                <div className="space-y-4">
                  {allMunicipalities.filter(municipality => {
                    const municipalityData = ipatrollerData.find(row => row.municipality === municipality);
                    if (!municipalityData) {
                      return true; // No data means inactive
                    }
                    
                    // Check if municipality is inactive YESTERDAY
                    const today = new Date();
                    const yesterday = new Date(today);
                    yesterday.setDate(today.getDate() - 1);
                    const currentDay = yesterday.getDate() - 1; // Array index (0-based) for yesterday
                    
                    if (municipalityData.data && Array.isArray(municipalityData.data) && municipalityData.data[currentDay] !== undefined) {
                            // Municipality is inactive YESTERDAY if it has less than 5 patrols for yesterday
      return municipalityData.data[currentDay] < 5;
                    }
                    return true; // No data means inactive
                  }).map((municipality, index) => {
                    const municipalityData = ipatrollerData.find(row => row.municipality === municipality);
                    // Get yesterday's patrol count
                    const today = new Date();
                    const yesterday = new Date(today);
                    yesterday.setDate(today.getDate() - 1);
                    const currentDay = yesterday.getDate() - 1; // Array index (0-based) for yesterday
                    let yesterdayPatrols = 0;
                    
                    if (municipalityData && municipalityData.data && Array.isArray(municipalityData.data)) {
                      yesterdayPatrols = municipalityData.data[currentDay] || 0;
                    }
                    const district = municipalityData?.district || 'Unknown District';
                    
                    return (
                      <div key={index} className="p-4 rounded-lg border transition-all duration-300 border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold transition-colors duration-300 text-gray-900">{municipality}</h4>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            {district}
                          </span>
                        </div>
                        <div className="text-sm transition-colors duration-300 text-gray-600">
                          Yesterday's Patrols: <span className="font-semibold text-red-600 dark:text-red-400">{yesterdayPatrols}</span> patrols
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 transition-colors duration-300 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium">No Inactive Municipalities</p>
                  <p className="text-sm">All municipalities have patrols yesterday</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}



      {/* Total Incidents Modal */}
      {showTotalIncidentsModal && (
        <div className="fixed inset-0 flex items-center justify-center z-40 p-4">
          <div className="rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden bg-white">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full flex items-center justify-center bg-purple-100">
                  <AlertTriangle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold transition-colors duration-300 text-gray-900">Total Incidents Breakdown</h3>
                  <p className="text-sm transition-colors duration-300 text-gray-600">{summaryStats.totalIncidents} total incidents reported</p>
                </div>
              </div>
              <button
                onClick={() => setShowTotalIncidentsModal(false)}
                className="p-2 rounded-lg transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {incidents.length > 0 ? (
                <div className="space-y-4">
                  {incidents.map((incident, index) => (
                    <div key={index} className="p-4 rounded-lg border transition-all duration-300 border-gray-200 bg-gray-50">
                      <div className="mb-2">
                        <h4 className="font-semibold transition-colors duration-300 text-gray-900">{incident.incidentType || 'Unknown Type'}</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="transition-colors duration-300 text-gray-600">
                          <span className="font-medium">Location:</span> {incident.location || 'Unknown'}
                        </div>
                        <div className="transition-colors duration-300 text-gray-600">
                          <span className="font-medium">Date:</span> {incident.date?.toDate ? incident.date.toDate().toLocaleDateString() : new Date(incident.date).toLocaleDateString()}
                        </div>
                        {incident.description && (
                          <div className="md:col-span-2 transition-colors duration-300 text-gray-600">
                            <span className="font-medium">Description:</span> {incident.description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 transition-colors duration-300 text-gray-500">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium">No Incidents Found</p>
                  <p className="text-sm">No incidents have been reported yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Total Actions Modal */}
      {showTotalActionsModal && (
        <div className="fixed inset-0 flex items-center justify-center z-40 p-4">
          <div className="rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden bg-white">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full flex items-center justify-center bg-blue-100">
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold transition-colors duration-300 text-gray-900">Total Actions Breakdown</h3>
                  <p className="text-sm transition-colors duration-300 text-gray-600">{summaryStats.totalActions} total actions taken</p>
                </div>
              </div>
              <button
                onClick={() => setShowTotalActionsModal(false)}
                className="p-2 rounded-lg transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {actionReports.length > 0 ? (
                <div className="space-y-4">
                  {actionReports.map((report, index) => (
                    <div key={index} className="p-4 rounded-lg border transition-all duration-300 border-gray-200 bg-gray-50">
                      <div className="mb-2">
                        <h4 className="font-semibold transition-colors duration-300 text-gray-900">{report.what || 'Action Report'}</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="transition-colors duration-300 text-gray-600">
                          <span className="font-medium">Location:</span> {report.where || 'Unknown'}
                        </div>
                        <div className="transition-colors duration-300 text-gray-600">
                          <span className="font-medium">Date:</span> {report.when?.toDate ? report.when.toDate().toLocaleDateString() : new Date(report.when).toLocaleDateString()}
                        </div>
                        <div className="transition-colors duration-300 text-gray-600">
                          <span className="font-medium">Action Taken:</span> {report.actionTaken || 'Not specified'}
                        </div>
                        <div className="transition-colors duration-300 text-gray-600">
                          <span className="font-medium">Priority:</span> {report.priority || 'Not specified'}
                        </div>
                        {report.otherInfo && (
                          <div className="md:col-span-2 transition-colors duration-300 text-gray-600">
                            <span className="font-medium">Additional Info:</span> {report.otherInfo}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 transition-colors duration-300 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium">No Action Reports</p>
                  <p className="text-sm">No action reports have been submitted yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}


    </Layout>
  );
}

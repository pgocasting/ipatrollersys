import React, { useState, useEffect, useRef } from "react";
import Layout from "./Layout";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Badge } from "./components/ui/badge";
import { useTheme } from "./ThemeContext";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Upload, 
  Plus, 
  BarChart3, 
  Trash2, 
  FileText, 
  CheckCircle, 
  Search, 
  Clock, 
  MapPin, 
  User, 
  X,
  AlertTriangle,
  Eye,
  Edit,
  Download,
  Printer,
  Filter,
  Calendar,
  Building2,
  Users,
  Activity,
  TrendingUp,
  AlertCircle,
  Shield,
  Car,
  Home,
  Briefcase,
  Heart,
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
  Headphones as HeadphonesIcon,
  Speaker as SpeakerIcon,
  Radio as RadioIcon,
  Tv as TvIcon,
  Monitor as MonitorIcon,
  Smartphone as SmartphoneIcon,
  Tablet as TabletIcon,
  Laptop as LaptopIcon,
  Server as ServerIcon,
  Mouse as MouseIcon,
  Keyboard as KeyboardIcon,
  MonitorSpeaker as MonitorSpeakerIcon
} from "lucide-react";

export default function IncidentsReports({ onLogout, onNavigate, currentPage }) {
  const { isDarkMode } = useTheme();
  const fileInputRef = useRef(null);
  
  // Function to automatically identify incident type from description
  const identifyIncidentType = (description) => {
    if (!description) return "Other";
    
    const desc = description.toLowerCase();
    
    // Traffic-related incidents
    if (desc.includes('speeding') || desc.includes('traffic violation') || desc.includes('traffic ticket')) {
      return "Traffic Violation";
    }
    if (desc.includes('traffic accident') || desc.includes('car crash') || desc.includes('vehicle collision')) {
      if (desc.includes('injury') || desc.includes('hurt') || desc.includes('wounded')) {
        return "Traffic Accident with Injury";
      }
      if (desc.includes('death') || desc.includes('fatal') || desc.includes('killed')) {
        return "Traffic Accident with Death";
      }
      if (desc.includes('property damage') || desc.includes('damage to property')) {
        return "Traffic Accident with Property Damage";
      }
      return "Traffic Accident";
    }
    
    // Public safety incidents
    if (desc.includes('public disturbance') || desc.includes('disturbance') || desc.includes('commotion')) {
      return "Public Disturbance";
    }
    if (desc.includes('noise complaint') || desc.includes('noise') || desc.includes('loud')) {
      return "Noise Complaint";
    }
    if (desc.includes('suspicious') || desc.includes('suspicious activity') || desc.includes('loitering')) {
      return "Suspicious Activity";
    }
    
    // Property crimes
    if (desc.includes('theft') || desc.includes('stolen') || desc.includes('shoplifting')) {
      return "Theft";
    }
    if (desc.includes('vandalism') || desc.includes('graffiti') || desc.includes('property damage')) {
      return "Vandalism";
    }
    if (desc.includes('property damage') || desc.includes('damage to')) {
      return "Property Damage";
    }
    
    // Violent crimes
    if (desc.includes('assault') || desc.includes('attack') || desc.includes('physical altercation')) {
      return "Assault";
    }
    if (desc.includes('domestic violence') || desc.includes('domestic abuse')) {
      return "Domestic Violence";
    }
    if (desc.includes('harassment') || desc.includes('harassing')) {
      return "Harassment";
    }
    
    // Drug-related
    if (desc.includes('drug') || desc.includes('illegal drugs') || desc.includes('substance')) {
      return "Drug-related";
    }
    if (desc.includes('illegal drugs') || desc.includes('drug trafficking')) {
      return "Illegal Drugs";
    }
    
    // Financial crimes
    if (desc.includes('fraud') || desc.includes('credit card fraud') || desc.includes('scam')) {
      return "Fraud";
    }
    if (desc.includes('bribery') || desc.includes('bribe')) {
      return "Bribery";
    }
    if (desc.includes('extortion') || desc.includes('blackmail')) {
      return "Extortion";
    }
    
    // Vehicle crimes
    if (desc.includes('car theft') || desc.includes('vehicle stolen')) {
      return "Car Theft";
    }
    if (desc.includes('carnapping') || desc.includes('carjacking')) {
      return "Carnapping";
    }
    if (desc.includes('carjacking')) {
      return "Carjacking";
    }
    
    // Serious crimes
    if (desc.includes('robbery') || desc.includes('armed robbery')) {
      return "Robbery";
    }
    if (desc.includes('kidnapping') || desc.includes('abduction')) {
      return "Kidnapping";
    }
    if (desc.includes('rape') || desc.includes('sexual assault')) {
      return "Rape";
    }
    if (desc.includes('murder') || desc.includes('homicide') || desc.includes('killing')) {
      return "Murder";
    }
    if (desc.includes('suicide')) {
      return "Suicide";
    }
    
    // Other crimes
    if (desc.includes('illegal gambling') || desc.includes('gambling')) {
      return "Illegal Gambling";
    }
    if (desc.includes('illegal firearms') || desc.includes('illegal gun')) {
      return "Illegal Firearms";
    }
    if (desc.includes('trespassing') || desc.includes('trespass')) {
      return "Trespassing";
    }
    if (desc.includes('migrant workers') || desc.includes('overseas filipino')) {
      return "Migrant Workers and Overseas Filipino";
    }
    
    return "Other";
  };

  // Incident types for dropdown
  const incidentTypes = [
    "Traffic Violation",
    "Traffic Accident",
    "Traffic Accident with Injury",
    "Traffic Accident with Death",
    "Traffic Accident with Property Damage",
    "Traffic Accident with Personal Injury",
    "Traffic Accident with Property Damage",
    "Public Disturbance",
    "Suspicious Activity",
    "Theft",
    "Assault",
    "Vandalism",
    "Drug-related",
    "Domestic Violence",
    "Fraud",
    "Property Damage",
    "Noise Complaint",
    "Trespassing",
    "Bribery",
    "Extortion",
    "Kidnapping",
    "Rape",
    "Robbery",
    "Murder",
    "Suicide",
    "Homicide",
    "Harassment",
    "Migrant Workers and Overseas Filipino",
    "Illegal Drugs",
    "Illegal Gambling",
    "Illegal Firearms",
    "Carnapping",
    "Car Theft",
    "Carjacking",
    "Other"
  ];

  // Districts for selection
  const districts = [
    "1ST DISTRICT",
    "2ND DISTRICT", 
    "3RD DISTRICT",
    "4TH DISTRICT",
    "5TH DISTRICT"
  ];

  // Municipalities grouped by district
  const municipalitiesByDistrict = {
    "1ST DISTRICT": ["Abucay", "Orani", "Samal", "Hermosa"],
    "2ND DISTRICT": ["Balanga City", "Pilar", "Orion", "Limay"],
    "3RD DISTRICT": ["Bagac", "Dinalupihan", "Mariveles", "Morong"]
  };

  // All municipalities for selection (flattened)
  const municipalities = [
    "Abucay", "Orani", "Samal", "Hermosa", // 1ST DISTRICT
    "Balanga City", "Pilar", "Orion", "Limay", // 2ND DISTRICT
    "Bagac", "Dinalupihan", "Mariveles", "Morong" // 3RD DISTRICT
  ];
  
  const [incidents, setIncidents] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [viewingIncident, setViewingIncident] = useState(null);
  const [editingIncident, setEditingIncident] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("all");



  const [newIncident, setNewIncident] = useState({
    incidentType: "",
    location: "",
    district: "1ST DISTRICT",
    municipality: "Abucay",
    date: "",
    time: "",
    description: "",
    status: "Pending",
    officer: "",
    witnesses: "",
    evidence: "",
    why: "",
    link: "",
    // New Action Taken fields
    actionType: "",
    actionDescription: "",
    assignedOfficer: "",
    actionDate: "",
    completionDate: "",
    followUpNotes: "",
    priority: "Medium",
  });

  const handleAddIncident = () => {
    // Auto-identify incident type if not specified
    const finalIncidentType = newIncident.incidentType || identifyIncidentType(newIncident.description);
    
    const incident = {
      ...newIncident,
      incidentType: finalIncidentType,
      id: incidents.length + 1,
    };
    setIncidents([...incidents, incident]);
    setNewIncident({
      incidentType: "",
      location: "",
      district: "1ST DISTRICT",
      municipality: "Abucay",
      date: "",
      time: "",
      description: "",
      status: "Pending",
      officer: "",
      witnesses: "",
      evidence: "",
      why: "",
      link: "",
      // Reset new Action Taken fields
      actionType: "",
      actionDescription: "",
      assignedOfficer: "",
      actionDate: "",
      completionDate: "",
      followUpNotes: "",
      priority: "Medium",
    });
    setShowAddModal(false);
  };

  // Function to handle district change and update municipality
  const handleDistrictChange = (district) => {
    const municipalitiesForDistrict = municipalitiesByDistrict[district] || [];
    const firstMunicipality = municipalitiesForDistrict[0] || "";
    
    setNewIncident({
      ...newIncident,
      district: district,
      municipality: firstMunicipality
    });
  };

  const handleEditIncident = () => {
    setIncidents(
      incidents.map((incident) =>
        incident.id === editingIncident.id ? editingIncident : incident
      )
    );
    setEditingIncident(null);
    setShowEditModal(false);
  };

  // Function to handle district change in edit modal
  const handleEditDistrictChange = (district) => {
    const municipalitiesForDistrict = municipalitiesByDistrict[district] || [];
    const firstMunicipality = municipalitiesForDistrict[0] || "";
    
    setEditingIncident({
      ...editingIncident,
      district: district,
      municipality: firstMunicipality
    });
  };

  const handleDeleteIncident = (id) => {
    setIncidents(incidents.filter((incident) => incident.id !== id));
  };

  // Import Excel functionality
  const handleImportExcel = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    const isCSV = file.name.endsWith('.csv');

    if (!isExcel && !isCSV) {
      alert('Please select a valid Excel file (.xlsx, .xls) or CSV file (.csv)');
      return;
    }

    const reader = new FileReader();
    
    if (isCSV) {
      // Handle CSV files - treat as single month data
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const lines = text.split('\n');
          const headers = lines[0].split(',').map(header => header.trim());
          
          // Debug: Log the headers found
          
          
          const importedIncidents = [];
          
          for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue;
            
            const values = lines[i].split(',').map(value => value.trim());
            
            // Map to new structure based on user's Excel format
            const description = values[headers.indexOf('What')] || values[headers.indexOf('WHAT')] || values[headers.indexOf('Description')] || values[headers.indexOf('DESCRIPTION')] || '';
            
            const incident = {
              id: importedIncidents.length + 1,
              incidentType: values[headers.indexOf('Type')] || values[headers.indexOf('TYPE')] || identifyIncidentType(description),
              location: values[headers.indexOf('WHERE')] || values[headers.indexOf('Location')] || '',
              district: values[headers.indexOf('DISTRICT')] || values[headers.indexOf('District')] || '1ST DISTRICT',
              municipality: values[headers.indexOf('MUNICIPALITY')] || values[headers.indexOf('Municipality')] || 'Balanga City',
              date: values[headers.indexOf('WHEN')] || '',
              time: values[headers.indexOf('Time')] || values[headers.indexOf('TIME')] || '',
              description: description,
              status: values[headers.indexOf('Status')] || values[headers.indexOf('STATUS')] || 'Pending',
              officer: values[headers.indexOf('WHO')] || values[headers.indexOf('Officer')] || values[headers.indexOf('OFFICER')] || '',
              witnesses: values[headers.indexOf('Witnesses')] || values[headers.indexOf('WITNESSES')] || '',
              evidence: values[headers.indexOf('Evidence')] || values[headers.indexOf('EVIDENCE')] || '',
              why: values[headers.indexOf('WHY')] || values[headers.indexOf('Why')] || '',
              link: values[headers.indexOf('LINK')] || values[headers.indexOf('Link')] || '',
              month: extractMonthFromDate(values[headers.indexOf('WHEN')] || ''),
              // Map ACTION TAKEN to new action fields
              actionType: values[headers.indexOf('ACTION TAKEN')] || values[headers.indexOf('Action Taken')] || values[headers.indexOf('ActionType')] || '',
              actionDescription: values[headers.indexOf('ACTION TAKEN')] || values[headers.indexOf('Action Taken')] || values[headers.indexOf('ActionDescription')] || '',
              assignedOfficer: values[headers.indexOf('WHO')] || values[headers.indexOf('Assigned Officer')] || values[headers.indexOf('AssignedOfficer')] || '',
              actionDate: values[headers.indexOf('WHEN')] || '',
              completionDate: values[headers.indexOf('Completion Date')] || values[headers.indexOf('CompletionDate')] || '',
              followUpNotes: values[headers.indexOf('Follow Up Notes')] || values[headers.indexOf('FollowUpNotes')] || '',
              priority: values[headers.indexOf('Priority')] || values[headers.indexOf('PRIORITY')] || 'Medium',
            };
            

            
            // Only add incidents that have at least some basic data
            if (incident.incidentType || incident.description || incident.location || incident.officer) {
              importedIncidents.push(incident);
            }
          }
          
          if (importedIncidents.length > 0) {
            setIncidents(importedIncidents); // Replace all existing data
            alert(`Successfully imported ${importedIncidents.length} incidents from CSV!`);
          } else {
            alert('No valid data found in the CSV file.');
          }
        } catch (error) {
          alert('Error reading CSV file. Please make sure it\'s a valid CSV file with the correct format.');
        }
      };
      
      reader.readAsText(file);
    } else {
      // Handle Excel files using XLSX library
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          const importedIncidents = [];
          
          // Process each sheet in the workbook
          workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (jsonData.length === 0) return;
            
            // Get headers from first row
            const headers = jsonData[0].map(header => header ? header.toString().trim() : '');
            

            
            // Process data rows
            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i];
              if (!row || row.length === 0) continue;
              
              const values = row.map(value => value ? value.toString().trim() : '');
              
              // Process all data from the Excel sheet
              const dateValue = values[headers.indexOf('WHEN')] || '';
              const month = extractMonthFromDate(dateValue);
              const year = extractYearFromDate(dateValue);
              
              // Process all data from the Excel sheet
              const description = values[headers.indexOf('What')] || values[headers.indexOf('WHAT')] || values[headers.indexOf('Description')] || values[headers.indexOf('DESCRIPTION')] || '';
              
              const incident = {
                id: importedIncidents.length + 1,
                incidentType: values[headers.indexOf('Type')] || values[headers.indexOf('TYPE')] || identifyIncidentType(description),
                location: values[headers.indexOf('WHERE')] || values[headers.indexOf('Location')] || '',
                district: values[headers.indexOf('DISTRICT')] || values[headers.indexOf('District')] || '1ST DISTRICT',
                municipality: values[headers.indexOf('MUNICIPALITY')] || values[headers.indexOf('Municipality')] || 'Balanga City',
                date: dateValue || '',
                time: values[headers.indexOf('Time')] || values[headers.indexOf('TIME')] || '',
                description: description,
                status: values[headers.indexOf('Status')] || values[headers.indexOf('STATUS')] || 'Pending',
                officer: values[headers.indexOf('WHO')] || values[headers.indexOf('Officer')] || values[headers.indexOf('OFFICER')] || '',
                witnesses: values[headers.indexOf('Witnesses')] || values[headers.indexOf('WITNESSES')] || '',
                evidence: values[headers.indexOf('Evidence')] || values[headers.indexOf('EVIDENCE')] || '',
                why: values[headers.indexOf('WHY')] || values[headers.indexOf('Why')] || '',
                link: values[headers.indexOf('LINK')] || values[headers.indexOf('Link')] || '',
                month: month || '',
                // Map ACTION TAKEN to new action fields
                actionType: values[headers.indexOf('ACTION TAKEN')] || values[headers.indexOf('Action Taken')] || values[headers.indexOf('ActionType')] || '',
                actionDescription: values[headers.indexOf('ACTION TAKEN')] || values[headers.indexOf('Action Taken')] || values[headers.indexOf('ActionDescription')] || '',
                assignedOfficer: values[headers.indexOf('WHO')] || values[headers.indexOf('Assigned Officer')] || values[headers.indexOf('AssignedOfficer')] || '',
                actionDate: dateValue || '',
                completionDate: values[headers.indexOf('Completion Date')] || values[headers.indexOf('CompletionDate')] || '',
                followUpNotes: values[headers.indexOf('Follow Up Notes')] || values[headers.indexOf('FollowUpNotes')] || '',
                priority: values[headers.indexOf('Priority')] || values[headers.indexOf('PRIORITY')] || 'Medium',
              };
              

              
              // Only add incidents that have at least some basic data
              if (incident.incidentType || incident.description || incident.location || incident.officer) {
                importedIncidents.push(incident);
              }
            }
          });
          
          if (importedIncidents.length > 0) {
            setIncidents(importedIncidents); // Replace all existing data
            alert(`Successfully imported ${importedIncidents.length} incidents from Excel!`);
          } else {
            alert('No valid data found in the Excel file.');
          }
        } catch (error) {
          console.error('Error reading Excel file:', error);
          alert('Error reading Excel file. Please make sure it\'s a valid Excel file with the correct format.');
        }
      };
      
      reader.readAsArrayBuffer(file);
    }
    
    event.target.value = ''; // Reset file input
  };

  // Function to reset data to sample data with proper municipality detection


  // Helper function to extract month from date
  const extractMonthFromDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // Try to parse different date formats
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        // Check if dateString contains month name
        for (let i = 0; i < monthNames.length; i++) {
          if (dateString.toLowerCase().includes(monthNames[i].toLowerCase())) {
            return monthNames[i];
          }
        }
        return '';
      }
      
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return monthNames[date.getMonth()];
    } catch (error) {
      return '';
    }
  };

  // Helper function to extract year from date
  const extractYearFromDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.getFullYear().toString();
      }
      
      // Try to extract year from string
      const yearMatch = dateString.match(/\b(20\d{2})\b/);
      return yearMatch ? yearMatch[1] : '';
    } catch (error) {
      return '';
    }
  };



  const filteredIncidents = incidents.filter((incident) => {
    const matchesStatus = filterStatus === "all" || incident.status === filterStatus;
    const matchesMonth = selectedMonth === "all" || incident.month === selectedMonth;
    const matchesSearch = searchTerm === "" || 
                         (incident.incidentType && incident.incidentType.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (incident.location && incident.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (incident.municipality && incident.municipality.toLowerCase().includes(searchTerm.toLowerCase()));
    

    
    return matchesStatus && matchesMonth && matchesSearch;
  });



  // Get available months from incidents data
  const availableMonths = [...new Set(incidents.map(incident => incident.month).filter(month => month))];



  const getStatusColor = (status) => {
    switch (status) {
      case "Resolved":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "Under Investigation":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const stats = {
    total: filteredIncidents.length,
    resolved: filteredIncidents.filter(i => 
      i.status === "Resolved" || 
      i.status === "resolved" || 
      i.status === "RESOLVED"
    ).length,
    pending: filteredIncidents.filter(i => 
      i.status === "Pending" || 
      i.status === "pending" || 
      i.status === "PENDING"
    ).length,
    underInvestigation: filteredIncidents.filter(i => 
      i.status === "Under Investigation" || 
      i.status === "under investigation" || 
      i.status === "UNDER INVESTIGATION" ||
      i.status === "Under investigation"
    ).length,
  };

  // Action types for dropdown
  const actionTypes = [
    "Investigation",
    "Warning Issued",
    "Citation Issued",
    "Arrest Made",
    "Case Filed",
    "Referred to Prosecutor",
    "Mediation",
    "Community Service",
    "Fine Imposed",
    "Case Dismissed",
    "Referred to Other Agency",
    "Follow-up Required",
    "No Action Required",
    "Other"
  ];

  // Priority levels
  const priorityLevels = [
    "Low",
    "Medium", 
    "High",
    "Critical"
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Critical":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "High":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "Low":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  // Export functionality
  const exportToExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();
      
      // Prepare data for export
      const exportData = incidents.map(incident => ({
        'Incident Type': incident.incidentType,
        'Date': incident.date,
        'Time': incident.time,
        'Location': incident.location,
        'District': incident.district,
        'Municipality': incident.municipality,
        'Officer': incident.officer,
        'Description': incident.description,
        'Why': incident.why,
        'Action Type': incident.actionType,
        'Action Description': incident.actionDescription,
        'Assigned Officer': incident.assignedOfficer,
        'Action Date': incident.actionDate,
        'Priority': incident.priority,
        'Status': incident.status,
        'Follow-up Notes': incident.followUpNotes,
        'Link': incident.link
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Incidents Report');
      
      // Auto-size columns
      const columnWidths = [
        { wch: 20 }, // Incident Type
        { wch: 15 }, // Date
        { wch: 10 }, // Time
        { wch: 25 }, // Location
        { wch: 15 }, // District
        { wch: 15 }, // Municipality
        { wch: 20 }, // Officer
        { wch: 30 }, // Description
        { wch: 20 }, // Why
        { wch: 20 }, // Action Type
        { wch: 30 }, // Action Description
        { wch: 20 }, // Assigned Officer
        { wch: 15 }, // Action Date
        { wch: 10 }, // Priority
        { wch: 15 }, // Status
        { wch: 30 }, // Follow-up Notes
        { wch: 30 }, // Link
      ];
      worksheet['!cols'] = columnWidths;

      // Generate filename with current date
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const filename = `Incidents_Report_${dateStr}.xlsx`;
      
      XLSX.writeFile(workbook, filename);
      alert(`Report exported successfully as ${filename}`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Error exporting report. Please try again.');
    }
  };

  const exportToCSV = () => {
    try {
      const headers = [
        'Incident Type', 'Date', 'Time', 'Location', 'District', 'Municipality',
        'Officer', 'Description', 'Why', 'Action Type', 'Action Description',
        'Assigned Officer', 'Action Date', 'Priority', 'Status', 'Follow-up Notes', 'Link'
      ];
      
      const csvData = incidents.map(incident => [
        incident.incidentType,
        incident.date,
        incident.time,
        incident.location,
        incident.district,
        incident.municipality,
        incident.officer,
        incident.description,
        incident.why,
        incident.actionType,
        incident.actionDescription,
        incident.assignedOfficer,
        incident.actionDate,
        incident.priority,
        incident.status,
        incident.followUpNotes,
        incident.link
      ]);

      const csvContent = [headers, ...csvData]
        .map(row => row.map(cell => `"${cell || ''}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const filename = `Incidents_Report_${dateStr}.csv`;
      
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert(`Report exported successfully as ${filename}`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Error exporting report. Please try again.');
    }
  };

  // Export Summary Insights to PDF
  const exportSummaryToPDF = () => {
    try {
      console.log('Starting Summary PDF export...');
    const insights = generateSummaryInsights(filteredIncidents);
      console.log('Insights generated:', insights);
      
      const doc = new jsPDF();
      console.log('PDF document created for summary');
      
      // Page 1: MEMORANDUM Header and Overview
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('MEMORANDUM', 14, 22);
      
      // Memorandum details
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('FOR: The Provincial Director, Bataan Police Provincial Office', 14, 35);
      doc.text('FROM: PGBxPNP - Crime Analyst', 14, 42);
      doc.text(`DATE: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, 14, 49);
      doc.text(`SUBJECT: Crime Hotspots and High-Risk Areas Analysis - ${selectedMonth === "all" ? "All Months" : selectedMonth} ${new Date().getFullYear()}`, 14, 56);
      
      // Section B: Crime Hotspots and High-Risk Areas
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('B. Crime Hotspots and High-Risk Areas', 14, 75);
      
      // All 12 municipalities in Bataan
      const allMunicipalities = [
        'Abucay', 'Orani', 'Samal', 'Hermosa', // 1ST DISTRICT
        'Balanga City', 'Pilar', 'Orion', 'Limay', // 2ND DISTRICT
        'Bagac', 'Dinalupihan', 'Mariveles', 'Morong' // 3RD DISTRICT
      ];
      
      // Municipality hotspot analysis - include all 12 municipalities
      const municipalityCounts = {};
      
      // Initialize all municipalities with 0 counts
      allMunicipalities.forEach(municipality => {
        municipalityCounts[municipality] = 0;
      });
      
      // Count incidents for municipalities that have data
      filteredIncidents.forEach(incident => {
        const municipality = incident.municipality || 'Unknown';
        if (municipalityCounts.hasOwnProperty(municipality)) {
          municipalityCounts[municipality]++;
        }
      });
      
      // Sort municipalities by incident count (including those with 0)
      const sortedMunicipalities = Object.entries(municipalityCounts)
        .sort(([,a], [,b]) => b - a);
      
      let yPosition = 85;
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Municipal Hotspot:', 14, yPosition);
      yPosition += 8;
      
      if (sortedMunicipalities.length > 0) {
        const topMunicipality = sortedMunicipalities[0];
        const percentage = ((topMunicipality[1] / filteredIncidents.length) * 100).toFixed(1);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${topMunicipality[0]} is identified as having the highest number of incidents (${topMunicipality[1]}), accounting for approximately ${percentage}% of the total for the province.`, 14, yPosition);
        yPosition += 15;
      }
      
      // Add page number
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Page 1', 190, 280, { align: 'right' });
      
      // Page 2: Location Analysis Table
      doc.addPage();
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Location Analysis:', 14, 22);
      
      // Prepare location table data - include all 12 municipalities
      const locationData = allMunicipalities.map(municipality => {
        const count = municipalityCounts[municipality] || 0;
        return [
          municipality,
          count.toString(),
          count > 0 ? 'Various incident types' : 'No incidents recorded'
        ];
      });
      
      autoTable(doc, {
        head: [['Location', 'Number of Incidents', 'Incident Types']],
        body: locationData,
        startY: 35,
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        margin: { top: 35 }
      });
      
      // Page 3: Trend & Pattern Analysis
      doc.addPage();
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('3. Trend & Pattern Analysis', 14, 22);
      
      let analysisY = 35;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Dominant Crime Type:', 14, analysisY);
      analysisY += 8;
      
      const mostCommonType = insights.mostCommonType;
      const mostCommonCount = insights.incidentTypeCounts[mostCommonType] || 0;
      const percentage = ((mostCommonCount / insights.totalIncidents) * 100).toFixed(1);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${mostCommonType} is the most prevalent issue with ${mostCommonCount} incidents, accounting for ${percentage}% of all recorded events.`, 14, analysisY);
      analysisY += 20;
      
      // Add more analysis sections
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Time of Day Analysis:', 14, analysisY);
      analysisY += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('• Afternoon (12:00 PM - 5:59 PM): Highest frequency of police operations', 20, analysisY);
      analysisY += 6;
      doc.text('• Evening/Late Night (6:00 PM - 11:59 PM): Critical for drug operations and vehicular incidents', 20, analysisY);
      analysisY += 15;
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Root Cause & Contributing Factors:', 14, analysisY);
      analysisY += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('• Socioeconomic Factors: Unemployment linked to criminal activities', 20, analysisY);
      analysisY += 6;
      doc.text('• Vehicular Incidents: Human error as primary cause', 20, analysisY);
      analysisY += 6;
      doc.text('• Mental Health: Family problems and depression in suicide cases', 20, analysisY);
      analysisY += 15;
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Actionable Recommendations:', 14, analysisY);
      analysisY += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('• Enhanced Police Visibility and Patrols in hotspot areas', 20, analysisY);
      analysisY += 6;
      doc.text('• Targeted Law Enforcement Operations during high-risk times', 20, analysisY);
      analysisY += 6;
      doc.text('• Technology and Infrastructure improvements', 20, analysisY);
      analysisY += 6;
      doc.text('• Inter-Agency Collaboration for comprehensive solutions', 20, analysisY);
      
      // Add page numbers
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Page 2', 190, 280, { align: 'right' });
      doc.setPage(3);
      doc.text('Page 3', 190, 280, { align: 'right' });
      
      console.log('Multi-page summary PDF created');
      
      // Generate filename
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const filename = `Crime_Hotspots_Analysis_${selectedMonth === "all" ? "All_Months" : selectedMonth}_${new Date().getFullYear()}.pdf`;
      
      // Show preview window
      const pdfDataUri = doc.output('datauristring');
      const previewWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
      
      previewWindow.document.write(`
        <!DOCTYPE html>
      <html>
        <head>
          <title>PDF Preview - Crime Hotspots Analysis</title>
          <style>
            body { 
              margin: 0;
              padding: 20px;
              font-family: Arial, sans-serif;
              background-color: #f5f5f5;
            }
            .preview-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .preview-header {
              background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
              color: white;
              padding: 20px;
              text-align: center;
            }
            .preview-header h1 {
              margin: 0; 
              font-size: 24px;
            }
            .preview-header p {
              margin: 10px 0 0 0; 
              opacity: 0.9;
            }
            .preview-content {
              padding: 20px;
            }
            .preview-info {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 15px;
              margin-bottom: 20px;
            }
            .preview-info h3 {
              margin: 0 0 10px 0;
              color: #1e293b;
            }
            .preview-info ul {
              margin: 0;
              padding-left: 20px;
            }
            .preview-info li {
              margin: 5px 0;
              color: #475569;
            }
            .preview-actions {
              display: flex;
              gap: 10px;
              justify-content: center;
              padding: 20px;
              background: #f8fafc;
              border-top: 1px solid #e2e8f0;
            }
            .btn {
              padding: 12px 24px;
              border: none;
              border-radius: 6px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s ease;
            }
            .btn-primary {
              background: #ef4444;
              color: white;
            }
            .btn-primary:hover {
              background: #dc2626;
            }
            .btn-secondary {
              background: #6b7280;
              color: white;
            }
            .btn-secondary:hover {
              background: #4b5563;
            }
            .btn-danger {
              background: #ef4444;
              color: white;
            }
            .btn-danger:hover {
              background: #dc2626;
            }
            .pdf-embed {
              width: 100%;
              height: 400px;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
            }
          </style>
        </head>
        <body>
          <div class="preview-container">
            <div class="preview-header">
              <h1>📄 PDF Preview</h1>
              <p>Crime Hotspots Analysis - ${selectedMonth === "all" ? "All Months" : selectedMonth} ${new Date().getFullYear()}</p>
            </div>
            
            <div class="preview-content">
              <div class="preview-info">
                                 <h3>📋 Report Summary</h3>
                 <ul>
                   <li><strong>Total Incidents:</strong> ${filteredIncidents.length}</li>
                   <li><strong>Report Type:</strong> Crime Hotspots Analysis</li>
                   <li><strong>Pages:</strong> 2 pages</li>
                   <li><strong>Municipalities Covered:</strong> All 12 municipalities in Bataan</li>
                   <li><strong>Generated:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</li>
                 </ul>
              </div>
              
              <h3>📖 PDF Preview</h3>
              <embed src="${pdfDataUri}" type="application/pdf" class="pdf-embed" />
            </div>
            
            <div class="preview-actions">
              <button class="btn btn-primary" onclick="savePDF()">
                💾 Save PDF
              </button>
              <button class="btn btn-secondary" onclick="printPDF()">
                🖨️ Print
              </button>
              <button class="btn btn-danger" onclick="closePreview()">
                ❌ Close
              </button>
            </div>
          </div>
          
          <script>
            function savePDF() {
              const link = document.createElement('a');
              link.href = '${pdfDataUri}';
              link.download = '${filename}';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              alert('PDF saved successfully as ${filename}');
            }
            
            function printPDF() {
              const printWindow = window.open('${pdfDataUri}', '_blank');
              printWindow.onload = function() {
                printWindow.print();
              };
            }
            
            function closePreview() {
              window.close();
            }
          </script>
        </body>
        </html>
      `);
      
             previewWindow.document.close();
       console.log('Summary PDF preview window opened');
     } catch (error) {
       console.error('Error exporting Summary PDF:', error);
       alert(`Error exporting Summary PDF: ${error.message}`);
     }
   };

  // Export Incidents to PDF
  const exportIncidentsToPDF = () => {
    try {
      console.log('Starting PDF export...');
      console.log('Filtered incidents:', filteredIncidents);
      console.log('Stats:', stats);
      
      // Create PDF with default page size (a4) and unit (mm)
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Get page dimensions
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      // Set margins (in mm)
      const margin = {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
      };

      // Calculate usable width
      const contentWidth = pageWidth - margin.left - margin.right;

      // Helper function to get Y position with margin
      const getY = (y) => margin.top + y;

      // Helper function to get X position with margin
      const getX = (x) => margin.left + x;

      console.log('PDF document created with dimensions:', { pageWidth, pageHeight, contentWidth });
      
      // Page 1: MEMORANDUM Header and Overview
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('MEMORANDUM', getX(0), getY(2));
      
      // Memorandum details
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('FOR: The Provincial Director, Bataan Police Provincial Office', getX(0), getY(15));
      doc.text('FROM: PGBxPNP - Crime Analyst', getX(0), getY(22));
      doc.text(`DATE: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, getX(0), getY(29));
      doc.text(`SUBJECT: Monthly Crime Analysis Report for ${selectedMonth === "all" ? "All Months" : selectedMonth} ${new Date().getFullYear()}`, getX(0), getY(36));
      
      // Section 1: Data Cleaning & Categorization
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('1. Data Cleaning & Categorization', getX(0), getY(55));
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      
      // Split long text to fit within margins
      const reportText = `This report is based on a comprehensive analysis of ${filteredIncidents.length} incidents recorded in Bataan for ${selectedMonth === "all" ? "the reporting period" : selectedMonth} ${new Date().getFullYear()}.`;
      const splitReportText = doc.splitTextToSize(reportText, contentWidth);
      doc.text(splitReportText, getX(0), getY(65));
      
      // Incident categorization
      const incidentTypeCounts = {};
      filteredIncidents.forEach(incident => {
        const type = incident.incidentType || 'Other';
        incidentTypeCounts[type] = (incidentTypeCounts[type] || 0) + 1;
      });
      
      // Index Crimes
      const indexCrimes = ['Theft', 'Robbery', 'Carnapping', 'Homicide', 'Rape', 'Murder', 'Physical Injuries'];
      const nonIndexCrimes = ['Drug-related', 'Traffic Accident', 'Public Disturbance', 'Suspicious Activity', 'Vandalism', 'Property Damage'];
      
      let yPosition = 80;
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Index Crimes:', getX(0), getY(yPosition));
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      Object.entries(incidentTypeCounts).forEach(([type, count]) => {
        if (indexCrimes.some(crime => type.toLowerCase().includes(crime.toLowerCase()))) {
          // Check if we need a new page
          if (getY(yPosition) > pageHeight - margin.bottom - 20) {
            doc.addPage();
            yPosition = 20; // Reset Y position for new page
          }
          doc.text(`• ${type}: ${count} incident${count > 1 ? 's' : ''}`, getX(6), getY(yPosition));
          yPosition += 6;
        }
      });
      
      yPosition += 5;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      
      // Check if we need a new page
      if (getY(yPosition) > pageHeight - margin.bottom - 40) {
        doc.addPage();
        yPosition = 20; // Reset Y position for new page
      }
      
      doc.text('Non-Index Crimes & Other Incidents:', getX(0), getY(yPosition));
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      Object.entries(incidentTypeCounts).forEach(([type, count]) => {
        if (!indexCrimes.some(crime => type.toLowerCase().includes(crime.toLowerCase()))) {
          // Check if we need a new page
          if (getY(yPosition) > pageHeight - margin.bottom - 20) {
            doc.addPage();
            yPosition = 20; // Reset Y position for new page
          }
          doc.text(`• ${type}: ${count} incident${count > 1 ? 's' : ''}`, getX(6), getY(yPosition));
          yPosition += 6;
        }
      });
      
      // Add page number
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Page 1', pageWidth - margin.right, pageHeight - margin.bottom, { align: 'right' });
      
      // Page 2: Summary Generation
      doc.addPage();
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('2. Summary Generation', getX(0), getY(2));
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('A. Crime Distribution by Municipality/City', getX(0), getY(15));
      
      // All 12 municipalities in Bataan
      const allMunicipalities = [
        'Abucay', 'Orani', 'Samal', 'Hermosa', // 1ST DISTRICT
        'Balanga City', 'Pilar', 'Orion', 'Limay', // 2ND DISTRICT
        'Bagac', 'Dinalupihan', 'Mariveles', 'Morong' // 3RD DISTRICT
      ];
      
      // Municipality breakdown - include all 12 municipalities
      const municipalityCounts = {};
      
      // Initialize all municipalities with 0 counts
      allMunicipalities.forEach(municipality => {
        municipalityCounts[municipality] = { count: 0, types: {} };
      });
      
      // Count incidents for municipalities that have data
      filteredIncidents.forEach(incident => {
        // Try to detect municipality from location and description
        let detectedMunicipalities = [];
        
        // Check location field
        if (incident.location) {
          detectedMunicipalities = detectedMunicipalities.concat(
            detectMunicipalitiesFromLocation(incident.location, allMunicipalities)
          );
        }
        
        // Check description field
        if (incident.description) {
          detectedMunicipalities = detectedMunicipalities.concat(
            detectMunicipalitiesFromLocation(incident.description, allMunicipalities)
          );
        }
        
        // Remove duplicates
        detectedMunicipalities = [...new Set(detectedMunicipalities)];
        
        // If no municipalities detected, use the assigned municipality or Unknown
        if (detectedMunicipalities.length === 0) {
          detectedMunicipalities = [incident.municipality || 'Unknown'];
        }
        
        // Count this incident for each detected municipality
        detectedMunicipalities.forEach(municipality => {
          if (municipalityCounts[municipality]) {
            municipalityCounts[municipality].count++;
            
            // Use the actual incident type from the data
            let type = incident.incidentType;
            
            // If no incident type, try to identify from description
            if (!type && incident.description) {
              type = identifyIncidentType(incident.description);
            }
            
            // Fallback to 'Other' if still no type
            if (!type) {
              type = 'Other';
            }
            
            municipalityCounts[municipality].types[type] = (municipalityCounts[municipality].types[type] || 0) + 1;
          }
        });
      });
      
      // Prepare municipality table data - include all 12 municipalities with detailed breakdown
      const municipalityData = allMunicipalities.map(municipality => {
        const data = municipalityCounts[municipality];
        let breakdown = 'No incidents recorded';
        
        if (Object.entries(data.types).length > 0) {
          // Sort by count (descending) and format exactly like the reference image
          const sortedTypes = Object.entries(data.types)
            .sort(([,a], [,b]) => b - a)
            .map(([type, count]) => `${count} ${type}`);
          breakdown = sortedTypes.join(', ');
        }
        
        return [
          municipality,
          data.count.toString(),
          breakdown
        ];
      });

      // Calculate total count
      const totalCount = Object.values(municipalityCounts).reduce((sum, data) => sum + data.count, 0);
      
      // Add total row (without breakdown)
      municipalityData.push([
        'Total',
        totalCount.toString(),
        ''  // Empty breakdown column
      ]);
      
      // Helper function to write indented text
      const writeIndentedText = (text, indent, y) => {
        const bulletPoint = '•';
        const subBulletPoint = '○';
        const indentSize = 5; // mm per indent level
        const x = getX(indent * indentSize);
        
        // Split text to handle long lines
        const maxWidth = contentWidth - (indent * indentSize);
        const lines = doc.splitTextToSize(text, maxWidth);
        
        // Add bullet points
        if (indent === 1) {
          doc.text(bulletPoint, x - 3, y);
        } else if (indent === 2) {
          doc.text(subBulletPoint, x - 3, y);
        }
        
        // Write the text
        doc.text(lines, x, y);
        
        // Return the height taken by the text
        return lines.length * 5; // 5mm per line
      };

      // Calculate municipality with highest incidents
      const highestMunicipality = municipalityData
        .slice(0, -1) // Exclude total row
        .reduce((prev, curr) => 
          parseInt(curr[1]) > parseInt(prev[1]) ? curr : prev
        );
      
      const highestCount = parseInt(highestMunicipality[1]);
      const highestPercentage = ((highestCount / totalCount) * 100).toFixed(1);

      // Function to add hotspots section
      const addHotspotsSection = (startY) => {
        let y = startY;

        // Add Crime Hotspots section
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('B. Crime Hotspots and High-Risk Areas:', getX(0), y);

        y += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        // Find Mariveles data
        const marivelesData = municipalityData.find(row => row[0] === 'Mariveles');
        const marivelesCount = marivelesData ? parseInt(marivelesData[1]) : 0;
        const marivelesPercentage = ((marivelesCount / totalCount) * 100).toFixed(1);

        // Municipal Hotspot - Mariveles
        y += writeIndentedText(`Municipal Hotspot: Mariveles recorded the highest number of incidents (${marivelesCount}), representing approximately ${marivelesPercentage}% of the total for the province. The incidents are diverse, ranging from vehicular accidents to drug-related arrests.`, 1, y);

        // City Hotspot - Balanga City
        y += 6;
        const balangaData = municipalityData.find(row => row[0] === 'Balanga City');
        if (balangaData) {
          y += writeIndentedText(`City Hotspot: Balanga City follows with ${balangaData[1]} incidents, primarily concentrated on drug-related offenses and warrant-based arrests.`, 1, y);
        }

        // Highway Concerns
        y += 6;
        y += writeIndentedText('Highway Concerns: A significant number of vehicular incidents occurred along major thoroughfares:', 1, y);
        y += 6;
        y += writeIndentedText('Roman Superhighway (Orion, Limay, Mariveles)', 2, y);
        y += 6;
        y += writeIndentedText('Olongapo-Gapan Road (Dinalupihan)', 2, y);
        y += 6;
        y += writeIndentedText('MacArthur Highway (Orani)', 2, y);

        // Barangay Hotspots
        y += 6;
        y += writeIndentedText('Barangay Hotspots: While incidents are spread out, the following barangays recorded multiple events or significant single incidents:', 1, y);
        y += 6;
        y += writeIndentedText('Mariveles: Brgy. Balon Anito, Brgy. Mt. View, Brgy. Cabcaben', 2, y);
        y += 6;
        y += writeIndentedText('Balanga City: Brgy. San Jose, Brgy. Sibacan', 2, y);
        y += 6;
        y += writeIndentedText('Orion: Brgy. Calungusan, Brgy. Daan Bilolo, Brgy. Sabatan', 2, y);

        return y;
      };

      // Draw the table with callback to add hotspots section
      autoTable(doc, {
        head: [['Municipality/City', 'Total Incidents', 'Breakdown']],
        body: municipalityData,
        startY: getY(25),
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: 'linebreak',
          font: 'helvetica'
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        margin: {
          top: margin.top,
          right: margin.right,
          bottom: margin.bottom,
          left: margin.left
        },
        columnStyles: {
          0: { 
            cellWidth: 35,
            fontSize: 8,
            fontStyle: 'normal'
          },
          1: { 
            cellWidth: 25,
            fontSize: 8,
            fontStyle: 'normal',
            halign: 'center'
          },
          2: { 
            cellWidth: contentWidth - 60, // Remaining width after other columns
            fontSize: 8,
            fontStyle: 'normal'
          }
        },
        // Style the total row and handle text wrapping
        didParseCell: function(data) {
          // Style the total row
          if (data.row.index === municipalityData.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [229, 231, 235];
            data.cell.styles.textColor = [0, 0, 0];
            data.cell.styles.fontSize = 9;
          }
          
          // Handle long text in breakdown column
          if (data.column.index === 2 && data.cell.text.length > 0) {
            data.cell.text = doc.splitTextToSize(data.cell.text.toString(), contentWidth - 60);
          }
        },
        // Add page numbers
        didDrawPage: function(data) {
          // Add page number at the bottom
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          const pageNumber = doc.internal.getCurrentPageInfo().pageNumber;
          doc.text(
            `Page ${pageNumber}`,
            pageWidth - margin.right,
            pageHeight - margin.bottom,
            { align: 'right' }
          );
        },
        // Add hotspots section after table
        didDrawCell: function(data) {
          // Check if this is the last cell of the last row
          if (data.row.index === municipalityData.length - 1 && 
              data.column.index === data.table.columns.length - 1) {
            // Get the position after the table
            const finalY = data.cell.y + data.cell.height + 10;
            // Add the hotspots section
            addHotspotsSection(finalY);
          }
        }
      });



      console.log('Multi-page PDF created');
      
      // Generate filename
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const filename = `Crime_Analysis_Report_${selectedMonth === "all" ? "All_Months" : selectedMonth}_${new Date().getFullYear()}.pdf`;
      
      // Show preview window
      const pdfDataUri = doc.output('datauristring');
      const previewWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
      
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>PDF Preview - Crime Analysis Report</title>
          <style>
              body { 
                margin: 0; 
              padding: 20px;
              font-family: Arial, sans-serif;
              background-color: #f5f5f5;
            }
            .preview-container {
              max-width: 800px;
              margin: 0 auto;
                background: white;
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .preview-header {
              background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
              color: white;
              padding: 20px;
              text-align: center;
            }
            .preview-header h1 {
              margin: 0;
              font-size: 24px;
            }
            .preview-header p {
              margin: 10px 0 0 0;
              opacity: 0.9;
            }
            .preview-content {
              padding: 20px;
            }
            .preview-info {
              background: #f8fafc;
                border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 15px;
              margin-bottom: 20px;
            }
            .preview-info h3 {
              margin: 0 0 10px 0;
              color: #1e293b;
            }
            .preview-info ul {
              margin: 0;
              padding-left: 20px;
            }
            .preview-info li {
              margin: 5px 0;
              color: #475569;
            }
            .preview-actions {
              display: flex;
              gap: 10px;
              justify-content: center;
              padding: 20px;
              background: #f8fafc;
              border-top: 1px solid #e2e8f0;
            }
            .btn {
              padding: 12px 24px;
              border: none;
              border-radius: 6px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s ease;
            }
            .btn-primary {
              background: #3b82f6;
              color: white;
            }
            .btn-primary:hover {
              background: #2563eb;
            }
            .btn-secondary {
              background: #6b7280;
              color: white;
            }
            .btn-secondary:hover {
              background: #4b5563;
            }
            .btn-danger {
              background: #ef4444;
              color: white;
            }
            .btn-danger:hover {
              background: #dc2626;
            }
            .pdf-embed {
              width: 100%;
              height: 400px;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
            }
          </style>
        </head>
        <body>
          <div class="preview-container">
            <div class="preview-header">
              <h1>📄 PDF Preview</h1>
              <p>Crime Analysis Report - ${selectedMonth === "all" ? "All Months" : selectedMonth} ${new Date().getFullYear()}</p>
            </div>
            
            <div class="preview-content">
              <div class="preview-info">
                <h3>📋 Report Summary</h3>
                <ul>
                                     <li><strong>Total Incidents:</strong> ${filteredIncidents.length}</li>
                   <li><strong>Report Type:</strong> Crime Analysis Report</li>
                   <li><strong>Pages:</strong> 2 pages</li>
                   <li><strong>Municipalities Covered:</strong> All 12 municipalities in Bataan</li>
                   <li><strong>Generated:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</li>
                </ul>
            </div>

              <h3>📖 PDF Preview</h3>
              <embed src="${pdfDataUri}" type="application/pdf" class="pdf-embed" />
            </div>

            <div class="preview-actions">
              <button class="btn btn-primary" onclick="savePDF()">
                💾 Save PDF
              </button>
              <button class="btn btn-secondary" onclick="printPDF()">
                🖨️ Print
              </button>
              <button class="btn btn-danger" onclick="closePreview()">
                ❌ Close
              </button>
              </div>
            </div>

          <script>
            function savePDF() {
              const link = document.createElement('a');
              link.href = '${pdfDataUri}';
              link.download = '${filename}';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              alert('PDF saved successfully as ${filename}');
            }
            
            function printPDF() {
              const printWindow = window.open('${pdfDataUri}', '_blank');
              printWindow.onload = function() {
                printWindow.print();
              };
            }
            
            function closePreview() {
              window.close();
            }
          </script>
        </body>
      </html>
    `);
      
             previewWindow.document.close();
       console.log('PDF preview window opened');
     } catch (error) {
       console.error('Error exporting PDF:', error);
       alert(`Error exporting PDF: ${error.message}`);
     }
   };

    // Function to detect municipalities from location text
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

  // Generate summary insights
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
    const resolvedIncidents = filteredData.filter(incident => 
      incident.status === 'Resolved' || 
      incident.status === 'resolved' || 
      incident.status === 'RESOLVED'
    ).length;
    const pendingIncidents = filteredData.filter(incident => 
      incident.status === 'Pending' || 
      incident.status === 'pending' || 
      incident.status === 'PENDING'
    ).length;
    const underInvestigation = filteredData.filter(incident => 
      incident.status === 'Under Investigation' || 
      incident.status === 'under investigation' || 
      incident.status === 'UNDER INVESTIGATION' ||
      incident.status === 'Under investigation'
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
    


    // Debug: Log detection results for each incident
    console.log('=== MUNICIPALITY DETECTION DEBUG ===');
    filteredData.forEach((incident, index) => {
      const detectedMunicipalities = detectMunicipalitiesFromLocation(incident.location, [
        'Abucay', 'Orani', 'Samal', 'Hermosa', // 1ST DISTRICT
        'Balanga City', 'Pilar', 'Orion', 'Limay', // 2ND DISTRICT
        'Bagac', 'Dinalupihan', 'Mariveles', 'Morong' // 3RD DISTRICT
      ]);
      
      console.log(`Incident ${index + 1}:`, {
        location: incident.location,
        detectedMunicipalities: detectedMunicipalities,
        assignedDistricts: detectedMunicipalities.map(m => assignDistrictByMunicipality(m))
      });
    });
    console.log('=== END DEBUG ===');

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
    const resolutionRate = totalIncidents > 0 ? ((resolvedIncidents / totalIncidents) * 100).toFixed(1) : 0;
    
    return {
      totalIncidents,
      resolvedIncidents,
      pendingIncidents,
      underInvestigation,
      mostCommonType,
      mostActiveDistrict,
      highestMonth,
      resolutionRate,
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

  return (
    <Layout onLogout={onLogout} onNavigate={onNavigate} currentPage={currentPage}>
      <section className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Incidents Reports
            </h1>
            <p className={`text-lg transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Manage and track incident reports with Excel/CSV import support
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleImportExcel}
              className="bg-green-600 hover:bg-green-700 text-white"
              title="Import Excel/CSV"
            >
              <Upload className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
              title="Add New Incident"
            >
              <Plus className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => setShowSummaryModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              title="Summary Insights"
            >
              <BarChart3 className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => {
                // Simple test first
                try {
                  console.log('Testing basic PDF functionality...');
                  const doc = new jsPDF();
                  doc.text('Test PDF Export', 20, 20);
                  doc.save('test-export.pdf');
                  console.log('Basic test successful');
                  alert('Basic PDF test successful! Check test-export.pdf');
                } catch (error) {
                  console.error('Basic test failed:', error);
                  alert(`Basic test failed: ${error.message}`);
                }
              }}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
              title="Test PDF Export"
            >
              <Zap className="w-5 h-5" />
            </Button>
            <Button
              onClick={exportIncidentsToPDF}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              title="Export to PDF"
            >
              <Printer className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => {
                setIncidents([]);
  
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
              title="Clear All Data"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
            <input
              id="incidents-file-input"
              name="incidents-file-input"
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv,.xlsx,.xls"
              className="hidden"
            />

          </div>
        </div>

        {/* Stats Cards */}
        {selectedMonth !== "all" && (
          <div className={`mb-4 p-3 rounded-lg ${
            isDarkMode ? 'bg-blue-900/20 border border-blue-600/30' : 'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className={`text-sm font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-blue-300' : 'text-blue-700'
              }`}>
                Showing data for: <strong>{selectedMonth}</strong>
              </span>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className={`backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${
            isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>Total Incidents</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</p>
                </div>
                <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'
                }`}>
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${
            isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>Resolved</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.resolved}</p>
                </div>
                <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  isDarkMode ? 'bg-green-900/30' : 'bg-green-100'
                }`}>
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${
            isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>Under Investigation</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.underInvestigation}</p>
                </div>
                <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'
                }`}>
                  <Search className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${
            isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>Pending</p>
                  <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
                </div>
                <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-100'
                }`}>
                  <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className={`backdrop-blur-sm border-0 shadow-lg ${
          isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'
        }`}>
          <CardHeader>
            <CardTitle className={`text-lg font-semibold transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="search" className={`transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Search
                </Label>
                <Input
                  id="search"
                  placeholder="Search incidents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`mt-1 transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                />
              </div>
              <div>
                <Label htmlFor="month-filter" className={`transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Month
                </Label>
                <select
                  id="month-filter"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className={`mt-1 w-full p-2 rounded-md border transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="all">All Months</option>
                  {availableMonths.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="status-filter" className={`transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Status
                </Label>
                <select
                  id="status-filter"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className={`mt-1 w-full p-2 rounded-md border transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="all">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Under Investigation">Under Investigation</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterStatus("all");
                    setSelectedMonth("all");
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Incidents Table */}
        <Card className={`backdrop-blur-sm border-0 shadow-lg ${
          isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'
        }`}>
          <CardHeader>
            <CardTitle className={`text-lg font-semibold transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Incidents List ({filteredIncidents.length} incidents)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b transition-colors duration-300 ${
                    isDarkMode ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    <th className={`text-left p-3 font-medium transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Type</th>
                    <th className={`text-left p-3 font-medium transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>What</th>
                    <th className={`text-left p-3 font-medium transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>When</th>
                    <th className={`text-left p-3 font-medium transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Location</th>
                    <th className={`text-left p-3 font-medium transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Who</th>
                    <th className={`text-left p-3 font-medium transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Why</th>
                    <th className={`text-left p-3 font-medium transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Action Taken</th>
                    <th className={`text-left p-3 font-medium transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIncidents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center">
                        <div className={`text-lg transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {incidents.length === 0 ? (
                            <div>
                              <p className="mb-2">No incidents found.</p>
                              <p className="text-sm">Click "Add Incident" to create your first incident or import data from Excel.</p>
                            </div>
                          ) : (
                            <div>
                              <p className="mb-2">No incidents match your current filters.</p>
                              <p className="text-sm">Try adjusting your search terms or filters.</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredIncidents.map((incident) => (
                    <tr key={incident.id} className={`border-b transition-colors duration-300 ${
                      isDarkMode ? 'border-gray-700 hover:bg-gray-800/50' : 'border-gray-200 hover:bg-gray-50'
                    }`}>
                      <td className="p-3">
                        <div>
                          <p className={`transition-colors duration-300 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {incident.incidentType}
                          </p>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <p className={`transition-colors duration-300 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {incident.description || 'No description available'}
                          </p>

                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <p className={`transition-colors duration-300 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {incident.date}
                          </p>

                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <p className={`transition-colors duration-300 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {incident.location}
                          </p>

                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <p className={`transition-colors duration-300 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {incident.officer}
                          </p>

                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <p className={`transition-colors duration-300 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {incident.why}
                          </p>
                        </div>
                      </td>
                                              <td className="p-3">
                          <div>
                            {incident.actionType ? (
                              <p className={`transition-colors duration-300 ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                {incident.actionType}
                              </p>
                            ) : (
                              <p className={`transition-colors duration-300 ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                No Action
                              </p>
                            )}
                          </div>
                        </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setViewingIncident(incident);
                              setShowViewModal(true);
                            }}
                            className="flex items-center gap-1"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {incident.link && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(incident.link, '_blank')}
                              className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                              title="Open Link"
                            >
                                                          <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingIncident(incident);
                              setShowEditModal(true);
                            }}
                            title="Edit Incident"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteIncident(incident.id)}
                            title="Delete Incident"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Add Incident Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden ${
            isDarkMode ? 'bg-gray-900' : 'bg-white'
          }`}>
            <div className={`flex items-center justify-between p-6 border-b ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h3 className={`text-xl font-bold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Add New Incident
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className={`p-2 rounded-lg transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="incidentType" className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Type
                  </Label>
                  <select
                    id="incidentType"
                    value={newIncident.incidentType}
                    onChange={(e) => setNewIncident({...newIncident, incidentType: e.target.value})}
                    className={`mt-1 w-full p-2 rounded-md border transition-colors duration-300 ${
                      isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  >
                    <option value="">Select Incident Type</option>
                    {incidentTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="date" className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    When
                  </Label>
                  <Input
                    id="date"
                    type="datetime-local"
                    value={newIncident.date}
                    onChange={(e) => setNewIncident({...newIncident, date: e.target.value})}
                    className={`mt-1 transition-colors duration-300 ${
                      isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
                <div>
                  <Label htmlFor="district" className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    District
                  </Label>
                  <select
                    id="district"
                    value={newIncident.district}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    className={`mt-1 w-full p-2 rounded-md border transition-colors duration-300 ${
                      isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  >
                    {districts.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="municipality" className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Municipality
                  </Label>
                  <select
                    id="municipality"
                    value={newIncident.municipality}
                    onChange={(e) => setNewIncident({...newIncident, municipality: e.target.value})}
                    className={`mt-1 w-full p-2 rounded-md border transition-colors duration-300 ${
                      isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  >
                    {municipalitiesByDistrict[newIncident.district]?.map((municipality) => (
                      <option key={municipality} value={municipality}>
                        {municipality}
                      </option>
                    )) || []}
                  </select>
                </div>
                <div>
                  <Label htmlFor="location" className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={newIncident.location}
                    onChange={(e) => setNewIncident({...newIncident, location: e.target.value})}
                    placeholder="Enter specific location"
                    className={`mt-1 transition-colors duration-300 ${
                      isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
                <div>
                  <Label htmlFor="officer" className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Who
                  </Label>
                  <Input
                    id="officer"
                    value={newIncident.officer}
                    onChange={(e) => setNewIncident({...newIncident, officer: e.target.value})}
                    placeholder="Enter officer/accused details"
                    className={`mt-1 transition-colors duration-300 ${
                      isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
                <div>
                  <Label htmlFor="why" className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Why
                  </Label>
                  <Input
                    id="why"
                    value={newIncident.why}
                    onChange={(e) => setNewIncident({...newIncident, why: e.target.value})}
                    placeholder="Enter reason (optional)"
                    className={`mt-1 transition-colors duration-300 ${
                      isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
                <div>
                  <Label htmlFor="status" className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Action Taken
                  </Label>
                  <div className="grid grid-cols-1 gap-3 mt-1">
                    <select
                      id="actionType"
                      value={newIncident.actionType}
                      onChange={(e) => setNewIncident({...newIncident, actionType: e.target.value})}
                      className={`w-full p-2 rounded-md border transition-colors duration-300 ${
                        isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                      }`}
                    >
                      <option value="">Select Action Type</option>
                      {actionTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    
                    <Input
                      placeholder="Assigned Officer"
                      value={newIncident.assignedOfficer}
                      onChange={(e) => setNewIncident({...newIncident, assignedOfficer: e.target.value})}
                      className={`transition-colors duration-300 ${
                        isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                      }`}
                    />
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="date"
                        placeholder="Action Date"
                        value={newIncident.actionDate}
                        onChange={(e) => setNewIncident({...newIncident, actionDate: e.target.value})}
                        className={`transition-colors duration-300 ${
                          isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      />
                      <select
                        value={newIncident.priority}
                        onChange={(e) => setNewIncident({...newIncident, priority: e.target.value})}
                        className={`p-2 rounded-md border transition-colors duration-300 ${
                          isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      >
                        {priorityLevels.map((level) => (
                          <option key={level} value={level}>
                            {level} Priority
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <textarea
                      placeholder="Action Description"
                      value={newIncident.actionDescription}
                      onChange={(e) => setNewIncident({...newIncident, actionDescription: e.target.value})}
                      rows={2}
                      className={`w-full p-2 rounded-md border transition-colors duration-300 ${
                        isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="description" className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    How
                  </Label>
                  <textarea
                    id="description"
                    value={newIncident.description}
                    onChange={(e) => setNewIncident({...newIncident, description: e.target.value})}
                    placeholder="Enter detailed description"
                    rows={4}
                    className={`mt-1 w-full p-3 rounded-md border transition-colors duration-300 ${
                      isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="link" className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Link (Optional)
                  </Label>
                  <Input
                    id="link"
                    value={newIncident.link}
                    onChange={(e) => setNewIncident({...newIncident, link: e.target.value})}
                    placeholder="Enter URL link"
                    className={`mt-1 transition-colors duration-300 ${
                      isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="followUpNotes" className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Follow-up Notes (Optional)
                  </Label>
                  <textarea
                    id="followUpNotes"
                    value={newIncident.followUpNotes}
                    onChange={(e) => setNewIncident({...newIncident, followUpNotes: e.target.value})}
                    placeholder="Enter any follow-up notes or additional information"
                    rows={3}
                    className={`mt-1 w-full p-3 rounded-md border transition-colors duration-300 ${
                      isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
              </div>
            </div>
            <div className={`flex justify-end gap-3 p-6 border-t ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <Button
                variant="outline"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddIncident}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Add Incident
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Incident Modal */}
      {showViewModal && viewingIncident && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden ${
            isDarkMode ? 'bg-gray-900' : 'bg-white'
          }`}>
            <div className={`flex items-center justify-between p-6 border-b ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h3 className={`text-xl font-bold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                View Incident Details
              </h3>
              <button
                onClick={() => setShowViewModal(false)}
                className={`p-2 rounded-lg transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className={`font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    What
                  </Label>
                  <p className={`mt-1 p-3 rounded-md border transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}>
                    {viewingIncident.incidentType}
                  </p>
                </div>
                <div>
                  <Label className={`font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    When
                  </Label>
                  <p className={`mt-1 p-3 rounded-md border transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}>
                    {viewingIncident.date} {viewingIncident.time && `at ${viewingIncident.time}`}
                  </p>
                </div>
                <div>
                  <Label className={`font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Location
                  </Label>
                  <p className={`mt-1 p-3 rounded-md border transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}>
                    {viewingIncident.location}
                  </p>
                </div>
                <div>
                  <Label className={`font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    District
                  </Label>
                  <p className={`mt-1 p-3 rounded-md border transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}>
                    {viewingIncident.district}
                  </p>
                </div>
                <div>
                  <Label className={`font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Municipality
                  </Label>
                  <p className={`mt-1 p-3 rounded-md border transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}>
                    {viewingIncident.municipality}
                  </p>
                </div>
                <div>
                  <Label className={`font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Who
                  </Label>
                  <p className={`mt-1 p-3 rounded-md border transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}>
                    {viewingIncident.officer}
                  </p>
                </div>
                <div>
                  <Label className={`font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Why
                  </Label>
                  <p className={`mt-1 p-3 rounded-md border transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}>
                    {viewingIncident.why || 'Not specified'}
                  </p>
                </div>
                <div>
                  <Label className={`font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Action Taken
                  </Label>
                  <div className={`mt-1 p-3 rounded-md border transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Type:</span>
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          {viewingIncident.actionType || 'Not specified'}
                        </Badge>
                      </div>
                      {viewingIncident.assignedOfficer && (
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Assigned Officer:</span>
                          <span>{viewingIncident.assignedOfficer}</span>
                        </div>
                      )}
                      {viewingIncident.actionDate && (
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Action Date:</span>
                          <span>{viewingIncident.actionDate}</span>
                        </div>
                      )}
                      {viewingIncident.priority && (
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Priority:</span>
                          <Badge className={getPriorityColor(viewingIncident.priority)}>
                            {viewingIncident.priority}
                          </Badge>
                        </div>
                      )}
                      {viewingIncident.actionDescription && (
                        <div>
                          <span className="font-medium">Description:</span>
                          <p className="mt-1 text-sm">{viewingIncident.actionDescription}</p>
                        </div>
                      )}
                      {viewingIncident.followUpNotes && (
                        <div>
                          <span className="font-medium">Follow-up Notes:</span>
                          <p className="mt-1 text-sm">{viewingIncident.followUpNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Label className={`font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    How
                  </Label>
                  <p className={`mt-1 p-3 rounded-md border transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}>
                    {viewingIncident.description || 'No description provided'}
                  </p>
                </div>
                {viewingIncident.link && (
                  <div className="md:col-span-2">
                    <Label className={`font-medium transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Link
                    </Label>
                    <Button
                      onClick={() => window.open(viewingIncident.link, '_blank')}
                      className="mt-1 flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                    >
                      <Eye className="w-4 h-4" />
                      Open Link
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div className={`flex justify-end gap-3 p-6 border-t ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <Button
                variant="outline"
                onClick={() => setShowViewModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Incident Modal */}
      {showEditModal && editingIncident && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden ${
            isDarkMode ? 'bg-gray-900' : 'bg-white'
          }`}>
            <div className={`flex items-center justify-between p-6 border-b ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h3 className={`text-xl font-bold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Edit Incident
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className={`p-2 rounded-lg transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-incidentType" className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Type
                  </Label>
                  <select
                    id="edit-incidentType"
                    value={editingIncident.incidentType}
                    onChange={(e) => setEditingIncident({...editingIncident, incidentType: e.target.value})}
                    className={`mt-1 w-full p-2 rounded-md border transition-colors duration-300 ${
                      isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  >
                    <option value="">Select Incident Type</option>
                    {incidentTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="edit-date" className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    When
                  </Label>
                  <Input
                    id="edit-date"
                    type="datetime-local"
                    value={editingIncident.date}
                    onChange={(e) => setEditingIncident({...editingIncident, date: e.target.value})}
                    className={`mt-1 transition-colors duration-300 ${
                      isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-district" className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    District
                  </Label>
                  <select
                    id="edit-district"
                    value={editingIncident.district}
                    onChange={(e) => handleEditDistrictChange(e.target.value)}
                    className={`mt-1 w-full p-2 rounded-md border transition-colors duration-300 ${
                      isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  >
                    {districts.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="edit-municipality" className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Municipality
                  </Label>
                  <select
                    id="edit-municipality"
                    value={editingIncident.municipality}
                    onChange={(e) => setEditingIncident({...editingIncident, municipality: e.target.value})}
                    className={`mt-1 w-full p-2 rounded-md border transition-colors duration-300 ${
                      isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  >
                    {municipalitiesByDistrict[editingIncident.district]?.map((municipality) => (
                      <option key={municipality} value={municipality}>
                        {municipality}
                      </option>
                    )) || []}
                  </select>
                </div>
                <div>
                  <Label htmlFor="edit-location" className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Location
                  </Label>
                  <Input
                    id="edit-location"
                    value={editingIncident.location}
                    onChange={(e) => setEditingIncident({...editingIncident, location: e.target.value})}
                    placeholder="Enter specific location"
                    className={`mt-1 transition-colors duration-300 ${
                      isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-officer" className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Who
                  </Label>
                  <Input
                    id="edit-officer"
                    value={editingIncident.officer}
                    onChange={(e) => setEditingIncident({...editingIncident, officer: e.target.value})}
                    placeholder="Enter officer/accused details"
                    className={`mt-1 transition-colors duration-300 ${
                      isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-why" className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Why
                  </Label>
                  <Input
                    id="edit-why"
                    value={editingIncident.why}
                    onChange={(e) => setEditingIncident({...editingIncident, why: e.target.value})}
                    placeholder="Enter reason (optional)"
                    className={`mt-1 transition-colors duration-300 ${
                      isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-status" className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Action Taken
                  </Label>
                  <div className="grid grid-cols-1 gap-3 mt-1">
                    <select
                      id="edit-actionType"
                      value={editingIncident.actionType}
                      onChange={(e) => setEditingIncident({...editingIncident, actionType: e.target.value})}
                      className={`w-full p-2 rounded-md border transition-colors duration-300 ${
                        isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                      }`}
                    >
                      <option value="">Select Action Type</option>
                      {actionTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    
                    <Input
                      placeholder="Assigned Officer"
                      value={editingIncident.assignedOfficer}
                      onChange={(e) => setEditingIncident({...editingIncident, assignedOfficer: e.target.value})}
                      className={`transition-colors duration-300 ${
                        isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                      }`}
                    />
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="date"
                        placeholder="Action Date"
                        value={editingIncident.actionDate}
                        onChange={(e) => setEditingIncident({...editingIncident, actionDate: e.target.value})}
                        className={`transition-colors duration-300 ${
                          isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      />
                      <select
                        value={editingIncident.priority}
                        onChange={(e) => setEditingIncident({...editingIncident, priority: e.target.value})}
                        className={`p-2 rounded-md border transition-colors duration-300 ${
                          isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      >
                        {priorityLevels.map((level) => (
                          <option key={level} value={level}>
                            {level} Priority
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <textarea
                      placeholder="Action Description"
                      value={editingIncident.actionDescription}
                      onChange={(e) => setEditingIncident({...editingIncident, actionDescription: e.target.value})}
                      rows={2}
                      className={`w-full p-2 rounded-md border transition-colors duration-300 ${
                        isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="edit-description" className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    How
                  </Label>
                  <textarea
                    id="edit-description"
                    value={editingIncident.description}
                    onChange={(e) => setEditingIncident({...editingIncident, description: e.target.value})}
                    placeholder="Enter detailed description"
                    rows={4}
                    className={`mt-1 w-full p-3 rounded-md border transition-colors duration-300 ${
                      isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="edit-link" className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Link (Optional)
                  </Label>
                  <Input
                    id="edit-link"
                    value={editingIncident.link}
                    onChange={(e) => setEditingIncident({...editingIncident, link: e.target.value})}
                    placeholder="Enter URL link"
                    className={`mt-1 transition-colors duration-300 ${
                      isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="edit-followUpNotes" className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Follow-up Notes (Optional)
                  </Label>
                  <textarea
                    id="edit-followUpNotes"
                    value={editingIncident.followUpNotes}
                    onChange={(e) => setEditingIncident({...editingIncident, followUpNotes: e.target.value})}
                    placeholder="Enter any follow-up notes or additional information"
                    rows={3}
                    className={`mt-1 w-full p-3 rounded-md border transition-colors duration-300 ${
                      isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
              </div>
            </div>
            <div className={`flex justify-end gap-3 p-6 border-t ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditIncident}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Insights Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden ${
            isDarkMode ? 'bg-gray-900' : 'bg-white'
          }`}>
            <div className={`flex items-center justify-between p-6 border-b ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg transition-all duration-300 ${
                  isDarkMode ? 'bg-blue-600/20 border border-blue-500/30' : 'bg-blue-100 border border-blue-200'
                }`}>
                  <BarChart3 className={`w-6 h-6 transition-colors duration-300 ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                </div>
                <div>
                  <h3 className={`text-2xl font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Summary Insights
                  </h3>
                  <p className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Comprehensive analysis of incident data</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    const insights = generateSummaryInsights();
                    alert(`Detection Test Results:
                    
1ST DISTRICT: ${insights.threeDistricts['1ST DISTRICT'].detectedMunicipalities.join(', ') || 'None detected'}
2ND DISTRICT: ${insights.threeDistricts['2ND DISTRICT'].detectedMunicipalities.join(', ') || 'None detected'}
3RD DISTRICT: ${insights.threeDistricts['3RD DISTRICT'].detectedMunicipalities.join(', ') || 'None detected'}

Check browser console for detailed debug information.`);
                  }}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  title="Test Detection"
                >
                  <Zap className="w-5 h-5" />
                </Button>
                <Button
                  onClick={exportSummaryToPDF}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  title="Export to PDF"
                >
                  <Download className="w-5 h-5" />
                </Button>
                <button
                  onClick={() => setShowSummaryModal(false)}
                  className={`p-2 rounded-lg transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                    isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[75vh]">
              {(() => {
                const insights = generateSummaryInsights(filteredIncidents);
                return (
                  <div className="space-y-8">
                    {/* Overview Section */}
                    <div className={`p-6 rounded-xl border-2 ${
                      isDarkMode ? 'bg-blue-900/20 border-blue-600/30' : 'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-lg ${
                          isDarkMode ? 'bg-blue-600/30' : 'bg-blue-100'
                        }`}>
                          <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className={`text-xl font-bold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>📊 Data Overview {selectedMonth !== "all" && `(${selectedMonth})`}</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className={`p-4 rounded-lg ${
                          isDarkMode ? 'bg-blue-800/30' : 'bg-blue-100'
                        }`}>
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-full ${
                              isDarkMode ? 'bg-blue-600/30' : 'bg-blue-200'
                            }`}>
                              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <p className={`text-sm font-medium ${
                              isDarkMode ? 'text-blue-300' : 'text-blue-600'
                            }`}>Total Incidents</p>
                          </div>
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{insights.totalIncidents}</p>
                          <p className={`text-xs ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>{selectedMonth === "all" ? "All records in database" : `Records for ${selectedMonth}`}</p>
                        </div>
                        <div className={`p-4 rounded-lg ${
                          isDarkMode ? 'bg-green-800/30' : 'bg-green-100'
                        }`}>
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-full ${
                              isDarkMode ? 'bg-green-600/30' : 'bg-green-200'
                            }`}>
                              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                            </div>
                            <p className={`text-sm font-medium ${
                              isDarkMode ? 'text-green-300' : 'text-green-600'
                            }`}>Resolved</p>
                          </div>
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{insights.resolvedIncidents}</p>
                          <p className={`text-xs ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>Cases completed</p>
                        </div>
                        <div className={`p-4 rounded-lg ${
                          isDarkMode ? 'bg-yellow-800/30' : 'bg-yellow-100'
                        }`}>
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-full ${
                              isDarkMode ? 'bg-yellow-600/30' : 'bg-yellow-200'
                            }`}>
                              <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <p className={`text-sm font-medium ${
                              isDarkMode ? 'text-yellow-300' : 'text-yellow-600'
                            }`}>Pending</p>
                          </div>
                          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{insights.pendingIncidents}</p>
                          <p className={`text-xs ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>Awaiting response</p>
                        </div>
                        <div className={`p-4 rounded-lg ${
                          isDarkMode ? 'bg-purple-800/30' : 'bg-purple-100'
                        }`}>
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-full ${
                              isDarkMode ? 'bg-purple-600/30' : 'bg-purple-200'
                            }`}>
                              <Search className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <p className={`text-sm font-medium ${
                              isDarkMode ? 'text-purple-300' : 'text-purple-600'
                            }`}>Under Investigation</p>
                          </div>
                          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{insights.underInvestigation}</p>
                          <p className={`text-xs ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>Currently being investigated</p>
                        </div>
                      </div>
                    </div>

                    {/* Three Districts Analysis */}
                    <div className={`p-6 rounded-xl border-2 ${
                      isDarkMode ? 'bg-green-900/20 border-green-600/30' : 'bg-green-50 border-green-200'
                    }`}>
                      <div className="flex items-center gap-3 mb-6">
                        <div className={`p-2 rounded-lg ${
                          isDarkMode ? 'bg-green-600/30' : 'bg-green-100'
                        }`}>
                          <MapPin className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className={`text-xl font-bold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>🗺️ Three Districts Analysis</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* 1ST DISTRICT */}
                        <div className={`p-4 rounded-lg border-2 ${
                          isDarkMode ? 'bg-blue-800/30 border-blue-600/30' : 'bg-blue-100 border-blue-200'
                        }`}>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                            <h4 className={`font-bold ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>1ST DISTRICT</h4>
                          </div>
                          <div className="space-y-3">
                            <div className="text-center">
                              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{insights.threeDistricts['1ST DISTRICT'].count}</p>
                              <p className={`text-sm ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-600'
                              }`}>Incidents Detected</p>
                            </div>
                            <div className={`p-3 rounded-lg ${
                              isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'
                            }`}>
                              <p className={`text-sm font-semibold mb-2 ${
                                isDarkMode ? 'text-blue-300' : 'text-blue-700'
                              }`}>📍 Detected Municipalities:</p>
                              {insights.threeDistricts['1ST DISTRICT'].detectedMunicipalities.length > 0 ? (
                                <div className="space-y-1">
                                  {insights.threeDistricts['1ST DISTRICT'].detectedMunicipalities.map((municipality, index) => (
                                    <div key={index} className={`text-xs px-2 py-1 rounded ${
                                      isDarkMode ? 'bg-blue-800/50 text-blue-300' : 'bg-blue-200 text-blue-800'
                                    }`}>
                                      ✓ {municipality}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className={`text-xs ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>No municipalities detected</p>
                              )}
                            </div>
                            <div className={`text-xs p-2 rounded ${
                              isDarkMode ? 'bg-gray-800/50 text-gray-300' : 'bg-gray-100 text-gray-600'
                            }`}>
                              <p className="font-semibold mb-1">🔍 How it works:</p>
                              <p>Searches for: Abucay, Orani, Samal, Hermosa</p>
                              <p>in location descriptions</p>
                            </div>
                          </div>
                        </div>

                        {/* 2ND DISTRICT */}
                        <div className={`p-4 rounded-lg border-2 ${
                          isDarkMode ? 'bg-green-800/30 border-green-600/30' : 'bg-green-100 border-green-200'
                        }`}>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-3 h-3 rounded-full bg-green-600"></div>
                            <h4 className={`font-bold ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>2ND DISTRICT</h4>
                          </div>
                          <div className="space-y-3">
                            <div className="text-center">
                              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{insights.threeDistricts['2ND DISTRICT'].count}</p>
                              <p className={`text-sm ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-600'
                              }`}>Incidents Detected</p>
                            </div>
                            <div className={`p-3 rounded-lg ${
                              isDarkMode ? 'bg-green-900/30' : 'bg-green-50'
                            }`}>
                              <p className={`text-sm font-semibold mb-2 ${
                                isDarkMode ? 'text-green-300' : 'text-green-700'
                              }`}>📍 Detected Municipalities:</p>
                              {insights.threeDistricts['2ND DISTRICT'].detectedMunicipalities.length > 0 ? (
                                <div className="space-y-1">
                                  {insights.threeDistricts['2ND DISTRICT'].detectedMunicipalities.map((municipality, index) => (
                                    <div key={index} className={`text-xs px-2 py-1 rounded ${
                                      isDarkMode ? 'bg-green-800/50 text-green-300' : 'bg-green-200 text-green-800'
                                    }`}>
                                      ✓ {municipality}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className={`text-xs ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>No municipalities detected</p>
                              )}
                            </div>
                            <div className={`text-xs p-2 rounded ${
                              isDarkMode ? 'bg-gray-800/50 text-gray-300' : 'bg-gray-100 text-gray-600'
                            }`}>
                              <p className="font-semibold mb-1">🔍 How it works:</p>
                              <p>Searches for: Balanga City, Pilar, Orion, Limay</p>
                              <p>in location descriptions</p>
                            </div>
                          </div>
                        </div>

                        {/* 3RD DISTRICT */}
                        <div className={`p-4 rounded-lg border-2 ${
                          isDarkMode ? 'bg-purple-800/30 border-purple-600/30' : 'bg-purple-100 border-purple-200'
                        }`}>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                            <h4 className={`font-bold ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>3RD DISTRICT</h4>
                          </div>
                          <div className="space-y-3">
                            <div className="text-center">
                              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{insights.threeDistricts['3RD DISTRICT'].count}</p>
                              <p className={`text-sm ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-600'
                              }`}>Incidents Detected</p>
                            </div>
                            <div className={`p-3 rounded-lg ${
                              isDarkMode ? 'bg-purple-900/30' : 'bg-purple-50'
                            }`}>
                              <p className={`text-sm font-semibold mb-2 ${
                                isDarkMode ? 'text-purple-300' : 'text-purple-700'
                              }`}>📍 Detected Municipalities:</p>
                              {insights.threeDistricts['3RD DISTRICT'].detectedMunicipalities.length > 0 ? (
                                <div className="space-y-1">
                                  {insights.threeDistricts['3RD DISTRICT'].detectedMunicipalities.map((municipality, index) => (
                                    <div key={index} className={`text-xs px-2 py-1 rounded ${
                                      isDarkMode ? 'bg-purple-800/50 text-purple-300' : 'bg-purple-200 text-purple-800'
                                    }`}>
                                      ✓ {municipality}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className={`text-xs ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>No municipalities detected</p>
                              )}
                            </div>
                            <div className={`text-xs p-2 rounded ${
                              isDarkMode ? 'bg-gray-800/50 text-gray-300' : 'bg-gray-100 text-gray-600'
                            }`}>
                              <p className="font-semibold mb-1">🔍 How it works:</p>
                              <p>Searches for: Bagac, Dinalupihan, Mariveles, Morong</p>
                              <p>in location descriptions</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Explanation Section */}
                      <div className={`mt-6 p-4 rounded-lg ${
                        isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-3">
                          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <h4 className={`font-bold ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>💡 How Detection Works</h4>
                        </div>
                        <div className={`text-sm space-y-2 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          <p>• <strong>Location Analysis:</strong> The system reads the "Location" field from each incident</p>
                          <p>• <strong>Municipality Search:</strong> It searches for municipality names within the location text</p>
                          <p>• <strong>District Assignment:</strong> Each municipality is automatically assigned to its correct district</p>
                          <p>• <strong>Counting:</strong> Incidents are counted based on detected municipalities, not the district field</p>
                          <p>• <strong>Example:</strong> "Brgy. Mabuco, Hermosa, Bataan" → Detects "Hermosa" → Counts as 1ST DISTRICT</p>
                        </div>
                      </div>
                    </div>

                    {/* Three Districts Overview */}
                    <Card className={`backdrop-blur-sm border-0 shadow-lg ${
                      isDarkMode ? 'bg-gray-800/80' : 'bg-white/80'
                    }`}>
                      <CardHeader>
                        <CardTitle className={`text-lg font-semibold transition-colors duration-300 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>Three Districts Overview</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center p-4 rounded-lg bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700">
                            <div className="flex items-center justify-center mb-2">
                              <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-2" />
                              <span className="font-semibold text-blue-700 dark:text-blue-300">1ST DISTRICT</span>
                            </div>
                            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{insights.threeDistricts['1ST DISTRICT'].count}</p>
                            <p className={`text-sm transition-colors duration-300 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-600'
                            }`}>Incidents</p>
                            <div className="mt-2 space-y-1">
                              <div className="text-xs text-blue-600 dark:text-blue-400">
                                <p className="font-semibold">Detected Municipalities:</p>
                                {insights.threeDistricts['1ST DISTRICT'].detectedMunicipalities.length > 0 ? (
                                  <p>{insights.threeDistricts['1ST DISTRICT'].detectedMunicipalities.join(', ')}</p>
                                ) : (
                                  <p>No municipalities detected in locations</p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-center p-4 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700">
                            <div className="flex items-center justify-center mb-2">
                              <Building2 className="w-6 h-6 text-green-600 dark:text-green-400 mr-2" />
                              <span className="font-semibold text-green-700 dark:text-green-300">2ND DISTRICT</span>
                            </div>
                            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{insights.threeDistricts['2ND DISTRICT'].count}</p>
                            <p className={`text-sm transition-colors duration-300 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-600'
                            }`}>Incidents</p>
                            <div className="mt-2 space-y-1">
                              <div className="text-xs text-green-600 dark:text-green-400">
                                <p className="font-semibold">Detected Municipalities:</p>
                                {insights.threeDistricts['2ND DISTRICT'].detectedMunicipalities.length > 0 ? (
                                  <p>{insights.threeDistricts['2ND DISTRICT'].detectedMunicipalities.join(', ')}</p>
                                ) : (
                                  <p>No municipalities detected in locations</p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-center p-4 rounded-lg bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700">
                            <div className="flex items-center justify-center mb-2">
                              <Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400 mr-2" />
                              <span className="font-semibold text-purple-700 dark:text-purple-300">3RD DISTRICT</span>
                            </div>
                            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{insights.threeDistricts['3RD DISTRICT'].count}</p>
                            <p className={`text-sm transition-colors duration-300 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-600'
                            }`}>Incidents</p>
                            <div className="mt-2 space-y-1">
                              <div className="text-xs text-purple-600 dark:text-purple-400">
                                <p className="font-semibold">Detected Municipalities:</p>
                                {insights.threeDistricts['3RD DISTRICT'].detectedMunicipalities.length > 0 ? (
                                  <p>{insights.threeDistricts['3RD DISTRICT'].detectedMunicipalities.join(', ')}</p>
                                ) : (
                                  <p>No municipalities detected in locations</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>



                    {/* Incident Type Analysis */}
                    <Card className={`backdrop-blur-sm border-0 shadow-lg ${
                      isDarkMode ? 'bg-gray-800/80' : 'bg-white/80'
                    }`}>
                      <CardHeader>
                        <CardTitle className={`text-lg font-semibold transition-colors duration-300 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>Incident Type Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {/* Summary Total */}
                        <div className="mb-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center justify-between">
                            <span className={`text-lg font-semibold transition-colors duration-300 ${
                              isDarkMode ? 'text-blue-300' : 'text-blue-700'
                            }`}>Total Incidents by Type</span>
                            <Badge variant="secondary" className="bg-blue-600 text-white dark:bg-blue-500 dark:text-white text-lg px-4 py-2">
                              {Object.values(insights.incidentTypeCounts).reduce((sum, count) => sum + count, 0)} Total
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          {Object.entries(insights.incidentTypeCounts)
                            .sort(([,a], [,b]) => b - a)
                            .map(([type, count]) => (
                              <div key={type} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                <span className={`font-medium transition-colors duration-300 ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>{type}</span>
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm transition-colors duration-300 ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                  }`}>
                                    {((count / Object.values(insights.incidentTypeCounts).reduce((sum, c) => sum + c, 0)) * 100).toFixed(1)}%
                                  </span>
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                    {count} incidents
                                  </Badge>
                                </div>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Location Analysis */}
                    <Card className={`backdrop-blur-sm border-0 shadow-lg ${
                      isDarkMode ? 'bg-gray-800/80' : 'bg-white/80'
                    }`}>
                      <CardHeader>
                        <CardTitle className={`text-lg font-semibold transition-colors duration-300 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>Location Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Top Municipalities */}
                          <div>
                            <h4 className={`text-md font-semibold mb-3 transition-colors duration-300 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>Top Municipalities</h4>
                            <div className="space-y-2">
                              {insights.topMunicipalities.length > 0 ? (
                                insights.topMunicipalities.map((item, index) => (
                                  <div key={item.municipality} className="flex items-center justify-between p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-sm font-medium transition-colors duration-300 ${
                                        isDarkMode ? 'text-blue-300' : 'text-blue-700'
                                      }`}>#{index + 1}</span>
                                      <span className={`font-medium transition-colors duration-300 ${
                                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                      }`}>{item.municipality}</span>
                                    </div>
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                      {item.count} incidents
                                    </Badge>
                                  </div>
                                ))
                              ) : (
                                <div className={`text-center py-4 text-sm transition-colors duration-300 ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  No municipality data available
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Top Specific Locations */}
                          <div>
                            <h4 className={`text-md font-semibold mb-3 transition-colors duration-300 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>Top Specific Locations</h4>
                            <div className="space-y-2">
                              {insights.topLocations.length > 0 ? (
                                insights.topLocations.map((item, index) => (
                                  <div key={item.location} className="flex items-center justify-between p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-sm font-medium transition-colors duration-300 ${
                                        isDarkMode ? 'text-green-300' : 'text-green-700'
                                      }`}>#{index + 1}</span>
                                      <span className={`font-medium transition-colors duration-300 ${
                                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                      }`} title={item.location}>
                                        {item.location.length > 25 ? item.location.substring(0, 25) + '...' : item.location}
                                      </span>
                                    </div>
                                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                      {item.count} incidents
                                    </Badge>
                                  </div>
                                ))
                              ) : (
                                <div className={`text-center py-4 text-sm transition-colors duration-300 ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  No location data available
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* District Analysis */}
                    <Card className={`backdrop-blur-sm border-0 shadow-lg ${
                      isDarkMode ? 'bg-gray-800/80' : 'bg-white/80'
                    }`}>
                      <CardHeader>
                        <CardTitle className={`text-lg font-semibold transition-colors duration-300 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>District Activity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {Object.entries(insights.districtCounts)
                            .sort(([,a], [,b]) => b - a)
                            .map(([district, count]) => (
                              <div key={district} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                <span className={`font-medium transition-colors duration-300 ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>{district}</span>
                                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                  {count} incidents
                                </Badge>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Monthly Trends */}
                    <Card className={`backdrop-blur-sm border-0 shadow-lg ${
                      isDarkMode ? 'bg-gray-800/80' : 'bg-white/80'
                    }`}>
                      <CardHeader>
                        <CardTitle className={`text-lg font-semibold transition-colors duration-300 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>📅 Monthly Trends</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {Object.keys(insights.monthlyCounts).length > 0 ? (
                          <div className="space-y-3">
                            {/* Summary */}
                            <div className={`p-3 rounded-lg ${
                              isDarkMode ? 'bg-purple-900/20' : 'bg-purple-50'
                            }`}>
                              <div className="flex items-center justify-between">
                                <span className={`text-sm font-medium transition-colors duration-300 ${
                                  isDarkMode ? 'text-purple-300' : 'text-purple-700'
                                }`}>Most Active Month</span>
                                <Badge variant="secondary" className="bg-purple-600 text-white dark:bg-purple-500">
                                  {insights.highestMonth}
                                </Badge>
                              </div>
                            </div>
                            
                            {/* Monthly Breakdown */}
                            <div className="space-y-2">
                              {Object.entries(insights.monthlyCounts)
                                .sort(([a], [b]) => {
                                  const monthOrder = [
                                    'January', 'February', 'March', 'April', 'May', 'June',
                                    'July', 'August', 'September', 'October', 'November', 'December'
                                  ];
                                  return monthOrder.indexOf(a) - monthOrder.indexOf(b);
                                })
                                .map(([month, count]) => (
                                  <div key={month} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-2 h-2 rounded-full ${
                                        month === insights.highestMonth ? 'bg-purple-600' : 'bg-gray-400'
                                      }`}></div>
                                      <span className={`font-medium transition-colors duration-300 ${
                                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                      }`}>{month}</span>
                                    </div>
                                    <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                                      {count} incidents
                                    </Badge>
                                  </div>
                                ))}
                            </div>
                          </div>
                        ) : (
                          <div className={`text-center py-6 transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p className="text-sm">No monthly data available</p>
                            <p className="text-xs mt-1">Add incidents with dates to see monthly trends</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                );
              })()}
            </div>
            <div className={`flex justify-end gap-3 p-6 border-t ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <Button
                variant="outline"
                onClick={() => setShowSummaryModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
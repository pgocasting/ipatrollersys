import React, { useState, useEffect } from "react";
import Layout from "./Layout";
import { useTheme } from "./ThemeContext";
import { useFirebase } from "./hooks/useFirebase";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Badge } from "./components/ui/badge";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { 
  Activity,
  AlertTriangle,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Eye,
  Edit,
  Trash2,
  Filter,
  MapPin,
  Printer,
  RefreshCw,
  Search,
  Settings,
  Shield,
  TrendingUp,
  Users,
  X,
  XCircle,
  Zap,
  Target,
  Flag,
  Bell,
  Database,
  Save,
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
  Home,
  Car,
  Building2,
  Star,
  Heart,
  Briefcase,
  Plus,
  FileText
} from "lucide-react";

/**
 * Action Center Component
 * 
 * This component displays action items with filtering, sorting, and CRUD operations.
 * 
 * Expected data structure for actionItems:
 * [
 *   {
 *     id: string,
 *     municipality: string,
 *     district: string,
 *     department: string,
 *     what: string,
 *     when: Date,
 *     where: string,
 *     who: string,
 *     why: string,
 *     how: string,
 *     actionTaken: string,
 *     otherInfo: string,
 *     status: "pending" | "resolved",
 *     priority: "high" | "medium" | "low",
 *     patrolCount: number,
 *     incidentCount: number,
 *     icon: React.Component
 *   }
 * ]
 */
export default function ActionCenter({ onLogout, onNavigate, currentPage }) {
  const { isDarkMode } = useTheme();
  const { user, saveActionReport, getActionReports, updateActionReport, deleteActionReport } = useFirebase();
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("municipality");
  const [sortOrder, setSortOrder] = useState("asc");
  const [actionItems, setActionItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("pnp");
  const [activeMunicipality, setActiveMunicipality] = useState("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingItem, setViewingItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [newActionReport, setNewActionReport] = useState({
    department: "",
    municipality: "",
    district: "",
    what: "",
    when: "",
    where: "",
    who: "",
    gender: "",
    why: "",
    how: "",
    source: "",
    actionTaken: "",
    otherInfo: ""
  });

  useEffect(() => {
    // Load action items from Firestore
    const loadActionReports = async () => {
      setLoading(true);
      try {
        const result = await getActionReports();
        if (result.success) {
          // Filter by active tab if needed
          const filteredReports = result.data.filter(report => 
            activeTab === "all" || report.department === activeTab
          );
          setActionItems(filteredReports);
        } else {
          console.error('Error loading action reports:', result.error);
          setActionItems([]);
        }
      } catch (error) {
        console.error('Error loading action reports:', error);
        setActionItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadActionReports();
  }, [activeTab, getActionReports]);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Municipalities by district mapping
  const municipalitiesByDistrict = {
    "1ST DISTRICT": [
      "Abucay",
      "Orani", 
      "Samal",
      "Hermosa"
    ],
    "2ND DISTRICT": [
      "Balanga City",
      "Pilar",
      "Orion",
      "Limay"
    ],
    "3RD DISTRICT": [
      "Bagac",
      "Dinalupihan", 
      "Mariveles",
      "Morong"
    ]
  };

  const districts = [
    { id: "all", name: "All Districts" },
    { id: "1ST DISTRICT", name: "1ST DISTRICT" },
    { id: "2ND DISTRICT", name: "2ND DISTRICT" },
    { id: "3RD DISTRICT", name: "3RD DISTRICT" }
  ];

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "high": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "low": return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "info": return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "resolved": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "pending": return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      case "urgent": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const filteredItems = actionItems.filter(item => {
    // Safe search matching across fields
    const st = String(searchTerm || "").trim().toLowerCase();
    const includes = (v) => String(v ?? "").toLowerCase().includes(st);
    const matchesSearch = st === "" ||
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

    // Month/Year filter based on the 'when' field
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
    const matchesMonthYear = selectedMonth === 'all' || selectedYear === 'all' || 
      (d ? (d.getMonth() === selectedMonth && d.getFullYear() === selectedYear) : false);

    const matchesDistrict = selectedDistrict === 'all' || !selectedDistrict || item.district === selectedDistrict;
    const matchesDepartment = item.department === activeTab;
    const matchesMunicipality = activeTab === "pnp" ?
      (activeMunicipality === "all" || item.municipality === activeMunicipality) : true;

    return matchesSearch && matchesMonthYear && matchesDistrict && matchesDepartment && matchesMunicipality;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case "municipality":
        aValue = a.municipality;
        bValue = b.municipality;
        break;
      case "district":
        aValue = a.district;
        bValue = b.district;
        break;
      case "when":
        aValue = a.when;
        bValue = b.when;
        break;
      case "severity":
        aValue = a.severity;
        bValue = b.severity;
        break;
      case "patrolCount":
        aValue = a.patrolCount;
        bValue = b.patrolCount;
        break;
      default:
        aValue = a.municipality;
        bValue = b.municipality;
    }

    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Calculate totals (normalized to match table display)
  const totalActions = sortedItems.filter(item => item.actionTaken && item.actionTaken.trim() !== '').length;
  const normalize = (value) => String(value ?? '').trim().toLowerCase();
  const isResolved = (item) => normalize(item.status) === 'resolved' || normalize(item.actionTaken) === 'resolved';
  const isPending = (item) => !isResolved(item);
  const pendingActions = sortedItems.filter(isPending).length;
  const resolvedActions = sortedItems.filter(isResolved).length;
  const highPriorityActions = sortedItems.filter(item => item.priority === "high").length;
  const totalPatrols = sortedItems.reduce((sum, item) => sum + (item.patrolCount || 0), 0);
  const totalIncidents = sortedItems.reduce((sum, item) => sum + (item.incidentCount || 0), 0);
  // Gender-based counting (cards use these)
  const totalDrugsMale = sortedItems.filter(item => normalize(item.gender) === 'male').length;
  const totalDrugsFemale = sortedItems.filter(item => normalize(item.gender) === 'female').length;
  const totalDrugs = totalDrugsMale + totalDrugsFemale;

  // "Illegals" counters (detect via text fields)
  const ILLEGAL_KEYWORDS = [
    'illegal',
    'gambling', 'sugal', 'pagsusugal', 'pasugal',
    'sakla', 'saklaan',
    'tupada', 'sabong', 'e-sabong', 'esabong', 'online sabong',
    'jueteng',
    'cara y cruz', 'cara y-cruz',
    'color game', 'fruit game',
    'video karera', 'videokarera', 'vk',
    'patulo', 'pa-tulo', 'pa tulo'
  ].map(k => k.toLowerCase());

  const ILLEGAL_CATEGORIES = {
    'Sakla': ['sakla', 'saklaan'],
    'Gambling': ['gambling', 'sugal', 'pagsusugal', 'pasugal', 'jueteng', 'cara y cruz', 'cara y-cruz', 'color game', 'fruit game', 'video karera', 'videokarera', 'vk'],
    'Tupada': ['tupada', 'sabong', 'e-sabong', 'esabong', 'online sabong'],
    'Bingo': ['bingo'],
    'Gro Bar': ['gro bar', 'g.r.o', 'g.r.o.', 'gro', 'bar operation', 'bar girls'],
    'Patulo': ['patulo', 'pa-tulo', 'pa tulo']
  };

  const isIllegal = (item) => {
    const text = [item.what, item.why, item.how, item.otherInfo]
      .map(v => normalize(v))
      .join(' ');
    return ILLEGAL_KEYWORDS.some(kw => text.includes(kw));
  };

  // Count categories and total unique illegal items (based on categories only)
  const { illegalCategoryCounts, totalIllegals } = (() => {
    const counts = Object.fromEntries(Object.keys(ILLEGAL_CATEGORIES).map(k => [k, 0]));
    let total = 0;
    sortedItems.forEach(item => {
      const text = [item.what, item.why, item.how, item.otherInfo]
        .map(v => normalize(v))
        .join(' ');
      let matched = false;
      for (const [cat, keys] of Object.entries(ILLEGAL_CATEGORIES)) {
        if (keys.some(kw => text.includes(kw))) {
          counts[cat] += 1;
          matched = true;
        }
      }
      if (matched) total += 1; // count each item once in total
    });
    return { illegalCategoryCounts: counts, totalIllegals: total };
  })();

  // Action Taken category counts
  const ACTION_TAKEN_ALIASES = {
    'Resolved': ['resolved', 'complete', 'completed', 'closed', 'done'],
    'Pending': ['pending', 'awaiting action', 'to do', 'todo', 'for action', 'for review'],
    'Under Investigation': ['under investigation', 'investigation', 'investigating', 'ongoing', 'ongoing investigation'],
    'Referred': ['referred', 'endorsed', 'forwarded'],
    'Arrested': ['arrested', 'apprehended']
  };

  const getActionTakenLabel = (raw) => {
    const val = normalize(raw);
    if (!val) return 'Unspecified';
    for (const [label, keys] of Object.entries(ACTION_TAKEN_ALIASES)) {
      if (keys.some(k => val.includes(k))) return label;
    }
    // Fallback: capitalize first letter of provided text
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  };

  const actionTakenCounts = (() => {
    const counts = {};
    sortedItems.forEach(item => {
      const label = getActionTakenLabel(item.actionTaken);
      counts[label] = (counts[label] || 0) + 1;
    });
    return counts;
  })();
  
  // Bantay Dagat specific calculations
  const totalFishingViolations = sortedItems.reduce((sum, item) => sum + (item.fishingViolations || 0), 0);
  const totalIllegalFishing = sortedItems.reduce((sum, item) => sum + (item.illegalFishing || 0), 0);
  const totalFishCaught = sortedItems.reduce((sum, item) => sum + (item.fishCaught || 0), 0);
  const totalBoatsInspected = sortedItems.reduce((sum, item) => sum + (item.boatsInspected || 0), 0);
  
  // PG-ENRO specific calculations
  const totalEnvironmentalViolations = sortedItems.reduce((sum, item) => sum + (item.environmentalViolations || 0), 0);
  const totalWasteManagement = sortedItems.reduce((sum, item) => sum + (item.wasteManagement || 0), 0);
  const totalTreePlanting = sortedItems.reduce((sum, item) => sum + (item.treePlanting || 0), 0);
  const totalCleanupOperations = sortedItems.reduce((sum, item) => sum + (item.cleanupOperations || 0), 0);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleAction = (actionId, action) => {
    const item = actionItems.find(item => item.id === actionId);
    
    switch (action) {
      case "view":
        setViewingItem(item);
        setShowViewModal(true);
        break;
      case "edit":
        setEditingItem(item);
        setShowEditModal(true);
        break;
      case "delete":
        setSelectedItem(item);
        setShowDeleteModal(true);
        break;
      default:
        console.log(`Action ${action} performed on item ${actionId}`);
    }
  };

  const confirmDelete = async () => {
    if (selectedItem) {
      try {
        const result = await deleteActionReport(selectedItem.id);
        if (result.success) {
          setActionItems(prevItems => prevItems.filter(item => item.id !== selectedItem.id));
          setShowDeleteModal(false);
          setSelectedItem(null);
          alert(`Successfully deleted: ${selectedItem.what}`);
        } else {
          alert(`Error deleting action report: ${result.error}`);
        }
      } catch (error) {
        console.error('Error deleting action report:', error);
        alert('Error deleting action report. Please try again.');
      }
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedItem(null);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Action Center Report', 14, 22);
    
    // Add report details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Month: ${months[selectedMonth]}`, 14, 35);
    doc.text(`Year: ${selectedYear}`, 14, 42);
    doc.text(`District: ${selectedDistrict || "All Districts"}`, 14, 49);
    doc.text(`Department: ${activeTab.toUpperCase()}`, 14, 56);
    doc.text(`Municipality: ${activeMunicipality === "all" ? "All Municipalities" : activeMunicipality}`, 14, 63);
    
    // Add summary statistics
    doc.text(`Total Actions: ${totalActions}`, 14, 75);
    doc.text(`Total Drugs: ${totalDrugs} (Male: ${totalDrugsMale}, Female: ${totalDrugsFemale})`, 14, 82);
    doc.text(`Pending Actions: ${pendingActions}`, 14, 89);
    doc.text(`Resolved Actions: ${resolvedActions}`, 14, 96);
    doc.text(`High Priority Actions: ${highPriorityActions}`, 14, 103);
    doc.text(`Total Patrols: ${totalPatrols}`, 14, 110);
    doc.text(`Total Incidents: ${totalIncidents}`, 14, 117);
    
    // Prepare table data (hide Why/How in export)
    const tableData = sortedItems.map(item => [
      item.municipality,
      item.district,
      item.what,
      formatDate(item.when),
      item.where,
      // hide who as requested
      // item.who,
      item.actionTaken,
      item.source || 'N/A',
      item.otherInfo
    ]);
    
    // Add table
    doc.autoTable({
      head: [['Municipality', 'District', 'What', 'When', 'Where', 'Action Taken', 'Source', 'Other Information']],
      body: tableData,
      startY: 125,
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
      margin: { top: 125 }
    });
    
    // Save the PDF
    doc.save(`action-center-report-${months[selectedMonth].toLowerCase()}-${selectedYear}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (date) => {
    // Handle Firestore Timestamp objects
    if (date && typeof date === 'object' && date.seconds) {
      return new Date(date.seconds * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    // Handle both Date objects and strings
    if (typeof date === 'string') {
      return date; // Return the string as is
    }
    if (date instanceof Date) {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return date; // Fallback
  };

  const handleAddActionReport = () => {
    setShowAddModal(true);
  };

  const handleSubmitActionReport = async () => {
    try {
      const newReport = {
        id: `action-${Date.now()}`,
        ...newActionReport,
        status: newActionReport.actionTaken === "Resolved" ? "resolved" : "pending",
        priority: "medium",
        patrolCount: 0,
        incidentCount: 0,
        icon: "AlertCircle"
      };

      const result = await saveActionReport(newReport);
      if (result.success) {
        setActionItems(prevItems => [...prevItems, newReport]);
        // Keep the add modal open to allow adding multiple reports
        setNewActionReport({
          department: "",
          municipality: "",
          district: "",
          what: "",
          when: "",
          where: "",
          who: "",
          gender: "",
          why: "",
          how: "",
          source: "",
          actionTaken: "",
          otherInfo: ""
        });
        alert("Action report added successfully!");
      } else {
        alert(`Error saving action report: ${result.error}`);
      }
    } catch (error) {
      console.error('Error submitting action report:', error);
      alert('Error saving action report. Please try again.');
    }
  };

  const handleCancelAdd = () => {
    setShowAddModal(false);
    setNewActionReport({
      department: "",
      municipality: "",
      district: "",
      what: "",
      when: "",
      where: "",
      who: "",
      why: "",
      how: "",
      source: "",
      actionTaken: "",
      otherInfo: ""
    });
  };

  const handleEditActionReport = async () => {
    try {
      const updatedReport = {
        ...editingItem,
        status: editingItem.actionTaken === "Resolved" ? "resolved" : "pending"
      };

      const result = await updateActionReport(editingItem.id, updatedReport);
      if (result.success) {
        setActionItems(prevItems => 
          prevItems.map(item => 
            item.id === editingItem.id ? updatedReport : item
          )
        );
        setShowEditModal(false);
        setEditingItem(null);
        alert("Action report updated successfully!");
      } else {
        alert(`Error updating action report: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating action report:', error);
      alert('Error updating action report. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingItem(null);
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setViewingItem(null);
  };

  const handleEditInputChange = (field, value) => {
    setEditingItem(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      
      // If municipality is being changed, automatically set the corresponding district
      if (field === 'municipality') {
        // Find which district this municipality belongs to
        for (const [district, municipalities] of Object.entries(municipalitiesByDistrict)) {
          if (municipalities.includes(value)) {
            updated.district = district;
            break;
          }
        }
      }
      
      return updated;
    });
  };

  const handleInputChange = (field, value) => {
    setNewActionReport(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      
      // If municipality is being changed, automatically set the corresponding district
      if (field === 'municipality') {
        // Find which district this municipality belongs to
        for (const [district, municipalities] of Object.entries(municipalitiesByDistrict)) {
          if (municipalities.includes(value)) {
            updated.district = district;
            break;
          }
        }
      }
      
      return updated;
    });
  };

  return (
    <Layout onLogout={onLogout} onNavigate={onNavigate} currentPage={currentPage}>
      <div className={`w-full h-screen flex flex-col transition-all duration-300 ${
        isDarkMode 
          ? 'bg-gray-900' 
          : 'bg-gray-50'
      }`}>
        {/* Compact Header */}
        <div className={`flex-shrink-0 px-6 py-4 border-b transition-all duration-300 ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className={`text-3xl font-bold transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Action Center
                </h1>
                <p className={`text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Centralized monitoring and management dashboard
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleAddActionReport}
                variant="outline" 
                size="sm"
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Report
              </Button>
              <Button 
                onClick={() => {
                  setLoading(true);
                  setTimeout(() => setLoading(false), 500);
                }} 
                variant="outline" 
                size="sm"
                disabled={loading}
                className="text-xs"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={exportToPDF} variant="outline" size="sm" className="text-xs">
                <Download className="h-3 w-3 mr-1" />
                Export
              </Button>
              <Button onClick={handlePrint} variant="outline" size="sm" className="text-xs">
                <Printer className="h-3 w-3 mr-1" />
                Print
              </Button>
            </div>
          </div>
        </div>

        {/* Compact Department Navigation */}
        <div className="flex-shrink-0 px-6 py-2">
          <div className={`rounded-lg shadow-sm border overflow-hidden transition-all duration-300 ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="grid grid-cols-3 gap-1 p-1">
              <button
                onClick={() => {
                  setActiveTab("pnp");
                  setActiveMunicipality("all");
                }}
                className={`relative group p-2 rounded-lg transition-all duration-300 ${
                  activeTab === "pnp"
                    ? "bg-blue-500 text-white shadow-lg"
                    : isDarkMode 
                      ? "bg-gray-700 hover:bg-blue-900/20 text-gray-300"
                      : "bg-white hover:bg-blue-50 text-gray-700"
                }`}
              >
                <div className="flex flex-col items-center text-center space-y-1">
                  <div className={`p-1 rounded-full ${
                    activeTab === "pnp" 
                      ? "bg-white/20" 
                      : isDarkMode ? "bg-blue-900/40" : "bg-blue-100/80"
                  }`}>
                    <Shield className={`h-3 w-3 ${
                      activeTab === "pnp" ? "text-white" : isDarkMode ? "text-blue-400" : "text-blue-600"
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs">PNP</h3>
                    <p className="text-xs opacity-80">Police Operations</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setActiveTab("agriculture");
                  setActiveMunicipality("all");
                }}
                className={`relative group p-2 rounded-lg transition-all duration-300 ${
                  activeTab === "agriculture"
                    ? "bg-green-500 text-white shadow-lg"
                    : isDarkMode 
                      ? "bg-gray-700 hover:bg-green-900/20 text-gray-300"
                      : "bg-white hover:bg-green-50 text-gray-700"
                }`}
              >
                <div className="flex flex-col items-center text-center space-y-1">
                  <div className={`p-1 rounded-full ${
                    activeTab === "agriculture" 
                      ? "bg-white/20" 
                      : isDarkMode ? "bg-green-900/40" : "bg-green-100/80"
                  }`}>
                    <TrendingUp className={`h-3 w-3 ${
                      activeTab === "agriculture" ? "text-white" : isDarkMode ? "text-green-400" : "text-green-600"
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs">Agriculture</h3>
                    <p className="text-xs opacity-80">Bantay Dagat</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setActiveTab("pgenro");
                  setActiveMunicipality("all");
                }}
                className={`relative group p-2 rounded-lg transition-all duration-300 ${
                  activeTab === "pgenro"
                    ? "bg-purple-500 text-white shadow-lg"
                    : isDarkMode 
                      ? "bg-gray-700 hover:bg-purple-900/20 text-gray-300"
                      : "bg-white hover:bg-purple-50 text-gray-700"
                }`}
              >
                <div className="flex flex-col items-center text-center space-y-1">
                  <div className={`p-1 rounded-full ${
                    activeTab === "pgenro" 
                      ? "bg-white/20" 
                      : isDarkMode ? "bg-purple-900/40" : "bg-purple-100/80"
                  }`}>
                    <AlertCircle className={`h-3 w-3 ${
                      activeTab === "pgenro" ? "text-white" : isDarkMode ? "text-purple-400" : "text-purple-600"
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs">PG-Enro</h3>
                    <p className="text-xs opacity-80">Environment</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>



        {/* Main Content Area - Takes remaining space */}
        <div className="flex-1 flex flex-col min-h-0 px-6 py-2">
          {/* Filters & Search */}
          <div className="flex-shrink-0 mb-3">
            <div className={`rounded-lg shadow-sm border p-3 transition-all duration-300 ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${
                  isDarkMode ? 'bg-blue-900/40' : 'bg-blue-100/80'
                }`}>
                  <Filter className={`h-4 w-4 ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                </div>
                <div>
                  <h3 className={`text-base font-semibold transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>Filters & Search</h3>
                  <p className={`text-xs transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Refine your data view</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className={`text-xs font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                    className={`w-full p-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-xs ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-700 text-white' 
                        : 'border-gray-200 bg-white text-gray-900'
                    }`}
                  >
                    <option value="all">All Months</option>
                    {months.map((month, index) => (
                      <option key={index} value={index}>{month}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className={`text-xs font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                    className={`w-full p-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-xs ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-700 text-white' 
                        : 'border-gray-200 bg-white text-gray-900'
                    }`}
                  >
                    <option value="all">All Years</option>
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className={`text-xs font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>District</label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className={`w-full p-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-xs ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-700 text-white' 
                        : 'border-gray-200 bg-white text-gray-900'
                    }`}
                  >
                    <option value="all">All Districts</option>
                    {districts.map((district) => (
                      <option key={district.id} value={district.id}>{district.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className={`text-xs font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Search</label>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search actions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`pl-8 p-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-xs ${
                        isDarkMode 
                          ? 'border-gray-600 bg-gray-700 text-white' 
                          : 'border-gray-200 bg-white text-gray-900'
                      }`}
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end mt-3">
                <Button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedDistrict("");
                    setSelectedMonth(new Date().getMonth());
                    setSelectedYear(new Date().getFullYear());
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-gray-800 text-white border-gray-600 hover:bg-gray-700 text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Clear All Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="flex-shrink-0 mb-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {/* PNP Tab - Drug Related Stats */}
              {activeTab === "pnp" && (
                <>
                  {/* Total Card */}
                  <div className="bg-gray-600 rounded-lg p-3 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-100 text-xs font-medium">Total</p>
                        <p className="text-lg font-bold">{actionItems.length}</p>
                        <p className="text-gray-200 text-xs">All reports</p>
                      </div>
                      <div className="p-1.5 bg-white/20 rounded-full">
                        <Database className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  {/* Actions Card */}
                  <div className="bg-blue-500 rounded-lg p-3 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-xs font-medium">Action Taken</p>
                        <p className="text-lg font-bold">{totalActions}</p>
                        <p className="text-blue-200 text-xs">Actions with status</p>
                      </div>
                      <div className="p-1.5 bg-white/20 rounded-full">
                        <Activity className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  {/* Drugs Card */}
                  <div className="bg-red-500 rounded-lg p-3 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-red-100 text-xs font-medium">Drugs</p>
                        <p className="text-lg font-bold">{totalDrugs}</p>
                        <p className="text-red-200 text-xs">Male: {totalDrugsMale} | Female: {totalDrugsFemale}</p>
                      </div>
                      <div className="p-1.5 bg-white/20 rounded-full">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  {/* Illegals Total Card */}
                  <div className="bg-fuchsia-500 rounded-lg p-3 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-fuchsia-100 text-xs font-medium">Illegals</p>
                        <p className="text-lg font-bold">{totalIllegals}</p>
                        <p className="text-fuchsia-200 text-xs">
                          {Object.entries(illegalCategoryCounts)
                            .filter(([, v]) => v > 0)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(' • ') || 'No categories detected'}
                        </p>
                      </div>
                      <div className="p-1.5 bg-white/20 rounded-full">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  

                  {/* Pending Card (from Action Taken) */}
                  <div className="bg-yellow-500 rounded-lg p-3 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-yellow-100 text-xs font-medium">Pending</p>
                        <p className="text-lg font-bold">{actionTakenCounts['Pending'] || 0}</p>
                        <p className="text-yellow-200 text-xs">Awaiting action</p>
                      </div>
                      <div className="p-1.5 bg-white/20 rounded-full">
                        <Clock className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  {/* Resolved Card (from Action Taken) */}
                  <div className="bg-green-500 rounded-lg p-3 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-xs font-medium">Resolved</p>
                        <p className="text-lg font-bold">{actionTakenCounts['Resolved'] || 0}</p>
                        <p className="text-green-200 text-xs">Completed</p>
                      </div>
                      <div className="p-1.5 bg-white/20 rounded-full">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Bantay Dagat Tab - Fishing Related Stats */}
              {activeTab === "agriculture" && (
                <>
                  {/* Total Card */}
                  <div className="bg-gray-600 rounded-lg p-3 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-100 text-xs font-medium">Total</p>
                        <p className="text-lg font-bold">{actionItems.length}</p>
                        <p className="text-gray-200 text-xs">All reports</p>
                      </div>
                      <div className="p-1.5 bg-white/20 rounded-full">
                        <Database className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  {/* Actions Card */}
                  <div className="bg-blue-500 rounded-lg p-3 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-xs font-medium">Action Taken</p>
                        <p className="text-lg font-bold">{totalActions}</p>
                        <p className="text-blue-200 text-xs">Actions with status</p>
                      </div>
                      <div className="p-1.5 bg-white/20 rounded-full">
                        <Activity className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  {/* Fishing Violations Card */}
                  <div className="bg-red-500 rounded-lg p-3 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-red-100 text-xs font-medium">Fishing Violations</p>
                        <p className="text-lg font-bold">{totalFishingViolations}</p>
                        <p className="text-red-200 text-xs">Illegal fishing cases</p>
                      </div>
                      <div className="p-1.5 bg-white/20 rounded-full">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  {/* Illegal Fishing Card */}
                  <div className="bg-orange-500 rounded-lg p-3 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100 text-xs font-medium">Illegal Fishing</p>
                        <p className="text-lg font-bold">{totalIllegalFishing}</p>
                        <p className="text-orange-200 text-xs">Unlawful activities</p>
                      </div>
                      <div className="p-1.5 bg-white/20 rounded-full">
                        <Target className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  {/* Fish Caught Card */}
                  <div className="bg-green-500 rounded-lg p-3 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-xs font-medium">Fish Caught</p>
                        <p className="text-lg font-bold">{totalFishCaught}</p>
                        <p className="text-green-200 text-xs">Seized fish</p>
                      </div>
                      <div className="p-1.5 bg-white/20 rounded-full">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  {/* Boats Inspected Card */}
                  <div className="bg-indigo-500 rounded-lg p-3 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-indigo-100 text-xs font-medium">Boats Inspected</p>
                        <p className="text-lg font-bold">{totalBoatsInspected}</p>
                        <p className="text-indigo-200 text-xs">Vessel checks</p>
                      </div>
                      <div className="p-1.5 bg-white/20 rounded-full">
                        <Shield className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  {/* Action Taken Breakdown Card */}
                  <div className="bg-yellow-500 rounded-lg p-3 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-yellow-100 text-xs font-medium">Action Taken</p>
                        <p className="text-lg font-bold">{totalActions}</p>
                        <p className="text-yellow-200 text-xs">
                          {Object.entries(actionTakenCounts)
                            .filter(([, v]) => v > 0)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(' • ') || 'No actions set'}
                        </p>
                      </div>
                      <div className="p-1.5 bg-white/20 rounded-full">
                        <Clock className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* PG-ENRO Tab - Environmental Stats */}
              {activeTab === "pgenro" && (
                <>
                  {/* Total Card */}
                  <div className="bg-gray-600 rounded-lg p-3 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-100 text-xs font-medium">Total</p>
                        <p className="text-lg font-bold">{actionItems.length}</p>
                        <p className="text-gray-200 text-xs">All reports</p>
                      </div>
                      <div className="p-1.5 bg-white/20 rounded-full">
                        <Database className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  {/* Actions Card */}
                  <div className="bg-blue-500 rounded-lg p-3 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-xs font-medium">Action Taken</p>
                        <p className="text-lg font-bold">{totalActions}</p>
                        <p className="text-blue-200 text-xs">Actions with status</p>
                      </div>
                      <div className="p-1.5 bg-white/20 rounded-full">
                        <Activity className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  {/* Environmental Violations Card */}
                  <div className="bg-red-500 rounded-lg p-3 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-red-100 text-xs font-medium">Env. Violations</p>
                        <p className="text-lg font-bold">{totalEnvironmentalViolations}</p>
                        <p className="text-red-200 text-xs">Environmental cases</p>
                      </div>
                      <div className="p-1.5 bg-white/20 rounded-full">
                        <AlertCircle className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  {/* Waste Management Card */}
                  <div className="bg-green-500 rounded-lg p-3 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-xs font-medium">Waste Management</p>
                        <p className="text-lg font-bold">{totalWasteManagement}</p>
                        <p className="text-green-200 text-xs">Waste operations</p>
                      </div>
                      <div className="p-1.5 bg-white/20 rounded-full">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  {/* Tree Planting Card */}
                  <div className="bg-emerald-500 rounded-lg p-3 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-emerald-100 text-xs font-medium">Tree Planting</p>
                        <p className="text-lg font-bold">{totalTreePlanting}</p>
                        <p className="text-emerald-200 text-xs">Trees planted</p>
                      </div>
                      <div className="p-1.5 bg-white/20 rounded-full">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  {/* Cleanup Operations Card */}
                  <div className="bg-purple-500 rounded-lg p-3 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-xs font-medium">Cleanup Ops</p>
                        <p className="text-lg font-bold">{totalCleanupOperations}</p>
                        <p className="text-purple-200 text-xs">Cleanup activities</p>
                      </div>
                      <div className="p-1.5 bg-white/20 rounded-full">
                        <Shield className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  {/* Action Taken Breakdown Card */}
                  <div className="bg-yellow-500 rounded-lg p-3 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-yellow-100 text-xs font-medium">Action Taken</p>
                        <p className="text-lg font-bold">{totalActions}</p>
                        <p className="text-yellow-200 text-xs">
                          {Object.entries(actionTakenCounts)
                            .filter(([, v]) => v > 0)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(' • ') || 'No actions set'}
                        </p>
                      </div>
                      <div className="p-1.5 bg-white/20 rounded-full">
                        <Clock className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Items Table */}
          <div className="flex-1 min-h-0">
            <div className={`rounded-lg shadow-lg border overflow-hidden h-full flex flex-col transition-all duration-300 ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className={`p-4 border-b transition-all duration-300 ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      isDarkMode ? 'bg-green-900/40' : 'bg-green-100/80'
                    }`}>
                      <BarChart3 className={`h-5 w-5 ${
                        isDarkMode ? 'text-green-400' : 'text-green-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>Action Items</h3>
                      <p className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>Detailed view of all activities</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className={`text-sm ${
                    isDarkMode 
                      ? 'bg-blue-900/40 text-blue-400' 
                      : 'bg-blue-100/80 text-blue-800'
                  }`}>
                    {sortedItems.length} items
                  </Badge>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto p-4">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-3">
                      <RefreshCw className={`h-8 w-8 animate-spin ${
                        isDarkMode ? 'text-blue-400' : 'text-blue-500'
                      }`} />
                      <span className={`text-base transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>Loading action items...</span>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full table-fixed">
                      <thead>
                        <tr className={`border-b transition-all duration-300 ${
                          isDarkMode ? 'border-gray-700' : 'border-gray-200'
                        }`}>
                          <th className={`text-left p-4 font-semibold w-32 transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            <button
                              onClick={() => handleSort("municipality")}
                              className={`flex items-center gap-2 transition-colors ${
                                isDarkMode ? 'hover:text-blue-400' : 'hover:text-blue-600'
                              }`}
                            >
                              Municipality
                              {sortBy === "municipality" && (
                                sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                              )}
                            </button>
                          </th>
                          <th className={`text-left p-4 font-semibold w-28 transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            <button
                              onClick={() => handleSort("district")}
                              className={`flex items-center gap-2 transition-colors ${
                                isDarkMode ? 'hover:text-blue-400' : 'hover:text-blue-600'
                              }`}
                            >
                              District
                              {sortBy === "district" && (
                                sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                              )}
                            </button>
                          </th>
                          <th className={`text-left p-4 font-semibold w-40 transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>What</th>
                          <th className={`text-left p-4 font-semibold w-32 transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            <button
                              onClick={() => handleSort("when")}
                              className={`flex items-center gap-2 transition-colors ${
                                isDarkMode ? 'hover:text-blue-400' : 'hover:text-blue-600'
                              }`}
                            >
                              When
                              {sortBy === "when" && (
                                sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                              )}
                            </button>
                          </th>
                          <th className={`text-left p-4 font-semibold w-32 transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>Where</th>
                          {/* Temporarily hidden columns */}
                          {false && (
                            <>
                              <th className={`text-left p-4 font-semibold w-28 transition-colors duration-300 ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>Who</th>
                              <th className={`text-left p-4 font-semibold w-40 transition-colors duration-300 ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>Why</th>
                              <th className={`text-left p-4 font-semibold w-40 transition-colors duration-300 ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>How</th>
                            </>
                          )}
                          <th className={`text-left p-4 font-semibold w-32 transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>Action Taken</th>
                          <th className={`text-left p-4 font-semibold w-32 transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>Source</th>
                          <th className={`text-left p-4 font-semibold w-40 transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>Other Information</th>
                          <th className={`text-left p-4 font-semibold w-24 transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedItems.map((item) => {
                          // Handle icon rendering properly
                          const getIconComponent = (iconName) => {
                            switch (iconName) {
                              case "AlertCircle":
                                return AlertCircle;
                              case "Activity":
                                return Activity;
                              case "AlertTriangle":
                                return AlertTriangle;
                              case "BarChart3":
                                return BarChart3;
                              case "Calendar":
                                return Calendar;
                              case "CheckCircle":
                                return CheckCircle;
                              case "Clock":
                                return Clock;
                              case "Download":
                                return Download;
                              case "Eye":
                                return Eye;
                              case "Edit":
                                return Edit;
                              case "Trash2":
                                return Trash2;
                              case "Filter":
                                return Filter;
                              case "MapPin":
                                return MapPin;
                              case "Printer":
                                return Printer;
                              case "RefreshCw":
                                return RefreshCw;
                              case "Search":
                                return Search;
                              case "Settings":
                                return Settings;
                              case "Shield":
                                return Shield;
                              case "TrendingUp":
                                return TrendingUp;
                              case "Users":
                                return Users;
                              case "X":
                                return X;
                              case "XCircle":
                                return XCircle;
                              case "Zap":
                                return Zap;
                              case "Target":
                                return Target;
                              case "Flag":
                                return Flag;
                              case "Bell":
                                return Bell;
                              case "Database":
                                return Database;
                              case "Save":
                                return Save;
                              case "MoreHorizontal":
                                return MoreHorizontal;
                              case "ChevronDown":
                                return ChevronDown;
                              case "ChevronUp":
                                return ChevronUp;
                              case "ChevronLeft":
                                return ChevronLeft;
                              case "ChevronRight":
                                return ChevronRight;
                              case "ArrowUp":
                                return ArrowUp;
                              case "ArrowDown":
                                return ArrowDown;
                              case "ArrowLeft":
                                return ArrowLeft;
                              case "ArrowRight":
                                return ArrowRight;
                              case "Minus":
                                return Minus;
                              case "Maximize2":
                                return Maximize2;
                              case "Minimize2":
                                return Minimize2;
                              case "RotateCcw":
                                return RotateCcw;
                              case "RotateCw":
                                return RotateCw;
                              case "ZoomIn":
                                return ZoomIn;
                              case "ZoomOut":
                                return ZoomOut;
                              case "Move":
                                return Move;
                              case "Copy":
                                return Copy;
                              case "Scissors":
                                return Scissors;
                              case "Link":
                                return Link;
                              case "Unlink":
                                return Unlink;
                              case "Lock":
                                return Lock;
                              case "Unlock":
                                return Unlock;
                              case "Key":
                                return Key;
                              case "Mail":
                                return Mail;
                              case "Phone":
                                return Phone;
                              case "MessageSquare":
                                return MessageSquare;
                              case "Video":
                                return Video;
                              case "Camera":
                                return Camera;
                              case "Mic":
                                return Mic;
                              case "Headphones":
                                return Headphones;
                              case "Volume2":
                                return Volume2;
                              case "VolumeX":
                                return VolumeX;
                              case "Play":
                                return Play;
                              case "Pause":
                                return Pause;
                              case "SkipBack":
                                return SkipBack;
                              case "SkipForward":
                                return SkipForward;
                              case "Rewind":
                                return Rewind;
                              case "FastForward":
                                return FastForward;
                              case "Shuffle":
                                return Shuffle;
                              case "Repeat":
                                return Repeat;
                              case "Volume1":
                                return Volume1;
                              case "Volume":
                                return Volume;
                              case "Speaker":
                                return Speaker;
                              case "Radio":
                                return Radio;
                              case "Tv":
                                return Tv;
                              case "Monitor":
                                return Monitor;
                              case "Smartphone":
                                return Smartphone;
                              case "Tablet":
                                return Tablet;
                              case "Laptop":
                                return Laptop;
                              case "Server":
                                return Server;
                              case "Mouse":
                                return Mouse;
                              case "Keyboard":
                                return Keyboard;
                              case "MonitorSpeaker":
                                return MonitorSpeaker;
                              case "User":
                                return User;
                              case "Home":
                                return Home;
                              case "Car":
                                return Car;
                              case "Building2":
                                return Building2;
                              case "Star":
                                return Star;
                              case "Heart":
                                return Heart;
                              case "Briefcase":
                                return Briefcase;
                              default:
                                return AlertCircle; // Default fallback
                            }
                          };
                          
                          const IconComponent = getIconComponent(item.icon);
                          return (
                            <tr key={item.id} className={`border-b transition-colors duration-200 ${
                              isDarkMode 
                                ? 'border-gray-700 hover:bg-gray-700/30' 
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}>
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg ${
                                    isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'
                                  }`}>
                                    <IconComponent className={`h-4 w-4 ${
                                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                    }`} />
                                  </div>
                                  <span className={`font-medium transition-colors duration-300 ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                  }`}>{item.municipality}</span>
                                </div>
                              </td>
                              <td className="p-4">
                                <Badge variant="outline" className={`${
                                  isDarkMode 
                                    ? 'bg-gray-700 text-gray-300 border-gray-600' 
                                    : 'bg-gray-100 text-gray-700 border-gray-300'
                                }`}>
                                  {item.district}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <span className={`text-sm break-words leading-relaxed transition-colors duration-300 ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`} title={item.what}>
                                  {item.what}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`text-sm transition-colors duration-300 ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  {formatDate(item.when)}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`text-sm break-words leading-relaxed transition-colors duration-300 ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>{item.where}</span>
                              </td>
                              {false && (
                                <td className="p-4">
                                  <span className={`text-sm break-words leading-relaxed transition-colors duration-300 ${
                                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                  }`}>{item.who}</span>
                                </td>
                              )}
                              {false && (
                                <>
                                  <td className="p-4">
                                    <span className={`text-sm break-words leading-relaxed transition-colors duration-300 ${
                                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                    }`} title={item.why}>
                                      {item.why}
                                    </span>
                                  </td>
                                  <td className="p-4">
                                    <span className={`text-sm break-words leading-relaxed transition-colors duration-300 ${
                                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                    }`} title={item.how}>
                                      {item.how}
                                    </span>
                                  </td>
                                </>
                              )}
                              <td className="p-4">
                                <Badge className={`${
                                  item.actionTaken === "Resolved" 
                                    ? isDarkMode 
                                      ? "bg-green-900/30 text-green-400" 
                                      : "bg-green-100 text-green-800"
                                    : isDarkMode 
                                      ? "bg-orange-900/30 text-orange-400" 
                                      : "bg-orange-100 text-orange-800"
                                }`}>
                                  {item.actionTaken}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <span className={`text-sm break-words leading-relaxed transition-colors duration-300 ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`} title={item.source}>
                                  {item.source || 'N/A'}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`text-sm break-words leading-relaxed transition-colors duration-300 ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`} title={item.otherInfo}>
                                  {item.otherInfo}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAction(item.id, "view")}
                                    title="View Details"
                                    className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAction(item.id, "edit")}
                                    title="Edit"
                                    className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAction(item.id, "delete")}
                                    title="Delete"
                                    className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    
                    {sortedItems.length === 0 && (
                      <div className="text-center py-12">
                        <div className={`p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center ${
                          isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                        }`}>
                          <AlertTriangle className={`h-8 w-8 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`} />
                        </div>
                        <p className={`text-base transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>No action items found matching your criteria.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Add Action Report Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`p-6 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border backdrop-blur-sm ${
              isDarkMode 
                ? 'bg-gray-900/90 text-white border-gray-700' 
                : 'bg-white/90 text-gray-900 border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${
                    isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'
                  }`}>
                    <FileText className={`h-6 w-6 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Add New Action Report</h3>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>Create a new action report entry</p>
                  </div>
                </div>
                <Button
                  onClick={handleCancelAdd}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <label className={`text-sm font-semibold ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newActionReport.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    className={`w-full p-3 rounded-lg border transition-all duration-200 ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                        : 'border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="pnp">PNP</option>
                    <option value="agriculture">Agriculture / Bantay Dagat</option>
                    <option value="pg-enro">PG-Enro / Agriculture</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className={`text-sm font-semibold ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    Municipality <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newActionReport.municipality}
                    onChange={(e) => handleInputChange('municipality', e.target.value)}
                    className={`w-full p-3 rounded-lg border transition-all duration-200 ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                        : 'border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    required
                  >
                    <option value="">Select Municipality</option>
                    {Object.values(municipalitiesByDistrict).flat().map(municipality => (
                      <option key={municipality} value={municipality}>{municipality}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className={`text-sm font-semibold ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    District <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newActionReport.district}
                    disabled
                    className={`w-full p-3 rounded-lg border transition-all duration-200 ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-700 text-gray-400 cursor-not-allowed' 
                        : 'border-gray-300 bg-gray-100 text-gray-600 cursor-not-allowed'
                    }`}
                    required
                  >
                    <option value="">{newActionReport.municipality ? 'Auto-detected' : 'Select Municipality First'}</option>
                    {newActionReport.district && (
                      <option value={newActionReport.district}>{newActionReport.district}</option>
                    )}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className={`text-sm font-semibold ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    What <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Describe what happened..."
                    value={newActionReport.what}
                    onChange={(e) => handleInputChange('what', e.target.value)}
                    className={`w-full p-3 rounded-lg border transition-all duration-200 ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                        : 'border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className={`text-sm font-semibold ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    When <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter date and time (e.g., January 15, 2024 2:30 PM)"
                    value={newActionReport.when}
                    onChange={(e) => handleInputChange('when', e.target.value)}
                    className={`w-full p-3 rounded-lg border transition-all duration-200 ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                        : 'border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className={`text-sm font-semibold ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    Where <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Location of the incident..."
                    value={newActionReport.where}
                    onChange={(e) => handleInputChange('where', e.target.value)}
                    className={`w-full p-3 rounded-lg border transition-all duration-200 ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                        : 'border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    required
                  />
                </div>
                
                {/* Hidden: Who */}
                {false && (
                  <div className="space-y-2">
                    <label className={`text-sm font-semibold ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      Who <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="Personnel involved..."
                      value={newActionReport.who}
                      onChange={(e) => handleInputChange('who', e.target.value)}
                      className={`w-full p-3 rounded-lg border transition-all duration-200 ${
                        isDarkMode 
                          ? 'border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                          : 'border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className={`text-sm font-semibold ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    Gender
                  </label>
                  <select
                    value={newActionReport.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className={`w-full p-3 rounded-lg border transition-all duration-200 ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                        : 'border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                
                {/* Hidden: Why */}
                {false && (
                  <div className="space-y-2">
                    <label className={`text-sm font-semibold ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      Why
                    </label>
                    <Input
                      type="text"
                      placeholder="Reason for the action..."
                      value={newActionReport.why}
                      onChange={(e) => handleInputChange('why', e.target.value)}
                      className={`w-full p-3 rounded-lg border transition-all duration-200 ${
                        isDarkMode 
                          ? 'border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                          : 'border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                    />
                  </div>
                )}
                
                {/* Hidden: How */}
                {false && (
                  <div className="space-y-2">
                    <label className={`text-sm font-semibold ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      How
                    </label>
                    <Input
                      type="text"
                      placeholder="Method or procedure used..."
                      value={newActionReport.how}
                      onChange={(e) => handleInputChange('how', e.target.value)}
                      className={`w-full p-3 rounded-lg border transition-all duration-200 ${
                        isDarkMode 
                          ? 'border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                          : 'border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className={`text-sm font-semibold ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    Action Taken <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter action taken (e.g., Under investigation, Resolved, Pending)"
                    value={newActionReport.actionTaken}
                    onChange={(e) => handleInputChange('actionTaken', e.target.value)}
                    className={`w-full p-3 rounded-lg border transition-all duration-200 ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                        : 'border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    required
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <label className={`text-sm font-semibold ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    Source
                  </label>
                  <Input
                    type="text"
                    placeholder="Where did this report come from? (e.g., Hotline, Walk-in, Facebook, Patrol)"
                    value={newActionReport.source}
                    onChange={(e) => handleInputChange('source', e.target.value)}
                    className={`w-full p-3 rounded-lg border transition-all duration-200 ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                        : 'border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className={`text-sm font-semibold ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    Other Information
                  </label>
                  <textarea
                    placeholder="Additional details and notes..."
                    value={newActionReport.otherInfo}
                    onChange={(e) => handleInputChange('otherInfo', e.target.value)}
                    rows={3}
                    className={`w-full p-3 rounded-lg border transition-all duration-200 resize-none ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                        : 'border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                </div>


              </div>
              
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button 
                  onClick={handleCancelAdd} 
                  variant="outline"
                  className={`${
                    isDarkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-800' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitActionReport} 
                  className={`${
                    isDarkMode 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Report
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Action Report Modal */}
        {showEditModal && editingItem && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`p-6 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border backdrop-blur-sm ${
              isDarkMode 
                ? 'bg-gray-900/90 text-white border-gray-700' 
                : 'bg-white/90 text-gray-900 border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${
                    isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'
                  }`}>
                    <Edit className={`h-6 w-6 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Edit Action Report</h3>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>Update action report details</p>
                  </div>
                </div>
                <Button
                  onClick={handleCancelEdit}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <label className={`text-sm font-semibold ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editingItem.department}
                    onChange={(e) => handleEditInputChange('department', e.target.value)}
                    className={`w-full p-3 rounded-lg border transition-all duration-200 ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                        : 'border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="pnp">PNP</option>
                    <option value="agriculture">Agriculture / Bantay Dagat</option>
                    <option value="pg-enro">PG-Enro / Agriculture</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className={`text-sm font-semibold ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    Municipality <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editingItem.municipality}
                    onChange={(e) => handleEditInputChange('municipality', e.target.value)}
                    className={`w-full p-3 rounded-lg border transition-all duration-200 ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                        : 'border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    required
                  >
                    <option value="">Select Municipality</option>
                    {Object.values(municipalitiesByDistrict).flat().map(municipality => (
                      <option key={municipality} value={municipality}>{municipality}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className={`text-sm font-semibold ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    District <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editingItem.district}
                    disabled
                    className={`w-full p-3 rounded-lg border transition-all duration-200 ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-700 text-gray-400 cursor-not-allowed' 
                        : 'border-gray-300 bg-gray-100 text-gray-600 cursor-not-allowed'
                    }`}
                    required
                  >
                    <option value="">{editingItem.municipality ? 'Auto-detected' : 'Select Municipality First'}</option>
                    {editingItem.district && (
                      <option value={editingItem.district}>{editingItem.district}</option>
                    )}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className={`text-sm font-semibold ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    What <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Describe what happened..."
                    value={editingItem.what}
                    onChange={(e) => handleEditInputChange('what', e.target.value)}
                    className={`w-full p-3 rounded-lg border transition-all duration-200 ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                        : 'border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className={`text-sm font-semibold ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    When <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter date and time (e.g., January 15, 2024 2:30 PM)"
                    value={editingItem.when}
                    onChange={(e) => handleEditInputChange('when', e.target.value)}
                    className={`w-full p-3 rounded-lg border transition-all duration-200 ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                        : 'border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className={`text-sm font-semibold ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    Where <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Location of the incident..."
                    value={editingItem.where}
                    onChange={(e) => handleEditInputChange('where', e.target.value)}
                    className={`w-full p-3 rounded-lg border transition-all duration-200 ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                        : 'border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    required
                  />
                </div>
                
                {/* Hidden: Who */}
                {false && (
                  <div className="space-y-2">
                    <label className={`text-sm font-semibold ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      Who <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="Personnel involved..."
                      value={editingItem.who}
                      onChange={(e) => handleEditInputChange('who', e.target.value)}
                      className={`w-full p-3 rounded-lg border transition-all duration-200 ${
                        isDarkMode 
                          ? 'border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                          : 'border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className={`text-sm font-semibold ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    Gender
                  </label>
                  <select
                    value={editingItem.gender || ""}
                    onChange={(e) => handleEditInputChange('gender', e.target.value)}
                    className={`w-full p-3 rounded-lg border transition-all duration-200 ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                        : 'border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                
                {/* Hidden: Why */}
                {false && (
                  <div className="space-y-2">
                    <label className={`text-sm font-semibold ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      Why
                    </label>
                    <Input
                      type="text"
                      placeholder="Reason for the action..."
                      value={editingItem.why}
                      onChange={(e) => handleEditInputChange('why', e.target.value)}
                      className={`w-full p-3 rounded-lg border transition-all duration-200 ${
                        isDarkMode 
                          ? 'border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                          : 'border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                    />
                  </div>
                )}

                {/* Source */}
                <div className="space-y-2 md:col-span-2">
                  <label className={`text-sm font-semibold ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    Source
                  </label>
                  <Input
                    type="text"
                    placeholder="Where did this report come from? (e.g., Hotline, Walk-in, Facebook, Patrol)"
                    value={editingItem.source || ""}
                    onChange={(e) => handleEditInputChange('source', e.target.value)}
                    className={`w-full p-3 rounded-lg border transition-all duration-200 ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                        : 'border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                </div>
                
                {/* Hidden: How */}
                {false && (
                  <div className="space-y-2">
                    <label className={`text-sm font-semibold ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      How
                    </label>
                    <Input
                      type="text"
                      placeholder="Method or procedure used..."
                      value={editingItem.how}
                      onChange={(e) => handleEditInputChange('how', e.target.value)}
                      className={`w-full p-3 rounded-lg border transition-all duration-200 ${
                        isDarkMode 
                          ? 'border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                          : 'border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className={`text-sm font-semibold ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    Action Taken <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter action taken (e.g., Under investigation, Resolved, Pending)"
                    value={editingItem.actionTaken}
                    onChange={(e) => handleEditInputChange('actionTaken', e.target.value)}
                    className={`w-full p-3 rounded-lg border transition-all duration-200 ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                        : 'border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    required
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <label className={`text-sm font-semibold ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    Other Information
                  </label>
                  <textarea
                    placeholder="Additional details and notes..."
                    value={editingItem.otherInfo}
                    onChange={(e) => handleEditInputChange('otherInfo', e.target.value)}
                    rows={3}
                    className={`w-full p-3 rounded-lg border transition-all duration-200 resize-none ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                        : 'border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                </div>


              </div>
              
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button 
                  onClick={handleCancelEdit} 
                  variant="outline"
                  className={`${
                    isDarkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-800' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleEditActionReport} 
                  className={`${
                    isDarkMode 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Update Report
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* View Details Modal */}
        {showViewModal && viewingItem && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`p-6 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border backdrop-blur-sm ${
              isDarkMode 
                ? 'bg-gray-900/90 text-white border-gray-700' 
                : 'bg-white/90 text-gray-900 border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${
                    isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'
                  }`}>
                    <Eye className={`h-6 w-6 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Action Report Details</h3>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>View complete action report information</p>
                  </div>
                </div>
                <Button
                  onClick={handleCloseViewModal}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg border ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <h4 className={`font-semibold mb-3 ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>Basic Information</h4>
                    <div className="space-y-3">
                      <div>
                        <span className={`text-sm font-medium ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>Department:</span>
                        <p className={`text-sm ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>{viewingItem.department?.toUpperCase() || 'N/A'}</p>
                      </div>
                      <div>
                        <span className={`text-sm font-medium ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>Municipality:</span>
                        <p className={`text-sm ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>{viewingItem.municipality}</p>
                      </div>
                      <div>
                        <span className={`text-sm font-medium ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>District:</span>
                        <p className={`text-sm ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>{viewingItem.district}</p>
                      </div>
                      <div>
                        <span className={`text-sm font-medium ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>Date & Time:</span>
                        <p className={`text-sm ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>{formatDate(viewingItem.when)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Information */}
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg border ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <h4 className={`font-semibold mb-3 ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>Status & Priority</h4>
                    <div className="space-y-3">
                      <div>
                        <span className={`text-sm font-medium ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>Action Taken:</span>
                        <div className="mt-1">
                          <Badge className={`${
                            viewingItem.actionTaken === "Resolved" 
                              ? isDarkMode 
                                ? "bg-green-900/30 text-green-400" 
                                : "bg-green-100 text-green-800"
                              : isDarkMode 
                                ? "bg-orange-900/30 text-orange-400" 
                                : "bg-orange-100 text-orange-800"
                          }`}>
                            {viewingItem.actionTaken}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className={`text-sm font-medium ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>Status:</span>
                        <div className="mt-1">
                          <Badge className={`${
                            viewingItem.status === "resolved" 
                              ? isDarkMode 
                                ? "bg-green-900/30 text-green-400" 
                                : "bg-green-100 text-green-800"
                              : isDarkMode 
                                ? "bg-orange-900/30 text-orange-400" 
                                : "bg-orange-100 text-orange-800"
                          }`}>
                            {viewingItem.status || 'pending'}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className={`text-sm font-medium ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>Priority:</span>
                        <div className="mt-1">
                          <Badge className={`${
                            viewingItem.priority === "high" 
                              ? isDarkMode 
                                ? "bg-red-900/30 text-red-400" 
                                : "bg-red-100 text-red-800"
                              : viewingItem.priority === "medium"
                              ? isDarkMode 
                                ? "bg-yellow-900/30 text-yellow-400" 
                                : "bg-yellow-100 text-yellow-800"
                              : isDarkMode 
                                ? "bg-green-900/30 text-green-400" 
                                : "bg-green-100 text-green-800"
                          }`}>
                            {viewingItem.priority || 'medium'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Information */}
              <div className="space-y-6">
                <div className={`p-4 rounded-lg border ${
                  isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}>
                  <h4 className={`font-semibold mb-4 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>Incident Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <span className={`text-sm font-medium ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>What Happened:</span>
                        <p className={`text-sm mt-1 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>{viewingItem.what}</p>
                      </div>
                      <div>
                        <span className={`text-sm font-medium ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>Location:</span>
                        <p className={`text-sm mt-1 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>{viewingItem.where}</p>
                      </div>
                      <div>
                        <span className={`text-sm font-medium ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>Personnel Involved:</span>
                        <p className={`text-sm mt-1 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>{viewingItem.who}</p>
                      </div>
                      <div>
                        <span className={`text-sm font-medium ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>Gender:</span>
                        <p className={`text-sm mt-1 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>{viewingItem.gender ? viewingItem.gender.charAt(0).toUpperCase() + viewingItem.gender.slice(1) : 'N/A'}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <span className={`text-sm font-medium ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>Reason:</span>
                        <p className={`text-sm mt-1 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>{viewingItem.why || 'N/A'}</p>
                      </div>
                      <div>
                        <span className={`text-sm font-medium ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>Method:</span>
                        <p className={`text-sm mt-1 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>{viewingItem.how || 'N/A'}</p>
                      </div>
                    <div>
                      <span className={`text-sm font-medium ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>Source:</span>
                      <p className={`text-sm mt-1 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>{viewingItem.source || 'N/A'}</p>
                    </div>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                {viewingItem.otherInfo && (
                  <div className={`p-4 rounded-lg border ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <h4 className={`font-semibold mb-3 ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>Additional Information</h4>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>{viewingItem.otherInfo}</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button 
                  onClick={handleCloseViewModal} 
                  variant="outline"
                  className={`${
                    isDarkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-800' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    handleCloseViewModal();
                    handleAction(viewingItem.id, "edit");
                  }}
                  className={`${
                    isDarkMode 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Report
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`p-4 sm:p-6 rounded-lg shadow-lg max-w-md w-full backdrop-blur-sm border ${
              isDarkMode ? 'bg-gray-800/90 text-white border-gray-700' : 'bg-white/90 text-gray-900 border-gray-200'
            }`}>
              <div className="flex items-center gap-3 mb-3 sm:mb-4">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                <h3 className="text-lg font-semibold">Confirm Delete</h3>
              </div>
              <p className="mb-4 sm:mb-6">
                Are you sure you want to delete this action item?
                <br />
                <strong>{selectedItem?.what}</strong>
              </p>
              <div className="flex gap-3 justify-end">
                <Button onClick={cancelDelete} variant="outline">
                  Cancel
                </Button>
                <Button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 
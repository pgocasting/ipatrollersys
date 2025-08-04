import React, { useState, useEffect } from "react";
import Layout from "./Layout";
import { useTheme } from "./ThemeContext";
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
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDistrict, setSelectedDistrict] = useState("");
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
  const [newActionReport, setNewActionReport] = useState({
    department: "",
    municipality: "",
    district: "",
    what: "",
    when: new Date(),
    where: "",
    who: "",
    why: "",
    how: "",
    actionTaken: "",
    otherInfo: ""
  });

  useEffect(() => {
    // Load action items based on active tab
    // In a real application, this would fetch data from your API/database
    setLoading(true);
    
    // Simulate API call - replace this with actual data fetching
    setTimeout(() => {
      // Example of how to fetch real data:
      // fetch(`/api/action-items?department=${activeTab}`)
      //   .then(response => response.json())
      //   .then(data => {
      //     setActionItems(data);
      //     setLoading(false);
      //   })
      //   .catch(error => {
      //     console.error('Error fetching action items:', error);
      //     setLoading(false);
      //   });
      
      // For now, set empty array - replace with real data
      setActionItems([]);
      setLoading(false);
    }, 500);
  }, [activeTab]);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const districts = [
    { id: "", name: "All Districts" },
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
    const matchesSearch = searchTerm === "" || 
                         item.municipality.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.what.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.who.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.where.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.why.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.how.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.actionTaken.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.otherInfo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDistrict = !selectedDistrict || item.district === selectedDistrict;
    const matchesDepartment = item.department === activeTab;
    const matchesMunicipality = activeTab === "pnp" ? 
      (activeMunicipality === "all" || item.municipality === activeMunicipality) : true;
    return matchesSearch && matchesDistrict && matchesDepartment && matchesMunicipality;
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

  // Calculate totals
  const totalActions = sortedItems.length;
  const pendingActions = sortedItems.filter(item => item.status === "pending").length;
  const resolvedActions = sortedItems.filter(item => item.status === "resolved").length;
  const highPriorityActions = sortedItems.filter(item => item.priority === "high").length;
  const totalPatrols = sortedItems.reduce((sum, item) => sum + item.patrolCount, 0);
  const totalIncidents = sortedItems.reduce((sum, item) => sum + item.incidentCount, 0);

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
        alert(`Viewing details for: ${item.what}\n\nMunicipality: ${item.municipality}\nDistrict: ${item.district}\nWhen: ${formatDate(item.when)}\nWhere: ${item.where}\nWho: ${item.who}\nWhy: ${item.why}\nHow: ${item.how}\nAction Taken: ${item.actionTaken}\nOther Info: ${item.otherInfo}`);
        break;
      case "edit":
        alert(`Edit functionality for: ${item.what}\n\nThis would open an edit form in a real application.`);
        break;
      case "delete":
        setSelectedItem(item);
        setShowDeleteModal(true);
        break;
      default:
        console.log(`Action ${action} performed on item ${actionId}`);
    }
  };

  const confirmDelete = () => {
    if (selectedItem) {
      setActionItems(prevItems => prevItems.filter(item => item.id !== selectedItem.id));
      setShowDeleteModal(false);
      setSelectedItem(null);
      alert(`Successfully deleted: ${selectedItem.what}`);
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
    doc.text(`Pending Actions: ${pendingActions}`, 14, 82);
    doc.text(`Resolved Actions: ${resolvedActions}`, 14, 89);
    doc.text(`High Priority Actions: ${highPriorityActions}`, 14, 96);
    doc.text(`Total Patrols: ${totalPatrols}`, 14, 103);
    doc.text(`Total Incidents: ${totalIncidents}`, 14, 110);
    
    // Prepare table data
    const tableData = sortedItems.map(item => [
      item.municipality,
      item.district,
      item.what,
      item.when.toLocaleDateString(),
      item.where,
      item.who,
      item.why,
      item.how,
      item.actionTaken,
      item.otherInfo
    ]);
    
    // Add table
    doc.autoTable({
      head: [['Municipality', 'District', 'What', 'When', 'Where', 'Who', 'Why', 'How', 'Action Taken', 'Other Information']],
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
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleAddActionReport = () => {
    setShowAddModal(true);
  };

  const handleSubmitActionReport = () => {
    const newReport = {
      id: `action-${Date.now()}`,
      ...newActionReport,
      status: newActionReport.actionTaken === "Resolved" ? "resolved" : "pending",
      priority: "medium",
      patrolCount: 0,
      incidentCount: 0,
      icon: AlertCircle
    };

    setActionItems(prevItems => [...prevItems, newReport]);
    setShowAddModal(false);
    setNewActionReport({
      department: "",
      municipality: "",
      district: "",
      what: "",
      when: new Date(),
      where: "",
      who: "",
      why: "",
      how: "",
      actionTaken: "",
      otherInfo: ""
    });
    alert("Action report added successfully!");
  };

  const handleCancelAdd = () => {
    setShowAddModal(false);
    setNewActionReport({
      department: "",
      municipality: "",
      district: "",
      what: "",
      when: new Date(),
      where: "",
      who: "",
      why: "",
      how: "",
      actionTaken: "",
      otherInfo: ""
    });
  };

  const handleInputChange = (field, value) => {
    setNewActionReport(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Layout onLogout={onLogout} onNavigate={onNavigate} currentPage={currentPage}>
      <div className={`w-full transition-all duration-300 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
          : 'bg-gradient-to-br from-blue-50 via-white to-indigo-50'
      }`}>
        {/* Modern Header */}
        <div className={`relative overflow-hidden backdrop-blur-sm shadow-sm border-b transition-all duration-300 ${
          isDarkMode 
            ? 'bg-gray-800/90 border-gray-700/50' 
            : 'bg-white/90 border-gray-200/50'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5"></div>
          <div className="relative px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100/80 dark:bg-blue-900/40 rounded-lg backdrop-blur-sm">
                    <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Action Center
                  </h1>
                </div>
                <p className={`text-xs sm:text-sm lg:text-base transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Centralized monitoring and management dashboard for all departmental activities
                </p>
              </div>
                                              <div className="flex flex-wrap gap-1 sm:gap-2 lg:gap-3">
                   <Button 
                     onClick={handleAddActionReport}
                     variant="outline" 
                     size="sm"
                     className={`backdrop-blur-sm text-xs sm:text-sm transition-all duration-300 ${
                       isDarkMode 
                         ? 'bg-gray-800/90 border-orange-600 hover:bg-orange-900/20 text-orange-300' 
                         : 'bg-white/90 border-orange-200 hover:bg-orange-50'
                     }`}
                   >
                     <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
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
                     className={`backdrop-blur-sm text-xs sm:text-sm transition-all duration-300 ${
                       isDarkMode 
                         ? 'bg-gray-800/90 border-blue-600 hover:bg-blue-900/20 text-blue-300' 
                         : 'bg-white/90 border-blue-200 hover:bg-blue-50'
                     }`}
                   >
                     <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
                     Refresh
                   </Button>
                   <Button onClick={exportToPDF} variant="outline" size="sm" className={`backdrop-blur-sm text-xs sm:text-sm transition-all duration-300 ${
                     isDarkMode 
                       ? 'bg-gray-800/90 border-green-600 hover:bg-green-900/20 text-green-300' 
                       : 'bg-white/90 border-green-200 hover:bg-green-50'
                   }`}>
                     <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                     Export to PDF
                   </Button>
                   <Button onClick={handlePrint} variant="outline" size="sm" className={`backdrop-blur-sm text-xs sm:text-sm transition-all duration-300 ${
                     isDarkMode 
                       ? 'bg-gray-800/90 border-purple-600 hover:bg-purple-900/20 text-purple-300' 
                       : 'bg-white/90 border-purple-200 hover:bg-purple-50'
                   }`}>
                     <Printer className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                     Print
                   </Button>
                 </div>
            </div>
          </div>
        </div>

        {/* Modern Department Navigation */}
        <div className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2">
          <div className="max-w-6xl mx-auto">
            <div className={`backdrop-blur-sm rounded-lg sm:rounded-xl shadow-lg border overflow-hidden transition-all duration-300 ${
              isDarkMode 
                ? 'bg-gray-800/70 border-gray-700/30' 
                : 'bg-white/70 border-gray-200/30'
            }`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-1 p-1">
                                 <button
                   onClick={() => {
                     setActiveTab("pnp");
                     setActiveMunicipality("all");
                   }}
                   className={`relative group p-3 sm:p-4 rounded-lg transition-all duration-300 ${
                     activeTab === "pnp"
                       ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg transform scale-105"
                       : isDarkMode 
                         ? "bg-gray-700/60 hover:bg-blue-900/20 text-gray-300"
                         : "bg-white/60 hover:bg-blue-50 text-gray-700"
                   }`}
                 >
                   <div className="flex flex-col items-center text-center space-y-1 sm:space-y-2">
                     <div className={`p-1.5 sm:p-2 rounded-full ${
                       activeTab === "pnp" 
                         ? "bg-white/20" 
                         : isDarkMode ? "bg-blue-900/40" : "bg-blue-100/80"
                     }`}>
                       <Shield className={`h-3 w-3 sm:h-5 sm:w-5 ${
                         activeTab === "pnp" ? "text-white" : isDarkMode ? "text-blue-400" : "text-blue-600"
                       }`} />
                     </div>
                     <div>
                       <h3 className="font-semibold text-xs sm:text-sm">PNP</h3>
                       <p className="text-xs opacity-80">Police Operations</p>
                     </div>
                   </div>
                 </button>
                
                                 <button
                   onClick={() => {
                     setActiveTab("agriculture");
                     setActiveMunicipality("all");
                   }}
                   className={`relative group p-3 sm:p-4 rounded-lg transition-all duration-300 ${
                     activeTab === "agriculture"
                       ? "bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg transform scale-105"
                       : isDarkMode 
                         ? "bg-gray-700/60 hover:bg-green-900/20 text-gray-300"
                         : "bg-white/60 hover:bg-green-50 text-gray-700"
                   }`}
                 >
                   <div className="flex flex-col items-center text-center space-y-1 sm:space-y-2">
                     <div className={`p-1.5 sm:p-2 rounded-full ${
                       activeTab === "agriculture" 
                         ? "bg-white/20" 
                         : isDarkMode ? "bg-green-900/40" : "bg-green-100/80"
                     }`}>
                       <TrendingUp className={`h-3 w-3 sm:h-5 sm:w-5 ${
                         activeTab === "agriculture" ? "text-white" : isDarkMode ? "text-green-400" : "text-green-600"
                       }`} />
                     </div>
                     <div>
                       <h3 className="font-semibold text-xs sm:text-sm">Agriculture</h3>
                       <p className="text-xs opacity-80">Bantay Dagat</p>
                     </div>
                   </div>
                 </button>
                 
                 <button
                   onClick={() => {
                     setActiveTab("pgenro");
                     setActiveMunicipality("all");
                   }}
                   className={`relative group p-3 sm:p-4 rounded-lg transition-all duration-300 ${
                     activeTab === "pgenro"
                       ? "bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg transform scale-105"
                       : isDarkMode 
                         ? "bg-gray-700/60 hover:bg-purple-900/20 text-gray-300"
                         : "bg-white/60 hover:bg-purple-50 text-gray-700"
                   }`}
                 >
                   <div className="flex flex-col items-center text-center space-y-1 sm:space-y-2">
                     <div className={`p-1.5 sm:p-2 rounded-full ${
                       activeTab === "pgenro" 
                         ? "bg-white/20" 
                         : isDarkMode ? "bg-purple-900/40" : "bg-purple-100/80"
                     }`}>
                       <AlertCircle className={`h-3 w-3 sm:h-5 sm:w-5 ${
                         activeTab === "pgenro" ? "text-white" : isDarkMode ? "text-purple-400" : "text-purple-600"
                       }`} />
                     </div>
                     <div>
                       <h3 className="font-semibold text-xs sm:text-sm">PG-Enro</h3>
                       <p className="text-xs opacity-80">Environment</p>
                     </div>
                   </div>
                 </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Municipality Selector - Only show for PNP */}
        {activeTab === "pnp" && (
          <div className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2">
            <div className="max-w-6xl mx-auto">
              <div className={`backdrop-blur-sm rounded-lg sm:rounded-xl shadow-lg border p-2 sm:p-3 transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-gray-800/70 border-gray-700/30' 
                  : 'bg-white/70 border-gray-200/30'
              }`}>
                <div className="mb-2 sm:mb-3">
                  <h3 className={`text-base sm:text-lg font-semibold mb-1 sm:mb-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>Select Municipality</h3>
                  <p className={`text-xs sm:text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Filter activities by specific municipality</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
                                     <button
                     onClick={() => setActiveMunicipality("all")}
                     className={`relative group p-3 sm:p-4 rounded-lg sm:rounded-xl transition-all duration-300 ${
                       activeMunicipality === "all"
                         ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg transform scale-105"
                         : isDarkMode 
                           ? "bg-gray-700/60 hover:bg-blue-900/20 text-gray-300 border border-gray-600/30"
                           : "bg-white/60 hover:bg-blue-50 text-gray-700 border border-gray-200/30"
                     }`}
                   >
                     <div className="text-center">
                       <div className={`w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 rounded-full flex items-center justify-center ${
                         activeMunicipality === "all" ? "bg-white/20" : isDarkMode ? "bg-blue-900/40" : "bg-blue-100/80"
                       }`}>
                         <MapPin className={`h-3 w-3 sm:h-4 sm:w-4 ${
                           activeMunicipality === "all" ? "text-white" : isDarkMode ? "text-blue-400" : "text-blue-600"
                         }`} />
                       </div>
                       <span className="text-xs font-medium">All Areas</span>
                     </div>
                   </button>
                                     {["Abucay", "Orani", "Samal", "Hermosa", "Balanga", "Pilar", "Orion", "Limay", "Bagac", "Dinalupihan", "Mariveles", "Morong"].map(municipality => (
                     <button
                       key={municipality}
                       onClick={() => setActiveMunicipality(municipality)}
                       className={`relative group p-3 sm:p-4 rounded-lg sm:rounded-xl transition-all duration-300 ${
                         activeMunicipality === municipality
                           ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg transform scale-105"
                           : isDarkMode 
                             ? "bg-gray-700/60 hover:bg-blue-900/20 text-gray-300 border border-gray-600/30"
                             : "bg-white/60 hover:bg-blue-50 text-gray-700 border border-gray-200/30"
                       }`}
                     >
                       <div className="text-center">
                         <div className={`w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 rounded-full flex items-center justify-center ${
                           activeMunicipality === municipality ? "bg-white/20" : isDarkMode ? "bg-blue-900/40" : "bg-blue-100/80"
                         }`}>
                           <Building2 className={`h-3 w-3 sm:h-4 sm:w-4 ${
                             activeMunicipality === municipality ? "text-white" : isDarkMode ? "text-blue-400" : "text-blue-600"
                           }`} />
                         </div>
                         <span className="text-xs font-medium">{municipality}</span>
                       </div>
                     </button>
                   ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modern Filters & Search */}
        <div className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2">
          <div className="max-w-6xl mx-auto">
            <div className={`backdrop-blur-sm rounded-lg sm:rounded-xl shadow-lg border p-2 sm:p-3 transition-all duration-300 ${
              isDarkMode 
                ? 'bg-gray-800/70 border-gray-700/30' 
                : 'bg-white/70 border-gray-200/30'
            }`}>
                             <div className="flex items-center gap-3 mb-3 sm:mb-4">
                <div className={`p-2 rounded-lg backdrop-blur-sm ${
                  isDarkMode ? 'bg-blue-900/40' : 'bg-blue-100/80'
                }`}>
                  <Filter className={`h-4 w-4 sm:h-5 sm:w-5 ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                </div>
                <div>
                  <h3 className={`text-base sm:text-lg font-semibold transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>Filters & Search</h3>
                  <p className={`text-xs sm:text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Refine your data view</p>
                </div>
              </div>
              
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                 <div className="space-y-2">
                   <label className={`text-xs sm:text-sm font-medium transition-colors duration-300 ${
                     isDarkMode ? 'text-gray-300' : 'text-gray-700'
                   }`}>Month</label>
                   <select
                     value={selectedMonth}
                     onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                     className={`w-full p-2 sm:p-3 rounded-lg sm:rounded-xl border backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-xs sm:text-sm ${
                       isDarkMode 
                         ? 'border-gray-600 bg-gray-700/60' 
                         : 'border-gray-200 bg-white/60'
                     }`}
                   >
                    {months.map((month, index) => (
                      <option key={index} value={index}>{month}</option>
                    ))}
                  </select>
                </div>
                
                                 <div className="space-y-2">
                   <label className={`text-xs sm:text-sm font-medium transition-colors duration-300 ${
                     isDarkMode ? 'text-gray-300' : 'text-gray-700'
                   }`}>Year</label>
                   <select
                     value={selectedYear}
                     onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                     className={`w-full p-2 sm:p-3 rounded-lg sm:rounded-xl border backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-xs sm:text-sm ${
                       isDarkMode 
                         ? 'border-gray-600 bg-gray-700/60' 
                         : 'border-gray-200 bg-white/60'
                     }`}
                   >
                     {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                       <option key={year} value={year}>{year}</option>
                     ))}
                   </select>
                 </div>
                 
                 <div className="space-y-2">
                   <label className={`text-xs sm:text-sm font-medium transition-colors duration-300 ${
                     isDarkMode ? 'text-gray-300' : 'text-gray-700'
                   }`}>District</label>
                   <select
                     value={selectedDistrict}
                     onChange={(e) => setSelectedDistrict(e.target.value)}
                     className={`w-full p-2 sm:p-3 rounded-lg sm:rounded-xl border backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-xs sm:text-sm ${
                       isDarkMode 
                         ? 'border-gray-600 bg-gray-700/60' 
                         : 'border-gray-200 bg-white/60'
                     }`}
                   >
                     {districts.map((district) => (
                       <option key={district.id} value={district.id}>{district.name}</option>
                     ))}
                   </select>
                 </div>
                 
                 <div className="space-y-2">
                   <label className={`text-xs sm:text-sm font-medium transition-colors duration-300 ${
                     isDarkMode ? 'text-gray-300' : 'text-gray-700'
                   }`}>Search</label>
                   <div className="relative">
                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                     <Input
                       type="text"
                       placeholder="Search actions..."
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       className={`pl-8 sm:pl-10 p-2 sm:p-3 rounded-lg sm:rounded-xl border backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-xs sm:text-sm ${
                         isDarkMode 
                           ? 'border-gray-600 bg-gray-700/60' 
                           : 'border-gray-200 bg-white/60'
                       }`}
                     />
                     {searchTerm && (
                       <button
                         onClick={() => setSearchTerm("")}
                         className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                       >
                         <X className="h-3 w-3 sm:h-4 sm:w-4" />
                       </button>
                     )}
                   </div>
                 </div>
              </div>
              
                             <div className="flex justify-end mt-3 sm:mt-4">
                 <Button
                   onClick={() => {
                     setSearchTerm("");
                     setSelectedDistrict("");
                     setSelectedMonth(new Date().getMonth());
                     setSelectedYear(new Date().getFullYear());
                   }}
                   variant="outline"
                   size="sm"
                   className="bg-white/90 backdrop-blur-sm border-gray-200 hover:bg-gray-50 dark:bg-gray-700/90 dark:border-gray-600 dark:hover:bg-gray-600 text-xs sm:text-sm"
                 >
                   <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                   Clear All Filters
                 </Button>
               </div>
            </div>
          </div>
        </div>

        {/* Modern Summary Dashboard */}
        <div className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
              {/* Total Actions Card */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3 sm:p-4 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-xs font-medium">Total Actions</p>
                    <p className="text-lg sm:text-xl font-bold">{totalActions}</p>
                    <p className="text-blue-200 text-xs">All activities</p>
                  </div>
                  <div className="p-1.5 sm:p-2 bg-white/20 rounded-full">
                    <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
              </div>

              {/* Pending Actions Card */}
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-3 sm:p-4 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-xs font-medium">Pending</p>
                    <p className="text-lg sm:text-xl font-bold">{pendingActions}</p>
                    <p className="text-orange-200 text-xs">Awaiting action</p>
                  </div>
                  <div className="p-1.5 sm:p-2 bg-white/20 rounded-full">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
              </div>

              {/* Resolved Actions Card */}
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3 sm:p-4 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-xs font-medium">Resolved</p>
                    <p className="text-lg sm:text-xl font-bold">{resolvedActions}</p>
                    <p className="text-green-200 text-xs">Completed</p>
                  </div>
                  <div className="p-1.5 sm:p-2 bg-white/20 rounded-full">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
              </div>

              {/* High Priority Card */}
              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-3 sm:p-4 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-xs font-medium">High Priority</p>
                    <p className="text-lg sm:text-xl font-bold">{highPriorityActions}</p>
                    <p className="text-red-200 text-xs">Urgent attention</p>
                  </div>
                  <div className="p-1.5 sm:p-2 bg-white/20 rounded-full">
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
              </div>

              {/* Total Patrols Card */}
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg p-3 sm:p-4 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100 text-xs font-medium">Total Patrols</p>
                    <p className="text-lg sm:text-xl font-bold">{totalPatrols}</p>
                    <p className="text-indigo-200 text-xs">Security rounds</p>
                  </div>
                  <div className="p-1.5 sm:p-2 bg-white/20 rounded-full">
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
              </div>

              {/* Incidents Card */}
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-3 sm:p-4 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-xs font-medium">Incidents</p>
                    <p className="text-lg sm:text-xl font-bold">{totalIncidents}</p>
                    <p className="text-purple-200 text-xs">Reported cases</p>
                  </div>
                  <div className="p-1.5 sm:p-2 bg-white/20 rounded-full">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Action Items Table */}
        <div className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 pb-4">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-lg sm:rounded-xl shadow-lg border border-gray-200/30 dark:border-gray-700/30 overflow-hidden">
              <div className="p-2 sm:p-3 border-b border-gray-200/30 dark:border-gray-700/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100/80 dark:bg-green-900/40 rounded-lg backdrop-blur-sm">
                      <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-200">Action Items</h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Detailed view of all activities</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100/80 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400 text-xs sm:text-sm">
                    {sortedItems.length} items
                  </Badge>
                </div>
              </div>
              
              <div className="p-4 sm:p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-8 sm:py-12">
                    <div className="flex items-center gap-3">
                      <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-blue-500" />
                      <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Loading action items...</span>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200/50 dark:border-gray-700/50">
                          <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">
                            <button
                              onClick={() => handleSort("municipality")}
                              className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                            >
                              Municipality
                              {sortBy === "municipality" && (
                                sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                              )}
                            </button>
                          </th>
                          <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">
                            <button
                              onClick={() => handleSort("district")}
                              className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                            >
                              District
                              {sortBy === "district" && (
                                sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                              )}
                            </button>
                          </th>
                          <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">What</th>
                          <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">
                            <button
                              onClick={() => handleSort("when")}
                              className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                            >
                              When
                              {sortBy === "when" && (
                                sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                              )}
                            </button>
                          </th>
                          <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Where</th>
                          <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Who</th>
                          <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Why</th>
                          <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">How</th>
                          <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Action Taken</th>
                          <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Other Information</th>
                          <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedItems.map((item) => {
                          const IconComponent = item.icon;
                          return (
                            <tr key={item.id} className="border-b border-gray-100/50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors duration-200">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <IconComponent className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <span className="font-medium text-gray-800 dark:text-gray-200">{item.municipality}</span>
                                </div>
                              </td>
                              <td className="p-4">
                                <Badge variant="outline" className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                  {item.district}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <span className="text-sm max-w-xs truncate text-gray-700 dark:text-gray-300" title={item.what}>
                                  {item.what}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {formatDate(item.when)}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className="text-sm text-gray-700 dark:text-gray-300">{item.where}</span>
                              </td>
                              <td className="p-4">
                                <span className="text-sm text-gray-700 dark:text-gray-300">{item.who}</span>
                              </td>
                              <td className="p-4">
                                <span className="text-sm max-w-xs truncate text-gray-700 dark:text-gray-300" title={item.why}>
                                  {item.why}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className="text-sm max-w-xs truncate text-gray-700 dark:text-gray-300" title={item.how}>
                                  {item.how}
                                </span>
                              </td>
                              <td className="p-4">
                                <Badge className={`${
                                  item.actionTaken === "Resolved" 
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                                    : "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
                                }`}>
                                  {item.actionTaken}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <span className="text-sm max-w-xs truncate text-gray-700 dark:text-gray-300" title={item.otherInfo}>
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
                      <div className="text-center py-8 sm:py-12">
                        <div className="p-3 sm:p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                          <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">No action items found matching your criteria.</p>
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
           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
             <div className={`p-4 sm:p-6 rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto ${
               isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
             }`}>
               <div className="flex items-center gap-3 mb-4 sm:mb-6">
                 <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                   <FileText className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                 </div>
                 <h3 className="text-xl font-semibold">Add New Action Report</h3>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                 <div className="space-y-2">
                   <label className="text-sm font-medium">Department *</label>
                   <select
                     value={newActionReport.department}
                     onChange={(e) => handleInputChange('department', e.target.value)}
                     className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     required
                   >
                     <option value="">Select Department</option>
                     <option value="pnp">PNP</option>
                     <option value="agriculture">Agriculture / Bantay Dagat</option>
                     <option value="pg-enro">PG-Enro / Agriculture</option>
                   </select>
                 </div>
                 
                 <div className="space-y-2">
                   <label className="text-sm font-medium">Municipality *</label>
                   <select
                     value={newActionReport.municipality}
                     onChange={(e) => handleInputChange('municipality', e.target.value)}
                     className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     required
                   >
                     <option value="">Select Municipality</option>
                     {["Abucay", "Orani", "Samal", "Hermosa", "Balanga", "Pilar", "Orion", "Limay", "Bagac", "Dinalupihan", "Mariveles", "Morong"].map(municipality => (
                       <option key={municipality} value={municipality}>{municipality}</option>
                     ))}
                   </select>
                 </div>
                 
                 <div className="space-y-2">
                   <label className="text-sm font-medium">District *</label>
                   <select
                     value={newActionReport.district}
                     onChange={(e) => handleInputChange('district', e.target.value)}
                     className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     required
                   >
                     <option value="">Select District</option>
                     {districts.slice(1).map((district) => (
                       <option key={district.id} value={district.name}>{district.name}</option>
                     ))}
                   </select>
                 </div>
                 
                 <div className="space-y-2">
                   <label className="text-sm font-medium">What *</label>
                   <Input
                     type="text"
                     placeholder="Describe what happened..."
                     value={newActionReport.what}
                     onChange={(e) => handleInputChange('what', e.target.value)}
                     className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     required
                   />
                 </div>
                 
                 <div className="space-y-2">
                   <label className="text-sm font-medium">When *</label>
                   <Input
                     type="datetime-local"
                     value={newActionReport.when.toISOString().slice(0, 16)}
                     onChange={(e) => handleInputChange('when', new Date(e.target.value))}
                     className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     required
                   />
                 </div>
                 
                 <div className="space-y-2">
                   <label className="text-sm font-medium">Where *</label>
                   <Input
                     type="text"
                     placeholder="Location of the incident..."
                     value={newActionReport.where}
                     onChange={(e) => handleInputChange('where', e.target.value)}
                     className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     required
                   />
                 </div>
                 
                 <div className="space-y-2">
                   <label className="text-sm font-medium">Who *</label>
                   <Input
                     type="text"
                     placeholder="Personnel involved..."
                     value={newActionReport.who}
                     onChange={(e) => handleInputChange('who', e.target.value)}
                     className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     required
                   />
                 </div>
                 
                 <div className="space-y-2">
                   <label className="text-sm font-medium">Why</label>
                   <Input
                     type="text"
                     placeholder="Reason for the action..."
                     value={newActionReport.why}
                     onChange={(e) => handleInputChange('why', e.target.value)}
                     className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   />
                 </div>
                 
                 <div className="space-y-2">
                   <label className="text-sm font-medium">How</label>
                   <Input
                     type="text"
                     placeholder="Method or procedure used..."
                     value={newActionReport.how}
                     onChange={(e) => handleInputChange('how', e.target.value)}
                     className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   />
                 </div>
                 
                 <div className="space-y-2">
                   <label className="text-sm font-medium">Action Taken *</label>
                   <select
                     value={newActionReport.actionTaken}
                     onChange={(e) => handleInputChange('actionTaken', e.target.value)}
                     className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     required
                   >
                     <option value="">Select Action</option>
                     <option value="Under investigation">Under investigation</option>
                     <option value="Resolved">Resolved</option>
                     <option value="Pending">Pending</option>
                     <option value="In progress">In progress</option>
                   </select>
                 </div>
                 
                 <div className="space-y-2 md:col-span-2">
                   <label className="text-sm font-medium">Other Information</label>
                   <textarea
                     placeholder="Additional details and notes..."
                     value={newActionReport.otherInfo}
                     onChange={(e) => handleInputChange('otherInfo', e.target.value)}
                     rows={3}
                     className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                   />
                 </div>
               </div>
               
               <div className="flex gap-3 justify-end">
                 <Button onClick={handleCancelAdd} variant="outline">
                   Cancel
                 </Button>
                 <Button onClick={handleSubmitActionReport} className="bg-orange-600 hover:bg-orange-700">
                   <Save className="h-4 w-4 mr-2" />
                   Save Report
                 </Button>
               </div>
             </div>
           </div>
         )}

         {/* Delete Confirmation Modal */}
         {showDeleteModal && (
           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
             <div className={`p-4 sm:p-6 rounded-lg shadow-lg max-w-md w-full ${
               isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
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
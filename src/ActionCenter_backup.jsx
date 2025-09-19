import React, { useState, useEffect } from "react";
import { doc, getDoc, collection, getDocs, query, where, deleteDoc, updateDoc, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';
import Layout from "./Layout";
import { useFirebase } from "./hooks/useFirebase";
import { useAuth } from "./contexts/AuthContext";
// Firebase removed - using local data storage
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Badge } from "./components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Separator } from "./components/ui/separator";
import { jsPDF } from 'jspdf';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./components/ui/pagination";
import autoTable from 'jspdf-autotable';
import { cloudinaryUtils } from "./utils/cloudinary";
// Firebase imports removed

import { 
  Activity,
  AlertTriangle,
  AlertCircle,
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
  Search,
  Shield,
  TrendingUp,
  Users,
  X,
  XCircle,
  Target,
  Database,
  Save,
  ChevronDown,
  ChevronUp,
  Plus,
  Menu,
  RotateCcw,
  Camera,
  FileText,
  Pill,
  Leaf,
  Fish,
  Trees,
  Building2,
  Info
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
  const { user, addActionReport, updateActionReport, deleteActionReport, queryDocuments, getAllActionReports } = useFirebase();
  const { isAdmin, userDepartment, userMunicipality } = useAuth();
  // Firebase removed - using local data storage
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("municipality");
  const [sortOrder, setSortOrder] = useState("asc");
  const [actionItems, setActionItems] = useState([]);
  const [allActionReports, setAllActionReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    // Set default tab based on user department
    if (userDepartment === "agriculture") return "agriculture";
    if (userDepartment === "pg-enro") return "pg-enro";
    return "pnp"; // Default for admin or other users
  });
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);

  // Shared month names for display and exports
  const MONTH_NAMES = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];

  // Update active tab when user department changes
  useEffect(() => {
    if (userDepartment === "agriculture") {
      setActiveTab("agriculture");
    } else if (userDepartment === "pg-enro") {
      setActiveTab("pg-enro");
    } else {
      setActiveTab("pnp"); // Default for admin or other users
    }
  }, [userDepartment]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenuDropdown) {
        const dropdown = document.getElementById('actioncenter-menu-dropdown');
        const button = document.getElementById('actioncenter-menu-button');
        if (dropdown && !dropdown.contains(event.target) && !button?.contains(event.target)) {
          setShowMenuDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenuDropdown]);
  const [activeMunicipality, setActiveMunicipality] = useState("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingItem, setViewingItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageModalData, setImageModalData] = useState({ imageSource: '', fileName: '' });
  const [successMessage, setSuccessMessage] = useState('');

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
    otherInfo: "",
    photos: []
  });
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [pdfDescription, setPdfDescription] = useState("");
  const [tablePage, setTablePage] = useState(1);
  const itemsPerPage = 10;

  // Preview modal filter states
  const [previewDepartment, setPreviewDepartment] = useState(activeTab);
  const [previewMonth, setPreviewMonth] = useState(selectedMonth);
  const [previewYear, setPreviewYear] = useState(selectedYear);
  const [previewDistrict, setPreviewDistrict] = useState(selectedDistrict);

  // Handle page change
  const handlePageChange = (page) => {
    setTablePage(page);
  };

  // Get filtered data for preview modal
  const getPreviewFilteredData = () => {
    return allActionReports.filter(item => {
      // Department filter
      const matchesDepartment = previewDepartment === 'all' || item.department?.toLowerCase() === previewDepartment?.toLowerCase();
      
      // District filter
      const matchesDistrict = previewDistrict === 'all' || item.district === previewDistrict;
      
      // Month/Year filter
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
      const matchesMonthYear = previewMonth === 'all' || previewYear === 'all' || 
        (d ? (d.getMonth() === previewMonth && d.getFullYear() === previewYear) : false);
      
      return matchesDepartment && matchesDistrict && matchesMonthYear;
    });
  };

  // Load action items from Firestore using month-based structure
  const loadActionReports = async () => {
    setLoading(true);
    try {
      console.log('🔄 Loading action reports from Firestore...');
      console.log('🔍 Current activeTab:', activeTab);
      console.log('🔍 Current userDepartment:', userDepartment);
      
      // Try multiple query approaches to ensure we get all data
      let allActionReports = [];
      
      try {
        // First try: Order by 'when' field
        const actionReportsRef = collection(db, 'actionReports');
        const q = query(actionReportsRef, orderBy('when', 'desc'));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          console.log(`✅ Found ${querySnapshot.size} documents using 'when' field`);
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data) {
              allActionReports.push({
                id: doc.id,
                ...data
              });
            }
          });
        }
      } catch (orderByError) {
        console.log('⚠️ OrderBy query failed, trying without orderBy...', orderByError.message);
        
        try {
          // Second try: Get all documents without orderBy
          const actionReportsRef = collection(db, 'actionReports');
          const querySnapshot = await getDocs(actionReportsRef);
          
          if (!querySnapshot.empty) {
            console.log(`✅ Found ${querySnapshot.size} documents without orderBy`);
            querySnapshot.forEach((doc) => {
              const data = doc.data();
              if (data) {
                allActionReports.push({
                  id: doc.id,
                  ...data
                });
              }
            });
            
            // Sort manually by 'when' field if it exists
            allActionReports.sort((a, b) => {
              const aWhen = a.when?.toDate ? a.when.toDate() : new Date(a.when || 0);
              const bWhen = b.when?.toDate ? b.when.toDate() : new Date(b.when || 0);
              return bWhen - aWhen; // Descending order
            });
          }
        } catch (fallbackError) {
          console.error('❌ Fallback query also failed:', fallbackError);
        }
      }
      
      if (allActionReports.length > 0) {
        console.log('✅ Processed action reports:', allActionReports.length);
        console.log('📋 Sample data structure:', allActionReports[0]);
        console.log('📋 All departments found:', [...new Set(allActionReports.map(r => r.department))]);
        
        // Filter reports based on active tab if needed
        const filteredReports = activeTab === 'all' 
          ? allActionReports 
          : allActionReports.filter(report => {
            const reportDept = report.department?.toLowerCase();
            const activeTabLower = activeTab?.toLowerCase();
            const matches = reportDept === activeTabLower;
            console.log(`🔍 Checking report: ${report.municipality} - department: "${reportDept}" vs activeTab: "${activeTabLower}" = ${matches}`);
            return matches;
          });
        
        console.log(`🔍 Filtered reports for ${activeTab}:`, filteredReports.length);
        console.log('📋 Filtered reports sample:', filteredReports.slice(0, 2));
        
        setAllActionReports(allActionReports);
        setActionItems(filteredReports);
        
        if (allActionReports.length === 0) {
          setSuccessMessage('No action reports found');
        } else {
          setSuccessMessage(`✅ Loaded ${allActionReports.length} total reports, ${filteredReports.length} for ${activeTab}`);
        }
      } else {
        console.log('📭 No action reports found in Firestore');
        setActionItems([]);
        setAllActionReports([]);
        setSuccessMessage('No action reports found');
      }
    } catch (error) {
      console.error('❌ Error loading action reports:', error);
      setActionItems([]);
      setAllActionReports([]);
      setSuccessMessage('Error loading action reports');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadActionReports();
  }, [activeTab]);

  // Load data when component mounts
  useEffect(() => {
    console.log('🚀 ActionCenter component mounted, loading data...');
    loadActionReports();
  }, []);

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



  // Handle cleaning duplicates
  const handleCleanDuplicates = async () => {
    try {
      setLoading(true);
      // Find duplicates based on key fields
      const duplicates = [];
      const seen = new Set();
      const originalItems = new Map(); // Keep track of original items
      actionItems.forEach((item, index) => {
        // Create a unique key based on municipality, district, what, when, where
        const key = `${item.municipality}-${item.district}-${item.what}-${item.when}-${item.where}`;
        if (seen.has(key)) {
          // This is a duplicate - add to duplicates array
          duplicates.push({ ...item, index });
        } else {
          // This is the first occurrence (original) - keep it
          seen.add(key);
          originalItems.set(key, item);
        }
      });
      if (duplicates.length === 0) {
        alert('No duplicates found in the data.');
        return;
      }
      // Confirm deletion
      const confirmed = window.confirm(
        `Found ${duplicates.length} duplicate entries. The original entries will be kept. Do you want to remove the duplicates? This action cannot be undone.`
      );
      if (confirmed) {
        // For now, we'll just remove duplicates from local state
        // Since we're using the month-based structure, we need to handle this differently
        setActionItems(prevItems => 
          prevItems.filter(item => !duplicates.some(dup => dup.id === item.id))
        );
        setAllActionReports(prevReports => 
          prevReports.filter(item => !duplicates.some(dup => dup.id === item.id))
        );
        alert(`Successfully removed ${duplicates.length} duplicate entries from local view. Note: This only affects the current view. To permanently remove duplicates, you'll need to edit the individual reports.`);
      }
    } catch (error) {
      console.error('Error cleaning duplicates:', error);
      alert('Error cleaning duplicates. Please try again.');
    } finally {
      setLoading(false);
    }
  };


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
    
    // Filter by user's municipality for non-admin users
    const matchesUserMunicipality = isAdmin ? true : (item.municipality === userMunicipality);
    
    return matchesSearch && matchesMonthYear && matchesDistrict && matchesDepartment && matchesMunicipality && matchesUserMunicipality;
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

  // Calculate pagination
  const totalPages = Math.ceil((sortedItems?.length || 0) / itemsPerPage);
  const startIndex = (tablePage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = sortedItems?.slice(startIndex, endIndex) || [];

  // Calculate totals (normalized to match table display)
  const totalActions = (sortedItems || []).filter(item => item.actionTaken && item.actionTaken.trim() !== '').length;
  const normalize = (value) => String(value ?? '').trim().toLowerCase();
  const isResolved = (item) => normalize(item.status) === 'resolved' || normalize(item.actionTaken) === 'resolved';
  const isPending = (item) => !isResolved(item);
  const pendingActions = (sortedItems || []).filter(isPending).length;
  const resolvedActions = (sortedItems || []).filter(isResolved).length;
  const highPriorityActions = (sortedItems || []).filter(item => item.priority === "high").length;
  const totalPatrols = (sortedItems || []).reduce((sum, item) => sum + (item.patrolCount || 0), 0);
  const totalIncidents = (sortedItems || []).reduce((sum, item) => sum + (item.incidentCount || 0), 0);
  // Gender-based counting (cards use these)
  const totalDrugsMale = (sortedItems || []).filter(item => normalize(item.gender) === 'male').length;
  const totalDrugsFemale = (sortedItems || []).filter(item => normalize(item.gender) === 'female').length;
  const totalDrugs = totalDrugsMale + totalDrugsFemale;
  // "Illegals" counters (detect via text fields)
  const ILLEGAL_KEYWORDS = [
    'illegal',
    // Gambling and games
    'gambling', 'sugal', 'pagsusugal', 'pasugal',
    'sakla', 'saklaan', 'sakla game', 'sakla gambling',
    'tupada', 'sabong', 'e-sabong', 'esabong', 'online sabong', 'cockfighting',
    'jueteng',
    'cara y cruz', 'cara y-cruz',
    'color game', 'fruit game',
    'video karera', 'videokarera', 'vk',
    'patulo', 'pa-tulo', 'pa tulo', 'patulo game', 'patulo gambling',
    'bingo', 'illegal bingo',
    // Drugs
    'drugs', 'drug use', 'drug selling', 'drug pushing', 'marijuana', 'shabu', 'cocaine', 'illegal drugs',
    // Fishing/Forest/Mining/Construction/Vending
    'illegal fishing', 'dynamite fishing', 'cyanide fishing', 'poison fishing', 'fishing gear', 'fine mesh', 'hulbot', 'active gear',
    'illegal logging', 'illegal cutting', 'tree cutting', 'forest destruction', 'kaingin',
    'illegal mining', 'illegal quarrying', 'illegal extraction',
    'illegal construction', 'building without permit', 'illegal structure',
    'illegal vending', 'illegal selling', 'illegal business', 'no permit',
    // Traffic / vehicles
    'traffic violation', 'reckless driving', 'illegal parking', 'no license', 'no registration', 'unregistered', 'carnapping', 'stolen vehicle',
    // Morality / prostitution
    'prostitution', 'illegal bar', 'bar girls', 'gro', 'g.r.o', 'g.r.o.',
    // Weapons / possession / contraband
    'loose firearm', 'unregistered firearm', 'illegal firearm', 'illegal weapon', 'illegal possession', 'contraband', 'smuggling', 'illegal smuggling',
    // Cybercrime / fraud
    'cybercrime', 'hacking', 'phishing', 'online scam', 'scam', 'estafa', 'fraud', 'swindling',
    // Trafficking / recruitment
    'human trafficking', 'trafficking', 'illegal trafficking', 'illegal recruitment',
    // Alcohol / tobacco / counterfeit
    'illegal alcohol', 'liquor ban', 'pirated', 'counterfeit'
  ].map(k => k.toLowerCase());
  const ILLEGAL_CATEGORIES = {
    // Gambling
    'Sakla': ['sakla', 'saklaan', 'sakla game', 'sakla gambling'],
    'Gambling': ['gambling', 'sugal', 'pagsusugal', 'pasugal', 'jueteng', 'cara y cruz', 'cara y-cruz', 'color game', 'fruit game', 'video karera', 'videokarera', 'vk', 'illegal gambling', 'patulo', 'pa-tulo', 'pa tulo', 'patulo game', 'bingo', 'illegal bingo'],
    'Tupada': ['tupada', 'sabong', 'e-sabong', 'esabong', 'online sabong', 'cockfighting', 'illegal cockfighting'],
    'Gro Bar / Prostitution': ['gro bar', 'g.r.o', 'g.r.o.', 'gro', 'bar operation', 'bar girls', 'illegal bar', 'prostitution'],
    // Drugs
    'Drugs': ['drugs', 'drug use', 'drug selling', 'drug pushing', 'illegal drugs', 'marijuana', 'shabu', 'cocaine'],
    // PNP-focused
    'Illegal Possession of Firearm': ['loose firearm', 'unregistered firearm', 'illegal firearm', 'illegal weapon', 'illegal possession'],
    'Cybercrime / Fraud': ['cybercrime', 'hacking', 'phishing', 'online scam', 'scam', 'estafa', 'fraud', 'swindling'],
    'Human Trafficking': ['human trafficking', 'trafficking', 'illegal trafficking'],
    'Illegal Recruitment': ['illegal recruitment'],
    'Smuggling / Contraband': ['smuggling', 'illegal smuggling', 'contraband', 'pirated', 'counterfeit'],
    'Carnapping / Illegal Vehicles': ['carnapping', 'stolen vehicle', 'unregistered', 'no registration'],
    // Environment / commerce
    'Illegal Fishing': ['illegal fishing', 'dynamite fishing', 'cyanide fishing', 'poison fishing', 'fishing gear', 'fine mesh', 'hulbot', 'active gear'],
    'Illegal Logging': ['illegal logging', 'illegal cutting', 'tree cutting', 'forest destruction', 'kaingin'],
    'Illegal Mining': ['illegal mining', 'illegal quarrying', 'illegal extraction'],
    'Illegal Construction': ['illegal construction', 'building without permit', 'illegal structure'],
    'Illegal Vending / No Permit': ['illegal vending', 'illegal selling', 'illegal business', 'no permit'],
    // Traffic
    'Traffic Violations': ['traffic violation', 'reckless driving', 'illegal parking', 'no license']
  };
  const isIllegal = (item) => {
    // For Agriculture and PG-ENRO, use otherInfo instead of source
    const sourceField = (activeTab === "agriculture" || activeTab === "pg-enro") ? item.otherInfo : item.source;
    const text = [item.what, item.why, item.how, item.otherInfo, item.actionTaken, item.where, sourceField]
      .map(v => normalize(v))
      .join(' ');
    return ILLEGAL_KEYWORDS.some(kw => text.includes(kw));
  };
  // Count categories and total unique illegal items (dynamically detected from table data)
  const { illegalCategoryCounts, totalIllegals } = (() => {
    const counts = {};
    let total = 0;
    if (!sortedItems || !Array.isArray(sortedItems)) {
      return { illegalCategoryCounts: counts, totalIllegals: total };
    }
          sortedItems.forEach(item => {
        // For Agriculture and PG-ENRO, use otherInfo instead of source
        const sourceField = (activeTab === "agriculture" || activeTab === "pg-enro") ? item.otherInfo : item.source;
        const text = [item.what, item.why, item.how, item.otherInfo, item.actionTaken, item.where, sourceField]
          .map(v => normalize(v))
          .join(' ');
      // Check predefined illegal categories first
      let matched = false;
      for (const [cat, keys] of Object.entries(ILLEGAL_CATEGORIES)) {
        if (keys.some(kw => text.includes(kw))) {
          counts[cat] = (counts[cat] || 0) + 1;
          matched = true;
        }
      }
      // Dynamically detect new categories from the data
      if (!matched && text.length > 0) {
        const mainText = item.what || item.why || '';
        if (mainText && mainText.trim().length > 0) {
          const words = mainText.trim().split(' ').slice(0, 3);
          const categoryName = words.map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(' ');
          const unwantedTerms = [
            'alleged', 'illegal', 'illegals', 'user', 'pusher', 'selling', 'using', 'drugs',
            'alleged illegal', 'illegal user', 'illegal pusher', 'illegal selling', 'illegal using',
            'alleged illegals', 'illegals user', 'illegals pusher', 'illegals selling', 'illegals using'
          ];
          const isUnwanted = unwantedTerms.some(term => 
            categoryName.toLowerCase().includes(term.toLowerCase())
          );
          if (categoryName.length > 0 && !isUnwanted) {
            counts[categoryName] = (counts[categoryName] || 0) + 1;
            matched = true;
          }
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
    if (!sortedItems || !Array.isArray(sortedItems)) {
      return counts;
    }
    sortedItems.forEach(item => {
      const label = getActionTakenLabel(item.actionTaken);
      counts[label] = (counts[label] || 0) + 1;
    });
    return counts;
  })();
  // Bantay Dagat specific calculations
  const totalFishingViolations = (sortedItems || []).reduce((sum, item) => sum + (item.fishingViolations || 0), 0);
  const totalIllegalFishing = (sortedItems || []).reduce((sum, item) => sum + (item.illegalFishing || 0), 0);
  const totalFishCaught = (sortedItems || []).reduce((sum, item) => sum + (item.fishCaught || 0), 0);
  const totalBoatsInspected = (sortedItems || []).reduce((sum, item) => sum + (item.boatsInspected || 0), 0);
  // Agriculture/Bantay Dagat specific illegal categories - AUTO DETECT from table data
  const { agricultureIllegalCategoryCounts, totalAgricultureIllegals } = (() => {
    const counts = {};
    let total = 0;
    
    // Only process items when agriculture tab is active
    if (activeTab === "agriculture" && sortedItems && Array.isArray(sortedItems)) {
      sortedItems.forEach(item => {
        // Combine all text fields for analysis
        const allText = [item.what, item.why, item.how, item.otherInfo, item.actionTaken]
          .filter(v => v && v.trim().length > 0)
          .map(v => normalize(v))
          .join(' ').toLowerCase();
        
        if (allText.length > 0) {
          let detectedCategory = null;
          
          // Auto-detect illegal fishing categories
          if (allText.includes('fishing') || allText.includes('fish') || allText.includes('boat') || allText.includes('net')) {
            if (allText.includes('gear') || allText.includes('equipment') || allText.includes('net') || allText.includes('hook')) {
              detectedCategory = 'Illegal Fishing Gear';
            } else if (allText.includes('size') || allText.includes('small') || allText.includes('juvenile')) {
              detectedCategory = 'Illegal Fish Size';
            } else if (allText.includes('season') || allText.includes('closed') || allText.includes('spawning')) {
              detectedCategory = 'Illegal Fishing Season';
            } else if (allText.includes('zone') || allText.includes('area') || allText.includes('protected')) {
              detectedCategory = 'Illegal Fishing Zone';
            } else if (allText.includes('species') || allText.includes('endangered') || allText.includes('protected')) {
              detectedCategory = 'Illegal Fish Species';
            } else if (allText.includes('transport') || allText.includes('carry') || allText.includes('move')) {
              detectedCategory = 'Illegal Fish Transport';
            } else if (allText.includes('sale') || allText.includes('sell') || allText.includes('market')) {
              detectedCategory = 'Illegal Fish Sale';
            } else if (allText.includes('process') || allText.includes('drying') || allText.includes('smoking')) {
              detectedCategory = 'Illegal Fish Processing';
            } else {
              detectedCategory = 'Illegal Fishing';
            }
          }
          
          // Auto-detect agriculture violations
          else if (allText.includes('pesticide') || allText.includes('chemical') || allText.includes('fertilizer')) {
            detectedCategory = 'Illegal Pesticide Use';
          } else if (allText.includes('land') || allText.includes('farm') || allText.includes('agriculture')) {
            if (allText.includes('clear') || allText.includes('burn') || allText.includes('slash')) {
              detectedCategory = 'Illegal Land Clearing';
            } else if (allText.includes('water') || allText.includes('irrigation') || allText.includes('drainage')) {
              detectedCategory = 'Illegal Water Use';
            } else {
              detectedCategory = 'Agricultural Violation';
            }
          }
          
          // Auto-detect wildlife violations
          else if (allText.includes('wildlife') || allText.includes('animal') || allText.includes('bird') || allText.includes('mammal')) {
            detectedCategory = 'Wildlife Violation';
          }
          
          // Auto-detect forest violations
          else if (allText.includes('tree') || allText.includes('forest') || allText.includes('wood') || allText.includes('timber')) {
            detectedCategory = 'Forest Violation';
          }
          
          // Auto-detect water pollution
          else if (allText.includes('pollution') || allText.includes('contamination') || allText.includes('waste') || allText.includes('dumping')) {
            detectedCategory = 'Water Pollution';
          }
          
          // If no specific category detected, create smart category from main text
          if (!detectedCategory) {
            const mainText = item.what || item.why || '';
            if (mainText && mainText.trim().length > 0) {
              // Extract key words and create meaningful category
              const keyWords = mainText.trim().split(' ')
                .filter(word => word.length > 3) // Filter out short words
                .slice(0, 2); // Take first 2 meaningful words
              
              if (keyWords.length > 0) {
                detectedCategory = keyWords.map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                ).join(' ') + ' Violation';
              }
            }
          }
          
          // Add to counts if category was detected
          if (detectedCategory) {
            counts[detectedCategory] = (counts[detectedCategory] || 0) + 1;
            total += 1;
          }
        }
      });
    }
    
    return { agricultureIllegalCategoryCounts: counts, totalAgricultureIllegals: total };
  })();
  // PG-ENRO specific calculations
  const totalEnvironmentalViolations = (sortedItems || []).reduce((sum, item) => sum + (item.environmentalViolations || 0), 0);
  const totalWasteManagement = (sortedItems || []).reduce((sum, item) => sum + (item.wasteManagement || 0), 0);
  const totalTreePlanting = (sortedItems || []).reduce((sum, item) => sum + (item.treePlanting || 0), 0);
  const totalCleanupOperations = (sortedItems || []).reduce((sum, item) => sum + (item.cleanupOperations || 0), 0);
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };
  const handleAction = (actionId, action) => {
    const item = (actionItems || []).find(item => item.id === actionId);
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
        // Try to generate month key from the report's when field
        let monthKey = null;
        if (selectedItem.when) {
          const reportDate = new Date(selectedItem.when);
          monthKey = `${String(reportDate.getMonth() + 1).padStart(2, '0')}-${reportDate.getFullYear()}`;
        }
        
        const result = await deleteActionReport(selectedItem.id, monthKey);
        if (result.success) {
          setActionItems(prevItems => (prevItems || []).filter(item => item.id !== selectedItem.id));
          setAllActionReports(prevAll => (prevAll || []).filter(item => item.id !== selectedItem.id));
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
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 40;
    const contentWidth = pageWidth - (2 * margin);

    // Header banner
    const headerHeight = 80;
    doc.setFillColor(37, 99, 235); // blue-600
    doc.rect(0, 0, pageWidth, headerHeight, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Action Center Report', margin, 32);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const subtitle = `${MONTH_NAMES[selectedMonth] || 'All Months'} • ${selectedYear || 'All Years'} • ${(activeTab || 'unknown').toUpperCase()}`;
    doc.text(subtitle, margin, 52);
    doc.setTextColor(0, 0, 0);

    // Optional description
    let cursorY = headerHeight + 20;
    if (pdfDescription && pdfDescription.trim()) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'italic');
      const descriptionLines = doc.splitTextToSize(pdfDescription.trim(), contentWidth);
      doc.text(descriptionLines, margin, cursorY);
      cursorY += (descriptionLines.length * 14) + 10;
      doc.setFont('helvetica', 'normal');
    }

    // Report meta grid
    const lineHeight = 18;
    const metaStartY = cursorY;
    doc.setFontSize(11);
    doc.text(`Month: ${MONTH_NAMES[previewMonth] || 'All Months'}`, margin, metaStartY);
    doc.text(`Year: ${previewYear || 'All Years'}`, margin + (contentWidth / 2), metaStartY);
    doc.text(`District: ${previewDistrict === 'all' ? 'All Districts' : previewDistrict}`, margin, metaStartY + lineHeight);
    doc.text(`Department: ${previewDepartment === 'all' ? 'All Departments' : previewDepartment.toUpperCase()}`, margin + (contentWidth / 2), metaStartY + lineHeight);
    doc.text(`Municipality: ${activeMunicipality === 'all' ? 'All Municipalities' : activeMunicipality}`, margin, metaStartY + (2 * lineHeight));
    
    // Add filter information
    let filterInfo = '';
    if (previewMonth !== 'all') filterInfo += `Month: ${MONTH_NAMES[previewMonth]} `;
    if (previewYear !== 'all') filterInfo += `Year: ${previewYear} `;
    if (previewDistrict !== 'all') filterInfo += `District: ${previewDistrict}`;
    if (filterInfo) {
      doc.text(`Filters: ${filterInfo.trim()}`, margin, metaStartY + (3 * lineHeight));
    }

    // Summary cards
    let statsData = [
      { label: 'Total Actions', value: totalActions },
      { label: 'Pending', value: pendingActions },
      { label: 'Resolved', value: resolvedActions },
      { label: 'High Priority', value: highPriorityActions }
    ];
    if (activeTab === 'pnp') {
      statsData = statsData.concat([
        { label: 'Total Drugs', value: totalDrugs },
        { label: 'Male Drugs', value: totalDrugsMale },
        { label: 'Female Drugs', value: totalDrugsFemale },
        { label: 'Total Illegals', value: totalIllegals }
      ]);
    } else if (activeTab === 'agriculture') {
      statsData = statsData.concat([
        { label: 'Total Illegals', value: totalAgricultureIllegals },
        { label: 'Fishing Violations', value: totalFishingViolations },
        { label: 'Illegal Fishing', value: totalIllegalFishing }
      ]);
    } else if (activeTab === 'pg-enro') {
      statsData = statsData.concat([
        { label: 'Environmental Violations', value: totalEnvironmentalViolations },
        { label: 'Waste Management', value: totalWasteManagement },
        { label: 'Tree Planting', value: totalTreePlanting }
      ]);
    }

    const cardsTop = metaStartY + (3 * lineHeight) + 16;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Summary Statistics', margin, cardsTop - 10);
    doc.setFont('helvetica', 'normal');

    const cardWidth = (contentWidth - 20) / 2; // two columns
    const cardHeight = 40;
    let cardX = margin;
    let cardY = cardsTop + 6;
    doc.setDrawColor(226, 232, 240); // slate-200 border
    statsData.forEach((stat, idx) => {
      doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 4, 4);
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text(String(stat.label), cardX + 10, cardY + 16);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(String(stat.value ?? 0), cardX + 10, cardY + 32);
      doc.setFont('helvetica', 'normal');

      // advance position
      if (cardX + cardWidth + 20 + cardWidth <= pageWidth - margin) {
        cardX += cardWidth + 20;
      } else {
        cardX = margin;
        cardY += cardHeight + 12;
      }
    });

    const tableStartY = cardY + cardHeight + 24;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Action Items Details', margin, tableStartY - 10);
    doc.setFont('helvetica', 'normal');

    // Prepare table
    let tableHeaders = ['Municipality', 'District', 'What', 'When', 'Where', 'Action Taken'];
    let tableData = [];
    const filteredData = getPreviewFilteredData();
    
    if (previewDepartment === 'pnp') {
      tableHeaders = tableHeaders.concat(['Source', 'Other Information']);
      tableData = (filteredData || []).map(item => [
        item.municipality || 'N/A',
        item.district || 'N/A',
        item.what || 'N/A',
        formatDate(item.when),
        item.where || 'N/A',
        item.actionTaken || 'N/A',
        item.source || 'N/A',
        item.otherInfo || 'N/A'
      ]);
    } else if (previewDepartment === 'agriculture') {
      tableHeaders = tableHeaders.concat(['Other Information']);
      tableData = (filteredData || []).map(item => [
        item.municipality || 'N/A',
        item.district || 'N/A',
        item.what || 'N/A',
        formatDate(item.when),
        item.where || 'N/A',
        item.actionTaken || 'N/A',
        item.otherInfo || 'N/A'
      ]);
    } else if (previewDepartment === 'pg-enro') {
      tableHeaders = tableHeaders.concat(['Other Information']);
      tableData = (filteredData || []).map(item => [
        item.municipality || 'N/A',
        item.district || 'N/A',
        item.what || 'N/A',
        formatDate(item.when),
        item.where || 'N/A',
        item.actionTaken || 'N/A',
        item.otherInfo || 'N/A'
      ]);
    } else {
      // All departments
      tableHeaders = tableHeaders.concat(['Department', 'Other Information']);
      tableData = (filteredData || []).map(item => [
        item.municipality || 'N/A',
        item.district || 'N/A',
        item.what || 'N/A',
        formatDate(item.when),
        item.where || 'N/A',
        item.actionTaken || 'N/A',
        item.department || 'N/A',
        item.otherInfo || 'N/A'
      ]);
    }

    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: tableStartY,
      styles: {
        fontSize: 9,
        cellPadding: 5,
        overflow: 'linebreak',
        lineColor: [226, 232, 240],
        lineWidth: 0.5
      },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { left: margin, right: margin },
      theme: 'grid',
      didDrawPage: (data) => {
        // Footer with page numbers and meta
        const footerTextLeft = `Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
        const pageStr = `Page ${doc.internal.getNumberOfPages()}`;
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(footerTextLeft, margin, pageHeight - 20);
        doc.text(pageStr, pageWidth - margin, pageHeight - 20, { align: 'right' });
      }
    });

    const fileName = `action-center-${activeTab}-${MONTH_NAMES[selectedMonth] || 'all'}-${selectedYear || 'all'}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const openPreviewModal = () => {
    setShowPreviewModal(true);
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
    // Ensure we always return a string, not an object
    if (date && typeof date === 'object') {
      return 'Invalid Date';
    }
    return date ? String(date) : 'No Date';
  };
  // Function to recursively clean objects and arrays, removing undefined values
  const deepCleanObject = (obj) => {
    if (obj === undefined || obj === null) {
      return null;
    }
    if (Array.isArray(obj)) {
      const cleanedArray = obj
        .map(item => deepCleanObject(item))
        .filter(item => item !== null);
      return cleanedArray;
    }
    if (typeof obj === 'object') {
      const cleanedObj = {};
      Object.entries(obj).forEach(([key, value]) => {
        const cleanedValue = deepCleanObject(value);
        if (cleanedValue !== null) {
          cleanedObj[key] = cleanedValue;
        }
      });
      return cleanedObj;
    }
    return obj;
  };
  // Function to validate and clean photo objects
  const validateAndCleanPhoto = (photo) => {
    if (!photo || typeof photo !== 'object') {
      return null;
    }
    // Check for required fields and provide defaults
    const cleanPhoto = {
      id: photo.id || `photo-${Date.now()}-${Math.random()}`,
      fileName: photo.fileName || photo.name || 'Unknown Photo',
      fileSize: photo.fileSize || 0,
      fileType: photo.fileType || 'image/*',
      lastModified: photo.lastModified || Date.now(),
      imageData: photo.imageData || null,
      uploadDate: photo.uploadDate || new Date().toISOString()
    };
    // Validate each field individually
    Object.entries(cleanPhoto).forEach(([key, value]) => {
      if (value === undefined) {
        cleanPhoto[key] = null; // Set to null instead of undefined
      }
    });
    // Only return photos that have actual image data or are legacy photos
    if (cleanPhoto.imageData || photo.url) {
      return cleanPhoto;
    }
    return null;
  };
  // Function to migrate Firebase Storage URLs to base64 data
  const migratePhotoToBase64 = async (photo) => {
    // If photo already has base64 data, return as is
    if (photo.imageData) {
      return photo;
    }
    // If photo has a Firebase Storage URL, try to convert it
    if (photo.url && photo.url.includes('firebasestorage.googleapis.com')) {
      try {
        // For now, we'll create a placeholder since we can't fetch from Firebase Storage
        // In a real migration, you would need to download the image and convert to base64
        return {
          ...photo,
          imageData: null, // Will be null for old Firebase Storage URLs
          isLegacy: true,
          error: 'Legacy Firebase Storage URL - needs manual migration'
        };
      } catch (error) {
        console.error('Error migrating photo:', error);
        return {
          ...photo,
          imageData: null,
          isLegacy: true,
          error: 'Migration failed'
        };
      }
    }
    // If photo is just a string URL, treat it as legacy
    if (typeof photo === 'string') {
      return {
        id: Date.now() + Math.random(),
        fileName: 'Legacy Photo',
        fileSize: 0,
        fileType: 'image/*',
        imageData: null,
        isLegacy: true,
        error: 'Legacy photo format - needs manual migration'
      };
    }
    return photo;
  };

  // Function to upload photos to Cloudinary
  const uploadPhotosToCloudinary = async (photos) => {
    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return [];
    }
    
    const uploadPromises = photos.map(async (photo) => {
      if (!photo.blob) {
        console.warn('Photo missing blob data:', photo);
        return null;
      }
      
      try {
        // Convert blob to File object for Cloudinary upload
        const file = new File([photo.blob], photo.fileName, { type: photo.fileType });
        
        // Upload to Cloudinary
        const result = await cloudinaryUtils.uploadImage(file, {
          folder: 'ipatroller/action-reports',
          publicId: `action-report-${Date.now()}-${Math.random().toString(36).substring(2)}`
        });
        
        if (result.success) {
          return {
            id: photo.id,
            fileName: photo.fileName,
            fileSize: photo.fileSize,
            fileType: photo.fileType,
            lastModified: photo.lastModified,
            uploadDate: photo.uploadDate,
            storageUrl: result.data.url,
            cloudinaryId: result.data.publicId
          };
        } else {
          console.error('Cloudinary upload failed:', result.error);
          return null;
        }
      } catch (error) {
        console.error('Error uploading photo to Cloudinary:', error);
        return null;
      }
    });
    
    const results = await Promise.all(uploadPromises);
    return results.filter(result => result !== null);
  };

  // Function to get the best available image source
  const getImageSource = (photo) => {
    // Priority: storage URL > preview URL > base64 data > legacy URL > placeholder
    if (photo.storageUrl && typeof photo.storageUrl === 'string') {
      return photo.storageUrl;
    }
    if (photo.preview && typeof photo.preview === 'string') {
      return photo.preview;
    }
    if (photo.imageData && typeof photo.imageData === 'string' && photo.imageData.startsWith('data:image')) {
      return photo.imageData;
    }
    if (photo.url && typeof photo.url === 'string' && !photo.url.includes('firebasestorage.googleapis.com')) {
      return photo.url;
    }
    // Check if photo is a string (legacy format)
    if (typeof photo === 'string' && photo.startsWith('data:image')) {
      return photo;
    }
    // Return a placeholder for legacy Firebase Storage URLs or invalid photos
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1lcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+TGVnYWN5IFBob3RvPC90ZXh0Pjwvc3ZnPg==';
  };
  // Function to handle photo loading errors
  const handlePhotoError = (event, photo) => {
    // Set a fallback image
    event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmYwMDAwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1lcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RXJyb3IgTG9hZGluZyBQaG90bzwvdGV4dD48L3N2Zz4=';
    // Add error styling
    event.target.classList.add('border-red-500');
  };
  // Function to show image modal for data URLs
  const openImageModal = (imageSource, fileName) => {
    setImageModalData({ imageSource, fileName });
    setShowImageModal(true);
  };
  const handlePhotoUpload = (event, setReport) => {
    if (!event || !event.target) {
      console.error('Invalid event object');
      return;
    }
    if (!setReport || typeof setReport !== 'function') {
      console.error('setReport is not a function');
      return;
    }
    const files = Array.from(event.target?.files || []);
    if (!Array.isArray(files)) {
      console.error('Files is not an array');
      return;
    }
    const validFiles = files.filter(file => file && file.type && file.type.startsWith('image/'));
    if (!validFiles || !Array.isArray(validFiles) || validFiles.length === 0) {
      alert('Please select valid image files only.');
      return;
    }
    if (validFiles.length > 10) {
      alert('Maximum 10 images allowed.');
      return;
    }
    
    // Process images with compression and store file objects
    if (validFiles && Array.isArray(validFiles)) {
      validFiles.forEach(file => {
        if (!file || typeof file !== 'object' || !(file instanceof File)) return;
        
        // Create a compressed version of the image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          // Calculate new dimensions (max 800x800 to reduce size)
          const maxSize = 800;
          let { width, height } = img;
          
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress image
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to blob with compression
          canvas.toBlob((blob) => {
            if (blob) {
              const newPhoto = {
                id: Date.now() + Math.random(),
                fileName: file.name || 'Unknown',
                fileSize: blob.size,
                fileType: file.type || 'image/jpeg',
                lastModified: file.lastModified || Date.now(),
                uploadDate: new Date().toISOString(),
                // Store the compressed blob instead of base64
                blob: blob,
                // Create a preview URL for display
                preview: URL.createObjectURL(blob)
              };
              
              setReport(prevReport => ({
                ...(prevReport || {}),
                photos: [...(prevReport?.photos || []), newPhoto]
              }));
            }
          }, 'image/jpeg', 0.8); // Compress to JPEG with 80% quality
        };
        
        img.src = URL.createObjectURL(file);
      });
    }
  };
  const handlePhotoRemove = (photoId, setActionReport) => {
    if (!setActionReport || typeof setActionReport !== 'function') {
      console.error('setActionReport is not a function');
      return;
    }
    setActionReport(prevReport => ({
      ...(prevReport || {}),
      photos: (prevReport?.photos || []).filter(p => p && p.id !== photoId)
    }));
  };
  const handleAddActionReport = () => {
    setShowAddModal(true);
  };
  const handleSubmitActionReport = async () => {
    try {
      // Validate required fields based on department
      if (!newActionReport.department) {
        alert("Please select a department.");
        return;
      }
      if (!newActionReport.municipality || !newActionReport.district || 
          !newActionReport.what || !newActionReport.when || 
          !newActionReport.where || !newActionReport.actionTaken) {
        alert("Please fill in all required fields.");
        return;
      }
      // Additional validation for PNP department
      if (newActionReport.department === "pnp") {
        if (!newActionReport.who) {
          alert("Please fill in the 'Who' field for PNP reports.");
          return;
        }
      }
      // Additional validation for Agriculture department
      if (newActionReport.department === "agriculture") {
        // For Agriculture, only basic fields are required
        // Source field is not shown for Agriculture
      }

              // Upload photos to Cloudinary and get URLs
      let photoUrls = [];
      if (newActionReport.photos && newActionReport.photos.length > 0) {
        try {
          photoUrls = await uploadPhotosToCloudinary(newActionReport.photos);
        } catch (error) {
          console.error('Error uploading photos:', error);
          alert('Error uploading photos. Please try again.');
          return;
        }
      }
      
      // Clean photos data - only store URLs and metadata, not the actual image data
      const cleanPhotos = photoUrls.map(url => ({
        id: url.id,
        fileName: url.fileName,
        fileSize: url.fileSize,
        fileType: url.fileType,
        lastModified: url.lastModified,
        uploadDate: url.uploadDate,
        storageUrl: url.storageUrl
      }));
      
      const reportToSave = {
        ...newActionReport,
        photos: cleanPhotos,
        status: newActionReport.actionTaken === "Resolved" ? "resolved" : "pending",
        priority: "medium",
        patrolCount: 0,
        incidentCount: 0,
        icon: "AlertCircle",
        timestamp: Date.now(),
        id: `action-${Date.now()}`
      };
      console.log('Report to save:', reportToSave);
      // Remove any undefined values from the entire report
      const cleanReport = Object.fromEntries(
        Object.entries(reportToSave).filter(([_, value]) => value !== undefined)
      );
      console.log('Submitting action report:', {
        department: cleanReport.department,
        what: cleanReport.what
      });
      const result = await saveActionReport(cleanReport);
      if (result.success) {
        console.log('Action report saved successfully:', result);
              // Reload the data to ensure it appears in the correct tab
      try {
        await loadActionReports();
        console.log('Data reloaded successfully after submission');
      } catch (error) {
        console.error('Error reloading data after submission:', error);
        // Fallback: manually add the new report to the current list
        setActionItems(prevItems => [...(prevItems || []), reportToSave]);
      }
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
          otherInfo: "",
          photos: []
        });
        alert("Action report added successfully!");
      } else {
        console.error('Error saving action report:', result.error);
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
      gender: "",
      why: "",
      how: "",
      source: "",
      actionTaken: "",
      otherInfo: "",
      photos: []
    });
  };

  // Save action report to Firestore
  const saveActionReport = async (reportData) => {
    try {
      const result = await addActionReport(reportData);
      return result;
    } catch (error) {
      console.error('Error saving action report:', error);
      return { success: false, error: error.message };
    }
  };
  const handleEditActionReport = async () => {
    try {
      // Handle photo updates - upload new photos and keep existing ones
      let cleanPhotos = [];
      
      // Keep existing photos that already have storage URLs
      const existingPhotos = editingItem.photos ? editingItem.photos.filter(photo => photo.storageUrl) : [];
      
      // Upload new photos (those with blob data)
      const newPhotos = editingItem.photos ? editingItem.photos.filter(photo => photo.blob) : [];
      if (newPhotos.length > 0) {
        try {
          const newPhotoUrls = await uploadPhotosToCloudinary(newPhotos);
          const newCleanPhotos = newPhotoUrls.map(url => ({
            id: url.id,
            fileName: url.fileName,
            fileSize: url.fileSize,
            fileType: url.fileType,
            lastModified: url.lastModified,
            uploadDate: url.uploadDate,
            storageUrl: url.storageUrl
          }));
          cleanPhotos = [...existingPhotos, ...newCleanPhotos];
        } catch (error) {
          console.error('Error uploading new photos:', error);
          alert('Error uploading new photos. Please try again.');
          return;
        }
      } else {
        cleanPhotos = existingPhotos;
      }
      
      const updatedReport = {
        ...editingItem,
        photos: cleanPhotos,
        status: editingItem.actionTaken === "resolved" ? "resolved" : "pending"
      };
      // Remove any undefined values from the entire report
      const cleanReport = deepCleanObject(updatedReport);
      // Final validation - check for any remaining undefined values
      const hasUndefinedValues = Object.values(cleanReport).some(value => 
        value === undefined || 
        (Array.isArray(value) && value.some(item => item === undefined)) ||
        (typeof value === 'object' && value !== null && Object.values(value).some(v => v === undefined))
      );
      if (hasUndefinedValues) {
        throw new Error('Data validation failed: undefined values still present');
      }
      // Try to generate month key from the report's when field
      let monthKey = null;
      if (editingItem.when) {
        const reportDate = new Date(editingItem.when);
        monthKey = `${String(reportDate.getMonth() + 1).padStart(2, '0')}-${reportDate.getFullYear()}`;
      }
      
      const result = await updateActionReport(editingItem.id, monthKey, cleanReport);
      if (result.success) {
        setActionItems(prevItems => 
          (prevItems || []).map(item => 
            item.id === editingItem.id ? cleanReport : item
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
    // Clean up any photo previews to prevent memory leaks
    if (editingItem && editingItem.photos && Array.isArray(editingItem.photos)) {
      editingItem.photos.forEach(photo => {
        if (photo && photo.preview) {
          URL.revokeObjectURL(photo.preview);
        }
      });
    }
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
        for (const [district, municipalities] of Object.entries(municipalitiesByDistrict || {})) {
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
        for (const [district, municipalities] of Object.entries(municipalitiesByDistrict || {})) {
          if (municipalities.includes(value)) {
            updated.district = district;
            break;
          }
        }
      }
      

      
      return updated;
    });
  };
  // Function to remove photos from an action report
  const handleRemovePhoto = async (reportId, photoIndex) => {
    try {
      // Find the action report
      const reportIndex = (actionItems || []).findIndex(item => item.id === reportId);
      if (reportIndex === -1) {
        alert('Report not found.');
        return;
      }
      const report = (actionItems || [])[reportIndex];
      const updatedPhotos = (report.photos || []).filter((_, index) => index !== photoIndex);
      // Create updated report
      const updatedReport = {
        ...report,
        photos: updatedPhotos
      };
      // Try to generate month key from the report's when field
      let monthKey = null;
      if (report.when) {
        const reportDate = new Date(report.when);
        monthKey = `${String(reportDate.getMonth() + 1).padStart(2, '0')}-${reportDate.getFullYear()}`;
      }
      
      // Update in Firestore
      const result = await updateActionReport(reportId, monthKey, updatedReport);
      if (result.success) {
        // Update local state
        setActionItems(prevItems => 
          (prevItems || []).map(item => 
            item.id === reportId ? updatedReport : item
          )
        );
        // Update viewingItem if it's the same report
        if (viewingItem && viewingItem.id === reportId) {
          setViewingItem(updatedReport);
        }
        alert('Photo removed successfully!');
      } else {
        alert(`Error removing photo: ${result.error}`);
      }
    } catch (error) {
      console.error('Error removing photo:', error);
      alert('Error removing photo. Please try again.');
    }
  };

  return (
    <Layout onLogout={onLogout} onNavigate={onNavigate} currentPage={currentPage}>
      <div className="min-h-screen bg-white">
        <section className="flex-1 p-4 md:p-8 space-y-6">
          {/* Modern Header with Black/White Theme */}
          <div className="bg-black text-white rounded-2xl p-6 md:p-8 shadow-2xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg">
                    <Target className="w-6 h-6 text-black" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold">
                    Action Center
                  </h1>
                </div>
                <p className="text-gray-300 text-lg">
                  {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })} • Incident Response & Action Tracking
                </p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    loading ? 'bg-yellow-400' : 'bg-green-400'
                  }`}></div>
                  <span className={`text-sm font-medium ${
                    loading ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {loading ? 'Processing...' : 'System Operational'}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="bg-white text-black hover:bg-gray-100 px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Report
                </Button>
                <Button
                  onClick={openPreviewModal}
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-black px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2"
                >
                  <Eye className="w-5 h-5" />
                  Preview
                </Button>
                <Button
                  onClick={exportToPDF}
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-black px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Export
                </Button>
              </div>
            </div>
          </div>

          {/* Department Navigation Tabs - Black/White Theme */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-xl">
              {isAdmin && (
                <>
                  <TabsTrigger 
                    value="pnp" 
                    className="data-[state=active]:bg-black data-[state=active]:text-white text-black font-semibold rounded-lg transition-all duration-300"
                    onClick={() => setActiveMunicipality("all")}
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      PNP
                    </div>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="agriculture" 
                    className="data-[state=active]:bg-black data-[state=active]:text-white text-black font-semibold rounded-lg transition-all duration-300"
                    onClick={() => setActiveMunicipality("all")}
                  >
                    <div className="flex items-center gap-2">
                      <Fish className="h-4 w-4" />
                      Agriculture
                    </div>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="pg-enro" 
                    className="data-[state=active]:bg-black data-[state=active]:text-white text-black font-semibold rounded-lg transition-all duration-300"
                    onClick={() => setActiveMunicipality("all")}
                  >
                    <div className="flex items-center gap-2">
                      <Trees className="h-4 w-4" />
                      PG-ENRO
                    </div>
                  </TabsTrigger>
                </>
              )}
              
              {/* Show only Agriculture tab for Agriculture department users */}
              {!isAdmin && userDepartment === "agriculture" && (
                <TabsTrigger 
                  value="agriculture" 
                  className="data-[state=active]:bg-black data-[state=active]:text-white text-black font-semibold rounded-lg transition-all duration-300 col-span-3"
                  onClick={() => setActiveMunicipality("all")}
                >
                  <div className="flex items-center gap-2">
                    <Fish className="h-4 w-4" />
                    Agriculture - Bantay Dagat
                  </div>
                </TabsTrigger>
              )}
              
              {/* Show only PG-ENRO tab for PG-ENRO department users */}
              {!isAdmin && userDepartment === "pg-enro" && (
                <TabsTrigger 
                  value="pg-enro" 
                  className="data-[state=active]:bg-black data-[state=active]:text-white text-black font-semibold rounded-lg transition-all duration-300 col-span-3"
                  onClick={() => setActiveMunicipality("all")}
                >
                  <div className="flex items-center gap-2">
                    <Trees className="h-4 w-4" />
                    PG-ENRO - Environment
                  </div>
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
          {/* Search and Filters - Black/White Theme */}
          <Card className="border-2 border-gray-200 shadow-lg">
            <CardContent className="p-6">
              {/* Search Bar */}
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by municipality, district, department, or action..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-12 py-4 text-base border-2 border-gray-300 focus:border-black focus:ring-0 rounded-xl bg-gray-50 focus:bg-white transition-all duration-300"
                />
                {searchTerm && (
                  <Button
                    onClick={() => setSearchTerm("")}
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {/* Filters Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-black">Month</label>
                  <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(value === 'all' ? 'all' : parseInt(value))}>
                    <SelectTrigger className="border-2 border-gray-300 focus:border-black rounded-xl bg-gray-50 hover:bg-white transition-all duration-300">
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-2 border-gray-200 rounded-xl shadow-xl">
                      <SelectItem value="all" className="hover:bg-gray-100">All Months</SelectItem>
                      {[
                        'January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'
                      ].map((month, index) => (
                        <SelectItem key={month} value={index.toString()} className="hover:bg-gray-100">{month}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-black">Year</label>
                  <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(value === 'all' ? 'all' : parseInt(value))}>
                    <SelectTrigger className="border-2 border-gray-300 focus:border-black rounded-xl bg-gray-50 hover:bg-white transition-all duration-300">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-2 border-gray-200 rounded-xl shadow-xl">
                      <SelectItem value="all" className="hover:bg-gray-100">All Years</SelectItem>
                      {[2024, 2023, 2022, 2021, 2020].map((year) => (
                        <SelectItem key={year} value={year.toString()} className="hover:bg-gray-100">{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-black">District</label>
                  <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                    <SelectTrigger className="border-2 border-gray-300 focus:border-black rounded-xl bg-gray-50 hover:bg-white transition-all duration-300">
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-2 border-gray-200 rounded-xl shadow-xl">
                      <SelectItem value="all" className="hover:bg-gray-100">All Districts</SelectItem>
                      <SelectItem value="1ST DISTRICT" className="hover:bg-gray-100">1st District</SelectItem>
                      <SelectItem value="2ND DISTRICT" className="hover:bg-gray-100">2nd District</SelectItem>
                      <SelectItem value="3RD DISTRICT" className="hover:bg-gray-100">3rd District</SelectItem>
                    </SelectContent>
                  </Select>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-black">Municipality</label>
                  <Select value={activeMunicipality} onValueChange={setActiveMunicipality}>
                    <SelectTrigger className="border-2 border-gray-300 focus:border-black rounded-xl bg-gray-50 hover:bg-white transition-all duration-300">
                      <SelectValue placeholder="Select municipality" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-2 border-gray-200 rounded-xl shadow-xl">
                      <SelectItem value="all" className="hover:bg-gray-100">All Municipalities</SelectItem>
                      {Object.values(municipalitiesByDistrict).flat().map((municipality) => (
                        <SelectItem key={municipality} value={municipality} className="hover:bg-gray-100">{municipality}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Clear Filters Button */}
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedDistrict("all");
                    setSelectedMonth("all");
                    setSelectedYear("all");
                    setActiveMunicipality("all");
                  }}
                  variant="outline"
                  className="border-2 border-gray-300 hover:border-black hover:bg-black hover:text-white transition-all duration-300 rounded-xl"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-black text-white rounded-xl border-2 border-gray-200">
              <p className="text-sm font-medium">{successMessage}</p>
            </div>
          )}
          
          {/* Statistics Cards - Black/White Theme */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Actions Card */}
            <Card className="border-2 border-gray-200 hover:border-black transition-all duration-300 shadow-lg hover:shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600">Total Actions</p>
                    <p className="text-3xl font-bold text-black">{sortedItems ? sortedItems.length : 0}</p>
                    <p className="text-xs text-gray-500">All records</p>
                  </div>
                  <div className="p-3 bg-black rounded-xl">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Pending Actions Card */}
            <Card className="border-2 border-gray-200 hover:border-black transition-all duration-300 shadow-lg hover:shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-3xl font-bold text-black">{pendingActions}</p>
                    <p className="text-xs text-gray-500">Awaiting action</p>
                  </div>
                  <div className="p-3 bg-gray-600 rounded-xl">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Resolved Actions Card */}
            <Card className="border-2 border-gray-200 hover:border-black transition-all duration-300 shadow-lg hover:shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600">Resolved</p>
                    <p className="text-3xl font-bold text-black">{resolvedActions}</p>
                    <p className="text-xs text-gray-500">Completed</p>
                  </div>
                  <div className="p-3 bg-black rounded-xl">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* High Priority Card */}
            <Card className="border-2 border-gray-200 hover:border-black transition-all duration-300 shadow-lg hover:shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600">High Priority</p>
                    <p className="text-3xl font-bold text-black">{highPriorityActions}</p>
                    <p className="text-xs text-gray-500">Urgent items</p>
                  </div>
                  <div className="p-3 bg-gray-800 rounded-xl">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Data Table - Black/White Theme */}
          <Card className="border-2 border-gray-200 shadow-xl">
            <CardHeader className="bg-black text-white rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="h-6 w-6" />
                  <div>
                    <CardTitle className="text-xl font-bold">Action Reports</CardTitle>
                    <p className="text-gray-300 text-sm">{activeTab.toUpperCase()} Department</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-white text-black font-semibold">
                  {sortedItems.length} Records
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-2 border-gray-200 bg-gray-50">
                      <TableHead className="font-bold text-black p-4">Municipality</TableHead>
                      <TableHead className="font-bold text-black p-4">District</TableHead>
                      <TableHead className="font-bold text-black p-4">What</TableHead>
                      <TableHead className="font-bold text-black p-4">When</TableHead>
                      <TableHead className="font-bold text-black p-4">Where</TableHead>
                      <TableHead className="font-bold text-black p-4">Action Taken</TableHead>
                      <TableHead className="font-bold text-black p-4 text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentItems.map((item, index) => (
                      <TableRow key={item.id || index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                        <TableCell className="p-4 font-medium text-black">{item.municipality || 'N/A'}</TableCell>
                        <TableCell className="p-4 text-gray-700">{item.district || 'N/A'}</TableCell>
                        <TableCell className="p-4 text-gray-700 max-w-xs truncate">{item.what || 'N/A'}</TableCell>
                        <TableCell className="p-4 text-gray-700">{formatDate(item.when)}</TableCell>
                        <TableCell className="p-4 text-gray-700 max-w-xs truncate">{item.where || 'N/A'}</TableCell>
                        <TableCell className="p-4">
                          <Badge 
                            variant="outline" 
                            className={`${
                              item.actionTaken === 'Resolved' 
                                ? 'border-black bg-black text-white' 
                                : 'border-gray-400 bg-gray-100 text-gray-700'
                            }`}
                          >
                            {item.actionTaken || 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell className="p-4">
                          <div className="flex items-center gap-2 justify-center">
                            <Button
                              onClick={() => handleAction(item.id, 'view')}
                              variant="ghost"
                              size="sm"
                              className="hover:bg-gray-100 p-2 rounded-lg"
                            >
                              <Eye className="h-4 w-4 text-gray-600" />
                            </Button>
                            <Button
                              onClick={() => handleAction(item.id, 'edit')}
                              variant="ghost"
                              size="sm"
                              className="hover:bg-gray-100 p-2 rounded-lg"
                            >
                              <Edit className="h-4 w-4 text-gray-600" />
                            </Button>
                            <Button
                              onClick={() => handleAction(item.id, 'delete')}
                              variant="ghost"
                              size="sm"
                              className="hover:bg-red-100 p-2 rounded-lg"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => handlePageChange(Math.max(1, tablePage - 1))}
                          className={tablePage === 1 ? 'pointer-events-none opacity-50' : 'hover:bg-black hover:text-white'}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => handlePageChange(page)}
                            isActive={page === tablePage}
                            className={page === tablePage ? 'bg-black text-white' : 'hover:bg-gray-100'}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => handlePageChange(Math.min(totalPages, tablePage + 1))}
                          className={tablePage === totalPages ? 'pointer-events-none opacity-50' : 'hover:bg-black hover:text-white'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </Layout>
  );
}

// Add missing functions that are referenced in the component
const handleAddActionReport = () => {
  // This function should be implemented based on your needs
  console.log('Add action report functionality');
};

export default ActionCenter;
                        <p className="text-red-100 text-xs font-medium mb-1">Illegals (Auto-Detected)</p>
                        <p className="text-lg font-bold mb-1">{totalIllegals}</p>
                        <p className="text-red-200 text-xs leading-tight">
                          {illegalCategoryCounts && Object.entries(illegalCategoryCounts)
                            .slice(0, 3) // Show only first 3 categories to fit better
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(' • ')}
                          {illegalCategoryCounts && Object.entries(illegalCategoryCounts).length > 3 && '...'}
                        </p>
                        {illegalCategoryCounts && Object.entries(illegalCategoryCounts).length > 0 && (
                          <p className="text-red-200 text-xs mt-1">
                            {Object.entries(illegalCategoryCounts).length} categories detected
                            {Object.entries(illegalCategoryCounts).length > 3 && (
                              <span className="ml-1 cursor-help" title={Object.entries(illegalCategoryCounts)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join('\n')}>
                                (Hover for details)
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                      <div className="p-1.5 bg-white/20 rounded-full ml-2 flex-shrink-0">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                  {/* Action Taken Card */}
                  <div className="bg-blue-500 rounded-lg p-4 text-white shadow-lg min-h-[100px]">
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
                </>
              )}
            </div>
          </div>
          {/* Action Items Table */}
          <div className="flex-1 min-h-0">
            <div className="rounded-lg shadow-lg border overflow-hidden h-full flex flex-col transition-all duration-300 bg-white border-gray-200">
              <div className="p-4 border-b transition-all duration-300 border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-sm">
                      Showing {startIndex + 1}-{Math.min(endIndex, sortedItems?.length || 0)} of {sortedItems?.length || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100/80">
                      <BarChart3 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold transition-colors duration-300 text-gray-900">Action Items</h3>
                      <p className="text-sm transition-colors duration-300 text-gray-600">Detailed view of all activities</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    
              <Button
                onClick={handleCleanDuplicates}
                variant="outline"
                size="sm"
                className="bg-orange-600 text-white border-orange-600 hover:bg-orange-700 text-xs py-1.5 px-3 h-8"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clean Duplicates
              </Button>
                    <Badge variant="secondary" className="text-sm bg-blue-100/80 text-blue-800">
                                             {sortedItems ? sortedItems.length : 0} items
                  </Badge>
                </div>
              </div>
              </div>
              <div className="flex-1 overflow-auto p-4">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                      <span className="text-base transition-colors duration-300 text-gray-600">Loading action items...</span>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                      <thead className="sticky top-0 bg-white z-10">
                        <tr className="border-b transition-all duration-300 border-gray-200">
                          <th className="text-left p-2 md:p-3 font-semibold min-w-[120px] max-w-[150px] transition-colors duration-300 text-xs md:text-sm text-gray-700">
                            <button
                              onClick={() => handleSort("municipality")}
                              className="flex items-center gap-1 md:gap-2 transition-colors hover:text-blue-600"
                            >
                              Municipality
                              {sortBy === "municipality" && (
                                sortOrder === "asc" ? <ChevronUp className="h-3 w-3 md:h-4 md:w-4" /> : <ChevronDown className="h-3 w-3 md:h-4 md:w-4" />
                              )}
                            </button>
                          </th>
                          <th className="text-left p-2 md:p-3 font-semibold min-w-[100px] max-w-[130px] transition-colors duration-300 text-xs md:text-sm text-gray-700">
                            <button
                              onClick={() => handleSort("district")}
                              className="flex items-center gap-1 transition-colors hover:text-blue-600"
                            >
                              District
                              {sortBy === "district" && (
                                sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                              )}
                            </button>
                          </th>
                          <th className="text-left p-2 md:p-3 font-semibold min-w-[200px] max-w-[300px] transition-colors duration-300 text-xs md:text-sm text-gray-700">What</th>
                          <th className="text-left p-2 md:p-3 font-semibold min-w-[100px] max-w-[130px] transition-colors duration-300 text-xs md:text-sm text-gray-700">
                            <button
                              onClick={() => handleSort("when")}
                              className="flex items-center gap-1 transition-colors hover:text-blue-600"
                            >
                              When
                              {sortBy === "when" && (
                                sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                              )}
                            </button>
                          </th>
                          <th className="text-left p-2 md:p-3 font-semibold min-w-[120px] max-w-[180px] transition-colors duration-300 text-xs md:text-sm text-gray-700">Where</th>
                          <th className="text-left p-2 md:p-3 font-semibold min-w-[120px] max-w-[150px] transition-colors duration-300 text-xs md:text-sm text-gray-700">Action Taken</th>
                          {/* Show Source for PNP, Other Information for Agriculture and PG-ENRO */}
                          {activeTab === "pnp" && (
                            <th className="text-left p-2 md:p-3 font-semibold min-w-[100px] max-w-[130px] transition-colors duration-300 text-xs md:text-sm text-gray-700">Source</th>
                          )}
                          {(activeTab === "agriculture" || activeTab === "pg-enro") && (
                            <th className="text-left p-2 md:p-3 font-semibold min-w-[100px] max-w-[130px] transition-colors duration-300 text-xs md:text-sm text-gray-700">Other Information</th>
                          )}
                          <th className="text-left p-2 md:p-3 font-semibold min-w-[120px] max-w-[150px] transition-colors duration-300 text-xs md:text-sm text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.map((item) => {
                          // Safety check - ensure item is valid
                          if (!item || typeof item !== 'object') {
                            return null;
                          }
                          const IconComponent = AlertCircle; // Use AlertCircle as default icon
                          return (
                            <tr key={item.id || `item-${Math.random()}`} className="hover:bg-gray-50 transition-colors duration-200">
                              <td className="p-2 md:p-3">
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 rounded-lg bg-blue-100 flex-shrink-0">
                                    <IconComponent className="h-3 w-3 text-blue-600" />
                                  </div>
                                  <span className="font-medium text-xs md:text-sm text-gray-900 truncate" title={item.municipality}>
                                    {item.municipality}
                                  </span>
                                </div>
                              </td>
                              <td className="p-2 md:p-3">
                                <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700 border-gray-300">
                                  {item.district}
                                </Badge>
                              </td>
                              <td className="p-2 md:p-3">
                                <span className="text-xs md:text-sm break-words leading-relaxed text-gray-700 max-w-[280px] block" title={item.what}>
                                  {typeof item.what === 'string' ? item.what : 'N/A'}
                                </span>
                              </td>
                              <td className="p-2 md:p-3">
                                <span className="text-xs text-gray-600 whitespace-nowrap">
                                  {formatDate(item.when)}
                                </span>
                              </td>
                              <td className="p-2 md:p-3">
                                <span className="text-xs md:text-sm break-words leading-relaxed text-gray-700 max-w-[160px] block" title={item.where}>
                                  {typeof item.where === 'string' ? item.where : 'N/A'}
                                </span>
                              </td>
                              {false && (
                              <td className="p-4">
                                  <span className="text-sm break-words leading-relaxed transition-colors duration-300 text-gray-700">{item.who}</span>
                              </td>
                              )}
                              {false && (
                                <>
                              <td className="p-4">
                                    <span className="text-sm break-words leading-relaxed transition-colors duration-300 text-gray-700" title={item.why}>
                                  {item.why}
                                </span>
                              </td>
                              <td className="p-4">
                                    <span className="text-sm break-words leading-relaxed transition-colors duration-300 text-gray-700" title={item.how}>
                                  {item.how}
                                </span>
                              </td>
                                </>
                              )}
                              <td className="p-2 md:p-3 max-w-[150px]">
                                <Badge className={`rounded-none text-xs whitespace-normal break-words ${
                                  item.actionTaken === "Resolved" 
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}>
                                  {typeof item.actionTaken === 'string' ? item.actionTaken : 'N/A'}
                                </Badge>
                              </td>
                              {/* Show Source for PNP, Other Information for Agriculture and PG-ENRO */}
                              {activeTab === "pnp" && (
                                <td className="p-2 md:p-3">
                                  <span className="text-xs break-words leading-relaxed text-gray-700 max-w-[120px] block" title={item.source}>
                                    {typeof item.source === 'string' ? item.source : 'N/A'}
                                  </span>
                                </td>
                              )}
                              {(activeTab === "agriculture" || activeTab === "pg-enro") && (
                                <td className="p-2 md:p-3">
                                  <span className="text-xs break-words leading-relaxed text-gray-700 max-w-[120px] block" title={item.otherInfo}>
                                    {typeof item.otherInfo === 'string' ? item.otherInfo : 'N/A'}
                                  </span>
                                </td>
                              )}
                                                             {/* Other Information column data hidden */}
                               {/* <td className="p-4">
                                 <span className="text-sm break-words leading-relaxed transition-colors duration-300  text-gray-700"" title={item.otherInfo}>
                                   {item.otherInfo}
                                 </span>
                               </td> */}
                              <td className="p-2 md:p-3">
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAction(item.id || 'unknown', "view")}
                                    title="View Details"
                                    className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 p-1"
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAction(item.id || 'unknown', "edit")}
                                    title="Edit"
                                    className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 p-1"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAction(item.id || 'unknown', "delete")}
                                    title="Delete"
                                    className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 p-1"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {(!sortedItems || sortedItems.length === 0) && (
                      <div className="text-center py-8 md:py-12">
                        <div className="p-3 md:p-4 rounded-full w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 flex items-center justify-center bg-gray-200">
                          <AlertTriangle className="h-6 w-6 md:h-8 md:w-8 text-gray-500" />
                        </div>
                        <p className="text-sm md:text-base transition-colors duration-300 text-gray-600">No action items found matching your criteria.</p>
                      </div>
                    )}
                    {sortedItems && sortedItems.length > 0 && (
                      <div className="p-4 border-t border-gray-200">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious 
                                onClick={() => handlePageChange(tablePage - 1)}
                                disabled={tablePage === 1}
                              />
                            </PaginationItem>
                            
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  onClick={() => handlePageChange(page)}
                                  isActive={tablePage === page}
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            ))}
                            
                            <PaginationItem>
                              <PaginationNext 
                                onClick={() => handlePageChange(tablePage + 1)}
                                disabled={tablePage === totalPages}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
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
             <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-2 md:p-4">
               <div className="p-4 md:p-6 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border bg-white/95 text-gray-900 border-gray-300 shadow-gray-900/20">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-2 md:p-3 rounded-xl bg-blue-100">
                    <FileText className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold">Add New Action Report</h3>
                    <p className="text-xs md:text-sm text-gray-600">Create a new action report entry</p>
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
                  <label className="text-sm font-semibold text-gray-700">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newActionReport.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    className="w-full p-3 rounded-lg border transition-all duration-200 border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="pnp">PNP</option>
                    <option value="agriculture">Agriculture / Bantay Dagat</option>
                    <option value="pg-enro">PG-Enro / Agriculture</option>
                  </select>
                </div>
                {/* Municipality - Always visible */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Municipality <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newActionReport.municipality}
                    onChange={(e) => handleInputChange('municipality', e.target.value)}
                    className="w-full p-3 rounded-lg border transition-all duration-200 border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Municipality</option>
                    {Object.values(municipalitiesByDistrict).flat().map(municipality => (
                      <option key={municipality} value={municipality}>{municipality}</option>
                    ))}
                  </select>
                </div>
                {/* District - Always visible */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    District <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newActionReport.district}
                    disabled
                    className="w-full p-3 rounded-lg border transition-all duration-200 border-gray-300 bg-gray-100 text-gray-600 cursor-not-allowed"
                    required
                  >
                    <option value="">{newActionReport.municipality ? 'Auto-detected' : 'Select Municipality First'}</option>
                    {newActionReport.district && (
                      <option value={newActionReport.district}>{newActionReport.district}</option>
                    )}
                  </select>
                </div>
                {/* What - Always visible */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    What <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Describe what happened..."
                    value={newActionReport.what}
                    onChange={(e) => handleInputChange('what', e.target.value)}
                    className="w-full p-3 rounded-lg border transition-all duration-200 border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* When - Always visible */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    When <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter date and time (e.g., January 15, 2024 2:30 PM)"
                    value={newActionReport.when}
                    onChange={(e) => handleInputChange('when', e.target.value)}
                    className="w-full p-3 rounded-lg border transition-all duration-200 border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                {/* Where - Always visible */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Where <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Location of the incident..."
                    value={newActionReport.where}
                    onChange={(e) => handleInputChange('where', e.target.value)}
                    className="w-full p-3 rounded-lg border transition-all duration-200 border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                {/* Who - Only visible for PNP */}
                {newActionReport.department === "pnp" && (
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                    Who <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Personnel involved..."
                    value={newActionReport.who}
                    onChange={(e) => handleInputChange('who', e.target.value)}
                      className="w-full p-3 rounded-lg border transition-all duration-200 border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                )}
                {/* Gender - Only visible for PNP */}
                {newActionReport.department === "pnp" && (
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Gender
                    </label>
                    <select
                      value={newActionReport.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full p-3 rounded-lg border transition-all duration-200 border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                )}
                {/* Why - Only visible for PNP */}
                {newActionReport.department === "pnp" && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                    Why
                  </label>
                  <Input
                    type="text"
                    placeholder="Reason for the action..."
                    value={newActionReport.why}
                    onChange={(e) => handleInputChange('why', e.target.value)}
                      className="w-full p-3 rounded-lg border transition-all duration-200 border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                )}
                {/* How - Only visible for PNP */}
                {newActionReport.department === "pnp" && (
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                    How
                  </label>
                  <Input
                    type="text"
                    placeholder="Method or procedure used..."
                    value={newActionReport.how}
                    onChange={(e) => handleInputChange('how', e.target.value)}
                      className="w-full p-3 rounded-lg border transition-all duration-200 border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                )}
                {/* Action Taken - Always visible */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Action Taken <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter action taken (e.g., Under investigation, Resolved, Pending)"
                    value={newActionReport.actionTaken}
                    onChange={(e) => handleInputChange('actionTaken', e.target.value)}
                    className="w-full p-3 rounded-lg border transition-all duration-200 border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                {/* Source - Only visible for PNP */}
                {newActionReport.department === "pnp" && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Source
                    </label>
                    <Input
                      type="text"
                      placeholder="Where did this report come from? (e.g., Hotline, Walk-in, Facebook, Patrol)"
                      value={newActionReport.source}
                      onChange={(e) => handleInputChange('source', e.target.value)}
                      className="w-full p-3 rounded-lg border transition-all duration-200 border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
                {/* Other Information - Always visible */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Other Information
                  </label>
                  <textarea
                    placeholder="Additional details and notes..."
                    value={newActionReport.otherInfo}
                    onChange={(e) => handleInputChange('otherInfo', e.target.value)}
                    rows={3}
                    className="w-full p-3 rounded-lg border transition-all duration-200 resize-none border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {/* Photo Upload Section */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Photos <span className="text-xs text-gray-500">(Optional - Max 5MB per image)</span>
                  </label>
                  <div className="space-y-3">
                    {/* Photo Upload Input */}
                    <div className="p-4 border-2 border-dashed rounded-lg transition-all duration-200 border-gray-300 hover:border-blue-500 bg-gray-50">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(e, setNewActionReport)}
                        className="hidden"
                        id="photo-upload"
                      />
                      <label 
                        htmlFor="photo-upload"
                        className="flex flex-col items-center justify-center cursor-pointer"
                      >
                        <Camera className="h-8 w-8 mb-2 text-gray-500" />
                        <span className="text-sm font-medium text-gray-600">
                          Click to upload photos or drag and drop
                        </span>
                        <span className="text-xs text-gray-400">
                          PNG, JPG, GIF up to 5MB
                        </span>
                      </label>
              </div>
                    {/* Photo Preview Grid */}
                    {newActionReport.photos && newActionReport.photos.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {newActionReport.photos.map((photo) => (
                          <div key={photo.id} className="relative group">
                            <img
                              src={getImageSource(photo)}
                              alt={photo.fileName || photo.name}
                              className="w-full h-24 object-cover rounded-lg border"
                              onError={handlePhotoError}
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                              <Button
                                onClick={() => handlePhotoRemove(photo.id, setNewActionReport)}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 bg-red-600 hover:bg-red-700 text-white"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="absolute bottom-1 left-1 right-1">
                              <p className="text-xs text-white bg-black/70 px-1 py-0.5 rounded truncate">
                                {photo.fileName || photo.name}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button 
                  onClick={handleCancelAdd} 
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitActionReport} 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
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
             <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
               <div className="p-6 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border bg-white/95 text-gray-900 border-gray-300 shadow-gray-900/20">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-blue-100">
                    <Edit className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Edit Action Report</h3>
                    <p className="text-sm text-gray-600">Update action report details</p>
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
                  <label className="text-sm font-semibold text-gray-700">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editingItem.department}
                    onChange={(e) => handleEditInputChange('department', e.target.value)}
                    className="w-full p-3 rounded-lg border transition-all duration-200 border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="pnp">PNP</option>
                    <option value="agriculture">Agriculture / Bantay Dagat</option>
                    <option value="pg-enro">PG-Enro / Agriculture</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Municipality <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editingItem.municipality}
                    onChange={(e) => handleEditInputChange('municipality', e.target.value)}
                    className="w-full p-3 rounded-lg border transition-all duration-200 border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Municipality</option>
                    {Object.values(municipalitiesByDistrict).flat().map(municipality => (
                      <option key={municipality} value={municipality}>{municipality}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    District <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editingItem.district}
                    disabled
                    className="w-full p-3 rounded-lg border transition-all duration-200 border-gray-300 bg-gray-100 text-gray-600 cursor-not-allowed"
                    required
                  >
                    <option value="">{editingItem.municipality ? 'Auto-detected' : 'Select Municipality First'}</option>
                    {editingItem.district && (
                      <option value={editingItem.district}>{editingItem.district}</option>
                    )}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    What <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Describe what happened..."
                    value={editingItem.what}
                    onChange={(e) => handleEditInputChange('what', e.target.value)}
                    className="w-full p-3 rounded-lg border transition-all duration-200 border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    When <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter date and time (e.g., January 15, 2024 2:30 PM)"
                    value={editingItem.when}
                    onChange={(e) => handleEditInputChange('when', e.target.value)}
                    className="w-full p-3 rounded-lg border transition-all duration-200 border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Where <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Location of the incident..."
                    value={editingItem.where}
                    onChange={(e) => handleEditInputChange('where', e.target.value)}
                    className="w-full p-3 rounded-lg border transition-all duration-200 border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                {/* Hidden: Who */}
                {false && (
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                    Who <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Personnel involved..."
                    value={editingItem.who}
                    onChange={(e) => handleEditInputChange('who', e.target.value)}
                      className="w-full p-3 rounded-lg border transition-all duration-200 border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                )}
                {/* Gender - Only visible for PNP */}
                {editingItem.department === "pnp" && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Gender
                  </label>
                  <select
                    value={editingItem.gender || ""}
                    onChange={(e) => handleEditInputChange('gender', e.target.value)}
                    className="w-full p-3 rounded-lg border transition-all duration-200 border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                )}
                {/* Hidden: Why */}
                {false && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                    Why
                  </label>
                  <Input
                    type="text"
                    placeholder="Reason for the action..."
                    value={editingItem.why}
                    onChange={(e) => handleEditInputChange('why', e.target.value)}
                      className="w-full p-3 rounded-lg border transition-all duration-200 border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                )}
                {/* Source - Only visible for PNP */}
                {editingItem.department === "pnp" && (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Source
                  </label>
                  <Input
                    type="text"
                    placeholder="Where did this report come from? (e.g., Hotline, Walk-in, Facebook, Patrol)"
                    value={editingItem.source || ""}
                    onChange={(e) => handleEditInputChange('source', e.target.value)}
                    className="w-full p-3 rounded-lg border transition-all duration-200 border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                )}
                {/* Hidden: How */}
                {false && (
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                    How
                  </label>
                  <Input
                    type="text"
                    placeholder="Method or procedure used..."
                    value={editingItem.how}
                    onChange={(e) => handleEditInputChange('how', e.target.value)}
                      className="w-full p-3 rounded-lg border transition-all duration-200 border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Action Taken <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter action taken (e.g., Under investigation, Resolved, Pending)"
                    value={editingItem.actionTaken}
                    onChange={(e) => handleEditInputChange('actionTaken', e.target.value)}
                    className="w-full p-3 rounded-lg border transition-all duration-200 border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Other Information
                  </label>
                  <textarea
                    placeholder="Additional details and notes..."
                    value={editingItem.otherInfo}
                    onChange={(e) => handleEditInputChange('otherInfo', e.target.value)}
                    rows={3}
                    className="w-full p-3 rounded-lg border transition-all duration-200 resize-none border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {/* Photo Upload Section */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Photos <span className="text-xs text-gray-500">(Optional - Max 5MB per image)</span>
                  </label>
                  <div className="space-y-3">
                    {/* Photo Upload Input */}
                    <div className="p-4 border-2 border-dashed rounded-lg transition-all duration-200 border-gray-300 hover:border-blue-500 bg-gray-50">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(e, setEditingItem)}
                        className="hidden"
                        id="edit-photo-upload"
                      />
                      <label 
                        htmlFor="edit-photo-upload"
                        className="flex flex-col items-center justify-center cursor-pointer"
                      >
                        <Camera className="h-8 w-8 mb-2 text-gray-500" />
                        <span className="text-sm font-medium text-gray-600">
                          Click to upload photos or drag and drop
                        </span>
                        <span className="text-xs text-gray-400">
                          PNG, JPG, GIF up to 5MB
                        </span>
                      </label>
              </div>
                    {/* Existing Photos Display */}
                    {editingItem.photos && editingItem.photos.length > 0 && (
                      <div className="space-y-3">
                          <h5 className="text-sm font-medium text-gray-600">Existing Photos ({editingItem.photos.length})</h5>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {editingItem.photos.map((photo, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={getImageSource(photo)}
                                className="w-full h-24 object-cover rounded-lg border"
                                onError={handlePhotoError}
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                                <Button
                                  onClick={() => handlePhotoRemove(index, setEditingItem)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 bg-red-600 hover:bg-red-700 text-white"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="absolute bottom-1 left-1 right-1">
                                <p className="text-xs text-white bg-black/70 px-1 py-0.5 rounded truncate">
                                  {photo.imageData ? 'Stored in Database' : photo.isLegacy ? 'Legacy Photo' : photo.preview ? 'New Upload' : 'Existing Photo'}
                                </p>
                              </div>
                              {/* Show legacy photo indicator */}
                              {photo.isLegacy && (
                                <div className="absolute top-2 left-2">
                                  <div className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-600 text-white">
                                    Legacy
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button 
                  onClick={handleCancelEdit} 
                  variant="outline"
                                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleEditActionReport} 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
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
          <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
            <div className="p-6 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border bg-white/95 text-gray-900 border-gray-300 shadow-gray-900/20">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-blue-100">
                    <Eye className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Action Report Details</h3>
                    <p className="text-sm text-gray-600">Complete incident and action information</p>
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
              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Left Column - Basic Info & Photos */}
                <div className="lg:col-span-1 space-y-4">
                  {/* Basic Information Card */}
                  <div className="p-5 rounded-xl border shadow-sm bg-gray-50/80 border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                      <h4 className="font-semibold text-lg text-gray-800">Basic Information</h4>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-sm font-medium text-gray-600">Department</span>
                        <Badge className="bg-blue-100 text-blue-800">
                          {viewingItem.department?.toUpperCase() || 'N/A'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-sm font-medium text-gray-600">Municipality</span>
                        <span className="text-sm font-semibold text-gray-700">{viewingItem.municipality}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-sm font-medium text-gray-600">District</span>
                        <span className="text-sm font-semibold text-gray-700">{viewingItem.district}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm font-medium text-gray-600">Date & Time</span>
                        <span className="text-sm font-semibold text-gray-700">{formatDate(viewingItem.when)}</span>
                      </div>
                    </div>
                  </div>
                  {/* Photos Section */}
                  {viewingItem.photos && viewingItem.photos.length > 0 && (
                    <div className="p-5 rounded-xl border shadow-sm bg-gray-50/80 border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-pink-600"></div>
                          <h4 className="font-semibold text-lg text-gray-800">Photos ({viewingItem.photos.length})</h4>
                        </div>
                        {/* Migration button for legacy photos */}
                        {viewingItem.photos.some(photo => photo.isLegacy) && (
                          <Button
                            onClick={() => alert('To migrate legacy photos, please re-upload them in the edit mode. Legacy Firebase Storage URLs cannot be automatically converted due to CORS restrictions.')}
                            variant="outline"
                            size="sm"
                            className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                          >
                            <RotateCw className="h-4 w-4 mr-2" />
                            Migrate Legacy Photos
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {viewingItem.photos.map((photo, index) => {
                          const imageSource = getImageSource(photo);
                          return (
                            <div key={index} className="relative group">
                              <img
                                src={imageSource}
                                className="w-full h-24 object-cover rounded-lg border cursor-pointer hover:scale-105 transition-transform duration-200 shadow-sm"
                                onError={(event) => handlePhotoError(event, photo)}
                                onClick={() => {
                                  // Handle photo click based on source type
                                  if (imageSource && !imageSource.includes('data:image/svg+xml')) {
                                    // For regular URLs, open in new tab
                                    if (imageSource.startsWith('http')) {
                                      window.open(imageSource, '_blank');
                                    } else {
                                      // For data URLs, show in modal or download
                                      openImageModal(imageSource, photo.fileName || photo.name || `Photo ${index + 1}`);
                                    }
                                  } else {
                                    alert('This photo cannot be opened. It may be a legacy photo that needs migration.');
                                  }
                                }}
                              />
                              <div className="absolute top-2 right-2">
                                <div className="px-2 py-1 rounded-full text-xs font-medium bg-white/90 text-gray-800">
                                  {index + 1}
                                </div>
                              </div>
                              {/* Remove photo button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Are you sure you want to remove photo ${index + 1}?`)) {
                                    handleRemovePhoto(viewingItem.id, index);
                                  }
                                }}
                                className="absolute top-2 left-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold transition-colors duration-200"
                                title="Remove photo"
                              >
                                ×
                              </button>
                              {/* Show legacy photo indicator */}
                              {photo.isLegacy && (
                                <div className="absolute top-2 left-12">
                                  <div className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-600 text-white">
                                    Legacy
                                  </div>
                                </div>
                              )}
                              {/* Show photo info on hover */}
                              <div className="absolute bottom-1 left-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <div className="bg-black/70 text-white text-xs p-1 rounded">
                                  {photo.isLegacy && ' (Legacy)'}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                {/* Right Column - Incident Details */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Incident Details Card */}
                  <div className="p-5 rounded-xl border shadow-sm bg-gray-50/80 border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                      <h4 className="font-semibold text-lg text-gray-800">Incident Details</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <span className="text-sm font-medium text-gray-600">What Happened</span>
                          <p className="text-sm p-3 rounded-lg bg-gray-100 text-gray-700">{viewingItem.what}</p>
                        </div>
                        {/* Type of Illegals - Visible for all departments */}
                        {viewingItem.department && (
                          <div className="space-y-2">
                            <span className="text-sm font-medium text-gray-600">Type of Illegals</span>
                            <p className="text-sm p-3 rounded-lg bg-gray-100 text-gray-700">
                                                  N/A
                            </p>
                          </div>
                        )}
                        <div className="space-y-2">
                          <span className="text-sm font-medium text-gray-600">Gender</span>
                          <p className="text-sm p-3 rounded-lg bg-gray-100 text-gray-700">{viewingItem.gender ? viewingItem.gender.charAt(0).toUpperCase() + viewingItem.gender.slice(1) : 'N/A'}</p>
                        </div>
                        <div className="space-y-2">
                          <span className="text-sm font-medium text-gray-600">Reason</span>
                          <p className="text-sm p-3 rounded-lg bg-gray-100 text-gray-700">{viewingItem.why || 'N/A'}</p>
                        </div>
                        {/* Show Source for PNP, Other Information for Agriculture and PG-ENRO */}
                        {viewingItem.department === "pnp" && (
                          <div className="space-y-2">
                            <span className="text-sm font-medium text-gray-600">Source</span>
                            <p className="text-sm p-3 rounded-lg bg-gray-100 text-gray-700">{viewingItem.source || 'N/A'}</p>
                          </div>
                        )}
                        {(viewingItem.department === "agriculture" || viewingItem.department === "pg-enro") && (
                          <div className="space-y-2">
                            <span className="text-sm font-medium text-gray-600">Other Information</span>
                            <p className="text-sm p-3 rounded-lg bg-gray-100 text-gray-700">{viewingItem.otherInfo || 'N/A'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Additional Information Card */}
                  {viewingItem.otherInfo && (
                    <div className="p-5 rounded-xl border shadow-sm bg-gray-50/80 border-gray-200">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-orange-600"></div>
                        <h4 className="font-semibold text-lg text-gray-800">Additional Information</h4>
                      </div>
                      <p className="text-sm p-4 rounded-lg bg-gray-100 text-gray-700">{viewingItem.otherInfo}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
                <Button 
                  onClick={handleCloseViewModal} 
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    handleCloseViewModal();
                    handleAction(viewingItem.id, "edit");
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Report
                </Button>
              </div>
            </div>
          </div>
        )}
        {/* Image Modal */}
        {showImageModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-xl shadow-2xl bg-white">
              {/* Close button */}
              <Button
                onClick={() => setShowImageModal(false)}
                variant="ghost"
                size="sm"
                className="absolute top-4 right-4 h-10 w-10 p-0 z-10 bg-black/50 hover:bg-black/70 text-white"
              >
                <X className="h-5 w-5" />
              </Button>
              {/* Image */}
              <div className="flex items-center justify-center p-4">
                <img
                  src={imageModalData.imageSource}
                  alt={imageModalData.fileName}
                  className="max-w-full max-h-full object-contain rounded-lg"
                  onError={handlePhotoError}
                />
              </div>
              {/* Image info */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/90">
                <p className="text-center font-medium text-gray-900">
                  {imageModalData.fileName}
                </p>
              </div>
            </div>
          </div>
        )}
        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
            <div className="p-4 sm:p-6 rounded-lg shadow-lg max-w-md w-full border bg-white/90 text-gray-900 border-gray-200">
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
        {/* Preview Modal */}
        {showPreviewModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-xl shadow-2xl bg-white">
              {/* Header with Department Selection and Export PDF button */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-100 shadow-sm">
                    <FileText className="h-7 w-7 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Action Center Report Preview</h3>
                    <p className="text-sm text-gray-600 mt-1">Comprehensive report with department filtering</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Department Selection */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Department:</label>
                    <select
                      value={previewDepartment}
                      onChange={(e) => setPreviewDepartment(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white shadow-sm"
                    >
                      <option value="all">All Departments</option>
                      <option value="pnp">PNP</option>
                      <option value="agriculture">Agriculture</option>
                      <option value="pg-enro">PG-ENRO</option>
                    </select>
                  </div>
                  
                   <div className="flex items-center gap-2">
                     <input
                       type="text"
                       placeholder="Add description (optional)"
                       value={pdfDescription}
                       onChange={(e) => setPdfDescription(e.target.value)}
                       className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-64"
                     />
                   </div>
                  
                   <Button
                     onClick={exportToPDF}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-200"
                     title="Export to PDF"
                   >
                     <Download className="w-4 h-4 mr-2" />
                     Export PDF
                   </Button>
                  
                  <Button
                    onClick={() => setShowPreviewModal(false)}
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 p-0 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              {/* Preview Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {/* Report Header */}
                <div className="mb-8">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
                    <div className="mb-4 md:mb-0">
                      <h1 className="text-3xl font-bold mb-2">Action Center Report</h1>
                      {pdfDescription && pdfDescription.trim() && (
                        <p className="text-sm text-blue-100 max-w-2xl">
                          {pdfDescription}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                        <p className="text-xs text-blue-100">Month</p>
                        <p className="font-semibold">{MONTH_NAMES[previewMonth] || 'All Months'}</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                        <p className="text-xs text-blue-100">Year</p>
                        <p className="font-semibold">{previewYear || 'All Years'}</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                        <p className="text-xs text-blue-100">District</p>
                        <p className="font-semibold">{previewDistrict === "all" ? "All Districts" : previewDistrict}</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                        <p className="text-xs text-blue-100">Department</p>
                        <p className="font-semibold">{previewDepartment === 'all' ? 'All Departments' : previewDepartment.toUpperCase()}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Filter Controls */}
                <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Filter Report Data</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Department Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                      <select
                        value={previewDepartment}
                        onChange={(e) => setPreviewDepartment(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="all">All Departments</option>
                        <option value="pnp">PNP</option>
                        <option value="agriculture">Agriculture</option>
                        <option value="pg-enro">PG-ENRO</option>
                      </select>
                    </div>
                    
                    {/* Month Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                      <select
                        value={previewMonth}
                        onChange={(e) => setPreviewMonth(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="all">All Months</option>
                        {MONTH_NAMES.map((month, index) => (
                          <option key={index} value={index}>{month}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Year Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                      <select
                        value={previewYear}
                        onChange={(e) => setPreviewYear(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="all">All Years</option>
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                      </select>
                    </div>
                    
                    {/* District Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                      <select
                        value={previewDistrict}
                        onChange={(e) => setPreviewDistrict(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="all">All Districts</option>
                        <option value="1ST DISTRICT">1ST DISTRICT</option>
                        <option value="2ND DISTRICT">2ND DISTRICT</option>
                        <option value="3RD DISTRICT">3RD DISTRICT</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Filter Summary */}
                  <div className="mt-3 text-sm text-gray-600">
                    Showing {getPreviewFilteredData().length} records
                    {previewDepartment !== 'all' && ` • Department: ${previewDepartment.toUpperCase()}`}
                    {previewMonth !== 'all' && ` • Month: ${MONTH_NAMES[previewMonth]}`}
                    {previewYear !== 'all' && ` • Year: ${previewYear}`}
                    {previewDistrict !== 'all' && ` • District: ${previewDistrict}`}
                  </div>
                </div>

                {/* Summary Statistics */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <BarChart3 className="w-6 h-6 mr-3 text-blue-600" />
                    Executive Summary
                  </h2>
                  
                  {/* Main Statistics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Actions Card */}
                    <div className="relative overflow-hidden p-6 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-50 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-xl bg-blue-100">
                            <Activity className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="text-right">
                        <p className="text-sm font-medium text-blue-600">Total Actions</p>
                        <p className="text-3xl font-bold text-blue-700">{totalActions}</p>
                      </div>
                      </div>
                        <div className="text-xs text-blue-600 font-medium">
                          All departments combined
                    </div>
                      </div>
                      <div className="absolute -right-4 -bottom-4 opacity-10">
                        <Activity className="w-20 h-20 text-blue-600" />
                      </div>
                    </div>

                    {/* Pending Actions Card */}
                    <div className="relative overflow-hidden p-6 rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-orange-50 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-xl bg-orange-100">
                            <Clock className="w-6 h-6 text-orange-600" />
                          </div>
                          <div className="text-right">
                        <p className="text-sm font-medium text-orange-600">Pending Actions</p>
                        <p className="text-3xl font-bold text-orange-700">{pendingActions}</p>
                      </div>
                        </div>
                        <div className="text-xs text-orange-600 font-medium">
                          Requires attention
                        </div>
                      </div>
                      <div className="absolute -right-4 -bottom-4 opacity-10">
                        <Clock className="w-20 h-20 text-orange-600" />
                      </div>
                    </div>

                    {/* Resolved Actions Card */}
                    <div className="relative overflow-hidden p-6 rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 via-white to-green-50 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-xl bg-green-100">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-green-600">Resolved Actions</p>
                            <p className="text-3xl font-bold text-green-700">{totalActions - pendingActions}</p>
                          </div>
                        </div>
                        <div className="text-xs text-green-600 font-medium">
                          Successfully completed
                        </div>
                      </div>
                      <div className="absolute -right-4 -bottom-4 opacity-10">
                        <CheckCircle className="w-20 h-20 text-green-600" />
                      </div>
                    </div>

                    {/* Department Distribution Card */}
                    <div className="relative overflow-hidden p-6 rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 via-white to-purple-50 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-xl bg-purple-100">
                            <Users className="w-6 h-6 text-purple-600" />
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-purple-600">Departments</p>
                            <p className="text-3xl font-bold text-purple-700">
                              {previewDepartment === 'all' ? '3' : '1'}
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-purple-600 font-medium">
                          {previewDepartment === 'all' ? 'All departments' : previewDepartment.toUpperCase()}
                        </div>
                      </div>
                      <div className="absolute -right-4 -bottom-4 opacity-10">
                        <Users className="w-20 h-20 text-purple-600" />
                      </div>
                    </div>
                  </div>

                  {/* Department-Specific Statistics */}
                  {previewDepartment === 'all' && (
                    <div className="mb-8">
                      <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                        <Building2 className="w-5 h-5 mr-2 text-gray-600" />
                        Department Breakdown
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* PNP Statistics */}
                        <div className="bg-gradient-to-br from-red-50 to-white p-6 rounded-xl border border-red-200 shadow-md">
                          <div className="flex items-center mb-4">
                            <div className="p-2 rounded-lg bg-red-100 mr-3">
                              <Shield className="w-5 h-5 text-red-600" />
                            </div>
                            <h4 className="text-lg font-semibold text-red-800">PNP Department</h4>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-red-600">Total Actions:</span>
                              <span className="font-bold text-red-700">{totalActions}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-red-600">Drug Cases:</span>
                              <span className="font-bold text-red-700">{totalDrugs}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-red-600">Illegal Activities:</span>
                              <span className="font-bold text-red-700">{totalIllegals}</span>
                            </div>
                          </div>
                        </div>

                        {/* Agriculture Statistics */}
                        <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-xl border border-green-200 shadow-md">
                          <div className="flex items-center mb-4">
                            <div className="p-2 rounded-lg bg-green-100 mr-3">
                              <Leaf className="w-5 h-5 text-green-600" />
                            </div>
                            <h4 className="text-lg font-semibold text-green-800">Agriculture</h4>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-green-600">Total Actions:</span>
                              <span className="font-bold text-green-700">{totalActions}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-green-600">Illegal Activities:</span>
                              <span className="font-bold text-green-700">{totalAgricultureIllegals}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-green-600">Fishing Violations:</span>
                              <span className="font-bold text-green-700">{totalFishingViolations}</span>
                            </div>
                          </div>
                        </div>

                        {/* PG-ENRO Statistics */}
                        <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl border border-blue-200 shadow-md">
                          <div className="flex items-center mb-4">
                            <div className="p-2 rounded-lg bg-blue-100 mr-3">
                              <Trees className="w-5 h-5 text-blue-600" />
                            </div>
                            <h4 className="text-lg font-semibold text-blue-800">PG-ENRO</h4>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-blue-600">Total Actions:</span>
                              <span className="font-bold text-blue-700">{totalActions}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-blue-600">Environmental:</span>
                              <span className="font-bold text-blue-700">{totalEnvironmentalViolations}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-blue-600">Waste Management:</span>
                              <span className="font-bold text-blue-700">{totalWasteManagement}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Single Department Statistics */}
                  {previewDepartment !== 'all' && (
                    <div className="mb-8">
                      <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                        <Building2 className="w-5 h-5 mr-2 text-gray-600" />
                        {previewDepartment.toUpperCase()} Department Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {previewDepartment === "pnp" && (
                          <>
                            <div className="relative overflow-hidden p-6 rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-white shadow-lg">
                          <div className="relative z-10">
                                <p className="text-sm font-medium text-red-600 mb-2">Total Drug Cases</p>
                                <p className="text-4xl font-bold text-red-700">{totalDrugs}</p>
                                <p className="text-xs text-red-600 mt-2">Drug-related incidents</p>
                          </div>
                          <div className="absolute right-0 bottom-0 opacity-10">
                            <Pill className="w-16 h-16 text-red-600" />
                          </div>
                        </div>
                            <div className="relative overflow-hidden p-6 rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-white shadow-lg">
                          <div className="relative z-10">
                                <p className="text-sm font-medium text-purple-600 mb-2">Total Illegal Activities</p>
                                <p className="text-4xl font-bold text-purple-700">{totalIllegals}</p>
                                <p className="text-xs text-purple-600 mt-2">Other illegal activities</p>
                          </div>
                          <div className="absolute right-0 bottom-0 opacity-10">
                            <Shield className="w-16 h-16 text-purple-600" />
                          </div>
                        </div>
                      </>
                    )}
                    
                        {previewDepartment === "agriculture" && (
                      <>
                            <div className="relative overflow-hidden p-6 rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-white shadow-lg">
                          <div className="relative z-10">
                                <p className="text-sm font-medium text-green-600 mb-2">Total Illegal Activities</p>
                                <p className="text-4xl font-bold text-green-700">{totalAgricultureIllegals}</p>
                                <p className="text-xs text-green-600 mt-2">Agriculture violations</p>
                          </div>
                          <div className="absolute right-0 bottom-0 opacity-10">
                            <Leaf className="w-16 h-16 text-green-600" />
                          </div>
                        </div>
                            <div className="relative overflow-hidden p-6 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-lg">
                          <div className="relative z-10">
                                <p className="text-sm font-medium text-blue-600 mb-2">Fishing Violations</p>
                                <p className="text-4xl font-bold text-blue-700">{totalFishingViolations}</p>
                                <p className="text-xs text-blue-600 mt-2">Marine violations</p>
                          </div>
                          <div className="absolute right-0 bottom-0 opacity-10">
                            <Fish className="w-16 h-16 text-blue-600" />
                          </div>
                        </div>
                      </>
                    )}
                    
                        {previewDepartment === "pg-enro" && (
                      <>
                            <div className="relative overflow-hidden p-6 rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-white shadow-lg">
                          <div className="relative z-10">
                                <p className="text-sm font-medium text-green-600 mb-2">Environmental Violations</p>
                                <p className="text-4xl font-bold text-green-700">{totalEnvironmentalViolations}</p>
                                <p className="text-xs text-green-600 mt-2">Environmental issues</p>
                          </div>
                          <div className="absolute right-0 bottom-0 opacity-10">
                            <Trees className="w-16 h-16 text-green-600" />
                          </div>
                        </div>
                            <div className="relative overflow-hidden p-6 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-lg">
                          <div className="relative z-10">
                                <p className="text-sm font-medium text-blue-600 mb-2">Waste Management</p>
                                <p className="text-4xl font-bold text-blue-700">{totalWasteManagement}</p>
                                <p className="text-xs text-blue-600 mt-2">Waste management issues</p>
                          </div>
                          <div className="absolute right-0 bottom-0 opacity-10">
                            <Trash2 className="w-16 h-16 text-blue-600" />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                    </div>
                  )}
                </div>

                {/* Action Items Table */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <FileText className="w-6 h-6 mr-3 text-blue-600" />
                    Detailed Action Items
                  </h2>
                  
                  {/* Table Summary */}
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm font-medium text-blue-700">Total Records: {getPreviewFilteredData().length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium text-green-700">Resolved: {getPreviewFilteredData().filter(item => item.actionTaken === 'Resolved').length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                          <span className="text-sm font-medium text-orange-700">Pending: {getPreviewFilteredData().filter(item => item.actionTaken !== 'Resolved').length}</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        Department: {previewDepartment === 'all' ? 'All Departments' : previewDepartment.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                    <table className="w-full table-auto">
                      <thead>
                        <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                          <th className="px-4 py-4 text-left min-w-[200px]">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
                              <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">Location</span>
                            </div>
                          </th>
                          <th className="px-4 py-4 text-left min-w-[150px]">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                              <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">Date & Time</span>
                            </div>
                          </th>
                          <th className="px-4 py-4 text-left min-w-[250px]">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-gray-500 flex-shrink-0" />
                              <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">Incident Details</span>
                            </div>
                          </th>
                          <th className="px-4 py-4 text-left min-w-[150px]">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-gray-500 flex-shrink-0" />
                              <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">Action Status</span>
                            </div>
                          </th>
                          {previewDepartment === 'all' && (
                            <th className="px-4 py-4 text-left min-w-[120px]">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">Department</span>
                              </div>
                            </th>
                          )}
                          {previewDepartment === "pnp" && (
                            <th className="px-4 py-4 text-left min-w-[150px]">
                              <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">Source</span>
                              </div>
                            </th>
                          )}
                          <th className="px-4 py-4 text-left min-w-[200px]">
                            <div className="flex items-center gap-2">
                              <Info className="w-4 h-4 text-gray-500 flex-shrink-0" />
                              <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">Additional Info</span>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(getPreviewFilteredData() || []).map((item, index) => (
                          <tr 
                            key={item.id || index} 
                            className="hover:bg-blue-50 transition-colors duration-200 group"
                          >
                            {/* Location Column */}
                            <td className="px-4 py-4">
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-3 h-3 text-blue-500 flex-shrink-0" />
                                  <span className="text-sm font-semibold text-gray-900 break-words whitespace-normal">{item.municipality || 'N/A'}</span>
                              </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs px-2 py-1 bg-gray-100 text-gray-700 border-gray-300 whitespace-nowrap">
                                {item.district || 'N/A'}
                              </Badge>
                                </div>
                                <div className="text-xs text-gray-600 mt-1 break-words leading-relaxed whitespace-normal">
                                  {item.where || 'Location not specified'}
                                </div>
                              </div>
                            </td>

                            {/* Date & Time Column */}
                            <td className="px-4 py-4">
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-3 h-3 text-green-500 flex-shrink-0" />
                                  <span className="text-sm font-medium text-gray-900 break-words">
                                    {item.when ? formatDate(item.when) : 'Date not specified'}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 break-words">
                                  {item.when && !isNaN(new Date(item.when).getTime()) 
                                    ? new Date(item.when).toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: true
                                      })
                                    : 'Time not specified'
                                  }
                                </div>
                              </div>
                            </td>

                            {/* Incident Details Column */}
                            <td className="px-4 py-4">
                              <div className="space-y-2 min-w-0">
                                <div className="flex items-start gap-2">
                                  <AlertTriangle className="w-3 h-3 text-orange-500 mt-1 flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-gray-900 leading-relaxed break-words whitespace-normal" title={item.what}>
                                      {item.what || 'No details provided'}
                                    </p>
                                  </div>
                                </div>
                                {item.who && (
                                  <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded break-words whitespace-normal">
                                    <span className="font-medium">Involved:</span> {item.who}
                                  </div>
                                )}
                                {item.actionTaken && (
                                  <div className="text-xs text-gray-600 bg-blue-50 px-2 py-1 rounded break-words whitespace-normal">
                                    <span className="font-medium">Action:</span> {item.actionTaken}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Action Status Column */}
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2 min-w-0">
                                <CheckCircle className={`w-4 h-4 flex-shrink-0 ${item.actionTaken === 'Resolved' ? 'text-green-500' : 'text-orange-500'}`} />
                              <Badge 
                                  className={`text-xs px-3 py-1 font-medium break-words whitespace-normal ${
                                  item.actionTaken === "Resolved"
                                      ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
                                      : 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200'
                                }`}
                              >
                                {item.actionTaken || 'Pending'}
                              </Badge>
                                </div>
                              </td>

                            {/* Department Column (only for all departments view) */}
                            {previewDepartment === 'all' && (
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Building2 className="w-3 h-3 text-purple-500 flex-shrink-0" />
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs px-2 py-1 font-medium break-words ${
                                      item.department === 'pnp' 
                                        ? 'bg-red-50 text-red-700 border-red-200'
                                        : item.department === 'agriculture'
                                        ? 'bg-green-50 text-green-700 border-green-200'
                                        : 'bg-blue-50 text-blue-700 border-blue-200'
                                    }`}
                                  >
                                    {item.department?.toUpperCase() || 'N/A'}
                                  </Badge>
                                </div>
                              </td>
                            )}

                            {/* Source Column (only for PNP) */}
                            {previewDepartment === "pnp" && (
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Shield className="w-3 h-3 text-red-500 flex-shrink-0" />
                                  <span className="text-sm text-gray-700 break-words leading-relaxed whitespace-normal" title={item.source}>
                                    {item.source || 'N/A'}
                                  </span>
                                </div>
                              </td>
                            )}

                            {/* Additional Info Column */}
                            <td className="px-4 py-4">
                              <div className="flex items-start gap-2 min-w-0">
                                <Info className="w-3 h-3 text-gray-500 mt-1 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm text-gray-700 leading-relaxed break-words whitespace-normal" title={item.otherInfo}>
                                    {item.otherInfo || 'No additional information'}
                                  </p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {/* Table Footer */}
                    {getPreviewFilteredData().length === 0 && (
                      <div className="p-8 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="p-3 rounded-full bg-gray-100">
                            <FileText className="w-8 h-8 text-gray-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">No records found</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              Try adjusting your filter criteria to see more results.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {getPreviewFilteredData().length > 20 && (
                      <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <div className="flex items-center justify-center gap-2">
                          <AlertCircle className="w-4 h-4 text-blue-500" />
                          <p className="text-sm text-blue-700 font-medium">
                            Showing first 20 of {getPreviewFilteredData().length} records. Export to PDF to see all records.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Enhanced Footer */}
                <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Report Information */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-blue-600" />
                        Report Information
                      </h3>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span>Generated on: {new Date().toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span>Time: {new Date().toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-500" />
                          <span>Department: {(previewDepartment === 'all' ? 'All Departments' : previewDepartment.toUpperCase())}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-gray-500" />
                          <span>Total Records: {getPreviewFilteredData().length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Filter Summary */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        <Filter className="w-5 h-5 mr-2 text-blue-600" />
                        Applied Filters
                      </h3>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {previewDepartment !== 'all' && (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                              Department: {previewDepartment.toUpperCase()}
                            </Badge>
                          )}
                          {previewMonth !== 'all' && (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              Month: {MONTH_NAMES[previewMonth]}
                            </Badge>
                          )}
                          {previewYear !== 'all' && (
                            <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                              Year: {previewYear}
                            </Badge>
                          )}
                          {previewDistrict !== 'all' && (
                            <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                              District: {previewDistrict}
                            </Badge>
                          )}
                          {previewDepartment === 'all' && previewMonth === 'all' && previewYear === 'all' && previewDistrict === 'all' && (
                            <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                              No filters applied
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Report Statistics Summary */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{getPreviewFilteredData().length}</div>
                        <div className="text-xs text-gray-600 uppercase tracking-wider">Total Records</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {getPreviewFilteredData().filter(item => item.actionTaken === 'Resolved').length}
                        </div>
                        <div className="text-xs text-gray-600 uppercase tracking-wider">Resolved</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {getPreviewFilteredData().filter(item => item.actionTaken !== 'Resolved').length}
                        </div>
                        <div className="text-xs text-gray-600 uppercase tracking-wider">Pending</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {Math.round((getPreviewFilteredData().filter(item => item.actionTaken === 'Resolved').length / Math.max(getPreviewFilteredData().length, 1)) * 100)}%
                        </div>
                        <div className="text-xs text-gray-600 uppercase tracking-wider">Resolution Rate</div>
                      </div>
                    </div>
                  </div>

                  {/* System Information */}
                  <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                    <p className="text-xs text-gray-500">
                      Generated by IPatroller Action Center System • 
                      Report ID: {Date.now().toString().slice(-8)} • 
                      Version 2.0
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </section>
    </Layout>
  );
} 

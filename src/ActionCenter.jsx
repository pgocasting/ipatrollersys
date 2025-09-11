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
  Building2
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
  const { user, addActionReport, updateActionReport, deleteActionReport, queryDocuments } = useFirebase();
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

  // Load action items from Firestore
    const loadActionReports = async () => {
      setLoading(true);
      try {
        console.log('🔄 Loading action reports from Firestore...');
        
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
          
          // Filter reports based on active tab if needed
          const filteredReports = activeTab === 'all' 
            ? allActionReports 
            : allActionReports.filter(report => report.department?.toLowerCase() === activeTab?.toLowerCase());
          
          console.log(`🔍 Filtered reports for ${activeTab}:`, filteredReports.length);
          
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
        const result = await deleteActionReport(selectedItem.id);
        if (result.success) {
          setActionItems(prevItems => (prevItems || []).filter(item => item.id !== selectedItem.id));
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
      const result = await updateActionReport(editingItem.id, cleanReport);
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
      // Update in Firestore
      const result = await updateActionReport(reportId, updatedReport);
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
      <section className="flex-1 p-3 md:p-6 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
            <h1 className="text-2xl md:text-3xl font-bold transition-colors duration-300 text-gray-900">
              Action Center Management
                </h1>
            <p className="text-base md:text-lg transition-colors duration-300 text-gray-600">
              {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })} • Incident Response & Action Tracking
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className={`w-2 h-2 rounded-full ${
                loading ? 'bg-green-500' : 'bg-yellow-500'
              }`}></div>
              <span className={`text-xs md:text-sm font-medium ${
                loading ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {loading ? 'Processing...' : 'System operational'}
              </span>
              </div>
            </div>
          <div className="flex flex-wrap gap-2">
            {/* 3-Lines Menu */}
            <div className="relative">
              <Button
                id="actioncenter-menu-button"
                onClick={() => setShowMenuDropdown(!showMenuDropdown)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                title="Action Center Options"
              >
                <Menu className="w-5 h-5" />
                <span className="text-sm font-medium">View Options</span>
              </Button>
              
              {/* Dropdown Menu */}
              {showMenuDropdown && (
                <div 
                  id="actioncenter-menu-dropdown"
                  className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden"
                >
                  <div className="py-1">
                    {/* Action Options */}
                    <div className="px-3 py-2">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</h3>
                    </div>
                    
                    <button
                      onClick={() => {
                        handleAddActionReport();
                        setShowMenuDropdown(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
                    >
                      <Plus className="w-4 h-4 text-blue-600" />
                      <span>Add Action Report</span>
                    </button>
                    
                    {/* View Options */}
                    <div className="px-3 py-2 mt-2">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">View Options</h3>
                    </div>
                    
                    <button
                      onClick={() => {
                        openPreviewModal();
                        setShowMenuDropdown(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-200"
                    >
                      <Eye className="w-4 h-4 text-indigo-600" />
                      <span>Preview Report</span>
                    </button>
                    
                  </div>
                </div>
              )}
            </div>
          </div>
          </div>

        {/* Department Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Show all cards for admin users */}
          {isAdmin && (
            <>
              <Card 
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${
                  activeTab === "pnp" ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:bg-blue-50'
                }`}
                    onClick={() => {
                      setActiveTab("pnp");
                      setActiveMunicipality("all");
                    }}
              >
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className={`p-2 md:p-3 rounded-lg ${
                      activeTab === "pnp" ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'
                    }`}>
                      <Shield className="h-5 w-5 md:h-6 md:w-6" />
                      </div>
                      <div>
                      <h3 className={`font-bold text-base md:text-lg transition-colors duration-300 ${
                        activeTab === "pnp" ? 'text-blue-600' : 'text-gray-900'
                      }`}>PNP</h3>
                      <p className={`text-xs md:text-sm transition-colors duration-300 ${
                        activeTab === "pnp" ? 'text-blue-500' : 'text-gray-600'
                      }`}>Police Operations</p>
                      </div>
                    </div>
                </CardContent>
              </Card>
              <Card 
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${
                  activeTab === "agriculture" ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200 hover:bg-green-50'
                }`}
                    onClick={() => {
                      setActiveTab("agriculture");
                      setActiveMunicipality("all");
                    }}
              >
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className={`p-2 md:p-3 rounded-lg ${
                      activeTab === "agriculture" ? 'bg-green-600 text-white' : 'bg-green-100 text-green-600'
                    }`}>
                      <Target className="h-5 w-5 md:h-6 md:w-6" />
                      </div>
                      <div>
                      <h3 className={`font-bold text-base md:text-lg transition-colors duration-300 ${
                        activeTab === "agriculture" ? 'text-green-600' : 'text-gray-900'
                      }`}>Agriculture</h3>
                      <p className={`text-xs md:text-sm transition-colors duration-300 ${
                        activeTab === "agriculture" ? 'text-green-500' : 'text-gray-600'
                      }`}>Bantay Dagat</p>
                      </div>
                    </div>
                </CardContent>
              </Card>
              <Card 
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${
                  activeTab === "pg-enro" ? 'bg-purple-50 border-purple-300' : 'bg-white border-gray-200 hover:bg-purple-50'
                }`}
                    onClick={() => {
                  setActiveTab("pg-enro");
                      setActiveMunicipality("all");
                    }}
              >
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className={`p-2 md:p-3 rounded-lg ${
                      activeTab === "pg-enro" ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-600'
                    }`}>
                      <Building2 className="h-5 w-5 md:h-6 md:w-5" />
                      </div>
                      <div>
                      <h3 className={`font-bold text-base md:text-lg transition-colors duration-300 ${
                        activeTab === "pg-enro" ? 'text-purple-600' : 'text-gray-900'
                      }`}>PG-Enro</h3>
                      <p className={`text-xs md:text-sm transition-colors duration-300 ${
                        activeTab === "pg-enro" ? 'text-purple-500' : 'text-gray-600'
                      }`}>Environment</p>
                      </div>
                    </div>
                </CardContent>
              </Card>
            </>
          )}
          
          {/* Show only Agriculture card for Agriculture department users */}
          {!isAdmin && userDepartment === "agriculture" && (
            <Card 
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${
                activeTab === "agriculture" ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200 hover:bg-green-50'
              }`}
                  onClick={() => {
                    setActiveTab("agriculture");
                    setActiveMunicipality("all");
                  }}
            >
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className={`p-2 md:p-3 rounded-lg ${
                    activeTab === "agriculture" ? 'bg-green-600 text-white' : 'bg-green-100 text-green-600'
                  }`}>
                    <Target className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <div>
                    <h3 className={`font-bold text-base md:text-lg transition-colors duration-300 ${
                      activeTab === "agriculture" ? 'text-green-600' : 'text-gray-900'
                    }`}>Agriculture</h3>
                    <p className={`text-xs md:text-sm transition-colors duration-300 ${
                      activeTab === "agriculture" ? 'text-green-500' : 'text-gray-600'
                    }`}>Bantay Dagat</p>
                    </div>
                  </div>
              </CardContent>
            </Card>
          )}
          
          {/* Show only PG-ENRO card for PG-ENRO department users */}
          {!isAdmin && userDepartment === "pg-enro" && (
            <Card 
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${
                activeTab === "pg-enro" ? 'bg-purple-50 border-purple-300' : 'bg-white border-gray-200 hover:bg-purple-50'
              }`}
                  onClick={() => {
                setActiveTab("pg-enro");
                    setActiveMunicipality("all");
                  }}
            >
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className={`p-2 md:p-3 rounded-lg ${
                    activeTab === "pg-enro" ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-600'
                  }`}>
                    <Building2 className="h-5 w-5 md:h-6 md:w-5" />
                    </div>
                    <div>
                    <h3 className={`font-bold text-base md:text-lg transition-colors duration-300 ${
                      activeTab === "pg-enro" ? 'text-purple-600' : 'text-gray-900'
                    }`}>PG-Enro</h3>
                    <p className={`text-xs md:text-sm transition-colors duration-300 ${
                      activeTab === "pg-enro" ? 'text-purple-500' : 'text-gray-600'
                    }`}>Environment</p>
                    </div>
                  </div>
              </CardContent>
            </Card>
          )}
            </div>
        {/* Main Content Area - Takes remaining space */}
        <div className="flex-1 flex flex-col min-h-0 px-6 py-2">
          {/* Dynamic Search & Filter Module */}
          <div className="flex-shrink-0 mb-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              {/* Search Bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by municipality, district, department, or action..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10 py-2 text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {/* Quick Filters */}
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm font-medium text-gray-700 mr-2">Quick Filters:</span>
                
                {/* Month Filter */}
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Months</option>
                  {[
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                  ].map((month, index) => (
                    <option key={month} value={index}>{month}</option>
                  ))}
                </select>

                {/* Year Filter */}
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Years</option>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>

                {/* District Filter */}
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Districts</option>
                  <option value="1ST DISTRICT">1ST DISTRICT</option>
                  <option value="2ND DISTRICT">2ND DISTRICT</option>
                  <option value="3RD DISTRICT">3RD DISTRICT</option>
                </select>

                {/* Clear Filters Button */}
                <Button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedDistrict("all");
                    setSelectedMonth("all");
                    setSelectedYear("all");
                  }}
                  variant="outline"
                  size="sm"
                  className="ml-auto text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Clear All
                </Button>
              </div>
            </div>
          
          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg">
              <p className="text-sm text-green-700 font-medium">{successMessage}</p>
            </div>
          )}
          
          {/* Summary Cards */}
          <div className="flex-shrink-0 mb-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {/* PNP Tab - Drug Related Stats */}
              {activeTab === "pnp" && (
                <>
                  {/* Total Card */}
                  <div className="bg-gray-600 rounded-lg p-3 md:p-4 text-white shadow-lg min-h-[80px] md:min-h-[100px]">
                <div className="flex items-center justify-between">
                  <div>
                        <p className="text-gray-100 text-xs font-medium">Total</p>
                        <p className="text-base md:text-lg font-bold">{sortedItems ? sortedItems.length : 0}</p>
                        <p className="text-gray-200 text-xs">All table records</p>
                  </div>
                      <div className="p-1 md:p-1.5 bg-white/20 rounded-full">
                        <Database className="h-3 w-3 md:h-4 md:w-4" />
                  </div>
                </div>
              </div>
                  {/* Actions Card */}
                  <div className="bg-blue-500 rounded-lg p-3 md:p-4 text-white shadow-lg min-h-[80px] md:min-h-[100px]">
                <div className="flex items-center justify-between">
                  <div>
                        <p className="text-blue-100 text-xs font-medium">Action Taken</p>
                        <p className="text-base md:text-lg font-bold">{totalActions}</p>
                        <p className="text-blue-200 text-xs">Actions with status</p>
                  </div>
                      <div className="p-1 md:p-1.5 bg-white/20 rounded-full">
                        <Activity className="h-3 w-3 md:h-4 md:w-4" />
                  </div>
                </div>
              </div>
                  {/* Drugs Card */}
                  <div className="bg-red-500 rounded-lg p-3 md:p-4 text-white shadow-lg min-h-[80px] md:min-h-[100px]">
                <div className="flex items-center justify-between">
                  <div>
                        <p className="text-red-100 text-xs font-medium">Drugs</p>
                        <p className="text-base md:text-lg font-bold">{totalDrugs}</p>
                        <p className="text-red-200 text-xs">Male: {totalDrugsMale} | Female: {totalDrugsFemale}</p>
                  </div>
                      <div className="p-1 md:p-1.5 bg-white/20 rounded-full">
                        <AlertTriangle className="h-3 w-3 md:h-4 md:w-4" />
                  </div>
                </div>
              </div>
                  {/* Illegals Total Card */}
                  <div className="bg-fuchsia-500 rounded-lg p-3 md:p-4 text-white shadow-lg min-h-[80px] md:min-h-[100px]">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-fuchsia-100 text-xs font-medium mb-1">Illegals</p>
                        <p className="text-base md:text-lg font-bold mb-1">{totalIllegals}</p>
                        <p className="text-fuchsia-200 text-xs leading-tight">
                          {illegalCategoryCounts && Object.entries(illegalCategoryCounts)
                            .slice(0, 3) // Show only first 3 categories to fit better
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(' • ')}
                          {illegalCategoryCounts && Object.entries(illegalCategoryCounts).length > 3 && '...'}
                        </p>
                  </div>
                      <div className="p-1 md:p-1.5 bg-white/20 rounded-full ml-2 flex-shrink-0">
                        <AlertTriangle className="h-3 w-3 md:h-4 md:w-4" />
                  </div>
                </div>
              </div>
                </>
              )}
              {/* Agriculture Tab - Bantay Dagat Stats */}
              {activeTab === "agriculture" && (
                <>
                  {/* Total Entries Card */}
                  <div className="bg-green-600 rounded-lg p-4 text-white shadow-lg min-h-[100px]">
                <div className="flex items-center justify-between">
                  <div>
                        <p className="text-green-100 text-xs font-medium">Total Entries</p>
                        <p className="text-lg font-bold">{sortedItems ? sortedItems.length : 0}</p>
                        <p className="text-green-200 text-xs">All agriculture records</p>
                  </div>
                  <div className="p-1.5 bg-white/20 rounded-full">
                        <Database className="h-4 w-4" />
                  </div>
                </div>
              </div>
                  {/* Illegals Card */}
                  <div className="bg-red-500 rounded-lg p-4 text-white shadow-lg min-h-[100px]">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-red-100 text-xs font-medium mb-1">Illegals (Auto-Detected)</p>
                        <p className="text-lg font-bold mb-1">{totalAgricultureIllegals}</p>
                        <p className="text-red-200 text-xs leading-tight">
                          {agricultureIllegalCategoryCounts && Object.entries(agricultureIllegalCategoryCounts)
                            .slice(0, 3) // Show only first 3 categories to fit better
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(' • ')}
                          {agricultureIllegalCategoryCounts && Object.entries(agricultureIllegalCategoryCounts).length > 3 && '...'}
                        </p>
                        {agricultureIllegalCategoryCounts && Object.entries(agricultureIllegalCategoryCounts).length > 0 && (
                          <p className="text-red-200 text-xs mt-1">
                            {Object.entries(agricultureIllegalCategoryCounts).length} categories detected
                            {Object.entries(agricultureIllegalCategoryCounts).length > 3 && (
                              <span className="ml-1 cursor-help" title={Object.entries(agricultureIllegalCategoryCounts)
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
              {/* PG-ENRO Tab - Environment Stats */}
              {activeTab === "pg-enro" && (
                <>
                  {/* Total Entries Card */}
                  <div className="bg-purple-600 rounded-lg p-4 text-white shadow-lg min-h-[100px]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-xs font-medium">Total Entries</p>
                        <p className="text-lg font-bold">{sortedItems ? sortedItems.length : 0}</p>
                        <p className="text-purple-200 text-xs">All environment records</p>
                      </div>
                      <div className="p-1.5 bg-white/20 rounded-full">
                        <Database className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                  {/* Illegals Card */}
                  <div className="bg-red-500 rounded-lg p-4 text-white shadow-lg min-h-[100px]">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
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
              {/* Header with Export PDF button */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Action Center Report Preview</h3>
                  </div>
                </div>
                                 <div className="flex items-center gap-3">
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
                     className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2"
                     title="Export to PDF"
                   >
                     <Download className="w-4 h-4 mr-2" />
                     Export PDF
                   </Button>
                  <Button
                    onClick={() => setShowPreviewModal(false)}
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 p-0"
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
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                    Summary Statistics
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                    <div className="relative overflow-hidden p-4 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white">
                      <div className="relative z-10">
                        <p className="text-sm font-medium text-blue-600">Total Actions</p>
                        <p className="text-3xl font-bold text-blue-700">{totalActions}</p>
                      </div>
                      <div className="absolute right-0 bottom-0 opacity-10">
                        <Activity className="w-16 h-16 text-blue-600" />
                      </div>
                    </div>
                    <div className="relative overflow-hidden p-4 rounded-xl border border-orange-100 bg-gradient-to-br from-orange-50 to-white">
                      <div className="relative z-10">
                        <p className="text-sm font-medium text-orange-600">Pending Actions</p>
                        <p className="text-3xl font-bold text-orange-700">{pendingActions}</p>
                      </div>
                      <div className="absolute right-0 bottom-0 opacity-10">
                        <Clock className="w-16 h-16 text-orange-600" />
                      </div>
                    </div>

                    
                    {/* Tab-specific statistics */}
                    {activeTab === "pnp" && (
                      <>
                        <div className="relative overflow-hidden p-4 rounded-xl border border-red-100 bg-gradient-to-br from-red-50 to-white col-span-2">
                          <div className="relative z-10">
                            <p className="text-sm font-medium text-red-600">Total Drugs</p>
                            <p className="text-3xl font-bold text-red-700">{totalDrugs}</p>
                          </div>
                          <div className="absolute right-0 bottom-0 opacity-10">
                            <Pill className="w-16 h-16 text-red-600" />
                          </div>
                        </div>
                        <div className="relative overflow-hidden p-4 rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white col-span-2">
                          <div className="relative z-10">
                            <p className="text-sm font-medium text-purple-600">Total Illegals</p>
                            <p className="text-3xl font-bold text-purple-700">{totalIllegals}</p>
                          </div>
                          <div className="absolute right-0 bottom-0 opacity-10">
                            <Shield className="w-16 h-16 text-purple-600" />
                          </div>
                        </div>
                      </>
                    )}
                    
                    {activeTab === "agriculture" && (
                      <>
                        <div className="relative overflow-hidden p-4 rounded-xl border border-green-100 bg-gradient-to-br from-green-50 to-white col-span-2">
                          <div className="relative z-10">
                            <p className="text-sm font-medium text-green-600">Total Illegals</p>
                            <p className="text-3xl font-bold text-green-700">{totalAgricultureIllegals}</p>
                          </div>
                          <div className="absolute right-0 bottom-0 opacity-10">
                            <Leaf className="w-16 h-16 text-green-600" />
                          </div>
                        </div>
                        <div className="relative overflow-hidden p-4 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white col-span-2">
                          <div className="relative z-10">
                            <p className="text-sm font-medium text-blue-600">Fishing Violations</p>
                            <p className="text-3xl font-bold text-blue-700">{totalFishingViolations}</p>
                          </div>
                          <div className="absolute right-0 bottom-0 opacity-10">
                            <Fish className="w-16 h-16 text-blue-600" />
                          </div>
                        </div>
                      </>
                    )}
                    
                    {activeTab === "pg-enro" && (
                      <>
                        <div className="relative overflow-hidden p-4 rounded-xl border border-green-100 bg-gradient-to-br from-green-50 to-white col-span-2">
                          <div className="relative z-10">
                            <p className="text-sm font-medium text-green-600">Environmental</p>
                            <p className="text-3xl font-bold text-green-700">{totalEnvironmentalViolations}</p>
                          </div>
                          <div className="absolute right-0 bottom-0 opacity-10">
                            <Trees className="w-16 h-16 text-green-600" />
                          </div>
                        </div>
                        <div className="relative overflow-hidden p-4 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white col-span-2">
                          <div className="relative z-10">
                            <p className="text-sm font-medium text-blue-600">Waste Management</p>
                            <p className="text-3xl font-bold text-blue-700">{totalWasteManagement}</p>
                          </div>
                          <div className="absolute right-0 bottom-0 opacity-10">
                            <Trash2 className="w-16 h-16 text-blue-600" />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Items Table */}
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-blue-600" />
                    Action Items Details
                  </h2>
                  <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                    <table className="w-full table-fixed">
                      <thead>
                        <tr className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                          <th className="w-24 p-2 text-left">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Municipality</div>
                          </th>
                          <th className="w-20 p-2 text-left">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">District</div>
                          </th>
                          <th className="w-32 p-2 text-left">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">What</div>
                          </th>
                          <th className="w-20 p-2 text-left">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">When</div>
                          </th>
                          <th className="w-24 p-2 text-left">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Where</div>
                          </th>
                          <th className="w-28 p-2 text-left">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Action Taken</div>
                          </th>
                          {activeTab === "pnp" && (
                            <th className="w-24 p-2 text-left">
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Source</div>
                            </th>
                          )}
                          {activeTab === "agriculture" && (
                            <th className="w-32 p-2 text-left">
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Other Information</div>
                            </th>
                          )}
                          {activeTab === "pg-enro" && (
                            <th className="w-32 p-2 text-left">
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Other Information</div>
                            </th>
                          )}
                          <th className="w-32 p-2 text-left">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Other Info</div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {(getPreviewFilteredData() || []).map((item, index) => (
                          <tr 
                            key={item.id || index} 
                            className="hover:bg-gray-50 transition-colors duration-150"
                          >
                            <td className="p-2">
                              <div className="flex items-center">
                                <MapPin className="w-3 h-3 text-gray-400 mr-1" />
                                <span className="text-xs font-medium text-gray-900 truncate">{item.municipality || 'N/A'}</span>
                              </div>
                            </td>
                            <td className="p-2">
                              <Badge variant="outline" className="font-medium text-xs px-1 py-0">
                                {item.district || 'N/A'}
                              </Badge>
                            </td>
                            <td className="p-2">
                              <div className="text-xs text-gray-700 break-words leading-relaxed" title={item.what}>
                                {item.what || 'N/A'}
                              </div>
                            </td>
                            <td className="p-2">
                              <div className="text-xs text-gray-700">{formatDate(item.when)}</div>
                            </td>
                            <td className="p-2">
                              <div className="text-xs text-gray-700 break-words leading-relaxed" title={item.where}>
                                {item.where || 'N/A'}
                              </div>
                            </td>
                            <td className="p-2 max-w-[150px]">
                              <Badge 
                                className={`text-xs whitespace-normal break-words ${
                                  item.actionTaken === "Resolved"
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                    : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                                }`}
                              >
                                {item.actionTaken || 'Pending'}
                              </Badge>
                            </td>
                            {activeTab === "pnp" && (
                              <td className="p-2">
                                <div className="text-xs text-gray-700 break-words leading-relaxed" title={item.source}>
                                  {item.source || 'N/A'}
                                </div>
                              </td>
                            )}
                            {activeTab === "agriculture" && (
                              <td className="p-2">
                                <div className="text-xs text-gray-700 break-words leading-relaxed" title={item.otherInfo}>
                                  {item.otherInfo || 'N/A'}
                                </div>
                              </td>
                            )}
                            {activeTab === "pg-enro" && (
                              <td className="p-2">
                                <div className="text-xs text-gray-700 break-words leading-relaxed" title={item.otherInfo}>
                                  {item.otherInfo || 'N/A'}
                                </div>
                              </td>
                            )}
                            <td className="p-2">
                              <div className="text-xs text-gray-700 break-words leading-relaxed" title={item.otherInfo}>
                                {item.otherInfo || 'N/A'}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {sortedItems && sortedItems.length > 20 && (
                      <div className="p-4 border-t border-gray-200 bg-gray-50">
                        <p className="text-sm text-gray-600 text-center flex items-center justify-center">
                          <AlertCircle className="w-4 h-4 mr-2 text-blue-500" />
                          Showing first 20 of {sortedItems.length} records. Export to PDF to see all records.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600">
                    Generated on: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Department: {(activeTab || 'unknown').toUpperCase()} | Total Records: {sortedItems ? sortedItems.length : 0}
                  </p>
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

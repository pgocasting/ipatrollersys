import React, { useState, useEffect, useCallback, useRef } from "react";
import Layout from "./Layout";
import { useFirebase } from "./hooks/useFirebase";
import { useAuth } from "./contexts/AuthContext";
import { collection, getDocs, query, orderBy, onSnapshot, writeBatch, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Badge } from "./components/ui/badge";
import { Label } from "./components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "./components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./components/ui/dialog";
import { useNotification, NotificationContainer } from './components/ui/notification';
import { actionCenterLog, createSectionGroup, CONSOLE_GROUPS } from './utils/consoleGrouping';
// import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "./components/ui/sheet";

import { 
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Eye,
  Edit,
  Trash2,
  Search,
  Shield,
  Target,
  Database,
  Plus,
  RotateCcw,
  Fish,
  Trees,
  X,
  Menu,
  Filter,
  Car,
  Activity,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export default function ActionCenter({ onLogout, onNavigate, currentPage }) {
  const { user, addActionReport, updateActionReport, deleteActionReport, getAllActionReports } = useFirebase();
  const { isAdmin, userDepartment, userMunicipality } = useAuth();
  
  // State management
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { notifications, showSuccess, removeNotification } = useNotification();
  const [activeTab, setActiveTab] = useState(() => {
    if (userDepartment === "agriculture") return "agriculture";
    if (userDepartment === "pg-enro") return "pg-enro";
    return "all";
  });
  const [activeMunicipality, setActiveMunicipality] = useState("all");
  const [actionItems, setActionItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tablePage, setTablePage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // File input ref for Excel import
  const fileInputRef = useRef(null);
  
  // Modal states for different actions
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [showMonthlyBreakdownModal, setShowMonthlyBreakdownModal] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedImportDepartment, setSelectedImportDepartment] = useState('');
  
  // Helper: extract one or more URLs from a cell string (e.g., Google Drive links)
  const extractLinksFromCell = (text) => {
    if (!text || typeof text !== 'string') return [];
    // Split by common delimiters, then filter by URL-looking strings
    const roughParts = text
      .split(/\s|,|;|\n|\r|\t/)
      .map(part => part.trim())
      .filter(Boolean);
    const urlRegex = /^(https?:\/\/[^\s]+)$/i;
    const links = roughParts.filter(part => urlRegex.test(part));
    // De-duplicate while preserving order
    const seen = new Set();
    const unique = [];
    for (const link of links) {
      if (!seen.has(link)) {
        seen.add(link);
        unique.push(link);
      }
    }
    return unique;
  };

  // Form state for adding/editing actions
  const [formData, setFormData] = useState({
    department: userDepartment || 'pnp',
    municipality: '',
    district: '',
    what: '',
    when: new Date().toISOString().split('T')[0],
    where: '',
    actionTaken: 'Pending',
    // PNP specific fields
    who: '',
    why: '',
    how: '',
    gender: '',
    source: '',
    otherInformation: '',
    photos: []
  });

  // Translation and grammar correction function
  const translateAndCorrectGrammar = (text) => {
    if (!text || typeof text !== 'string') return text;
    
    // Common Filipino to English translations for law enforcement actions
    const translations = {
      // Arrest related
      'nahuli': 'arrested',
      'naaresto': 'arrested', 
      'nakuha': 'arrested',
      'dinakip': 'arrested',
      'nasakote': 'arrested',
      'nakulong': 'arrested',
      'kinuha': 'arrested',
      
      // Investigation related
      'iniimbestigahan': 'under investigation',
      'sinisiyasat': 'under investigation',
      'tinitingnan': 'under investigation',
      'pinag-aaralan': 'under investigation',
      
      // Pending related
      'naghihintay': 'pending',
      'pending pa': 'pending',
      'hindi pa tapos': 'pending',
      'patuloy': 'ongoing',
      'tuloy-tuloy': 'ongoing',
      
      // Resolved related
      'tapos na': 'resolved',
      'natapos': 'resolved',
      'naayos': 'resolved',
      'naresolba': 'resolved',
      'nakasuhan': 'filed charges',
      'nasampa': 'filed charges',
      
      // Common words
      'ang': 'the',
      'sa': 'in',
      'ng': 'of',
      'na': 'already',
      'pa': 'still',
      'ay': 'is',
      'mga': '',
      'yung': 'the',
      'nung': 'when',
      'noong': 'on',
      'kanina': 'earlier',
      'kahapon': 'yesterday',
      'ngayon': 'today',
      'bukas': 'tomorrow'
    };
    
    let result = text.toLowerCase().trim();
    
    // Apply translations
    Object.entries(translations).forEach(([filipino, english]) => {
      const regex = new RegExp(`\\b${filipino}\\b`, 'gi');
      result = result.replace(regex, english);
    });
    
    // Grammar corrections and improvements
    result = result
      .replace(/\s+/g, ' ') // Remove extra spaces
      .replace(/\b(arrested|investigation|pending|resolved|ongoing)\b/gi, (match) => {
        // Capitalize first letter of key status words
        return match.charAt(0).toUpperCase() + match.slice(1).toLowerCase();
      })
      .replace(/^./, (match) => match.toUpperCase()) // Capitalize first letter
      .replace(/\s+$/, '') // Remove trailing spaces
      .replace(/^\s+/, ''); // Remove leading spaces
    
    // Handle common patterns
    if (result.includes('arrested')) {
      result = result.replace(/arrested.*/, 'Arrested');
    }
    
    return result || text; // Return original if translation fails
  };

  // Comprehensive function to fetch ALL action data from Firestore
  const fetchAllActionData = useCallback(async () => {
    if (!db || !user) {
      actionCenterLog('⚠️ Database or user not available');
      setLoading(false);
      return;
    }

    const actionCenterGroup = createSectionGroup(CONSOLE_GROUPS.ACTION_CENTER, false);
    
    try {
      setLoading(true);
      actionCenterGroup.log('🚀 COMPREHENSIVE ACTION DATA FETCH STARTED');
      actionCenterGroup.log('🔍 Database available:', !!db);
      actionCenterGroup.log('🔍 User logged in:', !!user);
      
      const allActionData = [];
      
      // List of possible collection names where action data might be stored
      const possibleCollections = [
        'actionReports',
        'actionCenter', 
        'actions',
        'reports',
        'actionData',
        'departmentActions',
        'pnpActions',
        'agricultureActions',
        'pgEnroActions'
      ];
      
      actionCenterGroup.log('📋 Checking collections:', possibleCollections);
      
      // Check each possible collection
      for (const collectionName of possibleCollections) {
        try {
          actionCenterGroup.log(`🔍 Checking collection: ${collectionName}`);
          const collectionRef = collection(db, collectionName);
          const snapshot = await getDocs(collectionRef);
          
          actionCenterGroup.log(`📊 ${collectionName}: ${snapshot.size} documents found`);
          
          if (snapshot.size > 0) {
            snapshot.forEach((doc) => {
              const data = doc.data();
              actionCenterGroup.log(`📄 ${collectionName}/${doc.id}:`, Object.keys(data));
              
              // Handle different data structures
              if (data.data && Array.isArray(data.data)) {
                // Month-based structure with data array
                actionCenterGroup.log(`📅 Month-based document with ${data.data.length} reports`);
                data.data.forEach((report, index) => {
                  allActionData.push({
                    ...report,
                    sourceCollection: collectionName,
                    sourceDocument: doc.id,
                    sourceType: 'month-based',
                    reportIndex: index
                  });
                });
              } else if (data.actions && Array.isArray(data.actions)) {
                // Actions array structure
                actionCenterGroup.log(`📋 Actions array with ${data.actions.length} items`);
                data.actions.forEach((action, index) => {
                  allActionData.push({
                    ...action,
                    sourceCollection: collectionName,
                    sourceDocument: doc.id,
                    sourceType: 'actions-array',
                    reportIndex: index
                  });
                });
              } else if (data.reports && Array.isArray(data.reports)) {
                // Reports array structure
                actionCenterGroup.log(`📋 Reports array with ${data.reports.length} items`);
                data.reports.forEach((report, index) => {
                  allActionData.push({
                    ...report,
                    sourceCollection: collectionName,
                    sourceDocument: doc.id,
                    sourceType: 'reports-array',
                    reportIndex: index
                  });
                });
              } else {
                // Individual document structure
                actionCenterGroup.log(`📄 Individual document structure`);
                allActionData.push({
                  ...data,
                  id: doc.id,
                  sourceCollection: collectionName,
                  sourceDocument: doc.id,
                  sourceType: 'individual'
                });
              }
            });
          }
        } catch (collectionError) {
          actionCenterGroup.log(`⚠️ Collection ${collectionName} not accessible:`, collectionError.message);
        }
      }
      
      actionCenterGroup.log(`✅ TOTAL RAW DATA COLLECTED: ${allActionData.length} items`);
      
      if (allActionData.length > 0) {
        actionCenterGroup.log('📄 Sample raw data:', allActionData.slice(0, 3));
        
        // Transform and standardize all collected data
        const transformedData = allActionData
          .map((item, index) => {
            // Handle different date formats
            let dateValue = new Date();
            if (item.when) {
              if (item.when.toDate && typeof item.when.toDate === 'function') {
                dateValue = item.when.toDate(); // Firestore Timestamp
              } else if (item.when instanceof Date) {
                dateValue = item.when;
              } else if (typeof item.when === 'string' || typeof item.when === 'number') {
                dateValue = new Date(item.when);
              }
            } else if (item.date) {
              if (item.date.toDate && typeof item.date.toDate === 'function') {
                dateValue = item.date.toDate();
              } else {
                dateValue = new Date(item.date);
              }
            } else if (item.createdAt) {
              dateValue = new Date(item.createdAt);
            }
            
            return {
              id: item.id || `action_${index}_${Date.now()}`,
              department: item.department || item.dept || item.agency || null,
              municipality: item.municipality || item.city || item.location || null,
              district: item.district || item.area || null,
              what: item.what || item.action || item.description || item.activity || null,
              when: dateValue,
              where: item.where || item.place || item.venue || item.location || null,
              actionTaken: translateAndCorrectGrammar(item.actionTaken || item.status || item.result || 'Pending'),
              // Additional metadata
              sourceCollection: item.sourceCollection,
              sourceDocument: item.sourceDocument,
              sourceType: item.sourceType,
              reportIndex: item.reportIndex,
              // Keep original data for debugging
              originalData: item
            };
          })
          .filter(item => {
            // Filter out entries with missing critical information
            const hasValidDepartment = item.department && 
              item.department.toLowerCase() !== 'unknown' && 
              item.department.trim() !== '';
            
            const hasValidMunicipality = item.municipality && 
              item.municipality.toLowerCase() !== 'unknown' && 
              item.municipality.trim() !== '';
            
            const hasValidDistrict = item.district && 
              item.district.toLowerCase() !== 'unknown' && 
              item.district.trim() !== '';
            
            const hasValidWhat = item.what && 
              item.what.toLowerCase() !== 'no description' && 
              item.what.trim() !== '';
            
            const hasValidWhere = item.where && 
              item.where.toLowerCase() !== 'unknown location' && 
              item.where.toLowerCase() !== 'unknown' && 
              item.where.trim() !== '';
            
            // Only include entries that have valid data for critical fields
            return hasValidDepartment && hasValidMunicipality && hasValidDistrict && hasValidWhat && hasValidWhere;
          })
          .map(item => {
            // Set proper default values for remaining items
            return {
              ...item,
              department: item.department || 'Not Specified',
              municipality: item.municipality || 'Not Specified',
              district: item.district || 'Not Specified',
              what: item.what || 'No description available',
              where: item.where || 'Location not specified'
            };
          });
        
        // Sort by date (newest first)
        transformedData.sort((a, b) => new Date(b.when) - new Date(a.when));
        
        actionCenterGroup.log('✅ DATA TRANSFORMATION COMPLETED');
        actionCenterGroup.log(`📊 Final dataset: ${transformedData.length} action reports (unknown entries filtered out)`);
        actionCenterGroup.log('📄 Sample transformed data:', transformedData.slice(0, 2));
        
        // Group by source for debugging
        const sourceGroups = transformedData.reduce((groups, item) => {
          const key = `${item.sourceCollection}/${item.sourceType}`;
          groups[key] = (groups[key] || 0) + 1;
          return groups;
        }, {});
        actionCenterGroup.log('📊 Data sources breakdown:', sourceGroups);
        
        setActionItems(transformedData);
      } else {
        actionCenterGroup.log('⚠️ NO ACTION DATA FOUND IN ANY COLLECTION');
        setActionItems([]);
      }
      
    } catch (error) {
      actionCenterGroup.error('❌ COMPREHENSIVE FETCH ERROR:', error);
      actionCenterGroup.end();
      setActionItems([]);
    } finally {
      setLoading(false);
      actionCenterGroup.log('🏁 COMPREHENSIVE ACTION DATA FETCH COMPLETED');
      actionCenterGroup.end();
    }
  }, [db, user]);

  // Fetch data on component mount
  useEffect(() => {
    fetchAllActionData();
  }, [fetchAllActionData]);

  // Municipalities by district
  const municipalitiesByDistrict = {
    "1ST DISTRICT": ["Abucay", "Orani", "Samal", "Hermosa"],
    "2ND DISTRICT": ["Balanga City", "Pilar", "Orion", "Limay"],
    "3RD DISTRICT": ["Bagac", "Dinalupihan", "Mariveles", "Morong"]
  };

  // Function to auto-detect district based on municipality
  const getDistrictByMunicipality = (municipality) => {
    if (!municipality) return '';
    
    const municipalityLower = municipality.toLowerCase().trim();
    
    for (const [district, municipalities] of Object.entries(municipalitiesByDistrict)) {
      const found = municipalities.some(mun => 
        mun.toLowerCase() === municipalityLower || 
        municipalityLower.includes(mun.toLowerCase()) ||
        mun.toLowerCase().includes(municipalityLower)
      );
      if (found) {
        return district;
      }
    }
    return '';
  };

  // Handle municipality change with auto-detection
  const handleMunicipalityChange = (value) => {
    const detectedDistrict = getDistrictByMunicipality(value);
    setFormData({
      ...formData, 
      municipality: value,
      district: detectedDistrict
    });
  };

  // Filter and sort data
  const filteredItems = actionItems.filter(item => {
    const matchesSearch = searchTerm === "" || 
      Object.values(item).some(value => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesDistrict = selectedDistrict === 'all' || item.district === selectedDistrict;
    
    // Department filtering logic
    let matchesDepartment;
    if (isAdmin) {
      // Admin users can see all departments
      matchesDepartment = activeTab === 'all' || item.department === activeTab;
    } else if (userDepartment === 'agriculture' || userDepartment === 'pg-enro') {
      // Agriculture and PG-ENRO users can only see their own department data
      matchesDepartment = item.department && item.department.toLowerCase() === userDepartment.toLowerCase();
    } else {
      // Other users (like PNP) can see all departments
      matchesDepartment = activeTab === 'all' || item.department === activeTab;
    }
    
    const matchesMunicipality = activeMunicipality === "all" || item.municipality === activeMunicipality;
    const matchesMonth = selectedMonth === 'all' || item.when.getMonth() === selectedMonth;
    
    // Additional filter to exclude any remaining unknown entries
    const hasValidData = item.department && 
      item.municipality && 
      item.district && 
      item.what && 
      item.where &&
      item.department.toLowerCase() !== 'unknown' &&
      item.municipality.toLowerCase() !== 'unknown' &&
      item.district.toLowerCase() !== 'unknown' &&
      item.what.toLowerCase() !== 'no description' &&
      item.where.toLowerCase() !== 'unknown location' &&
      item.where.toLowerCase() !== 'unknown';
    
    return matchesSearch && matchesDistrict && matchesDepartment && matchesMunicipality && matchesMonth && hasValidData;
  });

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (tablePage - 1) * itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  // Statistics
  const totalActions = filteredItems.length;
  const arrestedActions = filteredItems.filter(item => item.actionTaken === 'Arrested').length;
  const pendingActions = filteredItems.filter(item => item.actionTaken !== 'Arrested').length;
  // Count PNP actions from filtered data (respects month selection)
  const pnpActions = filteredItems.filter(item => 
    item.department && item.department.toLowerCase() === 'pnp'
  ).length;
  // Count Agriculture (Bantay Dagat) actions
  const agricultureActions = filteredItems.filter(item => 
    item.department && item.department.toLowerCase() === 'agriculture'
  ).length;
  // Count PG-Enro (Environment) actions
  const pgEnroActions = filteredItems.filter(item => 
    item.department && item.department.toLowerCase() === 'pg-enro'
  ).length;

  // Monthly counts for each department
  const getMonthlyCount = (department, month) => {
    return actionItems.filter(item => {
      const itemMonth = item.when ? item.when.getMonth() : -1;
      const matchesDepartment = item.department && item.department.toLowerCase() === department.toLowerCase();
      return matchesDepartment && itemMonth === month;
    }).length;
  };

  // Generate monthly data for current year
  const monthlyData = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ].map((monthName, index) => ({
    month: monthName,
    monthIndex: index,
    pnp: getMonthlyCount('pnp', index),
    agriculture: getMonthlyCount('agriculture', index),
    pgEnro: getMonthlyCount('pg-enro', index),
    total: getMonthlyCount('pnp', index) + getMonthlyCount('agriculture', index) + getMonthlyCount('pg-enro', index)
  }));

  const handlePageChange = (page) => {
    setTablePage(page);
  };
  
  // Pagination functions
  const goToPage = (page) => {
    setTablePage(Math.max(1, Math.min(page, totalPages)));
  };
  
  const nextPage = () => {
    if (tablePage < totalPages) {
      setTablePage(tablePage + 1);
    }
  };
  
  const prevPage = () => {
    if (tablePage > 1) {
      setTablePage(tablePage - 1);
    }
  };

  // Excel import functionality
  const handleImportExcel = () => {
    setShowImportDialog(true);
  };

  const handleDepartmentSelection = (department) => {
    setSelectedImportDepartment(department);
    setShowImportDialog(false);
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event) => {
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
      // Handle CSV files
      reader.onload = async (e) => {
        try {
          const text = e.target.result;
          const lines = text.split('\n');
          const headers = lines[0].split(',').map(header => header.trim());
          const importedActions = [];

          for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue;
            const values = lines[i].split(',').map(value => value.trim());

            const action = {
              department: selectedImportDepartment || values[headers.indexOf('Department')] || values[headers.indexOf('DEPARTMENT')] || userDepartment || 'pnp',
              municipality: values[headers.indexOf('Municipality')] || values[headers.indexOf('MUNICIPALITY')] || '',
              district: values[headers.indexOf('District')] || values[headers.indexOf('DISTRICT')] || '',
              what: values[headers.indexOf('What')] || values[headers.indexOf('WHAT')] || '',
              when: values[headers.indexOf('When')] || values[headers.indexOf('WHEN')] || new Date().toISOString().split('T')[0],
              where: values[headers.indexOf('Where')] || values[headers.indexOf('WHERE')] || '',
              actionTaken: values[headers.indexOf('Action Taken')] || values[headers.indexOf('ACTION_TAKEN')] || 'Pending',
              who: values[headers.indexOf('Who')] || values[headers.indexOf('WHO')] || '',
              why: values[headers.indexOf('Why')] || values[headers.indexOf('WHY')] || '',
              how: values[headers.indexOf('How')] || values[headers.indexOf('HOW')] || '',
              gender: values[headers.indexOf('Gender')] || values[headers.indexOf('GENDER')] || '',
              source: values[headers.indexOf('Source')] || values[headers.indexOf('SOURCE')] || '',
              otherInformation: 
                values[headers.indexOf('Other Information')] ||
                values[headers.indexOf('OTHER_INFORMATION')] ||
                values[headers.indexOf('Observation / Findings')] ||
                values[headers.indexOf('OBSERVATION / FINDINGS')] ||
                '',
              photos: extractLinksFromCell(
                values[headers.indexOf('Documents')] ||
                values[headers.indexOf('DOCUMENTS')] ||
                values[headers.indexOf('Document Links')] ||
                values[headers.indexOf('DOCUMENT LINKS')] ||
                ''
              )
            };

            // Only add actions that have at least some basic data
            if (action.what || action.where || action.who) {
              importedActions.push(action);
            }
          }

          if (importedActions.length > 0) {
            // Save imported actions to Firestore
            try {
              setLoading(true);
              const batch = writeBatch(db);
              const actionsRef = collection(db, 'actionReports');
              importedActions.forEach(action => {
                const docRef = doc(actionsRef);
                batch.set(docRef, {
                  ...action,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                });
              });
              await batch.commit();
              await fetchAllActionData(); // Reload from Firestore
              showSuccess(`Successfully imported ${importedActions.length} action reports!`);
            } catch (error) {
              actionCenterLog('Error saving imported actions:', error, 'error');
              alert('Error saving imported actions to database. Please try again.');
            } finally {
              setLoading(false);
            }
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
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const importedActions = [];

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

              const action = {
                department: selectedImportDepartment || values[headers.indexOf('Department')] || values[headers.indexOf('DEPARTMENT')] || userDepartment || 'pnp',
                municipality: values[headers.indexOf('Municipality')] || values[headers.indexOf('MUNICIPALITY')] || '',
                district: values[headers.indexOf('District')] || values[headers.indexOf('DISTRICT')] || '',
                what: values[headers.indexOf('What')] || values[headers.indexOf('WHAT')] || '',
                when: values[headers.indexOf('When')] || values[headers.indexOf('WHEN')] || new Date().toISOString().split('T')[0],
                where: values[headers.indexOf('Where')] || values[headers.indexOf('WHERE')] || '',
                actionTaken: values[headers.indexOf('Action Taken')] || values[headers.indexOf('ACTION_TAKEN')] || 'Pending',
                who: values[headers.indexOf('Who')] || values[headers.indexOf('WHO')] || '',
                why: values[headers.indexOf('Why')] || values[headers.indexOf('WHY')] || '',
                how: values[headers.indexOf('How')] || values[headers.indexOf('HOW')] || '',
                gender: values[headers.indexOf('Gender')] || values[headers.indexOf('GENDER')] || '',
                source: values[headers.indexOf('Source')] || values[headers.indexOf('SOURCE')] || '',
                otherInformation: 
                  values[headers.indexOf('Other Information')] ||
                  values[headers.indexOf('OTHER_INFORMATION')] ||
                  values[headers.indexOf('Observation / Findings')] ||
                  values[headers.indexOf('OBSERVATION / FINDINGS')] ||
                  '',
                photos: extractLinksFromCell(
                  values[headers.indexOf('Documents')] ||
                  values[headers.indexOf('DOCUMENTS')] ||
                  values[headers.indexOf('Document Links')] ||
                  values[headers.indexOf('DOCUMENT LINKS')] ||
                  ''
                )
              };

              // Only add actions that have at least some basic data
              if (action.what || action.where || action.who) {
                importedActions.push(action);
              }
            }
          });

          if (importedActions.length > 0) {
            // Save imported actions to Firestore
            try {
              setLoading(true);
              const batch = writeBatch(db);
              const actionsRef = collection(db, 'actionReports');
              importedActions.forEach(action => {
                const docRef = doc(actionsRef);
                batch.set(docRef, {
                  ...action,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                });
              });
              await batch.commit();
              await fetchAllActionData(); // Reload from Firestore
              showSuccess(`Successfully imported ${importedActions.length} action reports!`);
            } catch (error) {
              actionCenterLog('Error saving imported actions:', error, 'error');
              alert('Error saving imported actions to database. Please try again.');
            } finally {
              setLoading(false);
            }
          } else {
            alert('No valid data found in the Excel file.');
          }
        } catch (error) {
          actionCenterLog('Error reading Excel file:', error, 'error');
          alert('Error reading Excel file. Please make sure it\'s a valid Excel file with the correct format.');
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };
  
  // Reset to first page when filters change
  useEffect(() => {
    setTablePage(1);
  }, [activeTab, activeMunicipality, selectedDistrict, searchTerm, selectedMonth, selectedYear]);

  // Button handler functions
  const handleAddNewAction = () => {
    setFormData({
      department: userDepartment || 'pnp',
      municipality: '',
      district: '',
      what: '',
      when: new Date().toISOString().split('T')[0],
      where: '',
      actionTaken: 'Pending',
      // PNP specific fields
      who: '',
      why: '',
      how: '',
      gender: '',
      source: '',
      otherInformation: '',
      photos: []
    });
    setShowAddModal(true);
  };

  const handleViewAction = (actionId) => {
    const action = actionItems.find(item => item.id === actionId);
    if (action) {
      setSelectedAction(action);
      setShowViewModal(true);
    }
  };

  const handleEditAction = (actionId) => {
    const action = actionItems.find(item => item.id === actionId);
    if (action) {
      setSelectedAction(action);
      setFormData({
        department: action.department || 'pnp',
        municipality: action.municipality || '',
        district: action.district || '',
        what: action.what || '',
        when: action.when ? new Date(action.when).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        where: action.where || '',
        actionTaken: action.actionTaken || 'Pending',
        // PNP specific fields
        who: action.who || '',
        why: action.why || '',
        how: action.how || '',
        gender: action.gender || '',
        source: action.source || '',
        otherInformation: action.otherInformation || '',
        photos: action.photos || []
      });
      setShowEditModal(true);
    }
  };

  const handleDeleteAction = (actionId) => {
    const action = actionItems.find(item => item.id === actionId);
    if (action) {
      setSelectedAction(action);
      setShowDeleteModal(true);
    }
  };

  const handleAction = (actionId, action) => {
    switch (action) {
      case 'view':
        handleViewAction(actionId);
        break;
      case 'edit':
        handleEditAction(actionId);
        break;
      case 'delete':
        handleDeleteAction(actionId);
        break;
      default:
        actionCenterLog(`Action ${action} performed on item ${actionId}`);
    }
  };

  const handleSaveAction = async () => {
    const actionCenterGroup = createSectionGroup(CONSOLE_GROUPS.ACTION_CENTER, false);
    
    try {
      setLoading(true);
      
      if (showEditModal && selectedAction) {
        // Update existing action
        actionCenterGroup.log('🔄 Starting action update process');
        actionCenterGroup.log('📋 Selected action details:', {
          id: selectedAction.id,
          sourceCollection: selectedAction.sourceCollection,
          sourceDocument: selectedAction.sourceDocument,
          sourceType: selectedAction.sourceType,
          reportIndex: selectedAction.reportIndex
        });

        let updateResult = { success: false, error: 'Unknown error' };

        // Handle different data structures based on source type
        if (selectedAction.sourceType === 'month-based' && selectedAction.sourceCollection === 'actionReports') {
          // Month-based structure - use the existing updateActionReport function
          const monthKey = selectedAction.sourceDocument; // sourceDocument is the monthKey
          actionCenterGroup.log('📅 Attempting month-based update with monthKey:', monthKey);
          updateResult = await updateActionReport(selectedAction.id, monthKey, formData);
        } else if (selectedAction.sourceType === 'individual' && selectedAction.sourceCollection === 'actionReports') {
          // Individual document structure - use the existing updateActionReport function
          actionCenterGroup.log('📄 Attempting individual document update');
          updateResult = await updateActionReport(selectedAction.id, null, formData);
        } else {
          // For other collection types, try direct document update
          actionCenterGroup.log('🔄 Attempting direct document update in collection:', selectedAction.sourceCollection);
          try {
            if (selectedAction.sourceType === 'actions-array' || selectedAction.sourceType === 'reports-array') {
              // Handle array-based structures - need to update the parent document
              actionCenterGroup.log('📋 Handling array-based update');
              const docRef = doc(db, selectedAction.sourceCollection, selectedAction.sourceDocument);
              const docSnap = await getDoc(docRef);
              
              if (docSnap.exists()) {
                const docData = docSnap.data();
                let arrayField = null;
                let updatedArray = null;
                
                if (selectedAction.sourceType === 'actions-array' && docData.actions) {
                  arrayField = 'actions';
                  updatedArray = [...docData.actions];
                  updatedArray[selectedAction.reportIndex] = {
                    ...updatedArray[selectedAction.reportIndex],
                    ...formData,
                    updatedAt: new Date().toISOString(),
                    updatedBy: user?.email || 'system'
                  };
                } else if (selectedAction.sourceType === 'reports-array' && docData.reports) {
                  arrayField = 'reports';
                  updatedArray = [...docData.reports];
                  updatedArray[selectedAction.reportIndex] = {
                    ...updatedArray[selectedAction.reportIndex],
                    ...formData,
                    updatedAt: new Date().toISOString(),
                    updatedBy: user?.email || 'system'
                  };
                } else if (docData.data && Array.isArray(docData.data)) {
                  arrayField = 'data';
                  updatedArray = [...docData.data];
                  updatedArray[selectedAction.reportIndex] = {
                    ...updatedArray[selectedAction.reportIndex],
                    ...formData,
                    updatedAt: new Date().toISOString(),
                    updatedBy: user?.email || 'system'
                  };
                }
                
                if (arrayField && updatedArray !== null) {
                  await updateDoc(docRef, {
                    [arrayField]: updatedArray,
                    lastUpdated: new Date().toISOString(),
                    updatedBy: user?.email || 'system'
                  });
                  updateResult = { success: true };
                  actionCenterGroup.log('✅ Array-based update successful');
                } else {
                  updateResult = { success: false, error: 'Could not find array field to update' };
                }
              } else {
                updateResult = { success: false, error: 'Parent document not found' };
              }
            } else {
              // Try direct document update
              const docRef = doc(db, selectedAction.sourceCollection, selectedAction.id);
              const docSnap = await getDoc(docRef);
              
              if (docSnap.exists()) {
                await updateDoc(docRef, {
                  ...formData,
                  updatedAt: new Date().toISOString(),
                  updatedBy: user?.email || 'system'
                });
                updateResult = { success: true };
                actionCenterGroup.log('✅ Direct document update successful');
              } else {
                updateResult = { success: false, error: 'Document not found for direct update' };
              }
            }
          } catch (directUpdateError) {
            actionCenterGroup.error('❌ Direct update failed:', directUpdateError);
            updateResult = { success: false, error: directUpdateError.message };
          }
        }

        if (updateResult.success) {
          actionCenterGroup.log('✅ Action updated successfully');
          showSuccess('Action report updated successfully!');
          await fetchAllActionData(); // Refresh data
          setShowEditModal(false);
          setSelectedAction(null);
        } else {
          actionCenterGroup.error('❌ Failed to update action:', updateResult.error);
          alert('Failed to update action: ' + updateResult.error);
        }
      } else {
        // Add new action
        actionCenterGroup.log('➕ Adding new action report');
        const result = await addActionReport(formData);
        if (result.success) {
          actionCenterGroup.log('✅ Action added successfully');
          showSuccess('Action report added successfully!');
          await fetchAllActionData(); // Refresh data
          setShowAddModal(false);
        } else {
          actionCenterGroup.error('❌ Failed to add action:', result.error);
          alert('Failed to add action: ' + result.error);
        }
      }
    } catch (error) {
      actionCenterGroup.error('❌ Error saving action:', error);
      alert('Error saving action: ' + error.message);
    } finally {
      setLoading(false);
      actionCenterGroup.end();
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedAction) return;
    
    const actionCenterGroup = createSectionGroup(CONSOLE_GROUPS.ACTION_CENTER, false);
    
    try {
      setLoading(true);
      actionCenterGroup.log('🗑️ Starting action deletion process');
      actionCenterGroup.log('📋 Selected action details:', {
        id: selectedAction.id,
        sourceCollection: selectedAction.sourceCollection,
        sourceDocument: selectedAction.sourceDocument,
        sourceType: selectedAction.sourceType,
        reportIndex: selectedAction.reportIndex
      });

      let deleteResult = { success: false, error: 'Unknown error' };

      // Handle different data structures based on source type
      if (selectedAction.sourceType === 'month-based' && selectedAction.sourceCollection === 'actionReports') {
        // Month-based structure - use the existing deleteActionReport function
        const monthKey = selectedAction.sourceDocument; // sourceDocument is the monthKey
        actionCenterGroup.log('📅 Attempting month-based deletion with monthKey:', monthKey);
        deleteResult = await deleteActionReport(selectedAction.id, monthKey);
      } else if (selectedAction.sourceType === 'individual' && selectedAction.sourceCollection === 'actionReports') {
        // Individual document structure - use the existing deleteActionReport function
        actionCenterGroup.log('📄 Attempting individual document deletion');
        deleteResult = await deleteActionReport(selectedAction.id, null);
      } else {
        // For other collection types, try direct document deletion
        actionCenterGroup.log('🔄 Attempting direct document deletion from collection:', selectedAction.sourceCollection);
        try {
          if (selectedAction.sourceType === 'actions-array' || selectedAction.sourceType === 'reports-array') {
            // Handle array-based structures - need to update the parent document
            actionCenterGroup.log('📋 Handling array-based deletion');
            const docRef = doc(db, selectedAction.sourceCollection, selectedAction.sourceDocument);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
              const docData = docSnap.data();
              let arrayField = null;
              let updatedArray = null;
              
              if (selectedAction.sourceType === 'actions-array' && docData.actions) {
                arrayField = 'actions';
                updatedArray = docData.actions.filter((_, index) => index !== selectedAction.reportIndex);
              } else if (selectedAction.sourceType === 'reports-array' && docData.reports) {
                arrayField = 'reports';
                updatedArray = docData.reports.filter((_, index) => index !== selectedAction.reportIndex);
              } else if (docData.data && Array.isArray(docData.data)) {
                arrayField = 'data';
                updatedArray = docData.data.filter((_, index) => index !== selectedAction.reportIndex);
              }
              
              if (arrayField && updatedArray !== null) {
                await updateDoc(docRef, {
                  [arrayField]: updatedArray,
                  lastUpdated: new Date().toISOString(),
                  updatedBy: user?.email || 'system'
                });
                deleteResult = { success: true };
                actionCenterGroup.log('✅ Array-based deletion successful');
              } else {
                deleteResult = { success: false, error: 'Could not find array field to update' };
              }
            } else {
              deleteResult = { success: false, error: 'Parent document not found' };
            }
          } else {
            // Try direct document deletion
            const docRef = doc(db, selectedAction.sourceCollection, selectedAction.id);
            await deleteDoc(docRef);
            deleteResult = { success: true };
            actionCenterGroup.log('✅ Direct document deletion successful');
          }
        } catch (directDeleteError) {
          actionCenterGroup.error('❌ Direct deletion failed:', directDeleteError);
          deleteResult = { success: false, error: directDeleteError.message };
        }
      }

      if (deleteResult.success) {
        actionCenterGroup.log('✅ Action deleted successfully');
        showSuccess('Action report deleted successfully!');
        await fetchAllActionData(); // Refresh data
        setShowDeleteModal(false);
        setSelectedAction(null);
      } else {
        actionCenterGroup.error('❌ Failed to delete action:', deleteResult.error);
        alert('Failed to delete action: ' + deleteResult.error);
      }
    } catch (error) {
      actionCenterGroup.error('❌ Error deleting action:', error);
      alert('Error deleting action: ' + error.message);
    } finally {
      setLoading(false);
      actionCenterGroup.end();
    }
  };

  const handleExportPDF = () => {
    // Create a simple text-based report
    const reportData = filteredItems.map(item => ({
      Department: item.department,
      Municipality: item.municipality,
      District: item.district,
      What: item.what,
      When: formatDate(item.when),
      Where: item.where,
      'Action Taken': item.actionTaken
    }));

    // Convert to CSV format for download
    const headers = Object.keys(reportData[0] || {});
    const csvContent = [
      headers.join(','),
      ...reportData.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `action-center-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    actionCenterLog('📄 Report exported successfully');
    showSuccess('Report exported successfully!');
  };


  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Layout onLogout={onLogout} onNavigate={onNavigate} currentPage={currentPage}>
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">Action Center</h1>
              {!isAdmin && (userDepartment === 'agriculture' || userDepartment === 'pg-enro') && (
                <Badge 
                  variant="secondary" 
                  className={`${
                    userDepartment === 'agriculture' 
                      ? 'bg-green-100 text-green-800 border-green-200' 
                      : 'bg-blue-100 text-blue-800 border-blue-200'
                  } font-semibold`}
                >
                  {userDepartment === 'agriculture' ? 'Agriculture Dept.' : 'PG-ENRO Dept.'}
                </Badge>
              )}
            </div>
            <p className="text-gray-500 mt-2">
              {!isAdmin && (userDepartment === 'agriculture' || userDepartment === 'pg-enro') 
                ? `Manage and track ${userDepartment === 'agriculture' ? 'agriculture' : 'environmental'} action reports`
                : 'Manage and track action reports with comprehensive analytics'
              }
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* View Options Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="bg-black hover:bg-gray-800 text-white px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                >
                  <Menu className="w-5 h-5" />
                  <span className="text-sm font-medium">View Options</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 bg-white border border-gray-200 shadow-lg rounded-lg" align="end" sideOffset={5}>
                <DropdownMenuLabel>Action Management</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={handleAddNewAction}
                  className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black"
                >
                  <Plus className="w-4 h-4 text-black" />
                  <span>Add New Action</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowMonthlyBreakdownModal(true)}
                  className="flex items-center gap-3 cursor-pointer hover:bg-purple-50 hover:text-purple-700 focus:bg-purple-50 focus:text-purple-700"
                >
                  <Database className="w-4 h-4 text-black" />
                  <span>Department Breakdown</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Data Management</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={handleExportPDF}
                  className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black"
                >
                  <Download className="w-4 h-4 text-black" />
                  <span>Export to PDF</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => showSuccess('Export feature coming soon!')}
                  className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black"
                >
                  <Download className="w-4 h-4 text-black" />
                  <span>Export Report</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleImportExcel}
                  className="flex items-center gap-3 cursor-pointer hover:bg-green-50 hover:text-green-700 focus:bg-green-50 focus:text-green-700"
                >
                  <Download className="w-4 h-4 text-green-600" />
                  <span>Import Excel/CSV</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Quick Stats */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${
          isAdmin || (!userDepartment || (userDepartment !== 'agriculture' && userDepartment !== 'pg-enro'))
            ? 'lg:grid-cols-5' 
            : 'lg:grid-cols-2'
        }`}>
          {/* Total Actions Card - Always shown */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Total Actions</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {totalActions.toLocaleString()}
                  </p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Department-specific card for Agriculture and PG-ENRO users */}
          {!isAdmin && (userDepartment === 'agriculture' || userDepartment === 'pg-enro') ? (
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      {userDepartment === 'agriculture' ? 'Agriculture (Bantay Dagat)' : 'PG-Enro (Environment)'}
                    </p>
                    <p className={`text-2xl font-bold ${
                      userDepartment === 'agriculture' ? 'text-green-600' : 'text-emerald-600'
                    }`}>
                      {(userDepartment === 'agriculture' ? agricultureActions : pgEnroActions).toLocaleString()}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${
                    userDepartment === 'agriculture' ? 'bg-green-100' : 'bg-emerald-100'
                  }`}>
                    {userDepartment === 'agriculture' ? (
                      <Fish className="w-6 h-6 text-green-600" />
                    ) : (
                      <Trees className="w-6 h-6 text-emerald-600" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Show all cards for admin and other users */
            <>
              <Card className="bg-white shadow-sm border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">PNP (Monthly)</p>
                      <p className="text-2xl font-bold text-red-600">
                        {pnpActions.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Shield className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Agriculture (Bantay Dagat)</p>
                      <p className="text-2xl font-bold text-green-600">
                        {agricultureActions.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Fish className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">PG-Enro (Environment)</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        {pgEnroActions.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <Trees className="w-6 h-6 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Pending</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {pendingActions.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Clock className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

        </div>

        {/* Monthly Department Breakdown Modal */}
        <Dialog open={showMonthlyBreakdownModal} onOpenChange={setShowMonthlyBreakdownModal}>
          <DialogContent className="max-w-[90vw] w-full max-h-[90vh] overflow-y-auto bg-white border shadow-lg">
            <DialogHeader className="pb-4 border-b">
              <DialogTitle className="text-xl font-bold">Monthly Department Breakdown</DialogTitle>
              <DialogDescription>
                Actions count per month by department for the current year
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Month</TableHead>
                    <TableHead className="text-center font-semibold">PNP</TableHead>
                    <TableHead className="text-center font-semibold">Agriculture</TableHead>
                    <TableHead className="text-center font-semibold">PG-ENRO</TableHead>
                    <TableHead className="text-center font-semibold">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyData.map((data, index) => {
                    const isCurrentMonth = data.monthIndex === new Date().getMonth();
                    return (
                      <TableRow 
                        key={data.month} 
                        className={isCurrentMonth ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}
                      >
                        <TableCell className="font-medium">
                          {data.month}
                          {isCurrentMonth && (
                            <Badge variant="default" className="ml-2 bg-blue-600">
                              Current
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="bg-blue-600 text-white">
                            {data.pnp}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="bg-green-600 text-white">
                            {data.agriculture}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="bg-emerald-600 text-white">
                            {data.pgEnro}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="bg-gray-700 text-white">
                            {data.total}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  
                  {/* Summary Row */}
                  <TableRow className="bg-gray-50 border-t-2">
                    <TableCell className="font-bold">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        Total (Year)
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-blue-700 text-white font-bold">
                        {monthlyData.reduce((sum, data) => sum + data.pnp, 0)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-green-700 text-white font-bold">
                        {monthlyData.reduce((sum, data) => sum + data.agriculture, 0)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-emerald-700 text-white font-bold">
                        {monthlyData.reduce((sum, data) => sum + data.pgEnro, 0)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-gray-800 text-white font-bold">
                        {monthlyData.reduce((sum, data) => sum + data.total, 0)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>

        {/* Report Filters */}
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              {/* Header Section */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Filter className="w-4 h-4 text-black" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Report Filters</h3>
                  <p className="text-sm text-gray-500">Refine your action data</p>
                </div>
              </div>
              
              {/* Filters Section */}
              <div className="flex flex-col sm:flex-row items-end gap-4 w-full lg:w-auto">
                {/* Search Filter */}
                <div className="flex flex-col gap-2 w-full sm:w-[240px]">
                  <Label htmlFor="search" className="text-sm font-medium text-gray-700">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search actions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                {/* Month Filter */}
                <div className="flex flex-col gap-2 w-full sm:w-[160px]">
                  <Label htmlFor="month-filter" className="text-sm font-medium text-gray-700">Month</Label>
                  <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(value === 'all' ? 'all' : parseInt(value))}>
                    <SelectTrigger id="month-filter">
                      <SelectValue placeholder="All Months" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Months</SelectItem>
                      {[
                        'January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'
                      ].map((month, index) => (
                        <SelectItem key={month} value={index.toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Department Filter */}
                <div className="flex flex-col gap-2 w-full sm:w-[180px]">
                  <Label htmlFor="department-filter" className="text-sm font-medium text-gray-700">Department</Label>
                  <Select 
                    value={activeTab} 
                    onValueChange={setActiveTab}
                    disabled={!isAdmin && (userDepartment === 'agriculture' || userDepartment === 'pg-enro')}
                  >
                    <SelectTrigger id="department-filter">
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                      {isAdmin ? (
                        <>
                          <SelectItem value="all">All Departments</SelectItem>
                          <SelectItem value="pnp">PNP</SelectItem>
                          <SelectItem value="agriculture">Agriculture</SelectItem>
                          <SelectItem value="pg-enro">PG-ENRO</SelectItem>
                        </>
                      ) : userDepartment === 'agriculture' ? (
                        <SelectItem value="agriculture">Agriculture</SelectItem>
                      ) : userDepartment === 'pg-enro' ? (
                        <SelectItem value="pg-enro">PG-ENRO</SelectItem>
                      ) : (
                        <>
                          <SelectItem value="all">All Departments</SelectItem>
                          <SelectItem value="pnp">PNP</SelectItem>
                          <SelectItem value="agriculture">Agriculture</SelectItem>
                          <SelectItem value="pg-enro">PG-ENRO</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* District Filter */}
                <div className="flex flex-col gap-2 w-full sm:w-[180px]">
                  <Label htmlFor="district-filter" className="text-sm font-medium text-gray-700">District</Label>
                  <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                    <SelectTrigger id="district-filter">
                      <SelectValue placeholder="All Districts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Districts</SelectItem>
                      <SelectItem value="1ST DISTRICT">1st District</SelectItem>
                      <SelectItem value="2ND DISTRICT">2nd District</SelectItem>
                      <SelectItem value="3RD DISTRICT">3rd District</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Municipality Filter */}
                <div className="flex flex-col gap-2 w-full sm:w-[180px]">
                  <Label htmlFor="municipality-filter" className="text-sm font-medium text-gray-700">Municipality</Label>
                  <Select value={activeMunicipality} onValueChange={setActiveMunicipality}>
                    <SelectTrigger id="municipality-filter">
                      <SelectValue placeholder="All Municipalities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Municipalities</SelectItem>
                      {Object.values(municipalitiesByDistrict).flat().map((municipality) => (
                        <SelectItem key={municipality} value={municipality}>
                          {municipality}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Clear Filters Button */}
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedDistrict("all");
                      setSelectedMonth(new Date().getMonth());
                      setSelectedYear("all");
                      setActiveMunicipality("all");
                      setActiveTab("all");
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-md transition-colors duration-200"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions Table */}
        <div className="border rounded-md border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto" style={{paddingBottom: '8px', marginBottom: '-8px', paddingRight: '8px', marginRight: '-8px'}}>
            <Table className="border-gray-200 w-full">
              <TableCaption className="text-slate-500">Action reports and their current status.</TableCaption>
              <TableHeader>
                <TableRow className="border-b border-gray-200 table-header-spacing">
                  <TableHead className="min-w-[120px] border-gray-200 align-top py-3 px-2 break-words whitespace-normal font-semibold text-center text-xs">Department</TableHead>
                  <TableHead className="min-w-[120px] border-gray-200 align-top py-3 px-2 break-words whitespace-normal font-semibold text-center text-xs">Municipality</TableHead>
                  <TableHead className="min-w-[100px] border-gray-200 align-top py-3 px-2 break-words whitespace-normal font-semibold text-center text-xs">District</TableHead>
                  <TableHead className="min-w-[200px] border-gray-200 align-top py-3 px-2 break-words whitespace-normal font-semibold text-center text-xs">What</TableHead>
                  <TableHead className="min-w-[100px] border-gray-200 align-top py-3 px-2 break-words whitespace-normal font-semibold text-center text-xs">When</TableHead>
                  <TableHead className="min-w-[150px] border-gray-200 align-top py-3 px-2 break-words whitespace-normal font-semibold text-center text-xs">Where</TableHead>
                  <TableHead className="min-w-[120px] border-gray-200 align-top py-3 px-2 break-words whitespace-normal font-semibold text-center text-xs table-cell-spacing">Action Taken</TableHead>
                  <TableHead className="min-w-[100px] border-gray-200 align-top py-3 px-2 break-words whitespace-normal font-semibold text-center text-xs table-cell-spacing">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="p-8 text-center align-middle">
                      <div className="text-lg text-gray-500">
                        <div className="flex items-center justify-center gap-2">
                          <RotateCcw className="w-5 h-5 animate-spin" />
                          <span>Loading action reports...</span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="p-8 text-center align-middle">
                      <div className="text-lg text-gray-500">
                        {actionItems.length === 0 ? (
                          <div>
                            <p className="mb-2">No action reports found in database.</p>
                            <p className="text-sm">Click "Add New Action" to create your first action report.</p>
                          </div>
                        ) : (
                          <div>
                            <p className="mb-2">No actions match your current filters.</p>
                            <p className="text-sm">Try adjusting your search terms or filters.</p>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  currentItems.map((item, index) => (
                    <TableRow key={item.id || index} className="border-gray-200 hover:bg-gray-50/50">
                      <TableCell className="font-medium break-all align-top whitespace-normal text-center">
                        <div className="py-2 px-1 min-w-0 text-center">
                          <p className="text-gray-900 text-xs leading-tight break-words hyphens-auto word-wrap text-center">
                            {item.department?.toUpperCase() || 'N/A'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="break-all align-top whitespace-normal text-center">
                        <div className="py-2 px-1 min-w-0 text-center">
                          <p className="text-gray-900 text-xs leading-relaxed break-words hyphens-auto word-wrap text-center">
                            {item.municipality || 'N/A'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="break-all align-top whitespace-normal text-center">
                        <div className="py-2 px-1 min-w-0 text-center">
                          <p className="text-gray-900 text-xs break-words hyphens-auto word-wrap text-center">
                            {item.district || 'N/A'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="break-all align-top whitespace-normal text-center">
                        <div className="py-2 px-1 min-w-0 text-center">
                          <p className="text-gray-900 text-xs leading-tight break-words hyphens-auto word-wrap text-center">
                            {item.what || 'N/A'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="break-all align-top whitespace-normal text-center">
                        <div className="py-2 px-1 min-w-0 text-center">
                          <p className="text-gray-900 text-xs break-words hyphens-auto word-wrap text-center">
                            {formatDate(item.when)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="break-all align-top whitespace-normal text-center">
                        <div className="py-2 px-1 min-w-0 text-center">
                          <p className="text-gray-900 text-xs leading-tight break-words hyphens-auto word-wrap text-center">
                            {item.where || 'N/A'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="break-all align-top whitespace-normal text-center table-cell-spacing">
                        <div className="py-2 px-1 min-w-0 text-center">
                          <span 
                            className={`inline-flex items-center px-2 py-1 text-xs font-medium break-words hyphens-auto word-wrap whitespace-normal ${
                              item.actionTaken && item.actionTaken.toLowerCase().includes('arrested') ? 'bg-red-100 text-red-800 border border-red-200' :
                              item.actionTaken === 'Pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                              'bg-gray-100 text-gray-800 border border-gray-200'
                            }`}
                          >
                            {item.actionTaken || 'Pending'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="break-all align-top whitespace-normal text-center table-cell-spacing">
                        <div className="py-2 px-1 min-w-0 flex items-center justify-center gap-1 text-center">
                          <button
                            onClick={() => handleAction(item.id, 'view')}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200"
                            title="View"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleAction(item.id, 'edit')}
                            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors duration-200"
                            title="Edit"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleAction(item.id, 'delete')}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        
        {/* Pagination Controls */}
        {filteredItems.length > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-white border-t border-gray-200">
            {/* Items per page selector */}
            <div className="flex items-center gap-2">
              <label htmlFor="itemsPerPage" className="text-sm font-medium text-gray-700">
                Show:
              </label>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                setItemsPerPage(parseInt(value));
                setTablePage(1);
              }}>
                <SelectTrigger id="itemsPerPage" className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-700">entries</span>
            </div>
            
            {/* Pagination info */}
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredItems.length)} of {filteredItems.length} entries
            </div>
            
            {/* Pagination buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={prevPage}
                disabled={tablePage === 1}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {(() => {
                  const pages = [];
                  const maxVisiblePages = 5;
                  
                  if (totalPages <= maxVisiblePages) {
                    // Show all pages if total is 5 or less
                    for (let i = 1; i <= totalPages; i++) {
                      pages.push(i);
                    }
                  } else {
                    // Always show first page
                    pages.push(1);
                    
                    let startPage, endPage;
                    
                    if (tablePage <= 3) {
                      // Near the beginning
                      startPage = 2;
                      endPage = 4;
                    } else if (tablePage >= totalPages - 2) {
                      // Near the end
                      startPage = totalPages - 3;
                      endPage = totalPages - 1;
                    } else {
                      // In the middle
                      startPage = tablePage - 1;
                      endPage = tablePage + 1;
                    }
                    
                    // Add ellipsis if there's a gap after first page
                    if (startPage > 2) {
                      pages.push('ellipsis1');
                    }
                    
                    // Add middle pages
                    for (let i = startPage; i <= endPage; i++) {
                      if (i > 1 && i < totalPages) {
                        pages.push(i);
                      }
                    }
                    
                    // Add ellipsis if there's a gap before last page
                    if (endPage < totalPages - 1) {
                      pages.push('ellipsis2');
                    }
                    
                    // Always show last page (if more than 1 page)
                    if (totalPages > 1) {
                      pages.push(totalPages);
                    }
                  }
                  
                  return pages.map((page, index) => {
                    if (typeof page === 'string') {
                      // Render ellipsis
                      return (
                        <span key={page} className="px-2 text-gray-400">
                          ...
                        </span>
                      );
                    }
                    
                    // Render page button
                    return (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${
                          tablePage === page
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  });
                })()}
              </div>
              
              <button
                onClick={nextPage}
                disabled={tablePage === totalPages}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add New Action Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-auto transform transition-all duration-300 scale-100 animate-in fade-in-0 zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Plus className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Add New Action Report</h3>
                  <p className="text-sm text-gray-500">Create a new action report with department-specific details</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Basic Information Section */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Basic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-sm font-medium text-gray-700">Department *</Label>
                    <Select 
                      value={formData.department} 
                      onValueChange={(value) => setFormData({...formData, department: value})}
                      disabled={!isAdmin && (userDepartment === 'agriculture' || userDepartment === 'pg-enro')}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {isAdmin ? (
                          <>
                            <SelectItem value="pnp">PNP</SelectItem>
                            <SelectItem value="agriculture">Agriculture</SelectItem>
                            <SelectItem value="pg-enro">PG-ENRO</SelectItem>
                          </>
                        ) : userDepartment === 'agriculture' ? (
                          <SelectItem value="agriculture">Agriculture</SelectItem>
                        ) : userDepartment === 'pg-enro' ? (
                          <SelectItem value="pg-enro">PG-ENRO</SelectItem>
                        ) : (
                          <>
                            <SelectItem value="pnp">PNP</SelectItem>
                            <SelectItem value="agriculture">Agriculture</SelectItem>
                            <SelectItem value="pg-enro">PG-ENRO</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="municipality" className="text-sm font-medium text-gray-700">Municipality *</Label>
                    <Input
                      id="municipality"
                      value={formData.municipality}
                      onChange={(e) => handleMunicipalityChange(e.target.value)}
                      placeholder="Enter municipality (district will auto-detect)"
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="district" className="text-sm font-medium text-gray-700">District *</Label>
                    <Select value={formData.district} onValueChange={(value) => setFormData({...formData, district: value})}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select District" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1ST DISTRICT">1st District</SelectItem>
                        <SelectItem value="2ND DISTRICT">2nd District</SelectItem>
                        <SelectItem value="3RD DISTRICT">3rd District</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="when" className="text-sm font-medium text-gray-700">When (Date) *</Label>
                    <Input
                      id="when"
                      type="date"
                      value={formData.when}
                      onChange={(e) => setFormData({...formData, when: e.target.value})}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Incident Details Section */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Incident Details
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="what" className="text-sm font-medium text-gray-700">What (Action Description) *</Label>
                    <Textarea
                      id="what"
                      value={formData.what}
                      onChange={(e) => setFormData({...formData, what: e.target.value})}
                      placeholder="Describe the action taken in detail"
                      className="w-full min-h-[80px]"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="where" className="text-sm font-medium text-gray-700">Where (Location) *</Label>
                    <Input
                      id="where"
                      value={formData.where}
                      onChange={(e) => setFormData({...formData, where: e.target.value})}
                      placeholder="Enter specific location"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* PNP Specific Fields */}
              {formData.department === 'pnp' && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="text-md font-semibold text-red-800 mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    PNP Specific Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="who" className="text-sm font-medium text-gray-700">Who (Person/s Involved)</Label>
                      <Input
                        id="who"
                        value={formData.who}
                        onChange={(e) => setFormData({...formData, who: e.target.value})}
                        placeholder="Names of persons involved"
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="gender" className="text-sm font-medium text-gray-700">Gender</Label>
                      <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value})}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Multiple">Multiple</SelectItem>
                          <SelectItem value="Unknown">Unknown</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="why" className="text-sm font-medium text-gray-700">Why (Reason/Motive)</Label>
                      <Textarea
                        id="why"
                        value={formData.why}
                        onChange={(e) => setFormData({...formData, why: e.target.value})}
                        placeholder="Reason or motive for the incident"
                        className="w-full min-h-[60px]"
                        rows={2}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="how" className="text-sm font-medium text-gray-700">How (Method/Manner)</Label>
                      <Textarea
                        id="how"
                        value={formData.how}
                        onChange={(e) => setFormData({...formData, how: e.target.value})}
                        placeholder="How the incident occurred or was handled"
                        className="w-full min-h-[60px]"
                        rows={2}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="source" className="text-sm font-medium text-gray-700">Source</Label>
                      <Input
                        id="source"
                        value={formData.source}
                        onChange={(e) => setFormData({...formData, source: e.target.value})}
                        placeholder="Information source (e.g., witness, report, etc.)"
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Agriculture Specific Fields */}
              {formData.department === 'agriculture' && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="text-md font-semibold text-green-800 mb-4 flex items-center gap-2">
                    <Fish className="w-4 h-4" />
                    Agriculture Department Information
                  </h4>
                  <p className="text-sm text-green-700 mb-4">Additional information specific to agriculture and fisheries activities</p>
                </div>
              )}

              {/* PG-ENRO Specific Fields */}
              {formData.department === 'pg-enro' && (
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                  <h4 className="text-md font-semibold text-emerald-800 mb-4 flex items-center gap-2">
                    <Trees className="w-4 h-4" />
                    PG-ENRO Information
                  </h4>
                  <p className="text-sm text-emerald-700 mb-4">Additional information specific to environmental protection activities</p>
                </div>
              )}

              {/* Common Additional Information Section */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Additional Information
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="actionTaken" className="text-sm font-medium text-gray-700">Action Taken/Status *</Label>
                    <Select value={formData.actionTaken} onValueChange={(value) => setFormData({...formData, actionTaken: value})}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Resolved">Resolved</SelectItem>
                        <SelectItem value="Arrested">Arrested</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="otherInformation" className="text-sm font-medium text-gray-700">Other Information</Label>
                    <Textarea
                      id="otherInformation"
                      value={formData.otherInformation}
                      onChange={(e) => setFormData({...formData, otherInformation: e.target.value})}
                      placeholder="Any additional relevant information, notes, or observations"
                      className="w-full min-h-[80px]"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="photos" className="text-sm font-medium text-gray-700">Photos/Evidence</Label>
                    <Input
                      id="photos"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setFormData({...formData, photos: files});
                      }}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">Upload photos or evidence related to this action report</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowAddModal(false)} 
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveAction} 
                disabled={loading} 
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <>
                    <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Save Action Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Action Modal */}
      {showViewModal && selectedAction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-auto transform transition-all duration-300 scale-100 animate-in fade-in-0 zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">View Action Report</h3>
                  <p className="text-sm text-gray-500">Detailed information about the selected action report</p>
                </div>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Basic Information Section */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Basic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-white rounded-lg border border-gray-100">
                    <Label className="text-sm font-medium text-gray-600">Department</Label>
                    <p className="text-base font-semibold text-gray-900 mt-1">
                      {selectedAction.department?.toUpperCase() || 'N/A'}
                    </p>
                  </div>
                  
                  <div className="p-3 bg-white rounded-lg border border-gray-100">
                    <Label className="text-sm font-medium text-gray-600">Municipality</Label>
                    <p className="text-base font-semibold text-gray-900 mt-1">
                      {selectedAction.municipality || 'N/A'}
                    </p>
                  </div>
                  
                  <div className="p-3 bg-white rounded-lg border border-gray-100">
                    <Label className="text-sm font-medium text-gray-600">District</Label>
                    <p className="text-base font-semibold text-gray-900 mt-1">
                      {selectedAction.district || 'N/A'}
                    </p>
                  </div>
                  
                  <div className="p-3 bg-white rounded-lg border border-gray-100">
                    <Label className="text-sm font-medium text-gray-600">Date</Label>
                    <p className="text-base font-semibold text-gray-900 mt-1">
                      {formatDate(selectedAction.when)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Incident Details Section */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Incident Details
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-3 bg-white rounded-lg border border-gray-100">
                    <Label className="text-sm font-medium text-gray-600">What (Action Description)</Label>
                    <p className="text-sm text-gray-900 mt-2 leading-relaxed">
                      {selectedAction.what || 'N/A'}
                    </p>
                  </div>
                  
                  <div className="p-3 bg-white rounded-lg border border-gray-100">
                    <Label className="text-sm font-medium text-gray-600">Where (Location)</Label>
                    <p className="text-sm text-gray-900 mt-2 leading-relaxed">
                      {selectedAction.where || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* PNP Specific Information */}
              {selectedAction.department === 'pnp' && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="text-md font-semibold text-red-800 mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    PNP Specific Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedAction.who && (
                      <div className="p-3 bg-white rounded-lg border border-red-100">
                        <Label className="text-sm font-medium text-gray-600">Who (Person/s Involved)</Label>
                        <p className="text-sm text-gray-900 mt-2">
                          {selectedAction.who}
                        </p>
                      </div>
                    )}
                    
                    {selectedAction.gender && (
                      <div className="p-3 bg-white rounded-lg border border-red-100">
                        <Label className="text-sm font-medium text-gray-600">Gender</Label>
                        <p className="text-sm text-gray-900 mt-2">
                          {selectedAction.gender}
                        </p>
                      </div>
                    )}
                    
                    {selectedAction.why && (
                      <div className="p-3 bg-white rounded-lg border border-red-100">
                        <Label className="text-sm font-medium text-gray-600">Why (Reason/Motive)</Label>
                        <p className="text-sm text-gray-900 mt-2 leading-relaxed">
                          {selectedAction.why}
                        </p>
                      </div>
                    )}
                    
                    {selectedAction.how && (
                      <div className="p-3 bg-white rounded-lg border border-red-100">
                        <Label className="text-sm font-medium text-gray-600">How (Method/Manner)</Label>
                        <p className="text-sm text-gray-900 mt-2 leading-relaxed">
                          {selectedAction.how}
                        </p>
                      </div>
                    )}
                    
                    {selectedAction.source && (
                      <div className="p-3 bg-white rounded-lg border border-red-100 md:col-span-2">
                        <Label className="text-sm font-medium text-gray-600">Source</Label>
                        <p className="text-sm text-gray-900 mt-2">
                          {selectedAction.source}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Agriculture Specific Information */}
              {selectedAction.department === 'agriculture' && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="text-md font-semibold text-green-800 mb-4 flex items-center gap-2">
                    <Fish className="w-4 h-4" />
                    Agriculture Department Information
                  </h4>
                  <p className="text-sm text-green-700">Agriculture and fisheries related action report</p>
                </div>
              )}

              {/* PG-ENRO Specific Information */}
              {selectedAction.department === 'pg-enro' && (
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                  <h4 className="text-md font-semibold text-emerald-800 mb-4 flex items-center gap-2">
                    <Trees className="w-4 h-4" />
                    PG-ENRO Information
                  </h4>
                  <p className="text-sm text-emerald-700">Environmental protection related action report</p>
                </div>
              )}

              {/* Additional Information Section */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Additional Information
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-3 bg-white rounded-lg border border-gray-100">
                    <Label className="text-sm font-medium text-gray-600">Action Taken/Status</Label>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-full ${
                        selectedAction.actionTaken && selectedAction.actionTaken.toLowerCase().includes('arrested') 
                          ? 'bg-red-100 text-red-800 border border-red-200' :
                        selectedAction.actionTaken === 'Pending' 
                          ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                        selectedAction.actionTaken === 'In Progress'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                          'bg-green-100 text-green-800 border border-green-200'
                      }`}>
                        {selectedAction.actionTaken || 'Pending'}
                      </span>
                    </div>
                  </div>
                  
                  {selectedAction.otherInformation && (
                    <div className="p-3 bg-white rounded-lg border border-gray-100">
                      <Label className="text-sm font-medium text-gray-600">Other Information</Label>
                      <p className="text-sm text-gray-900 mt-2 leading-relaxed">
                        {selectedAction.otherInformation}
                      </p>
                    </div>
                  )}
                  
                  {selectedAction.photos && selectedAction.photos.length > 0 && (
                    <div className="p-3 bg-white rounded-lg border border-gray-100">
                      <Label className="text-sm font-medium text-gray-600">Photos/Evidence</Label>
                      <p className="text-sm text-gray-500 mt-2">
                        {selectedAction.photos.length} file(s) attached
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-6 border-t border-gray-200">
              <Button 
                onClick={() => setShowViewModal(false)} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors duration-200"
              >
                <X className="w-4 h-4 mr-2" />
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Action Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-auto transform transition-all duration-300 scale-100 animate-in fade-in-0 zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Edit className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Edit Action Report</h3>
                  <p className="text-sm text-gray-500">Update the details of the selected action report</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Basic Information Section */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Basic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-department" className="text-sm font-medium text-gray-700">Department *</Label>
                    <Select value={formData.department} onValueChange={(value) => setFormData({...formData, department: value})}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pnp">PNP</SelectItem>
                        <SelectItem value="agriculture">Agriculture</SelectItem>
                        <SelectItem value="pg-enro">PG-ENRO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-municipality" className="text-sm font-medium text-gray-700">Municipality *</Label>
                    <Input
                      id="edit-municipality"
                      value={formData.municipality}
                      onChange={(e) => handleMunicipalityChange(e.target.value)}
                      placeholder="Enter municipality (district will auto-detect)"
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-district" className="text-sm font-medium text-gray-700">District *</Label>
                    <Select value={formData.district} onValueChange={(value) => setFormData({...formData, district: value})}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select District" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1ST DISTRICT">1st District</SelectItem>
                        <SelectItem value="2ND DISTRICT">2nd District</SelectItem>
                        <SelectItem value="3RD DISTRICT">3rd District</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-when" className="text-sm font-medium text-gray-700">When (Date) *</Label>
                    <Input
                      id="edit-when"
                      type="date"
                      value={formData.when}
                      onChange={(e) => setFormData({...formData, when: e.target.value})}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Incident Details Section */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Incident Details
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-what" className="text-sm font-medium text-gray-700">What (Action Description) *</Label>
                    <Textarea
                      id="edit-what"
                      value={formData.what}
                      onChange={(e) => setFormData({...formData, what: e.target.value})}
                      placeholder="Describe the action taken in detail"
                      className="w-full min-h-[80px]"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-where" className="text-sm font-medium text-gray-700">Where (Location) *</Label>
                    <Input
                      id="edit-where"
                      value={formData.where}
                      onChange={(e) => setFormData({...formData, where: e.target.value})}
                      placeholder="Enter specific location"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* PNP Specific Fields */}
              {formData.department === 'pnp' && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="text-md font-semibold text-red-800 mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    PNP Specific Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-who" className="text-sm font-medium text-gray-700">Who (Person/s Involved)</Label>
                      <Input
                        id="edit-who"
                        value={formData.who}
                        onChange={(e) => setFormData({...formData, who: e.target.value})}
                        placeholder="Names of persons involved"
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-gender" className="text-sm font-medium text-gray-700">Gender</Label>
                      <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value})}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Multiple">Multiple</SelectItem>
                          <SelectItem value="Unknown">Unknown</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-why" className="text-sm font-medium text-gray-700">Why (Reason/Motive)</Label>
                      <Textarea
                        id="edit-why"
                        value={formData.why}
                        onChange={(e) => setFormData({...formData, why: e.target.value})}
                        placeholder="Reason or motive for the incident"
                        className="w-full min-h-[60px]"
                        rows={2}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-how" className="text-sm font-medium text-gray-700">How (Method/Manner)</Label>
                      <Textarea
                        id="edit-how"
                        value={formData.how}
                        onChange={(e) => setFormData({...formData, how: e.target.value})}
                        placeholder="How the incident occurred or was handled"
                        className="w-full min-h-[60px]"
                        rows={2}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-source" className="text-sm font-medium text-gray-700">Source</Label>
                      <Input
                        id="edit-source"
                        value={formData.source}
                        onChange={(e) => setFormData({...formData, source: e.target.value})}
                        placeholder="Information source (e.g., witness, report, etc.)"
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Agriculture Specific Fields */}
              {formData.department === 'agriculture' && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="text-md font-semibold text-green-800 mb-4 flex items-center gap-2">
                    <Fish className="w-4 h-4" />
                    Agriculture Department Information
                  </h4>
                  <p className="text-sm text-green-700 mb-4">Additional information specific to agriculture and fisheries activities</p>
                </div>
              )}

              {/* PG-ENRO Specific Fields */}
              {formData.department === 'pg-enro' && (
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                  <h4 className="text-md font-semibold text-emerald-800 mb-4 flex items-center gap-2">
                    <Trees className="w-4 h-4" />
                    PG-ENRO Information
                  </h4>
                  <p className="text-sm text-emerald-700 mb-4">Additional information specific to environmental protection activities</p>
                </div>
              )}

              {/* Common Additional Information Section */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Additional Information
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-actionTaken" className="text-sm font-medium text-gray-700">Action Taken/Status *</Label>
                    <Select value={formData.actionTaken} onValueChange={(value) => setFormData({...formData, actionTaken: value})}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Resolved">Resolved</SelectItem>
                        <SelectItem value="Arrested">Arrested</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-otherInformation" className="text-sm font-medium text-gray-700">Other Information</Label>
                    <Textarea
                      id="edit-otherInformation"
                      value={formData.otherInformation}
                      onChange={(e) => setFormData({...formData, otherInformation: e.target.value})}
                      placeholder="Any additional relevant information, notes, or observations"
                      className="w-full min-h-[80px]"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-photos" className="text-sm font-medium text-gray-700">Photos/Evidence</Label>
                    <Input
                      id="edit-photos"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setFormData({...formData, photos: files});
                      }}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">Upload new photos or evidence (will replace existing files)</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowEditModal(false)} 
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveAction} 
                disabled={loading} 
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {loading ? (
                  <>
                    <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    Update Action Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {/* Import Department Selection Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Select Department</h3>
                <button
                  onClick={() => setShowImportDialog(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <p className="text-gray-600 mb-6">Choose which department the Excel/CSV file is for:</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleDepartmentSelection('pnp')}
                  className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                      <Shield className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">PNP (Philippine National Police)</h4>
                      <p className="text-sm text-gray-600">Law enforcement and security actions</p>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleDepartmentSelection('agriculture')}
                  className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                      <Fish className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Agriculture (Bantay Dagat)</h4>
                      <p className="text-sm text-gray-600">Fisheries and agricultural monitoring</p>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleDepartmentSelection('pg-enro')}
                  className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                      <Trees className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">PG-ENRO</h4>
                      <p className="text-sm text-gray-600">Environmental protection and natural resources</p>
                    </div>
                  </div>
                </button>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowImportDialog(false)}
                  className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && selectedAction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto transform transition-all duration-300 scale-100 animate-in fade-in-0 zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-600">Delete Action Report</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 mb-3 font-medium">
                  Are you sure you want to delete this action report?
                </p>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-red-700">Action:</span>
                    <span className="text-sm text-red-900 text-right flex-1 ml-2">{selectedAction.what}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-red-700">Location:</span>
                    <span className="text-sm text-red-900 text-right flex-1 ml-2">{selectedAction.where}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-red-700">Date:</span>
                    <span className="text-sm text-red-900 text-right flex-1 ml-2">{formatDate(selectedAction.when)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-red-700">Department:</span>
                    <span className="text-sm text-red-900 text-right flex-1 ml-2">{selectedAction.department?.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteModal(false)} 
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleConfirmDelete} 
                disabled={loading} 
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {loading ? (
                  <>
                    <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
      
      {/* Hidden file input for Excel import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".csv,.xlsx,.xls"
        style={{ display: 'none' }}
      />
    </Layout>
  );
}

import React, { useState, useEffect, useRef } from "react";
import Layout from "./Layout";
import { incidentsLog, createSectionGroup, CONSOLE_GROUPS } from './utils/consoleGrouping';
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "./components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";
import { Badge } from "./components/ui/badge";
import { 
  collection, 
  getDocs, 
  getDoc,
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc,
  writeBatch,
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';

import * as XLSX from 'xlsx';
import { jsPDF } from "jspdf";
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
  Eraser,
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
  MonitorSpeaker as MonitorSpeakerIcon,
  Menu
} from "lucide-react";
// Enhanced Tailwind utility classes for black and white theme
const enhancedClasses = {
  // Black and white gradient backgrounds
  gradientPrimary: 'bg-gradient-to-br from-black to-gray-800',
  gradientSecondary: 'bg-gradient-to-br from-gray-600 to-gray-800',
  gradientWarning: 'bg-gradient-to-br from-gray-500 to-gray-700',
  // Glass morphism effects
  glassEffect: 'backdrop-blur-md bg-white/10 border border-gray-200',
  glassEffectDark: 'backdrop-blur-md bg-black/10 border border-gray-300',
  // Enhanced shadows
  shadowGlow: 'shadow-lg shadow-blue-500/25',
  shadowGlowGreen: 'shadow-lg shadow-green-500/25',
  // Smooth animations
  hoverScale: 'hover:scale-105 transition-transform duration-300',
  hoverLift: 'hover:-translate-y-1 transition-transform duration-300',
  // Modern borders
  borderGradient: 'border-2 border-transparent bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-border',
};
export default function IncidentsReports({ onLogout, onNavigate, currentPage }) {
  const fileInputRef = useRef(null);
  // Function to automatically identify incident type from description
  const identifyIncidentType = (description) => {
    if (!description) return "Other";
    const desc = description.toLowerCase();
    // Traffic-related incidents
    if (desc.includes('speeding') || desc.includes('traffic violation') || desc.includes('traffic ticket') || desc.includes('traffic')) {
      return "Traffic Violation";
    }
    if (desc.includes('traffic accident') || desc.includes('car crash') || desc.includes('vehicle collision') || desc.includes('accident')) {
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
    if (desc.includes('theft') || desc.includes('stolen') || desc.includes('shoplifting') || desc.includes('nakaw')) {
      return "Theft";
    }
    if (desc.includes('vandalism') || desc.includes('graffiti') || desc.includes('property damage')) {
      return "Vandalism";
    }
    if (desc.includes('property damage') || desc.includes('damage to')) {
      return "Property Damage";
    }
    // Violent crimes
    if (desc.includes('assault') || desc.includes('attack') || desc.includes('physical altercation') || desc.includes('physical injury')) {
      return "Assault";
    }
    if (desc.includes('domestic violence') || desc.includes('domestic abuse')) {
      return "Domestic Violence";
    }
    if (desc.includes('harassment') || desc.includes('harassing')) {
      return "Harassment";
    }
    // Drug-related
    if (desc.includes('drug') || desc.includes('illegal drugs') || desc.includes('substance') || desc.includes('shabu') || desc.includes('marijuana')) {
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
    if (desc.includes('robbery') || desc.includes('armed robbery') || desc.includes('holdap')) {
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
    if (desc.includes('illegal gambling') || desc.includes('gambling') || desc.includes('sabong')) {
      return "Illegal Gambling";
    }
    if (desc.includes('illegal firearms') || desc.includes('illegal gun') || desc.includes('firearm')) {
      return "Illegal Firearms";
    }
    if (desc.includes('trespassing') || desc.includes('trespass')) {
      return "Trespassing";
    }
    if (desc.includes('migrant workers') || desc.includes('overseas filipino')) {
      return "Migrant Workers and Overseas Filipino";
    }
    // Police operations
    if (desc.includes('police operation') || desc.includes('buy bust') || desc.includes('buy-bust') || desc.includes('operation')) {
      return "Police Operation";
    }
    // Warrant arrests
    if (desc.includes('warrant') || desc.includes('arrest')) {
      return "Warrant Arrest";
    }
    return "Other";
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
    "3RD DISTRICT"
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
  const [loading, setLoading] = useState(false);
  const [firestoreStatus, setFirestoreStatus] = useState('connecting');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [viewingIncident, setViewingIncident] = useState(null);
  const [editingIncident, setEditingIncident] = useState(null);
  const [deletingIncident, setDeletingIncident] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDistrict, setFilterDistrict] = useState("all");
  const [filterMunicipality, setFilterMunicipality] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('en-US', { month: 'long' }));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  
  // Pagination state
  const [paginationPage, setPaginationPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  // PDF Edit Interface State
  const [showPdfEditModal, setShowPdfEditModal] = useState(false);
  const [showPdfPreviewModal, setShowPdfPreviewModal] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfReportData, setPdfReportData] = useState({
    memorandum: {
      for: 'The Provincial Director, Bataan Police Provincial Office',
      from: 'PGBxPNP - Crime Analyst',
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      subject: `Monthly Crime Analysis Report for ${selectedMonth === "all" ? "All Months" : selectedMonth} ${new Date().getFullYear()}`
    },
    customNotes: '',
    includeSections: {
      dataCleaning: true,
      summaryGeneration: true,
      trendAnalysis: true,
      rootCauses: true,
      recommendations: true,
      riskForecasting: true
    }
  });
  const [showCleanupDropdown, setShowCleanupDropdown] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionError, setConnectionError] = useState(null);
  const [newIncident, setNewIncident] = useState({
    incidentType: "",
    location: "",
    district: "1ST DISTRICT",
    municipality: "Abucay",
    date: "",
    time: "",
    description: "",
    status: "Active",
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
  // Firestore functions
  const loadIncidents = async () => {
    try {
      setLoading(true);
      setFirestoreStatus('connecting');
      setConnectionError(null);
      // Check if we're online before attempting to connect
      if (!navigator.onLine) {
        throw new Error('No internet connection');
      }
      const incidentsRef = collection(db, 'incidents');
      const querySnapshot = await getDocs(incidentsRef);
      const incidentsData = [];
      const seenIds = new Set();
      const duplicateIds = new Set();
      const documentsToDelete = [];
      // First pass: identify duplicates and collect documents to delete
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const incidentData = {
          ...data,
          legacyId: data?.id,
          id: doc.id
        };
        if (seenIds.has(incidentData.id)) {
          duplicateIds.add(incidentData.id);
          documentsToDelete.push(doc.ref);
          console.warn('⚠️ Found duplicate incident ID:', incidentData.id, '- will be automatically cleaned up');
        } else {
        seenIds.add(incidentData.id);
        }
      });
      // Second pass: collect clean data (excluding duplicates)
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const incidentData = {
          ...data,
          legacyId: data?.id,
          id: doc.id
        };
        // Only include non-duplicate incidents
        if (!duplicateIds.has(incidentData.id) || !seenIds.has(incidentData.id)) {
        // Clean the data when loading from Firestore
        const cleanedIncident = cleanIncidentData(incidentData);
        incidentsData.push(cleanedIncident);
        }
      });
      // Automatically clean up duplicates if any were found
      if (documentsToDelete.length > 0) {
        try {
          const batch = writeBatch(db);
          documentsToDelete.forEach(docRef => {
            batch.delete(docRef);
          });
          await batch.commit();
        } catch (cleanupError) {
          console.error('❌ Error during automatic duplicate cleanup:', cleanupError);
          console.warn('💡 Duplicates were detected but could not be automatically removed. Use manual cleanup options.');
        }
      }
      setIncidents(incidentsData);
      setFirestoreStatus('connected');
      if (duplicateIds.size > 0) {
      }
    } catch (error) {
      console.error('❌ Error loading incidents:', error);
      setFirestoreStatus('error');
      // Handle different types of errors
      if (error.message === 'No internet connection') {
        setConnectionError('No internet connection. Please check your network and try again.');
      } else if (error.code === 'unavailable' || error.code === 'failed-precondition') {
        setConnectionError('Database connection failed. Please check your internet connection.');
      } else if (error.code === 'permission-denied') {
        setConnectionError('Access denied. Please check your permissions.');
      } else {
        setConnectionError('Error loading incidents. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };
  const saveIncident = async (incidentData) => {
    try {
      setLoading(true);
      setFirestoreStatus('saving');
      const incidentsRef = collection(db, 'incidents');
      const docRef = await addDoc(incidentsRef, {
        ...incidentData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setFirestoreStatus('connected');
      return docRef.id;
    } catch (error) {
      console.error('❌ Error saving incident:', error);
      setFirestoreStatus('error');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  const updateIncident = async (incidentId, incidentData) => {
    try {
      setLoading(true);
      setFirestoreStatus('saving');
      const incidentRef = doc(db, 'incidents', incidentId);
      // Check if document exists before updating
      const docSnap = await getDoc(incidentRef);
      if (!docSnap.exists()) {
        console.warn('⚠️ Document not found, creating new one with auto-generated ID');
        // Create new document with auto-generated ID instead of using the old ID
        const incidentsRef = collection(db, 'incidents');
        const newDocRef = await addDoc(incidentsRef, {
          ...incidentData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        // Update existing document
        await updateDoc(incidentRef, {
          ...incidentData,
          updatedAt: new Date().toISOString()
        });
      }
      setFirestoreStatus('connected');
    } catch (error) {
      console.error('❌ Error updating incident:', error);
      setFirestoreStatus('error');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  const deleteIncident = async (incidentId) => {
    try {
      setLoading(true);
      setFirestoreStatus('saving');
      if (!incidentId) {
        throw new Error('Missing incident id');
      }

      // Allow callers to pass a Firestore DocumentReference directly
      const isDocRef = typeof incidentId === 'object' && incidentId !== null && typeof incidentId.path === 'string';
      const incidentRef = isDocRef ? incidentId : doc(db, 'incidents', String(incidentId));

      await deleteDoc(incidentRef);
      setFirestoreStatus('connected');
    } catch (error) {
      console.error('❌ Error deleting incident:', error);
      setFirestoreStatus('error');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  const clearAllIncidents = async () => {
    try {
      setLoading(true);
      setFirestoreStatus('saving');
      const incidentsRef = collection(db, 'incidents');
      const querySnapshot = await getDocs(incidentsRef);
      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      setIncidents([]);
      setFirestoreStatus('connected');
    } catch (error) {
      console.error('❌ Error clearing incidents:', error);
      setFirestoreStatus('error');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  const cleanupDuplicateIncidents = async () => {
    try {
      setLoading(true);
      setFirestoreStatus('saving');
      const incidentsRef = collection(db, 'incidents');
      const querySnapshot = await getDocs(incidentsRef);
      const incidentsMap = new Map();
      const batch = writeBatch(db);
      let duplicatesRemoved = 0;
      querySnapshot.forEach((doc) => {
        const incidentData = doc.data();
        const key = incidentData.incidentType + '_' + incidentData.date + '_' + incidentData.location;
        if (incidentsMap.has(key)) {
          // This is a duplicate, remove it
          batch.delete(doc.ref);
          duplicatesRemoved++;
        } else {
          incidentsMap.set(key, doc);
        }
      });
      if (duplicatesRemoved > 0) {
        await batch.commit();
        // Reload incidents after cleanup
        await loadIncidents();
      } else {
        console.log('✅ No duplicate incidents found');
      }
      setFirestoreStatus('connected');
    } catch (error) {
      console.error('❌ Error cleaning up duplicate incidents:', error);
      setFirestoreStatus('error');
    } finally {
      setLoading(false);
    }
  };
  const clearCurrentMonthIncidents = async () => {
    try {
      setCleanupLoading(true);
      setFirestoreStatus('saving');
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const incidentsRef = collection(db, 'incidents');
      const querySnapshot = await getDocs(incidentsRef);
      const batch = writeBatch(db);
      let removedCount = 0;
      querySnapshot.forEach((doc) => {
        const incidentData = doc.data();
        const incidentDate = new Date(incidentData.date);
        if (incidentDate.getMonth() === currentMonth && incidentDate.getFullYear() === currentYear) {
          batch.delete(doc.ref);
          removedCount++;
        }
      });
      if (removedCount > 0) {
        await batch.commit();
        await loadIncidents();
        alert(`✅ Successfully removed ${removedCount} incidents from current month`);
      } else {
        alert('✅ No incidents found for current month');
      }
      setFirestoreStatus('connected');
    } catch (error) {
      console.error('❌ Error clearing current month incidents:', error);
      setFirestoreStatus('error');
      alert('❌ Error clearing current month incidents');
    } finally {
      setCleanupLoading(false);
    }
  };
  const clearAllIncidentsData = async () => {
    try {
      setCleanupLoading(true);
      setFirestoreStatus('saving');
      const incidentsRef = collection(db, 'incidents');
      const querySnapshot = await getDocs(incidentsRef);
      const batch = writeBatch(db);
      let removedCount = 0;
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
        removedCount++;
      });
      if (removedCount > 0) {
        await batch.commit();
        setIncidents([]);
        alert(`✅ Successfully removed all ${removedCount} incidents`);
      } else {
        alert('✅ No incidents found to remove');
      }
      setFirestoreStatus('connected');
    } catch (error) {
      console.error('❌ Error clearing all incidents:', error);
      setFirestoreStatus('error');
      alert('❌ Error clearing all incidents');
    } finally {
      setCleanupLoading(false);
    }
  };
  // Function to identify and log duplicate incidents for debugging
  const identifyDuplicateIncidents = async () => {
    try {
      const incidentsRef = collection(db, 'incidents');
      const querySnapshot = await getDocs(incidentsRef);
      const incidentMap = new Map();
      const duplicates = [];
      querySnapshot.forEach((doc) => {
        const incidentData = {
          id: doc.id,
          ...doc.data()
        };
        if (incidentMap.has(incidentData.id)) {
          duplicates.push({
            id: incidentData.id,
            existingDoc: incidentMap.get(incidentData.id),
            duplicateDoc: incidentData
          });
        } else {
          incidentMap.set(incidentData.id, incidentData);
        }
      });
      if (duplicates.length > 0) {
        console.warn('🔍 Found duplicate incidents:', duplicates);
        console.warn('💡 Total duplicates found:', duplicates.length);
        console.warn('💡 Consider using the cleanup options to resolve these issues');
      } else {
        console.log('✅ No duplicate incidents found');
      }
      return duplicates;
    } catch (error) {
      console.error('❌ Error identifying duplicate incidents:', error);
      return [];
    }
  };
  // Function to manually clean up duplicates
  const manualCleanupDuplicates = async () => {
    try {
      setCleanupLoading(true);
      setFirestoreStatus('saving');
      const incidentsRef = collection(db, 'incidents');
      const querySnapshot = await getDocs(incidentsRef);
      const incidentMap = new Map();
      const documentsToDelete = [];
      // Identify duplicates and collect documents to delete
      querySnapshot.forEach((doc) => {
        const incidentData = {
          id: doc.id,
          ...doc.data()
        };
        if (incidentMap.has(incidentData.id)) {
          documentsToDelete.push(doc.ref);
        } else {
          incidentMap.set(incidentData.id, incidentData);
        }
      });
      if (documentsToDelete.length > 0) {
        const batch = writeBatch(db);
        documentsToDelete.forEach(docRef => {
          batch.delete(docRef);
        });
        await batch.commit();
        console.log(`✅ Successfully cleaned up ${documentsToDelete.length} duplicate incidents`);
        // Reload incidents after cleanup
        await loadIncidents();
        alert(`✅ Successfully cleaned up ${documentsToDelete.length} duplicate incidents`);
      } else {
        alert('✅ No duplicates found to clean up');
      }
      setFirestoreStatus('connected');
    } catch (error) {
      console.error('❌ Error during manual duplicate cleanup:', error);
      setFirestoreStatus('error');
      alert('❌ Error during duplicate cleanup: ' + error.message);
    } finally {
      setCleanupLoading(false);
    }
  };
  // Load incidents on component mount
  useEffect(() => {
    loadIncidents();
  }, []);
  // Close cleanup dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCleanupDropdown && !event.target.closest('.relative')) {
        setShowCleanupDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCleanupDropdown]);
  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setConnectionError(null);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setConnectionError('No internet connection');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  // Clean existing data when incidents are loaded
  useEffect(() => {
    if (incidents.length > 0) {
      const cleanedIncidents = incidents.map(incident => cleanIncidentData(incident));
      // Remove duplicates by ID, keeping the most recent one
      const uniqueIncidents = cleanedIncidents.reduce((acc, incident) => {
        const existingIndex = acc.findIndex(item => item.id === incident.id);
        if (existingIndex === -1) {
          acc.push(incident);
        } else {
          // Replace with the more recent version (based on updatedAt or createdAt)
          const existing = acc[existingIndex];
          const existingTime = existing.updatedAt || existing.createdAt || '';
          const newTime = incident.updatedAt || incident.createdAt || '';
          if (newTime > existingTime) {
            acc[existingIndex] = incident;
          }
        }
        return acc;
      }, []);
      // Only update if there were changes
      const hasChanges = uniqueIncidents.length !== incidents.length || 
        uniqueIncidents.some((incident, index) => 
          JSON.stringify(incident) !== JSON.stringify(incidents[index])
        );
      if (hasChanges) {
        console.log('Cleaning existing incident data and removing duplicates...');
        console.log(`Original count: ${incidents.length}, Cleaned count: ${uniqueIncidents.length}`);
        setIncidents(uniqueIncidents);
      }
      // Debug: Check for duplicate IDs
      const ids = uniqueIncidents.map(incident => incident.id);
      const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
      if (duplicateIds.length > 0) {
        console.warn('⚠️ Found duplicate incident IDs:', duplicateIds);
      } else {
        console.log('✅ No duplicate IDs found');
      }
    }
  }, [incidents.length]); // Only run when incidents array length changes
  const handleAddIncident = async () => {
    try {
    // Auto-identify incident type if not specified
      let finalIncidentType = newIncident.incidentType || identifyIncidentType(newIncident.description);
      // Format "Other" type with description from "What" field
      if (finalIncidentType === "Other" && newIncident.description) {
        finalIncidentType = `Other (${newIncident.description})`;
      }
      // Validate and clean the incident data
      const validatedIncident = cleanIncidentData({
      ...newIncident,
        incidentType: finalIncidentType
      });
      const extractedMonth = extractMonthFromDate(validatedIncident.date);
      const extractedYear = extractYearFromDate(validatedIncident.date);
      
      // Extract municipality and district from location
      const locationInfo = extractLocationInfo(validatedIncident.location);
      
      console.log('📅 Date extraction:', {
        input: validatedIncident.date,
        extractedMonth,
        extractedYear,
        location: validatedIncident.location,
        extractedMunicipality: locationInfo.municipality,
        extractedDistrict: locationInfo.district
      });
      
      const incidentData = {
        ...validatedIncident,
        month: extractedMonth,
        year: extractedYear,
        district: validatedIncident.district || locationInfo.district,
        municipality: validatedIncident.municipality || locationInfo.municipality,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      // Save to Firestore
      await saveIncident(incidentData);
      // Reload incidents from Firestore
      await loadIncidents();
      // Reset form
    setNewIncident({
      incidentType: "",
      location: "",
      district: "1ST DISTRICT",
      municipality: "Abucay",
      date: "",
      time: "",
      description: "",
      status: "Active",
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
    } catch (error) {
      console.error('Error adding incident:', error);
      alert('Error adding incident. Please try again.');
    }
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
  // Function to handle incident type change with "Other" formatting
  const handleIncidentTypeChange = (incidentType) => {
    let finalIncidentType = incidentType;
    // Format "Other" type with description from "What" field
    if (incidentType === "Other" && newIncident.description) {
      finalIncidentType = `Other (${newIncident.description})`;
      console.log('🔄 Formatting Other type:', finalIncidentType);
    }
    setNewIncident({
      ...newIncident,
      incidentType: finalIncidentType
    });
  };
  // Function to handle description change and update "Other" type formatting
  const handleDescriptionChange = (description) => {
    let finalIncidentType = newIncident.incidentType;
    // If type is "Other", update the formatting with new description
    if (newIncident.incidentType === "Other" || newIncident.incidentType.startsWith("Other (")) {
      if (description) {
        finalIncidentType = `Other (${description})`;
        console.log('🔄 Updating Other type with description:', finalIncidentType);
      } else {
        finalIncidentType = "Other";
        console.log('🔄 Clearing Other type description');
      }
    }
    setNewIncident({
      ...newIncident,
      description: description,
      incidentType: finalIncidentType
    });
  };
  const handleEditIncident = async () => {
    try {
      // Format "Other" type with description from "What" field
      let finalIncidentType = editingIncident.incidentType;
      if (finalIncidentType === "Other" && editingIncident.description) {
        finalIncidentType = `Other (${editingIncident.description})`;
      }
      // Validate and clean the incident data before updating
      const validatedIncident = validateIncidentForEdit({
        ...editingIncident,
        incidentType: finalIncidentType
      });
      const extractedMonth = extractMonthFromDate(validatedIncident.date);
      const extractedYear = extractYearFromDate(validatedIncident.date);
      
      // Extract municipality and district from location
      const locationInfo = extractLocationInfo(validatedIncident.location);
      
      console.log('📅 Date extraction (edit):', {
        input: validatedIncident.date,
        extractedMonth,
        extractedYear,
        location: validatedIncident.location,
        extractedMunicipality: locationInfo.municipality,
        extractedDistrict: locationInfo.district
      });
      
      const incidentData = {
        ...validatedIncident,
        month: extractedMonth,
        year: extractedYear,
        district: validatedIncident.district || locationInfo.district,
        municipality: validatedIncident.municipality || locationInfo.municipality,
        updatedAt: new Date().toISOString()
      };
      // Update in Firestore
      await updateIncident(String(editingIncident.id), incidentData);
      // Reload incidents from Firestore
      await loadIncidents();
    setEditingIncident(null);
    setShowEditModal(false);
    } catch (error) {
      console.error('Error updating incident:', error);
      alert('Error updating incident. Please try again.');
    }
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
  const handleDeleteIncident = async (id) => {
    if (window.confirm('Are you sure you want to delete this incident? This action cannot be undone.')) {
      try {
        await deleteIncident(String(id));
        await loadIncidents(); // Reload from Firestore
      } catch (error) {
        console.error('Error deleting incident:', error);
        alert('Error deleting incident. Please try again.');
      }
    }
  };
  // Import Excel functionality
  const handleImportExcel = () => {
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
      // Handle CSV files - treat as single month data
      reader.onload = async (e) => {
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
            
            // Get location and extract municipality/district from it
            const locationValue = values[headers.indexOf('WHERE')] || values[headers.indexOf('Location')] || '';
            const locationInfo = extractLocationInfo(locationValue);
            
            const incident = {
              id: importedIncidents.length + 1,
              incidentType: values[headers.indexOf('Type')] || values[headers.indexOf('TYPE')] || identifyIncidentType(description),
              location: locationValue,
              district: values[headers.indexOf('DISTRICT')] || values[headers.indexOf('District')] || locationInfo.district,
              municipality: values[headers.indexOf('MUNICIPALITY')] || values[headers.indexOf('Municipality')] || locationInfo.municipality,
              date: values[headers.indexOf('WHEN')] || '',
              time: values[headers.indexOf('Time')] || values[headers.indexOf('TIME')] || '',
              description: description,
              status: values[headers.indexOf('Status')] || values[headers.indexOf('STATUS')] || 'Active',
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
            // Save imported incidents to Firestore
            try {
              setLoading(true);
              setFirestoreStatus('saving');
              const batch = writeBatch(db);
              const incidentsRef = collection(db, 'incidents');
              importedIncidents.forEach(incident => {
                const docRef = doc(incidentsRef);
                batch.set(docRef, {
                  ...incident,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                });
              });
              await batch.commit();
              await loadIncidents(); // Reload from Firestore
              setFirestoreStatus('connected');
              alert(`Successfully imported ${importedIncidents.length} incidents to Firestore!`);
            } catch (error) {
              console.error('Error saving imported incidents:', error);
              setFirestoreStatus('error');
              alert('Error saving imported incidents to database. Please try again.');
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
              
              // Get description from What column
              const description = values[headers.indexOf('What')] || values[headers.indexOf('WHAT')] || values[headers.indexOf('Description')] || values[headers.indexOf('DESCRIPTION')] || '';
              
              // Get incident type from Type column, fallback to auto-identification
              const typeValue = values[headers.indexOf('Type')] || values[headers.indexOf('TYPE')] || '';
              const incidentType = typeValue || identifyIncidentType(description);
              
              // Get location and extract municipality/district from it
              const locationValue = values[headers.indexOf('WHERE')] || values[headers.indexOf('Location')] || '';
              const locationInfo = extractLocationInfo(locationValue);
              
              const incident = {
                id: importedIncidents.length + 1,
                incidentType: incidentType,
                location: locationValue,
                district: values[headers.indexOf('DISTRICT')] || values[headers.indexOf('District')] || locationInfo.district,
                municipality: values[headers.indexOf('MUNICIPALITY')] || values[headers.indexOf('Municipality')] || locationInfo.municipality,
                date: dateValue || '',
                time: values[headers.indexOf('Time')] || values[headers.indexOf('TIME')] || '',
                description: description,
                status: values[headers.indexOf('Status')] || values[headers.indexOf('STATUS')] || 'Active',
                officer: values[headers.indexOf('WHO')] || values[headers.indexOf('Officer')] || values[headers.indexOf('OFFICER')] || '',
                witnesses: values[headers.indexOf('Witnesses')] || values[headers.indexOf('WITNESSES')] || '',
                evidence: values[headers.indexOf('Evidence')] || values[headers.indexOf('EVIDENCE')] || '',
                why: values[headers.indexOf('WHY')] || values[headers.indexOf('Why')] || '',
                link: values[headers.indexOf('LINK')] || values[headers.indexOf('Link')] || '',
                month: month || '',
                year: year || '',
                // Map ACTION TAKEN to new action fields
                actionType: values[headers.indexOf('ACTION TAKEN')] || values[headers.indexOf('Action Taken')] || values[headers.indexOf('ActionType')] || '',
                actionDescription: values[headers.indexOf('Action Description')] || values[headers.indexOf('ActionDescription')] || '',
                assignedOfficer: values[headers.indexOf('Assigned Officer')] || values[headers.indexOf('AssignedOfficer')] || '',
                actionDate: values[headers.indexOf('Action Date')] || values[headers.indexOf('ActionDate')] || '',
                completionDate: values[headers.indexOf('Completion Date')] || values[headers.indexOf('CompletionDate')] || '',
                followUpNotes: values[headers.indexOf('Follow Up Notes')] || values[headers.indexOf('FollowUpNotes')] || '',
                priority: values[headers.indexOf('Priority')] || values[headers.indexOf('PRIORITY')] || 'Medium',
              };
              // Only add incidents that have at least some basic data
              if (incident.incidentType || incident.description || incident.location || incident.officer) {
                // Debug: Log the processed incident data
                console.log('📊 Processed incident from Excel:', {
                  headers: headers,
                  values: values,
                  incident: incident
                });
                importedIncidents.push(incident);
              }
            }
          });
          if (importedIncidents.length > 0) {
            // Save imported incidents to Firestore
            try {
              setLoading(true);
              setFirestoreStatus('saving');
              const batch = writeBatch(db);
              const incidentsRef = collection(db, 'incidents');
              importedIncidents.forEach(incident => {
                const docRef = doc(incidentsRef);
                batch.set(docRef, {
                  ...incident,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                });
              });
              await batch.commit();
              await loadIncidents(); // Reload from Firestore
              setFirestoreStatus('connected');
              alert(`Successfully imported ${importedIncidents.length} incidents to Firestore!`);
            } catch (error) {
              console.error('Error saving imported incidents:', error);
              setFirestoreStatus('error');
              alert('Error saving imported incidents to database. Please try again.');
            } finally {
              setLoading(false);
            }
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
  // Helper function to extract month from date text
  const extractMonthFromDate = (dateString) => {
    if (!dateString) return '';
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
    const monthAbbreviations = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    // First try to parse as a Date object
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return monthNames[date.getMonth()];
      }
    } catch (error) {
      // Continue to text parsing
    }
    // Check if dateString contains month name (full name)
        for (let i = 0; i < monthNames.length; i++) {
          if (dateString.toLowerCase().includes(monthNames[i].toLowerCase())) {
            return monthNames[i];
          }
        }
    // Check if dateString contains month abbreviation
    for (let i = 0; i < monthAbbreviations.length; i++) {
      if (dateString.toLowerCase().includes(monthAbbreviations[i].toLowerCase())) {
        return monthNames[i];
      }
    }
    // Try to extract month from MM/DD/YYYY or DD/MM/YYYY format
    const dateMatch = dateString.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (dateMatch) {
      const [_, first, second, year] = dateMatch;
      // Assume MM/DD/YYYY format (you can adjust this logic if needed)
      const monthIndex = parseInt(first) - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        return monthNames[monthIndex];
      }
    }
    // Try to extract month from YYYY-MM-DD format
    const isoMatch = dateString.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      const [_, year, month, day] = isoMatch;
      const monthIndex = parseInt(month) - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        return monthNames[monthIndex];
      }
    }
    return '';
  };

  // Extract municipality and district from location string
  const extractLocationInfo = (locationString) => {
    if (!locationString) return { municipality: 'Balanga City', district: '1ST DISTRICT' };
    
    // Common municipalities in Bataan and their districts
    const municipalityMap = {
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

    // Extract municipality from location string
    let municipality = 'Balanga City'; // default
    let district = '2ND DISTRICT'; // default (Balanga City is in 2nd District)

    // Check for municipality names in the location string
    for (const [muni, dist] of Object.entries(municipalityMap)) {
      if (locationString.toLowerCase().includes(muni.toLowerCase())) {
        municipality = muni;
        district = dist;
        break;
      }
    }

    return { municipality, district };
  };

  // Helper function to extract year from date text
  const extractYearFromDate = (dateString) => {
    if (!dateString) return '';
    // First try to parse as a Date object
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.getFullYear().toString();
      }
    } catch (error) {
      // Continue to text parsing
    }
    // Try to extract year from various formats
    // YYYY-MM-DD format
    const isoMatch = dateString.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      return isoMatch[1];
    }
    // MM/DD/YYYY or DD/MM/YYYY format
    const dateMatch = dateString.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (dateMatch) {
      return dateMatch[3];
    }
    // Any 4-digit year in the text
      const yearMatch = dateString.match(/\b(20\d{2})\b/);
    if (yearMatch) {
      return yearMatch[1];
    }
    // Try to find year in various formats
    const yearPatterns = [
      /\b(20\d{2})\b/,  // 2024, 2023, etc.
      /\b(19\d{2})\b/,  // 1999, 1998, etc.
      /\b(\d{4})\b/     // Any 4-digit number
    ];
    for (const pattern of yearPatterns) {
      const match = dateString.match(pattern);
      if (match) {
        const year = parseInt(match[1]);
        if (year >= 1900 && year <= 2100) {
          return year.toString();
        }
      }
    }
      return '';
  };
  // Data validation and cleaning functions
  const cleanIncidentData = (incident) => {
    const cleaned = { ...incident };
    // Clean date field - allow any text input but validate basic format
    if (cleaned.date && typeof cleaned.date === 'string') {
      // If the date field contains text that looks like a description, clear it
      if (cleaned.date.length > 100 || cleaned.date.includes('Arrest') || cleaned.date.includes('resident')) {
        console.log('Clearing invalid date field:', cleaned.date);
        cleaned.date = '';
      }
      // For text input, we allow any reasonable date format
      // Just ensure it's not empty and not too long
      if (cleaned.date.trim() === '') {
        cleaned.date = '';
      }
    }
    // Ensure all required fields are strings
    cleaned.incidentType = cleaned.incidentType || '';
    cleaned.location = cleaned.location || '';
    cleaned.description = cleaned.description || '';
    cleaned.officer = cleaned.officer || '';
            cleaned.status = cleaned.status || 'Active';
    return cleaned;
  };
  const validateIncidentForEdit = (incident) => {
    const cleaned = cleanIncidentData(incident);
    // For text input, just ensure the date field is a reasonable string
    if (cleaned.date && typeof cleaned.date === 'string') {
      // Trim whitespace and ensure it's not too long
      cleaned.date = cleaned.date.trim();
      if (cleaned.date.length > 100) {
        cleaned.date = cleaned.date.substring(0, 100);
      }
    }
    return cleaned;
  };
  // Ensure unique incidents by ID to prevent duplicate keys
  const uniqueIncidents = incidents.reduce((acc, incident) => {
    if (!acc.find(item => item.id === incident.id)) {
      acc.push(incident);
    }
    return acc;
  }, []);
  const filteredIncidents = uniqueIncidents.filter((incident) => {
    // Filter out incidents with "No description available"
    const hasValidDescription = incident.description && 
                               incident.description.trim() !== "" && 
                               incident.description !== "No description available";
    const matchesMonth = selectedMonth === "all" || incident.month === selectedMonth;
    const incidentYear = incident.year != null ? String(incident.year) : "";
    const matchesYear = selectedYear === "all" || incidentYear === selectedYear;
    const matchesDistrict = filterDistrict === "all" || incident.district === filterDistrict;
    const matchesSearch = searchTerm === "" || 
                         (incident.incidentType && incident.incidentType.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (incident.location && incident.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (incident.municipality && incident.municipality.toLowerCase().includes(searchTerm.toLowerCase()));
    return hasValidDescription && matchesMonth && matchesYear && matchesDistrict && matchesSearch;
  });
  // Get available months from incidents data
  const availableMonths = [...new Set(incidents.map(incident => incident.month).filter(month => month))];
  // Get available districts from incidents data
  const availableDistricts = [...new Set(incidents.map(incident => incident.district).filter(district => district))];
  // Get available municipalities from incidents data
  const availableMunicipalities = [...new Set(incidents.map(incident => incident.municipality).filter(municipality => municipality))];

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => String(currentYear - 2 + i));
  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "Under Investigation":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "Active":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };
  // Pagination calculations
  const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage);
  const startIndex = (paginationPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedIncidents = filteredIncidents.slice(startIndex, endIndex);
  
  // Pagination functions
  const goToPage = (page) => {
    setPaginationPage(Math.max(1, Math.min(page, totalPages)));
  };
  
  const nextPage = () => {
    if (paginationPage < totalPages) {
      setPaginationPage(paginationPage + 1);
    }
  };
  
  const prevPage = () => {
    if (paginationPage > 1) {
      setPaginationPage(paginationPage - 1);
    }
  };
  
  // Reset to first page when filters change
  useEffect(() => {
    setPaginationPage(1);
  }, [filterDistrict, searchTerm, selectedMonth, selectedYear]);

  const stats = {
    total: filteredIncidents.length,
    completed: filteredIncidents.filter(i => 
      i.status === "Completed" || 
      i.status === "completed" || 
      i.status === "COMPLETED"
    ).length,
    actionTaken: filteredIncidents.filter(i => 
      i.actionType && i.actionType.trim() !== ""
    ).length,
    underInvestigation: filteredIncidents.filter(i => 
      i.status === "Under Investigation" || 
      i.status === "under investigation" || 
      i.status === "UNDER INVESTIGATION" ||
      i.status === "Under investigation"
    ).length,
    drugs: filteredIncidents.filter(i => 
      i.incidentType === "Drug-related"
    ).length,
    others: filteredIncidents.filter(i => 
      i.incidentType !== "Drug-related" && 
      i.incidentType !== "Theft" && 
      i.incidentType !== "Assault" && 
      i.incidentType !== "Traffic Violation" && 
      i.incidentType !== "Vandalism" && 
      i.incidentType !== "Fraud" && 
      i.incidentType !== "Domestic Violence" && 
      i.incidentType !== "Public Disturbance" && 
      i.incidentType !== "Property Damage" && 
      i.incidentType !== "Missing Person" && 
      i.incidentType !== "Suspicious Activity" && 
      i.incidentType !== "Environmental Violation" && 
      i.incidentType !== "Animal Control" && 
      i.incidentType !== "Fire Safety" && 
      i.incidentType !== "Emergency Response" && 
      i.incidentType !== "Other"
    ).length,
    accidents: filteredIncidents.filter(i => 
      i.incidentType === "Traffic Accident" || 
      i.incidentType === "Work Accident" || 
      i.incidentType === "Accident" ||
      i.description?.toLowerCase().includes("accident") ||
      i.description?.toLowerCase().includes("crash") ||
      i.description?.toLowerCase().includes("collision")
    ).length,
    trafficAccidents: filteredIncidents.filter(i => 
      i.incidentType === "Traffic Accident" || 
      i.incidentType === "Traffic Violation" ||
      i.description?.toLowerCase().includes("traffic") && (
        i.description?.toLowerCase().includes("accident") ||
        i.description?.toLowerCase().includes("crash") ||
        i.description?.toLowerCase().includes("collision")
      )
    ).length,
    workAccidents: filteredIncidents.filter(i => 
      i.incidentType === "Work Accident" ||
      i.description?.toLowerCase().includes("work") && (
        i.description?.toLowerCase().includes("accident") ||
        i.description?.toLowerCase().includes("injury") ||
        i.description?.toLowerCase().includes("fall")
      )
    ).length,
    otherAccidents: filteredIncidents.filter(i => 
      (i.incidentType === "Accident" || 
       i.description?.toLowerCase().includes("accident")) &&
      !(i.incidentType === "Traffic Accident" || 
        i.incidentType === "Work Accident" ||
        i.description?.toLowerCase().includes("traffic") ||
        i.description?.toLowerCase().includes("work"))
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
      // Prepare data for export - filter out incidents with no description
      const exportData = incidents
        .filter(incident => incident.description && 
                           incident.description.trim() !== "" && 
                           incident.description !== "No description available")
        .map(incident => ({
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
      const csvData = incidents
        .filter(incident => incident.description && 
                           incident.description.trim() !== "" && 
                           incident.description !== "No description available")
        .map(incident => [
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
      doc.autoTable({
        head: [['Location', 'Number of Incidents', 'Incident Types']],
        body: locationData,
        startY: 35,
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        headStyles: {
          textColor: 0,
          fontStyle: 'bold'
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
  // Show PDF Edit Interface
  const showPdfEditInterface = () => {
    // Update memorandum data with current filters
    setPdfReportData(prev => ({
      ...prev,
      memorandum: {
        ...prev.memorandum,
        subject: `Monthly Crime Analysis Report for ${selectedMonth === "all" ? "All Months" : selectedMonth} ${new Date().getFullYear()}`
      }
    }));
    setShowPdfEditModal(true);
  };
  // Preview PDF Report
  const previewPdfReport = () => {
    setShowPdfPreviewModal(true);
  };
  // Export Incidents to PDF (after editing)
  const exportIncidentsToPDF = async () => {
    setIsGeneratingPdf(true);
    try {
      console.log('Starting PDF export...');
      // Filter incidents based on current filters
      const filtered = incidents.filter(incident => {
        // Filter out incidents with "No description available"
        if (!incident.description || 
            incident.description.trim() === "" || 
            incident.description === "No description available") {
          return false;
        }
        // Filter by status if not "all"
        if (filterStatus !== "all" && incident.status !== filterStatus) {
          return false;
        }
        // Filter by month if not "all"
        if (selectedMonth !== "all") {
          const incidentMonth = new Date(incident.date).toLocaleString('en-US', { month: 'long' });
          if (incidentMonth !== selectedMonth) {
            return false;
          }
        }
        // Filter by search term
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          return (
            incident.description?.toLowerCase().includes(searchLower) ||
            incident.location?.toLowerCase().includes(searchLower) ||
            incident.incidentType?.toLowerCase().includes(searchLower) ||
            incident.municipality?.toLowerCase().includes(searchLower)
          );
        }
        return true;
      });
      console.log('Filtered incidents:', filtered);
      if (!filtered || filtered.length === 0) {
        alert('No incidents found matching the current filters. Please adjust your filters and try again.');
        return;
      }
      // Initialize actual incident types object at the beginning of the function
      let actualIncidentTypes = {};
      // Count actual incident types from the data
      filtered.forEach(incident => {
        const identifiedType = identifyIncidentType(incident.description || incident.incidentType || '');
        actualIncidentTypes[identifiedType] = (actualIncidentTypes[identifiedType] || 0) + 1;
      });
      // Initialize municipality data processing at the beginning of the function
      const municipalityData = {};
      console.log('Processing incidents for municipality data...');
      // Initialize with all municipalities
      const allMunicipalities = [
        'Abucay', 'Orani', 'Samal', 'Hermosa', // 1ST DISTRICT
        'Balanga City', 'Pilar', 'Orion', 'Limay', // 2ND DISTRICT
        'Bagac', 'Dinalupihan', 'Mariveles', 'Morong' // 3RD DISTRICT
      ];
      allMunicipalities.forEach(municipality => {
        municipalityData[municipality] = {
          total: 0,
          types: {},
          vehicular: 0,
          drugRelated: 0,
          carnapping: 0,
          theft: 0,
          robbery: 0,
          homicide: 0,
          physicalInjury: 0,
          illegalFirearms: 0,
          suicide: 0,
          otherLaw: 0,
          policeOps: 0
        };
      });
      // Process incidents for municipality data
      filtered.forEach(incident => {
        try {
          // Priority 1: Try to detect municipality from location first (most reliable)
          let municipality = null;
        if (incident.location) {
            const detectedMunicipalities = detectMunicipalitiesFromLocation(incident.location, allMunicipalities);
            if (detectedMunicipalities.length > 0) {
              municipality = detectedMunicipalities[0]; // Use first detected municipality
              console.log(`Detected municipality from location: ${municipality} for location: "${incident.location}"`);
            }
          }
          // Priority 2: Use municipality field if location detection failed
          if (!municipality) {
            municipality = incident.municipality;
            if (municipality) {
              console.log(`Using municipality field: ${municipality}`);
            }
          }
          // Fallback to 'Unknown' if still no municipality
          municipality = municipality || 'Unknown';
          if (municipality === 'Unknown') {
            console.log(`Could not detect municipality for incident:`, incident);
          }
          if (!municipalityData[municipality]) {
            municipalityData[municipality] = {
              total: 0,
              types: {},
              vehicular: 0,
              drugRelated: 0,
              carnapping: 0,
              theft: 0,
              robbery: 0,
              homicide: 0,
              physicalInjury: 0,
              illegalFirearms: 0,
              suicide: 0,
              otherLaw: 0,
              policeOps: 0
            };
          }
          municipalityData[municipality].total++;
          // Categorize incident using the identifyIncidentType function
          const description = incident.description || '';
          const incidentType = incident.incidentType || '';
          const location = incident.location || '';
          const combinedText = `${description} ${incidentType} ${location}`.trim();
          const identifiedType = identifyIncidentType(combinedText);
          // Store the identified type in municipality data
          municipalityData[municipality].types[identifiedType] = (municipalityData[municipality].types[identifiedType] || 0) + 1;
        } catch (error) {
          console.error('Error processing incident for municipality data:', error, incident);
        }
      });
      // Initialize report text variable at the beginning of the function
      let reportText = '';
      // Update report text with dynamic content
      if (filtered.length > 0) {
      const municipalitiesWithData = Object.entries(municipalityData).filter(([municipality, data]) => data.total > 0).length;
      const totalMunicipalities = allMunicipalities.length;
      const uniqueIncidentTypes = Object.keys(actualIncidentTypes).length;
      const topIncidentTypes = Object.entries(actualIncidentTypes)
            .sort(([,a], [,b]) => b - a)
        .slice(0, 3);
        reportText = `This report provides a comprehensive analysis of ${filtered.length} incidents recorded in the Province of Bataan for ${selectedMonth === "all" ? "the reporting period" : selectedMonth} ${new Date().getFullYear()}. The data has been processed from ${municipalitiesWithData} out of ${totalMunicipalities} municipalities and categorized into ${uniqueIncidentTypes} distinct incident types. `;
        if (topIncidentTypes.length > 0) {
          const topTypesText = topIncidentTypes.map(([type, count]) => `${count} ${type}`).join(', ');
          reportText += `The most common incidents include ${topTypesText}. `;
        }
        reportText += `All entries were reviewed for completeness and accuracy.`;
      } else {
        reportText = `This report provides a comprehensive analysis of ${filtered.length} incidents recorded in the Province of Bataan for ${selectedMonth === "all" ? "the reporting period" : selectedMonth} ${new Date().getFullYear()}. No incidents were recorded during this period. All entries were reviewed for completeness and accuracy.`;
      }
      // Initialize sortedMunicipalities at the beginning of the function
      const sortedMunicipalities = Object.entries(municipalityData)
        .sort(([,a], [,b]) => b.total - a.total)
        .map(([municipality, data]) => {
          // Create breakdown text using actual incident types from the data
          const breakdownParts = [];
          // Use the actual incident types stored in data.types
          Object.entries(data.types).forEach(([type, count]) => {
            if (count > 0) {
              // Format the type name properly
              const formattedType = type.charAt(0).toUpperCase() + type.slice(1);
              breakdownParts.push(`${count} ${formattedType}`);
            }
          });
          const breakdown = breakdownParts.join(', ') || 'No incidents recorded';
        return [
          municipality,
            data.total.toString(),
          breakdown
        ];
      });
      // Create PDF with auto-fit settings
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        lineHeight: 1.5,
        margins: { // Optimized margins for better content fitting
          top: 15,
          bottom: 15,
          left: 15,
          right: 15
        }
      });
      // Enhanced auto-fit helper function to check page overflow and add new pages
      const checkPageOverflow = (yPosition, requiredSpace = 10) => {
        const pageHeight = doc.internal.pageSize.height;
        const bottomMargin = 25; // Bottom margin for page numbers
        const availableSpace = pageHeight - bottomMargin;
        if (yPosition + requiredSpace > availableSpace) {
          doc.addPage();
          return 15; // Reset to top of new page with minimal margin
        }
        return yPosition;
      };
      // Enhanced auto-fit text function that handles overflow with minimal spacing
      const addAutoFitText = (text, x, y, maxWidth, fontSize = 11, lineSpacing = 4) => {
        if (!text || text.trim() === '') {
          return y + lineSpacing;
        }
        doc.setFontSize(fontSize);
        const lines = doc.splitTextToSize(text.trim(), maxWidth);
        let currentY = y;
        lines.forEach((line, index) => {
          // Check for page overflow before adding each line (less aggressive)
          currentY = checkPageOverflow(currentY, lineSpacing + 2);
          doc.text(line, x, currentY);
          currentY += lineSpacing;
        });
        return currentY;
      };
      // Enhanced section header function with minimal spacing
      const addSectionHeader = (text, yPosition, fontSize = 14) => {
        const newY = checkPageOverflow(yPosition, 8);
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', 'bold');
        doc.text(text, leftMargin, newY);
        // Add underline for section header
        doc.setLineWidth(0.2);
        doc.line(leftMargin, newY + 1, doc.internal.pageSize.width - leftMargin, newY + 1);
        return newY + 5; // Return position after header with minimal spacing
      };
      // Enhanced bullet list function with minimal spacing
      const addBulletList = (items, yPosition, fontSize = 10, indent = 15) => {
        let currentY = yPosition;
        items.forEach((item, index) => {
          currentY = checkPageOverflow(currentY, 4);
          // Bullet point
          doc.setFontSize(fontSize);
          doc.setFont('helvetica', 'bold');
          doc.text('•', leftMargin, currentY);
          // Item text
          const itemText = typeof item === 'string' ? item : `${item.title}: ${item.content}`;
          const textX = leftMargin + indent;
          const textWidth = doc.internal.pageSize.width - leftMargin * 2 - indent;
          currentY = addAutoFitText(itemText, textX, currentY, textWidth, fontSize, 4);
          currentY += 1; // Minimal gap between items
        });
        return currentY;
      };
      // Initialize autoTable plugin
      if (typeof autoTable === 'function') {
        autoTable(doc, {
          // Add a dummy table to initialize the plugin
          head: [['']],
          body: [['']]
        });
      } else {
        console.error('autoTable is not a function:', typeof autoTable);
        throw new Error('PDF table plugin not available');
      }
      // Set default line height
      const lineHeight = 7;
      // Page 1: MEMORANDUM Header and Overview - Enhanced Auto-fit format
      const leftMargin = 25; // Increased left margin for better spacing
      const contentMargin = 45; // Increased content margin
      const maxContentWidth = doc.internal.pageSize.width - leftMargin * 2;
      // MEMORANDUM title - bold, uppercase, left-aligned with minimal spacing
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('MEMORANDUM', leftMargin, 20);
      // Memorandum details with minimal spacing
      let yPos = 30; // Reduced starting position
      // FOR line
      yPos = checkPageOverflow(yPos, 8);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('FOR', leftMargin, yPos);
      doc.text(':', leftMargin + 20, yPos);
      doc.setFont('helvetica', 'normal');
      yPos = addAutoFitText(pdfReportData.memorandum.for, contentMargin, yPos, maxContentWidth - contentMargin, 11, 4);
      yPos += 3; // Reduced spacing between fields
      // FROM line
      yPos = checkPageOverflow(yPos, 8);
      doc.setFont('helvetica', 'bold');
      doc.text('FROM', leftMargin, yPos);
      doc.text(':', leftMargin + 20, yPos);
      doc.setFont('helvetica', 'normal');
      yPos = addAutoFitText(pdfReportData.memorandum.from, contentMargin, yPos, maxContentWidth - contentMargin, 11, 4);
      yPos += 3;
      // DATE line
      yPos = checkPageOverflow(yPos, 8);
      doc.setFont('helvetica', 'bold');
      doc.text('DATE', leftMargin, yPos);
      doc.text(':', leftMargin + 20, yPos);
      doc.setFont('helvetica', 'normal');
      yPos = addAutoFitText(pdfReportData.memorandum.date, contentMargin, yPos, maxContentWidth - contentMargin, 11, 4);
      yPos += 3;
      // SUBJECT line
      yPos = checkPageOverflow(yPos, 8);
      doc.setFont('helvetica', 'bold');
      doc.text('SUBJECT', leftMargin, yPos);
      doc.text(':', leftMargin + 20, yPos);
      doc.setFont('helvetica', 'normal');
      yPos = addAutoFitText(pdfReportData.memorandum.subject, contentMargin, yPos, maxContentWidth - contentMargin, 11, 4);
      yPos += 6; // Reduced spacing before custom notes
      // Add custom notes if provided
      if (pdfReportData.customNotes && pdfReportData.customNotes.trim()) {
        yPos = checkPageOverflow(yPos, 10);
        yPos = addAutoFitText(pdfReportData.customNotes, leftMargin, yPos, maxContentWidth, 11, 5);
        yPos += 5; // Minimal spacing after custom notes
      }
      // Section 1: Data Cleaning & Categorization
      if (pdfReportData.includeSections.dataCleaning) {
        yPos = addSectionHeader('1. Data Cleaning & Categorization', yPos + 5);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        // Main content - Dynamic based on actual data
        yPos = addAutoFitText(reportText, leftMargin, yPos, maxContentWidth, 11, 5);
        // Incident categorization based on actual data
        yPos += 8;
        yPos = checkPageOverflow(yPos, 15);
        doc.setFont('helvetica', 'bold');
        doc.text('The incidents are categorized as follows:', leftMargin, yPos);
        // Show actual incident types found in the data
        yPos += 6;
        const subIndent = leftMargin + 15;
      if (Object.keys(actualIncidentTypes).length > 0) {
        // Categorize into Index and Non-Index crimes
        const indexCrimes = ['Murder', 'Homicide', 'Physical Injury', 'Rape', 'Robbery', 'Theft', 'Carnapping'];
        const nonIndexCrimes = ['Drug-related', 'Traffic Accident', 'Traffic Violation', 'Suicide', 'Illegal Firearms', 'Police Operation'];
        // Index Crimes
      doc.setFont('helvetica', 'bold');
        doc.text('• Index Crimes:', leftMargin, yPos);
        yPos += lineHeight;
        const indexCrimeTypes = Object.entries(actualIncidentTypes)
          .filter(([type]) => indexCrimes.some(crime => type.toLowerCase().includes(crime.toLowerCase())))
          .sort(([,a], [,b]) => b - a);
        if (indexCrimeTypes.length > 0) {
          indexCrimeTypes.forEach(([type, count]) => {
            yPos = checkPageOverflow(yPos, 8);
            const text = `  - ${type}: ${count} incident${count !== 1 ? 's' : ''}`;
            yPos = addAutoFitText(text, subIndent, yPos, doc.internal.pageSize.width - subIndent - leftMargin, 10, 5);
            yPos += 1; // Minimal gap between items
          });
        } else {
          yPos = checkPageOverflow(yPos, 8);
          const noIndexText = `  - No index crimes recorded`;
          yPos = addAutoFitText(noIndexText, subIndent, yPos, doc.internal.pageSize.width - subIndent - leftMargin, 10, 5);
        }
        yPos += 5; // Minimal spacing between categories
        yPos = checkPageOverflow(yPos, 10);
        // Non-Index Crimes & Other Incidents
        doc.setFont('helvetica', 'bold');
        doc.text('• Non-Index Crimes & Other Incidents:', leftMargin, yPos);
        yPos += 5;
        const nonIndexCrimeTypes = Object.entries(actualIncidentTypes)
          .filter(([type]) => nonIndexCrimes.some(crime => type.toLowerCase().includes(crime.toLowerCase())))
          .sort(([,a], [,b]) => b - a);
        if (nonIndexCrimeTypes.length > 0) {
          nonIndexCrimeTypes.forEach(([type, count]) => {
            yPos = checkPageOverflow(yPos, 8);
            const text = `  - ${type}: ${count} incident${count !== 1 ? 's' : ''}`;
            yPos = addAutoFitText(text, subIndent, yPos, doc.internal.pageSize.width - subIndent - leftMargin, 10, 5);
            yPos += 1; // Minimal gap between items
          });
        } else {
          yPos = checkPageOverflow(yPos, 8);
          const noNonIndexText = `  - No non-index crimes recorded`;
          yPos = addAutoFitText(noNonIndexText, subIndent, yPos, doc.internal.pageSize.width - subIndent - leftMargin, 10, 5);
        }
        // Other incidents not categorized
        const otherTypes = Object.entries(actualIncidentTypes)
          .filter(([type]) => !indexCrimes.some(crime => type.toLowerCase().includes(crime.toLowerCase())) && 
                               !nonIndexCrimes.some(crime => type.toLowerCase().includes(crime.toLowerCase())))
          .sort(([,a], [,b]) => b - a);
        if (otherTypes.length > 0) {
          yPos += 5; // Minimal spacing
          yPos = checkPageOverflow(yPos, 10);
          doc.setFont('helvetica', 'bold');
          doc.text('• Other Incidents:', leftMargin, yPos);
          yPos += 5;
          otherTypes.forEach(([type, count]) => {
            yPos = checkPageOverflow(yPos, 8);
            const text = `  - ${type}: ${count} incident${count !== 1 ? 's' : ''}`;
            yPos = addAutoFitText(text, subIndent, yPos, doc.internal.pageSize.width - subIndent - leftMargin, 10, 5);
            yPos += 1; // Minimal gap between items
          });
        }
      } else {
        const noIncidentsText = `• No incidents were recorded in the provided dataset for ${selectedMonth === "all" ? "the reporting period" : selectedMonth} ${new Date().getFullYear()}.`;
        yPos = addAutoFitText(noIncidentsText, subIndent, yPos, doc.internal.pageSize.width - subIndent - leftMargin, 10, 6);
      }
      } // End of Section 1 conditional
      // Section 2: Summary Generation
      if (pdfReportData.includeSections.summaryGeneration) {
        yPos = addSectionHeader('2. Summary Generation', yPos + 5);
      // Create table headers
      const headers = [['Municipality/City', 'Total Incidents', 'Breakdown']];
      // Now generate dynamic content for Data Cleaning section
      const municipalitiesWithData = Object.entries(municipalityData).filter(([municipality, data]) => data.total > 0).length;
      const totalMunicipalities = allMunicipalities.length;
      // Use the reportText and sortedMunicipalities already defined at the beginning of the function
      // Debug: Log all municipalities and their data
      console.log('All municipalities data:', municipalityData);
      console.log('Sorted municipalities for table:', sortedMunicipalities);
      console.log('Total municipalities in table:', sortedMunicipalities.length);
      // Debug: Show sample incidents to understand the data structure
      console.log('Sample incidents for debugging:', filtered.slice(0, 3));
      console.log('Total incidents being processed:', filtered.length);
      // Generate and display dynamic summary content
      const generateDynamicSummary = () => {
        const summary = [];
        // A. Crime Distribution by Municipality/City
        const municipalitiesWithIncidents = Object.entries(municipalityData).filter(([municipality, data]) => data.total > 0);
        const totalIncidents = filtered.length;
        if (municipalitiesWithIncidents.length > 0) {
          const topMunicipality = municipalitiesWithIncidents[0];
          const percentage = totalIncidents > 0 ? ((topMunicipality[1].total / totalIncidents) * 100).toFixed(1) : 0;
          summary.push({
            title: 'A. Crime Distribution by Municipality/City:',
            content: [
              `A total of ${totalIncidents} incidents were recorded across ${municipalitiesWithIncidents.length} municipalities.`,
              `${topMunicipality[0]} recorded the highest number of incidents (${topMunicipality[1].total}), representing ${percentage}% of the total.`,
              `The data shows varying incident patterns across different municipalities, with some areas requiring increased attention.`
            ]
          });
        } else {
          summary.push({
            title: 'A. Crime Distribution by Municipality/City:',
            content: [
              `No incidents were recorded during the reporting period.`,
              `All municipalities showed zero incident counts.`
            ]
          });
        }
        return summary;
      };
      // Display dynamic summary
      const dynamicSummary = generateDynamicSummary();
      dynamicSummary.forEach((section, index) => {
        yPos = checkPageOverflow(yPos, 15);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(section.title, leftMargin, yPos);
        doc.setFont('helvetica', 'normal');
        yPos += 8;
        section.content.forEach(content => {
           yPos = addAutoFitText(content, leftMargin, yPos, doc.internal.pageSize.width - leftMargin * 2, 11, 5);
           yPos += 3; // Small gap between content items
        });
         yPos += 8; // Minimal spacing between sections
      });
             // Add table with enhanced spacing and overflow protection
      console.log('Generating table with data:', { headers, sortedMunicipalities });
      try {
        // Check if we have enough space for the table
        const estimatedTableHeight = (sortedMunicipalities.length + 1) * 12; // Rough estimate
        yPos = checkPageOverflow(yPos, estimatedTableHeight);
        let finalY = yPos;
        autoTable(doc, {
          head: headers,
          body: sortedMunicipalities,
          startY: yPos + 5, // Minimal space before table
          styles: {
            fontSize: 9,
            cellPadding: 3, // Reduced cell padding
            lineWidth: 0.1,
            overflow: 'linebreak' // Prevent text overflow
          },
          columnStyles: {
            0: { cellWidth: 50, fontStyle: 'bold' },
            1: { cellWidth: 30, halign: 'center' },
            2: { cellWidth: 'auto', cellMinWidth: 80 }
          },
          headStyles: {
            fontSize: 10,
            fontStyle: 'bold',
            halign: 'center',
            fillColor: [70, 130, 180], // Add header background color
            textColor: [255, 255, 255] // White text for header
          },
          alternateRowStyles: {
            fillColor: [248, 249, 250] // Alternate row colors
          },
          margin: { left: leftMargin, right: leftMargin }, // Use consistent margins
          didDrawCell: function(data) {
            // Update finalY to track the bottom of the table
            if (data.row.index === data.table.body.length - 1 && 
                data.column.index === data.table.columns.length - 1) {
              finalY = data.cell.y + data.cell.height;
            }
          },
          didDrawPage: function(data) {
            // Page numbers are handled globally at the end
          }
        });
        // Update yPos to after table with minimal spacing
        yPos = finalY + 8; // Minimal spacing after table
      } catch (tableError) {
        console.error('Error generating table:', tableError);
        throw new Error('Failed to generate incident table: ' + tableError.message);
      }
      // B. Crime Hotspots and High-Risk Areas
      yPos = checkPageOverflow(yPos, 10);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('B. Crime Hotspots and High-Risk Areas:', leftMargin, yPos);
      yPos += 5;
      // Generate dynamic crime hotspots content
      const generateDynamicHotspots = () => {
        const hotspots = [];
        if (sortedMunicipalities.length > 0) {
          const topMunicipality = sortedMunicipalities[0];
          const percentage = filtered.length > 0 ? ((parseInt(topMunicipality[1]) / filtered.length) * 100).toFixed(1) : 0;
          // Municipal Hotspot
          hotspots.push({
            title: 'Municipal Hotspot:',
            content: `${topMunicipality[0]} recorded the highest number of incidents (${topMunicipality[1]}), representing approximately ${percentage}% of the total for the province.`
          });
          // City Hotspot
          const cityData = sortedMunicipalities.find(([municipality]) => municipality.toLowerCase().includes('city'));
          if (cityData && cityData[0] !== topMunicipality[0]) {
            hotspots.push({
              title: 'City Hotspot:',
              content: `${cityData[0]} follows with ${cityData[1]} incidents.`
            });
          }
          // Highway Concerns - only if there are traffic incidents
          const trafficIncidents = actualIncidentTypes['Traffic Accident'] || actualIncidentTypes['Traffic Violation'] || 0;
          if (trafficIncidents > 0) {
            hotspots.push({
              title: 'Highway Concerns:',
              content: `A significant number of vehicular incidents (${trafficIncidents}) occurred along major thoroughfares.`,
              subItems: [
                'Roman Superhighway (Orion, Limay, Mariveles)',
                'Olongapo-Gapan Road (Dinalupihan)',
                'MacArthur Highway (Orani)'
              ]
            });
          }
          // Barangay Hotspots - only if there are multiple municipalities with incidents
          if (sortedMunicipalities.length > 1) {
            const topMunicipalities = sortedMunicipalities.slice(0, 3);
            hotspots.push({
              title: 'Barangay Hotspots:',
              content: `Incidents are concentrated in the following municipalities:`,
              subItems: topMunicipalities.map(([municipality, count]) => 
                `${municipality}: ${count} incidents`
              )
            });
          }
        } else {
          hotspots.push({
            title: 'No Hotspots Identified:',
            content: 'No incidents were recorded during this period, therefore no crime hotspots were identified.'
          });
        }
        return hotspots;
      };
      // Display dynamic hotspots
      const dynamicHotspots = generateDynamicHotspots();
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      dynamicHotspots.forEach((hotspot, index) => {
        // Check for page overflow before each hotspot section (less aggressive)
        yPos = checkPageOverflow(yPos, 8);
        
        // Add the hotspot title and content
        const text = `${hotspot.title} ${hotspot.content}`;
        yPos = addAutoFitText(text, leftMargin, yPos, doc.internal.pageSize.width - leftMargin * 2, 10, 4);
        yPos += 2;
        
        // Add sub-items if they exist
        if (hotspot.subItems) {
          hotspot.subItems.forEach(item => {
            // Check for page overflow before each sub-item (less aggressive)
            yPos = checkPageOverflow(yPos, 6);
            yPos = addAutoFitText(`• ${item}`, leftMargin + 10, yPos, doc.internal.pageSize.width - leftMargin * 2 - 10, 10, 4);
            yPos += 1;
          });
          yPos += 2;
        }
      });
      } // End of Section 2 conditional
      // Continue with Trend & Pattern Analysis (let it flow naturally)
      yPos += 3; // Minimal spacing before next section
      // 3. Trend & Pattern Analysis
      if (pdfReportData.includeSections.trendAnalysis) {
        yPos = addSectionHeader('3. Trend & Pattern Analysis', yPos);
      // Generate dynamic trend analysis
      const generateDynamicTrendAnalysis = (incidentTypes) => {
        const trends = [];
        // Dominant Crime Type
        const topIncidentTypes = Object.entries(incidentTypes)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 2);
        if (topIncidentTypes.length > 0) {
          const totalIncidents = filtered.length;
          const topType = topIncidentTypes[0];
          if (topIncidentTypes.length >= 2) {
            // If we have at least 2 incident types
            const secondType = topIncidentTypes[1];
          const topPercentage = totalIncidents > 0 ? ((topType[1] / totalIncidents) * 100).toFixed(1) : 0;
          const secondPercentage = totalIncidents > 0 ? ((secondType[1] / totalIncidents) * 100).toFixed(1) : 0;
          trends.push({
            title: 'Dominant Crime Type:',
            content: `${topType[0]} and ${secondType[0]} are the most prevalent issues, with ${topType[1]} and ${secondType[1]} incidents respectively. Together, they account for ${(parseFloat(topPercentage) + parseFloat(secondPercentage)).toFixed(1)}% of all recorded events.`
          });
          } else {
            // If we only have 1 incident type
            const topPercentage = totalIncidents > 0 ? ((topType[1] / totalIncidents) * 100).toFixed(1) : 0;
            trends.push({
              title: 'Dominant Crime Type:',
              content: `${topType[0]} is the most prevalent issue, with ${topType[1]} incidents recorded, accounting for ${topPercentage}% of all recorded events.`
            });
          }
        }
        // Time of Day Analysis - analyze actual incident times if available
        const timeAnalysis = [];
        const morningIncidents = filtered.filter(incident => {
          const time = incident.time || '';
          return time.includes('AM') || (time.includes(':') && parseInt(time.split(':')[0]) < 12);
        }).length;
        const afternoonIncidents = filtered.filter(incident => {
          const time = incident.time || '';
          return time.includes('PM') && !time.includes('12') || (time.includes(':') && parseInt(time.split(':')[0]) >= 12 && parseInt(time.split(':')[0]) < 18);
        }).length;
        const eveningIncidents = filtered.filter(incident => {
          const time = incident.time || '';
          return time.includes('PM') && time.includes('12') || (time.includes(':') && parseInt(time.split(':')[0]) >= 18);
        }).length;
        if (morningIncidents > 0 || afternoonIncidents > 0 || eveningIncidents > 0) {
          const peakTime = Math.max(morningIncidents, afternoonIncidents, eveningIncidents);
          let peakPeriod = '';
          if (peakTime === morningIncidents) peakPeriod = 'Morning (6:00 AM - 11:59 AM)';
          else if (peakTime === afternoonIncidents) peakPeriod = 'Afternoon (12:00 PM - 5:59 PM)';
          else peakPeriod = 'Evening/Late Night (6:00 PM - 11:59 PM)';
          trends.push({
            title: 'Time of Day Analysis:',
            content: `${peakPeriod} shows the highest frequency with ${peakTime} incidents.`,
            subItems: [
              `Morning (6:00 AM - 11:59 AM): ${morningIncidents} incidents`,
              `Afternoon (12:00 PM - 5:59 PM): ${afternoonIncidents} incidents`,
              `Evening/Late Night (6:00 PM - 11:59 PM): ${eveningIncidents} incidents`
            ]
          });
        }
        // Modus Operandi - based on actual incident types
        const modusOperandi = [];
        if (incidentTypes['Theft'] > 0) {
          modusOperandi.push(`Theft: ${incidentTypes['Theft']} incidents recorded, indicating a need for vigilance in commercial and private spaces.`);
        }
        if (incidentTypes['Drug-related'] > 0) {
          modusOperandi.push(`Drug Operations: ${incidentTypes['Drug-related']} drug-related incidents, primarily proactive buy-bust operations.`);
        }
        if (incidentTypes['Traffic Accident'] > 0) {
          modusOperandi.push(`Traffic Incidents: ${incidentTypes['Traffic Accident']} vehicular incidents, primarily due to human error.`);
        }
        if (modusOperandi.length > 0) {
          trends.push({
            title: 'Modus Operandi:',
            content: 'Analysis of incident patterns reveals the following operational methods:',
            subItems: modusOperandi
          });
        }
        return trends;
      };
      // Display dynamic trend analysis
      const dynamicTrends = generateDynamicTrendAnalysis(actualIncidentTypes);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
      dynamicTrends.forEach((trend, index) => {
        // Check for page overflow before each trend
        yPos = checkPageOverflow(yPos, 15);
        // Add bullet point and bold header
        doc.setFont('helvetica', 'bold');
        doc.text(`• ${trend.title}`, leftMargin, yPos);
        yPos += 5;
        // Add content in normal font with minimal spacing
        doc.setFont('helvetica', 'normal');
        yPos = addAutoFitText(trend.content, leftMargin + 10, yPos, doc.internal.pageSize.width - leftMargin * 2 - 10, 10, 5);
        yPos += 5; // Minimal spacing between trends
        if (trend.subItems) {
          trend.subItems.forEach(item => {
            yPos = addAutoFitText(`• ${item}`, leftMargin + 15, yPos, doc.internal.pageSize.width - leftMargin * 2 - 15, 10, 5);
            yPos += 2; // Minimal gap between sub-items
          });
          yPos += 3;
        }
      });
      } // End of Section 3 conditional
      yPos += 8;
      // 4. Root Cause & Contributing Factors (Page 3)
      if (pdfReportData.includeSections.rootCauses) {
        yPos = addSectionHeader('4. Root Cause & Contributing Factors', yPos + 5);
      // Generate dynamic root cause analysis
      const generateDynamicRootCauses = (incidentTypes) => {
        const rootCauses = [];
        // Socioeconomic Factors - if there are theft, robbery, or drug incidents
        const socioeconomicCrimes = (incidentTypes['Theft'] || 0) + (incidentTypes['Robbery'] || 0) + (incidentTypes['Drug-related'] || 0);
        if (socioeconomicCrimes > 0) {
          rootCauses.push({
            title: 'Socioeconomic Factors:',
            content: `Analysis of ${socioeconomicCrimes} incidents (Theft, Robbery, Drug Offenses) suggests potential links between economic factors and criminal activities.`
          });
        }
        // Vehicular Incidents
        const trafficIncidents = (incidentTypes['Traffic Accident'] || 0) + (incidentTypes['Traffic Violation'] || 0);
        if (trafficIncidents > 0) {
          rootCauses.push({
            title: 'Vehicular Incidents:',
            content: `${trafficIncidents} traffic-related incidents were recorded, with human error being the primary contributing factor.`
          });
        }
        // Mental Health - if there are suicide incidents
        if (incidentTypes['Suicide'] > 0) {
          rootCauses.push({
            title: 'Mental Health:',
            content: `${incidentTypes['Suicide']} suicide incidents were recorded, highlighting underlying public health issues requiring multi-agency response.`
          });
        }
        // Firearms Control - if there are illegal firearms incidents
        if (incidentTypes['Illegal Firearms'] > 0) {
          rootCauses.push({
            title: 'Firearms Control:',
            content: `${incidentTypes['Illegal Firearms']} incidents involving illegal firearms were recorded, primarily linked to drug trade operations.`
          });
        }
        // General patterns
        if (filtered.length > 0) {
          rootCauses.push({
            title: 'General Contributing Factors:',
            content: `Analysis of ${filtered.length} total incidents reveals patterns in contributing factors across different incident types.`
          });
        }
        return rootCauses;
      };
      // Display dynamic root causes
      const dynamicRootCauses = generateDynamicRootCauses(actualIncidentTypes);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      dynamicRootCauses.forEach((cause, index) => {
        // Check for page overflow before each cause
        yPos = checkPageOverflow(yPos, 15);
        // Add bullet point and bold header
        doc.setFont('helvetica', 'bold');
        doc.text(`• ${cause.title}`, leftMargin, yPos);
        yPos += 5;
        // Add content in normal font with minimal spacing
        doc.setFont('helvetica', 'normal');
        yPos = addAutoFitText(cause.content, leftMargin + 10, yPos, doc.internal.pageSize.width - leftMargin * 2 - 10, 10, 5);
        yPos += 5; // Minimal spacing between causes
      });
      } // End of Section 4 conditional
      yPos += 15;
      // 5. Actionable Recommendations (Page 3)
      if (pdfReportData.includeSections.recommendations) {
        yPos = addSectionHeader('5. Actionable Recommendations', yPos + 5);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      // Generate dynamic recommendations based on actual data
      const generateDynamicRecommendations = () => {
        const recommendations = [];
        // Get top municipalities with incidents
        const topMunicipalities = Object.entries(municipalityData)
          .filter(([municipality, data]) => data.total > 0)
          .sort(([,a], [,b]) => b.total - a.total)
          .slice(0, 3);
        // Get incident type analysis
        const incidentTypeCounts = {};
        filtered.forEach(incident => {
          const type = identifyIncidentType(incident.description || incident.incidentType || '');
          incidentTypeCounts[type] = (incidentTypeCounts[type] || 0) + 1;
        });
        const topIncidentTypes = Object.entries(incidentTypeCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3);
        // Enhanced Police Visibility and Patrols
        if (topMunicipalities.length > 0) {
          const municipalityNames = topMunicipalities.map(([name]) => name).join(', ');
          recommendations.push({
            title: 'Enhanced Police Visibility and Patrols:',
            content: [
              `• ${municipalityNames}: Allocate additional patrol resources to these municipalities with the highest incident rates.`,
              `• Focus on barangay hotspots identified in the analysis.`,
              `• Increase patrol visibility during peak incident hours.`
            ]
          });
        }
        // Targeted Law Enforcement Operations
        if (topIncidentTypes.length > 0) {
          const drugRelated = incidentTypeCounts['Drug-related'] || 0;
          const trafficRelated = (incidentTypeCounts['Traffic Violation'] || 0) + (incidentTypeCounts['Traffic Accident'] || 0);
          const theftRelated = incidentTypeCounts['Theft'] || 0;
          const operations = [];
          if (drugRelated > 0) {
            operations.push(`Continue proactive anti-drug operations in areas with ${drugRelated} drug-related incidents`);
          }
          if (trafficRelated > 0) {
            operations.push(`Enhance traffic enforcement with ${trafficRelated} traffic-related incidents recorded`);
          }
          if (theftRelated > 0) {
            operations.push(`Strengthen anti-theft measures with ${theftRelated} theft incidents reported`);
          }
          if (operations.length > 0) {
            recommendations.push({
              title: 'Targeted Law Enforcement Operations:',
              content: operations.map(op => `• ${op}.`)
            });
          }
        }
        // Technology and Infrastructure
        const hasTrafficIncidents = (incidentTypeCounts['Traffic Accident'] || 0) > 0;
        const hasTheftIncidents = (incidentTypeCounts['Theft'] || 0) > 0;
        if (hasTrafficIncidents || hasTheftIncidents) {
          const techRecommendations = [];
          if (hasTrafficIncidents) {
            techRecommendations.push('Install additional CCTVs along accident-prone highway stretches');
          }
          if (hasTheftIncidents) {
            techRecommendations.push('Deploy surveillance cameras in commercial areas and public markets');
          }
          recommendations.push({
            title: 'Technology and Infrastructure:',
            content: techRecommendations.map(rec => `• ${rec}.`)
          });
        }
        // Inter-Agency Collaboration
        const hasDrugIncidents = (incidentTypeCounts['Drug-related'] || 0) > 0;
        const hasSuicideIncidents = (incidentTypeCounts['Suicide'] || 0) > 0;
        const hasTrafficIncidents2 = (incidentTypeCounts['Traffic Accident'] || 0) > 0;
        const collaborations = [];
        if (hasDrugIncidents) {
          collaborations.push('LGU/DSWD: Address socioeconomic factors linked to drug-related incidents');
        }
        if (hasSuicideIncidents) {
          collaborations.push('Provincial Health Office: Implement mental health awareness and suicide prevention programs');
        }
        if (hasTrafficIncidents2) {
          collaborations.push('LTO/DPWH: Conduct road safety engineering interventions in high-incident areas');
        }
        if (collaborations.length > 0) {
          recommendations.push({
            title: 'Inter-Agency Collaboration:',
            content: collaborations.map(collab => `• ${collab}.`)
          });
        }
        return recommendations;
      };
      // Generate and display dynamic recommendations
      const dynamicRecommendations = generateDynamicRecommendations();
      if (dynamicRecommendations.length > 0) {
        dynamicRecommendations.forEach((recommendation, index) => {
          // Add section title
          doc.setFont('helvetica', 'bold');
          doc.text(recommendation.title, leftMargin, yPos);
          yPos += 7;
          // Add content
          doc.setFont('helvetica', 'normal');
          recommendation.content.forEach(content => {
            const lines = doc.splitTextToSize(content, doc.internal.pageSize.width - leftMargin * 2);
            doc.text(lines, leftMargin + 10, yPos);
            yPos += lines.length * 5;
          });
          yPos += 10; // Add space between sections
          // Add page break after "Enhanced Police Visibility and Patrols" to move remaining sections to page 4
          if (recommendation.title === 'Enhanced Police Visibility and Patrols:') {
            doc.addPage();
            yPos = 20;
          }
        });
      } else {
        // Fallback if no data available
        doc.text('• Continue current law enforcement operations and community engagement programs.', leftMargin + 10, yPos);
        yPos += 7;
        doc.text('• Maintain regular patrols and police visibility in all municipalities.', leftMargin + 10, yPos);
        yPos += 7;
        doc.text('• Strengthen inter-agency coordination for comprehensive crime prevention.', leftMargin + 10, yPos);
        yPos += 15;
      }
      } // End of Section 5 conditional
      // Insert Risk Forecasting immediately after Recommendations
      if (pdfReportData.includeSections.riskForecasting) {
        // Start new page if near bottom
        yPos = checkPageOverflow(yPos, 40);
        yPos = addSectionHeader('6. Risk Forecasting', yPos + 5);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const generateRiskForecasting = () => {
          const items = [];
          // 1) Municipality risk outlook based on recent counts
          const muniEntries = Object.entries(municipalityData)
            .filter(([, data]) => (data.total || 0) > 0)
            .sort(([, a], [, b]) => (b.total || 0) - (a.total || 0))
            .slice(0, 3);
          if (muniEntries.length > 0) {
            const list = muniEntries.map(([name, data]) => `${name} (${data.total})`).join(', ');
            items.push({
              title: 'High-Risk Municipalities (Next 30 Days):',
              content: `Based on recent incident density, the following areas may require proactive attention: ${list}.`
            });
          }
          // 2) Incident type risk outlook
          const typeEntries = Object.entries(actualIncidentTypes)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3);
          if (typeEntries.length > 0) {
            const list = typeEntries.map(([type, count]) => `${type} (${count})`).join(', ');
            items.push({
              title: 'Likely Incident Types:',
              content: `The following incident types are likely to remain elevated given recent patterns: ${list}.`
            });
          }
          // 3) Temporal risk window
          const morning = filtered.filter(i => (i.time || '').toLowerCase().includes('am')).length;
          const night = filtered.filter(i => (i.time || '').toLowerCase().includes('pm')).length;
          if (morning + night > 0) {
            const peak = morning >= night ? 'morning hours (6:00 AM - 12:00 NN)' : 'evening hours (6:00 PM - 12:00 MN)';
            items.push({
              title: 'Peak Risk Window:',
              content: `Historical data suggests higher occurrence during ${peak}. Schedule patrols accordingly.`
            });
          }
          // 4) Seasonality hint (if selectedMonth == all)
          if (selectedMonth === 'all') {
            items.push({
              title: 'Seasonality Considerations:',
              content: 'Expect fluctuations around holidays, weekends, and local events; plan surge deployments and checkpoint operations.'
            });
          }
          if (items.length === 0) {
            items.push({ title: 'Risk Outlook:', content: 'No sufficient signals for forecasting. Maintain baseline operations.' });
          }
          return items;
        };
        const riskItems = generateRiskForecasting();
        riskItems.forEach((rf) => {
          yPos = checkPageOverflow(yPos, 15);
          doc.setFont('helvetica', 'bold');
          doc.text(`• ${rf.title}`, leftMargin, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          yPos = addAutoFitText(rf.content, leftMargin + 10, yPos, doc.internal.pageSize.width - leftMargin * 2 - 10, 10, 5);
          yPos += 6;
        });
      }
      // Add page numbers and headers to all pages
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        // Add page number at bottom
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Page ${i} of ${totalPages}`, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 15, { align: 'right' });
      }
      // Generate filename and save
      const filename = `Crime_Analysis_Report_${selectedMonth === "all" ? "All_Months" : selectedMonth}_${new Date().getFullYear()}.pdf`;
      try {
        doc.save(filename);
        console.log('PDF generated successfully:', filename);
        // Show success message
        const successMessage = `PDF Report generated successfully!\n\nFilename: ${filename}\nTotal Pages: ${totalPages}\nSections Included: ${Object.keys(pdfReportData.includeSections).filter(key => pdfReportData.includeSections[key]).length}\nTotal Incidents: ${filtered.length}`;
        alert(successMessage);
      } catch (saveError) {
        console.error('Error saving PDF:', saveError);
        alert('Error saving PDF file. Please check your browser settings and try again.');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      // More detailed error handling
      let errorMessage = 'Error generating PDF report. ';
      if (error.message.includes('autoTable')) {
        errorMessage += 'Table plugin not available. Please refresh the page and try again.';
      } else if (error.message.includes('memory')) {
        errorMessage += 'Document too large. Please reduce the number of incidents or sections.';
      } else if (error.message.includes('font')) {
        errorMessage += 'Font loading error. Please refresh the page and try again.';
      } else {
        errorMessage += 'Please try again or contact support if the problem persists.';
      }
      alert(errorMessage);
    } finally {
      setIsGeneratingPdf(false);
    }
  }; // End of exportIncidentsToPDF function
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
    const completedIncidents = filteredData.filter(incident => 
      incident.status === 'Completed' || 
      incident.status === 'completed' || 
      incident.status === 'COMPLETED'
    ).length;
    const actionTakenIncidents = filteredData.filter(incident => 
      incident.actionType && incident.actionType.trim() !== ""
    ).length;
    const underInvestigation = filteredData.filter(incident => 
      incident.status === 'Under Investigation' || 
      incident.status === 'under investigation' || 
      incident.status === 'UNDER INVESTIGATION' ||
      incident.status === 'Under investigation'
    ).length;
    const drugsIncidents = filteredData.filter(incident => 
      incident.incidentType === 'Drug-related'
    ).length;
    const othersIncidents = filteredData.filter(incident => 
      incident.incidentType !== 'Drug-related' && 
      incident.incidentType !== 'Theft' && 
      incident.incidentType !== 'Assault' && 
      incident.incidentType !== 'Traffic Violation' && 
      incident.incidentType !== 'Vandalism' && 
      incident.incidentType !== 'Fraud' && 
      incident.incidentType !== 'Domestic Violence' && 
      incident.incidentType !== 'Public Disturbance' && 
      incident.incidentType !== 'Property Damage' && 
      incident.incidentType !== 'Missing Person' && 
      incident.incidentType !== 'Suspicious Activity' && 
      incident.incidentType !== 'Environmental Violation' && 
      incident.incidentType !== 'Animal Control' && 
      incident.incidentType !== 'Fire Safety' && 
      incident.incidentType !== 'Emergency Response' && 
      incident.incidentType !== 'Other'
    ).length;
    const accidentsIncidents = filteredData.filter(incident => 
      incident.incidentType === 'Traffic Accident' || 
      incident.incidentType === 'Work Accident' || 
      incident.incidentType === 'Accident' ||
      incident.description?.toLowerCase().includes('accident') ||
      incident.description?.toLowerCase().includes('crash') ||
      incident.description?.toLowerCase().includes('collision')
    ).length;
    const trafficAccidents = filteredData.filter(incident => 
      incident.incidentType === 'Traffic Accident' || 
      incident.incidentType === 'Traffic Violation' ||
      incident.description?.toLowerCase().includes('traffic') && (
        incident.description?.toLowerCase().includes('accident') ||
        incident.description?.toLowerCase().includes('crash') ||
        incident.description?.toLowerCase().includes('collision')
      )
    ).length;
    const workAccidents = filteredData.filter(incident => 
      incident.incidentType === 'Work Accident' ||
      incident.description?.toLowerCase().includes('work') && (
        incident.description?.toLowerCase().includes('accident') ||
        incident.description?.toLowerCase().includes('injury') ||
        incident.description?.toLowerCase().includes('fall')
      )
    ).length;
    const otherAccidents = filteredData.filter(incident => 
      (incident.incidentType === 'Accident' || 
       incident.description?.toLowerCase().includes('accident')) &&
      !(incident.incidentType === 'Traffic Accident' || 
        incident.incidentType === 'Work Accident' ||
        incident.description?.toLowerCase().includes('traffic') ||
        incident.description?.toLowerCase().includes('work'))
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
    const completionRate = totalIncidents > 0 ? ((completedIncidents / totalIncidents) * 100).toFixed(1) : 0;
    return {
      totalIncidents,
              completedIncidents,
      actionTakenIncidents,
      underInvestigation,
      drugsIncidents,
      othersIncidents,
      accidentsIncidents,
      trafficAccidents,
      workAccidents,
      otherAccidents,
      mostCommonType,
      mostActiveDistrict,
      highestMonth,
      completionRate,
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
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Incidents Reports</h1>
            <p className="text-gray-500 mt-2">Manage and track incident reports with comprehensive analytics</p>
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
                <DropdownMenuLabel>Incident Management</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => setShowAddModal(true)}
                  disabled={loading}
                  className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black"
                >
                  <Plus className="w-4 h-4 text-black" />
                  <span>Add New Incident</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Data Management</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={handleImportExcel}
                  className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black"
                >
                  <Upload className="w-4 h-4 text-black" />
                  <span>Import Excel/CSV</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Data Cleanup</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={identifyDuplicateIncidents}
                  disabled={cleanupLoading}
                  className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black"
                >
                  <Search className="w-4 h-4 text-black" />
                  <span>Identify Duplicates</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={manualCleanupDuplicates}
                  disabled={cleanupLoading}
                  className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black"
                >
                  <Eraser className="w-4 h-4 text-black" />
                  <span>Clean Duplicates</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={clearCurrentMonthIncidents}
                  disabled={cleanupLoading}
                  className="flex items-center gap-3 cursor-pointer hover:bg-indigo-50 hover:text-indigo-700 focus:bg-indigo-50 focus:text-indigo-700"
                >
                  <Calendar className="w-4 h-4 text-black" />
                  <span>Clear Current Month</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (confirm('⚠️ Are you sure you want to delete ALL incidents? This action cannot be undone!')) {
                      clearAllIncidentsData();
                    }
                  }}
                  disabled={cleanupLoading}
                  className="flex items-center gap-3 cursor-pointer text-red-600 hover:bg-gray-100 hover:text-red-700 focus:bg-gray-100 focus:text-red-700"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                  <span>Clear All Data</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
        {/* Connection Error Display */}
        {connectionError && (
          <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-red-100">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium transition-colors duration-300 text-red-700">
                  {connectionError}
                </span>
                {!isOnline && (
                  <div className="mt-1">
                    <span className="text-xs transition-colors duration-300 text-red-600">
                      📡 You are currently offline
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={loadIncidents}
                disabled={loading}
                className="h-8 px-3 text-xs border border-red-500 text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200 flex items-center"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry
              </button>
            </div>
          </div>
        )}
        {/* Connection Status Indicator */}
        {!isOnline && !connectionError && (
          <div className="mb-4 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-yellow-100">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
              </div>
              <span className="text-sm font-medium transition-colors duration-300 text-yellow-700">
                📡 You are currently offline. Some features may not work properly.
              </span>
            </div>
          </div>
        )}
        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1 truncate">Total Incidents</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600">
                    {stats.total.toLocaleString()}
                  </p>
                </div>
                <div className="p-1.5 sm:p-2 lg:p-3 bg-blue-100 rounded-xl flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-gray-200">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1 truncate">Action Taken</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">
                    {stats.actionTaken.toLocaleString()}
                  </p>
                </div>
                <div className="p-1.5 sm:p-2 lg:p-3 bg-green-100 rounded-xl flex-shrink-0">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-gray-200">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1 truncate">Drug Related</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600">
                    {stats.drugs.toLocaleString()}
                  </p>
                </div>
                <div className="p-1.5 sm:p-2 lg:p-3 bg-red-100 rounded-xl flex-shrink-0">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-gray-200">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1 truncate">Accidents</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-600">
                    {stats.accidents.toLocaleString()}
                  </p>
                </div>
                <div className="p-1.5 sm:p-2 lg:p-3 bg-orange-100 rounded-xl flex-shrink-0">
                  <Car className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Report Filters */}
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-gray-900">Filters &amp; Search</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    setSelectedMonth(now.toLocaleString('en-US', { month: 'long' }));
                    setSelectedYear(String(now.getFullYear()));
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-md transition-colors duration-200"
                >
                  Current Month
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedMonth(new Date().toLocaleString('en-US', { month: 'long' }));
                    setSelectedYear(new Date().getFullYear().toString());
                    setFilterDistrict("all");
                    setFilterMunicipality("all");
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-md transition-colors duration-200"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="search" className="text-sm font-medium text-gray-700">Search</Label>
                <Input
                  id="search"
                  name="search"
                  placeholder="Search municipalities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoComplete="off"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="month-filter" className="text-sm font-medium text-gray-700">Month</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger id="month-filter" name="month-filter">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      'January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'
                    ].map((month) => (
                      <SelectItem key={month} value={month}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="year-filter" className="text-sm font-medium text-gray-700">Year</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger id="year-filter" name="year-filter">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="district-filter" className="text-sm font-medium text-gray-700">District</Label>
                <Select value={filterDistrict} onValueChange={setFilterDistrict}>
                  <SelectTrigger id="district-filter" name="district-filter">
                    <SelectValue placeholder="All Districts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Districts</SelectItem>
                    {availableDistricts.map((district) => (
                      <SelectItem key={district} value={district}>
                        {district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Active Filters Display */}
            {(searchTerm || filterDistrict !== "all") && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-600">Active filters:</span>
                  {searchTerm && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-black border border-gray-200">
                      <Search className="w-3 h-3 mr-1" />
                      Search: "{searchTerm}"
                    </span>
                  )}
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-black border border-gray-200">
                    <Calendar className="w-3 h-3 mr-1" />
                    {selectedMonth} {selectedYear}
                  </span>
                  {filterDistrict !== "all" && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-black border border-gray-200">
                      <Building2 className="w-3 h-3 mr-1" />
                      District: {filterDistrict}
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        {/* Incidents Table */}
        <div className="border rounded-md border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="border-gray-200 w-full">
              <TableCaption className="text-slate-500">Incident reports and their current status.</TableCaption>
            <TableHeader>
              <TableRow className="border-b border-gray-200">
                <TableHead className="min-w-[120px] border-gray-200 align-top py-3 px-2 break-words whitespace-normal font-semibold text-center text-xs">Type</TableHead>
                <TableHead className="min-w-[200px] border-gray-200 align-top py-3 px-2 break-words whitespace-normal font-semibold text-center text-xs">Description</TableHead>
                <TableHead className="min-w-[100px] border-gray-200 align-top py-3 px-2 break-words whitespace-normal font-semibold text-center text-xs">Date</TableHead>
                <TableHead className="min-w-[150px] border-gray-200 align-top py-3 px-2 break-words whitespace-normal font-semibold text-center text-xs">Location</TableHead>
                <TableHead className="min-w-[120px] border-gray-200 align-top py-3 px-2 break-words whitespace-normal font-semibold text-center text-xs">Officer</TableHead>
                <TableHead className="min-w-[120px] border-gray-200 align-top py-3 px-2 break-words whitespace-normal font-semibold text-center text-xs">Action Taken</TableHead>
                <TableHead className="min-w-[100px] border-gray-200 align-top py-3 px-2 break-words whitespace-normal font-semibold text-center text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-8 text-center align-middle">
                    <div className="text-lg text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <RotateCcw className="w-5 h-5 animate-spin" />
                        <span>Loading incident reports...</span>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredIncidents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-8 text-center align-middle">
                    <div className="text-lg text-gray-500">
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
                  </TableCell>
                </TableRow>
                  ) : (
                    paginatedIncidents.map((incident, index) => {
                      // Debug: Log incident data being displayed in table
                      console.log('📋 Displaying incident in table:', {
                        index: index,
                        incident: incident,
                        incidentType: incident.incidentType,
                        date: incident.date,
                        location: incident.location,
                        officer: incident.officer
                      });
                      return (
                      <TableRow key={index} className="border-gray-200 hover:bg-gray-50/50">
                      <TableCell className="font-medium break-all align-top whitespace-normal">
                        <div className="py-2 px-1 min-w-0">
                          <p className="text-gray-900 text-xs leading-tight break-words hyphens-auto word-wrap">
                            {incident.incidentType}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="break-all align-top whitespace-normal">
                        <div className="py-2 px-1 min-w-0">
                          <p className="text-gray-900 text-xs leading-relaxed break-words hyphens-auto word-wrap">
                            {incident.description || '-'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="break-all align-top whitespace-normal">
                        <div className="py-2 px-1 min-w-0">
                          <p className="text-gray-900 text-xs break-words hyphens-auto word-wrap">
                            {incident.date || '-'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="break-all align-top whitespace-normal">
                        <div className="py-2 px-1 min-w-0">
                          <p className="text-gray-900 text-xs leading-tight break-words hyphens-auto word-wrap">
                            {incident.location || '-'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="break-all align-top whitespace-normal">
                        <div className="py-2 px-1 min-w-0">
                          <p className="text-gray-900 text-xs break-words hyphens-auto word-wrap">
                            {incident.officer || '-'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="break-all align-top whitespace-normal">
                        <div className="py-2 px-1 min-w-0">
                          {incident.actionType ? (
                            <p className="text-gray-900 text-xs leading-tight break-words hyphens-auto word-wrap">
                              {incident.actionType}
                            </p>
                          ) : (
                            <p className="text-gray-500 text-xs italic break-words hyphens-auto word-wrap">
                              No Action
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="break-all align-top whitespace-normal text-center">
                        <div className="py-2 px-1 min-w-0 flex items-center justify-center gap-1 text-center">
                          <button
                            onClick={() => {
                              // Close all other modals first
                              setShowAddModal(false);
                              setShowEditModal(false);
                              setShowSummaryModal(false);
                              setShowPdfEditModal(false);
                              setShowPdfPreviewModal(false);
                              
                              setViewingIncident(incident);
                              setShowViewModal(true);
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200"
                            title="View Details"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => {
                              // Close all other modals first
                              setShowAddModal(false);
                              setShowViewModal(false);
                              setShowSummaryModal(false);
                              setShowPdfEditModal(false);
                              setShowPdfPreviewModal(false);
                              
                              const validatedIncident = validateIncidentForEdit(incident);
                              setEditingIncident(validatedIncident);
                              setShowEditModal(true);
                            }}
                            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors duration-200"
                            title="Edit Incident"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          {incident.link && (
                            <button
                              onClick={() => window.open(incident.link, '_blank')}
                              className="p-1 text-purple-600 hover:bg-purple-50 rounded transition-colors duration-200"
                              title="Open Link"
                            >
                              <Link className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              // Close all other modals first
                              setShowAddModal(false);
                              setShowViewModal(false);
                              setShowEditModal(false);
                              setShowSummaryModal(false);
                              setShowPdfEditModal(false);
                              setShowPdfPreviewModal(false);
                              
                              setDeletingIncident(incident);
                              setShowDeleteModal(true);
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                            title="Delete Incident"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </TableCell>
                      </TableRow>
                    );
                    })
                  )}
            </TableBody>
          </Table>
          </div>
          
          {/* Pagination Controls */}
          {filteredIncidents.length > 0 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-white border-t border-gray-200">
              {/* Items per page selector */}
              <div className="flex items-center gap-2">
                <label htmlFor="itemsPerPage" className="text-sm font-medium text-gray-700">
                  Show:
                </label>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                  setItemsPerPage(parseInt(value));
                  setPaginationPage(1);
                }}>
                  <SelectTrigger id="itemsPerPage" name="itemsPerPage" className="w-20">
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
                Showing {startIndex + 1} to {Math.min(endIndex, filteredIncidents.length)} of {filteredIncidents.length} entries
              </div>
              
              {/* Pagination buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={prevPage}
                  disabled={paginationPage === 1}
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
                      
                      if (paginationPage <= 3) {
                        // Near the beginning
                        startPage = 2;
                        endPage = 4;
                      } else if (paginationPage >= totalPages - 2) {
                        // Near the end
                        startPage = totalPages - 3;
                        endPage = totalPages - 1;
                      } else {
                        // In the middle
                        startPage = paginationPage - 1;
                        endPage = paginationPage + 1;
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
                            paginationPage === page
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
                  disabled={paginationPage === totalPages}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  title="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Add Incident Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden transform transition-all duration-300 scale-100 animate-in fade-in-0 zoom-in-95">
            {/* Header with solid background */}
            <div className="relative p-6 border-b bg-gray-50 border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-100">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold transition-colors duration-300 text-gray-900">
                  Add New Action Report
              </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl transition-all duration-300 hover:scale-110 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            {/* Content with improved spacing and styling */}
            <div className="p-8 overflow-y-auto max-h-[75vh]">
              <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="incidentType" className="text-sm font-semibold text-gray-700">
                    Department *
                  </Label>
                  <Select value={newIncident.incidentType} onValueChange={handleIncidentTypeChange}>
                    <SelectTrigger id="incidentType" name="incidentType" className="mt-2">
                      <SelectValue placeholder="Select Incident Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {incidentTypes.map((type, index) => (
                        <SelectItem key={index} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {newIncident.incidentType && newIncident.incidentType.startsWith("Other (") && (
                    <p className="mt-1 text-xs transition-colors duration-300 text-blue-600">
                      ✅ Formatted as: {newIncident.incidentType}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="date" className="text-sm font-semibold transition-colors duration-300 text-gray-700">
                    When *
                  </Label>
                  <Input
                    id="date"
                    name="date"
                    type="text"
                    placeholder="Enter date and time (e.g., January 15, 2024 2:30 PM)"
                    value={newIncident.date}
                    onChange={(e) => setNewIncident({...newIncident, date: e.target.value})}
                    className="mt-2 p-3 rounded-xl border-2 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 hover:border-gray-400"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <Label htmlFor="district" className="text-sm font-semibold text-gray-700">
                    District *
                  </Label>
                  <Select value={newIncident.district} onValueChange={handleDistrictChange}>
                    <SelectTrigger id="district" name="district" className="mt-2">
                      <SelectValue placeholder="Select District" />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map((district) => (
                        <SelectItem key={district} value={district}>
                          {district}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="municipality" className="text-sm font-semibold text-gray-700">
                    Municipality *
                  </Label>
                  <Select value={newIncident.municipality} onValueChange={(value) => setNewIncident({...newIncident, municipality: value})}>
                    <SelectTrigger id="municipality" name="municipality" className="mt-2">
                      <SelectValue placeholder="Select Municipality" />
                    </SelectTrigger>
                    <SelectContent>
                      {municipalitiesByDistrict[newIncident.district]?.map((municipality) => (
                        <SelectItem key={municipality} value={municipality}>
                          {municipality}
                        </SelectItem>
                      )) || []}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location" className="text-sm font-semibold transition-colors duration-300 text-gray-700">
                    Where *
                  </Label>
                  <Input
                    id="location"
                    name="location"
                    value={newIncident.location}
                    onChange={(e) => setNewIncident({...newIncident, location: e.target.value})}
                    placeholder="Enter specific location"
                    className="mt-2 p-3 rounded-xl border-2 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 hover:border-gray-400"
                    autoComplete="street-address"
                  />
                </div>
                <div>
                  <Label htmlFor="officer" className="text-sm font-semibold transition-colors duration-300 text-gray-700">
                    Who *
                  </Label>
                  <Input
                    id="officer"
                    name="officer"
                    value={newIncident.officer}
                    onChange={(e) => setNewIncident({...newIncident, officer: e.target.value})}
                    placeholder="Enter officer name"
                    className="mt-2 p-3 rounded-xl border-2 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 hover:border-gray-400"
                    autoComplete="name"
                  />
                </div>
                <div>
                  <Label htmlFor="why" className="text-sm font-semibold transition-colors duration-300 text-gray-700">
                    Why
                  </Label>
                  <Input
                    id="why"
                    name="why"
                    value={newIncident.why}
                    onChange={(e) => setNewIncident({...newIncident, why: e.target.value})}
                    placeholder="Enter reason or cause"
                    className="mt-2 p-3 rounded-xl border-2 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 hover:border-gray-400"
                    autoComplete="off"
                  />
                </div>
              </div>
              
              {/* What - Full Width */}
              <div>
                <Label htmlFor="what" className="text-sm font-semibold transition-colors duration-300 text-gray-700">
                  What *
                </Label>
                <textarea
                  id="what"
                  name="what"
                  value={newIncident.description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  placeholder="Enter incident description"
                  autoComplete="off"
                  rows={3}
                  className="mt-2 w-full p-3 rounded-xl border-2 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 hover:border-gray-400"
                />
              </div>
              
              {/* Action Taken Section - Full Width */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Action Taken</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="actionType" className="text-sm font-semibold transition-colors duration-300 text-gray-700">
                      Action Type *
                    </Label>
                    <select
                      id="actionType"
                      name="actionType"
                      value={newIncident.actionType}
                      onChange={(e) => setNewIncident({...newIncident, actionType: e.target.value})}
                      className="mt-2 w-full p-3 rounded-xl border-2 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 hover:border-gray-400"
                    >
                      <option value="">Select Action</option>
                      {actionTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="assignedOfficer" className="text-sm font-semibold transition-colors duration-300 text-gray-700">
                      Assigned Officer
                    </Label>
                    <Input
                      id="assignedOfficer"
                      name="assignedOfficer"
                      placeholder="Enter assigned officer name"
                      value={newIncident.assignedOfficer}
                      onChange={(e) => setNewIncident({...newIncident, assignedOfficer: e.target.value})}
                      className="mt-2 p-3 rounded-xl border-2 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 hover:border-gray-400"
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="actionDate" className="text-sm font-semibold transition-colors duration-300 text-gray-700">
                      Action Date
                    </Label>
                    <Input
                      id="actionDate"
                      name="actionDate"
                      type="date"
                      value={newIncident.actionDate}
                      onChange={(e) => setNewIncident({...newIncident, actionDate: e.target.value})}
                      className="mt-2 p-3 rounded-xl border-2 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 hover:border-gray-400"
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <Label htmlFor="how" className="text-sm font-semibold transition-colors duration-300 text-gray-700">
                      How
                    </Label>
                    <Input
                      id="how"
                      name="how"
                      value={newIncident.actionDescription}
                      onChange={(e) => setNewIncident({...newIncident, actionDescription: e.target.value})}
                      placeholder="Enter action method"
                      className="mt-2 p-3 rounded-xl border-2 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 hover:border-gray-400"
                      autoComplete="off"
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <Label htmlFor="actionDescription" className="text-sm font-semibold transition-colors duration-300 text-gray-700">
                    Action Description
                  </Label>
                  <textarea
                    id="actionDescription"
                    name="actionDescription"
                    placeholder="Describe the action taken in detail..."
                    value={newIncident.actionDescription}
                    onChange={(e) => setNewIncident({...newIncident, actionDescription: e.target.value})}
                    rows={3}
                    className="mt-2 w-full p-3 rounded-xl border-2 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 hover:border-gray-400"
                  />
                </div>
              </div>
              
              {/* Other Information - Full Width */}
              <div>
                  <Label htmlFor="otherInfo" className="text-sm font-semibold transition-colors duration-300 text-gray-700">
                    Other Information
                  </Label>
                  <textarea
                    id="otherInfo"
                    name="otherInfo"
                    value={newIncident.followUpNotes}
                    onChange={(e) => setNewIncident({...newIncident, followUpNotes: e.target.value})}
                    placeholder="Additional details and notes..."
                    rows={4}
                    className="mt-2 w-full p-3 rounded-xl border-2 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 hover:border-gray-400"
                  />
                </div>
              </div>
            </div>
            {/* Footer with solid background */}
            <div className="flex justify-end gap-4 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddIncident}
                className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl flex items-center"
              >
                <Save className="w-5 h-5 mr-2" />
                Save Report
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Summary Insights Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden transform transition-all duration-300 scale-100 animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg transition-all duration-300 bg-blue-100 border border-blue-200">
                <BarChart3 className="w-6 h-6 transition-colors duration-300 text-blue-600" />
                </div>
                <div>
                <h3 className="text-2xl font-bold transition-colors duration-300 text-gray-900">
                    Summary Insights
                  </h3>
                <p className="text-sm transition-colors duration-300 text-gray-600">Comprehensive analysis of incident data</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const insights = generateSummaryInsights();
                    alert(`Detection Test Results:
Total Incidents: ${insights.totalIncidents}
Active: ${insights.activeIncidents}
Completed: ${insights.completedIncidents}
Completion Rate: ${insights.completionRate}%

Top District: ${insights.topDistrict}
Top Municipality: ${insights.topMunicipality}
Top Location: ${insights.topLocation}`);
                  }}
                  className="p-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors duration-200"
                  title="Test Detection"
                >
                  <Zap className="w-5 h-5" />
                </button>
                <button
                  onClick={exportSummaryToPDF}
                  className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
                  title="Export to PDF"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowSummaryModal(false)}
                  className="p-2 rounded-lg transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700"
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
                    <div 
                      className="p-6 rounded-xl border-2 bg-blue-50 border-blue-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-blue-100">
                          <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">📊 Data Overview {selectedMonth !== "all" && `(${selectedMonth})`}</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        <div className="p-4 rounded-lg bg-blue-100">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-full bg-blue-200">
                              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <p className="text-sm font-medium text-blue-600">Total Incidents</p>
                          </div>
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{insights.totalIncidents}</p>
                          <p className="text-xs text-gray-600"></p>
                        </div>
                        <div className="p-4 rounded-lg bg-red-100">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-full bg-red-200">
                              <Shield className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </div>
                            <p className="text-sm font-medium text-red-600">Drugs</p>
                          </div>
                          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{insights.drugsIncidents}</p>
                          <p className="text-xs text-gray-600">Drug-related incidents</p>
                        </div>
                        <div className="p-4 rounded-lg bg-gray-100">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-full bg-gray-200">
                              <MoreHorizontal className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-600">Others</p>
                          </div>
                          <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{insights.othersIncidents}</p>
                          <p className="text-xs text-gray-600">Other incident types</p>
                        </div>
                        <div className="p-4 rounded-lg bg-orange-100">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-full bg-orange-200">
                              <Car className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                            </div>
                            <p className="text-sm font-medium text-orange-600">Accidents</p>
                          </div>
                          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{insights.accidentsIncidents}</p>
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">Traffic:</span>
                              <span className="font-medium text-orange-600 dark:text-orange-400">{insights.trafficAccidents}</span>
                        </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">Other:</span>
                              <span className="font-medium text-orange-600 dark:text-orange-400">{insights.otherAccidents}</span>
                      </div>
                    </div>
                          <p className="text-xs mt-2 text-gray-600">Accident breakdown</p>
                        </div>
                        <div className="p-4 rounded-lg bg-yellow-100">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-full bg-yellow-200">
                              <CheckCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <p className="text-sm font-medium text-yellow-600">Action Taken</p>
                          </div>
                          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{insights.actionTakenIncidents}</p>
                          <p className="text-xs text-gray-600">Actions completed</p>
                        </div>
                      </div>
                    </div>
                    {/* Three Districts Analysis */}
                    <div className="p-6 rounded-xl border-2 bg-green-50 border-green-200">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-green-100">
                          <MapPin className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">🗺️ Three Districts Analysis</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* 1ST DISTRICT */}
                        <div className="p-4 rounded-lg border-2 bg-blue-100 border-blue-200">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                            <h4 className="font-bold text-gray-900">1ST DISTRICT</h4>
                          </div>
                          <div className="space-y-3">
                            <div className="text-center">
                              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{insights.threeDistricts['1ST DISTRICT'].count}</p>
                              <p className="text-sm text-gray-600">Incidents Detected</p>
                            </div>
                            <div className="p-3 rounded-lg bg-blue-50">
                              <p className="text-sm font-semibold mb-2 text-blue-700">📍 Detected Municipalities:</p>
                              {insights.threeDistricts['1ST DISTRICT'].detectedMunicipalities.length > 0 ? (
                                <div className="space-y-1">
                                  {insights.threeDistricts['1ST DISTRICT'].detectedMunicipalities.map((municipality, index) => (
                                    <div key={index} className="text-xs px-2 py-1 rounded bg-blue-200 text-blue-800">
                                      ✓ {municipality}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-gray-500">No municipalities detected</p>
                              )}
                            </div>
                            <div className="text-xs p-2 rounded bg-gray-100 text-gray-600">
                              <p className="font-semibold mb-1">🔍 How it works:</p>
                              <p>Searches for: Abucay, Orani, Samal, Hermosa</p>
                              <p>in location descriptions</p>
                            </div>
                          </div>
                        </div>
                        {/* 2ND DISTRICT */}
                        <div className="p-4 rounded-lg border-2 bg-green-100 border-green-200">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-3 h-3 rounded-full bg-green-600"></div>
                            <h4 className="font-bold text-gray-900">2ND DISTRICT</h4>
                          </div>
                          <div className="space-y-3">
                            <div className="text-center">
                              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{insights.threeDistricts['2ND DISTRICT'].count}</p>
                              <p className="text-sm text-gray-600">Incidents Detected</p>
                            </div>
                            <div className="p-3 rounded-lg bg-green-50">
                              <p className="text-sm font-semibold mb-2 text-green-700">📍 Detected Municipalities:</p>
                              {insights.threeDistricts['2ND DISTRICT'].detectedMunicipalities.length > 0 ? (
                                <div className="space-y-1">
                                  {insights.threeDistricts['2ND DISTRICT'].detectedMunicipalities.map((municipality, index) => (
                                    <div key={index} className="text-xs px-2 py-1 rounded bg-green-200 text-green-800">
                                      ✓ {municipality}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-gray-500">No municipalities detected</p>
                              )}
                            </div>
                            <div className="text-xs p-2 rounded bg-gray-100 text-gray-600">
                              <p className="font-semibold mb-1">🔍 How it works:</p>
                              <p>Searches for: Balanga City, Pilar, Orion, Limay</p>
                              <p>in location descriptions</p>
                            </div>
                          </div>
                        </div>
                        {/* 3RD DISTRICT */}
                        <div className="p-4 rounded-lg border-2 bg-purple-100 border-purple-200">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                            <h4 className="font-bold text-gray-900">3RD DISTRICT</h4>
                          </div>
                          <div className="space-y-3">
                            <div className="text-center">
                              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{insights.threeDistricts['3RD DISTRICT'].count}</p>
                              <p className="text-sm text-gray-600">Incidents Detected</p>
                            </div>
                            <div className="p-3 rounded-lg bg-purple-50">
                              <p className="text-sm font-semibold mb-2 text-purple-700">📍 Detected Municipalities:</p>
                              {insights.threeDistricts['3RD DISTRICT'].detectedMunicipalities.length > 0 ? (
                                <div className="space-y-1">
                                  {insights.threeDistricts['3RD DISTRICT'].detectedMunicipalities.map((municipality, index) => (
                                    <div key={index} className="text-xs px-2 py-1 rounded bg-purple-200 text-purple-800">
                                      ✓ {municipality}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-gray-500">No municipalities detected</p>
                              )}
                            </div>
                            <div className="text-xs p-2 rounded bg-gray-100 text-gray-600">
                              <p className="font-semibold mb-1">🔍 How it works:</p>
                              <p>Searches for: Bagac, Dinalupihan, Mariveles, Morong</p>
                              <p>in location descriptions</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Explanation Section */}
                      <div className="mt-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <h4 className="font-bold text-gray-900">💡 How Detection Works</h4>
                        </div>
                        <div className="text-sm space-y-2 text-gray-600">
                          <p>• <strong>Location Analysis:</strong> The system reads the "Location" field from each incident</p>
                          <p>• <strong>Municipality Search:</strong> It searches for municipality names within the location text</p>
                          <p>• <strong>District Assignment:</strong> Each municipality is automatically assigned to its correct district</p>
                          <p>• <strong>Counting:</strong> Incidents are counted based on detected municipalities, not the district field</p>
                          <p>• <strong>Example:</strong> "Brgy. Mabuco, Hermosa, Bataan" → Detects "Hermosa" → Counts as 1ST DISTRICT</p>
                        </div>
                      </div>
                    </div>
                    {/* Three Districts Overview */}
                    <Card className="backdrop-blur-sm border-0 shadow-lg ${
                      bg-white/80
                    }">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold transition-colors duration-300 text-gray-900">Three Districts Overview</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center p-4 rounded-lg bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700">
                            <div className="flex items-center justify-center mb-2">
                              <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-2" />
                              <span className="font-semibold text-blue-700 dark:text-blue-300">1ST DISTRICT</span>
                            </div>
                            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{insights.threeDistricts['1ST DISTRICT'].count}</p>
                            <p className="text-sm transition-colors duration-300 text-gray-600">Incidents</p>
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
                            <p className="text-sm transition-colors duration-300 text-gray-600">Incidents</p>
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
                            <p className="text-sm transition-colors duration-300 text-gray-600">Incidents</p>
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
                    <Card className="backdrop-blur-sm border-0 shadow-lg ${
                      bg-white/80
                    }">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold transition-colors duration-300 ${
                          text-gray-900
                        }">Incident Type Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {/* Summary Total */}
                        <div className="mb-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-semibold transition-colors duration-300 ${
                              text-blue-700
                            }">Total Incidents by Type</span>
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
                                <span className="font-medium transition-colors duration-300 ${
                                  text-gray-700
                                }">{type}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm transition-colors duration-300 ${
                                    text-gray-500
                                  }">
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
                    <Card className="backdrop-blur-sm border-0 shadow-lg ${
                      bg-white/80
                    }">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold transition-colors duration-300 ${
                          text-gray-900
                        }">Location Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Top Municipalities */}
                          <div>
                            <h4 className="text-md font-semibold mb-3 transition-colors duration-300 ${
                              text-gray-700
                            }">Top Municipalities</h4>
                            <div className="space-y-2">
                              {insights.topMunicipalities.length > 0 ? (
                                insights.topMunicipalities.map((item, index) => (
                                  <div key={item.municipality} className="flex items-center justify-between p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium transition-colors duration-300 ${
                                        text-blue-700
                                      }">#{index + 1}</span>
                                      <span className="font-medium transition-colors duration-300 ${
                                        text-gray-700
                                      }">{item.municipality}</span>
                                    </div>
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                      {item.count} incidents
                                    </Badge>
                                  </div>
                                ))
                              ) : (
                                <div className="text-center py-4 text-sm transition-colors duration-300 ${
                                  text-gray-500
                                }">
                                  No municipality data available
                                </div>
                              )}
                            </div>
                          </div>
                          {/* Top Specific Locations */}
                          <div>
                            <h4 className="text-md font-semibold mb-3 transition-colors duration-300 ${
                              text-gray-700
                            }">Top Specific Locations</h4>
                            <div className="space-y-2">
                              {insights.topLocations.length > 0 ? (
                                insights.topLocations.map((item, index) => (
                                  <div key={item.location} className="flex items-center justify-between p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium transition-colors duration-300 ${
                                        text-green-700
                                      }">#{index + 1}</span>
                                      <span className="font-medium transition-colors duration-300 ${
                                        text-gray-700
                                      }" title={item.location}>
                                        {item.location.length > 25 ? item.location.substring(0, 25) + '...' : item.location}
                                      </span>
                                    </div>
                                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                      {item.count} incidents
                                    </Badge>
                                  </div>
                                ))
                              ) : (
                                <div className="text-center py-4 text-sm transition-colors duration-300 ${
                                  text-gray-500
                                }">
                                  No location data available
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    {/* District Analysis */}
                    <Card className="backdrop-blur-sm border-0 shadow-lg ${
                      bg-white/80
                    }">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold transition-colors duration-300 ${
                          text-gray-900
                        }">District Activity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {Object.entries(insights.districtCounts)
                            .sort(([,a], [,b]) => b - a)
                            .map(([district, count]) => (
                              <div key={district} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                <span className="font-medium transition-colors duration-300 ${
                                  text-gray-700
                                }">{district}</span>
                                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                  {count} incidents
                                </Badge>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                    {/* Monthly Trends */}
                    <Card className="backdrop-blur-sm border-0 shadow-lg bg-white/80">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold transition-colors duration-300 text-gray-900">📅 Monthly Trends</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {Object.keys(insights.monthlyCounts).length > 0 ? (
                          <div className="space-y-3">
                            {/* Summary */}
                            <div className="p-3 rounded-lg bg-purple-50">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium transition-colors duration-300 text-purple-700">Most Active Month</span>
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
                                      <span className="font-medium transition-colors duration-300 ${
                                        text-gray-700
                                      }">{month}</span>
                                    </div>
                                    <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                                      {count} incidents
                                    </Badge>
                                  </div>
                                ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-6 transition-colors duration-300 text-gray-500">
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
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowSummaryModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-md transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* PDF Edit Modal */}
      {showPdfEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 animate-in fade-in-0 zoom-in-95">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold transition-colors duration-300 text-gray-900">
                  📄 Edit PDF Report
                </h2>
                <button
                  onClick={() => setShowPdfEditModal(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Memorandum Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium transition-colors duration-300 text-gray-900">Memorandum Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="for" className="transition-colors duration-300 text-gray-700">FOR:</Label>
                    <Input
                      id="for"
                      name="for"
                      value={pdfReportData.memorandum.for}
                      onChange={(e) => setPdfReportData(prev => ({
                        ...prev,
                        memorandum: { ...prev.memorandum, for: e.target.value }
                      }))}
                      className="mt-1 transition-colors duration-300 bg-white border-gray-300"
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <Label htmlFor="from" className="transition-colors duration-300 text-gray-700">FROM:</Label>
                    <Input
                      id="from"
                      name="from"
                      value={pdfReportData.memorandum.from}
                      onChange={(e) => setPdfReportData(prev => ({
                        ...prev,
                        memorandum: { ...prev.memorandum, from: e.target.value }
                      }))}
                      className="mt-1 transition-colors duration-300 bg-white border-gray-300"
                      autoComplete="off"
                    />
                  </div>
                  <div>
                          <Label htmlFor="memo-date" className="transition-colors duration-300 text-gray-700">DATE:</Label>
                    <Input
                      id="memo-date"
                      name="memo-date"
                      value={pdfReportData.memorandum.date}
                      onChange={(e) => setPdfReportData(prev => ({
                        ...prev,
                        memorandum: { ...prev.memorandum, date: e.target.value }
                      }))}
                      className="mt-1 transition-colors duration-300 bg-white border-gray-300"
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject" className="transition-colors duration-300 text-gray-700">SUBJECT:</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={pdfReportData.memorandum.subject}
                      autoComplete="off"
                      onChange={(e) => setPdfReportData(prev => ({
                        ...prev,
                        memorandum: { ...prev.memorandum, subject: e.target.value }
                      }))}
                      className="mt-1 transition-colors duration-300 bg-white border-gray-300"
                    />
                  </div>
                </div>
              </div>
              {/* Section Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium transition-colors duration-300 text-gray-900">Include Sections</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(pdfReportData.includeSections).map(([section, included]) => (
                    <div key={section} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={section}
                        name={section}
                        checked={included}
                        onChange={(e) => setPdfReportData(prev => ({
                          ...prev,
                          includeSections: {
                            ...prev.includeSections,
                            [section]: e.target.checked
                          }
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Label htmlFor={section} className="text-sm transition-colors duration-300 text-gray-700">
                        {section === 'dataCleaning' && 'Data Cleaning & Categorization'}
                        {section === 'summaryGeneration' && 'Summary Generation'}
                        {section === 'trendAnalysis' && 'Trend & Pattern Analysis'}
                        {section === 'rootCauses' && 'Root Cause & Contributing Factors'}
                        {section === 'recommendations' && 'Actionable Recommendations'}
                        {section === 'riskForecasting' && 'Risk Forecasting'}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              {/* Custom Notes */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium transition-colors duration-300 text-gray-900">Custom Notes (Optional)</h3>
                <Textarea
                  id="custom-notes"
                  name="custom-notes"
                  value={pdfReportData.customNotes}
                  onChange={(e) => setPdfReportData(prev => ({
                    ...prev,
                    customNotes: e.target.value
                  }))}
                  placeholder="Add any additional notes or comments for the report..."
                  rows={4}
                  className="transition-colors duration-300 bg-white border-gray-300"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowPdfEditModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-md transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowPdfEditModal(false);
                  setShowPdfPreviewModal(true);
                }}
                className="px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-200"
              >
                Preview
              </button>
              <button
                onClick={() => {
                  setShowPdfEditModal(false);
                  exportIncidentsToPDF();
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors duration-200 flex items-center"
              >
                {isGeneratingPdf ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  'Generate PDF'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* PDF Preview Modal */}
      {showPdfPreviewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto transform transition-all duration-300 scale-100 animate-in fade-in-0 zoom-in-95">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold transition-colors duration-300 text-gray-900">
                  📄 PDF Report Preview
                </h2>
                <button
                  onClick={() => setShowPdfPreviewModal(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Memorandum Preview */}
              <div className="p-6 border rounded-lg border-gray-200 bg-gray-50">
                <h3 className="text-lg font-bold mb-4 text-gray-900">MEMORANDUM</h3>
                <div className="space-y-3">
                  <div className="flex">
                    <span className="font-semibold w-20 text-gray-700">FOR:</span>
                    <span className="ml-4 text-gray-900">{pdfReportData.memorandum.for}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-20 text-gray-700">FROM:</span>
                    <span className="ml-4 text-gray-900">{pdfReportData.memorandum.from}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-20 text-gray-700">DATE:</span>
                    <span className="ml-4 text-gray-900">{pdfReportData.memorandum.date}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-20 text-gray-700">SUBJECT:</span>
                    <span className="ml-4 text-gray-900">{pdfReportData.memorandum.subject}</span>
                  </div>
                </div>
              </div>
              {/* Custom Notes Preview */}
              {pdfReportData.customNotes && (
                <div className="p-6 border rounded-lg border-gray-200 bg-gray-50">
                  <h3 className="text-lg font-bold mb-4 text-gray-900">Custom Notes</h3>
                  <p className="whitespace-pre-wrap text-gray-900">{pdfReportData.customNotes}</p>
                </div>
              )}
              {/* Sections Preview */}
              <div className="p-6 border rounded-lg border-gray-200 bg-gray-50">
                <h3 className="text-lg font-bold mb-4 text-gray-900">Report Sections</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(pdfReportData.includeSections).map(([section, included]) => (
                    <div key={section} className={`flex items-center space-x-2 p-2 rounded ${
                      included 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      <span className="text-lg">
                        {included ? '✓' : '✗'}
                      </span>
                      <span className="text-sm">
                        {section === 'dataCleaning' && 'Data Cleaning & Categorization'}
                        {section === 'summaryGeneration' && 'Summary Generation'}
                        {section === 'trendAnalysis' && 'Trend & Pattern Analysis'}
                        {section === 'rootCauses' && 'Root Cause & Contributing Factors'}
                        {section === 'recommendations' && 'Actionable Recommendations'}
                        {section === 'riskForecasting' && 'Risk Forecasting'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Data Summary Preview */}
              <div className="p-6 border rounded-lg border-gray-200 bg-gray-50">
                <h3 className="text-lg font-bold mb-4 text-gray-900">Data Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-white">
                    <div className="text-2xl font-bold text-blue-600">
                      {incidents.filter(incident => {
                        if (filterStatus !== "all" && incident.status !== filterStatus) return false;
                        if (selectedMonth !== "all") {
                          const incidentMonth = new Date(incident.date).toLocaleString('en-US', { month: 'long' });
                          if (incidentMonth !== selectedMonth) return false;
                        }
                        if (searchTerm) {
                          const searchLower = searchTerm.toLowerCase();
                          return (
                            incident.description?.toLowerCase().includes(searchLower) ||
                            incident.location?.toLowerCase().includes(searchLower) ||
                            incident.incidentType?.toLowerCase().includes(searchLower) ||
                            incident.municipality?.toLowerCase().includes(searchLower)
                          );
                        }
                        return true;
                      }).length}
                    </div>
                    <div className="text-sm text-gray-600">Total Incidents</div>
                  </div>
                  <div className="p-4 rounded-lg bg-white">
                    <div className="text-2xl font-bold text-green-600">
                      {selectedMonth === "all" ? "All Months" : selectedMonth}
                    </div>
                    <div className="text-sm text-gray-600">Reporting Period</div>
                  </div>
                  <div className="p-4 rounded-lg bg-white">
                    <div className="text-2xl font-bold text-purple-600">
                      {Object.keys(pdfReportData.includeSections).filter(key => pdfReportData.includeSections[key]).length}
                    </div>
                    <div className="text-sm text-gray-600">Sections Included</div>
                  </div>
                </div>
              </div>
              {/* Detailed Content Preview */}
              <div className="p-6 border rounded-lg border-gray-200 bg-gray-50">
                <h3 className="text-lg font-bold mb-4 text-gray-900">PDF Content Preview</h3>
                <div className="space-y-4">
                  {/* Sample Data Cleaning Section */}
                  {pdfReportData.includeSections.dataCleaning && (
                    <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
                      <h4 className="font-semibold mb-2 text-blue-700">1. Data Cleaning & Categorization</h4>
                      <p className="text-sm text-gray-700">
                        This report provides a comprehensive analysis of {incidents.filter(incident => {
                          if (filterStatus !== "all" && incident.status !== filterStatus) return false;
                          if (selectedMonth !== "all") {
                            const incidentMonth = new Date(incident.date).toLocaleString('en-US', { month: 'long' });
                            if (incidentMonth !== selectedMonth) return false;
                          }
                          return true;
                        }).length} incidents recorded in the Province of Bataan for {selectedMonth === "all" ? "the reporting period" : selectedMonth} {new Date().getFullYear()}. All entries were reviewed for completeness and accuracy.
                      </p>
                    </div>
                  )}
                  {/* Sample Summary Generation Section */}
                  {pdfReportData.includeSections.summaryGeneration && (
                    <div className="p-4 border-l-4 border-green-500 bg-green-50">
                      <h4 className="font-semibold mb-2 text-green-700">2. Summary Generation</h4>
                      <p className="text-sm text-gray-700">
                        Municipality breakdown table with incident counts and detailed breakdowns by incident type. Dynamic summary content based on actual data analysis.
                      </p>
                    </div>
                  )}
                  {/* Sample Trend Analysis Section */}
                  {pdfReportData.includeSections.trendAnalysis && (
                                         <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50">
                       <h4 className="font-semibold mb-2 text-yellow-700">3. Trend & Pattern Analysis</h4>
                       <p className="text-sm text-gray-700">
                        Dynamic trend analysis including temporal patterns, geographic hotspots, and incident type distributions. Statistical analysis of crime patterns and seasonal variations.
                      </p>
                    </div>
                  )}
                  {/* Sample Root Causes Section */}
                  {pdfReportData.includeSections.rootCauses && (
                                         <div className="p-4 border-l-4 border-red-500 bg-red-50">
                       <h4 className="font-semibold mb-2 text-red-700">4. Root Cause & Contributing Factors</h4>
                       <p className="text-sm text-gray-700">
                        Analysis of socioeconomic factors, vehicular incidents, mental health considerations, and firearms control issues. Inter-agency collaboration recommendations.
                      </p>
                    </div>
                  )}
                  {/* Sample Recommendations Section */}
                  {pdfReportData.includeSections.recommendations && (
                                         <div className="p-4 border-l-4 border-purple-500 bg-purple-50">
                       <h4 className="font-semibold mb-2 text-purple-700">5. Actionable Recommendations</h4>
                       <p className="text-sm text-gray-700">
                        Enhanced police visibility and patrols, targeted law enforcement operations, technology and infrastructure improvements, and inter-agency collaboration strategies.
                      </p>
                    </div>
                  )}
                  {/* Sample Risk Forecasting Section */}
                  {pdfReportData.includeSections.riskForecasting && (
                    <div className="p-4 border-l-4 border-amber-500 bg-amber-50">
                      <h4 className="font-semibold mb-2 text-amber-700">6. Risk Forecasting</h4>
                      <p className="text-sm text-gray-700">
                        Forward-looking assessment of potential high-risk areas and periods based on recent trends, incident density, and seasonality. Suggests proactive deployment and preventive actions.
                      </p>
                    </div>
                  )}
                  {/* Sample Municipality Table Preview */}
                                     <div className="p-4 border-l-4 border-gray-500 bg-gray-50">
                     <h4 className="font-semibold mb-2 text-gray-700">Municipality Breakdown Table</h4>
                     <div className="text-xs border rounded border-gray-300">
                       <div className="grid grid-cols-3 gap-2 p-2 font-semibold bg-gray-100 text-gray-700">
                        <div>Municipality/City</div>
                        <div>Total Incidents</div>
                        <div>Breakdown</div>
                      </div>
                       <div className="grid grid-cols-3 gap-2 p-2 text-gray-700">
                        <div>Balanga City</div>
                        <div>15</div>
                        <div>5 Traffic, 3 Theft, 2 Drug-related...</div>
                      </div>
                       <div className="grid grid-cols-3 gap-2 p-2 text-gray-700">
                        <div>Dinalupihan</div>
                        <div>12</div>
                        <div>4 Traffic, 2 Theft, 1 Drug-related...</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setShowPdfPreviewModal(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowPdfPreviewModal(false);
                  exportIncidentsToPDF();
                }}
                disabled={isGeneratingPdf}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isGeneratingPdf ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating PDF...
                  </>
                ) : (
                  'Generate PDF'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100 animate-in fade-in-0 zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">View Incident Details</h3>
                  <p className="text-sm text-gray-500">Detailed information about the selected incident report</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setViewingIncident(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
              {viewingIncident && (
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="text-sm font-medium text-gray-600">Incident Type</div>
                    <p className="text-base font-semibold text-gray-900 mt-1">
                      {viewingIncident.incidentType || 'Not specified'}
                    </p>
                  </div>
                    
                  
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="text-sm font-medium text-gray-600">Date & Time</div>
                    <p className="text-base font-semibold text-gray-900 mt-1">
                      {viewingIncident.date || 'Not specified'}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="text-sm font-medium text-gray-600">Location</div>
                    <p className="text-sm text-gray-900 mt-2 leading-relaxed">
                      {viewingIncident.location || 'Not specified'}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="text-sm font-medium text-gray-600">District & Municipality</div>
                    <p className="text-base font-semibold text-gray-900 mt-1">
                      {viewingIncident.district || 'Not specified'} - {viewingIncident.municipality || 'Not specified'}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="text-sm font-medium text-gray-600">Reporting Officer</div>
                    <p className="text-sm text-gray-900 mt-2 leading-relaxed">
                      {viewingIncident.officer || 'Not specified'}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="text-sm font-medium text-gray-600">Description</div>
                    <p className="text-sm text-gray-900 mt-2 leading-relaxed">
                      {viewingIncident.description || 'No description available'}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="text-sm font-medium text-gray-600">Witnesses</div>
                    <p className="text-sm text-gray-900 mt-2 leading-relaxed">
                      {viewingIncident.witnesses || 'No witnesses recorded'}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="text-sm font-medium text-gray-600">Evidence</div>
                    <p className="text-sm text-gray-900 mt-2 leading-relaxed">
                      {viewingIncident.evidence || 'No evidence recorded'}
                    </p>
                  </div>
                  
                  {/* Action Taken */}
                  {(viewingIncident.actionType || viewingIncident.actionDescription) && (
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        Action Taken
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <div className="block text-sm font-semibold text-gray-700 mb-2">Action Type</div>
                          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                            <p className="text-gray-900 break-words whitespace-pre-wrap">{viewingIncident.actionType || 'Not specified'}</p>
                          </div>
                        </div>
                        
                        <div>
                          <div className="block text-sm font-semibold text-gray-700 mb-2">Assigned Officer</div>
                          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                            <p className="text-gray-900 break-words whitespace-pre-wrap">{viewingIncident.assignedOfficer || 'Not assigned'}</p>
                          </div>
                        </div>
                      </div>
                      
                      {viewingIncident.actionDescription && (
                        <div className="mt-4">
                          <div className="block text-sm font-semibold text-gray-700 mb-2">Action Description</div>
                          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 min-h-[100px]">
                            <p className="text-gray-900 break-words whitespace-pre-wrap leading-relaxed">{viewingIncident.actionDescription}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Link */}
                  {viewingIncident.link && (
                    <div>
                      <div className="block text-sm font-semibold text-gray-700 mb-2">Related Link</div>
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <a 
                          href={viewingIncident.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline break-all font-medium"
                        >
                          {viewingIncident.link}
                        </a>
                      </div>
                    </div>
                  )}
                  
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-6 border-t border-gray-200">
              <button 
                onClick={() => {
                  setShowViewModal(false);
                  setViewingIncident(null);
                }} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors duration-200"
              >
                <X className="w-4 h-4 mr-2 inline" />
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Incident Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100 animate-in fade-in-0 zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Edit className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Edit Incident Report</h3>
                  <p className="text-sm text-gray-500">Update the details of the selected incident report</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingIncident(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          
              {editingIncident && (
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Incident Type */}
                    <div>
                      <label htmlFor="edit-incident-type" className="block text-sm font-semibold text-gray-700 mb-2">
                        Incident Type *
                      </label>
                      <div className="relative">
                        <select
                          id="edit-incident-type"
                          name="incidentType"
                          value={editingIncident.incidentType}
                          onChange={(e) => setEditingIncident({...editingIncident, incidentType: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 appearance-none"
                        >
                          <option value="">Select Incident Type</option>
                          {incidentTypes.map((type, index) => (
                            <option key={index} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                
                    {/* Date */}
                    <div>
                      <label htmlFor="edit-date" className="block text-sm font-semibold text-gray-700 mb-2">
                        Date *
                      </label>
                      <input
                        id="edit-date"
                        name="date"
                        type="date"
                        value={editingIncident.date}
                        onChange={(e) => setEditingIncident({...editingIncident, date: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                      />
                    </div>
                    
                    {/* Time */}
                    <div>
                      <label htmlFor="edit-time" className="block text-sm font-semibold text-gray-700 mb-2">
                        Time
                      </label>
                      <input
                        id="edit-time"
                        name="time"
                        type="time"
                        value={editingIncident.time}
                        onChange={(e) => setEditingIncident({...editingIncident, time: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                      />
                    </div>
                
                    {/* District */}
                    <div>
                      <label htmlFor="edit-district" className="block text-sm font-semibold text-gray-700 mb-2">
                        District *
                      </label>
                      <div className="relative">
                        <select
                          id="edit-district"
                          name="district"
                          value={editingIncident.district}
                          onChange={(e) => {
                            const value = e.target.value;
                            const municipalitiesForDistrict = municipalitiesByDistrict[value] || [];
                            const firstMunicipality = municipalitiesForDistrict[0] || "";
                            setEditingIncident({
                              ...editingIncident, 
                              district: value,
                              municipality: firstMunicipality
                            });
                          }}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 appearance-none"
                        >
                          <option value="">Select District</option>
                          {districts.map((district, index) => (
                            <option key={index} value={district}>
                              {district}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    
                    {/* Municipality */}
                    <div>
                      <label htmlFor="edit-municipality" className="block text-sm font-semibold text-gray-700 mb-2">
                        Municipality *
                      </label>
                      <div className="relative">
                        <select
                          id="edit-municipality"
                          name="municipality"
                          value={editingIncident.municipality}
                          onChange={(e) => setEditingIncident({...editingIncident, municipality: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 appearance-none"
                        >
                          <option value="">Select Municipality</option>
                          {(municipalitiesByDistrict[editingIncident.district] || []).map((municipality, index) => (
                            <option key={index} value={municipality}>
                              {municipality}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Location */}
                  <div>
                    <label htmlFor="edit-location" className="block text-sm font-semibold text-gray-700 mb-2">
                      Location *
                    </label>
                    <textarea
                      id="edit-location"
                      name="location"
                      value={editingIncident.location}
                      onChange={(e) => setEditingIncident({...editingIncident, location: e.target.value})}
                      placeholder="Enter detailed location..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 min-h-[100px] resize-y"
                      rows={3}
                    />
                  </div>
                  
                  {/* Description */}
                  <div>
                    <label htmlFor="edit-description" className="block text-sm font-semibold text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      id="edit-description"
                      name="description"
                      value={editingIncident.description}
                      onChange={(e) => setEditingIncident({...editingIncident, description: e.target.value})}
                      placeholder="Enter incident description..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 min-h-[140px] resize-y"
                      rows={5}
                    />
                  </div>
              
                  {/* Officer and Additional Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="edit-officer" className="block text-sm font-semibold text-gray-700 mb-2">
                        Reporting Officer
                      </label>
                      <input
                        id="edit-officer"
                        name="officer"
                        type="text"
                        value={editingIncident.officer}
                        onChange={(e) => setEditingIncident({...editingIncident, officer: e.target.value})}
                        placeholder="Enter officer name..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="edit-link" className="block text-sm font-semibold text-gray-700 mb-2">
                        Related Link
                      </label>
                      <input
                        id="edit-link"
                        name="link"
                        type="url"
                        value={editingIncident.link}
                        onChange={(e) => setEditingIncident({...editingIncident, link: e.target.value})}
                        placeholder="Enter related link..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                      />
                    </div>
                  </div>
              
                  {/* Witnesses */}
                  <div>
                    <label htmlFor="edit-witnesses" className="block text-sm font-semibold text-gray-700 mb-2">
                      Witnesses
                    </label>
                    <textarea
                      id="edit-witnesses"
                      name="witnesses"
                      value={editingIncident.witnesses}
                      onChange={(e) => setEditingIncident({...editingIncident, witnesses: e.target.value})}
                      placeholder="Enter witness information..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 min-h-[100px] resize-y"
                      rows={3}
                    />
                  </div>
                  
                  {/* Evidence */}
                  <div>
                    <label htmlFor="edit-evidence" className="block text-sm font-semibold text-gray-700 mb-2">
                      Evidence
                    </label>
                    <textarea
                      id="edit-evidence"
                      name="evidence"
                      value={editingIncident.evidence}
                      onChange={(e) => setEditingIncident({...editingIncident, evidence: e.target.value})}
                      placeholder="Enter evidence information..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 min-h-[100px] resize-y"
                      rows={3}
                    />
                  </div>
              
                  {/* Action Taken Section */}
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      Action Taken
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="edit-action-type" className="block text-sm font-semibold text-gray-700 mb-2">
                          Action Type
                        </label>
                        <input
                          id="edit-action-type"
                          name="actionType"
                          type="text"
                          value={editingIncident.actionType}
                          onChange={(e) => setEditingIncident({...editingIncident, actionType: e.target.value})}
                          placeholder="Enter action type..."
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="edit-assigned-officer" className="block text-sm font-semibold text-gray-700 mb-2">
                          Assigned Officer
                        </label>
                        <input
                          id="edit-assigned-officer"
                          name="assignedOfficer"
                          type="text"
                          value={editingIncident.assignedOfficer}
                          onChange={(e) => setEditingIncident({...editingIncident, assignedOfficer: e.target.value})}
                          placeholder="Enter assigned officer..."
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label htmlFor="edit-action-description" className="block text-sm font-semibold text-gray-700 mb-2">
                        Action Description
                      </label>
                      <textarea
                        id="edit-action-description"
                        name="actionDescription"
                        value={editingIncident.actionDescription}
                        onChange={(e) => setEditingIncident({...editingIncident, actionDescription: e.target.value})}
                        placeholder="Enter detailed action description..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 min-h-[120px] resize-y"
                        rows={4}
                      />
                    </div>
                  </div>
              
                  {/* Action Buttons */}
                  <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingIncident(null);
                      }}
                      className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await updateIncident(editingIncident.id, editingIncident);
                          await loadIncidents();
                          setShowEditModal(false);
                          setEditingIncident(null);
                        } catch (error) {
                          console.error('Error updating incident:', error);
                          alert('Error updating incident. Please try again.');
                        }
                      }}
                      className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors duration-200"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingIncident && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100 animate-in fade-in-0 zoom-in-95">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-100">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Delete Incident
                </h3>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete this incident? This action cannot be undone.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-900 mb-1">Incident Details:</p>
                <p className="text-sm text-gray-600">
                  <strong>Type:</strong> {deletingIncident.incidentType}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Location:</strong> {deletingIncident.location}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Date:</strong> {deletingIncident.date}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-4 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingIncident(null);
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await deleteIncident(deletingIncident?.id);
                    await loadIncidents();
                    setShowDeleteModal(false);
                    setDeletingIncident(null);
                  } catch (error) {
                    console.error('Error deleting incident:', error);
                    alert('Error deleting incident. Please try again.');
                  }
                }}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors duration-200"
              >
                Delete Incident
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

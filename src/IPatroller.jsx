import React, { useState, useEffect, useRef } from "react";
import Layout from "./Layout";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Badge } from "./components/ui/badge";
import { Label } from "./components/ui/label";
import { toast } from "sonner";
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  orderBy, 
  limit,
  where,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Plus,
  Save,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  BarChart3,
  Building2,
  MapPin,
  Calendar,
  Filter,
  Search,
  FileText,
  Printer,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Activity,
  TrendingUp,
  FileSpreadsheet,
  Trash,
  FileBarChart,
  Shield,
  Users,
  Target,
  Zap,
  Sun,
  Moon,
  Camera,
  MoreVertical,
  Database,
  Wifi,
  WifiOff
} from "lucide-react";

export default function IPatroller({ onLogout, onNavigate, currentPage }) {
  const [patrolData, setPatrolData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [firestoreStatus, setFirestoreStatus] = useState('connecting');
  const [selectedDistrict, setSelectedDistrict] = useState("ALL");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("daily");
  const [expandedDistricts, setExpandedDistricts] = useState({
    "1ST DISTRICT": true,
    "2ND DISTRICT": true,
    "3RD DISTRICT": true,
  });
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  // Remove unused state
  const moreOptionsRef = useRef(null);

  // Handle click outside for more options dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (moreOptionsRef.current && !moreOptionsRef.current.contains(event.target)) {
        setShowMoreOptions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Generate dates for selected month and year
  const generateDates = (month, year) => {
    const dates = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const currentDate = new Date();
    const isCurrentMonth =
      month === currentDate.getMonth() && year === currentDate.getFullYear();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isCurrentDay = isCurrentMonth && day === currentDate.getDate();
      dates.push({
        date: date,
        dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
        dayNumber: day,
        fullDate: date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
        isCurrentDay: isCurrentDay,
      });
    }
    return dates;
  };

  const selectedDates = generateDates(selectedMonth, selectedYear);

  // Municipalities by district
  const municipalitiesByDistrict = {
    "1ST DISTRICT": ["Abucay", "Orani", "Samal", "Hermosa"],
    "2ND DISTRICT": ["Balanga City", "Pilar", "Orion", "Limay"],
    "3RD DISTRICT": ["Bagac", "Dinalupihan", "Mariveles", "Morong"],
  };

  // Load patrol data from Firestore
  useEffect(() => {
    loadPatrolDataFromFirestore();
  }, [selectedMonth, selectedYear]);

  const loadPatrolDataFromFirestore = async () => {
    setLoading(true);
    setFirestoreStatus('connecting');
    
    try {
      // Create month-year ID for the selected month
      const monthYearId = `${String(selectedMonth + 1).padStart(2, "0")}-${selectedYear}`;
      
      // Try to get data from Firestore
      const monthDocRef = doc(db, 'patrolData', monthYearId);
      const municipalitiesRef = collection(monthDocRef, 'municipalities');
      
          // Use onSnapshot for real-time updates but with limit to avoid excessive reads
      // Only subscribe to changes for the current month to minimize reads
      const unsubscribe = onSnapshot(municipalitiesRef, (snapshot) => {
        const firestoreData = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data) {
            firestoreData.push({
              id: doc.id,
              ...data
            });
          }
        });

        // If we have data from Firestore, use it
        if (firestoreData.length > 0) {
          console.log('📊 Loaded data from Firestore:', firestoreData.length, 'municipalities');
          setPatrolData(firestoreData);
          setFirestoreStatus('connected');
        } else {
          // If no data exists, don't create initial structure
          // Only show municipalities that actually have data
          console.log('📝 No data found for this month, showing empty state');
          setPatrolData([]);
          setFirestoreStatus('connected');
        }
      }, (error) => {
        console.error('❌ Firestore error:', error);
        setFirestoreStatus('error');
        // Fallback to local data if Firestore fails
        createLocalFallbackData();
      });

      // Cleanup subscription
      return () => unsubscribe();
      
    } catch (error) {
      console.error('❌ Error loading from Firestore:', error);
      setFirestoreStatus('error');
      // Fallback to local data
      createLocalFallbackData();
    } finally {
      setLoading(false);
    }
  };

  const createInitialFirestoreStructure = async (monthYearId) => {
    try {
      const initialData = [];
      
      Object.entries(municipalitiesByDistrict).forEach(([district, municipalities]) => {
        municipalities.forEach((municipality) => {
          const dailyData = selectedDates.map(() => 0); // Initialize with 0
          const totalPatrols = dailyData.reduce((sum, val) => sum + (val || 0), 0);
          const activeDays = dailyData.filter((val) => val > 0).length;
          const inactiveDays = dailyData.filter((val) => val === 0).length;
          const activePercentage = Math.round((activeDays / dailyData.length) * 100);
          
          const itemData = {
            id: `${district}-${municipality}`,
            municipality,
            district,
            data: dailyData,
            totalPatrols,
            activeDays,
            inactiveDays,
            activePercentage,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          
          initialData.push(itemData);
        });
      });

      // Save to Firestore
      const batch = [];
      initialData.forEach((item) => {
        const docRef = doc(db, 'patrolData', monthYearId, 'municipalities', item.id);
        batch.push(setDoc(docRef, item));
      });

      // Execute batch write
      await Promise.all(batch);
      console.log('✅ Initial Firestore structure created');
      
      // Update local state
      setPatrolData(initialData);
      setFirestoreStatus('connected');
      
    } catch (error) {
      console.error('❌ Error creating Firestore structure:', error);
      setFirestoreStatus('error');
      // Fallback to local data
      createLocalFallbackData();
    }
  };

  const createLocalFallbackData = () => {
    console.log('🔄 Creating local fallback data...');
    // Don't create fallback data for all municipalities
    // Only show municipalities that actually have data in Firestore
    setPatrolData([]);
    setFirestoreStatus('offline');
  };

  const syncToFirestore = async () => {
    if (firestoreStatus !== 'connected') {
      console.log('❌ Cannot sync: Firestore not connected');
      return;
    }

    try {
      setLoading(true);
      const monthYearId = `${String(selectedMonth + 1).padStart(2, "0")}-${selectedYear}`;
      
      // Find municipalities that have actual data (not all zeros or nulls)
      const municipalitiesWithData = patrolData.filter(item => 
        item.data.some(value => value > 0)
      );

      if (municipalitiesWithData.length === 0) {
        toast.info('No changes to save', {
          description: 'No patrol data has been entered yet',
          duration: 3000,
          position: 'top-right',
          style: { background: 'white' },
        });
        setLoading(false);
        return;
      }

      // Save only municipalities with data
      const batch = [];
      municipalitiesWithData.forEach((item) => {
        const docRef = doc(db, 'patrolData', monthYearId, 'municipalities', item.id);
        batch.push(setDoc(docRef, {
          ...item,
          updatedAt: serverTimestamp()
        }));
      });

      await Promise.all(batch);
      console.log('✅ Data synced to Firestore for municipalities with data');
      setFirestoreStatus('connected');
      
      // Show success toast with details about actually updated municipalities
      const municipalityNames = municipalitiesWithData.map(item => item.municipality).join(', ');
      toast.success('Changes saved successfully', {
        description: municipalitiesWithData.length === 1
          ? `Updated patrol data for ${municipalityNames}`
          : `Updated patrol data for ${municipalitiesWithData.length} municipalities: ${municipalityNames}`,
        duration: 3000,
        position: 'top-right',
        style: { background: 'white' },
      });
    } catch (error) {
      console.error('❌ Error syncing to Firestore:', error);
      setFirestoreStatus('error');
      // Show error toast with more details
      toast.error('Failed to save changes', {
        description: `Error: ${error.message || 'Failed to sync with Firestore'}`,
        duration: 4000,
        position: 'top-right',
        style: { background: 'white' },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPatrolData = (municipality, district, dayIndex, value) => {
    // Only update local state, don't save to Firestore
    const updatedData = patrolData.map((item) => {
      if (item.municipality === municipality && item.district === district) {
        const newData = [...item.data];
        newData[dayIndex] = parseInt(value) || 0;
        const totalPatrols = newData.reduce((sum, val) => sum + (val || 0), 0);
        const activeDays = newData.filter((val) => val > 0).length;
        const inactiveDays = newData.filter((val) => val === 0).length;
        const activePercentage = Math.round((activeDays / newData.length) * 100);
        
        return {
          ...item,
          data: newData,
          totalPatrols,
          activeDays,
          inactiveDays,
          activePercentage,
        };
      }
      return item;
    });
    
    setPatrolData(updatedData);
  };

  const toggleDistrictExpansion = (district) => {
    setExpandedDistricts((prev) => ({
      ...prev,
      [district]: !prev[district],
    }));
  };

  const getStatusColor = (value) => {
    if (value === null || value === undefined)
      return "bg-gray-100 text-gray-800";
    if (value === 0)
      return "bg-red-600 text-white";
    if (value >= 5)
      return "bg-green-600 text-white";
    return "bg-red-600 text-white";
  };

  const getStatusText = (value) => {
    if (value === null || value === undefined) return "No Entry";
    if (value === 0) return "Inactive";
    if (value >= 5) return "Active";
    return "Inactive";
  };

  const filteredData = patrolData
    .filter((item) => {
      const matchesDistrict =
        selectedDistrict === "ALL" || item.district === selectedDistrict;
      const matchesSearch = item.municipality
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchesDistrict && matchesSearch;
    })
    .sort((a, b) => {
      // Sort by district first, then by municipality order within each district
      const districtOrder = ["1ST DISTRICT", "2ND DISTRICT", "3RD DISTRICT"];
      const districtA = districtOrder.indexOf(a.district);
      const districtB = districtOrder.indexOf(b.district);
      if (districtA !== districtB) {
        return districtA - districtB;
      }
      // Sort by municipality order within district
      const municipalitiesInDistrict = municipalitiesByDistrict[a.district];
      const municipalityA = municipalitiesInDistrict.indexOf(a.municipality);
      const municipalityB = municipalitiesInDistrict.indexOf(b.municipality);
      return municipalityA - municipalityB;
    });

  // Group filtered data by district
  const groupedData = filteredData.reduce((acc, item) => {
    if (!acc[item.district]) {
      acc[item.district] = [];
    }
    acc[item.district].push(item);
    return acc;
  }, {});

  const getDistrictSummary = (district) => {
    const districtData = patrolData.filter(
      (item) => item.district === district,
    );
    const totalPatrols = districtData.reduce(
      (sum, item) => sum + item.totalPatrols,
      0,
    );
    const totalActive = districtData.reduce(
      (sum, item) => sum + item.activeDays,
      0,
    );
    const totalInactive = districtData.reduce(
      (sum, item) => sum + item.inactiveDays,
      0,
    );
    const avgActivePercentage =
      districtData.length > 0
        ? Math.round(
            districtData.reduce((sum, item) => sum + item.activePercentage, 0) /
              districtData.length,
          )
        : 0;
    return {
      totalPatrols,
      totalActive,
      totalInactive,
      avgActivePercentage,
      municipalityCount: districtData.length,
    };
  };

  // Calculate active and inactive days
  const { activeDays, inactiveDays } = patrolData.reduce((acc, municipality) => {
    municipality.data.forEach((patrols) => {
      // If there's an actual patrol count (not null/undefined)
      if (patrols !== null && patrols !== undefined && patrols !== '') {
        // Count as active if >= 5 patrols
        if (patrols >= 5) {
          acc.activeDays++;
        }
        // Count as inactive only if there's a value but it's < 5
        else {
          acc.inactiveDays++;
        }
      }
      // Don't count "No Entry" days in either active or inactive
    });
    return acc;
  }, { activeDays: 0, inactiveDays: 0 });

  const overallSummary = {
    totalPatrols: patrolData.reduce((sum, item) => sum + item.totalPatrols, 0),
    totalActive: activeDays, // Total number of active days across all municipalities
    totalInactive: inactiveDays, // Total number of inactive days (only counting days with patrols < 5)
    avgActivePercentage:
      patrolData.length > 0
        ? Math.round(
            (activeDays / (activeDays + inactiveDays)) * 100
          )
        : 0,
    municipalityCount: patrolData.length,
  };

  return (
    <Layout onLogout={onLogout} onNavigate={onNavigate} currentPage={currentPage}>
      <div className="flex-1 p-3 md:p-6 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold transition-colors duration-300 text-gray-900">
              I-Patroller Management
            </h1>
            <p className="text-base md:text-lg transition-colors duration-300 text-gray-600">
              {new Date(selectedYear, selectedMonth).toLocaleDateString(
                "en-US",
                { month: "long", year: "numeric" },
              )} • Patrol Activity Dashboard
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className={`w-2 h-2 rounded-full ${
                firestoreStatus === 'connected' ? 'bg-green-500' : 
                firestoreStatus === 'connecting' ? 'bg-yellow-500' : 
                firestoreStatus === 'error' ? 'bg-red-500' : 'bg-gray-500'
              }`}></div>
              <span className="text-xs md:text-sm font-medium text-gray-600">
                {firestoreStatus === 'connected' ? 'Firestore Connected' :
                 firestoreStatus === 'connecting' ? 'Connecting to Firestore...' :
                 firestoreStatus === 'error' ? 'Firestore Error - Using Local' :
                 'Offline Mode - Local Storage'}
              </span>
              {firestoreStatus === 'error' && (
                <Button
                  onClick={loadPatrolDataFromFirestore}
                  size="sm"
                  variant="outline"
                  className="ml-2 h-6 px-2 text-xs"
                >
                  <Wifi className="w-3 h-3 mr-1" />
                  Retry
                </Button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={syncToFirestore}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white p-2.5 h-12 w-12 rounded-full"
              title="Save Data"
            >
              <Save className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Connection Status */}
        <div className="mb-4">
          <Card className="backdrop-blur-sm border-0 shadow-lg bg-white/80">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {firestoreStatus === 'connected' ? (
                    <Database className="h-5 w-5 text-green-600" />
                  ) : firestoreStatus === 'connecting' ? (
                    <Database className="h-5 w-5 text-yellow-600 animate-pulse" />
                  ) : (
                    <WifiOff className="h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {firestoreStatus === 'connected' ? 'Firestore Connected' :
                       firestoreStatus === 'connecting' ? 'Connecting...' :
                       'Offline Mode'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {firestoreStatus === 'connected' ? 'Real-time data sync active' :
                       firestoreStatus === 'connecting' ? 'Establishing connection...' :
                       'Data stored locally only'}
                    </p>
                  </div>
                </div>
                {firestoreStatus === 'error' && (
                  <Button
                    onClick={loadPatrolDataFromFirestore}
                    size="sm"
                    variant="outline"
                  >
                    <Wifi className="w-4 h-4 mr-2" />
                    Reconnect
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium transition-colors duration-300 text-gray-500">Total Patrols</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {overallSummary.totalPatrols.toLocaleString()}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full flex items-center justify-center transition-colors duration-300 bg-blue-100">
                  <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                                 <div>
                   <p className="text-sm font-medium transition-colors duration-300 text-gray-500">Active Days</p>
                   <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                     {overallSummary.totalActive.toLocaleString()}
                   </p>
                 </div>
                <div className="h-12 w-12 rounded-full flex items-center justify-center transition-colors duration-300 bg-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                                 <div>
                   <p className="text-sm font-medium transition-colors duration-300 text-gray-500">Inactive Days</p>
                   <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                     {overallSummary.totalInactive.toLocaleString()}
                   </p>
                 </div>
                <div className="h-12 w-12 rounded-full flex items-center justify-center transition-colors duration-300 bg-red-100">
                  <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium transition-colors duration-300 text-gray-500">Avg Active %</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {overallSummary.avgActivePercentage}%
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full flex items-center justify-center transition-colors duration-300 bg-purple-100">
                  <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="backdrop-blur-sm border-0 shadow-lg bg-white/80">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold transition-colors duration-300 text-gray-900">
                Filters & Search
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setSelectedMonth(new Date().getMonth());
                    setSelectedYear(new Date().getFullYear());
                  }}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Current Month
                </Button>
                <Button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedDistrict("ALL");
                  }}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search" className="transition-colors duration-300 text-gray-700">
                  Search
                </Label>
                <Input
                  id="search"
                  placeholder="Search municipalities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mt-1 transition-colors duration-300 bg-white border-gray-300"
                />
              </div>
              <div>
                <Label htmlFor="month-filter" className="transition-colors duration-300 text-gray-700">
                  Month
                </Label>
                <select
                  id="month-filter"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="mt-1 w-full p-2 rounded-md border transition-colors duration-300 bg-white border-gray-300"
                >
                  <option value={0}>January</option>
                  <option value={1}>February</option>
                  <option value={2}>March</option>
                  <option value={3}>April</option>
                  <option value={4}>May</option>
                  <option value={5}>June</option>
                  <option value={6}>July</option>
                  <option value={7}>August</option>
                  <option value={8}>September</option>
                  <option value={9}>October</option>
                  <option value={10}>November</option>
                  <option value={11}>December</option>
                </select>
              </div>
              <div>
                <Label htmlFor="year-filter" className="transition-colors duration-300 text-gray-700">
                  Year
                </Label>
                <select
                  id="year-filter"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="mt-1 w-full p-2 rounded-md border transition-colors duration-300 bg-white border-gray-300"
                >
                  <option value={2023}>2023</option>
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>
              </div>
              <div>
                <Label htmlFor="district-filter" className="transition-colors duration-300 text-gray-700">
                  District
                </Label>
                <select
                  id="district-filter"
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="mt-1 w-full p-2 rounded-md border transition-colors duration-300 bg-white border-gray-300"
                >
                  <option value="ALL">All Districts</option>
                  <option value="1ST DISTRICT">1ST DISTRICT</option>
                  <option value="2ND DISTRICT">2ND DISTRICT</option>
                  <option value="3RD DISTRICT">3RD DISTRICT</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patrol Data Table */}
        <Card className="backdrop-blur-sm border-0 shadow-lg bg-white/80">
          <CardHeader>
            <CardTitle className="text-lg font-semibold transition-colors duration-300 text-gray-900">
              {new Date(selectedYear, selectedMonth).toLocaleDateString(
                "en-US",
                { month: "long", year: "numeric" },
              )} Patrol Data ({filteredData.length} municipalities)
            </CardTitle>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab("daily")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                  activeTab === "daily"
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Daily Counts
              </button>
              <button
                onClick={() => setActiveTab("status")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                  activeTab === "status"
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Status
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b transition-all duration-300 border-gray-200 bg-gray-50">
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider transition-colors duration-300 text-gray-700">
                      Municipality
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider transition-colors duration-300 text-gray-700">
                      District
                    </th>
                    {activeTab === "daily" ? (
                      // Daily Counts Tab - Show all date columns
                      selectedDates.map((date, index) => (
                        <th
                          key={index}
                          className={`px-2 py-4 text-center text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                            date.isCurrentDay ? 'bg-blue-100 text-blue-800' : ''
                          }`}
                        >
                          {date.dayName} {date.dayNumber}
                        </th>
                      ))
                    ) : (
                      // Status Tab - Show only summary columns
                      <>
                        <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider transition-colors duration-300 w-24 text-gray-700">
                          Total
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider transition-colors duration-300 w-24 text-gray-700">
                          Active
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider transition-colors duration-300 w-24 text-gray-700">
                          Inactive
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider transition-colors duration-300 w-24 text-gray-700">
                          % Active
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {Object.keys(groupedData).map((district) => (
                    <React.Fragment key={district}>
                      {/* District Header */}
                      <tr className="border-b transition-all duration-300 bg-gray-50 border-gray-200">
                        <td
                          colSpan={
                            activeTab === "daily" ? selectedDates.length + 2 : 6
                          }
                          className="px-6 py-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Building2 className="w-5 h-5 text-gray-600" />
                              <span className="font-semibold transition-colors duration-300 text-gray-900">
                                {district}
                              </span>
                              <Badge className="transition-all duration-300 bg-gray-100 text-gray-800 border-gray-200">
                                {groupedData[district].length} municipalities
                              </Badge>
                            </div>
                            <button
                              onClick={() =>
                                toggleDistrictExpansion(district)
                              }
                              className={`p-2 rounded-lg transition-colors duration-200 hover:bg-gray-200 ${
                                expandedDistricts[district] ? 'bg-gray-200' : ''
                              }`}
                            >
                              {expandedDistricts[district] ? (
                                <ChevronUp className="w-4 h-4 text-gray-600" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-600" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Municipality Rows */}
                      {expandedDistricts[district] &&
                        groupedData[district].map((item) => (
                          <tr
                            key={item.id}
                            className="transition-colors duration-200 hover:bg-gray-50"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <MapPin className="w-4 h-4 text-gray-600" />
                                <span className="font-medium transition-colors duration-300 text-gray-900">
                                  {item.municipality}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge className="transition-all duration-300 bg-gray-100 text-gray-800 border-gray-200">
                                {item.district}
                              </Badge>
                            </td>
                            {activeTab === "daily" ? (
                              // Daily Counts Tab - Show all date columns
                              selectedDates.map((date, index) => (
                                <td key={index} className="px-2 py-4 text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <input
                                      type="number"
                                      min="0"
                                      value={item.data[index] !== null && item.data[index] !== undefined ? item.data[index] : ""}
                                      onChange={(e) =>
                                        handleAddPatrolData(
                                          item.municipality,
                                          item.district,
                                          index,
                                          parseInt(e.target.value) || 0,
                                        )
                                      }
                                      className="w-16 h-8 text-center text-xs border transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-300 bg-white text-gray-900"
                                    />
                                    <Badge className={getStatusColor(item.data[index])}>
                                      {getStatusText(item.data[index])}
                                    </Badge>
                                  </div>
                                </td>
                              ))
                            ) : (
                              // Status Tab - Show only summary columns
                              <>
                                <td className="px-6 py-4 text-center w-24">
                                  <span className="text-lg font-semibold transition-colors duration-300 text-gray-900">
                                    {item.totalPatrols}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center w-24">
                                  <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                                    {item.activeDays}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center w-24">
                                  <span className="text-lg font-semibold text-red-600 dark:text-red-400">
                                    {item.inactiveDays}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center w-24">
                                  <span className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                                    {item.activePercentage}%
                                  </span>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Removed custom modal in favor of Sonner toast */}
    </Layout>
  );
}
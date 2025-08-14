import React, { useState, useEffect, useRef } from "react";
import Layout from "./Layout";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Badge } from "./components/ui/badge";
import { Label } from "./components/ui/label";
import { useTheme } from "./ThemeContext";
import { db } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
} from "firebase/firestore";
import {
  Plus,
  Save,
  Download,
  Upload,
  RefreshCw,
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
  Camera
} from "lucide-react";

export default function IPatroller({ onLogout, onNavigate, currentPage }) {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [patrolData, setPatrolData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMunicipality, setEditingMunicipality] = useState(null);
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
  const [firestoreStatus, setFirestoreStatus] = useState("connecting");
  const [availableMonths, setAvailableMonths] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");
  const [clearLoading, setClearLoading] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showSummaryReport, setShowSummaryReport] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedItemForPhotos, setSelectedItemForPhotos] = useState(null);
  const [beforePhoto, setBeforePhoto] = useState(null);
  const [afterPhoto, setAfterPhoto] = useState(null);
  const [beforePhotoFile, setBeforePhotoFile] = useState(null);
  const [afterPhotoFile, setAfterPhotoFile] = useState(null);
  const [showViewReportModal, setShowViewReportModal] = useState(false);
  const [selectedItemForView, setSelectedItemForView] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [actionTaken, setActionTaken] = useState(''); // Store action taken text
  const [uploadedPhotos, setUploadedPhotos] = useState({}); // Store photos by date
  const fileInputRef = useRef(null);
  const beforePhotoInputRef = useRef(null);
  const afterPhotoInputRef = useRef(null);

  // Helper function to generate random colors for placeholder images
  const getRandomColor = () => {
    const colors = ['4F46E5', '10B981', 'F59E0B', 'EF4444', '8B5CF6', '06B6D4', 'EC4899', '14B8A6', 'F97316', '6366F1'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Handle photo management from view report modal
  const handleManagePhotosFromView = (item) => {
    setShowViewReportModal(false);
    setSelectedItemForPhotos(item);
    setShowPhotoModal(true);
    // Set current date as default
    setSelectedDate(new Date().toISOString().split('T')[0]);
    // Reset photos when opening modal
    setBeforePhoto(null);
    setAfterPhoto(null);
    setBeforePhotoFile(null);
    setAfterPhotoFile(null);
  };

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

  // Initialize patrol data
  useEffect(() => {
    loadPatrolData();
    loadAvailableMonths();
  }, [selectedMonth, selectedYear]);

  // Load available months from Firestore
  const loadAvailableMonths = async () => {
    try {
      const patrolDataRef = collection(db, "patrolData");
      const querySnapshot = await getDocs(patrolDataRef);
      const months = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        months.push({
          id: doc.id,
          year: data.year,
          month: data.month,
          monthName: data.monthName,
        });
      });

      setAvailableMonths(months);
    } catch (error) {
      console.error("❌ Error loading available months:", error);
    }
  };

  // Firestore functions
  const savePatrolData = async (dataArg) => {
    try {
      setLoading(true);
      setFirestoreStatus("saving");
      const batch = writeBatch(db);

      // Create month-year document ID (e.g., "03-2025")
      const monthYearId = `${String(selectedMonth + 1).padStart(2, "0")}-${selectedYear}`;

      // Create the month-year document if it doesn't exist
      const monthYearDocRef = doc(db, "patrolData", monthYearId);
      batch.set(monthYearDocRef, {
        year: selectedYear,
        month: selectedMonth,
        monthName: new Date(selectedYear, selectedMonth).toLocaleDateString(
          "en-US",
          { month: "long" },
        ),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const itemsToSave = Array.isArray(dataArg) ? dataArg : patrolData;
      itemsToSave.forEach((item) => {
        // Save each municipality data as a document in the month-year collection
        const docRef = doc(
          db,
          "patrolData",
          monthYearId,
          "municipalities",
          item.id,
        );
        batch.set(docRef, {
          ...item,
          year: selectedYear,
          month: selectedMonth,
          updatedAt: new Date().toISOString(),
        });
      });

      await batch.commit();
      setFirestoreStatus("connected");
      console.log("✅ Patrol data saved to Firestore");
    } catch (error) {
      console.error("❌ Error saving patrol data:", error);
      setFirestoreStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const loadPatrolData = async () => {
    try {
      setLoading(true);
      setFirestoreStatus("connecting");

      // Create month-year document ID (e.g., "03-2025")
      const monthYearId = `${String(selectedMonth + 1).padStart(2, "0")}-${selectedYear}`;

      // Try to load existing data from Firestore
      const municipalitiesRef = collection(
        db,
        "patrolData",
        monthYearId,
        "municipalities",
      );
      const querySnapshot = await getDocs(municipalitiesRef);
      const existingData = [];

      querySnapshot.forEach((doc) => {
        existingData.push(doc.data());
      });

      if (existingData.length > 0) {
        // Ensure all municipalities are present, even with 0 counts
        const completeData = ensureAllMunicipalitiesPresent(existingData);
        setPatrolData(completeData);
        setFirestoreStatus("connected");
        console.log("✅ Loaded existing patrol data from Firestore and ensured all municipalities are present");
      } else {
        // Initialize with empty data
        initializePatrolData();
        setFirestoreStatus("connected");
        console.log("📝 No existing data found, initialized with empty data");
      }
    } catch (error) {
      console.error("❌ Error loading patrol data:", error);
      setFirestoreStatus("error");
      // Fallback to local initialization
      initializePatrolData();
    } finally {
      setLoading(false);
    }
  };

  const ensureAllMunicipalitiesPresent = (data) => {
    const completeData = [];
    
    Object.entries(municipalitiesByDistrict).forEach(([district, municipalities]) => {
      municipalities.forEach((municipality) => {
        const existingItem = data.find(
          item => item.municipality === municipality && item.district === district
        );
        
        if (existingItem) {
          // Use existing data
          completeData.push(existingItem);
        } else {
          // Create new entry with 0 counts
          const dailyData = selectedDates.map(() => null);
          completeData.push({
            id: `${district}-${municipality}`,
            municipality,
            district,
            data: dailyData,
            totalPatrols: 0,
            activeDays: 0,
            inactiveDays: 0,
            activePercentage: 0,
          });
        }
      });
    });
    
    return completeData;
  };

  const initializePatrolData = () => {
    const initialData = [];

    Object.entries(municipalitiesByDistrict).forEach(
      ([district, municipalities]) => {
        municipalities.forEach((municipality) => {
          const dailyData = selectedDates.map(() => null); // Initialize with null (no entry)
          initialData.push({
            id: `${district}-${municipality}`,
            municipality,
            district,
            data: dailyData,
            totalPatrols: 0,
            activeDays: 0,
            inactiveDays: 0,
            activePercentage: 0,
          });
        });
      },
    );

    setPatrolData(initialData);
  };

  const handleAddPatrolData = async (
    municipality,
    district,
    dayIndex,
    value,
  ) => {
    const updatedData = patrolData.map((item) => {
      if (item.municipality === municipality && item.district === district) {
        const newData = [...item.data];
        newData[dayIndex] = parseInt(value) || 0;
        const totalPatrols = newData.reduce((sum, val) => sum + (val || 0), 0);
        const activeDays = newData.filter((val) => val > 0).length;
        const inactiveDays = newData.filter((val) => val === 0).length;
        const activePercentage = Math.round(
          (activeDays / newData.length) * 100,
        );

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

    // Save to Firestore
    try {
      await savePatrolData(updatedData);
    } catch (error) {
      console.error("❌ Error saving data:", error);
    }
  };

  const toggleDistrictExpansion = (district) => {
    setExpandedDistricts((prev) => ({
      ...prev,
      [district]: !prev[district],
    }));
  };

  const getStatusColor = (value) => {
    if (value === null || value === undefined)
      return isDarkMode 
        ? "bg-gray-900/30 text-gray-400" 
        : "bg-gray-100 text-gray-800";
    if (value === 0)
      return isDarkMode 
        ? "bg-red-600 text-white" 
        : "bg-red-600 text-white";
    if (value >= 5)
      return isDarkMode 
        ? "bg-green-600 text-white" 
        : "bg-green-600 text-white";
    return isDarkMode 
      ? "bg-red-600 text-white" 
      : "bg-red-600 text-white";
  };

  const getStatusText = (value) => {
    if (value === null || value === undefined) return "No Entry";
    if (value === 0) return "Inactive";
    if (value >= 5) return "Active";
    return "Inactive";
  };

  // Daily Reports Tab Handlers
  const handleViewReport = (item) => {
    setSelectedItemForView(item);
    setShowViewReportModal(true);
    // Set the current month/year for photo display
    const currentDate = new Date();
    setSelectedDate(`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`);
    // TODO: Load actual photos from database here
    // For now, we'll use placeholder photos
    setBeforePhoto(null);
    setAfterPhoto(null);
  };

  const handleExportReport = (item) => {
    try {
      // Create report data
      const reportData = {
        municipality: item.municipality,
        district: item.district,
        month: selectedMonth,
        year: selectedYear,
        totalPatrols: item.totalPatrols,
        activeDays: item.activeDays,
        inactiveDays: item.inactiveDays,
        activePercentage: item.activePercentage,
        reportDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      // Convert to CSV format
      const csvContent = [
        ['Daily Patrol Report'],
        [''],
        ['Municipality:', reportData.municipality],
        ['District:', reportData.district],
        ['Month:', reportData.month],
        ['Year:', reportData.year],
        [''],
        ['Patrol Statistics'],
        ['Total Patrols:', reportData.totalPatrols],
        ['Active Days:', reportData.activeDays],
        ['Inactive Days:', reportData.inactiveDays],
        ['Active Percentage:', reportData.activePercentage + '%'],
        [''],
        ['Report Generated:', reportData.reportDate]
      ].map(row => row.join(',')).join('\n');

      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `patrol_report_${item.municipality}_${selectedMonth}_${selectedYear}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show success message
      alert(`Report exported successfully for ${item.municipality}!`);
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Error exporting report. Please try again.');
    }
  };

  const handleOpenPhotoModal = (item) => {
    setSelectedItemForPhotos(item);
    setShowPhotoModal(true);
    // Set current date as default
    setSelectedDate(new Date().toISOString().split('T')[0]);
    // Reset photos when opening modal
    setBeforePhoto(null);
    setAfterPhoto(null);
    setBeforePhotoFile(null);
    setAfterPhotoFile(null);
    setActionTaken(''); // Reset action taken text
    
    // Show helpful message
    console.log(`Opening photo upload modal for ${item.municipality} - ${item.district}`);
  };

  const handleClosePhotoModal = () => {
    // Check if there are unsaved changes
    if (beforePhoto || afterPhoto || beforePhotoFile || afterPhotoFile || actionTaken) {
      const hasChanges = beforePhoto || afterPhoto || beforePhotoFile || afterPhotoFile || actionTaken;
      if (hasChanges) {
        const confirmClose = confirm('⚠️ You have unsaved changes. Are you sure you want to close without saving?');
        if (!confirmClose) return;
      }
    }
    
    setShowPhotoModal(false);
    setSelectedItemForPhotos(null);
    setBeforePhoto(null);
    setAfterPhoto(null);
    setBeforePhotoFile(null);
    setAfterPhotoFile(null);
    setActionTaken('');
  };

  const handleBeforePhotoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setBeforePhotoFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setBeforePhoto(e.target.result);
        };
        reader.readAsDataURL(file);
      } else {
        alert('Please select an image file');
      }
    }
  };

  const handleAfterPhotoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setAfterPhotoFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setAfterPhoto(e.target.result);
        };
        reader.readAsDataURL(file);
      } else {
        alert('Please select an image file');
      }
    }
  };

  const handleUploadBeforePhoto = (item) => {
    beforePhotoInputRef.current?.click();
  };

  const handleUploadAfterPhoto = (item) => {
    afterPhotoInputRef.current?.click();
  };

    const handleSavePhotos = async () => {
    if (!selectedItemForPhotos) return;

    try {
      // TODO: Implement actual photo upload to Firebase Storage
      console.log('Saving photos for:', selectedItemForPhotos.municipality);
      console.log('Selected date:', selectedDate);
      console.log('Before photo:', beforePhotoFile);
      console.log('After photo:', afterPhotoFile);

      // Store photos in local state for now (replace with Firebase later)
      const photoKey = `${selectedItemForPhotos.municipality}-${selectedDate}`;
      setUploadedPhotos(prev => ({
        ...prev,
        [photoKey]: {
          beforePhoto: beforePhoto,
          afterPhoto: afterPhoto,
          beforePhotoFile: beforePhotoFile,
          afterPhotoFile: afterPhotoFile,
          actionTaken: actionTaken, // Store action taken text
          uploadDate: new Date().toISOString(),
          municipality: selectedItemForPhotos.municipality,
          district: selectedItemForPhotos.district,
          selectedDate: selectedDate // Store the selected date
        }
      }));

      // Show success message with more details
      const successMessage = `✅ Photos saved successfully!\n\n📍 Location: ${selectedItemForPhotos.municipality} - ${selectedItemForPhotos.district}\n📅 Date: ${selectedDate}\n📸 Before Photo: ${beforePhoto ? '✅ Uploaded' : '❌ Not uploaded'}\n📸 After Photo: ${afterPhoto ? '✅ Uploaded' : '❌ Not uploaded'}\n📝 Action Taken: ${actionTaken ? '✅ Recorded' : '❌ Not recorded'}`;
      
      alert(successMessage);
      handleClosePhotoModal();
    } catch (error) {
      console.error('Error saving photos:', error);
      alert('Error saving photos. Please try again.');
    }
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

  const overallSummary = {
    totalPatrols: patrolData.reduce((sum, item) => sum + item.totalPatrols, 0),
    totalActive: patrolData.reduce((sum, item) => sum + item.activeDays, 0),
    totalInactive: patrolData.reduce((sum, item) => sum + item.inactiveDays, 0),
    avgActivePercentage:
      patrolData.length > 0
        ? Math.round(
            patrolData.reduce((sum, item) => sum + item.activePercentage, 0) /
              patrolData.length,
          )
        : 0,
    municipalityCount: patrolData.length,
  };

  // Excel import functions
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file extension and type
    const fileName = file.name.toLowerCase();
    const isCSV = fileName.endsWith(".csv") || file.type === "text/csv";
    const isExcel =
      fileName.endsWith(".xlsx") ||
      fileName.endsWith(".xls") ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.type === "application/vnd.ms-excel";

    if (!isCSV && !isExcel) {
      setImportError(
        "Please select a valid Excel (.xlsx, .xls) or CSV (.csv) file.",
      );
      return;
    }

    setImportLoading(true);
    setImportError("");
    setImportSuccess("");

    if (isCSV) {
      // Handle CSV files
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target.result;
          await processExcelData(data, file.name);
        } catch (error) {
          console.error("Error reading CSV file:", error);
          setImportError(
            "Error reading CSV file. Please check the file format.",
          );
          setImportLoading(false);
        }
      };
      reader.readAsText(file, "UTF-8");
    } else {
      // Handle Excel files
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target.result;
          await processMultiSheetExcel(data, file.name);
        } catch (error) {
          console.error("Error reading Excel file:", error);
          setImportError(
            "Error reading Excel file. Please check the file format.",
          );
          setImportLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const processExcelData = async (data, fileName) => {
    try {
      // Normalize line endings and split
      const normalizedData = data.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
      const lines = normalizedData
        .split("\n")
        .filter((line) => line.trim() !== "");

      console.log("Processing file with", lines.length, "lines");

      // Find all month sections in the file
      const monthSections = [];
      const monthNames = [
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
        "December",
      ];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith("===")) {
          // Check if this line contains a month name
          for (const monthName of monthNames) {
            if (
              line.includes(monthName) &&
              line.includes(selectedYear.toString())
            ) {
              // Find the end of this month section
              let monthEndIndex = lines.length;
              for (let j = i + 1; j < lines.length; j++) {
                const nextLine = lines[j].trim();
                if (nextLine.startsWith("===")) {
                  monthEndIndex = j;
                  break;
                }
              }

              monthSections.push({
                month: monthName,
                startIndex: i + 1, // Skip the header line
                endIndex: monthEndIndex,
                lines: lines.slice(i + 1, monthEndIndex),
              });

              console.log(`Found section for ${monthName} ${selectedYear}`);
              break;
            }
          }
        }
      }

      if (monthSections.length === 0) {
        console.log("Available lines:", lines.slice(0, 10)); // Debug first 10 lines
        setImportError(
          `No month sections found for ${selectedYear}. Please check your template format. Make sure your file has sections like "=== March 2025 ==="`,
        );
        setImportLoading(false);
        return;
      }

      console.log(
        `Found ${monthSections.length} month sections: ${monthSections.map((s) => s.month).join(", ")}`,
      );

      // Show which months were found
      const foundMonths = monthSections.map((s) => s.month).join(", ");
      setImportSuccess(`Found months in Excel: ${foundMonths}`);

      // Process each month section and save to Firestore
      for (const section of monthSections) {
        const monthIndex = monthNames.indexOf(section.month);
        if (monthIndex === -1) continue;

        // Generate dates for this month
        const monthDates = generateDates(monthIndex, selectedYear);
        const headers = parseCSVLine(section.lines[0]);

        // Find municipality and district columns
        const municipalityIndex = headers.findIndex(
          (h) =>
            h.toLowerCase().includes("municipality") ||
            h.toLowerCase().includes("city"),
        );
        const districtIndex = headers.findIndex((h) =>
          h.toLowerCase().includes("district"),
        );

        if (municipalityIndex === -1) {
          console.warn(
            `Municipality column not found in ${section.month} section`,
          );
          continue;
        }

        const importedData = [];

        // Process each row starting from line 2 (skip header)
        for (let i = 1; i < section.lines.length; i++) {
          const line = section.lines[i].trim();
          if (!line) continue;

          // Parse CSV line properly (handle quoted values)
          const values = parseCSVLine(line);
          const municipality = values[municipalityIndex];
          const district = values[districtIndex] || "Unknown District";

          if (!municipality) continue;

          // Check if municipality exists in our system
          let foundMunicipality = null;
          for (const [distKey, municipalities] of Object.entries(
            municipalitiesByDistrict,
          )) {
            if (municipalities.includes(municipality)) {
              foundMunicipality = { municipality, district: distKey };
              break;
            }
          }

          if (!foundMunicipality) {
            console.warn(`Municipality "${municipality}" not found in system`);
            continue;
          }

          // Process daily data
          const dailyData = monthDates.map(() => null);
          let dayIndex = 0;

          // Start from the first data column (after municipality and district)
          for (
            let j = Math.max(municipalityIndex, districtIndex) + 1;
            j < values.length && dayIndex < monthDates.length;
            j++
          ) {
            const value = parseInt(values[j]) || 0;
            dailyData[dayIndex] = value;
            dayIndex++;
          }

          // Calculate summary
          const totalPatrols = dailyData.reduce(
            (sum, val) => sum + (val || 0),
            0,
          );
          const activeDays = dailyData.filter((val) => val > 0).length;
          const inactiveDays = dailyData.filter((val) => val === 0).length;
          const activePercentage = Math.round(
            (activeDays / dailyData.length) * 100,
          );

          importedData.push({
            id: `${foundMunicipality.district}-${foundMunicipality.municipality}`,
            municipality: foundMunicipality.municipality,
            district: foundMunicipality.district,
            data: dailyData,
            totalPatrols,
            activeDays,
            inactiveDays,
            activePercentage,
          });
        }

        if (importedData.length > 0) {
          // Save this month's data to Firestore
          const monthYearId = `${String(monthIndex + 1).padStart(2, "0")}-${selectedYear}`;

          try {
            const batch = writeBatch(db);

            // Create the month-year document
            const monthYearDocRef = doc(db, "patrolData", monthYearId);
            batch.set(monthYearDocRef, {
              year: selectedYear,
              month: monthIndex,
              monthName: section.month,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });

            // Save municipality data
            importedData.forEach((item) => {
              const docRef = doc(
                db,
                "patrolData",
                monthYearId,
                "municipalities",
                item.id,
              );
              batch.set(docRef, {
                ...item,
                year: selectedYear,
                month: monthIndex,
                updatedAt: new Date().toISOString(),
              });
            });

            await batch.commit();
            console.log(
              `✅ Saved data for ${section.month} ${selectedYear} to Firestore`,
            );
          } catch (error) {
            console.error(`❌ Error saving ${section.month} data:`, error);
          }
        }
      }

      // If current month was imported, update the UI
      const currentMonthName = new Date(
        selectedYear,
        selectedMonth,
      ).toLocaleDateString("en-US", { month: "long" });
      const currentMonthSection = monthSections.find(
        (s) => s.month === currentMonthName,
      );

      if (currentMonthSection) {
        // Reload current month data to update UI
        await loadPatrolData();
      } else {
        // If current month wasn't in the import, still reload to show current state
        await loadPatrolData();
      }

      console.log(`✅ Imported data for ${monthSections.length} months`);

      // Show final success message
      const importedMonths = monthSections.map((s) => s.month).join(", ");
      setImportSuccess(`✅ Successfully imported data for: ${importedMonths}`);
      setImportLoading(false);
    } catch (error) {
      console.error("Error processing Excel data:", error);
      setImportError("Error processing file. Please check the format.");
      setImportLoading(false);
    }
  };

  const downloadTemplate = () => {
    // Create template for all months (January to December)
    const months = [
      { name: "January", monthIndex: 0 },
      { name: "February", monthIndex: 1 },
      { name: "March", monthIndex: 2 },
      { name: "April", monthIndex: 3 },
      { name: "May", monthIndex: 4 },
      { name: "June", monthIndex: 5 },
      { name: "July", monthIndex: 6 },
      { name: "August", monthIndex: 7 },
      { name: "September", monthIndex: 8 },
      { name: "October", monthIndex: 9 },
      { name: "November", monthIndex: 10 },
      { name: "December", monthIndex: 11 },
    ];

    let fullTemplate = "";

    months.forEach((month, monthIndex) => {
      // Generate dates for this month
      const monthDates = generateDates(month.monthIndex, selectedYear);
      const headers = [
        "Municipality",
        "District",
        ...monthDates.map((date) => `${date.dayName} ${date.dayNumber}`),
      ];

      fullTemplate += `=== ${month.name} ${selectedYear} ===\n`;
      fullTemplate += headers.join(",") + "\n";

      // Add sample rows for each municipality
      Object.entries(municipalitiesByDistrict).forEach(
        ([district, municipalities]) => {
          municipalities.forEach((municipality) => {
            const row = [municipality, district, ...monthDates.map(() => "0")];
            fullTemplate += row.join(",") + "\n";
          });
        },
      );

      fullTemplate += "\n"; // Add separator between months
    });

    const blob = new Blob([fullTemplate], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `patrol-template-full-year-${selectedYear}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const parseCSVLine = (line) => {
    const result = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  };

  const clearPatrolData = async (clearAll = false) => {
    const currentMonthName = new Date(
      selectedYear,
      selectedMonth,
    ).toLocaleDateString("en-US", { month: "long", year: "numeric" });

    if (clearAll) {
      if (
        !window.confirm(
          `Are you sure you want to clear ALL patrol data for ${selectedYear}? This will delete data for all months (March to July) and cannot be undone.`,
        )
      ) {
        return;
      }
    } else {
      if (
        !window.confirm(
          `Are you sure you want to clear all patrol data for ${currentMonthName}? This action cannot be undone.`,
        )
      ) {
        return;
      }
    }

    try {
      setClearLoading(true);
      setFirestoreStatus("saving");

      if (clearAll) {
        // Clear all months (January to December)
        const months = [
          { name: "January", monthIndex: 0 },
          { name: "February", monthIndex: 1 },
          { name: "March", monthIndex: 2 },
          { name: "April", monthIndex: 3 },
          { name: "May", monthIndex: 4 },
          { name: "June", monthIndex: 5 },
          { name: "July", monthIndex: 6 },
          { name: "August", monthIndex: 7 },
          { name: "September", monthIndex: 8 },
          { name: "October", monthIndex: 9 },
          { name: "November", monthIndex: 10 },
          { name: "December", monthIndex: 11 },
        ];

        const batch = writeBatch(db);
        let clearedMonths = 0;

        for (const month of months) {
          const monthYearId = `${String(month.monthIndex + 1).padStart(2, "0")}-${selectedYear}`;

          try {
            // Delete all municipality documents in the subcollection
            const municipalitiesRef = collection(
              db,
              "patrolData",
              monthYearId,
              "municipalities",
            );
            const querySnapshot = await getDocs(municipalitiesRef);

            querySnapshot.forEach((doc) => {
              batch.delete(doc.ref);
            });

            // Delete the month-year document itself
            const monthYearDocRef = doc(db, "patrolData", monthYearId);
            batch.delete(monthYearDocRef);

            clearedMonths++;
          } catch (error) {
            console.warn(`Could not clear ${month.name} data:`, error);
          }
        }

        await batch.commit();

        // Reinitialize with empty data
        initializePatrolData();
        setFirestoreStatus("connected");
        setImportSuccess(
          `✅ Cleared patrol data for ${clearedMonths} months in ${selectedYear}`,
        );

        console.log(`✅ Cleared patrol data for ${clearedMonths} months`);
      } else {
        // Clear only current month
        const monthYearId = `${String(selectedMonth + 1).padStart(2, "0")}-${selectedYear}`;

        // Delete the month-year document and all its subcollections
        const batch = writeBatch(db);

        // Delete all municipality documents in the subcollection
        const municipalitiesRef = collection(
          db,
          "patrolData",
          monthYearId,
          "municipalities",
        );
        const querySnapshot = await getDocs(municipalitiesRef);

        querySnapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });

        // Delete the month-year document itself
        const monthYearDocRef = doc(db, "patrolData", monthYearId);
        batch.delete(monthYearDocRef);

        await batch.commit();

        // Reinitialize with empty data
        initializePatrolData();
        setFirestoreStatus("connected");
        setImportSuccess(`✅ Cleared all patrol data for ${currentMonthName}`);

        console.log(`✅ Cleared patrol data for ${monthYearId}`);
      }
    } catch (error) {
      console.error("❌ Error clearing patrol data:", error);
      setImportError("Error clearing patrol data. Please try again.");
      setFirestoreStatus("error");
    } finally {
      setClearLoading(false);
      setShowClearModal(false);
    }
  };

  const processMultiSheetExcel = async (data, fileName) => {
    try {
      console.log("Processing Excel file...");

      // Convert ArrayBuffer to text to process as CSV
      const decoder = new TextDecoder("utf-8");
      const textData = decoder.decode(data);

      // Process the data using the template format
      await processExcelData(textData, fileName);
    } catch (error) {
      console.error("Error processing Excel file:", error);
      setImportError("Error processing Excel file.");
      setImportLoading(false);
    }
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
              I-Patroller Management
            </h1>
            <p className={`text-lg transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {new Date(selectedYear, selectedMonth).toLocaleDateString(
                "en-US",
                { month: "long", year: "numeric" },
              )} • Patrol Activity Dashboard
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className={`w-2 h-2 rounded-full ${
                firestoreStatus === 'connected' ? 'bg-green-500' :
                firestoreStatus === 'connecting' ? 'bg-yellow-500' :
                firestoreStatus === 'saving' ? 'bg-blue-500' :
                'bg-red-500'
              }`}></div>
              <span className={`text-sm font-medium ${
                firestoreStatus === 'connected' ? 'text-green-600 dark:text-green-400' :
                firestoreStatus === 'connecting' ? 'text-yellow-600 dark:text-yellow-400' :
                firestoreStatus === 'saving' ? 'text-blue-600 dark:text-blue-400' :
                'text-red-600 dark:text-red-400'
              }`}>
                {firestoreStatus === 'connected' ? 'Connected to Firestore' :
                 firestoreStatus === 'connecting' ? 'Connecting...' :
                 firestoreStatus === 'saving' ? 'Saving...' :
                 'Connection Error'}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={savePatrolData}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white"
              title="Save Data"
            >
              <Save className="w-5 h-5" />
            </Button>
            <Button
              onClick={loadPatrolData}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              title="Refresh Data"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              onClick={() => setShowSummaryReport(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              title="Summary Report"
            >
              <BarChart3 className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              title="Import Excel"
            >
              <Upload className="w-5 h-5" />
            </Button>
            <Button
              onClick={downloadTemplate}
              className="bg-gray-600 hover:bg-gray-700 text-white"
              title="Download Template"
            >
              <Download className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => setShowClearModal(true)}
              disabled={clearLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
              title="Clear Data"
            >
              <Trash className="w-5 h-5" />
            </Button>
            <input
              id="patrol-file-input"
              name="patrol-file-input"
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv,.xlsx,.xls"
              className="hidden"
            />
          </div>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className={`mb-4 p-4 rounded-lg ${
            isDarkMode ? 'bg-blue-900/20 border border-blue-600/30' : 'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className={`text-sm font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-blue-300' : 'text-blue-700'
              }`}>
                {firestoreStatus === 'saving' ? 'Saving to database...' : 
                 firestoreStatus === 'connecting' ? 'Loading from database...' : 
                 'Processing...'}
              </span>
            </div>
          </div>
        )}

        {/* Import Messages */}
        {importError && (
          <div className={`mb-6 border px-4 py-3 rounded-lg relative transition-all duration-300 ${
            isDarkMode 
              ? 'bg-red-900/20 border-red-800 text-red-400' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 flex-shrink-0" />
              <div>
                <strong className="font-semibold">Import Error: </strong>
                <span className="block sm:inline">{importError}</span>
              </div>
            </div>
            <button
              onClick={() => setImportError("")}
              className="absolute top-2 right-2 p-1 hover:bg-red-100 dark:hover:bg-red-800/30 rounded"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        )}

        {importSuccess && (
          <div className={`mb-6 border px-4 py-3 rounded-lg relative transition-all duration-300 ${
            isDarkMode 
              ? 'bg-green-900/20 border-green-800 text-green-400' 
              : 'bg-green-50 border-green-200 text-green-800'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              <div>
                <strong className="font-semibold">Import Success: </strong>
                <span className="block sm:inline">{importSuccess}</span>
              </div>
            </div>
            <button
              onClick={() => setImportSuccess("")}
              className="absolute top-2 right-2 p-1 hover:bg-green-100 dark:hover:bg-green-800/30 rounded"
            >
              <CheckCircle className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className={`backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${
            isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>Total Patrols</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {overallSummary.totalPatrols.toLocaleString()}
                  </p>
                </div>
                <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'
                }`}>
                  <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
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
                  }`}>Active Days</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {overallSummary.totalActive.toLocaleString()}
                  </p>
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
                  }`}>Inactive Days</p>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {overallSummary.totalInactive.toLocaleString()}
                  </p>
                </div>
                <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  isDarkMode ? 'bg-red-900/30' : 'bg-red-100'
                }`}>
                  <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
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
                  }`}>Avg Active %</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {overallSummary.avgActivePercentage}%
                  </p>
                </div>
                <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100'
                }`}>
                  <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
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
            <div className="flex items-center justify-between">
              <CardTitle className={`text-lg font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
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
                <Label htmlFor="search" className={`transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Search
                </Label>
                <Input
                  id="search"
                  placeholder="Search municipalities..."
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
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className={`mt-1 w-full p-2 rounded-md border transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
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
                <Label htmlFor="year-filter" className={`transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Year
                </Label>
                <select
                  id="year-filter"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className={`mt-1 w-full p-2 rounded-md border transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                >
                  <option value={2023}>2023</option>
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>
              </div>
              <div>
                <Label htmlFor="district-filter" className={`transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  District
                </Label>
                <select
                  id="district-filter"
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className={`mt-1 w-full p-2 rounded-md border transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
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
        <Card className={`backdrop-blur-sm border-0 shadow-lg ${
          isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'
        }`}>
          <CardHeader>
            <CardTitle className={`text-lg font-semibold transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
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
                    ? isDarkMode 
                      ? "bg-gray-600 text-blue-400 shadow-sm"
                      : "bg-white text-blue-600 shadow-sm"
                    : isDarkMode
                      ? "text-gray-400 hover:text-gray-200"
                      : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Calendar className="w-4 h-4" />
                Daily Counts
              </button>
              <button
                onClick={() => setActiveTab("status")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                  activeTab === "status"
                    ? isDarkMode 
                      ? "bg-gray-600 text-blue-400 shadow-sm"
                      : "bg-white text-blue-600 shadow-sm"
                    : isDarkMode
                      ? "text-gray-400 hover:text-gray-200"
                      : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Status
              </button>
              <button
                onClick={() => setActiveTab("dailyReports")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                  activeTab === "dailyReports"
                    ? isDarkMode 
                      ? "bg-gray-600 text-blue-400 shadow-sm"
                      : "bg-white text-blue-600 shadow-sm"
                    : isDarkMode
                      ? "text-gray-400 hover:text-gray-200"
                      : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <FileText className="w-4 h-4" />
                Daily Reports
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className={`border-b transition-all duration-300 ${
                    isDarkMode 
                      ? 'border-gray-700 bg-gray-700/50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}>
                    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Municipality
                    </th>
                    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      District
                    </th>
                                         {activeTab === "daily" ? (
                       // Daily Counts Tab - Show all date columns
                       selectedDates.map((date, index) => (
                        <th
                          key={index}
                          className={`px-2 py-4 text-center text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                            date.isCurrentDay
                              ? isDarkMode 
                                ? "bg-blue-900/30 text-blue-400"
                                : "bg-blue-100 text-blue-800"
                              : isDarkMode 
                                ? "text-gray-300"
                                : "text-gray-700"
                          }`}
                        >
                          {date.dayName}
                          <br />
                          <span className="text-xs">{date.day}</span>
                        </th>
                      ))
                    ) : activeTab === "status" ? (
                      // Status Tab - Show only summary columns
                      <>
                        <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider transition-colors duration-300 w-24 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Total
                        </th>
                        <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider transition-colors duration-300 w-24 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Active
                        </th>
                        <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider transition-colors duration-300 w-24 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Inactive
                        </th>
                        <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider transition-colors duration-300 w-24 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          % Active
                        </th>
                      </>
                    ) : (
                      // Daily Reports Tab - Show report columns
                      <>
                        <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Months
                        </th>
                        <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Total Patrols
                        </th>

                        <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Actions
                        </th>

                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {Object.keys(groupedData).map((district) => (
                    <React.Fragment key={district}>
                      {/* District Header */}
                      <tr className={`border-b transition-all duration-300 ${
                        isDarkMode 
                          ? 'bg-gray-800/50 border-gray-700' 
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <td
                                                     colSpan={
                             activeTab === "daily" ? selectedDates.length + 2 : 
                                                           activeTab === "status" ? 6 : 5
                           }
                          className="px-6 py-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Building2 className={`w-5 h-5 ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                              }`} />
                              <span className={`font-semibold transition-colors duration-300 ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                {district}
                              </span>
                              <Badge className={`transition-all duration-300 ${
                                isDarkMode 
                                  ? 'bg-gray-700 text-gray-300 border-gray-600' 
                                  : 'bg-gray-100 text-gray-800 border-gray-200'
                              }`}>
                                {groupedData[district].length} municipalities
                              </Badge>
                            </div>
                            <button
                              onClick={() =>
                                toggleDistrictExpansion(district)
                              }
                              className={`p-2 rounded-lg transition-colors duration-200 ${
                                isDarkMode 
                                  ? 'hover:bg-gray-700' 
                                  : 'hover:bg-gray-200'
                              }`}
                            >
                              {expandedDistricts[district] ? (
                                <ChevronUp className={`w-4 h-4 ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                }`} />
                              ) : (
                                <ChevronDown className={`w-4 h-4 ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                }`} />
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
                            className={`transition-colors duration-200 ${
                              isDarkMode 
                                ? 'hover:bg-gray-800/30' 
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <MapPin className={`w-4 h-4 ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                }`} />
                                <span className={`font-medium transition-colors duration-300 ${
                                  isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {item.municipality}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge className={`transition-all duration-300 ${
                                isDarkMode 
                                  ? 'bg-gray-700 text-gray-300 border-gray-600' 
                                  : 'bg-gray-100 text-gray-800 border-gray-200'
                              }`}>
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
                                      className={`w-16 h-8 text-center text-xs border transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        isDarkMode 
                                          ? 'border-gray-600 bg-gray-700 text-white' 
                                          : 'border-gray-300 bg-white text-gray-900'
                                      }`}
                                    />
                                    <Badge className={getStatusColor(item.data[index])}>
                                      {getStatusText(item.data[index])}
                                    </Badge>
                                  </div>
                                </td>
                              ))
                            ) : activeTab === "status" ? (
                              // Status Tab - Show only summary columns
                              <>
                                <td className="px-6 py-4 text-center w-24">
                                  <span className={`text-lg font-semibold transition-colors duration-300 ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                  }`}>
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
                            ) : (
                              // Daily Reports Tab - Show report columns
                              <>
                                                    <td className="px-6 py-4 text-center">
                      <span className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', {
                          month: 'long'
                        })}
                      </span>
                    </td>
                                                    <td className="px-6 py-4 text-center">
                      <span className={`text-lg font-semibold transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {item.totalPatrols}
                      </span>
                    </td>
                                                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 text-xs"
                          onClick={() => handleViewReport(item)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      </div>
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
      </section>

      {/* Clear Data Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
          <div
            className={`rounded-xl p-6 w-96 max-w-md mx-4 shadow-2xl border transition-all duration-300 ${
              isDarkMode 
                ? "bg-gray-900/95 border-gray-700/50" 
                : "bg-white/95 border-gray-200/50"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className={`text-lg font-semibold transition-colors duration-300 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Clear Patrol Data
              </h3>
              <button
                onClick={() => setShowClearModal(false)}
                className={`p-1 rounded-full transition-colors duration-300 ${
                  isDarkMode 
                    ? "text-gray-400 hover:text-gray-300 hover:bg-gray-700/80" 
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/80"
                }`}
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p
              className={`text-sm mb-6 transition-colors duration-300 ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Choose what you want to clear:
            </p>

            <div className="space-y-3">
              <button
                onClick={() => clearPatrolData(false)}
                disabled={clearLoading}
                className={`w-full p-4 rounded-lg border-2 transition-all duration-300 ${
                  isDarkMode
                    ? "border-orange-500/50 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500"
                    : "border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400"
                } ${clearLoading ? "opacity-50 cursor-not-allowed" : "hover:scale-105 hover:shadow-md"}`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <div className="font-semibold">Current Month Only</div>
                    <div className="text-xs opacity-75">
                      Clear data for{" "}
                      {new Date(selectedYear, selectedMonth).toLocaleDateString(
                        "en-US",
                        { month: "long", year: "numeric" },
                      )}
                    </div>
                  </div>
                  <Calendar className="w-5 h-5" />
                </div>
              </button>

              <button
                onClick={() => clearPatrolData(true)}
                disabled={clearLoading}
                className={`w-full p-4 rounded-lg border-2 transition-all duration-300 ${
                  isDarkMode
                    ? "border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500"
                    : "border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400"
                } ${clearLoading ? "opacity-50 cursor-not-allowed" : "hover:scale-105 hover:shadow-md"}`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <div className="font-semibold">All Months</div>
                    <div className="text-xs opacity-75">
                      Clear data for all months (January to December{" "}
                      {selectedYear})
                    </div>
                  </div>
                  <Trash2 className="w-5 h-5" />
                </div>
              </button>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowClearModal(false)}
                disabled={clearLoading}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${
                  isDarkMode
                    ? "bg-gray-700/80 text-gray-300 hover:bg-gray-600/80"
                    : "bg-gray-200/80 text-gray-700 hover:bg-gray-300/80"
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Report Modal */}
      {showSummaryReport && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
          <div
            className={`rounded-xl p-6 w-[800px] max-w-[90vw] mx-4 shadow-2xl border transition-all duration-300 ${
              isDarkMode 
                ? "bg-gray-900/95 border-gray-700/50" 
                : "bg-white/95 border-gray-200/50"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className={`text-lg font-semibold transition-colors duration-300 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Summary Report -{" "}
                {new Date(selectedYear, selectedMonth).toLocaleDateString(
                  "en-US",
                  { month: "long", year: "numeric" },
                )}
              </h3>
              <button
                onClick={() => setShowSummaryReport(false)}
                className={`p-1 rounded-full transition-colors duration-300 ${
                  isDarkMode 
                    ? "text-gray-400 hover:text-gray-300 hover:bg-gray-700/80" 
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/80"
                }`}
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Overall Summary */}
              <div
                className={`p-4 rounded-lg border ${
                  isDarkMode
                    ? "bg-gray-800/50 border-gray-700"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <h4
                  className={`font-semibold mb-3 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Overall Summary
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div
                    className={`p-3 rounded-lg ${
                      isDarkMode
                        ? "bg-blue-900/30 border border-blue-800"
                        : "bg-blue-50 border border-blue-200"
                    }`}
                  >
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      Total Patrols
                    </div>
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {overallSummary.totalPatrols.toLocaleString()}
                    </div>
                  </div>
                  <div
                    className={`p-3 rounded-lg ${
                      isDarkMode
                        ? "bg-green-900/30 border border-green-800"
                        : "bg-green-50 border border-green-200"
                    }`}
                  >
                    <div className="text-sm text-green-600 dark:text-green-400">
                      Active Days
                    </div>
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {overallSummary.totalActive.toLocaleString()}
                    </div>
                  </div>
                  <div
                    className={`p-3 rounded-lg ${
                      isDarkMode
                        ? "bg-red-900/30 border border-red-800"
                        : "bg-red-50 border border-red-200"
                    }`}
                  >
                    <div className="text-sm text-red-600 dark:text-red-400">
                      Inactive Days
                    </div>
                    <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                      {overallSummary.totalInactive.toLocaleString()}
                    </div>
                  </div>
                  <div
                    className={`p-3 rounded-lg ${
                      isDarkMode
                        ? "bg-purple-900/30 border border-purple-800"
                        : "bg-purple-50 border border-purple-200"
                    }`}
                  >
                    <div className="text-sm text-purple-600 dark:text-purple-400">
                      Avg Active %
                    </div>
                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                      {overallSummary.avgActivePercentage}%
                    </div>
                  </div>
                </div>
              </div>

              {/* District Summary */}
              <div
                className={`p-4 rounded-lg border ${
                  isDarkMode
                    ? "bg-gray-800/50 border-gray-700"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <h4
                  className={`font-semibold mb-3 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  District Summary
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {["1ST DISTRICT", "2ND DISTRICT", "3RD DISTRICT"].map((district) => {
                    const summary = getDistrictSummary(district);
                    return (
                      <div
                        key={district}
                        className={`p-4 rounded-lg border ${
                          isDarkMode
                            ? "bg-gray-700/50 border-gray-600"
                            : "bg-white border-gray-200"
                        }`}
                      >
                        <h5
                          className={`font-semibold mb-2 ${
                            isDarkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {district}
                        </h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                              Total Patrols:
                            </span>
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                              {summary.totalPatrols.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                              Active Days:
                            </span>
                            <span className="font-semibold text-green-600 dark:text-green-400">
                              {summary.totalActive.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                              Inactive Days:
                            </span>
                            <span className="font-semibold text-red-600 dark:text-red-400">
                              {summary.totalInactive.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                              Avg Active %:
                            </span>
                            <span className="font-semibold text-purple-600 dark:text-purple-400">
                              {summary.avgActivePercentage}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                              Municipalities:
                            </span>
                            <span className="font-semibold text-gray-600 dark:text-gray-400">
                              {summary.municipalityCount}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {showPhotoModal && selectedItemForPhotos && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
          <div
            className={`rounded-xl p-6 w-full max-w-2xl mx-4 shadow-2xl border transition-all duration-300 ${
              isDarkMode 
                ? "bg-gray-900/95 border-gray-700/50" 
                : "bg-white/95 border-gray-200/50"
            }`}
          >
                                  <div className="flex items-center justify-between mb-6">
                        <h3
                          className={`text-xl font-bold transition-colors duration-300 ${
                            isDarkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          Photos for {selectedItemForPhotos.municipality} - {selectedItemForPhotos.district}
                        </h3>
                        <button
                          onClick={handleClosePhotoModal}
                          className={`p-1 rounded-full transition-colors duration-300 ${
                            isDarkMode
                              ? "text-gray-400 hover:text-gray-300 hover:bg-gray-700/80"
                              : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/80"
                          }`}
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Date Selection */}
                      <div className="mb-6">
                        <label
                          htmlFor="photo-date"
                          className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Select Date for Photos
                        </label>
                        <input
                          type="date"
                          id="photo-date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md text-sm transition-all duration-300 ${
                            isDarkMode
                              ? "bg-gray-800 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500"
                              : "bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                          } focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                        />
                      </div>

                      {/* Action Taken */}
                      <div className="mb-6">
                        <label
                          htmlFor="action-taken"
                          className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Action Taken
                        </label>
                        <textarea
                          id="action-taken"
                          value={actionTaken}
                          onChange={(e) => setActionTaken(e.target.value)}
                          placeholder="Describe the action taken for this patrol..."
                          rows={3}
                          className={`w-full px-3 py-2 border rounded-md text-sm transition-all duration-300 resize-none ${
                            isDarkMode
                              ? "bg-gray-800 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500 placeholder-gray-500"
                              : "bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500 placeholder-gray-400"
                          } focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                        />
                      </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Before Photo Section */}
              <div className="space-y-4">
                <h4 className={`text-lg font-semibold transition-colors duration-300 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}>
                  Before Photo
                </h4>
                <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-300 ${
                  isDarkMode 
                    ? "border-gray-600 bg-gray-800/50" 
                    : "border-gray-300 bg-gray-50"
                }`}>
                  {beforePhoto ? (
                    <div className="space-y-3">
                      <img 
                        src={beforePhoto} 
                        alt="Before" 
                        className="w-full h-32 object-cover rounded-lg mx-auto"
                      />
                                                      <Button
                                  onClick={() => {
                                    const confirmRemove = confirm('🗑️ Are you sure you want to remove the before photo?');
                                    if (confirmRemove) {
                                      setBeforePhoto(null);
                                      setBeforePhotoFile(null);
                                    }
                                  }}
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Remove
                                </Button>
                    </div>
                  ) : (
                    <>
                      <Camera className={`w-12 h-12 mx-auto mb-3 ${
                        isDarkMode ? "text-gray-400" : "text-gray-400"
                      }`} />
                      <p className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? "text-gray-300" : "text-gray-600"
                      }`}>
                        No before photo uploaded yet
                      </p>
                      <Button
                        onClick={() => handleUploadBeforePhoto(selectedItemForPhotos)}
                        variant="outline"
                        size="sm"
                        className="mt-3"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Before Photo
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* After Photo Section */}
              <div className="space-y-4">
                <h4 className={`text-lg font-semibold transition-colors duration-300 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}>
                  After Photo
                </h4>
                <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-300 ${
                  isDarkMode 
                    ? "border-gray-600 bg-gray-800/50" 
                    : "border-gray-300 bg-gray-50"
                }`}>
                  {afterPhoto ? (
                    <div className="space-y-3">
                      <img 
                        src={afterPhoto} 
                        alt="After" 
                        className="w-full h-32 object-cover rounded-lg mx-auto"
                      />
                                                      <Button
                                  onClick={() => {
                                    const confirmRemove = confirm('🗑️ Are you sure you want to remove the after photo?');
                                    if (confirmRemove) {
                                      setAfterPhoto(null);
                                      setAfterPhotoFile(null);
                                    }
                                  }}
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Remove
                                </Button>
                    </div>
                  ) : (
                    <>
                      <Camera className={`w-12 h-12 mx-auto mb-3 ${
                        isDarkMode ? "text-gray-400" : "text-gray-400"
                      }`} />
                      <p className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? "text-gray-300" : "text-gray-600"
                      }`}>
                        No after photo uploaded yet
                      </p>
                      <Button
                        onClick={() => handleUploadAfterPhoto(selectedItemForPhotos)}
                        variant="outline"
                        size="sm"
                        className="mt-3"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload After Photo
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={handleClosePhotoModal}
                variant="outline"
              >
                Close
              </Button>
              <Button
                onClick={handleSavePhotos}
                variant="default"
                disabled={!beforePhoto && !afterPhoto}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Photos
              </Button>
            </div>

            {/* Hidden file inputs */}
            <input
              type="file"
              ref={beforePhotoInputRef}
              onChange={handleBeforePhotoChange}
              accept="image/*"
              className="hidden"
            />
            <input
              type="file"
              ref={afterPhotoInputRef}
              onChange={handleAfterPhotoChange}
              accept="image/*"
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* View Report Modal - Shows Photos */}
      {showViewReportModal && selectedItemForView && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
          <div
            className={`rounded-xl p-6 w-full max-w-4xl mx-4 shadow-2xl border transition-all duration-300 ${
              isDarkMode 
                ? "bg-gray-900/95 border-gray-700/50" 
                : "bg-white/95 border-gray-200/50"
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3
                  className={`text-2xl font-bold transition-colors duration-300 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Daily Report: {selectedItemForView.municipality}
                </h3>
                <p className={`text-sm transition-colors duration-300 ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}>
                  {selectedItemForView.district} • {new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
              <button
                onClick={() => setShowViewReportModal(false)}
                className={`p-1 rounded-full transition-colors duration-300 ${
                  isDarkMode 
                    ? "text-gray-400 hover:text-gray-300 hover:bg-gray-700/80" 
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/80"
                }`}
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Report Summary */}
            <div className={`p-4 rounded-lg border mb-6 ${
              isDarkMode 
                ? "bg-gray-800/50 border-gray-700" 
                : "bg-gray-50 border-gray-200"
            }`}>
              <h4 className={`font-semibold mb-3 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}>
                Patrol Summary
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Total Patrols:</span>
                  <div className={`font-bold text-lg ${
                    isDarkMode ? "text-blue-400" : "text-blue-600"
                  }`}>
                    {selectedItemForView.totalPatrols}
                  </div>
                </div>
                <div>
                  <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Active Days:</span>
                  <div className={`font-bold text-lg ${
                    isDarkMode ? "text-green-400" : "text-green-600"
                  }`}>
                    {selectedItemForView.activeDays}
                  </div>
                </div>
                <div>
                  <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Inactive Days:</span>
                  <div className={`font-bold text-lg ${
                    isDarkMode ? "text-red-400" : "text-red-600"
                  }`}>
                    {selectedItemForView.inactiveDays}
                  </div>
                </div>
                <div>
                  <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Active %:</span>
                  <div className={`font-bold text-lg ${
                    isDarkMode ? "text-purple-400" : "text-purple-600"
                  }`}>
                    {selectedItemForView.activePercentage}%
                  </div>
                </div>
              </div>
            </div>

            {/* Photos Section */}
            <div className="space-y-6">
              <h4 className={`text-lg font-semibold transition-colors duration-300 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}>
                Daily Photos
              </h4>
              
              {/* Scrollable Photos Container */}
              <div className={`border rounded-lg p-4 max-h-96 overflow-y-auto ${
                isDarkMode 
                  ? "border-gray-700 bg-gray-800/30" 
                  : "border-gray-200 bg-gray-50"
              }`}>
                {/* Sample Photo Entries - Replace with actual data from database */}
                <div className="space-y-6">
                  {/* Generate entries for August 1-31, 2025 */}
                  {Array.from({ length: 31 }, (_, index) => {
                    const day = index + 1;
                    const date = new Date(2025, 7, day); // Month is 0-indexed, so 7 = August
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    const isToday = day === 15; // August 15 as example "today"
                    
                                         // Check if photos are uploaded for this specific date
                     const currentDateString = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                     const photoKey = `${selectedItemForView?.municipality}-${currentDateString}`;
                     const hasPhotos = uploadedPhotos[photoKey]?.beforePhoto || uploadedPhotos[photoKey]?.afterPhoto;

                    return (
                      <div key={day} className={`p-6 rounded-lg border transition-all duration-300 ${
                        isDarkMode 
                          ? "border-gray-600 bg-gray-800/50 hover:bg-gray-800/70" 
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      }`}>
                        <div className="mb-2">
                          <h6 className={`font-medium text-sm transition-colors duration-300 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}>
                            📅 August {day}, 2025
                            {isToday && <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded-full">Today</span>}
                          </h6>
                        </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <span className={`text-xs font-medium transition-colors duration-300 ${
                              isDarkMode ? "text-gray-400" : "text-gray-600"
                            }`}>
                              Before Photo
                            </span>
                                                         <div className={`border rounded-lg p-2 text-center ${
                               isDarkMode 
                                 ? "border-gray-600 bg-gray-700/50" 
                                 : "border-gray-200 bg-gray-100"
                             }`}>
                               {(() => {
                                 // Create date string in YYYY-MM-DD format for the current day
                                 const currentDateString = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                 
                                 // Look for photos with this specific date
                                 const photoKey = `${selectedItemForView?.municipality}-${currentDateString}`;
                                 const photoData = uploadedPhotos[photoKey];
                                 
                                 if (photoData?.beforePhoto) {
                                   return (
                                     <img 
                                       src={photoData.beforePhoto}
                                       alt="Before" 
                                       className="w-full h-40 object-cover rounded"
                                     />
                                   );
                                 } else if (day <= 20) {
                                   return (
                                     <img 
                                       src={`https://via.placeholder.com/300x250/${getRandomColor()}/FFFFFF?text=Before`}
                                       alt="Before" 
                                       className="w-full h-40 object-cover rounded"
                                     />
                                   );
                                 } else {
                                   return (
                                     <div className="flex items-center justify-center h-40">
                                       <Camera className={`w-12 h-12 ${
                                         isDarkMode ? "text-gray-500" : "text-gray-400"
                                       }`} />
                                     </div>
                                   );
                                 }
                               })()}
                             </div>
                           </div>
                           <div className="space-y-1">
                             <span className={`text-xs font-medium transition-colors duration-300 ${
                               isDarkMode ? "text-gray-400" : "text-gray-600"
                             }`}>
                               After Photo
                             </span>
                                                         <div className={`border rounded-lg p-2 text-center ${
                               isDarkMode 
                                 ? "border-gray-600 bg-gray-700/50" 
                                 : "border-gray-200 bg-gray-100"
                             }`}>
                               {(() => {
                                 // Create date string in YYYY-MM-DD format for the current day
                                 const currentDateString = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                 
                                 // Look for photos with this specific date
                                 const photoKey = `${selectedItemForView?.municipality}-${currentDateString}`;
                                 const photoData = uploadedPhotos[photoKey];
                                 
                                 if (photoData?.afterPhoto) {
                                   return (
                                     <img 
                                       src={photoData.afterPhoto}
                                       alt="After" 
                                       className="w-full h-40 object-cover rounded"
                                     />
                                   );
                                 } else if (day <= 15) {
                                   return (
                                     <img 
                                       src={`https://via.placeholder.com/300x250/${getRandomColor()}/FFFFFF?text=After`}
                                       alt="After" 
                                       className="w-full h-40 object-cover rounded"
                                     />
                                   );
                                 } else {
                                   return (
                                     <div className="flex items-center justify-center h-40">
                                       <Camera className={`w-12 h-12 ${
                                         isDarkMode ? "text-gray-500" : "text-gray-400"
                                       }`} />
                                     </div>
                                   );
                                 }
                               })()}
                             </div>
                           </div>
                         </div>

                         {/* Action Taken Section */}
                         {(() => {
                           const currentDateString = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                           const photoKey = `${selectedItemForView?.municipality}-${currentDateString}`;
                           const photoData = uploadedPhotos[photoKey];
                           
                           if (photoData?.actionTaken) {
                             return (
                               <div className="mt-3">
                                 <span className={`text-xs font-medium transition-colors duration-300 ${
                                   isDarkMode ? "text-gray-400" : "text-gray-600"
                                 }`}>
                                   📝 Action Taken:
                                 </span>
                                 <div className={`mt-1 p-2 rounded border text-xs transition-colors duration-300 ${
                                   isDarkMode 
                                     ? "border-gray-600 bg-gray-700/50 text-gray-200" 
                                     : "border-gray-200 bg-gray-100 text-gray-700"
                                 }`}>
                                   {photoData.actionTaken}
                                 </div>
                               </div>
                             );
                           }
                           return null;
                         })()}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={() => setShowViewReportModal(false)}
                variant="outline"
              >
                Close
              </Button>
              <Button
                onClick={() => handleManagePhotosFromView(selectedItemForView)}
                variant="default"
              >
                <Camera className="w-4 h-4 mr-2" />
                Manage Photos
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

import React, { useState, useEffect } from "react";
import Layout from "./Layout";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Badge } from "./components/ui/badge";
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
  writeBatch
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
  FileBarChart
} from "lucide-react";

export default function IPatroller({ onLogout, onNavigate, currentPage }) {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [patrolData, setPatrolData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMunicipality, setEditingMunicipality] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState("ALL");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // Current month (0-indexed)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // Current year
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("daily"); // "daily" or "status"
  const [expandedDistricts, setExpandedDistricts] = useState({
    "1ST DISTRICT": true,
    "2ND DISTRICT": true,
    "3RD DISTRICT": true
  });
  const [firestoreStatus, setFirestoreStatus] = useState('connecting');
  const [availableMonths, setAvailableMonths] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [clearLoading, setClearLoading] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showSummaryReport, setShowSummaryReport] = useState(false);

  // Generate dates for selected month and year
  const generateDates = (month, year) => {
    const dates = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const currentDate = new Date();
    const isCurrentMonth = month === currentDate.getMonth() && year === currentDate.getFullYear();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isCurrentDay = isCurrentMonth && day === currentDate.getDate();
      dates.push({
        date: date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: day,
        fullDate: date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        }),
        isCurrentDay: isCurrentDay
      });
    }
    return dates;
  };

  const selectedDates = generateDates(selectedMonth, selectedYear);

  // Municipalities by district
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

  // Initialize patrol data
  useEffect(() => {
    loadPatrolData();
    loadAvailableMonths();
  }, [selectedMonth, selectedYear]);

  // Load available months from Firestore
  const loadAvailableMonths = async () => {
    try {
      const patrolDataRef = collection(db, 'patrolData');
      const querySnapshot = await getDocs(patrolDataRef);
      const months = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        months.push({
          id: doc.id,
          year: data.year,
          month: data.month,
          monthName: data.monthName
        });
      });
      
      setAvailableMonths(months);
    } catch (error) {
      console.error('❌ Error loading available months:', error);
    }
  };

  // Firestore functions
  const savePatrolData = async (data) => {
    try {
      setLoading(true);
      setFirestoreStatus('saving');
      const batch = writeBatch(db);
      
      // Create month-year document ID (e.g., "03-2025")
      const monthYearId = `${String(selectedMonth + 1).padStart(2, '0')}-${selectedYear}`;
      
      // Create the month-year document if it doesn't exist
      const monthYearDocRef = doc(db, 'patrolData', monthYearId);
      batch.set(monthYearDocRef, {
        year: selectedYear,
        month: selectedMonth,
        monthName: new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'long' }),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      data.forEach(item => {
        // Save each municipality data as a document in the month-year collection
        const docRef = doc(db, 'patrolData', monthYearId, 'municipalities', item.id);
        batch.set(docRef, {
          ...item,
          year: selectedYear,
          month: selectedMonth,
          updatedAt: new Date().toISOString()
          });
        });
        
      await batch.commit();
      setFirestoreStatus('connected');
      console.log('✅ Patrol data saved to Firestore');
    } catch (error) {
      console.error('❌ Error saving patrol data:', error);
      setFirestoreStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const loadPatrolData = async () => {
    try {
      setLoading(true);
      setFirestoreStatus('connecting');
      
      // Create month-year document ID (e.g., "03-2025")
      const monthYearId = `${String(selectedMonth + 1).padStart(2, '0')}-${selectedYear}`;
      
      // Try to load existing data from Firestore
      const municipalitiesRef = collection(db, 'patrolData', monthYearId, 'municipalities');
      const querySnapshot = await getDocs(municipalitiesRef);
      const existingData = [];
      
      querySnapshot.forEach((doc) => {
        existingData.push(doc.data());
      });
      
      if (existingData.length > 0) {
        // Use existing data from Firestore
        setPatrolData(existingData);
        setFirestoreStatus('connected');
        console.log('✅ Loaded existing patrol data from Firestore');
      } else {
        // Initialize with empty data
        initializePatrolData();
        setFirestoreStatus('connected');
        console.log('📝 No existing data found, initialized with empty data');
      }
    } catch (error) {
      console.error('❌ Error loading patrol data:', error);
      setFirestoreStatus('error');
      // Fallback to local initialization
      initializePatrolData();
    } finally {
      setLoading(false);
    }
  };

  const initializePatrolData = () => {
    const initialData = [];
    
    Object.entries(municipalitiesByDistrict).forEach(([district, municipalities]) => {
          municipalities.forEach(municipality => {
        const dailyData = selectedDates.map(() => null); // Initialize with null (no entry)
        initialData.push({
          id: `${district}-${municipality}`,
          municipality,
          district,
          data: dailyData,
          totalPatrols: 0,
          activeDays: 0,
          inactiveDays: 0,
          activePercentage: 0
        });
          });
        });
        
    setPatrolData(initialData);
  };

  const handleAddPatrolData = async (municipality, district, dayIndex, value) => {
    const updatedData = patrolData.map(item => {
      if (item.municipality === municipality && item.district === district) {
        const newData = [...item.data];
        newData[dayIndex] = parseInt(value) || 0;
        const totalPatrols = newData.reduce((sum, val) => sum + (val || 0), 0);
        const activeDays = newData.filter(val => val > 0).length;
        const inactiveDays = newData.filter(val => val === 0).length;
        const activePercentage = Math.round((activeDays / newData.length) * 100);
        
        return {
          ...item,
          data: newData,
          totalPatrols,
          activeDays,
          inactiveDays,
          activePercentage
        };
      }
      return item;
    });
    
    setPatrolData(updatedData);
    
    // Save to Firestore
    try {
      await savePatrolData(updatedData);
    } catch (error) {
      console.error('❌ Error saving data:', error);
    }
  };

  const toggleDistrictExpansion = (district) => {
    setExpandedDistricts(prev => ({
      ...prev,
      [district]: !prev[district]
    }));
  };

  const getStatusColor = (value) => {
    if (value === null || value === undefined) return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    if (value === 0) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    if (value >= 5) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
  };

  const getStatusText = (value) => {
    if (value === null || value === undefined) return "No Entry";
    if (value === 0) return "Inactive";
    if (value >= 5) return "Active";
    return "Low";
  };

  const filteredData = patrolData.filter(item => {
    const matchesDistrict = selectedDistrict === "ALL" || item.district === selectedDistrict;
    const matchesSearch = item.municipality.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDistrict && matchesSearch;
  }).sort((a, b) => {
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

  const getDistrictSummary = (district) => {
    const districtData = patrolData.filter(item => item.district === district);
    const totalPatrols = districtData.reduce((sum, item) => sum + item.totalPatrols, 0);
    const totalActive = districtData.reduce((sum, item) => sum + item.activeDays, 0);
    const totalInactive = districtData.reduce((sum, item) => sum + item.inactiveDays, 0);
    const avgActivePercentage = districtData.length > 0 
      ? Math.round(districtData.reduce((sum, item) => sum + item.activePercentage, 0) / districtData.length)
      : 0;
    
    return {
      totalPatrols,
      totalActive,
      totalInactive,
      avgActivePercentage,
      municipalityCount: districtData.length
    };
  };

  const overallSummary = {
    totalPatrols: patrolData.reduce((sum, item) => sum + item.totalPatrols, 0),
    totalActive: patrolData.reduce((sum, item) => sum + item.activeDays, 0),
    totalInactive: patrolData.reduce((sum, item) => sum + item.inactiveDays, 0),
    avgActivePercentage: patrolData.length > 0 
      ? Math.round(patrolData.reduce((sum, item) => sum + item.activePercentage, 0) / patrolData.length)
      : 0,
    municipalityCount: patrolData.length
  };

  // Excel import functions
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file extension and type
    const fileName = file.name.toLowerCase();
    const isCSV = fileName.endsWith('.csv') || file.type === 'text/csv';
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || 
                   file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                   file.type === 'application/vnd.ms-excel';

    if (!isCSV && !isExcel) {
      setImportError('Please select a valid Excel (.xlsx, .xls) or CSV (.csv) file.');
      return;
    }

    setImportLoading(true);
    setImportError('');
    setImportSuccess('');

    if (isCSV) {
      // Handle CSV files
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target.result;
          await processExcelData(data, file.name);
        } catch (error) {
          console.error('Error reading CSV file:', error);
          setImportError('Error reading CSV file. Please check the file format.');
          setImportLoading(false);
        }
      };
      reader.readAsText(file, 'UTF-8');
    } else {
      // Handle Excel files
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target.result;
          await processMultiSheetExcel(data, file.name);
        } catch (error) {
          console.error('Error reading Excel file:', error);
          setImportError('Error reading Excel file. Please check the file format.');
          setImportLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const processExcelData = async (data, fileName) => {
    try {
      // Normalize line endings and split
      const normalizedData = data.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      const lines = normalizedData.split('\n').filter(line => line.trim() !== '');
      
      console.log('Processing file with', lines.length, 'lines');
      
      // Find all month sections in the file
      const monthSections = [];
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('===')) {
          // Check if this line contains a month name
          for (const monthName of monthNames) {
            if (line.includes(monthName) && line.includes(selectedYear.toString())) {
              // Find the end of this month section
              let monthEndIndex = lines.length;
              for (let j = i + 1; j < lines.length; j++) {
                const nextLine = lines[j].trim();
                if (nextLine.startsWith('===')) {
                  monthEndIndex = j;
                  break;
                }
              }
              
              monthSections.push({
                month: monthName,
                startIndex: i + 1, // Skip the header line
                endIndex: monthEndIndex,
                lines: lines.slice(i + 1, monthEndIndex)
              });
              
              console.log(`Found section for ${monthName} ${selectedYear}`);
              break;
            }
          }
        }
      }
      
      if (monthSections.length === 0) {
        console.log('Available lines:', lines.slice(0, 10)); // Debug first 10 lines
        setImportError(`No month sections found for ${selectedYear}. Please check your template format. Make sure your file has sections like "=== March 2025 ==="`);
        setImportLoading(false);
        return;
      }
      
      console.log(`Found ${monthSections.length} month sections: ${monthSections.map(s => s.month).join(', ')}`);
      
      // Show which months were found
      const foundMonths = monthSections.map(s => s.month).join(', ');
      setImportSuccess(`Found months in Excel: ${foundMonths}`);
      
      // Process each month section and save to Firestore
      for (const section of monthSections) {
        const monthIndex = monthNames.indexOf(section.month);
        if (monthIndex === -1) continue;
        
        // Generate dates for this month
        const monthDates = generateDates(monthIndex, selectedYear);
        const headers = parseCSVLine(section.lines[0]);
        
        // Find municipality and district columns
        const municipalityIndex = headers.findIndex(h => 
          h.toLowerCase().includes('municipality') || h.toLowerCase().includes('city')
        );
        const districtIndex = headers.findIndex(h => 
          h.toLowerCase().includes('district')
        );

        if (municipalityIndex === -1) {
          console.warn(`Municipality column not found in ${section.month} section`);
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
          const district = values[districtIndex] || 'Unknown District';

          if (!municipality) continue;

          // Check if municipality exists in our system
          let foundMunicipality = null;
          for (const [distKey, municipalities] of Object.entries(municipalitiesByDistrict)) {
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
          for (let j = Math.max(municipalityIndex, districtIndex) + 1; j < values.length && dayIndex < monthDates.length; j++) {
            const value = parseInt(values[j]) || 0;
            dailyData[dayIndex] = value;
            dayIndex++;
          }

          // Calculate summary
          const totalPatrols = dailyData.reduce((sum, val) => sum + (val || 0), 0);
          const activeDays = dailyData.filter(val => val > 0).length;
          const inactiveDays = dailyData.filter(val => val === 0).length;
          const activePercentage = Math.round((activeDays / dailyData.length) * 100);

          importedData.push({
            id: `${foundMunicipality.district}-${foundMunicipality.municipality}`,
            municipality: foundMunicipality.municipality,
            district: foundMunicipality.district,
            data: dailyData,
            totalPatrols,
            activeDays,
            inactiveDays,
            activePercentage
          });
        }

        if (importedData.length > 0) {
          // Save this month's data to Firestore
          const monthYearId = `${String(monthIndex + 1).padStart(2, '0')}-${selectedYear}`;
          
          try {
            const batch = writeBatch(db);
            
            // Create the month-year document
            const monthYearDocRef = doc(db, 'patrolData', monthYearId);
            batch.set(monthYearDocRef, {
              year: selectedYear,
              month: monthIndex,
              monthName: section.month,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            
            // Save municipality data
            importedData.forEach(item => {
              const docRef = doc(db, 'patrolData', monthYearId, 'municipalities', item.id);
              batch.set(docRef, {
                ...item,
                year: selectedYear,
                month: monthIndex,
                updatedAt: new Date().toISOString()
              });
            });
            
            await batch.commit();
            console.log(`✅ Saved data for ${section.month} ${selectedYear} to Firestore`);
          } catch (error) {
            console.error(`❌ Error saving ${section.month} data:`, error);
          }
        }
      }
      
      // If current month was imported, update the UI
      const currentMonthName = new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'long' });
      const currentMonthSection = monthSections.find(s => s.month === currentMonthName);
      
      if (currentMonthSection) {
        // Reload current month data to update UI
        await loadPatrolData();
      } else {
        // If current month wasn't in the import, still reload to show current state
        await loadPatrolData();
      }
      
      console.log(`✅ Imported data for ${monthSections.length} months`);
      
      // Show final success message
      const importedMonths = monthSections.map(s => s.month).join(', ');
      setImportSuccess(`✅ Successfully imported data for: ${importedMonths}`);
      setImportLoading(false);
      
    } catch (error) {
      console.error('Error processing Excel data:', error);
      setImportError('Error processing file. Please check the format.');
      setImportLoading(false);
    }
  };

  const downloadTemplate = () => {
    // Create template for all months (January to December)
    const months = [
      { name: 'January', monthIndex: 0 },
      { name: 'February', monthIndex: 1 },
      { name: 'March', monthIndex: 2 },
      { name: 'April', monthIndex: 3 },
      { name: 'May', monthIndex: 4 },
      { name: 'June', monthIndex: 5 },
      { name: 'July', monthIndex: 6 },
      { name: 'August', monthIndex: 7 },
      { name: 'September', monthIndex: 8 },
      { name: 'October', monthIndex: 9 },
      { name: 'November', monthIndex: 10 },
      { name: 'December', monthIndex: 11 }
    ];

    let fullTemplate = '';
    
    months.forEach((month, monthIndex) => {
      // Generate dates for this month
      const monthDates = generateDates(month.monthIndex, selectedYear);
      const headers = ['Municipality', 'District', ...monthDates.map(date => `${date.dayName} ${date.dayNumber}`)];
      
      fullTemplate += `=== ${month.name} ${selectedYear} ===\n`;
      fullTemplate += headers.join(',') + '\n';
      
      // Add sample rows for each municipality
      Object.entries(municipalitiesByDistrict).forEach(([district, municipalities]) => {
        municipalities.forEach(municipality => {
          const row = [municipality, district, ...monthDates.map(() => '0')];
          fullTemplate += row.join(',') + '\n';
        });
      });
      
      fullTemplate += '\n'; // Add separator between months
    });

    const blob = new Blob([fullTemplate], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patrol-template-full-year-${selectedYear}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  const clearPatrolData = async (clearAll = false) => {
    const currentMonthName = new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    if (clearAll) {
      if (!window.confirm(`Are you sure you want to clear ALL patrol data for ${selectedYear}? This will delete data for all months (March to July) and cannot be undone.`)) {
        return;
      }
    } else {
      if (!window.confirm(`Are you sure you want to clear all patrol data for ${currentMonthName}? This action cannot be undone.`)) {
        return;
      }
    }

    try {
      setClearLoading(true);
      setFirestoreStatus('saving');
      
      if (clearAll) {
        // Clear all months (January to December)
        const months = [
          { name: 'January', monthIndex: 0 },
          { name: 'February', monthIndex: 1 },
          { name: 'March', monthIndex: 2 },
          { name: 'April', monthIndex: 3 },
          { name: 'May', monthIndex: 4 },
          { name: 'June', monthIndex: 5 },
          { name: 'July', monthIndex: 6 },
          { name: 'August', monthIndex: 7 },
          { name: 'September', monthIndex: 8 },
          { name: 'October', monthIndex: 9 },
          { name: 'November', monthIndex: 10 },
          { name: 'December', monthIndex: 11 }
        ];
        
        const batch = writeBatch(db);
        let clearedMonths = 0;
        
        for (const month of months) {
          const monthYearId = `${String(month.monthIndex + 1).padStart(2, '0')}-${selectedYear}`;
          
          try {
            // Delete all municipality documents in the subcollection
            const municipalitiesRef = collection(db, 'patrolData', monthYearId, 'municipalities');
            const querySnapshot = await getDocs(municipalitiesRef);
            
            querySnapshot.forEach((doc) => {
              batch.delete(doc.ref);
            });
            
            // Delete the month-year document itself
            const monthYearDocRef = doc(db, 'patrolData', monthYearId);
            batch.delete(monthYearDocRef);
            
            clearedMonths++;
          } catch (error) {
            console.warn(`Could not clear ${month.name} data:`, error);
          }
        }
        
        await batch.commit();
        
        // Reinitialize with empty data
        initializePatrolData();
        setFirestoreStatus('connected');
        setImportSuccess(`✅ Cleared patrol data for ${clearedMonths} months in ${selectedYear}`);
        
        console.log(`✅ Cleared patrol data for ${clearedMonths} months`);
      } else {
        // Clear only current month
        const monthYearId = `${String(selectedMonth + 1).padStart(2, '0')}-${selectedYear}`;
        
        // Delete the month-year document and all its subcollections
        const batch = writeBatch(db);
        
        // Delete all municipality documents in the subcollection
        const municipalitiesRef = collection(db, 'patrolData', monthYearId, 'municipalities');
        const querySnapshot = await getDocs(municipalitiesRef);
        
        querySnapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });
        
        // Delete the month-year document itself
        const monthYearDocRef = doc(db, 'patrolData', monthYearId);
        batch.delete(monthYearDocRef);
        
        await batch.commit();
        
        // Reinitialize with empty data
        initializePatrolData();
        setFirestoreStatus('connected');
        setImportSuccess(`✅ Cleared all patrol data for ${currentMonthName}`);
        
        console.log(`✅ Cleared patrol data for ${monthYearId}`);
      }
    } catch (error) {
      console.error('❌ Error clearing patrol data:', error);
      setImportError('Error clearing patrol data. Please try again.');
      setFirestoreStatus('error');
    } finally {
      setClearLoading(false);
      setShowClearModal(false);
    }
  };

  const processMultiSheetExcel = async (data, fileName) => {
    try {
      console.log('Processing Excel file...');
      
      // Convert ArrayBuffer to text to process as CSV
      const decoder = new TextDecoder('utf-8');
      const textData = decoder.decode(data);
      
      // Process the data using the template format
      await processExcelData(textData, fileName);
      
    } catch (error) {
      console.error('Error processing Excel file:', error);
      setImportError('Error processing Excel file.');
      setImportLoading(false);
    }
  };

  return (
      <Layout onLogout={onLogout} onNavigate={onNavigate} currentPage={currentPage}>
      <section className={`flex-1 p-6 space-y-6 transition-all duration-300 ${
        isDarkMode ? 'bg-gray-900/50' : 'bg-white/50'
      }`}>
        {/* Header */}
            <div>
          <div className="flex items-center justify-between mb-2">
            <h1 className={`text-3xl font-bold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
              I-Patroller Management
              </h1>
                          <div className="flex items-center gap-3">
                <Button
                  onClick={async () => await savePatrolData(patrolData)}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  variant="outline"
                  onClick={loadPatrolData}
                  disabled={loading}
                  className={`transition-colors duration-300 ${
                    isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {loading ? 'Loading...' : 'Refresh'}
                </Button>
                                  <Button
                    variant="outline"
                    onClick={() => setShowClearModal(true)}
                    disabled={clearLoading}
                    className={`transition-colors duration-300 ${
                      isDarkMode ? 'border-red-600 text-red-300 hover:bg-red-800' : 'border-red-300 text-red-700 hover:bg-red-50'
                    }`}
                  >
                    <Trash className="w-4 h-4 mr-2" />
                    {clearLoading ? 'Clearing...' : 'Clear Data'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowSummaryReport(true)}
                    className={`transition-colors duration-300 ${
                      isDarkMode ? 'border-purple-600 text-purple-300 hover:bg-purple-800' : 'border-purple-300 text-purple-700 hover:bg-purple-50'
                    }`}
                    title="Summary Report"
                  >
                    <FileBarChart className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="excel-import"
                    disabled={importLoading}
                  />
                  <label
                    htmlFor="excel-import"
                    className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${
                      importLoading
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    {importLoading ? 'Importing...' : 'Import Excel'}
                  </label>
                  <Button
                    variant="outline"
                    onClick={downloadTemplate}
                    className={`transition-colors duration-300 ${
                      isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Template
                  </Button>
                </div>
              </div>
          </div>
          <div className="flex items-center justify-between">
            <p className={`text-lg transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
              Manage patrol data for {new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} - Track daily patrol activities across all municipalities
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
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
                        <div className="flex items-center gap-2">
            <span className={`text-sm font-medium transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Current: {String(selectedMonth + 1).padStart(2, '0')}-{selectedYear}
            </span>
            {selectedMonth === new Date().getMonth() && selectedYear === new Date().getFullYear() && (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
                Current Month
              </Badge>
            )}
            {availableMonths.length > 0 && (
              <span className={`text-xs transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                ({availableMonths.length} months available)
              </span>
            )}
          </div>
            </div>
                    </div>
        </div>

        {/* Import Messages */}
        {importError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
            <strong className="font-bold">Import Error: </strong>
            <span className="block sm:inline">{importError}</span>
            <button
              onClick={() => setImportError('')}
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
            >
              <span className="sr-only">Dismiss</span>
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        )}
        
        {importSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative dark:bg-green-900/30 dark:border-green-800 dark:text-green-400">
            <strong className="font-bold">Import Success: </strong>
            <span className="block sm:inline">{importSuccess}</span>
            <button
              onClick={() => setImportSuccess('')}
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
            >
              <span className="sr-only">Dismiss</span>
              <CheckCircle className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className={`text-sm font-medium transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Month:
            </label>
              <select
                value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className={`px-3 py-2 border rounded-md text-sm transition-colors duration-300 ${
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
          
          <Button
            variant="outline"
            onClick={() => {
              setSelectedMonth(new Date().getMonth());
              setSelectedYear(new Date().getFullYear());
            }}
            className={`transition-colors duration-300 ${
              isDarkMode ? 'border-blue-600 text-blue-300 hover:bg-blue-800' : 'border-blue-300 text-blue-700 hover:bg-blue-50'
            }`}
            title="Go to current month"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Current Month
          </Button>

          <div className="flex items-center gap-2">
            <label className={`text-sm font-medium transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Year:
            </label>
              <select
                value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className={`px-3 py-2 border rounded-md text-sm transition-colors duration-300 ${
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

          <div className="flex items-center gap-2">
            <label className={`text-sm font-medium transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              District:
            </label>
              <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className={`px-3 py-2 border rounded-md text-sm transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
            >
              <option value="ALL">All Districts</option>
              <option value="1ST DISTRICT">1ST DISTRICT</option>
              <option value="2ND DISTRICT">2ND DISTRICT</option>
              <option value="3RD DISTRICT">3RD DISTRICT</option>
              </select>
          </div>
          
          <div className="flex items-center gap-2">
            <Search className={`w-4 h-4 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <Input
              placeholder="Search municipalities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-64 transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
            />
          </div>
            </div>
            
        {/* Overall Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className={`transition-all duration-300 ${
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

          <Card className={`transition-all duration-300 ${
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

          <Card className={`transition-all duration-300 ${
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

          <Card className={`transition-all duration-300 ${
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
                  <Building2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
              </div>
            </CardContent>
          </Card>
          </div>

        {/* Patrol Data Table with Tabs */}
        <Card className={`transition-all duration-300 ${
          isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'
        }`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className={`text-xl font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Patrol Data
              </CardTitle>
              
              {/* Tab Navigation */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab("daily")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                    activeTab === "daily"
                      ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  Daily Counts
                </button>
                <button
                  onClick={() => setActiveTab("status")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                    activeTab === "status"
                      ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  Status
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className={`border-b transition-colors duration-300 ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`}>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>Municipality</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>District</th>
                    {activeTab === "daily" ? (
                      // Daily Counts Tab - Show all dates with input fields
                      selectedDates.map((date, index) => (
                        <th key={index} className={`px-2 py-3 text-center text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                          date.isCurrentDay 
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' 
                            : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          <div className="flex flex-col items-center">
                            <span className="text-xs">{date.dayName}</span>
                            <span className={`text-xs ${date.isCurrentDay ? 'font-bold' : ''}`}>{date.dayNumber}</span>
                            {date.isCurrentDay && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                            )}
                      </div>
                    </th>
                      ))
                    ) : (
                      // Status Tab - Show only summary columns
                      <>
                        <th className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>Total</th>
                        <th className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>Active</th>
                        <th className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>Inactive</th>
                        <th className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>% Active</th>
                      </>
                    )}
                </tr>
              </thead>
              <tbody>
                  {Object.entries(municipalitiesByDistrict).map(([district, municipalities]) => {
                    const districtSummary = getDistrictSummary(district);
                    const districtData = filteredData.filter(item => item.district === district);
                    
                    return (
                  <React.Fragment key={district}>
                    {/* District Header */}
                        <tr className={`border-b transition-colors duration-300 ${
                          isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                    }`}>
                          <td colSpan={activeTab === "daily" ? selectedDates.length + 2 : 6} className="px-4 py-3">
                            <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                                <button
                                  onClick={() => toggleDistrictExpansion(district)}
                                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                                >
                                  {expandedDistricts[district] ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </button>
                                <h3 className={`font-semibold text-lg transition-colors duration-300 ${
                                  isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                          {district}
                                </h3>
                                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                  {districtData.length} municipalities
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm">
                                <span className={`transition-colors duration-300 ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                }`}>
                                  Total: {districtSummary.totalPatrols.toLocaleString()}
                                </span>
                                <span className={`transition-colors duration-300 ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                }`}>
                                  Active: {districtSummary.totalActive}
                                </span>
                                <span className={`transition-colors duration-300 ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                }`}>
                                  Inactive: {districtSummary.totalInactive}
                                </span>
                                <span className={`transition-colors duration-300 ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                }`}>
                                  Avg: {districtSummary.avgActivePercentage}%
                                </span>
                              </div>
                        </div>
                      </td>
                    </tr>
                    
                                            {/* Municipality Rows */}
                        {expandedDistricts[district] && districtData
                          .filter(item => item.district === district)
                          .sort((a, b) => {
                            // Sort municipalities by their defined order in municipalitiesByDistrict
                            const municipalitiesInDistrict = municipalitiesByDistrict[district];
                            const municipalityA = municipalitiesInDistrict.indexOf(a.municipality);
                            const municipalityB = municipalitiesInDistrict.indexOf(b.municipality);
                            return municipalityA - municipalityB;
                          })
                          .map((item) => (
                          <tr key={item.id} className={`border-b transition-colors duration-300 ${
                            isDarkMode ? 'border-gray-700 hover:bg-gray-800/50' : 'border-gray-200 hover:bg-gray-50'
                          }`}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <MapPin className={`w-4 h-4 transition-colors duration-300 ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`} />
                                <span className={`font-medium transition-colors duration-300 ${
                                  isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {item.municipality}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={`transition-colors duration-300 ${
                                isDarkMode ? 'bg-gray-800/50 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-800 border-gray-200'
                              }`}>
                                {item.district}
                              </Badge>
                            </td>
                            
                            {activeTab === "daily" ? (
                              // Daily Counts Tab - Show input fields for each day
                              item.data.map((value, dayIndex) => {
                                const isCurrentDay = selectedDates[dayIndex]?.isCurrentDay;
                                return (
                                  <td key={dayIndex} className={`px-2 py-3 text-center ${isCurrentDay ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                                    <div className="space-y-1">
                                      <Input
                                        type="number"
                                        min="0"
                                        max="20"
                                        value={value || ''}
                                        onChange={(e) => handleAddPatrolData(item.municipality, item.district, dayIndex, e.target.value)}
                                        className={`w-16 h-8 text-center text-xs transition-colors duration-300 ${
                                          isCurrentDay 
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400' 
                                            : isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                                        }`}
                                        placeholder="0"
                                      />
                                      <Badge className={`text-xs ${getStatusColor(value)}`}>
                                        {getStatusText(value)}
                                      </Badge>
                                    </div>
                                  </td>
                                );
                              })
                            ) : (
                              // Status Tab - Show only summary data
                              <>
                                <td className="px-4 py-3 text-center">
                                  <span className={`font-bold transition-colors duration-300 ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                  }`}>
                                    {item.totalPatrols}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                    {item.activeDays}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                    {item.inactiveDays}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <Badge className={`${
                                    item.activePercentage >= 70 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                    item.activePercentage >= 50 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                  }`}>
                                    {item.activePercentage}%
                                  </Badge>
                            </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </React.Fragment>
                        );
                      })}
              </tbody>
            </table>
          </div>
          </CardContent>
        </Card>
      </section>

      {/* Clear Data Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-xl p-6 w-96 max-w-md mx-4 shadow-2xl border transition-all duration-300 ${
            isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Clear Patrol Data
              </h3>
              <button
                onClick={() => setShowClearModal(false)}
                className={`p-1 rounded-full hover:bg-gray-100/80 dark:hover:bg-gray-700/80 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <p className={`text-sm mb-6 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Choose what you want to clear:
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => clearPatrolData(false)}
                disabled={clearLoading}
                className={`w-full p-4 rounded-lg border-2 transition-all duration-300 ${
                  isDarkMode 
                    ? 'border-orange-500/50 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500' 
                    : 'border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400'
                } ${clearLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-md'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <div className="font-semibold">Current Month Only</div>
                    <div className="text-xs opacity-75">
                      Clear data for {new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
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
                    ? 'border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500' 
                    : 'border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400'
                } ${clearLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-md'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <div className="font-semibold">All Months</div>
                    <div className="text-xs opacity-75">
                      Clear data for all months (January to December {selectedYear})
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
                    ? 'bg-gray-700/80 text-gray-300 hover:bg-gray-600/80' 
                    : 'bg-gray-200/80 text-gray-700 hover:bg-gray-300/80'
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-xl p-6 w-[800px] max-w-[90vw] mx-4 shadow-2xl border transition-all duration-300 ${
            isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Summary Report - {new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <button
                onClick={() => setShowSummaryReport(false)}
                className={`p-1 rounded-full hover:bg-gray-100/80 dark:hover:bg-gray-700/80 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Overall Summary */}
              <div className={`p-4 rounded-lg border ${
                isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
                <h4 className={`font-semibold mb-3 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Overall Summary
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`p-3 rounded-lg ${
                    isDarkMode ? 'bg-blue-900/30 border border-blue-800' : 'bg-blue-50 border border-blue-200'
                  }`}>
                    <div className="text-sm text-blue-600 dark:text-blue-400">Total Patrols</div>
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{overallSummary.totalPatrols.toLocaleString()}</div>
                  </div>
                  <div className={`p-3 rounded-lg ${
                    isDarkMode ? 'bg-green-900/30 border border-green-800' : 'bg-green-50 border border-green-200'
                  }`}>
                    <div className="text-sm text-green-600 dark:text-green-400">Active Days</div>
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">{overallSummary.totalActive.toLocaleString()}</div>
                  </div>
                  <div className={`p-3 rounded-lg ${
                    isDarkMode ? 'bg-red-900/30 border border-red-800' : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="text-sm text-red-600 dark:text-red-400">Inactive Days</div>
                    <div className="text-2xl font-bold text-red-700 dark:text-red-300">{overallSummary.totalInactive.toLocaleString()}</div>
                  </div>
                  <div className={`p-3 rounded-lg ${
                    isDarkMode ? 'bg-purple-900/30 border border-purple-800' : 'bg-purple-50 border border-purple-200'
                  }`}>
                    <div className="text-sm text-purple-600 dark:text-purple-400">Avg Active %</div>
                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{overallSummary.avgActivePercentage}%</div>
                  </div>
                </div>
              </div>

              {/* District Summary */}
              <div className={`p-4 rounded-lg border ${
                isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
                <h4 className={`font-semibold mb-3 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  District Summary
                </h4>
                <div className="space-y-3">
                  {Object.keys(municipalitiesByDistrict).map(district => {
                    const summary = getDistrictSummary(district);
                    return (
                      <div key={district} className={`p-3 rounded-lg border ${
                        isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-white border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className={`font-semibold ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>{district}</div>
                            <div className={`text-sm ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>{summary.municipalityCount} municipalities</div>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className={`${
                              isDarkMode ? 'text-blue-400' : 'text-blue-600'
                            }`}>Total: {summary.totalPatrols}</span>
                            <span className={`${
                              isDarkMode ? 'text-green-400' : 'text-green-600'
                            }`}>Active: {summary.totalActive}</span>
                            <span className={`${
                              isDarkMode ? 'text-red-400' : 'text-red-600'
                            }`}>Inactive: {summary.totalInactive}</span>
                            <span className={`${
                              isDarkMode ? 'text-purple-400' : 'text-purple-600'
                            }`}>Avg: {summary.avgActivePercentage}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Performers */}
              <div className={`p-4 rounded-lg border ${
                isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
                <h4 className={`font-semibold mb-3 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Top Performers
                </h4>
                <div className="space-y-2">
                  {patrolData
                    .filter(item => item.totalPatrols > 0)
                    .sort((a, b) => b.totalPatrols - a.totalPatrols)
                    .slice(0, 5)
                    .map((item, index) => (
                      <div key={item.id} className={`p-2 rounded-lg ${
                        isDarkMode ? 'bg-gray-700/50' : 'bg-white'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>#{index + 1}</span>
                            <span className={`font-medium ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>{item.municipality}</span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                            }`}>{item.district}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <span className={`${
                              isDarkMode ? 'text-blue-400' : 'text-blue-600'
                            }`}>{item.totalPatrols} patrols</span>
                            <span className={`${
                              isDarkMode ? 'text-green-400' : 'text-green-600'
                            }`}>{item.activePercentage}% active</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowSummaryReport(false)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-700/80 text-gray-300 hover:bg-gray-600/80' 
                    : 'bg-gray-200/80 text-gray-700 hover:bg-gray-300/80'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
} 
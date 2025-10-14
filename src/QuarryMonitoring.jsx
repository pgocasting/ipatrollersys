import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { quarryLog, createSectionGroup, CONSOLE_GROUPS } from './utils/consoleGrouping';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './components/ui/dropdown-menu';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from './components/ui/select';
import { 
  Truck, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Plus,
  Minus,
  BarChart3,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Mountain,
  Activity,
  Menu,
  RefreshCw,
  FileText,
  Shield,
  CheckCircle,
  AlertCircle,
  Clock,
  MapPin,
  Building,
  X,
  Filter,
  Download,
  Printer
} from 'lucide-react';

export default function QuarryMonitoring({ onLogout, onNavigate, currentPage }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [truckData, setTruckData] = useState({});
  const [currentSite, setCurrentSite] = useState('Abucay');
  const [selectedProponent, setSelectedProponent] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPermitsModal, setShowPermitsModal] = useState(false);
  const [showAddPermitModal, setShowAddPermitModal] = useState(false);
  const [newPermit, setNewPermit] = useState({
    id: '',
    siteName: '',
    operator: '',
    location: '',
    permitType: 'Quarry Permit',
    issueDate: '',
    expiryDate: '',
    status: 'Active',
    area: ''
  });

  // Municipalities organized by district (correct Bataan districts)
  const districtData = {
    '1st District': ['Abucay', 'Hermosa', 'Orani', 'Samal'],
    '2nd District': ['Balanga City', 'Limay', 'Orion', 'Pilar'],
    '3rd District': ['Bagac', 'Dinalupihan', 'Mariveles', 'Morong']
  };

  // Flatten for backward compatibility
  const quarrySites = [
    ...districtData['1st District'],
    ...districtData['2nd District'],
    ...districtData['3rd District']
  ];

  // Approved quarry permits data from Province of Bataan
  const approvedPermits = [
    {
      id: 'QP-B-022-001-a',
      siteName: 'Cosmos Exploration Corporation',
      operator: 'Cosmos Exploration Corporation',
      location: 'Cabcaben, Mariveles',
      permitType: 'Quarry Permit',
      issueDate: '2022-11-04',
      expiryDate: '2027-11-04',
      status: 'Active',
      area: '4.85 hectares'
    },
    {
      id: 'QP-B-023-001',
      siteName: 'Leonardo B. David III',
      operator: 'Leonardo B. David III',
      location: 'Dangcol, Balanga City',
      permitType: 'Quarry Permit',
      issueDate: '2023-12-22',
      expiryDate: '2028-12-21',
      status: 'Active',
      area: '5.00 hectares'
    },
    {
      id: 'ISGP-B-23-001',
      siteName: 'Saint Catherine Trading and Construction',
      operator: 'Saint Catherine Trading and Construction',
      location: 'Alas-asin, Mariveles',
      permitType: 'Industrial Sand and Gravel Permit',
      issueDate: '2023-12-29',
      expiryDate: '2028-12-28',
      status: 'Active',
      area: '4.79 hectares'
    },
    {
      id: 'QP-B-24-001',
      siteName: 'Alyn P. Triguero',
      operator: 'Alyn P. Triguero',
      location: 'Puting Buhangin, Orion',
      permitType: 'Quarry Permit',
      issueDate: '2024-08-07',
      expiryDate: '2029-08-07',
      status: 'Active',
      area: '2.66 hectares'
    },
    {
      id: 'QP-B-021-001-a',
      siteName: 'Oscar M. Tranate Jr.',
      operator: 'Oscar M. Tranate Jr.',
      location: 'Parang, Bagac',
      permitType: 'Quarry Permit',
      issueDate: '2024-08-07',
      expiryDate: '2029-08-07',
      status: 'Active',
      area: '4.93 hectares'
    },
    {
      id: 'QP-B-021-002-a',
      siteName: 'Rowena B. Tranate',
      operator: 'Rowena B. Tranate',
      location: 'Parang, Bagac',
      permitType: 'Quarry Permit',
      issueDate: '2024-08-07',
      expiryDate: '2029-08-07',
      status: 'Active',
      area: '4.93 hectares'
    },
    {
      id: 'QP-B-021-003-a',
      siteName: 'Renato D. Sangalang',
      operator: 'Renato D. Sangalang',
      location: 'Parang, Bagac',
      permitType: 'Quarry Permit',
      issueDate: '2024-08-07',
      expiryDate: '2029-08-07',
      status: 'Active',
      area: '4.93 hectares'
    },
    {
      id: 'ISGP-B-021-001-a',
      siteName: 'Jowena Mae B. Tranate',
      operator: 'Jowena Mae B. Tranate',
      location: 'Parang, Bagac',
      permitType: 'Industrial Sand and Gravel Permit',
      issueDate: '2024-08-07',
      expiryDate: '2029-08-07',
      status: 'Active',
      area: '4.93 hectares'
    },
    {
      id: 'QP-B-24-002',
      siteName: 'San Luis Aggregates Trading',
      operator: 'San Luis Aggregates Trading',
      location: 'Paysawan, Bagac',
      permitType: 'Quarry Permit',
      issueDate: '2024-09-11',
      expiryDate: '2029-09-11',
      status: 'Active',
      area: '5.00 hectares'
    },
    {
      id: 'QP-B-24-003',
      siteName: 'Joel L. Dela Cruz',
      operator: 'Joel L. Dela Cruz',
      location: 'Gabon, Abucay',
      permitType: 'Quarry Permit',
      issueDate: '2024-10-28',
      expiryDate: '2029-10-28',
      status: 'Active',
      area: '4.50 hectares'
    },
    {
      id: 'QP-B-24-004',
      siteName: 'Matthew Ryan A. Tan',
      operator: 'Matthew Ryan A. Tan',
      location: 'Sisiman, Mariveles',
      permitType: 'Quarry Permit',
      issueDate: '2024-11-11',
      expiryDate: '2029-11-11',
      status: 'Active',
      area: '4.96 hectares'
    },
    {
      id: 'QP-B-24-005',
      siteName: 'Miguel P. Estrella',
      operator: 'Miguel P. Estrella',
      location: 'Sisiman, Mariveles',
      permitType: 'Quarry Permit',
      issueDate: '2024-12-09',
      expiryDate: '2029-12-09',
      status: 'Active',
      area: '4.99 hectares'
    },
    {
      id: 'QP-B-25-001',
      siteName: 'Oscar M. Tranate Jr.',
      operator: 'Oscar M. Tranate Jr.',
      location: 'Dangcol, Balanga City',
      permitType: 'Quarry Permit',
      issueDate: '2025-04-07',
      expiryDate: '2030-04-07',
      status: 'Active',
      area: '4.99 hectares'
    },
    {
      id: 'QP-B-25-002',
      siteName: 'Maria Lezwelyn B. David',
      operator: 'Maria Lezwelyn B. David',
      location: 'Dangcol, Balanga City',
      permitType: 'Quarry Permit',
      issueDate: '2025-04-07',
      expiryDate: '2030-04-07',
      status: 'Active',
      area: '5.00 hectares'
    },
    {
      id: 'QP-B-25-003',
      siteName: 'Romeo Y. Del Rosario',
      operator: 'Romeo Y. Del Rosario',
      location: 'Puting Buhangin, Orion',
      permitType: 'Quarry Permit',
      issueDate: '2025-07-01',
      expiryDate: '2030-07-01',
      status: 'Active',
      area: '3.06 hectares'
    }
  ];

  // Initialize truck data for selected date and site
  useEffect(() => {
    const key = `${selectedDate}-${currentSite}`;
    if (!truckData[key]) {
      setTruckData(prev => ({
        ...prev,
        [key]: {
          trucksIn: 0,
          trucksOut: 0,
          hourlyData: Array(24).fill().map((_, i) => ({
            hour: i,
            in: 0,
            out: 0
          }))
        }
      }));
    }
  }, [selectedDate, currentSite]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.relative')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const getCurrentData = () => {
    const key = `${selectedDate}-${currentSite}`;
    return truckData[key] || { trucksIn: 0, trucksOut: 0, hourlyData: [] };
  };

  const updateTruckCount = (type, operation) => {
    const key = `${selectedDate}-${currentSite}`;
    const currentHour = new Date().getHours();
    
    setTruckData(prev => {
      const current = prev[key] || { trucksIn: 0, trucksOut: 0, hourlyData: Array(24).fill().map((_, i) => ({ hour: i, in: 0, out: 0 })) };
      const newData = { ...current };
      
      if (operation === 'increment') {
        newData[type] = Math.max(0, newData[type] + 1);
        if (type === 'trucksIn') {
          newData.hourlyData[currentHour].in += 1;
        } else {
          newData.hourlyData[currentHour].out += 1;
        }
      } else {
        newData[type] = Math.max(0, newData[type] - 1);
        if (type === 'trucksIn') {
          newData.hourlyData[currentHour].in = Math.max(0, newData.hourlyData[currentHour].in - 1);
        } else {
          newData.hourlyData[currentHour].out = Math.max(0, newData.hourlyData[currentHour].out - 1);
        }
      }
      
      return {
        ...prev,
        [key]: newData
      };
    });
  };

  const navigateDate = (direction) => {
    // Parse date in local timezone to avoid timezone issues
    const [year, month, day] = selectedDate.split('-').map(Number);
    const currentDate = new Date(year, month - 1, day);
    
    if (direction === 'prev') {
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Format back to YYYY-MM-DD
    const newDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    setSelectedDate(newDateStr);
  };

  const getTotalStats = () => {
    let totalIn = 0;
    let totalOut = 0;
    Object.values(truckData).forEach(data => {
      totalIn += data.trucksIn;
      totalOut += data.trucksOut;
    });
    return { totalIn, totalOut };
  };

  // Get permits for selected municipality
  const getPermitsForMunicipality = (municipality) => {
    return approvedPermits.filter(permit => {
      const permitLocation = permit.location.toLowerCase();
      const selectedMunicipality = municipality.toLowerCase();
      return permitLocation.includes(selectedMunicipality);
    });
  };

  // Get proponents (operators) for selected municipality
  const getProponentsForMunicipality = (municipality) => {
    const permits = getPermitsForMunicipality(municipality);
    return permits.map(permit => permit.operator);
  };

  // Handle municipality change
  const handleMunicipalityChange = (municipality) => {
    setCurrentSite(municipality);
    setSelectedProponent(''); // Reset proponent selection when municipality changes
  };

  const handleResetCount = () => {
    const key = `${selectedDate}-${currentSite}`;
    setTruckData(prev => ({
      ...prev,
      [key]: {
        trucksIn: 0,
        trucksOut: 0,
        hourlyData: Array(24).fill().map((_, i) => ({ hour: i, in: 0, out: 0 }))
      }
    }));
    setShowDropdown(false);
  };



  const handleRefreshData = () => {
    // Refresh current data
    const key = `${selectedDate}-${currentSite}`;
    const currentData = truckData[key];
    if (currentData) {
      setTruckData(prev => ({ ...prev })); // Force re-render
    }
    setShowDropdown(false);
  };

  const handleShowPermits = () => {
    setShowPermitsModal(true);
    setShowDropdown(false);
  };

  const handleAddPermit = () => {
    setShowAddPermitModal(true);
  };

  const handleCloseAddPermit = () => {
    setShowAddPermitModal(false);
    setNewPermit({
      id: '',
      siteName: '',
      operator: '',
      location: '',
      permitType: 'Quarry Permit',
      issueDate: '',
      expiryDate: '',
      status: 'Active',
      area: ''
    });
  };

  const handleInputChange = (field, value) => {
    setNewPermit(prev => ({
      ...prev,
      [field]: value
    }));
  };


  const handleSubmitPermit = () => {
    // Basic validation
    if (!newPermit.id || !newPermit.siteName || !newPermit.operator || !newPermit.location || !newPermit.area) {
      alert('Please fill in all required fields.');
      return;
    }

    // Here you would typically send the data to your backend
    quarryLog('New permit to be added:', newPermit);
    alert('Quarry permit added successfully! (This would be saved to the database in a real implementation)');
    
    handleCloseAddPermit();
  };

  const currentData = getCurrentData();
  const totalStats = getTotalStats();

  return (
    <Layout onLogout={onLogout} onNavigate={onNavigate} currentPage={currentPage}>
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quarry Site Monitoring</h1>
            <p className="text-gray-500 mt-2">Daily truck traffic monitoring and quarry operations tracking</p>
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
                <DropdownMenuLabel>Quarry Management</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={handleRefreshData}
                  className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black"
                >
                  <RefreshCw className="w-4 h-4 text-black" />
                  <span>Refresh Data</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleShowPermits}
                  className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black"
                >
                  <Shield className="w-4 h-4 text-black" />
                  <span>View Permits</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Data Management</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={handleResetCount}
                  className="flex items-center gap-3 cursor-pointer text-red-600 hover:bg-gray-100 hover:text-red-700 focus:bg-gray-100 focus:text-red-700"
                >
                  <Activity className="w-4 h-4 text-red-600" />
                  <span>Reset Today's Count</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Today's Trucks In</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {currentData.trucksIn.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <ArrowUp className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Today's Trucks Out</p>
                  <p className="text-3xl font-bold text-green-600">
                    {currentData.trucksOut.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <ArrowDown className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Net Traffic</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {(currentData.trucksIn - currentData.trucksOut).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-xl">
                  <Activity className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Total All Time</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {(totalStats.totalIn + totalStats.totalOut).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <BarChart3 className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Section */}
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              {/* Header Section */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Filter className="w-4 h-4 text-black" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Monitoring Filters</h3>
                  <p className="text-sm text-gray-500">Select date and location</p>
                </div>
              </div>
              
              {/* Filters Section */}
              <div className="flex flex-col sm:flex-row items-end gap-4 w-full lg:w-auto">
                {/* Date Navigation */}
                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  <Label htmlFor="date-select" className="text-sm font-medium text-gray-700">Selected Date</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateDate('prev')}
                      className="flex items-center gap-1 px-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="text-center px-4 py-2 border border-gray-300 rounded-md bg-white min-w-[140px]">
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(selectedDate + 'T00:00:00').toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateDate('next')}
                      className="flex items-center gap-1 px-2"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Municipality Filter */}
                <div className="flex flex-col gap-2 w-full sm:w-[200px]">
                  <Label htmlFor="municipality-select" className="text-sm font-medium text-gray-700">Municipality</Label>
                  <Select value={currentSite} onValueChange={handleMunicipalityChange}>
                    <SelectTrigger id="municipality-select">
                      <SelectValue placeholder="Select Municipality" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(districtData).map(([district, municipalities]) => (
                        <SelectGroup key={district}>
                          <SelectLabel>{district}</SelectLabel>
                          {municipalities.map(municipality => (
                            <SelectItem key={municipality} value={municipality}>
                              {municipality}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Proponent Filter */}
                <div className="flex flex-col gap-2 w-full sm:w-[240px]">
                  <Label htmlFor="proponent-select" className="text-sm font-medium text-gray-700">Proponent</Label>
                  <Select 
                    value={selectedProponent} 
                    onValueChange={setSelectedProponent}
                    disabled={getProponentsForMunicipality(currentSite).length === 0}
                  >
                    <SelectTrigger id="proponent-select">
                      <SelectValue placeholder={
                        getProponentsForMunicipality(currentSite).length === 0 
                          ? 'No proponents available' 
                          : 'Select a proponent...'
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Proponents</SelectItem>
                      {getProponentsForMunicipality(currentSite).map((proponent, index) => (
                        <SelectItem key={index} value={proponent}>{proponent}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Truck Counting Interface */}
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader className="border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-black" />
                <span>Daily Truck Count - {currentSite}</span>
              </CardTitle>
              {selectedProponent && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Proponent:</span> {selectedProponent}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Trucks In */}
              <div className="text-center space-y-4">
                <div className="p-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-sm">
                  <div className="p-4 bg-white rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-md">
                    <ArrowUp className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-blue-900 mb-2">Trucks In</h3>
                  <p className="text-5xl font-bold text-blue-600 my-6">{currentData.trucksIn}</p>
                  <div className="flex justify-center gap-3">
                    <Button
                      onClick={() => updateTruckCount('trucksIn', 'decrement')}
                      variant="outline"
                      size="lg"
                      className="w-14 h-14 p-0 border-2 border-blue-400 hover:bg-blue-50 rounded-xl"
                    >
                      <Minus className="w-6 h-6 text-blue-600" />
                    </Button>
                    <Button
                      onClick={() => updateTruckCount('trucksIn', 'increment')}
                      size="lg"
                      className="w-14 h-14 p-0 bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg hover:shadow-xl transition-all"
                    >
                      <Plus className="w-6 h-6" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Trucks Out */}
              <div className="text-center space-y-4">
                <div className="p-8 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 shadow-sm">
                  <div className="p-4 bg-white rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-md">
                    <ArrowDown className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-green-900 mb-2">Trucks Out</h3>
                  <p className="text-5xl font-bold text-green-600 my-6">{currentData.trucksOut}</p>
                  <div className="flex justify-center gap-3">
                    <Button
                      onClick={() => updateTruckCount('trucksOut', 'decrement')}
                      variant="outline"
                      size="lg"
                      className="w-14 h-14 p-0 border-2 border-green-400 hover:bg-green-50 rounded-xl"
                    >
                      <Minus className="w-6 h-6 text-green-600" />
                    </Button>
                    <Button
                      onClick={() => updateTruckCount('trucksOut', 'increment')}
                      size="lg"
                      className="w-14 h-14 p-0 bg-green-600 hover:bg-green-700 rounded-xl shadow-lg hover:shadow-xl transition-all"
                    >
                      <Plus className="w-6 h-6" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <p className="text-sm font-medium text-gray-600 mb-2">Total In</p>
                  <p className="text-3xl font-bold text-blue-600">{currentData.trucksIn}</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <p className="text-sm font-medium text-gray-600 mb-2">Total Out</p>
                  <p className="text-3xl font-bold text-green-600">{currentData.trucksOut}</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <p className="text-sm font-medium text-gray-600 mb-2">Net Difference</p>
                  <p className={`text-3xl font-bold ${currentData.trucksIn - currentData.trucksOut >= 0 ? 'text-orange-600' : 'text-red-600'}`}>
                    {currentData.trucksIn - currentData.trucksOut >= 0 ? '+' : ''}{currentData.trucksIn - currentData.trucksOut}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Approved Quarry Permits Modal */}
        {showPermitsModal && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowPermitsModal(false)}
          >
            <div 
              className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full h-[95vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-600 rounded-xl">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Approved Quarry Permits</h2>
                    <p className="text-sm text-gray-600 mt-0.5">Manage and view all quarry permits</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleAddPermit}
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    Add Permit
                  </Button>
                  <button
                    onClick={() => setShowPermitsModal(false)}
                    className="p-2.5 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-3 bg-white/20 rounded-xl">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <span className="text-3xl font-bold">
                        {approvedPermits.filter(p => p.status === 'Active').length}
                      </span>
                    </div>
                    <p className="text-green-100 font-medium">Active Permits</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-3 bg-white/20 rounded-xl">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <span className="text-3xl font-bold">
                        {approvedPermits.filter(p => p.status === 'Expiring Soon').length}
                      </span>
                    </div>
                    <p className="text-orange-100 font-medium">Expiring Soon</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-3 bg-white/20 rounded-xl">
                        <Shield className="w-6 h-6" />
                      </div>
                      <span className="text-3xl font-bold">{approvedPermits.length}</span>
                    </div>
                    <p className="text-blue-100 font-medium">Total Permits</p>
                  </div>
                </div>

                {/* Permits List */}
                <div className="space-y-4">
                  {approvedPermits.map((permit) => (
                    <div key={permit.id} className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100">
                      {/* Card Header */}
                      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-blue-100 rounded-xl">
                            <Building className="w-7 h-7 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{permit.siteName}</h3>
                            <p className="text-sm text-gray-600 mt-0.5">{permit.operator}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-500">{permit.location}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                            permit.status === 'Active' 
                              ? 'bg-green-100 text-green-700' 
                              : permit.status === 'Expiring Soon' 
                                ? 'bg-orange-100 text-orange-700' 
                                : 'bg-gray-100 text-gray-700'
                          }`}>
                            {permit.status === 'Active' ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : permit.status === 'Expiring Soon' ? (
                              <AlertCircle className="w-4 h-4" />
                            ) : (
                              <Clock className="w-4 h-4" />
                            )}
                            <span className="text-sm font-semibold">{permit.status}</span>
                          </div>
                          <div className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                            {permit.permitType}
                          </div>
                        </div>
                      </div>

                      {/* Card Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Permit ID</p>
                          <p className="text-sm font-bold text-gray-900">{permit.id}</p>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Area Coverage</p>
                          <p className="text-sm font-bold text-gray-900">{permit.area}</p>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Issue Date</p>
                          <p className="text-sm font-bold text-gray-900">{new Date(permit.issueDate).toLocaleDateString()}</p>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Expiry Date</p>
                          <p className="text-sm font-bold text-gray-900">{new Date(permit.expiryDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add New Quarry Permit Modal */}
        {showAddPermitModal && (
          <div 
            className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={handleCloseAddPermit}
          >
            <div 
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b">
                <div className="flex items-center gap-2">
                  <Plus className="w-6 h-6 text-green-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Add New Quarry Permit</h2>
                </div>
                <button
                  onClick={handleCloseAddPermit}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="p-6">
                <form className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="permit-id">Permit ID *</Label>
                        <Input
                          id="permit-id"
                          type="text"
                          value={newPermit.id}
                          onChange={(e) => handleInputChange('id', e.target.value)}
                          placeholder="e.g., QP-B-025-004"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="permit-type">Permit Type</Label>
                        <select
                          id="permit-type"
                          value={newPermit.permitType}
                          onChange={(e) => handleInputChange('permitType', e.target.value)}
                          className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="Quarry Permit">Quarry Permit</option>
                          <option value="Industrial Sand and Gravel Permit">Industrial Sand and Gravel Permit</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Operator Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Operator Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="site-name">Site Name *</Label>
                        <Input
                          id="site-name"
                          type="text"
                          value={newPermit.siteName}
                          onChange={(e) => handleInputChange('siteName', e.target.value)}
                          placeholder="e.g., Northern Quarry Operations"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="operator">Operator *</Label>
                        <Input
                          id="operator"
                          type="text"
                          value={newPermit.operator}
                          onChange={(e) => handleInputChange('operator', e.target.value)}
                          placeholder="e.g., ABC Mining Corporation"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Location Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="location">Location *</Label>
                        <Input
                          id="location"
                          type="text"
                          value={newPermit.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          placeholder="e.g., Barangay, Municipality"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="area">Area Coverage *</Label>
                        <Input
                          id="area"
                          type="text"
                          value={newPermit.area}
                          onChange={(e) => handleInputChange('area', e.target.value)}
                          placeholder="e.g., 5.00 hectares"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Permit Details */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Permit Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="issue-date">Issue Date</Label>
                        <Input
                          id="issue-date"
                          type="date"
                          value={newPermit.issueDate}
                          onChange={(e) => handleInputChange('issueDate', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="expiry-date">Expiry Date</Label>
                        <Input
                          id="expiry-date"
                          type="date"
                          value={newPermit.expiryDate}
                          onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label htmlFor="status">Status</Label>
                      <select
                        id="status"
                        value={newPermit.status}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                        className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Active">Active</option>
                        <option value="Expiring Soon">Expiring Soon</option>
                        <option value="Expired">Expired</option>
                        <option value="Suspended">Suspended</option>
                      </select>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-4 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseAddPermit}
                      className="px-6"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSubmitPermit}
                      className="bg-green-600 hover:bg-green-700 text-white px-6"
                    >
                      Add Permit
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

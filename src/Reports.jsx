import React, { useState, useEffect } from "react";
import Layout from "./Layout";
import { useTheme } from "./ThemeContext";
import { useData } from "./DataContext";
import { usePatrolData } from "./PatrolDataContext";
import { 
  FileText, 
  Clock, 
  BarChart3, 
  TrendingUp, 
  MapPin, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Calendar,
  Download,
  Filter,
  Search,
  Eye,
  Printer
} from "lucide-react";

export default function Reports({ onLogout, onNavigate, currentPage }) {
  const { isDarkMode } = useTheme();
  const { patrolData, actionReports, incidents, summaryStats, loading } = useData();
  const { patrolData: localPatrolData, getDistrictSummary, getOverallSummary } = usePatrolData();
  
  const [activeTab, setActiveTab] = useState('ipatroller');
  const [dateRange, setDateRange] = useState('month');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailedReport, setShowDetailedReport] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  // Helper functions for data processing
  const getFilteredData = () => {
    let filteredData = [];
    
    switch (activeTab) {
      case 'ipatroller':
        filteredData = localPatrolData || [];
        break;
      case 'actioncenter':
        filteredData = actionReports || [];
        break;
      case 'incidents':
        filteredData = incidents || [];
        break;
      default:
        filteredData = [];
    }

    // Apply district filter
    if (selectedDistrict !== 'all') {
      filteredData = filteredData.filter(item => item.district === selectedDistrict);
    }

    // Apply search filter
    if (searchTerm) {
      filteredData = filteredData.filter(item => {
        if (activeTab === 'ipatroller') {
          return item.municipality?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 item.district?.toLowerCase().includes(searchTerm.toLowerCase());
        } else if (activeTab === 'actioncenter') {
          return item.what?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 item.municipality?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 item.where?.toLowerCase().includes(searchTerm.toLowerCase());
        } else if (activeTab === 'incidents') {
          return item.incidentType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 item.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 item.description?.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return false;
      });
    }

    return filteredData;
  };

  const generateReportData = () => {
    const filteredData = getFilteredData();
    
    switch (activeTab) {
      case 'ipatroller':
        return {
          totalPatrols: filteredData.reduce((sum, item) => sum + (item.totalPatrols || 0), 0),
          activeMunicipalities: filteredData.filter(item => (item.activePercentage || 0) >= 50).length,
          inactiveMunicipalities: filteredData.filter(item => (item.activePercentage || 0) < 50).length,
          averagePatrols: filteredData.length > 0 ? 
            Math.round(filteredData.reduce((sum, item) => sum + (item.totalPatrols || 0), 0) / filteredData.length) : 0,
          districtBreakdown: ['1ST DISTRICT', '2ND DISTRICT', '3RD DISTRICT'].map(district => ({
            district,
            ...getDistrictSummary(district)
          }))
        };
      case 'actioncenter':
        return {
          totalReports: filteredData.length,
          totalReports: filteredData.length,
          departmentBreakdown: filteredData.reduce((acc, item) => {
            acc[item.department] = (acc[item.department] || 0) + 1;
            return acc;
          }, {}),
          statusBreakdown: filteredData.reduce((acc, item) => {
            acc[item.actionTaken] = (acc[item.actionTaken] || 0) + 1;
            return acc;
          }, {})
        };
      case 'incidents':
        return {
          totalIncidents: filteredData.length,
          totalIncidents: filteredData.length,
          incidentTypeBreakdown: filteredData.reduce((acc, item) => {
            acc[item.incidentType] = (acc[item.incidentType] || 0) + 1;
            return acc;
          }, {}),
          severityBreakdown: filteredData.reduce((acc, item) => {
            acc[item.severity] = (acc[item.severity] || 0) + 1;
            return acc;
          }, {})
        };
      default:
        return {};
    }
  };

  const handleExportReport = () => {
    const reportData = generateReportData();
    const timestamp = new Date().toLocaleString();
    
    let csvContent = `IPatroller System Report - ${activeTab.toUpperCase()}\n`;
    csvContent += `Generated: ${timestamp}\n\n`;
    
    if (activeTab === 'ipatroller') {
      csvContent += 'District,Municipality,Total Patrols,Active Days,Inactive Days,Active Percentage\n';
      getFilteredData().forEach(item => {
        csvContent += `${item.district},${item.municipality},${item.totalPatrols},${item.activeDays},${item.inactiveDays},${item.activePercentage}%\n`;
      });
    } else if (activeTab === 'actioncenter') {
              csvContent += 'Department,Municipality,What,When,Where,Action Taken\n';
        getFilteredData().forEach(item => {
          csvContent += `${item.department},${item.municipality},${item.what},${item.when},${item.where},${item.actionTaken}\n`;
        });
    } else if (activeTab === 'incidents') {
      csvContent += 'Incident Type,Location,Date,Status,Severity,Description\n';
      getFilteredData().forEach(item => {
        csvContent += `${item.incidentType},${item.location},${item.date},${item.status},${item.severity},${item.description}\n`;
      });
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ipatroller-${activeTab}-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleViewDetailedReport = (reportType) => {
    setSelectedReport({ type: reportType, data: generateReportData() });
    setShowDetailedReport(true);
  };

  return (
    <Layout onLogout={onLogout} onNavigate={onNavigate} currentPage={currentPage}>
      <div className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Reports & Analytics
            </h1>
            <p className={`text-lg transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Comprehensive data analysis and reporting for all system modules
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportReport}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isDarkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={handlePrintReport}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
              }`}
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className={`p-6 rounded-xl border transition-all duration-300 ${
          isDarkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Tab Navigation */}
            <div className="md:col-span-2">
              <div className="flex space-x-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-700">
                {[
                  { id: 'ipatroller', label: 'IPatroller', icon: MapPin },
                  { id: 'actioncenter', label: 'Action Center', icon: FileText },
                  { id: 'incidents', label: 'Incidents', icon: AlertTriangle }
                ].map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      <IconComponent className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* District Filter */}
            <div>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 ${
                  isDarkMode 
                    ? 'border-gray-600 bg-gray-700 text-white' 
                    : 'border-gray-300 bg-white text-gray-900'
                }`}
              >
                <option value="all">All Districts</option>
                <option value="1ST DISTRICT">1ST DISTRICT</option>
                <option value="2ND DISTRICT">2ND DISTRICT</option>
                <option value="3RD DISTRICT">3RD DISTRICT</option>
              </select>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-3 py-2 rounded-lg border transition-all duration-200 ${
                  isDarkMode 
                    ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' 
                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary Cards */}
          <div className="lg:col-span-1 space-y-4">
            {(() => {
              const reportData = generateReportData();
              if (activeTab === 'ipatroller') {
                return (
                  <>
                    <div className={`p-6 rounded-xl border transition-all duration-300 ${
                      isDarkMode ? 'bg-blue-900/20 border-blue-700/50' : 'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-3 rounded-lg ${
                          isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'
                        }`}>
                          <MapPin className={`h-6 w-6 ${
                            isDarkMode ? 'text-blue-400' : 'text-blue-600'
                          }`} />
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${
                            isDarkMode ? 'text-blue-300' : 'text-blue-700'
                          }`}>Total Patrols</p>
                          <p className={`text-2xl font-bold ${
                            isDarkMode ? 'text-blue-200' : 'text-blue-900'
                          }`}>{reportData.totalPatrols}</p>
                        </div>
                      </div>
                    </div>

                    <div className={`p-6 rounded-xl border transition-all duration-300 ${
                      isDarkMode ? 'bg-green-900/20 border-green-700/50' : 'bg-green-50 border-green-200'
                    }`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-3 rounded-lg ${
                          isDarkMode ? 'bg-green-900/50' : 'bg-green-100'
                        }`}>
                          <CheckCircle className={`h-6 w-6 ${
                            isDarkMode ? 'text-green-400' : 'text-green-600'
                          }`} />
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${
                            isDarkMode ? 'text-green-300' : 'text-green-700'
                          }`}>Active Municipalities</p>
                          <p className={`text-2xl font-bold ${
                            isDarkMode ? 'text-green-200' : 'text-green-900'
                          }`}>{reportData.activeMunicipalities}</p>
                        </div>
                      </div>
                    </div>

                    <div className={`p-6 rounded-xl border transition-all duration-300 ${
                      isDarkMode ? 'bg-orange-900/20 border-orange-700/50' : 'bg-orange-50 border-orange-200'
                    }`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-3 rounded-lg ${
                          isDarkMode ? 'bg-orange-900/50' : 'bg-orange-100'
                        }`}>
                          <TrendingUp className={`h-6 w-6 ${
                            isDarkMode ? 'text-orange-400' : 'text-orange-600'
                          }`} />
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${
                            isDarkMode ? 'text-orange-300' : 'text-orange-700'
                          }`}>Average Patrols</p>
                          <p className={`text-2xl font-bold ${
                            isDarkMode ? 'text-orange-200' : 'text-orange-900'
                          }`}>{reportData.averagePatrols}</p>
                        </div>
                      </div>
                    </div>
                  </>
                );
              } else if (activeTab === 'actioncenter') {
                return (
                  <>
                    <div className={`p-6 rounded-xl border transition-all duration-300 ${
                      isDarkMode ? 'bg-blue-900/20 border-blue-700/50' : 'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-3 rounded-lg ${
                          isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'
                        }`}>
                          <FileText className={`h-6 w-6 ${
                            isDarkMode ? 'text-blue-400' : 'text-blue-600'
                          }`} />
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${
                            isDarkMode ? 'text-blue-300' : 'text-blue-700'
                          }`}>Total Reports</p>
                          <p className={`text-2xl font-bold ${
                            isDarkMode ? 'text-blue-200' : 'text-blue-900'
                          }`}>{reportData.totalReports}</p>
                        </div>
                      </div>
                    </div>

                    <div className={`p-6 rounded-xl border transition-all duration-300 ${
                      isDarkMode ? 'bg-green-900/20 border-green-700/50' : 'bg-green-50 border-green-200'
                    }`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-3 rounded-lg ${
                          isDarkMode ? 'bg-green-900/50' : 'bg-green-100'
                        }`}>
                          <CheckCircle className={`h-6 w-6 ${
                            isDarkMode ? 'text-green-400' : 'text-green-600'
                          }`} />
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${
                            isDarkMode ? 'text-green-300' : 'text-green-700'
                          }`}>Total Reports</p>
                          <p className={`text-2xl font-bold ${
                            isDarkMode ? 'text-green-200' : 'text-green-900'
                          }`}>{reportData.totalReports}</p>
                        </div>
                      </div>
                    </div>
                  </>
                );
              } else if (activeTab === 'incidents') {
                return (
                  <>
                    <div className={`p-6 rounded-xl border transition-all duration-300 ${
                      isDarkMode ? 'bg-red-900/20 border-red-700/50' : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-3 rounded-lg ${
                          isDarkMode ? 'bg-red-900/50' : 'bg-red-100'
                        }`}>
                          <AlertTriangle className={`h-6 w-6 ${
                            isDarkMode ? 'text-red-400' : 'text-red-600'
                          }`} />
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${
                            isDarkMode ? 'text-red-300' : 'text-red-700'
                          }`}>Total Incidents</p>
                          <p className={`text-2xl font-bold ${
                            isDarkMode ? 'text-red-200' : 'text-red-900'
                          }`}>{reportData.totalIncidents}</p>
                        </div>
                      </div>
                    </div>

                    <div className={`p-6 rounded-xl border transition-all duration-300 ${
                      isDarkMode ? 'bg-green-900/20 border-green-700/50' : 'bg-green-50 border-green-200'
                    }`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-3 rounded-lg ${
                          isDarkMode ? 'bg-green-900/50' : 'bg-green-100'
                        }`}>
                          <CheckCircle className={`h-6 w-6 ${
                            isDarkMode ? 'text-green-400' : 'text-green-600'
                          }`} />
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${
                            isDarkMode ? 'text-green-300' : 'text-green-700'
                          }`}>Total Incidents</p>
                          <p className={`text-2xl font-bold ${
                            isDarkMode ? 'text-green-200' : 'text-green-900'
                          }`}>{reportData.totalIncidents}</p>
                        </div>
                      </div>
                    </div>
                  </>
                );
              }
              return null;
            })()}
          </div>

          {/* Data Table */}
          <div className="lg:col-span-2">
            <div className={`p-6 rounded-xl border transition-all duration-300 ${
              isDarkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-semibold transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {activeTab === 'ipatroller' && 'Patrol Data'}
                  {activeTab === 'actioncenter' && 'Action Reports'}
                  {activeTab === 'incidents' && 'Incident Reports'}
                </h3>
                <button
                  onClick={() => handleViewDetailedReport(activeTab)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </button>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b transition-colors duration-300 ${
                      isDarkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      {activeTab === 'ipatroller' && (
                        <>
                          <th className={`text-left p-3 font-semibold transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>Municipality</th>
                          <th className={`text-left p-3 font-semibold transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>District</th>
                          <th className={`text-left p-3 font-semibold transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>Total Patrols</th>
                          <th className={`text-left p-3 font-semibold transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>Active %</th>
                        </>
                      )}
                      {activeTab === 'actioncenter' && (
                        <>
                          <th className={`text-left p-3 font-semibold transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>Department</th>
                          <th className={`text-left p-3 font-semibold transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>Municipality</th>
                          <th className={`text-left p-3 font-semibold transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>Action</th>
                          <th className={`text-left p-3 font-semibold transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>Status</th>
                        </>
                      )}
                      {activeTab === 'incidents' && (
                        <>
                          <th className={`text-left p-3 font-semibold transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>Type</th>
                          <th className={`text-left p-3 font-semibold transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>Location</th>
                          <th className={`text-left p-3 font-semibold transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>Date</th>
                          <th className={`text-left p-3 font-semibold transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>Status</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData().slice(0, 10).map((item, index) => (
                      <tr key={item.id || index} className={`border-b transition-colors duration-300 ${
                        isDarkMode ? 'border-gray-700 hover:bg-gray-700/30' : 'border-gray-200 hover:bg-gray-50'
                      }`}>
                        {activeTab === 'ipatroller' && (
                          <>
                            <td className="p-3">{item.municipality}</td>
                            <td className="p-3">{item.district}</td>
                            <td className="p-3">{item.totalPatrols}</td>
                            <td className="p-3">{item.activePercentage}%</td>
                          </>
                        )}
                        {activeTab === 'actioncenter' && (
                          <>
                            <td className="p-3">{item.department}</td>
                            <td className="p-3">{item.municipality}</td>
                            <td className="p-3">{item.what}</td>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                              }`}>
                                {item.actionTaken}
                              </span>
                            </td>
                          </>
                        )}
                        {activeTab === 'incidents' && (
                          <>
                            <td className="p-3">{item.incidentType}</td>
                            <td className="p-3">{item.location}</td>
                            <td className="p-3">{item.date}</td>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {getFilteredData().length === 0 && (
                  <div className="text-center py-12">
                    <p className={`text-lg font-medium transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>No data found matching your criteria.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Report Modal */}
        {showDetailedReport && selectedReport && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className={`relative max-w-6xl max-h-[90vh] overflow-hidden rounded-xl shadow-2xl ${
              isDarkMode ? 'bg-gray-900' : 'bg-white'
            }`}>
              {/* Close button */}
              <button
                onClick={() => setShowDetailedReport(false)}
                className="absolute top-4 right-4 h-10 w-10 p-0 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center"
              >
                ×
              </button>
              
              {/* Modal content */}
              <div className="p-6 max-h-[90vh] overflow-y-auto">
                <h2 className={`text-2xl font-bold mb-6 transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Detailed Report - {selectedReport.type.toUpperCase()}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Summary Statistics */}
                  <div className={`p-6 rounded-xl border transition-all duration-300 ${
                    isDarkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-gray-50/80 border-gray-200'
                  }`}>
                    <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Summary Statistics</h3>
                    <div className="space-y-3">
                      {Object.entries(selectedReport.data).map(([key, value]) => {
                        if (typeof value === 'object') return null;
                        return (
                          <div key={key} className="flex justify-between items-center">
                            <span className={`text-sm font-medium transition-colors duration-300 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </span>
                            <span className={`text-sm font-semibold transition-colors duration-300 ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>{value}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Breakdown Charts */}
                  <div className={`p-6 rounded-xl border transition-all duration-300 ${
                    isDarkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-gray-50/80 border-gray-200'
                  }`}>
                    <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Data Breakdown</h3>
                    <div className="space-y-3">
                      {Object.entries(selectedReport.data).map(([key, value]) => {
                        if (typeof value === 'object' && value !== null) {
                          return (
                            <div key={key} className="space-y-2">
                              <h4 className={`text-sm font-medium transition-colors duration-300 ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </h4>
                              {Object.entries(value).map(([subKey, subValue]) => (
                                <div key={subKey} className="flex justify-between items-center text-sm">
                                  <span className={`transition-colors duration-300 ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                  }`}>{subKey}</span>
                                  <span className={`font-medium transition-colors duration-300 ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                  }`}>{subValue}</span>
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useFirebase } from './hooks/useFirebase';
import { useFirestore } from './hooks/useFirestore';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const { user } = useFirebase();
  const { 
    getPatrolData, 
    getActionReportsByMonth, 
    getIncidents,
    getAllActionReportsMonths
  } = useFirestore();
  
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    patrolData: [],
    actionReports: [],
    incidents: [],
    ipatrollerData: [],
    summaryStats: {
      totalPatrols: 0,
      totalActions: 0,
      totalIncidents: 0,
      activeMunicipalities: 0,
      inactiveMunicipalities: 0,
      totalDistricts: 0,
      totalUsers: 0
    }
  });

  // Load current month data
  const loadCurrentMonthData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const currentDate = new Date();
      const currentMonthKey = `${String(currentDate.getMonth() + 1).padStart(2, '0')}-${currentDate.getFullYear()}`;
      
      // Load patrol data for current month
      const patrolResult = await getPatrolData(currentMonthKey);
      let patrolData = [];
      if (patrolResult.success && patrolResult.data) {
        patrolData = patrolResult.data.data || [];
      }

      // Load action reports for current month
      const actionReportsResult = await getActionReportsByMonth(currentMonthKey);
      let actionReports = [];
      if (actionReportsResult.success) {
        actionReports = actionReportsResult.data || [];
      }

      // Load incidents
      const incidentsResult = await getIncidents(50);
      let incidents = [];
      if (incidentsResult.success) {
        incidents = incidentsResult.data || [];
      }

      // Calculate summary statistics
      const allMunicipalities = [
        "Abucay", "Orani", "Samal", "Hermosa", // 1ST DISTRICT
        "Balanga City", "Pilar", "Orion", "Limay", // 2ND DISTRICT
        "Bagac", "Dinalupihan", "Mariveles", "Morong" // 3RD DISTRICT
      ];
      
      const activeMunicipalities = new Set([
        ...patrolData.map(p => p.municipality).filter(Boolean),
        ...actionReports.map(r => r.municipality).filter(Boolean)
      ]);
      
      const summaryStats = {
        totalPatrols: patrolData.length,
        totalActions: actionReports.length,
        totalIncidents: incidents.length,
        activeMunicipalities: activeMunicipalities.size,
        inactiveMunicipalities: allMunicipalities.length - activeMunicipalities.size,
        totalDistricts: 3, // Fixed number of districts
        totalUsers: 1 // Assuming single user for now
      };

      setDashboardData({
        patrolData,
        actionReports,
        incidents,
        ipatrollerData: [], // Will be enhanced later
        summaryStats
      });

    } catch (error) {
      console.error('❌ Error loading current month data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load data for a specific month
  const loadMonthData = async (monthKey) => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Load patrol data for specified month
      const patrolResult = await getPatrolData(monthKey);
      let patrolData = [];
      if (patrolResult.success && patrolResult.data) {
        patrolData = patrolResult.data.data || [];
      }

      // Load action reports for specified month
      const actionReportsResult = await getActionReportsByMonth(monthKey);
      let actionReports = [];
      if (actionReportsResult.success) {
        actionReports = actionReportsResult.data || [];
      }

      // Update dashboard data
      setDashboardData(prev => ({
        ...prev,
        patrolData,
        actionReports,
        summaryStats: {
          ...prev.summaryStats,
          totalPatrols: patrolData.length,
          totalActions: actionReports.length,
          activeMunicipalities: new Set(patrolData.map(p => p.municipality).filter(Boolean)).size,
          totalDistricts: new Set(patrolData.map(p => p.district).filter(Boolean)).size
        }
      }));

    } catch (error) {
      console.error(`❌ Error loading data for month ${monthKey}:`, error);
    } finally {
      setLoading(false);
    }
  };

  // Load all available months
  const loadAvailableMonths = async () => {
    if (!user) return;
    
    try {
      const monthsResult = await getAllActionReportsMonths();
      if (monthsResult.success) {
        console.log('📅 Available months:', monthsResult.data);
      }
    } catch (error) {
      console.error('❌ Error loading available months:', error);
    }
  };

  // Load data when user changes
  useEffect(() => {
    if (user) {
      loadCurrentMonthData();
      loadAvailableMonths();
    }
  }, [user]);

  const value = {
    ...dashboardData,
    loading,
    loadCurrentMonthData,
    loadMonthData,
    loadAvailableMonths
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

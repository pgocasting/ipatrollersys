import React, { createContext, useContext, useState, useEffect } from 'react';
import { useFirebase } from './hooks/useFirebase';

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
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    patrolData: [],
    actionReports: [],
    incidents: [],
    ipatrollerData: [],
    summaryStats: {},
    allMonths: [],
    ipatrollerStats: {}
  });

  // Mock data to replace Firebase data
  const mockData = {
    patrolData: [
      {
        municipality: "Abucay",
        district: "1ST DISTRICT",
        totalPatrols: 15,
        activeDays: 8,
        inactiveDays: 4,
        activePercentage: 67
      },
      {
        municipality: "Balanga City",
        district: "2ND DISTRICT", 
        totalPatrols: 22,
        activeDays: 12,
        inactiveDays: 2,
        activePercentage: 86
      },
      {
        municipality: "Orani",
        district: "1ST DISTRICT",
        totalPatrols: 18,
        activeDays: 10,
        inactiveDays: 3,
        activePercentage: 77
      }
    ],
    actionReports: [
      {
        municipality: "Abucay",
        department: "pnp",
        actionTaken: "Patrol completed",
        when: new Date().toISOString()
      },
      {
        municipality: "Balanga City",
        department: "agriculture",
        actionTaken: "Inspection done",
        when: new Date().toISOString()
      },
      {
        municipality: "Orani",
        department: "pg-enro",
        actionTaken: "Environmental check",
        when: new Date().toISOString()
      }
    ],
    incidents: [
      {
        municipality: "Abucay",
        incidentType: "Traffic Violation",
        date: new Date().toISOString()
      },
      {
        municipality: "Balanga City",
        incidentType: "Theft",
        date: new Date().toISOString()
      },
      {
        municipality: "Orani",
        incidentType: "Drug-related",
        date: new Date().toISOString()
      }
    ],
    ipatrollerData: [
      {
        monthKey: "01-2025",
        data: [
          {
            municipality: "Abucay",
            district: "1ST DISTRICT",
            totalPatrols: 15,
            activeDays: 8,
            inactiveDays: 4,
            activePercentage: 67
          },
          {
            municipality: "Balanga City",
            district: "2ND DISTRICT", 
            totalPatrols: 22,
            activeDays: 12,
            inactiveDays: 2,
            activePercentage: 86
          },
          {
            municipality: "Orani",
            district: "1ST DISTRICT",
            totalPatrols: 18,
            activeDays: 10,
            inactiveDays: 3,
            activePercentage: 77
          }
        ],
        totalPatrols: 3
      }
    ],
    allMonths: [
      { monthKey: "01-2025", totalReports: 3, lastUpdated: new Date().toISOString() }
    ]
  };

  // Load mock data when user changes
  useEffect(() => {
    if (user) {
      setLoading(true);
      
      // Simulate loading delay
      setTimeout(() => {
        const { patrolData, actionReports, incidents, ipatrollerData, allMonths } = mockData;
        
        // Calculate summary statistics
        const allMunicipalities = [
          "Abucay", "Orani", "Samal", "Hermosa", // 1ST DISTRICT
          "Balanga City", "Pilar", "Orion", "Limay", // 2ND DISTRICT
          "Bagac", "Dinalupihan", "Mariveles", "Morong" // 3RD DISTRICT
        ];
        
        const activeMunicipalities = new Set([
          ...patrolData.map(p => p.municipality).filter(Boolean),
          ...actionReports.map(r => r.municipality).filter(Boolean),
          ...incidents.map(i => i.municipality).filter(Boolean)
        ]);
        
        const totalPatrolsAllMonths = ipatrollerData.reduce((sum, month) => sum + month.totalPatrols, 0);
        
        const summaryStats = {
          totalPatrols: totalPatrolsAllMonths,
          totalActions: actionReports.length,
          totalIncidents: incidents.length,
          activeMunicipalities: activeMunicipalities.size,
          inactiveMunicipalities: allMunicipalities.length - activeMunicipalities.size,
          totalDistricts: 3,
          totalUsers: 1,
          currentMonthPatrols: patrolData.length,
          currentMonthActions: actionReports.length,
          totalMonthsWithData: allMonths.length
        };

        // Calculate I-Patroller statistics
        const ipatrollerStats = {
          totalPatrols: patrolData.reduce((sum, item) => sum + (item.totalPatrols || 0), 0),
          totalActive: patrolData.reduce((sum, item) => sum + (item.activeDays || 0), 0),
          totalInactive: patrolData.reduce((sum, item) => sum + (item.inactiveDays || 0), 0),
          avgActivePercentage: patrolData.length > 0 ? 
            Math.round(
              patrolData.reduce((sum, item) => sum + (item.activePercentage || 0), 0) / 
              patrolData.length
            ) : 0,
          municipalityCount: patrolData.length,
          activeMunicipalities: activeMunicipalities.size,
          inactiveMunicipalities: allMunicipalities.length - activeMunicipalities.size,
          totalMunicipalities: 12,
          districtsActive: new Set(patrolData.map(p => p.district).filter(Boolean)).size,
          activeMunicipalitiesList: patrolData.filter(p => p.totalPatrols > 0).map(p => ({
            name: p.municipality,
            totalPatrols: p.totalPatrols,
            activeDays: p.activeDays,
            inactiveDays: p.inactiveDays,
            avgPatrols: p.totalPatrols / p.activeDays || 0
          })),
          inactiveMunicipalitiesList: allMunicipalities
            .filter(m => !patrolData.some(p => p.municipality === m && p.totalPatrols > 0))
            .map(m => ({
              name: m,
              totalPatrols: 0,
              activeDays: 0,
              inactiveDays: 0,
              avgPatrols: 0
            }))
        };

        setDashboardData({
          patrolData,
          actionReports,
          incidents,
          ipatrollerData,
          summaryStats,
          allMonths,
          ipatrollerStats
        });

        setLoading(false);
      }, 500); // Simulate loading delay
    }
  }, [user]);

  const value = {
    ...dashboardData,
    loading,
    loadCurrentMonthData: () => {}, // No-op function
    loadMonthData: () => {}, // No-op function
    loadAvailableMonths: () => {} // No-op function
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
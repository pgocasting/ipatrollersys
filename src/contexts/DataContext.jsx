import React, { createContext, useContext, useState, useEffect } from 'react';
import { useFirebase } from '../hooks/useFirebase';
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  getDocs
} from 'firebase/firestore';
import { db } from '../lib/firebase';

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
  const [loadedPages, setLoadedPages] = useState(new Set());
  
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
      recentActivity: [],
      totalDailyPatrols: 0,
      totalYesterdayPatrols: 0,
      totalPhotosUploaded: 0,
      activeDistricts: 0,
      monthlyPatrolTrend: [],
      yesterdayDate: null
    }
  });

  // Store unsubscribe functions per page
  const unsubscribeFunctionsRef = React.useRef({});

  // Function to load Dashboard data only
  const loadDashboardData = React.useCallback(async () => {
    if (loadedPages.has('dashboard') || !user) return;
    
    console.log('📊 Loading Dashboard data with real-time updates...');
    setLoading(true);
    
    try {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthYearId = `${String(currentMonth + 1).padStart(2, "0")}-${currentYear}`;

      const municipalitiesRef = collection(db, 'patrolData', monthYearId, 'municipalities');
      
      // Use onSnapshot for real-time updates
      const unsubscribe = onSnapshot(municipalitiesRef, (querySnapshot) => {
        const ipatrollerData = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data) {
            ipatrollerData.push({ id: doc.id, ...data });
          }
        });

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayIndex = yesterday.getDate() - 1;

        let activeCount = 0;
        let inactiveCount = 0;

        ipatrollerData.forEach(item => {
          let yesterdayPatrols = 0;
          if (item.data && Array.isArray(item.data) && yesterdayIndex >= 0 && yesterdayIndex < item.data.length) {
            yesterdayPatrols = item.data[yesterdayIndex] || 0;
          }
          if (yesterdayPatrols >= 5) activeCount++;
          else inactiveCount++;
        });

        const totalDailyPatrols = ipatrollerData.reduce((total, item) => total + (item.totalPatrols || 0), 0);
        const activeDistricts = new Set(ipatrollerData.map(item => item.district)).size;

        const totalYesterdayPatrols = ipatrollerData.reduce((total, item) => {
          if (item.data && Array.isArray(item.data) && yesterdayIndex >= 0 && yesterdayIndex < item.data.length) {
            return total + (item.data[yesterdayIndex] || 0);
          }
          return total;
        }, 0);

        setDashboardData(prev => ({
          ...prev,
          ipatrollerData,
          summaryStats: {
            ...prev.summaryStats,
            totalDailyPatrols,
            totalYesterdayPatrols,
            activeDistricts,
            activeMunicipalities: activeCount,
            inactiveMunicipalities: inactiveCount,
            yesterdayDate: yesterday.toDateString()
          }
        }));
        
        setLoading(false);
      });

      unsubscribeFunctionsRef.current.dashboard = unsubscribe;
      setLoadedPages(prev => new Set([...prev, 'dashboard']));
      console.log('✅ Dashboard data loaded with real-time listener');
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      setLoading(false);
    }
  }, [loadedPages, user]);

  // Function to load Action Center data only
  const loadActionCenterData = React.useCallback(async () => {
    if (loadedPages.has('actioncenter') || !user) return;
    
    console.log('📋 Loading Action Center data...');
    setLoading(true);

    try {
      const unsubscribe = onSnapshot(collection(db, 'actionReports'), (snapshot) => {
        const actionReports = [];
        snapshot.forEach((doc) => {
          const docData = doc.data();
          if (docData.data && Array.isArray(docData.data)) {
            docData.data.forEach(report => {
              actionReports.push({ ...report, _monthDoc: doc.id });
            });
          } else {
            actionReports.push({ id: doc.id, ...docData });
          }
        });

        actionReports.sort((a, b) => {
          const tA = a.createdAt ? new Date(a.createdAt) : new Date(a.when || 0);
          const tB = b.createdAt ? new Date(b.createdAt) : new Date(b.when || 0);
          return tB - tA;
        });

        setDashboardData(prev => ({
          ...prev,
          actionReports,
          summaryStats: {
            ...prev.summaryStats,
            totalActions: actionReports.length
          }
        }));
        
        setLoading(false);
      });

      unsubscribeFunctionsRef.current.actioncenter = unsubscribe;
      setLoadedPages(prev => new Set([...prev, 'actioncenter']));
      console.log('✅ Action Center data loaded');
    } catch (error) {
      console.error('❌ Error loading action center data:', error);
      setLoading(false);
    }
  }, [loadedPages, user]);

  // Function to load Incidents data only
  const loadIncidentsData = React.useCallback(async () => {
    if (loadedPages.has('incidents') || !user) return;
    
    console.log('🚨 Loading Incidents data...');
    setLoading(true);

    try {
      const incidentsQuery = query(collection(db, 'incidents'), orderBy('date', 'desc'));
      const unsubscribe = onSnapshot(incidentsQuery, (snapshot) => {
        const incidents = [];
        snapshot.forEach((doc) => {
          incidents.push({
            id: doc.id,
            ...doc.data()
          });
        });

        setDashboardData(prev => ({
          ...prev,
          incidents,
          summaryStats: {
            ...prev.summaryStats,
            totalIncidents: incidents.length
          }
        }));
        
        setLoading(false);
      });

      unsubscribeFunctionsRef.current.incidents = unsubscribe;
      setLoadedPages(prev => new Set([...prev, 'incidents']));
      console.log('✅ Incidents data loaded');
    } catch (error) {
      console.error('❌ Error loading incidents data:', error);
      setLoading(false);
    }
  }, [loadedPages, user]);

  // Function to load IPatroller data only
  const loadIPatrollerData = React.useCallback(async () => {
    if (loadedPages.has('ipatroller') || !user) return;
    
    console.log('🚗 Loading IPatroller data with real-time updates...');
    setLoading(true);

    try {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthYearId = `${String(currentMonth + 1).padStart(2, "0")}-${currentYear}`;

      const municipalitiesRef = collection(db, 'patrolData', monthYearId, 'municipalities');
      
      // Use onSnapshot for real-time updates
      const unsubscribe = onSnapshot(municipalitiesRef, (querySnapshot) => {
        const ipatrollerData = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data) {
            ipatrollerData.push({ id: doc.id, ...data });
          }
        });

        const totalDailyPatrols = ipatrollerData.reduce((total, item) => total + (item.totalPatrols || 0), 0);
        const activeDistricts = new Set(ipatrollerData.map(item => item.district)).size;

        setDashboardData(prev => ({
          ...prev,
          ipatrollerData,
          patrolData: ipatrollerData,
          summaryStats: {
            ...prev.summaryStats,
            totalDailyPatrols,
            activeDistricts
          }
        }));
        
        setLoading(false);
      });

      unsubscribeFunctionsRef.current.ipatroller = unsubscribe;
      setLoadedPages(prev => new Set([...prev, 'ipatroller']));
      console.log('✅ IPatroller data loaded with real-time listener');
    } catch (error) {
      console.error('❌ Error loading ipatroller data:', error);
      setLoading(false);
    }
  }, [loadedPages, user]);

  // Function to load Reports data (for Reports page)
  const loadReportsData = React.useCallback(async () => {
    if (loadedPages.has('reports') || !user) return;
    
    console.log('📊 Loading Reports data...');
    setLoading(true);

    try {
      // Load action reports for reports page
      const unsubscribe = onSnapshot(collection(db, 'actionReports'), (snapshot) => {
        const actionReports = [];
        snapshot.forEach((doc) => {
          const docData = doc.data();
          if (docData.data && Array.isArray(docData.data)) {
            docData.data.forEach(report => {
              actionReports.push({ ...report, _monthDoc: doc.id });
            });
          } else {
            actionReports.push({ id: doc.id, ...docData });
          }
        });

        setDashboardData(prev => ({
          ...prev,
          actionReports
        }));
        
        setLoading(false);
      });

      unsubscribeFunctionsRef.current.reports = unsubscribe;
      setLoadedPages(prev => new Set([...prev, 'reports']));
      console.log('✅ Reports data loaded');
    } catch (error) {
      console.error('❌ Error loading reports data:', error);
      setLoading(false);
    }
  }, [loadedPages, user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(unsubscribeFunctionsRef.current).forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
    };
  }, []);

  // Generate recent activity when data changes
  useEffect(() => {
    if (dashboardData.patrolData.length > 0 || dashboardData.actionReports.length > 0 || dashboardData.incidents.length > 0) {
      const recentActivity = [];

      // Add recent patrols
      dashboardData.patrolData.slice(0, 3).forEach(patrol => {
        if (patrol.updatedAt) {
          recentActivity.push({
            type: 'patrol',
            title: 'Patrol data updated',
            description: `${patrol.district || 'Unknown'} - ${patrol.municipality || 'Unknown'}`,
            timestamp: patrol.updatedAt,
            icon: 'MapPin'
          });
        }
      });

      // Add recent action reports
      dashboardData.actionReports.slice(0, 3).forEach(report => {
        if (report.when) {
          recentActivity.push({
            type: 'action',
            title: 'Action report submitted',
            description: `${report.what || 'Action'} - ${report.where || 'Location'}`,
            timestamp: report.when,
            icon: 'FileText'
          });
        }
      });

      // Add recent incidents
      dashboardData.incidents.slice(0, 3).forEach(incident => {
        if (incident.date) {
          recentActivity.push({
            type: 'incident',
            title: 'Incident reported',
            description: `${incident.incidentType || 'Incident'} - ${incident.location || 'Location'}`,
            timestamp: incident.date,
            icon: 'AlertTriangle'
          });
        }
      });

      // Sort by timestamp and take top 5
      recentActivity.sort((a, b) => {
        const timeA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
        const timeB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
        return timeB - timeA;
      });

      setDashboardData(prev => ({
        ...prev,
        summaryStats: {
          ...prev.summaryStats,
          recentActivity: recentActivity.slice(0, 5)
        }
      }));
    }
  }, [dashboardData.patrolData, dashboardData.actionReports, dashboardData.incidents]);

  const value = {
    ...dashboardData,
    loading,
    loadDashboardData,
    loadActionCenterData,
    loadIncidentsData,
    loadIPatrollerData,
    loadReportsData,
    refreshData: () => {
      // Clear loaded pages to force reload
      setLoadedPages(new Set());
    }
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

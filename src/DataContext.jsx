import React, { createContext, useContext, useState, useEffect } from 'react';
import { useFirebase } from './hooks/useFirebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  limit,
  where,
  getDocs,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';

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
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    patrolData: [],
    actionReports: [],
    incidents: [],
    ipatrollerData: [], // Add IPatroller data
    summaryStats: {
      totalPatrols: 0,
      totalActions: 0,
      totalIncidents: 0,
      activeMunicipalities: 0,
      inactiveMunicipalities: 0,
      recentActivity: [],
      // Add IPatroller specific stats
      totalDailyPatrols: 0,
      totalPhotosUploaded: 0,
      activeDistricts: 0,
      monthlyPatrolTrend: []
    }
  });

  // Load all data when user changes
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribeFunctions = [];

    // Load Patrol Data
    const loadPatrolData = async () => {
      try {
        const patrolQuery = query(collection(db, 'patrolData'), orderBy('updatedAt', 'desc'));
        const unsubscribe = onSnapshot(patrolQuery, (snapshot) => {
          const patrolData = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.data && Array.isArray(data.data)) {
              patrolData.push({
                id: doc.id,
                ...data,
                data: data.data
              });
            }
          });
          
          setDashboardData(prev => ({
            ...prev,
            patrolData,
            summaryStats: {
              ...prev.summaryStats,
              totalPatrols: patrolData.reduce((total, row) => 
                total + (row.data ? row.data.reduce((sum, val) => sum + (val || 0), 0) : 0), 0
              ),
              activeMunicipalities: patrolData.filter(row => {
                if (!row.data || !Array.isArray(row.data)) return false;
                const avgPatrols = row.data.reduce((a, b) => a + (b || 0), 0) / row.data.length;
                return avgPatrols >= 5;
              }).length,
              inactiveMunicipalities: patrolData.filter(row => {
                if (!row.data || !Array.isArray(row.data)) return false;
                const avgPatrols = row.data.reduce((a, b) => a + (b || 0), 0);
                return avgPatrols <= 4;
              }).length
            }
          }));
        });
        unsubscribeFunctions.push(unsubscribe);
      } catch (error) {
        console.error('Error loading patrol data:', error);
      }
    };

    // Load IPatroller Data
    const loadIPatrollerData = async () => {
      try {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthYearId = `${String(currentMonth + 1).padStart(2, "0")}-${currentYear}`;
        
        const municipalitiesRef = collection(db, 'patrolData', monthYearId, 'municipalities');
        const querySnapshot = await getDocs(municipalitiesRef);
        const ipatrollerData = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data) {
            ipatrollerData.push({
              id: doc.id,
              ...data
            });
          }
        });
        
        // Calculate IPatroller specific stats
        const totalDailyPatrols = ipatrollerData.reduce((total, item) => 
          total + (item.totalPatrols || 0), 0
        );
        
        const activeDistricts = new Set(ipatrollerData.map(item => item.district)).size;
        
        const monthlyPatrolTrend = Array.from({ length: 12 }, (_, i) => {
          const month = i;
          const year = currentYear;
          return { month, year, count: Math.floor(Math.random() * 100) + 20 }; // Placeholder data
        });
        
        setDashboardData(prev => ({
          ...prev,
          ipatrollerData,
          summaryStats: {
            ...prev.summaryStats,
            totalDailyPatrols,
            activeDistricts,
            monthlyPatrolTrend
          }
        }));
        
        console.log('✅ IPatroller data loaded:', ipatrollerData.length, 'municipalities');
      } catch (error) {
        console.error('Error loading IPatroller data:', error);
      }
    };

    // Load Action Reports
    const loadActionReports = async () => {
      try {
        const actionsQuery = query(collection(db, 'actionReports'), orderBy('when', 'desc'), limit(50));
        const unsubscribe = onSnapshot(actionsQuery, (snapshot) => {
          const actionReports = [];
          snapshot.forEach((doc) => {
            actionReports.push({
              id: doc.id,
              ...doc.data()
            });
          });
          
          setDashboardData(prev => ({
            ...prev,
            actionReports,
            summaryStats: {
              ...prev.summaryStats,
              totalActions: actionReports.length
            }
          }));
        });
        unsubscribeFunctions.push(unsubscribe);
      } catch (error) {
        console.error('Error loading action reports:', error);
      }
    };

    // Load Incidents
    const loadIncidents = async () => {
      try {
        const incidentsQuery = query(collection(db, 'incidents'), orderBy('date', 'desc'), limit(50));
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
        });
        unsubscribeFunctions.push(unsubscribe);
      } catch (error) {
        console.error('Error loading incidents:', error);
      }
    };

    // Load all data
    Promise.all([
      loadPatrolData(),
      loadIPatrollerData(), // Load IPatroller data
      loadActionReports(),
      loadIncidents()
    ]).finally(() => {
      setLoading(false);
    });

    // Cleanup function
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }, [user]);

  // Generate recent activity
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
    refreshData: () => {
      setLoading(true);
      // This will trigger the useEffect to reload all data
    }
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

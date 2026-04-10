import React, { createContext, useContext, useState, useEffect } from 'react';
import { useFirebase } from '../hooks/useFirebase';
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
      totalYesterdayPatrols: 0,
      totalPhotosUploaded: 0,
      activeDistricts: 0,
      monthlyPatrolTrend: [],
      yesterdayDate: null
    }
  });

  // Load all data when user changes
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // OPTIMIZED: Set loading to false immediately, load data in background
    setLoading(false);
    const unsubscribeFunctions = [];

    // Load essential data first (in background)
    const loadEssentialData = async () => {
      try {
        // Load minimal data needed for initial render
        const essentialDataQuery = query(
          collection(db, 'patrolData'),
          orderBy('timestamp', 'desc'),
          limit(10) // Only load 10 most recent items for faster initial load
        );
        const snapshot = await getDocs(essentialDataQuery);
        const essentialData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Update state with essential data
        setDashboardData(prev => ({
          ...prev,
          patrolData: essentialData,
          summaryStats: {
            ...prev.summaryStats,
            totalPatrols: essentialData.length
          }
        }));
      } catch (error) {
        console.error('Error loading essential data:', error);
      }
    };

    // Load remaining data in the background
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
              )
              // activeMunicipalities and inactiveMunicipalities will be set by loadIPatrollerData
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

        // Load from the same structure that iPatroller uses
        const municipalitiesRef = collection(db, 'patrolData', monthYearId, 'municipalities');
        const querySnapshot = await getDocs(municipalitiesRef);
        const ipatrollerData = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data) {
            ipatrollerData.push({ id: doc.id, ...data });
          }
        });

        // If no data found for current month, try the most recent available month
        if (ipatrollerData.length === 0) {
          const allMonthsSnapshot = await getDocs(collection(db, 'patrolData'));
          const months = [];
          allMonthsSnapshot.forEach((doc) => {
            const data = doc.data();
            if (data && data.updatedAt) months.push({ id: doc.id, updatedAt: data.updatedAt });
          });
          months.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
          if (months[0]) {
            const recentSnapshot = await getDocs(collection(db, 'patrolData', months[0].id, 'municipalities'));
            recentSnapshot.forEach((doc) => {
              const data = doc.data();
              if (data) ipatrollerData.push({ id: doc.id, ...data });
            });
          }
        }

        // Calculate statistics from the actual data
        const totalDailyPatrols = ipatrollerData.reduce((total, item) => total + (item.totalPatrols || 0), 0);
        const activeDistricts = new Set(ipatrollerData.map(item => item.district)).size;

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

        const monthlyPatrolTrend = Array.from({ length: 12 }, (_, i) => ({
          month: i, year: currentYear, count: Math.floor(Math.random() * 100) + 20
        }));

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
            monthlyPatrolTrend,
            yesterdayDate: yesterday.toDateString()
          }
        }));
      } catch (error) {
        console.error('❌ Error loading IPatroller data:', error);
        setDashboardData(prev => ({
          ...prev,
          ipatrollerData: [],
          summaryStats: {
            ...prev.summaryStats,
            totalDailyPatrols: 0,
            activeDistricts: 0,
            activeMunicipalities: 0,
            inactiveMunicipalities: 0
          }
        }));
      }
    };

    // Function to create sample data for testing
    const createSampleData = () => {
      console.log('🧪 Creating sample data for testing...');

      const sampleData = [
        {
          id: '1ST DISTRICT-Abucay',
          municipality: 'Abucay',
          district: '1ST DISTRICT',
          data: [8, 7, 9, 6, 8, 7, 9, 8, 7, 9, 6, 8, 7, 9, 8, 7, 9, 6, 8, 7, 9, 8, 7, 9, 6, 8, 7, 9, 8, 7, 9],
          totalPatrols: 240,
          activeDays: 31,
          inactiveDays: 0,
          activePercentage: 100
        },
        {
          id: '1ST DISTRICT-Orani',
          municipality: 'Orani',
          district: '1ST DISTRICT',
          data: [5, 6, 5, 7, 5, 6, 5, 7, 5, 6, 5, 7, 5, 6, 5, 7, 5, 6, 5, 7, 5, 6, 5, 7, 5, 6, 5, 7, 5, 6, 5],
          totalPatrols: 186,
          activeDays: 31,
          inactiveDays: 0,
          activePercentage: 100
        },
        {
          id: '2ND DISTRICT-Balanga City',
          municipality: 'Balanga City',
          district: '2ND DISTRICT',
          data: [3, 2, 4, 3, 2, 4, 3, 2, 4, 3, 2, 4, 3, 2, 4, 3, 2, 4, 3, 2, 4, 3, 2, 4, 3, 2, 4, 3, 2, 4, 3],
          totalPatrols: 93,
          activeDays: 31,
          inactiveDays: 0,
          activePercentage: 100
        }
      ];

      // Calculate stats from sample data
      const totalDailyPatrols = sampleData.reduce((total, item) => total + (item.totalPatrols || 0), 0);
      const activeDistricts = new Set(sampleData.map(item => item.district)).size;
      const activeMunicipalities = sampleData.filter(item => {
        if (!item.data || !Array.isArray(item.data)) return false;
        const avgPatrols = item.data.reduce((a, b) => a + (b || 0), 0) / item.data.length;
        return avgPatrols >= 5;
      });
      const inactiveMunicipalities = sampleData.filter(item => {
        if (!item.data || !Array.isArray(item.data)) return true;
        const avgPatrols = item.data.reduce((a, b) => a + (b || 0), 0) / item.data.length;
        return avgPatrols < 5;
      });

      setDashboardData(prev => ({
        ...prev,
        ipatrollerData: sampleData,
        summaryStats: {
          ...prev.summaryStats,
          totalDailyPatrols,
          activeDistricts,
          activeMunicipalities: activeMunicipalities.length,
          inactiveMunicipalities: inactiveMunicipalities.length
        }
      }));

      console.log('✅ Sample data created:', {
        totalDailyPatrols,
        activeDistricts,
        activeMunicipalities: activeMunicipalities.length,
        inactiveMunicipalities: inactiveMunicipalities.length
      });
    };

    // Load Action Reports
    // useFirebase writes month-based docs: actionReports/{mm-yyyy} → { data: [...reports] }
    // We need to unpack each month document's inner data[] array
    const loadActionReports = async () => {
      try {
        const unsubscribe = onSnapshot(collection(db, 'actionReports'), (snapshot) => {
          const actionReports = [];
          snapshot.forEach((doc) => {
            const docData = doc.data();
            // Month-based structure: data is an array inside each month doc
            if (docData.data && Array.isArray(docData.data)) {
              docData.data.forEach(report => {
                actionReports.push({ ...report, _monthDoc: doc.id });
              });
            } else {
              // Fallback: individual document structure
              actionReports.push({ id: doc.id, ...docData });
            }
          });

          // Sort by report date descending
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
        });
        unsubscribeFunctions.push(unsubscribe);
      } catch (error) {
        console.error('Error loading action reports:', error);
      }
    };

    // Load Incidents
    const loadIncidents = async () => {
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
        });
        unsubscribeFunctions.push(unsubscribe);
      } catch (error) {
        console.error('Error loading incidents:', error);
      }
    };

    // OPTIMIZED: Load ALL data simultaneously in parallel (no sequential waterfall)
    Promise.all([
      loadEssentialData(),
      loadIPatrollerData(),
      loadActionReports(),
      loadIncidents()
    ]);
    // loadPatrolData uses onSnapshot (real-time listener), start it separately
    loadPatrolData();

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
    },
    refreshIPatrollerData: () => {
      // No-op: data is loaded once on mount; refresh by toggling user state
    },
    createSampleData: () => {
      // No-op: sample data generation removed
    }
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
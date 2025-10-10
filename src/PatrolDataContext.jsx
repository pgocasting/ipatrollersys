import React, { createContext, useContext, useState, useEffect } from 'react';

const PatrolDataContext = createContext();

export const usePatrolData = () => {
  const context = useContext(PatrolDataContext);
  if (!context) {
    throw new Error('usePatrolData must be used within a PatrolDataProvider');
  }
  return context;
};

export const PatrolDataProvider = ({ children }) => {
  const [patrolData, setPatrolData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Initialize with sample data
  useEffect(() => {
    initializePatrolData();
  }, []);

  const initializePatrolData = () => {
    // Generate sample patrol data for all municipalities
    const municipalitiesByDistrict = {
      "1ST DISTRICT": ["Abucay", "Orani", "Samal", "Hermosa"],
      "2ND DISTRICT": ["Balanga City", "Pilar", "Orion", "Limay"],
      "3RD DISTRICT": ["Bagac", "Dinalupihan", "Mariveles", "Morong"]
    };

    const sampleData = [];
    
    Object.entries(municipalitiesByDistrict).forEach(([district, municipalities]) => {
      municipalities.forEach(municipality => {
        // Generate 31 days of random patrol data (July 2025)
        const dailyData = Array.from({ length: 31 }, () => Math.floor(Math.random() * 10));
        
        sampleData.push({
          id: `${district}-${municipality}`,
          municipality,
          district,
          data: dailyData,
          totalPatrols: dailyData.reduce((sum, val) => sum + val, 0),
          activeDays: dailyData.filter(val => val > 0).length,
          inactiveDays: dailyData.filter(val => val === 0).length,
          activePercentage: Math.round((dailyData.filter(val => val > 0).length / dailyData.length) * 100)
        });
      });
    });
    
    setPatrolData(sampleData);
  };

  const updatePatrolData = (municipality, district, dayIndex, value) => {
    setPatrolData(prev => prev.map(item => {
      if (item.municipality === municipality && item.district === district) {
        const newData = [...item.data];
        newData[dayIndex] = parseInt(value) || 0;
        const totalPatrols = newData.reduce((sum, val) => sum + val, 0);
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
    }));
  };

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

  const getOverallSummary = () => {
    const totalPatrols = patrolData.reduce((sum, item) => sum + item.totalPatrols, 0);
    const totalActive = patrolData.reduce((sum, item) => sum + item.activeDays, 0);
    const totalInactive = patrolData.reduce((sum, item) => sum + item.inactiveDays, 0);
    const avgActivePercentage = patrolData.length > 0 
      ? Math.round(patrolData.reduce((sum, item) => sum + item.activePercentage, 0) / patrolData.length)
      : 0;
    
    return {
      totalPatrols,
      totalActive,
      totalInactive,
      avgActivePercentage,
      municipalityCount: patrolData.length
    };
  };

  const value = {
    patrolData,
    setPatrolData,
    loading,
    setLoading,
    updatePatrolData,
    getDistrictSummary,
    getOverallSummary,
    initializePatrolData
  };

  return (
    <PatrolDataContext.Provider value={value}>
      {children}
    </PatrolDataContext.Provider>
  );
}; 
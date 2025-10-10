import React from 'react';
import { useData } from './DataContext';

export default function DebugComponent() {
  const data = useData();
  
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', margin: '10px', borderRadius: '8px' }}>
      <h3>🔍 DataContext Debug Info</h3>
      <pre style={{ fontSize: '12px', overflow: 'auto' }}>
        {JSON.stringify({
          loading: data.loading,
          hasData: !!data.patrolData,
          patrolDataLength: data.patrolData?.length || 0,
          actionReportsLength: data.actionReports?.length || 0,
          incidentsLength: data.incidents?.length || 0,
          ipatrollerDataLength: data.ipatrollerData?.length || 0,
          summaryStats: data.summaryStats,
          ipatrollerStats: data.ipatrollerStats,
          allMonthsLength: data.allMonths?.length || 0
        }, null, 2)}
      </pre>
    </div>
  );
} 
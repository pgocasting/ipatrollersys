import React, { useState, useEffect } from 'react';
import PatrolPhotoUpload from './components/PatrolPhotoUpload';
import PatrolPhotoGallery from './components/PatrolPhotoGallery';
import IncidentEvidenceUpload from './components/IncidentEvidenceUpload';

const FirebaseCloudinaryDemo = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [fileStats, setFileStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [demoPatrolData, setDemoPatrolData] = useState({
    monthKey: '01-2025',
    municipality: 'Abucay',
    district: '1ST DISTRICT'
  });
  const [demoIncidentData, setDemoIncidentData] = useState({
    id: 'demo-incident-001',
    incidentType: 'Theft',
    municipality: 'Abucay',
    district: '1ST DISTRICT',
    date: '2025-01-15',
    status: 'Active'
  });

  // Load file statistics
  useEffect(() => {
    loadFileStatistics();
  }, []);

  const loadFileStatistics = async () => {
    setLoadingStats(true);
    try {
      console.warn('⚠️ Firebase has been removed from this project');
      setFileStats({ error: 'Firebase has been removed from this project' });
    } catch (error) {
      console.error('Failed to load file statistics:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Handle patrol photos updated
  const handlePatrolPhotosUpdated = (photos) => {
    console.log('Patrol photos updated:', photos);
    // Refresh file statistics
    loadFileStatistics();
  };

  // Handle incident evidence updated
  const handleIncidentEvidenceUpdated = (evidence) => {
    console.log('Incident evidence updated:', evidence);
    // Refresh file statistics
    loadFileStatistics();
  };

  // Test file upload functions
  const testFileUploads = async () => {
    console.warn('⚠️ Firebase has been removed from this project');
  };

  // Test file retrieval functions
  const testFileRetrieval = async () => {
    console.warn('⚠️ Firebase has been removed from this project');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Firebase + Cloudinary Integration Demo - DISABLED
          </h1>
          <p className="text-lg text-gray-600">
            ⚠️ Firebase has been removed from this project. Integration demo is disabled.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-white p-1 rounded-lg shadow-sm">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('patrol')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'patrol'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Patrol Photos
          </button>
          <button
            onClick={() => setActiveTab('incidents')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'incidents'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Incident Evidence
          </button>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* File Statistics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">File Statistics</h2>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">
                  ⚠️ Firebase has been removed from this project. No statistics available.
                </p>
              </div>
            </div>

            {/* Test Functions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Test Functions</h2>
              <div className="flex gap-4">
                <button
                  onClick={testFileUploads}
                  className="px-4 py-2 bg-gray-300 text-gray-600 rounded-md cursor-not-allowed"
                  disabled
                >
                  Test File Uploads
                </button>
                <button
                  onClick={testFileRetrieval}
                  className="px-4 py-2 bg-gray-300 text-gray-600 rounded-md cursor-not-allowed"
                  disabled
                >
                  Test File Retrieval
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'patrol' && (
          <div className="space-y-6">
            <PatrolPhotoUpload
              onPhotosUpdated={handlePatrolPhotosUpdated}
              patrolData={demoPatrolData}
            />
            <PatrolPhotoGallery
              monthKey={demoPatrolData.monthKey}
              municipality={demoPatrolData.municipality}
              district={demoPatrolData.district}
            />
          </div>
        )}

        {activeTab === 'incidents' && (
          <div className="space-y-6">
            <IncidentEvidenceUpload
              onEvidenceUpdated={handleIncidentEvidenceUpdated}
              incidentData={demoIncidentData}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FirebaseCloudinaryDemo;

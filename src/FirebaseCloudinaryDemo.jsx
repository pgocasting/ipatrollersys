import React, { useState, useEffect } from 'react';
import { firebaseCloudinaryIntegration } from './utils/firebaseCloudinaryIntegration';
import PatrolPhotoUpload from './components/PatrolPhotoUpload';
import PatrolPhotoGallery from './components/PatrolPhotoGallery';
import IncidentEvidenceUpload from './components/IncidentEvidenceUpload';
import { useFirebase } from './hooks/useFirebase';

const FirebaseCloudinaryDemo = () => {
  const { user } = useFirebase();
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
      const result = await firebaseCloudinaryIntegration.getFileStatistics();
      if (result.success) {
        setFileStats(result.data);
      }
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
    console.log('🧪 Testing file upload functions...');
    
    try {
      // Test patrol photo upload
      console.log('📸 Testing patrol photo upload...');
      const testFiles = [new File(['test'], 'test.jpg', { type: 'image/jpeg' })];
      
      const patrolResult = await firebaseCloudinaryIntegration.uploadPatrolPhotos(
        testFiles,
        demoPatrolData
      );
      console.log('Patrol photo upload result:', patrolResult);
      
      // Test incident evidence upload
      console.log('📁 Testing incident evidence upload...');
      const incidentResult = await firebaseCloudinaryIntegration.uploadIncidentEvidence(
        testFiles,
        demoIncidentData
      );
      console.log('Incident evidence upload result:', incidentResult);
      
      // Refresh statistics
      await loadFileStatistics();
      
    } catch (error) {
      console.error('Test failed:', error);
    }
  };

  // Test file retrieval functions
  const testFileRetrieval = async () => {
    console.log('🔍 Testing file retrieval functions...');
    
    try {
      // Test getting patrol photos
      const patrolPhotos = await firebaseCloudinaryIntegration.getPatrolPhotos(
        demoPatrolData.monthKey,
        demoPatrolData.municipality,
        demoPatrolData.district
      );
      console.log('Patrol photos:', patrolPhotos);
      
      // Test getting incident evidence
      const incidentEvidence = await firebaseCloudinaryIntegration.getIncidentEvidence(
        demoIncidentData.id
      );
      console.log('Incident evidence:', incidentEvidence);
      
    } catch (error) {
      console.error('Retrieval test failed:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600">Please log in to access the Firebase-Cloudinary integration demo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-gray-900">
              Firebase-Cloudinary Integration Demo
            </h1>
            <div className="text-sm text-gray-500">
              User: {user.email}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: '📋' },
              { id: 'patrol', label: 'Patrol Photos', icon: '📸' },
              { id: 'incidents', label: 'Incident Evidence', icon: '📁' },
              { id: 'testing', label: 'Testing Tools', icon: '🧪' },
              { id: 'statistics', label: 'File Statistics', icon: '📊' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                🚀 Firebase-Cloudinary Integration Overview
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">How It Works</h3>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-start">
                      <span className="text-blue-500 mr-2">1.</span>
                      <span>Files are uploaded to Cloudinary for secure storage</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-blue-500 mr-2">2.</span>
                      <span>File metadata and Cloudinary URLs are saved to Firebase</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-blue-500 mr-2">3.</span>
                      <span>Your app displays files using Firebase data with Cloudinary URLs</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Benefits</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>✅ Professional file storage with CDN optimization</div>
                    <div>✅ Automatic image/video optimization</div>
                    <div>✅ Secure file access and management</div>
                    <div>✅ Scalable storage solution</div>
                    <div>✅ Integrated with your existing Firebase data</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Integration Points</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Patrol Data</h4>
                  <p className="text-sm text-gray-600">Upload and store patrol photos linked to specific municipalities and districts</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Incident Reports</h4>
                  <p className="text-sm text-gray-600">Attach evidence files (photos, videos, documents) to incident records</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">User Profiles</h4>
                  <p className="text-sm text-gray-600">Store profile pictures and user-related files</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Patrol Photos Tab */}
        {activeTab === 'patrol' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                📸 Patrol Photo Management
              </h2>
              <p className="text-gray-600 mb-6">
                Upload and manage patrol photos for specific municipalities and districts. 
                Photos are stored in Cloudinary and linked to your Firebase patrol data.
              </p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upload Component */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Photos</h3>
                  <PatrolPhotoUpload
                    monthKey={demoPatrolData.monthKey}
                    municipality={demoPatrolData.municipality}
                    district={demoPatrolData.district}
                    onPhotosUpdated={handlePatrolPhotosUpdated}
                  />
                </div>
                
                {/* Gallery Component */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Photo Gallery</h3>
                  <PatrolPhotoGallery
                    monthKey={demoPatrolData.monthKey}
                    municipality={demoPatrolData.municipality}
                    district={demoPatrolData.district}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Incident Evidence Tab */}
        {activeTab === 'incidents' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                📁 Incident Evidence Management
              </h2>
              <p className="text-gray-600 mb-6">
                Upload and manage evidence files for incident reports. 
                Support for images, videos, and documents with automatic categorization.
              </p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upload Component */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Evidence</h3>
                  <IncidentEvidenceUpload
                    incidentData={demoIncidentData}
                    onEvidenceUpdated={handleIncidentEvidenceUpdated}
                  />
                </div>
                
                {/* Evidence Display */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Evidence Files</h3>
                  <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
                    <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-lg font-medium">Evidence Files</p>
                    <p className="text-sm">Upload evidence files to see them displayed here</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Testing Tools Tab */}
        {activeTab === 'testing' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                🧪 Testing Tools
              </h2>
              <p className="text-gray-600 mb-6">
                Test the Firebase-Cloudinary integration functions and verify data flow.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Test Functions</h3>
                  
                  <button
                    onClick={testFileUploads}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    🧪 Test File Uploads
                  </button>
                  
                  <button
                    onClick={testFileRetrieval}
                    className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                  >
                    🔍 Test File Retrieval
                  </button>
                  
                  <button
                    onClick={loadFileStatistics}
                    className="w-full px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                  >
                    📊 Refresh Statistics
                  </button>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Console Commands</h3>
                  <div className="space-y-2 text-sm">
                    <div className="p-2 bg-gray-100 rounded font-mono">
                      firebaseCloudinaryIntegration.getFileStatistics()
                    </div>
                    <div className="p-2 bg-gray-100 rounded font-mono">
                      firebaseCloudinaryIntegration.uploadPatrolPhotos()
                    </div>
                    <div className="p-2 bg-gray-100 rounded font-mono">
                      firebaseCloudinaryIntegration.uploadIncidentEvidence()
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Open browser console to test these functions directly
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* File Statistics Tab */}
        {activeTab === 'statistics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                📊 File Statistics
              </h2>
              
              {loadingStats ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-gray-600">Loading statistics...</span>
                </div>
              ) : fileStats ? (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{fileStats.total}</div>
                      <div className="text-sm text-blue-800">Total Files</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{fileStats.byType.image}</div>
                      <div className="text-sm text-green-800">Images</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{fileStats.byType.video}</div>
                      <div className="text-sm text-purple-800">Videos</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{fileStats.byType.document}</div>
                      <div className="text-sm text-orange-800">Documents</div>
                    </div>
                  </div>

                  {/* File Type Distribution */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">File Types</h3>
                      <div className="space-y-2">
                        {Object.entries(fileStats.byType).map(([type, count]) => (
                          <div key={type} className="flex items-center justify-between">
                            <span className="capitalize text-gray-600">{type}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Categories</h3>
                      <div className="space-y-2">
                        {Object.entries(fileStats.byCategory).map(([category, count]) => (
                          <div key={category} className="flex items-center justify-between">
                            <span className="capitalize text-gray-600">{category.replace('_', ' ')}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recent Uploads */}
                  {fileStats.recentUploads.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Recent Uploads</h3>
                      <div className="space-y-2">
                        {fileStats.recentUploads.map((file, index) => (
                          <div key={file.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <span className="text-gray-400">
                                {file.type === 'image' ? '📷' : file.type === 'video' ? '🎥' : '📄'}
                              </span>
                              <span className="text-sm font-medium">{file.publicId}</span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(file.uploadedAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-8 text-gray-500">
                  <p>No file statistics available. Upload some files to see statistics.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FirebaseCloudinaryDemo;

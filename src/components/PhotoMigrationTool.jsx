import React, { useState, useEffect } from 'react';
import { useFirebase } from '../hooks/useFirebase';
import { cloudinaryUtils } from '../utils/cloudinary';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  Cloud, 
  Database, 
  Download, 
  Upload, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  FileImage,
  FileVideo,
  File
} from 'lucide-react';

const PhotoMigrationTool = () => {
  const { user } = useFirebase();
  const [migrationStatus, setMigrationStatus] = useState('idle'); // idle, scanning, migrating, completed, error
  const [progress, setProgress] = useState(0);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [migratedPhotos, setMigratedPhotos] = useState(0);
  const [failedPhotos, setFailedPhotos] = useState(0);
  const [migrationLog, setMigrationLog] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [scanResults, setScanResults] = useState(null);

  // Add log entry
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setMigrationLog(prev => [...prev, { timestamp, message, type }]);
  };

  // Scan for existing photos in Firebase
  const scanForExistingPhotos = async () => {
    if (!user || !db) {
      addLog('❌ User not authenticated or database not available', 'error');
      return;
    }

    setMigrationStatus('scanning');
    addLog('🔍 Scanning for existing photos in Firebase...', 'info');
    
          try {
        console.warn('⚠️ Firebase has been removed from this project');
      
              // Firebase has been removed - no scanning possible
        addLog('⚠️ Firebase has been removed from this project - scanning disabled', 'warning');
        
        const allPhotos = [];
      
      setExistingPhotos(allPhotos);
      const totalCount = allPhotos.flatMap(item => item.photos).length;
      setTotalPhotos(totalCount);
      setScanResults({
        collections: collectionsToScan.length,
        documents: allPhotos.length,
        photos: totalCount
      });
      
      addLog(`🎯 Scan complete! Found ${totalCount} photos to migrate`, 'success');
      setMigrationStatus('idle');
      
    } catch (error) {
      addLog(`❌ Scan failed: ${error.message}`, 'error');
      setMigrationStatus('error');
    }
  };

  // Download photo from Firebase Storage and upload to Cloudinary
  const migratePhoto = async (photo, documentPath) => {
    try {
      addLog(`📥 Downloading photo: ${photo.originalUrl}`, 'info');
      
      // Download photo from Firebase Storage
      const response = await fetch(photo.originalUrl);
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const file = new File([blob], photo.fileName || `photo-${Date.now()}.jpg`, { 
        type: photo.fileType || 'image/jpeg' 
      });
      
      addLog(`📤 Uploading to Cloudinary...`, 'info');
      
      // Upload to Cloudinary
      const result = await cloudinaryUtils.uploadImage(file, {
        folder: `ipatroller/migrated/${documentPath.split('/')[0]}`,
        publicId: `migrated-${Date.now()}-${Math.random().toString(36).substring(2)}`
      });
      
      if (result.success) {
        addLog(`✅ Successfully migrated: ${result.data.url}`, 'success');
        return {
          success: true,
          originalUrl: photo.originalUrl,
          newUrl: result.data.url,
          cloudinaryId: result.data.publicId,
          documentPath
        };
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      addLog(`❌ Migration failed for ${photo.originalUrl}: ${error.message}`, 'error');
      return {
        success: false,
        originalUrl: photo.originalUrl,
        error: error.message,
        documentPath
      };
    }
  };

  // Start migration process
  const startMigration = async () => {
    if (existingPhotos.length === 0) {
      addLog('❌ No photos found to migrate. Please scan first.', 'error');
      return;
    }

    setMigrationStatus('migrating');
    setProgress(0);
    setMigratedPhotos(0);
    setFailedPhotos(0);
    
    addLog('🚀 Starting photo migration to Cloudinary...', 'info');
    
    const allPhotos = existingPhotos.flatMap(item => item.photos);
    let successCount = 0;
    let failureCount = 0;
    
    for (let i = 0; i < allPhotos.length; i++) {
      const photo = allPhotos[i];
      const progressPercent = ((i + 1) / allPhotos.length) * 100;
      
      setProgress(progressPercent);
      addLog(`🔄 Migrating photo ${i + 1} of ${allPhotos.length}`, 'info');
      
      const result = await migratePhoto(photo, photo.documentPath);
      
      if (result.success) {
        successCount++;
        setMigratedPhotos(successCount);
        
        // Firebase has been removed - no document updates possible
        addLog('⚠️ Firebase has been removed from this project - document updates disabled', 'warning');
        
      } else {
        failureCount++;
        setFailedPhotos(failureCount);
      }
      
      // Small delay to avoid overwhelming the APIs
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    addLog(`🎉 Migration complete! ${successCount} successful, ${failureCount} failed`, 'success');
    setMigrationStatus('completed');
  };

  // Reset migration state
  const resetMigration = () => {
    setMigrationStatus('idle');
    setProgress(0);
    setTotalPhotos(0);
    setMigratedPhotos(0);
    setFailedPhotos(0);
    setMigrationLog([]);
    setExistingPhotos([]);
    setScanResults(null);
  };

  if (!user) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-6 h-6" />
            Photo Migration Tool
          </CardTitle>
          <CardDescription>
            Migrate existing photos from Firebase Storage to Cloudinary
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-600 py-8">
            Please log in to access the photo migration tool.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Cloud className="w-8 h-8" />
            Photo Migration Tool
          </CardTitle>
          <CardDescription className="text-lg">
            Migrate your existing photos from Firebase Storage to Cloudinary for better performance and no CORS issues.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Migration Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{totalPhotos}</div>
              <div className="text-sm text-blue-800">Total Photos</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{migratedPhotos}</div>
              <div className="text-sm text-green-800">Migrated</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{failedPhotos}</div>
              <div className="text-sm text-red-800">Failed</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">
                {migrationStatus === 'idle' ? 'Ready' : 
                 migrationStatus === 'scanning' ? 'Scanning' :
                 migrationStatus === 'migrating' ? 'Migrating' :
                 migrationStatus === 'completed' ? 'Complete' : 'Error'}
              </div>
              <div className="text-sm text-gray-800">Status</div>
            </div>
          </div>
          
          {migrationStatus === 'migrating' && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={scanForExistingPhotos}
              disabled={migrationStatus === 'scanning' || migrationStatus === 'migrating'}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              {scanResults ? 'Re-scan Photos' : 'Scan for Photos'}
            </Button>
            
            <Button
              onClick={startMigration}
              disabled={migrationStatus !== 'idle' || existingPhotos.length === 0}
              variant="default"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Upload className="w-4 h-4" />
              Start Migration
            </Button>
            
            <Button
              onClick={resetMigration}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </Button>
          </div>
          
          {scanResults && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Scan Results:</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><strong>Collections:</strong> {scanResults.collections}</div>
                <div><strong>Documents:</strong> {scanResults.documents}</div>
                <div><strong>Photos:</strong> {scanResults.photos}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Migration Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <File className="w-5 h-5" />
            Migration Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {migrationLog.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No migration activity yet.</p>
            ) : (
              migrationLog.map((log, index) => (
                <div 
                  key={index} 
                  className={`flex items-center gap-2 p-2 rounded text-sm ${
                    log.type === 'error' ? 'bg-red-50 text-red-800' :
                    log.type === 'success' ? 'bg-green-50 text-green-800' :
                    log.type === 'warning' ? 'bg-yellow-50 text-yellow-800' :
                    'bg-gray-50 text-gray-800'
                  }`}
                >
                  <span className="text-xs text-gray-500">{log.timestamp}</span>
                  <span>{log.message}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Download className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <h4 className="font-semibold">1. Scan</h4>
              <p className="text-sm text-gray-600">Find all photos stored in Firebase Storage</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Upload className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <h4 className="font-semibold">2. Migrate</h4>
              <p className="text-sm text-gray-600">Download and upload to Cloudinary</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <h4 className="font-semibold">3. Update</h4>
              <p className="text-sm text-gray-600">Update Firebase with new Cloudinary URLs</p>
            </div>
          </div>
          
          <Separator />
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Important Notes:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• This process downloads photos from Firebase Storage and uploads them to Cloudinary</li>
              <li>• Original Firebase Storage URLs will be replaced with Cloudinary URLs</li>
              <li>• Migration may take time depending on the number and size of photos</li>
              <li>• Failed migrations will be logged for manual review</li>
              <li>• Make sure you have sufficient Cloudinary storage space</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PhotoMigrationTool;

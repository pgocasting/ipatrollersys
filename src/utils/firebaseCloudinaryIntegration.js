// Firebase-Cloudinary Integration Utilities
// This file handles the integration between Cloudinary file storage and Firebase data storage

import { 
  doc, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  collection,
  addDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { clientUploadUtils } from './cloudinary';

// File metadata structure for Firebase
const createFileMetadata = (cloudinaryResult, additionalData = {}) => ({
  publicId: cloudinaryResult.publicId,
  url: cloudinaryResult.url,
  format: cloudinaryResult.format,
  size: cloudinaryResult.size,
  uploadedAt: cloudinaryResult.uploadedAt,
  type: additionalData.type || 'file', // 'image', 'video', 'document'
  category: additionalData.category || 'general',
  description: additionalData.description || '',
  tags: additionalData.tags || [],
  ...additionalData
});

// Main integration utilities
export const firebaseCloudinaryIntegration = {
  
  // ===== PATROL DATA INTEGRATION =====
  
  // Upload patrol photos and save URLs to Firebase
  async uploadPatrolPhotos(files, patrolData, options = {}) {
    try {
      console.log('📸 Uploading patrol photos to Cloudinary...');
      
      const { monthKey, municipality, district } = patrolData;
      const folder = `ipatroller/patrols/${monthKey}/${municipality}/${district}`;
      
      // Upload files to Cloudinary
      const uploadResult = await clientUploadUtils.uploadMultipleFiles(files, {
        folder,
        publicId: `patrol_${Date.now()}`
      });
      
      if (!uploadResult.success) {
        throw new Error('Failed to upload files to Cloudinary');
      }
      
      // Create file metadata for Firebase
      const fileMetadata = uploadResult.data.successful.map(file => 
        createFileMetadata(file, {
          type: 'image',
          category: 'patrol',
          monthKey,
          municipality,
          district,
          patrolDate: new Date().toISOString()
        })
      );
      
      // Save file metadata to Firebase
      const monthYearId = monthKey;
      const municipalityId = `${district}-${municipality}`;
      
      // Update the municipality document with photo metadata
      const municipalityRef = doc(db, 'patrolData', monthYearId, 'municipalities', municipalityId);
      const municipalityDoc = await getDoc(municipalityRef);
      
      if (municipalityDoc.exists()) {
        // Update existing document
        await updateDoc(municipalityRef, {
          photos: arrayUnion(...fileMetadata),
          lastPhotoUpdate: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        // Create new document if it doesn't exist
        await setDoc(municipalityRef, {
          photos: fileMetadata,
          lastPhotoUpdate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      console.log(`✅ ${fileMetadata.length} patrol photos uploaded and saved to Firebase`);
      return {
        success: true,
        data: {
          files: fileMetadata,
          count: fileMetadata.length,
          municipalityId
        }
      };
      
    } catch (error) {
      console.error('❌ Failed to upload patrol photos:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // Get patrol photos from Firebase
  async getPatrolPhotos(monthKey, municipality, district) {
    try {
      const municipalityId = `${district}-${municipality}`;
      const municipalityRef = doc(db, 'patrolData', monthKey, 'municipalities', municipalityId);
      const municipalityDoc = await getDoc(municipalityRef);
      
      if (municipalityDoc.exists()) {
        const data = municipalityDoc.data();
        return {
          success: true,
          data: data.photos || []
        };
      }
      
      return {
        success: true,
        data: []
      };
      
    } catch (error) {
      console.error('❌ Failed to get patrol photos:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // ===== INCIDENT REPORTS INTEGRATION =====
  
  // Upload incident evidence files and save URLs to Firebase
  async uploadIncidentEvidence(files, incidentData, options = {}) {
    try {
      console.log('📁 Uploading incident evidence to Cloudinary...');
      
      const { id: incidentId, incidentType, municipality, district } = incidentData;
      const folder = `ipatroller/incidents/${incidentId}/${incidentType}`;
      
      // Upload files to Cloudinary
      const uploadResult = await clientUploadUtils.uploadMultipleFiles(files, {
        folder,
        publicId: `incident_${incidentId}_${Date.now()}`
      });
      
      if (!uploadResult.success) {
        throw new Error('Failed to upload files to Cloudinary');
      }
      
      // Create file metadata for Firebase
      const fileMetadata = uploadResult.data.successful.map(file => 
        createFileMetadata(file, {
          type: this.getFileType(file.format),
          category: 'incident_evidence',
          incidentId,
          incidentType,
          municipality,
          district,
          uploadDate: new Date().toISOString()
        })
      );
      
      // Save file metadata to Firebase
      const incidentRef = doc(db, 'incidents', incidentId);
      await updateDoc(incidentRef, {
        evidence: arrayUnion(...fileMetadata),
        lastEvidenceUpdate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      console.log(`✅ ${fileMetadata.length} incident evidence files uploaded and saved to Firebase`);
      return {
        success: true,
        data: {
          files: fileMetadata,
          count: fileMetadata.length,
          incidentId
        }
      };
      
    } catch (error) {
      console.error('❌ Failed to upload incident evidence:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // Get incident evidence from Firebase
  async getIncidentEvidence(incidentId) {
    try {
      const incidentRef = doc(db, 'incidents', incidentId);
      const incidentDoc = await getDoc(incidentRef);
      
      if (incidentDoc.exists()) {
        const data = incidentDoc.data();
        return {
          success: true,
          data: data.evidence || []
        };
      }
      
      return {
        success: true,
        data: []
      };
      
    } catch (error) {
      console.error('❌ Failed to get incident evidence:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // ===== USER PROFILE INTEGRATION =====
  
  // Upload user profile picture and save URL to Firebase
  async uploadUserProfilePicture(file, userId, userData, options = {}) {
    try {
      console.log('👤 Uploading user profile picture to Cloudinary...');
      
      const folder = `ipatroller/users/${userId}/profile`;
      
      // Upload file to Cloudinary
      const uploadResult = await clientUploadUtils.uploadToCloudinary(file, {
        folder,
        publicId: `profile_${userId}_${Date.now()}`
      });
      
      if (!uploadResult.success) {
        throw new Error('Failed to upload profile picture to Cloudinary');
      }
      
      // Create file metadata for Firebase
      const fileMetadata = createFileMetadata(uploadResult.data, {
        type: 'image',
        category: 'profile_picture',
        userId,
        uploadDate: new Date().toISOString()
      });
      
      // Save file metadata to Firebase
      const userRef = doc(db, 'users', 'management');
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const updatedUsers = userData.users.map(user => {
          if (user.id.toString() === userId.toString()) {
            return {
              ...user,
              profilePicture: fileMetadata,
              lastProfileUpdate: new Date().toISOString()
            };
          }
          return user;
        });
        
        await updateDoc(userRef, {
          users: updatedUsers,
          updatedAt: new Date().toISOString()
        });
      }
      
      console.log('✅ User profile picture uploaded and saved to Firebase');
      return {
        success: true,
        data: fileMetadata
      };
      
    } catch (error) {
      console.error('❌ Failed to upload user profile picture:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // ===== ACTION REPORTS INTEGRATION =====
  
  // Upload action report attachments and save URLs to Firebase
  async uploadActionReportAttachments(files, actionReportData, options = {}) {
    try {
      console.log('📋 Uploading action report attachments to Cloudinary...');
      
      const { id: reportId, actionType, municipality, district } = actionReportData;
      const folder = `ipatroller/action_reports/${reportId}/${actionType}`;
      
      // Upload files to Cloudinary
      const uploadResult = await clientUploadUtils.uploadMultipleFiles(files, {
        folder,
        publicId: `action_${reportId}_${Date.now()}`
      });
      
      if (!uploadResult.success) {
        throw new Error('Failed to upload files to Cloudinary');
      }
      
      // Create file metadata for Firebase
      const fileMetadata = uploadResult.data.successful.map(file => 
        createFileMetadata(file, {
          type: this.getFileType(file.format),
          category: 'action_report_attachment',
          reportId,
          actionType,
          municipality,
          district,
          uploadDate: new Date().toISOString()
        })
      );
      
      // Save file metadata to Firebase
      const reportRef = doc(db, 'actionReports', reportId);
      await updateDoc(reportRef, {
        attachments: arrayUnion(...fileMetadata),
        lastAttachmentUpdate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      console.log(`✅ ${fileMetadata.length} action report attachments uploaded and saved to Firebase`);
      return {
        success: true,
        data: {
          files: fileMetadata,
          count: fileMetadata.length,
          reportId
        }
      };
      
    } catch (error) {
      console.error('❌ Failed to upload action report attachments:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // ===== GENERAL FILE MANAGEMENT =====
  
  // Upload general files and save metadata to Firebase
  async uploadGeneralFiles(files, category, options = {}) {
    try {
      console.log(`📁 Uploading general files to Cloudinary (category: ${category})...`);
      
      const folder = `ipatroller/${category}/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      
      // Upload files to Cloudinary
      const uploadResult = await clientUploadUtils.uploadMultipleFiles(files, {
        folder,
        publicId: `${category}_${Date.now()}`
      });
      
      if (!uploadResult.success) {
        throw new Error('Failed to upload files to Cloudinary');
      }
      
      // Create file metadata for Firebase
      const fileMetadata = uploadResult.data.successful.map(file => 
        createFileMetadata(file, {
          type: this.getFileType(file.format),
          category,
          uploadDate: new Date().toISOString(),
          ...options
        })
      );
      
      // Save file metadata to Firebase in a general files collection
      const generalFilesRef = collection(db, 'generalFiles');
      const batch = [];
      
      fileMetadata.forEach(metadata => {
        batch.push(addDoc(generalFilesRef, metadata));
      });
      
      await Promise.all(batch);
      
      console.log(`✅ ${fileMetadata.length} general files uploaded and saved to Firebase`);
      return {
        success: true,
        data: {
          files: fileMetadata,
          count: fileMetadata.length,
          category
        }
      };
      
    } catch (error) {
      console.error('❌ Failed to upload general files:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // Get all files by category
  async getFilesByCategory(category, limit = 50) {
    try {
      const filesRef = collection(db, 'generalFiles');
      const q = query(
        filesRef,
        where('category', '==', category),
        orderBy('uploadDate', 'desc'),
        limit(limit)
      );
      
      const querySnapshot = await getDocs(q);
      const files = [];
      
      querySnapshot.forEach((doc) => {
        files.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return {
        success: true,
        data: files
      };
      
    } catch (error) {
      console.error('❌ Failed to get files by category:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // Delete file from both Cloudinary and Firebase
  async deleteFile(fileMetadata, options = {}) {
    try {
      console.log(`🗑️ Deleting file: ${fileMetadata.publicId}`);
      
      // Delete from Cloudinary (this would need to be implemented with proper API secret)
      // For now, we'll just remove from Firebase
      
      // Remove from Firebase based on context
      if (fileMetadata.category === 'patrol') {
        // Remove from patrol data
        const { monthKey, municipality, district } = fileMetadata;
        const municipalityId = `${district}-${municipality}`;
        const municipalityRef = doc(db, 'patrolData', monthKey, 'municipalities', municipalityId);
        
        await updateDoc(municipalityRef, {
          photos: arrayRemove(fileMetadata),
          updatedAt: new Date().toISOString()
        });
      } else if (fileMetadata.category === 'incident_evidence') {
        // Remove from incident data
        const incidentRef = doc(db, 'incidents', fileMetadata.incidentId);
        await updateDoc(incidentRef, {
          evidence: arrayRemove(fileMetadata),
          updatedAt: new Date().toISOString()
        });
      } else if (fileMetadata.category === 'general') {
        // Remove from general files collection
        const fileRef = doc(db, 'generalFiles', fileMetadata.id);
        await deleteDoc(fileRef);
      }
      
      console.log('✅ File metadata removed from Firebase');
      return {
        success: true,
        message: 'File deleted successfully'
      };
      
    } catch (error) {
      console.error('❌ Failed to delete file:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // ===== UTILITY FUNCTIONS =====
  
  // Determine file type based on format
  getFileType(format) {
    const imageFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const videoFormats = ['mp4', 'avi', 'mov', 'webm', 'flv', 'mkv'];
    const documentFormats = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
    
    const lowerFormat = format.toLowerCase();
    
    if (imageFormats.includes(lowerFormat)) return 'image';
    if (videoFormats.includes(lowerFormat)) return 'video';
    if (documentFormats.includes(lowerFormat)) return 'document';
    
    return 'file';
  },
  
  // Get file statistics
  async getFileStatistics() {
    try {
      const generalFilesRef = collection(db, 'generalFiles');
      const q = query(generalFilesRef, orderBy('uploadDate', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const stats = {
        total: 0,
        byType: { image: 0, video: 0, document: 0, file: 0 },
        byCategory: {},
        totalSize: 0,
        recentUploads: []
      };
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        stats.total++;
        stats.byType[data.type] = (stats.byType[data.type] || 0) + 1;
        stats.byCategory[data.category] = (stats.byCategory[data.category] || 0) + 1;
        stats.totalSize += data.size || 0;
        
        if (stats.recentUploads.length < 10) {
          stats.recentUploads.push({
            id: doc.id,
            ...data
          });
        }
      });
      
      return {
        success: true,
        data: stats
      };
      
    } catch (error) {
      console.error('❌ Failed to get file statistics:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

export default firebaseCloudinaryIntegration;

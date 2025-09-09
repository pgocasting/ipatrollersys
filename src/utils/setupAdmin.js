import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const setupAdminRole = async () => {
  try {
    const managementRef = doc(db, 'users', 'management');
    await setDoc(managementRef, {
      role: "Admin",
      updatedAt: new Date().toISOString()
    });
    console.log('✅ Admin role set successfully');
    return true;
  } catch (error) {
    console.error('Error setting admin role:', error);
    return false;
  }
};


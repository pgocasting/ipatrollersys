import React, { useState, useEffect } from "react";
import Layout from "./Layout";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Badge } from "./components/ui/badge";
import { useTheme } from "./ThemeContext";
import { useFirebase } from "./hooks/useFirebase";
import { 
  User, 
  Settings as SettingsIcon, 
  Shield, 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  Save, 
  Edit, 
  Eye, 
  EyeOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Bell,
  Lock,
  Key,
  Users,
  Activity,
  FileText,
  Globe,
  Clock,
  RefreshCw,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  X
} from "lucide-react";

export default function Settings({ onLogout, onNavigate, currentPage }) {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { user, saveUsers, getUsers, addUser, updateUser, deleteUser, getCurrentUserRole, hasPermission } = useFirebase();
  const [activeTab, setActiveTab] = useState("admin");
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showSystemModal, setShowSystemModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState(null);

  const [userProfile, setUserProfile] = useState({
    name: user?.displayName || "Administrator",
    email: user?.email || "admin@ipatroller.gov.ph",
    position: "System Administrator",
    department: "IT Department",
    phone: "+63 912 345 6789",
    badgeNumber: "ADMIN-2024-001",
    district: "ALL DISTRICTS",
    municipality: "All Municipalities",
  });

  // Add User form state
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "User",
    district: "1ST DISTRICT",
    password: "",
    confirmPassword: ""
  });

  const [systemSettings, setSystemSettings] = useState({
    autoSave: true,
    notifications: true,
    soundAlerts: false,
    dataRetention: "90",
    backupFrequency: "daily",
    language: "English",
    timezone: "Asia/Manila",
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: "30",
    passwordExpiry: "90",
    loginAttempts: "5",
    ipWhitelist: "",
  });

  const [adminSettings, setAdminSettings] = useState({
    systemMaintenance: false,
    backupEnabled: true,
    auditLogging: true,
    dataEncryption: true,
    apiAccess: false,
    debugMode: false,
  });

  const [userManagement, setUserManagement] = useState([
    {
      id: 1,
      name: "Administrator",
      email: "admin@ipatroller.gov.ph",
      role: "Admin",
      status: "Active",
      lastLogin: "2024-01-15 14:30",
      district: "ALL DISTRICTS",
    },
  ]);

  // Load users from Firestore on component mount
  useEffect(() => {
    loadUsersFromFirestore();
    loadCurrentUserRole();
  }, []);

  // Load current user's role
  const loadCurrentUserRole = async () => {
    try {
      const result = await getCurrentUserRole();
      if (result.success) {
        setCurrentUserRole(result.data);
      }
    } catch (error) {
      console.error('Error loading current user role:', error);
    }
  };

  // Update userProfile and userManagement when Firebase user changes
  useEffect(() => {
    if (user) {
      setUserProfile(prev => ({
        ...prev,
        name: user.displayName || "Administrator",
        email: user.email || "admin@ipatroller.gov.ph",
      }));

      setUserManagement(prev => 
        prev.map(u => 
          u.id === 1 
            ? {
                ...u,
                name: user.displayName || "Administrator",
                email: user.email || "admin@ipatroller.gov.ph",
              }
            : u
        )
      );
    }
  }, [user]);

  // Load users from Firestore
  const loadUsersFromFirestore = async () => {
    try {
      setLoading(true);
      const result = await getUsers();
      if (result.success && result.data && result.data.length > 0) {
        setUserManagement(result.data);
      } else {
        // Initialize with default admin user if no data exists
        const defaultUsers = [
          {
            id: 1,
            name: "Administrator",
            email: "admin@ipatroller.gov.ph",
            role: "Admin",
            status: "Active",
            lastLogin: "2024-01-15 14:30",
            district: "ALL DISTRICTS",
          }
        ];
        setUserManagement(defaultUsers);
        await saveUsers(defaultUsers);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Error loading users from database');
    } finally {
      setLoading(false);
    }
  };

  // Check if user can access admin features
  const canAccessAdmin = () => {
    return currentUserRole && hasPermission(currentUserRole.role, 'Admin');
  };

  const canAccessUserManagement = () => {
    return currentUserRole && hasPermission(currentUserRole.role, 'AdminUser');
  };

  const handleProfileUpdate = () => {
    // In a real app, this would save to backend
    alert("Profile updated successfully!");
  };

  const handleSystemSettingsUpdate = () => {
    // In a real app, this would save to backend
    alert("System settings updated successfully!");
  };

  const handleSecuritySettingsUpdate = () => {
    // In a real app, this would save to backend
    alert("Security settings updated successfully!");
  };

  const handleExportData = () => {
    // Export all data to JSON
    const exportData = {
          patrolData: [],
    incidentsData: [],
      settings: {
        userProfile,
        systemSettings,
        securitySettings,
      },
      exportDate: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `patrol-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  const handleImportData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);

          alert("Data imported successfully!");
          setShowImportModal(false);
        } catch (error) {
          alert("Error importing data. Please check the file format.");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleResetData = () => {
    if (confirm("Are you sure you want to reset all data? This action cannot be undone.")) {

      alert("All data has been reset. Please refresh the page.");
      setShowResetModal(false);
    }
  };

  const handleAdminSettingsUpdate = () => {
    alert("Admin settings updated successfully!");
  };

  const handleUserStatusToggle = async (userId) => {
    try {
      const userToUpdate = userManagement.find(user => user.id === userId);
      if (!userToUpdate) return;

      const updates = {
        status: userToUpdate.status === 'Active' ? 'Inactive' : 'Active'
      };

      const result = await updateUser(userId, updates);
      if (result.success) {
        const updatedUsers = userManagement.map(user => 
          user.id === userId 
            ? { ...user, status: updates.status }
            : user
        );
        setUserManagement(updatedUsers);
        alert("User status updated successfully!");
      } else {
        alert('Error updating user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Error updating user status');
    }
  };

  const handleDeleteUser = (userId) => {
    if (confirm("Are you sure you want to delete this user?")) {
      setUserManagement(prevUsers => prevUsers.filter(user => user.id !== userId));
      alert("User deleted successfully!");
    }
  };

  const handleDeleteUserClick = (user) => {
    // Prevent deleting the current administrator
    if (user.id === 1) {
      alert("Cannot delete the main administrator account!");
      return;
    }
    
    setUserToDelete(user);
    setShowDeleteUserModal(true);
  };

  const handleConfirmDeleteUser = async () => {
    if (userToDelete) {
      try {
        const result = await deleteUser(userToDelete.id);
        if (result.success) {
          const updatedUsers = userManagement.filter(user => user.id !== userToDelete.id);
          setUserManagement(updatedUsers);
          setShowDeleteUserModal(false);
          setUserToDelete(null);
          alert("User account deleted successfully!");
        } else {
          alert('Error deleting user account');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user account');
      }
    }
  };

  const handleCancelDeleteUser = () => {
    setShowDeleteUserModal(false);
    setUserToDelete(null);
  };

  const handleAddUser = async () => {
    // Validate form
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert("Please fill in all required fields!");
      return;
    }

    if (newUser.password !== newUser.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    if (newUser.password.length < 6) {
      alert("Password must be at least 6 characters long!");
      return;
    }

    // Check if email already exists
    const emailExists = userManagement.some(user => user.email === newUser.email);
    if (emailExists) {
      alert("Email already exists!");
      return;
    }

    try {
      // Prepare user data for Firestore
      const userData = {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: "Active",
        lastLogin: "Never",
        district: newUser.district,
      };

      const result = await addUser(userData);
      if (result.success) {
        // Add the new user to local state
        setUserManagement(prev => [...prev, result.user]);
        
        // Reset form
        setNewUser({
          name: "",
          email: "",
          role: "User",
          district: "1ST DISTRICT",
          password: "",
          confirmPassword: ""
        });
        
        setShowAddUserModal(false);
        alert("User added successfully!");
      } else {
        alert('Error adding user to database');
      }
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Error adding user to database');
    }
  };

  const handleResetAddUserForm = () => {
    setNewUser({
      name: "",
      email: "",
      role: "User",
      district: "1ST DISTRICT",
      password: "",
      confirmPassword: ""
    });
  };

  const tabs = [
    { id: "admin", label: "Admin Panel", icon: "👑" },
    { id: "users", label: "User Management", icon: "👥" },
    { id: "themesettings", label: "Theme Settings", icon: "⚙️" },
    { id: "security", label: "Change Password", icon: "🔒" },
  ];

  return (
    <Layout onLogout={onLogout} onNavigate={onNavigate} currentPage={currentPage}>
      <section className="flex-1 p-6 space-y-6">
                 {/* Header */}
         <div>
           <div className="flex items-center justify-between mb-2">
             <h1 className={`text-3xl font-bold transition-colors duration-300 ${
               isDarkMode ? 'text-white' : 'text-gray-900'
             }`}>
               Settings
             </h1>
             {currentUserRole && (
               <Badge className={
                 currentUserRole.role === 'Admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                 currentUserRole.role === 'AdminUser' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
               }>
                 {currentUserRole.role}
               </Badge>
             )}
           </div>
           <p className={`text-lg transition-colors duration-300 ${
             isDarkMode ? 'text-gray-400' : 'text-gray-600'
           }`}>
             Manage your account preferences and system configuration
           </p>
         </div>

        {/* Tab Navigation */}
        <div className={`flex space-x-1 rounded-lg p-1 transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
        }`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : isDarkMode 
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Admin Panel Tab */}
        {activeTab === "admin" && (
          <div className="space-y-6">
            <Card className={`backdrop-blur-sm border-0 shadow-lg ${
              isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'
            }`}>
              <CardHeader>
                <CardTitle className={`text-lg font-semibold transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  System Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className={`p-4 rounded-lg border ${
                    isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>Total Users</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{userManagement.length}</p>
                      </div>
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'
                      }`}>
                        <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </div>
                  <div className={`p-4 rounded-lg border ${
                    isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-green-50 border-green-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>Active Users</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {userManagement.filter(u => u.status === 'Active').length}
                        </p>
                      </div>
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        isDarkMode ? 'bg-green-900/30' : 'bg-green-100'
                      }`}>
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                  </div>
                  <div className={`p-4 rounded-lg border ${
                    isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-purple-50 border-purple-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>System Status</p>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">Online</p>
                      </div>
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100'
                      }`}>
                        <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

                 {/* User Management Tab */}
         {activeTab === "users" && (
           <Card className={`backdrop-blur-sm border-0 shadow-lg ${
             isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'
           }`}>
             <CardHeader>
               <div className="flex items-center justify-between">
                 <CardTitle className={`text-lg font-semibold transition-colors duration-300 ${
                   isDarkMode ? 'text-white' : 'text-gray-900'
                 }`}>
                   User Management
                 </CardTitle>
                                   {canAccessUserManagement() ? (
                    <Button
                      onClick={() => setShowAddUserModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add User
                    </Button>
                  ) : (
                    <div className="text-sm text-gray-500">
                      Admin access required
                    </div>
                  )}
               </div>
             </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b transition-colors duration-300 ${
                      isDarkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      <th className={`text-left p-3 font-medium transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>Name</th>
                      <th className={`text-left p-3 font-medium transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>Email</th>
                      <th className={`text-left p-3 font-medium transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>Role</th>
                      <th className={`text-left p-3 font-medium transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>Status</th>
                      <th className={`text-left p-3 font-medium transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>District</th>
                      <th className={`text-left p-3 font-medium transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>Last Login</th>
                      <th className={`text-left p-3 font-medium transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userManagement.map((user) => (
                      <tr key={user.id} className={`border-b transition-colors duration-300 ${
                        isDarkMode ? 'border-gray-700 hover:bg-gray-800/50' : 'border-gray-200 hover:bg-gray-50'
                      }`}>
                        <td className="p-3">
                          <p className={`font-medium transition-colors duration-300 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {user.name}
                          </p>
                        </td>
                        <td className="p-3">
                          <p className={`transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {user.email}
                          </p>
                        </td>
                                                 <td className="p-3">
                           <Badge className={
                             user.role === 'Admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                             user.role === 'AdminUser' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                             'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                           }>
                             {user.role}
                           </Badge>
                         </td>
                        <td className="p-3">
                          <Badge className={user.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}>
                            {user.status}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge className={`transition-colors duration-300 ${
                            isDarkMode ? 'bg-gray-800/50 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                            {user.district}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <p className={`text-sm transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {user.lastLogin}
                          </p>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUserStatusToggle(user.id)}
                              className={`transition-colors duration-300 ${
                                isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-gray-100' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                            </Button>
                                                         <Button
                               size="sm"
                               variant="destructive"
                               onClick={() => handleDeleteUserClick(user)}
                               disabled={user.id === 1}
                               className={user.id === 1 ? 'opacity-50 cursor-not-allowed' : ''}
                             >
                               Delete
                             </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Theme Settings Tab */}
        {activeTab === "themesettings" && (
          <div className="space-y-6">
            <Card className={`backdrop-blur-sm border-0 shadow-lg ${
              isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'
            }`}>
              <CardHeader>
                <CardTitle className={`text-lg font-semibold transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Theme Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className={`transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Dark Mode
                    </Label>
                    <p className={`text-sm transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Switch between light and dark themes
                    </p>
                  </div>
                  <Button
                    onClick={toggleDarkMode}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <span>{isDarkMode ? '🌙' : '☀️'}</span>
                    {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Change Password Tab */}
        {activeTab === "security" && (
          <Card className={`backdrop-blur-sm border-0 shadow-lg ${
            isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'
          }`}>
            <CardHeader>
              <CardTitle className={`text-lg font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="currentPassword" className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Current Password
                  </Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    placeholder="Enter your current password"
                    className={`mt-1 transition-colors duration-300 ${
                      isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
                <div>
                  <Label htmlFor="newPassword" className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    New Password
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter your new password"
                    className={`mt-1 transition-colors duration-300 ${
                      isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  />
                  <p className={`text-xs mt-1 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character
                  </p>
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your new password"
                    className={`mt-1 transition-colors duration-300 ${
                      isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <Button
                    onClick={handleSecuritySettingsUpdate}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Reset form fields
                      document.getElementById('currentPassword').value = '';
                      document.getElementById('newPassword').value = '';
                      document.getElementById('confirmPassword').value = '';
                    }}
                    className={`transition-colors duration-300 ${
                      isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Clear Form
                  </Button>
                </div>
              </div>
            </CardContent>
                     </Card>
         )}
       </section>

       {/* Add User Modal */}
       {showAddUserModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
           <div className={`w-full max-w-md p-6 rounded-lg shadow-xl ${
             isDarkMode ? 'bg-gray-800' : 'bg-white'
           }`}>
             <div className="flex items-center justify-between mb-6">
               <h3 className={`text-xl font-semibold transition-colors duration-300 ${
                 isDarkMode ? 'text-white' : 'text-gray-900'
               }`}>
                 Add New User
               </h3>
               <Button
                 variant="ghost"
                 size="sm"
                 onClick={() => setShowAddUserModal(false)}
                 className="text-gray-500 hover:text-gray-700"
               >
                 <X className="w-4 h-4" />
               </Button>
             </div>

             <div className="space-y-4">
               <div>
                 <Label htmlFor="newUserName" className={`transition-colors duration-300 ${
                   isDarkMode ? 'text-gray-300' : 'text-gray-700'
                 }`}>
                   Full Name *
                 </Label>
                 <Input
                   id="newUserName"
                   value={newUser.name}
                   onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                   placeholder="Enter full name"
                   className={`mt-1 transition-colors duration-300 ${
                     isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                   }`}
                 />
               </div>

               <div>
                 <Label htmlFor="newUserEmail" className={`transition-colors duration-300 ${
                   isDarkMode ? 'text-gray-300' : 'text-gray-700'
                 }`}>
                   Email Address *
                 </Label>
                 <Input
                   id="newUserEmail"
                   type="email"
                   value={newUser.email}
                   onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                   placeholder="Enter email address"
                   className={`mt-1 transition-colors duration-300 ${
                     isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                   }`}
                 />
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <Label htmlFor="newUserRole" className={`transition-colors duration-300 ${
                     isDarkMode ? 'text-gray-300' : 'text-gray-700'
                   }`}>
                     Role
                   </Label>
                                       <select
                      id="newUserRole"
                      value={newUser.role}
                      onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                      className={`w-full mt-1 px-3 py-2 border rounded-md transition-colors duration-300 ${
                        isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                      }`}
                    >
                      <option value="Admin">Admin</option>
                      <option value="AdminUser">AdminUser</option>
                      <option value="User">User</option>
                    </select>
                 </div>

                 <div>
                   <Label htmlFor="newUserDistrict" className={`transition-colors duration-300 ${
                     isDarkMode ? 'text-gray-300' : 'text-gray-700'
                   }`}>
                     District
                   </Label>
                   <select
                     id="newUserDistrict"
                     value={newUser.district}
                     onChange={(e) => setNewUser(prev => ({ ...prev, district: e.target.value }))}
                     className={`w-full mt-1 px-3 py-2 border rounded-md transition-colors duration-300 ${
                       isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                     }`}
                   >
                     <option value="1ST DISTRICT">1ST DISTRICT</option>
                     <option value="2ND DISTRICT">2ND DISTRICT</option>
                     <option value="3RD DISTRICT">3RD DISTRICT</option>
                     <option value="ALL DISTRICTS">ALL DISTRICTS</option>
                   </select>
                 </div>
               </div>

               <div>
                 <Label htmlFor="newUserPassword" className={`transition-colors duration-300 ${
                   isDarkMode ? 'text-gray-300' : 'text-gray-700'
                 }`}>
                   Password *
                 </Label>
                 <Input
                   id="newUserPassword"
                   type="password"
                   value={newUser.password}
                   onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                   placeholder="Enter password"
                   className={`mt-1 transition-colors duration-300 ${
                     isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                   }`}
                 />
               </div>

               <div>
                 <Label htmlFor="newUserConfirmPassword" className={`transition-colors duration-300 ${
                   isDarkMode ? 'text-gray-300' : 'text-gray-700'
                 }`}>
                   Confirm Password *
                 </Label>
                 <Input
                   id="newUserConfirmPassword"
                   type="password"
                   value={newUser.confirmPassword}
                   onChange={(e) => setNewUser(prev => ({ ...prev, confirmPassword: e.target.value }))}
                   placeholder="Confirm password"
                   className={`mt-1 transition-colors duration-300 ${
                     isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                   }`}
                 />
               </div>
             </div>

             <div className="flex gap-3 mt-6">
               <Button
                 onClick={handleAddUser}
                 className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
               >
                 <Plus className="w-4 h-4 mr-2" />
                 Add User
               </Button>
               <Button
                 variant="outline"
                 onClick={handleResetAddUserForm}
                 className={`transition-colors duration-300 ${
                   isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                 }`}
               >
                 Reset
               </Button>
               <Button
                 variant="outline"
                 onClick={() => setShowAddUserModal(false)}
                 className={`transition-colors duration-300 ${
                   isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                 }`}
               >
                 Cancel
               </Button>
             </div>
           </div>
         </div>
                )}

         {/* Delete User Confirmation Modal */}
         {showDeleteUserModal && userToDelete && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
             <div className={`w-full max-w-md p-6 rounded-lg shadow-xl ${
               isDarkMode ? 'bg-gray-800' : 'bg-white'
             }`}>
               <div className="flex items-center justify-between mb-6">
                 <h3 className={`text-xl font-semibold transition-colors duration-300 ${
                   isDarkMode ? 'text-white' : 'text-gray-900'
                 }`}>
                   Delete User Account
                 </h3>
                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={handleCancelDeleteUser}
                   className="text-gray-500 hover:text-gray-700"
                 >
                   <X className="w-4 h-4" />
                 </Button>
               </div>

               <div className="space-y-4">
                 <div className={`p-4 rounded-lg border ${
                   isDarkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'
                 }`}>
                   <div className="flex items-center gap-3">
                     <AlertTriangle className="h-5 w-5 text-red-500" />
                     <p className={`text-sm font-medium transition-colors duration-300 ${
                       isDarkMode ? 'text-red-300' : 'text-red-700'
                     }`}>
                       Warning: This action cannot be undone!
                     </p>
                   </div>
                 </div>

                 <div className={`p-4 rounded-lg border ${
                   isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                 }`}>
                   <h4 className={`font-semibold mb-2 transition-colors duration-300 ${
                     isDarkMode ? 'text-white' : 'text-gray-900'
                   }`}>
                     User Details
                   </h4>
                   <div className="space-y-2">
                     <div className="flex justify-between">
                       <span className={`text-sm transition-colors duration-300 ${
                         isDarkMode ? 'text-gray-300' : 'text-gray-600'
                       }`}>Name:</span>
                       <span className={`text-sm font-medium transition-colors duration-300 ${
                         isDarkMode ? 'text-white' : 'text-gray-900'
                       }`}>{userToDelete.name}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className={`text-sm transition-colors duration-300 ${
                         isDarkMode ? 'text-gray-300' : 'text-gray-600'
                       }`}>Email:</span>
                       <span className={`text-sm font-medium transition-colors duration-300 ${
                         isDarkMode ? 'text-white' : 'text-gray-900'
                       }`}>{userToDelete.email}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className={`text-sm transition-colors duration-300 ${
                         isDarkMode ? 'text-gray-300' : 'text-gray-600'
                       }`}>Role:</span>
                                               <Badge className={
                          userToDelete.role === 'Admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                          userToDelete.role === 'AdminUser' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        }>
                          {userToDelete.role}
                        </Badge>
                     </div>
                     <div className="flex justify-between">
                       <span className={`text-sm transition-colors duration-300 ${
                         isDarkMode ? 'text-gray-300' : 'text-gray-600'
                       }`}>District:</span>
                       <span className={`text-sm font-medium transition-colors duration-300 ${
                         isDarkMode ? 'text-white' : 'text-gray-900'
                       }`}>{userToDelete.district}</span>
                     </div>
                   </div>
                 </div>

                 <div className={`p-3 rounded-lg border ${
                   isDarkMode ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'
                 }`}>
                   <div className="flex items-start gap-3">
                     <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                     <div>
                       <p className={`text-sm font-medium transition-colors duration-300 ${
                         isDarkMode ? 'text-yellow-300' : 'text-yellow-700'
                       }`}>
                         What will be deleted:
                       </p>
                       <ul className={`text-xs mt-1 space-y-1 transition-colors duration-300 ${
                         isDarkMode ? 'text-yellow-200' : 'text-yellow-600'
                       }`}>
                         <li>• User account and login credentials</li>
                         <li>• All associated data and permissions</li>
                         <li>• User activity history</li>
                         <li>• Access to the system</li>
                       </ul>
                     </div>
                   </div>
                 </div>
               </div>

               <div className="flex gap-3 mt-6">
                 <Button
                   onClick={handleConfirmDeleteUser}
                   className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                 >
                   <Trash2 className="w-4 h-4 mr-2" />
                   Delete Account
                 </Button>
                 <Button
                   variant="outline"
                   onClick={handleCancelDeleteUser}
                   className={`transition-colors duration-300 ${
                     isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                   }`}
                 >
                   Cancel
                 </Button>
               </div>
             </div>
           </div>
         )}
       </Layout>
     );
   }
import React, { useState, useEffect } from "react";
import Layout from "./Layout";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Badge } from "./components/ui/badge";
import { useTheme } from "./ThemeContext";
import { useFirebase } from "./hooks/useFirebase";
import FirebaseStatus from "./components/FirebaseStatus";
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
                 {/* Enhanced Header */}
        <div className={`mb-8 p-8 rounded-2xl shadow-lg transition-all duration-300 ${
          isDarkMode ? 'bg-gradient-to-r from-gray-900/80 to-gray-800/80 border border-gray-700' : 'bg-gradient-to-r from-white to-gray-50 border border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                isDarkMode ? 'bg-blue-900/30 border border-blue-700/50' : 'bg-blue-100 border border-blue-200'
              }`}>
                <SettingsIcon className={`w-8 h-8 transition-colors duration-300 ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`} />
              </div>
              <div>
                <h1 className={`text-4xl font-bold mb-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Settings & Configuration
                </h1>
                <p className={`text-lg transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Manage your account preferences, system configuration, and user management
                </p>
              </div>
            </div>
            {currentUserRole && (
              <div className="flex items-center gap-3">
                <div className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  currentUserRole.role === 'Admin' ? 'bg-purple-900/40 text-purple-200 border border-purple-700/50' :
                  currentUserRole.role === 'AdminUser' ? 'bg-blue-900/40 text-blue-200 border border-blue-700/50' :
                  'bg-green-900/40 text-green-200 border border-green-700/50'
                }`}>
                  <Shield className="w-4 h-4 inline mr-2" />
                  {currentUserRole.role}
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  currentUserRole.role === 'Admin' ? 'bg-purple-400 animate-pulse' : 
                  currentUserRole.role === 'AdminUser' ? 'bg-blue-400 animate-pulse' : 
                  'bg-green-400 animate-pulse'
                }`}></div>
              </div>
            )}
          </div>
          
          {/* Quick Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`text-center p-4 rounded-xl transition-all duration-300 ${
              isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/70 border border-gray-200'
            }`}>
              <p className={`text-xs font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Total Users</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{userManagement.length}</p>
              <p className={`text-xs transition-colors duration-300 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-500'
              }`}>Registered</p>
            </div>
            
            <div className={`text-center p-4 rounded-xl transition-all duration-300 ${
              isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/70 border border-gray-200'
            }`}>
              <p className={`text-xs font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Active Users</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {userManagement.filter(u => u.status === 'Active').length}
              </p>
              <p className={`text-xs transition-colors duration-300 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-500'
              }`}>Online</p>
            </div>
            
            <div className={`text-center p-4 rounded-xl transition-all duration-300 ${
              isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/70 border border-gray-200'
            }`}>
              <p className={`text-xs font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>System Status</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">Online</p>
              <p className={`text-xs transition-colors duration-300 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-500'
              }`}>Operational</p>
            </div>
            
            <div className={`text-center p-4 rounded-xl transition-all duration-300 ${
              isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/70 border border-gray-200'
            }`}>
              <p className={`text-xs font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Theme</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {isDarkMode ? '🌙' : '☀️'}
              </p>
              <p className={`text-xs transition-colors duration-300 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-500'
              }`}>{isDarkMode ? 'Dark' : 'Light'}</p>
            </div>
          </div>
        </div>

        {/* Enhanced Tab Navigation */}
        <div className={`mb-8 p-2 rounded-2xl transition-all duration-300 ${
          isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-100/50 border border-gray-200'
        }`}>
          <div className="flex space-x-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-6 py-4 rounded-xl text-sm font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? isDarkMode 
                      ? 'bg-blue-600 text-white shadow-lg transform scale-105' 
                      : 'bg-blue-600 text-white shadow-lg transform scale-105'
                    : isDarkMode 
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 hover:scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200 hover:scale-105'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="font-semibold">{tab.label}</span>
                {activeTab === tab.id && (
                  <div className={`w-2 h-2 rounded-full ${
                    isDarkMode ? 'bg-white' : 'bg-white'
                  }`}></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Enhanced Admin Panel Tab */}
        {activeTab === "admin" && (
          <div className="space-y-8">
            {/* System Overview Card */}
            <Card className={`backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 ${
              isDarkMode ? 'bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
            }`}>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl transition-all duration-300 ${
                    isDarkMode ? 'bg-blue-600/20 border border-blue-500/30' : 'bg-blue-100 border border-blue-200'
                  }`}>
                    <Activity className={`w-6 h-6 transition-colors duration-300 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                  </div>
                  <div>
                    <CardTitle className={`text-2xl font-bold transition-colors duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      System Overview
                    </CardTitle>
                    <p className={`text-sm transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Real-time system status and user statistics
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className={`p-6 rounded-xl border transition-all duration-300 hover:scale-105 ${
                    isDarkMode ? 'bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-700/30' : 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        isDarkMode ? 'bg-blue-600/20' : 'bg-blue-100'
                      }`}>
                        <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <Badge variant="outline" className="text-xs">Total</Badge>
                    </div>
                    <div>
                      <p className={`text-sm font-medium transition-colors duration-300 ${
                        isDarkMode ? 'text-blue-200' : 'text-blue-700'
                      }`}>Registered Users</p>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">{userManagement.length}</p>
                      <p className={`text-xs transition-colors duration-300 ${
                        isDarkMode ? 'text-blue-300' : 'text-blue-600'
                      }`}>Active accounts</p>
                    </div>
                  </div>
                  
                  <div className={`p-6 rounded-xl border transition-all duration-300 hover:scale-105 ${
                    isDarkMode ? 'bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-700/30' : 'bg-gradient-to-br from-green-50 to-green-100/50 border-green-200'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        isDarkMode ? 'bg-green-600/20' : 'bg-green-100'
                      }`}>
                        <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <Badge variant="outline" className="text-xs">Online</Badge>
                    </div>
                    <div>
                      <p className={`text-sm font-medium transition-colors duration-300 ${
                        isDarkMode ? 'text-green-200' : 'text-green-700'
                      }`}>Active Users</p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                        {userManagement.filter(u => u.status === 'Active').length}
                      </p>
                      <p className={`text-xs transition-colors duration-300 ${
                        isDarkMode ? 'text-green-300' : 'text-green-600'
                      }`}>Currently online</p>
                    </div>
                  </div>
                  
                  <div className={`p-6 rounded-xl border transition-all duration-300 hover:scale-105 ${
                    isDarkMode ? 'bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-700/30' : 'bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        isDarkMode ? 'bg-purple-600/20' : 'bg-purple-100'
                      }`}>
                        <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <Badge variant="outline" className="text-xs">Live</Badge>
                    </div>
                    <div>
                      <p className={`text-sm font-medium transition-colors duration-300 ${
                        isDarkMode ? 'text-purple-200' : 'text-purple-700'
                      }`}>System Status</p>
                      <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">Online</p>
                      <p className={`text-xs transition-colors duration-300 ${
                        isDarkMode ? 'text-purple-300' : 'text-purple-600'
                      }`}>All systems operational</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Firebase Connection Status */}
            <Card className={`backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 ${
              isDarkMode ? 'bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
            }`}>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl transition-all duration-300 ${
                    isDarkMode ? 'bg-orange-600/20 border border-orange-500/30' : 'bg-orange-100 border border-orange-200'
                  }`}>
                    <Database className={`w-6 h-6 transition-colors duration-300 ${
                      isDarkMode ? 'text-orange-400' : 'text-orange-600'
                    }`} />
                  </div>
                  <div>
                    <CardTitle className={`text-2xl font-bold transition-colors duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Firebase Connection Status
                    </CardTitle>
                    <p className={`text-sm transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Monitor Firebase services and diagnose connection issues
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <FirebaseStatus />
              </CardContent>
            </Card>
          </div>
        )}

                 {/* Enhanced User Management Tab */}
         {activeTab === "users" && (
           <Card className={`backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 ${
             isDarkMode ? 'bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
           }`}>
             <CardHeader className="pb-4">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className={`p-3 rounded-xl transition-all duration-300 ${
                     isDarkMode ? 'bg-green-600/20 border border-green-500/30' : 'bg-green-100 border border-green-200'
                   }`}>
                     <Users className={`w-6 h-6 transition-colors duration-300 ${
                       isDarkMode ? 'text-green-400' : 'text-green-600'
                     }`} />
                   </div>
                   <div>
                     <CardTitle className={`text-2xl font-bold transition-colors duration-300 ${
                       isDarkMode ? 'text-white' : 'text-gray-900'
                     }`}>
                       User Management
                     </CardTitle>
                     <p className={`text-sm transition-colors duration-300 ${
                       isDarkMode ? 'text-gray-400' : 'text-gray-600'
                     }`}>
                       Manage user accounts, roles, and permissions
                     </p>
                   </div>
                 </div>
                 {canAccessUserManagement() ? (
                   <Button
                     onClick={() => setShowAddUserModal(true)}
                     className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300"
                   >
                     <Plus className="w-5 h-5 mr-2" />
                     Add New User
                   </Button>
                 ) : (
                   <div className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                     isDarkMode ? 'bg-gray-700/50 text-gray-300 border border-gray-600' : 'bg-gray-100 text-gray-600 border border-gray-200'
                   }`}>
                     <Lock className="w-4 h-4 inline mr-2" />
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

        {/* Enhanced Theme Settings Tab */}
        {activeTab === "themesettings" && (
          <div className="space-y-8">
            <Card className={`backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 ${
              isDarkMode ? 'bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
            }`}>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl transition-all duration-300 ${
                    isDarkMode ? 'bg-orange-600/20 border border-orange-500/30' : 'bg-orange-100 border border-orange-200'
                  }`}>
                    <Globe className={`w-6 h-6 transition-colors duration-300 ${
                      isDarkMode ? 'text-orange-400' : 'text-orange-600'
                    }`} />
                  </div>
                  <div>
                    <CardTitle className={`text-2xl font-bold transition-colors duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Theme & Appearance
                    </CardTitle>
                    <p className={`text-sm transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Customize your visual experience and interface preferences
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {/* Theme Toggle Section */}
                  <div className={`p-6 rounded-xl border transition-all duration-300 ${
                    isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Label className={`text-lg font-semibold transition-colors duration-300 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          Theme Mode
                        </Label>
                        <p className={`text-sm mt-1 transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Switch between light and dark themes for optimal viewing experience
                        </p>
                      </div>
                      <Button
                        onClick={toggleDarkMode}
                        variant="outline"
                        className={`flex items-center gap-3 px-6 py-3 text-lg font-medium transition-all duration-300 hover:scale-105 ${
                          isDarkMode 
                            ? 'border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white' 
                            : 'border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white'
                        }`}
                      >
                        <span className="text-2xl">{isDarkMode ? '🌙' : '☀️'}</span>
                        <span>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
                      </Button>
                    </div>
                  </div>
                  
                  {/* Theme Preview Section */}
                  <div className={`p-6 rounded-xl border transition-all duration-300 ${
                    isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Current Theme Preview
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className={`p-4 rounded-lg border transition-all duration-300 ${
                        isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-white border-gray-200'
                      }`}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-3 h-3 rounded-full ${
                            isDarkMode ? 'bg-gray-400' : 'bg-gray-600'
                          }`}></div>
                          <div className={`w-3 h-3 rounded-full ${
                            isDarkMode ? 'bg-gray-500' : 'bg-gray-400'
                          }`}></div>
                          <div className={`w-3 h-3 rounded-full ${
                            isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                          }`}></div>
                        </div>
                        <div className={`h-20 rounded transition-all duration-300 ${
                          isDarkMode ? 'bg-gray-600' : 'bg-gray-100'
                        }`}></div>
                        <p className={`text-sm mt-2 transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {isDarkMode ? 'Dark theme active' : 'Light theme active'}
                        </p>
                      </div>
                      
                      <div className={`p-4 rounded-lg border transition-all duration-300 ${
                        isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-white border-gray-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`w-2 h-2 rounded-full ${
                            isDarkMode ? 'bg-blue-400' : 'bg-blue-600'
                          }`}></div>
                          <div className={`w-2 h-2 rounded-full ${
                            isDarkMode ? 'bg-green-400' : 'bg-green-600'
                          }`}></div>
                          <div className={`w-2 h-2 rounded-full ${
                            isDarkMode ? 'bg-purple-400' : 'bg-purple-600'
                          }`}></div>
                        </div>
                        <div className="space-y-2">
                          <div className={`h-3 rounded transition-all duration-300 ${
                            isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                          }`}></div>
                          <div className={`h-3 rounded transition-all duration-300 ${
                            isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                          }`}></div>
                          <div className={`h-3 rounded transition-all duration-300 ${
                            isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                          }`}></div>
                        </div>
                        <p className={`text-sm mt-2 transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Interface elements
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Enhanced Change Password Tab */}
        {activeTab === "security" && (
          <Card className={`backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 ${
            isDarkMode ? 'bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
          }`}>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl transition-all duration-300 ${
                  isDarkMode ? 'bg-red-600/20 border border-red-500/30' : 'bg-red-100 border border-red-200'
                }`}>
                  <Lock className={`w-6 h-6 transition-colors duration-300 ${
                    isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`} />
                </div>
                <div>
                  <CardTitle className={`text-2xl font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Security & Password
                  </CardTitle>
                  <p className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Update your password and manage account security settings
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* Password Requirements Section */}
                <div className={`p-6 rounded-xl border transition-all duration-300 ${
                  isDarkMode ? 'bg-blue-900/20 border-blue-700/30' : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg transition-all duration-300 ${
                      isDarkMode ? 'bg-blue-600/20' : 'bg-blue-100'
                    }`}>
                      <Shield className={`w-5 h-5 transition-colors duration-300 ${
                        isDarkMode ? 'text-blue-400' : 'text-blue-600'
                      }`} />
                    </div>
                    <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                      isDarkMode ? 'text-blue-200' : 'text-blue-700'
                    }`}>
                      Password Requirements
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`flex items-center gap-2 p-3 rounded-lg transition-all duration-300 ${
                      isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100/50'
                    }`}>
                      <CheckCircle className={`w-4 h-4 text-green-500`} />
                      <span className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-blue-200' : 'text-blue-700'
                      }`}>Minimum 8 characters</span>
                    </div>
                    <div className={`flex items-center gap-2 p-3 rounded-lg transition-all duration-300 ${
                      isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100/50'
                    }`}>
                      <CheckCircle className={`w-4 h-4 text-green-500`} />
                      <span className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-blue-200' : 'text-blue-700'
                      }`}>Uppercase letter</span>
                    </div>
                    <div className={`flex items-center gap-2 p-3 rounded-lg transition-all duration-300 ${
                      isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100/50'
                    }`}>
                      <CheckCircle className={`w-4 h-4 text-green-500`} />
                      <span className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-blue-200' : 'text-blue-700'
                      }`}>Lowercase letter</span>
                    </div>
                    <div className={`flex items-center gap-2 p-3 rounded-lg transition-all duration-300 ${
                      isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100/50'
                    }`}>
                      <CheckCircle className={`w-4 h-4 text-green-500`} />
                      <span className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-blue-200' : 'text-blue-700'
                      }`}>Special character</span>
                    </div>
                  </div>
                </div>
                
                {/* Password Change Form */}
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="currentPassword" className={`text-lg font-semibold transition-colors duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Current Password
                    </Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder="Enter your current password"
                      className={`mt-2 transition-colors duration-300 ${
                        isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPassword" className={`text-lg font-semibold transition-colors duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      New Password
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Enter your new password"
                      className={`mt-2 transition-colors duration-300 ${
                        isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword" className={`text-lg font-semibold transition-colors duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your new password"
                      className={`mt-2 transition-colors duration-300 ${
                        isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-4 pt-4">
                    <Button
                      onClick={handleSecuritySettingsUpdate}
                      className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Key className="w-5 h-5 mr-2" />
                      Update Password
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Reset form fields
                        document.getElementById('currentPassword').value = '';
                        document.getElementById('newPassword').value = '';
                        document.getElementById('confirmPassword').value = '';
                      }}
                      className={`px-8 py-3 transition-all duration-300 hover:scale-105 ${
                        isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Clear Form
                    </Button>
                  </div>
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
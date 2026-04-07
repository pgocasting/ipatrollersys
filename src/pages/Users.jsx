import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { usersLog, createSectionGroup, CONSOLE_GROUPS } from '../utils/consoleGrouping';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { useFirebase } from "../hooks/useFirebase";
import { doc, getDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from "sonner";
import { AlertTriangle, Loader2, User, UserPlus, Users as UsersIcon, Shield, Search, Mail, Phone, Building2, MapPin, Edit2, Trash2 } from "lucide-react";
import { logUserManagementAction, logAdminAccess } from '../utils/adminLogger';
import { useAuth } from '../contexts/AuthContext';

export default function Users({ onLogout, onNavigate, currentPage }) {
  const { user, getUsers, createUserByAdmin, updateUser, deleteUser } = useFirebase();
  const { isAdmin, userAccessLevel, userFirstName, userLastName, userUsername, userMunicipality, userDepartment } = useAuth();
  const [tableLoading, setTableLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAccessLevel, setFilterAccessLevel] = useState("all");
  const [presenceMap, setPresenceMap] = useState({});

  useEffect(() => {
    if (!isAdmin) return;
    const presenceRef = collection(db, 'userPresence');
    const unsubscribe = onSnapshot(presenceRef, (snapshot) => {
      const pMap = {};
      snapshot.docs.forEach(doc => {
        pMap[doc.id] = doc.data();
      });
      setPresenceMap(pMap);
    }, (error) => {
      console.error("Error fetching presence data:", error);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const municipalities = [
    "Abucay",
    "Bagac",
    "Balanga City",
    "Dinalupihan",
    "Hermosa",
    "Limay",
    "Mariveles",
    "Morong",
    "Orani",
    "Orion",
    "Pilar",
    "Samal",
    "Not Municipality",
  ];

  const viewingPageOptions = [
    { value: "dashboard", label: "Dashboard" },
    { value: "ipatroller", label: "I-Patroller" },
    { value: "commandcenter", label: "Command Center" },
    { value: "actioncenter", label: "Action Center" },
    { value: "incidents", label: "Incidents" },
  ];

  const [newUser, setNewUser] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    municipality: "",
    viewingPage: "",
    phoneNumber: "",
    role: "User",
    accessLevel: "action-center",
    department: "",
  });

  const [editUser, setEditUser] = useState({
    firstName: "",
    lastName: "",
    username: "",
    municipality: "",
    viewingPage: "",
    phoneNumber: "",
    accessLevel: "action-center",
    department: "",
  });

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!isAdmin) return;
      setTableLoading(true);
      const result = await getUsers();
      if (isMounted) {
        if (result.success) {
          setUsers(result.data || []);
        } else {
          toast.error("Failed to load users");
        }
        setTableLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [isAdmin, getUsers]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    
    // Validate form
    if (!newUser.municipality && newUser.accessLevel !== "ipatroller" && newUser.accessLevel !== "quarry-monitoring" && newUser.accessLevel !== "incidents" && newUser.accessLevel !== "viewing") {
      toast.error("Please select a municipality or 'Not Municipality'");
      return;
    }
    if (newUser.accessLevel === "viewing" && !newUser.viewingPage) {
      toast.error("Please select a page for Viewing access");
      return;
    }
    if (!newUser.firstName || !newUser.lastName) {
      toast.error("Please enter first and last name");
      return;
    }
    if (!newUser.email) {
      toast.error("Please enter email");
      return;
    }
    if (!newUser.password) {
      toast.error("Please enter password");
      return;
    }
    if (newUser.password !== newUser.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setCreateLoading(true);
    try {
      const response = await createUserByAdmin(newUser.email, newUser.password, {
        username: newUser.username || newUser.email.split('@')[0],
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        municipality: newUser.accessLevel === "viewing" ? "" : newUser.municipality,
        viewingPage: newUser.accessLevel === "viewing" ? newUser.viewingPage : "",
        phoneNumber: newUser.phoneNumber,
        role: "User",
        accessLevel: newUser.accessLevel,
        department: newUser.department,
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to create user");
      }

      // Log user creation for administrators
      if (isAdmin || userAccessLevel === 'admin') {
        const adminUserInfo = {
          email: user?.email || '',
          firstName: userFirstName,
          lastName: userLastName,
          username: userUsername,
          accessLevel: userAccessLevel,
          municipality: userMunicipality,
          department: userDepartment,
          isAdmin: isAdmin
        };
        
        const targetUser = {
          email: newUser.email,
          username: newUser.username || newUser.email.split('@')[0],
          accessLevel: newUser.accessLevel,
          municipality: newUser.municipality
        };
        
        await logUserManagementAction('CREATE_USER', adminUserInfo, targetUser);
      }

      toast.success("User created successfully");
      
      // Close dialog and reset form
      setIsDialogOpen(false);
      setNewUser({
        email: "",
        username: "",
        password: "",
        confirmPassword: "",
        firstName: "",
        lastName: "",
        municipality: "",
        viewingPage: "",
        phoneNumber: "",
        role: "User",
        accessLevel: "action-center",
        department: "",
      });
      
      // Refresh user list
      const result = await getUsers();
      if (result.success) {
        setUsers(result.data || []);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditUser({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      username: user.username || "",
      municipality: user.municipality || "",
      viewingPage: user.viewingPage || "",
      phoneNumber: user.phoneNumber || "",
      accessLevel: user.accessLevel || "action-center",
      department: user.department || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!isAdmin || !selectedUser) return;
    
    // Validate form
    if (!editUser.municipality && editUser.accessLevel !== "ipatroller" && editUser.accessLevel !== "quarry-monitoring" && editUser.accessLevel !== "incidents" && editUser.accessLevel !== "viewing") {
      toast.error("Please select a municipality or 'Not Municipality'");
      return;
    }
    if (editUser.accessLevel === "viewing" && !editUser.viewingPage) {
      toast.error("Please select a page for Viewing access");
      return;
    }
    if (!editUser.firstName || !editUser.lastName) {
      toast.error("Please enter first and last name");
      return;
    }
    if (!editUser.username) {
      toast.error("Please enter username");
      return;
    }

    setUpdateLoading(true);
    try {
      const response = await updateUser(selectedUser.id, {
        firstName: editUser.firstName,
        lastName: editUser.lastName,
        username: editUser.username,
        municipality: editUser.accessLevel === "viewing" ? "" : editUser.municipality,
        viewingPage: editUser.accessLevel === "viewing" ? editUser.viewingPage : "",
        phoneNumber: editUser.phoneNumber,
        accessLevel: editUser.accessLevel,
        department: editUser.department,
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to update user");
      }

      // Log user update for administrators
      if (isAdmin || userAccessLevel === 'admin') {
        const adminUserInfo = {
          email: user?.email || '',
          firstName: userFirstName,
          lastName: userLastName,
          username: userUsername,
          accessLevel: userAccessLevel,
          municipality: userMunicipality,
          department: userDepartment,
          isAdmin: isAdmin
        };
        
        const targetUser = {
          email: selectedUser.email,
          username: editUser.username,
          accessLevel: editUser.accessLevel,
          municipality: editUser.municipality
        };
        
        await logUserManagementAction('UPDATE_USER', adminUserInfo, targetUser);
      }

      toast.success("User updated successfully");
      
      // Close dialog and reset form
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      setEditUser({
        firstName: "",
        lastName: "",
        username: "",
        municipality: "",
        viewingPage: "",
        phoneNumber: "",
        accessLevel: "action-center",
        department: "",
      });
      
      // Refresh user list
      const result = await getUsers();
      if (result.success) {
        setUsers(result.data || []);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!isAdmin || !userToDelete) return;

    setDeleteLoading(true);
    try {
      const response = await deleteUser(userToDelete.id);

      if (!response.success) {
        throw new Error(response.error || "Failed to delete user");
      }

      // Log user deletion for administrators
      if (isAdmin || userAccessLevel === 'admin') {
        const adminUserInfo = {
          email: user?.email || '',
          firstName: userFirstName,
          lastName: userLastName,
          username: userUsername,
          accessLevel: userAccessLevel,
          municipality: userMunicipality,
          department: userDepartment,
          isAdmin: isAdmin
        };
        
        const targetUser = {
          email: userToDelete.email,
          username: userToDelete.username,
          accessLevel: userToDelete.accessLevel,
          municipality: userToDelete.municipality
        };
        
        await logUserManagementAction('DELETE_USER', adminUserInfo, targetUser);
      }

      toast.success("User deleted successfully");
      
      // Close dialog and reset state
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      
      // Refresh user list
      const result = await getUsers();
      if (result.success) {
        setUsers(result.data || []);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Layout onLogout={onLogout} onNavigate={onNavigate} currentPage={currentPage}>
      <div className="h-full flex flex-col overflow-hidden bg-slate-50 dark:bg-[#0f172a]">
        {!isAdmin ? (
          <div className="flex flex-col items-center justify-center h-screen">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Access Restricted</h2>
            <p className="text-slate-500 dark:text-slate-400">Admin access required.</p>
          </div>
        ) : (
          <>
            {/* Fixed Header Navbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 w-full px-4 sm:px-6 lg:px-8 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl py-4 border-b border-slate-200/60 dark:border-slate-800/60 sticky top-0 z-50">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">User Management</h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage system users and access levels securely</p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base w-full sm:w-auto shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-300 rounded-xl font-bold">
                    <UserPlus className="mr-2 h-4 w-4" />
                    New Identity
                  </Button>
                </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900 border-none shadow-2xl rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Add a new user to the system.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4 py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" name="firstName" placeholder="John" value={newUser.firstName} onChange={handleInputChange} className="col-span-3 bg-white border-slate-200 !text-black placeholder:text-gray-400" autoComplete="given-name" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" name="lastName" placeholder="Doe" value={newUser.lastName} onChange={handleInputChange} className="col-span-3 bg-white border-slate-200 !text-black placeholder:text-gray-400" autoComplete="family-name" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" placeholder="john@example.com" value={newUser.email} onChange={handleInputChange} className="col-span-3 bg-white border-slate-200 !text-black placeholder:text-gray-400" autoComplete="email" required />
                    </div>
                    {newUser.accessLevel !== "ipatroller" && newUser.accessLevel !== "quarry-monitoring" && newUser.accessLevel !== "incidents" && newUser.accessLevel !== "viewing" && (
                      <div className="space-y-2">
                        <Label htmlFor="municipality">Municipality</Label>
                        <Select value={newUser.municipality} onValueChange={(value) => setNewUser((prev) => ({ ...prev, municipality: value }))}>
                          <SelectTrigger id="municipality" name="municipality" className="col-span-3 bg-white border border-slate-200 !text-black !opacity-100">
                            <SelectValue placeholder="Select municipality" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-slate-200">
                            {municipalities.map((m) => (
                              <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="accessLevel">Access Level</Label>
                      <Select value={newUser.accessLevel} onValueChange={(value) => setNewUser((prev) => ({ ...prev, accessLevel: value, department: "", viewingPage: value === "viewing" ? prev.viewingPage : "" }))}>
                        <SelectTrigger id="accessLevel" name="accessLevel" className="col-span-3 bg-white border border-slate-200 !text-black !opacity-100">
                          <SelectValue placeholder="Select access level" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-slate-200">
                          <SelectItem value="action-center">Action Center</SelectItem>
                          <SelectItem value="command-center">Command Center</SelectItem>
                          <SelectItem value="ipatroller">IPatroller</SelectItem>
                          <SelectItem value="quarry-monitoring">Quarry Site Monitoring</SelectItem>
                          <SelectItem value="incidents">Incidents</SelectItem>
                          <SelectItem value="viewing">Viewing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {newUser.accessLevel === "viewing" && (
                      <div className="space-y-2">
                        <Label htmlFor="viewingPage">Allowed Page</Label>
                        <Select value={newUser.viewingPage} onValueChange={(value) => setNewUser((prev) => ({ ...prev, viewingPage: value }))}>
                          <SelectTrigger id="viewingPage" name="viewingPage" className="col-span-3 bg-white border border-slate-200 !text-black !opacity-100">
                            <SelectValue placeholder="Select page" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-slate-200">
                            {viewingPageOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {newUser.accessLevel === "action-center" && (
                      <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Select value={newUser.department} onValueChange={(value) => setNewUser((prev) => ({ ...prev, department: value }))}>
                          <SelectTrigger id="department" name="department" className="col-span-3 bg-white border border-slate-200 !text-black !opacity-100">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-slate-200">
                            <SelectItem value="agriculture">Agriculture</SelectItem>
                            <SelectItem value="pg-enro">PG-ENRO</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" name="username" placeholder="johndoe" value={newUser.username} onChange={handleInputChange} className="col-span-3 bg-white border-slate-200 !text-black placeholder:text-gray-400" autoComplete="username" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" placeholder="••••••••" value={newUser.password} onChange={handleInputChange} className="col-span-3 bg-white border-slate-200 !text-black placeholder:text-gray-400" autoComplete="new-password" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="••••••••" value={newUser.confirmPassword} onChange={handleInputChange} className="col-span-3 bg-white border-slate-200 !text-black placeholder:text-gray-400" autoComplete="new-password" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Contact Number (Optional)</Label>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      autoComplete="tel"
                      placeholder="+63 9XX XXX XXXX"
                      value={newUser.phoneNumber}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, "");
                        if (!value.startsWith("63") && value.length > 0) {
                          value = "63" + value;
                        }
                        if (value.length > 12) {
                          value = value.slice(0, 12);
                        }
                        if (value.length > 2) {
                          const rest = value.slice(2);
                          const parts = rest.match(/.{1,3}/g) || [];
                          value = "+" + value.slice(0, 2) + " " + parts.join(" ");
                        }
                        setNewUser((prev) => ({ ...prev, phoneNumber: value }));
                      }}
                      className="col-span-3 bg-white border-slate-200 !text-black placeholder:text-gray-400"
                    />
                    <p className="text-xs text-gray-500">Format: +63 XXX XXX XXXX</p>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline" className="rounded-xl border-slate-200 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" name="create-user" disabled={createLoading} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all duration-300 font-bold">
                      {createLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create User
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            
            {/* Edit User Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900 border-none shadow-2xl rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold dark:text-white">Edit User</DialogTitle>
                  <DialogDescription className="dark:text-slate-400">
                    Update user credentials and structural information.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpdateUser} className="space-y-4 py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editFirstName">First Name</Label>
                      <Input 
                        id="editFirstName" 
                        name="firstName" 
                        placeholder="John" 
                        value={editUser.firstName} 
                        onChange={handleEditInputChange} 
                        className="col-span-3 bg-white border-slate-200 !text-black placeholder:text-gray-400" 
                        autoComplete="given-name"
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editLastName">Last Name</Label>
                      <Input 
                        id="editLastName" 
                        name="lastName" 
                        placeholder="Doe" 
                        value={editUser.lastName} 
                        onChange={handleEditInputChange} 
                        className="col-span-3 bg-white border-slate-200 !text-black placeholder:text-gray-400" 
                        autoComplete="family-name"
                        required 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editUsername">Username</Label>
                      <Input 
                        id="editUsername" 
                        name="username"
                        autoComplete="username" 
                        placeholder="johndoe" 
                        value={editUser.username} 
                        onChange={handleEditInputChange} 
                        className="col-span-3 bg-white border-slate-200 !text-black placeholder:text-gray-400" 
                        required 
                      />
                    </div>
                    {editUser.accessLevel !== "ipatroller" && editUser.accessLevel !== "quarry-monitoring" && editUser.accessLevel !== "incidents" && editUser.accessLevel !== "viewing" && (
                      <div className="space-y-2">
                        <Label htmlFor="editMunicipality">Municipality</Label>
                        <Select value={editUser.municipality} onValueChange={(value) => setEditUser((prev) => ({ ...prev, municipality: value }))}>
                          <SelectTrigger id="editMunicipality" name="municipality" className="col-span-3 bg-white border border-slate-200 !text-black !opacity-100">
                            <SelectValue placeholder="Select municipality" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-slate-200">
                            {municipalities.map((m) => (
                              <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editAccessLevel">Access Level</Label>
                      <Select value={editUser.accessLevel} onValueChange={(value) => setEditUser((prev) => ({ ...prev, accessLevel: value, department: "", viewingPage: value === "viewing" ? prev.viewingPage : "" }))}>
                        <SelectTrigger id="editAccessLevel" name="accessLevel" className="col-span-3 bg-white border border-slate-200 !text-black !opacity-100">
                          <SelectValue placeholder="Select access level" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-slate-200">
                          <SelectItem value="action-center">Action Center</SelectItem>
                          <SelectItem value="command-center">Command Center</SelectItem>
                          <SelectItem value="ipatroller">IPatroller</SelectItem>
                          <SelectItem value="quarry-monitoring">Quarry Site Monitoring</SelectItem>
                          <SelectItem value="incidents">Incidents</SelectItem>
                          <SelectItem value="viewing">Viewing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {editUser.accessLevel === "viewing" && (
                      <div className="space-y-2">
                        <Label htmlFor="editViewingPage">Allowed Page</Label>
                        <Select value={editUser.viewingPage} onValueChange={(value) => setEditUser((prev) => ({ ...prev, viewingPage: value }))}>
                          <SelectTrigger id="editViewingPage" name="viewingPage" className="col-span-3 bg-white border border-slate-200 !text-black !opacity-100">
                            <SelectValue placeholder="Select page" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-slate-200">
                            {viewingPageOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {editUser.accessLevel === "action-center" && (
                      <div className="space-y-2">
                        <Label htmlFor="editDepartment">Department</Label>
                        <Select value={editUser.department} onValueChange={(value) => setEditUser((prev) => ({ ...prev, department: value }))}>
                          <SelectTrigger id="editDepartment" name="department" className="col-span-3 bg-white border border-slate-200 !text-black !opacity-100">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-slate-200">
                            <SelectItem value="agriculture">Agriculture</SelectItem>
                            <SelectItem value="pg-enro">PG-ENRO</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editPhoneNumber">Contact Number (Optional)</Label>
                    <Input
                      id="editPhoneNumber"
                      name="phoneNumber"
                      type="tel"
                      autoComplete="tel"
                      placeholder="+63 9XX XXX XXXX"
                      value={editUser.phoneNumber}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, "");
                        if (!value.startsWith("63") && value.length > 0) {
                          value = "63" + value;
                        }
                        if (value.length > 12) {
                          value = value.slice(0, 12);
                        }
                        if (value.length > 2) {
                          const rest = value.slice(2);
                          const parts = rest.match(/.{1,3}/g) || [];
                          value = "+" + value.slice(0, 2) + " " + parts.join(" ");
                        }
                        setEditUser((prev) => ({ ...prev, phoneNumber: value }));
                      }}
                      className="col-span-3 bg-white border-slate-200"
                    />
                    <p className="text-xs text-gray-500">Format: +63 XXX XXX XXXX</p>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline" className="rounded-xl border-slate-200 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" name="update-user" disabled={updateLoading} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all duration-300 font-bold">
                      {updateLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Changes
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            
            {/* Delete User Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogContent className="sm:max-w-[400px] bg-white dark:bg-slate-900 border-none shadow-2xl rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-xl font-bold dark:text-white">
                    <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    Terminate Identity
                  </DialogTitle>
                  <DialogDescription className="dark:text-slate-400 pt-2">
                    Are you sure you want to delete this user? This action strips all structural access and cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                {userToDelete && (
                  <div className="py-2">
                    <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4">
                      <h4 className="font-bold text-red-800 dark:text-red-400">Target User Profiling:</h4>
                      <p className="text-red-700 dark:text-red-300 mt-2 text-sm">
                        <strong className="opacity-70">Name:</strong> {`${userToDelete.firstName || ""} ${userToDelete.lastName || ""}`.trim()}
                      </p>
                      <p className="text-red-700 dark:text-red-300 text-sm mt-1">
                        <strong className="opacity-70">Email:</strong> {userToDelete.email}
                      </p>
                      <p className="text-red-700 dark:text-red-300 text-sm mt-1">
                        <strong className="opacity-70">Username:</strong> {userToDelete.username}
                      </p>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline" className="rounded-xl border-slate-200 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</Button>
                  </DialogClose>
                  <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={confirmDeleteUser}
                    disabled={deleteLoading}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md transition-all duration-300 font-bold"
                  >
                    {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirm Termination
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="bg-white dark:bg-slate-900/50 backdrop-blur border-none shadow-sm dark:shadow-none ring-1 ring-slate-200 dark:ring-slate-800 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 group">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Total Users</p>
                    <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white transition-transform group-hover:scale-105 origin-left">
                      {users.filter(u => u.role !== "Admin").length}
                    </p>
                  </div>
                  <div className="p-3 sm:p-3.5 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl flex-shrink-0 group-hover:rotate-12 transition-transform duration-500 border border-blue-500/10">
                    <UsersIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900/50 backdrop-blur border-none shadow-sm dark:shadow-none ring-1 ring-slate-200 dark:ring-slate-800 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 group">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider truncate">Command Center</p>
                    <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white transition-transform group-hover:scale-105 origin-left">
                      {users.filter(u => u.accessLevel === "command-center").length}
                    </p>
                  </div>
                  <div className="p-3 sm:p-3.5 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-xl flex-shrink-0 group-hover:rotate-12 transition-transform duration-500 border border-emerald-500/10">
                    <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900/50 backdrop-blur border-none shadow-sm dark:shadow-none ring-1 ring-slate-200 dark:ring-slate-800 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 group">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider truncate">Action Center</p>
                    <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white transition-transform group-hover:scale-105 origin-left">
                      {users.filter(u => u.accessLevel === "action-center").length}
                    </p>
                  </div>
                  <div className="p-3 sm:p-3.5 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl flex-shrink-0 group-hover:rotate-12 transition-transform duration-500 border border-purple-500/10">
                    <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900/50 backdrop-blur border-none shadow-sm dark:shadow-none ring-1 ring-slate-200 dark:ring-slate-800 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 group">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider truncate">Other Access</p>
                    <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white transition-transform group-hover:scale-105 origin-left">
                      {users.filter(u => !['command-center', 'action-center', 'Admin'].includes(u.accessLevel) && u.role !== "Admin").length}
                    </p>
                  </div>
                  <div className="p-3 sm:p-3.5 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-xl flex-shrink-0 group-hover:rotate-12 transition-transform duration-500 border border-amber-500/10">
                    <User className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter Section */}
          <Card className="bg-white dark:bg-slate-900/40 backdrop-blur border-none ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm rounded-2xl">
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col md:flex-row gap-5">
                <div className="flex-1">
                  <Label htmlFor="search-users" className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                    Search Archive
                  </Label>
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      id="search-users"
                      placeholder="Search by name, email, or username..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 h-12 bg-slate-50 dark:bg-slate-950 border-none ring-1 ring-slate-200 dark:ring-slate-800 !text-slate-900 dark:!text-white placeholder:text-slate-400 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500 transition-all font-medium text-sm"
                    />
                  </div>
                </div>
                <div className="w-full md:w-72">
                  <Label htmlFor="filter-access" className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                    Clearance Level Filter
                  </Label>
                  <Select value={filterAccessLevel} onValueChange={setFilterAccessLevel}>
                    <SelectTrigger id="filter-access" className="h-12 bg-slate-50 dark:bg-slate-950 border-none ring-1 ring-slate-200 dark:ring-slate-800 !text-slate-900 dark:!text-white rounded-xl font-bold bg-transparent">
                      <SelectValue placeholder="All Access Levels" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl shadow-xl">
                      <SelectItem value="all">Global (All Clearances)</SelectItem>
                      <SelectItem value="command-center">Command Center</SelectItem>
                      <SelectItem value="action-center">Action Center</SelectItem>
                      <SelectItem value="ipatroller">IPatroller</SelectItem>
                      <SelectItem value="quarry-monitoring">Quarry Site Monitoring</SelectItem>
                      <SelectItem value="incidents">Incidents</SelectItem>
                      <SelectItem value="viewing">Viewing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grouped Users by Access Level */}
          {(() => {
            let nonAdminUsers = users.filter(u => u.role !== "Admin");
            
            // Apply search filter
            if (searchQuery.trim()) {
              const query = searchQuery.toLowerCase();
              nonAdminUsers = nonAdminUsers.filter(u => 
                (u.firstName && u.firstName.toLowerCase().includes(query)) ||
                (u.lastName && u.lastName.toLowerCase().includes(query)) ||
                (u.email && u.email.toLowerCase().includes(query)) ||
                (u.username && u.username.toLowerCase().includes(query))
              );
            }
            
            // Apply access level filter
            if (filterAccessLevel !== "all") {
              nonAdminUsers = nonAdminUsers.filter(u => u.accessLevel === filterAccessLevel);
            }
            const groupedUsers = nonAdminUsers.reduce((groups, user) => {
              const accessLevel = user.accessLevel || 'other';
              if (!groups[accessLevel]) {
                groups[accessLevel] = [];
              }
              groups[accessLevel].push(user);
              return groups;
            }, {});

            const accessLevelOrder = ['command-center', 'action-center', 'ipatroller', 'quarry-monitoring', 'incidents'];
            const accessLevelLabels = {
              'command-center': 'Command Center',
              'action-center': 'Action Center',
              'ipatroller': 'IPatroller',
              'quarry-monitoring': 'Quarry Site Monitoring',
              'incidents': 'Incidents'
            };

            if (nonAdminUsers.length === 0) {
              return (
                <Card className="bg-white shadow-sm border border-gray-200">
                  <CardContent className="p-12">
                    <div className="text-center text-muted-foreground">
                      <User className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                      <p className="text-lg font-semibold text-gray-900 mb-2">No users found</p>
                      <p className="text-sm text-gray-500">
                        {searchQuery || filterAccessLevel !== "all" 
                          ? "Try adjusting your search or filter criteria"
                          : "Create your first user to get started"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            }

            return (
              <div className="space-y-6">
                {accessLevelOrder.map(accessLevel => {
                  const usersInGroup = groupedUsers[accessLevel] || [];
                  if (usersInGroup.length === 0) return null;

                  return (
                    <Card key={accessLevel} className="bg-white dark:bg-slate-900 border-none ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm rounded-2xl overflow-hidden mb-6">
                      <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <CardTitle className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                {accessLevelLabels[accessLevel]}
                              </CardTitle>
                              <CardDescription className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">
                                {usersInGroup.length} authenticated profile{usersInGroup.length !== 1 ? 's' : ''}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-transparent px-3 py-1 text-sm font-black shadow-sm">
                            {usersInGroup.length}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-50 dark:bg-slate-900/80 border-b-2 border-slate-200 dark:border-slate-800">
                                <TableHead className="w-[260px] font-black uppercase text-xs tracking-wider text-slate-500 dark:text-slate-400 py-4">User Identity</TableHead>
                                <TableHead className="font-black uppercase text-xs tracking-wider text-slate-500 dark:text-slate-400 py-4">System Tag</TableHead>
                                <TableHead className="font-black uppercase text-xs tracking-wider text-slate-500 dark:text-slate-400 py-4 min-w-[200px]">Linkages</TableHead>
                                <TableHead className="font-black uppercase text-xs tracking-wider text-slate-500 dark:text-slate-400 py-4 text-center">Protocol</TableHead>
                                <TableHead className="font-black uppercase text-xs tracking-wider text-slate-500 dark:text-slate-400 py-4 text-center">Division</TableHead>
                                <TableHead className="text-center font-black uppercase text-xs tracking-wider text-slate-500 dark:text-slate-400 py-4">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {usersInGroup.map((u, index) => (
                                <TableRow 
                                  key={u.id} 
                                  className={`hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all duration-300 border-b border-slate-100 dark:border-slate-800/60 ${
                                    index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/30 dark:bg-slate-800/30'
                                  }`}
                                >
                                  <TableCell className="py-4">
                                    <div className="flex items-center gap-4">
                                      <div className="relative">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-500/30 ring-2 ring-white dark:ring-slate-800 overflow-hidden group-hover:scale-105 transition-transform">
                                          {(u.firstName?.[0] || '') + (u.lastName?.[0] || '')}
                                          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 shadow-sm overflow-hidden z-10 flex items-center justify-center bg-slate-200">
                                          {(() => {
                                            const status = presenceMap[u.email]?.status || 'offline';
                                            if (status === 'online') return <div className="w-full h-full bg-emerald-500 rounded-full animate-pulse" title="Online & Processing" />;
                                            if (status === 'idle') return <div className="w-full h-full bg-amber-400 rounded-full" title="Logged In but Idle" />;
                                            return <div className="w-full h-full bg-red-500 rounded-full" title="Offline" />;
                                          })()}
                                        </div>
                                      </div>
                                      <div className="flex flex-col">
                                        <p className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                                          {`${u.firstName || ""} ${u.lastName || ""}`.trim()}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-1.5">
                                          <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{u.municipality || 'Unspecified'}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-4">
                                    <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/80 ring-1 ring-slate-200 dark:ring-slate-700 px-3 py-2 rounded-xl w-fit shadow-sm">
                                      <User className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                                      <span className="text-slate-900 dark:text-slate-300 font-bold text-sm tracking-wide">{u.username}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-4">
                                    <div className="space-y-2.5 flex flex-col">
                                      <div className="flex items-center gap-2.5 group/link">
                                        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center ring-1 ring-blue-100 dark:ring-blue-500/20 group-hover/link:bg-blue-100 dark:group-hover/link:bg-blue-500/30 transition-colors">
                                          <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <span className="text-slate-700 dark:text-slate-300 font-medium text-sm truncate max-w-[150px]">{u.email}</span>
                                      </div>
                                      {u.phoneNumber && (
                                        <div className="flex items-center gap-2.5 group/link">
                                          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center ring-1 ring-emerald-100 dark:ring-emerald-500/20 group-hover/link:bg-emerald-100 dark:group-hover/link:bg-emerald-500/30 transition-colors">
                                            <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                          </div>
                                          <span className="text-slate-700 dark:text-slate-300 font-medium text-sm truncate max-w-[150px]">{u.phoneNumber}</span>
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-4 text-center">
                                    <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-500/20 dark:to-indigo-500/20 text-blue-800 dark:text-blue-300 border-none shadow-sm px-4 py-1.5 text-xs font-black uppercase tracking-wider">
                                      {u.role}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="py-4 text-center">
                                    <Badge className="bg-gradient-to-r from-purple-100 to-fuchsia-100 dark:from-purple-500/20 dark:to-fuchsia-500/20 text-purple-800 dark:text-purple-300 border-none shadow-sm px-4 py-1.5 text-xs font-black uppercase tracking-wider">
                                      {u.department === 'agriculture' ? 'Agriculture' : u.department === 'pg-enro' ? 'PG-ENRO' : 'N/A'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-center py-4">
                                    <div className="flex gap-2 justify-center opacity-70 hover:opacity-100 transition-opacity">
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleEditUser(u)}
                                        className="h-9 px-3 hover:bg-blue-600 hover:text-white dark:border-slate-700 dark:text-slate-300 transition-all duration-300 shadow-sm rounded-xl font-bold"
                                      >
                                        <Edit2 className="w-3.5 h-3.5 sm:mr-1.5" />
                                        <span className="hidden sm:inline">Modify</span>
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleDeleteUser(u)}
                                        className="h-9 px-3 text-red-600 dark:text-red-400 hover:bg-red-600 dark:hover:bg-red-600 hover:text-white dark:hover:text-white dark:border-red-900/50 transition-all duration-300 shadow-sm rounded-xl font-bold"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 sm:mr-1.5" />
                                        <span className="hidden sm:inline">Terminate</span>
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Other Access Levels */}
                {Object.keys(groupedUsers).filter(level => !accessLevelOrder.includes(level)).map(accessLevel => {
                  const usersInGroup = groupedUsers[accessLevel];
                  if (usersInGroup.length === 0) return null;

                  return (
                    <Card key={accessLevel} className="bg-white dark:bg-slate-900 border-none ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm rounded-2xl overflow-hidden mb-6">
                      <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                              <User className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            </div>
                            <div>
                              <CardTitle className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                {accessLevel.charAt(0).toUpperCase() + accessLevel.slice(1).replace('-', ' ')}
                              </CardTitle>
                              <CardDescription className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">
                                {usersInGroup.length} authenticated profile{usersInGroup.length !== 1 ? 's' : ''}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-transparent px-3 py-1 text-sm font-black shadow-sm">
                            {usersInGroup.length}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-50 dark:bg-slate-900/80 border-b-2 border-slate-200 dark:border-slate-800">
                                <TableHead className="w-[260px] font-black uppercase text-xs tracking-wider text-slate-500 dark:text-slate-400 py-4">User Identity</TableHead>
                                <TableHead className="font-black uppercase text-xs tracking-wider text-slate-500 dark:text-slate-400 py-4">System Tag</TableHead>
                                <TableHead className="font-black uppercase text-xs tracking-wider text-slate-500 dark:text-slate-400 py-4 min-w-[200px]">Linkages</TableHead>
                                <TableHead className="font-black uppercase text-xs tracking-wider text-slate-500 dark:text-slate-400 py-4 text-center">Protocol</TableHead>
                                <TableHead className="font-black uppercase text-xs tracking-wider text-slate-500 dark:text-slate-400 py-4 text-center">Division</TableHead>
                                <TableHead className="text-center font-black uppercase text-xs tracking-wider text-slate-500 dark:text-slate-400 py-4">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {usersInGroup.map((u, index) => (
                                <TableRow 
                                  key={u.id} 
                                  className={`hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all duration-300 border-b border-slate-100 dark:border-slate-800/60 ${
                                    index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/30 dark:bg-slate-800/30'
                                  }`}
                                >
                                  <TableCell className="py-4">
                                    <div className="flex items-center gap-4">
                                      <div className="relative">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600 dark:from-slate-700 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-slate-500/30 ring-2 ring-white dark:ring-slate-800 overflow-hidden group-hover:scale-105 transition-transform">
                                          {(u.firstName?.[0] || '') + (u.lastName?.[0] || '')}
                                          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 shadow-sm overflow-hidden z-10 flex items-center justify-center bg-slate-200">
                                          {(() => {
                                            const status = presenceMap[u.email]?.status || 'offline';
                                            if (status === 'online') return <div className="w-full h-full bg-emerald-500 rounded-full" />;
                                            if (status === 'idle') return <div className="w-full h-full bg-amber-400 rounded-full" />;
                                            return <div className="w-full h-full bg-red-500 rounded-full" />;
                                          })()}
                                        </div>
                                      </div>
                                      <div className="flex flex-col">
                                        <p className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                                          {`${u.firstName || ""} ${u.lastName || ""}`.trim()}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-1.5">
                                          <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{u.municipality || 'Unspecified'}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-4">
                                    <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/80 ring-1 ring-slate-200 dark:ring-slate-700 px-3 py-2 rounded-xl w-fit shadow-sm">
                                      <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                      <span className="text-slate-900 dark:text-slate-300 font-bold text-sm tracking-wide">{u.username}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-4">
                                    <div className="space-y-2.5 flex flex-col">
                                      <div className="flex items-center gap-2.5 group/link">
                                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center ring-1 ring-slate-200 dark:ring-slate-700 group-hover/link:bg-slate-200 dark:group-hover/link:bg-slate-700 transition-colors">
                                          <Mail className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                        </div>
                                        <span className="text-slate-700 dark:text-slate-300 font-medium text-sm truncate max-w-[150px]">{u.email}</span>
                                      </div>
                                      {u.phoneNumber && (
                                        <div className="flex items-center gap-2.5 group/link">
                                          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center ring-1 ring-emerald-100 dark:ring-emerald-500/20 group-hover/link:bg-emerald-100 dark:group-hover/link:bg-emerald-500/30 transition-colors">
                                            <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                          </div>
                                          <span className="text-slate-700 dark:text-slate-300 font-medium text-sm truncate max-w-[150px]">{u.phoneNumber}</span>
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-4 text-center">
                                    <Badge className="bg-gradient-to-r from-slate-100 to-gray-200 dark:from-slate-800 dark:to-slate-700 text-slate-700 dark:text-slate-300 border-none shadow-sm px-4 py-1.5 text-xs font-black uppercase tracking-wider">
                                      {u.role}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="py-4 text-center">
                                    <Badge className="bg-gradient-to-r from-purple-100 to-fuchsia-100 dark:from-purple-500/20 dark:to-fuchsia-500/20 text-purple-800 dark:text-purple-300 border-none shadow-sm px-4 py-1.5 text-xs font-black uppercase tracking-wider">
                                      {u.department === 'agriculture' ? 'Agriculture' : u.department === 'pg-enro' ? 'PG-ENRO' : 'N/A'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-center py-4">
                                    <div className="flex gap-2 justify-center opacity-70 hover:opacity-100 transition-opacity">
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleEditUser(u)}
                                        className="h-9 px-3 hover:bg-blue-600 hover:text-white dark:border-slate-700 dark:text-slate-300 transition-all duration-300 shadow-sm rounded-xl font-bold"
                                      >
                                        <Edit2 className="w-3.5 h-3.5 sm:mr-1.5" />
                                        <span className="hidden sm:inline">Modify</span>
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleDeleteUser(u)}
                                        className="h-9 px-3 text-red-600 dark:text-red-400 hover:bg-red-600 dark:hover:bg-red-600 hover:text-white dark:hover:text-white dark:border-red-900/50 transition-all duration-300 shadow-sm rounded-xl font-bold"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 sm:mr-1.5" />
                                        <span className="hidden sm:inline">Terminate</span>
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            );
          })()}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
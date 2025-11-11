import React, { useEffect, useState } from "react";
import Layout from "./Layout";
import { usersLog, createSectionGroup, CONSOLE_GROUPS } from './utils/consoleGrouping';
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "./components/ui/table";
import { useFirebase } from "./hooks/useFirebase";
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { toast } from "sonner";
import { AlertTriangle, Loader2, User, UserPlus, Users as UsersIcon, Shield, Search, Mail, Phone, Building2, MapPin, Edit2, Trash2 } from "lucide-react";
import { logUserManagementAction, logAdminAccess } from './utils/adminLogger';
import { useAuth } from './contexts/AuthContext';

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

  const [newUser, setNewUser] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    municipality: "",
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
    if (!newUser.municipality && newUser.accessLevel !== "ipatroller" && newUser.accessLevel !== "quarry-monitoring" && newUser.accessLevel !== "incidents") {
      toast.error("Please select a municipality or 'Not Municipality'");
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
        municipality: newUser.municipality,
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
    if (!editUser.municipality && editUser.accessLevel !== "ipatroller" && editUser.accessLevel !== "quarry-monitoring" && editUser.accessLevel !== "incidents") {
      toast.error("Please select a municipality or 'Not Municipality'");
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
        municipality: editUser.municipality,
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
      {!isAdmin ? (
        <div className="flex flex-col items-center justify-center h-screen">
          <h2 className="text-xl font-semibold text-gray-900">Access Restricted</h2>
          <p className="text-gray-600">Admin access required.</p>
        </div>
      ) : (
        <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 bg-gray-50 min-h-screen">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">Manage system users and their access levels</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-black hover:bg-black/90 text-white text-sm sm:text-base w-full sm:w-auto">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add New User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] bg-white border border-slate-200">
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
                      <Input id="firstName" name="firstName" placeholder="John" value={newUser.firstName} onChange={handleInputChange} className="col-span-3 bg-white border-slate-200" autoComplete="given-name" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" name="lastName" placeholder="Doe" value={newUser.lastName} onChange={handleInputChange} className="col-span-3 bg-white border-slate-200" autoComplete="family-name" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" placeholder="john@example.com" value={newUser.email} onChange={handleInputChange} className="col-span-3 bg-white border-slate-200" autoComplete="email" required />
                    </div>
                    {newUser.accessLevel !== "ipatroller" && newUser.accessLevel !== "quarry-monitoring" && newUser.accessLevel !== "incidents" && (
                      <div className="space-y-2">
                        <Label htmlFor="municipality">Municipality</Label>
                        <Select value={newUser.municipality} onValueChange={(value) => setNewUser((prev) => ({ ...prev, municipality: value }))}>
                          <SelectTrigger id="municipality" name="municipality" className="col-span-3 bg-white border border-slate-200">
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
                      <Select value={newUser.accessLevel} onValueChange={(value) => setNewUser((prev) => ({ ...prev, accessLevel: value, department: "" }))}>
                        <SelectTrigger id="accessLevel" name="accessLevel" className="col-span-3 bg-white border border-slate-200">
                          <SelectValue placeholder="Select access level" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-slate-200">
                          <SelectItem value="action-center">Action Center</SelectItem>
                          <SelectItem value="command-center">Command Center</SelectItem>
                          <SelectItem value="ipatroller">IPatroller</SelectItem>
                          <SelectItem value="quarry-monitoring">Quarry Site Monitoring</SelectItem>
                          <SelectItem value="incidents">Incidents</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {newUser.accessLevel === "action-center" && (
                      <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Select value={newUser.department} onValueChange={(value) => setNewUser((prev) => ({ ...prev, department: value }))}>
                          <SelectTrigger id="department" name="department" className="col-span-3 bg-white border border-slate-200">
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
                    <Input id="username" name="username" placeholder="johndoe" value={newUser.username} onChange={handleInputChange} className="col-span-3 bg-white border-slate-200" autoComplete="username" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" placeholder="••••••••" value={newUser.password} onChange={handleInputChange} className="col-span-3 bg-white border-slate-200" autoComplete="new-password" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="••••••••" value={newUser.confirmPassword} onChange={handleInputChange} className="col-span-3 bg-white border-slate-200" autoComplete="new-password" required />
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
                      className="col-span-3 bg-white border-slate-200"
                    />
                    <p className="text-xs text-gray-500">Format: +63 XXX XXX XXXX</p>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" name="create-user" disabled={createLoading} className="bg-black text-white hover:bg-black/90">
                      {createLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create User
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            
            {/* Edit User Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="sm:max-w-[500px] bg-white border border-slate-200">
                <DialogHeader>
                  <DialogTitle>Edit User</DialogTitle>
                  <DialogDescription>
                    Update user information.
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
                        className="col-span-3 bg-white border-slate-200" 
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
                        className="col-span-3 bg-white border-slate-200" 
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
                        className="col-span-3 bg-white border-slate-200" 
                        required 
                      />
                    </div>
                    {editUser.accessLevel !== "ipatroller" && editUser.accessLevel !== "quarry-monitoring" && editUser.accessLevel !== "incidents" && (
                      <div className="space-y-2">
                        <Label htmlFor="editMunicipality">Municipality</Label>
                        <Select value={editUser.municipality} onValueChange={(value) => setEditUser((prev) => ({ ...prev, municipality: value }))}>
                          <SelectTrigger id="editMunicipality" name="municipality" className="col-span-3 bg-white border border-slate-200">
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
                      <Select value={editUser.accessLevel} onValueChange={(value) => setEditUser((prev) => ({ ...prev, accessLevel: value, department: "" }))}>
                        <SelectTrigger id="editAccessLevel" name="accessLevel" className="col-span-3 bg-white border border-slate-200">
                          <SelectValue placeholder="Select access level" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-slate-200">
                          <SelectItem value="action-center">Action Center</SelectItem>
                          <SelectItem value="command-center">Command Center</SelectItem>
                          <SelectItem value="ipatroller">IPatroller</SelectItem>
                          <SelectItem value="quarry-monitoring">Quarry Site Monitoring</SelectItem>
                          <SelectItem value="incidents">Incidents</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {editUser.accessLevel === "action-center" && (
                      <div className="space-y-2">
                        <Label htmlFor="editDepartment">Department</Label>
                        <Select value={editUser.department} onValueChange={(value) => setEditUser((prev) => ({ ...prev, department: value }))}>
                          <SelectTrigger id="editDepartment" name="department" className="col-span-3 bg-white border border-slate-200">
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
                      <Button type="button" variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" name="update-user" disabled={updateLoading} className="bg-black text-white hover:bg-black/90">
                      {updateLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Update User
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            
            {/* Delete User Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogContent className="sm:max-w-[400px] bg-white border border-slate-200">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Delete User
                  </DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this user? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                {userToDelete && (
                  <div className="py-4">
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                      <h4 className="font-medium text-red-800">User to be deleted:</h4>
                      <p className="text-red-700 mt-1">
                        <strong>Name:</strong> {`${userToDelete.firstName || ""} ${userToDelete.lastName || ""}`.trim()}
                      </p>
                      <p className="text-red-700">
                        <strong>Email:</strong> {userToDelete.email}
                      </p>
                      <p className="text-red-700">
                        <strong>Username:</strong> {userToDelete.username}
                      </p>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={confirmDeleteUser}
                    disabled={deleteLoading}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Delete User
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 mb-1 truncate">Total Users</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-600">
                      {users.filter(u => u.role !== "Admin").length}
                    </p>
                  </div>
                  <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                    <UsersIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border border-gray-200">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 mb-1 truncate">Command Center</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-600">
                      {users.filter(u => u.accessLevel === "command-center").length}
                    </p>
                  </div>
                  <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg flex-shrink-0">
                    <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border border-gray-200">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 mb-1 truncate">Action Center</p>
                    <p className="text-xl sm:text-2xl font-bold text-purple-600">
                      {users.filter(u => u.accessLevel === "action-center").length}
                    </p>
                  </div>
                  <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg flex-shrink-0">
                    <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border border-gray-200">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 mb-1 truncate">Other Access</p>
                    <p className="text-xl sm:text-2xl font-bold text-orange-600">
                      {users.filter(u => !['command-center', 'action-center', 'Admin'].includes(u.accessLevel) && u.role !== "Admin").length}
                    </p>
                  </div>
                  <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg flex-shrink-0">
                    <User className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter Section */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="search-users" className="block text-sm font-medium text-gray-700 mb-2">
                    Search Users
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="search-users"
                      placeholder="Search by name, email, or username..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-white border-gray-300"
                    />
                  </div>
                </div>
                <div className="w-full md:w-64">
                  <Label htmlFor="filter-access" className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Access Level
                  </Label>
                  <Select value={filterAccessLevel} onValueChange={setFilterAccessLevel}>
                    <SelectTrigger id="filter-access" className="bg-white border-gray-300">
                      <SelectValue placeholder="All Access Levels" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="all">All Access Levels</SelectItem>
                      <SelectItem value="command-center">Command Center</SelectItem>
                      <SelectItem value="action-center">Action Center</SelectItem>
                      <SelectItem value="ipatroller">IPatroller</SelectItem>
                      <SelectItem value="quarry-monitoring">Quarry Site Monitoring</SelectItem>
                      <SelectItem value="incidents">Incidents</SelectItem>
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
                    <Card key={accessLevel} className="bg-white shadow-sm border border-gray-200 overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Shield className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <CardTitle className="text-lg font-semibold text-gray-900">
                                {accessLevelLabels[accessLevel]}
                              </CardTitle>
                              <CardDescription className="text-sm text-gray-600 mt-1">
                                {usersInGroup.length} user{usersInGroup.length !== 1 ? 's' : ''} in this access level
                              </CardDescription>
                            </div>
                          </div>
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                            {usersInGroup.length}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-gradient-to-r from-gray-50 to-slate-50 hover:from-gray-50 hover:to-slate-50 border-b-2 border-gray-200">
                                <TableHead className="w-[260px] font-bold text-gray-700 py-4">User Information</TableHead>
                                <TableHead className="font-bold text-gray-700 py-4">Username</TableHead>
                                <TableHead className="font-bold text-gray-700 py-4 min-w-[200px]">Contact Details</TableHead>
                                <TableHead className="font-bold text-gray-700 py-4 text-center">Role</TableHead>
                                <TableHead className="font-bold text-gray-700 py-4 text-center">Department</TableHead>
                                <TableHead className="text-right font-bold text-gray-700 py-4 pr-6">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {usersInGroup.map((u, index) => (
                                <TableRow 
                                  key={u.id} 
                                  className={`hover:bg-blue-50/50 transition-all duration-200 border-b border-gray-100 ${
                                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                                  }`}
                                >
                                  <TableCell className="py-4">
                                    <div className="flex items-center gap-4">
                                      <div className="relative">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-base shadow-md ring-2 ring-white">
                                          {(u.firstName?.[0] || '') + (u.lastName?.[0] || '')}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                                      </div>
                                      <div className="flex flex-col">
                                        <p className="font-semibold text-gray-900 text-base leading-tight">
                                          {`${u.firstName || ""} ${u.lastName || ""}`.trim()}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-1">
                                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                          <p className="text-sm text-gray-600">{u.municipality || 'Not specified'}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-4">
                                    <div className="flex items-center gap-2.5 bg-gray-50 px-3 py-2 rounded-lg w-fit">
                                      <User className="w-4 h-4 text-indigo-500" />
                                      <span className="text-gray-900 font-medium text-sm">{u.username}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-4">
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                          <Mail className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <span className="text-gray-700 text-sm">{u.email}</span>
                                      </div>
                                      {u.phoneNumber && (
                                        <div className="flex items-center gap-2.5">
                                          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                                            <Phone className="w-4 h-4 text-green-600" />
                                          </div>
                                          <span className="text-gray-700 text-sm">{u.phoneNumber}</span>
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-4 text-center">
                                    <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-200 hover:from-blue-100 hover:to-indigo-100 px-3 py-1.5 text-sm font-semibold shadow-sm">
                                      {u.role}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="py-4 text-center">
                                    <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-purple-200 hover:from-purple-100 hover:to-pink-100 px-3 py-1.5 text-sm font-semibold shadow-sm">
                                      {u.department === 'agriculture' ? 'Agriculture' : u.department === 'pg-enro' ? 'PG-ENRO' : 'N/A'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right py-4 pr-6">
                                    <div className="flex gap-2 justify-end">
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleEditUser(u)}
                                        className="hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-200 shadow-sm font-medium"
                                      >
                                        <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                                        Edit
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleDeleteUser(u)}
                                        className="text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-200 shadow-sm font-medium"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                        Delete
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
                    <Card key={accessLevel} className="bg-white shadow-sm border border-gray-200 overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              <User className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                              <CardTitle className="text-lg font-semibold text-gray-900">
                                {accessLevel.charAt(0).toUpperCase() + accessLevel.slice(1).replace('-', ' ')}
                              </CardTitle>
                              <CardDescription className="text-sm text-gray-600 mt-1">
                                {usersInGroup.length} user{usersInGroup.length !== 1 ? 's' : ''} in this access level
                              </CardDescription>
                            </div>
                          </div>
                          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                            {usersInGroup.length}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-gradient-to-r from-gray-50 to-slate-50 hover:from-gray-50 hover:to-slate-50 border-b-2 border-gray-200">
                                <TableHead className="w-[260px] font-bold text-gray-700 py-4">User Information</TableHead>
                                <TableHead className="font-bold text-gray-700 py-4">Username</TableHead>
                                <TableHead className="font-bold text-gray-700 py-4 min-w-[200px]">Contact Details</TableHead>
                                <TableHead className="font-bold text-gray-700 py-4 text-center">Role</TableHead>
                                <TableHead className="font-bold text-gray-700 py-4 text-center">Department</TableHead>
                                <TableHead className="text-right font-bold text-gray-700 py-4 pr-6">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {usersInGroup.map((u, index) => (
                                <TableRow 
                                  key={u.id} 
                                  className={`hover:bg-blue-50/50 transition-all duration-200 border-b border-gray-100 ${
                                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                                  }`}
                                >
                                  <TableCell className="py-4">
                                    <div className="flex items-center gap-4">
                                      <div className="relative">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-400 via-slate-500 to-gray-600 flex items-center justify-center text-white font-bold text-base shadow-md ring-2 ring-white">
                                          {(u.firstName?.[0] || '') + (u.lastName?.[0] || '')}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                                      </div>
                                      <div className="flex flex-col">
                                        <p className="font-semibold text-gray-900 text-base leading-tight">
                                          {`${u.firstName || ""} ${u.lastName || ""}`.trim()}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-1">
                                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                          <p className="text-sm text-gray-600">{u.municipality || 'Not specified'}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-4">
                                    <div className="flex items-center gap-2.5 bg-gray-50 px-3 py-2 rounded-lg w-fit">
                                      <User className="w-4 h-4 text-indigo-500" />
                                      <span className="text-gray-900 font-medium text-sm">{u.username}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-4">
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                          <Mail className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <span className="text-gray-700 text-sm">{u.email}</span>
                                      </div>
                                      {u.phoneNumber && (
                                        <div className="flex items-center gap-2.5">
                                          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                                            <Phone className="w-4 h-4 text-green-600" />
                                          </div>
                                          <span className="text-gray-700 text-sm">{u.phoneNumber}</span>
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-4 text-center">
                                    <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-200 hover:from-blue-100 hover:to-indigo-100 px-3 py-1.5 text-sm font-semibold shadow-sm">
                                      {u.role}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="py-4 text-center">
                                    <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-purple-200 hover:from-purple-100 hover:to-pink-100 px-3 py-1.5 text-sm font-semibold shadow-sm">
                                      {u.department === 'agriculture' ? 'Agriculture' : u.department === 'pg-enro' ? 'PG-ENRO' : 'N/A'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right py-4 pr-6">
                                    <div className="flex gap-2 justify-end">
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleEditUser(u)}
                                        className="hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-200 shadow-sm font-medium"
                                      >
                                        <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                                        Edit
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleDeleteUser(u)}
                                        className="text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-200 shadow-sm font-medium"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                        Delete
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
      )}
    </Layout>
  );
}
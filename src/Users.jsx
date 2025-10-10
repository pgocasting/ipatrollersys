import React, { useEffect, useState } from "react";
import Layout from "./Layout";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "./components/ui/table";
import { useFirebase } from "./hooks/useFirebase";
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { toast } from "sonner";
import { AlertTriangle, Loader2, User, UserPlus } from "lucide-react";

export default function Users({ onLogout, onNavigate, currentPage }) {
  const { user, getUsers, createUserByAdmin, updateUser, deleteUser } = useFirebase();
  const [tableLoading, setTableLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

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
    // Directly set admin status based on role in users array
    const docRef = doc(db, 'users', 'management');
    getDoc(docRef).then(docSnap => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const users = data.users || [];
        const currentUser = users.find(u => u.email === user?.email);
        setIsAdmin(currentUser?.role === "Admin");
      }
    });
  }, [user]);

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
      toast.error("Please select a municipality");
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
      toast.error("Please select a municipality");
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
        <div className="container mx-auto p-6 space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-500 mt-2">Manage system users and their roles</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-black hover:bg-black/90 text-white">
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" name="firstName" placeholder="John" value={newUser.firstName} onChange={handleInputChange} className="col-span-3 bg-white border-slate-200" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" name="lastName" placeholder="Doe" value={newUser.lastName} onChange={handleInputChange} className="col-span-3 bg-white border-slate-200" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" placeholder="john@example.com" value={newUser.email} onChange={handleInputChange} className="col-span-3 bg-white border-slate-200" required />
                    </div>
                    {newUser.accessLevel !== "ipatroller" && newUser.accessLevel !== "quarry-monitoring" && newUser.accessLevel !== "incidents" && (
                      <div className="space-y-2">
                        <Label htmlFor="municipality">Municipality</Label>
                        <Select value={newUser.municipality} onValueChange={(value) => setNewUser((prev) => ({ ...prev, municipality: value }))}>
                          <SelectTrigger id="municipality" className="col-span-3 bg-white border border-slate-200">
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="accessLevel">Access Level</Label>
                      <Select value={newUser.accessLevel} onValueChange={(value) => setNewUser((prev) => ({ ...prev, accessLevel: value, department: "" }))}>
                        <SelectTrigger id="accessLevel" className="col-span-3 bg-white border border-slate-200">
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
                          <SelectTrigger id="department" className="col-span-3 bg-white border border-slate-200">
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
                    <Input id="username" name="username" placeholder="johndoe" value={newUser.username} onChange={handleInputChange} className="col-span-3 bg-white border-slate-200" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" placeholder="••••••••" value={newUser.password} onChange={handleInputChange} className="col-span-3 bg-white border-slate-200" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="••••••••" value={newUser.confirmPassword} onChange={handleInputChange} className="col-span-3 bg-white border-slate-200" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Contact Number</Label>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
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
                      pattern="^\+63 \d{3} \d{3} \d{4}$"
                      title="Please enter a valid Philippine mobile number (+63 XXX XXX XXXX)"
                      className="col-span-3 bg-white border-slate-200"
                    />
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={createLoading} className="bg-black text-white hover:bg-black/90">
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editFirstName">First Name</Label>
                      <Input 
                        id="editFirstName" 
                        name="firstName" 
                        placeholder="John" 
                        value={editUser.firstName} 
                        onChange={handleEditInputChange} 
                        className="col-span-3 bg-white border-slate-200" 
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
                        required 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editUsername">Username</Label>
                      <Input 
                        id="editUsername" 
                        name="username" 
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
                          <SelectTrigger id="editMunicipality" className="col-span-3 bg-white border border-slate-200">
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editAccessLevel">Access Level</Label>
                      <Select value={editUser.accessLevel} onValueChange={(value) => setEditUser((prev) => ({ ...prev, accessLevel: value, department: "" }))}>
                        <SelectTrigger id="editAccessLevel" className="col-span-3 bg-white border border-slate-200">
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
                          <SelectTrigger id="editDepartment" className="col-span-3 bg-white border border-slate-200">
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
                    <Label htmlFor="editPhoneNumber">Contact Number</Label>
                    <Input
                      id="editPhoneNumber"
                      name="phoneNumber"
                      type="tel"
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
                      pattern="^\+63 \d{3} \d{3} \d{4}$"
                      title="Please enter a valid Philippine mobile number (+63 XXX XXX XXXX)"
                      className="col-span-3 bg-white border-slate-200"
                    />
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={updateLoading} className="bg-black text-white hover:bg-black/90">
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
          <div className="border rounded-md border-gray-200 shadow-sm">
            <Table className="border-gray-200">
              <TableCaption className="text-slate-500">A list of all system users.</TableCaption>
              <TableHeader>
                <TableRow className="border-b border-gray-200">
                  <TableHead className="w-[200px] border-gray-200">Name</TableHead>
                  <TableHead className="border-gray-200">Username</TableHead>
                  <TableHead className="border-gray-200">Email</TableHead>
                  <TableHead className="border-gray-200">Phone</TableHead>
                  <TableHead className="border-gray-200">Role</TableHead>
                  <TableHead className="border-gray-200">Access Level</TableHead>
                  <TableHead className="border-gray-200">Department</TableHead>
                  <TableHead className="text-right border-gray-200">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.filter(u => u.role !== "Admin").length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">No users found.</TableCell>
                  </TableRow>
                ) : (
                  users.filter(u => u.role !== "Admin").map((u) => (
                    <TableRow key={u.id} className="border-gray-200">
                      <TableCell className="font-medium">{`${u.firstName || ""} ${u.lastName || ""}`.trim()}</TableCell>
                      <TableCell>{u.username}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.phoneNumber}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">{u.role}</span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-700/10">
                          {u.accessLevel === 'action-center' ? 'Action Center' : u.accessLevel === 'command-center' ? 'Command Center' : u.accessLevel === 'ipatroller' ? 'IPatroller' : u.accessLevel === 'quarry-monitoring' ? 'Quarry Site Monitoring' : u.accessLevel === 'incidents' ? 'Incidents' : 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">
                          {u.department === 'agriculture' ? 'Agriculture' : u.department === 'pg-enro' ? 'PG-ENRO' : 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditUser(u)}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteUser(u)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </Layout>
  );
}
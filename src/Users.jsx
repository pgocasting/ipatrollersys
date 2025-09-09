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
  const { user, getUsers, createUserByAdmin } = useFirebase();
  const [tableLoading, setTableLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
    if (!newUser.municipality) {
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
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to create user");
      }

      toast.success("User created successfully");
      
      // Reset form
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
      });

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
                <Button className="bg-blue-600 hover:bg-blue-700">
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
                    <div className="space-y-2">
                      <Label htmlFor="municipality">Municipality</Label>
                      <Select value={newUser.municipality} onValueChange={(value) => setNewUser((prev) => ({ ...prev, municipality: value }))}>
                        <SelectTrigger className="col-span-3 bg-white border border-slate-200">
                          <SelectValue placeholder="Select municipality" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-slate-200">
                          {municipalities.map((m) => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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
                  <TableHead className="text-right border-gray-200">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">No users found.</TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow key={u.id} className="border-gray-200">
                      <TableCell className="font-medium">{`${u.firstName || ""} ${u.lastName || ""}`.trim()}</TableCell>
                      <TableCell>{u.username}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.phoneNumber}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">{u.role}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Edit</Button>
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
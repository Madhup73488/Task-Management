"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/supabase/auth-helpers";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { createInvitation } from "@/lib/supabase/invitation-helpers";
import { UserPlus } from "lucide-react";

interface User {
  id: string;
  full_name: string;
  email: string;
  role: "admin" | "employee";
}

interface Invitation {
  id: string;
  email: string;
  status: string;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "employee">(
    "employee"
  );
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await getCurrentUser();
        if (!user || user.role !== "admin") {
          router.push("/auth/login");
          return;
        }
        setCurrentUser(user);

        const { data, error } = await supabase.from("users").select("*");
        if (error) throw error;
        setUsers(data as User[]);

        // Fetch pending invitations
        const { data: invitationsData, error: invError } = await supabase
          .from("invitations")
          .select("*")
          .eq("status", "pending")
          .order("created_at", { ascending: false });
        
        if (invError) throw invError;
        setInvitations(invitationsData as Invitation[]);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInviteSuccess(false);

    if (!currentUser) {
      setError("You must be logged in to send invitations.");
      setLoading(false);
      return;
    }

    try {
      await createInvitation(inviteEmail, currentUser.id, inviteRole);
      setInviteSuccess(true);
      setInviteEmail("");
      setInviteRole("employee");
      
      // Refresh invitations list
      const { data: invitationsData } = await supabase
        .from("invitations")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      
      if (invitationsData) setInvitations(invitationsData as Invitation[]);
      
      setTimeout(() => {
        setIsInviteDialogOpen(false);
        setInviteSuccess(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to send invitation.");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!confirm("Are you sure you want to revoke this invitation?")) return;
    
    try {
      const { error } = await supabase
        .from("invitations")
        .delete()
        .eq("id", invitationId);

      if (error) throw error;

      // Remove from state
      setInvitations(invitations.filter(inv => inv.id !== invitationId));
    } catch (err: any) {
      setError(err.message || "Failed to revoke invitation.");
      console.error("Error revoking invitation:", err);
    }
  };

  const handleRoleChange = async (
    userId: string,
    newRole: "admin" | "employee"
  ) => {
    setLoading(true);
    try {
      const { error: updateTableError } = await supabase
        .from("users")
        .update({ role: newRole })
        .eq("id", userId);

      if (updateTableError) throw updateTableError;

      // Also update the user_metadata if the current user's role is being changed
      if (userId === currentUser.id) {
        const {
          data: { user: updatedAuthUser },
          error: updateAuthError,
        } = await supabase.auth.updateUser({
          data: { role: newRole },
        });

        if (updateAuthError) throw updateAuthError;
        setCurrentUser(updatedAuthUser); // Update the currentUser state
      }

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
    } catch (err: any) {
      setError(err.message || "Failed to update user role.");
      console.error("Error updating user role:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading users...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  if (!currentUser || currentUser.role !== "admin") {
    return null; // Should redirect to login in useEffect
  }

  return (
    <div className="p-6">
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">User Management</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Manage users and send invitations</p>
          </div>
          <Dialog
            open={isInviteDialogOpen}
            onOpenChange={setIsInviteDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <UserPlus size={16} className="mr-2" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Invite New User</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleInviteUser} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={inviteRole}
                    onValueChange={(value: "admin" | "employee") =>
                      setInviteRole(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                {inviteSuccess && (
                  <p className="text-green-500 text-sm">
                    Invitation sent successfully!
                  </p>
                )}
                <Button type="submit" disabled={loading}>
                  {loading ? "Sending..." : "Send Invitation"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(value: "admin" | "employee") =>
                        handleRoleChange(user.id, value)
                      }
                      disabled={user.id === currentUser.id} // Prevent changing own role
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pending Invitations Section */}
      {invitations.length > 0 && (
        <Card className="border-gray-200 shadow-sm mt-6">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
            <CardTitle className="text-xl font-bold text-gray-900">
              Pending Invitations ({invitations.length})
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Users who have been invited but haven't signed up yet
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Invited On</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell>{invitation.email}</TableCell>
                    <TableCell>
                      {new Date(invitation.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {invitation.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRevokeInvitation(invitation.id)}
                      >
                        Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
